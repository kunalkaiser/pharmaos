import "server-only";

import { sourceRegistry } from "./source-registry";
import type { ConnectorSearchParams, ConnectorSearchResult, SourceConnector } from "./types";
import { sanitizeQuery } from "./http";
import { searchPubMed } from "./pubmed";
import { searchClinicalTrials } from "./clinicaltrials";
import { searchOpenFda } from "./openfda";
import { searchDailyMed } from "./dailymed";
import { searchMedlinePlus } from "./medlineplus";
import { searchRxNorm } from "./rxnorm";
import { searchRss } from "./rss";
import { searchCdcSocrata } from "./cdc-socrata";
import { searchCdcWonder } from "./cdc-wonder";
import { searchWhoGho } from "./who-gho";
import { searchGdc } from "./gdc";
import { searchGdelt } from "./gdelt";
import {
  completeQueryRun,
  recordCandidateEvents,
  recordQueryError,
  recordQueryRunStep,
  recordSourceEvent,
  startQueryRun,
} from "@/lib/query-audit";

export const connectorMap: Record<string, SourceConnector> = {
  pubmed: { providerId: "pubmed", search: searchPubMed },
  clinicaltrials: { providerId: "clinicaltrials", search: searchClinicalTrials },
  "openfda-label": { providerId: "openfda-label", search: (params) => searchOpenFda("openfda-label", params) },
  "openfda-faers": { providerId: "openfda-faers", search: (params) => searchOpenFda("openfda-faers", params) },
  "openfda-enforcement": { providerId: "openfda-enforcement", search: (params) => searchOpenFda("openfda-enforcement", params) },
  "openfda-ndc": { providerId: "openfda-ndc", search: (params) => searchOpenFda("openfda-ndc", params) },
  "openfda-drugsfda": { providerId: "openfda-drugsfda", search: (params) => searchOpenFda("openfda-drugsfda", params) },
  dailymed: { providerId: "dailymed", search: searchDailyMed },
  medlineplus: { providerId: "medlineplus", search: searchMedlinePlus },
  rxnorm: { providerId: "rxnorm", search: searchRxNorm },
  "cdc-rss": { providerId: "cdc-rss", search: (params) => searchRss("cdc-rss", params) },
  "fda-rss": { providerId: "fda-rss", search: (params) => searchRss("fda-rss", params) },
  "fda-medwatch-rss": { providerId: "fda-medwatch-rss", search: (params) => searchRss("fda-medwatch-rss", params) },
  "nih-rss": { providerId: "nih-rss", search: (params) => searchRss("nih-rss", params) },
  "cdc-socrata": { providerId: "cdc-socrata", search: searchCdcSocrata },
  "cdc-wonder": { providerId: "cdc-wonder", search: searchCdcWonder },
  "who-gho": { providerId: "who-gho", search: searchWhoGho },
  gdc: { providerId: "gdc", search: searchGdc },
  gdelt: { providerId: "gdelt", search: searchGdelt },
};

const defaultProviders = ["pubmed", "clinicaltrials", "openfda-label", "dailymed", "medlineplus", "rxnorm"] as const;
const newsProviders = ["fda-rss", "fda-medwatch-rss", "cdc-rss", "nih-rss", "gdelt"] as const;

export function connectorSearchParams(searchParams: URLSearchParams): ConnectorSearchParams {
  const query = sanitizeQuery(searchParams.get("query") ?? "");
  const requestedMax = Number(searchParams.get("limit") ?? "5");
  return {
    query,
    maxResults: Number.isFinite(requestedMax) ? Math.min(Math.max(requestedMax, 1), 10) : 5,
    timeoutMs: 6000,
  };
}

export function validateConnectorQuery(query: string) {
  if (!query) return "A query parameter is required.";
  if (query.length < 2) return "Query must be at least 2 characters.";
  if (query.length > 160) return "Query must be 160 characters or fewer.";
  return null;
}

export async function runProviderSearch(providerId: string, params: ConnectorSearchParams): Promise<ConnectorSearchResult> {
  const connector = connectorMap[providerId];
  const registryEntry = sourceRegistry.find((entry) => entry.providerId === providerId);

  if (!registryEntry) {
    return { providerId, candidates: [], skipped: { providerId, reason: "Unknown provider." }, errors: [] };
  }

  if (!connector || !registryEntry.supportsLiveQuery) {
    return {
      providerId,
      candidates: [],
      skipped: { providerId, reason: registryEntry.notes.join(" ") || "Provider is registered but not implemented for live query." },
      errors: [],
    };
  }

  return connector.search(params);
}

export async function runCombinedSearch(params: ConnectorSearchParams, providers: readonly string[] = defaultProviders) {
  const retrievedAt = new Date().toISOString();
  const queryRun = await startQueryRun({ queryText: params.query, accessContext: "internal_api", liveRetrieval: true });
  await recordQueryRunStep({
    queryRunId: queryRun.id,
    stepOrder: 1,
    stepName: "Normalize query",
    stepType: "normalize_query",
    completedAt: new Date().toISOString(),
    status: "completed",
    notes: "Query normalized and bounded by internal connector safety controls.",
  });

  const results = await Promise.all(providers.map((providerId) => runProviderSearch(providerId, params)));
  await recordQueryRunStep({
    queryRunId: queryRun.id,
    stepOrder: 2,
    stepName: "Search public sources",
    stepType: "search_source",
    completedAt: new Date().toISOString(),
    status: results.some((result) => result.errors.length > 0) ? "partial_failure" : "completed",
    notes: "Only official/public connector modules were queried.",
  });

  for (const result of results) {
    await recordSourceEvent({
      queryRunId: queryRun.id,
      providerId: result.providerId,
      endpointCalled: result.skipped ? "not_called" : result.providerId,
      requestParamsRedacted: { query: params.query, maxResults: params.maxResults },
      resultCount: result.candidates.length,
      errorMessage: result.errors.length > 0 ? result.errors.join("; ") : result.skipped?.reason,
      retrievedAt,
    });

    if (result.errors.length > 0) {
      await recordQueryError({
        queryRunId: queryRun.id,
        providerId: result.providerId,
        errorType: "connector_error",
        errorMessage: result.errors.join("; "),
        recoverable: true,
      });
    }
  }

  const candidateEvents = results.flatMap((result) =>
    result.candidates.map((candidate) => ({
      candidateId: candidate.candidateId,
      sourceProvider: candidate.sourceProvider,
      sourceIdentifier: candidate.sourceIdentifier,
      sourceTitle: candidate.sourceTitle,
      sourceUrl: candidate.sourceUrl,
      generatedClaim: false as const,
      promotionStatus: candidate.promotionStatus,
    }))
  );
  await recordCandidateEvents(queryRun.id, candidateEvents);
  await recordQueryRunStep({
    queryRunId: queryRun.id,
    stepOrder: 3,
    stepName: "Return evidence candidates",
    stepType: "return_candidates",
    completedAt: new Date().toISOString(),
    status: "completed",
    notes: "Candidates remain candidate-only and do not create citations, evidence records, scores, or reports.",
  });

  const response = {
    query: params.query,
    queryRunId: queryRun.id,
    liveRetrieval: true,
    generatedClaims: false,
    candidateOnly: true,
    sourcesQueried: results.filter((result) => !result.skipped).map((result) => result.providerId),
    sourcesSkipped: results.filter((result) => result.skipped).map((result) => result.skipped!),
    results: Object.fromEntries(results.map((result) => [result.providerId, result.candidates])),
    limitations: [
      "Retrieved records are evidence candidates only, not final evidence claims.",
      "No evidence_records, reports, scores, or citations are created automatically.",
      "Human review is required before promotion to citation/evidence_record.",
      "Patient portals, EHR systems, login-gated sources, paywalled content, and PHI are excluded.",
    ],
    retrievedAt,
  };

  await completeQueryRun(queryRun.id, results.some((result) => result.errors.length > 0) ? "partial_failure" : "completed", {
    query: params.query,
    sourcesQueried: response.sourcesQueried,
    sourcesSkipped: response.sourcesSkipped,
    candidateCounts: Object.fromEntries(results.map((result) => [result.providerId, result.candidates.length])),
    generatedClaims: false,
    candidateOnly: true,
  });

  return response;
}

export function getNewsProviders() {
  return newsProviders;
}
