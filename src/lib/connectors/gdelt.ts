import "server-only";

import { getRegistryEntry } from "./source-registry";
import type { ConnectorSearchParams, ConnectorSearchResult, EvidenceCandidate } from "./types";
import { fetchJson, sanitizeQuery, stableCandidateId, today } from "./http";

type GdeltResponse = { articles?: Array<{ title?: string; url?: string; seendate?: string; sourcecountry?: string; domain?: string; socialimage?: string }> };

export async function searchGdelt(params: ConnectorSearchParams): Promise<ConnectorSearchResult> {
  const providerId = "gdelt";
  const registry = getRegistryEntry(providerId);
  const query = sanitizeQuery(params.query);
  const retrievedAt = new Date().toISOString();
  const accessDate = today();

  try {
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=ArtList&format=json&maxrecords=${params.maxResults}`;
    const data = await fetchJson<GdeltResponse>(url, params.timeoutMs);
    const candidates: EvidenceCandidate[] = (data.articles ?? []).slice(0, params.maxResults).map((item) => ({
      candidateId: stableCandidateId(providerId, item.url ?? item.title ?? query),
      sourceProvider: providerId,
      sourceDisplayName: registry?.displayName ?? "GDELT",
      sourceCategory: "news_rss",
      sourceType: "news_item",
      sourceIdentifier: item.url,
      sourceTitle: item.title ?? "GDELT article",
      sourceUrl: item.url ?? "https://www.gdeltproject.org/",
      publicationDate: item.seendate,
      accessDate,
      retrievedAt,
      geography: item.sourcecountry,
      sourceLicenseNote: "GDELT public media signal candidate; original publisher terms still apply.",
      termsReviewRequired: registry?.termsReviewRequired ?? true,
      raw: { domain: item.domain },
      confidence: "partial",
      candidateOnly: true,
      generatedClaim: false,
      promotionStatus: "not_eligible",
      limitationNotes: ["News/media signal only; not scientific evidence and not a generated claim.", "Do not scrape paywalled publisher pages."],
    }));
    return { providerId, candidates, errors: [] };
  } catch (error) {
    return { providerId, candidates: [], errors: [error instanceof Error ? error.message : "GDELT connector failed."] };
  }
}
