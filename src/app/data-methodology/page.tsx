import Link from "next/link";
import { accentStyles } from "@/components/DetailPanel";
import { SectionHeading } from "@/components/SectionHeading";
import { evidenceClasses, methodologySources } from "@/lib/evidara-content";

export default function DataMethodologyPage() {
  return (
    <main className="bg-white px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Data and methodology"
          title="Where evidence comes from, and how claims are constrained"
          subtitle="EvidaraOS should help buyers evaluate source fitness, claim classification, assumptions, and limitations before trusting an output."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {methodologySources.map((source) => (
            <article key={source.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${accentStyles[source.accent]}`}>{source.title}</span>
              <p className="mt-4 text-sm leading-6 text-slate-600">{source.copy}</p>
            </article>
          ))}
        </div>

        <section className="mt-12 rounded-[2rem] border border-slate-300 bg-slate-950 p-6 text-white shadow-xl md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">Evidence classes</p>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            {evidenceClasses.map((item) => (
              <article key={item.title} className="rounded-2xl border border-white/10 bg-white/8 p-5">
                <h2 className="text-sm font-semibold text-white">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.copy}</p>
              </article>
            ))}
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-300">
            Methodology principle: outputs should not escalate from associative evidence to causal language unless source support and review requirements are explicit.
          </p>
        </section>

        <div className="mt-8 rounded-3xl border border-orange-200 bg-orange-50 p-6">
          <p className="text-sm font-semibold text-orange-950">Backend status</p>
          <p className="mt-2 text-sm leading-6 text-orange-900">
            This repository currently contains frontend methodology content only. Live source retrieval, citation storage, and evidence packets require backend services that are not present in this repo.
          </p>
          <Link href="/resources" className="mt-5 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Review sample packet
          </Link>
        </div>
      </div>
    </main>
  );
}
