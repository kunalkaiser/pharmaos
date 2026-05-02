# EvidaraOS Report Preview

## Current Status

Phase B9 converts `/app/reports/[id]` into an internal reviewed-evidence report preview.

The preview:

- reads a real evidence packet by ID
- includes reviewed or approved citations only
- includes evidence records linked to those reviewed citations only
- includes a source appendix
- shows limitations when present
- shows honest empty states when reviewed evidence is missing

## Explicit Non-Capabilities

The preview does not:

- generate an executive summary
- generate PDF files
- create charts
- invent missing sections
- include unreviewed candidates as evidence
- provide regulatory or medical advice

## Next Step

PDF export should be implemented only after the preview model is accepted and reviewed evidence records exist in a production database.
