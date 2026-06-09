import "server-only";

import crypto from "node:crypto";
import { fetchJson, fetchText, sanitizeQuery, xmlText } from "@/lib/connectors/http";
import type {
  CiAlert,
  CiCompetitor,
  CiEvidenceGap,
  CiPicots,
  CiPublication,
  CiRecommendation,
  CiSeverity,
  CiTrialProgram,
  CompetitiveIntelRequest,
  CompetitiveIntelRun,
} from "./types";

type ClinicalTrialsStudy = {
  protocolSection?: {
    identificationModule?: { nctId?: string; briefTitle?: string; officialTitle?: string };
    statusModule?: {
      overallStatus?: string;
      startDateStruct?: { date?: string };
      completionDateStruct?: { date?: string };
      lastUpdatePostDateStruct?: { date?: string };
    };
    sponsorCollaboratorsModule?: { leadSponsor?: { name?: string }; collaborators?: Array<{ name?: string }> };
    conditionsModule?: { conditions?: string[] };
    armsInterventionsModule?: {
      interventions?: Array<{ name?: string; type?: string; description?: string }>;
      armGroups?: Array<{ label?: string; type?: string; description?: string }>;
    };
    designModule?: {
      phases?: string[];
      enrollmentInfo?: { count?: number; type?: string };
      studyType?: string;
    };
    outcomesModule?: {
      primaryOutcomes?: Array<{ measure?: string; timeFrame?: string; description?: string }>;
      secondaryOutcomes?: Array<{ measure?: string; timeFrame?: string; description?: string }>;
    };
    eligibilityModule?: { eligibilityCriteria?: string; sex?: string; minimumAge?: string; maximumAge?: string };
  };
};

type ClinicalTrialsResponse = { studies?: ClinicalTrialsStudy[] };
type PubMedSearchResponse = { esearchresult?: { idlist?: string[] } };

const timeoutMs = 14000;

function cleanText(value: string | null | undefined) {
  return value?.replace(/\s+/g, " ").trim() || null;
}

function uniq<T>(items: T[]) {
  return [...new Set(items.filter(Boolean))] as T[];
}

function joinOrNull(items: Array<string | null | undefined>) {
  const cleaned = uniq(items.map((item) => cleanText(item)).filter(Boolean) as string[]);
  return cleaned.length ? cleaned.join("; ") : null;
}

function makeRunId(indication: string) {
  const hash = crypto.createHash("sha256").update(`${indication}:${Date.now()}`).digest("hex").slice(0, 10);
  return `ci-${hash}`;
}

function buildTrialPicots(study: ClinicalTrialsStudy, fallbackIndication: string): CiPicots {
  const protocol = study.protocolSection;
  const conditions = protocol?.conditionsModule?.conditions ?? [];
  const interventions = protocol?.armsInterventionsModule?.interventions?.map((item) => item.name).filter(Boolean) ?? [];
  const armGroups = protocol?.armsInterventionsModule?.armGroups ?? [];
  const primaryOutcomes = protocol?.outcomesModule?.primaryOutcomes ?? [];
  const secondaryOutcomes = protocol?.outcomesModule?.secondaryOutcomes ?? [];
  const timeFrames = [...primaryOutcomes, ...secondaryOutcomes].map((item) => item.timeFrame).filter(Boolean);
  const comparators = armGroups
    .filter((arm) => /placebo|control|standard|usual|chemotherapy|active comparator|sham/i.test(`${arm.type ?? ""} ${arm.label ?? ""} ${arm.description ?? ""}`))
    .map((arm) => arm.label);

  return {
    population: joinOrNull([conditions.join("; "), protocol?.eligibilityModule?.minimumAge, protocol?.eligibilityModule?.maximumAge]) ?? fallbackIndication,
    intervention: interventions.length ? interventions.join("; ") : null,
    comparison: joinOrNull(comparators),
    outcome: joinOrNull([...primaryOutcomes, ...secondaryOutcomes].map((item) => item.measure)),
    timing: joinOrNull(timeFrames),
    study_type: joinOrNull([protocol?.designModule?.studyType, protocol?.designModule?.phases?.join("; ")]),
  };
}

function studyToProgram(study: ClinicalTrialsStudy, indication: string): CiTrialProgram | null {
  const protocol = study.protocolSection;
  const nctId = cleanText(protocol?.identificationModule?.nctId);
  if (!nctId) return null;
  const primaryOutcomes = protocol?.outcomesModule?.primaryOutcomes ?? [];
  const secondaryOutcomes = protocol?.outcomesModule?.secondaryOutcomes ?? [];
  const interventions = protocol?.armsInterventionsModule?.interventions?.map((item) => cleanText(item.name)).filter(Boolean) as string[];
  const conditions = protocol?.conditionsModule?.conditions?.map((item) => cleanText(item)).filter(Boolean) as string[];

  return {
    trial_id: nctId,
    title: cleanText(protocol?.identificationModule?.briefTitle) ?? cleanText(protocol?.identificationModule?.officialTitle) ?? `ClinicalTrials.gov study ${nctId}`,
    status: cleanText(protocol?.statusModule?.overallStatus),
    phase: joinOrNull(protocol?.designModule?.phases ?? []),
    n: protocol?.designModule?.enrollmentInfo?.count ?? null,
    primary_endpoint: joinOrNull(primaryOutcomes.map((item) => item.measure)),
    secondary_endpoints: uniq(secondaryOutcomes.map((item) => cleanText(item.measure)).filter(Boolean) as string[]).slice(0, 8),
    completion_date: cleanText(protocol?.statusModule?.completionDateStruct?.date),
    start_date: cleanText(protocol?.statusModule?.startDateStruct?.date),
    last_update_posted: cleanText(protocol?.statusModule?.lastUpdatePostDateStruct?.date),
    sponsor: cleanText(protocol?.sponsorCollaboratorsModule?.leadSponsor?.name),
    conditions,
    interventions,
    source_url: `https://clinicaltrials.gov/study/${nctId}`,
    change_flag: "new",
    picots: buildTrialPicots(study, indication),
  };
}

async function searchTrialsForCompetitor(indication: string, competitor: string, maxResults: number) {
  const query = sanitizeQuery(`${indication} ${competitor}`);
  const url = `https://clinicaltrials.gov/api/v2/studies?query.term=${encodeURIComponent(query)}&pageSize=${Math.max(1, Math.min(maxResults * 3, 50))}&format=json`;
  const data = await fetchJson<ClinicalTrialsResponse>(url, timeoutMs);
  const programs = (data.studies ?? [])
    .map((study) => studyToProgram(study, indication))
    .filter((program): program is CiTrialProgram => Boolean(program));

  const normalizedCompetitor = competitor.toLowerCase();
  const filtered = programs.filter((program) => {
    const haystack = `${program.sponsor ?? ""} ${program.title} ${program.interventions.join(" ")}`.toLowerCase();
    return haystack.includes(normalizedCompetitor) || programs.length <= maxResults;
  });

  return filtered.slice(0, maxResults);
}

function extractDoi(articleXml: string) {
  const doiMatch = articleXml.match(/<ArticleId[^>]*IdType=["']doi["'][^>]*>([\s\S]*?)<\/ArticleId>/i);
  return cleanText(doiMatch?.[1]?.replace(/<[^>]+>/g, " "));
}

function extractAuthors(articleXml: string) {
  const authorBlocks = [...articleXml.matchAll(/<Author\b[\s\S]*?<\/Author>/gi)].slice(0, 6);
  return authorBlocks
    .map((block) => {
      const last = xmlText(block[0], "LastName");
      const fore = xmlText(block[0], "ForeName");
      const collective = xmlText(block[0], "CollectiveName");
      return cleanText(collective || `${fore} ${last}`);
    })
    .filter(Boolean) as string[];
}

function pubDateFromXml(articleXml: string) {
  const year = xmlText(articleXml, "Year");
  const month = xmlText(articleXml, "Month");
  const day = xmlText(articleXml, "Day");
  return cleanText([year, month, day].filter(Boolean).join("-"));
}

function abstractSentences(abstract: string | null) {
  if (!abstract) return [];
  return abstract
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => cleanText(sentence))
    .filter(Boolean) as string[];
}

function publicationPicots(publication: Omit<CiPublication, "picots">, indication: string): CiPicots {
  const outcomeSentence = abstractSentences(publication.abstract).find((sentence) => /endpoint|survival|response|safety|adverse|efficacy|progression|hazard|risk|rate/i.test(sentence));
  return {
    population: indication,
    intervention: null,
    comparison: null,
    outcome: outcomeSentence ?? null,
    timing: null,
    study_type: /review|meta-analysis/i.test(publication.title) ? "review / evidence synthesis" : "publication metadata",
  };
}

async function searchPublicationsForCompetitor(indication: string, competitor: string, weeks: number, maxResults: number) {
  const apiKey = process.env.NCBI_API_KEY;
  const apiKeyParam = apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : "";
  const query = sanitizeQuery(`(${indication}) AND (${competitor})`);
  const lookbackDays = Math.max(1, weeks * 7);
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=${Math.max(1, Math.min(maxResults, 20))}&term=${encodeURIComponent(query)}&reldate=${lookbackDays}&datetype=pdat${apiKeyParam}`;
  const search = await fetchJson<PubMedSearchResponse>(searchUrl, timeoutMs);
  const ids = search.esearchresult?.idlist ?? [];
  if (!ids.length) return [];

  const xml = await fetchText(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id=${ids.join(",")}${apiKeyParam}`, timeoutMs);
  return [...xml.matchAll(/<PubmedArticle[\s\S]*?<\/PubmedArticle>/gi)].slice(0, maxResults).map((article, index) => {
    const articleXml = article[0];
    const pmid = cleanText(xmlText(articleXml, "PMID")) ?? ids[index] ?? null;
    const abstract = cleanText(
      [...articleXml.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/gi)]
        .map((item) => item[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join(" ")
    );
    const base: Omit<CiPublication, "picots"> = {
      pmid,
      title: cleanText(xmlText(articleXml, "ArticleTitle")) ?? `PubMed record ${pmid ?? index + 1}`,
      doi: extractDoi(articleXml),
      authors: extractAuthors(articleXml),
      journal: cleanText(xmlText(articleXml, "Title")),
      publication_date: pubDateFromXml(articleXml),
      abstract,
      key_findings: abstractSentences(abstract).find((sentence) => /result|conclusion|significant|associated|improved|reduced|increased/i.test(sentence)) ?? null,
      mechanism_of_action: abstractSentences(abstract).find((sentence) => /mechanism|inhibitor|antibody|receptor|kinase|pathway|target/i.test(sentence)) ?? null,
      source_url: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : null,
    };
    return { ...base, picots: publicationPicots(base, indication) };
  });
}

function makeAlerts(competitor: string, programs: CiTrialProgram[], publications: CiPublication[], timestamp: string): CiAlert[] {
  const trialAlerts = programs.slice(0, 4).map((program): CiAlert => {
    const ended = /completed|terminated|withdrawn|suspended/i.test(program.status ?? "");
    const latePhase = /phase 3|phase 4/i.test(program.phase ?? "");
    const type = ended ? "trial_ended" : "new_trial";
    return {
      alert_id: `alert:${type}:${program.trial_id}`,
      type,
      competitor,
      program: program.title,
      description: `${program.trial_id} is ${program.status ?? "status not reported"}${program.phase ? ` (${program.phase})` : ""}${program.primary_endpoint ? ` with primary endpoint: ${program.primary_endpoint}` : ""}.`,
      timestamp,
      severity: ended || latePhase ? "high" : "medium",
      trial_id: program.trial_id,
      doi: null,
    };
  });

  const publicationAlerts = publications.slice(0, 2).map((publication): CiAlert => ({
    alert_id: `alert:new_publication:${publication.doi ?? publication.pmid ?? `${competitor}:${publication.title}`}`,
    type: "new_publication",
    competitor,
    program: publication.title,
    description: `Recent PubMed-indexed publication found${publication.journal ? ` in ${publication.journal}` : ""}.`,
    timestamp,
    severity: publication.key_findings ? "medium" : "low",
    trial_id: null,
    doi: publication.doi,
  }));

  return [...trialAlerts, ...publicationAlerts];
}

function makeEvidenceGaps(competitor: CiCompetitor): CiEvidenceGap[] {
  const gaps: CiEvidenceGap[] = [];
  if (!competitor.programs.length) {
    gaps.push({
      competitor: competitor.name,
      gap: "No matching ClinicalTrials.gov programs were retrieved for this indication and competitor query.",
      severity: "high",
      strategic_implication: "Confirm competitor aliases, assets, and sponsor names before treating absence as a strategic gap.",
      source: `ClinicalTrials.gov query:${competitor.name}`,
    });
  }
  const missingEndpoint = competitor.programs.find((program) => !program.primary_endpoint);
  if (missingEndpoint) {
    gaps.push({
      competitor: competitor.name,
      gap: `${missingEndpoint.trial_id} is missing a structured primary endpoint in the public registry payload.`,
      severity: "medium",
      strategic_implication: "Reviewer should inspect the registry source page before using endpoint comparisons.",
      source: missingEndpoint.trial_id,
    });
  }
  if (!competitor.publications.length) {
    gaps.push({
      competitor: competitor.name,
      gap: "No recent PubMed records were retrieved within the selected time window.",
      severity: "low",
      strategic_implication: "Use a longer window, asset names, congress abstracts, or press-release monitoring for fuller coverage.",
      source: `PubMed query:${competitor.name}`,
    });
  }
  return gaps;
}

function makeRecommendations(competitors: CiCompetitor[], gaps: CiEvidenceGap[], alerts: CiAlert[]): CiRecommendation[] {
  const latePhase = competitors.flatMap((competitor) => competitor.programs.map((program) => ({ competitor: competitor.name, program }))).filter((item) => /phase 3|phase 4/i.test(item.program.phase ?? ""));
  const completed = competitors.flatMap((competitor) => competitor.programs.map((program) => ({ competitor: competitor.name, program }))).filter((item) => /completed|terminated/i.test(item.program.status ?? ""));
  const recommendations: CiRecommendation[] = [];

  if (latePhase.length) {
    recommendations.push({
      recommendation: `Near-term monitoring may be warranted for ${latePhase.slice(0, 3).map((item) => `${item.competitor} ${item.program.trial_id}`).join(", ")} because these retrieved programs are listed as late-phase in the registry data.`,
      confidence: "moderate",
      source: latePhase.slice(0, 3).map((item) => item.program.trial_id).join(", "),
    });
  }

  if (completed.length) {
    recommendations.push({
      recommendation: "Completed or terminated retrieved trials should be reviewed first for readout timing, endpoint interpretation, and publication follow-up.",
      confidence: "moderate",
      source: completed.slice(0, 3).map((item) => item.program.trial_id).join(", "),
    });
  }

  const concreteGap = gaps.find((gap) => /^(NCT|PubMed query:|ClinicalTrials\.gov query:)/.test(gap.source));
  if (concreteGap) {
    recommendations.push({
      recommendation: `The ${concreteGap.competitor} evidence gap should be treated as limited evidence from this scan, not as proof of absence: ${concreteGap.gap}`,
      confidence: concreteGap.severity === "high" ? "moderate" : "low",
      source: concreteGap.source,
    });
  }

  const highAlert = alerts.find((alert) => alert.severity === "high");
  if (highAlert) {
    recommendations.push({
      recommendation: `Review the high-severity alert before using this CI brief externally: ${highAlert.description}`,
      confidence: "moderate",
      source: highAlert.alert_id,
    });
  }

  return recommendations;
}

type CiBriefValidation = {
  correctedAlerts: CiAlert[];
  correctedRecommendations: CiRecommendation[];
  activity: {
    newTrials: CiTrialProgram[];
    completedTrials: CiTrialProgram[];
    activeTrials: CiTrialProgram[];
    otherTrials: CiTrialProgram[];
  };
  publicationStatus: string;
  warnings: string[];
};

function sourceIsConcrete(source: string) {
  return /^(NCT\d+|10\.\S+|PMID:\S+|alert:|PubMed query:|ClinicalTrials\.gov query:)/i.test(source.trim());
}

function trialStatusBucket(program: CiTrialProgram) {
  const status = program.status?.toLowerCase() ?? "";
  if (/completed|terminated|withdrawn|suspended/.test(status)) return "completedTrials";
  if (/recruiting|not yet recruiting|enrolling by invitation/.test(status)) return "newTrials";
  if (/active|available/.test(status)) return "activeTrials";
  return "otherTrials";
}

function validateBriefData(run: Omit<CompetitiveIntelRun, "report_markdown">): CiBriefValidation {
  const allTrials = run.competitors.flatMap((competitor) => competitor.programs);
  const seenTrials = new Set<string>();
  const activity: CiBriefValidation["activity"] = {
    newTrials: [],
    completedTrials: [],
    activeTrials: [],
    otherTrials: [],
  };
  const warnings: string[] = [];

  for (const program of allTrials) {
    if (seenTrials.has(program.trial_id)) {
      warnings.push(`${program.trial_id}: duplicate trial row suppressed from activity summary.`);
      continue;
    }
    seenTrials.add(program.trial_id);
    activity[trialStatusBucket(program)].push(program);
  }

  const correctedAlerts = run.alerts.filter((alert) => {
    const isPublication = alert.type === "new_publication";
    const isTrial = Boolean(alert.trial_id);
    if (!isPublication && !isTrial) {
      warnings.push(`${alert.alert_id}: removed non-trial alert without trial_id from trial alert list.`);
      return false;
    }
    return true;
  });

  const correctedRecommendations = run.strategic_implications.filter((item) => {
    if (sourceIsConcrete(item.source)) return true;
    warnings.push(`Strategic implication removed because source was not concrete: ${item.source}`);
    return false;
  });

  const publicationCount = run.audit.total_publications;
  const publicationStatus = publicationCount > 0
    ? `PubMed was queried and ${publicationCount} publication record(s) matched the selected indication, competitor, and time-window filters.`
    : "PubMed was queried and zero publication records matched the selected indication, competitor, and time-window filters.";

  if (allTrials.length !== run.audit.total_trials) {
    warnings.push(`Trial count corrected from audit ${run.audit.total_trials} to rendered count ${allTrials.length}.`);
  }
  if (correctedAlerts.length !== run.audit.total_alerts) {
    warnings.push(`Alert count corrected from audit ${run.audit.total_alerts} to rendered count ${correctedAlerts.length}.`);
  }

  return { correctedAlerts, correctedRecommendations, activity, publicationStatus, warnings };
}

function makeReport(run: Omit<CompetitiveIntelRun, "report_markdown">) {
  const validation = validateBriefData(run);
  const renderedTrialCount = run.competitors.reduce((sum, competitor) => sum + competitor.programs.length, 0);
  const severityCounts = validation.correctedAlerts.reduce<Record<CiSeverity, number>>(
    (counts, alert) => ({ ...counts, [alert.severity]: counts[alert.severity] + 1 }),
    { low: 0, medium: 0, high: 0 }
  );
  const portfolioRows = run.competitors.flatMap((competitor) =>
    competitor.programs.length
      ? competitor.programs.map(
          (program) =>
            `| ${competitor.name} | ${program.trial_id} | ${program.phase ?? "Not reported"} | ${program.status ?? "Not reported"} | ${program.n ?? "Not reported"} | ${program.primary_endpoint ?? "Not reported"} | ${program.source_url} |`
        )
      : [`| ${competitor.name} | No matching registry program retrieved | - | - | - | - | - |`]
  );

  const alertRows = validation.correctedAlerts.length
    ? validation.correctedAlerts.map((alert) => `| ${alert.type} | ${alert.competitor} | ${alert.program.replace(/\|/g, "/")} | ${alert.severity} | ${alert.trial_id ?? alert.doi ?? alert.alert_id} |`)
    : ["| No alerts generated | - | - | - | - |"];

  const gapRows = run.evidence_gaps.length
    ? run.evidence_gaps.map((gap) => `| ${gap.competitor} | ${gap.gap} | ${gap.severity} | ${gap.strategic_implication} | ${gap.source} |`)
    : ["| No major retrieval gap flagged | - | - | - |"];

  const activityRows = (programs: CiTrialProgram[]) =>
    programs.length
      ? programs.map((program) => `- ${program.trial_id} - ${program.title} - ${program.status ?? "Status not reported"}${program.phase ? ` - ${program.phase}` : ""}`)
      : ["- None identified from retrieved trial records."];

  const publicationRows = run.competitors.flatMap((competitor) =>
    competitor.publications.map((publication) => `| ${competitor.name} | ${publication.title.replace(/\|/g, "/")} | ${publication.doi ?? publication.pmid ?? "No identifier"} | ${publication.journal ?? "Not reported"} | ${publication.publication_date ?? "Not reported"} |`)
  );

  const validationRows = validation.warnings.length
    ? validation.warnings.map((warning) => `- ${warning}`).join("\n")
    : "- No pre-render consistency warnings.";

  return `# EVIDARA COMPETITIVE INTELLIGENCE BRIEF

## ${run.indication} Competitive Landscape
**Report Date**: ${run.timestamp.slice(0, 10)}  
**Run ID**: ${run.run_id}  
**Classification**: PROVISIONAL - For internal strategic use only

## Executive Summary

- EvidaraOS retrieved ${renderedTrialCount} trial program record(s) and ${run.audit.total_publications} recent PubMed publication record(s) across ${run.competitors.length} competitor(s).
- Alert summary: ${validation.correctedAlerts.length} total alert signal(s), including ${severityCounts.high} high, ${severityCounts.medium} medium, and ${severityCounts.low} low.
- ${validation.publicationStatus}
- Registry and publication results are source-linked, candidate-only, and require human verification before external or regulated use.
- Evidence gaps are framed as retrieval limitations, not proof of competitor absence.

## Competitor Portfolio Overview

| Company | Program / Trial | Phase | Status | N | Primary Endpoint | Source |
|---|---|---:|---|---:|---|---|
${portfolioRows.join("\n")}

## Trial Activity Summary

### New Trials Started
${activityRows(validation.activity.newTrials).join("\n")}

### Completed/Terminated Trials
${activityRows(validation.activity.completedTrials).join("\n")}

### Status Changes
- Status-change detection requires saved prior-state history. This first-pass scan classifies current registry status only.

### High-Severity Alerts
${validation.correctedAlerts.filter((alert) => alert.severity === "high").length ? validation.correctedAlerts.filter((alert) => alert.severity === "high").map((alert) => `- **${alert.description}** Source: ${alert.trial_id ?? alert.doi ?? alert.alert_id}.`).join("\n") : "- None identified from rendered alert records."}

## Evidence Gaps

| Company | Gap Description | Severity | Strategic Implication | Source |
|---|---|---|---|---|
${gapRows.join("\n")}

## Strategic Implications

${validation.correctedRecommendations.length ? validation.correctedRecommendations.map((item) => `- **${item.recommendation}** Confidence: ${item.confidence}. Source: ${item.source}.`).join("\n") : "- No strategic implication was rendered because the scan did not produce a source-grounded recommendation with a concrete trial ID, DOI, query record, or alert record."}

## Primary Research Synthesis

- No primary research transcript was provided for this CI run.

## Appendix

### Full Trial List

| Company | Program / Trial | Phase | Status | N | Primary Endpoint | Source |
|---|---|---:|---|---:|---|---|
${portfolioRows.join("\n")}

### Full Publication List

${validation.publicationStatus}

${publicationRows.length ? `| Company | Title | DOI / PMID | Journal | Date |\n|---|---|---|---|---|\n${publicationRows.join("\n")}` : ""}

### Full Alert List

| Type | Company | Program | Severity | Source |
|---|---|---|---|---|
${alertRows.join("\n")}

### Pre-render Validation Notes

${validationRows}

## Governance Footer

**Human expert review required.** This CI brief is a deterministic, source-linked draft for internal strategic review. It is not medical advice, regulatory guidance, investment advice, or a substitute for professional scientific judgment.

**Audit Trail**: ${run.audit.chain_id}; sources queried: ${run.audit.sources_queried.join(", ")}; deterministic: ${run.audit.deterministic ? "yes" : "no"}.`;
}

export async function runCompetitiveIntel(request: CompetitiveIntelRequest): Promise<CompetitiveIntelRun> {
  const indication = sanitizeQuery(request.indication || "Alzheimer's disease");
  const competitors = request.competitors.map((item) => sanitizeQuery(item)).filter(Boolean).slice(0, 8);
  const timeWindowWeeks = Math.max(1, Math.min(Number(request.timeWindowWeeks) || 12, 104));
  const maxTrials = Math.max(1, Math.min(Number(request.maxTrialsPerCompetitor) || 5, 12));
  const maxPublications = Math.max(0, Math.min(Number(request.maxPublicationsPerCompetitor) || 3, 8));
  const timestamp = new Date().toISOString();
  const runId = makeRunId(indication);
  const limitations: string[] = [];

  const competitorResults = await Promise.all(
    competitors.map(async (competitor): Promise<CiCompetitor> => {
      const [programsResult, publicationsResult] = await Promise.allSettled([
        searchTrialsForCompetitor(indication, competitor, maxTrials),
        maxPublications ? searchPublicationsForCompetitor(indication, competitor, timeWindowWeeks, maxPublications) : Promise.resolve([]),
      ]);
      if (programsResult.status === "rejected") limitations.push(`${competitor}: ClinicalTrials.gov retrieval failed: ${programsResult.reason instanceof Error ? programsResult.reason.message : String(programsResult.reason)}`);
      if (publicationsResult.status === "rejected") limitations.push(`${competitor}: PubMed retrieval failed: ${publicationsResult.reason instanceof Error ? publicationsResult.reason.message : String(publicationsResult.reason)}`);
      return {
        name: competitor,
        programs: programsResult.status === "fulfilled" ? programsResult.value : [],
        publications: publicationsResult.status === "fulfilled" ? publicationsResult.value : [],
      };
    })
  );

  const alerts = competitorResults.flatMap((competitor) => makeAlerts(competitor.name, competitor.programs, competitor.publications, timestamp));
  const evidenceGaps = competitorResults.flatMap(makeEvidenceGaps);
  const recommendations = makeRecommendations(competitorResults, evidenceGaps, alerts);
  const totalTrials = competitorResults.reduce((sum, competitor) => sum + competitor.programs.length, 0);
  const totalPublications = competitorResults.reduce((sum, competitor) => sum + competitor.publications.length, 0);

  const runWithoutReport: Omit<CompetitiveIntelRun, "report_markdown"> = {
    run_id: runId,
    indication,
    time_window_weeks: timeWindowWeeks,
    timestamp,
    competitors: competitorResults,
    alerts,
    evidence_gaps: evidenceGaps,
    strategic_implications: recommendations,
    audit: {
      sources_queried: ["ClinicalTrials.gov", "PubMed"],
      total_trials: totalTrials,
      total_publications: totalPublications,
      total_alerts: alerts.length,
      chain_id: `ci-command-center:${runId}`,
      deterministic: true,
      limitations,
    },
  };

  return {
    ...runWithoutReport,
    report_markdown: makeReport(runWithoutReport),
  };
}
