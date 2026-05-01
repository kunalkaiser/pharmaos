import { evidenceClasses, trustCards } from "@/lib/evidara-content";
import { Icon } from "./Icon";

export function GovernanceTrust() {
  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {trustCards.map((card) => (
          <article key={card.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="inline-flex rounded-2xl bg-slate-100 p-3 text-slate-800">
              <Icon name={card.title === "Source Grounding" ? "source" : card.title === "Auditability" ? "audit" : card.title === "Evidence Classification" ? "layers" : card.title === "Contradiction Detection" ? "network" : "governance"} />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-950">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.copy}</p>
          </article>
        ))}
      </div>

      <section className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Evidence classification</p>
        <div className="mt-5 grid gap-4 md:grid-cols-4">
          {evidenceClasses.map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-12 rounded-3xl border border-teal-100 bg-teal-50 p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal-700">Positioning line</p>
        <p className="mx-auto mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-teal-950">
          EvidaraOS makes the evidence pathway visible — from user question, to source retrieval, to agent reasoning, to governed output.
        </p>
      </div>
    </div>
  );
}
