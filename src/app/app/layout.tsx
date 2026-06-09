import { WorkspaceShell } from "@/components/WorkspaceShell";
import type { ReactNode } from "react";

const productLinks = [
  { href: "/app", label: "Start" },
  { href: "/app/chat", label: "Evidence Chat" },
  { href: "/app/competitive-intel", label: "Competitive Intel" },
  { href: "/app/review-queue", label: "Review Queue" },
  { href: "/app/sources", label: "Sources" },
  { href: "/app/reports/placeholder", label: "Reports" },
  { href: "/app/audit-log", label: "Audit" },
  { href: "/app/tools", label: "Tools" },
];

export default function ProductWorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <WorkspaceShell
      title="EvidaraOS Product Workspace"
      eyebrow="Preview workspace"
      description="Create evidence protocols, run governed analysis chains, chat with source material, and prepare review-ready report drafts."
      links={productLinks}
    >
      {children}
    </WorkspaceShell>
  );
}
