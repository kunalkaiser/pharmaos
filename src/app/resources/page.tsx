import Link from "next/link";
import { accentStyles } from "@/components/DetailPanel";
import { SectionHeading } from "@/components/SectionHeading";
import { resourceCards, sampleEvidenceRows } from "@/lib/evidara-content";

export default function ResourcesPage() {
  return (
    <main className="bg-white px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Resources"
          title="Review examples before a conversation"
          subtitle="These resources are intentionally labeled as samples. They are meant to help buyers evaluate EvidaraOS structure, not to imply live generated outputs."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {resourceCards.map((card) => (
            <article key={card.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${accentStyles[card.accent]}`}>{card.title}</span>
              <p className="mt-4 text-sm leading-6 text-slate-600">{card.copy}</p>
            </article>
          ))}
        </div>

        <section className="mt-12 rounded-[2rem] border border-slate-300 bg-white p-6 shadow-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Sample evidence packet</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Semaglutide and obstructive sleep apnea example</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Illustrative structure only. Claims below are examples of how an evidence packet should separate claim type, source lineage, and caveat.
              </p>
            </div>
            <Link href="/demo" className="inline-flex justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Request walkthrough
            </Link>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
            <div className="grid grid-cols-4 bg-slate-950 text-xs font-semibold uppercase tracking-[0.16em] text-white">
              <div className="p-4">Claim</div>
              <div className="p-4">Class</div>
              <div className="p-4">Source lineage</div>
              <div className="p-4">Caveat</div>
            </div>
            {sampleEvidenceRows.map((row) => (
              <div key={row.claim} className="grid grid-cols-1 border-t border-slate-200 text-sm md:grid-cols-4">
                <div className="p-4 text-slate-800">{row.claim}</div>
                <div className="p-4 font-semibold text-slate-950">{row.classification}</div>
                <div className="p-4 text-slate-600">{row.sources}</div>
                <div className="p-4 text-slate-600">{row.caveat}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
