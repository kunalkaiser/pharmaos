# EvidaraOS Source / Citation Deduplication

## Current Status

Phase B5 adds deduplication foundations for source and citation persistence.

Implemented:

- `source_canonical_key` on `evidence_sources`
- `citation_hash` on `citations`
- unique indexes for canonical sources and citation hashes
- source key helper that prioritizes PMID, PMCID, DOI, NCT ID, FDA identifier, then URL
- citation hash helper based on source, source identifier, extracted field, and citation text
- create helpers return an existing source/citation when an exact canonical duplicate exists

## What This Prevents

- duplicate PubMed sources with the same PMID
- duplicate ClinicalTrials.gov sources with the same NCT ID
- duplicate FDA/openFDA sources with the same FDA identifier
- duplicate URL-only sources
- repeated identical citations for the same source and extracted field

## What Is Not Implemented Yet

- human merge workflow for ambiguous duplicates
- admin UI for source reconciliation
- audit event specifically for dedup/merge decisions
- cross-tenant source-sharing policy
- source quality ranking among duplicate candidates

Ambiguous duplicates should remain separate until reviewed. Deduplication must not merge contradictory evidence automatically.
