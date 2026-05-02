# EvidaraOS Review Queue UI

## Current Status

Phase B6 adds `/app/review-queue` as an internal product workspace page.

The page:

- reads real query audit candidate events from `src/lib/query-audit.ts`
- shows an honest empty state if no connector searches have produced candidates
- does not render seeded/demo/fake evidence
- does not generate claims
- does not promote or reject candidates automatically
- keeps action buttons disabled until the reviewed promotion/rejection workflow is completed

## Why Actions Are Disabled

Current query candidate events contain source metadata and audit linkage, but not the full reviewed candidate payload, reviewer notes, rejection reasons, or authenticated approval workflow required for safe promotion/rejection.

## Next Required Phase

The next phase should implement explicit rejection workflow and/or a full review action path with:

- authenticated reviewer identity
- organization context
- reviewer notes
- reason codes
- audit event
- no deletion without audit trail
