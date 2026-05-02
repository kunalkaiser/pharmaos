import { existsSync, readFileSync } from "node:fs";

const failures = [];
const migrationPath = "db/migrations/0005_tenant_organization_scoping.sql";
if (!existsSync(migrationPath)) failures.push("Missing tenant scoping migration.");

const migration = existsSync(migrationPath) ? readFileSync(migrationPath, "utf8") : "";
for (const table of ["organizations", "user_organizations"]) {
  if (!migration.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) failures.push(`Missing table: ${table}`);
}

for (const table of [
  "evidence_sources",
  "citations",
  "evidence_packets",
  "retrieval_runs",
  "evidence_records",
  "audit_logs",
  "query_runs",
  "query_source_events",
  "query_candidate_events",
  "query_errors",
  "query_audit_snapshots",
  "candidate_promotions",
]) {
  if (!migration.includes(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS organization_id`)) {
    failures.push(`Missing organization_id column for ${table}`);
  }
}

const session = readFileSync("src/lib/auth/session.ts", "utf8");
if (!session.includes("organizationId")) failures.push("Auth session payload lacks organizationId.");

const proxy = readFileSync("src/proxy.ts", "utf8");
if (!proxy.includes("x-evidara-organization-id")) failures.push("Proxy does not forward organization context headers.");

const createUser = readFileSync("scripts/create-auth-user.mjs", "utf8");
if (!createUser.includes("EVIDARA_ORGANIZATION_NAME") || !createUser.includes("user_organizations")) {
  failures.push("Create-user script does not require explicit organization membership.");
}
if (/fake tenant|demo tenant|seed organization/i.test(createUser)) failures.push("Tenant setup must not create fake/demo organizations.");

if (failures.length) {
  console.error("Tenant scoping validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Tenant scoping validation passed: organization schema, memberships, session context, and no fake tenants are present.");
console.log("Full tenant filtering in every endpoint is still a beta blocker until implemented and runtime-tested with DATABASE_URL.");
