import "server-only";

import { sourceRegistry } from "@/lib/connectors/source-registry";
import { connectorMap, runProviderSearch } from "@/lib/connectors";

const smokeQueries: Record<string, string> = {
  pubmed: "semaglutide",
  clinicaltrials: "semaglutide",
  "openfda-label": "semaglutide",
  dailymed: "semaglutide",
  medlineplus: "diabetes",
  rxnorm: "semaglutide",
  "fda-rss": "drug safety",
  "fda-medwatch-rss": "safety",
  "cdc-rss": "diabetes",
  "nih-rss": "diabetes",
  gdelt: "semaglutide",
};

export type ConnectorHealthStatus = "registered" | "up" | "degraded" | "down" | "skipped";

export async function getConnectorHealth(options: { live?: boolean; providers?: string[] } = {}) {
  const checkedAt = new Date().toISOString();
  const providerIds = options.providers?.length
    ? options.providers
    : sourceRegistry.filter((entry) => entry.supportsLiveQuery).map((entry) => entry.providerId);

  const checks = await Promise.all(providerIds.map((providerId) => checkProvider(providerId, Boolean(options.live), checkedAt)));
  return {
    checkedAt,
    liveChecksExecuted: Boolean(options.live),
    fakeSuccess: false,
    patientPortalAccess: false,
    generatedClaims: false,
    candidateOnly: true,
    checks,
  };
}

async function checkProvider(providerId: string, live: boolean, checkedAt: string) {
  const registryEntry = sourceRegistry.find((entry) => entry.providerId === providerId);
  const implemented = Boolean(connectorMap[providerId]);
  if (!registryEntry) {
    return { providerId, displayName: providerId, status: "skipped" as ConnectorHealthStatus, implemented: false, checkedAt, reason: "Unknown provider." };
  }

  if (!live) {
    return {
      providerId,
      displayName: registryEntry.displayName,
      status: implemented && registryEntry.supportsLiveQuery ? "registered" as ConnectorHealthStatus : "skipped" as ConnectorHealthStatus,
      implemented,
      checkedAt,
      reason: registryEntry.supportsLiveQuery ? "Static registry check only. Use live=true for runtime API check." : registryEntry.notes.join(" "),
    };
  }

  if (!implemented || !registryEntry.supportsLiveQuery) {
    return {
      providerId,
      displayName: registryEntry.displayName,
      status: "skipped" as ConnectorHealthStatus,
      implemented,
      checkedAt,
      reason: registryEntry.notes.join(" ") || "Provider is not implemented for live query.",
    };
  }

  const query = smokeQueries[providerId] ?? "semaglutide";
  try {
    const result = await runProviderSearch(providerId, { query, maxResults: 1, timeoutMs: 5000 });
    const candidatesValid = result.candidates.every((candidate) => candidate.candidateOnly === true && candidate.generatedClaim === false);
    return {
      providerId,
      displayName: registryEntry.displayName,
      status: result.errors.length === 0 && candidatesValid ? "up" as ConnectorHealthStatus : "degraded" as ConnectorHealthStatus,
      implemented,
      checkedAt,
      query,
      candidateCount: result.candidates.length,
      candidateOnly: candidatesValid,
      generatedClaims: false,
      errors: result.errors,
      reason: result.skipped?.reason,
    };
  } catch (error) {
    return {
      providerId,
      displayName: registryEntry.displayName,
      status: "down" as ConnectorHealthStatus,
      implemented,
      checkedAt,
      query,
      candidateCount: 0,
      candidateOnly: true,
      generatedClaims: false,
      errors: [error instanceof Error ? error.message : "Unknown connector health error."],
    };
  }
}
