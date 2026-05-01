import { ChainExplorer } from "@/components/ChainExplorer";
import { SectionHeading } from "@/components/SectionHeading";
import { TrustBoundary } from "@/components/TrustBoundary";

export default function ChainsPage() {
  return (
    <main className="bg-white px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Evidence chain explorer"
          title="Dynamic evidence chains for pharma work"
          subtitle="Each chain packages a different reasoning pathway and can collaborate with other chains based on the user question."
        />
        <div className="mt-12">
          <ChainExplorer />
        </div>
        <div className="mt-8">
          <TrustBoundary
            copy="Chain activation is shown as product logic. This page does not execute live EvidenceOS chains or retrieve source data in the current frontend-only repository."
            href="/evidence-engine"
            linkLabel="Review Evidence Engine"
          />
        </div>
      </div>
    </main>
  );
}
