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
