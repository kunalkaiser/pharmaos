import "server-only";

import { getRegistryEntry } from "./source-registry";
import type { ConnectorSearchParams, ConnectorSearchResult, EvidenceCandidate } from "./types";
import { fetchJson, sanitizeQuery, stableCandidateId, today } from "./http";

type SocrataCatalog = { results?: Array<{ resource?: { id?: string; name?: string; description?: string; attribution?: string; updatedAt?: string } }> };

export async function searchCdcSocrata(params: ConnectorSearchParams): Promise<ConnectorSearchResult> {
  const providerId = "cdc-socrata";
  const registry = getRegistryEntry(providerId);
  const query = sanitizeQuery(params.query);
  const retrievedAt = new Date().toISOString();
  const accessDate = today();

  try {
    const data = await fetchJson<SocrataCatalog>(`https://api.us.socrata.com/api/catalog/v1?domains=data.cdc.gov&search_context=data.cdc.gov&limit=${params.maxResults}&search=${encodeURIComponent(query)}`, params.timeoutMs);
    const candidates: EvidenceCandidate[] = (data.results ?? []).slice(0, params.maxResults).map((item) => {
      const resource = item.resource ?? {};
      const id = resource.id ?? resource.name ?? query;
      return {
        candidateId: stableCandidateId(providerId, id),
        sourceProvider: providerId,
        sourceDisplayName: registry?.displayName ?? "CDC Socrata",
        sourceCategory: "public_dataset",
        sourceType: "public_dataset",
        sourceIdentifier: id,
        sourceTitle: resource.name ?? `CDC dataset ${id}`,
        sourceUrl: `https://data.cdc.gov/d/${id}`,
        publicationDate: resource.updatedAt,
        accessDate,
        retrievedAt,
        evidenceText: resource.description,
        datasetName: resource.name,
        sourceLicenseNote: "CDC data.cdc.gov catalog candidate; dataset-specific terms require review.",
        termsReviewRequired: registry?.termsReviewRequired ?? true,
        raw: resource,
        confidence: "partial",
        candidateOnly: true,
        generatedClaim: false,
        promotionStatus: "not_promoted",
        limitationNotes: ["Dataset catalog candidate only; does not retrieve rows or generate epidemiology facts."],
      };
    });
    return { providerId, candidates, errors: [] };
  } catch (error) {
    return { providerId, candidates: [], errors: [error instanceof Error ? error.message : "CDC Socrata connector failed."] };
  }
}
