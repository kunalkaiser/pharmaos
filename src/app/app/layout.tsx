import { WorkspaceShell } from "@/components/WorkspaceShell";
import type { ReactNode } from "react";

const productLinks = [
  { href: "/app", label: "Workspace" },
  { href: "/app/evidence-packets", label: "Evidence Packets" },
  { href: "/app/review-queue", label: "Review Queue" },
  { href: "/app/sources", label: "Sources" },
  { href: "/app/reports/placeholder", label: "Reports" },
  { href: "/app/audit-log", label: "Audit Log" },
];

export default function ProductWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceShell
      title="EvidaraOS Product Workspace"
      eyebrow="Auth required in future"
      description="Future authenticated workspace for evidence packets, source review, report previews, and audit visibility."
      links={productLinks}
    >
      {children}
    </WorkspaceShell>
  );
}
