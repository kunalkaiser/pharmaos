# EvidaraOS Auth/RBAC Foundation

## Current Status

Phase B2 adds real auth/RBAC primitives without creating fake users, tenants, customers, or roles.

Implemented:

- `users`, `roles`, and `user_roles` schema in `db/migrations/0004_auth_rbac_foundation.sql`
- Organization memberships in `db/migrations/0005_tenant_organization_scoping.sql`
- Password-backed login through `POST /api/auth/login`
- HTTP-only signed workspace session cookie
- `POST /api/auth/logout`
- `GET /api/auth/me`
- Path-level RBAC in `src/proxy.ts`
- Real-user creation script requiring explicit operator-provided credentials

No users are seeded automatically. A real user must be created deliberately by an operator.

## Required Environment

- `DATABASE_URL`
- `EVIDARA_AUTH_SESSION_SECRET`

The auth session secret must be server-only and must not be exposed through `NEXT_PUBLIC_*`.

## Create A Real User

After applying migrations through `0004_auth_rbac_foundation.sql`, create a real user:

```bash
DATABASE_URL="postgres://..." \
EVIDARA_USER_EMAIL="person@company.com" \
EVIDARA_USER_PASSWORD="use-a-real-long-password" \
EVIDARA_USER_FULL_NAME="Person Name" \
EVIDARA_ORGANIZATION_NAME="Company Name" \
EVIDARA_ORGANIZATION_SLUG="company-name" \
EVIDARA_USER_ROLES="admin,reviewer" \
npm run create:auth-user
```

This command does not create demo users or fake tenants. It only creates or updates the user and organization explicitly provided through environment variables.

## Role Boundaries

- `admin`: `/admin/*`, audit APIs, review APIs, connector APIs, workspace pages
- `reviewer`: review APIs, audit APIs, connector APIs, workspace pages
- `analyst`: connector APIs and workspace pages
- `read_only`: workspace pages and safe source metadata
- `system`: reserved for backend system events, not a normal human login role

## Temporary Token Fallback

`EVIDARA_INTERNAL_ACCESS_TOKEN` remains available as a development fallback until runtime auth is fully rolled out and tested with a production database. It should not be treated as production RBAC.

## Not Implemented Yet

- Tenant/organization scoping
- Enterprise SSO/SAML/OIDC
- MFA
- Session revocation table
- Password reset/email workflow
- Production audit immutability
- Fine-grained per-record permissions
