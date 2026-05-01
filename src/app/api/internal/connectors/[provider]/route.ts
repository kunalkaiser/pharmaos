import { NextResponse } from "next/server";
import { connectorSearchParams, runProviderSearch, validateConnectorQuery } from "@/lib/connectors";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const url = new URL(request.url);
  const searchParams = connectorSearchParams(url.searchParams);
  const queryError = validateConnectorQuery(searchParams.query);
  if (queryError) return NextResponse.json({ ok: false, error: queryError, candidateOnly: true, generatedClaims: false }, { status: 400 });

  const result = await runProviderSearch(provider, searchParams);
  if (result.skipped) {
    return NextResponse.json({ ok: true, liveRetrieval: false, generatedClaims: false, candidateOnly: true, ...result });
  }

  return NextResponse.json({ ok: true, liveRetrieval: true, generatedClaims: false, candidateOnly: true, ...result });
}
