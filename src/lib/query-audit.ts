import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

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
    throw error;
  }
}

async function writeStore(store: QueryAuditStore) {
  await mkdir(storageDirectory, { recursive: true });
  await writeFile(storageFile, `${JSON.stringify(store, null, 2)}\n`);
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

export async function startQueryRun(input: {
  queryText: string;
  accessContext?: QueryRun["accessContext"];
  actorType?: QueryRun["actorType"];
  actorId?: string;
  liveRetrieval?: boolean;
}) {
  const store = await readStore();
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
  store.queryRuns.push(queryRun);
  await writeStore(store);
  return queryRun;
}

export async function recordQueryRunStep(input: Omit<QueryRunStep, "id" | "startedAt"> & { startedAt?: string }) {
  const store = await readStore();
  const step: QueryRunStep = {
    id: randomUUID(),
    startedAt: input.startedAt ?? now(),
    ...input,
  };
  store.queryRunSteps.push(step);
  await writeStore(store);
  return step;
}

export async function recordSourceEvent(input: Omit<QuerySourceEvent, "id" | "retrievedAt"> & { retrievedAt?: string }) {
  const store = await readStore();
  const event: QuerySourceEvent = {
    id: randomUUID(),
    retrievedAt: input.retrievedAt ?? now(),
    ...input,
    requestUrlRedacted: redactUrl(input.requestUrlRedacted),
    requestParamsRedacted: redactObject(input.requestParamsRedacted),
  };
  store.querySourceEvents.push(event);
  await writeStore(store);
  return event;
}

export async function recordCandidateEvents(queryRunId: string, candidates: QueryCandidateEventInput[]) {
  const store = await readStore();
  const timestamp = now();
  const events = candidates.map((candidate) => ({
    id: randomUUID(),
    queryRunId,
    candidateHash: hashText(`${candidate.sourceProvider}|${candidate.sourceIdentifier ?? ""}|${candidate.sourceUrl}`),
    createdAt: timestamp,
    ...candidate,
    generatedClaim: false as const,
  }));
  store.queryCandidateEvents.push(...events);
  await writeStore(store);
  return events;
}

export async function recordQueryError(input: Omit<QueryError, "id" | "createdAt">) {
  const store = await readStore();
  const error: QueryError = {
    id: randomUUID(),
    createdAt: now(),
    ...input,
  };
  store.queryErrors.push(error);
  await writeStore(store);
  return error;
}

export async function completeQueryRun(queryRunId: string, status: Exclude<QueryRunStatus, "started">, snapshot?: Record<string, unknown>) {
  const store = await readStore();
  const queryRun = store.queryRuns.find((item) => item.id === queryRunId);
  if (!queryRun) throw new Error(`Query run not found: ${queryRunId}`);
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
  const store = await readStore();
  return store.queryRuns.sort((a, b) => b.initiatedAt.localeCompare(a.initiatedAt));
}

export async function getQueryRunAuditTrail(queryRunId: string) {
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
