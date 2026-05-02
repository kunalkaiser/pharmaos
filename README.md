# EvidaraOS Website

Enterprise website prototype for EvidaraOS, a white-box pharmaceutical evidence operating system for US biotech and pharma teams.

## Product Hierarchy

- EvidaraOS: parent platform
- EvidenceOS: multi-agent biomedical reasoning engine
- EpiEngine: epidemiology, RWE, disease burden, and indication analytics module

## Current Scope

This repository is a Next.js App Router product site. It contains buyer-facing pages, interactive workflow previews, a real demo request submission endpoint, an internal citation/provenance schema foundation, real-only public-source connector candidates, and query audit trail foundations.

The current repo does not include authentication, report generation, EpiEngine scoring, or agent execution. Pages that describe those workflows should be treated as product models or implementation requirements unless connected to backend services later.

Demo requests submitted from `/demo` are real and are persisted by `POST /api/demo-requests`. By default, local submissions are appended to `.evidara-data/demo-requests.jsonl`; set `EVIDARA_STORAGE_DIR` to choose another writable storage directory for the runtime. The demo workflow preview remains illustrative only and does not run evidence retrieval or generate reports.

The Phase 2 citation/provenance foundation defines the intended relational schema in `db/migrations/0001_citation_provenance_foundation.sql` and typed local helpers in `src/lib/evidence-foundation.ts`. These helpers validate source, citation, evidence packet, retrieval-run, evidence-record, and audit-log primitives for internal development. Evidence records require citation/source provenance. This is not connected to the public website.

Seeded/manual evidence packet APIs have been retired. `/api/internal/evidence-packets` routes now return `410 Gone`. EvidaraOS product and internal API flows must use real public-source candidates or return nothing. Seeded/demo/fixture biomedical evidence is not permitted.

The current internal route boundary protects `/app/*`, `/admin/*`, and `/api/internal/*` with a temporary server-side token guard using `EVIDARA_INTERNAL_ACCESS_TOKEN`. This is not user authentication, RBAC, tenant isolation, or production audit enforcement. It creates no fake users or roles and should be replaced or extended with real auth/RBAC before production use.

The public-source connector framework exists under `src/lib/connectors` and internal API routes under `/api/internal/connectors`. Connectors are server-side only and return `EvidenceCandidate` records, not final evidence claims. They do not write `evidence_records`, generate reports, run EpiEngine scoring, collect PHI, access private patient portals, or connect to the public website.

Live internal connector validation currently covers PubMed, ClinicalTrials.gov, RxNorm, DailyMed, MedlinePlus, and openFDA labels as required providers, plus optional openFDA FAERS, enforcement/recalls, NDC, and Drugs@FDA checks. Live validation requires a running app server and `EVIDARA_INTERNAL_ACCESS_TOKEN`.

Connector runtime monitoring foundation now exists at `GET /api/internal/connectors/health`. Static health checks report registry/implementation status only. Live health checks require `?live=true`, internal access, a running server, and network availability; they call real connector APIs and do not report fake success.

Query audit foundations exist in `db/migrations/0002_query_audit_foundation.sql`, `src/lib/query-audit.ts`, and protected APIs under `/api/internal/audit/query-runs`. When `DATABASE_URL` is configured and migrations are applied, query-run, source-event, candidate-event, error, and snapshot records persist to PostgreSQL. Without `DATABASE_URL`, helpers fall back to `.evidara-data` local JSON for development only. This is not production audit immutability and does not create fake users.

Candidate promotion foundation exists under `POST /api/internal/review/candidate-promotions`. It can promote a real `EvidenceCandidate` into a reviewed citation and optional evidence record only when an internal reviewer supplies citation text, review notes, and attestation. It does not run retrieval, generate claims, summarize abstracts, or create fake reviewer identity.

Production persistence foundation now exists for evidence sources, citations, evidence records, evidence packets, retrieval runs, query audit tables, candidate promotions, and audit logs. Set server-only `DATABASE_URL` to enable PostgreSQL persistence. Do not expose database credentials through `NEXT_PUBLIC_*`.

Auth/RBAC foundation now exists with real user, role, password, login, logout, session, and route-protection primitives. No fake users are seeded. Set `DATABASE_URL` and `EVIDARA_AUTH_SESSION_SECRET`, apply `db/migrations/0004_auth_rbac_foundation.sql` and `db/migrations/0005_tenant_organization_scoping.sql`, then create a real user and organization with `npm run create:auth-user`. Production audit immutability, report generation/export, and EpiEngine scoring are still not implemented.

Tenant/organization scoping foundation now exists with real organization and membership schema plus organization-aware sessions. No fake tenants are seeded. Full tenant filtering across every API remains a beta hardening requirement before external use.

Source/citation deduplication foundation now exists with canonical source keys and citation hashes. Exact duplicate public sources/citations are reused by helpers, while ambiguous duplicate merge decisions remain a future human-review workflow.

Internal review queue UI now exists at `/app/review-queue`. It reads real query audit candidate events if present and otherwise shows an honest empty state. It does not render fake rows and does not enable promotion/rejection actions until the explicit review workflow is implemented.

Candidate rejection workflow foundation now exists at `POST /api/internal/review/candidate-rejections`. It requires authenticated reviewer identity, rejection reason, reviewer notes, database persistence, and writes an audit event. It does not delete candidate events or create fake reviewers.

Audit immutability foundation now exists with append-only database triggers for `audit_logs` and hash-chain helpers for new audit events. This is a technical foundation only; it is not a compliance certification or legal guarantee.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run validate:evidence-foundation
npm run validate:internal-access-boundary
npm run validate:public-source-connectors
npm run validate:real-connectors
npm run validate:live-connectors
npm run validate:real-only-evidence
npm run validate:query-audit
npm run validate:candidate-promotion
npm run validate:production-persistence
npm run validate:auth-rbac
npm run validate:tenant-scoping
npm run validate:connector-monitoring
npm run validate:source-citation-deduplication
npm run validate:review-queue-ui
npm run validate:candidate-rejection-workflow
npm run validate:audit-immutability
npm run create:auth-user
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
- `/app/review-queue`
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
- `GET /api/internal/evidence-packets`: retired seeded/manual endpoint; returns `410 Gone`.
- `GET /api/internal/evidence-packets/[id]`: retired seeded/manual endpoint; returns `410 Gone`.
- `GET /api/internal/evidence-packets/[id]/citations`: retired seeded/manual endpoint; returns `410 Gone`.
- `GET /api/internal/sources/registry`: internal source registry metadata.
- `GET /api/internal/connectors/search?query=...`: internal combined public-source candidate search.
- `GET /api/internal/connectors/[provider]?query=...`: internal single-provider candidate search.
- `GET /api/internal/connectors/news?query=...`: internal news/RSS/media-signal candidate search.
- `GET /api/internal/connectors/health?live=true`: internal connector runtime health checks; live checks are explicit and candidate-only.
- `GET /api/internal/audit/query-runs`: internal query audit run list.
- `GET /api/internal/audit/query-runs/[id]`: internal query audit trail for one run.
- `GET /api/internal/audit/query-runs/[id]/events`: internal query audit events for one run.
- `GET /api/internal/review/candidate-promotions`: internal candidate promotion list.
- `POST /api/internal/review/candidate-promotions`: promotes a real candidate into a reviewed citation and optional evidence record after internal review attestation.
- `GET/POST /api/internal/review/candidate-rejections`: records real candidate rejection decisions with reviewer identity and audit event.

Internal endpoint access:

- Preferred internal access is now signed authenticated session access created by `POST /api/auth/login` after applying auth migrations and creating a real user.
- Set `EVIDARA_AUTH_SESSION_SECRET` for signed workspace sessions.
- `EVIDARA_INTERNAL_ACCESS_TOKEN` remains a development fallback only until auth runtime rollout is complete.
- If neither auth sessions nor the temporary token are configured, protected routes fail closed.

## Internal Data Foundation

- `db/migrations/0001_citation_provenance_foundation.sql`: planned PostgreSQL schema for evidence sources, citations, evidence packets, retrieval runs, evidence records, and audit logs.
- `db/migrations/0002_query_audit_foundation.sql`: planned PostgreSQL schema for query runs, source events, candidate events, errors, and audit snapshots.
- `db/migrations/0003_candidate_promotion_foundation.sql`: planned PostgreSQL schema for reviewed candidate promotion records.
- `db/migrations/0004_auth_rbac_foundation.sql`: planned PostgreSQL schema for real users, roles, and user-role assignments.
- `db/migrations/0005_tenant_organization_scoping.sql`: planned PostgreSQL schema for organizations, memberships, and tenant-scoped evidence/audit columns.
- `db/migrations/0006_source_citation_deduplication.sql`: planned PostgreSQL schema for canonical source keys and citation hashes.
- `db/migrations/0008_audit_immutability_foundation.sql`: planned PostgreSQL schema/trigger foundation for append-only audit logs and event hashes.
- `src/lib/db/client.ts`: server-only PostgreSQL client used only when `DATABASE_URL` is configured.
- `src/lib/auth/*`: auth/RBAC helpers for password verification, signed session cookies, users, and route roles.
- `db/validation/0001_provenance_constraints.sql`: disposable-database validation script proving source -> citation -> evidence record constraints.
- `src/lib/evidence-foundation.ts`: typed server-only helpers with PostgreSQL persistence when `DATABASE_URL` exists and local JSON fallback for development only.
- `src/lib/query-audit.ts`: typed server-only query audit helpers with PostgreSQL persistence when `DATABASE_URL` exists and local JSON fallback for development only.
- `scripts/validate-evidence-foundation.mjs`: validates that an evidence record cannot be created without citation/source provenance.
- `scripts/validate-internal-access-boundary.mjs`: validates that internal route families are token-guarded without fake auth/users.
- `scripts/validate-real-connectors.mjs`: validates real-only connector boundaries, candidate-only results, and audit wiring.
- `scripts/validate-live-connectors.mjs`: live-tests protected connector endpoints when the local app server and `EVIDARA_INTERNAL_ACCESS_TOKEN` are available.
- `scripts/validate-real-only-evidence.mjs`: validates seeded/demo product evidence paths are retired.
- `scripts/validate-query-audit.mjs`: validates query audit schema, helpers, APIs, and redaction foundations.
- `scripts/validate-candidate-promotion.mjs`: validates candidate promotion requires real candidates, review attestation, and generatedClaim=false.
- `scripts/validate-production-persistence.mjs`: validates server-only PostgreSQL persistence wiring and optionally checks live DB tables when `DATABASE_URL` is configured.
- `scripts/validate-auth-rbac.mjs`: validates auth/RBAC schema, login, session, and role-protection foundations without fake users.
- `scripts/validate-tenant-scoping.mjs`: validates organization schema, membership setup, session organization context, and no fake tenants.
- `scripts/validate-connector-monitoring.mjs`: validates internal connector health/monitoring boundaries.
- `scripts/validate-source-citation-deduplication.mjs`: validates canonical source/citation deduplication foundations.
- `scripts/validate-review-queue-ui.mjs`: validates the internal review queue reads real audit candidates and does not fake actions.
- `scripts/validate-candidate-rejection-workflow.mjs`: validates rejection schema, required reviewer identity, notes, and audit event.
- `scripts/validate-audit-immutability.mjs`: validates append-only audit trigger and hash-chain helper foundation.
- `scripts/create-auth-user.mjs`: creates or updates a real operator-provided user; it does not seed demo users.
- `docs/product-boundary.md`: explains the public website, authenticated product workspace, and internal admin workspace boundary.
- `docs/evidence-provenance-schema.md`: explains the evidence provenance schema, constraints, real-only evidence policy, and validation commands.
- `docs/public-source-connectors.md`: explains the public-source connector registry, implemented/deferred sources, legal guardrails, candidate-only model, and patient portal exclusion.
- `docs/candidate-promotion-review.md`: explains the internal-only candidate-to-citation review path.
- `docs/production-persistence.md`: explains the B1 persistence boundary, migration path, environment variables, and remaining beta blockers.
- `docs/auth-rbac-foundation.md`: explains the B2 auth/RBAC boundary and real-user setup.
- `docs/tenant-organization-scoping.md`: explains the B3 organization boundary and remaining tenant filtering work.
- `docs/source-citation-deduplication.md`: explains exact-match source/citation deduplication and deferred merge review.
- `docs/review-queue-ui.md`: explains the internal review queue empty state and disabled action boundary.
- `docs/candidate-rejection-workflow.md`: explains the real candidate rejection workflow and no-deletion boundary.
- `docs/audit-immutability-foundation.md`: explains append-only audit foundation and compliance limitations.
- `docs/premium-website-visual-audit.md`: audits visual gaps and risks before redesign.
- `docs/evidaraos-design-system-plan.md`: defines premium enterprise visual direction and tooling recommendations.

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
- Local citation/provenance and query audit development storage can live in `.evidara-data`, which is ignored by git.
- `/app/*` and `/admin/*` are route-boundary scaffolds only. They do not fake auth, retrieval, reports, admin data, or audit enforcement.
- Seeded/manual evidence packet APIs are retired and return `410 Gone`.
- No seeded/demo/fixture biomedical evidence is used in product or internal API flows.
- Public-source connectors return candidate records only. They do not create final citations, evidence records, scores, reports, or public-facing claims.
- Candidate promotion is internal-only and review-gated. It does not generate claims or bypass citation/source provenance.
- Query audit helpers track internal connector searches when run, but they are not production audit/RBAC enforcement.
- PostgreSQL persistence requires applying `db/migrations/0001_citation_provenance_foundation.sql`, `db/migrations/0002_query_audit_foundation.sql`, and `db/migrations/0003_candidate_promotion_foundation.sql`.
- Auth/RBAC requires applying `db/migrations/0004_auth_rbac_foundation.sql` and creating real users; no fake/demo users are generated.
- Tenant scoping requires applying `db/migrations/0005_tenant_organization_scoping.sql`; no fake/demo organizations are generated.
- Local JSON persistence is development-only and is not acceptable for private beta evidence review.
- Private patient portals, EHR systems, login-gated systems, PHI, paywalled scraping, CAPTCHA bypass, and terms/rate-limit bypass are excluded.
- `EVIDARA_INTERNAL_ACCESS_TOKEN` is a temporary internal guard, not production auth/RBAC.
- `validate:provenance-db` requires a disposable PostgreSQL database and `DATABASE_URL`; do not run it against production data.
- Avoid fake customer logos, fake testimonials, or claims of live backend functionality unless corresponding code paths exist.
