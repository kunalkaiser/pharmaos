import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      retired: true,
      error: "Seeded/manual evidence packet citation endpoints are retired. EvidaraOS internal APIs return real public-source candidates only.",
      liveRetrieval: false,
      candidateOnly: true,
      generatedClaims: false,
    },
    { status: 410 }
  );
}
