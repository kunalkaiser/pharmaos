import { existsSync, readFileSync } from "node:fs";

const failures = [];
for (const file of [
  "db/migrations/0006_source_citation_deduplication.sql",
  "src/lib/evidence-deduplication.ts",
  "src/lib/evidence-foundation.ts",
]) {
  if (!existsSync(file)) failures.push(`Missing deduplication file: ${file}`);
}

const migration = readFileSync("db/migrations/0006_source_citation_deduplication.sql", "utf8");
if (!migration.includes("source_canonical_key")) failures.push("Migration must add source_canonical_key.");
if (!migration.includes("citation_hash")) failures.push("Migration must add citation_hash.");
if (!migration.includes("UNIQUE INDEX")) failures.push("Migration must add unique deduplication indexes.");

const helpers = readFileSync("src/lib/evidence-deduplication.ts", "utf8");
for (const term of ["pmid", "pmcid", "doi", "nctId", "fdaIdentifier", "url"]) {
  if (!helpers.includes(term)) failures.push(`Deduplication helper missing identifier: ${term}`);
}
if (!helpers.includes("sha256")) failures.push("Citation deduplication should use stable hash.");

const foundation = readFileSync("src/lib/evidence-foundation.ts", "utf8");
if (!foundation.includes("canonicalSourceKey")) failures.push("Evidence foundation must use canonicalSourceKey.");
if (!foundation.includes("citationDedupHash")) failures.push("Evidence foundation must use citationDedupHash.");
if (!foundation.includes("SELECT * FROM evidence_sources WHERE source_canonical_key")) failures.push("DB source creation must check existing canonical sources.");
if (!foundation.includes("SELECT * FROM citations WHERE citation_hash")) failures.push("DB citation creation must check existing citation hashes.");

if (failures.length) {
  console.error("Source/citation deduplication validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Source/citation deduplication validation passed: canonical source keys, citation hashes, and unique DB indexes are present.");
console.log("Live merge/reconciliation workflows are not implemented yet; explicit review should handle ambiguous duplicates.");
