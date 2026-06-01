import { NextResponse } from "next/server";
import { adaptEngineRunToEvidenceCandidates } from "@/lib/evidence-engine/candidate-adapter";
import { runEvidenceEngineDocumentChat } from "@/lib/evidence-engine/client";
import type { EvidenceEngineRunResponse } from "@/lib/evidence-engine/types";
import {
  completeQueryRun,
  recordCandidateEvents,
  recordQueryError,
  recordQueryRunStep,
  recordSourceEvent,
  startQueryRun,
} from "@/lib/query-audit";

export const runtime = "nodejs";

function cleanString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON request body is required." }, { status: 400 });
  }

  const question = cleanString(body.question, 1200);
  const title = cleanString(body.title, 600);
  const doi = cleanString(body.doi, 220);
  const pmid = cleanString(body.pmid, 80);
  const sourceUrl = cleanString(body.source_url, 900);
  const filename = cleanString(body.filename, 240);
  const sourceText = cleanString(body.source_text, 300_000);
  const pdfBase64 = cleanString(body.pdf_base64, 14_000_000);
  const docxBase64 = cleanString(body.docx_base64, 14_000_000);

  if (!question) {
    return NextResponse.json({ ok: false, error: "Ask a document question before running chat." }, { status: 400 });
  }
  if (!sourceText && !pdfBase64 && !docxBase64) {
    return NextResponse.json({ ok: false, error: "Upload a PDF/DOCX or paste document text." }, { status: 400 });
  }

  const queryRun = await startQueryRun({
    queryText: question,
    accessContext: "app_workspace",
    actorType: "anonymous_internal",
    liveRetrieval: false,
  });

  try {
    await recordQueryRunStep({
      queryRunId: queryRun.id,
      stepOrder: 1,
      stepName: "Receive document chat source",
      stepType: "normalize_query",
      completedAt: new Date().toISOString(),
      status: "completed",
      notes: `Document chat source: ${filename || title || "pasted text"}`,
    });

    const chat = await runEvidenceEngineDocumentChat({
      question,
      title,
      doi,
      pmid,
      source_url: sourceUrl,
      filename,
      source_text: sourceText,
      pdf_base64: pdfBase64,
      docx_base64: docxBase64,
    });

    await recordQueryRunStep({
      queryRunId: queryRun.id,
      stepOrder: 2,
      stepName: "Answer document question with source snippets",
      stepType: "normalize_results",
      completedAt: new Date().toISOString(),
      status: chat.status === "answered_from_document" ? "completed" : "partial_failure",
      notes: `Document chat status: ${chat.status}; snippets: ${chat.snippets.length}; fields: ${chat.extracted_fields.length}`,
    });

    const adapterInput: EvidenceEngineRunResponse = {
      chain: {
        id: "full_slr",
        name: "Document Evidence Chat",
        deterministic_python: true,
        llm_strengthens: ["answer wording", "table interpretation"],
        status: "available",
        outputs: ["source-grounded answer", "snippets", "extraction candidate"],
      },
      status: chat.status,
      artifacts: {
        source_records: [chat.record],
        document_chat: chat,
      },
      limitations: chat.limitations,
    };
    const evidenceCandidates = adaptEngineRunToEvidenceCandidates(adapterInput, {
      chainId: "full_slr",
      question,
    });

    await recordSourceEvent({
      queryRunId: queryRun.id,
      providerId: "document_chat",
      endpointCalled: "/documents/chat",
      requestParamsRedacted: {
        title,
        doi,
        pmid,
        source_url: sourceUrl,
        filename,
        source_text_supplied: Boolean(sourceText),
        pdf_supplied: Boolean(pdfBase64),
        docx_supplied: Boolean(docxBase64),
      },
      resultCount: evidenceCandidates.length,
    });

    const candidateEvents = await recordCandidateEvents(
      queryRun.id,
      evidenceCandidates.map((candidate) => ({
        candidateId: candidate.candidateId,
        sourceProvider: candidate.sourceProvider,
        sourceIdentifier: candidate.sourceIdentifier,
        sourceTitle: candidate.sourceTitle,
        sourceUrl: candidate.sourceUrl,
        generatedClaim: false,
        promotionStatus: "eligible_after_review",
      })),
    );

    await completeQueryRun(queryRun.id, "completed", {
      documentChat: true,
      candidateOnly: true,
      generatedClaims: false,
      evidenceCandidates,
      chatStatus: chat.status,
      sourceTextHash: chat.provenance.source_text_hash,
    });

    return NextResponse.json({
      ok: true,
      engineConnected: true,
      internalOnly: true,
      candidateOnly: true,
      generatedClaims: false,
      reviewRequired: true,
      queryRunId: queryRun.id,
      chat,
      evidenceCandidates,
      candidateEvents,
      limitations: [
        "Document chat answers are source-grounded assistance, not final reviewed evidence.",
        "Human verification is required before extracted fields are promoted.",
      ],
    });
  } catch (error) {
    await recordQueryError({
      queryRunId: queryRun.id,
      providerId: "document_chat",
      errorType: "document_chat_failed",
      errorMessage: error instanceof Error ? error.message : "Document chat failed.",
      recoverable: true,
    });
    await completeQueryRun(queryRun.id, "failed", {
      documentChat: true,
      candidateOnly: true,
      generatedClaims: false,
      error: error instanceof Error ? error.message : "Document chat failed.",
    });
    return NextResponse.json(
      {
        ok: false,
        engineConnected: false,
        error: error instanceof Error ? error.message : "Document chat failed.",
        queryRunId: queryRun.id,
        candidateOnly: true,
        generatedClaims: false,
      },
      { status: 502 },
    );
  }
}
