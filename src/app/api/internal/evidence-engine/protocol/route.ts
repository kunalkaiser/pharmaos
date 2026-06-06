import { NextResponse } from "next/server";
import { buildEvidenceEngineProtocol } from "@/lib/evidence-engine/client";
import type { EvidenceEngineProtocolResponse } from "@/lib/evidence-engine/types";

export const runtime = "nodejs";

const supportedFrameworks = new Set([
  "PICO",
  "PECO",
  "PICOC",
  "CoCoPop",
  "SPICE",
  "ECLIPSE",
  "PCC",
  "PEO",
  "PIRT",
  "PICo",
  "SPIDER",
  "CMO",
  "SALSA",
  "Bibliometric",
  "Mapping",
]);
type ReviewTypeRecommendation = NonNullable<EvidenceEngineProtocolResponse["review_type_recommendation"]>;
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

function inferTimeframe(question: string) {
  const normalized = question.replace(/[–—]/g, "-");
  const trialYears = normalized.match(/\b(?:randomi[sz]ed\s+controlled\s+trials?|RCTs?)\s*,?\s*((?:19|20)\d{2}\s*-\s*(?:19|20)\d{2}|(?:19|20)\d{2})\b/i);
  if (trialYears?.[1]) return `Randomised controlled trials, ${trialYears[1].replace(/\s+/g, "")}`;
  const dateRange = normalized.match(/\b((?:19|20)\d{2})\s*-\s*((?:19|20)\d{2})\b/);
  if (dateRange?.[1] && dateRange[2]) return `${dateRange[1]}-${dateRange[2]}`;
  const sinceYear = normalized.match(/\b(?:from|since)\s+((?:19|20)\d{2})\b/i);
  if (sinceYear?.[1]) return `from ${sinceYear[1]}`;
  const followUp = normalized.match(/\b(week\s+\d+|\d+\s*(?:weeks?|months?|years?)(?:\s+follow[- ]up)?|long[- ]term follow[- ]up)\b/i);
  return followUp?.[1]?.trim() ?? "";
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

function detectRareDisease(question: string) {
  const lowered = question.toLowerCase();
  return /\b(rare|orphan|ultra-rare|ultrarare|low-prevalence|natural history|registry|orphan drug|duchenne|spinal muscular atrophy|sma|als|cystic fibrosis|gaucher|fabry|pompe|rett syndrome|angelman|pnh|hereditary angioedema)\b/.test(lowered);
}

function domainRuleSet(diseaseClass: string) {
  const map: Record<string, string> = {
    oncology: "DOMAIN-SLR-ONCOLOGY",
    neurology: "DOMAIN-SLR-NEUROLOGY",
    autoimmune_inflammatory: "DOMAIN-SLR-AUTOIMMUNE",
    infectious_disease: "DOMAIN-SLR-INFECTIOUS",
    cardiovascular: "DOMAIN-SLR-CARDIOVASCULAR",
    endocrinology_metabolic: "DOMAIN-SLR-ENDOCRINOLOGY",
    rare_disease: "DOMAIN-SLR-RARE_DISEASE",
    universal: "DOMAIN-SLR-UNIVERSAL-BASELINE",
  };
  return map[diseaseClass] ?? "DOMAIN-SLR-UNIVERSAL-BASELINE";
}

function recommendReviewType(question: string): ReviewTypeRecommendation {
  const lowered = question.toLowerCase();
  const make = (
    review_type: string,
    label: string,
    confidence: number,
    rationale: string,
    recommended_framework: string,
    reporting_guideline: string,
    appraisal_tools: string[],
    method_requirements: string[],
    expected_outputs: string[],
    evidence_handling: string,
    warnings: string[] = [],
  ) => ({
    review_type,
    label,
    confidence,
    rationale,
    recommended_framework,
    reporting_guideline,
    appraisal_tools,
    method_requirements,
    expected_outputs,
    evidence_handling,
    warnings,
  });

  if (/\b(umbrella review|review of reviews|overview of reviews|systematic reviews of systematic reviews)\b/.test(lowered)) {
    return make("umbrella_review", "Umbrella review", 0.9, "The question asks for evidence across existing reviews.", "PICO or PICOC at review level", "PRISMA 2020; consider PRIOR", ["AMSTAR 2", "ROBIS"], ["Include systematic reviews/meta-analyses unless the protocol says otherwise.", "Extract review-level overlap and certainty."], ["review inventory", "AMSTAR/ROBIS table", "overlap table"], "Keep review-level evidence separate from primary-study synthesis.");
  }
  if (/\b(diagnostic accuracy|sensitivity|specificity|auc|roc|index test|reference standard)\b/.test(lowered)) {
    return make("diagnostic_accuracy_review", "Diagnostic accuracy review", 0.86, "The question asks about test performance.", "PIRT", "PRISMA-DTA", ["QUADAS-2"], ["Define population, index test, reference standard, and target condition.", "Extract 2x2 data, sensitivity, specificity, and likelihood ratios."], ["PIRT protocol", "diagnostic extraction table", "QUADAS-2 table"], "Prioritize diagnostic accuracy studies and preserve threshold differences.");
  }
  if (/\b(scoping review|scope|map the evidence|evidence landscape|research gaps?|what evidence exists|breadth|range of evidence)\b/.test(lowered)) {
    return make("scoping_review", "Scoping review", 0.84, "The question asks to map breadth, concepts, gaps, or available evidence.", "PCC", "PRISMA-ScR", ["Critical appraisal optional; document if omitted"], ["Define population/participants, concept, and context.", "Chart study characteristics, concepts, sources, and gaps."], ["PCC protocol", "evidence map", "charting table", "gap summary"], "Preserve broad study diversity; avoid effectiveness conclusions unless a systematic review is run.");
  }
  if (/\b(rapid review|rapid evidence|time-sensitive|within \d+\s*(days|weeks)|abbreviated review)\b/.test(lowered)) {
    return make("rapid_review", "Rapid review", 0.82, "The question signals a time-limited evidence product.", "PICO, PECO, or PCC", "PRISMA 2020 with rapid-review transparency", ["Study-design appropriate RoB where feasible"], ["State shortcuts explicitly.", "Limit databases/date/language only if justified."], ["rapid protocol", "search limits table", "screening summary"], "Use transparent shortcuts and label limitations prominently.");
  }
  if (/\b(bibliometric|citation|co-citation|coauthorship|keyword co-occurrence|publication trend|research trends?)\b/.test(lowered)) {
    return make("bibliometric_review", "Bibliometric review", 0.88, "The question asks for publication metadata, citation patterns, or networks.", "Bibliometric metadata schema", "Bibliometric methods transparency", ["No formal risk-of-bias tool normally required"], ["Specify citation database, document types, fields, and deduplication.", "Extract authors, affiliations, citations, keywords, journals, and year."], ["trend chart", "keyword network", "author/country map"], "Analyze metadata patterns; do not treat citation patterns as clinical effect evidence.");
  }
  if (/\b(mapping review|evidence map|gap map|heat map|bubble chart|categorize studies|classify evidence)\b/.test(lowered)) {
    return make("mapping_review", "Mapping review", 0.82, "The question asks to classify and visualize evidence distribution.", "PCC or classification schema", "Structured mapping-review methods", ["Quality appraisal optional unless specified"], ["Predefine categories, axes, study types, populations, interventions, and outcomes."], ["evidence map", "classification table", "heat map", "bubble chart"], "Prioritize coverage and categorization over effect synthesis.");
  }
  if (/\b(realist review|what works for whom|under what circumstances|context[- ]mechanism[- ]outcome|cmo)\b/.test(lowered)) {
    return make("realist_review", "Realist review", 0.84, "The question asks how and why an intervention works in context.", "CMO", "RAMESES", ["Realist quality/relevance assessment"], ["Define context, mechanism, and outcome configurations.", "Extract explanatory theory and program mechanisms."], ["CMO matrix", "program theory", "context-mechanism-outcome synthesis"], "Prioritize explanatory evidence and theory refinement.");
  }
  if (/\b(qualitative review|meta-ethnography|thematic synthesis|lived experience|interviews?|focus groups?|experiences?|perceptions?)\b/.test(lowered)) {
    return make("qualitative_review", "Qualitative evidence synthesis", 0.8, "The question focuses on experiences, perceptions, barriers, or qualitative findings.", "PICo or SPIDER", "ENTREQ; consider eMERGe", ["CASP Qualitative", "JBI qualitative appraisal"], ["Define population, phenomenon of interest, context, and study design.", "Extract themes, participant quotes, setting, and analytic approach."], ["theme table", "conceptual model", "source quote matrix"], "Synthesize themes and concepts; avoid quantitative effectiveness claims.");
  }
  if (/\b(systematic review|slr|meta-analysis|meta analysis|randomi[sz]ed|rct|effectiveness|efficacy|comparative efficacy|safety and efficacy|overall survival|progression-free survival)\b/.test(lowered)) {
    return make("systematic_review", "Systematic review", 0.86, "The question is focused, comparative, and outcome-driven.", "PICO, PECO, or PIRT depending on question", "PRISMA 2020; register protocol with PROSPERO/OSF/INPLASY where appropriate", ["Cochrane RoB 2", "ROBINS-I", "Newcastle-Ottawa Scale", "JBI/CASP as appropriate"], ["Pre-specify protocol and eligibility criteria.", "Run comprehensive reproducible searches.", "Use dual screening/extraction where possible.", "Extract effect estimates and appraise certainty."], ["PICO/PICOTS protocol", "PRISMA flow", "risk-of-bias table", "GRADE summary", "effect table", "forest plot if pooling-ready"], "Prioritize protocol-matched evidence; do not pool unless outcomes, timepoints, populations, and statistics are comparable.");
  }
  return make("systematic_review", "Systematic review", 0.58, "No alternate review type was strongly signaled.", "PICO or best-fit framework", "PRISMA 2020 if systematic methods are used", ["Study-design appropriate appraisal tool"], ["Confirm review purpose before execution.", "Choose a more specific review type if the goal is mapping, rapid decision support, qualitative synthesis, or bibliometrics."], ["protocol", "search log", "screening table", "draft evidence report"], "Human methodologist review is required because the review type is inferred with moderate confidence.", ["Review type should be confirmed before external work begins."]);
}

function frameworkForReviewType(reviewType: string, currentFramework: string) {
  if (currentFramework && currentFramework !== "PICO") return currentFramework;
  const map: Record<string, string> = {
    scoping_review: "PCC",
    diagnostic_accuracy_review: "PIRT",
    qualitative_review: "PICo",
    realist_review: "CMO",
    bibliometric_review: "Bibliometric",
    mapping_review: "Mapping",
    narrative_review: "SALSA",
    critical_review: "SALSA",
    state_of_the_art_review: "SALSA",
  };
  return map[reviewType] ?? currentFramework;
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

function rareInferenceRecords(question: string) {
  const text = question.toLowerCase();
  if (/\b(gene|variant|mutation|genotype|phenotype|syndrome|diagnostic criteria|confirmed diagnosis|natural history)\b/.test(text)) {
    return [];
  }
  return [
    {
      field: "population",
      value: "Rare disease protocol should specify syndrome alias, gene/variant or phenotype, age of onset, and diagnostic criteria when relevant.",
      source: "frontend_protocol_normalizer",
      rule_id: "RARE_DISEASE_POPULATION_EXPANSION",
      rationale: "Rare disease evidence is heterogeneous; genetic, phenotypic, and diagnostic anchors improve retrieval and screening.",
    },
  ];
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
    /\b(?:versus|vs\.?|compared\s+with|compared\s+to|against)\s+(.+?)(?:\s+\bon\b\s+(?:overall survival|progression-free survival|progression free survival|safety|adverse events?|efficacy|clinical response)|\s+\b(?:in|among|for)\b|,\s*(?:focusing|including)|\s+\b(?:using|during|over)\b|;|\.|\?|$)/i,
  ]);

  if (parsedPopulation) pico.population = parsedPopulation;
  if (parsedIntervention) pico.intervention_or_exposure = parsedIntervention;
  if (parsedComparator && parsedComparator.toLowerCase() !== "not specified") pico.comparator = parsedComparator;
  pico.outcomes = inferOutcomes(question, pico.outcomes || []);
  pico.timeframe = pico.timeframe || inferTimeframe(question);
  if (pico.framework === "PICOT") pico.framework = "PICO";
  const rareDisease = detectRareDisease(question);
  const detectedDiseaseClass = detectDiseaseClass(question);
  const diseaseClass = rareDisease && detectedDiseaseClass === "universal" ? "rare_disease" : detectedDiseaseClass;
  const inferredElements = inferProtocolGaps(question, diseaseClass, pico.comparator);
  const rareRecords = rareDisease ? rareInferenceRecords(question) : [];
  pico.disease_class = pico.disease_class || diseaseClass;
  pico.disease_modifiers = Array.from(new Set([...(pico.disease_modifiers || []), ...(rareDisease ? ["rare_disease"] : [])]));
  pico.domain_rules_applied = Array.from(new Set([...(pico.domain_rules_applied || ["DOMAIN-SLR-UNIVERSAL-BASELINE", domainRuleSet(diseaseClass)]), ...(rareDisease ? ["DOMAIN-SLR-RARE_DISEASE"] : [])]));
  pico.domain_rule_set = pico.domain_rule_set || domainRuleSet(diseaseClass);
  pico.inferred_elements = Array.from(new Set([...(pico.inferred_elements || []), ...inferredElements, ...rareRecords.map((item) => item.value)]));
  pico.inference_records = [...(pico.inference_records || []), ...rareRecords];
  pico.picots_complete = pico.inferred_elements.length === 0;
  pico.human_review_required = true;
  pico.protocol_warnings = pico.inferred_elements.length
    ? Array.from(new Set([...(pico.protocol_warnings || []), "PICOTS is incomplete; inferred/missing elements require human expert review before external use."]))
    : pico.protocol_warnings || [];
  const rawReviewTypeRecommendation = protocol.review_type_recommendation || pico.review_type_recommendation || recommendReviewType(question);
  pico.review_type = pico.review_type || rawReviewTypeRecommendation.review_type;
  pico.review_type_confidence = typeof pico.review_type_confidence === "number" ? pico.review_type_confidence : rawReviewTypeRecommendation.confidence;
  pico.framework = frameworkForReviewType(rawReviewTypeRecommendation.review_type, pico.framework);
  const reviewTypeRecommendation = {
    ...rawReviewTypeRecommendation,
    recommended_framework: pico.framework,
  };
  pico.review_type_recommendation = reviewTypeRecommendation;
  pico.recommended_review_framework = pico.framework;
  pico.reporting_guideline = pico.reporting_guideline || reviewTypeRecommendation.reporting_guideline;

  if (framework && typeof framework === "object") {
    framework.framework = pico.framework;
    if ("population" in framework && parsedPopulation) framework.population = parsedPopulation;
    if ("intervention" in framework && parsedIntervention) framework.intervention = parsedIntervention;
    if ("comparison" in framework && parsedComparator) framework.comparison = parsedComparator;
    if ("outcomes" in framework) framework.outcomes = pico.outcomes;
  }

  return { ...protocol, pico, framework, review_type_recommendation: reviewTypeRecommendation };
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
