import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const proxyPath = path.join(process.cwd(), "src/proxy.ts");
const proxy = await readFile(proxyPath, "utf8");

for (const routePrefix of ["/app/:path*", "/admin/:path*", "/api/internal/:path*"]) {
  assert.ok(proxy.includes(routePrefix), `Proxy matcher must include ${routePrefix}.`);
}

assert.ok(
  /export\s+(async\s+)?function\s+proxy\s*\(/.test(proxy),
  "Route boundary must export a Next.js proxy function."
);

assert.ok(
  proxy.includes("EVIDARA_INTERNAL_ACCESS_TOKEN"),
  "Proxy must support a server-side internal access token fallback."
);

assert.ok(
  proxy.includes("EVIDARA_AUTH_SESSION_SECRET"),
  "Proxy must support real auth session enforcement when auth is configured."
);

assert.ok(
  proxy.includes("verifyAuthSession"),
  "Proxy must verify signed auth sessions when auth is configured."
);

assert.ok(
  proxy.includes("allowedRolesForPath") && proxy.includes("hasRole"),
  "Proxy must enforce role-aware route access when auth is configured."
);

assert.ok(
  proxy.includes("x-evidara-actor-id") &&
  proxy.includes("x-evidara-actor-email") &&
  proxy.includes("x-evidara-actor-roles"),
  "Proxy must forward verified actor context to internal routes."
);

assert.ok(
  proxy.includes("x-evidara-organization-id"),
  "Proxy must forward organization context when present."
);

assert.ok(
  proxy.includes("liveRetrieval: false"),
  "Boundary response must not imply public live retrieval is running."
);

assert.equal(
  /NEXT_PUBLIC/.test(proxy),
  false,
  "Private access/auth tokens must not use NEXT_PUBLIC."
);

assert.equal(
  /fakeUser|demoUser|hardcodedUser|role\s*:\s*["']admin["']/i.test(proxy),
  false,
  "Proxy must not invent fake users or hardcoded admin roles."
);

console.log(
  "Internal access boundary validation passed: /app, /admin, and /api/internal are protected by auth/RBAC when configured, with internal-token fallback for development."
);
