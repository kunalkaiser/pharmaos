import { WorkspaceBoundaryNotice } from "@/components/WorkspaceBoundaryNotice";
import { BoundaryEmptyState } from "@/components/WorkspaceShell";

export default function ProductWorkspacePage() {
  return (
    <>
      <WorkspaceBoundaryNotice boundary="product" />
      <BoundaryEmptyState
        title="Future workspace overview"
        copy="This page will summarize authenticated evidence packet activity once backend services, auth, and tenant boundaries exist."
        items={[
          "No workspace data is loaded from this frontend-only repo.",
          "No evidence workflows are running from this page.",
          "Future state: packet status, recent reports, review tasks, and source activity.",
        ]}
      />
    </>
  );
}
