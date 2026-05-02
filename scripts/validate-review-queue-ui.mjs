import { existsSync, readFileSync } from "node:fs";

const failures = [];
const pagePath = "src/app/app/review-queue/page.tsx";
if (!existsSync(pagePath)) failures.push("Missing /app/review-queue page.");

const page = existsSync(pagePath) ? readFileSync(pagePath, "utf8") : "";
if (!page.includes("listQueryRuns") || !page.includes("getQueryRunAuditTrail")) {
  failures.push("Review queue must read real query audit candidate events.");
}
if (!page.includes("No real candidates are queued")) failures.push("Review queue needs honest empty state.");
if (!page.includes("disabled")) failures.push("Review queue actions should remain disabled until review workflow is implemented.");
if (/sampleEvidence|seededEvidence|demoPacket|manual packet/i.test(page)) failures.push("Review queue must not render seeded/demo evidence objects.");
if (!page.includes("generatedClaim=false")) failures.push("Review queue must disclose generatedClaim=false boundary.");

const layout = readFileSync("src/app/app/layout.tsx", "utf8");
if (!layout.includes("/app/review-queue")) failures.push("Product workspace nav should include Review Queue.");

if (failures.length) {
  console.error("Review queue UI validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Review queue UI validation passed: internal page reads real audit candidate events, shows honest empty state, and does not fake review actions.");
