CREATE TABLE IF NOT EXISTS candidate_rejections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations (id) ON DELETE RESTRICT,
  query_run_id UUID,
  candidate_id TEXT NOT NULL,
  candidate_hash TEXT NOT NULL,
  source_provider TEXT NOT NULL,
  source_identifier TEXT,
  source_title TEXT NOT NULL,
  source_url TEXT NOT NULL,
  rejection_reason TEXT NOT NULL,
  reviewer_notes TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  reviewer_email TEXT,
  rejected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS candidate_rejections_organization_id_idx ON candidate_rejections (organization_id);
CREATE INDEX IF NOT EXISTS candidate_rejections_query_run_id_idx ON candidate_rejections (query_run_id);
CREATE INDEX IF NOT EXISTS candidate_rejections_candidate_hash_idx ON candidate_rejections (candidate_hash);
CREATE INDEX IF NOT EXISTS candidate_rejections_reviewer_id_idx ON candidate_rejections (reviewer_id);
