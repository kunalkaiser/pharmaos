import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const storageDirectory = process.env.EVIDARA_STORAGE_DIR ?? path.join(process.cwd(), ".evidara-data");
const storageFile = path.join(storageDirectory, "evidence-foundation.json");

export const sourceTypes = [
  "pubmed",
  "pubmed_central",
  "clinicaltrials_gov",
  "fda_label",
  "fda_drugs",
  "openfda",
  "cdc",
  "nih",
  "cms",
  "manual_source",
] as const;

export const evidenceRecordTypes = [
  "disease_overview",
  "incidence",
  "prevalence",
  "patient_population",
  "clinical_trial_landscape",
  "treatment_landscape",
  "unmet_need",
  "limitation",
] as const;

export const confidenceLabels = ["manual_reviewed", "high", "medium", "low", "unknown"] as const;
export const humanReviewStatuses = ["needs_review", "reviewed", "approved", "rejected"] as const;

export type SourceType = (typeof sourceTypes)[number];
export type EvidenceRecordType = (typeof evidenceRecordTypes)[number];
export type ConfidenceLabel = (typeof confidenceLabels)[number];
export type HumanReviewStatus = (typeof humanReviewStatuses)[number];

export type EvidenceSource = {
  id: string;
  sourceType: SourceType;
  title: string;
  url: string;
  pmid?: string;
  pmcid?: string;
  doi?: string;
  nctId?: string;
  fdaIdentifier?: string;
  publisher?: string;
  publicationDate?: string;
  accessDate: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type Citation = {
  id: string;
  evidenceSourceId: string;
  citationText: string;
  sourceIdentifier: string;
  accessDate: string;
  extractedField?: string;
  extractionConfidence: ConfidenceLabel;
  humanReviewStatus: HumanReviewStatus;
  limitationNotes?: string;
  createdAt: string;
};

export type EvidencePacket = {
  id: string;
  title: string;
  diseaseOrIndication: string;
  geography: string;
  intendedUse: string;
  status: "draft" | "seeded" | "retrieval_pending" | "retrieval_complete" | "review_ready" | "approved" | "archived";
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
};

export type RetrievalRun = {
  id: string;
  evidencePacketId: string;
  query: string;
  sourceTypes: SourceType[];
  status: "not_started" | "queued" | "running" | "completed" | "failed" | "cancelled";
  startedAt?: string;
  completedAt?: string;
  errorMessage?: string;
  createdAt: string;
};

export type EvidenceRecord = {
  id: string;
  evidencePacketId: string;
  citationId: string;
  recordType: EvidenceRecordType;
  claimText: string;
  extractedField?: string;
  valueText?: string;
  unit?: string;
  geography: string;
  confidenceLabel: ConfidenceLabel;
  limitationNotes?: string;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  actorId?: string;
  actorType: "system" | "user" | "admin";
  eventType: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type EvidenceFoundationStore = {
  evidenceSources: EvidenceSource[];
  citations: Citation[];
  evidencePackets: EvidencePacket[];
  retrievalRuns: RetrievalRun[];
  evidenceRecords: EvidenceRecord[];
  auditLogs: AuditLog[];
};

export type EvidenceRecordWithProvenance = {
  evidenceRecordId: string;
  claimText: string;
  evidenceType: EvidenceRecordType;
  extractedField?: string;
  valueText?: string;
  unit?: string;
  geography: string;
  confidenceLabel: ConfidenceLabel;
  citationId: string;
  sourceId: string;
  sourceType: SourceType;
  sourceTitle: string;
  sourceUrl: string;
  sourceIdentifier: string;
  pmid?: string;
  pmcid?: string;
  doi?: string;
  nctId?: string;
  fdaIdentifier?: string;
  publisher?: string;
  publicationDate?: string;
  accessDate: string;
  extractionConfidence: ConfidenceLabel;
  humanReviewStatus: HumanReviewStatus;
  limitationNotes?: string;
};

export type SeededEvidencePacketSection = {
  id: string;
  title: string;
  status: "seeded_manual_evidence" | "not_seeded";
  records: EvidenceRecordWithProvenance[];
  note?: string;
};

export type SeededEvidencePacketResponse = {
  packetId: string;
  title: string;
  diseaseOrIndication: string;
  geography: string;
  intendedUse: string;
  status: EvidencePacket["status"];
  dataScope: "internal_manual_seed";
  liveRetrieval: false;
  authRequiredBeforeProduction: true;
  createdAt: string;
  updatedAt: string;
  sections: SeededEvidencePacketSection[];
  citationAppendix: EvidenceRecordWithProvenance[];
  provenance: {
    sourceCount: number;
    citationCount: number;
    evidenceRecordCount: number;
    retrievalRunStatus: "manual_seed_only_no_live_retrieval";
    limitations: string[];
  };
};

export type CreateEvidenceSourceInput = Omit<EvidenceSource, "id" | "createdAt" | "updatedAt" | "accessDate"> & {
  accessDate?: string;
};

export type CreateCitationInput = Omit<Citation, "id" | "createdAt" | "extractionConfidence" | "humanReviewStatus" | "accessDate"> & {
  accessDate?: string;
  extractionConfidence?: ConfidenceLabel;
  humanReviewStatus?: HumanReviewStatus;
};

export type CreateEvidencePacketInput = Omit<EvidencePacket, "id" | "status" | "createdAt" | "updatedAt" | "geography" | "intendedUse"> & {
  geography?: string;
  intendedUse?: string;
  status?: EvidencePacket["status"];
};

export type CreateEvidenceRecordInput = Omit<EvidenceRecord, "id" | "createdAt" | "geography" | "confidenceLabel"> & {
  geography?: string;
  confidenceLabel?: ConfidenceLabel;
};

export type CreateRetrievalRunInput = Omit<RetrievalRun, "id" | "createdAt" | "status" | "sourceTypes"> & {
  sourceTypes?: SourceType[];
  status?: RetrievalRun["status"];
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function now() {
  return new Date().toISOString();
}

function initialStore(): EvidenceFoundationStore {
  return {
    evidenceSources: [],
    citations: [],
    evidencePackets: [],
    retrievalRuns: [],
    evidenceRecords: [],
    auditLogs: [],
  };
}

async function readStore(): Promise<EvidenceFoundationStore> {
  try {
    const content = await readFile(storageFile, "utf8");
    return { ...initialStore(), ...JSON.parse(content) as EvidenceFoundationStore };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return initialStore();
    throw error;
  }
}

async function writeStore(store: EvidenceFoundationStore) {
  await mkdir(storageDirectory, { recursive: true });
  await writeFile(storageFile, `${JSON.stringify(store, null, 2)}\n`);
}

function ensureSourceIdentifier(input: CreateEvidenceSourceInput) {
  if (!input.url && !input.pmid && !input.pmcid && !input.doi && !input.nctId && !input.fdaIdentifier) {
    throw new Error("Evidence source requires a URL or source identifier.");
  }
}

function ensurePacketExists(store: EvidenceFoundationStore, evidencePacketId: string) {
  const packet = store.evidencePackets.find((item) => item.id === evidencePacketId);
  if (!packet) throw new Error(`Evidence packet not found: ${evidencePacketId}`);
  return packet;
}

function ensureSourceExists(store: EvidenceFoundationStore, evidenceSourceId: string) {
  const source = store.evidenceSources.find((item) => item.id === evidenceSourceId);
  if (!source) throw new Error(`Evidence source not found: ${evidenceSourceId}`);
  return source;
}

function ensureCitationExists(store: EvidenceFoundationStore, citationId: string) {
  const citation = store.citations.find((item) => item.id === citationId);
  if (!citation) throw new Error(`Citation not found: ${citationId}`);
  ensureSourceExists(store, citation.evidenceSourceId);
  return citation;
}

function appendAudit(store: EvidenceFoundationStore, event: Omit<AuditLog, "id" | "createdAt" | "actorType"> & { actorType?: AuditLog["actorType"] }) {
  store.auditLogs.push({
    id: randomUUID(),
    actorType: event.actorType ?? "system",
    createdAt: now(),
    ...event,
  });
}

export async function createEvidenceSource(input: CreateEvidenceSourceInput): Promise<EvidenceSource> {
  ensureSourceIdentifier(input);
  const store = await readStore();
  const timestamp = now();
  const source: EvidenceSource = {
    id: randomUUID(),
    accessDate: input.accessDate ?? today(),
    createdAt: timestamp,
    updatedAt: timestamp,
    ...input,
  };
  store.evidenceSources.push(source);
  appendAudit(store, { eventType: "evidence_source.created", entityType: "evidence_source", entityId: source.id });
  await writeStore(store);
  return source;
}

export async function createCitation(input: CreateCitationInput): Promise<Citation> {
  const store = await readStore();
  ensureSourceExists(store, input.evidenceSourceId);
  const citation: Citation = {
    id: randomUUID(),
    accessDate: input.accessDate ?? today(),
    extractionConfidence: input.extractionConfidence ?? "manual_reviewed",
    humanReviewStatus: input.humanReviewStatus ?? "needs_review",
    createdAt: now(),
    ...input,
  };
  store.citations.push(citation);
  appendAudit(store, { eventType: "citation.created", entityType: "citation", entityId: citation.id });
  await writeStore(store);
  return citation;
}

export async function createEvidencePacket(input: CreateEvidencePacketInput): Promise<EvidencePacket> {
  const store = await readStore();
  const timestamp = now();
  const packet: EvidencePacket = {
    id: randomUUID(),
    geography: input.geography ?? "United States",
    intendedUse: input.intendedUse ?? "internal_review",
    status: input.status ?? "draft",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...input,
  };
  store.evidencePackets.push(packet);
  appendAudit(store, { eventType: "evidence_packet.created", entityType: "evidence_packet", entityId: packet.id });
  await writeStore(store);
  return packet;
}

export async function createRetrievalRun(input: CreateRetrievalRunInput): Promise<RetrievalRun> {
  const store = await readStore();
  ensurePacketExists(store, input.evidencePacketId);
  const retrievalRun: RetrievalRun = {
    id: randomUUID(),
    sourceTypes: input.sourceTypes ?? [],
    status: input.status ?? "not_started",
    createdAt: now(),
    ...input,
  };
  store.retrievalRuns.push(retrievalRun);
  appendAudit(store, { eventType: "retrieval_run.created", entityType: "retrieval_run", entityId: retrievalRun.id });
  await writeStore(store);
  return retrievalRun;
}

export async function createEvidenceRecord(input: CreateEvidenceRecordInput): Promise<EvidenceRecord> {
  const store = await readStore();
  ensurePacketExists(store, input.evidencePacketId);
  ensureCitationExists(store, input.citationId);

  const record: EvidenceRecord = {
    id: randomUUID(),
    geography: input.geography ?? "United States",
    confidenceLabel: input.confidenceLabel ?? "manual_reviewed",
    createdAt: now(),
    ...input,
  };

  store.evidenceRecords.push(record);
  appendAudit(store, { eventType: "evidence_record.created", entityType: "evidence_record", entityId: record.id });
  await writeStore(store);
  return record;
}

export async function listEvidenceFoundationRecords() {
  return readStore();
}

const sectionDefinitions: Array<{ id: string; title: string; recordTypes: EvidenceRecordType[]; emptyNote: string }> = [
  {
    id: "disease-overview",
    title: "Disease overview",
    recordTypes: ["disease_overview"],
    emptyNote: "No manually reviewed disease overview record has been seeded yet.",
  },
  {
    id: "disease-burden-summary",
    title: "Disease burden summary",
    recordTypes: ["incidence", "prevalence"],
    emptyNote: "No manually reviewed burden summary beyond seeded epidemiology records is available yet.",
  },
  {
    id: "epidemiology-evidence",
    title: "Epidemiology evidence",
    recordTypes: ["incidence", "prevalence"],
    emptyNote: "No manually reviewed epidemiology record has been seeded yet.",
  },
  {
    id: "patient-population-notes",
    title: "Patient population notes",
    recordTypes: ["patient_population"],
    emptyNote: "No manually reviewed patient population record has been seeded yet.",
  },
  {
    id: "clinical-relevance",
    title: "Clinical relevance",
    recordTypes: ["clinical_trial_landscape", "treatment_landscape", "unmet_need"],
    emptyNote: "No manually reviewed clinical relevance record has been seeded yet.",
  },
  {
    id: "limitations",
    title: "Limitations",
    recordTypes: ["limitation"],
    emptyNote: "Limitations are carried on each seeded evidence record until a dedicated limitations record is added.",
  },
];

function composeRecordWithProvenance(store: EvidenceFoundationStore, record: EvidenceRecord): EvidenceRecordWithProvenance {
  const citation = store.citations.find((item) => item.id === record.citationId);
  if (!citation) throw new Error(`Evidence record is missing citation provenance: ${record.id}`);

  const source = store.evidenceSources.find((item) => item.id === citation.evidenceSourceId);
  if (!source) throw new Error(`Citation is missing source provenance: ${citation.id}`);

  return {
    evidenceRecordId: record.id,
    claimText: record.claimText,
    evidenceType: record.recordType,
    extractedField: record.extractedField ?? citation.extractedField,
    valueText: record.valueText,
    unit: record.unit,
    geography: record.geography,
    confidenceLabel: record.confidenceLabel,
    citationId: citation.id,
    sourceId: source.id,
    sourceType: source.sourceType,
    sourceTitle: source.title,
    sourceUrl: source.url,
    sourceIdentifier: citation.sourceIdentifier,
    pmid: source.pmid,
    pmcid: source.pmcid,
    doi: source.doi,
    nctId: source.nctId,
    fdaIdentifier: source.fdaIdentifier,
    publisher: source.publisher,
    publicationDate: source.publicationDate,
    accessDate: citation.accessDate,
    extractionConfidence: citation.extractionConfidence,
    humanReviewStatus: citation.humanReviewStatus,
    limitationNotes: record.limitationNotes ?? citation.limitationNotes,
  };
}

function composeSeededPacket(store: EvidenceFoundationStore, packet: EvidencePacket): SeededEvidencePacketResponse {
  if (packet.status !== "seeded") throw new Error(`Evidence packet is not a seeded/manual packet: ${packet.id}`);

  const records = store.evidenceRecords
    .filter((record) => record.evidencePacketId === packet.id)
    .map((record) => composeRecordWithProvenance(store, record));

  const citationIds = new Set(records.map((record) => record.citationId));
  const sourceIds = new Set(records.map((record) => record.sourceId));

  return {
    packetId: packet.id,
    title: packet.title,
    diseaseOrIndication: packet.diseaseOrIndication,
    geography: packet.geography,
    intendedUse: packet.intendedUse,
    status: packet.status,
    dataScope: "internal_manual_seed",
    liveRetrieval: false,
    authRequiredBeforeProduction: true,
    createdAt: packet.createdAt,
    updatedAt: packet.updatedAt,
    sections: sectionDefinitions.map((section) => {
      const sectionRecords = records.filter((record) => section.recordTypes.includes(record.evidenceType));
      return {
        id: section.id,
        title: section.title,
        status: sectionRecords.length > 0 ? "seeded_manual_evidence" : "not_seeded",
        records: sectionRecords,
        note: sectionRecords.length > 0 ? "Manual seeded evidence only. This is not live retrieval." : section.emptyNote,
      };
    }),
    citationAppendix: records,
    provenance: {
      sourceCount: sourceIds.size,
      citationCount: citationIds.size,
      evidenceRecordCount: records.length,
      retrievalRunStatus: "manual_seed_only_no_live_retrieval",
      limitations: [
        "Internal seeded packet for development only.",
        "No live retrieval has been performed.",
        "No EpiEngine scoring has been performed.",
        "No report export has been generated.",
        "Auth/RBAC is not implemented; protect internal endpoints before production.",
      ],
    },
  };
}

export async function listSeededEvidencePackets(): Promise<SeededEvidencePacketResponse[]> {
  const store = await readStore();
  return store.evidencePackets
    .filter((packet) => packet.status === "seeded")
    .map((packet) => composeSeededPacket(store, packet));
}

export async function getSeededEvidencePacket(packetId: string): Promise<SeededEvidencePacketResponse | null> {
  const store = await readStore();
  const packet = store.evidencePackets.find((item) => item.id === packetId && item.status === "seeded");
  return packet ? composeSeededPacket(store, packet) : null;
}

export async function getSeededEvidencePacketCitations(packetId: string): Promise<EvidenceRecordWithProvenance[] | null> {
  const packet = await getSeededEvidencePacket(packetId);
  return packet ? packet.citationAppendix : null;
}
