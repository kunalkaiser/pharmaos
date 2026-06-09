"use client";

import { useMemo, useState } from "react";
import type { CiAlert, CiPublication, CiTrialProgram, CompetitiveIntelResponse, CompetitiveIntelRun } from "@/lib/competitive-intel/types";

type Tab = "command" | "pipeline" | "trialWatch" | "publications" | "timeline" | "brief" | "primaryResearch" | "roadmap" | "audit";

const tabs: Array<{ id: Tab; label: string }> = [
  { id: "command", label: "Command" },
  { id: "pipeline", label: "Pipeline" },
  { id: "trialWatch", label: "Trial Watch" },
  { id: "publications", label: "Publications" },
  { id: "timeline", label: "Timeline" },
  { id: "brief", label: "CI Brief" },
  { id: "primaryResearch", label: "Primary Research" },
  { id: "roadmap", label: "More Feeds" },
  { id: "audit", label: "Audit" },
];

const demoPresets = [
  {
    label: "Alzheimer's disease",
    indication: "Alzheimer's disease",
    competitors: "Eli Lilly\nBiogen\nEisai\nRoche",
    why: "Late-stage antibody and neurodegeneration surveillance.",
  },
  {
    label: "Advanced NSCLC",
    indication: "advanced non-small cell lung cancer",
    competitors: "Merck\nBristol Myers Squibb\nRoche\nAstraZeneca",
    why: "Oncology trial watch for checkpoint inhibitor competition.",
  },
  {
    label: "Obesity / GLP-1",
    indication: "obesity GLP-1 receptor agonist",
    competitors: "Novo Nordisk\nEli Lilly\nPfizer\nAmgen",
    why: "Metabolic portfolio and publication momentum scan.",
  },
  {
    label: "Multiple myeloma",
    indication: "multiple myeloma",
    competitors: "Johnson & Johnson\nBristol Myers Squibb\nGSK\nPfizer",
    why: "Hematology pipeline and trial-status surveillance.",
  },
];

const capabilityMap = [
  ["Pipeline Tracker", "Live", "ClinicalTrials.gov programs by competitor, phase, status, enrollment, endpoint, and source link."],
  ["Trial Watch", "Live baseline", "Current-state watch view; historical change detection unlocks when saved snapshots are enabled."],
  ["Landscape Brief", "Live", "Executive Markdown brief with portfolio table, alerts, evidence gaps, publication appendix, and governance."],
  ["Evidence Chat", "Connected path", "Use Evidence Chat for report/source Q&A; project-scoped CI chat is the next persistence layer."],
  ["Primary Research", "Intake preview", "KOL, vendor-call, congress, and confidential transcript intake surface with governance warnings."],
  ["Regulatory", "Next feed", "FDA/EMA labels, approvals, advisory committee, CRL, and milestone tracking."],
  ["Market Access", "Next feed", "Guideline, payer, reimbursement, and pricing signal monitoring."],
  ["IP / Congress", "Next feed", "Patent filings, congress abstracts, poster tracking, and field intel capture."],
];

const roadmapFeeds = [
  ["Regulatory Intelligence", "FDA/EMA milestones, labels, advisory committee events, CRLs, and approval-timeline shifts.", "Next"],
  ["Market Access", "Pricing, reimbursement, guidelines, payer restrictions, value narrative, and access barriers.", "Next"],
  ["IP / Patent Watch", "USPTO, EPO, WIPO, Lens/Google Patents where allowed, with filing and expiry signals.", "Next"],
  ["Congress Intelligence", "Conference abstracts, posters, oral presentations, KOL debriefs, and unpublished signal capture.", "Next"],
  ["Watchlist Alerts", "Saved NCT IDs, competitor assets, status changes, enrollment changes, endpoint changes, and email/dashboard alerts.", "Next"],
  ["Project Chat", "Chat with one CI brief, selected runs, or a named project such as Obesity CI Q1.", "Next"],
];

function internalRequestHeaders() {
  const accessToken = new URLSearchParams(window.location.search).get("access_token");
  return {
    "content-type": "application/json",
    ...(accessToken ? { "x-evidara-internal-token": accessToken } : {}),
  };
}

function splitCompetitors(value: string) {
  return value.split(/[\n,;]/).map((item) => item.trim()).filter(Boolean);
}

function compactMarkdown(markdown: string) {
  if (markdown.length <= 10000) return markdown;
  const governanceIndex = markdown.indexOf("## Governance");
  const preservedTail = governanceIndex > -1 ? markdown.slice(governanceIndex) : markdown.slice(-1400);
  return `${markdown.slice(0, 7600)}\n\n[Middle of preview truncated in UI. Export pipeline can use the full markdown object.]\n\n${preservedTail}`;
}

function severityClass(severity: string) {
  if (severity === "high") return "border-rose-200 bg-rose-50 text-rose-900";
  if (severity === "medium") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function statusClass(status: string | null) {
  if (/completed|terminated|withdrawn|suspended/i.test(status ?? "")) return "border-slate-300 bg-slate-100 text-slate-800";
  if (/recruiting|not yet recruiting|enrolling/i.test(status ?? "")) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (/active/i.test(status ?? "")) return "border-cyan-200 bg-cyan-50 text-cyan-800";
  return "border-slate-200 bg-white text-slate-700";
}

function allPrograms(run: CompetitiveIntelRun | null) {
  return run?.competitors.flatMap((competitor) => competitor.programs.map((program) => ({ ...program, company: competitor.name }))) ?? [];
}

function allPublications(run: CompetitiveIntelRun | null) {
  return run?.competitors.flatMap((competitor) => competitor.publications.map((publication) => ({ ...publication, company: competitor.name }))) ?? [];
}

function completedPrograms(programs: Array<CiTrialProgram & { company: string }>) {
  return programs.filter((program) => /completed|terminated|withdrawn|suspended/i.test(program.status ?? ""));
}

function recruitingPrograms(programs: Array<CiTrialProgram & { company: string }>) {
  return programs.filter((program) => /recruiting|not yet recruiting|enrolling/i.test(program.status ?? ""));
}

function activePrograms(programs: Array<CiTrialProgram & { company: string }>) {
  return programs.filter((program) => /active/i.test(program.status ?? ""));
}

function highAlerts(alerts: CiAlert[]) {
  return alerts.filter((alert) => alert.severity === "high");
}

function timelineItems(programs: Array<CiTrialProgram & { company: string }>, publications: Array<CiPublication & { company: string }>) {
  return [
    ...programs.map((program) => ({
      id: program.trial_id,
      date: program.last_update_posted ?? program.completion_date ?? program.start_date ?? "Date not reported",
      title: program.title,
      company: program.company,
      type: "Trial",
      source: program.source_url,
      detail: `${program.status ?? "Status not reported"}${program.phase ? ` · ${program.phase}` : ""}`,
    })),
    ...publications.map((publication) => ({
      id: publication.doi ?? publication.pmid ?? publication.title,
      date: publication.publication_date ?? "Date not reported",
      title: publication.title,
      company: publication.company,
      type: "Publication",
      source: publication.source_url ?? "",
      detail: publication.journal ?? "Journal not reported",
    })),
  ].sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

export function CompetitiveIntelConsole() {
  const [indication, setIndication] = useState("Alzheimer's disease");
  const [competitors, setCompetitors] = useState("Eli Lilly\nBiogen\nEisai\nRoche");
  const [timeWindowWeeks, setTimeWindowWeeks] = useState(24);
  const [maxTrials, setMaxTrials] = useState(5);
  const [maxPublications, setMaxPublications] = useState(3);
  const [watchlistIds, setWatchlistIds] = useState("NCT04437511\nNCT05108922");
  const [primaryResearchType, setPrimaryResearchType] = useState("expert_interview");
  const [primaryResearchText, setPrimaryResearchText] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("command");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Ready to run a source-linked competitive scan.");
  const [response, setResponse] = useState<CompetitiveIntelResponse | null>(null);

  const run = response?.result ?? null;
  const competitorList = useMemo(() => splitCompetitors(competitors), [competitors]);
  const programs = useMemo(() => allPrograms(run), [run]);
  const publications = useMemo(() => allPublications(run), [run]);
  const highSeverityAlerts = highAlerts(run?.alerts ?? []);
  const recruiting = recruitingPrograms(programs);
  const active = activePrograms(programs);
  const completed = completedPrograms(programs);
  const timeline = timelineItems(programs, publications);

  async function runScan() {
    setLoading(true);
    setStatus("Running ClinicalTrials.gov and PubMed retrieval...");
    setResponse(null);
    try {
      const result = await fetch("/api/internal/competitive-intel/run", {
        method: "POST",
        headers: internalRequestHeaders(),
        body: JSON.stringify({
          indication,
          competitors: competitorList,
          timeWindowWeeks,
          maxTrialsPerCompetitor: maxTrials,
          maxPublicationsPerCompetitor: maxPublications,
        }),
      });
      const payload = (await result.json()) as CompetitiveIntelResponse;
      setResponse(payload);
      if (!payload.ok) throw new Error(payload.error ?? "Competitive scan failed.");
      setStatus(`CI brief ready: ${payload.result?.audit.total_trials ?? 0} trials, ${payload.result?.audit.total_publications ?? 0} publications, ${payload.result?.audit.total_alerts ?? 0} alert signals.`);
      setActiveTab("command");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Competitive scan failed.");
    } finally {
      setLoading(false);
    }
  }

  function applyPreset(preset: (typeof demoPresets)[number]) {
    setIndication(preset.indication);
    setCompetitors(preset.competitors);
    setStatus(`${preset.label} demo loaded. Run the scan to retrieve live public-source data.`);
  }

  function reviewerAction() {
    if (!run) return "Run a scan, then review source-linked trial records, alerts, and publication coverage.";
    if (highSeverityAlerts.length) return `Review ${highSeverityAlerts.length} high-severity alert signal(s), then inspect source pages before sharing the brief.`;
    if (run.alerts.length) return `Review ${run.alerts.length} alert signal(s). No high-severity alert is currently rendered from this run.`;
    return "No alert signals were generated. Verify aliases and expand the time window before concluding low competitive activity.";
  }

  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 text-white shadow-xl">
        <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Competitive Intelligence Command Center</p>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">
              A pharma CI workspace for pipeline tracking, trial watch, publications, alerts, briefs, and primary research intake.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
              Today it runs deterministic ClinicalTrials.gov and PubMed scans. The workspace also shows the next CI layers clearly: regulatory, market access, IP, congress, watchlists, projects, and report chat.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={runScan}
                disabled={loading || !indication.trim() || competitorList.length === 0}
                className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Running scan..." : "Run CI scan"}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("brief")}
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/50"
              >
                View CI brief
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/8 p-5 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Guided demo paths</p>
            <div className="mt-4 grid gap-3">
              {demoPresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="rounded-2xl border border-white/10 bg-white/8 p-4 text-left transition hover:border-cyan-200/70 hover:bg-white/12"
                >
                  <span className="text-sm font-semibold text-white">{preset.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-slate-300">{preset.why}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {capabilityMap.map(([title, statusLabel, copy]) => (
          <div key={title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-slate-950">{title}</h3>
              <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${statusLabel.includes("Live") ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"}`}>
                {statusLabel}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
        <div className="space-y-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Watchlist setup</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-950">Market, competitors, and lookback</h3>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">Live public sources</span>
            </div>

            <label className="mt-6 block">
              <span className="text-sm font-semibold text-slate-800">Indication or market</span>
              <input
                value={indication}
                onChange={(event) => setIndication(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                placeholder="advanced NSCLC, Alzheimer's disease, obesity..."
              />
            </label>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-slate-800">Competitors, sponsors, or assets</span>
              <textarea
                value={competitors}
                onChange={(event) => setCompetitors(event.target.value)}
                rows={5}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                placeholder={"Merck\nBristol Myers Squibb\nRoche"}
              />
            </label>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-slate-800">Trial watchlist IDs</span>
              <textarea
                value={watchlistIds}
                onChange={(event) => setWatchlistIds(event.target.value)}
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm leading-6 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                placeholder={"NCT01234567\nNCT02345678"}
              />
              <span className="mt-2 block text-xs leading-5 text-slate-500">Current-state display is live. Saved prior-state comparison is the next persistence layer.</span>
            </label>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Weeks</span>
                <input type="number" min={1} max={104} value={timeWindowWeeks} onChange={(event) => setTimeWindowWeeks(Number(event.target.value))} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Trials</span>
                <input type="number" min={1} max={12} value={maxTrials} onChange={(event) => setMaxTrials(Number(event.target.value))} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Papers</span>
                <input type="number" min={0} max={8} value={maxPublications} onChange={(event) => setMaxPublications(Number(event.target.value))} className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" />
              </label>
            </div>

            <button type="button" onClick={runScan} disabled={loading || !indication.trim() || competitorList.length === 0} className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Retrieving source records..." : "Run source-linked CI scan"}
            </button>
            <p className="mt-4 text-sm leading-6 text-slate-600">{status}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Primary research intake</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-950">KOL, vendor, congress, or confidential notes</h3>
            <select value={primaryResearchType} onChange={(event) => setPrimaryResearchType(event.target.value)} className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100">
              <option value="expert_interview">Expert interview</option>
              <option value="vendor_call">Vendor call</option>
              <option value="congress_intel">Congress intelligence</option>
              <option value="confidential_data">Confidential data</option>
            </select>
            <textarea value={primaryResearchText} onChange={(event) => setPrimaryResearchText(event.target.value)} rows={5} className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-900 outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100" placeholder="Paste transcript notes or congress takeaways. Extraction storage is intentionally gated until tenant security and retention controls are finalized." />
            <button type="button" onClick={() => setActiveTab("primaryResearch")} className="mt-3 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50">
              Preview intake requirements
            </button>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-5">
            {[
              ["Competitors", run?.competitors.length ?? competitorList.length],
              ["Trials", programs.length],
              ["Papers", publications.length],
              ["Alerts", run?.alerts.length ?? 0],
              ["High", highSeverityAlerts.length],
            ].map(([label, value]) => (
              <div key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex gap-2 overflow-x-auto pb-2" aria-label="Competitive intelligence sections">
              {tabs.map((tab) => (
                <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === tab.id ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-slate-400"}`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {!run ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm font-semibold text-slate-950">No CI run yet</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Choose a demo path or enter competitors, then run a scan to generate the dashboard, tabs, and source-linked brief.</p>
              </div>
            ) : null}

            {run && activeTab === "command" ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Run summary</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">{run.indication}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">Retrieved {programs.length} trial record(s), {publications.length} PubMed record(s), and {run.alerts.length} alert signal(s). Output remains provisional and source-linked.</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Next reviewer action</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{reviewerAction()}</p>
                </div>
                {run.strategic_implications.map((item) => (
                  <div key={item.recommendation} className="rounded-3xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Source-grounded implication</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">{item.recommendation}</p>
                    <p className="mt-2 text-xs text-slate-500">Confidence: {item.confidence} · Source: {item.source}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {run && activeTab === "pipeline" ? (
              <PipelineTable programs={programs} />
            ) : null}

            {run && activeTab === "trialWatch" ? (
              <div className="mt-6 grid gap-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <StatusCard title="Recruiting / new" count={recruiting.length} copy="Current registry status suggests recruiting or not-yet-recruiting programs." />
                  <StatusCard title="Active" count={active.length} copy="Programs listed as active or active-not-recruiting in registry data." />
                  <StatusCard title="Completed / stopped" count={completed.length} copy="Completed, terminated, withdrawn, or suspended programs." />
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-950">Watchlist IDs</p>
                  <p className="mt-2 whitespace-pre-wrap font-mono text-sm leading-6 text-slate-700">{watchlistIds || "No watchlist IDs entered."}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">Historical change detection requires saved prior snapshots. This screen currently shows source-linked current state and status buckets.</p>
                </div>
                <AlertList alerts={run.alerts} />
              </div>
            ) : null}

            {run && activeTab === "publications" ? (
              <div className="mt-6">
                <p className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-700">
                  PubMed was queried for the selected indication, competitors, and {timeWindowWeeks}-week lookback. {publications.length ? `${publications.length} publication record(s) matched the filters.` : "Zero publication records matched the filters."}
                </p>
                <PublicationTable publications={publications} />
              </div>
            ) : null}

            {run && activeTab === "timeline" ? (
              <div className="mt-6 space-y-3">
                {timeline.length ? timeline.slice(0, 20).map((item) => (
                  <div key={`${item.type}-${item.id}`} className="rounded-3xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{item.type} · {item.company}</p>
                        <h3 className="mt-2 text-sm font-semibold leading-6 text-slate-950">{item.title}</h3>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">{item.date}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
                    {item.source ? <a className="mt-3 inline-flex text-sm font-semibold text-cyan-700 hover:text-cyan-900" href={item.source} target="_blank" rel="noreferrer">Open source</a> : null}
                  </div>
                )) : <EmptyPanel text="Run a scan to populate the timeline." />}
              </div>
            ) : null}

            {run && activeTab === "brief" ? (
              <pre id="ci-brief-preview" className="mt-6 max-h-[720px] overflow-auto rounded-3xl bg-slate-950 p-5 text-xs leading-6 text-slate-100">{compactMarkdown(run.report_markdown)}</pre>
            ) : null}

            {activeTab === "primaryResearch" ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  ["Transcript type", primaryResearchType.replace(/_/g, " ")],
                  ["Text status", primaryResearchText.trim() ? `${primaryResearchText.trim().length} characters ready for extraction` : "No transcript text supplied"],
                  ["Governance", "Storage and extraction gated until tenant security, retention, and confidential-data policies are finalized"],
                  ["Extractor output", "Claim, source sentence, confidence, competitor, PICOTS, strategic implication, and transcript hash"],
                ].map(([title, copy]) => (
                  <div key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-950">{copy}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {activeTab === "roadmap" ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {roadmapFeeds.map(([title, copy, statusLabel]) => (
                  <div key={title} className="rounded-3xl border border-slate-200 bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold text-slate-950">{title}</h3>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">{statusLabel}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {run && activeTab === "audit" ? (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Audit trail</p>
                <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div><dt className="text-xs text-slate-500">Run ID</dt><dd className="mt-1 font-mono text-sm text-slate-950">{run.run_id}</dd></div>
                  <div><dt className="text-xs text-slate-500">Chain ID</dt><dd className="mt-1 font-mono text-sm text-slate-950">{run.audit.chain_id}</dd></div>
                  <div><dt className="text-xs text-slate-500">Sources</dt><dd className="mt-1 text-sm text-slate-950">{run.audit.sources_queried.join(", ")}</dd></div>
                  <div><dt className="text-xs text-slate-500">Deterministic</dt><dd className="mt-1 text-sm text-slate-950">{run.audit.deterministic ? "Yes" : "No"}</dd></div>
                </dl>
                {run.audit.limitations.length ? (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-amber-950">Retrieval limitations</p>
                    <ul className="mt-2 space-y-1 text-sm leading-6 text-amber-900">{run.audit.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusCard({ title, count, copy }: { title: string; count: number; copy: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-950">{count}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
    </div>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return <p className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">{text}</p>;
}

function PipelineTable({ programs }: { programs: Array<CiTrialProgram & { company: string }> }) {
  if (!programs.length) return <EmptyPanel text="No trial programs were retrieved for this scan." />;
  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Program</th>
              <th className="px-4 py-3">Phase</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">N</th>
              <th className="px-4 py-3">Primary endpoint</th>
              <th className="px-4 py-3">Completion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {programs.map((program) => (
              <tr key={`${program.company}-${program.trial_id}`} className="align-top">
                <td className="px-4 py-4 font-semibold text-slate-950">{program.company}</td>
                <td className="px-4 py-4">
                  <a className="font-semibold text-cyan-700 hover:text-cyan-900" href={program.source_url} target="_blank" rel="noreferrer">{program.trial_id}</a>
                  <p className="mt-1 max-w-sm text-xs leading-5 text-slate-600">{program.title}</p>
                </td>
                <td className="px-4 py-4 text-slate-700">{program.phase ?? "-"}</td>
                <td className="px-4 py-4"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(program.status)}`}>{program.status ?? "Not reported"}</span></td>
                <td className="px-4 py-4 text-slate-700">{program.n ?? "-"}</td>
                <td className="max-w-xs px-4 py-4 text-slate-700">{program.primary_endpoint ?? "Not reported"}</td>
                <td className="px-4 py-4 text-slate-700">{program.completion_date ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AlertList({ alerts }: { alerts: CiAlert[] }) {
  if (!alerts.length) return <EmptyPanel text="No alert signals were generated for this run." />;
  return (
    <div className="grid gap-3">
      {alerts.map((alert) => (
        <div key={alert.alert_id} className={`rounded-3xl border p-5 ${severityClass(alert.severity)}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold">{alert.competitor}</p>
            <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]">{alert.severity}</span>
          </div>
          <p className="mt-2 text-sm leading-6">{alert.description}</p>
          <p className="mt-2 text-xs opacity-75">{alert.trial_id ?? alert.doi ?? alert.alert_id}</p>
        </div>
      ))}
    </div>
  );
}

function PublicationTable({ publications }: { publications: Array<CiPublication & { company: string }> }) {
  if (!publications.length) return <EmptyPanel text="No PubMed publication records matched the current filters." />;
  return (
    <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">DOI / PMID</th>
              <th className="px-4 py-3">Journal</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {publications.map((publication) => (
              <tr key={`${publication.company}-${publication.doi ?? publication.pmid ?? publication.title}`} className="align-top">
                <td className="px-4 py-4 font-semibold text-slate-950">{publication.company}</td>
                <td className="max-w-md px-4 py-4 text-slate-700">{publication.source_url ? <a href={publication.source_url} target="_blank" rel="noreferrer" className="font-semibold text-cyan-700 hover:text-cyan-900">{publication.title}</a> : publication.title}</td>
                <td className="px-4 py-4 text-slate-700">{publication.doi ?? publication.pmid ?? "-"}</td>
                <td className="px-4 py-4 text-slate-700">{publication.journal ?? "-"}</td>
                <td className="px-4 py-4 text-slate-700">{publication.publication_date ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
