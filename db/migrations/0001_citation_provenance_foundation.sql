-- EvidaraOS Phase 2 citation/provenance foundation.
-- This schema is intentionally limited to source, citation, packet, retrieval,
-- evidence-record, and audit-log primitives. It does not implement live
-- retrieval, scoring, report generation, auth, or agent execution.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS evidence_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL CHECK (
    source_type IN (
      'pubmed',
      'pubmed_central',
      'clinicaltrials_gov',
      'fda_label',
      'fda_drugs',
      'openfda',
      'dailymed',
      'rxnorm',
      'cdc',
      'nih',
      'who',
      'nci',
      'news_rss',
      'public_dataset',
      'cms',
      'manual_source'
    )
  ),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  pmid TEXT,
  pmcid TEXT,
  doi TEXT,
  nct_id TEXT,
  fda_identifier TEXT,
  publisher TEXT,
  publication_date DATE,
  access_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT evidence_sources_identifier_present CHECK (
    pmid IS NOT NULL
    OR pmcid IS NOT NULL
    OR doi IS NOT NULL
    OR nct_id IS NOT NULL
    OR fda_identifier IS NOT NULL
    OR url IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS evidence_sources_source_type_idx ON evidence_sources (source_type);
CREATE INDEX IF NOT EXISTS evidence_sources_pmid_idx ON evidence_sources (pmid);
CREATE INDEX IF NOT EXISTS evidence_sources_pmcid_idx ON evidence_sources (pmcid);
CREATE INDEX IF NOT EXISTS evidence_sources_nct_id_idx ON evidence_sources (nct_id);
CREATE INDEX IF NOT EXISTS evidence_sources_fda_identifier_idx ON evidence_sources (fda_identifier);
CREATE INDEX IF NOT EXISTS evidence_sources_url_idx ON evidence_sources (url);

CREATE TABLE IF NOT EXISTS citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_source_id UUID NOT NULL REFERENCES evidence_sources (id) ON DELETE RESTRICT,
  citation_text TEXT NOT NULL,
  source_identifier TEXT NOT NULL,
  access_date DATE NOT NULL DEFAULT CURRENT_DATE,
  extracted_field TEXT,
  extraction_confidence TEXT NOT NULL DEFAULT 'manual_reviewed' CHECK (
    extraction_confidence IN ('manual_reviewed', 'high', 'medium', 'low', 'unknown')
  ),
  human_review_status TEXT NOT NULL DEFAULT 'needs_review' CHECK (
    human_review_status IN ('needs_review', 'reviewed', 'approved', 'rejected')
  ),
  limitation_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS citations_evidence_source_id_idx ON citations (evidence_source_id);
CREATE INDEX IF NOT EXISTS citations_source_identifier_idx ON citations (source_identifier);
CREATE INDEX IF NOT EXISTS citations_human_review_status_idx ON citations (human_review_status);

CREATE TABLE IF NOT EXISTS evidence_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  disease_or_indication TEXT NOT NULL,
  geography TEXT NOT NULL DEFAULT 'United States',
  intended_use TEXT NOT NULL DEFAULT 'internal_review',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'retrieval_pending', 'retrieval_complete', 'review_ready', 'approved', 'archived')
  ),
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS evidence_packets_status_idx ON evidence_packets (status);
CREATE INDEX IF NOT EXISTS evidence_packets_disease_or_indication_idx ON evidence_packets (disease_or_indication);

CREATE TABLE IF NOT EXISTS retrieval_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_packet_id UUID NOT NULL REFERENCES evidence_packets (id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  source_types_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (
    status IN ('not_started', 'queued', 'running', 'completed', 'failed', 'cancelled')
  ),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS retrieval_runs_evidence_packet_id_idx ON retrieval_runs (evidence_packet_id);
CREATE INDEX IF NOT EXISTS retrieval_runs_status_idx ON retrieval_runs (status);

CREATE TABLE IF NOT EXISTS evidence_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_packet_id UUID NOT NULL REFERENCES evidence_packets (id) ON DELETE CASCADE,
  citation_id UUID NOT NULL REFERENCES citations (id) ON DELETE RESTRICT,
  record_type TEXT NOT NULL CHECK (
    record_type IN (
      'disease_overview',
      'incidence',
      'prevalence',
      'patient_population',
      'clinical_trial_landscape',
      'treatment_landscape',
      'unmet_need',
      'limitation'
    )
  ),
  claim_text TEXT NOT NULL,
  extracted_field TEXT,
  value_text TEXT,
  unit TEXT,
  geography TEXT NOT NULL DEFAULT 'United States',
  confidence_label TEXT NOT NULL DEFAULT 'manual_reviewed' CHECK (
    confidence_label IN ('manual_reviewed', 'high', 'medium', 'low', 'unknown')
  ),
  limitation_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS evidence_records_evidence_packet_id_idx ON evidence_records (evidence_packet_id);
CREATE INDEX IF NOT EXISTS evidence_records_citation_id_idx ON evidence_records (citation_id);
CREATE INDEX IF NOT EXISTS evidence_records_record_type_idx ON evidence_records (record_type);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id TEXT,
  actor_type TEXT NOT NULL DEFAULT 'system' CHECK (actor_type IN ('system', 'user', 'admin')),
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx ON audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_event_type_idx ON audit_logs (event_type);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at);
