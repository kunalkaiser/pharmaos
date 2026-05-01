import { WorkspaceBoundaryNotice } from "@/components/WorkspaceBoundaryNotice";
import { BoundaryEmptyState } from "@/components/WorkspaceShell";

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <>
      <WorkspaceBoundaryNotice
        boundary="product"
        title="Report route boundary: export backend required"
        services={["report preview service", "PDF export service", "source appendix generation", "versioning", "review gate"]}
      />
      <BoundaryEmptyState
        title={`Report route scaffold: ${id}`}
        copy="This route establishes where authenticated report previews will live. It does not generate reports, export files, or present sample content as a finished deliverable."
        items={[
          "Future state: report preview generated from stored evidence packet records.",
          "Future state: PDF export with methodology, limitations, and source appendix.",
          "Future state: export event captured in the audit log.",
        ]}
      />
    </>
  );
}
