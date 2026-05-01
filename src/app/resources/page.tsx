import Link from "next/link";
import { accentStyles } from "@/components/DetailPanel";
import { SectionHeading } from "@/components/SectionHeading";
import { resourceCards } from "@/lib/evidara-content";

export default function ResourcesPage() {
  return (
    <main className="bg-white px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Resources"
          title="Review the evidence standard before a conversation"
          subtitle="Public resources explain the platform and review model. EvidaraOS does not publish fake evidence packets or demo claims in place of real source-backed output."
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
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Real evidence only</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">Sample packet content is retired until backed by real retrieval.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The public site can describe packet requirements, but it does not display illustrative biomedical claims, fake citations, or synthetic evidence rows.
                Real packet previews should be generated only from public-source candidates that retain source identifiers and review metadata.
              </p>
            </div>
            <Link href="/demo" className="inline-flex justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
              Request walkthrough
            </Link>
          </div>

          <div className="mt-6 grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700 md:grid-cols-3">
            <div>
              <p className="font-semibold text-slate-950">Required source identity</p>
              <p className="mt-2 leading-6">PMID, NCT ID, FDA identifier, source URL, title, access date, or equivalent provenance.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-950">Required review state</p>
              <p className="mt-2 leading-6">Candidate-only, reviewed citation, final evidence record, limitation, and human-review status must stay distinct.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-950">Required limitation notes</p>
              <p className="mt-2 leading-6">Every claim-bearing output needs caveats, confidence/provenance status, and clear boundaries on unsupported conclusions.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
