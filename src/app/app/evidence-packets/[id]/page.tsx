import { WorkspaceBoundaryNotice } from "@/components/WorkspaceBoundaryNotice";
import { BoundaryEmptyState } from "@/components/WorkspaceShell";

export default async function EvidencePacketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <WorkspaceBoundaryNotice
        boundary="product"
        title="Evidence packet detail boundary: backend required"
        services={["packet persistence", "citation storage", "source retrieval status", "review workflow", "report preview generation"]}
      />
      <BoundaryEmptyState
        title={`Evidence packet route scaffold: ${id}`}
        copy="This dynamic route is reserved for a real packet detail view. It does not fetch packet data, citations, scoring results, reports, or audit events yet."
        items={[
          "Future state: disease overview, incidence/prevalence, population notes, trial landscape, treatment landscape, and unmet need.",
          "Future state: each evidence claim links to stored citation and source metadata.",
          "Future state: limitations, confidence labels, and review status are shown before export.",
        ]}
      />
    </>
  );
}
