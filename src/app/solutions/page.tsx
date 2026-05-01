import Link from "next/link";
import { accentStyles } from "@/components/DetailPanel";
import { SectionHeading } from "@/components/SectionHeading";
import { solutionCards } from "@/lib/evidara-content";

export default function SolutionsPage() {
  return (
    <main className="bg-white px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Solutions"
          title="Evidence workflows for lean biotech and pharma teams"
          subtitle="EvidaraOS is focused on US biotech and pharma teams that need credible evidence work before they have large internal HEOR, RWE, or strategy functions."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {solutionCards.map((card) => (
            <article key={card.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${accentStyles[card.accent]}`}>{card.title}</span>
              <p className="mt-4 text-sm leading-6 text-slate-600">{card.copy}</p>
            </article>
          ))}
        </div>

        <section className="mt-12 rounded-[2rem] border border-slate-300 bg-slate-950 p-6 text-white shadow-xl md:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">Best-fit buyer</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Built for early clinical-stage evidence decisions.</h2>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                The strongest fit is a Series A-C biotech or focused pharma team with one to three clinical-stage assets, limited internal evidence capacity, and a need to justify decisions with traceable sources.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {["1-3 assets", "Lean HEOR/RWE team", "US biotech/pharma"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/8 p-4 text-sm font-semibold text-white">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/query-journey" className="inline-flex justify-center rounded-full bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-400">
              See example workflow
            </Link>
            <Link href="/demo" className="inline-flex justify-center rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
              Request demo
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
