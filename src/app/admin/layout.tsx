import { WorkspaceShell } from "@/components/WorkspaceShell";
import type { ReactNode } from "react";

const adminLinks = [
  { href: "/admin", label: "Admin Overview" },
  { href: "/admin/demo-requests", label: "Demo Requests" },
  { href: "/admin/retrieval-runs", label: "Retrieval Runs" },
  { href: "/admin/sources", label: "Sources" },
  { href: "/admin/audit-log", label: "Audit Log" },
];

export default function AdminWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceShell
      title="EvidaraOS Admin Workspace"
      eyebrow="Admin required in future"
      description="Future internal workspace for lead review, source operations, retrieval monitoring, and audit oversight."
      links={adminLinks}
    >
      {children}
    </WorkspaceShell>
  );
}
