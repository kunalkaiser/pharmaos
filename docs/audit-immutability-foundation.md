# EvidaraOS Audit Immutability Foundation

## Current Status

Phase B8 adds an audit immutability foundation.

Implemented:

- `previous_event_hash` and `event_hash` on `audit_logs`
- database triggers that block normal `UPDATE` and `DELETE` operations on `audit_logs`
- `appendImmutableAuditLog()` helper
- hash-chain linkage for new audit events
- candidate rejection and evidence foundation audit writes routed through the immutable helper

## What This Means

New audit events can be appended with a stable hash and a pointer to the previous event hash. Normal app paths cannot update or delete audit rows once migration `0008_audit_immutability_foundation.sql` is applied.

## What This Does Not Claim

This is not a SOC 2, HIPAA, Part 11, GDPR, FDA, or external compliance certification. It is a technical foundation for tamper-resistant auditability that still requires production database controls, backups, monitoring, access reviews, and legal/security review.

## Still Needed

- runtime migration on production database
- external backup/retention policy
- admin audit UI showing hash verification status
- immutable object storage for exported report artifacts
- tenant-scoped audit views
- operational incident monitoring
