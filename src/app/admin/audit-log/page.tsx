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
        copy="This route is reserved for internal audit oversight. It does not display fake events or imply that frontend-only activity is compliant audit logging."
        items={[
          "Future state: material evidence actions across packets, retrieval, citations, scoring, reviews, and exports.",
          "Future state: admin filters by actor, entity, event type, and date.",
          "Future state: immutable backend log storage and operational access controls.",
        ]}
      />
    </>
  );
}
