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

function detectDiseaseClass(question: string) {
  const lowered = question.toLowerCase();
  if (/\b(cancer|tumou?r|carcinoma|sarcoma|lymphoma|leukemia|leukaemia|myeloma|nsclc|sclc|melanoma|oncolog|metastatic|adjuvant|neoadjuvant|checkpoint|pd-?1|pd-?l1|alk|egfr)\b/.test(lowered)) return "oncology";
  if (/\b(alzheimer|parkinson|multiple sclerosis|\bms\b|epilep|seizure|stroke|migraine|als|myasthenia|neurolog|dementia|edss|nihss|updrs)\b/.test(lowered)) return "neurology";
  if (/\b(rheumatoid|lupus|sle|psoriasis|psoriatic|ankylosing|crohn|ulcerative colitis|ibd|vasculitis|sarcoidosis|atopic dermatitis|eczema|biologic|jak inhibitor|tnf)\b/.test(lowered)) return "autoimmune_inflammatory";
  if (/\b(hiv|hepatitis|hbv|hcv|tuberculosis|\btb\b|bacterial|viral|sars-cov-2|covid|sepsis|pathogen|antibiotic|antiviral)\b/.test(lowered)) return "infectious_disease";
  if (/\b(heart failure|coronary|myocardial|hypertension|atrial fibrillation|\baf\b|arrhythmia|valvular|mace|ldl|ascvd|statin|pcsk9|stroke prevention)\b/.test(lowered)) return "cardiovascular";
  if (/\b(diabetes|t1d|t2d|obesity|thyroid|osteoporosis|hba1c|glp-1|sglt2|insulin|metformin|lipid disorder|tsh)\b/.test(lowered)) return "endocrinology_metabolic";
  return "universal";
}

function domainRuleSet(diseaseClass: string) {
  const map: Record<string, string> = {
    oncology: "DOMAIN-SLR-ONCOLOGY",
    neurology: "DOMAIN-SLR-NEUROLOGY",
    autoimmune_inflammatory: "DOMAIN-SLR-AUTOIMMUNE",
    infectious_disease: "DOMAIN-SLR-INFECTIOUS",
    cardiovascular: "DOMAIN-SLR-CARDIOVASCULAR",
    endocrinology_metabolic: "DOMAIN-SLR-ENDOCRINOLOGY",
    universal: "DOMAIN-SLR-UNIVERSAL-BASELINE",
  };
  return map[diseaseClass] ?? "DOMAIN-SLR-UNIVERSAL-BASELINE";
}

function inferProtocolGaps(question: string, diseaseClass: string, comparator: string) {
  const text = `${question} ${comparator}`.toLowerCase();
  const inferred: string[] = [];
  if (!/\b(adults?|children|adolescents?|pediatric|paediatric|geriatric|older adults?|\d+\s*(?:years|year|yo|yrs))\b/.test(text)) {
    inferred.push("Age range/population age band not explicit.");
  }
  if (diseaseClass === "oncology") {
    if (!/\b(ecog|kps|performance status)\b/.test(text)) inferred.push("Performance status such as ECOG/KPS not specified.");
    if (/\b(pembrolizumab|nivolumab|atezolizumab|durvalumab|cemiplimab|checkpoint|pd-?1|pd-?l1)\b/.test(text)) {
      if (!/\b(pd-?l1|tps|cps)\b/.test(text)) inferred.push("Checkpoint inhibitor query lacks PD-L1 TPS/CPS threshold.");
      if (!/\b(egfr|alk|ros1|braf|driver|wild[- ]type|mutation)\b/.test(text)) inferred.push("Checkpoint inhibitor query lacks driver mutation status.");
    }
    if (/\b(chemotherapy|platinum)\b/.test(comparator.toLowerCase()) && !/\b(auc|mg\s*\/\s*m|q\d+w?|cycle|cycles|carboplatin|cisplatin|pemetrexed|paclitaxel|docetaxel)\b/.test(text)) {
      inferred.push("Chemotherapy comparator requires named regimen, dose, schedule, and cycles.");
    }
  }
  return Array.from(new Set(inferred));
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
  const diseaseClass = detectDiseaseClass(question);
  const inferredElements = inferProtocolGaps(question, diseaseClass, pico.comparator);
  pico.disease_class = pico.disease_class || diseaseClass;
  pico.domain_rule_set = pico.domain_rule_set || domainRuleSet(diseaseClass);
  pico.inferred_elements = Array.from(new Set([...(pico.inferred_elements || []), ...inferredElements]));
  pico.picots_complete = pico.inferred_elements.length === 0;
  pico.human_review_required = true;
  pico.protocol_warnings = pico.inferred_elements.length
    ? Array.from(new Set([...(pico.protocol_warnings || []), "PICOTS is incomplete; inferred/missing elements require human expert review before external use."]))
    : pico.protocol_warnings || [];

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
