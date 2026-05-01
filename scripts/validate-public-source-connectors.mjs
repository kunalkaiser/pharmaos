import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const registry = await readFile(path.join(root, "src/lib/connectors/source-registry.ts"), "utf8");
const index = await readFile(path.join(root, "src/lib/connectors/index.ts"), "utf8");

const requiredProviders = [
  "pubmed",
  "clinicaltrials",
  "openfda-label",
  "openfda-faers",
  "openfda-enforcement",
  "openfda-ndc",
  "openfda-drugsfda",
  "dailymed",
  "cdc-wonder",
  "cdc-socrata",
  "who-gho",
  "medlineplus",
  "rxnorm",
  "gdc",
  "gdelt",
  "google-scholar",
  "dbgap",
  "umls",
];

for (const provider of requiredProviders) {
  assert.ok(registry.includes(`providerId: "${provider}"`), `Source registry missing ${provider}.`);
}

for (const phrase of ["Patient portals/EHR systems are excluded", "No scraping-safe official public API", "Controlled data must not be accessed"]) {
  assert.ok(registry.includes(phrase), `Registry must include legal/safety note: ${phrase}`);
}

const implementedProviders = ["pubmed", "clinicaltrials", "openfda-label", "dailymed", "medlineplus", "rxnorm", "cdc-socrata", "who-gho", "gdc", "gdelt"];
for (const provider of implementedProviders) {
  assert.ok(index.includes(provider), `Connector index missing implemented provider ${provider}.`);
}

const connectorFiles = [
  "src/lib/connectors/types.ts",
  "src/lib/connectors/http.ts",
  "src/lib/connectors/pubmed.ts",
  "src/lib/connectors/clinicaltrials.ts",
  "src/lib/connectors/openfda.ts",
  "src/lib/connectors/dailymed.ts",
  "src/lib/connectors/medlineplus.ts",
  "src/lib/connectors/rxnorm.ts",
  "src/lib/connectors/rss.ts",
  "src/lib/connectors/cdc-socrata.ts",
  "src/lib/connectors/cdc-wonder.ts",
  "src/lib/connectors/who-gho.ts",
  "src/lib/connectors/gdc.ts",
  "src/lib/connectors/gdelt.ts",
  "src/lib/connectors/index.ts",
];

for (const file of connectorFiles) {
  const content = await readFile(path.join(root, file), "utf8");
  assert.equal(/NEXT_PUBLIC/.test(content), false, `${file} must not use NEXT_PUBLIC secrets.`);
  assert.equal(/createEvidenceRecord|evidenceRecords\.push|report_exports|EpiEngine|scoreEvidence/i.test(content), false, `${file} must not create final evidence records, reports, or scores.`);
  assert.equal(/mychart|epic|cerner|athenahealth|portal scraping/i.test(content), false, `${file} must not access private patient portals.`);
}

const candidateShapeCheck = {
  candidateId: "schema-validation:source-record",
  sourceProvider: "schema-validation",
  sourceDisplayName: "Schema Validation",
  sourceCategory: "public_dataset",
  sourceType: "public_dataset",
  sourceIdentifier: "SCHEMA_VALIDATION_RECORD",
  sourceTitle: "Connector schema validation record",
  sourceUrl: "https://example.com/evidara/connector-schema-validation",
  accessDate: "2026-05-01",
  retrievedAt: "2026-05-01T00:00:00.000Z",
  termsReviewRequired: false,
  confidence: "retrieved",
  candidateOnly: true,
  generatedClaim: false,
  promotionStatus: "not_promoted",
  limitationNotes: ["Schema validation only; not biomedical evidence."],
};

for (const field of ["candidateId", "sourceProvider", "sourceType", "sourceTitle", "sourceUrl", "accessDate", "retrievedAt", "confidence", "promotionStatus"]) {
  assert.ok(candidateShapeCheck[field], `EvidenceCandidate shape check missing ${field}.`);
}
assert.equal(candidateShapeCheck.candidateOnly, true);
assert.equal(candidateShapeCheck.generatedClaim, false);

const publicFiles = [
  ...(await globTextFiles(path.join(root, "src/app"))),
  ...(await globTextFiles(path.join(root, "src/components"))),
].filter((file) => !file.includes("/api/internal/"));

for (const file of publicFiles) {
  const content = await readFile(file, "utf8");
  assert.equal(/@\/lib\/connectors|lib\/connectors/.test(content), false, `${file} must not import live connector modules.`);
}

console.log("Public source connector validation passed using registry/static/schema checks. Live internet connector checks were not executed.");

async function globTextFiles(dir) {
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await globTextFiles(fullPath));
    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) files.push(fullPath);
  }
  return files;
}
