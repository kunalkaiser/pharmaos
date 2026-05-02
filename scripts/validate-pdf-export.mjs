import { existsSync, readFileSync } from "node:fs";

const failures = [];
for (const file of [
  "db/migrations/0009_report_exports.sql",
  "src/lib/reports/pdf-export.ts",
  "src/app/api/internal/reports/[id]/export/route.ts",
]) {
  if (!existsSync(file)) failures.push(`Missing PDF export file: ${file}`);
}

const migration = readFileSync("db/migrations/0009_report_exports.sql", "utf8");
if (!migration.includes("report_exports")) failures.push("Migration must create report_exports.");
if (!migration.includes("content_hash")) failures.push("Report exports must store content hash.");

const renderer = readFileSync("src/lib/reports/pdf-export.ts", "utf8");
if (!renderer.includes("PDFDocument")) failures.push("PDF export must use server-side PDF generation.");
if (!renderer.includes("reviewed/approved citation-backed evidence records only")) failures.push("PDF must state reviewed-evidence-only boundary.");
if (!renderer.includes("Source Appendix")) failures.push("PDF must include source appendix.");
if (!renderer.includes("report.exported")) failures.push("PDF export must append audit event.");
if (/fake|sampleEvidence|mockReport/i.test(renderer)) failures.push("PDF renderer must not use fake/sample evidence.");

const route = readFileSync("src/app/api/internal/reports/[id]/export/route.ts", "utf8");
if (!route.includes("getReviewedEvidencePacketReport")) failures.push("Export route must use reviewed report helper.");
if (!route.includes("PDF export requires reviewed evidence records")) failures.push("Export route must reject empty/unreviewed packets.");
if (!route.includes("application/pdf")) failures.push("Export route must return application/pdf.");
if (!route.includes("x-evidara-generated-claims")) failures.push("Export route must disclose no generated claims.");

if (failures.length) {
  console.error("PDF export validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("PDF export validation passed: reviewed-evidence-only PDF route, export record, source appendix, and audit event are present.");
