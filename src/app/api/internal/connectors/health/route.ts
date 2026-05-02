import { NextResponse } from "next/server";
import { getConnectorHealth } from "@/lib/connectors/health";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const providers = url.searchParams.get("providers")?.split(",").map((item) => item.trim()).filter(Boolean);
  const live = url.searchParams.get("live") === "true" || url.searchParams.get("live") === "1";
  const health = await getConnectorHealth({ live, providers });
  return NextResponse.json({
    ok: true,
    internalOnly: true,
    ...health,
  });
}
