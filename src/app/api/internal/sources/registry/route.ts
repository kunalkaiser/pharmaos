import { NextResponse } from "next/server";
import { sourceRegistry } from "@/lib/connectors/source-registry";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    ok: true,
    publicWebsiteConnected: false,
    candidateOnly: true,
    generatedClaims: false,
    providers: sourceRegistry,
  });
}
