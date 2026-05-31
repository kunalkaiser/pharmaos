import { NextResponse } from "next/server";
import { adaptEngineRunToEvidenceCandidates } from "@/lib/evidence-engine/candidate-adapter";
import { runEvidenceEnginePdfExtraction } from "@/lib/evidence-engine/client";
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

function cleanStringArray(value: unknown, maxLength: number) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const cleaned = cleanString(item, maxLength);
    return cleaned ? [cleaned] : [];
  });
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
  const sourceText = cleanString(body.source_text, 250_000);
  const pdfBase64 = cleanString(body.pdf_base64, 12_000_000);
  const population = cleanString(body.population, 240);
  const intervention = cleanString(body.intervention_or_exposure, 180);
  const comparator = cleanString(body.comparator, 180);
  const outcomes = cleanStringArray(body.outcomes, 100);

  if (!title) {
    return NextResponse.json({ ok: false, error: "PDF/source title is required for extraction provenance." }, { status: 400 });
  }

  if (!sourceText && !pdfBase64) {
    return NextResponse.json({ ok: false, error: "Upload a PDF or paste source text before extraction." }, { status: 400 });
  }

  const queryRun = await startQueryRun({
    queryText: question || title,
    accessContext: "app_workspace",
    actorType: "anonymous_internal",
    liveRetrieval: false,
  });

  try {
    await recordQueryRunStep({
      queryRunId: queryRun.id,
      stepOrder: 1,
      stepName: "Receive manual PDF extraction source",
      stepType: "normalize_query",
      completedAt: new Date().toISOString(),
      status: "completed",
      notes: `Manual source received: ${filename || title}`,
    });

    const extraction = await runEvidenceEnginePdfExtraction({
      question,
      title,
      doi,
      pmid,
      source_url: sourceUrl,
      filename,
      source_text: sourceText,
      pdf_base64: pdfBase64,
      population,
      intervention_or_exposure: intervention,
      comparator,
      outcomes,
    });

    await recordQueryRunStep({
      queryRunId: queryRun.id,
      stepOrder: 2,
      stepName: "Extract source-linked coding form",
      stepType: "normalize_results",
      completedAt: new Date().toISOString(),
      status: extraction.status === "candidate_ready_for_review" ? "completed" : "partial_failure",
      notes: `PDF extraction status: ${extraction.status}`,
    });

    const adapterInput: EvidenceEngineRunResponse = {
      chain: {
        id: "full_slr",
        name: "Manual PDF Extraction",
        deterministic_python: true,
        llm_strengthens: ["field rationale", "table interpretation"],
        status: "available",
        outputs: ["PDF text extraction", "coding form", "review queue candidate"],
      },
      status: extraction.status,
      artifacts: {
        source_records: [extraction.record],
        manual_pdf_extraction: extraction,
      },
      limitations: extraction.limitations,
    };

    const evidenceCandidates = adaptEngineRunToEvidenceCandidates(adapterInput, {
      chainId: "full_slr",
      question: question || title,
      drug: intervention,
      indication: population,
    });

    await recordSourceEvent({
      queryRunId: queryRun.id,
      providerId: "manual_pdf",
      endpointCalled: "/manual-pdf/extract",
      requestParamsRedacted: {
        title,
        doi,
        pmid,
        source_url: sourceUrl,
        filename,
        source_text_supplied: Boolean(sourceText),
        pdf_supplied: Boolean(pdfBase64),
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
      manualPdfExtraction: true,
      candidateOnly: true,
      generatedClaims: false,
      evidenceCandidates,
      extractionStatus: extraction.status,
      sourceTextHash: extraction.provenance.source_text_hash,
    });

    return NextResponse.json({
      ok: true,
      engineConnected: true,
      internalOnly: true,
      candidateOnly: true,
      generatedClaims: false,
      reviewRequired: true,
      queryRunId: queryRun.id,
      extraction,
      evidenceCandidates,
      candidateEvents,
      limitations: [
        "Manual PDF extraction creates candidate-only fields for review.",
        "Human verification is required before any extracted field becomes reviewed evidence.",
      ],
    });
  } catch (error) {
    await recordQueryError({
      queryRunId: queryRun.id,
      providerId: "manual_pdf",
      errorType: "manual_pdf_extraction_failed",
      errorMessage: error instanceof Error ? error.message : "Manual PDF extraction failed.",
      recoverable: true,
    });
    await completeQueryRun(queryRun.id, "failed", {
      manualPdfExtraction: true,
      candidateOnly: true,
      generatedClaims: false,
      error: error instanceof Error ? error.message : "Manual PDF extraction failed.",
    });

    return NextResponse.json(
      {
        ok: false,
        engineConnected: false,
        error: error instanceof Error ? error.message : "Manual PDF extraction failed.",
        queryRunId: queryRun.id,
        candidateOnly: true,
        generatedClaims: false,
      },
      { status: 502 },
    );
  }
}
