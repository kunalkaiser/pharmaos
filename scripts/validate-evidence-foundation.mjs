import assert from "node:assert/strict";

const store = {
  evidenceSources: [],
  citations: [],
  evidencePackets: [{ id: "packet-1" }],
  evidenceRecords: [],
};

function ensurePacketExists(evidencePacketId) {
  if (!store.evidencePackets.some((item) => item.id === evidencePacketId)) {
    throw new Error(`Evidence packet not found: ${evidencePacketId}`);
  }
}

function ensureCitationAndSourceExist(citationId) {
  const citation = store.citations.find((item) => item.id === citationId);
  if (!citation) throw new Error(`Citation not found: ${citationId}`);
  if (!store.evidenceSources.some((item) => item.id === citation.evidenceSourceId)) {
    throw new Error(`Evidence source not found: ${citation.evidenceSourceId}`);
  }
}

function createEvidenceRecord(input) {
  ensurePacketExists(input.evidencePacketId);
  ensureCitationAndSourceExist(input.citationId);
  store.evidenceRecords.push(input);
}

assert.throws(
  () => createEvidenceRecord({ evidencePacketId: "packet-1", citationId: "missing-citation" }),
  /Citation not found/,
  "Evidence records must not be creatable without a citation."
);

store.citations.push({ id: "citation-1", evidenceSourceId: "missing-source" });
assert.throws(
  () => createEvidenceRecord({ evidencePacketId: "packet-1", citationId: "citation-1" }),
  /Evidence source not found/,
  "Evidence records must not be creatable when the citation points to a missing source."
);

store.evidenceSources.push({ id: "source-1" });
store.citations[0].evidenceSourceId = "source-1";
createEvidenceRecord({ evidencePacketId: "packet-1", citationId: "citation-1" });
assert.equal(store.evidenceRecords.length, 1);

console.log("Evidence foundation validation passed: evidence records require citation and source provenance.");
