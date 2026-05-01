import { NextResponse } from "next/server";
import { getSeededEvidencePacketCitations } from "@/lib/evidence-foundation";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const citations = await getSeededEvidencePacketCitations(id);

    if (!citations) {
      return NextResponse.json(
        {
          ok: false,
          error: "Seeded evidence packet citations not found.",
          dataScope: "internal_manual_seed",
          liveRetrieval: false,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      dataScope: "internal_manual_seed",
      liveRetrieval: false,
      authRequiredBeforeProduction: true,
      citations,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Seeded evidence packet citations could not be loaded.",
        liveRetrieval: false,
      },
      { status: 500 }
    );
  }
}
