import { QueryJourney } from "@/components/QueryJourney";
import { SectionHeading } from "@/components/SectionHeading";
import { TrustBoundary } from "@/components/TrustBoundary";

export default function QueryJourneyPage() {
  return (
    <main className="bg-white px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Example query journey"
          title="From one question to governed evidence"
          subtitle="Click through the stepper to see how EvidaraOS evaluates a representative pharma question."
        />
        <div className="mt-12">
          <QueryJourney />
        </div>
        <div className="mt-8">
          <TrustBoundary
            copy="This query journey is an illustrative workflow preview. It does not run live evidence retrieval or generate a report until backend orchestration is connected."
            href="/demo"
            linkLabel="Try workflow preview"
          />
        </div>
      </div>
    </main>
  );
}
