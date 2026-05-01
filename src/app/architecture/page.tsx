import { ArchitectureExplorer } from "@/components/ArchitectureExplorer";
import { SectionHeading } from "@/components/SectionHeading";
import { TrustBoundary } from "@/components/TrustBoundary";

export default function ArchitecturePage() {
  return (
    <main className="bg-[#f6f8fb] px-5 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-[1500px]">
        <SectionHeading
          eyebrow="EvidaraOS architecture"
          title="A clickable white-box architecture"
          subtitle="Explore the full operating model: request interface, EpiEngine scoring, source retrieval, evidence chains, classification, governance, and function-specific outputs."
        />
        <div className="mt-8">
          <ArchitectureExplorer />
        </div>
        <div className="mt-8">
          <TrustBoundary copy="This architecture is an interactive product model. The current repository does not include live retrieval, scoring, auth, citation storage, or audit-log services, so implementation-specific claims should be validated before enterprise use." />
        </div>
      </div>
    </main>
  );
}
