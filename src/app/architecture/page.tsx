import { ArchitectureExplorer } from "@/components/ArchitectureExplorer";
import { SectionHeading } from "@/components/SectionHeading";
import { TrustBoundary } from "@/components/TrustBoundary";

export default function ArchitecturePage() {
  return (
    <main className="bg-[#f6f8fb] px-5 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-[1500px]">
        <SectionHeading
          eyebrow="EvidaraOS architecture"
          title="Live status of the white-box architecture"
          subtitle="Explore what is live, what is partially wired, and what remains planned across request intake, EpiEngine scoring, source retrieval, evidence chains, governance, and function-specific outputs."
        />
        <div className="mt-8">
          <ArchitectureExplorer />
        </div>
        <div className="mt-8">
          <TrustBoundary copy="This page is a product-status map, not a certification claim. Live modules still produce candidate-only evidence until reviewed; partial and planned modules must not be represented as validated enterprise controls." />
        </div>
      </div>
    </main>
  );
}
