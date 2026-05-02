# EvidaraOS EpiEngine Scoring

## Current Status

Phase B11 adds EpiEngine scoring v1 for reviewed evidence packets.

Implemented:

- `scoring_runs` schema
- `POST /api/internal/epi-engine/score`
- reviewed-evidence-only scoring guard
- transparent factor weights
- persisted scoring runs when `DATABASE_URL` is configured
- immutable audit event `epi_engine.scored`

## Scoring Factors

The v1 score reflects evidence coverage and maturity only:

- epidemiology evidence
- patient population evidence
- clinical activity evidence
- treatment landscape evidence
- unmet need evidence
- evidence maturity

## Safety Boundary

The score is not:

- a causal conclusion
- a medical recommendation
- a regulatory recommendation
- a commercial forecast
- an autonomous indication-prioritization decision

No unreviewed candidates are scored. No final claims are generated.

## Still Needed

- product-approved weighting methodology
- reviewer adjustment workflow
- confidence/residual-risk UI
- validation against benchmark reports
- tenant-scoped runtime tests with production database
