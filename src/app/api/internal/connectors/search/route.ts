import { NextResponse } from "next/server";
import { connectorSearchParams, runCombinedSearch, validateConnectorQuery } from "@/lib/connectors";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const params = connectorSearchParams(url.searchParams);
  const queryError = validateConnectorQuery(params.query);
  if (queryError) return NextResponse.json({ ok: false, error: queryError, candidateOnly: true, generatedClaims: false }, { status: 400 });

  const providers = url.searchParams.get("providers")?.split(",").map((item) => item.trim()).filter(Boolean);
  const response = await runCombinedSearch(params, providers && providers.length > 0 ? providers : undefined);
  return NextResponse.json({ ok: true, ...response });
}
