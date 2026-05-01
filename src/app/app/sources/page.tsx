import { WorkspaceBoundaryNotice } from "@/components/WorkspaceBoundaryNotice";
import { BoundaryEmptyState } from "@/components/WorkspaceShell";

export default function ProductSourcesPage() {
  return (
    <>
      <WorkspaceBoundaryNotice
        boundary="product"
        services={["source database", "citation/provenance service", "source review permissions", "retrieval-run linkage"]}
      />
      <BoundaryEmptyState
        title="Source review will require authenticated backend data"
        copy="This route is reserved for users to inspect sources attached to evidence packets. It does not show seeded or mock citation data on the public frontend."
        items={[
          "Future state: PMID, NCT ID, FDA identifier, source URL, access date, and source title.",
          "Future state: provenance and confidence labels for extracted evidence.",
          "Future state: source filters scoped to an authenticated organization.",
        ]}
      />
    </>
  );
}
