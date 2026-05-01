import { WorkspaceBoundaryNotice } from "@/components/WorkspaceBoundaryNotice";
import { BoundaryEmptyState } from "@/components/WorkspaceShell";

export default function AdminRetrievalRunsPage() {
  return (
    <>
      <WorkspaceBoundaryNotice
        boundary="admin"
        services={["retrieval worker service", "run status persistence", "source adapter monitoring", "failure and retry handling"]}
      />
      <BoundaryEmptyState
        title="Retrieval run monitoring requires live backend workers"
        copy="This route is reserved for future operational monitoring. It does not start retrieval, display fake run history, or imply retrieval is currently active."
        items={[
          "Future state: queued, running, completed, failed, and cancelled retrieval runs.",
          "Future state: source-level errors and retry status.",
          "Future state: traceability from retrieval run to evidence packet and citations.",
        ]}
      />
    </>
  );
}
