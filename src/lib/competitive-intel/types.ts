export type CiSeverity = "low" | "medium" | "high";

export type CiPicots = {
  population: string | null;
  intervention: string | null;
  comparison: string | null;
  outcome: string | null;
  timing: string | null;
  study_type: string | null;
};

export type CiTrialProgram = {
  trial_id: string;
  title: string;
  status: string | null;
  phase: string | null;
  n: number | null;
  primary_endpoint: string | null;
  secondary_endpoints: string[];
  completion_date: string | null;
  start_date: string | null;
  last_update_posted: string | null;
  sponsor: string | null;
  conditions: string[];
  interventions: string[];
  source_url: string;
  change_flag: string | null;
  picots: CiPicots;
};

export type CiPublication = {
  pmid: string | null;
  title: string;
  doi: string | null;
  authors: string[];
  journal: string | null;
  publication_date: string | null;
  abstract: string | null;
  key_findings: string | null;
  mechanism_of_action: string | null;
  source_url: string | null;
  picots: CiPicots;
};

export type CiCompetitor = {
  name: string;
  programs: CiTrialProgram[];
  publications: CiPublication[];
};

export type CiAlert = {
  alert_id: string;
  type: "new_trial" | "trial_ended" | "status_change" | "endpoint_change" | "enrollment_change" | "completion_shift" | "new_publication" | "source_gap";
  competitor: string;
  program: string;
  description: string;
  timestamp: string;
  severity: CiSeverity;
  trial_id: string | null;
  doi: string | null;
};

export type CiEvidenceGap = {
  competitor: string;
  gap: string;
  severity: CiSeverity;
  strategic_implication: string;
  source: string;
};

export type CiRecommendation = {
  recommendation: string;
  confidence: "low" | "moderate" | "high";
  source: string;
};

export type CiAudit = {
  sources_queried: string[];
  total_trials: number;
  total_publications: number;
  total_alerts: number;
  chain_id: string;
  deterministic: true;
  limitations: string[];
};

export type CompetitiveIntelRun = {
  run_id: string;
  indication: string;
  time_window_weeks: number;
  timestamp: string;
  competitors: CiCompetitor[];
  alerts: CiAlert[];
  evidence_gaps: CiEvidenceGap[];
  strategic_implications: CiRecommendation[];
  report_markdown: string;
  audit: CiAudit;
};

export type CompetitiveIntelRequest = {
  indication: string;
  competitors: string[];
  timeWindowWeeks: number;
  maxTrialsPerCompetitor: number;
  maxPublicationsPerCompetitor: number;
};

export type CompetitiveIntelResponse = {
  ok: boolean;
  result?: CompetitiveIntelRun;
  error?: string;
};
