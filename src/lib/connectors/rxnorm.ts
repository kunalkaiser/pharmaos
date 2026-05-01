import "server-only";

import { getRegistryEntry } from "./source-registry";
import type { ConnectorSearchParams, ConnectorSearchResult, EvidenceCandidate } from "./types";
import { fetchJson, sanitizeQuery, stableCandidateId, today } from "./http";

type RxNormResponse = { drugGroup?: { conceptGroup?: Array<{ conceptProperties?: Array<{ rxcui?: string; name?: string; synonym?: string; tty?: string }> }> } };

export async function searchRxNorm(params: ConnectorSearchParams): Promise<ConnectorSearchResult> {
  const providerId = "rxnorm";
  const registry = getRegistryEntry(providerId);
  const query = sanitizeQuery(params.query);
  const retrievedAt = new Date().toISOString();
  const accessDate = today();

  try {
    const data = await fetchJson<RxNormResponse>(`https://rxnav.nlm.nih.gov/REST/drugs.json?name=${encodeURIComponent(query)}`, params.timeoutMs);
    const concepts = (data.drugGroup?.conceptGroup ?? []).flatMap((group) => group.conceptProperties ?? []).slice(0, params.maxResults);
    const candidates: EvidenceCandidate[] = concepts.map((concept) => ({
      candidateId: stableCandidateId(providerId, concept.rxcui ?? concept.name ?? query),
      sourceProvider: providerId,
      sourceDisplayName: registry?.displayName ?? "RxNorm",
      sourceCategory: "terminology",
      sourceType: "terminology",
      sourceIdentifier: concept.rxcui ? `RxCUI:${concept.rxcui}` : undefined,
      sourceTitle: concept.name ?? query,
      sourceUrl: concept.rxcui ? `https://rxnav.nlm.nih.gov/REST/rxcui/${concept.rxcui}/allProperties.json` : "https://rxnav.nlm.nih.gov/",
      accessDate,
      retrievedAt,
      drug: concept.name,
      evidenceText: concept.synonym,
      sourceLicenseNote: "RxNorm public API normalization candidate.",
      termsReviewRequired: registry?.termsReviewRequired ?? false,
      raw: concept,
      confidence: "retrieved",
      candidateOnly: true,
      generatedClaim: false,
      promotionStatus: "not_promoted",
      limitationNotes: ["Terminology normalization candidate only; not clinical evidence."],
    }));
    return { providerId, candidates, errors: [] };
  } catch (error) {
    return { providerId, candidates: [], errors: [error instanceof Error ? error.message : "RxNorm connector failed."] };
  }
}
