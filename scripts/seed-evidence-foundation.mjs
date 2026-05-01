import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const storageDirectory = process.env.EVIDARA_STORAGE_DIR ?? path.join(process.cwd(), ".evidara-data");
const storageFile = path.join(storageDirectory, "evidence-foundation.json");

function now() {
  return new Date().toISOString();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function emptyStore() {
  return {
    evidenceSources: [],
    citations: [],
    evidencePackets: [],
    retrievalRuns: [],
    evidenceRecords: [],
    auditLogs: [],
  };
}

async function readStore() {
  try {
    return { ...emptyStore(), ...JSON.parse(await readFile(storageFile, "utf8")) };
  } catch (error) {
    if (error?.code === "ENOENT") return emptyStore();
    throw error;
  }
}

async function writeStore(store) {
  await mkdir(storageDirectory, { recursive: true });
  await writeFile(storageFile, `${JSON.stringify(store, null, 2)}\n`);
}

function addAudit(store, eventType, entityType, entityId, metadata = {}) {
  store.auditLogs.push({
    id: randomUUID(),
    actorType: "system",
    eventType,
    entityType,
    entityId,
    metadata,
    createdAt: now(),
  });
}

const store = await readStore();
const timestamp = now();

let source = store.evidenceSources.find((item) => item.pmid === "27568340");
if (!source) {
  source = {
    id: randomUUID(),
    sourceType: "pubmed",
    title: "Prevalence of obstructive sleep apnea in the general population: A systematic review",
    url: "https://pubmed.ncbi.nlm.nih.gov/27568340/",
    pmid: "27568340",
    doi: "10.1016/j.smrv.2016.07.002",
    publisher: "Sleep Medicine Reviews",
    publicationDate: "2017-08-01",
    accessDate: today(),
    metadata: {
      seedScope: "manual disease burden citation",
      liveRetrieval: false,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  store.evidenceSources.push(source);
  addAudit(store, "evidence_source.seeded", "evidence_source", source.id, { pmid: source.pmid });
}

let citation = store.citations.find((item) => item.sourceIdentifier === "PMID:27568340");
if (!citation) {
  citation = {
    id: randomUUID(),
    evidenceSourceId: source.id,
    citationText:
      "Senaratna CV, et al. Prevalence of obstructive sleep apnea in the general population: A systematic review. Sleep Med Rev. 2017;34:70-81. PMID: 27568340.",
    sourceIdentifier: "PMID:27568340",
    accessDate: today(),
    extractedField: "adult OSA prevalence range by AHI threshold",
    extractionConfidence: "manual_reviewed",
    humanReviewStatus: "needs_review",
    limitationNotes: "Systematic review reports broad prevalence ranges across heterogeneous study methods and populations.",
    createdAt: timestamp,
  };
  store.citations.push(citation);
  addAudit(store, "citation.seeded", "citation", citation.id, { sourceIdentifier: citation.sourceIdentifier });
}

let packet = store.evidencePackets.find((item) => item.title === "Seeded OSA Disease Burden Evidence Packet");
if (!packet) {
  packet = {
    id: randomUUID(),
    title: "Seeded OSA Disease Burden Evidence Packet",
    diseaseOrIndication: "Obstructive sleep apnea",
    geography: "United States",
    intendedUse: "internal_schema_validation",
    status: "seeded",
    createdBy: "internal_seed_script",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  store.evidencePackets.push(packet);
  addAudit(store, "evidence_packet.seeded", "evidence_packet", packet.id);
}

const existingRecord = store.evidenceRecords.find(
  (item) => item.evidencePacketId === packet.id && item.citationId === citation.id && item.recordType === "prevalence"
);

if (!existingRecord) {
  const record = {
    id: randomUUID(),
    evidencePacketId: packet.id,
    citationId: citation.id,
    recordType: "prevalence",
    claimText:
      "A systematic review reported adult OSA prevalence ranges that vary substantially by AHI threshold and study population.",
    extractedField: "prevalence range",
    valueText: "9% to 38% at AHI >=5; 6% to 17% at AHI >=15",
    unit: "percent of adult population in included studies",
    geography: "United States",
    confidenceLabel: "manual_reviewed",
    limitationNotes:
      "This seeded record is for internal schema validation only and should not be treated as live retrieval or a finished evidence packet.",
    createdAt: timestamp,
  };
  store.evidenceRecords.push(record);
  addAudit(store, "evidence_record.seeded", "evidence_record", record.id, { citationId: citation.id });
}

let retrievalRun = store.retrievalRuns.find((item) => item.evidencePacketId === packet.id && item.query === "manual seed only");
if (!retrievalRun) {
  retrievalRun = {
    id: randomUUID(),
    evidencePacketId: packet.id,
    query: "manual seed only",
    sourceTypes: ["pubmed"],
    status: "not_started",
    createdAt: timestamp,
  };
  store.retrievalRuns.push(retrievalRun);
  addAudit(store, "retrieval_run.seeded_without_live_retrieval", "retrieval_run", retrievalRun.id);
}

await writeStore(store);

console.log(`Seeded citation/provenance foundation at ${storageFile}`);
