import { NextResponse } from "next/server";
import { getSeededEvidencePacket } from "@/lib/evidence-foundation";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const packet = await getSeededEvidencePacket(id);

    if (!packet) {
      return NextResponse.json(
        {
          ok: false,
          error: "Seeded evidence packet not found.",
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
      packet,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Seeded evidence packet could not be loaded.",
        liveRetrieval: false,
      },
      { status: 500 }
    );
  }
}
