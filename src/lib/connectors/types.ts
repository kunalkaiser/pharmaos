import "server-only";

export type SourceRegistryEntry = {
  providerId: string;
  displayName: string;
  category:
    | "literature"
    | "clinical_trials"
    | "regulatory"
    | "drug_label"
    | "drug_safety"
    | "epidemiology"
    | "genomics"
    | "terminology"
    | "patient_education_public"
    | "news_rss"
    | "market_company_public"
    | "global_health"
    | "public_dataset"
    | "licensed_or_restricted";
  accessMethod:
    | "official_api"
    | "downloadable_dataset"
    | "rss_feed"
    | "official_public_page"
    | "licensed_api"
    | "manual_review_required";
  publicAccessStatus:
    | "public_open"
    | "public_with_api_key"
    | "requires_free_account_or_license"
    | "restricted_or_licensed"
    | "not_implemented";
  termsReviewRequired: boolean;
  supportsLiveQuery: boolean;
  supportsBulkDownload: boolean;
  storesRawDataAllowed: boolean;
  claimPromotionAllowed: "yes_after_review" | "candidate_only" | "no";
  notes: string[];
};

export type EvidenceCandidate = {
  candidateId: string;
  sourceProvider: string;
  sourceDisplayName: string;
  sourceCategory: SourceRegistryEntry["category"];
  sourceType:
    | "literature"
    | "clinical_trial"
    | "drug_label"
    | "adverse_event"
    | "recall"
    | "regulatory_approval"
    | "epidemiology_dataset"
    | "genomic_dataset"
    | "terminology"
    | "patient_education"
    | "news_item"
    | "public_dataset";
  sourceIdentifier?: string;
  sourceTitle: string;
  sourceUrl: string;
  publicationDate?: string;
  accessDate: string;
  retrievedAt: string;
  evidenceText?: string;
  abstractText?: string;
  condition?: string;
  disease?: string;
  drug?: string;
  intervention?: string;
  trialPhase?: string;
  trialStatus?: string;
  studyDesign?: string;
  publicationTypes?: string[];
  labelSection?: string;
  geography?: string;
  datasetName?: string;
  sourceLicenseNote?: string;
  termsReviewRequired: boolean;
  raw?: unknown;
  confidence: "retrieved" | "partial" | "needs_review" | "restricted";
  candidateOnly: true;
  generatedClaim: false;
  promotionStatus: "not_promoted" | "eligible_after_review" | "not_eligible";
  limitationNotes: string[];
};

export type ConnectorSearchParams = {
  query: string;
  maxResults: number;
  timeoutMs: number;
};

export type ConnectorSearchResult = {
  providerId: string;
  candidates: EvidenceCandidate[];
  skipped?: { providerId: string; reason: string };
  errors: string[];
};

export type SourceConnector = {
  providerId: string;
  search(params: ConnectorSearchParams): Promise<ConnectorSearchResult>;
};
