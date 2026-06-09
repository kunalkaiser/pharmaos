"use client";

import { useMemo, useState } from "react";
import type { CompetitiveIntelResponse, CompetitiveIntelRun } from "@/lib/competitive-intel/types";

type Tab = "overview" | "portfolio" | "alerts" | "brief" | "audit";

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

function countPrograms(run: CompetitiveIntelRun | null) {
  return run?.competitors.reduce((sum, competitor) => sum + competitor.programs.length, 0) ?? 0;
}

function countPublications(run: CompetitiveIntelRun | null) {
  return run?.competitors.reduce((sum, competitor) => sum + competitor.publications.length, 0) ?? 0;
}

function severityClass(severity: string) {
  if (severity === "high") return "border-rose-200 bg-rose-50 text-rose-900";
  if (severity === "medium") return "border-amber-200 bg-amber-50 text-amber-900";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function compactMarkdown(markdown: string) {
  if (markdown.length <= 9000) return markdown;
  const governanceIndex = markdown.indexOf("## Governance");
  const preservedTail = governanceIndex > -1 ? markdown.slice(governanceIndex) : markdown.slice(-1400);
  return `${markdown.slice(0, 7000)}\n\n[Middle of preview truncated in UI. Export pipeline can use the full markdown object.]\n\n${preservedTail}`;
}

export function CompetitiveIntelConsole() {
  const [indication, setIndication] = useState("Alzheimer's disease");
  const [competitors, setCompetitors] = useState("Eli Lilly\nBiogen\nEisai\nRoche");
  const [timeWindowWeeks, setTimeWindowWeeks] = useState(24);
  const [maxTrials, setMaxTrials] = useState(5);
  const [maxPublications, setMaxPublications] = useState(3);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Ready to run a source-linked competitive scan.");
  const [response, setResponse] = useState<CompetitiveIntelResponse | null>(null);

  const run = response?.result ?? null;
  const competitorList = useMemo(() => splitCompetitors(competitors), [competitors]);

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
      setActiveTab("overview");
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

  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 text-white shadow-xl">
        <div className="grid gap-8 p-6 md:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Competitive Intelligence Command Center</p>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">
              Track competitor trials, publications, alerts, and evidence gaps from one source-linked workspace.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
              Run a deterministic scan across ClinicalTrials.gov and PubMed, then turn the retrieved records into a reviewer-ready competitive landscape brief.
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
              <a
                href="#ci-brief-preview"
                className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/50"
              >
                View brief preview
              </a>
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

      <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Scan setup</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">Choose the market and competitors</h3>
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
            <span className="text-sm font-semibold text-slate-800">Competitors or sponsors</span>
            <textarea
              value={competitors}
              onChange={(event) => setCompetitors(event.target.value)}
              rows={6}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              placeholder={"Merck\nBristol Myers Squibb\nRoche"}
            />
          </label>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Weeks</span>
              <input
                type="number"
                min={1}
                max={104}
                value={timeWindowWeeks}
                onChange={(event) => setTimeWindowWeeks(Number(event.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Trials</span>
              <input
                type="number"
                min={1}
                max={12}
                value={maxTrials}
                onChange={(event) => setMaxTrials(Number(event.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Papers</span>
              <input
                type="number"
                min={0}
                max={8}
                value={maxPublications}
                onChange={(event) => setMaxPublications(Number(event.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={runScan}
            disabled={loading || !indication.trim() || competitorList.length === 0}
            className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Retrieving source records..." : "Run source-linked CI scan"}
          </button>
          <p className="mt-4 text-sm leading-6 text-slate-600">{status}</p>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-4">
            {[
              ["Competitors", run?.competitors.length ?? competitorList.length],
              ["Trials", countPrograms(run)],
              ["Publications", countPublications(run)],
              ["Alerts", run?.alerts.length ?? 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {(["overview", "portfolio", "alerts", "brief", "audit"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                    activeTab === tab ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {!run ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm font-semibold text-slate-950">No CI run yet</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">Choose a demo path or enter your own competitors, then run a scan to generate the dashboard and brief.</p>
              </div>
            ) : null}

            {run && activeTab === "overview" ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Run summary</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">{run.indication}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Retrieved {run.audit.total_trials} trial record(s) and {run.audit.total_publications} PubMed record(s). Output remains provisional and source-linked.
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Next reviewer action</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    Inspect high-severity alerts, verify sponsor aliases, then promote reviewed source records into a strategic landscape brief.
                  </p>
                </div>
                {run.strategic_implications.map((item) => (
                  <div key={item.recommendation} className="rounded-3xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Strategic implication</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">{item.recommendation}</p>
                    <p className="mt-2 text-xs text-slate-500">Confidence: {item.confidence} · Source: {item.source}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {run && activeTab === "portfolio" ? (
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
                        <th className="px-4 py-3">Endpoint</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {run.competitors.flatMap((competitor) =>
                        competitor.programs.length
                          ? competitor.programs.map((program) => (
                              <tr key={`${competitor.name}-${program.trial_id}`} className="align-top">
                                <td className="px-4 py-4 font-semibold text-slate-950">{competitor.name}</td>
                                <td className="px-4 py-4">
                                  <a className="font-semibold text-cyan-700 hover:text-cyan-900" href={program.source_url} target="_blank" rel="noreferrer">
                                    {program.trial_id}
                                  </a>
                                  <p className="mt-1 max-w-sm text-xs leading-5 text-slate-600">{program.title}</p>
                                </td>
                                <td className="px-4 py-4 text-slate-700">{program.phase ?? "-"}</td>
                                <td className="px-4 py-4 text-slate-700">{program.status ?? "-"}</td>
                                <td className="px-4 py-4 text-slate-700">{program.n ?? "-"}</td>
                                <td className="px-4 py-4 max-w-xs text-slate-700">{program.primary_endpoint ?? "Not reported"}</td>
                              </tr>
                            ))
                          : [
                              <tr key={`${competitor.name}-empty`}>
                                <td className="px-4 py-4 font-semibold text-slate-950">{competitor.name}</td>
                                <td className="px-4 py-4 text-slate-600" colSpan={5}>No matching trial program retrieved.</td>
                              </tr>,
                            ]
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {run && activeTab === "alerts" ? (
              <div className="mt-6 grid gap-3">
                {run.alerts.length ? run.alerts.map((alert) => (
                  <div key={`${alert.type}-${alert.competitor}-${alert.program}`} className={`rounded-3xl border p-5 ${severityClass(alert.severity)}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{alert.competitor}</p>
                      <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em]">{alert.severity}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6">{alert.description}</p>
                    <p className="mt-2 text-xs opacity-75">{alert.trial_id ?? alert.doi ?? "source-linked alert"}</p>
                  </div>
                )) : <p className="mt-6 rounded-3xl bg-slate-50 p-6 text-sm text-slate-600">No alert signals were generated for this run.</p>}
              </div>
            ) : null}

            {run && activeTab === "brief" ? (
              <pre id="ci-brief-preview" className="mt-6 max-h-[640px] overflow-auto rounded-3xl bg-slate-950 p-5 text-xs leading-6 text-slate-100">
                {compactMarkdown(run.report_markdown)}
              </pre>
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
                    <ul className="mt-2 space-y-1 text-sm leading-6 text-amber-900">
                      {run.audit.limitations.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Pipeline Tracker", "Find active and completed competitor programs by indication, sponsor, phase, endpoint, and enrollment."],
          ["Trial Watch", "Flag public registry signals such as new trials, completed trials, late-phase status, and endpoint gaps."],
          ["Landscape Brief", "Generate a provisional, source-linked CI brief with portfolio tables, evidence gaps, and audit trail."],
        ].map(([title, copy]) => (
          <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
