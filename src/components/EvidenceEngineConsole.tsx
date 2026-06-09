"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { EvidenceEngineDocumentChatResponse } from "@/lib/evidence-engine/types";

type Chain = {
  id: string;
  name: string;
  status: "available" | "partial" | "planned";
  outputs: string[];
};

type ChainsResponse = {
  ok: boolean;
  engineConnected: boolean;
  chains?: Chain[];
  error?: string;
};

type RunResponse = {
  ok: boolean;
  engineConnected: boolean;
  reviewRequired?: boolean;
  queryRunId?: string;
  evidenceCandidates?: Array<{
    candidateId: string;
    sourceProvider: string;
    sourceTitle: string;
    sourceUrl: string;
    confidence: string;
    promotionStatus: string;
  }>;
  result?: {
    chain: Chain;
    status: string;
    artifacts: Record<string, unknown>;
    limitations: string[];
  };
  limitations?: string[];
  error?: string;
};

type ProtocolResponse = {
  ok: boolean;
  engineConnected: boolean;
  protocol?: {
    pico: {
      framework: string;
      population: string;
      intervention_or_exposure: string;
      comparator: string;
      outcomes: string[];
      timeframe?: string;
      context: string;
      disease_class?: string;
      domain_rule_set?: string;
      disease_modifiers?: string[];
      domain_rules_applied?: string[];
      inferred_elements?: string[];
      inference_records?: Array<Record<string, string>>;
      picots_complete?: boolean;
      protocol_warnings?: string[];
      review_type_recommendation?: ReviewTypeRecommendation;
      review_type?: string;
      review_type_confidence?: number;
      recommended_review_framework?: string;
      reporting_guideline?: string;
    };
    review_type_recommendation?: ReviewTypeRecommendation;
  };
  error?: string;
};

type ReviewTypeRecommendation = {
  review_type: string;
  label: string;
  confidence: number;
  rationale: string;
  recommended_framework: string;
  reporting_guideline: string;
  appraisal_tools: string[];
  method_requirements: string[];
  expected_outputs: string[];
  evidence_handling: string;
  warnings: string[];
};

type PdfExtractionResponse = {
  ok: boolean;
  engineConnected: boolean;
  reviewRequired?: boolean;
  queryRunId?: string;
  extraction?: {
    status: string;
    record: Record<string, unknown>;
    coding_form: Record<string, unknown>;
    extracted_signals: Record<string, unknown>;
    provenance: Record<string, unknown>;
    limitations: string[];
  };
  evidenceCandidates?: Array<{
    candidateId: string;
    sourceProvider: string;
    sourceTitle: string;
    sourceUrl: string;
    confidence: string;
    promotionStatus: string;
  }>;
  error?: string;
};

type DocumentChatResponse = {
  ok: boolean;
  engineConnected: boolean;
  reviewRequired?: boolean;
  queryRunId?: string;
  conversationId?: string;
  chatMessageId?: string;
  persistedChat?: {
    conversation: EvidenceChatConversation;
    message: EvidenceChatStoredMessage;
  };
  chat?: EvidenceEngineDocumentChatResponse;
  evidenceCandidates?: Array<{
    candidateId: string;
    sourceProvider: string;
    sourceTitle: string;
    sourceUrl: string;
    confidence: string;
    promotionStatus: string;
  }>;
  error?: string;
};

type ChatScope = "report" | "sources" | "upload";

type EvidenceChatConversation = {
  id: string;
  scope: ChatScope;
  title: string;
  sourceTitle?: string;
  updatedAt: string;
};

type EvidenceChatStoredMessage = {
  id: string;
  conversationId: string;
  queryRunId?: string;
  turnIndex: number;
  userMessage: string;
  chatResponse: EvidenceEngineDocumentChatResponse;
  createdAt: string;
};

type EvidenceChatConversationResponse = {
  ok: boolean;
  conversations?: EvidenceChatConversation[];
  conversation?: EvidenceChatConversation;
  messages?: EvidenceChatStoredMessage[];
  error?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  scope: ChatScope;
  response?: DocumentChatResponse;
  error?: string;
};

type SourceMethodResponse = {
  ok: boolean;
  engineConnected: boolean;
  action?: string;
  result?: unknown;
  error?: string;
};

type EvidenceEngineConsoleFocus = "workspace" | "chat" | "tools";

type ReportQualityCheck = {
  id: string;
  label: string;
  passed: boolean;
  details?: string[];
};

const fallbackChains: Chain[] = [
  { id: "full_slr", name: "Full SLR", status: "available", outputs: ["PICO protocol", "search log", "PRISMA scaffold"] },
  { id: "payer_brief", name: "Payer Brief", status: "available", outputs: ["value story support", "claim traceability", "evidence gaps"] },
  { id: "heor_foundation", name: "HEOR Foundation", status: "available", outputs: ["model inputs", "assumptions", "readiness"] },
  { id: "safety_review", name: "Safety Review", status: "available", outputs: ["FAERS context", "safety fields", "limitations"] },
  { id: "repurposing", name: "Repurposing", status: "partial", outputs: ["hypotheses", "mechanistic notes", "failure checks"] },
  { id: "regulatory", name: "Regulatory", status: "partial", outputs: ["label context", "benefit-risk table", "guardrails"] },
  { id: "genomics", name: "Genomics", status: "partial", outputs: ["gene evidence", "target overlap", "readiness"] },
  { id: "trial_intelligence", name: "Trial Intelligence", status: "available", outputs: ["trial status", "phase counts", "eligibility fields"] },
  { id: "full_discovery", name: "Full Discovery", status: "partial", outputs: ["SLR", "safety", "HEOR", "genomics"] },
  { id: "rapid_scan", name: "Rapid Scan", status: "available", outputs: ["fast protocol", "small search", "dedupe"] },
];

const starterQuestion =
  "Compare safety and efficacy evidence for dupilumab versus placebo in adults with moderate-to-severe atopic dermatitis, focusing on randomized trials, adverse events, EASI response, itch reduction, and discontinuation.";

const frameworkOptions = [
  "Auto",
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
] as const;
const sourceMethodTabs = ["universal", "hydrate", "safety", "trials", "labels", "runs"] as const;

function safeJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getArtifactArray(artifacts: Record<string, unknown> | undefined, key: string) {
  const value = artifacts?.[key];
  return Array.isArray(value) ? value : [];
}

function getSourceInventory(artifacts: Record<string, unknown> | undefined) {
  const records = getArtifactArray(artifacts, "records");
  const sourceRecords = getArtifactArray(artifacts, "source_records");
  const primary = records.some((record) => isRecord(record) && isRecord(record.enrichment)) ? records : sourceRecords;
  return primary.filter(isRecord);
}

function getReportMarkdown(artifacts: Record<string, unknown> | undefined) {
  const value = artifacts?.report_markdown;
  return typeof value === "string" ? value : "";
}

function getClientReadyReportMarkdown(artifacts: Record<string, unknown> | undefined) {
  const value = artifacts?.client_ready_report_markdown;
  return typeof value === "string" && value.trim() ? value : getReportMarkdown(artifacts);
}

function getReportQuality(artifacts: Record<string, unknown> | undefined) {
  const value = artifacts?.report_quality;
  return isRecord(value) ? value : null;
}

function getReportSections(artifacts: Record<string, unknown> | undefined) {
  return getArtifactArray(artifacts, "report_sections").filter(isRecord);
}

function getReportSectionQuality(artifacts: Record<string, unknown> | undefined) {
  return getArtifactArray(artifacts, "report_section_quality").filter(isRecord);
}

function numberValue(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return null;
}

function boolValue(record: Record<string, unknown> | null, key: string) {
  return record?.[key] === true;
}

function stringArrayValue(record: Record<string, unknown> | null, key: string) {
  const value = record?.[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function reportQualityChecks(reportQuality: Record<string, unknown> | null): ReportQualityCheck[] {
  if (!reportQuality) return [];
  const missingSections = stringArrayValue(reportQuality, "missing_sections");
  const malformedSignals = stringArrayValue(reportQuality, "malformed_text_signals");
  const duplicateHeadings = stringArrayValue(reportQuality, "duplicate_headings");
  const longLineCount = numberValue(reportQuality, ["long_line_count"]) ?? 0;
  return [
    {
      id: "structure",
      label: "Required sections present",
      passed: missingSections.length === 0,
      details: missingSections.map((item) => `Missing: ${item}`),
    },
    {
      id: "formatting",
      label: "Formatting and text integrity",
      passed: malformedSignals.length === 0 && duplicateHeadings.length === 0 && longLineCount === 0,
      details: [...malformedSignals, ...duplicateHeadings.map((item) => `Duplicate heading: ${item}`), ...(longLineCount ? [`${longLineCount} long line(s) need wrapping`] : [])],
    },
    {
      id: "governance",
      label: "Draft and human-review language",
      passed: boolValue(reportQuality, "has_governance_language"),
      details: boolValue(reportQuality, "has_governance_language") ? [] : ["Governance language was not detected."],
    },
    {
      id: "prisma",
      label: "PRISMA flow included",
      passed: boolValue(reportQuality, "has_prisma"),
      details: boolValue(reportQuality, "has_prisma") ? [] : ["PRISMA terms were not detected."],
    },
    {
      id: "quant",
      label: "Quantitative readiness described",
      passed: boolValue(reportQuality, "has_quantitative_section"),
      details: boolValue(reportQuality, "has_quantitative_section") ? [] : ["Quantitative synthesis readiness was not detected."],
    },
  ];
}

function buildReportChatText(markdown: string, artifacts: Record<string, unknown> | undefined) {
  const synthesis = getQuantitativeSynthesis(artifacts);
  const sourceCount = getSourceInventory(artifacts).length;
  const quantSummary = Object.keys(synthesis).length ? `\n\nQuantitative synthesis artifact:\n${safeJson(synthesis).slice(0, 50_000)}` : "";
  return [
    "EvidaraOS generated SLR report. Candidate-only; human verification required.",
    `Source records represented: ${sourceCount}`,
    markdown,
    quantSummary,
  ]
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 280_000);
}

function buildSourcesChatText(artifacts: Record<string, unknown> | undefined) {
  const records = getSourceInventory(artifacts);
  if (!records.length) return "";
  return records
    .slice(0, 120)
    .map((record, index) => {
      const enrichment = isRecord(record.enrichment) ? record.enrichment : {};
      const signals = isRecord(enrichment.full_text_extracted_signals) ? enrichment.full_text_extracted_signals : {};
      const fullTextSections = isRecord(enrichment.full_text_sections) ? enrichment.full_text_sections : {};
      const sectionText = Object.entries(fullTextSections)
        .flatMap(([section, value]) => (typeof value === "string" ? [`${section}: ${value.slice(0, 2500)}`] : []))
        .join("\n");
      return [
        `SOURCE ${index + 1}`,
        `Title: ${sourceTitle(record)}`,
        `Provider: ${sourceProvider(record)}`,
        `Year: ${textValue(record, ["year", "publication_date"]) || "not available"}`,
        `DOI: ${textValue(record, ["doi", "DOI"]) || "not available"}`,
        `PMID: ${textValue(record, ["pmid", "PMID"]) || "not available"}`,
        `URL: ${sourceUrl(record) || "not available"}`,
        `Screening/status: ${textValue(record, ["screening_disposition", "disposition"]) || textValue(enrichment, ["screening_disposition", "full_text_hydration_status", "hydration_status"]) || "candidate"}`,
        `Study design: ${textValue(enrichment, ["study_design_label"]) || "not classified"}`,
        `Abstract/source overview: ${textValue(record, ["abstract", "summary", "sourceOverview"]).slice(0, 3500) || "not available"}`,
        sectionText ? `Full-text sections/snippets:\n${sectionText}` : "",
        Object.keys(signals).length ? `Extracted deterministic signals:\n${safeJson(signals).slice(0, 7000)}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n")
    .slice(0, 280_000);
}

function countHydrationStatus(artifacts: Record<string, unknown> | undefined, status: string) {
  return getSourceInventory(artifacts).filter((record) => {
    const enrichment = isRecord(record.enrichment) ? record.enrichment : record;
    return enrichment.full_text_hydration_status === status || enrichment.hydration_status === status;
  }).length;
}

function needsFullTextTriage(record: Record<string, unknown>) {
  const enrichment = isRecord(record.enrichment) ? record.enrichment : record;
  const fullTextStatus = textValue(enrichment, ["full_text_hydration_status"]);
  const hydrationStatus = textValue(enrichment, ["hydration_status"]);
  if (fullTextStatus === "full_text_recovered" || hydrationStatus === "full_text_recovered") return false;
  return Boolean(textValue(record, ["doi", "pmid", "url", "sourceUrl", "source_url"]) || fullTextStatus === "Requires_Manual_PDF_Ingestion");
}

function countNeedsFullTextTriage(artifacts: Record<string, unknown> | undefined) {
  return getSourceInventory(artifacts).filter(needsFullTextTriage).length;
}

function textValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function nestedText(record: Record<string, unknown>, path: string[]) {
  let current: unknown = record;
  for (const key of path) {
    if (!isRecord(current)) return "";
    current = current[key];
  }
  return typeof current === "string" ? current.trim() : "";
}

function sourceTitle(record: Record<string, unknown>) {
  return textValue(record, ["title", "sourceTitle", "source_title"]) || "Untitled source";
}

function sourceUrl(record: Record<string, unknown>) {
  const direct = textValue(record, ["url", "sourceUrl", "source_url", "full_text_url"]);
  if (direct) return direct;
  const doi = textValue(record, ["doi", "DOI"]).replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  if (doi) return `https://doi.org/${encodeURIComponent(doi)}`;
  const pmid = textValue(record, ["pmid", "PMID"]);
  if (pmid) return `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(pmid)}/`;
  return "";
}

function hydrationDetails(record: Record<string, unknown>) {
  const enrichment = isRecord(record.enrichment) ? record.enrichment : record;
  const fullTextStatus = textValue(enrichment, ["full_text_hydration_status"]);
  const hydrationStatus = textValue(enrichment, ["hydration_status"]);
  const fullTextUrl = textValue(enrichment, ["full_text_url"]);
  const fullTextSource = textValue(enrichment, ["full_text_source"]);
  const unpaywallPdfUrl = nestedText(enrichment, ["full_text_extracted_signals", "unpaywall", "pdf_url"]);
  const manualReason = nestedText(enrichment, ["manual_queue", "reason"]);
  const status = fullTextStatus || hydrationStatus || (needsFullTextTriage(record) ? "needs_full_text_triage" : "metadata_only");
  const labelMap: Record<string, string> = {
    full_text_recovered: "Open-access full text recovered",
    Requires_Manual_PDF_Ingestion: "Manual PDF required",
    needs_full_text_triage: "Needs full-text triage",
    abstract_recovered_from_pubmed: "PubMed abstract recovered",
    no_pubmed_abstract_found: "No PubMed abstract found",
    abstract_unavailable: "Abstract unavailable",
    failed: "Hydration failed",
    rate_limited_retryable: "Rate limited, retry available",
    metadata_only: "Metadata only",
  };
  const tone =
    status === "full_text_recovered"
      ? "border-teal-200 bg-teal-50 text-teal-900"
      : status === "Requires_Manual_PDF_Ingestion" || status === "needs_full_text_triage" || status === "failed" || status === "abstract_unavailable"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-slate-200 bg-slate-50 text-slate-700";
  return {
    status,
    label: labelMap[status] ?? status.replace(/_/g, " "),
    tone,
    fullTextUrl,
    fullTextSource,
    unpaywallPdfUrl,
    manualReason,
  };
}

function sourceProvider(record: Record<string, unknown>) {
  return textValue(record, ["source", "sourceProvider", "provider"]) || "source";
}

function getQuantitativeSynthesis(artifacts: Record<string, unknown> | undefined) {
  const value = artifacts?.quantitative_synthesis;
  return isRecord(value) ? value : {};
}

function getQuantCharts(artifacts: Record<string, unknown> | undefined) {
  const synthesis = getQuantitativeSynthesis(artifacts);
  return isRecord(synthesis.charts) ? synthesis.charts : {};
}

function chartEntries(artifacts: Record<string, unknown> | undefined) {
  const labels: Record<string, string> = {
    prisma_svg: "PRISMA Flow",
    forest_plot_svg: "Forest Plot",
    safety_signal_svg: "Safety Signals",
    readiness_svg: "Readiness",
  };
  return Object.entries(getQuantCharts(artifacts)).flatMap(([key, value]) =>
    typeof value === "string" && value.includes("<svg") ? [{ key, label: labels[key] ?? key, svg: value }] : [],
  );
}

function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  downloadBinaryBlob(filename, blob);
}

function downloadBinaryBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function filenameFromContentDisposition(value: string | null, fallback: string) {
  const match = value?.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback;
}

function markdownToDocumentHtml(markdown: string, title: string) {
  const escapeHtml = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (value: string) =>
    escapeHtml(value)
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  const rows: string[] = [];
  const lines = markdown.split(/\r?\n/);
  let index = 0;
  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }
    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        tableLines.push(lines[index].trim());
        index += 1;
      }
      const parsed = tableLines.filter((item) => !/^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/.test(item));
      const tableRows = parsed.map((item) => item.replace(/^\||\|$/g, "").split("|").map((cell) => inline(cell.trim())));
      if (tableRows.length) {
        const [header, ...body] = tableRows;
        rows.push("<table><thead><tr>" + header.map((cell) => `<th>${cell}</th>`).join("") + "</tr></thead><tbody>");
        body.forEach((cells) => rows.push("<tr>" + cells.map((cell) => `<td>${cell}</td>`).join("") + "</tr>"));
        rows.push("</tbody></table>");
      }
      continue;
    }
    if (line.startsWith("# ")) rows.push(`<h1>${inline(line.slice(2))}</h1>`);
    else if (line.startsWith("## ")) rows.push(`<h2>${inline(line.slice(3))}</h2>`);
    else if (line.startsWith("### ")) rows.push(`<h3>${inline(line.slice(4))}</h3>`);
    else if (/^[-*]\s+/.test(line)) rows.push(`<ul><li>${inline(line.replace(/^[-*]\s+/, ""))}</li></ul>`);
    else if (/^\d+\.\s+/.test(line)) rows.push(`<ol><li>${inline(line.replace(/^\d+\.\s+/, ""))}</li></ol>`);
    else rows.push(`<p>${inline(line)}</p>`);
    index += 1;
  }
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
    body{font-family:Arial,sans-serif;line-height:1.55;color:#111827;max-width:920px;margin:36px auto;padding:0 28px}
    h1{font-size:26px;line-height:1.2;margin:0 0 16px;color:#0f172a}
    h2{font-size:20px;margin:28px 0 10px;padding-top:12px;border-top:3px solid #0f766e;color:#0f172a}
    h3{font-size:15px;margin:18px 0 8px;color:#0f766e}
    p{margin:8px 0 12px}
    table{border-collapse:collapse;width:100%;margin:12px 0 18px;font-size:12px}
    th{background:#0f172a;color:#fff;text-align:left}
    td,th{border:1px solid #d1d5db;padding:7px;vertical-align:top}
    tr:nth-child(even) td{background:#f8fafc}
    ul,ol{margin:6px 0 10px 22px}
    code{background:#f1f5f9;padding:1px 4px;border-radius:4px}
  </style></head><body>${rows.join("\n")}</body></html>`;
}

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the selected PDF."));
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result.includes(",") ? result.split(",").pop() ?? "" : result);
    };
    reader.readAsDataURL(file);
  });
}

function splitOutcomes(value: string) {
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function inferTimeframeFromQuestion(value: string) {
  const normalized = value.replace(/[–—]/g, "-");
  const trialYears = normalized.match(/\b(?:randomi[sz]ed\s+controlled\s+trials?|RCTs?)\s*,?\s*((?:19|20)\d{2}\s*-\s*(?:19|20)\d{2}|(?:19|20)\d{2})\b/i);
  if (trialYears?.[1]) return `Randomised controlled trials, ${trialYears[1].replace(/\s+/g, "")}`;
  const dateRange = normalized.match(/\b((?:19|20)\d{2})\s*-\s*((?:19|20)\d{2})\b/);
  if (dateRange?.[1] && dateRange[2]) return `${dateRange[1]}-${dateRange[2]}`;
  const sinceYear = normalized.match(/\bfrom\s+((?:19|20)\d{2})\b/i);
  if (sinceYear?.[1]) return `from ${sinceYear[1]}`;
  return "";
}

const starterTimeframe = inferTimeframeFromQuestion(starterQuestion);

function protocolFieldLabels(framework: string) {
  const labels: Record<string, { population: string; intervention: string; comparator: string; context: string; outcomes: string }> = {
    PCC: { population: "Population / Participants", intervention: "Concept", comparator: "Comparator", context: "Context", outcomes: "Charting outputs" },
    PEO: { population: "Population", intervention: "Exposure", comparator: "Comparator", context: "Context", outcomes: "Outcomes" },
    PIRT: { population: "Population", intervention: "Index test", comparator: "Reference standard", context: "Target condition", outcomes: "Accuracy outcomes" },
    PICo: { population: "Population", intervention: "Phenomenon of interest", comparator: "Comparator", context: "Context", outcomes: "Themes / findings" },
    SPIDER: { population: "Sample", intervention: "Phenomenon of interest", comparator: "Design / comparison", context: "Research type / context", outcomes: "Evaluation" },
    CMO: { population: "Context", intervention: "Mechanism", comparator: "Comparator", context: "Setting / programme", outcomes: "Outcomes" },
    SALSA: { population: "Search scope", intervention: "Synthesis focus", comparator: "Comparator", context: "Analysis focus", outcomes: "Narrative outputs" },
    Bibliometric: { population: "Topic domain", intervention: "Bibliometric topic", comparator: "Comparator", context: "Database scope", outcomes: "Metadata analyses" },
    Mapping: { population: "Population / domain", intervention: "Map topic", comparator: "Comparator", context: "Classification context", outcomes: "Mapping axes" },
    CoCoPop: { population: "Population", intervention: "Condition", comparator: "Comparator", context: "Context", outcomes: "Frequency outcomes" },
    SPICE: { population: "Perspective", intervention: "Intervention", comparator: "Comparison", context: "Setting", outcomes: "Evaluation" },
    ECLIPSE: { population: "Client group", intervention: "Expectation / service", comparator: "Comparator", context: "Location", outcomes: "Impact" },
  };
  return labels[framework] ?? { population: "Population", intervention: "Intervention / Exposure", comparator: "Comparator", context: "Context", outcomes: "Outcomes" };
}

function runButtonLabel(chainName: string, recommendation: ReviewTypeRecommendation | null) {
  if (!recommendation) return `Run ${chainName}`;
  const map: Record<string, string> = {
    systematic_review: "Run Systematic Review",
    scoping_review: "Run Scoping Review",
    rapid_review: "Run Rapid Review",
    umbrella_review: "Run Umbrella Review",
    diagnostic_accuracy_review: "Run Diagnostic Review",
    qualitative_review: "Run Qualitative Synthesis",
    realist_review: "Run Realist Review",
    bibliometric_review: "Run Bibliometric Review",
    mapping_review: "Run Evidence Map",
    narrative_review: "Run Narrative Review",
    integrative_review: "Run Integrative Review",
    critical_review: "Run Critical Review",
    state_of_the_art_review: "Run State-of-the-Art Review",
  };
  return map[recommendation.review_type] ?? `Run ${recommendation.label}`;
}

export function EvidenceEngineConsole({ focus = "workspace" }: { focus?: EvidenceEngineConsoleFocus } = {}) {
  const [chains, setChains] = useState<Chain[]>(fallbackChains);
  const [selectedChainId, setSelectedChainId] = useState("full_slr");
  const [question, setQuestion] = useState(starterQuestion);
  const [drug, setDrug] = useState("dupilumab");
  const [indication, setIndication] = useState("moderate-to-severe atopic dermatitis");
  const [framework, setFramework] = useState<(typeof frameworkOptions)[number]>("Auto");
  const [population, setPopulation] = useState("adults with moderate-to-severe atopic dermatitis");
  const [interventionOrExposure, setInterventionOrExposure] = useState("dupilumab");
  const [comparator, setComparator] = useState("placebo");
  const [outcomesText, setOutcomesText] = useState("randomized trials, adverse events, EASI response, itch reduction, discontinuation");
  const [timeframe, setTimeframe] = useState(starterTimeframe);
  const [timeframeTouched, setTimeframeTouched] = useState(false);
  const [context, setContext] = useState("");
  const [protocolMeta, setProtocolMeta] = useState<{
    diseaseClass: string;
    domainRuleSet: string;
    inferredElements: string[];
    domainRulesApplied: string[];
    diseaseModifiers: string[];
    picotsComplete: boolean | null;
    reviewTypeRecommendation: ReviewTypeRecommendation | null;
  }>({
    diseaseClass: "",
    domainRuleSet: "",
    inferredElements: [],
    domainRulesApplied: [],
    diseaseModifiers: [],
    picotsComplete: null,
    reviewTypeRecommendation: null,
  });
  const [protocolLoading, setProtocolLoading] = useState(false);
  const [protocolStatus, setProtocolStatus] = useState("Protocol fields can be edited before running.");
  const [maxResults, setMaxResults] = useState(10);
  const [liveSearch, setLiveSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [engineStatus, setEngineStatus] = useState("Checking engine connection...");
  const [runResponse, setRunResponse] = useState<RunResponse | null>(null);
  const [outputTab, setOutputTab] = useState<"summary" | "sources" | "quality" | "sections" | "figures" | "report" | "candidates" | "limitations">("summary");
  const [pdfTitle, setPdfTitle] = useState("Manual full-text source");
  const [pdfDoi, setPdfDoi] = useState("");
  const [pdfSourceUrl, setPdfSourceUrl] = useState("");
  const [pdfSourceText, setPdfSourceText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfResponse, setPdfResponse] = useState<PdfExtractionResponse | null>(null);
  const [chatTitle, setChatTitle] = useState("Uploaded evidence document");
  const [chatQuestion, setChatQuestion] = useState("Extract efficacy, safety, discontinuation, HR, CI, p-values, and source snippets.");
  const [chatDoi, setChatDoi] = useState("");
  const [chatSourceUrl, setChatSourceUrl] = useState("");
  const [chatSourceText, setChatSourceText] = useState("");
  const [chatFile, setChatFile] = useState<File | null>(null);
  const [chatScope, setChatScope] = useState<ChatScope>("upload");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatResponse, setChatResponse] = useState<DocumentChatResponse | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [chatConversations, setChatConversations] = useState<EvidenceChatConversation[]>([]);
  const [chatConversationStatus, setChatConversationStatus] = useState("Conversation history is saved after the first message.");
  const [exportingFormat, setExportingFormat] = useState<"pdf" | null>(null);
  const [exportError, setExportError] = useState("");
  const [sourceMethodTab, setSourceMethodTab] = useState<(typeof sourceMethodTabs)[number]>("universal");
  const [sourceMethodLoading, setSourceMethodLoading] = useState("");
  const [sourceMethodResponse, setSourceMethodResponse] = useState<SourceMethodResponse | null>(null);
  const [hydrateRecordJson, setHydrateRecordJson] = useState('{\n  "id": "example-doi",\n  "source": "manual",\n  "title": "Source record for hydration",\n  "doi": ""\n}');
  const [runKind, setRunKind] = useState<"universal_query" | "full_slr" | "safety_review">("universal_query");

  function internalRequestHeaders() {
    const accessToken = new URLSearchParams(window.location.search).get("access_token");
    return {
      "content-type": "application/json",
      ...(accessToken ? { "x-evidara-internal-token": accessToken } : {}),
    };
  }

  async function refreshChatConversations() {
    try {
      const response = await fetch("/api/internal/evidence-engine/chat-conversations", {
        headers: internalRequestHeaders(),
      });
      const payload = (await response.json()) as EvidenceChatConversationResponse;
      if (payload.ok) {
        setChatConversations(payload.conversations ?? []);
        setChatConversationStatus((payload.conversations?.length ?? 0) ? "Saved conversations are available." : "No saved conversations yet.");
      } else {
        setChatConversationStatus(payload.error ?? "Saved conversations are unavailable.");
      }
    } catch (error) {
      setChatConversationStatus(error instanceof Error ? error.message : "Saved conversations are unavailable.");
    }
  }

  async function loadChatConversation(conversationId: string) {
    setChatConversationStatus("Loading saved conversation...");
    try {
      const response = await fetch(`/api/internal/evidence-engine/chat-conversations?conversation_id=${encodeURIComponent(conversationId)}`, {
        headers: internalRequestHeaders(),
      });
      const payload = (await response.json()) as EvidenceChatConversationResponse;
      if (!payload.ok || !payload.conversation) throw new Error(payload.error ?? "Conversation not found.");
      setActiveConversationId(payload.conversation.id);
      setChatScope(payload.conversation.scope);
      setChatMessages(
        (payload.messages ?? []).flatMap((message) => [
          {
            id: `saved-user-${message.id}`,
            role: "user" as const,
            text: message.userMessage,
            scope: payload.conversation?.scope ?? "upload",
          },
          {
            id: `saved-assistant-${message.id}`,
            role: "assistant" as const,
            text: message.chatResponse.answer,
            scope: payload.conversation?.scope ?? "upload",
            response: {
              ok: true,
              engineConnected: true,
              reviewRequired: true,
              queryRunId: message.queryRunId,
              conversationId: payload.conversation?.id,
              chatMessageId: message.id,
              chat: message.chatResponse,
            },
          },
        ]),
      );
      setChatConversationStatus("Saved conversation loaded. Ask a new question to append another turn.");
    } catch (error) {
      setChatConversationStatus(error instanceof Error ? error.message : "Could not load saved conversation.");
    }
  }

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token") ?? "";
    const requestedChain = params.get("chain") ?? "";
    const requestedQuestion = params.get("question") ?? "";
    const requestedDrug = params.get("drug") ?? "";
    const requestedIndication = params.get("indication") ?? "";
    const requestedFramework = params.get("framework") ?? "";
    if (requestedChain) setSelectedChainId(requestedChain);
    if (requestedQuestion) setQuestion(requestedQuestion);
    if (requestedQuestion) setTimeframe(inferTimeframeFromQuestion(requestedQuestion));
    if (requestedDrug) {
      setDrug(requestedDrug);
      setInterventionOrExposure(requestedDrug);
    }
    if (requestedIndication) {
      setIndication(requestedIndication);
      setPopulation(requestedIndication);
    }
    if (frameworkOptions.includes(requestedFramework as (typeof frameworkOptions)[number])) {
      setFramework(requestedFramework as (typeof frameworkOptions)[number]);
    }
    if (!accessToken && !document.cookie.includes("evidara_internal_access=")) {
      const previewUrl = new URL("/api/preview-access", window.location.origin);
      previewUrl.searchParams.set("token", "evidaraos-preview-access");
      if (requestedChain) previewUrl.searchParams.set("chain", requestedChain);
      if (requestedQuestion) previewUrl.searchParams.set("question", requestedQuestion);
      if (requestedDrug) previewUrl.searchParams.set("drug", requestedDrug);
      if (requestedIndication) previewUrl.searchParams.set("indication", requestedIndication);
      if (requestedFramework) previewUrl.searchParams.set("framework", requestedFramework);
      window.location.replace(previewUrl.toString());
      return () => {
        cancelled = true;
      };
    }
    fetch("/api/internal/evidence-engine/chains", {
      cache: "no-store",
      headers: accessToken ? { "x-evidara-internal-token": accessToken } : undefined,
    })
      .then((response) => response.json() as Promise<ChainsResponse>)
      .then((payload) => {
        if (cancelled) return;
        if (payload.ok && payload.chains?.length) {
          setChains(payload.chains);
          setEngineStatus(payload.engineConnected ? "Python evidence engine connected" : "Engine route available, health check incomplete");
        } else {
          setEngineStatus(payload.error ?? "Using local chain registry until the engine responds.");
        }
      })
      .catch((error: Error) => {
        if (!cancelled) setEngineStatus(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void refreshChatConversations();
  }, []);

  const selectedChain = useMemo(
    () => chains.find((chain) => chain.id === selectedChainId) ?? chains[0] ?? fallbackChains[0],
    [chains, selectedChainId]
  );
  const fieldLabels = useMemo(() => protocolFieldLabels(framework), [framework]);

  const rawReportMarkdown = getReportMarkdown(runResponse?.result?.artifacts);
  const reportMarkdown = getClientReadyReportMarkdown(runResponse?.result?.artifacts);
  const reportQuality = getReportQuality(runResponse?.result?.artifacts);
  const reportSections = getReportSections(runResponse?.result?.artifacts);
  const reportSectionQuality = getReportSectionQuality(runResponse?.result?.artifacts);
  const reportQualityScore = numberValue(reportQuality, ["readiness_score", "score"]);
  const reportQualityStatus = typeof reportQuality?.status === "string" ? reportQuality.status : "";
  const reportRecommendations = stringArrayValue(reportQuality, "recommendations");
  const reportChecks = reportQualityChecks(reportQuality);
  const sourceInventory = getSourceInventory(runResponse?.result?.artifacts);
  const reportChatText = useMemo(() => buildReportChatText(reportMarkdown, runResponse?.result?.artifacts), [reportMarkdown, runResponse?.result?.artifacts]);
  const sourcesChatText = useMemo(() => buildSourcesChatText(runResponse?.result?.artifacts), [runResponse?.result?.artifacts]);
  const recordCount = sourceInventory.length || getArtifactArray(runResponse?.result?.artifacts, "source_records").length || getArtifactArray(runResponse?.result?.artifacts, "records").length;
  const includedCount = getArtifactArray(runResponse?.result?.artifacts, "extraction").length;
  const fullTextRecoveredCount = countHydrationStatus(runResponse?.result?.artifacts, "full_text_recovered");
  const needsFullTextCount = countNeedsFullTextTriage(runResponse?.result?.artifacts);
  const figures = chartEntries(runResponse?.result?.artifacts);
  const pdfLooksLikeGeneratedReport = Boolean(pdfFile?.name && /(?:evidara|slr|report|evidenceos)/i.test(pdfFile.name));
  const showWorkflow = focus === "workspace";
  const showChatTools = focus === "chat";
  const showAdvancedTools = focus === "tools";

  async function autofillProtocol() {
    setProtocolLoading(true);
    setProtocolStatus("Reading the question and drafting protocol fields...");
    const inferredTimeframe = inferTimeframeFromQuestion(question);
    if (!timeframeTouched) setTimeframe(inferredTimeframe);
    try {
      const response = await fetch("/api/internal/evidence-engine/protocol", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(new URLSearchParams(window.location.search).get("access_token")
            ? { "x-evidara-internal-token": new URLSearchParams(window.location.search).get("access_token") ?? "" }
            : {}),
        },
        body: JSON.stringify({
          question,
          framework: framework === "Auto" ? "" : framework,
        }),
      });
      const payload = (await response.json()) as ProtocolResponse;
      if (!payload.ok || !payload.protocol) {
        throw new Error(payload.error ?? "Protocol auto-fill failed.");
      }
      const pico = payload.protocol.pico;
      const detectedFramework = frameworkOptions.includes(pico.framework as (typeof frameworkOptions)[number])
        ? (pico.framework as (typeof frameworkOptions)[number])
        : "Auto";
      setFramework(detectedFramework);
      if (pico.population) {
        setPopulation(pico.population);
        setIndication(pico.population);
      }
      if (pico.intervention_or_exposure) {
        setInterventionOrExposure(pico.intervention_or_exposure);
        setDrug(pico.intervention_or_exposure);
      }
      if (pico.comparator && pico.comparator !== "not specified") setComparator(pico.comparator);
      if (pico.outcomes?.length) setOutcomesText(pico.outcomes.join(", "));
      if (!timeframeTouched) setTimeframe(pico.timeframe || inferredTimeframe);
      if (pico.context) setContext(pico.context);
      const reviewTypeRecommendation = pico.review_type_recommendation ?? payload.protocol.review_type_recommendation ?? null;
      setProtocolMeta({
        diseaseClass: pico.disease_class ?? "",
        domainRuleSet: pico.domain_rule_set ?? "",
        inferredElements: pico.inferred_elements ?? [],
        domainRulesApplied: pico.domain_rules_applied ?? [],
        diseaseModifiers: pico.disease_modifiers ?? [],
        picotsComplete: typeof pico.picots_complete === "boolean" ? pico.picots_complete : null,
        reviewTypeRecommendation,
      });
      setProtocolStatus(
        reviewTypeRecommendation
          ? `${reviewTypeRecommendation.label} recommended; ${pico.framework} fields drafted. Review and edit before running.`
          : `${pico.framework} protocol drafted. Review and edit before running.`,
      );
    } catch (error) {
      setProtocolStatus(error instanceof Error ? error.message : "Protocol auto-fill failed.");
    } finally {
      setProtocolLoading(false);
    }
  }

  async function runSelectedChain(overrides: { live_search?: boolean; max_results?: number } = {}) {
    setLoading(true);
    setRunResponse(null);
    setOutputTab("summary");
    const outcomes = splitOutcomes(outcomesText);
    const requestedLiveSearch = overrides.live_search ?? liveSearch;
    const requestedMaxResults = overrides.max_results ?? maxResults;
    const effectiveTimeframe = inferTimeframeFromQuestion(question) || timeframe;
    try {
      const response = await fetch("/api/internal/evidence-engine/run", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(new URLSearchParams(window.location.search).get("access_token")
            ? { "x-evidara-internal-token": new URLSearchParams(window.location.search).get("access_token") ?? "" }
            : {}),
        },
        body: JSON.stringify({
          chain_id: selectedChain.id,
          question,
          drug: drug || interventionOrExposure,
          indication: indication || population,
          framework: framework === "Auto" ? "" : framework,
          population,
          intervention_or_exposure: interventionOrExposure,
          comparator,
          outcomes,
          timeframe: effectiveTimeframe,
          context,
          max_results: requestedMaxResults,
          live_search: requestedLiveSearch,
        }),
      });
      const payload = (await response.json()) as RunResponse;
      if (!response.ok && !payload.error) {
        payload.error = `Workflow request failed with HTTP ${response.status}. Try a smaller max-results value or turn off live retrieval.`;
      }
      setRunResponse(payload);
    } catch (error) {
      setRunResponse({
        ok: false,
        engineConnected: false,
        error:
          error instanceof Error
            ? `${error.message}. Try turning off live retrieval or lowering max results for a fast first pass.`
            : "Run failed. Try turning off live retrieval or lowering max results for a fast first pass.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function runSourceMethod(action: string, payload: Record<string, unknown>) {
    setSourceMethodLoading(action);
    setSourceMethodResponse(null);
    try {
      const response = await fetch("/api/internal/evidence-engine/source-methods", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(new URLSearchParams(window.location.search).get("access_token")
            ? { "x-evidara-internal-token": new URLSearchParams(window.location.search).get("access_token") ?? "" }
            : {}),
        },
        body: JSON.stringify({ action, ...payload }),
      });
      setSourceMethodResponse((await response.json()) as SourceMethodResponse);
    } catch (error) {
      setSourceMethodResponse({
        ok: false,
        engineConnected: false,
        action,
        error: error instanceof Error ? error.message : "Source method request failed.",
      });
    } finally {
      setSourceMethodLoading("");
    }
  }

  function runUniversalQuery() {
    return runSourceMethod("universal_query", {
      question,
      max_results: maxResults,
      live_search: liveSearch,
      include_faers: true,
    });
  }

  function runHydrationRetry() {
    let record: Record<string, unknown>;
    try {
      record = JSON.parse(hydrateRecordJson) as Record<string, unknown>;
    } catch {
      setSourceMethodResponse({
        ok: false,
        engineConnected: false,
        action: "hydrate_record",
        error: "Hydration record JSON is not valid.",
      });
      return;
    }
    return runSourceMethod("hydrate_record", { record });
  }

  function runFaersExplorer() {
    return runSourceMethod("faers", {
      drug: interventionOrExposure || drug,
      indication: population || indication,
      max_results: Math.min(Math.max(maxResults * 10, 10), 200),
      live_fetch: liveSearch,
    });
  }

  function runTrialExplorer() {
    return runSourceMethod("trials", {
      condition: population || indication,
      intervention: interventionOrExposure || drug,
      query: question,
      max_results: maxResults,
      live_fetch: true,
    });
  }

  function runLabelExplorer() {
    return runSourceMethod("label", {
      drug: interventionOrExposure || drug,
      max_results: 5,
      live_fetch: true,
    });
  }

  function createTrackedRun() {
    const effectiveTimeframe = inferTimeframeFromQuestion(question) || timeframe;
    return runSourceMethod("create_run", {
      question,
      kind: runKind,
      max_results: maxResults,
      live_search: liveSearch,
      include_faers: true,
      metadata: {
        framework: framework === "Auto" ? "" : framework,
        population,
        intervention_or_exposure: interventionOrExposure,
        comparator,
        outcomes: splitOutcomes(outcomesText),
        timeframe: effectiveTimeframe,
        context,
      },
    });
  }

  function listTrackedRuns() {
    return runSourceMethod("list_runs", { limit: 10 });
  }

  async function runPdfExtraction() {
    setPdfLoading(true);
    setPdfResponse(null);
    try {
      const pdfBase64 = pdfFile ? await fileToBase64(pdfFile) : "";
      const response = await fetch("/api/internal/evidence-engine/pdf-extraction", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(new URLSearchParams(window.location.search).get("access_token")
            ? { "x-evidara-internal-token": new URLSearchParams(window.location.search).get("access_token") ?? "" }
            : {}),
        },
        body: JSON.stringify({
          question,
          title: pdfTitle,
          doi: pdfDoi,
          source_url: pdfSourceUrl,
          filename: pdfFile?.name ?? "",
          source_text: pdfSourceText,
          pdf_base64: pdfBase64,
          population,
          intervention_or_exposure: interventionOrExposure,
          comparator,
          outcomes: splitOutcomes(outcomesText),
        }),
      });
      const payload = (await response.json()) as PdfExtractionResponse;
      setPdfResponse(payload);
    } catch (error) {
      setPdfResponse({
        ok: false,
        engineConnected: false,
        error: error instanceof Error ? error.message : "PDF extraction failed.",
      });
    } finally {
      setPdfLoading(false);
    }
  }

  async function runDocumentChat(questionOverride?: string) {
    const askedQuestion = (questionOverride ?? chatQuestion).trim();
    if (!askedQuestion) return;
    setChatLoading(true);
    setChatResponse(null);
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: askedQuestion,
      scope: chatScope,
    };
    setChatMessages((items) => [...items, userMessage]);
    try {
      const fileBase64 = chatFile ? await fileToBase64(chatFile) : "";
      const isDocx = Boolean(chatFile?.name.toLowerCase().endsWith(".docx"));
      const scopedSourceText = chatScope === "report" ? reportChatText : chatScope === "sources" ? sourcesChatText : chatSourceText;
      if (chatScope === "upload" && !scopedSourceText.trim() && !fileBase64) {
        throw new Error("Upload a PDF/DOCX or paste document text before chatting.");
      }
      const scopedTitle =
        chatScope === "report"
          ? `${selectedChain.name} generated SLR report`
          : chatScope === "sources"
            ? `${selectedChain.name} retrieved source set`
            : chatTitle;
      const response = await fetch("/api/internal/evidence-engine/document-chat", {
        method: "POST",
        headers: internalRequestHeaders(),
        body: JSON.stringify({
          question: askedQuestion,
          conversation_id: activeConversationId,
          title: scopedTitle,
          doi: chatScope === "upload" ? chatDoi : "",
          source_url: chatScope === "upload" ? chatSourceUrl : "",
          filename: chatScope === "upload" ? chatFile?.name ?? "" : "",
          source_text: scopedSourceText,
          pdf_base64: chatScope === "upload" && chatFile && !isDocx ? fileBase64 : "",
          docx_base64: chatScope === "upload" && chatFile && isDocx ? fileBase64 : "",
          scope: chatScope,
        }),
      });
      const payload = (await response.json()) as DocumentChatResponse;
      setChatResponse(payload);
      if (payload.conversationId) setActiveConversationId(payload.conversationId);
      setChatMessages((items) => [
        ...items,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: payload.chat?.answer || payload.error || "No answer returned.",
          scope: chatScope,
          response: payload,
          error: payload.error,
        },
      ]);
      void refreshChatConversations();
      setChatQuestion("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Document chat failed.";
      const failedResponse = {
        ok: false,
        engineConnected: false,
        error: message,
      };
      setChatResponse(failedResponse);
      setChatMessages((items) => [
        ...items,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: message,
          scope: chatScope,
          error: message,
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  async function exportReportPdf() {
    if (!reportMarkdown) return;
    setExportingFormat("pdf");
    setExportError("");
    try {
      const response = await fetch("/api/internal/evidence-engine/export", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(new URLSearchParams(window.location.search).get("access_token")
            ? { "x-evidara-internal-token": new URLSearchParams(window.location.search).get("access_token") ?? "" }
            : {}),
        },
        body: JSON.stringify({
          title: `${selectedChain.name} evidence report`,
          markdown: reportMarkdown,
          format: "pdf",
          charts: getQuantCharts(runResponse?.result?.artifacts),
        }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? `Export failed with HTTP ${response.status}.`);
      }
      const blob = await response.blob();
      downloadBinaryBlob(
        filenameFromContentDisposition(response.headers.get("content-disposition"), `${selectedChain.id}-evidence-report.pdf`),
        blob,
      );
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "PDF export failed.");
    } finally {
      setExportingFormat(null);
    }
  }

  return (
    <section className="space-y-6">
      {showWorkflow ? (
        <>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Evidence Engine Bridge</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Run a governed analysis chain</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              The Next.js workspace calls the private Python Evidence Engine. Outputs stay candidate-only until reviewed,
              promoted, and linked to source provenance.
            </p>
          </div>
          <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-900">{engineStatus}</div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Analysis chain</p>
          <div className="mt-4 grid gap-3">
            {chains.map((chain) => (
              <button
                key={chain.id}
                type="button"
                onClick={() => setSelectedChainId(chain.id)}
                className={`rounded-2xl border p-4 text-left transition ${
                  selectedChain.id === chain.id
                    ? "border-teal-500 bg-teal-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-950">{chain.name}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                    {chain.status}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-5 text-slate-600">{chain.outputs.slice(0, 3).join(" · ")}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Selected workflow</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">{selectedChain.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{selectedChain.outputs.join(" · ")}</p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Review required</span>
          </div>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Biomedical question</span>
              <textarea
                value={question}
                onChange={(event) => {
                  const nextQuestion = event.target.value;
                  setQuestion(nextQuestion);
                  const inferredTimeframe = inferTimeframeFromQuestion(nextQuestion);
                  if (!timeframeTouched) setTimeframe(inferredTimeframe);
                }}
                rows={5}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none ring-teal-500/20 focus:border-teal-600 focus:ring-4"
              />
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Protocol builder</p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">{protocolStatus}</p>
                </div>
                <button
                  type="button"
                  onClick={autofillProtocol}
                  disabled={protocolLoading || !question.trim()}
                  className="rounded-full border border-teal-700 bg-white px-4 py-2 text-xs font-semibold text-teal-800 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
                >
                  {protocolLoading ? "Auto-filling..." : "Auto-fill from question"}
                </button>
              </div>

              {protocolMeta.reviewTypeRecommendation && (
                <div className="mt-4 rounded-2xl border border-teal-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Recommended review design</p>
                      <h4 className="mt-1 text-base font-semibold text-slate-950">{protocolMeta.reviewTypeRecommendation.label}</h4>
                      <p className="mt-1 text-sm leading-6 text-slate-700">{protocolMeta.reviewTypeRecommendation.rationale}</p>
                    </div>
                    <div className="shrink-0 rounded-2xl bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-900">
                      {Math.round(protocolMeta.reviewTypeRecommendation.confidence * 100)}% match
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Framework</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{protocolMeta.reviewTypeRecommendation.recommended_framework}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Reporting</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{protocolMeta.reviewTypeRecommendation.reporting_guideline}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Expected output</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {protocolMeta.reviewTypeRecommendation.expected_outputs.slice(0, 3).join(", ")}
                      </p>
                    </div>
                  </div>
                  {protocolMeta.reviewTypeRecommendation.method_requirements.length > 0 && (
                    <ul className="mt-3 grid gap-2 text-xs leading-5 text-slate-700 md:grid-cols-2">
                      {protocolMeta.reviewTypeRecommendation.method_requirements.slice(0, 4).map((item) => (
                        <li key={item} className="rounded-xl bg-slate-50 px-3 py-2">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-800">Framework</span>
                  <select
                    value={framework}
                    onChange={(event) => setFramework(event.target.value as (typeof frameworkOptions)[number])}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-teal-500/20 focus:border-teal-600 focus:ring-4"
                  >
                    {frameworkOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-800">Timeframe</span>
                  <input
                    value={timeframe}
                    onChange={(event) => {
                      setTimeframeTouched(true);
                      setTimeframe(event.target.value);
                    }}
                    placeholder="week 16, 52 weeks, long-term follow-up"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-teal-500/20 focus:border-teal-600 focus:ring-4"
                  />
                </label>
              </div>
              {(protocolMeta.diseaseClass || protocolMeta.domainRuleSet || protocolMeta.inferredElements.length > 0) && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  <div className="flex flex-wrap gap-2">
                    {protocolMeta.diseaseClass && (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-800">
                        {protocolMeta.diseaseClass.replace(/_/g, " ")}
                      </span>
                    )}
                    {protocolMeta.domainRuleSet && (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-800">
                        {protocolMeta.domainRuleSet}
                      </span>
                    )}
                    {protocolMeta.diseaseModifiers.map((modifier) => (
                      <span key={modifier} className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-800">
                        {modifier.replace(/_/g, " ")}
                      </span>
                    ))}
                    {protocolMeta.picotsComplete === false && (
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-800">
                        PICOTS incomplete
                      </span>
                    )}
                  </div>
                  {protocolMeta.inferredElements.length > 0 && (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5">
                      {protocolMeta.inferredElements.slice(0, 6).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-800">{fieldLabels.population}</span>
                <input
                  value={population}
                  onChange={(event) => {
                    setPopulation(event.target.value);
                    setIndication(event.target.value);
                  }}
                  placeholder="adults with moderate-to-severe atopic dermatitis"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-teal-500/20 focus:border-teal-600 focus:ring-4"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-800">{fieldLabels.intervention}</span>
                <input
                  value={interventionOrExposure}
                  onChange={(event) => {
                    setInterventionOrExposure(event.target.value);
                    setDrug(event.target.value);
                  }}
                  placeholder="drug, regimen, exposure, service, condition"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-teal-500/20 focus:border-teal-600 focus:ring-4"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-800">{fieldLabels.comparator}</span>
                <input
                  value={comparator}
                  onChange={(event) => setComparator(event.target.value)}
                  placeholder="placebo, standard care, unexposed, not specified"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-teal-500/20 focus:border-teal-600 focus:ring-4"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-800">{fieldLabels.context}</span>
                <input
                  value={context}
                  onChange={(event) => setContext(event.target.value)}
                  placeholder="setting, geography, line of therapy, health system"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-teal-500/20 focus:border-teal-600 focus:ring-4"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-800">{fieldLabels.outcomes}</span>
              <textarea
                value={outcomesText}
                onChange={(event) => setOutcomesText(event.target.value)}
                rows={3}
                placeholder="overall survival, PFS, adverse events, discontinuation, EASI response"
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none ring-teal-500/20 focus:border-teal-600 focus:ring-4"
              />
            </label>

            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={liveSearch}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setLiveSearch(checked);
                    if (checked && maxResults > 20) setMaxResults(20);
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-teal-700"
                />
                Run live public-source retrieval where supported
              </label>
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                Max results
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={maxResults}
                  onChange={(event) => setMaxResults(Math.min(Math.max(Number(event.target.value) || 10, 1), 50))}
                  className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600"
                />
              </label>
            </div>
            {liveSearch ? (
              <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                Live retrieval calls public sources and can take longer on large runs. For first-pass SLR onboarding, use 10-20 records, then expand after the workflow succeeds.
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => runSelectedChain()}
              disabled={loading}
              className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? "Running analysis..." : runButtonLabel(selectedChain.name, protocolMeta.reviewTypeRecommendation)}
            </button>
          </div>
        </div>
      </div>

      {runResponse ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Workflow output</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">
                {runResponse.ok ? `${runResponse.result?.chain.name ?? selectedChain.name} completed` : "Workflow failed"}
              </h3>
              {runResponse.queryRunId ? <p className="mt-1 font-mono text-xs text-slate-500">query_run: {runResponse.queryRunId}</p> : null}
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${runResponse.ok ? "bg-teal-50 text-teal-800" : "bg-red-50 text-red-800"}`}>
              {runResponse.ok ? "candidate-only" : "needs attention"}
            </span>
          </div>

          {runResponse.error ? <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-800">{runResponse.error}</p> : null}
          {!runResponse.ok ? (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-amber-950">
                Recovery path: run a fast SLR scaffold without live retrieval first, then expand sources after the protocol and report shell are created.
              </p>
              <button
                type="button"
                onClick={() => runSelectedChain({ live_search: false, max_results: Math.min(maxResults, 10) })}
                disabled={loading}
                className="shrink-0 rounded-full bg-amber-900 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-800 disabled:bg-amber-300"
              >
                Retry fast scan
              </button>
            </div>
          ) : null}

          {runResponse.result ? (
            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.7fr]">
              <div className="rounded-2xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Analysis package</p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">Source-linked draft output, candidate-only</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {reportMarkdown ? (
                        <>
                          <button type="button" onClick={() => downloadBlob(`${selectedChain.id}-evidence-report.md`, reportMarkdown, "text/markdown")} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-50">
                            Markdown
                          </button>
                          <button type="button" onClick={() => downloadBlob(`${selectedChain.id}-evidence-report.doc`, markdownToDocumentHtml(reportMarkdown, `${selectedChain.name} evidence report`), "application/msword")} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-50">
                            Word
                          </button>
                          <button
                            type="button"
                            onClick={exportReportPdf}
                            disabled={exportingFormat === "pdf"}
                            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                          >
                            {exportingFormat === "pdf" ? "Exporting..." : "PDF"}
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {exportError ? <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{exportError}</p> : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      ["summary", "Summary"],
                      ["sources", "Sources"],
                      ["quality", "Quality"],
                      ["sections", "Sections"],
                      ["figures", "Figures"],
                      ["report", "Report"],
                      ["candidates", "Candidates"],
                      ["limitations", "Limitations"],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setOutputTab(id as typeof outputTab)}
                        className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                          outputTab === id ? "bg-slate-950 text-white" : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-white"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4">
                  {outputTab === "summary" ? (
                    <div className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-4">
                        {[
                          ["Records", recordCount],
                          ["Extracted", includedCount],
                          ["Full text", fullTextRecoveredCount],
                          ["Needs full text", needsFullTextCount],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                            <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        <p className="font-semibold text-slate-950">What happened</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          The Python engine completed the selected workflow and normalized source-linked records into a candidate evidence package.
                          {reportQuality ? " A report quality review was also generated so reviewers can see readiness, formatting checks, and next actions." : " Open the Report tab for the draft document, or Candidates for review handoff."}
                        </p>
                      </div>
                      {reportQuality ? (
                        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold text-teal-950">Client-readiness check</p>
                              <p className="mt-1 text-sm leading-6 text-teal-900">
                                Status: {reportQualityStatus || "reviewed"} · {reportRecommendations.length} reviewer recommendation(s)
                              </p>
                            </div>
                            {reportQualityScore !== null ? (
                              <div className="rounded-2xl bg-white px-4 py-3 text-center shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Score</p>
                                <p className="mt-1 text-2xl font-semibold text-teal-950">{Math.round(reportQualityScore * 100)}%</p>
                              </div>
                            ) : null}
                          </div>
                          <button type="button" onClick={() => setOutputTab("quality")} className="mt-4 rounded-full bg-teal-700 px-4 py-2 text-xs font-semibold text-white">
                            Review quality details
                          </button>
                        </div>
                      ) : null}
                      <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                          <div>
                            <p className="font-semibold text-slate-950">Full-text source availability</p>
                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              Hydration status from PubMed, PMC, Europe PMC, and Unpaywall for each retrieved source.
                            </p>
                          </div>
                          <button type="button" onClick={() => setOutputTab("sources")} className="w-fit rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-50">
                            View all sources
                          </button>
                        </div>
                        <div className="mt-4 space-y-3">
                          {sourceInventory.slice(0, 6).map((record, index) => {
                            const hydration = hydrationDetails(record);
                            const url = sourceUrl(record);
                            return (
                              <div key={`${sourceTitle(record)}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-slate-950">{sourceTitle(record)}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                      {sourceProvider(record)} · {textValue(record, ["doi", "pmid", "id"]) || "identifier pending"}
                                    </p>
                                  </div>
                                  <span className={`w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold ${hydration.tone}`}>
                                    {hydration.label}
                                  </span>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {url ? <a href={url} target="_blank" rel="noreferrer" className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">Source page</a> : null}
                                  {hydration.fullTextUrl ? <a href={hydration.fullTextUrl} target="_blank" rel="noreferrer" className="rounded-full bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white">Full text</a> : null}
                                  {hydration.unpaywallPdfUrl ? <a href={hydration.unpaywallPdfUrl} target="_blank" rel="noreferrer" className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white">Unpaywall PDF</a> : null}
                                </div>
                                {hydration.manualReason ? <p className="mt-2 text-xs leading-5 text-amber-800">{hydration.manualReason}</p> : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {outputTab === "sources" ? (
                    <div className="space-y-3">
                      {sourceInventory.length ? (
                        sourceInventory.map((record, index) => {
                          const hydration = hydrationDetails(record);
                          const url = sourceUrl(record);
                          return (
                            <div key={`${sourceTitle(record)}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                  <p className="text-sm font-semibold text-slate-950">{sourceTitle(record)}</p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {sourceProvider(record)} · {textValue(record, ["year", "publication_date"]) || "date pending"} · {textValue(record, ["doi", "pmid", "id"]) || "identifier pending"}
                                  </p>
                                </div>
                                <span className={`w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold ${hydration.tone}`}>
                                  {hydration.label}
                                </span>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {url ? <a href={url} target="_blank" rel="noreferrer" className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">Source page</a> : null}
                                {hydration.fullTextUrl ? <a href={hydration.fullTextUrl} target="_blank" rel="noreferrer" className="rounded-full bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white">Full text</a> : null}
                                {hydration.unpaywallPdfUrl ? <a href={hydration.unpaywallPdfUrl} target="_blank" rel="noreferrer" className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white">Unpaywall PDF</a> : null}
                              </div>
                              <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                                <p>Hydration: {hydration.status}</p>
                                <p>Full-text source: {hydration.fullTextSource || "not available"}</p>
                              </div>
                              {hydration.manualReason ? <p className="mt-2 text-xs leading-5 text-amber-800">{hydration.manualReason}</p> : null}
                            </div>
                          );
                        })
                      ) : (
                        <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">No source inventory was returned by this run.</p>
                      )}
                    </div>
                  ) : null}

                  {outputTab === "figures" ? (
                    figures.length ? (
                      <div className="grid gap-4">
                        {figures.map((figure) => (
                          <div key={figure.key} className="overflow-auto rounded-2xl border border-slate-200 bg-white p-4">
                            <p className="mb-3 text-sm font-semibold text-slate-950">{figure.label}</p>
                            <div dangerouslySetInnerHTML={{ __html: figure.svg }} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                        No quantitative figures were generated for this run. Full-text numerical extraction is required for forest and safety charts.
                      </p>
                    )
                  ) : null}

                  {outputTab === "quality" ? (
                    reportQuality ? (
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Report quality</p>
                              <h4 className="mt-2 text-lg font-semibold text-slate-950">{reportQualityStatus || "Client-readiness review"}</h4>
                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                The export uses the polished markdown when available. Original evidence counts, anchors, limitations, and governance data are preserved.
                              </p>
                            </div>
                            {reportQualityScore !== null ? (
                              <div className="rounded-2xl bg-white px-5 py-4 text-center ring-1 ring-slate-200">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Readiness</p>
                                <p className="mt-1 text-3xl font-semibold text-slate-950">{Math.round(reportQualityScore * 100)}%</p>
                              </div>
                            ) : null}
                          </div>
                          {rawReportMarkdown && rawReportMarkdown !== reportMarkdown ? (
                            <p className="mt-4 rounded-xl border border-teal-200 bg-white p-3 text-sm leading-6 text-teal-900">
                              A polished client-ready markdown version is active for preview and export.
                            </p>
                          ) : null}
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          {reportChecks.map((check) => (
                            <div key={check.id} className={`rounded-2xl border p-4 ${check.passed ? "border-teal-200 bg-teal-50" : "border-amber-200 bg-amber-50"}`}>
                              <p className={`text-sm font-semibold ${check.passed ? "text-teal-950" : "text-amber-950"}`}>
                                {check.passed ? "Pass" : "Needs review"} · {check.label}
                              </p>
                              {check.details?.length ? (
                                <ul className="mt-3 space-y-1 text-xs leading-5 text-slate-700">
                                  {check.details.slice(0, 5).map((item) => (
                                    <li key={item}>{item}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="mt-2 text-xs leading-5 text-slate-600">No issue detected in this check.</p>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                          <p className="font-semibold text-slate-950">Recommended fixes before client delivery</p>
                          {reportRecommendations.length ? (
                            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                              {reportRecommendations.map((item) => (
                                <li key={item} className="rounded-xl bg-slate-50 p-3">{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-2 text-sm leading-6 text-slate-600">No additional recommendations were returned by the report quality reviewer.</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">No report quality artifact was returned by this run.</p>
                    )
                  ) : null}

                  {outputTab === "sections" ? (
                    reportSections.length ? (
                      <div className="space-y-3">
                        {reportSections.map((section, index) => {
                          const sectionQuality = reportSectionQuality[index];
                          const title = typeof section.title === "string" ? section.title : `Section ${index + 1}`;
                          const content = typeof section.content === "string" ? section.content : "";
                          const sectionStatus = typeof sectionQuality?.status === "string" ? sectionQuality.status : "section reviewed";
                          const wordCount = numberValue(section, ["word_count"]) ?? numberValue(sectionQuality ?? null, ["word_count"]);
                          const recommendations = stringArrayValue(sectionQuality ?? null, "recommendations");
                          return (
                            <details key={`${title}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <summary className="cursor-pointer list-none">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <p className="font-semibold text-slate-950">{title}</p>
                                    <p className="mt-1 text-xs text-slate-500">{sectionStatus}{wordCount !== null ? ` · ${wordCount} words` : ""}</p>
                                  </div>
                                  <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">Open section</span>
                                </div>
                              </summary>
                              {recommendations.length ? (
                                <ul className="mt-4 space-y-2 text-sm leading-6 text-amber-900">
                                  {recommendations.slice(0, 4).map((item) => (
                                    <li key={item} className="rounded-xl border border-amber-200 bg-amber-50 p-3">{item}</li>
                                  ))}
                                </ul>
                              ) : null}
                              <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-white p-4 text-sm leading-6 text-slate-700 ring-1 ring-slate-200">
                                {content.slice(0, 8000) || safeJson(section)}
                              </pre>
                            </details>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">No section-level report artifact was returned by this run.</p>
                    )
                  ) : null}

                  {outputTab === "report" ? (
                    reportMarkdown ? (
                      <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-800">
                        {reportMarkdown}
                      </pre>
                    ) : (
                      <pre className="max-h-[70vh] overflow-auto rounded-2xl bg-slate-950 p-5 text-xs leading-5 text-slate-100">
                        {safeJson(runResponse.result.artifacts)}
                      </pre>
                    )
                  ) : null}

                  {outputTab === "candidates" ? (
                    <div className="space-y-3">
                      {runResponse.evidenceCandidates?.length ? (
                        runResponse.evidenceCandidates.map((candidate) => (
                          <a key={candidate.candidateId} href={candidate.sourceUrl} target="_blank" rel="noreferrer" className="block rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-teal-300 hover:bg-white">
                            <p className="text-sm font-semibold text-slate-950">{candidate.sourceTitle}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {candidate.sourceProvider} · {candidate.confidence} · {candidate.promotionStatus}
                            </p>
                          </a>
                        ))
                      ) : (
                        <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">No source-linked candidates were normalized from this run.</p>
                      )}
                    </div>
                  ) : null}

                  {outputTab === "limitations" ? (
                    <ul className="space-y-2 text-sm leading-6 text-slate-600">
                      {runResponse.result.limitations.map((item) => (
                        <li key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-3">{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <p className="font-semibold text-amber-950">Governance boundary</p>
                  <p className="mt-2 text-sm leading-6 text-amber-900">
                    This output is not reviewed evidence. Promote source-linked candidates through the review queue before
                    using report export, scoring, payer, regulatory, or medical review workflows.
                  </p>
                </div>
                <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
                  <p className="font-semibold text-teal-950">Review queue handoff</p>
                  <p className="mt-2 text-sm leading-6 text-teal-900">
                    {runResponse.evidenceCandidates?.length ?? 0} source-linked candidate(s) were normalized from this run.
                    Narrative-only report text is excluded from candidate promotion.
                  </p>
                  <a href="/app/review-queue" className="mt-3 inline-flex rounded-full bg-teal-700 px-4 py-2 text-xs font-semibold text-white">
                    Open review queue
                  </a>
                </div>
                {runResponse.evidenceCandidates?.length ? (
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-semibold text-slate-950">Candidate preview</p>
                    <div className="mt-3 space-y-3">
                      {runResponse.evidenceCandidates.slice(0, 5).map((candidate) => (
                        <a key={candidate.candidateId} href={candidate.sourceUrl} target="_blank" rel="noreferrer" className="block rounded-xl border border-slate-200 bg-slate-50 p-3 transition hover:border-teal-300 hover:bg-white">
                          <p className="text-sm font-semibold text-slate-950">{candidate.sourceTitle}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {candidate.sourceProvider} · {candidate.confidence} · {candidate.promotionStatus}
                          </p>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-950">Limitations</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
                    {runResponse.result.limitations.slice(0, 4).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  {runResponse.result.limitations.length > 4 ? (
                    <button type="button" onClick={() => setOutputTab("limitations")} className="mt-3 text-xs font-semibold text-teal-800">
                      View all {runResponse.result.limitations.length} limitations
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
        </>
      ) : null}

      {focus === "workspace" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Link href="/app/chat" className="rounded-3xl border border-teal-200 bg-teal-50 p-5 shadow-sm transition hover:border-teal-400 hover:bg-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Evidence Chat</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-950">Ask questions after a run or upload a document</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Use the chat workspace for source-grounded questions about reports, retrieved records, PDFs, DOCX files, or pasted text.
            </p>
            <span className="mt-4 inline-flex rounded-full bg-teal-700 px-4 py-2 text-xs font-semibold text-white">Open chat</span>
          </Link>
          <Link href="/app/tools" className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-400">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Advanced tools</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-950">Inspect retrieval, hydration, FAERS, trials, and labels</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Operator diagnostics are separated from the main workflow so first-time users do not land in the machinery.
            </p>
            <span className="mt-4 inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-900">Open tools</span>
          </Link>
        </div>
      ) : null}

      {showAdvancedTools ? (
      <details open={showAdvancedTools} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer list-none">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Advanced tools</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-950">Inspect retrieval, hydration, safety, trials, labels, and run history</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Optional diagnostics for reviewers and operators. Most users can ignore this drawer and use the main workflow plus Evidence Chat.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Open advanced drawer</span>
          </div>
        </summary>

        <div className="mt-5 flex flex-wrap gap-2">
          {sourceMethodTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSourceMethodTab(tab)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                sourceMethodTab === tab ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {{
                universal: "Universal Query",
                hydrate: "Hydration",
                safety: "FAERS",
                trials: "Trials",
                labels: "Labels",
                runs: "Run History",
              }[tab]}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            {sourceMethodTab === "universal" ? (
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-slate-950">Universal query router</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Parses entities, recommends chains, builds retrieval strategies, and can run SLR/FAERS from one question.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={runUniversalQuery}
                  disabled={Boolean(sourceMethodLoading)}
                  className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {sourceMethodLoading === "universal_query" ? "Running universal query..." : "Run Universal Query"}
                </button>
              </div>
            ) : null}

            {sourceMethodTab === "hydrate" ? (
              <div className="space-y-4">
                <div>
                  <p className="font-semibold text-slate-950">Retry source hydration</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Sends one source record to PubMed DOI hydration, PMC/Europe PMC, and open-access full-text recovery logic.
                  </p>
                </div>
                <textarea
                  value={hydrateRecordJson}
                  onChange={(event) => setHydrateRecordJson(event.target.value)}
                  rows={8}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-xs leading-5 outline-none ring-teal-500/20 focus:border-teal-600 focus:ring-4"
                />
                <button
                  type="button"
                  onClick={runHydrationRetry}
                  disabled={Boolean(sourceMethodLoading)}
                  className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {sourceMethodLoading === "hydrate_record" ? "Retrying hydration..." : "Retry Hydration"}
                </button>
              </div>
            ) : null}

            {sourceMethodTab === "safety" ? (
              <div className="space-y-4">
                <p className="font-semibold text-slate-950">FAERS signal explorer</p>
                <p className="text-sm leading-6 text-slate-600">
                  Uses Intervention / Exposure as the drug and Population as indication context. FAERS remains signal-only.
                </p>
                <button
                  type="button"
                  onClick={runFaersExplorer}
                  disabled={Boolean(sourceMethodLoading)}
                  className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {sourceMethodLoading === "faers" ? "Loading FAERS..." : "Run FAERS Explorer"}
                </button>
              </div>
            ) : null}

            {sourceMethodTab === "trials" ? (
              <div className="space-y-4">
                <p className="font-semibold text-slate-950">ClinicalTrials.gov explorer</p>
                <p className="text-sm leading-6 text-slate-600">
                  Retrieves trial records, status counts, phase counts, eligibility summaries, and source URLs.
                </p>
                <button
                  type="button"
                  onClick={runTrialExplorer}
                  disabled={Boolean(sourceMethodLoading)}
                  className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {sourceMethodLoading === "trials" ? "Searching trials..." : "Search Trials"}
                </button>
              </div>
            ) : null}

            {sourceMethodTab === "labels" ? (
              <div className="space-y-4">
                <p className="font-semibold text-slate-950">Regulatory label lookup</p>
                <p className="text-sm leading-6 text-slate-600">
                  Retrieves openFDA label sections for the selected intervention, including warnings, contraindications, and adverse reactions.
                </p>
                <button
                  type="button"
                  onClick={runLabelExplorer}
                  disabled={Boolean(sourceMethodLoading)}
                  className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {sourceMethodLoading === "label" ? "Loading labels..." : "Lookup Label"}
                </button>
              </div>
            ) : null}

            {sourceMethodTab === "runs" ? (
              <div className="space-y-4">
                <p className="font-semibold text-slate-950">Tracked async run queue</p>
                <p className="text-sm leading-6 text-slate-600">
                  Creates or lists Python-side tracked runs with step status for longer-running workflows.
                </p>
                <select
                  value={runKind}
                  onChange={(event) => setRunKind(event.target.value as "universal_query" | "full_slr" | "safety_review")}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-teal-500/20 focus:border-teal-600 focus:ring-4"
                >
                  <option value="universal_query">Universal query</option>
                  <option value="full_slr">Full SLR</option>
                  <option value="safety_review">Safety review</option>
                </select>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={createTrackedRun}
                    disabled={Boolean(sourceMethodLoading)}
                    className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {sourceMethodLoading === "create_run" ? "Creating..." : "Create Tracked Run"}
                  </button>
                  <button
                    type="button"
                    onClick={listTrackedRuns}
                    disabled={Boolean(sourceMethodLoading)}
                    className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                  >
                    {sourceMethodLoading === "list_runs" ? "Loading..." : "List Runs"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Method output</p>
                <h4 className="mt-2 font-semibold text-slate-950">
                  {sourceMethodResponse ? (sourceMethodResponse.ok ? "Backend result ready" : "Backend method needs attention") : "Waiting for method run"}
                </h4>
              </div>
              {sourceMethodResponse?.action ? <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">{sourceMethodResponse.action}</span> : null}
            </div>
            {sourceMethodResponse?.error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{sourceMethodResponse.error}</p> : null}
            {sourceMethodResponse?.result ? (
              <pre className="mt-4 max-h-[34rem] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                {safeJson(sourceMethodResponse.result)}
              </pre>
            ) : (
              <p className="mt-4 rounded-xl bg-white p-4 text-sm leading-6 text-slate-600">
                Run one of the advanced tools to inspect the raw source-linked artifact. These diagnostics are not the normal client workflow.
              </p>
            )}
          </div>
        </div>
      </details>
      ) : null}

      {showChatTools ? (
        <>
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Evidence Chat</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">Ask the report, retrieved sources, or an uploaded document</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Free deterministic chat searches only the selected evidence context. Ask for endpoints, safety events, discontinuations,
              HRs, confidence intervals, p-values, population, comparator, source snippets, or review gaps.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Free deterministic mode</span>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">Chat context</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {[
                  {
                    id: "report" as ChatScope,
                    label: "Report",
                    detail: reportMarkdown ? "Use generated SLR text" : "Run an analysis first",
                    disabled: !reportMarkdown,
                  },
                  {
                    id: "sources" as ChatScope,
                    label: "Sources",
                    detail: sourceInventory.length ? `${sourceInventory.length} records available` : "Run retrieval first",
                    disabled: !sourceInventory.length,
                  },
                  {
                    id: "upload" as ChatScope,
                    label: "Upload",
                    detail: "PDF, DOCX, or pasted text",
                    disabled: false,
                  },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => setChatScope(option.id)}
                    className={`rounded-2xl border p-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      chatScope === option.id
                        ? "border-teal-600 bg-teal-50 text-teal-950"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className="mt-1 block text-xs leading-5 opacity-80">{option.detail}</span>
                  </button>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Document title</span>
              <input
                value={chatTitle}
                onChange={(event) => setChatTitle(event.target.value)}
                disabled={chatScope !== "upload"}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-teal-500/20 focus:border-teal-600 focus:ring-4"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Starter question</span>
              <textarea
                value={chatQuestion}
                onChange={(event) => setChatQuestion(event.target.value)}
                rows={3}
                placeholder="Optional: type a first question, then send from the chat panel."
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none ring-teal-500/20 focus:border-teal-600 focus:ring-4"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                "What is the population?",
                "What are the key efficacy endpoints?",
                "Extract HR, CI, and p-values.",
                "What adverse events are reported?",
                "What discontinuation data is available?",
                "What needs human verification?",
              ].map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setChatQuestion(prompt);
                    void runDocumentChat(prompt);
                  }}
                  disabled={chatLoading}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-800">DOI</span>
                <input
                  value={chatDoi}
                  onChange={(event) => setChatDoi(event.target.value)}
                  placeholder="10.xxxx/source"
                  disabled={chatScope !== "upload"}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-teal-500/20 focus:border-teal-600 focus:ring-4"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-800">Source URL</span>
                <input
                  value={chatSourceUrl}
                  onChange={(event) => setChatSourceUrl(event.target.value)}
                  placeholder="https://doi.org/..."
                  disabled={chatScope !== "upload"}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-teal-500/20 focus:border-teal-600 focus:ring-4"
                />
              </label>
            </div>
            <label className="block rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <span className="text-sm font-semibold text-slate-800">Upload PDF or DOCX</span>
              <input
                type="file"
                accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx"
                onChange={(event) => setChatFile(event.target.files?.[0] ?? null)}
                disabled={chatScope !== "upload"}
                className="mt-3 block w-full text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
              />
              {chatFile ? <p className="mt-2 text-xs text-slate-500">{chatFile.name}</p> : null}
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Or paste document text</span>
              <textarea
                value={chatSourceText}
                onChange={(event) => setChatSourceText(event.target.value)}
                rows={7}
                placeholder="Paste full text, table text, results, safety, or methods sections..."
                disabled={chatScope !== "upload"}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none ring-teal-500/20 focus:border-teal-600 focus:ring-4"
              />
            </label>
            {chatScope !== "upload" ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {chatScope === "report"
                  ? "Using the latest generated report, quantitative synthesis artifact, and report metadata as the chat context."
                  : "Using normalized source records, identifiers, abstracts, hydration status, and available full-text snippets as the chat context."}
              </div>
            ) : null}
            <p className="rounded-2xl bg-teal-50 p-4 text-sm leading-6 text-teal-950">
              Ask in the chat box on the right. EvidaraOS will answer only from the selected report, source set, or uploaded document and show citations for review.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Chat</p>
                <h4 className="mt-2 font-semibold text-slate-950">
                  {chatMessages.length ? "Conversation with selected evidence" : "Upload or choose context, then ask a question"}
                </h4>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {activeConversationId ? `Saved conversation ${activeConversationId.slice(0, 8)}` : chatConversationStatus}
                </p>
              </div>
              {chatResponse?.queryRunId ? <span className="font-mono text-[11px] text-slate-500">{chatResponse.queryRunId.slice(0, 8)}</span> : null}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Saved conversations</p>
                <button
                  type="button"
                  onClick={() => refreshChatConversations()}
                  className="rounded-full border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Refresh
                </button>
              </div>
              {chatConversations.length ? (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {chatConversations.slice(0, 8).map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => loadChatConversation(conversation.id)}
                      className={`min-w-56 rounded-xl border p-3 text-left text-xs transition ${
                        activeConversationId === conversation.id
                          ? "border-teal-500 bg-teal-50 text-teal-950"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <span className="block font-semibold">{conversation.title}</span>
                      <span className="mt-1 block text-slate-500">{conversation.scope} · {new Date(conversation.updatedAt).toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-xs leading-5 text-slate-500">No saved chat turns yet. Send a message to create an auditable conversation.</p>
              )}
            </div>

            <div className="mt-4 max-h-[42rem] space-y-4 overflow-auto pr-1">
              {chatMessages.length ? (
                chatMessages.map((message) => {
                  const chat = message.response?.chat;
                  return (
                    <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[92%] rounded-2xl p-4 shadow-sm ${message.role === "user" ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-900"}`}>
                        <div className="flex items-center justify-between gap-3">
                          <p className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${message.role === "user" ? "text-slate-300" : "text-slate-500"}`}>
                            {message.role === "user" ? "You" : "EvidaraOS"} · {message.scope}
                          </p>
                          {chat ? (
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                              {chat.answer_type} · {chat.confidence} · {chat.citations.length} citation(s)
                            </span>
                          ) : null}
                        </div>
                        <pre className={`mt-3 whitespace-pre-wrap text-sm leading-6 ${message.role === "user" ? "text-white" : "text-slate-800"}`}>{message.text}</pre>
                        {message.error ? <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-800">{message.error}</p> : null}
                        {chat?.evidence_used.signals.length ? (
                          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Structured signals</p>
                            <div className="mt-2 space-y-2">
                              {chat.evidence_used.signals.slice(0, 6).map((signal, index) => (
                                <div key={`${message.id}-${signal.name}-${index}`} className="rounded-lg bg-white p-2">
                                  <p className="text-xs font-semibold text-slate-500">{signal.name.replaceAll("_", " ")}</p>
                                  <p className="mt-1 text-sm text-slate-900">{signal.value}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {chat?.citations.length ? (
                          <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">Evidence citations</summary>
                            <div className="mt-3 space-y-3">
                              {chat.citations.slice(0, 4).map((citation, index) => {
                                return (
                                  <div key={`${message.id}-${citation.source_id}-${index}`} className="rounded-xl border border-slate-200 bg-white p-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-xs font-semibold text-slate-500">{citation.title}</p>
                                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500">{citation.relevance}</span>
                                    </div>
                                    {citation.locator ? <p className="mt-1 text-xs text-slate-500">{citation.locator}</p> : null}
                                    <p className="mt-2 text-sm leading-6 text-slate-800">{citation.snippet.slice(0, 800)}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                        ) : null}
                        {chat?.follow_up_questions.length ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {chat.follow_up_questions.slice(0, 4).map((question) => (
                              <button
                                key={`${message.id}-${question}`}
                                type="button"
                                onClick={() => {
                                  setChatQuestion(question);
                                  void runDocumentChat(question);
                                }}
                                disabled={chatLoading}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-300 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {question}
                              </button>
                            ))}
                          </div>
                        ) : null}
                        {chat?.provenance_summary ? <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">{chat.provenance_summary}</p> : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl bg-white p-5 text-sm leading-6 text-slate-600">
                  Upload a PDF/DOCX, paste text, or choose Report/Sources after running an analysis. Then ask follow-up questions in the box on the left.
                </div>
              )}
              {chatLoading ? <div className="w-fit rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Searching selected evidence...</div> : null}
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3">
              <label className="block">
                <span className="text-sm font-semibold text-slate-900">Ask a question</span>
                <textarea
                  value={chatQuestion}
                  onChange={(event) => setChatQuestion(event.target.value)}
                  rows={3}
                  placeholder="Ask anything about the uploaded document, report, or retrieved sources..."
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 outline-none ring-teal-500/20 focus:border-teal-600 focus:ring-4"
                />
              </label>
              <button
                type="button"
                onClick={() => runDocumentChat()}
                disabled={chatLoading || !chatQuestion.trim()}
                className="mt-3 w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {chatLoading ? "Thinking..." : "Send"}
              </button>
            </div>

            {chatMessages.length ? (
              <button
                type="button"
                onClick={() => {
                  setChatMessages([]);
                  setChatResponse(null);
                  setActiveConversationId("");
                }}
                className="mt-4 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear chat
              </button>
            ) : null}

            {chatResponse?.chat ? (
              <div className="mt-4">
                <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                  <p className="font-semibold text-teal-950">Review queue handoff</p>
                  <p className="mt-2 text-sm leading-6 text-teal-900">
                    {chatResponse.evidenceCandidates?.length ?? 0} document-chat candidate(s) are ready for human review and promotion.
                  </p>
                  <a href="/app/review-queue" className="mt-3 inline-flex rounded-full bg-teal-700 px-4 py-2 text-xs font-semibold text-white">
                    Open review queue
                  </a>
                </div>
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-white p-4 text-sm leading-6 text-slate-600">
                This is the free mode: deterministic retrieval, regex extraction, snippets, and reviewable fields without any paid LLM key.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Source Paper Extraction</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">Extract data from an original study PDF</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Use this for journal articles, trial reports, labels, or source PDFs marked manual PDF required. For generated EvidaraOS reports,
              use Evidence Chat with the Report context instead of extracting it as if it were an original clinical paper.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Human-in-the-loop</span>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Source title</span>
              <input
                value={pdfTitle}
                onChange={(event) => setPdfTitle(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-teal-500/20 focus:border-teal-600 focus:ring-4"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-800">DOI</span>
                <input
                  value={pdfDoi}
                  onChange={(event) => setPdfDoi(event.target.value)}
                  placeholder="10.xxxx/source"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-teal-500/20 focus:border-teal-600 focus:ring-4"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-800">Source URL</span>
                <input
                  value={pdfSourceUrl}
                  onChange={(event) => setPdfSourceUrl(event.target.value)}
                  placeholder="https://doi.org/..."
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-teal-500/20 focus:border-teal-600 focus:ring-4"
                />
              </label>
            </div>
            <label className="block rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
              <span className="text-sm font-semibold text-slate-800">Upload PDF</span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)}
                className="mt-3 block w-full text-sm text-slate-700 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white"
              />
              {pdfFile ? <p className="mt-2 text-xs text-slate-500">{pdfFile.name}</p> : null}
              {pdfLooksLikeGeneratedReport ? (
                <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
                  This looks like a generated report, not an original source paper. Use Evidence Chat with Report context for this file, or upload a journal article/trial PDF here.
                </p>
              ) : null}
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-800">Or paste extracted full text / table text</span>
              <textarea
                value={pdfSourceText}
                onChange={(event) => setPdfSourceText(event.target.value)}
                rows={8}
                placeholder="Paste abstract, results, safety table, baseline table, or discontinuation section text..."
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none ring-teal-500/20 focus:border-teal-600 focus:ring-4"
              />
            </label>
            <button
              type="button"
              onClick={runPdfExtraction}
              disabled={pdfLoading || pdfLooksLikeGeneratedReport}
              className="w-full rounded-2xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {pdfLoading ? "Extracting PDF source..." : pdfLooksLikeGeneratedReport ? "Use Evidence Chat for generated reports" : "Create Extraction Candidate"}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Reviewer output</p>
                <h4 className="mt-2 font-semibold text-slate-950">
                  {pdfResponse ? (pdfResponse.ok ? "Extraction candidate ready" : "Extraction needs attention") : "Waiting for source"}
                </h4>
              </div>
              {pdfResponse?.queryRunId ? <span className="font-mono text-[11px] text-slate-500">{pdfResponse.queryRunId.slice(0, 8)}</span> : null}
            </div>

            {pdfResponse?.error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{pdfResponse.error}</p> : null}

            {pdfResponse?.extraction ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Status", pdfResponse.extraction.status],
                    ["Candidates", pdfResponse.evidenceCandidates?.length ?? 0],
                    ["Hash", String(pdfResponse.extraction.provenance.source_text_hash ?? "").slice(0, 10) || "pending"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
                      <p className="mt-2 break-words text-sm font-semibold text-slate-950">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-slate-950">Coding form preview</p>
                  <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                    {safeJson(pdfResponse.extraction.coding_form)}
                  </pre>
                </div>

                {pdfResponse.evidenceCandidates?.length ? (
                  <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                    <p className="font-semibold text-teal-950">Review queue handoff</p>
                    <p className="mt-2 text-sm leading-6 text-teal-900">
                      {pdfResponse.evidenceCandidates.length} manual-PDF candidate is ready for human review and promotion.
                    </p>
                    <a href="/app/review-queue" className="mt-3 inline-flex rounded-full bg-teal-700 px-4 py-2 text-xs font-semibold text-white">
                      Open review queue
                    </a>
                  </div>
                ) : (
                  <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                    Add a DOI or source URL if you want this extraction normalized into a source-linked review candidate.
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-white p-4 text-sm leading-6 text-slate-600">
                Use this for paywalled or source-page records that the engine marked as requiring manual PDF ingestion.
              </p>
            )}
          </div>
        </div>
      </div>
        </>
      ) : null}
    </section>
  );
}
