import { WorkspaceBoundaryNotice } from "@/components/WorkspaceBoundaryNotice";
import { ReviewQueueActions } from "@/components/ReviewQueueActions";
import { listQueryRuns, getQueryRunAuditTrail } from "@/lib/query-audit";
import type { EvidenceCandidate } from "@/lib/connectors/types";

export const dynamic = "force-dynamic";

function snapshotCandidates(trail: Awaited<ReturnType<typeof getQueryRunAuditTrail>>) {
  if (!trail) return new Map<string, EvidenceCandidate>();
  const candidates = new Map<string, EvidenceCandidate>();
  for (const snapshot of trail.snapshots) {
    const value = snapshot.snapshotJson.evidenceCandidates;
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      if (item && typeof item === "object" && "candidateId" in item && typeof item.candidateId === "string") {
        candidates.set(item.candidateId, item as EvidenceCandidate);
      }
    }
  }
  return candidates;
}

export default async function ReviewQueuePage() {
  const runs = (await listQueryRuns()).slice(0, 20);
  const trails = await Promise.all(runs.map((run) => getQueryRunAuditTrail(run.id)));
  const candidates = trails.flatMap((trail) =>
    trail
      ? trail.candidateEvents.map((candidate) => {
          const fullCandidates = snapshotCandidates(trail);
          return {
            ...candidate,
            queryRun: trail.queryRun,
            candidate: fullCandidates.get(candidate.candidateId),
          };
        })
      : [],
  );

  return (
    <>
      <WorkspaceBoundaryNotice
        boundary="product"
        title="Internal review queue: real candidates only"
        services={["authenticated reviewer identity", "tenant-scoped query audit persistence", "promotion/rejection workflow", "review audit events"]}
      />

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Candidate review queue</p>
        <h2 className="mt-3 text-xl font-semibold text-slate-950">Retrieved evidence candidates awaiting review</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          This page reads real query audit candidate events only. It does not show seeded evidence, does not generate claims, and does not promote or reject candidates automatically.
        </p>

        {candidates.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
            <h3 className="text-base font-semibold text-slate-950">No real candidates are queued</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Run a protected internal connector search to create real candidate events. Empty state is intentional; no fake review rows are rendered.
            </p>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Query Run</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Review action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {candidates.map((candidate) => (
                  <tr key={candidate.id}>
                    <td className="px-4 py-4 align-top">
                      <p className="font-semibold text-slate-950">{candidate.sourceProvider}</p>
                      <p className="mt-1 text-xs text-slate-500">{candidate.sourceIdentifier ?? "No source identifier provided"}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <a href={candidate.sourceUrl} className="font-semibold text-teal-700 hover:text-teal-900" target="_blank" rel="noreferrer">
                        {candidate.sourceTitle}
                      </a>
                      <p className="mt-1 text-xs text-slate-500">generatedClaim=false</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="font-mono text-xs text-slate-700">{candidate.queryRun.id}</p>
                      <p className="mt-1 text-xs text-slate-500">{candidate.queryRun.normalizedQuery}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                        {candidate.promotionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <ReviewQueueActions candidate={candidate.candidate} queryRunId={candidate.queryRun.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
