"use client";

import { useMemo, useState } from "react";
import { accentStyles, cx } from "./DetailPanel";
import { Icon } from "./Icon";

type Accent = "blue" | "teal" | "purple" | "green" | "orange" | "slate";

type ArchitectureNode = {
  id: string;
  title: string;
  subtitle: string;
  accent: Accent;
  icon: "ask" | "audit" | "chain" | "database" | "governance" | "layers" | "network" | "source" | "target";
  description: string;
  details: string[];
  trust: string;
};

type ArchitectureRow = {
  id: string;
  number?: string;
  title: string;
  subtitle: string;
  accent: Accent;
  icon: ArchitectureNode["icon"];
  nodes: ArchitectureNode[];
  note?: string;
};

const interfaceNodes: ArchitectureNode[] = [
  {
    id: "typed-query",
    title: "Typed Query",
    subtitle: "Natural-language request",
    accent: "blue",
    icon: "ask",
    description: "Users begin with a plain-language business, clinical, or scientific question instead of choosing databases or agents manually.",
    details: ["Example: Evaluate semaglutide for obstructive sleep apnea.", "Captures user role, function, therapeutic context, and desired output.", "Hands the request to orchestration for intent detection."],
    trust: "The question is captured as the first auditable object in the evidence workflow.",
  },
  {
    id: "voice-query",
    title: "Voice Query",
    subtitle: "Spoken request",
    accent: "purple",
    icon: "ask",
    description: "Voice input can enter the same workflow as typed input, with the transcript preserved for review and routing.",
    details: ["Supports quick question capture.", "Converts request into structured task context.", "Routes to the same white-box architecture."],
    trust: "Voice does not bypass governance; it becomes a traceable request.",
  },
  {
    id: "pharma-functions",
    title: "Pharma Functions",
    subtitle: "HEOR, Medical Affairs, Clinical, R&D, Regulatory, Portfolio",
    accent: "slate",
    icon: "network",
    description: "The interface adapts outputs to the requesting function while keeping the same transparent evidence pathway underneath.",
    details: ["HEOR and Market Access", "Medical Affairs", "Clinical Development", "R&D", "Regulatory", "Portfolio Strategy"],
    trust: "Different users get different deliverables, not different standards of evidence.",
  },
];

const epiNodes: ArchitectureNode[] = [
  {
    id: "incidence",
    title: "Incidence",
    subtitle: "0.24 weight",
    accent: "green",
    icon: "target",
    description: "Incidence contributes to disease opportunity sizing and indication prioritization.",
    details: ["New cases over time", "Therapeutic-area burden signal", "Weighted input to indication score"],
    trust: "A scoring input, not a causal estimate.",
  },
  {
    id: "prevalence",
    title: "Prevalence",
    subtitle: "0.18 weight",
    accent: "green",
    icon: "target",
    description: "Prevalence helps size the affected population and potential evidence-generation opportunity.",
    details: ["Existing patient population", "Burden and scale context", "Comparable across indications"],
    trust: "Used for ranking and prioritization only.",
  },
  {
    id: "unmet-need",
    title: "Unmet Need",
    subtitle: "0.22 weight",
    accent: "green",
    icon: "target",
    description: "Unmet need captures where current treatment options, outcomes, access, or evidence remain insufficient.",
    details: ["Treatment gaps", "Outcome gaps", "Evidence gaps", "Patient and payer relevance"],
    trust: "Requires source support and explicit assumptions.",
  },
  {
    id: "market-size",
    title: "Market Size",
    subtitle: "0.16 weight",
    accent: "green",
    icon: "target",
    description: "Market size adds commercial and portfolio context to the indication priority score.",
    details: ["Population scale", "Value and budget relevance", "Portfolio strategy context"],
    trust: "Commercial context is separated from clinical evidence strength.",
  },
  {
    id: "competition-penalty",
    title: "Competition Penalty",
    subtitle: "0.12 weight",
    accent: "orange",
    icon: "target",
    description: "Competitive intensity can reduce priority where differentiation or access is likely to be difficult.",
    details: ["Current therapies", "Pipeline density", "Differentiation risk", "Evidence burden"],
    trust: "Penalty logic should remain visible to portfolio users.",
  },
  {
    id: "health-equity",
    title: "Health Equity",
    subtitle: "0.08 weight",
    accent: "teal",
    icon: "target",
    description: "Health equity context highlights populations, geographies, or access patterns that may require additional evidence work.",
    details: ["Access disparities", "Geographic variation", "Underrepresented groups", "Evidence-generation needs"],
    trust: "Equity context should be explicit, not hidden inside a score.",
  },
  {
    id: "priority-score",
    title: "Indication Priority Score",
    subtitle: "Weighted output",
    accent: "green",
    icon: "audit",
    description: "EpiEngine combines weighted inputs into an indication priority score for ranking and triage.",
    details: ["Summarizes weighted burden and opportunity inputs", "Supports comparison across indications", "Feeds downstream portfolio and evidence strategy outputs"],
    trust: "Associative ranking heuristic, not a causal claim.",
  },
];

const sourceNames = [
  "ClinicalTrials.gov",
  "PubMed",
  "FAERS",
  "Europe PMC",
  "OpenTargets",
  "ChEMBL",
  "UniProt",
  "Reactome",
  "FDA Drug Labels",
  "OpenTargets Genetics",
  "DisGeNET",
  "DrugCentral",
  "NCBI Gene",
  "OMIM",
  "OMOP Layer 2",
  "Synthea",
];

const retrievalNodes: ArchitectureNode[] = sourceNames.map((name) => ({
  id: `source-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`,
  title: name,
  subtitle: "Evidence source",
  accent: "blue",
  icon: "database",
  description: `${name} can be queried as part of the parallel evidence retrieval layer.`,
  details: ["Retrieved in parallel when relevant", "Mapped to the user question and chain logic", "Preserved as source provenance for downstream findings"],
  trust: "Sources remain visible so users can inspect what supports each claim.",
}));

const chainNodes: ArchitectureNode[] = [
  ["chain-a", "Chain A", "Genomics -> Drug Repurposing -> Safety -> Literature", "purple"],
  ["chain-b", "Chain B", "Trial Intelligence -> Multi-Omics -> Literature", "purple"],
  ["chain-c", "Chain C", "Safety -> Literature", "purple"],
  ["chain-d", "Chain D", "Full Discovery", "purple"],
  ["chain-p", "Chain P", "Payer Intelligence", "purple"],
  ["chain-r", "Chain R", "Repurposing Strategy", "purple"],
].map(([id, title, subtitle, accent]) => ({
  id,
  title,
  subtitle,
  accent: accent as Accent,
  icon: "chain",
  description: `${title} packages a specialized evidence workflow that can activate alone or alongside other chains.`,
  details: ["Activated dynamically by orchestration", "Calls relevant retrieval and synthesis agents", "Writes findings into shared wiki context", "Can combine with other chains for multi-question workflows"],
  trust: "Chains are visible reasoning pathways, not hidden prompts.",
}));

const classNodes: ArchitectureNode[] = [
  ["class-descriptive", "Descriptive", "Directly stated in source", "teal"],
  ["class-associative", "Associative", "Statistical association", "blue"],
  ["class-causal", "Causal Hypothesis", "Mechanistic rationale; validation required", "orange"],
  ["class-projection", "Scenario Projection", "Modeled estimate with assumptions", "purple"],
].map(([id, title, subtitle, accent]) => ({
  id,
  title,
  subtitle,
  accent: accent as Accent,
  icon: "layers",
  description: `${title} findings are labeled so users understand the evidentiary strength of the claim.`,
  details: ["Classification appears with the finding", "Classification can constrain output language", "Higher-strength language requires explicit source support"],
  trust: "Outputs cannot escalate classification without source support.",
}));

const governanceNodes: ArchitectureNode[] = [
  ["sensitive-data-checks", "Sensitive-Data Checks", "Planned input and output review"],
  ["audit-trail", "Audit Trail Requirements", "Backend recordkeeping model"],
  ["signature", "Review Before Export", "Human confirmation requirement"],
  ["provenance", "Provenance Tracking", "Source-level lineage"],
  ["human-review", "Human Review", "Qualified sign-off"],
].map(([id, title, subtitle]) => ({
  id,
  title,
  subtitle,
  accent: "slate" as Accent,
  icon: "governance" as const,
  description: `${title} is part of the planned review layer before evidence is exported or used externally.`,
  details: ["Modeled before governed output", "Creates inspectable review context", "Defines pharma accountability requirements"],
  trust: "Governance requirements are shown in the workflow, not added after the answer.",
}));

const outputNodes: ArchitectureNode[] = [
  ["output-heor", "HEOR", "Value dossiers, ICER ranges, budget impact drivers", "teal"],
  ["output-medical", "Medical Affairs", "Evidence summaries, publications, KOL briefs", "blue"],
  ["output-clinical", "Clinical Development", "Trial landscape, endpoints, feasibility signals", "green"],
  ["output-rd", "R&D", "Mechanisms, targets, repurposing leads", "orange"],
  ["output-regulatory", "Regulatory", "Labeling support, safety, precedent analysis", "purple"],
  ["output-portfolio", "Portfolio Strategy", "Prioritization and opportunity scoring", "orange"],
].map(([id, title, subtitle, accent]) => ({
  id,
  title,
  subtitle,
  accent: accent as Accent,
  icon: "audit",
  description: `${title} receives a function-specific deliverable built from the same visible evidence pathway.`,
  details: ["Output is tailored to the decision context", "Evidence classes and sources remain attached", "Governance status is visible before export"],
  trust: "Function-specific does not mean opaque; every deliverable keeps provenance.",
}));

const rows: ArchitectureRow[] = [
  {
    id: "interface",
    title: "User Request Interface",
    subtitle: "Typed, voice, and function-specific context",
    accent: "blue",
    icon: "ask",
    nodes: interfaceNodes,
  },
  {
    id: "epi",
    number: "1",
    title: "EpiEngine",
    subtitle: "Weighted indication scoring model",
    accent: "green",
    icon: "target",
    nodes: epiNodes,
    note: "Associative ranking heuristic, not causal estimate.",
  },
  {
    id: "retrieval",
    number: "2",
    title: "Parallel Evidence Retrieval",
    subtitle: "Routing layer fans out to biomedical data sources",
    accent: "blue",
    icon: "database",
    nodes: retrievalNodes,
  },
  {
    id: "agents",
    number: "3",
    title: "EvidenceOS Multi-Agent Synthesis",
    subtitle: "24 agents across 6 evidence chains",
    accent: "purple",
    icon: "network",
    nodes: chainNodes,
    note: "Wiki-grounded reasoning: agents read before inference and write after output.",
  },
  {
    id: "classification",
    number: "4",
    title: "Evidence Classification",
    subtitle: "Claim strength labels",
    accent: "teal",
    icon: "layers",
    nodes: classNodes,
    note: "Outputs cannot escalate classification without explicit source support.",
  },
  {
    id: "governance",
    number: "5",
    title: "Governance & Trust Controls",
    subtitle: "Review, audit requirements, provenance, export control",
    accent: "slate",
    icon: "governance",
    nodes: governanceNodes,
    note: "Designed as a governance model for future legal, regulatory, privacy, and quality review workflows; no certification is claimed.",
  },
  {
    id: "outputs",
    title: "Actionable Outputs",
    subtitle: "Function-specific deliverables",
    accent: "orange",
    icon: "audit",
    nodes: outputNodes,
  },
];

export function ArchitectureExplorer() {
  const [activeId, setActiveId] = useState("priority-score");
  const activeNode = useMemo(
    () => rows.flatMap((row) => row.nodes).find((node) => node.id === activeId) ?? rows[1].nodes[6],
    [activeId]
  );

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_360px]">
      <div className="rounded-[2rem] border border-slate-300 bg-white p-4 shadow-xl shadow-slate-200/70">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">EvidaraOS Architecture</h2>
          <p className="mt-2 text-base italic text-slate-600 md:text-xl">Integrated layers for pharmaceutical evidence synthesis</p>
        </div>

        <div className="mt-4 space-y-4">
          {rows.map((row, index) => (
            <ArchitectureRowView key={row.id} row={row} activeId={activeId} onSelect={setActiveId} showConnector={index < rows.length - 1} />
          ))}
        </div>
      </div>

      <aside className="xl:sticky xl:top-28 xl:self-start">
        <div className="rounded-[2rem] border border-slate-300 bg-slate-950 p-5 text-white shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">Selected architecture element</p>
          <h3 className="mt-3 text-2xl font-semibold">{activeNode.title}</h3>
          <p className="mt-2 text-sm font-medium text-teal-100">{activeNode.subtitle}</p>
          <p className="mt-4 text-sm leading-6 text-slate-300">{activeNode.description}</p>
          <div className="mt-5 space-y-2">
            {activeNode.details.map((detail) => (
              <div key={detail} className="flex gap-2 rounded-2xl border border-white/10 bg-white/8 p-3 text-sm text-slate-200">
                <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-teal-200" />
                <span>{detail}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-teal-300/30 bg-teal-400/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">White-box trust point</p>
            <p className="mt-2 text-sm leading-6 text-teal-50">{activeNode.trust}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function ArchitectureRowView({
  row,
  activeId,
  onSelect,
  showConnector,
}: {
  row: ArchitectureRow;
  activeId: string;
  onSelect: (id: string) => void;
  showConnector: boolean;
}) {
  return (
    <section id={`architecture-row-${row.id}`} data-row-id={row.id} className="relative">
      <div className={cx("grid gap-4 rounded-3xl border p-4 md:grid-cols-[250px_1fr]", accentStyles[row.accent])}>
        <div className="flex gap-4 border-b border-current/15 pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 shadow-sm">
            {row.number ? <span className="text-lg font-bold">{row.number}</span> : <Icon name={row.icon} />}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-950">{row.title}</h3>
            <p className="mt-1 text-sm leading-5 text-slate-700">{row.subtitle}</p>
          </div>
        </div>

        <div>
          <div className={cx("grid gap-3", row.id === "retrieval" ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-8" : row.id === "outputs" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
            {row.nodes.map((node) => (
              <ArchitectureNodeButton key={node.id} node={node} active={node.id === activeId} onSelect={onSelect} compact={row.id === "retrieval"} />
            ))}
          </div>
          {row.note ? <p className="mt-3 text-center text-xs italic text-slate-700">{row.note}</p> : null}
        </div>
      </div>
      {showConnector ? (
        <div className="architecture-connector flex justify-center py-2" data-from={row.id} data-to="next-row">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 shadow-sm">
            <span className="text-lg leading-none">↓</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ArchitectureNodeButton({
  node,
  active,
  onSelect,
  compact,
}: {
  node: ArchitectureNode;
  active: boolean;
  onSelect: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <button
      id={`architecture-node-${node.id}`}
      data-node-id={node.id}
      onClick={() => onSelect(node.id)}
      onMouseEnter={() => onSelect(node.id)}
      onFocus={() => onSelect(node.id)}
      className={cx(
        "group min-h-24 rounded-2xl border bg-white p-3 text-left shadow-sm transition",
        active ? "border-slate-950 ring-2 ring-slate-950/15" : "border-slate-200 hover:border-slate-400 hover:shadow-md",
        compact && "min-h-20 text-center"
      )}
    >
      <div className={cx("flex items-start gap-3", compact && "flex-col items-center gap-2")}>
        <span className={cx("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border", accentStyles[node.accent])}>
          <Icon name={node.icon} className="h-4 w-4" />
        </span>
        <span>
          <span className={cx("block font-semibold text-slate-950", compact ? "text-xs" : "text-sm")}>{node.title}</span>
          <span className={cx("mt-1 block leading-5 text-slate-600", compact ? "text-[11px]" : "text-xs")}>{node.subtitle}</span>
        </span>
      </div>
    </button>
  );
}
