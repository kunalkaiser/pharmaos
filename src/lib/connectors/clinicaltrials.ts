import "server-only";

import { getRegistryEntry } from "./source-registry";
import type { ConnectorSearchParams, ConnectorSearchResult, EvidenceCandidate } from "./types";
import { fetchJson, sanitizeQuery, stableCandidateId, today } from "./http";

type ClinicalTrialsResponse = { studies?: Array<{ protocolSection?: { identificationModule?: { nctId?: string; briefTitle?: string }; statusModule?: { overallStatus?: string; startDateStruct?: { date?: string } }; sponsorCollaboratorsModule?: { leadSponsor?: { name?: string } }; conditionsModule?: { conditions?: string[] }; armsInterventionsModule?: { interventions?: Array<{ name?: string }> }; designModule?: { phases?: string[] } } }> };

export async function searchClinicalTrials(params: ConnectorSearchParams): Promise<ConnectorSearchResult> {
  const providerId = "clinicaltrials";
  const registry = getRegistryEntry(providerId);
  const query = sanitizeQuery(params.query);
  const retrievedAt = new Date().toISOString();
  const accessDate = today();

  try {
    const url = `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(query)}&pageSize=${params.maxResults}&format=json`;
    const data = await fetchJson<ClinicalTrialsResponse>(url, params.timeoutMs);
    const candidates: EvidenceCandidate[] = (data.studies ?? []).slice(0, params.maxResults).map((study) => {
      const protocol = study.protocolSection;
      const nctId = protocol?.identificationModule?.nctId ?? "unknown-nct";
      const conditions = protocol?.conditionsModule?.conditions ?? [];
      const interventions = protocol?.armsInterventionsModule?.interventions?.map((item) => item.name).filter(Boolean) ?? [];

      return {
        candidateId: stableCandidateId(providerId, nctId),
        sourceProvider: providerId,
        sourceDisplayName: registry?.displayName ?? "ClinicalTrials.gov",
        sourceCategory: "clinical_trials",
        sourceType: "clinical_trial",
        sourceIdentifier: nctId,
        sourceTitle: protocol?.identificationModule?.briefTitle ?? `ClinicalTrials.gov study ${nctId}`,
        sourceUrl: `https://clinicaltrials.gov/study/${nctId}`,
        publicationDate: protocol?.statusModule?.startDateStruct?.date,
        accessDate,
        retrievedAt,
        condition: conditions.join("; ") || undefined,
        intervention: interventions.join("; ") || undefined,
        trialPhase: protocol?.designModule?.phases?.join("; "),
        trialStatus: protocol?.statusModule?.overallStatus,
        sourceLicenseNote: "ClinicalTrials.gov public API candidate.",
        termsReviewRequired: registry?.termsReviewRequired ?? false,
        raw: { leadSponsor: protocol?.sponsorCollaboratorsModule?.leadSponsor?.name },
        confidence: "retrieved",
        candidateOnly: true,
        generatedClaim: false,
        promotionStatus: "eligible_after_review",
        limitationNotes: ["Registry candidate only; trial records require review before evidence promotion."],
      };
    });

    return { providerId, candidates, errors: [] };
  } catch (error) {
    return { providerId, candidates: [], errors: [error instanceof Error ? error.message : "ClinicalTrials.gov connector failed."] };
  }
}
