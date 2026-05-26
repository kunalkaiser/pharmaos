"use client";

import { useEffect, useMemo, useState } from "react";

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

function safeJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export function EvidenceEngineConsole() {
  const [chains, setChains] = useState<Chain[]>(fallbackChains);
  const [selectedChainId, setSelectedChainId] = useState("full_slr");
  const [question, setQuestion] = useState(starterQuestion);
  const [drug, setDrug] = useState("dupilumab");
  const [indication, setIndication] = useState("moderate-to-severe atopic dermatitis");
  const [maxResults, setMaxResults] = useState(10);
  const [liveSearch, setLiveSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [engineStatus, setEngineStatus] = useState("Checking engine connection...");
  const [runResponse, setRunResponse] = useState<RunResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    const accessToken = new URLSearchParams(window.location.search).get("access_token") ?? "";
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

  const selectedChain = useMemo(
    () => chains.find((chain) => chain.id === selectedChainId) ?? chains[0] ?? fallbackChains[0],
    [chains, selectedChainId]
  );

  async function runSelectedChain() {
    setLoading(true);
    setRunResponse(null);
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
          drug,
          indication,
          max_results: maxResults,
          live_search: liveSearch,
        }),
      });
      const payload = (await response.json()) as RunResponse;
      setRunResponse(payload);
    } catch (error) {
      setRunResponse({
        ok: false,
        engineConnected: false,
        error: error instanceof Error ? error.message : "Run failed.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
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
                onChange={(event) => setQuestion(event.target.value)}
                rows={5}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none ring-teal-500/20 focus:border-teal-600 focus:ring-4"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-800">Drug or intervention</span>
                <input
                  value={drug}
                  onChange={(event) => setDrug(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-teal-500/20 focus:border-teal-600 focus:ring-4"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-800">Indication</span>
                <input
                  value={indication}
                  onChange={(event) => setIndication(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none ring-teal-500/20 focus:border-teal-600 focus:ring-4"
                />
              </label>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={liveSearch}
                  onChange={(event) => setLiveSearch(event.target.checked)}
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
                  onChange={(event) => setMaxResults(Number(event.target.value))}
                  className="w-20 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-600"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={runSelectedChain}
              disabled={loading}
              className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? "Running analysis..." : `Run ${selectedChain.name}`}
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

          {runResponse.result ? (
            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
              <pre className="max-h-[620px] overflow-auto rounded-2xl bg-slate-950 p-5 text-xs leading-5 text-slate-100">
                {safeJson(runResponse.result.artifacts)}
              </pre>
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
                    {runResponse.result.limitations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
