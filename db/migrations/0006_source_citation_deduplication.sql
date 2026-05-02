ALTER TABLE evidence_sources ADD COLUMN IF NOT EXISTS source_canonical_key TEXT;
ALTER TABLE citations ADD COLUMN IF NOT EXISTS citation_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS evidence_sources_source_canonical_key_unique_idx
  ON evidence_sources (source_canonical_key)
  WHERE source_canonical_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS citations_citation_hash_unique_idx
  ON citations (citation_hash)
  WHERE citation_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS evidence_sources_dedup_identifiers_idx
  ON evidence_sources (pmid, pmcid, doi, nct_id, fda_identifier);
