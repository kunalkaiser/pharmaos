import { existsSync, readFileSync } from "node:fs";

const failures = [];
for (const file of [
  "src/lib/connectors/health.ts",
  "src/app/api/internal/connectors/health/route.ts",
  "src/proxy.ts",
  "scripts/validate-live-connectors.mjs",
]) {
  if (!existsSync(file)) failures.push(`Missing connector monitoring file: ${file}`);
}

const health = readFileSync("src/lib/connectors/health.ts", "utf8");
if (!health.includes("liveChecksExecuted")) failures.push("Connector health must distinguish static checks from live checks.");
if (!health.includes("fakeSuccess: false")) failures.push("Connector health must not report fake success.");
if (!health.includes("patientPortalAccess: false")) failures.push("Connector health must explicitly exclude patient portal access.");
if (!health.includes("candidateOnly")) failures.push("Connector health must preserve candidate-only boundary.");
if (!health.includes("runProviderSearch")) failures.push("Connector health must use real connector code for live checks.");

const route = readFileSync("src/app/api/internal/connectors/health/route.ts", "utf8");
if (!route.includes("internalOnly")) failures.push("Health route should clearly identify internal-only access.");
if (!route.includes("live")) failures.push("Health route should require explicit live checks.");

const proxy = readFileSync("src/proxy.ts", "utf8");
if (!proxy.includes("/api/internal")) failures.push("Internal health route must remain covered by protected API proxy.");

if (failures.length) {
  console.error("Connector monitoring validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Connector monitoring validation passed: internal health route and explicit live/static connector status checks are present.");
console.log("Runtime provider calls still require a running app, internal access, and network availability.");
