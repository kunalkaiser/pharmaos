import { existsSync, readFileSync } from "node:fs";

const failures = [];
for (const file of [
  "db/migrations/0008_audit_immutability_foundation.sql",
  "src/lib/audit-integrity.ts",
  "src/lib/evidence-foundation.ts",
  "src/app/api/internal/review/candidate-rejections/route.ts",
]) {
  if (!existsSync(file)) failures.push(`Missing audit immutability file: ${file}`);
}

const migration = readFileSync("db/migrations/0008_audit_immutability_foundation.sql", "utf8");
if (!migration.includes("previous_event_hash") || !migration.includes("event_hash")) failures.push("Audit migration must add event hash columns.");
if (!migration.includes("BEFORE UPDATE ON audit_logs")) failures.push("Audit migration must block audit_log updates.");
if (!migration.includes("BEFORE DELETE ON audit_logs")) failures.push("Audit migration must block audit_log deletes.");

const helper = readFileSync("src/lib/audit-integrity.ts", "utf8");
if (!helper.includes("appendImmutableAuditLog")) failures.push("Missing appendImmutableAuditLog helper.");
if (!helper.includes("sha256")) failures.push("Audit helper must hash events.");
if (!helper.includes("previousEventHash")) failures.push("Audit helper must chain to previous event hash.");
if (/NEXT_PUBLIC/i.test(helper)) failures.push("Audit helper must not use NEXT_PUBLIC secrets.");

const foundation = readFileSync("src/lib/evidence-foundation.ts", "utf8");
if (!foundation.includes("appendImmutableAuditLog")) failures.push("Evidence foundation should append immutable audit logs.");

const rejection = readFileSync("src/app/api/internal/review/candidate-rejections/route.ts", "utf8");
if (!rejection.includes("appendImmutableAuditLog")) failures.push("Candidate rejection should append immutable audit log.");

if (failures.length) {
  console.error("Audit immutability validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Audit immutability validation passed: append-only audit trigger, event hashes, and hash-chain helper are present.");
console.log("This is an immutability foundation, not a full external compliance attestation.");
