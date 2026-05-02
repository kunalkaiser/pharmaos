ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS previous_event_hash TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS event_hash TEXT;

CREATE INDEX IF NOT EXISTS audit_logs_event_hash_idx ON audit_logs (event_hash);
CREATE INDEX IF NOT EXISTS audit_logs_previous_event_hash_idx ON audit_logs (previous_event_hash);

CREATE OR REPLACE FUNCTION prevent_audit_log_update_delete()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs are append-only through normal application paths';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_prevent_update ON audit_logs;
CREATE TRIGGER audit_logs_prevent_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_update_delete();

DROP TRIGGER IF EXISTS audit_logs_prevent_delete ON audit_logs;
CREATE TRIGGER audit_logs_prevent_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_update_delete();
