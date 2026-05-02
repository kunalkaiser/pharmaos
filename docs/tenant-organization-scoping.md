# EvidaraOS Tenant / Organization Scoping Foundation

## Current Status

Phase B3 adds organization boundaries without creating fake tenants or sample organizations.

Implemented:

- `organizations`
- `user_organizations`
- nullable `organization_id` columns on evidence, query audit, candidate promotion, and audit tables
- organization-aware auth session payloads
- proxy headers for authenticated organization context
- real-user creation script now requires an explicit organization name and slug

## Why Nullable Columns

The existing local/dev data and internal-token fallback may not have authenticated organization context yet. New beta workflows should require a real authenticated session and should write `organization_id` for tenant-scoped data.

## Not Implemented Yet

- Full tenant filtering in every API response
- Organization switcher UI
- Cross-organization admin controls
- Tenant-scoped report generation
- Tenant-safe public/private beta runtime checks against a production database

## Beta Requirement

Before private beta, any endpoint that reads or writes evidence, query runs, audit logs, promotions, reports, or exports must require authenticated organization context and must filter by `organization_id`.
