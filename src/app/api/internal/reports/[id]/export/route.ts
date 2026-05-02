import { NextResponse } from "next/server";
import { getReviewedEvidencePacketReport } from "@/lib/evidence-foundation";
import { recordReportExport, renderReviewedReportPdf } from "@/lib/reports/pdf-export";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReviewedEvidencePacketReport(id);
  if (!report) return NextResponse.json({ ok: false, error: "Reviewed evidence packet not found." }, { status: 404 });
  if (report.evidenceRecords.length === 0 || report.sources.length === 0) {
    return NextResponse.json(
      { ok: false, error: "PDF export requires reviewed evidence records and reviewed source appendix.", fakeReport: false },
      { status: 409 },
    );
  }

  const pdfBuffer = await renderReviewedReportPdf(report);
  const fileName = `${report.packet.diseaseOrIndication.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "evidara-report"}-${id}.pdf`;
  const exportRecord = await recordReportExport({
    organizationId: request.headers.get("x-evidara-organization-id") ?? undefined,
    evidencePacketId: id,
    generatedBy: request.headers.get("x-evidara-actor-id") ?? undefined,
    fileName,
    pdfBuffer,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${fileName}"`,
      "x-evidara-report-export-id": exportRecord?.id ?? "not-persisted",
      "x-evidara-draft-internal": "true",
      "x-evidara-generated-claims": "false",
    },
  });
}
