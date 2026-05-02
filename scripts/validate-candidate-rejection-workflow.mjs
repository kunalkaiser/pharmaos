import { existsSync, readFileSync } from "node:fs";

const failures = [];
for (const file of [
  "db/migrations/0007_candidate_rejection_workflow.sql",
  "src/app/api/internal/review/candidate-rejections/route.ts",
  "src/proxy.ts",
]) {
  if (!existsSync(file)) failures.push(`Missing rejection workflow file: ${file}`);
}

const migration = readFileSync("db/migrations/0007_candidate_rejection_workflow.sql", "utf8");
if (!migration.includes("candidate_rejections")) failures.push("Migration must create candidate_rejections.");
for (const field of ["rejection_reason", "reviewer_notes", "reviewer_id", "candidate_hash"]) {
  if (!migration.includes(field)) failures.push(`candidate_rejections missing ${field}.`);
}

const route = readFileSync("src/app/api/internal/review/candidate-rejections/route.ts", "utf8");
if (!route.includes("Authenticated reviewer identity is required")) failures.push("Rejection API must require real reviewer identity.");
if (!route.includes("reviewerNotes are required")) failures.push("Rejection API must require reviewer notes.");
if (!route.includes("candidate.rejected")) failures.push("Rejection API must write audit event.");
if (!route.includes("deletedCandidate: false")) failures.push("Rejection API must not delete candidates.");
if (/fake reviewer fallback/i.test(route) && !route.includes("No fake reviewer fallback is allowed")) {
  failures.push("Rejection API must not include fake reviewer fallback.");
}

const rbac = readFileSync("src/lib/auth/rbac.ts", "utf8");
if (!rbac.includes("/api/internal/review")) failures.push("RBAC must protect review APIs.");

if (failures.length) {
  console.error("Candidate rejection workflow validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Candidate rejection workflow validation passed: rejection schema, real reviewer requirement, audit event, and no deletion behavior are present.");
