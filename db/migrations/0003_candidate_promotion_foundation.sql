CREATE TABLE IF NOT EXISTS candidate_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_run_id UUID,
  candidate_id TEXT NOT NULL,
  candidate_hash TEXT NOT NULL,
  source_provider TEXT NOT NULL,
  source_identifier TEXT,
  source_title TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL,
  evidence_source_id UUID NOT NULL REFERENCES evidence_sources (id) ON DELETE RESTRICT,
  citation_id UUID NOT NULL REFERENCES citations (id) ON DELETE RESTRICT,
  evidence_record_id UUID REFERENCES evidence_records (id) ON DELETE SET NULL,
  evidence_packet_id UUID REFERENCES evidence_packets (id) ON DELETE SET NULL,
  candidate_only BOOLEAN NOT NULL DEFAULT TRUE CHECK (candidate_only IS TRUE),
  generated_claim BOOLEAN NOT NULL DEFAULT FALSE CHECK (generated_claim IS FALSE),
  promotion_status TEXT NOT NULL DEFAULT 'promoted_to_citation' CHECK (
    promotion_status IN ('promoted_to_citation', 'promoted_to_evidence_record', 'rejected')
  ),
  reviewer_attestation BOOLEAN NOT NULL CHECK (reviewer_attestation IS TRUE),
  reviewer_type TEXT NOT NULL DEFAULT 'anonymous_internal' CHECK (reviewer_type IN ('anonymous_internal', 'future_user', 'system')),
  reviewer_id TEXT,
  review_notes TEXT NOT NULL,
  limitation_notes TEXT,
  promoted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS candidate_promotions_candidate_hash_idx ON candidate_promotions (candidate_hash);
CREATE INDEX IF NOT EXISTS candidate_promotions_source_provider_idx ON candidate_promotions (source_provider);
CREATE INDEX IF NOT EXISTS candidate_promotions_citation_id_idx ON candidate_promotions (citation_id);
CREATE INDEX IF NOT EXISTS candidate_promotions_evidence_record_id_idx ON candidate_promotions (evidence_record_id);
