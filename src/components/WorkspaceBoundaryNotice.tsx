type WorkspaceBoundaryNoticeProps = {
  boundary: "product" | "admin";
  title?: string;
  services?: string[];
};

const defaultServices = [
  "authentication and role-based access",
  "live evidence retrieval",
  "citation-backed packet generation",
  "EpiEngine scoring",
  "report export",
  "audit-log enforcement",
];

export function WorkspaceBoundaryNotice({ boundary, title, services = defaultServices }: WorkspaceBoundaryNoticeProps) {
  const label = boundary === "admin" ? "Internal admin boundary" : "Authenticated product boundary";

  if (boundary === "product") {
    return (
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Start here</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">{title ?? "Build a review-ready evidence workspace"}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              EvidaraOS helps evidence teams draft protocols, retrieve and triage sources, inspect full-text availability, create candidate reports, and preserve audit-ready review handoffs.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["Create a protocol", "Run an analysis", "Inspect sources", "Chat with evidence", "Review report quality"].map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-950">Preview status</p>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Outputs are draft, candidate-only, and require human expert review before clinical, payer, regulatory, or commercial use.
            </p>
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">Runtime boundaries</summary>
              <div className="mt-3 grid gap-2">
                {services.map((service) => (
                  <div key={service} className="rounded-xl border border-amber-200 bg-white/80 px-3 py-2 text-xs leading-5 text-amber-950">
                    Foundation active; production verification required: {service}
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-orange-200 bg-orange-50 p-5 text-orange-950">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">{label}</p>
      <h2 className="mt-2 text-lg font-semibold">{title ?? "Private runtime access is active"}</h2>
      <p className="mt-3 text-sm leading-6 text-orange-900">
        This route establishes the future EvidaraOS product architecture boundary. It does not perform live evidence retrieval,
        scoring, report generation, audit-log enforcement, admin operations, or authenticated product actions from this frontend-only repo.
      </p>
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {services.map((service) => (
          <div key={service} className="rounded-xl border border-orange-200 bg-white/70 px-3 py-2 text-sm">
            Implemented foundation / runtime verification required: {service}
          </div>
        ))}
      </div>
    </section>
  );
}
