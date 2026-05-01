# Public Website vs Authenticated Product Boundary

## What Is Public

The public website explains EvidaraOS, buyer use cases, methodology, trust principles, sample resources, and demo access.

Public routes:

- `/`
- `/solutions`
- `/evidence-engine`
- `/data-methodology`
- `/security-trust`
- `/resources`
- `/company`
- `/demo`
- `/architecture`
- `/query-journey`
- `/chains`
- `/agents`
- `/governance`

These routes do not require auth. They should only present static, sample, or clearly labeled preview content unless a real backend service is connected.

## What Requires Authentication

The product workspace route family is scaffolded under `/app`.

Authenticated workspace routes:

- `/app`
- `/app/evidence-packets`
- `/app/evidence-packets/[id]`
- `/app/sources`
- `/app/reports/[id]`
- `/app/audit-log`

Future authenticated users will create evidence packets, review sources, inspect citation-backed claims, view reports, and see audit visibility. Production auth/RBAC is not connected yet. These routes are protected by a temporary internal access token guard and currently show access-boundary placeholders only.

## What Requires Admin Access

The internal admin route family is scaffolded under `/admin`.

Admin routes:

- `/admin`
- `/admin/demo-requests`
- `/admin/retrieval-runs`
- `/admin/sources`
- `/admin/audit-log`

Future admin users will review demo requests, monitor retrieval runs, manage sources, and inspect operational audit logs. Production admin auth is not connected yet. These routes are protected by a temporary internal access token guard and currently show access-boundary placeholders only.

## Temporary Internal Access Guard

`/app/*`, `/admin/*`, and `/api/internal/*` are guarded by `src/proxy.ts`.

Current behavior:

- If `EVIDARA_INTERNAL_ACCESS_TOKEN` is not configured, protected routes fail closed.
- If the token is configured, requests must provide it via `Authorization: Bearer <token>`, `x-evidara-internal-token`, or the `evidara_internal_access` cookie.
- This is not user authentication, RBAC, tenant isolation, or production audit enforcement.
- No fake user identity or role is created.

Production auth/RBAC must replace or sit in front of this temporary internal guard before external use.

## Backend Services Needed

The authenticated and admin workspaces require:

- authentication and role-based access
- organization/tenant boundaries
- evidence packet persistence
- evidence source and citation storage
- live retrieval workers
- EpiEngine scoring services
- report preview and export services
- audit-log enforcement
- admin source-management APIs
- demo request review APIs

## What Should Not Be Claimed Publicly Yet

Do not claim:

- live evidence retrieval
- live citation-backed reports
- implemented EpiEngine scoring
- enforced audit logs
- production auth or role-based access
- report export
- security attestations
- compliance certifications
- customer proof or testimonials

## Route Map

| Area | Routes | Current Status |
|---|---|---|
| Public website | Existing public routes | Static/sample/preview content, no auth |
| Demo request | `/demo`, `POST /api/demo-requests` | Real request submission, no evidence generation |
| Product workspace | `/app/*` | Scaffold only, temporary internal token guard, auth/backend required |
| Admin workspace | `/admin/*` | Scaffold only, temporary internal token guard, admin/backend required |

## Implementation Status

The route boundary is implemented in the frontend. `/app` and `/admin` have separate workspace layouts and navigation, but they do not perform product or admin actions. They exist to reserve the correct enterprise architecture boundary before backend services are built.
