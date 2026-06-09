import { NextResponse } from "next/server";
import { runCompetitiveIntel } from "@/lib/competitive-intel/service";
import type { CompetitiveIntelRequest } from "@/lib/competitive-intel/types";

export const runtime = "nodejs";

function parseCompetitors(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === "string") return value.split(/[\n,;]/).map((item) => item.trim()).filter(Boolean);
  return [];
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Partial<CompetitiveIntelRequest> & { competitors?: unknown };
    const competitors = parseCompetitors(body.competitors);
    if (!body.indication || !competitors.length) {
      return NextResponse.json(
        {
          ok: false,
          error: "Provide an indication and at least one competitor.",
        },
        { status: 400 }
      );
    }

    const result = await runCompetitiveIntel({
      indication: body.indication,
      competitors,
      timeWindowWeeks: Number(body.timeWindowWeeks) || 12,
      maxTrialsPerCompetitor: Number(body.maxTrialsPerCompetitor) || 5,
      maxPublicationsPerCompetitor: Number(body.maxPublicationsPerCompetitor) || 3,
    });

    return NextResponse.json({
      ok: true,
      result,
      internalOnly: true,
      candidateOnly: true,
      generatedClaims: false,
      limitations: [
        "Competitive intelligence output is deterministic, source-linked, and candidate-only.",
        "Human expert review is required before external strategic, regulatory, medical, or investment use.",
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Competitive intelligence run failed.",
        internalOnly: true,
        candidateOnly: true,
        generatedClaims: false,
      },
      { status: 502 }
    );
  }
}
