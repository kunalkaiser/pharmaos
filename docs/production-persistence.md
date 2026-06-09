# EvidaraOS Production Persistence Foundation

## Current Status

Phase B1 adds a server-only PostgreSQL persistence path for evidence provenance, candidate promotion, query audit, and Evidence Chat conversation foundations.

When `DATABASE_URL` is configured and migrations are applied, these helpers persist to PostgreSQL:

- `src/lib/evidence-foundation.ts`
- `src/lib/query-audit.ts`
- `src/lib/evidence-chat-persistence.ts`

When `DATABASE_URL` is not configured, the helpers retain the existing `.evidara-data` JSON fallback for local development only. Local JSON storage is not beta-ready storage and must not be used for reviewed evidence workflows.

## Tables Covered

Apply these migrations before using persistence in an internal beta environment:

- `db/migrations/0001_citation_provenance_foundation.sql`
- `db/migrations/0002_query_audit_foundation.sql`
- `db/migrations/0003_candidate_promotion_foundation.sql`
- `db/migrations/0011_evidence_chat_persistence.sql`

The persistence foundation covers:

- `evidence_sources`
- `citations`
- `evidence_records`
- `evidence_packets`
- `retrieval_runs`
- `audit_logs`
- `query_runs`
- `query_run_steps`
- `query_source_events`
- `query_candidate_events`
- `query_errors`
- `query_audit_snapshots`
- `candidate_promotions`
- `evidence_chat_conversations`
- `evidence_chat_messages`

## Environment Variables

- `DATABASE_URL`: server-only PostgreSQL connection string.
- `DATABASE_POOL_MAX`: optional connection pool size.
- `DATABASE_IDLE_TIMEOUT_MS`: optional pool idle timeout.
- `DATABASE_CONNECTION_TIMEOUT_MS`: optional connection timeout.

Do not use `NEXT_PUBLIC_*` for database credentials or internal API tokens.

## Production Boundary

This phase does not implement:

- Auth/RBAC
- Tenant or organization scoping
- Immutable audit enforcement
- Live report generation
- PDF export
- EpiEngine scoring
- Public website retrieval

`/api/internal/*`, `/app/*`, and `/admin/*` still use the temporary internal token boundary until real auth/RBAC is implemented.

## Validation

Static validation:

```bash
npm run validate:production-persistence
```

Live database validation:

```bash
DATABASE_URL="postgres://..." npm run validate:production-persistence
```

If `DATABASE_URL` is set, validation checks that the database is reachable and all required tables exist. If `DATABASE_URL` is not set, validation reports that live database checks were not executed.

## Beta Readiness Notes

This phase removes a major beta blocker by creating a real persistence path, but it does not make the platform beta-ready by itself. Before beta use, EvidaraOS still needs real authenticated reviewer identity, tenant scoping, production audit immutability, and connector runtime monitoring.
