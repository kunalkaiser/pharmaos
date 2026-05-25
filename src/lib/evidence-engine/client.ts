import "server-only";

import type {
  EvidenceEngineChain,
  EvidenceEngineHealth,
  EvidenceEngineRunRequest,
  EvidenceEngineRunResponse,
} from "./types";

const defaultEngineBaseUrl = "https://evidaraos-python-api-production.up.railway.app";

function engineBaseUrl() {
  return (process.env.EVIDARA_ENGINE_BASE_URL ?? defaultEngineBaseUrl).replace(/\/$/, "");
}

function engineHeaders() {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "user-agent": "EvidaraOS Next product shell; server-side evidence engine bridge",
  };
  if (process.env.EVIDARA_ENGINE_INTERNAL_TOKEN) {
    headers["x-evidara-engine-token"] = process.env.EVIDARA_ENGINE_INTERNAL_TOKEN;
  }
  return headers;
}

async function parseEngineResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    const message =
      typeof body === "object" && body && "detail" in body
        ? String((body as { detail: unknown }).detail)
        : `Evidence engine request failed with HTTP ${response.status}.`;
    throw new Error(message);
  }

  return body as T;
}

export async function getEvidenceEngineHealth(): Promise<EvidenceEngineHealth> {
  const response = await fetch(`${engineBaseUrl()}/health`, {
    method: "GET",
    headers: engineHeaders(),
    cache: "no-store",
  });
  return parseEngineResponse<EvidenceEngineHealth>(response);
}

export async function getEvidenceEngineChains(): Promise<EvidenceEngineChain[]> {
  const response = await fetch(`${engineBaseUrl()}/platform/chains`, {
    method: "GET",
    headers: engineHeaders(),
    cache: "no-store",
  });
  return parseEngineResponse<EvidenceEngineChain[]>(response);
}

export async function runEvidenceEngineChain(input: EvidenceEngineRunRequest): Promise<EvidenceEngineRunResponse> {
  const response = await fetch(`${engineBaseUrl()}/analysis/run`, {
    method: "POST",
    headers: engineHeaders(),
    cache: "no-store",
    body: JSON.stringify({
      chain_id: input.chain_id,
      question: input.question,
      drug: input.drug ?? "",
      indication: input.indication ?? "",
      max_results: input.max_results ?? 10,
      live_search: input.live_search ?? false,
      records: [],
    }),
  });
  return parseEngineResponse<EvidenceEngineRunResponse>(response);
}
