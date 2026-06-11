import "server-only";

import type {
  EvidenceEngineChain,
  EvidenceEngineHealth,
  EvidenceEngineDocumentChatRequest,
  EvidenceEngineDocumentChatResponse,
  EvidenceEngineExportRequest,
  EvidenceEngineExportResponse,
  EvidenceEngineFaersRequest,
  EvidenceEngineHydrateRecordRequest,
  EvidenceEngineLabelRequest,
  EvidenceEnginePdfExtractionRequest,
  EvidenceEnginePdfExtractionResponse,
  EvidenceEnginePipelineRunRequest,
  EvidenceEngineProtocolRequest,
  EvidenceEngineProtocolResponse,
  EvidenceEngineRunRequest,
  EvidenceEngineRunResponse,
  EvidenceEngineTrialsRequest,
  EvidenceEngineUniversalQueryRequest,
} from "./types";

function engineBaseUrl() {
  const base = process.env.EVIDARA_ENGINE_BASE_URL?.trim();
  if (!base) {
    // No implicit default — a missing value must fail loudly rather than silently
    // routing to a hardcoded production backend (how local dev used to hit prod).
    throw new Error(
      "EVIDARA_ENGINE_BASE_URL is not set. Configure the evidence engine base URL " +
        "explicitly per environment — e.g. https://evidence-os-production.up.railway.app",
    );
  }
  return base.replace(/\/$/, "");
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
    const detail = typeof body === "object" && body && "detail" in body ? (body as { detail: unknown }).detail : null;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail
              .map((item) =>
                typeof item === "object" && item && "msg" in item
                  ? String((item as { msg: unknown }).msg)
                  : JSON.stringify(item),
              )
              .join("; ")
          : detail
            ? JSON.stringify(detail)
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
  const framework = input.framework === "PICOT" ? "PICO" : input.framework || null;
  const response = await fetch(`${engineBaseUrl()}/analysis/run`, {
    method: "POST",
    headers: engineHeaders(),
    cache: "no-store",
    body: JSON.stringify({
      chain_id: input.chain_id,
      question: input.question,
      drug: input.drug ?? "",
      indication: input.indication ?? "",
      framework,
      population: input.population ?? "",
      intervention_or_exposure: input.intervention_or_exposure ?? "",
      comparator: input.comparator ?? "",
      outcomes: input.outcomes ?? [],
      timeframe: input.timeframe ?? "",
      context: input.context ?? "",
      max_results: input.max_results ?? 10,
      live_search: input.live_search ?? false,
      records: [],
    }),
  });
  return parseEngineResponse<EvidenceEngineRunResponse>(response);
}

export async function buildEvidenceEngineProtocol(input: EvidenceEngineProtocolRequest): Promise<EvidenceEngineProtocolResponse> {
  const framework = input.framework === "PICOT" ? "PICO" : input.framework || null;
  const response = await fetch(`${engineBaseUrl()}/review/start`, {
    method: "POST",
    headers: engineHeaders(),
    cache: "no-store",
    body: JSON.stringify({
      question: input.question,
      framework,
    }),
  });
  return parseEngineResponse<EvidenceEngineProtocolResponse>(response);
}

export async function runEvidenceEnginePdfExtraction(
  input: EvidenceEnginePdfExtractionRequest,
): Promise<EvidenceEnginePdfExtractionResponse> {
  const response = await fetch(`${engineBaseUrl()}/manual-pdf/extract`, {
    method: "POST",
    headers: engineHeaders(),
    cache: "no-store",
    body: JSON.stringify({
      question: input.question,
      title: input.title,
      doi: input.doi ?? "",
      pmid: input.pmid ?? "",
      source_url: input.source_url ?? "",
      filename: input.filename ?? "",
      source_text: input.source_text ?? "",
      pdf_base64: input.pdf_base64 ?? "",
      population: input.population ?? "",
      intervention_or_exposure: input.intervention_or_exposure ?? "",
      comparator: input.comparator ?? "",
      outcomes: input.outcomes ?? [],
    }),
  });
  return parseEngineResponse<EvidenceEnginePdfExtractionResponse>(response);
}

export async function runEvidenceEngineDocumentChat(
  input: EvidenceEngineDocumentChatRequest,
): Promise<EvidenceEngineDocumentChatResponse> {
  const response = await fetch(`${engineBaseUrl()}/documents/chat`, {
    method: "POST",
    headers: engineHeaders(),
    cache: "no-store",
    body: JSON.stringify({
      question: input.question,
      title: input.title ?? "",
      doi: input.doi ?? "",
      pmid: input.pmid ?? "",
      source_url: input.source_url ?? "",
      filename: input.filename ?? "",
      source_text: input.source_text ?? "",
      pdf_base64: input.pdf_base64 ?? "",
      docx_base64: input.docx_base64 ?? "",
    }),
  });
  return parseEngineResponse<EvidenceEngineDocumentChatResponse>(response);
}

export async function runEvidenceEngineExport(input: EvidenceEngineExportRequest): Promise<EvidenceEngineExportResponse> {
  const response = await fetch(`${engineBaseUrl()}/export`, {
    method: "POST",
    headers: engineHeaders(),
    cache: "no-store",
    body: JSON.stringify(input),
  });
  return parseEngineResponse<EvidenceEngineExportResponse>(response);
}

export async function runEvidenceEngineUniversalQuery(input: EvidenceEngineUniversalQueryRequest): Promise<Record<string, unknown>> {
  const response = await fetch(`${engineBaseUrl()}/query/run`, {
    method: "POST",
    headers: engineHeaders(),
    cache: "no-store",
    body: JSON.stringify({
      question: input.question,
      max_results: input.max_results ?? 10,
      live_search: input.live_search ?? false,
      include_faers: input.include_faers ?? false,
    }),
  });
  return parseEngineResponse<Record<string, unknown>>(response);
}

export async function hydrateEvidenceEngineRecord(input: EvidenceEngineHydrateRecordRequest): Promise<Record<string, unknown>> {
  const response = await fetch(`${engineBaseUrl()}/records/hydrate`, {
    method: "POST",
    headers: engineHeaders(),
    cache: "no-store",
    body: JSON.stringify(input),
  });
  return parseEngineResponse<Record<string, unknown>>(response);
}

export async function runEvidenceEngineFaers(input: EvidenceEngineFaersRequest): Promise<Record<string, unknown>> {
  const response = await fetch(`${engineBaseUrl()}/safety/faers`, {
    method: "POST",
    headers: engineHeaders(),
    cache: "no-store",
    body: JSON.stringify({
      drug: input.drug,
      indication: input.indication ?? "",
      max_results: input.max_results ?? 100,
      live_fetch: input.live_fetch ?? false,
    }),
  });
  return parseEngineResponse<Record<string, unknown>>(response);
}

export async function runEvidenceEngineTrials(input: EvidenceEngineTrialsRequest): Promise<Record<string, unknown>> {
  const response = await fetch(`${engineBaseUrl()}/trials/search`, {
    method: "POST",
    headers: engineHeaders(),
    cache: "no-store",
    body: JSON.stringify({
      condition: input.condition ?? "",
      intervention: input.intervention ?? "",
      query: input.query ?? "",
      max_results: input.max_results ?? 10,
      live_fetch: input.live_fetch ?? true,
    }),
  });
  return parseEngineResponse<Record<string, unknown>>(response);
}

export async function runEvidenceEngineLabel(input: EvidenceEngineLabelRequest): Promise<Record<string, unknown>> {
  const response = await fetch(`${engineBaseUrl()}/regulatory/label`, {
    method: "POST",
    headers: engineHeaders(),
    cache: "no-store",
    body: JSON.stringify({
      drug: input.drug,
      max_results: input.max_results ?? 5,
      live_fetch: input.live_fetch ?? true,
    }),
  });
  return parseEngineResponse<Record<string, unknown>>(response);
}

export async function createEvidenceEnginePipelineRun(input: EvidenceEnginePipelineRunRequest): Promise<Record<string, unknown>> {
  const response = await fetch(`${engineBaseUrl()}/runs`, {
    method: "POST",
    headers: engineHeaders(),
    cache: "no-store",
    body: JSON.stringify({
      question: input.question,
      kind: input.kind ?? "universal_query",
      max_results: input.max_results ?? 10,
      live_search: input.live_search ?? false,
      include_faers: input.include_faers ?? false,
      metadata: input.metadata ?? {},
    }),
  });
  return parseEngineResponse<Record<string, unknown>>(response);
}

export async function listEvidenceEnginePipelineRuns(limit = 10): Promise<Array<Record<string, unknown>>> {
  const response = await fetch(`${engineBaseUrl()}/runs?limit=${encodeURIComponent(String(limit))}`, {
    method: "GET",
    headers: engineHeaders(),
    cache: "no-store",
  });
  return parseEngineResponse<Array<Record<string, unknown>>>(response);
}
