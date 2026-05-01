import { NextResponse } from "next/server";
import { listQueryRuns } from "@/lib/query-audit";

export const runtime = "nodejs";

export async function GET() {
  const queryRuns = await listQueryRuns();
  return NextResponse.json({
    ok: true,
    liveRetrievalAudit: true,
    generatedClaims: false,
    fakeRows: false,
    queryRuns,
  });
}
