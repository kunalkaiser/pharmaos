import "server-only";

import { createHash } from "node:crypto";
import type { EvidenceCandidate } from "@/lib/connectors/types";
import type { EvidenceEngineChainId, EvidenceEngineRunResponse } from "./types";

type RawRecord = Record<string, unknown>;

const skippedArrayKeys = new Set([
  "audit_events",
  "exclusion_criteria",
  "inclusion_criteria",
  "limitations",
  "outputs",
  "llm_strengthens",
]);

const sourceDisplayNames: Record<string, string> = {
  pubmed: "PubMed",
  semantic_scholar: "Semantic Scholar",
  crossref: "Crossref",
  clinicaltrials: "ClinicalTrials.gov",
  clinicaltrials_gov: "ClinicalTrials.gov",
  openfda: "openFDA",
  openfda_faers: "openFDA FAERS",
  dailymed: "DailyMed",
  rxnorm: "RxNorm",
  fda_label: "FDA label",
  python_engine: "EvidaraOS Python Engine",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function now() {
  return new Date().toISOString();
}

function cleanText(value: unknown, maxLength = 1200) {
  if (typeof value === "string") return value.trim().slice(0, maxLength);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function firstText(record: RawRecord, keys: string[], maxLength = 1200) {
  for (const key of keys) {
    const value = cleanText(record[key], maxLength);
    if (value) return value;
  }
  return "";
}

function nestedFirstText(record: RawRecord, paths: string[][], maxLength = 1200) {
  for (const path of paths) {
    let current: unknown = record;
    for (const key of path) {
      if (!current || typeof current !== "object") {
        current = undefined;
        break;
      }
      current = (current as RawRecord)[key];
    }
    const value = cleanText(current, maxLength);
    if (value) return value;
  }
  return "";
}

function normalizeSourceProvider(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized.includes("pubmed")) return "pubmed";
  if (normalized.includes("semantic")) return "semantic_scholar";
  if (normalized.includes("crossref")) return "crossref";
  if (normalized.includes("clinicaltrials") || normalized.includes("clinical_trials")) return "clinicaltrials";
  if (normalized.includes("faers")) return "openfda_faers";
  if (normalized.includes("openfda")) return "openfda";
  if (normalized.includes("dailymed")) return "dailymed";
  if (normalized.includes("rxnorm")) return "rxnorm";
  if (normalized.includes("fda")) return "fda_label";
  return normalized || "python_engine";
}

function sourceCategory(provider: string): EvidenceCandidate["sourceCategory"] {
  if (provider === "clinicaltrials" || provider === "clinicaltrials_gov") return "clinical_trials";
  if (provider === "openfda" || provider === "openfda_faers") return "drug_safety";
  if (provider === "dailymed" || provider === "fda_label") return "drug_label";
  if (provider === "rxnorm") return "terminology";
  return "literature";
}

function sourceType(provider: string): EvidenceCandidate["sourceType"] {
  if (provider === "clinicaltrials" || provider === "clinicaltrials_gov") return "clinical_trial";
  if (provider === "openfda" || provider === "openfda_faers") return "adverse_event";
  if (provider === "dailymed" || provider === "fda_label") return "drug_label";
  if (provider === "rxnorm") return "terminology";
  return "literature";
}

function inferProvider(record: RawRecord, url: string) {
  const explicit = firstText(record, ["source", "sourceProvider", "provider", "database", "registry"], 80);
  if (explicit) return normalizeSourceProvider(explicit);
  if (firstText(record, ["pmid", "PMID"], 80) || /pubmed\.ncbi\.nlm\.nih\.gov/i.test(url)) return "pubmed";
  if (firstText(record, ["nct_id", "nctId", "nct_number"], 80) || /clinicaltrials\.gov/i.test(url)) return "clinicaltrials";
  if (/api\.fda\.gov|openfda/i.test(url)) return "openfda";
  if (/dailymed\.nlm\.nih\.gov/i.test(url)) return "dailymed";
  if (firstText(record, ["doi", "DOI"], 220) || /doi\.org/i.test(url)) return "crossref";
  return "python_engine";
}

function inferUrl(record: RawRecord) {
  const direct = firstText(record, ["url", "sourceUrl", "source_url", "link", "landing_page", "landingPage", "web_url", "webUrl"], 900);
  if (direct && /^https?:\/\//i.test(direct)) return direct;

  const pmid = firstText(record, ["pmid", "PMID"], 80).replace(/^PMID:?/i, "").trim();
  if (pmid) return `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(pmid)}/`;

  const nctId = firstText(record, ["nct_id", "nctId", "nct_number", "NCTId"], 80).toUpperCase();
  if (/^NCT[0-9]+$/.test(nctId)) return `https://clinicaltrials.gov/study/${nctId}`;

  const doi = firstText(record, ["doi", "DOI"], 220).replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim();
  if (doi) return `https://doi.org/${encodeURIComponent(doi)}`;

  return "";
}

function inferIdentifier(record: RawRecord, provider: string, url: string) {
  const explicit = firstText(record, ["sourceIdentifier", "source_identifier", "identifier", "id", "record_id", "recordId"], 240);
  const pmid = firstText(record, ["pmid", "PMID"], 80).replace(/^PMID:?/i, "").trim();
  const nctId = firstText(record, ["nct_id", "nctId", "nct_number", "NCTId"], 80).toUpperCase();
  const doi = firstText(record, ["doi", "DOI"], 220).replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").trim();

  if (provider === "pubmed" && pmid) return `PMID:${pmid}`;
  if ((provider === "clinicaltrials" || provider === "clinicaltrials_gov") && /^NCT[0-9]+$/.test(nctId)) return nctId;
  if (doi) return `DOI:${doi}`;
  if (explicit && !/^https?:\/\//i.test(explicit)) return explicit;
  return url;
}

function inferTitle(record: RawRecord) {
  return (
    firstText(record, ["title", "sourceTitle", "source_title", "brief_title", "briefTitle", "name"], 600) ||
    nestedFirstText(record, [["protocolSection", "identificationModule", "briefTitle"]], 600)
  );
}

function inferEvidenceText(record: RawRecord) {
  return (
    firstText(record, ["evidenceText", "evidence_text", "abstract", "abstractText", "abstract_text", "summary", "description"], 3000) ||
    nestedFirstText(record, [["protocolSection", "descriptionModule", "briefSummary"]], 3000)
  );
}

function publicationDate(record: RawRecord) {
  return firstText(record, ["publication_date", "publicationDate", "published", "year", "date", "startDate"], 40);
}

function candidateId(chainId: EvidenceEngineChainId, provider: string, identifier: string, title: string) {
  return `engine:${chainId}:${createHash("sha256").update(`${provider}|${identifier}|${title}`).digest("hex").slice(0, 24)}`;
}

function collectRecordArrays(value: unknown, path: string[] = [], output: RawRecord[] = []) {
  if (Array.isArray(value)) {
    const key = path.at(-1) ?? "";
    if (!skippedArrayKeys.has(key) && value.some((item) => looksLikeSourceRecord(item))) {
      output.push(...value.filter(isPlainObject));
    } else {
      for (const item of value) collectRecordArrays(item, path, output);
    }
    return output;
  }

  if (isPlainObject(value)) {
    for (const [key, child] of Object.entries(value)) {
      if (key === "report_markdown" || key === "markdown_table") continue;
      collectRecordArrays(child, [...path, key], output);
    }
  }

  return output;
}

function isPlainObject(value: unknown): value is RawRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function looksLikeSourceRecord(value: unknown) {
  if (!isPlainObject(value)) return false;
  const title = inferTitle(value);
  const url = inferUrl(value);
  const hasIdentifier = Boolean(firstText(value, ["pmid", "PMID", "doi", "DOI", "nct_id", "nctId", "sourceIdentifier", "source_identifier", "url", "sourceUrl"], 240));
  return Boolean(title && (url || hasIdentifier));
}

function dedupeCandidates(candidates: EvidenceCandidate[]) {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.sourceProvider}|${candidate.sourceIdentifier ?? ""}|${candidate.sourceUrl}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function adaptEngineRunToEvidenceCandidates(result: EvidenceEngineRunResponse, input: {
  chainId: EvidenceEngineChainId;
  question: string;
  drug?: string;
  indication?: string;
}): EvidenceCandidate[] {
  const records = collectRecordArrays(result.artifacts);
  const candidates = records.flatMap((record) => {
    const title = inferTitle(record);
    const url = inferUrl(record);
    if (!title || !url) return [];

    const provider = inferProvider(record, url);
    const identifier = inferIdentifier(record, provider, url);
    const text = inferEvidenceText(record);
    const limitations = [
      "Candidate generated from Python evidence engine output; human review is required before promotion.",
      "The candidate is not a final evidence claim and may require full-text verification.",
    ];

    const candidate: EvidenceCandidate = {
      candidateId: candidateId(input.chainId, provider, identifier, title),
      sourceProvider: provider,
      sourceDisplayName: sourceDisplayNames[provider] ?? provider,
      sourceCategory: sourceCategory(provider),
      sourceType: sourceType(provider),
      sourceIdentifier: identifier,
      sourceTitle: title,
      sourceUrl: url,
      publicationDate: publicationDate(record) || undefined,
      accessDate: today(),
      retrievedAt: now(),
      evidenceText: text || undefined,
      abstractText: text || undefined,
      condition: firstText(record, ["condition", "disease", "indication"], 240) || input.indication,
      disease: firstText(record, ["disease", "condition", "indication"], 240) || input.indication,
      drug: firstText(record, ["drug", "intervention"], 160) || input.drug,
      intervention: firstText(record, ["intervention", "drug"], 160) || input.drug,
      trialPhase: firstText(record, ["phase", "trialPhase"], 80) || undefined,
      trialStatus: firstText(record, ["status", "trialStatus"], 80) || undefined,
      sourceLicenseNote: "Public source metadata candidate; terms and source fitness require review before reuse.",
      termsReviewRequired: true,
      raw: {
        module: input.chainId,
        question: input.question,
        record,
      },
      confidence: text ? "partial" : "needs_review",
      candidateOnly: true,
      generatedClaim: false,
      promotionStatus: "eligible_after_review",
      limitationNotes: limitations,
    };

    return [candidate];
  });

  return dedupeCandidates(candidates);
}
