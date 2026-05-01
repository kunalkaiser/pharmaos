import { WorkspaceBoundaryNotice } from "@/components/WorkspaceBoundaryNotice";
import { BoundaryEmptyState } from "@/components/WorkspaceShell";

export default function AdminOverviewPage() {
  return (
    <>
      <WorkspaceBoundaryNotice boundary="admin" />
      <BoundaryEmptyState
        title="Future internal operations overview"
        copy="This admin route family is scaffolded for internal use only. It is not connected to admin authentication, operational data, or backend actions yet."
        items={[
          "No demo lead review is performed here yet.",
          "No retrieval runs or source ingestion jobs are running here yet.",
          "Future state: operational status, admin review queues, source health, and audit oversight.",
        ]}
      />
    </>
  );
}
