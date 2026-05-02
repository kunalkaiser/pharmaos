import { NextResponse } from "next/server";
import { scoreEvidencePacket } from "@/lib/epi-engine/scoring";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { evidencePacketId?: string } | null;
  if (!body?.evidencePacketId) {
    return NextResponse.json({ ok: false, error: "evidencePacketId is required." }, { status: 400 });
  }

  try {
    const result = await scoreEvidencePacket({
      evidencePacketId: body.evidencePacketId,
      organizationId: request.headers.get("x-evidara-organization-id") ?? undefined,
      createdBy: request.headers.get("x-evidara-actor-id") ?? undefined,
    });
    if (!result) return NextResponse.json({ ok: false, error: "Reviewed evidence packet not found." }, { status: 404 });

    return NextResponse.json({
      ok: true,
      ...result,
      generatedClaims: false,
      autonomousRecommendation: false,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Scoring failed.", generatedClaims: false },
      { status: 409 },
    );
  }
}
