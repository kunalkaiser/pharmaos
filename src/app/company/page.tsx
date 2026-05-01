import Link from "next/link";
import { accentStyles } from "@/components/DetailPanel";
import { SectionHeading } from "@/components/SectionHeading";
import { companyPrinciples } from "@/lib/evidara-content";

export default function CompanyPage() {
  return (
    <main className="bg-white px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Company"
          title="Built around accountable evidence decisions"
          subtitle="EvidaraOS is positioned for US biotech and pharma teams that need source-grounded evidence workflows before investing in larger RWE, HEOR, or portfolio programs."
        />

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {companyPrinciples.map((principle) => (
            <article key={principle.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${accentStyles[principle.accent]}`}>{principle.title}</span>
              <p className="mt-4 text-sm leading-6 text-slate-600">{principle.copy}</p>
            </article>
          ))}
        </div>

        <section className="mt-12 rounded-[2rem] border border-slate-300 bg-slate-950 p-6 text-white shadow-xl md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">Trust boundary</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">No fake logos. No fake testimonials. No black-box claims.</h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            Until customer references, security attestations, or production integrations exist and are approved for publication, the site should prove credibility through transparent methodology, sample artifacts, and clear limitations.
          </p>
          <Link href="/data-methodology" className="mt-6 inline-flex rounded-full bg-teal-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-teal-400">
            Review methodology
          </Link>
        </section>
      </div>
    </main>
  );
}
