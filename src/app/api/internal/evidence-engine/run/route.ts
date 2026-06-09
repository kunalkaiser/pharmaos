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

function cleanStringArray(value: unknown, maxItems = 20, maxLength = 120) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanString(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
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
  const framework = cleanString(body.framework, 24);
  const population = cleanString(body.population, 240);
  const interventionOrExposure = cleanString(body.intervention_or_exposure, 180);
  const comparator = cleanString(body.comparator, 180);
  const outcomes = cleanStringArray(body.outcomes);
  const timeframe = cleanString(body.timeframe, 120);
  const context = cleanString(body.context, 220);
  const liveSearch = Boolean(body.live_search);
  const maxResults = cleanMaxResults(body.max_results);

  if (!isChainId(chainId)) {
    return NextResponse.json({ ok: false, error: "Unsupported analysis chain." }, { status: 400 });
  }

  if (!question && !(drug && indication) && !(population && interventionOrExposure)) {
    return NextResponse.json({ ok: false, error: "Provide a biomedical question or complete the protocol fields." }, { status: 400 });
  }

  const queryText = question || [population || indication, interventionOrExposure || drug, comparator, outcomes.join(", ")].filter(Boolean).join(" ");
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
      notes: `Selected chain: ${chainId}; framework: ${framework || "auto"}; max results: ${maxResults}; live search: ${liveSearch}`,
    });

    const result = await runEvidenceEngineChain({
      chain_id: chainId,
      question,
      drug: drug || interventionOrExposure,
      indication: indication || population,
      framework,
      population,
      intervention_or_exposure: interventionOrExposure,
      comparator,
      outcomes,
      timeframe,
      context,
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
              framework: framework || "auto",
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
    const primaryError = error instanceof Error ? error.message : "Evidence engine run failed.";

    if (liveSearch) {
      try {
        await recordQueryRunStep({
          queryRunId: queryRun.id,
          stepOrder: 2,
          stepName: "Retry Python evidence engine without live retrieval",
          stepType: "search_source",
          completedAt: new Date().toISOString(),
          status: "partial_failure",
          notes: `Live retrieval failed and a fast deterministic retry was started. Primary error: ${primaryError}`,
        });

        const fallbackResult = await runEvidenceEngineChain({
          chain_id: chainId,
          question,
          drug: drug || interventionOrExposure,
          indication: indication || population,
          framework,
          population,
          intervention_or_exposure: interventionOrExposure,
          comparator,
          outcomes,
          timeframe,
          context,
          max_results: Math.min(maxResults, 10),
          live_search: false,
        });

        const evidenceCandidates = adaptEngineRunToEvidenceCandidates(fallbackResult, {
          chainId,
          question: queryText,
          drug,
          indication,
        });

        await recordQueryError({
          queryRunId: queryRun.id,
          providerId: "python_engine",
          errorType: "live_retrieval_retry_fallback",
          errorMessage: primaryError,
          recoverable: true,
        });

        await completeQueryRun(queryRun.id, "partial_failure", {
          chainId,
          engineStatus: fallbackResult.status,
          candidateOnly: true,
          generatedClaims: false,
          evidenceCandidates,
          recoveredWithFastRetry: true,
          primaryError,
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
          candidateEvents: [],
          result: {
            ...fallbackResult,
            limitations: [
              `Live retrieval failed, so EvidaraOS returned a fast deterministic scaffold instead. Original error: ${primaryError}`,
              ...(fallbackResult.limitations ?? []),
            ],
          },
          limitations: [
            "Live retrieval failed during this run; a non-live deterministic fallback was returned instead of a hard failure.",
            "Use a smaller max-results value or run again after upstream source APIs recover.",
            "Human review is required before report export, scoring, payer use, or regulatory use.",
          ],
          recovery: {
            attempted: true,
            mode: "fast_non_live_retry",
            originalError: primaryError,
          },
        });
      } catch (fallbackError) {
        await recordQueryError({
          queryRunId: queryRun.id,
          providerId: "python_engine",
          errorType: "evidence_engine_fallback_failed",
          errorMessage: fallbackError instanceof Error ? fallbackError.message : "Fallback evidence engine run failed.",
          recoverable: true,
        });
      }
    }

    await recordQueryError({
      queryRunId: queryRun.id,
      providerId: "python_engine",
      errorType: "evidence_engine_run_failed",
      errorMessage: primaryError,
      recoverable: true,
    });
    await completeQueryRun(queryRun.id, "failed", {
      chainId,
      candidateOnly: true,
      generatedClaims: false,
      error: primaryError,
    });

    return NextResponse.json(
      {
        ok: false,
        engineConnected: false,
        error: `${primaryError} Try turning off live retrieval or lowering max results for a fast first pass.`,
        internalOnly: true,
        candidateOnly: true,
        generatedClaims: false,
        queryRunId: queryRun.id,
        recovery: {
          attempted: liveSearch,
          mode: liveSearch ? "fast_non_live_retry_failed" : "none",
        },
      },
      { status: 200 }
    );
  }
}
