import { NextResponse } from "next/server";
import { connectorSearchParams, getNewsProviders, runCombinedSearch, validateConnectorQuery } from "@/lib/connectors";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = connectorSearchParams(url.searchParams);
  const queryError = validateConnectorQuery(params.query);
  if (queryError) return NextResponse.json({ ok: false, error: queryError, candidateOnly: true, generatedClaims: false }, { status: 400 });

  const response = await runCombinedSearch(params, getNewsProviders());
  return NextResponse.json({ ok: true, newsSignalsOnly: true, ...response });
}
