CREATE TABLE IF NOT EXISTS report_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations (id) ON DELETE RESTRICT,
  evidence_packet_id UUID NOT NULL REFERENCES evidence_packets (id) ON DELETE CASCADE,
  export_type TEXT NOT NULL DEFAULT 'pdf' CHECK (export_type IN ('pdf')),
  status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'failed')),
  file_name TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  generated_by TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS report_exports_organization_id_idx ON report_exports (organization_id);
CREATE INDEX IF NOT EXISTS report_exports_evidence_packet_id_idx ON report_exports (evidence_packet_id);
CREATE INDEX IF NOT EXISTS report_exports_generated_at_idx ON report_exports (generated_at DESC);
