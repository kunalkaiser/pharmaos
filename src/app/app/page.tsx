import { WorkspaceBoundaryNotice } from "@/components/WorkspaceBoundaryNotice";
import { BoundaryEmptyState } from "@/components/WorkspaceShell";

export default function ProductWorkspacePage() {
  return (
    <>
      <WorkspaceBoundaryNotice boundary="product" />
      <BoundaryEmptyState
        title="Workspace overview"
        copy="This page will summarize tenant-scoped evidence packet activity after a verified query, review, report, or scoring workflow has been run."
        items={[
          "No fake workspace data is displayed.",
          "Run a real internal query/review workflow to populate this workspace.",
          "Next runtime step: verify real connector search, query audit events, review queue activity, report preview, PDF export, and EpiEngine scoring.",
        ]}
      />
    </>
  );
}
