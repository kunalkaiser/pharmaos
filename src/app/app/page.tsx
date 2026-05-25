import { WorkspaceBoundaryNotice } from "@/components/WorkspaceBoundaryNotice";
import { EvidenceEngineConsole } from "@/components/EvidenceEngineConsole";

export default function ProductWorkspacePage() {
  return (
    <>
      <WorkspaceBoundaryNotice boundary="product" />
      <EvidenceEngineConsole />
    </>
  );
}
