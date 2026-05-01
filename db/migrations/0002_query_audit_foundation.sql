CREATE TABLE IF NOT EXISTS query_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text TEXT NOT NULL,
  query_hash TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'completed', 'partial_failure', 'failed')),
  actor_type TEXT NOT NULL DEFAULT 'anonymous_internal' CHECK (actor_type IN ('anonymous_internal', 'system', 'future_user')),
  actor_id TEXT,
  access_context TEXT NOT NULL CHECK (access_context IN ('internal_api', 'app_workspace', 'admin_workspace')),
  live_retrieval BOOLEAN NOT NULL DEFAULT TRUE,
  generated_claims BOOLEAN NOT NULL DEFAULT FALSE,
  candidate_only BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS query_runs_query_hash_idx ON query_runs (query_hash);
CREATE INDEX IF NOT EXISTS query_runs_status_idx ON query_runs (status);
CREATE INDEX IF NOT EXISTS query_runs_initiated_at_idx ON query_runs (initiated_at DESC);

CREATE TABLE IF NOT EXISTS query_run_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_run_id UUID NOT NULL REFERENCES query_runs(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  step_type TEXT NOT NULL CHECK (step_type IN ('normalize_query', 'search_source', 'normalize_results', 'validate_provenance', 'return_candidates')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'completed', 'partial_failure', 'failed')),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS query_run_steps_query_run_id_idx ON query_run_steps (query_run_id);

CREATE TABLE IF NOT EXISTS query_source_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_run_id UUID NOT NULL REFERENCES query_runs(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL,
  endpoint_called TEXT,
  request_url_redacted TEXT,
  request_params_redacted JSONB,
  status_code INTEGER,
  result_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS query_source_events_query_run_id_idx ON query_source_events (query_run_id);
CREATE INDEX IF NOT EXISTS query_source_events_provider_id_idx ON query_source_events (provider_id);

CREATE TABLE IF NOT EXISTS query_candidate_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_run_id UUID NOT NULL REFERENCES query_runs(id) ON DELETE CASCADE,
  candidate_id TEXT NOT NULL,
  source_provider TEXT NOT NULL,
  source_identifier TEXT,
  source_title TEXT NOT NULL,
  source_url TEXT NOT NULL,
  candidate_hash TEXT NOT NULL,
  generated_claim BOOLEAN NOT NULL DEFAULT FALSE,
  promotion_status TEXT NOT NULL DEFAULT 'not_promoted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS query_candidate_events_query_run_id_idx ON query_candidate_events (query_run_id);
CREATE INDEX IF NOT EXISTS query_candidate_events_candidate_hash_idx ON query_candidate_events (candidate_hash);

CREATE TABLE IF NOT EXISTS query_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_run_id UUID NOT NULL REFERENCES query_runs(id) ON DELETE CASCADE,
  provider_id TEXT,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  recoverable BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS query_errors_query_run_id_idx ON query_errors (query_run_id);

CREATE TABLE IF NOT EXISTS query_audit_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_run_id UUID NOT NULL REFERENCES query_runs(id) ON DELETE CASCADE,
  snapshot_json JSONB NOT NULL,
  snapshot_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS query_audit_snapshots_query_run_id_idx ON query_audit_snapshots (query_run_id);
