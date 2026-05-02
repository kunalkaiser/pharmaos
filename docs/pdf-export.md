# EvidaraOS PDF Export

## Current Status

Phase B10 adds server-side PDF export for reviewed evidence packets.

Implemented:

- `report_exports` schema
- `POST /api/internal/reports/[id]/export`
- server-side PDF rendering with `pdfkit`
- reviewed-evidence-only export guard
- source appendix
- draft/internal watermark language
- export content hash
- immutable audit event `report.exported`

## Export Requirements

PDF export requires:

- an existing evidence packet
- reviewed/approved citation-backed evidence records
- attached reviewed sources
- protected internal route access

If reviewed evidence is missing, the endpoint returns `409` instead of generating a fake report.

## Not Implemented Yet

- polished visual report templates
- charts/exhibits
- DOCX export
- immutable file storage
- report version comparison UI
- external customer delivery workflow
