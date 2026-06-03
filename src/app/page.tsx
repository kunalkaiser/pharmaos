import Link from "next/link";
import { Icon } from "@/components/Icon";

const workspacePreviewHref = "/api/preview-access?token=evidaraos-preview-access";

const quickActions = [
  {
    label: "Create a protocol",
    copy: "Turn a natural-language evidence question into editable PICO/PICOT fields.",
    icon: "ask" as const,
    status: "Interactive",
  },
  {
    label: "Review evidence packets",
    copy: "Open candidate source packages, extraction status, limitations, and review handoff.",
    icon: "layers" as const,
    status: "Interactive",
  },
  {
    label: "Inspect sources",
    copy: "Check identifiers, source URLs, hydration status, and manual PDF needs.",
    icon: "source" as const,
    status: "Interactive",
  },
  {
    label: "Check report previews",
    copy: "Preview draft reports with tables, figures, source inventories, and QA gates.",
    icon: "audit" as const,
    status: "Interactive",
  },
  {
    label: "Review audit trail",
    copy: "See how governance, traceability, and review boundaries are represented.",
    icon: "governance" as const,
    status: "Auth boundary",
  },
];

const implementedItems = [
  "Protocol builder with domain-specific PICOTS checks",
  "Candidate-only evidence workflows connected to the Python engine",
  "Source normalization, hydration status, review queue, and draft report export",
  "Manual PDF extraction and document evidence chat for uploaded sources",
];

const boundaryItems = [
  "Production authentication and role-based access",
  "Validated regulated-use audit enforcement",
  "Final medical, payer, regulatory, or legal conclusions",
  "Full external-use SLR sign-off without human evidence-team review",
];

const workflowGroups = [
  {
    title: "Evidence workflows",
    label: "Interactive",
    copy: "Run Full SLR, Rapid Scan, Safety Review, HEOR Foundation, Payer Brief, Regulatory, Trial Intelligence, or Full Discovery from the workspace.",
  },
  {
    title: "Document tools",
    label: "Interactive",
    copy: "Upload a PDF/DOCX or paste source text to ask evidence questions, extract endpoints, and create reviewable candidates.",
  },
  {
    title: "Methods and architecture",
    label: "Informational",
    copy: "Use the architecture, methodology, and trust pages to understand implementation status, source boundaries, and governance expectations.",
  },
];

const navCards = [
  ["Open guided workspace", workspacePreviewHref, "Start a protocol, run an analysis, upload a paper, or preview a report."],
  ["See how it works", "/query-journey", "Follow the evidence journey from question to review handoff."],
  ["Check product status", "/architecture", "Separate live features from planned architecture and runtime boundaries."],
];

export default function Home() {
  return (
    <main className="bg-[#f6f8fb]">
      <section className="border-b border-slate-200 bg-white px-5 py-12 md:px-8 md:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-900">
              <Icon name="spark" className="h-4 w-4" />
              Evidence workbench for pharma teams
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
              EvidaraOS turns biomedical questions into reviewable evidence packages.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Today, you can create a protocol, run candidate-only evidence workflows, inspect sources, upload papers, and export draft reports with clear human-review gates.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={workspacePreviewHref} className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
                Start a guided run
                <Icon name="arrow" className="ml-2 h-4 w-4" />
              </Link>
              <Link href="#quick-start" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50">
                See what you can do
              </Link>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              Draft outputs remain candidate-only until qualified reviewers verify sources, extracted data, risk of bias, and certainty.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-300 bg-slate-950 p-3 shadow-xl shadow-slate-300/60">
            <div className="rounded-[1.1rem] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">First action</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-950">Create an evidence protocol</h2>
                </div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  Interactive
                </span>
              </div>
              <div className="mt-5 rounded-xl border border-slate-200 bg-[#f8fafc] p-4">
                <p className="text-sm font-semibold text-slate-950">Example question</p>
                <p className="mt-3 rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                  In treatment-naive adults with advanced NSCLC, what is the efficacy of pembrolizumab compared with chemotherapy on overall survival and progression-free survival?
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {["Protocol", "Sources", "Report"].map((label, index) => (
                    <div key={label} className="rounded-lg border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Step {index + 1}</p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">{label}</p>
                    </div>
                  ))}
                </div>
                <Link href={workspacePreviewHref} className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700">
                  Open workspace
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="quick-start" className="border-b border-slate-200 bg-[#f8fafc] px-5 py-12 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Quick start</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">What you can do here</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Start with the work a reviewer or consultant actually needs to do. Advanced architecture is available later.
              </p>
            </div>
            <Link href={workspacePreviewHref} className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Start now
              <Icon name="arrow" className="ml-2 h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {quickActions.map((item) => (
              <article key={item.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
                    <Icon name={item.icon} className="h-5 w-5" />
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    {item.status}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold text-slate-950">{item.label}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-5 py-12 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Product status</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">What works today, and what still needs runtime controls</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              EvidaraOS is explicit about boundaries. The current workspace can generate draft evidence support, but regulated or external use still requires human verification and production governance.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">Available now</p>
              <ul className="mt-4 space-y-3">
                {implementedItems.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-emerald-950">
                    <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">Requires verification or production controls</p>
              <ul className="mt-4 space-y-3">
                {boundaryItems.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-amber-950">
                    <Icon name="governance" className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-[#eef5f6] px-5 py-12 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Workflows</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Open the simple path first. Expand details when needed.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              These panels explain what is interactive, what is informational, and where authentication or governance boundaries apply.
            </p>
          </div>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {workflowGroups.map((group, index) => (
              <details key={group.title} className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm" open={index === 0}>
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                  <span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                      {group.label}
                    </span>
                    <span className="mt-4 block text-lg font-semibold text-slate-950">{group.title}</span>
                  </span>
                  <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 group-open:rotate-90">
                    <Icon name="arrow" className="h-4 w-4" />
                  </span>
                </summary>
                <p className="mt-4 text-sm leading-6 text-slate-600">{group.copy}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-12 md:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Choose your next step</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Where to go from here</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {navCards.map(([title, href, copy]) => (
              <Link key={title} href={href} className="group rounded-xl border border-slate-200 bg-[#f8fafc] p-6 shadow-sm transition hover:border-teal-300 hover:bg-white">
                <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
                <p className="mt-5 inline-flex items-center text-sm font-semibold text-teal-800">
                  Go
                  <Icon name="arrow" className="ml-2 h-4 w-4 transition group-hover:translate-x-0.5" />
                </p>
              </Link>
            ))}
          </div>
          <p className="mt-8 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
            Product rule: every page should answer three questions in the first screen: what this is, what the user can do here, and what to do next.
          </p>
        </div>
      </section>
    </main>
  );
}
