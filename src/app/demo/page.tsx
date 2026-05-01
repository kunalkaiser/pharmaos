import { SectionHeading } from "@/components/SectionHeading";
import { DemoSandbox } from "@/components/DemoSandbox";
import { DemoRequestForm } from "@/components/DemoRequestForm";
import Link from "next/link";

export default function DemoPage() {
  return (
    <main className="bg-white px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Request access"
          title="Request a focused EvidaraOS demo"
          subtitle="Share the evidence question, asset context, or disease area you want to evaluate. The first conversation should map your use case to the right EvidaraOS workflow, sources, and governance expectations."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Good fit for</p>
            <div className="mt-5 space-y-3">
              {[
                "Series A-C biotech teams evaluating 1-3 clinical-stage assets",
                "Lean HEOR, RWE, clinical development, or portfolio strategy teams",
                "Questions requiring evidence traceability, source grounding, and reviewability",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-300 bg-slate-950 p-6 text-white shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">Demo request checklist</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                ["Function", "HEOR, Medical Affairs, Clinical Development, R&D, Regulatory, or Portfolio"],
                ["Question", "Example: Evaluate semaglutide for obstructive sleep apnea"],
                ["Evidence need", "Burden, trial landscape, safety, payer, repurposing, or methodology"],
                ["Governance need", "Citations, audit trail, human review, export controls, or limitations"],
              ].map(([title, copy]) => (
                <article key={title} className="rounded-2xl border border-white/10 bg-white/8 p-4">
                  <h2 className="text-sm font-semibold text-white">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{copy}</p>
                </article>
              ))}
            </div>
            <DemoRequestForm />
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/query-journey" className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Review query journey
              </Link>
              <Link href="/app" className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Workspace boundary scaffold
              </Link>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              Product workspace architecture is scaffolded for private implementation; it is not a usable authenticated product yet.
            </p>
          </section>
        </div>

        <div className="mt-12">
          <DemoSandbox />
        </div>
      </div>
    </main>
  );
}
