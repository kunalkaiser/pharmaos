export type ArchitectureLayer = {
  id: string;
  title: string;
  subtitle: string;
  accent: "blue" | "teal" | "purple" | "green" | "orange" | "slate";
  description: string;
  details: string[];
  trust: string;
};

export type JourneyStep = {
  id: string;
  label: string;
  title: string;
  description: string;
  details: string[];
};

export type Chain = {
  id: string;
  title: string;
  subtitle: string;
  accent: ArchitectureLayer["accent"];
  purpose: string;
  activatesWhen: string;
  users: string[];
  outputs: string[];
};

export type AgentCluster = {
  id: string;
  title: string;
  accent: ArchitectureLayer["accent"];
  role: string;
  examples: string[];
};

export type HomepageCard = {
  title: string;
  copy: string;
  accent: ArchitectureLayer["accent"];
};

export const architectureLayers: ArchitectureLayer[] = [
  {
    id: "user-query",
    title: "User Query",
    subtitle: "Typed or spoken request",
    accent: "blue",
    description:
      "The user begins with a natural-language question. HEOR, Medical Affairs, Clinical Development, R&D, Regulatory, and Portfolio Strategy users do not need to manually select databases, agents, or workflows.",
    details: ["Typed or spoken input", "Function-specific context", "Natural-language request", "No manual chain selection required"],
    trust: "The question becomes the starting point for a governed evidence workflow, not the final answer.",
  },
  {
    id: "orchestration",
    title: "Orchestration",
    subtitle: "Intent routing and chain activation",
    accent: "teal",
    description:
      "The orchestrator interprets the question, identifies the functional use case, determines therapeutic context, and activates the relevant evidence chains. The workflow is dynamic, not linear.",
    details: ["Detect task type", "Identify required output", "Select evidence chains", "Route retrieval and synthesis", "Determine governance requirements"],
    trust: "Users can see which chains activated and why.",
  },
  {
    id: "evidence-retrieval",
    title: "Evidence Retrieval",
    subtitle: "Parallel biomedical source retrieval",
    accent: "purple",
    description:
      "The platform retrieves evidence from biomedical, clinical, regulatory, safety, and knowledge sources in parallel. Retrieval is source-grounded so downstream synthesis stays anchored to real documents and databases.",
    details: ["PubMed and Europe PMC", "ClinicalTrials.gov", "FDA FAERS and FDA labels", "OpenTargets, ChEMBL, UniProt, Reactome", "OMOP Layer 2 and Synthea clinical layer"],
    trust: "Each material claim should remain traceable to source evidence.",
  },
  {
    id: "evidenceos-agents",
    title: "EvidenceOS Agents",
    subtitle: "Specialized evidence workers",
    accent: "blue",
    description:
      "EvidenceOS uses specialized agents organized into evidence chains. They are coordinated evidence workers: retrieval agents, synthesis agents, safety agents, payer agents, repurposing agents, and governance agents.",
    details: ["Intake and intent agents", "Retrieval and literature synthesis agents", "Trial intelligence and safety agents", "Genomics, multi-omics, payer, and repurposing agents", "Governance and compliance agents"],
    trust: "Agents read prior context before reasoning and write findings back after each step.",
  },
  {
    id: "epi-engine",
    title: "EpiEngine",
    subtitle: "Burden and indication prioritization",
    accent: "green",
    description:
      "EpiEngine provides quantitative disease and indication context using aggregate incidence, prevalence, unmet need, market size, competition, and health equity inputs.",
    details: ["Incidence and prevalence", "Unmet need", "Market size", "Competition penalty", "Health equity context"],
    trust: "Scores are associative ranking heuristics, not causal estimates.",
  },
  {
    id: "governance",
    title: "Governance",
    subtitle: "Classification, provenance, audit, review",
    accent: "slate",
    description:
      "Governance is modeled throughout the workflow. Before outputs are exported in a production product, evidence classification, sensitive-data checks, provenance tracking, audit logging, and human review controls should be enforced by backend services.",
    details: ["Sensitive-data checks", "Evidence classification", "Provenance to source documents", "Contradiction detection", "Audit trail and export-control requirements"],
    trust: "Association is never upgraded to causation without explicit source support.",
  },
  {
    id: "outputs",
    title: "Outputs",
    subtitle: "Function-specific evidence deliverables",
    accent: "orange",
    description:
      "The final output is tailored to the requesting team. EvidaraOS produces evidence deliverables aligned to the user’s decision context rather than a single generic summary.",
    details: ["HEOR value evidence brief", "Medical Affairs scientific evidence summary", "Clinical Development trial landscape", "R&D mechanistic rationale", "Regulatory and Portfolio Strategy evidence packets"],
    trust: "Each output shows what evidence was used, how it was classified, and where review is required.",
  },
];

export const journeySteps: JourneyStep[] = [
  {
    id: "ask",
    label: "Ask",
    title: "User asks a question",
    description: "A user submits a natural-language question through text or voice. The user does not need to know which database, chain, or agent to activate.",
    details: ["Example: Evaluate semaglutide for obstructive sleep apnea.", "The request enters as a business, clinical, or scientific question."],
  },
  {
    id: "intent",
    label: "Understand Intent",
    title: "Intent and context detection",
    description: "The orchestrator determines whether this is a therapeutic evaluation, repurposing, disease burden, safety, or payer question.",
    details: ["Detects repurposing-style assessment", "Recognizes disease burden and clinical evidence needs", "Identifies payer and value implications if requested"],
  },
  {
    id: "chains",
    label: "Activate Chains",
    title: "Evidence chains activate dynamically",
    description: "The platform activates the chains most relevant to the question. It does not run a fixed pipeline every time.",
    details: ["Likely: Chain R for repurposing strategy", "Likely: Chain A for genomics, safety, and literature synthesis", "Likely: Chain D for broad discovery", "Optional: Chain P if payer value context is requested"],
  },
  {
    id: "retrieve",
    label: "Retrieve Evidence",
    title: "Retrieve evidence from public sources",
    description: "The system queries biomedical sources in parallel to gather mechanistic, clinical, safety, and epidemiological evidence.",
    details: ["Literature: PubMed and Europe PMC", "Trials: ClinicalTrials.gov", "Safety: FDA FAERS and FDA labels", "Biology: OpenTargets, ChEMBL, UniProt, Reactome"],
  },
  {
    id: "synthesize",
    label: "Synthesize",
    title: "Agents reason across evidence",
    description: "Specialized agents evaluate evidence, compare findings, flag contradictions, and write intermediate findings into shared session context.",
    details: ["Identify mechanistic plausibility", "Summarize trial activity", "Evaluate safety transferability", "Compare published evidence", "Identify evidence gaps"],
  },
  {
    id: "classify",
    label: "Classify Evidence",
    title: "Classify evidence strength",
    description: "Every finding receives an evidence classification so users can separate direct source statements from associations, hypotheses, and modeled projections.",
    details: ["Descriptive: directly reported finding", "Associative: observed relationship without causal claim", "Causal hypothesis: plausible mechanism requiring validation", "Scenario projection: modeled estimate with assumptions"],
  },
  {
    id: "govern",
    label: "Apply Governance",
    title: "Governance and human review",
    description: "Before output is exported in a production product, governance checks should run and review requirements should be explicit.",
    details: ["Sensitive-data checks", "Provenance tracking", "Audit trail requirements", "Contradiction flags", "Human review and export controls"],
  },
  {
    id: "deliver",
    label: "Deliver Output",
    title: "Deliver a decision-ready evidence brief",
    description: "The final output is tailored to the user’s function and includes source-grounded evidence, caveats, evidence classifications, and next-step recommendations.",
    details: ["Repurposing rationale", "Disease burden snapshot", "Trial landscape summary", "Safety considerations", "Payer-relevant evidence gaps"],
  },
];

export const chains: Chain[] = [
  {
    id: "A",
    title: "Chain A",
    subtitle: "Genomics -> Drug Repurposing -> Safety -> Literature",
    accent: "purple",
    purpose: "Connects biological rationale with repurposing potential, safety context, and literature support.",
    activatesWhen: "A query needs mechanistic rationale, target-disease evidence, safety support, and literature synthesis.",
    users: ["R&D", "Translational Strategy", "Medical Affairs"],
    outputs: ["Mechanistic rationale", "Repurposing evidence summary", "Safety context", "Literature-backed narrative"],
  },
  {
    id: "B",
    title: "Chain B",
    subtitle: "Trial Intelligence -> Multi-Omics -> Literature",
    accent: "blue",
    purpose: "Maps clinical development evidence, biomarkers, and translational context.",
    activatesWhen: "A query needs trial landscape, biomarker logic, endpoint context, feasibility signals, or multi-omics support.",
    users: ["Clinical Development", "Medical Affairs", "R&D"],
    outputs: ["Trial landscape", "Endpoint context", "Biomarker rationale", "Feasibility signals"],
  },
  {
    id: "C",
    title: "Chain C",
    subtitle: "Safety -> Literature",
    accent: "teal",
    purpose: "Synthesizes safety signals, label context, and literature-supported risk narratives.",
    activatesWhen: "The core question involves adverse events, label risks, class effects, or a safety controversy.",
    users: ["Regulatory", "Safety", "Medical Affairs"],
    outputs: ["Safety narrative", "Label context", "Contradiction flags", "Literature-supported risk summary"],
  },
  {
    id: "D",
    title: "Chain D",
    subtitle: "Full Discovery",
    accent: "slate",
    purpose: "Runs a broad evidence scan when the team needs a wide-angle view.",
    activatesWhen: "The query is exploratory or asks for a broad landscape before deeper specialized work.",
    users: ["Portfolio Strategy", "R&D", "Executive Teams"],
    outputs: ["Evidence map", "Opportunity areas", "Risk themes", "Next-step chain recommendations"],
  },
  {
    id: "P",
    title: "Chain P",
    subtitle: "Payer Intelligence",
    accent: "green",
    purpose: "Builds payer- and value-oriented evidence context.",
    activatesWhen: "The user asks about value evidence, reimbursement precedent, payer questions, burden, comparators, or economic context.",
    users: ["HEOR", "Market Access", "Commercial Strategy"],
    outputs: ["Value evidence brief", "Likely payer questions", "Comparator summary", "ICER-range context"],
  },
  {
    id: "R",
    title: "Chain R",
    subtitle: "Repurposing Strategy",
    accent: "orange",
    purpose: "Identifies and prioritizes potential new indications or candidate compounds.",
    activatesWhen: "The user asks whether a compound could fit another indication, or which compounds may fit a given indication.",
    users: ["R&D", "Portfolio Strategy", "Business Development"],
    outputs: ["Repurposing candidates", "Mechanistic hypothesis", "Evidence-quality score", "Clinical validation needs"],
  },
];

export const agentClusters: AgentCluster[] = [
  { id: "intent", title: "Intake + Intent Agents", accent: "blue", role: "Translate user questions into structured evidence tasks.", examples: ["Detect function", "Identify therapeutic area", "Determine required output", "Route to chains"] },
  { id: "retrieval", title: "Retrieval Agents", accent: "purple", role: "Collect source-grounded evidence from public biomedical databases.", examples: ["Retrieve literature", "Query trials", "Pull safety context", "Gather regulatory label evidence"] },
  { id: "epi", title: "EpiEngine / Scoring Agents", accent: "green", role: "Support burden and prioritization logic.", examples: ["Assess incidence", "Evaluate unmet need", "Compare market size", "Apply competition penalty"] },
  { id: "synthesis", title: "Synthesis Agents", accent: "teal", role: "Turn retrieved evidence into coherent, structured findings.", examples: ["Summarize literature", "Compare findings", "Identify contradictions", "Highlight evidence gaps"] },
  { id: "payer", title: "Payer / Strategy Agents", accent: "orange", role: "Translate evidence into payer, value, and strategy outputs.", examples: ["Comparator landscape", "HTA precedent", "Likely payer questions", "Value evidence framing"] },
  { id: "governance", title: "Governance Agents", accent: "slate", role: "Model trust and review controls for future backend enforcement.", examples: ["Sensitive-data checks", "Evidence classification", "Provenance checking", "Audit logging requirements"] },
];

export const trustCards = [
  { title: "Source Grounding", copy: "Every material claim should trace back to a source document, database entry, PMID, NCT ID, FDA label, or regulatory document where applicable." },
  { title: "Evidence Classification", copy: "Findings are labeled so users can distinguish direct evidence from associations, hypotheses, and modeled projections." },
  { title: "Contradiction Detection", copy: "Contradictions are surfaced rather than hidden. The platform does not force false consensus when evidence is contested." },
  { title: "Association ≠ Causation", copy: "The system is designed so associative findings are not upgraded into causal claims without explicit source support." },
  { title: "Human Review", copy: "Outputs intended for external, payer, regulatory, or clinical use should require human review before export once production workflow controls are implemented." },
  { title: "Auditability", copy: "The product model requires governance-ready records of what was asked, what sources were used, what agents ran, and what output was generated." },
];

export const evidenceClasses = [
  { title: "Descriptive", copy: "A directly reported finding from a cited source." },
  { title: "Associative", copy: "An observed relationship without a causal claim." },
  { title: "Causal hypothesis", copy: "A plausible mechanism or causal pathway requiring validation." },
  { title: "Scenario projection", copy: "A modeled estimate based on explicit assumptions." },
];

export const homepagePillars: HomepageCard[] = [
  {
    title: "Evidence foundation",
    copy: "Connect literature, trials, safety, regulatory, epidemiology, and knowledge sources into a retrievable evidence layer.",
    accent: "blue",
  },
  {
    title: "White-box orchestration",
    copy: "Route each question through visible layers, chain activation logic, shared context, and claim-level evidence classification.",
    accent: "teal",
  },
  {
    title: "Governed outputs",
    copy: "Deliver evidence briefs, payer questions, trial landscapes, safety narratives, and repurposing rationales with provenance.",
    accent: "orange",
  },
];

export const platformMetrics = [
  { value: "7", label: "architecture layers", copy: "From query intake through governed outputs." },
  { value: "6", label: "evidence chains", copy: "Dynamic pathways for discovery, payer, safety, trials, and repurposing." },
  { value: "4", label: "evidence classes", copy: "Descriptive, associative, causal hypothesis, and scenario projection." },
  { value: "1", label: "shared context layer", copy: "wiki.read() / wiki.write() for continuity and auditability." },
];

export const audienceCards: HomepageCard[] = [
  {
    title: "Life sciences evidence teams",
    copy: "Support HEOR, Medical Affairs, Clinical Development, R&D, Regulatory, and Portfolio Strategy from one governed workspace.",
    accent: "purple",
  },
  {
    title: "Market access and payer strategy",
    copy: "Translate burden, comparator, safety, and value evidence into payer-ready questions and evidence gaps.",
    accent: "green",
  },
  {
    title: "Discovery and repurposing teams",
    copy: "Connect biology, disease burden, safety, literature, and clinical feasibility into transparent opportunity assessments.",
    accent: "orange",
  },
];

export const enterpriseExpectations: HomepageCard[] = [
  {
    title: "Fit-for-purpose evidence",
    copy: "Source fitness, provenance, and evidence classification are foregrounded because enterprise RWE buyers expect more than summaries.",
    accent: "blue",
  },
  {
    title: "Speed with credibility",
    copy: "The product story emphasizes rapid query-to-output workflows while preserving methods, review controls, and caveats.",
    accent: "teal",
  },
  {
    title: "Audience-specific solutions",
    copy: "The homepage makes it clearer which pharma functions benefit and what outputs they should expect.",
    accent: "purple",
  },
];

export const intelligenceUseCases: HomepageCard[] = [
  {
    title: "Market dynamics",
    copy: "Track adoption, switching, utilization, and competitive movement through evidence sources and governed assumptions.",
    accent: "blue",
  },
  {
    title: "Patient segmentation",
    copy: "Define clinically meaningful populations and surface evidence gaps that shape deeper study design.",
    accent: "teal",
  },
  {
    title: "Early signals",
    copy: "Identify emerging shifts in prescribing, diagnosis, safety, outcomes, and trial activity before the story is obvious.",
    accent: "orange",
  },
  {
    title: "Access strategy",
    copy: "Connect burden, geography, equity, comparator, and payer questions into a clear value-evidence pathway.",
    accent: "green",
  },
  {
    title: "Evidence strategy",
    copy: "Translate source-grounded findings into next analyses, validation needs, and evidence-generation plans.",
    accent: "purple",
  },
];

export const solutionCards: HomepageCard[] = [
  {
    title: "Indication prioritization",
    copy: "Compare disease burden, unmet need, competition, equity context, and evidence gaps before committing scarce clinical and HEOR resources.",
    accent: "green",
  },
  {
    title: "Disease burden synthesis",
    copy: "Organize incidence, prevalence, population segments, geographic variation, and limitations into an audit-ready burden narrative.",
    accent: "blue",
  },
  {
    title: "Trial population intelligence",
    copy: "Map endpoints, eligibility signals, comparator activity, and translational rationale for lean clinical development teams.",
    accent: "purple",
  },
  {
    title: "HEOR/RWE evidence mapping",
    copy: "Identify source-backed value evidence, payer questions, comparator gaps, and follow-on analyses for access planning.",
    accent: "teal",
  },
  {
    title: "Safety and label context",
    copy: "Surface label language, safety signals, class considerations, and contradiction flags without overstating causality.",
    accent: "orange",
  },
  {
    title: "Repurposing rationale",
    copy: "Connect mechanism, target-disease fit, published evidence, trial activity, and validation needs into a decision-ready hypothesis.",
    accent: "slate",
  },
];

export const methodologySources: HomepageCard[] = [
  { title: "Literature", copy: "PubMed, Europe PMC, and publication metadata for source-backed scientific claims.", accent: "blue" },
  { title: "Trials", copy: "ClinicalTrials.gov and trial registry context for endpoints, populations, sponsors, and activity.", accent: "purple" },
  { title: "Safety", copy: "FDA labels, FAERS-oriented context, adverse-event narratives, and safety transferability questions.", accent: "orange" },
  { title: "Regulatory", copy: "FDA labels, precedent analysis, and source lineage for claims intended for regulated review.", accent: "slate" },
  { title: "Disease burden", copy: "EpiEngine inputs for incidence, prevalence, unmet need, market context, competition, and equity signals.", accent: "green" },
  { title: "Knowledge sources", copy: "OpenTargets, ChEMBL, UniProt, Reactome, OMIM, NCBI Gene, and related biomedical references.", accent: "teal" },
];

export const resourceCards: HomepageCard[] = [
  {
    title: "Evidence packet requirements",
    copy: "A public guide to the fields a real packet must include: source identifiers, classification, caveats, and review status.",
    accent: "blue",
  },
  {
    title: "Methodology overview",
    copy: "A buyer-facing explanation of source categories, evidence classes, contradiction handling, and limitations.",
    accent: "teal",
  },
  {
    title: "Demo preparation checklist",
    copy: "A short guide for preparing an asset, disease area, or evidence question for a focused EvidaraOS walkthrough.",
    accent: "orange",
  },
];

export const companyPrinciples: HomepageCard[] = [
  {
    title: "Evidence before automation",
    copy: "EvidaraOS should make sources, classifications, limitations, and review requirements visible before users rely on an answer.",
    accent: "blue",
  },
  {
    title: "Built for lean biotech teams",
    copy: "The target user is a US biotech or pharma team that needs credible evidence work without a large internal HEOR/RWE function.",
    accent: "green",
  },
  {
    title: "Designed for accountable decisions",
    copy: "The product direction prioritizes auditability, contradiction detection, source traceability, and human review over generic AI chat.",
    accent: "teal",
  },
];
