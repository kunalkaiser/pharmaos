import { NextResponse } from "next/server";
import { adaptEngineRunToEvidenceCandidates } from "@/lib/evidence-engine/candidate-adapter";
import { runEvidenceEngineChain } from "@/lib/evidence-engine/client";
import { evidenceEngineChainIds, type EvidenceEngineChainId } from "@/lib/evidence-engine/types";
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

function cleanMaxResults(value: unknown) {
  const parsed = Number(value ?? 10);
  if (!Number.isFinite(parsed)) return 10;
  return Math.min(Math.max(Math.floor(parsed), 1), 50);
}

function isChainId(value: string): value is EvidenceEngineChainId {
  return evidenceEngineChainIds.includes(value as EvidenceEngineChainId);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON request body is required." }, { status: 400 });
  }

  const chainId = cleanString(body.chain_id, 64);
  const question = cleanString(body.question, 1200);
  const drug = cleanString(body.drug, 120);
  const indication = cleanString(body.indication, 180);
  const liveSearch = Boolean(body.live_search);
  const maxResults = cleanMaxResults(body.max_results);

  if (!isChainId(chainId)) {
    return NextResponse.json({ ok: false, error: "Unsupported analysis chain." }, { status: 400 });
  }

  if (!question && !(drug && indication)) {
    return NextResponse.json({ ok: false, error: "Provide a biomedical question or both drug and indication." }, { status: 400 });
  }

  const queryText = question || `${drug} ${indication}`.trim();
  const queryRun = await startQueryRun({
    queryText,
    accessContext: "app_workspace",
    actorType: "anonymous_internal",
    liveRetrieval: liveSearch,
  });

  try {
    await recordQueryRunStep({
      queryRunId: queryRun.id,
      stepOrder: 1,
      stepName: "Normalize workspace request",
      stepType: "normalize_query",
      completedAt: new Date().toISOString(),
      status: "completed",
      notes: `Selected chain: ${chainId}; max results: ${maxResults}; live search: ${liveSearch}`,
    });

    const result = await runEvidenceEngineChain({
      chain_id: chainId,
      question,
      drug,
      indication,
      max_results: maxResults,
      live_search: liveSearch,
    });

    await recordQueryRunStep({
      queryRunId: queryRun.id,
      stepOrder: 2,
      stepName: "Execute Python evidence engine",
      stepType: "search_source",
      completedAt: new Date().toISOString(),
      status: result.status === "completed" ? "completed" : "partial_failure",
      notes: `Python engine returned status: ${result.status}`,
    });

    const evidenceCandidates = adaptEngineRunToEvidenceCandidates(result, {
      chainId,
      question: queryText,
      drug,
      indication,
    });

    await recordQueryRunStep({
      queryRunId: queryRun.id,
      stepOrder: 3,
      stepName: "Normalize source-linked records into EvidenceCandidate objects",
      stepType: "normalize_results",
      completedAt: new Date().toISOString(),
      status: "completed",
      notes: `${evidenceCandidates.length} source-linked candidate(s) normalized. Narrative-only artifacts are intentionally excluded.`,
    });

    const sourceCounts = evidenceCandidates.reduce<Record<string, number>>((counts, candidate) => {
      counts[candidate.sourceProvider] = (counts[candidate.sourceProvider] ?? 0) + 1;
      return counts;
    }, {});

    if (Object.keys(sourceCounts).length === 0) {
      await recordSourceEvent({
        queryRunId: queryRun.id,
        providerId: "python_engine",
        endpointCalled: "/analysis/run",
        resultCount: 0,
        errorMessage: "Python engine returned no source-linked records eligible for review queue candidate creation.",
      });
    } else {
      await Promise.all(
        Object.entries(sourceCounts).map(([providerId, resultCount]) =>
          recordSourceEvent({
            queryRunId: queryRun.id,
            providerId,
            endpointCalled: "/analysis/run",
            requestParamsRedacted: {
              chain_id: chainId,
              live_search: liveSearch,
              max_results: maxResults,
            },
            resultCount,
          }),
        ),
      );
    }

    const candidateEvents = await recordCandidateEvents(
      queryRun.id,
      evidenceCandidates.map((candidate) => ({
        candidateId: candidate.candidateId,
        sourceProvider: candidate.sourceProvider,
        sourceIdentifier: candidate.sourceIdentifier,
        sourceTitle: candidate.sourceTitle,
        sourceUrl: candidate.sourceUrl,
        generatedClaim: false,
        promotionStatus: candidate.promotionStatus === "eligible_after_review" ? "eligible_after_review" : "not_promoted",
      })),
    );

    await recordQueryRunStep({
      queryRunId: queryRun.id,
      stepOrder: 4,
      stepName: "Return candidate-only artifacts",
      stepType: "return_candidates",
      completedAt: new Date().toISOString(),
      status: "completed",
      notes: "Candidates require human review and promotion before report/PDF/scoring use.",
    });

    await completeQueryRun(queryRun.id, "completed", {
      chainId,
      engineStatus: result.status,
      candidateOnly: true,
      generatedClaims: false,
      evidenceCandidates,
      artifactKeys: Object.keys(result.artifacts ?? {}),
      limitations: result.limitations,
    });

    return NextResponse.json({
      ok: true,
      engineConnected: true,
      internalOnly: true,
      candidateOnly: true,
      generatedClaims: false,
      reviewRequired: true,
      queryRunId: queryRun.id,
      evidenceCandidates,
      candidateEvents,
      result,
      limitations: [
        "This route executes the private Python evidence engine from the protected Next.js workspace.",
        "Source-linked Python outputs are normalized into EvidenceCandidate records for review; narrative-only artifacts are not promoted automatically.",
        "Human review is required before report export, scoring, payer use, or regulatory use.",
      ],
    });
  } catch (error) {
    await recordQueryError({
      queryRunId: queryRun.id,
      providerId: "python_engine",
      errorType: "evidence_engine_run_failed",
      errorMessage: error instanceof Error ? error.message : "Evidence engine run failed.",
      recoverable: true,
    });
    await completeQueryRun(queryRun.id, "failed", {
      chainId,
      candidateOnly: true,
      generatedClaims: false,
      error: error instanceof Error ? error.message : "Evidence engine run failed.",
    });

    return NextResponse.json(
      {
        ok: false,
        engineConnected: false,
        error: error instanceof Error ? error.message : "Evidence engine run failed.",
        internalOnly: true,
        candidateOnly: true,
        generatedClaims: false,
        queryRunId: queryRun.id,
      },
      { status: 502 }
    );
  }
}
