import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const files = [
  "src/lib/connectors/types.ts",
  "src/lib/connectors/source-registry.ts",
  "src/lib/connectors/index.ts",
  "src/app/api/internal/connectors/search/route.ts",
  "src/app/api/internal/connectors/[provider]/route.ts",
  "src/app/api/internal/connectors/news/route.ts",
  "src/app/api/internal/sources/registry/route.ts",
  "src/proxy.ts",
];

for (const file of files) {
  await assertReadable(file);
}

const types = await read("src/lib/connectors/types.ts");
assert.ok(types.includes("candidateOnly: true"), "EvidenceCandidate must require candidateOnly=true.");
assert.ok(types.includes("generatedClaim: false"), "EvidenceCandidate must require generatedClaim=false.");

const index = await read("src/lib/connectors/index.ts");
assert.equal(/createEvidenceRecord|evidenceRecords\.push|report_exports|scoreEvidence/i.test(index), false, "Connector search must not create evidence records, reports, or scores.");
assert.ok(index.includes("startQueryRun"), "Combined connector search should start a query audit run.");
assert.ok(index.includes("recordSourceEvent"), "Combined connector search should record source events.");
assert.ok(index.includes("recordCandidateEvents"), "Combined connector search should record candidate events.");

const proxy = await read("src/proxy.ts");
assert.ok(proxy.includes('"/api/internal"'), "Internal connector APIs must be protected by proxy.");
assert.equal(/NEXT_PUBLIC/.test(proxy), false, "Internal access token must not use NEXT_PUBLIC.");

for (const file of await sourceFiles(path.join(root, "src/lib/connectors"))) {
  const content = await readFile(file, "utf8");
  assert.equal(/NEXT_PUBLIC/.test(content), false, `${file} must not expose public secrets.`);
  assert.equal(/mychart|epic|cerner|portal scraping/i.test(content), false, `${file} must not implement patient portal access.`);
}

console.log("Real connector validation passed: candidate-only connectors, protected internal APIs, and query audit wiring are present.");

async function assertReadable(file) {
  await read(file);
}

async function read(file) {
  return readFile(path.join(root, file), "utf8");
}

async function sourceFiles(dir) {
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(fullPath));
    if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) files.push(fullPath);
  }
  return files;
}
