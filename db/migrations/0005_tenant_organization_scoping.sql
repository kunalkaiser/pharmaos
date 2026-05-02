CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS organizations_status_idx ON organizations (status);

CREATE TABLE IF NOT EXISTS user_organizations (
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
  role_key TEXT NOT NULL REFERENCES roles (role_key) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, organization_id, role_key)
);

CREATE INDEX IF NOT EXISTS user_organizations_user_id_idx ON user_organizations (user_id);
CREATE INDEX IF NOT EXISTS user_organizations_organization_id_idx ON user_organizations (organization_id);

ALTER TABLE evidence_sources ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations (id) ON DELETE RESTRICT;
ALTER TABLE citations ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations (id) ON DELETE RESTRICT;
ALTER TABLE evidence_packets ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations (id) ON DELETE RESTRICT;
ALTER TABLE retrieval_runs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations (id) ON DELETE RESTRICT;
ALTER TABLE evidence_records ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations (id) ON DELETE RESTRICT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations (id) ON DELETE RESTRICT;
ALTER TABLE query_runs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations (id) ON DELETE RESTRICT;
ALTER TABLE query_source_events ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations (id) ON DELETE RESTRICT;
ALTER TABLE query_candidate_events ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations (id) ON DELETE RESTRICT;
ALTER TABLE query_errors ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations (id) ON DELETE RESTRICT;
ALTER TABLE query_audit_snapshots ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations (id) ON DELETE RESTRICT;
ALTER TABLE candidate_promotions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations (id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS evidence_sources_organization_id_idx ON evidence_sources (organization_id);
CREATE INDEX IF NOT EXISTS citations_organization_id_idx ON citations (organization_id);
CREATE INDEX IF NOT EXISTS evidence_packets_organization_id_idx ON evidence_packets (organization_id);
CREATE INDEX IF NOT EXISTS retrieval_runs_organization_id_idx ON retrieval_runs (organization_id);
CREATE INDEX IF NOT EXISTS evidence_records_organization_id_idx ON evidence_records (organization_id);
CREATE INDEX IF NOT EXISTS audit_logs_organization_id_idx ON audit_logs (organization_id);
CREATE INDEX IF NOT EXISTS query_runs_organization_id_idx ON query_runs (organization_id);
CREATE INDEX IF NOT EXISTS query_source_events_organization_id_idx ON query_source_events (organization_id);
CREATE INDEX IF NOT EXISTS query_candidate_events_organization_id_idx ON query_candidate_events (organization_id);
CREATE INDEX IF NOT EXISTS query_errors_organization_id_idx ON query_errors (organization_id);
CREATE INDEX IF NOT EXISTS query_audit_snapshots_organization_id_idx ON query_audit_snapshots (organization_id);
CREATE INDEX IF NOT EXISTS candidate_promotions_organization_id_idx ON candidate_promotions (organization_id);
