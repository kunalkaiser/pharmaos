import "server-only";

import { createHash, randomUUID } from "node:crypto";
import PDFDocument from "pdfkit";
import { appendImmutableAuditLog } from "@/lib/audit-integrity";
import { dbQuery, hasDatabaseUrl } from "@/lib/db/client";
import type { getReviewedEvidencePacketReport } from "@/lib/evidence-foundation";

type ReviewedReport = NonNullable<Awaited<ReturnType<typeof getReviewedEvidencePacketReport>>>;

export async function renderReviewedReportPdf(report: ReviewedReport) {
  const chunks: Buffer[] = [];
  const doc = new PDFDocument({ margin: 54, size: "LETTER", info: { Title: report.packet.title, Author: "EvidaraOS" } });
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.fontSize(18).text(report.packet.title);
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#475569").text(`Draft internal export | ${report.packet.diseaseOrIndication} | ${report.packet.geography}`);
  doc.moveDown();
  doc.fillColor("#0f172a").fontSize(12).text("Methodology", { underline: true });
  doc.moveDown(0.3);
  doc.fontSize(10).text("This draft export includes reviewed/approved citation-backed evidence records only. It does not include unreviewed candidates, generated executive summaries, EpiEngine scoring, or unsupported claims.");
  doc.moveDown();

  doc.fontSize(12).text("Reviewed Evidence Records", { underline: true });
  doc.moveDown(0.3);
  if (report.evidenceRecords.length === 0) {
    doc.fontSize(10).text("No reviewed evidence records are available for this packet.");
  } else {
    for (const record of report.evidenceRecords) {
      doc.fontSize(10).fillColor("#0f172a").text(`${record.recordType}: ${record.claimText}`);
      if (record.limitationNotes) doc.fillColor("#475569").text(`Limitation: ${record.limitationNotes}`);
      doc.moveDown(0.4);
    }
  }

  doc.addPage();
  doc.fillColor("#0f172a").fontSize(12).text("Source Appendix", { underline: true });
  doc.moveDown(0.3);
  if (report.sources.length === 0) {
    doc.fontSize(10).text("No reviewed sources are attached.");
  } else {
    for (const source of report.sources) {
      doc.fontSize(10).fillColor("#0f172a").text(source.title);
      doc.fillColor("#475569").text(`${source.sourceType}${source.pmid ? ` | PMID ${source.pmid}` : ""}${source.nctId ? ` | ${source.nctId}` : ""} | Accessed ${source.accessDate}`);
      doc.fillColor("#0f766e").text(source.url);
      doc.moveDown(0.5);
    }
  }

  doc.moveDown();
  doc.fillColor("#92400e").fontSize(9).text("Draft/internal watermark: not medical advice, not regulatory advice, and not a final evidence claim package.");
  doc.end();
  return done;
}

export async function recordReportExport(input: {
  organizationId?: string;
  evidencePacketId: string;
  generatedBy?: string;
  fileName: string;
  pdfBuffer: Buffer;
}) {
  if (!hasDatabaseUrl()) return null;
  const id = randomUUID();
  const contentHash = createHash("sha256").update(input.pdfBuffer).digest("hex");
  const generatedAt = new Date().toISOString();
  await dbQuery(
    `INSERT INTO report_exports (
      id, organization_id, evidence_packet_id, export_type, status, file_name,
      content_hash, generated_by, generated_at, created_at
    ) VALUES ($1,$2::uuid,$3,'pdf','generated',$4,$5,$6,$7,$7)`,
    [
      id,
      input.organizationId ?? null,
      input.evidencePacketId,
      input.fileName,
      contentHash,
      input.generatedBy ?? null,
      generatedAt,
    ],
  );
  await appendImmutableAuditLog({
    organizationId: input.organizationId,
    actorId: input.generatedBy,
    actorType: input.generatedBy ? "user" : "system",
    eventType: "report.exported",
    entityType: "report_export",
    entityId: id,
    createdAt: generatedAt,
    metadata: {
      evidencePacketId: input.evidencePacketId,
      fileName: input.fileName,
      contentHash,
      exportType: "pdf",
      draftInternal: true,
    },
  });
  return { id, contentHash, generatedAt };
}
