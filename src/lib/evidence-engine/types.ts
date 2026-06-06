import "server-only";

export const evidenceEngineChainIds = [
  "payer_brief",
  "full_slr",
  "heor_foundation",
  "safety_review",
  "repurposing",
  "regulatory",
  "genomics",
  "trial_intelligence",
  "full_discovery",
  "rapid_scan",
] as const;

export type EvidenceEngineChainId = (typeof evidenceEngineChainIds)[number];

export type EvidenceEngineChain = {
  id: EvidenceEngineChainId;
  name: string;
  deterministic_python: boolean;
  llm_strengthens: string[];
  status: "available" | "partial" | "planned";
  outputs: string[];
};

export type EvidenceEngineRunRequest = {
  chain_id: EvidenceEngineChainId;
  question: string;
  drug?: string;
  indication?: string;
  framework?: string;
  population?: string;
  intervention_or_exposure?: string;
  comparator?: string;
  outcomes?: string[];
  timeframe?: string;
  context?: string;
  max_results?: number;
  live_search?: boolean;
};

export type EvidenceEngineRunResponse = {
  chain: EvidenceEngineChain;
  status: string;
  artifacts: Record<string, unknown>;
  limitations: string[];
};

export type EvidenceEngineProtocolRequest = {
  question: string;
  framework?: string;
};

export type EvidenceEngineProtocolResponse = {
  pico: {
    question: string;
    framework: string;
    population: string;
    intervention_or_exposure: string;
    comparator: string;
    outcomes: string[];
    timeframe?: string;
    context: string;
    framework_details?: Record<string, unknown>;
    disease_class?: string;
    domain_rule_set?: string;
    disease_modifiers?: string[];
    domain_rules_applied?: string[];
    inferred_elements?: string[];
    inference_records?: Array<Record<string, string>>;
    picots_complete?: boolean;
    human_review_required?: boolean;
    protocol_warnings?: string[];
    review_type_recommendation?: ReviewTypeRecommendation;
    review_type?: string;
    review_type_confidence?: number;
    recommended_review_framework?: string;
    reporting_guideline?: string;
    notes?: string;
  };
  framework: Record<string, unknown>;
  review_type_recommendation?: ReviewTypeRecommendation;
  inclusion_criteria: string[];
  exclusion_criteria: string[];
};

export type ReviewTypeRecommendation = {
  review_type: string;
  label: string;
  confidence: number;
  rationale: string;
  recommended_framework: string;
  reporting_guideline: string;
  appraisal_tools: string[];
  method_requirements: string[];
  expected_outputs: string[];
  evidence_handling: string;
  warnings: string[];
};

export type EvidenceEnginePdfExtractionRequest = {
  question: string;
  title: string;
  doi?: string;
  pmid?: string;
  source_url?: string;
  filename?: string;
  source_text?: string;
  pdf_base64?: string;
  population?: string;
  intervention_or_exposure?: string;
  comparator?: string;
  outcomes?: string[];
};

export type EvidenceEnginePdfExtractionResponse = {
  status: string;
  record: Record<string, unknown>;
  coding_form: Record<string, unknown>;
  extracted_signals: Record<string, unknown>;
  provenance: Record<string, unknown>;
  limitations: string[];
};

export type EvidenceEngineDocumentChatRequest = {
  question: string;
  title?: string;
  doi?: string;
  pmid?: string;
  source_url?: string;
  filename?: string;
  source_text?: string;
  pdf_base64?: string;
  docx_base64?: string;
};

export type EvidenceEngineDocumentChatResponse = {
  status: string;
  answer: string;
  snippets: Array<Record<string, unknown>>;
  extracted_fields: Array<Record<string, string>>;
  extracted_signals: Record<string, unknown>;
  record: Record<string, unknown>;
  provenance: Record<string, unknown>;
  limitations: string[];
};

export type EvidenceEngineExportRequest = {
  title: string;
  markdown: string;
  format: "markdown" | "pdf" | "pptx";
  charts?: Record<string, string>;
};

export type EvidenceEngineExportResponse = {
  filename: string;
  media_type: string;
  base64_content: string;
  warnings: string[];
};

export type EvidenceEngineHealth = {
  status?: string;
  runtime?: string;
  llm_required?: string;
};

export type EvidenceEngineUniversalQueryRequest = {
  question: string;
  max_results?: number;
  live_search?: boolean;
  include_faers?: boolean;
};

export type EvidenceEngineHydrateRecordRequest = {
  record: Record<string, unknown>;
};

export type EvidenceEngineFaersRequest = {
  drug: string;
  indication?: string;
  max_results?: number;
  live_fetch?: boolean;
};

export type EvidenceEngineTrialsRequest = {
  condition?: string;
  intervention?: string;
  query?: string;
  max_results?: number;
  live_fetch?: boolean;
};

export type EvidenceEngineLabelRequest = {
  drug: string;
  max_results?: number;
  live_fetch?: boolean;
};

export type EvidenceEnginePipelineRunRequest = {
  question: string;
  kind?: "universal_query" | "full_slr" | "safety_review";
  max_results?: number;
  live_search?: boolean;
  include_faers?: boolean;
  metadata?: Record<string, unknown>;
};
