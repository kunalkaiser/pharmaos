import { existsSync, readFileSync } from "node:fs";

const failures = [];
const pagePath = "src/app/app/review-queue/page.tsx";
if (!existsSync(pagePath)) failures.push("Missing /app/review-queue page.");

const page = existsSync(pagePath) ? readFileSync(pagePath, "utf8") : "";
if (!page.includes("listQueryRuns") || !page.includes("getQueryRunAuditTrail")) {
  failures.push("Review queue must read real query audit candidate events.");
}
if (!page.includes("No real candidates are queued")) failures.push("Review queue needs honest empty state.");
if (!page.includes("ReviewQueueActions")) failures.push("Review queue must expose promote/reject review actions.");
if (/sampleEvidence|seededEvidence|demoPacket|manual packet/i.test(page)) failures.push("Review queue must not render seeded/demo evidence objects.");
if (!page.includes("generatedClaim=false")) failures.push("Review queue must disclose generatedClaim=false boundary.");

const actionsPath = "src/components/ReviewQueueActions.tsx";
if (!existsSync(actionsPath)) failures.push("Missing review queue actions component.");
const actions = existsSync(actionsPath) ? readFileSync(actionsPath, "utf8") : "";
if (!actions.includes("/api/internal/review/candidate-promotions")) failures.push("Review actions must call candidate promotion API.");
if (!actions.includes("/api/internal/review/candidate-rejections")) failures.push("Review actions must call candidate rejection API.");
if (!actions.includes("reviewerAttestation")) failures.push("Promotion action must include reviewer attestation.");
if (!actions.includes("Review notes")) failures.push("Review actions must collect reviewer notes.");

const layout = readFileSync("src/app/app/layout.tsx", "utf8");
if (!layout.includes("/app/review-queue")) failures.push("Product workspace nav should include Review Queue.");

if (failures.length) {
  console.error("Review queue UI validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Review queue UI validation passed: internal page reads real audit candidate events, shows honest empty state, and does not fake review actions.");
