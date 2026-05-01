import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const proxyPath = path.join(process.cwd(), "src/proxy.ts");
const proxy = await readFile(proxyPath, "utf8");

for (const routePrefix of ["/app/:path*", "/admin/:path*", "/api/internal/:path*"]) {
  assert.ok(proxy.includes(routePrefix), `Proxy matcher must include ${routePrefix}.`);
}

assert.ok(proxy.includes("export function proxy"), "Route boundary must use the Next.js proxy file convention.");
assert.ok(proxy.includes("EVIDARA_INTERNAL_ACCESS_TOKEN"), "Proxy must require a server-side internal access token.");
assert.ok(proxy.includes("authRbacImplemented: false"), "API boundary response must not imply auth/RBAC is implemented.");
assert.ok(proxy.includes("liveRetrieval: false"), "API boundary response must not imply live retrieval is implemented.");
assert.equal(/NEXT_PUBLIC/.test(proxy), false, "Private access token must not use NEXT_PUBLIC.");
assert.equal(/userId|fakeUser|demoUser|role\s*:\s*["']admin/i.test(proxy), false, "Proxy must not invent fake users or roles.");

console.log("Internal access boundary validation passed: /app, /admin, and /api/internal are token-guarded without fake auth.");
