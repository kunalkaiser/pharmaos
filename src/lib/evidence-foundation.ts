import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import type { EvidenceCandidate } from "@/lib/connectors/types";

const storageDirectory = process.env.EVIDARA_STORAGE_DIR ?? path.join(process.cwd(), ".evidara-data");
const storageFile = path.join(storageDirectory, "evidence-foundation.json");

export const sourceTypes = [
  "pubmed",
  "pubmed_central",
  "clinicaltrials_gov",
  "fda_label",
  "fda_drugs",
  "openfda",
  "dailymed",
  "rxnorm",
  "cdc",
  "nih",
  "who",
  "nci",
  "news_rss",
  "public_dataset",
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
  status: "draft" | "retrieval_pending" | "retrieval_complete" | "review_ready" | "approved" | "archived";
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

export type CandidatePromotion = {
  id: string;
  queryRunId?: string;
  candidateId: string;
  candidateHash: string;
  sourceProvider: string;
  sourceIdentifier?: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceType: SourceType;
  evidenceSourceId: string;
  citationId: string;
  evidenceRecordId?: string;
  evidencePacketId?: string;
  candidateOnly: true;
  generatedClaim: false;
  promotionStatus: "promoted_to_citation" | "promoted_to_evidence_record" | "rejected";
  reviewerAttestation: true;
  reviewerType: "anonymous_internal" | "future_user" | "system";
  reviewerId?: string;
  reviewNotes: string;
  limitationNotes?: string;
  promotedAt: string;
  createdAt: string;
};

export type EvidenceFoundationStore = {
  evidenceSources: EvidenceSource[];
  citations: Citation[];
  evidencePackets: EvidencePacket[];
  retrievalRuns: RetrievalRun[];
  evidenceRecords: EvidenceRecord[];
  auditLogs: AuditLog[];
  candidatePromotions: CandidatePromotion[];
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

export type PromoteCandidateInput = {
  candidate: EvidenceCandidate;
  queryRunId?: string;
  citationText: string;
  extractedField?: string;
  humanReviewStatus: Extract<HumanReviewStatus, "reviewed" | "approved">;
  reviewNotes: string;
  reviewerAttestation: true;
  reviewerType?: CandidatePromotion["reviewerType"];
  reviewerId?: string;
  limitationNotes?: string;
  evidenceRecord?: {
    evidencePacketId: string;
    recordType: EvidenceRecordType;
    claimText: string;
    extractedField?: string;
    valueText?: string;
    unit?: string;
    geography?: string;
    confidenceLabel?: ConfidenceLabel;
    limitationNotes?: string;
  };
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
    candidatePromotions: [],
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

function hashText(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function mapCandidateSourceType(candidate: EvidenceCandidate): SourceType {
  if (candidate.sourceProvider === "pubmed") return "pubmed";
  if (candidate.sourceProvider === "clinicaltrials") return "clinicaltrials_gov";
  if (candidate.sourceProvider.startsWith("openfda")) return "openfda";
  if (candidate.sourceProvider === "dailymed") return "dailymed";
  if (candidate.sourceProvider === "rxnorm") return "rxnorm";
  if (candidate.sourceProvider.startsWith("cdc")) return "cdc";
  if (candidate.sourceProvider === "who-gho") return "who";
  if (candidate.sourceProvider === "gdc") return "nci";
  if (candidate.sourceProvider.includes("rss") || candidate.sourceProvider === "gdelt") return "news_rss";
  if (candidate.sourceType === "public_dataset") return "public_dataset";
  return "manual_source";
}

function extractIdentifiers(candidate: EvidenceCandidate) {
  const identifier = candidate.sourceIdentifier ?? "";
  return {
    pmid: identifier.match(/^PMID:?(.*)$/i)?.[1]?.trim(),
    nctId: identifier.match(/^NCT[0-9]+$/i)?.[0]?.toUpperCase(),
    fdaIdentifier: candidate.sourceProvider.startsWith("openfda") ? identifier : undefined,
  };
}

function ensureRealCandidate(candidate: EvidenceCandidate) {
  if (candidate.candidateOnly !== true) throw new Error("Only candidate-only records can be promoted.");
  if (candidate.generatedClaim !== false) throw new Error("Generated claims cannot be promoted.");
  if (!candidate.sourceProvider || !candidate.sourceTitle || !candidate.sourceUrl) {
    throw new Error("Candidate requires source provider, title, and URL.");
  }
  if (/example\.com|schema-validation|fixture|seed/i.test(`${candidate.sourceUrl} ${candidate.sourceProvider} ${candidate.candidateId}`)) {
    throw new Error("Schema checks, fixtures, seeded records, and example URLs cannot be promoted.");
  }
  if (candidate.promotionStatus === "not_eligible" || candidate.confidence === "restricted") {
    throw new Error("Candidate is not eligible for promotion.");
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

export async function promoteEvidenceCandidate(input: PromoteCandidateInput) {
  ensureRealCandidate(input.candidate);
  if (!input.reviewerAttestation) throw new Error("Reviewer attestation is required.");
  if (!input.reviewNotes.trim()) throw new Error("Review notes are required.");
  if (!input.citationText.trim()) throw new Error("Citation text is required.");

  const store = await readStore();
  const timestamp = now();
  const sourceType = mapCandidateSourceType(input.candidate);
  const identifiers = extractIdentifiers(input.candidate);

  if (input.evidenceRecord) {
    ensurePacketExists(store, input.evidenceRecord.evidencePacketId);
    if (!input.evidenceRecord.claimText.trim()) throw new Error("Human-supplied claim text is required to create an evidence record.");
  }

  const existingSource = store.evidenceSources.find((item) => item.url === input.candidate.sourceUrl || item.pmid === identifiers.pmid || item.nctId === identifiers.nctId);
  const source: EvidenceSource = existingSource ?? {
    id: randomUUID(),
    sourceType,
    title: input.candidate.sourceTitle,
    url: input.candidate.sourceUrl,
    pmid: identifiers.pmid,
    nctId: identifiers.nctId,
    fdaIdentifier: identifiers.fdaIdentifier,
    publisher: input.candidate.sourceDisplayName,
    publicationDate: input.candidate.publicationDate,
    accessDate: input.candidate.accessDate ?? today(),
    metadata: {
      sourceProvider: input.candidate.sourceProvider,
      sourceCategory: input.candidate.sourceCategory,
      retrievedAt: input.candidate.retrievedAt,
      sourceLicenseNote: input.candidate.sourceLicenseNote,
      limitationNotes: input.candidate.limitationNotes,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  if (!existingSource) store.evidenceSources.push(source);

  const citation: Citation = {
    id: randomUUID(),
    evidenceSourceId: source.id,
    citationText: input.citationText,
    sourceIdentifier: input.candidate.sourceIdentifier ?? input.candidate.sourceUrl,
    accessDate: input.candidate.accessDate ?? today(),
    extractedField: input.extractedField,
    extractionConfidence: input.candidate.confidence === "retrieved" ? "high" : "medium",
    humanReviewStatus: input.humanReviewStatus,
    limitationNotes: input.limitationNotes ?? input.candidate.limitationNotes.join(" "),
    createdAt: timestamp,
  };
  store.citations.push(citation);

  let record: EvidenceRecord | undefined;
  if (input.evidenceRecord) {
    record = {
      id: randomUUID(),
      evidencePacketId: input.evidenceRecord.evidencePacketId,
      citationId: citation.id,
      recordType: input.evidenceRecord.recordType,
      claimText: input.evidenceRecord.claimText,
      extractedField: input.evidenceRecord.extractedField ?? input.extractedField,
      valueText: input.evidenceRecord.valueText,
      unit: input.evidenceRecord.unit,
      geography: input.evidenceRecord.geography ?? "United States",
      confidenceLabel: input.evidenceRecord.confidenceLabel ?? "manual_reviewed",
      limitationNotes: input.evidenceRecord.limitationNotes ?? input.limitationNotes,
      createdAt: timestamp,
    };
    store.evidenceRecords.push(record);
  }

  const promotion: CandidatePromotion = {
    id: randomUUID(),
    queryRunId: input.queryRunId,
    candidateId: input.candidate.candidateId,
    candidateHash: hashText(`${input.candidate.sourceProvider}|${input.candidate.sourceIdentifier ?? ""}|${input.candidate.sourceUrl}`),
    sourceProvider: input.candidate.sourceProvider,
    sourceIdentifier: input.candidate.sourceIdentifier,
    sourceTitle: input.candidate.sourceTitle,
    sourceUrl: input.candidate.sourceUrl,
    sourceType,
    evidenceSourceId: source.id,
    citationId: citation.id,
    evidenceRecordId: record?.id,
    evidencePacketId: record?.evidencePacketId,
    candidateOnly: true,
    generatedClaim: false,
    promotionStatus: record ? "promoted_to_evidence_record" : "promoted_to_citation",
    reviewerAttestation: true,
    reviewerType: input.reviewerType ?? "anonymous_internal",
    reviewerId: input.reviewerId,
    reviewNotes: input.reviewNotes,
    limitationNotes: input.limitationNotes,
    promotedAt: timestamp,
    createdAt: timestamp,
  };
  store.candidatePromotions.push(promotion);

  appendAudit(store, {
    eventType: record ? "candidate.promoted_to_evidence_record" : "candidate.promoted_to_citation",
    entityType: "candidate_promotion",
    entityId: promotion.id,
    metadata: {
      queryRunId: input.queryRunId,
      candidateId: input.candidate.candidateId,
      sourceProvider: input.candidate.sourceProvider,
      citationId: citation.id,
      evidenceRecordId: record?.id,
      generatedClaim: false,
    },
  });

  await writeStore(store);
  return { promotion, source, citation, evidenceRecord: record };
}

export async function listEvidenceFoundationRecords() {
  return readStore();
}
