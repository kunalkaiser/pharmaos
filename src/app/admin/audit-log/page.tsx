import { WorkspaceBoundaryNotice } from "@/components/WorkspaceBoundaryNotice";
import { BoundaryEmptyState } from "@/components/WorkspaceShell";

export default function AdminAuditLogPage() {
  return (
    <>
      <WorkspaceBoundaryNotice
        boundary="admin"
        services={["admin authentication", "append-only audit storage", "tenant and entity filters", "export and review controls"]}
      />
      <BoundaryEmptyState
        title="Admin audit log requires backend enforcement"
        copy="This route is reserved for internal audit oversight. It does not display fake events. Internal connector query runs can be audited through protected APIs, but this scaffold is not production audit enforcement."
        items={[
          "Current foundation: protected query-run audit APIs can return real internal connector events when searches occur.",
          "Future state: material evidence actions across packets, retrieval, citations, scoring, reviews, and exports.",
          "Future state: admin filters by actor, entity, event type, and date.",
          "Future state: immutable backend log storage and operational access controls.",
        ]}
      />
    </>
  );
}
