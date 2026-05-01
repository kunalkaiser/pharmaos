import { GovernanceTrust } from "@/components/GovernanceTrust";
import { SectionHeading } from "@/components/SectionHeading";

export default function SecurityTrustPage() {
  return (
    <main className="bg-white px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Security and trust"
          title="Governance principles for accountable evidence work"
          subtitle="EvidaraOS must reduce buyer risk by showing provenance, limitations, review requirements, and auditability. Current controls are represented as product principles unless connected to backend workflow services."
        />
        <div className="mt-12">
          <GovernanceTrust />
        </div>
      </div>
    </main>
  );
}
