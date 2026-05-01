import "server-only";

import { getRegistryEntry } from "./source-registry";
import type { ConnectorSearchParams, ConnectorSearchResult, EvidenceCandidate } from "./types";
import { fetchJson, fetchText, sanitizeQuery, stableCandidateId, today, xmlText } from "./http";

type ESearchResponse = { esearchresult?: { idlist?: string[] } };

export async function searchPubMed(params: ConnectorSearchParams): Promise<ConnectorSearchResult> {
  const providerId = "pubmed";
  const registry = getRegistryEntry(providerId);
  const query = sanitizeQuery(params.query);
  const retrievedAt = new Date().toISOString();
  const accessDate = today();
  const apiKey = process.env.NCBI_API_KEY;
  const apiKeyParam = apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : "";

  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=${params.maxResults}&term=${encodeURIComponent(query)}${apiKeyParam}`;
    const search = await fetchJson<ESearchResponse>(searchUrl, params.timeoutMs);
    const ids = search.esearchresult?.idlist ?? [];
    if (ids.length === 0) return { providerId, candidates: [], errors: [] };

    const summaryXml = await fetchText(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id=${ids.join(",")}${apiKeyParam}`, params.timeoutMs);
    const articles = [...summaryXml.matchAll(/<PubmedArticle[\s\S]*?<\/PubmedArticle>/gi)].slice(0, params.maxResults);

    const candidates: EvidenceCandidate[] = articles.map((article, index) => {
      const xml = article[0];
      const pmid = xmlText(xml, "PMID") || ids[index];
      const title = xmlText(xml, "ArticleTitle") || `PubMed record ${pmid}`;
      const journal = xmlText(xml, "Title");
      const year = xmlText(xml, "Year");
      const abstractText = [...xml.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/gi)]
        .map((item) => item[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join(" ");

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
        sourceLicenseNote: "NCBI/PubMed public metadata candidate; review source terms before storage at scale.",
        termsReviewRequired: registry?.termsReviewRequired ?? false,
        raw: { pmid, journal },
        confidence: "retrieved",
        candidateOnly: true,
        generatedClaim: false,
        promotionStatus: "eligible_after_review",
        limitationNotes: ["Candidate literature record only; not a generated evidence claim.", "Requires human review before promotion to citation/evidence_record."],
      };
    });

    return { providerId, candidates, errors: [] };
  } catch (error) {
    return { providerId, candidates: [], errors: [error instanceof Error ? error.message : "PubMed connector failed."] };
  }
}
