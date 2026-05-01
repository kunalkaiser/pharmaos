import { GovernanceTrust } from "@/components/GovernanceTrust";
import { SectionHeading } from "@/components/SectionHeading";
import { TrustBoundary } from "@/components/TrustBoundary";

export default function GovernancePage() {
  return (
    <main className="bg-white px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Governance and trust"
          title="Designed for accountable evidence work"
          subtitle="EvidaraOS is designed to preserve provenance, uncertainty, claim classification, and reviewability across the evidence pathway once production workflow services are implemented."
        />
        <div className="mt-12">
          <GovernanceTrust />
        </div>
        <div className="mt-8">
          <TrustBoundary
            copy="Governance controls are represented as product requirements and trust principles. Production enforcement requires backend workflow, audit, review, and access-control services."
            href="/security-trust"
            linkLabel="Open Security / Trust"
          />
        </div>
      </div>
    </main>
  );
}
