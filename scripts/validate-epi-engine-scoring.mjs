import { existsSync, readFileSync } from "node:fs";

const failures = [];
for (const file of [
  "db/migrations/0010_epi_engine_scoring_runs.sql",
  "src/lib/epi-engine/scoring.ts",
  "src/app/api/internal/epi-engine/score/route.ts",
]) {
  if (!existsSync(file)) failures.push(`Missing EpiEngine scoring file: ${file}`);
}

const migration = readFileSync("db/migrations/0010_epi_engine_scoring_runs.sql", "utf8");
if (!migration.includes("scoring_runs")) failures.push("Migration must create scoring_runs.");
if (!migration.includes("generated_claims BOOLEAN NOT NULL DEFAULT FALSE")) failures.push("Scoring runs must enforce generated_claims=false.");

const scoring = readFileSync("src/lib/epi-engine/scoring.ts", "utf8");
if (!scoring.includes("getReviewedEvidencePacketReport")) failures.push("Scoring must use reviewed report helper.");
if (!scoring.includes("EpiEngine scoring requires reviewed evidence records")) failures.push("Scoring must reject packets without reviewed evidence.");
if (!scoring.includes("generatedClaims: false")) failures.push("Scoring must disclose generatedClaims=false.");
if (!scoring.includes("No black-box recommendation")) failures.push("Scoring must avoid black-box recommendations.");
if (!scoring.includes("epi_engine.scored")) failures.push("Scoring must append audit event.");

const route = readFileSync("src/app/api/internal/epi-engine/score/route.ts", "utf8");
if (!route.includes("autonomousRecommendation: false")) failures.push("Scoring API must disclose no autonomous recommendation.");
if (!route.includes("evidencePacketId is required")) failures.push("Scoring API must require evidencePacketId.");

if (failures.length) {
  console.error("EpiEngine scoring validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("EpiEngine scoring validation passed: reviewed-evidence-only scoring, no generated claims, persistence, and audit event are present.");
