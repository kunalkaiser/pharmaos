import { NextResponse } from "next/server";
import { buildEvidenceEngineProtocol } from "@/lib/evidence-engine/client";
import type { EvidenceEngineProtocolResponse } from "@/lib/evidence-engine/types";

export const runtime = "nodejs";

const supportedFrameworks = new Set(["PICO", "PECO", "PICOC", "CoCoPop", "SPICE", "ECLIPSE"]);
const outcomeHints: Array<[RegExp, string]> = [
  [/\boverall survival\b|\bOS\b/i, "overall survival"],
  [/\bprogression-free survival\b|\bprogression free survival\b|\bPFS\b/i, "progression-free survival"],
  [/\badverse events?\b|\bsafety\b/i, "safety"],
  [/\bdiscontinuation\b|\bwithdrawal\b/i, "treatment discontinuation"],
  [/\befficacy\b|\bclinical response\b/i, "efficacy"],
];

function cleanString(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function cleanPhrase(value: string) {
  return value
    .replace(/^(?:the\s+)?(?:safety\s+and\s+efficacy\s+|efficacy\s+and\s+safety\s+)?(?:evidence\s+for\s+)?/i, "")
    .trim()
    .replace(/^[,.;:\s]+|[,.;:\s]+$/g, "");
}

function firstMatch(question: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = question.match(pattern);
    if (match?.[1]) return cleanPhrase(match[1]);
  }
  return "";
}

function inferOutcomes(question: string, existing: string[]) {
  const outcomes = new Set(existing.filter(Boolean));
  for (const [pattern, outcome] of outcomeHints) {
    if (pattern.test(question)) outcomes.add(outcome);
  }
  return Array.from(outcomes);
}

function normalizeProtocol(question: string, protocol: EvidenceEngineProtocolResponse): EvidenceEngineProtocolResponse {
  const pico = { ...protocol.pico };
  const framework = { ...protocol.framework };
  const parsedPopulation = firstMatch(question, [
    /\b(?:in|among)\s+(.+?),\s*(?:what|how|does|do|is|are)\b/i,
    /\b(?:in|among)\s+(.+?)(?:,\s*(?:focusing|with focus|including)|\s+focusing\b|\?|$)/i,
  ]);
  const parsedIntervention = firstMatch(question, [
    /\b(?:what\s+is\s+)?(?:the\s+)?(?:clinical\s+)?(?:safety\s+and\s+efficacy|efficacy\s+and\s+safety|efficacy|effectiveness|safety|benefit|impact)\s+of\s+(.+?)\s+(?:versus|vs\.?|compared\s+with|compared\s+to|against)\s+/i,
    /\bhow\s+(?:does|do)\s+(.+?)\s+(?:compare|compares|perform|performs)?\s*(?:versus|vs\.?|compared\s+with|compared\s+to|against)\s+/i,
  ]);
  const parsedComparator = firstMatch(question, [
    /\b(?:versus|vs\.?|compared\s+with|compared\s+to|against)\s+(.+?)(?:\s+\b(?:in|among|for)\b|,\s*(?:focusing|including)|\s+\b(?:on|using|during|over)\b|;|\.|\?|$)/i,
  ]);

  if (parsedPopulation) pico.population = parsedPopulation;
  if (parsedIntervention) pico.intervention_or_exposure = parsedIntervention;
  if (parsedComparator && parsedComparator.toLowerCase() !== "not specified") pico.comparator = parsedComparator;
  pico.outcomes = inferOutcomes(question, pico.outcomes || []);
  if (pico.framework === "PICOT") pico.framework = "PICO";

  if (framework && typeof framework === "object") {
    if ("population" in framework && parsedPopulation) framework.population = parsedPopulation;
    if ("intervention" in framework && parsedIntervention) framework.intervention = parsedIntervention;
    if ("comparison" in framework && parsedComparator) framework.comparison = parsedComparator;
    if ("outcomes" in framework) framework.outcomes = pico.outcomes;
  }

  return { ...protocol, pico, framework };
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "JSON request body is required." }, { status: 400 });
  }

  const question = cleanString(body.question, 1200);
  const requestedFramework = cleanString(body.framework, 24);
  const normalizedFramework = requestedFramework === "PICOT" ? "PICO" : requestedFramework;
  const framework = supportedFrameworks.has(normalizedFramework) ? normalizedFramework : undefined;

  if (!question) {
    return NextResponse.json({ ok: false, error: "A question is required before protocol auto-fill." }, { status: 400 });
  }

  try {
    const protocol = normalizeProtocol(question, await buildEvidenceEngineProtocol({ question, framework }));
    return NextResponse.json({
      ok: true,
      engineConnected: true,
      internalOnly: true,
      protocol,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        engineConnected: false,
        internalOnly: true,
        error: error instanceof Error ? error.message : "Protocol auto-fill failed.",
      },
      { status: 502 },
    );
  }
}
