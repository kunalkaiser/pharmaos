import "server-only";

import { getRegistryEntry } from "./source-registry";
import type { ConnectorSearchParams, ConnectorSearchResult, EvidenceCandidate } from "./types";
import { fetchJson, sanitizeQuery, stableCandidateId, today } from "./http";

type GdcResponse = { data?: { hits?: Array<{ case_id?: string; submitter_id?: string; disease_type?: string; primary_site?: string }> } };

export async function searchGdc(params: ConnectorSearchParams): Promise<ConnectorSearchResult> {
  const providerId = "gdc";
  const registry = getRegistryEntry(providerId);
  const query = sanitizeQuery(params.query);
  const retrievedAt = new Date().toISOString();
  const accessDate = today();

  try {
    const filters = encodeURIComponent(JSON.stringify({ op: "in", content: { field: "cases.disease_type", value: [query] } }));
    const url = `https://api.gdc.cancer.gov/cases?filters=${filters}&size=${params.maxResults}&fields=case_id,submitter_id,disease_type,primary_site&format=JSON`;
    const data = await fetchJson<GdcResponse>(url, params.timeoutMs);
    const candidates: EvidenceCandidate[] = (data.data?.hits ?? []).slice(0, params.maxResults).map((item) => {
      const id = item.case_id ?? item.submitter_id ?? query;
      return {
        candidateId: stableCandidateId(providerId, id),
        sourceProvider: providerId,
        sourceDisplayName: registry?.displayName ?? "NCI GDC",
        sourceCategory: "genomics",
        sourceType: "genomic_dataset",
        sourceIdentifier: id,
        sourceTitle: item.disease_type ?? `GDC public metadata ${id}`,
        sourceUrl: `https://portal.gdc.cancer.gov/cases/${id}`,
        accessDate,
        retrievedAt,
        disease: item.disease_type,
        datasetName: "NCI GDC public case metadata",
        sourceLicenseNote: "GDC public metadata candidate only; controlled-access data is excluded.",
        termsReviewRequired: registry?.termsReviewRequired ?? true,
        raw: item,
        confidence: "partial",
        candidateOnly: true,
        generatedClaim: false,
        promotionStatus: "not_promoted",
        limitationNotes: ["Public metadata candidate only; no controlled genomic data is accessed."],
      };
    });
    return { providerId, candidates, errors: [] };
  } catch (error) {
    return { providerId, candidates: [], errors: [error instanceof Error ? error.message : "GDC connector failed."] };
  }
}
