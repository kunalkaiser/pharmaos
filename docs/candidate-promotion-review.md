# Candidate Promotion Review

## Purpose

This document defines the first internal-only review path from real public-source retrieval candidates to reviewed citations and, optionally, evidence records.

## Current Status

Implemented foundation:

- `POST /api/internal/review/candidate-promotions`
- `GET /api/internal/review/candidate-promotions`
- `src/lib/evidence-foundation.ts` promotion helper
- `db/migrations/0003_candidate_promotion_foundation.sql`

These endpoints are protected by the temporary internal route boundary. They are not public website functionality and are not production auth/RBAC.

## What Can Be Promoted

Only real `EvidenceCandidate` objects can be promoted. The candidate must have:

- `candidateOnly: true`
- `generatedClaim: false`
- source provider
- source title
- source URL
- access date / retrieval metadata
- limitation notes

Schema-validation records, example URLs, seeded records, fixtures, and generated claims are rejected.

## What Promotion Creates

A valid promotion creates:

- an `evidence_source`
- a `citation`
- a `candidate_promotion` record

It can optionally create an `evidence_record`, but only if a human reviewer supplies claim text and an existing evidence packet ID. The system does not write claims from abstracts or connector text automatically.

## Required Review Inputs

The request must include:

- reviewed candidate
- citation text
- `humanReviewStatus` of `reviewed` or `approved`
- review notes
- `reviewerAttestation: true`

Until real auth exists, reviewer identity is recorded as `anonymous_internal` unless a future auth layer supplies actor identity.

## Not Implemented

This phase does not implement:

- public promotion UI
- authenticated reviewer identity
- RBAC
- automatic summarization
- automatic disease burden conclusions
- report generation
- EpiEngine scoring
- production audit enforcement

## Production Requirements

Before production, candidate promotion needs:

- real authenticated user identity
- organization/tenant scoping
- reviewer role checks
- immutable audit storage
- source/citation deduplication strategy
- review queue UI
- rejection workflow
- report-version impact tracking
