# EvidaraOS Candidate Rejection Workflow

## Current Status

Phase B7 adds a real internal rejection workflow foundation.

Implemented:

- `candidate_rejections` schema
- protected `GET /api/internal/review/candidate-rejections`
- protected `POST /api/internal/review/candidate-rejections`
- required reviewer identity from auth/proxy headers
- required rejection reason and reviewer notes
- audit log event `candidate.rejected`
- no candidate deletion

## Rejection Reasons

- `not_relevant`
- `insufficient_provenance`
- `duplicate`
- `restricted_source`
- `low_quality`
- `not_scientific_evidence`
- `other`

## Safety Boundary

The rejection endpoint requires real authenticated reviewer context. It does not create fake reviewers, fake audit logs, fake users, fake evidence, or fake reports.

If `DATABASE_URL` is unavailable, rejection returns `503` instead of storing data in local JSON.

## Not Implemented Yet

- review queue action buttons
- rejection filtering UI
- immutable audit chain
- undo/reopen workflow
- tenant runtime tests with a production database
