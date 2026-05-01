import "server-only";

import { getRegistryEntry } from "./source-registry";
import type { ConnectorSearchParams, ConnectorSearchResult, EvidenceCandidate } from "./types";
import { fetchJson, sanitizeQuery, stableCandidateId, today } from "./http";

type DailyMedResponse = { data?: Array<{ setid?: string; title?: string; spl_version?: string; published_date?: string }> };

export async function searchDailyMed(params: ConnectorSearchParams): Promise<ConnectorSearchResult> {
  const providerId = "dailymed";
  const registry = getRegistryEntry(providerId);
  const query = sanitizeQuery(params.query);
  const retrievedAt = new Date().toISOString();
  const accessDate = today();

  try {
    const data = await fetchJson<DailyMedResponse>(`https://dailymed.nlm.nih.gov/dailymed/services/v2/spls.json?drug_name=${encodeURIComponent(query)}&pagesize=${params.maxResults}`, params.timeoutMs);
    const candidates: EvidenceCandidate[] = (data.data ?? []).slice(0, params.maxResults).map((item) => {
      const setId = item.setid ?? item.title ?? "unknown-spl";
      return {
        candidateId: stableCandidateId(providerId, setId),
        sourceProvider: providerId,
        sourceDisplayName: registry?.displayName ?? "DailyMed",
        sourceCategory: "drug_label",
        sourceType: "drug_label",
        sourceIdentifier: setId,
        sourceTitle: item.title ?? `DailyMed SPL ${setId}`,
        sourceUrl: `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${setId}`,
        publicationDate: item.published_date,
        accessDate,
        retrievedAt,
        drug: query,
        sourceLicenseNote: "DailyMed public SPL candidate.",
        termsReviewRequired: registry?.termsReviewRequired ?? false,
        raw: item,
        confidence: "retrieved",
        candidateOnly: true,
        generatedClaim: false,
        promotionStatus: "eligible_after_review",
        limitationNotes: ["DailyMed label candidate only; label section extraction/promotion requires review."],
      };
    });
    return { providerId, candidates, errors: [] };
  } catch (error) {
    return { providerId, candidates: [], errors: [error instanceof Error ? error.message : "DailyMed connector failed."] };
  }
}
