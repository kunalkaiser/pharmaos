import { AgentEcosystem } from "@/components/AgentEcosystem";
import { SectionHeading } from "@/components/SectionHeading";
import { TrustBoundary } from "@/components/TrustBoundary";

export default function AgentsPage() {
  return (
    <main className="bg-white px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Agent ecosystem"
          title="A transparent operating model"
          subtitle="EvidenceOS agents are shown as coordinated evidence workstreams around the orchestrator, not as opaque AI personas."
        />
        <div className="mt-12">
          <AgentEcosystem />
        </div>
        <div className="mt-8">
          <TrustBoundary
            copy="The agent ecosystem is an inspectable operating model. Backend agent execution, shared context persistence, and audit logging are not present in this repository."
            href="/security-trust"
            linkLabel="Review trust model"
          />
        </div>
      </div>
    </main>
  );
}
