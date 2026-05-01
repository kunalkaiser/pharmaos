import "server-only";

import { getRegistryEntry } from "./source-registry";
import type { ConnectorSearchParams, ConnectorSearchResult, EvidenceCandidate } from "./types";
import { fetchJson, sanitizeQuery, stableCandidateId, today } from "./http";

type OpenFdaResponse = { results?: Array<Record<string, unknown>> };

function text(value: unknown) {
  if (Array.isArray(value)) return value.filter(Boolean).join("; ");
  return typeof value === "string" ? value : undefined;
}

async function searchOpenFdaEndpoint(
  providerId: "openfda-label" | "openfda-faers" | "openfda-enforcement" | "openfda-ndc" | "openfda-drugsfda",
  params: ConnectorSearchParams
): Promise<ConnectorSearchResult> {
  const registry = getRegistryEntry(providerId);
  const query = sanitizeQuery(params.query);
  const retrievedAt = new Date().toISOString();
  const accessDate = today();
  const endpointMap = {
    "openfda-label": { url: "https://api.fda.gov/drug/label.json", search: `openfda.brand_name:${query}+openfda.generic_name:${query}`, type: "drug_label" as const },
    "openfda-faers": { url: "https://api.fda.gov/drug/event.json", search: `patient.drug.medicinalproduct:${query}`, type: "adverse_event" as const },
    "openfda-enforcement": { url: "https://api.fda.gov/drug/enforcement.json", search: `product_description:${query}`, type: "recall" as const },
    "openfda-ndc": { url: "https://api.fda.gov/drug/ndc.json", search: `brand_name:${query}+generic_name:${query}`, type: "drug_label" as const },
    "openfda-drugsfda": { url: "https://api.fda.gov/drug/drugsfda.json", search: `products.brand_name:${query}+products.active_ingredients.name:${query}`, type: "regulatory_approval" as const },
  }[providerId];

  try {
    const url = `${endpointMap.url}?search=${encodeURIComponent(endpointMap.search)}&limit=${params.maxResults}`;
    const data = await fetchJson<OpenFdaResponse>(url, params.timeoutMs);
    const candidates: EvidenceCandidate[] = (data.results ?? []).slice(0, params.maxResults).map((item, index) => {
      const openfda = item.openfda as Record<string, unknown> | undefined;
      const setId = text(item.set_id) ?? text(item.application_number) ?? text(item.product_ndc) ?? `${providerId}-${index + 1}`;
      const title = text(openfda?.brand_name) ?? text(item.brand_name) ?? text(item.product_description) ?? text(item.safetyreportid) ?? `${registry?.displayName ?? providerId} record ${setId}`;

      return {
        candidateId: stableCandidateId(providerId, setId),
        sourceProvider: providerId,
        sourceDisplayName: registry?.displayName ?? providerId,
        sourceCategory: registry?.category ?? "regulatory",
        sourceType: endpointMap.type,
        sourceIdentifier: setId,
        sourceTitle: title,
        sourceUrl: endpointMap.url,
        publicationDate: text(item.effective_time) ?? text(item.report_date) ?? text(item.recall_initiation_date),
        accessDate,
        retrievedAt,
        drug: text(openfda?.generic_name) ?? text(item.generic_name) ?? query,
        labelSection: text(item.indications_and_usage) ? "indications_and_usage" : undefined,
        evidenceText: text(item.indications_and_usage) ?? text(item.reason_for_recall) ?? text(item.serious),
        sourceLicenseNote: "openFDA public API candidate.",
        termsReviewRequired: registry?.termsReviewRequired ?? false,
        raw: item,
        confidence: "retrieved",
        candidateOnly: true,
        generatedClaim: false,
        promotionStatus: providerId === "openfda-faers" ? "not_eligible" : "eligible_after_review",
        limitationNotes: providerId === "openfda-faers"
          ? ["FAERS/openFDA adverse-event candidates are safety signals only and cannot establish causation."]
          : ["openFDA candidate only; review label/regulatory context before evidence promotion."],
      };
    });

    return { providerId, candidates, errors: [] };
  } catch (error) {
    return { providerId, candidates: [], errors: [error instanceof Error ? error.message : `${providerId} connector failed.`] };
  }
}

export function searchOpenFda(providerId: "openfda-label" | "openfda-faers" | "openfda-enforcement" | "openfda-ndc" | "openfda-drugsfda", params: ConnectorSearchParams) {
  return searchOpenFdaEndpoint(providerId, params);
}
