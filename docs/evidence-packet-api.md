# Internal Seeded Evidence Packet API

## Status

Phase 3 adds internal-development API routes for manually seeded evidence packet data. These routes prove the provenance chain:

```text
evidence_source -> citation -> evidence_record -> evidence_packet
```

They do not perform live retrieval and must be protected with auth/RBAC before production use.

## Endpoints

### `GET /api/internal/evidence-packets`

Lists seeded/manual evidence packets.

Response shape:

```json
{
  "ok": true,
  "dataScope": "internal_manual_seed",
  "liveRetrieval": false,
  "authRequiredBeforeProduction": true,
  "packets": []
}
```

### `GET /api/internal/evidence-packets/[id]`

Returns one seeded/manual evidence packet.

Response includes:

- disease or indication name
- packet metadata
- structured sections
- evidence records with citation/source provenance
- citation appendix
- provenance metadata
- limitations

Invalid packet IDs return `404` with a safe error response.

### `GET /api/internal/evidence-packets/[id]/citations`

Returns the citation appendix for one seeded/manual packet.

## Evidence Record Provenance Shape

Every returned evidence record includes:

- `evidenceRecordId`
- `claimText`
- `evidenceType`
- `extractedField`
- `citationId`
- `sourceId`
- `sourceType`
- `sourceTitle`
- `sourceUrl`
- `sourceIdentifier`
- `pmid` when available
- `publicationDate` when available
- `accessDate`
- `extractionConfidence`
- `humanReviewStatus`
- `limitationNotes`

## Manual / Seeded Scope

Current seeded source:

- Disease/indication: obstructive sleep apnea
- Source type: PubMed
- PMID: `27568340`
- Source URL: `https://pubmed.ncbi.nlm.nih.gov/27568340/`

The packet is internal/manual seed data only. It is not live retrieval and is not connected to the public website.

## Not Implemented

These endpoints do not implement:

- live PubMed, ClinicalTrials.gov, FDA, or external API calls
- auth/RBAC
- EpiEngine scoring
- report generation/export
- user-linked audit enforcement
- public evidence packet pages
- `/app` product UI data binding
- `/admin` operational data binding

## Validation

Seed internal data:

```bash
npm run seed:evidence-foundation
```

Validate seeded packet API provenance assumptions:

```bash
npm run validate:seeded-packet-api
```

This validation checks:

- the seeded packet exists
- every evidence record has citation metadata
- every citation has source metadata
- invalid packet IDs do not resolve
- API/helper code does not call live retrieval sources

## Production Protection Requirements

Before production use, these internal routes require:

- authentication
- role-based access control
- organization/tenant scoping
- request logging
- user-linked audit enforcement
- rate limiting
- operational monitoring
