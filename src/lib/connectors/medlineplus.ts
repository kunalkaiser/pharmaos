import "server-only";

import { getRegistryEntry } from "./source-registry";
import type { ConnectorSearchParams, ConnectorSearchResult, EvidenceCandidate } from "./types";
import { fetchText, sanitizeQuery, stableCandidateId, today, xmlText } from "./http";

export async function searchMedlinePlus(params: ConnectorSearchParams): Promise<ConnectorSearchResult> {
  const providerId = "medlineplus";
  const registry = getRegistryEntry(providerId);
  const query = sanitizeQuery(params.query);
  const retrievedAt = new Date().toISOString();
  const accessDate = today();

  try {
    const xml = await fetchText(`https://wsearch.nlm.nih.gov/ws/query?db=healthTopics&term=${encodeURIComponent(query)}&retmax=${params.maxResults}`, params.timeoutMs);
    const docs = [...xml.matchAll(/<document[\s\S]*?<\/document>/gi)].slice(0, params.maxResults);
    const candidates: EvidenceCandidate[] = docs.map((doc, index) => {
      const item = doc[0];
      const title = xmlText(item, "content") || `MedlinePlus topic ${index + 1}`;
      const url = item.match(/url="([^"]+)"/i)?.[1] ?? "https://medlineplus.gov/";
      return {
        candidateId: stableCandidateId(providerId, url),
        sourceProvider: providerId,
        sourceDisplayName: registry?.displayName ?? "MedlinePlus",
        sourceCategory: "patient_education_public",
        sourceType: "patient_education",
        sourceIdentifier: url,
        sourceTitle: title,
        sourceUrl: url,
        accessDate,
        retrievedAt,
        disease: query,
        sourceLicenseNote: "MedlinePlus public education candidate. Patient portals/EHRs are excluded.",
        termsReviewRequired: registry?.termsReviewRequired ?? false,
        confidence: "retrieved",
        candidateOnly: true,
        generatedClaim: false,
        promotionStatus: "not_promoted",
        limitationNotes: ["Patient-facing public education candidate only; not private patient data and not a clinical evidence claim."],
      };
    });
    return { providerId, candidates, errors: [] };
  } catch (error) {
    return { providerId, candidates: [], errors: [error instanceof Error ? error.message : "MedlinePlus connector failed."] };
  }
}
