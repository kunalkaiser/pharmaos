import "server-only";

import { createHash } from "node:crypto";

type SourceLike = {
  url?: string;
  pmid?: string;
  pmcid?: string;
  doi?: string;
  nctId?: string;
  fdaIdentifier?: string;
  sourceType?: string;
};

export function normalizeIdentifier(value?: string) {
  return value?.trim().toLowerCase().replace(/\s+/g, "") || "";
}

export function canonicalSourceKey(source: SourceLike) {
  const identifiers = [
    source.pmid ? `pmid:${normalizeIdentifier(source.pmid)}` : "",
    source.pmcid ? `pmcid:${normalizeIdentifier(source.pmcid)}` : "",
    source.doi ? `doi:${normalizeIdentifier(source.doi)}` : "",
    source.nctId ? `nct:${normalizeIdentifier(source.nctId)}` : "",
    source.fdaIdentifier ? `fda:${normalizeIdentifier(source.fdaIdentifier)}` : "",
  ].filter(Boolean);

  if (identifiers.length) return identifiers[0];
  if (source.url) return `url:${normalizeIdentifier(source.url)}`;
  return `source:${normalizeIdentifier(source.sourceType)}:${createHash("sha256").update(JSON.stringify(source)).digest("hex")}`;
}

export function citationDedupHash(input: {
  evidenceSourceId: string;
  citationText: string;
  sourceIdentifier: string;
  extractedField?: string;
}) {
  return createHash("sha256")
    .update([
      input.evidenceSourceId,
      input.sourceIdentifier.trim().toLowerCase(),
      input.extractedField?.trim().toLowerCase() ?? "",
      input.citationText.trim().toLowerCase().replace(/\s+/g, " "),
    ].join("|"))
    .digest("hex");
}
