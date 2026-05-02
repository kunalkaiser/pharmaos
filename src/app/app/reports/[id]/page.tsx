import { WorkspaceBoundaryNotice } from "@/components/WorkspaceBoundaryNotice";
import { getReviewedEvidencePacketReport } from "@/lib/evidence-foundation";

export const dynamic = "force-dynamic";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReviewedEvidencePacketReport(id);

  return (
    <>
      <WorkspaceBoundaryNotice
        boundary="product"
        title="Internal report preview: reviewed evidence only"
        services={["reviewed evidence records", "citation appendix", "limitations", "methodology", "audit/version metadata"]}
      />

      {!report ? (
        <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Empty state / no report data</p>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">No reviewed evidence packet found for {id}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            This page does not render fake report sections. A report preview appears only after a real evidence packet has reviewed citations and evidence records.
          </p>
        </section>
      ) : (
        <section className="mt-6 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Draft internal preview</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">{report.packet.title}</h2>
            <dl className="mt-5 grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <dt className="font-semibold text-slate-500">Indication</dt>
                <dd className="mt-1 text-slate-950">{report.packet.diseaseOrIndication}</dd>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <dt className="font-semibold text-slate-500">Geography</dt>
                <dd className="mt-1 text-slate-950">{report.packet.geography}</dd>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <dt className="font-semibold text-slate-500">Status</dt>
                <dd className="mt-1 text-slate-950">{report.packet.status}</dd>
              </div>
            </dl>
            <p className="mt-5 text-sm leading-6 text-slate-600">
              Executive summary generation is not implemented. This preview contains reviewed evidence records and source appendix only.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Reviewed Evidence Records</h3>
            {report.evidenceRecords.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-slate-600">No reviewed evidence records are available for this packet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {report.evidenceRecords.map((record) => (
                  <article key={record.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{record.recordType}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-800">{record.claimText}</p>
                    {record.limitationNotes ? <p className="mt-2 text-xs leading-5 text-slate-500">Limitation: {record.limitationNotes}</p> : null}
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">Source Appendix</h3>
            {report.sources.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-slate-600">No reviewed sources are attached yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {report.sources.map((source) => (
                  <article key={source.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <a href={source.url} className="font-semibold text-teal-700 hover:text-teal-900" target="_blank" rel="noreferrer">
                      {source.title}
                    </a>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {source.sourceType} {source.pmid ? `| PMID ${source.pmid}` : ""} {source.nctId ? `| ${source.nctId}` : ""} | Accessed {source.accessDate}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-900">
            PDF export is not implemented. This preview should not be treated as a final report or regulatory/medical advice.
          </div>
        </section>
      )}
    </>
  );
}
