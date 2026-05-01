import { NextResponse } from "next/server";
import { getQueryRunAuditTrail } from "@/lib/query-audit";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auditTrail = await getQueryRunAuditTrail(id);

  if (!auditTrail) {
    return NextResponse.json({ ok: false, error: "Query run not found.", fakeRows: false }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    queryRunId: id,
    events: {
      steps: auditTrail.steps,
      sources: auditTrail.sourceEvents,
      candidates: auditTrail.candidateEvents,
      errors: auditTrail.errors,
      snapshots: auditTrail.snapshots,
    },
  });
}
