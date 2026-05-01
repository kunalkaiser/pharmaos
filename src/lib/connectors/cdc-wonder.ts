import "server-only";

import type { ConnectorSearchParams, ConnectorSearchResult } from "./types";

export async function searchCdcWonder(params: ConnectorSearchParams): Promise<ConnectorSearchResult> {
  void params;
  return {
    providerId: "cdc-wonder",
    candidates: [],
    skipped: {
      providerId: "cdc-wonder",
      reason: "CDC WONDER requires a structured query design and terms review; live retrieval is deferred.",
    },
    errors: [],
  };
}
