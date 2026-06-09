import Link from "next/link";
import { Icon } from "@/components/Icon";

const workspacePreviewHref = "/api/preview-access?token=evidaraos-preview-access";
const demoQuestion =
  "In treatment-naive adults with advanced NSCLC (stage IIIB/IV, EGFR/ALK wild-type), what is the efficacy of pembrolizumab monotherapy or pembrolizumab plus platinum-doublet chemotherapy compared with chemotherapy alone on overall survival and progression-free survival? Randomised controlled trials, 2015-2024.";
const demoWorkflowHref = `${workspacePreviewHref}&chain=full_slr&question=${encodeURIComponent(demoQuestion)}&drug=${encodeURIComponent("pembrolizumab")}&indication=${encodeURIComponent("treatment-naive adults with advanced NSCLC, EGFR/ALK wild-type")}&framework=PICO`;

const primaryPaths = [
  {
    label: "Run an SLR",
    href: demoWorkflowHref,
    icon: "ask" as const,
    copy: "Draft PICOT, retrieve source records, inspect full-text availability, and generate a review-ready report scaffold.",
  },
  {
    label: "Chat with Evidence",
    href: "/api/preview-access?token=evidaraos-preview-access&redirect=/app/chat",
    icon: "spark" as const,
    copy: "Ask uploaded PDFs, reports, or retrieved source sets for endpoints, safety events, HRs, CIs, p-values, and source snippets.",
  },
  {
    label: "Track Competitors",
    href: "/api/preview-access?token=evidaraos-preview-access&redirect=/app/competitive-intel",
    icon: "source" as const,
    copy: "Scan competitor trials, recent PubMed signals, alert cards, evidence gaps, and a source-linked landscape brief.",
  },
  {
    label: "Review Sources",
    href: "/api/preview-access?token=evidaraos-preview-access&redirect=/app/sources",
    icon: "source" as const,
    copy: "Check source identifiers, retrieval status, hydration coverage, candidate fields, and human-review handoff.",
  },
];

const trustItems = [
  "Draft evidence support, not final medical or regulatory judgment",
  "Human expert review required before external use",
  "Source traceability, candidate promotion, and audit handoff built into the workflow",
];

const reportRows = [
  ["Records identified", "50", "Search and deduplication summary"],
  ["Full text available", "12", "PMC, Europe PMC, Unpaywall, or manual upload"],
  ["Extracted candidates", "10", "Awaiting reviewer confirmation"],
  ["Report readiness", "74%", "Formatting, sections, governance, and limitations checked"],
];

const previewSections = [
  "Executive Summary",
  "Scope and Protocol",
  "PRISMA Flow",
  "Evidence Tables",
  "Risk of Bias",
  "Limitations",
];

const commandCenterMetrics = [
  ["Protocol", "PICOT drafted", "Oncology overlay applied"],
  ["Sources", "50 records", "12 full-text routes found"],
  ["Report", "QA reviewed", "Client-ready markdown active"],
];

const workflowSteps = [
  ["1", "Question", "Natural-language clinical or value question"],
  ["2", "Protocol", "Review type, framework, domain rules, and PICOT fields"],
  ["3", "Sources", "PubMed, Crossref, trial, label, and OA full-text paths"],
  ["4", "Evidence Chat", "Ask report, source set, or uploaded PDF/DOCX"],
  ["5", "Report", "Readable draft with tables, figures, QA, and review gates"],
];

const transformationRows = [
  ["Before EvidaraOS", "Scattered searches, pasted abstracts, unclear PDF status, and a report that reads like a debug log."],
  ["With EvidaraOS", "One guided workspace for protocol, retrieval, source status, evidence chat, report QA, and reviewer handoff."],
];

export default function Home() {
  return (
    <main className="bg-[#f5f7fa]">
      <section className="border-b border-slate-200 bg-white px-5 py-14 md:px-8 md:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-900">
              <Icon name="spark" className="h-4 w-4" />
              Evidence workflow software for life sciences
            </p>
            <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
              AI-assisted evidence workflow software for SLR, HEOR, safety, regulatory, competitive intelligence, and source review teams.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              EvidaraOS helps teams move from a biomedical question to protocol drafting, source triage, evidence chat, report previews, and human-review handoff in one governed workspace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={demoWorkflowHref} className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
                Try demo workflow
                <Icon name="arrow" className="ml-2 h-4 w-4" />
              </Link>
              <Link href="#paths" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50">
                Choose a path
              </Link>
            </div>
            <div className="mt-7 grid gap-3 text-sm leading-6 text-slate-600 md:grid-cols-3">
              {trustItems.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <Icon name="check" className="mb-3 h-4 w-4 text-teal-700" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950 p-3 shadow-2xl shadow-slate-300/70">
            <div className="rounded-[1.3rem] bg-[#f8fafc] p-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Guided demo</p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-950">Pembrolizumab in advanced NSCLC</h2>
                  </div>
                  <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">Full SLR</span>
                </div>
                <div className="mt-5 rounded-2xl border border-slate-200 bg-[#f8fafc] p-4">
                  <p className="text-sm font-semibold text-slate-950">Research question</p>
                  <p className="mt-3 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                    Treatment-naive advanced NSCLC, EGFR/ALK wild-type: pembrolizumab monotherapy or pembrolizumab plus platinum-doublet chemotherapy versus chemotherapy alone for OS and PFS.
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {commandCenterMetrics.map(([label, value, detail]) => (
                      <div key={label} className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">{value}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
                      </div>
                    ))}
                  </div>
                  <Link href={demoWorkflowHref} className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800">
                    Run this example
                  </Link>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-[0.88fr_1.12fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Readiness pulse</p>
                  <div className="mt-4 flex items-end gap-2">
                    {[42, 68, 56, 81, 74].map((height, index) => (
                      <div key={height + index} className="flex flex-1 items-end rounded-full bg-slate-100 px-1.5 pb-1.5" style={{ height: "7rem" }}>
                        <div className="w-full rounded-full bg-teal-500" style={{ height: `${height}%` }} />
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-500">Shows where source coverage, extraction, and report QA need reviewer attention.</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Evidence Chat</p>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl bg-white/10 p-3 text-sm leading-6 text-slate-200">Extract OS, PFS, HR, CI, and p-values from the source set.</div>
                    <div className="rounded-2xl bg-teal-400 p-3 text-sm leading-6 text-slate-950">
                      Answer prepared from selected evidence context with citations, limitations, and human-review flag.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-950 px-5 py-14 text-white md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">Evidence command center</p>
              <h2 className="mt-3 text-3xl font-semibold">One workflow, not five disconnected tabs.</h2>
              <p className="mt-4 text-base leading-7 text-slate-300">
                The wow moment is when a reviewer sees the whole chain: question, protocol, sources, full-text status, chat, report quality, and handoff.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-5">
              {workflowSteps.map(([step, title, copy]) => (
                <div key={step} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-400 text-sm font-semibold text-slate-950">{step}</span>
                  <h3 className="mt-4 text-base font-semibold">{title}</h3>
                  <p className="mt-2 text-xs leading-5 text-slate-300">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-5 py-14 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Why it feels different</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">From messy evidence work to a guided review room</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The platform should feel like a showroom: clear next step, polished outputs, and enough governance to build trust without forcing every user through the engine room.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {transformationRows.map(([title, copy], index) => (
              <div key={title} className={`rounded-2xl border p-6 shadow-sm ${index === 0 ? "border-slate-200 bg-slate-50" : "border-teal-200 bg-teal-50"}`}>
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${index === 0 ? "text-slate-500" : "text-teal-700"}`}>
                    {index === 0 ? "Current pain" : "EvidaraOS path"}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold text-slate-950">{title}</h3>
                  <p className="mt-4 text-sm leading-6 text-slate-700">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="paths" className="border-b border-slate-200 bg-[#f8fafc] px-5 py-14 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Start in seconds</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Four simple paths into the product</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Pick the task you came to do. Deeper methods, diagnostics, and audit details stay available without overwhelming the first screen.
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {primaryPaths.map((path) => (
              <Link key={path.label} href={path.href} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-xl hover:shadow-slate-200/80">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
                  <Icon name={path.icon} className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-xl font-semibold text-slate-950">{path.label}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{path.copy}</p>
                <p className="mt-6 inline-flex items-center text-sm font-semibold text-teal-800">
                  Open
                  <Icon name="arrow" className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-5 py-16 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Report preview</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">A report people can actually read</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The workspace separates client-facing narrative from operational metadata. Reviewers see readiness checks, evidence tables, PRISMA counts, figures, limitations, and source handoff without digging through raw logs.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {previewSections.map((section) => (
                <span key={section} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  {section}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-[#f8fafc] p-4 shadow-xl shadow-slate-200/80">
            <div className="rounded-[1.1rem] border border-slate-200 bg-white p-6">
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">EvidaraOS Evidence Report</p>
                  <h3 className="mt-2 max-w-2xl text-2xl font-semibold tracking-tight text-slate-950">
                    Pembrolizumab for treatment-naive advanced NSCLC
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Draft evidence support · Human verification required · Source-linked candidate package</p>
                </div>
                <div className="rounded-2xl bg-teal-50 px-4 py-3 text-center ring-1 ring-teal-200">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Readiness</p>
                  <p className="mt-1 text-2xl font-semibold text-teal-950">74%</p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                {reportRows.map(([label, value, detail]) => (
                  <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-slate-950">Executive summary</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    The review question is framed as PICO for first-line advanced NSCLC. Retrieved records are candidate-only and require verification of trial eligibility, comparator regimens, hazard ratios, confidence intervals, and risk of bias.
                  </p>
                  <div className="mt-4 space-y-2">
                    {["Protocol aligned", "Source coverage visible", "Quantitative readiness flagged"].map((item) => (
                      <div key={item} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        <Icon name="check" className="h-4 w-4 text-teal-700" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white">
                  <p className="text-sm font-semibold">Safety and efficacy figures</p>
                  <div className="mt-5 space-y-4">
                    {[
                      ["Overall survival", "w-[78%]", "HR/CI extraction pending review"],
                      ["Progression-free survival", "w-[64%]", "Comparable outcomes required"],
                      ["Grade 3+ adverse events", "w-[42%]", "Safety table verification"],
                    ].map(([label, width, detail]) => (
                      <div key={label}>
                        <div className="flex justify-between gap-3 text-xs text-slate-300">
                          <span>{label}</span>
                          <span>{detail}</span>
                        </div>
                        <div className="mt-2 h-3 rounded-full bg-white/10">
                          <div className={`h-3 rounded-full bg-teal-400 ${width}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3 text-xs leading-5 text-slate-300">
                    Forest plots, PRISMA flow, and safety signal tables render when extractable numerical fields are available.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-[#eef5f6] px-5 py-14 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Governed by design</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Responsible language without killing confidence</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              EvidaraOS is designed for draft evidence support. It keeps review boundaries visible while helping teams move faster through protocol setup, source inspection, extraction, and report preparation.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Source-linked", "Every candidate points back to records, identifiers, snippets, or uploaded source material."],
              ["Review-gated", "Draft outputs stay candidate-only until a qualified reviewer verifies the evidence."],
              ["Audit-aware", "Runs, chat turns, exports, and review handoffs are structured for traceability."],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <Icon name="governance" className="h-5 w-5 text-teal-800" />
                <h3 className="mt-4 text-base font-semibold text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-14 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 rounded-[1.5rem] border border-slate-200 bg-slate-950 p-8 text-white shadow-xl shadow-slate-300/70 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-300">Private beta ready</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Invite evidence teams into a clear first workflow.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Best positioned today as a design-partner preview for pharma, biotech, HEOR, medical affairs, safety, and evidence synthesis teams.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={demoWorkflowHref} className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100">
              Try NSCLC demo
            </Link>
            <Link href="/demo" className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Request demo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
