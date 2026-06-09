import { existsSync, readFileSync } from "node:fs";
import pg from "pg";

const requiredFiles = [
  "src/lib/db/client.ts",
  "src/lib/query-audit.ts",
  "src/lib/evidence-foundation.ts",
  "db/migrations/0001_citation_provenance_foundation.sql",
  "db/migrations/0002_query_audit_foundation.sql",
  "db/migrations/0003_candidate_promotion_foundation.sql",
  "db/migrations/0011_evidence_chat_persistence.sql",
];

const requiredTables = [
  "evidence_sources",
  "citations",
  "evidence_records",
  "evidence_packets",
  "retrieval_runs",
  "audit_logs",
  "query_runs",
  "query_run_steps",
  "query_source_events",
  "query_candidate_events",
  "query_errors",
  "query_audit_snapshots",
  "candidate_promotions",
  "evidence_chat_conversations",
  "evidence_chat_messages",
];

const failures = [];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing required persistence file: ${file}`);
}

const dbClient = readFileSync("src/lib/db/client.ts", "utf8");
if (!dbClient.includes('import "server-only"')) failures.push("DB client must import server-only.");
if (!dbClient.includes("DATABASE_URL")) failures.push("DB client must use server-only DATABASE_URL.");
if (/NEXT_PUBLIC/i.test(dbClient)) failures.push("DB client must not use NEXT_PUBLIC credentials.");

const queryAudit = readFileSync("src/lib/query-audit.ts", "utf8");
const evidenceFoundation = readFileSync("src/lib/evidence-foundation.ts", "utf8");
for (const [name, content] of [
  ["query audit", queryAudit],
  ["evidence foundation", evidenceFoundation],
]) {
  if (!content.includes("hasDatabaseUrl()")) failures.push(`${name} helper does not branch to Postgres persistence.`);
  if (!content.includes("local") && !content.includes("readStore")) failures.push(`${name} helper should retain documented local dev fallback.`);
  if (/NEXT_PUBLIC/i.test(content)) failures.push(`${name} helper must not use NEXT_PUBLIC secrets.`);
}

const migrationText = requiredFiles
  .filter((file) => file.startsWith("db/migrations"))
  .map((file) => readFileSync(file, "utf8"))
  .join("\n");
for (const table of requiredTables) {
  if (!migrationText.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
    failures.push(`Migration missing table: ${table}`);
  }
}

if (failures.length) {
  console.error("Production persistence validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.log("Static production persistence validation passed.");
  console.log("DATABASE_URL is not configured, so live Postgres connectivity/table checks were not executed.");
  console.log("Run with DATABASE_URL set after applying migrations to verify production DB connectivity.");
  process.exit(0);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  await pool.query("SELECT 1");
  const result = await pool.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name = ANY($1::text[])`,
    [requiredTables],
  );
  const present = new Set(result.rows.map((row) => row.table_name));
  const missing = requiredTables.filter((table) => !present.has(table));
  if (missing.length) {
    console.error(`DATABASE_URL is reachable, but required tables are missing: ${missing.join(", ")}`);
    console.error("Apply db/migrations/0001, 0002, and 0003 before beta use.");
    process.exit(1);
  }
  console.log("Production persistence validation passed with live Postgres connectivity and required tables.");
} finally {
  await pool.end();
}
