import { NextResponse } from "next/server";
import {
  createEvidenceEnginePipelineRun,
  hydrateEvidenceEngineRecord,
  listEvidenceEnginePipelineRuns,
  runEvidenceEngineFaers,
  runEvidenceEngineLabel,
  runEvidenceEngineTrials,
  runEvidenceEngineUniversalQuery,
} from "@/lib/evidence-engine/client";

export const runtime = "nodejs";

function cleanString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.floor(parsed), min), max);
}

function cleanRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON request body is required." }, { status: 400 });
  }

  const action = cleanString(body.action, 64);

  try {
    if (action === "universal_query") {
      const result = await runEvidenceEngineUniversalQuery({
        question: cleanString(body.question, 1200),
        max_results: cleanNumber(body.max_results, 10, 1, 50),
        live_search: Boolean(body.live_search),
        include_faers: Boolean(body.include_faers),
      });
      return NextResponse.json({ ok: true, engineConnected: true, action, result });
    }

    if (action === "hydrate_record") {
      const result = await hydrateEvidenceEngineRecord({ record: cleanRecord(body.record) });
      return NextResponse.json({ ok: true, engineConnected: true, action, result });
    }

    if (action === "faers") {
      const result = await runEvidenceEngineFaers({
        drug: cleanString(body.drug, 180),
        indication: cleanString(body.indication, 240),
        max_results: cleanNumber(body.max_results, 100, 1, 1000),
        live_fetch: Boolean(body.live_fetch),
      });
      return NextResponse.json({ ok: true, engineConnected: true, action, result });
    }

    if (action === "trials") {
      const result = await runEvidenceEngineTrials({
        condition: cleanString(body.condition, 240),
        intervention: cleanString(body.intervention, 180),
        query: cleanString(body.query, 1200),
        max_results: cleanNumber(body.max_results, 10, 1, 50),
        live_fetch: body.live_fetch !== false,
      });
      return NextResponse.json({ ok: true, engineConnected: true, action, result });
    }

    if (action === "label") {
      const result = await runEvidenceEngineLabel({
        drug: cleanString(body.drug, 180),
        max_results: cleanNumber(body.max_results, 5, 1, 25),
        live_fetch: body.live_fetch !== false,
      });
      return NextResponse.json({ ok: true, engineConnected: true, action, result });
    }

    if (action === "create_run") {
      const result = await createEvidenceEnginePipelineRun({
        question: cleanString(body.question, 1200),
        kind: cleanString(body.kind, 32) as "universal_query" | "full_slr" | "safety_review",
        max_results: cleanNumber(body.max_results, 10, 1, 50),
        live_search: Boolean(body.live_search),
        include_faers: Boolean(body.include_faers),
        metadata: cleanRecord(body.metadata),
      });
      return NextResponse.json({ ok: true, engineConnected: true, action, result });
    }

    if (action === "list_runs") {
      const result = await listEvidenceEnginePipelineRuns(cleanNumber(body.limit, 10, 1, 50));
      return NextResponse.json({ ok: true, engineConnected: true, action, result });
    }

    return NextResponse.json({ ok: false, error: "Unsupported source-methods action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        engineConnected: false,
        action,
        error: error instanceof Error ? error.message : "Evidence engine source-methods request failed.",
      },
      { status: 502 },
    );
  }
}
