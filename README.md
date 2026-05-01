# EvidaraOS Website

Enterprise website prototype for EvidaraOS, a white-box pharmaceutical evidence operating system for US biotech and pharma teams.

## Product Hierarchy

- EvidaraOS: parent platform
- EvidenceOS: multi-agent biomedical reasoning engine
- EpiEngine: epidemiology, RWE, disease burden, and indication analytics module

## Current Scope

This repository is a Next.js App Router product site. It contains buyer-facing pages, interactive workflow previews, static/sample evidence content, a real demo request submission endpoint, an internal citation/provenance schema foundation, and internal seeded evidence packet API routes for development validation.

The current repo does not include backend services for live evidence retrieval, authentication, report generation, or agent execution. Pages that describe those workflows should be treated as product models, sample artifacts, or implementation requirements unless connected to backend services later.

Demo requests submitted from `/demo` are real and are persisted by `POST /api/demo-requests`. By default, local submissions are appended to `.evidara-data/demo-requests.jsonl`; set `EVIDARA_STORAGE_DIR` to choose another writable storage directory for the runtime. The demo workflow preview remains illustrative only and does not run evidence retrieval or generate reports.

The Phase 2 citation/provenance foundation defines the intended relational schema in `db/migrations/0001_citation_provenance_foundation.sql` and typed local helpers in `src/lib/evidence-foundation.ts`. These helpers can seed and validate source, citation, evidence packet, retrieval-run, evidence-record, and audit-log primitives for internal development. This is not live evidence retrieval and is not connected to the public website.

The Phase 3 seeded evidence packet API exposes internal-development endpoints under `/api/internal/evidence-packets`. These endpoints return manually seeded evidence only, include citation/source provenance on every evidence record, and do not call PubMed, ClinicalTrials.gov, FDA, or any external retrieval service. They are not connected to the public website or `/app` UI and must be protected with auth/RBAC before production use.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run seed:evidence-foundation
npm run validate:evidence-foundation
npm run validate:seeded-packet-api
npm run validate:provenance-db
```

## Primary Routes

- `/` Platform
- `/solutions`
- `/evidence-engine`
- `/data-methodology`
- `/security-trust`
- `/resources`
- `/company`
- `/demo`

## Authenticated Workspace Scaffold

These routes establish the future product boundary. They are scaffold-only pages until authentication, evidence packet persistence, retrieval, scoring, reporting, and audit services are implemented.

- `/app`
- `/app/evidence-packets`
- `/app/evidence-packets/[id]`
- `/app/sources`
- `/app/reports/[id]`
- `/app/audit-log`

## Admin Workspace Scaffold

These routes establish the future internal/admin boundary. They are scaffold-only pages until admin authentication, demo request review, retrieval monitoring, source management, and enforced audit services are implemented.

- `/admin`
- `/admin/demo-requests`
- `/admin/retrieval-runs`
- `/admin/sources`
- `/admin/audit-log`

## Backend Routes

- `POST /api/demo-requests`: validates and persists a demo request.
- `GET /api/internal/evidence-packets`: internal-development endpoint for manually seeded evidence packets only.
- `GET /api/internal/evidence-packets/[id]`: internal-development endpoint for one manually seeded packet.
- `GET /api/internal/evidence-packets/[id]/citations`: internal-development endpoint for one manually seeded packet citation appendix.

## Internal Data Foundation

- `db/migrations/0001_citation_provenance_foundation.sql`: planned PostgreSQL schema for evidence sources, citations, evidence packets, retrieval runs, evidence records, and audit logs.
- `db/validation/0001_provenance_constraints.sql`: disposable-database validation script proving source -> citation -> evidence record constraints.
- `src/lib/evidence-foundation.ts`: typed server-only helpers with validation that evidence records require both a citation and an evidence source.
- `scripts/seed-evidence-foundation.mjs`: seeds one manually cited obstructive sleep apnea disease burden record for internal schema validation only.
- `scripts/validate-evidence-foundation.mjs`: validates that an evidence record cannot be created without citation/source provenance.
- `scripts/validate-seeded-packet-api.mjs`: validates that the internal seeded packet response has citation/source provenance and does not call live retrieval sources.
- `docs/product-boundary.md`: explains the public website, authenticated product workspace, and internal admin workspace boundary.
- `docs/evidence-provenance-schema.md`: explains the evidence provenance schema, constraints, internal seed, and validation commands.
- `docs/evidence-packet-api.md`: explains internal seeded packet endpoints, response shape, provenance rules, and production protection requirements.

## Legacy / Supporting Routes

- `/architecture`
- `/query-journey`
- `/chains`
- `/agents`
- `/governance`

## Development Notes

- Styling uses Tailwind CSS.
- Shared editable content lives in `src/lib/evidara-content.ts`.
- Reusable UI components live in `src/components`.
- Local demo request persistence lives in `.evidara-data`, which is ignored by git.
- Local citation/provenance seed data also lives in `.evidara-data` and is ignored by git.
- `/app/*` and `/admin/*` are route-boundary scaffolds only. They do not fake auth, retrieval, reports, admin data, or audit enforcement.
- Internal seeded packet APIs are for development validation only. They do not implement live retrieval, scoring, reports, auth, or production audit enforcement.
- `validate:provenance-db` requires a disposable PostgreSQL database and `DATABASE_URL`; do not run it against production data.
- Avoid fake customer logos, fake testimonials, or claims of live backend functionality unless corresponding code paths exist.
