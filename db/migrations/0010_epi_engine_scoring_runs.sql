CREATE TABLE IF NOT EXISTS scoring_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations (id) ON DELETE RESTRICT,
  evidence_packet_id UUID NOT NULL REFERENCES evidence_packets (id) ON DELETE CASCADE,
  scoring_model TEXT NOT NULL DEFAULT 'epi_engine_v1_reviewed_evidence',
  scoring_version TEXT NOT NULL DEFAULT 'v1',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed')),
  score_json JSONB NOT NULL,
  limitations TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  generated_claims BOOLEAN NOT NULL DEFAULT FALSE CHECK (generated_claims IS FALSE),
  reviewer_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS scoring_runs_organization_id_idx ON scoring_runs (organization_id);
CREATE INDEX IF NOT EXISTS scoring_runs_evidence_packet_id_idx ON scoring_runs (evidence_packet_id);
CREATE INDEX IF NOT EXISTS scoring_runs_created_at_idx ON scoring_runs (created_at DESC);
