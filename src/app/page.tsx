import Link from "next/link";
import { Icon } from "@/components/Icon";

const workspacePreviewHref = "/api/preview-access?token=evidaraos-preview-access";

const exampleQuestions = [
  "Dupilumab versus placebo in moderate-to-severe atopic dermatitis",
  "Tirzepatide safety in type 2 diabetes patients inadequately controlled on metformin",
  "Prevalence of claustrophobia during MRI scans",
];

const workflowSteps = [
  {
    title: "Ask the evidence question",
    copy: "Start with natural language or fill protocol fields when the team already knows the PICO/PICOT structure.",
  },
  {
    title: "Review the source package",
    copy: "The engine retrieves and normalizes source-linked candidates, hydration status, limitations, and review handoff items.",
  },
  {
    title: "Export a reviewed draft",
    copy: "Generate a candidate-only report with tables, charts, source inventory, PRISMA counts, and governance boundaries.",
  },
];

const showroomOutputs = [
  ["Evidence report", "Styled PDF and markdown exports with sections, tables, charts, limitations, and source records."],
  ["Source review queue", "Candidate records are separated from narrative text so reviewers can promote or reject source-linked evidence."],
  ["Document evidence chat", "Upload or paste full text and ask for endpoints, safety events, discontinuations, HRs, CIs, and snippets."],
  ["Protocol builder", "Auto-detects evidence framework and supports clinical, epidemiology, HEOR, qualitative, and policy questions."],
];

const jobs = [
  ["Run Analysis", "Full SLR, Safety Review, HEOR Foundation, Payer Brief, Regulatory, Trial Intelligence."],
  ["Upload a Paper", "Use manual PDF extraction or document chat when open-access hydration is not enough."],
  ["Review Sources", "Inspect candidates, source URLs, identifiers, extraction status, and limitations before promotion."],
];

export default function Home() {
  return (
    <main className="bg-[#f6f8fb]">
      <section className="border-b border-slate-200 bg-white px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-900">
              <Icon name="spark" className="h-4 w-4" />
              Evidence workbench, not another black-box answer
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
              Ask a biomedical evidence question. Get a source-linked report package.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              EvidaraOS helps teams run candidate-only SLR, safety, HEOR, payer, regulatory, trial, and document-review workflows with sources, limitations, charts, and review handoff visible from the start.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={workspacePreviewHref} className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
                Start Evidence Run
                <Icon name="arrow" className="ml-2 h-4 w-4" />
              </Link>
              <Link href="#examples" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50">
                View examples
              </Link>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-300 bg-slate-950 p-3 shadow-2xl shadow-slate-300/70">
            <div className="rounded-[1.35rem] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Start here</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">Evidence Run</h2>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  Python engine connected
                </span>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-[#f8fafc] p-4">
                <p className="text-sm font-semibold text-slate-950">What do you want to know?</p>
                <div className="mt-3 rounded-xl border border-slate-300 bg-white p-4 text-sm leading-6 text-slate-600">
                  Compare safety and efficacy evidence for dupilumab versus placebo in adults with moderate-to-severe atopic dermatitis.
                </div>
                <div className="mt-4 grid gap-2">
                  {exampleQuestions.map((question) => (
                    <Link key={question} href={workspacePreviewHref} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium leading-5 text-slate-700 transition hover:border-teal-300 hover:text-teal-900">
                      {question}
                    </Link>
                  ))}
                </div>
                <Link href={workspacePreviewHref} className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700">
                  Open guided workspace
                </Link>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {["Protocol", "Sources", "Report"].map((label, index) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-semibold text-white">{index + 1}</div>
                    <p className="mt-3 text-sm font-semibold text-slate-950">{label}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{index === 0 ? "Auto-filled fields" : index === 1 ? "Candidate review" : "PDF + charts"}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-[#f8fafc] px-5 py-12 md:px-8" id="examples">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Showroom path</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Three steps instead of a maze.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The public experience should feel like a showroom: start with what the user can do, then reveal the machinery only when they ask for it.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <article key={step.title} className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">{index + 1}</div>
                <h3 className="mt-5 text-lg font-semibold text-slate-950">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{step.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-5 py-12 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">What users get</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Outputs people can inspect, review, and export.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The point is not to impress users with every internal subsystem. The point is to show the packet they can use and the guardrails that keep it honest.
            </p>
            <Link href={workspacePreviewHref} className="mt-6 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Try the workspace
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {showroomOutputs.map(([title, copy]) => (
              <article key={title} className="rounded-[1.5rem] border border-slate-200 bg-[#f8fafc] p-5">
                <h3 className="text-base font-semibold text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-[#eaf2f4] px-5 py-12 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 md:grid-cols-3">
            {jobs.map(([title, copy]) => (
              <Link key={title} href={workspacePreviewHref} className="group rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md">
                <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
                <p className="mt-5 inline-flex items-center text-sm font-semibold text-teal-800">
                  Open
                  <Icon name="arrow" className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-12 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">For diligence teams</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">The machinery is still visible, just not first.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Architecture, data methods, trust boundaries, and implementation status remain available for technical validation after the user understands the basic product journey.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/architecture" className="rounded-[1.5rem] border border-slate-200 bg-[#f8fafc] p-5 hover:border-teal-300">
              <p className="text-sm font-semibold text-slate-950">Architecture status</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">See what is live, partial, and planned.</p>
            </Link>
            <Link href="/data-methodology" className="rounded-[1.5rem] border border-slate-200 bg-[#f8fafc] p-5 hover:border-teal-300">
              <p className="text-sm font-semibold text-slate-950">Data and methodology</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Inspect source boundaries and workflow methods.</p>
            </Link>
            <Link href="/security-trust" className="rounded-[1.5rem] border border-slate-200 bg-[#f8fafc] p-5 hover:border-teal-300">
              <p className="text-sm font-semibold text-slate-950">Trust and governance</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Review candidate-only limits and governance expectations.</p>
            </Link>
            <Link href="/demo" className="rounded-[1.5rem] border border-slate-200 bg-[#f8fafc] p-5 hover:border-teal-300">
              <p className="text-sm font-semibold text-slate-950">Request access</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Bring a real evidence question for guided evaluation.</p>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
