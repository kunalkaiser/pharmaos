import "server-only";

import { getRegistryEntry } from "./source-registry";
import type { ConnectorSearchParams, ConnectorSearchResult, EvidenceCandidate } from "./types";
import { fetchJson, fetchText, sanitizeQuery, stableCandidateId, today, xmlText } from "./http";

type ESearchResponse = { esearchresult?: { idlist?: string[] } };

// Known PMIDs for major pembrolizumab NSCLC Phase 3 RCTs.
// Used as anchors when the query references a named trial — ensures landmark
// papers are always included regardless of generic keyword scoring.
const KEYNOTE_ANCHOR_PMIDS: Record<string, string[]> = {
  // KEYNOTE-024: pembrolizumab monotherapy vs chemo, 1L NSCLC PD-L1 ≥50%
  // Primary: Reck NEJM 2016; updates: 30mo OS, 5y OS, final OS
  "keynote-024": ["27718847", "30620668", "32926507", "34543477"],
  "nct02142738": ["27718847"],
  // KEYNOTE-189: pembrolizumab + pemetrexed/platinum, 1L non-squamous NSCLC
  // Primary: Gandhi NEJM 2018; PRO sub-study: Garassino Lancet Oncol 2020
  "keynote-189": ["29658856", "32035514"],
  "nct02578680": ["29658856"],
  // KEYNOTE-407: pembrolizumab + carboplatin/paclitaxel, 1L squamous NSCLC
  // Primary: Paz-Ares NEJM 2018; final analysis: Paz-Ares JTO 2020; 5y OS: Novello JCO 2023
  "keynote-407": ["30280635", "32599071", "36735893"],
  "nct02775435": ["30280635"],
  // KEYNOTE-010: pembrolizumab vs docetaxel, 2L NSCLC PD-L1 ≥1%
  "keynote-010": ["27093101"],
  "nct01905657": ["27093101"],
};

const CLINICAL_EVIDENCE_RE =
  /\b(trial|rct|phase|efficacy|safety|randomized|pembrolizumab|nivolumab|atezolizumab|checkpoint|immunotherapy|chemotherapy|nsclc|cancer|tumor|oncology|msl|briefing|keynote|checkmate|impower|indication)\b/i;

function buildPubMedQuery(rawQuery: string): string {
  const q = sanitizeQuery(rawQuery);
  if (CLINICAL_EVIDENCE_RE.test(q)) {
    return (
      q +
      ' AND (Randomized Controlled Trial[Publication Type] OR "Clinical Trial, Phase III"[Publication Type])'
    );
  }
  return q;
}

function detectAnchorPmids(rawQuery: string): string[] {
  const lower = rawQuery.toLowerCase();
  const pmids = new Set<string>();
  for (const [key, ids] of Object.entries(KEYNOTE_ANCHOR_PMIDS)) {
    if (lower.includes(key)) {
      for (const id of ids) pmids.add(id);
    }
  }
  return [...pmids];
}

function extractPublicationTypes(articleXml: string): string[] {
  return [...articleXml.matchAll(/<PublicationType[^>]*>([\s\S]*?)<\/PublicationType>/gi)]
    .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
    .filter(Boolean);
}

function deriveTrialPhase(pubTypes: string[]): string | undefined {
  const lower = pubTypes.map((t) => t.toLowerCase());
  if (lower.some((t) => t.includes("phase iii") || t.includes("phase 3"))) return "Phase III";
  if (lower.some((t) => t.includes("phase ii"))) return "Phase II";
  if (lower.some((t) => t.includes("phase i"))) return "Phase I";
  if (lower.some((t) => t.includes("randomized controlled trial"))) return "RCT";
  return undefined;
}

function deriveStudyDesign(pubTypes: string[]): string | undefined {
  const lower = pubTypes.map((t) => t.toLowerCase());
  if (lower.some((t) => t.includes("meta-analysis") || t.includes("systematic review"))) return "Meta-analysis/Systematic Review";
  if (lower.some((t) => t.includes("randomized controlled trial"))) return "Randomized Controlled Trial";
  if (lower.some((t) => t.includes("clinical trial"))) return "Clinical Trial";
  if (lower.some((t) => t.includes("observational"))) return "Observational";
  if (lower.some((t) => t.includes("case report"))) return "Case Report";
  if (lower.some((t) => t.includes("review"))) return "Review";
  return undefined;
}

function parseArticles(xml: string, ids: string[], providerId: string, registry: ReturnType<typeof getRegistryEntry>, accessDate: string, retrievedAt: string): EvidenceCandidate[] {
  const articles = [...xml.matchAll(/<PubmedArticle[\s\S]*?<\/PubmedArticle>/gi)];
  return articles.map((article, index) => {
    const articleXml = article[0];
    const pmid = xmlText(articleXml, "PMID") || ids[index];
    const title = xmlText(articleXml, "ArticleTitle") || `PubMed record ${pmid}`;
    const journal = xmlText(articleXml, "Title");
    const year = xmlText(articleXml, "Year");
    const abstractText = [...articleXml.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/gi)]
      .map((item) => item[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join(" ");

    const pubTypes = extractPublicationTypes(articleXml);
    const trialPhase = deriveTrialPhase(pubTypes);
    const studyDesign = deriveStudyDesign(pubTypes);

    const isPhase3Rct = trialPhase === "Phase III";
    const limitationNotes: string[] = [
      "Candidate literature record only; not a generated evidence claim.",
      "Requires human review before promotion to citation/evidence_record.",
    ];
    if (!isPhase3Rct) {
      limitationNotes.push("Study design is not Phase III RCT — verify before use in clinical briefings.");
    }

    return {
      candidateId: stableCandidateId(providerId, pmid),
      sourceProvider: providerId,
      sourceDisplayName: registry?.displayName ?? "PubMed",
      sourceCategory: "literature",
      sourceType: "literature",
      sourceIdentifier: `PMID:${pmid}`,
      sourceTitle: title,
      sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      publicationDate: year || undefined,
      accessDate,
      retrievedAt,
      abstractText: abstractText || undefined,
      datasetName: journal || undefined,
      trialPhase: trialPhase || undefined,
      studyDesign: studyDesign || undefined,
      publicationTypes: pubTypes.length > 0 ? pubTypes : undefined,
      sourceLicenseNote: "NCBI/PubMed public metadata candidate; review source terms before storage at scale.",
      termsReviewRequired: registry?.termsReviewRequired ?? false,
      raw: { pmid, journal, pubTypes },
      confidence: isPhase3Rct ? "retrieved" : "partial",
      candidateOnly: true,
      generatedClaim: false,
      promotionStatus: "eligible_after_review",
      limitationNotes,
    };
  });
}

export async function searchPubMed(params: ConnectorSearchParams): Promise<ConnectorSearchResult> {
  const providerId = "pubmed";
  const registry = getRegistryEntry(providerId);
  const retrievedAt = new Date().toISOString();
  const accessDate = today();
  const apiKey = process.env.NCBI_API_KEY;
  const apiKeyParam = apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : "";

  try {
    const builtQuery = buildPubMedQuery(params.query);
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=${params.maxResults}&term=${encodeURIComponent(builtQuery)}${apiKeyParam}`;
    const search = await fetchJson<ESearchResponse>(searchUrl, params.timeoutMs);
    const searchIds = search.esearchresult?.idlist ?? [];

    // Merge anchor PMIDs for named trials, deduplicating against search results.
    const anchorIds = detectAnchorPmids(params.query);
    const seenIds = new Set(searchIds);
    const newAnchorIds = anchorIds.filter((id) => !seenIds.has(id));
    const allIds = [...searchIds, ...newAnchorIds].slice(0, params.maxResults + newAnchorIds.length);

    if (allIds.length === 0) return { providerId, candidates: [], errors: [] };

    const summaryXml = await fetchText(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id=${allIds.join(",")}${apiKeyParam}`,
      params.timeoutMs,
    );

    const candidates = parseArticles(summaryXml, allIds, providerId, registry, accessDate, retrievedAt);

    // Surface Phase III RCTs first, then by publication recency.
    candidates.sort((a, b) => {
      const aIsPhase3 = a.trialPhase === "Phase III" ? 1 : 0;
      const bIsPhase3 = b.trialPhase === "Phase III" ? 1 : 0;
      if (bIsPhase3 !== aIsPhase3) return bIsPhase3 - aIsPhase3;
      return (b.publicationDate ?? "").localeCompare(a.publicationDate ?? "");
    });

    return { providerId, candidates, errors: [] };
  } catch (error) {
    return { providerId, candidates: [], errors: [error instanceof Error ? error.message : "PubMed connector failed."] };
  }
}
