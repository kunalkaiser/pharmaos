import { WorkspaceBoundaryNotice } from "@/components/WorkspaceBoundaryNotice";
import { BoundaryEmptyState } from "@/components/WorkspaceShell";

export default function AdminDemoRequestsPage() {
  return (
    <>
      <WorkspaceBoundaryNotice
        boundary="admin"
        services={["admin authentication", "demo request database access", "lead review workflow", "email or CRM integration"]}
      />
      <BoundaryEmptyState
        title="Demo request review is not connected here yet"
        copy="The public demo endpoint can persist requests, but this admin route does not read or display those records yet. No fake leads are shown."
        items={[
          "Future state: view real submitted demo requests.",
          "Future state: mark leads as reviewed, contacted, or closed.",
          "Future state: export or sync CRM-ready lead fields after product decision.",
        ]}
      />
    </>
  );
}
