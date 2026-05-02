import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "db/migrations/0004_auth_rbac_foundation.sql",
  "src/lib/auth/session.ts",
  "src/lib/auth/rbac.ts",
  "src/lib/auth/password.ts",
  "src/lib/auth/users.ts",
  "src/app/api/auth/login/route.ts",
  "src/app/api/auth/logout/route.ts",
  "src/app/api/auth/me/route.ts",
  "src/proxy.ts",
  "scripts/create-auth-user.mjs",
];

const failures = [];
for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing auth/RBAC file: ${file}`);
}

const migration = readFileSync("db/migrations/0004_auth_rbac_foundation.sql", "utf8");
for (const table of ["users", "roles", "user_roles"]) {
  if (!migration.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) failures.push(`Auth migration missing ${table}.`);
}
for (const role of ["admin", "reviewer", "analyst", "read_only", "system"]) {
  if (!migration.includes(`'${role}'`)) failures.push(`Auth migration missing role: ${role}`);
}

const proxy = readFileSync("src/proxy.ts", "utf8");
if (!proxy.includes("verifyAuthSession")) failures.push("Proxy does not verify auth session cookies.");
if (!proxy.includes("allowedRolesForPath")) failures.push("Proxy does not enforce path-level RBAC.");
if (!proxy.includes("EVIDARA_INTERNAL_ACCESS_TOKEN")) failures.push("Proxy should retain temporary token fallback until auth rollout is complete.");

const loginRoute = readFileSync("src/app/api/auth/login/route.ts", "utf8");
if (!loginRoute.includes("verifyPassword")) failures.push("Login route must verify stored password hashes.");
if (!loginRoute.includes("DATABASE_URL")) failures.push("Login route must require production persistence.");
if (!loginRoute.includes("EVIDARA_AUTH_SESSION_SECRET")) failures.push("Login route must require session signing secret.");

const combined = requiredFiles.map((file) => readFileSync(file, "utf8")).join("\n");
if (/NEXT_PUBLIC/i.test(combined)) failures.push("Auth/RBAC files must not use NEXT_PUBLIC secrets.");
if (/fake user|seed user|demo user/i.test(combined)) failures.push("Auth/RBAC files must not create fake/demo users.");

if (failures.length) {
  console.error("Auth/RBAC validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Auth/RBAC validation passed: real user tables, password-backed login, signed sessions, and role checks are present without fake users.");
if (!process.env.DATABASE_URL || !process.env.EVIDARA_AUTH_SESSION_SECRET) {
  console.log("Live login was not executed. Set DATABASE_URL and EVIDARA_AUTH_SESSION_SECRET, apply migration 0004, and create a real user to runtime-test auth.");
}
