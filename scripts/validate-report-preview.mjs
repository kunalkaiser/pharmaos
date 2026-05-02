import { existsSync, readFileSync } from "node:fs";

const failures = [];
for (const file of [
  "src/app/app/reports/[id]/page.tsx",
  "src/lib/evidence-foundation.ts",
]) {
  if (!existsSync(file)) failures.push(`Missing report preview file: ${file}`);
}

const page = readFileSync("src/app/app/reports/[id]/page.tsx", "utf8");
if (!page.includes("getReviewedEvidencePacketReport")) failures.push("Report preview must use reviewed evidence packet helper.");
if (!page.includes("No reviewed evidence packet found")) failures.push("Report preview must show honest empty state.");
if (!page.includes("Executive summary generation is not implemented")) failures.push("Report preview must not fake executive summary.");
if (!page.includes("PDF export is not implemented")) failures.push("Report preview must not imply PDF export exists.");
if (/sampleReport|mockReport|fakeChartData|sampleEvidence/i.test(page)) failures.push("Report preview must not render fake/sample report objects.");

const foundation = readFileSync("src/lib/evidence-foundation.ts", "utf8");
if (!foundation.includes("getReviewedEvidencePacketReport")) failures.push("Missing reviewed report helper.");
if (!foundation.includes("humanReviewStatus === \"reviewed\"") || !foundation.includes("humanReviewStatus === \"approved\"")) {
  failures.push("Report helper must filter to reviewed/approved citations.");
}
if (!foundation.includes("generatedExecutiveSummary: false")) failures.push("Report helper must disclose no generated executive summary.");
if (!foundation.includes("pdfExportImplemented: false")) failures.push("Report helper must disclose no PDF export.");

if (failures.length) {
  console.error("Report preview validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Report preview validation passed: internal preview uses reviewed evidence only and does not fake summary/PDF output.");
