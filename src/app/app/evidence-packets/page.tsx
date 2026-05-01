import { WorkspaceBoundaryNotice } from "@/components/WorkspaceBoundaryNotice";
import { BoundaryEmptyState } from "@/components/WorkspaceShell";

export default function EvidencePacketsPage() {
  return (
    <>
      <WorkspaceBoundaryNotice
        boundary="product"
        services={["authentication", "evidence packet database", "citation/provenance services", "retrieval workflow orchestration"]}
      />
      <BoundaryEmptyState
        title="Evidence packets will appear here after backend implementation"
        copy="This scaffold reserves the product surface for real disease burden and indication evidence packets. It does not display mock packets or placeholder evidence."
        items={[
          "Future state: create evidence packet from disease or indication.",
          "Future state: review citation-backed sections and provenance labels.",
          "Future state: track retrieval, scoring, review, and report readiness.",
        ]}
      />
    </>
  );
}
