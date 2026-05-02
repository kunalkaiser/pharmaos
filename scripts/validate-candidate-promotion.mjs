import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const migration = await read("db/migrations/0003_candidate_promotion_foundation.sql");
assert.ok(migration.includes("candidate_promotions"), "Candidate promotion migration must create candidate_promotions.");
assert.ok(migration.includes("candidate_only BOOLEAN NOT NULL DEFAULT TRUE CHECK (candidate_only IS TRUE)"), "Candidate promotions must enforce candidate_only=true.");
assert.ok(migration.includes("generated_claim BOOLEAN NOT NULL DEFAULT FALSE CHECK (generated_claim IS FALSE)"), "Candidate promotions must enforce generated_claim=false.");
assert.ok(migration.includes("reviewer_attestation BOOLEAN NOT NULL CHECK (reviewer_attestation IS TRUE)"), "Candidate promotions must require reviewer attestation.");

const foundation = await read("src/lib/evidence-foundation.ts");
assert.ok(foundation.includes("promoteEvidenceCandidate"), "Server helper must include promoteEvidenceCandidate.");
assert.ok(foundation.includes("ensureRealCandidate"), "Server helper must validate candidates before promotion.");
assert.ok(foundation.includes("Generated claims cannot be promoted"), "Generated claims must be rejected.");
assert.ok(foundation.includes("Schema checks, fixtures, seeded records, and example URLs cannot be promoted"), "Schema/example candidates must be rejected.");
assert.ok(foundation.includes("Human-supplied claim text is required"), "Evidence record promotion must require human-supplied claim text.");

const route = await read("src/app/api/internal/review/candidate-promotions/route.ts");
assert.ok(route.includes("reviewerAttestation=true is required"), "Promotion API must require reviewer attestation.");
assert.ok(route.includes("humanReviewStatus must be reviewed or approved"), "Promotion API must require reviewed/approved status.");
assert.ok(route.includes("generatedClaims: false"), "Promotion API must disclose generatedClaims=false.");
assert.equal(/runCombinedSearch|searchPubMed|searchClinicalTrials|searchOpenFda/.test(route), false, "Promotion API must not run live retrieval.");
assert.equal(/NEXT_PUBLIC/.test(route + foundation), false, "Promotion path must not use NEXT_PUBLIC secrets.");

const proxy = await read("src/proxy.ts");
assert.ok(proxy.includes('"/api/internal"'), "Promotion API must remain under protected /api/internal route family.");

console.log("Candidate promotion validation passed: internal review promotion requires real candidates, review attestation, and generatedClaim=false.");

async function read(file) {
  return readFile(path.join(root, file), "utf8");
}
