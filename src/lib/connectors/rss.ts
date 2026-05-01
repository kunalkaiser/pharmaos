import "server-only";

import { getRegistryEntry } from "./source-registry";
import type { ConnectorSearchParams, ConnectorSearchResult, EvidenceCandidate } from "./types";
import { fetchText, parseRssItems, sanitizeQuery, stableCandidateId, today } from "./http";

const rssFeeds: Record<string, string> = {
  "fda-rss": "https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-releases/rss.xml",
  "fda-medwatch-rss": "https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program/rss.xml",
  "cdc-rss": "https://tools.cdc.gov/api/v2/resources/media/132608.rss",
  "nih-rss": "https://www.nih.gov/news-events/news-releases/feed.xml",
};

export async function searchRss(providerId: keyof typeof rssFeeds, params: ConnectorSearchParams): Promise<ConnectorSearchResult> {
  const registry = getRegistryEntry(providerId);
  const query = sanitizeQuery(params.query).toLowerCase();
  const retrievedAt = new Date().toISOString();
  const accessDate = today();

  try {
    const xml = await fetchText(rssFeeds[providerId], params.timeoutMs);
    const candidates: EvidenceCandidate[] = parseRssItems(xml)
      .filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(query))
      .slice(0, params.maxResults)
      .map((item) => ({
        candidateId: stableCandidateId(providerId, item.guid || item.link || item.title),
        sourceProvider: providerId,
        sourceDisplayName: registry?.displayName ?? providerId,
        sourceCategory: "news_rss",
        sourceType: "news_item",
        sourceIdentifier: item.guid || item.link,
        sourceTitle: item.title || `${providerId} news item`,
        sourceUrl: item.link || rssFeeds[providerId],
        publicationDate: item.pubDate || undefined,
        accessDate,
        retrievedAt,
        evidenceText: item.description || undefined,
        sourceLicenseNote: "Official public RSS candidate; news/media signal only.",
        termsReviewRequired: registry?.termsReviewRequired ?? false,
        raw: item,
        confidence: "retrieved",
        candidateOnly: true,
        generatedClaim: false,
        promotionStatus: "not_eligible",
        limitationNotes: ["News/media signal only; not scientific evidence and not a generated claim."],
      }));
    return { providerId, candidates, errors: [] };
  } catch (error) {
    return { providerId, candidates: [], errors: [error instanceof Error ? error.message : `${providerId} RSS connector failed.`] };
  }
}
