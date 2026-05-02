import assert from "node:assert/strict";

const baseUrl = process.env.EVIDARA_CONNECTOR_BASE_URL ?? "http://127.0.0.1:3002";
const token = process.env.EVIDARA_INTERNAL_ACCESS_TOKEN;

if (!token) {
  console.log("Live connector validation skipped: set EVIDARA_INTERNAL_ACCESS_TOKEN and start the app server first.");
  process.exit(0);
}

const requiredChecks = [
  { provider: "pubmed", query: "semaglutide", minCandidates: 1 },
  { provider: "clinicaltrials", query: "semaglutide", minCandidates: 1 },
  { provider: "rxnorm", query: "semaglutide", minCandidates: 1 },
  { provider: "dailymed", query: "semaglutide", minCandidates: 1 },
  { provider: "medlineplus", query: "diabetes", minCandidates: 1 },
  { provider: "openfda-label", query: "semaglutide", minCandidates: 1 },
];

const optionalChecks = [
  { provider: "openfda-faers", query: "semaglutide" },
  { provider: "openfda-enforcement", query: "semaglutide" },
  { provider: "openfda-ndc", query: "semaglutide" },
  { provider: "openfda-drugsfda", query: "semaglutide" },
];

const unauthorized = await fetch(`${baseUrl}/api/internal/connectors/pubmed?query=semaglutide&limit=1`);
assert.equal(unauthorized.status, 401, "Unauthenticated internal connector request must return 401.");

const requiredResults = [];
for (const check of requiredChecks) {
  requiredResults.push(await runCheck(check, true));
}

const optionalResults = [];
for (const check of optionalChecks) {
  optionalResults.push(await runCheck(check, false));
}

const failedRequired = requiredResults.filter((result) => !result.ok);
if (failedRequired.length > 0) {
  for (const result of failedRequired) console.error(`${result.provider} failed: ${result.error}`);
  process.exit(1);
}

console.log("Live connector validation passed for required providers:");
for (const result of requiredResults) {
  console.log(`- ${result.provider}: ${result.count} candidates`);
}

console.log("Optional connector live status:");
for (const result of optionalResults) {
  console.log(`- ${result.provider}: ${result.ok ? `${result.count} candidates` : `not passing (${result.error})`}`);
}

async function runCheck(check, required) {
  const url = `${baseUrl}/api/internal/connectors/${check.provider}?query=${encodeURIComponent(check.query)}&limit=2`;
  try {
    const response = await fetch(url, { headers: { "x-evidara-internal-token": token } });
    if (!response.ok) return { provider: check.provider, ok: false, count: 0, error: `HTTP ${response.status}` };
    const body = await response.json();
    const candidates = Array.isArray(body.candidates) ? body.candidates : [];

    for (const candidate of candidates) {
      assert.equal(candidate.candidateOnly, true, `${check.provider} candidate must be candidateOnly=true.`);
      assert.equal(candidate.generatedClaim, false, `${check.provider} candidate must be generatedClaim=false.`);
      assert.ok(candidate.sourceProvider, `${check.provider} candidate missing sourceProvider.`);
      assert.ok(candidate.sourceTitle, `${check.provider} candidate missing sourceTitle.`);
      assert.ok(candidate.sourceUrl, `${check.provider} candidate missing sourceUrl.`);
      assert.ok(candidate.accessDate, `${check.provider} candidate missing accessDate.`);
      assert.ok(candidate.retrievedAt, `${check.provider} candidate missing retrievedAt.`);
    }

    const minCandidates = check.minCandidates ?? 0;
    if (candidates.length < minCandidates) {
      return {
        provider: check.provider,
        ok: false,
        count: candidates.length,
        error: `expected at least ${minCandidates} candidates, got ${candidates.length}; errors=${JSON.stringify(body.errors ?? [])}`,
      };
    }

    if (required && Array.isArray(body.errors) && body.errors.length > 0) {
      return { provider: check.provider, ok: false, count: candidates.length, error: body.errors.join("; ") };
    }

    return { provider: check.provider, ok: true, count: candidates.length };
  } catch (error) {
    return { provider: check.provider, ok: false, count: 0, error: error instanceof Error ? error.message : "unknown error" };
  }
}
