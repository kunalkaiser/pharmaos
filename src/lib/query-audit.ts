import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { dbQuery, hasDatabaseUrl } from "@/lib/db/client";

const storageDirectory = process.env.EVIDARA_STORAGE_DIR ?? path.join(process.cwd(), ".evidara-data");
const storageFile = path.join(storageDirectory, "query-audit.json");

export type QueryRunStatus = "started" | "completed" | "partial_failure" | "failed";
export type QueryRunStepType = "normalize_query" | "search_source" | "normalize_results" | "validate_provenance" | "return_candidates";

export type QueryRun = {
  id: string;
  queryText: string;
  queryHash: string;
  normalizedQuery: string;
  initiatedAt: string;
  completedAt?: string;
  status: QueryRunStatus;
  actorType: "anonymous_internal" | "system" | "future_user";
  actorId?: string;
  accessContext: "internal_api" | "app_workspace" | "admin_workspace";
  liveRetrieval: boolean;
  generatedClaims: false;
  candidateOnly: true;
  createdAt: string;
};

export type QueryRunStep = {
  id: string;
  queryRunId: string;
  stepOrder: number;
  stepName: string;
  stepType: QueryRunStepType;
  startedAt: string;
  completedAt?: string;
  status: QueryRunStatus;
  notes?: string;
};

export type QuerySourceEvent = {
  id: string;
  queryRunId: string;
  providerId: string;
  endpointCalled?: string;
  requestUrlRedacted?: string;
  requestParamsRedacted?: Record<string, unknown>;
  statusCode?: number;
  resultCount: number;
  errorMessage?: string;
  retrievedAt: string;
};

export type QueryCandidateEventInput = {
  candidateId: string;
  sourceProvider: string;
  sourceIdentifier?: string;
  sourceTitle: string;
  sourceUrl: string;
  generatedClaim: false;
  promotionStatus: "not_promoted" | "eligible_after_review" | "not_eligible";
};

export type QueryCandidateEvent = QueryCandidateEventInput & {
  id: string;
  queryRunId: string;
  candidateHash: string;
  createdAt: string;
};

export type QueryError = {
  id: string;
  queryRunId: string;
  providerId?: string;
  errorType: string;
  errorMessage: string;
  recoverable: boolean;
  createdAt: string;
};

export type QueryAuditSnapshot = {
  id: string;
  queryRunId: string;
  snapshotJson: Record<string, unknown>;
  snapshotHash: string;
  createdAt: string;
};

export type QueryAuditStore = {
  queryRuns: QueryRun[];
  queryRunSteps: QueryRunStep[];
  querySourceEvents: QuerySourceEvent[];
  queryCandidateEvents: QueryCandidateEvent[];
  queryErrors: QueryError[];
  queryAuditSnapshots: QueryAuditSnapshot[];
};

function now() {
  return new Date().toISOString();
}

function initialStore(): QueryAuditStore {
  return {
    queryRuns: [],
    queryRunSteps: [],
    querySourceEvents: [],
    queryCandidateEvents: [],
    queryErrors: [],
    queryAuditSnapshots: [],
  };
}

async function readStore(): Promise<QueryAuditStore> {
  try {
    const content = await readFile(storageFile, "utf8");
    return { ...initialStore(), ...(JSON.parse(content) as QueryAuditStore) };
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return initialStore();
    if (error instanceof SyntaxError) {
      console.warn("[query-audit] Local preview audit store is not valid JSON; starting a fresh in-memory-shaped store.");
      return initialStore();
    }
    throw error;
  }
}

async function writeStore(store: QueryAuditStore) {
  await mkdir(storageDirectory, { recursive: true });
  const temporaryFile = `${storageFile}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporaryFile, `${JSON.stringify(store, null, 2)}\n`);
  await rename(temporaryFile, storageFile);
}

function hashText(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function redactUrl(value?: string) {
  if (!value) return value;
  try {
    const url = new URL(value);
    for (const key of [...url.searchParams.keys()]) {
      if (/key|token|secret|authorization|apikey/i.test(key)) url.searchParams.set(key, "[redacted]");
    }
    return url.toString();
  } catch {
    return value.replace(/(key|token|secret|authorization|apikey)=([^&\s]+)/gi, "$1=[redacted]");
  }
}

function redactObject(input?: Record<string, unknown>) {
  if (!input) return undefined;
  const entries = Object.entries(input).map(([key, value]) => [key, /key|token|secret|authorization|apikey/i.test(key) ? "[redacted]" : value]);
  return Object.fromEntries(entries);
}

function warnDatabaseFallback(operation: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`[query-audit] ${operation} failed against Postgres; falling back to local preview audit store. ${message}`);
}

type QueryRunRow = {
  id: string;
  query_text: string;
  query_hash: string;
  normalized_query: string;
  initiated_at: Date | string;
  completed_at?: Date | string | null;
  status: QueryRunStatus;
  actor_type: QueryRun["actorType"];
  actor_id?: string | null;
  access_context: QueryRun["accessContext"];
  live_retrieval: boolean;
  generated_claims: false;
  candidate_only: true;
  created_at: Date | string;
};

function iso(value?: Date | string | null) {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

function mapQueryRun(row: QueryRunRow): QueryRun {
  return {
    id: row.id,
    queryText: row.query_text,
    queryHash: row.query_hash,
    normalizedQuery: row.normalized_query,
    initiatedAt: iso(row.initiated_at) ?? "",
    completedAt: iso(row.completed_at),
    status: row.status,
    actorType: row.actor_type,
    actorId: row.actor_id ?? undefined,
    accessContext: row.access_context,
    liveRetrieval: row.live_retrieval,
    generatedClaims: false,
    candidateOnly: true,
    createdAt: iso(row.created_at) ?? "",
  };
}

function mapStep(row: Record<string, unknown>): QueryRunStep {
  return {
    id: String(row.id),
    queryRunId: String(row.query_run_id),
    stepOrder: Number(row.step_order),
    stepName: String(row.step_name),
    stepType: row.step_type as QueryRunStepType,
    startedAt: iso(row.started_at as Date | string) ?? "",
    completedAt: iso(row.completed_at as Date | string | null),
    status: row.status as QueryRunStatus,
    notes: row.notes ? String(row.notes) : undefined,
  };
}

function mapSourceEvent(row: Record<string, unknown>): QuerySourceEvent {
  return {
    id: String(row.id),
    queryRunId: String(row.query_run_id),
    providerId: String(row.provider_id),
    endpointCalled: row.endpoint_called ? String(row.endpoint_called) : undefined,
    requestUrlRedacted: row.request_url_redacted ? String(row.request_url_redacted) : undefined,
    requestParamsRedacted: row.request_params_redacted as Record<string, unknown> | undefined,
    statusCode: row.status_code === null || row.status_code === undefined ? undefined : Number(row.status_code),
    resultCount: Number(row.result_count),
    errorMessage: row.error_message ? String(row.error_message) : undefined,
    retrievedAt: iso(row.retrieved_at as Date | string) ?? "",
  };
}

function mapCandidateEvent(row: Record<string, unknown>): QueryCandidateEvent {
  return {
    id: String(row.id),
    queryRunId: String(row.query_run_id),
    candidateId: String(row.candidate_id),
    sourceProvider: String(row.source_provider),
    sourceIdentifier: row.source_identifier ? String(row.source_identifier) : undefined,
    sourceTitle: String(row.source_title),
    sourceUrl: String(row.source_url),
    candidateHash: String(row.candidate_hash),
    generatedClaim: false,
    promotionStatus: row.promotion_status as QueryCandidateEvent["promotionStatus"],
    createdAt: iso(row.created_at as Date | string) ?? "",
  };
}

function mapQueryError(row: Record<string, unknown>): QueryError {
  return {
    id: String(row.id),
    queryRunId: String(row.query_run_id),
    providerId: row.provider_id ? String(row.provider_id) : undefined,
    errorType: String(row.error_type),
    errorMessage: String(row.error_message),
    recoverable: Boolean(row.recoverable),
    createdAt: iso(row.created_at as Date | string) ?? "",
  };
}

function mapSnapshot(row: Record<string, unknown>): QueryAuditSnapshot {
  return {
    id: String(row.id),
    queryRunId: String(row.query_run_id),
    snapshotJson: row.snapshot_json as Record<string, unknown>,
    snapshotHash: String(row.snapshot_hash),
    createdAt: iso(row.created_at as Date | string) ?? "",
  };
}

export async function startQueryRun(input: {
  queryText: string;
  accessContext?: QueryRun["accessContext"];
  actorType?: QueryRun["actorType"];
  actorId?: string;
  liveRetrieval?: boolean;
}) {
  const normalizedQuery = input.queryText.trim().toLowerCase().replace(/\s+/g, " ");
  const timestamp = now();
  const queryRun: QueryRun = {
    id: randomUUID(),
    queryText: input.queryText,
    queryHash: hashText(normalizedQuery),
    normalizedQuery,
    initiatedAt: timestamp,
    status: "started",
    actorType: input.actorType ?? "anonymous_internal",
    actorId: input.actorId,
    accessContext: input.accessContext ?? "internal_api",
    liveRetrieval: input.liveRetrieval ?? true,
    generatedClaims: false,
    candidateOnly: true,
    createdAt: timestamp,
  };
  if (hasDatabaseUrl()) {
    try {
      await dbQuery(
        `INSERT INTO query_runs (
          id, query_text, query_hash, normalized_query, initiated_at, status, actor_type,
          actor_id, access_context, live_retrieval, generated_claims, candidate_only, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,FALSE,TRUE,$11)`,
        [
          queryRun.id,
          queryRun.queryText,
          queryRun.queryHash,
          queryRun.normalizedQuery,
          queryRun.initiatedAt,
          queryRun.status,
          queryRun.actorType,
          queryRun.actorId ?? null,
          queryRun.accessContext,
          queryRun.liveRetrieval,
          queryRun.createdAt,
        ],
      );
      return queryRun;
    } catch (error) {
      warnDatabaseFallback("startQueryRun", error);
    }
  }
  const store = await readStore();
  store.queryRuns.push(queryRun);
  await writeStore(store);
  return queryRun;
}

export async function recordQueryRunStep(input: Omit<QueryRunStep, "id" | "startedAt"> & { startedAt?: string }) {
  const step: QueryRunStep = {
    id: randomUUID(),
    startedAt: input.startedAt ?? now(),
    ...input,
  };
  if (hasDatabaseUrl()) {
    try {
      await dbQuery(
        `INSERT INTO query_run_steps (
          id, query_run_id, step_order, step_name, step_type, started_at, completed_at, status, notes
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          step.id,
          step.queryRunId,
          step.stepOrder,
          step.stepName,
          step.stepType,
          step.startedAt,
          step.completedAt ?? null,
          step.status,
          step.notes ?? null,
        ],
      );
      return step;
    } catch (error) {
      warnDatabaseFallback("recordQueryRunStep", error);
    }
  }
  const store = await readStore();
  store.queryRunSteps.push(step);
  await writeStore(store);
  return step;
}

export async function recordSourceEvent(input: Omit<QuerySourceEvent, "id" | "retrievedAt"> & { retrievedAt?: string }) {
  const event: QuerySourceEvent = {
    id: randomUUID(),
    retrievedAt: input.retrievedAt ?? now(),
    ...input,
    requestUrlRedacted: redactUrl(input.requestUrlRedacted),
    requestParamsRedacted: redactObject(input.requestParamsRedacted),
  };
  if (hasDatabaseUrl()) {
    try {
      await dbQuery(
        `INSERT INTO query_source_events (
          id, query_run_id, provider_id, endpoint_called, request_url_redacted,
          request_params_redacted, status_code, result_count, error_message, retrieved_at
        ) VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10)`,
        [
          event.id,
          event.queryRunId,
          event.providerId,
          event.endpointCalled ?? null,
          event.requestUrlRedacted ?? null,
          event.requestParamsRedacted ? JSON.stringify(event.requestParamsRedacted) : null,
          event.statusCode ?? null,
          event.resultCount,
          event.errorMessage ?? null,
          event.retrievedAt,
        ],
      );
      return event;
    } catch (error) {
      warnDatabaseFallback("recordSourceEvent", error);
    }
  }
  const store = await readStore();
  store.querySourceEvents.push(event);
  await writeStore(store);
  return event;
}

export async function recordCandidateEvents(queryRunId: string, candidates: QueryCandidateEventInput[]) {
  const timestamp = now();
  const events = candidates.map((candidate) => ({
    id: randomUUID(),
    queryRunId,
    candidateHash: hashText(`${candidate.sourceProvider}|${candidate.sourceIdentifier ?? ""}|${candidate.sourceUrl}`),
    createdAt: timestamp,
    ...candidate,
    generatedClaim: false as const,
  }));
  if (hasDatabaseUrl()) {
    try {
      for (const event of events) {
        await dbQuery(
          `INSERT INTO query_candidate_events (
            id, query_run_id, candidate_id, source_provider, source_identifier, source_title,
            source_url, candidate_hash, generated_claim, promotion_status, created_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,FALSE,$9,$10)`,
          [
            event.id,
            event.queryRunId,
            event.candidateId,
            event.sourceProvider,
            event.sourceIdentifier ?? null,
            event.sourceTitle,
            event.sourceUrl,
            event.candidateHash,
            event.promotionStatus,
            event.createdAt,
          ],
        );
      }
      return events;
    } catch (error) {
      warnDatabaseFallback("recordCandidateEvents", error);
    }
  }
  const store = await readStore();
  store.queryCandidateEvents.push(...events);
  await writeStore(store);
  return events;
}

export async function recordQueryError(input: Omit<QueryError, "id" | "createdAt">) {
  const error: QueryError = {
    id: randomUUID(),
    createdAt: now(),
    ...input,
  };
  if (hasDatabaseUrl()) {
    try {
      await dbQuery(
        `INSERT INTO query_errors (
          id, query_run_id, provider_id, error_type, error_message, recoverable, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          error.id,
          error.queryRunId,
          error.providerId ?? null,
          error.errorType,
          error.errorMessage,
          error.recoverable,
          error.createdAt,
        ],
      );
      return error;
    } catch (dbError) {
      warnDatabaseFallback("recordQueryError", dbError);
    }
  }
  const store = await readStore();
  store.queryErrors.push(error);
  await writeStore(store);
  return error;
}

export async function completeQueryRun(queryRunId: string, status: Exclude<QueryRunStatus, "started">, snapshot?: Record<string, unknown>) {
  if (hasDatabaseUrl()) {
    try {
      const completedAt = now();
      const result = await dbQuery<QueryRunRow>(
        `UPDATE query_runs SET status = $2, completed_at = $3 WHERE id = $1 RETURNING *`,
        [queryRunId, status, completedAt],
      );
      const row = result.rows[0];
      if (!row) throw new Error(`Query run not found: ${queryRunId}`);

      if (snapshot) {
        const snapshotString = JSON.stringify(snapshot);
        await dbQuery(
          `INSERT INTO query_audit_snapshots (
            id, query_run_id, snapshot_json, snapshot_hash, created_at
          ) VALUES ($1,$2,$3::jsonb,$4,$5)`,
          [randomUUID(), queryRunId, snapshotString, hashText(snapshotString), now()],
        );
      }

      return mapQueryRun(row);
    } catch (error) {
      warnDatabaseFallback("completeQueryRun", error);
    }
  }
  const store = await readStore();
  let queryRun = store.queryRuns.find((item) => item.id === queryRunId);
  if (!queryRun) {
    const timestamp = now();
    queryRun = {
      id: queryRunId,
      queryText: "Recovered preview audit run",
      queryHash: hashText(queryRunId),
      normalizedQuery: "recovered-preview-audit-run",
      initiatedAt: timestamp,
      status: "started",
      actorType: "system",
      accessContext: "internal_api",
      liveRetrieval: false,
      generatedClaims: false,
      candidateOnly: true,
      createdAt: timestamp,
    };
    store.queryRuns.push(queryRun);
  }
  queryRun.status = status;
  queryRun.completedAt = now();

  if (snapshot) {
    const snapshotString = JSON.stringify(snapshot);
    store.queryAuditSnapshots.push({
      id: randomUUID(),
      queryRunId,
      snapshotJson: snapshot,
      snapshotHash: hashText(snapshotString),
      createdAt: now(),
    });
  }

  await writeStore(store);
  return queryRun;
}

export async function listQueryRuns() {
  if (hasDatabaseUrl()) {
    try {
      const result = await dbQuery<QueryRunRow>("SELECT * FROM query_runs ORDER BY initiated_at DESC LIMIT 100");
      return result.rows.map(mapQueryRun);
    } catch (error) {
      warnDatabaseFallback("listQueryRuns", error);
    }
  }
  const store = await readStore();
  return store.queryRuns.sort((a, b) => b.initiatedAt.localeCompare(a.initiatedAt));
}

export async function getQueryRunAuditTrail(queryRunId: string) {
  if (hasDatabaseUrl()) {
    try {
      const queryRunResult = await dbQuery<QueryRunRow>("SELECT * FROM query_runs WHERE id = $1", [queryRunId]);
      const queryRun = queryRunResult.rows[0];
      if (!queryRun) return null;

      const [steps, sourceEvents, candidateEvents, errors, snapshots] = await Promise.all([
        dbQuery("SELECT * FROM query_run_steps WHERE query_run_id = $1 ORDER BY step_order, started_at", [queryRunId]),
        dbQuery("SELECT * FROM query_source_events WHERE query_run_id = $1 ORDER BY retrieved_at", [queryRunId]),
        dbQuery("SELECT * FROM query_candidate_events WHERE query_run_id = $1 ORDER BY created_at", [queryRunId]),
        dbQuery("SELECT * FROM query_errors WHERE query_run_id = $1 ORDER BY created_at", [queryRunId]),
        dbQuery("SELECT * FROM query_audit_snapshots WHERE query_run_id = $1 ORDER BY created_at", [queryRunId]),
      ]);

      return {
        queryRun: mapQueryRun(queryRun),
        steps: steps.rows.map(mapStep),
        sourceEvents: sourceEvents.rows.map(mapSourceEvent),
        candidateEvents: candidateEvents.rows.map(mapCandidateEvent),
        errors: errors.rows.map(mapQueryError),
        snapshots: snapshots.rows.map(mapSnapshot),
      };
    } catch (error) {
      warnDatabaseFallback("getQueryRunAuditTrail", error);
    }
  }
  const store = await readStore();
  const queryRun = store.queryRuns.find((item) => item.id === queryRunId);
  if (!queryRun) return null;
  return {
    queryRun,
    steps: store.queryRunSteps.filter((item) => item.queryRunId === queryRunId),
    sourceEvents: store.querySourceEvents.filter((item) => item.queryRunId === queryRunId),
    candidateEvents: store.queryCandidateEvents.filter((item) => item.queryRunId === queryRunId),
    errors: store.queryErrors.filter((item) => item.queryRunId === queryRunId),
    snapshots: store.queryAuditSnapshots.filter((item) => item.queryRunId === queryRunId),
  };
}
