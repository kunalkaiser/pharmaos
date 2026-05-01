import { NextResponse } from "next/server";
import { listSeededEvidencePackets } from "@/lib/evidence-foundation";

export const runtime = "nodejs";

export async function GET() {
  try {
    const packets = await listSeededEvidencePackets();

    return NextResponse.json({
      ok: true,
      dataScope: "internal_manual_seed",
      liveRetrieval: false,
      authRequiredBeforeProduction: true,
      packets,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Seeded evidence packets could not be loaded.",
        liveRetrieval: false,
      },
      { status: 500 }
    );
  }
}
