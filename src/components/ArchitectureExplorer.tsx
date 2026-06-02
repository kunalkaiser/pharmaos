"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { accentStyles, cx } from "./DetailPanel";
import { Icon } from "./Icon";

type Accent = "blue" | "teal" | "purple" | "green" | "orange" | "slate";
type ImplementationStatus = "live" | "partial" | "planned";

type ArchitectureNode = {
  id: string;
  title: string;
  subtitle: string;
  accent: Accent;
  icon: "ask" | "audit" | "chain" | "database" | "governance" | "layers" | "network" | "source" | "target";
  description: string;
  details: string[];
  trust: string;
  status: ImplementationStatus;
  implementation: string;
  ctaHref?: string;
  ctaLabel?: string;
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
    status: "live",
    implementation: "Live in the protected product workspace through the Evidence Engine console and protocol builder.",
    ctaHref: "/app",
    ctaLabel: "Open workspace",
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
    status: "planned",
    implementation: "Not wired in the current production UI. Typed input is the active request path.",
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
    status: "partial",
    implementation: "Workflow selection is live for SLR, HEOR, Safety, Regulatory, Trial Intelligence, Repurposing, Genomics, and Payer Brief outputs. Role-specific auth and permissions are still staged.",
    ctaHref: "/app",
    ctaLabel: "Run a workflow",
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
    status: "partial",
    implementation: "Scoring schema exists, but source-backed epidemiology extraction needs validated live data coverage before enterprise use.",
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
    status: "partial",
    implementation: "Supported as an EpiEngine input and CoCoPop-style query target; production source coverage is not complete.",
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
    status: "partial",
    implementation: "Evidence-gap language is generated in workflow outputs, but final unmet-need scoring still requires reviewer confirmation.",
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
    status: "planned",
    implementation: "Not yet connected to commercial datasets or validated market models.",
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
    status: "partial",
    implementation: "Trial and literature landscape signals are available; formal weighted competition scoring is not finalized.",
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
    status: "planned",
    implementation: "Modeled in architecture only. Needs vetted equity datasets and review policy before use.",
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
    status: "partial",
    implementation: "Scoring routes and schemas exist, but should be treated as readiness scaffolding until each input has source-backed validation.",
    ctaHref: "/app",
    ctaLabel: "View workspace",
  },
];

const sourceConfigs: Array<[string, ImplementationStatus, string]> = [
  ["ClinicalTrials.gov", "live", "Live trial retrieval is available through the Trial Intelligence workflow."],
  ["PubMed", "partial", "PubMed-style citation hydration is available, with rate-limit and abstract-availability boundaries."],
  ["FAERS", "live", "openFDA FAERS signal retrieval is wired for safety workflows."],
  ["Europe PMC", "partial", "Used as part of open-access/full-text fallback logic where available."],
  ["OpenTargets", "planned", "Shown as target-intelligence architecture; not exposed as a validated production module yet."],
  ["ChEMBL", "planned", "Shown as chemistry/target architecture; not exposed as a validated production module yet."],
  ["UniProt", "planned", "Shown as target annotation architecture; not exposed as a validated production module yet."],
  ["Reactome", "planned", "Shown as pathway architecture; not exposed as a validated production module yet."],
  ["FDA Drug Labels", "live", "openFDA label retrieval is wired for Regulatory workflow outputs."],
  ["OpenTargets Genetics", "planned", "Shown as genetics architecture; not exposed as a validated production module yet."],
  ["DisGeNET", "planned", "Shown as disease-gene architecture; not exposed as a validated production module yet."],
  ["DrugCentral", "planned", "Shown as drug knowledge architecture; not exposed as a validated production module yet."],
  ["NCBI Gene", "planned", "Shown as gene annotation architecture; not exposed as a validated production module yet."],
  ["OMIM", "planned", "Shown as rare-disease architecture; not exposed as a validated production module yet."],
  ["OMOP Layer 2", "planned", "Not connected to a governed patient-data environment in this deployment."],
  ["Synthea", "planned", "Synthetic data is not currently powering the production evidence workflow."],
];

const retrievalNodes: ArchitectureNode[] = sourceConfigs.map(([name, status, implementation]) => ({
  id: `source-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`,
  title: name,
  subtitle: "Evidence source",
  accent: "blue",
  icon: "database",
  description: `${name} can be queried as part of the parallel evidence retrieval layer.`,
  details: ["Retrieved in parallel when relevant", "Mapped to the user question and chain logic", "Preserved as source provenance for downstream findings"],
  trust: "Sources remain visible so users can inspect what supports each claim.",
  status,
  implementation,
  ctaHref: status === "live" || status === "partial" ? "/app" : undefined,
  ctaLabel: status === "live" || status === "partial" ? "Use in workspace" : undefined,
}));

const chainNodes: ArchitectureNode[] = [
  ["chain-a", "Chain A", "Genomics -> Drug Repurposing -> Safety -> Literature", "purple", "partial", "Genomics, repurposing, safety, and literature workflows exist, but the chained multi-agent handoff is not a fully autonomous production chain."],
  ["chain-b", "Chain B", "Trial Intelligence -> Multi-Omics -> Literature", "purple", "partial", "Trial Intelligence is live; multi-omics integration remains model-stage in this product deployment."],
  ["chain-c", "Chain C", "Safety -> Literature", "purple", "live", "Safety Review and literature-backed SLR workflows are live as candidate-only analysis chains."],
  ["chain-d", "Chain D", "Full Discovery", "purple", "live", "Full Discovery is exposed in the workspace as an SLR + safety + HEOR package."],
  ["chain-p", "Chain P", "Payer Intelligence", "purple", "partial", "Payer Brief and HEOR Foundation outputs are live, but payer-ready conclusions require human review and validated inputs."],
  ["chain-r", "Chain R", "Repurposing Strategy", "purple", "partial", "Repurposing workflow exists; mechanistic bridge claims remain candidate-only until reviewed."],
].map(([id, title, subtitle, accent, status, implementation]) => ({
  id,
  title,
  subtitle,
  accent: accent as Accent,
  icon: "chain",
  description: `${title} packages a specialized evidence workflow that can activate alone or alongside other chains.`,
  details: ["Activated dynamically by orchestration", "Calls relevant retrieval and synthesis agents", "Writes findings into shared wiki context", "Can combine with other chains for multi-question workflows"],
  trust: "Chains are visible reasoning pathways, not hidden prompts.",
  status: status as ImplementationStatus,
  implementation,
  ctaHref: "/app",
  ctaLabel: "Run chain",
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
  status: "partial" as ImplementationStatus,
  implementation: "Candidate-only and generated-claim boundaries are live. Fine-grained claim classification labels are still being expanded across every output.",
}));

const governanceNodes: ArchitectureNode[] = [
  ["sensitive-data-checks", "Sensitive-Data Checks", "Planned input and output review", "planned", "No PHI/PII production workflow is enabled; sensitive-data controls need formal implementation before enterprise deployment."],
  ["audit-trail", "Audit Trail Requirements", "Backend recordkeeping model", "partial", "Query run steps and candidate events are recorded, but regulated audit-log enforcement is not complete."],
  ["signature", "Review Before Export", "Human confirmation requirement", "partial", "Outputs are labeled candidate-only and review-required; electronic signature workflows are not implemented."],
  ["provenance", "Provenance Tracking", "Source-level lineage", "partial", "Source-linked candidates, identifiers, URLs, and provider events are captured for review handoff."],
  ["human-review", "Human Review", "Qualified sign-off", "partial", "Review queue handoff exists; role-based reviewer sign-off is still staged."],
].map(([id, title, subtitle, status, implementation]) => ({
  id,
  title,
  subtitle,
  accent: "slate" as Accent,
  icon: "governance" as const,
  description: `${title} is part of the planned review layer before evidence is exported or used externally.`,
  details: ["Modeled before governed output", "Creates inspectable review context", "Defines pharma accountability requirements"],
  trust: "Governance requirements are shown in the workflow, not added after the answer.",
  status: status as ImplementationStatus,
  implementation,
  ctaHref: status === "partial" ? "/app" : undefined,
  ctaLabel: status === "partial" ? "Open review area" : undefined,
}));

const outputNodes: ArchitectureNode[] = [
  ["output-heor", "HEOR", "Value dossiers, ICER ranges, budget impact drivers", "teal", "partial", "HEOR Foundation is live as a source-linked readiness workflow; formal ICER/QALY modeling is not automated."],
  ["output-medical", "Medical Affairs", "Evidence summaries, publications, KOL briefs", "blue", "partial", "SLR and evidence summaries are live as drafts; publication-ready material requires human review."],
  ["output-clinical", "Clinical Development", "Trial landscape, endpoints, feasibility signals", "green", "live", "Trial Intelligence is live for ClinicalTrials.gov-style retrieval and status summaries."],
  ["output-rd", "R&D", "Mechanisms, targets, repurposing leads", "orange", "partial", "Repurposing and genomics workflows are available as candidate-only evidence paths."],
  ["output-regulatory", "Regulatory", "Labeling support, safety, precedent analysis", "purple", "live", "Regulatory label retrieval and benefit-risk scaffolding are live as candidate-only outputs."],
  ["output-portfolio", "Portfolio Strategy", "Prioritization and opportunity scoring", "orange", "partial", "Portfolio scoring exists as readiness scaffolding; commercial and market-size data are not fully connected."],
].map(([id, title, subtitle, accent, status, implementation]) => ({
  id,
  title,
  subtitle,
  accent: accent as Accent,
  icon: "audit",
  description: `${title} receives a function-specific deliverable built from the same visible evidence pathway.`,
  details: ["Output is tailored to the decision context", "Evidence classes and sources remain attached", "Governance status is visible before export"],
  trust: "Function-specific does not mean opaque; every deliverable keeps provenance.",
  status: status as ImplementationStatus,
  implementation,
  ctaHref: "/app",
  ctaLabel: "Open output module",
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

const statusStyles: Record<ImplementationStatus, { label: string; chip: string; panel: string; dot: string }> = {
  live: {
    label: "Live",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-800",
    panel: "border-emerald-300/40 bg-emerald-400/10 text-emerald-50",
    dot: "bg-emerald-500",
  },
  partial: {
    label: "Partial",
    chip: "border-amber-200 bg-amber-50 text-amber-800",
    panel: "border-amber-300/40 bg-amber-400/10 text-amber-50",
    dot: "bg-amber-500",
  },
  planned: {
    label: "Planned",
    chip: "border-slate-200 bg-slate-100 text-slate-700",
    panel: "border-slate-300/30 bg-white/8 text-slate-100",
    dot: "bg-slate-400",
  },
};

const statusCounts = rows.flatMap((row) => row.nodes).reduce<Record<ImplementationStatus, number>>(
  (counts, node) => {
    counts[node.status] += 1;
    return counts;
  },
  { live: 0, partial: 0, planned: 0 },
);

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
          <p className="mt-2 text-base italic text-slate-600 md:text-xl">Implementation status across the live product, partial modules, and planned architecture</p>
          <div className="mx-auto mt-5 grid max-w-3xl gap-3 sm:grid-cols-3">
            {(Object.keys(statusCounts) as ImplementationStatus[]).map((status) => (
              <div key={status} className={cx("rounded-2xl border px-4 py-3 text-left", statusStyles[status].chip)}>
                <div className="flex items-center gap-2">
                  <span className={cx("h-2.5 w-2.5 rounded-full", statusStyles[status].dot)} />
                  <span className="text-xs font-semibold uppercase tracking-[0.16em]">{statusStyles[status].label}</span>
                </div>
                <p className="mt-2 text-2xl font-semibold">{statusCounts[status]}</p>
              </div>
            ))}
          </div>
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
          <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
            <h3 className="text-2xl font-semibold">{activeNode.title}</h3>
            <StatusBadge status={activeNode.status} />
          </div>
          <p className="mt-2 text-sm font-medium text-teal-100">{activeNode.subtitle}</p>
          <p className="mt-4 text-sm leading-6 text-slate-300">{activeNode.description}</p>
          <div className={cx("mt-5 rounded-2xl border p-4", statusStyles[activeNode.status].panel)}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">Implementation status</p>
            <p className="mt-2 text-sm leading-6">{activeNode.implementation}</p>
            {activeNode.ctaHref ? (
              <Link href={activeNode.ctaHref} className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-teal-50">
                {activeNode.ctaLabel ?? "Open module"}
              </Link>
            ) : null}
          </div>
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
          <span className={cx("flex flex-wrap items-center gap-2 font-semibold text-slate-950", compact ? "justify-center text-xs" : "text-sm")}>
            {node.title}
            <span className={cx("inline-flex h-2 w-2 rounded-full", statusStyles[node.status].dot)} />
          </span>
          <span className={cx("mt-1 block leading-5 text-slate-600", compact ? "text-[11px]" : "text-xs")}>{node.subtitle}</span>
          <span className={cx("mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]", statusStyles[node.status].chip)}>{statusStyles[node.status].label}</span>
        </span>
      </div>
    </button>
  );
}

function StatusBadge({ status }: { status: ImplementationStatus }) {
  return (
    <span className={cx("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]", statusStyles[status].chip)}>
      <span className={cx("h-2 w-2 rounded-full", statusStyles[status].dot)} />
      {statusStyles[status].label}
    </span>
  );
}
