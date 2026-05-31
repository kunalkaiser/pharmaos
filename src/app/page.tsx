import Link from "next/link";
import { Icon } from "@/components/Icon";
import { accentStyles } from "@/components/DetailPanel";
import { audienceCards, enterpriseExpectations, homepagePillars, intelligenceUseCases, platformMetrics } from "@/lib/evidara-content";

const workspacePreviewHref = "/api/preview-access?token=evidaraos-preview-access";

const liveAnalysisChains = [
  {
    id: "full_slr",
    name: "Full SLR",
    description: "PICO protocol, source search, deduplication, PRISMA, GRADE and RoB 2 scaffolds.",
  },
  {
    id: "heor_foundation",
    name: "HEOR Foundation",
    description: "Source-linked model inputs, assumption register, evidence readiness and gaps.",
  },
  {
    id: "payer_brief",
    name: "Payer Brief",
    description: "Value questions, claim traceability, payer evidence gaps and source links.",
  },
  {
    id: "safety_review",
    name: "Safety Review",
    description: "FAERS signal table, safety extraction, discontinuation signals and limitations.",
  },
  {
    id: "regulatory",
    name: "Regulatory",
    description: "Label retrieval, benefit-risk table, uncertainty register and language guardrails.",
  },
  {
    id: "repurposing",
    name: "Repurposing",
    description: "Candidate hypotheses, evidence path notes and false-positive review checks.",
  },
  {
    id: "genomics",
    name: "Genomics",
    description: "Gene evidence table, target-disease overlap and genomics readiness checklist.",
  },
  {
    id: "trial_intelligence",
    name: "Trial Intelligence",
    description: "ClinicalTrials.gov retrieval, trial status counts and eligibility pattern table.",
  },
  {
    id: "full_discovery",
    name: "Full Discovery",
    description: "Cross-module run across SLR, safety, HEOR, regulatory, repurposing and genomics.",
  },
  {
    id: "rapid_scan",
    name: "Rapid Scan",
    description: "Fast protocol, small search, deduplication and top evidence table.",
  },
];

export default function Home() {
  return (
    <main className="bg-[#f6f8fb]">
      <section className="overflow-hidden border-b border-slate-200 bg-white px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-700/20 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-900 shadow-sm">
              <Icon name="spark" className="h-4 w-4" />
              Pharma evidence OS for transparent RWE workflows
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
              EvidaraOS
            </h1>
            <p className="mt-5 max-w-2xl text-xl font-medium leading-8 text-slate-700">
              Turn pharma questions into governed, source-grounded evidence pathways.
            </p>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
              EvidaraOS combines evidence retrieval, dynamic chain orchestration, agentic synthesis, and governance controls so teams can see how an answer was produced before they rely on it.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={workspacePreviewHref} className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
                Launch Evidence Workspace
                <Icon name="arrow" className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/architecture" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50">
                See Platform Architecture
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-300 bg-slate-950 p-4 shadow-2xl shadow-slate-300/70">
            <div className="rounded-[1.5rem] bg-white p-5">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <Icon name="ask" className="h-5 w-5 text-slate-400" />
                <p className="flex-1 text-sm text-slate-500">Run evidence workflow for dupilumab in moderate-to-severe atopic dermatitis...</p>
                <Link href={workspacePreviewHref} className="rounded-full bg-teal-600 px-4 py-2 text-xs font-semibold text-white">
                  Open
                </Link>
              </div>

              <div className="mt-5 rounded-3xl border border-slate-200 bg-[#f8fafc] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Live workspace bridge</p>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">Python engine connected</span>
                </div>
                <div className="mt-4 space-y-3">
                  {["Question intake", "Analysis chain", "Public sources", "Human review", "Report artifact"].map((label, index) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">{index + 1}</div>
                      <div className="h-2 flex-1 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-teal-500" style={{ width: `${88 - index * 10}%` }} />
                      </div>
                      <p className="w-28 text-xs font-semibold text-slate-600">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {["Full SLR", "Safety Review", "HEOR Foundation", "Payer Brief"].map((label, index) => (
                  <div key={label} className={index === 0 ? "rounded-2xl border border-blue-200 bg-blue-50 p-4" : index === 1 ? "rounded-2xl border border-violet-200 bg-violet-50 p-4" : index === 2 ? "rounded-2xl border border-teal-200 bg-teal-50 p-4" : "rounded-2xl border border-orange-200 bg-orange-50 p-4"}>
                    <Icon name={label === "Safety Review" ? "database" : label === "Payer Brief" ? "audit" : label === "Full SLR" ? "target" : "chain"} className="h-5 w-5 text-teal-700" />
                    <p className="mt-3 text-sm font-semibold text-slate-900">{label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Available in workspace</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-950 px-5 py-10 text-white md:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
          {platformMetrics.map((metric) => (
            <article key={metric.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-3xl font-semibold text-teal-200">{metric.value}</p>
              <h2 className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-white">{metric.label}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">{metric.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-5 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Product workspace</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">The working Evidence Engine is surfaced here.</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                The deployed workspace connects the frontend to the Python evidence engine. It produces workflow artifacts and evidence candidates for human review, not final clinical claims.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href={workspacePreviewHref} className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                  Launch Workspace
                  <Icon name="arrow" className="ml-2 h-4 w-4" />
                </Link>
                <Link href="/evidence-engine" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">
                  Review Engine Design
                </Link>
              </div>
              <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
                Candidate-only mode is intentional. Human review, promotion and governance checks remain required before evidence can be used as a reviewed package.
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {liveAnalysisChains.map((chain) => (
                <Link key={chain.name} href={`${workspacePreviewHref}&chain=${chain.id}`} className="group rounded-3xl border border-slate-200 bg-[#f8fafc] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:bg-white hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-slate-950">{chain.name}</h3>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-800">Available</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{chain.description}</p>
                  <p className="mt-4 inline-flex items-center text-sm font-semibold text-teal-800">
                    Run in workspace
                    <Icon name="arrow" className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">What EvidaraOS does</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Evidence work as a visible system.</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                EvidaraOS makes the operating model visible: sources, chains, agents, governance, and function-specific outputs.
              </p>
            </div>
            <StaticSystemMap />
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {homepagePillars.map((pillar) => (
              <article key={pillar.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-100">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${accentStyles[pillar.accent]}`}>{pillar.title}</span>
                <p className="mt-4 text-sm leading-6 text-slate-600">{pillar.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-[#eaf2f4] px-5 py-16 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Built for pharma functions</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">One operating model, multiple evidence jobs.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Different pharma teams ask different evidence questions, but they still need the same visibility into sources, reasoning, caveats, and review requirements.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {audienceCards.map((card) => (
              <article key={card.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${accentStyles[card.accent]}`}>{card.title}</span>
                <p className="mt-4 text-sm leading-6 text-slate-600">{card.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Ask and verify</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Answers are only useful when the method is inspectable.</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                EvidaraOS gives teams a simple product promise: ask a pharma evidence question, then verify the sources, assumptions, chain logic, and governance checks behind the response.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <article className="rounded-[2rem] border border-blue-200 bg-blue-50 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-700 text-white">
                  <Icon name="ask" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-950">Ask what matters now</h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Teams can start with natural-language questions about treatments, populations, evidence gaps, safety concerns, payer strategy, or repurposing hypotheses.
                </p>
              </article>
              <article className="rounded-[2rem] border border-teal-200 bg-teal-50 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 text-white">
                  <Icon name="audit" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-950">Verify before trust</h3>
                <p className="mt-3 text-sm leading-6 text-slate-700">
                  Every output should expose source grounding, evidence classification, assumptions, chain activation, and review requirements before export.
                </p>
              </article>
            </div>
          </div>

          <div className="mt-10 rounded-[2rem] border border-slate-300 bg-slate-950 p-5 shadow-xl">
            <div className="grid gap-4 md:grid-cols-5">
              {intelligenceUseCases.map((item) => (
                <article key={item.title} className="rounded-3xl border border-white/10 bg-white p-5">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${accentStyles[item.accent]}`}>{item.title}</span>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-slate-300 bg-slate-950 p-6 text-white shadow-xl md:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">Enterprise expectations</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Speed is not enough. Show the evidence path.</h2>
                <p className="mt-4 text-base leading-7 text-slate-300">
                  EvidaraOS is structured around visible architecture, proof-style operating metrics, quality controls, and clear solution pathways.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {enterpriseExpectations.map((item) => (
                  <article key={item.title} className="rounded-3xl border border-white/10 bg-white/8 p-5">
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{item.copy}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function StaticSystemMap() {
  const nodes = [
    ["Sources", "Literature, trials, labels"],
    ["Chains", "A, B, C, D, P, R"],
    ["Agents", "Retrieval + synthesis"],
    ["Governance", "Classify + audit"],
    ["Outputs", "Evidence briefs"],
  ];

  return (
    <div className="rounded-[2rem] border border-slate-300 bg-slate-950 p-5 shadow-xl">
      <div className="grid gap-3 md:grid-cols-5">
        {nodes.map(([title, copy], index) => (
          <div key={title} className="relative rounded-2xl border border-white/10 bg-white p-4 text-slate-950">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">{index + 1}</div>
            <h3 className="mt-4 text-sm font-semibold">{title}</h3>
            <p className="mt-2 text-xs leading-5 text-slate-600">{copy}</p>
            {index < nodes.length - 1 ? <div className="absolute -right-3 top-1/2 hidden h-px w-6 bg-teal-300 md:block" /> : null}
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-teal-300/30 bg-teal-400/10 p-4 text-sm text-teal-50">
        A static, inspectable operating model. No stock imagery. No animation. Just the product logic made visible.
      </div>
    </div>
  );
}
