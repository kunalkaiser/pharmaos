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
  max_results?: number;
  live_search?: boolean;
};

export type EvidenceEngineRunResponse = {
  chain: EvidenceEngineChain;
  status: string;
  artifacts: Record<string, unknown>;
  limitations: string[];
};

export type EvidenceEngineHealth = {
  status?: string;
  runtime?: string;
  llm_required?: string;
};
