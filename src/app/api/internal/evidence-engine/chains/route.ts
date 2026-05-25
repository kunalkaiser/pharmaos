import { NextResponse } from "next/server";
import { getEvidenceEngineChains, getEvidenceEngineHealth } from "@/lib/evidence-engine/client";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [health, chains] = await Promise.all([getEvidenceEngineHealth(), getEvidenceEngineChains()]);
    return NextResponse.json({
      ok: true,
      engineConnected: health.status === "ok",
      health,
      chains,
      internalOnly: true,
      candidateOnly: true,
      generatedClaims: false,
      limitations: [
        "The Python engine returns workflow artifacts and evidence candidates, not final reviewed claims.",
        "Human review and promotion remain required before report/PDF/scoring use.",
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        engineConnected: false,
        error: error instanceof Error ? error.message : "Evidence engine unavailable.",
        internalOnly: true,
        candidateOnly: true,
        generatedClaims: false,
      },
      { status: 502 }
    );
  }
}
