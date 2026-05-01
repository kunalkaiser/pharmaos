import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const storageDirectory = process.env.EVIDARA_STORAGE_DIR ?? path.join(process.cwd(), ".evidara-data");
const storageFile = path.join(storageDirectory, "evidence-foundation.json");

const store = JSON.parse(await readFile(storageFile, "utf8"));
const packet = store.evidencePackets.find((item) => item.status === "seeded");

assert.ok(packet, "Expected one seeded/manual evidence packet. Run npm run seed:evidence-foundation first.");
assert.equal(packet.diseaseOrIndication, "Obstructive sleep apnea");

const records = store.evidenceRecords.filter((record) => record.evidencePacketId === packet.id);
assert.ok(records.length > 0, "Expected at least one seeded evidence record.");

for (const record of records) {
  const citation = store.citations.find((item) => item.id === record.citationId);
  assert.ok(citation, `Evidence record is missing citation metadata: ${record.id}`);

  const source = store.evidenceSources.find((item) => item.id === citation.evidenceSourceId);
  assert.ok(source, `Citation is missing source metadata: ${citation.id}`);

  assert.ok(source.title, "Source title is required.");
  assert.ok(source.url, "Source URL is required.");
  assert.ok(citation.sourceIdentifier, "Citation source identifier is required.");
  assert.ok(citation.accessDate, "Citation access date is required.");
  assert.ok(citation.extractionConfidence, "Extraction confidence is required.");
  assert.ok(citation.humanReviewStatus, "Human review status is required.");
}

const missingPacket = store.evidencePackets.find((item) => item.id === "missing-packet-id");
assert.equal(missingPacket, undefined, "Invalid packet IDs should not resolve to a seeded packet.");

const routeFiles = [
  "src/app/api/internal/evidence-packets/route.ts",
  "src/app/api/internal/evidence-packets/[id]/route.ts",
  "src/app/api/internal/evidence-packets/[id]/citations/route.ts",
  "src/lib/evidence-foundation.ts",
];

for (const file of routeFiles) {
  const content = await readFile(path.join(process.cwd(), file), "utf8");
  assert.equal(/fetch\s*\(/.test(content), false, `${file} must not call fetch/live retrieval.`);
  assert.equal(/https?:\/\/|eutils\.ncbi|clinicaltrials\.gov|api\.fda\.gov|accessdata\.fda/i.test(content), false, `${file} must not call external source APIs.`);
}

console.log("Seeded packet API validation passed: seeded packet provenance is complete and no live retrieval calls were found.");
