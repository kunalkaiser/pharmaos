# Public Source Connectors

## Status

EvidaraOS now has an internal, server-side public-source connector framework. It retrieves evidence candidates only. It does not generate final evidence claims, citations, evidence records, reports, scores, or audit-enforced product workflows.

The public website does not run live retrieval.

Latest live validation confirmed protected internal endpoint retrieval for PubMed, ClinicalTrials.gov, RxNorm, DailyMed, MedlinePlus, openFDA labels, openFDA FAERS, openFDA enforcement/recalls, openFDA NDC, and openFDA Drugs@FDA. These results remain `EvidenceCandidate` records only.

## Implemented Connectors

- PubMed / NCBI E-utilities
- ClinicalTrials.gov API v2
- openFDA drug labels
- openFDA FAERS adverse events
- openFDA drug enforcement / recalls
- openFDA NDC directory
- openFDA Drugs@FDA
- DailyMed SPL API
- MedlinePlus public education search
- RxNorm drug normalization
- CDC data.cdc.gov Socrata catalog search
- WHO Global Health Observatory indicator search
- NCI GDC public metadata search
- GDELT public news/media candidates
- Official RSS connector for FDA, FDA MedWatch, NIH, and CDC feeds

## Registered but Deferred

The registry also includes providers that are not implemented because they require legal review, licensing, account/API-key review, access confirmation, or a more careful source-specific design:

- PubMed Central / PMC
- Europe PMC
- Crossref
- Semantic Scholar
- bioRxiv / medRxiv
- Google Scholar
- EU Clinical Trials Register / CTIS
- WHO ICTRP
- FDA downloadable datasets
- FDA Orange Book
- FDA Purple Book
- CDC WONDER
- SEER / NCI public cancer statistics
- US Cancer Statistics
- Our World in Data health datasets
- cBioPortal
- GEO
- dbGaP
- TCGA controlled data
- UMLS
- ICD / SNOMED
- SEC EDGAR
- company investor relations RSS/press feeds

## Access Methods

Supported access methods are represented in `src/lib/connectors/source-registry.ts`:

- official API
- downloadable dataset
- RSS feed
- official public page
- licensed API
- manual review required

## Required Environment Variables

Optional:

- `NCBI_API_KEY`: server-only key for improved NCBI/PubMed rate limits.
- `EVIDARA_INTERNAL_ACCESS_TOKEN`: required to access `/api/internal/*`, `/app/*`, and `/admin/*`.

Do not use `NEXT_PUBLIC` for private keys.

## Normalization Model

Every connector returns `EvidenceCandidate` objects with:

- source provider
- source type
- source identifier
- source title
- source URL
- access date
- retrieval timestamp
- source metadata when safe
- terms review status
- confidence/provenance status
- limitation notes
- `candidateOnly: true`
- `generatedClaim: false`

## Candidate-Only Boundary

Retrieved records are not final evidence claims.

Promotion path for a future phase:

```text
EvidenceCandidate -> reviewed citation -> reviewed evidence_record -> evidence_packet
```

No connector writes final `evidence_records`.

## Legal / Terms Guardrails

Connectors must:

- use official APIs, public downloadable datasets, RSS feeds, or explicitly permitted public pages
- respect rate limits, API limits, terms, and robots policies
- avoid paywalled scraping
- avoid CAPTCHAs and bypass behavior
- avoid login-gated systems
- preserve access date and retrieval timestamp
- mark restricted/licensed providers clearly

## Patient Portal Boundary

This phase excludes private patient portals and EHR systems.

Not allowed:

- Epic/MyChart scraping
- Cerner portal scraping
- athena patient portal scraping
- private EHR access
- PHI collection

Future FHIR/EHR integration requires:

- explicit authorization
- consent model
- security review
- legal/compliance approval
- separate auth and audit design

## Rate Limits / Safety Controls

Current controls:

- required query parameter
- query length limit
- max result cap of 10
- connector timeout
- graceful partial failure
- no infinite pagination
- no bulk ingestion
- no automatic evidence promotion

## Internal API Routes

- `GET /api/internal/sources/registry`
- `GET /api/internal/connectors/search?query=...`
- `GET /api/internal/connectors/[provider]?query=...`
- `GET /api/internal/connectors/news?query=...`
- `GET /api/internal/connectors/health`
- `POST /api/internal/review/candidate-promotions`

These routes are protected by `src/proxy.ts` and require `EVIDARA_INTERNAL_ACCESS_TOKEN`.

Candidate promotion is review-gated. It can create a citation and optional evidence record only from a real `EvidenceCandidate` with `candidateOnly=true` and `generatedClaim=false`, and only when an internal reviewer supplies citation text, review notes, and attestation. It does not generate claims or run retrieval.

Connector health checks are internal-only. The default health route reports static registry/implementation status. `?live=true` explicitly calls real connector APIs with bounded smoke queries. If network/API access is unavailable, health checks report degraded/down status instead of fake success.

## Validation

```bash
npm run validate:public-source-connectors
npm run validate:real-connectors
npm run validate:connector-monitoring
EVIDARA_INTERNAL_ACCESS_TOKEN=<token> EVIDARA_CONNECTOR_BASE_URL=http://127.0.0.1:3002 npm run validate:live-connectors
```

`validate:public-source-connectors` and `validate:real-connectors` use registry/static/schema checks and do not require internet access.

`validate:live-connectors` requires:

- a running local app server
- `EVIDARA_INTERNAL_ACCESS_TOKEN`
- network access to official/public source APIs

If those prerequisites are unavailable, live checks must not be claimed as passing.
