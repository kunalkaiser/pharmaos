import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const migration = await read("db/migrations/0002_query_audit_foundation.sql");
for (const table of ["query_runs", "query_run_steps", "query_source_events", "query_candidate_events", "query_errors", "query_audit_snapshots"]) {
  assert.ok(migration.includes(table), `Query audit migration missing ${table}.`);
}
assert.ok(migration.includes("generated_claims BOOLEAN NOT NULL DEFAULT FALSE"), "Query runs must default generated_claims=false.");
assert.ok(migration.includes("candidate_only BOOLEAN NOT NULL DEFAULT TRUE"), "Query runs must default candidate_only=true.");

const helper = await read("src/lib/query-audit.ts");
for (const fn of ["startQueryRun", "recordQueryRunStep", "recordSourceEvent", "recordCandidateEvents", "recordQueryError", "completeQueryRun", "getQueryRunAuditTrail"]) {
  assert.ok(helper.includes(`function ${fn}`) || helper.includes(`function ${fn}`) || helper.includes(`async function ${fn}`), `Query audit helper missing ${fn}.`);
}
assert.ok(helper.includes('import "server-only"'), "Query audit helpers must be server-only.");
assert.equal(/NEXT_PUBLIC/.test(helper), false, "Query audit helpers must not use NEXT_PUBLIC secrets.");
assert.equal(/fakeUser|demoUser|role\s*:\s*["']admin/i.test(helper), false, "Query audit helpers must not create fake users.");
assert.ok(helper.includes("[redacted]"), "Query audit helpers must redact secrets.");

for (const route of [
  "src/app/api/internal/audit/query-runs/route.ts",
  "src/app/api/internal/audit/query-runs/[id]/route.ts",
  "src/app/api/internal/audit/query-runs/[id]/events/route.ts",
]) {
  await read(route);
}

const proxy = await read("src/proxy.ts");
assert.ok(proxy.includes('"/api/internal"'), "Query audit APIs must be under protected /api/internal route family.");

console.log("Query audit validation passed: schema, server-only helpers, protected APIs, and redaction checks are present.");

async function read(file) {
  return readFile(path.join(root, file), "utf8");
}
