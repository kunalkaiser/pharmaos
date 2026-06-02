import Link from "next/link";
import { AgentEcosystem } from "@/components/AgentEcosystem";
import { ChainExplorer } from "@/components/ChainExplorer";
import { SectionHeading } from "@/components/SectionHeading";

export default function EvidenceEnginePage() {
  return (
    <main className="bg-white px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Evidence Engine"
          title="EvidenceOS reasoning made inspectable"
          subtitle="EvidenceOS is the multi-agent biomedical reasoning engine inside EvidaraOS. This page shows the agent clusters and evidence chains without presenting them as autonomous black-box bots."
        />

        <section className="mt-12">
          <AgentEcosystem />
        </section>

        <section className="mt-16 border-t border-slate-200 pt-16">
          <ChainExplorer />
        </section>

        <div className="mt-12 rounded-3xl border border-teal-100 bg-teal-50 p-6">
          <p className="text-sm font-semibold text-teal-950">Current implementation note</p>
          <p className="mt-2 text-sm leading-6 text-teal-900">
            The protected workspace now calls the private Python Evidence Engine for candidate-only analysis workflows, source-linked records, manual PDF extraction, document chat, and report export. Human review remains required before any medical, payer, regulatory, or enterprise use.
          </p>
          <Link href="/architecture" className="mt-5 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            View live architecture status
          </Link>
        </div>
      </div>
    </main>
  );
}
