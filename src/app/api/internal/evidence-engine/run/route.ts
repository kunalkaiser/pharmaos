import { NextResponse } from "next/server";
import { runEvidenceEngineChain } from "@/lib/evidence-engine/client";
import { evidenceEngineChainIds, type EvidenceEngineChainId } from "@/lib/evidence-engine/types";

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

  try {
    const result = await runEvidenceEngineChain({
      chain_id: chainId,
      question,
      drug,
      indication,
      max_results: maxResults,
      live_search: liveSearch,
    });

    return NextResponse.json({
      ok: true,
      engineConnected: true,
      internalOnly: true,
      candidateOnly: true,
      generatedClaims: false,
      reviewRequired: true,
      result,
      limitations: [
        "This route executes the private Python evidence engine from the protected Next.js workspace.",
        "Artifacts are not promoted into reviewed evidence automatically.",
        "Human review is required before report export, scoring, payer use, or regulatory use.",
      ],
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        engineConnected: false,
        error: error instanceof Error ? error.message : "Evidence engine run failed.",
        internalOnly: true,
        candidateOnly: true,
        generatedClaims: false,
      },
      { status: 502 }
    );
  }
}
