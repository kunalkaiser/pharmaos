# Evidence Provenance Schema

## Purpose

Phase 2 adds the citation/provenance foundation for future EvidaraOS evidence packets. It defines how source records, citations, evidence records, evidence packets, retrieval runs, and audit log entries should relate before live retrieval or report generation exists.

This is schema and internal tooling only. It is not connected to the public website, `/app`, or `/admin` UI.

## Tables

### `evidence_sources`

Stores normalized source metadata.

Key fields:

- `source_type`
- `title`
- `url`
- `pmid`
- `pmcid`
- `doi`
- `nct_id`
- `fda_identifier`
- `publisher`
- `publication_date`
- `access_date`
- `metadata_json`

### `citations`

Stores citation records tied to a valid source.

Key rule:

- `citations.evidence_source_id` is required and references `evidence_sources.id`.

Key fields:

- `evidence_source_id`
- `citation_text`
- `source_identifier`
- `access_date`
- `extracted_field`
- `extraction_confidence`
- `human_review_status`
- `limitation_notes`

### `evidence_packets`

Stores future evidence packet shells.

Key fields:

- `title`
- `disease_or_indication`
- `geography`
- `intended_use`
- `status`
- `created_by`

### `retrieval_runs`

Stores future retrieval workflow runs.

Current status:

- Schema only.
- No live retrieval worker exists.

Key rule:

- `retrieval_runs.evidence_packet_id` references `evidence_packets.id`.

### `evidence_records`

Stores extracted claims/facts tied to evidence packets and citations.

Key rules:

- `evidence_records.evidence_packet_id` references `evidence_packets.id`.
- `evidence_records.citation_id` is required and references `citations.id`.
- Because citations require sources, an evidence record cannot have valid provenance unless the full source -> citation -> evidence_record chain exists.

Key fields:

- `record_type`
- `claim_text`
- `extracted_field`
- `value_text`
- `unit`
- `geography`
- `confidence_label`
- `limitation_notes`

### `audit_logs`

Stores future audit events.

Current status:

- Schema foundation only.
- Full user-linked audit enforcement requires future auth/RBAC.
- Actor fields are nullable or system-scoped because authenticated users are not implemented yet.

Key fields:

- `actor_id`
- `actor_type`
- `event_type`
- `entity_type`
- `entity_id`
- `metadata_json`

## Provenance Constraints

Database constraints enforce:

- citations require a valid evidence source
- evidence records require a valid citation
- retrieval runs require a valid evidence packet
- evidence records require a valid evidence packet

Application helpers additionally validate:

- evidence sources include at least one source identifier or URL
- evidence records cannot be created through helpers unless the citation and source exist

## Real-Only Evidence Policy

Seeded/manual biomedical evidence paths are retired. The repository must not use seeded disease claims, demo evidence packets, fake citations, or biomedical fixtures in product or internal API flows.

Evidence candidates should come from real public-source connector results, then move through review before becoming citations or evidence records. Public pages remain explanatory and do not display fake evidence rows.

## Validation

Local application-level validation:

```bash
npm run validate:evidence-foundation
```

Database-level constraint validation, requiring a disposable PostgreSQL database and `DATABASE_URL`:

```bash
npm run validate:provenance-db
```

The database validation script opens a transaction and rolls it back. It verifies that:

- a citation cannot be inserted with a missing source
- an evidence record cannot be inserted with a missing citation
- a valid source -> citation -> evidence_record chain succeeds using neutral schema-validation rows, not biomedical fixture evidence

## Not Implemented

Phase 2 does not implement:

- live evidence retrieval
- auth/RBAC
- report generation/export
- EpiEngine scoring
- public evidence packet views
- `/app` evidence packet UI integration
- `/admin` operational data integration
- user-linked audit enforcement
