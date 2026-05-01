import { WorkspaceBoundaryNotice } from "@/components/WorkspaceBoundaryNotice";
import { BoundaryEmptyState } from "@/components/WorkspaceShell";

export default function AdminSourcesPage() {
  return (
    <>
      <WorkspaceBoundaryNotice
        boundary="admin"
        services={["source ingestion service", "admin source review", "citation normalization", "provenance quality checks"]}
      />
      <BoundaryEmptyState
        title="Source management will be admin-only"
        copy="This route reserves the internal source management surface. It does not expose seeded citations, source records, or ingestion controls yet."
        items={[
          "Future state: inspect PubMed, ClinicalTrials.gov, FDA, and other approved sources.",
          "Future state: approve or reject extracted source metadata.",
          "Future state: track source identifiers, access dates, and provenance quality.",
        ]}
      />
    </>
  );
}
