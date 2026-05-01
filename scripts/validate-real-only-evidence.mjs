import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

for (const removedPath of [
  "scripts/seed-evidence-foundation.mjs",
  "scripts/validate-seeded-packet-api.mjs",
  "docs/evidence-packet-api.md",
]) {
  assert.equal(existsSync(path.join(root, removedPath)), false, `${removedPath} must be removed.`);
}

const packageJson = await read("package.json");
assert.equal(/seed:evidence-foundation|validate:seeded-packet-api/.test(packageJson), false, "Seeded evidence npm scripts must not remain.");

const evidenceFoundation = await read("src/lib/evidence-foundation.ts");
assert.equal(/SeededEvidencePacket|listSeededEvidencePackets|getSeededEvidencePacket|internal_manual_seed|status:\s*"seeded"/.test(evidenceFoundation), false, "Seeded packet helpers must not remain.");

const retiredRoutes = [
  "src/app/api/internal/evidence-packets/route.ts",
  "src/app/api/internal/evidence-packets/[id]/route.ts",
  "src/app/api/internal/evidence-packets/[id]/citations/route.ts",
];

for (const route of retiredRoutes) {
  const content = await read(route);
  assert.ok(content.includes("{ status: 410 }"), `${route} must return 410 Gone.`);
  assert.equal(/getSeeded|listSeeded|internal_manual_seed/.test(content), false, `${route} must not import seeded data helpers.`);
}

const resources = await read("src/app/resources/page.tsx");
assert.equal(/sampleEvidenceRows|Semaglutide and obstructive sleep apnea example|Illustrative structure only/.test(resources), false, "Public resources page must not render fake/sample biomedical evidence rows.");

const content = await read("src/lib/evidara-content.ts");
assert.equal(/sampleEvidenceRows|Obstructive sleep apnea has meaningful|Payer questions would likely/.test(content), false, "Static fake/sample evidence rows must not remain in content arrays.");

const validationSql = await read("db/validation/0001_provenance_constraints.sql");
assert.equal(/27568340|Obstructive sleep apnea|OSA prevalence|Sleep Med Rev/i.test(validationSql), false, "Database validation must not use biomedical fixture evidence.");

console.log("Real-only evidence validation passed: seeded/demo product evidence paths are retired and public pages do not render fake evidence rows.");

async function read(file) {
  return readFile(path.join(root, file), "utf8");
}
