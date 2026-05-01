import "server-only";

import { getRegistryEntry } from "./source-registry";
import type { ConnectorSearchParams, ConnectorSearchResult, EvidenceCandidate } from "./types";
import { fetchJson, sanitizeQuery, stableCandidateId, today } from "./http";

type WhoIndicatorResponse = { value?: Array<{ IndicatorCode?: string; IndicatorName?: string; Language?: string }> };

export async function searchWhoGho(params: ConnectorSearchParams): Promise<ConnectorSearchResult> {
  const providerId = "who-gho";
  const registry = getRegistryEntry(providerId);
  const query = sanitizeQuery(params.query).toLowerCase();
  const retrievedAt = new Date().toISOString();
  const accessDate = today();

  try {
    const data = await fetchJson<WhoIndicatorResponse>("https://ghoapi.azureedge.net/api/Indicator", params.timeoutMs);
    const candidates: EvidenceCandidate[] = (data.value ?? [])
      .filter((item) => item.IndicatorName?.toLowerCase().includes(query))
      .slice(0, params.maxResults)
      .map((item) => ({
        candidateId: stableCandidateId(providerId, item.IndicatorCode ?? item.IndicatorName ?? query),
        sourceProvider: providerId,
        sourceDisplayName: registry?.displayName ?? "WHO GHO",
        sourceCategory: "global_health",
        sourceType: "epidemiology_dataset",
        sourceIdentifier: item.IndicatorCode,
        sourceTitle: item.IndicatorName ?? "WHO GHO indicator",
        sourceUrl: item.IndicatorCode ? `https://ghoapi.azureedge.net/api/${item.IndicatorCode}` : "https://www.who.int/data/gho",
        accessDate,
        retrievedAt,
        datasetName: "WHO Global Health Observatory",
        sourceLicenseNote: "WHO GHO public indicator candidate; terms and geographic applicability require review.",
        termsReviewRequired: registry?.termsReviewRequired ?? true,
        raw: item,
        confidence: "partial",
        candidateOnly: true,
        generatedClaim: false,
        promotionStatus: "not_promoted",
        limitationNotes: ["Indicator metadata candidate only; values not retrieved in this phase.", "US-focused applicability requires review."],
      }));
    return { providerId, candidates, errors: [] };
  } catch (error) {
    return { providerId, candidates: [], errors: [error instanceof Error ? error.message : "WHO GHO connector failed."] };
  }
}
