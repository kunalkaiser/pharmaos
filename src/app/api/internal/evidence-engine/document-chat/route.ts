import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { appendEvidenceChatTurn, type EvidenceChatScope } from "@/lib/evidence-chat-persistence";
import { adaptEngineRunToEvidenceCandidates } from "@/lib/evidence-engine/candidate-adapter";
import { runEvidenceEngineDocumentChat } from "@/lib/evidence-engine/client";
import type { EvidenceEngineDocumentChatResponse, EvidenceEngineRunResponse } from "@/lib/evidence-engine/types";
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

function cleanScope(value: unknown): EvidenceChatScope {
  return value === "report" || value === "sources" || value === "upload" ? value : "upload";
}

function hashSource(value: string) {
  return value ? createHash("sha256").update(value).digest("hex") : "";
}

function chatSourceRecords(chat: EvidenceEngineDocumentChatResponse) {
  return chat.evidence_used.sources.map((source) => {
    const citation = chat.citations.find((item) => item.source_id === source.source_id);
    return {
      id: source.source_id,
      source: "document_chat",
      title: source.title,
      abstract: citation?.snippet ?? chat.answer.slice(0, 1000),
      doi: "",
      pmid: "",
      url: "",
      keywords: ["document_chat", "source_grounded_answer", "candidate_only"],
      enrichment: {
        document_chat: true,
        candidate_only: true,
        generated_claim: false,
        requires_human_review: true,
        answer_type: chat.answer_type,
        confidence: chat.confidence,
        query_intent: chat.query_intent,
        citations: chat.citations.filter((item) => item.source_id === source.source_id).slice(0, 4),
        signals: chat.evidence_used.signals.filter((item) => item.source_id === source.source_id).slice(0, 12),
      },
    };
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
  const sourceText = cleanString(body.source_text, 300_000);
  const pdfBase64 = cleanString(body.pdf_base64, 14_000_000);
  const docxBase64 = cleanString(body.docx_base64, 14_000_000);
  const scope = cleanScope(body.scope);
  const conversationId = cleanString(body.conversation_id, 80);
  const actorId = request.headers.get("x-evidara-actor-id") ?? undefined;
  const organizationId = request.headers.get("x-evidara-organization-id") ?? undefined;

  if (!question) {
    return NextResponse.json({ ok: false, error: "Ask a document question before running chat." }, { status: 400 });
  }
  if (!sourceText && !pdfBase64 && !docxBase64) {
    return NextResponse.json({ ok: false, error: "Upload a PDF/DOCX or paste document text." }, { status: 400 });
  }

  const queryRun = await startQueryRun({
    queryText: question,
    accessContext: "app_workspace",
    actorType: actorId ? "future_user" : "anonymous_internal",
    actorId,
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
      status: chat.answer_type === "needs_clarification" ? "partial_failure" : "completed",
      notes: `Document chat answer type: ${chat.answer_type}; confidence: ${chat.confidence}; citations: ${chat.citations.length}; signals: ${chat.evidence_used.signals.length}`,
    });

    const sourceRecords = chatSourceRecords(chat);
    const adapterInput: EvidenceEngineRunResponse = {
      chain: {
        id: "full_slr",
        name: "Document Evidence Chat",
        deterministic_python: true,
        llm_strengthens: ["answer wording", "table interpretation"],
        status: "available",
        outputs: ["source-grounded answer", "citations", "structured signals"],
      },
      status: chat.answer_type === "needs_clarification" ? "needs_attention" : "completed",
      artifacts: {
        source_records: sourceRecords,
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

    const persistedChat = await appendEvidenceChatTurn({
      conversationId: conversationId || undefined,
      organizationId,
      actorId,
      queryRunId: queryRun.id,
      scope,
      title: title || `${scope} evidence chat`,
      sourceTitle: filename || title || `${scope} context`,
      sourceHash: hashSource(sourceText || pdfBase64 || docxBase64),
      userMessage: question,
      chatResponse: chat,
    });

    await completeQueryRun(queryRun.id, "completed", {
      documentChat: true,
      candidateOnly: true,
      generatedClaims: false,
      evidenceCandidates,
      answerType: chat.answer_type,
      confidence: chat.confidence,
      provenanceSummary: chat.provenance_summary,
      evidenceChatConversationId: persistedChat.conversation.id,
      evidenceChatMessageId: persistedChat.message.id,
    });

    return NextResponse.json({
      ok: true,
      engineConnected: true,
      internalOnly: true,
      candidateOnly: true,
      generatedClaims: false,
      reviewRequired: true,
      queryRunId: queryRun.id,
      conversationId: persistedChat.conversation.id,
      chatMessageId: persistedChat.message.id,
      persistedChat: {
        conversation: persistedChat.conversation,
        message: persistedChat.message,
      },
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
