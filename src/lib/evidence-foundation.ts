import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import type { EvidenceCandidate } from "@/lib/connectors/types";
import { dbQuery, hasDatabaseUrl } from "@/lib/db/client";

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

function iso(value?: Date | string | null) {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

function dateOnly(value?: Date | string | null) {
  const converted = iso(value);
  return converted?.slice(0, 10);
}

function mapSource(row: Record<string, unknown>): EvidenceSource {
  return {
    id: String(row.id),
    sourceType: row.source_type as SourceType,
    title: String(row.title),
    url: String(row.url),
    pmid: row.pmid ? String(row.pmid) : undefined,
    pmcid: row.pmcid ? String(row.pmcid) : undefined,
    doi: row.doi ? String(row.doi) : undefined,
    nctId: row.nct_id ? String(row.nct_id) : undefined,
    fdaIdentifier: row.fda_identifier ? String(row.fda_identifier) : undefined,
    publisher: row.publisher ? String(row.publisher) : undefined,
    publicationDate: dateOnly(row.publication_date as Date | string | null),
    accessDate: dateOnly(row.access_date as Date | string) ?? today(),
    metadata: row.metadata_json as Record<string, unknown> | undefined,
    createdAt: iso(row.created_at as Date | string) ?? "",
    updatedAt: iso(row.updated_at as Date | string) ?? "",
  };
}

function mapCitation(row: Record<string, unknown>): Citation {
  return {
    id: String(row.id),
    evidenceSourceId: String(row.evidence_source_id),
    citationText: String(row.citation_text),
    sourceIdentifier: String(row.source_identifier),
    accessDate: dateOnly(row.access_date as Date | string) ?? today(),
    extractedField: row.extracted_field ? String(row.extracted_field) : undefined,
    extractionConfidence: row.extraction_confidence as ConfidenceLabel,
    humanReviewStatus: row.human_review_status as HumanReviewStatus,
    limitationNotes: row.limitation_notes ? String(row.limitation_notes) : undefined,
    createdAt: iso(row.created_at as Date | string) ?? "",
  };
}

function mapPacket(row: Record<string, unknown>): EvidencePacket {
  return {
    id: String(row.id),
    title: String(row.title),
    diseaseOrIndication: String(row.disease_or_indication),
    geography: String(row.geography),
    intendedUse: String(row.intended_use),
    status: row.status as EvidencePacket["status"],
    createdBy: row.created_by ? String(row.created_by) : undefined,
    createdAt: iso(row.created_at as Date | string) ?? "",
    updatedAt: iso(row.updated_at as Date | string) ?? "",
  };
}

function mapRetrievalRun(row: Record<string, unknown>): RetrievalRun {
  return {
    id: String(row.id),
    evidencePacketId: String(row.evidence_packet_id),
    query: String(row.query),
    sourceTypes: (row.source_types_json as SourceType[] | undefined) ?? [],
    status: row.status as RetrievalRun["status"],
    startedAt: iso(row.started_at as Date | string | null),
    completedAt: iso(row.completed_at as Date | string | null),
    errorMessage: row.error_message ? String(row.error_message) : undefined,
    createdAt: iso(row.created_at as Date | string) ?? "",
  };
}

function mapEvidenceRecord(row: Record<string, unknown>): EvidenceRecord {
  return {
    id: String(row.id),
    evidencePacketId: String(row.evidence_packet_id),
    citationId: String(row.citation_id),
    recordType: row.record_type as EvidenceRecordType,
    claimText: String(row.claim_text),
    extractedField: row.extracted_field ? String(row.extracted_field) : undefined,
    valueText: row.value_text ? String(row.value_text) : undefined,
    unit: row.unit ? String(row.unit) : undefined,
    geography: String(row.geography),
    confidenceLabel: row.confidence_label as ConfidenceLabel,
    limitationNotes: row.limitation_notes ? String(row.limitation_notes) : undefined,
    createdAt: iso(row.created_at as Date | string) ?? "",
  };
}

function mapAuditLog(row: Record<string, unknown>): AuditLog {
  return {
    id: String(row.id),
    actorId: row.actor_id ? String(row.actor_id) : undefined,
    actorType: row.actor_type as AuditLog["actorType"],
    eventType: String(row.event_type),
    entityType: String(row.entity_type),
    entityId: row.entity_id ? String(row.entity_id) : undefined,
    metadata: row.metadata_json as Record<string, unknown> | undefined,
    createdAt: iso(row.created_at as Date | string) ?? "",
  };
}

function mapPromotion(row: Record<string, unknown>): CandidatePromotion {
  return {
    id: String(row.id),
    queryRunId: row.query_run_id ? String(row.query_run_id) : undefined,
    candidateId: String(row.candidate_id),
    candidateHash: String(row.candidate_hash),
    sourceProvider: String(row.source_provider),
    sourceIdentifier: row.source_identifier ? String(row.source_identifier) : undefined,
    sourceTitle: String(row.source_title),
    sourceUrl: String(row.source_url),
    sourceType: row.source_type as SourceType,
    evidenceSourceId: String(row.evidence_source_id),
    citationId: String(row.citation_id),
    evidenceRecordId: row.evidence_record_id ? String(row.evidence_record_id) : undefined,
    evidencePacketId: row.evidence_packet_id ? String(row.evidence_packet_id) : undefined,
    candidateOnly: true,
    generatedClaim: false,
    promotionStatus: row.promotion_status as CandidatePromotion["promotionStatus"],
    reviewerAttestation: true,
    reviewerType: row.reviewer_type as CandidatePromotion["reviewerType"],
    reviewerId: row.reviewer_id ? String(row.reviewer_id) : undefined,
    reviewNotes: String(row.review_notes),
    limitationNotes: row.limitation_notes ? String(row.limitation_notes) : undefined,
    promotedAt: iso(row.promoted_at as Date | string) ?? "",
    createdAt: iso(row.created_at as Date | string) ?? "",
  };
}

async function appendDbAudit(event: Omit<AuditLog, "id" | "createdAt" | "actorType"> & { actorType?: AuditLog["actorType"] }) {
  await dbQuery(
    `INSERT INTO audit_logs (
      id, actor_id, actor_type, event_type, entity_type, entity_id, metadata_json, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`,
    [
      randomUUID(),
      event.actorId ?? null,
      event.actorType ?? "system",
      event.eventType,
      event.entityType,
      event.entityId ?? null,
      JSON.stringify(event.metadata ?? {}),
      now(),
    ],
  );
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
  if (hasDatabaseUrl()) {
    const timestamp = now();
    const source: EvidenceSource = {
      id: randomUUID(),
      accessDate: input.accessDate ?? today(),
      createdAt: timestamp,
      updatedAt: timestamp,
      ...input,
    };
    await dbQuery(
      `INSERT INTO evidence_sources (
        id, source_type, title, url, pmid, pmcid, doi, nct_id, fda_identifier,
        publisher, publication_date, access_date, metadata_json, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14,$15)`,
      [
        source.id,
        source.sourceType,
        source.title,
        source.url,
        source.pmid ?? null,
        source.pmcid ?? null,
        source.doi ?? null,
        source.nctId ?? null,
        source.fdaIdentifier ?? null,
        source.publisher ?? null,
        source.publicationDate ?? null,
        source.accessDate,
        JSON.stringify(source.metadata ?? {}),
        source.createdAt,
        source.updatedAt,
      ],
    );
    await appendDbAudit({ eventType: "evidence_source.created", entityType: "evidence_source", entityId: source.id });
    return source;
  }
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
  if (hasDatabaseUrl()) {
    const source = await dbQuery("SELECT id FROM evidence_sources WHERE id = $1", [input.evidenceSourceId]);
    if (!source.rows[0]) throw new Error(`Evidence source not found: ${input.evidenceSourceId}`);
    const citation: Citation = {
      id: randomUUID(),
      accessDate: input.accessDate ?? today(),
      extractionConfidence: input.extractionConfidence ?? "manual_reviewed",
      humanReviewStatus: input.humanReviewStatus ?? "needs_review",
      createdAt: now(),
      ...input,
    };
    await dbQuery(
      `INSERT INTO citations (
        id, evidence_source_id, citation_text, source_identifier, access_date, extracted_field,
        extraction_confidence, human_review_status, limitation_notes, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        citation.id,
        citation.evidenceSourceId,
        citation.citationText,
        citation.sourceIdentifier,
        citation.accessDate,
        citation.extractedField ?? null,
        citation.extractionConfidence,
        citation.humanReviewStatus,
        citation.limitationNotes ?? null,
        citation.createdAt,
      ],
    );
    await appendDbAudit({ eventType: "citation.created", entityType: "citation", entityId: citation.id });
    return citation;
  }
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
  if (hasDatabaseUrl()) {
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
    await dbQuery(
      `INSERT INTO evidence_packets (
        id, title, disease_or_indication, geography, intended_use, status, created_by, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        packet.id,
        packet.title,
        packet.diseaseOrIndication,
        packet.geography,
        packet.intendedUse,
        packet.status,
        packet.createdBy ?? null,
        packet.createdAt,
        packet.updatedAt,
      ],
    );
    await appendDbAudit({ eventType: "evidence_packet.created", entityType: "evidence_packet", entityId: packet.id });
    return packet;
  }
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
  if (hasDatabaseUrl()) {
    const packet = await dbQuery("SELECT id FROM evidence_packets WHERE id = $1", [input.evidencePacketId]);
    if (!packet.rows[0]) throw new Error(`Evidence packet not found: ${input.evidencePacketId}`);
    const retrievalRun: RetrievalRun = {
      id: randomUUID(),
      sourceTypes: input.sourceTypes ?? [],
      status: input.status ?? "not_started",
      createdAt: now(),
      ...input,
    };
    await dbQuery(
      `INSERT INTO retrieval_runs (
        id, evidence_packet_id, query, source_types_json, status, started_at, completed_at, error_message, created_at
      ) VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,$8,$9)`,
      [
        retrievalRun.id,
        retrievalRun.evidencePacketId,
        retrievalRun.query,
        JSON.stringify(retrievalRun.sourceTypes),
        retrievalRun.status,
        retrievalRun.startedAt ?? null,
        retrievalRun.completedAt ?? null,
        retrievalRun.errorMessage ?? null,
        retrievalRun.createdAt,
      ],
    );
    await appendDbAudit({ eventType: "retrieval_run.created", entityType: "retrieval_run", entityId: retrievalRun.id });
    return retrievalRun;
  }
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
  if (hasDatabaseUrl()) {
    const packet = await dbQuery("SELECT id FROM evidence_packets WHERE id = $1", [input.evidencePacketId]);
    if (!packet.rows[0]) throw new Error(`Evidence packet not found: ${input.evidencePacketId}`);
    const citation = await dbQuery("SELECT id FROM citations WHERE id = $1", [input.citationId]);
    if (!citation.rows[0]) throw new Error(`Citation not found: ${input.citationId}`);
    const record: EvidenceRecord = {
      id: randomUUID(),
      geography: input.geography ?? "United States",
      confidenceLabel: input.confidenceLabel ?? "manual_reviewed",
      createdAt: now(),
      ...input,
    };
    await dbQuery(
      `INSERT INTO evidence_records (
        id, evidence_packet_id, citation_id, record_type, claim_text, extracted_field,
        value_text, unit, geography, confidence_label, limitation_notes, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        record.id,
        record.evidencePacketId,
        record.citationId,
        record.recordType,
        record.claimText,
        record.extractedField ?? null,
        record.valueText ?? null,
        record.unit ?? null,
        record.geography,
        record.confidenceLabel,
        record.limitationNotes ?? null,
        record.createdAt,
      ],
    );
    await appendDbAudit({ eventType: "evidence_record.created", entityType: "evidence_record", entityId: record.id });
    return record;
  }
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

  const timestamp = now();
  const sourceType = mapCandidateSourceType(input.candidate);
  const identifiers = extractIdentifiers(input.candidate);

  if (input.evidenceRecord) {
    if (!input.evidenceRecord.claimText.trim()) throw new Error("Human-supplied claim text is required to create an evidence record.");
  }

  if (hasDatabaseUrl()) {
    if (input.evidenceRecord) {
      const packet = await dbQuery("SELECT id FROM evidence_packets WHERE id = $1", [input.evidenceRecord.evidencePacketId]);
      if (!packet.rows[0]) throw new Error(`Evidence packet not found: ${input.evidenceRecord.evidencePacketId}`);
    }

    const existingSourceResult = await dbQuery(
      `SELECT * FROM evidence_sources
       WHERE url = $1 OR ($2::text IS NOT NULL AND pmid = $2) OR ($3::text IS NOT NULL AND nct_id = $3)
       LIMIT 1`,
      [input.candidate.sourceUrl, identifiers.pmid ?? null, identifiers.nctId ?? null],
    );
    const source = existingSourceResult.rows[0]
      ? mapSource(existingSourceResult.rows[0])
      : await createEvidenceSource({
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
        });

    const citation = await createCitation({
      evidenceSourceId: source.id,
      citationText: input.citationText,
      sourceIdentifier: input.candidate.sourceIdentifier ?? input.candidate.sourceUrl,
      accessDate: input.candidate.accessDate ?? today(),
      extractedField: input.extractedField,
      extractionConfidence: input.candidate.confidence === "retrieved" ? "high" : "medium",
      humanReviewStatus: input.humanReviewStatus,
      limitationNotes: input.limitationNotes ?? input.candidate.limitationNotes.join(" "),
    });

    const record = input.evidenceRecord
      ? await createEvidenceRecord({
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
        })
      : undefined;

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

    await dbQuery(
      `INSERT INTO candidate_promotions (
        id, query_run_id, candidate_id, candidate_hash, source_provider, source_identifier,
        source_title, source_url, source_type, evidence_source_id, citation_id, evidence_record_id,
        evidence_packet_id, candidate_only, generated_claim, promotion_status, reviewer_attestation,
        reviewer_type, reviewer_id, review_notes, limitation_notes, promoted_at, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,TRUE,FALSE,$14,TRUE,$15,$16,$17,$18,$19,$20)`,
      [
        promotion.id,
        promotion.queryRunId ?? null,
        promotion.candidateId,
        promotion.candidateHash,
        promotion.sourceProvider,
        promotion.sourceIdentifier ?? null,
        promotion.sourceTitle,
        promotion.sourceUrl,
        promotion.sourceType,
        promotion.evidenceSourceId,
        promotion.citationId,
        promotion.evidenceRecordId ?? null,
        promotion.evidencePacketId ?? null,
        promotion.promotionStatus,
        promotion.reviewerType,
        promotion.reviewerId ?? null,
        promotion.reviewNotes,
        promotion.limitationNotes ?? null,
        promotion.promotedAt,
        promotion.createdAt,
      ],
    );
    await appendDbAudit({
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
    return { promotion, source, citation, evidenceRecord: record };
  }

  const store = await readStore();

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
  if (hasDatabaseUrl()) {
    const [
      evidenceSources,
      citations,
      evidencePackets,
      retrievalRuns,
      evidenceRecords,
      auditLogs,
      candidatePromotions,
    ] = await Promise.all([
      dbQuery("SELECT * FROM evidence_sources ORDER BY created_at DESC LIMIT 500"),
      dbQuery("SELECT * FROM citations ORDER BY created_at DESC LIMIT 500"),
      dbQuery("SELECT * FROM evidence_packets ORDER BY created_at DESC LIMIT 500"),
      dbQuery("SELECT * FROM retrieval_runs ORDER BY created_at DESC LIMIT 500"),
      dbQuery("SELECT * FROM evidence_records ORDER BY created_at DESC LIMIT 500"),
      dbQuery("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 500"),
      dbQuery("SELECT * FROM candidate_promotions ORDER BY created_at DESC LIMIT 500"),
    ]);
    return {
      evidenceSources: evidenceSources.rows.map(mapSource),
      citations: citations.rows.map(mapCitation),
      evidencePackets: evidencePackets.rows.map(mapPacket),
      retrievalRuns: retrievalRuns.rows.map(mapRetrievalRun),
      evidenceRecords: evidenceRecords.rows.map(mapEvidenceRecord),
      auditLogs: auditLogs.rows.map(mapAuditLog),
      candidatePromotions: candidatePromotions.rows.map(mapPromotion),
    };
  }
  return readStore();
}
