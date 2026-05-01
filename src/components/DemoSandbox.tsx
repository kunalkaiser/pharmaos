"use client";

import { useMemo, useState } from "react";
import { accentStyles, cx } from "./DetailPanel";

const functions = ["HEOR", "Medical Affairs", "Clinical Development", "R&D", "Regulatory", "Portfolio Strategy"];
const queryTypes = ["Disease burden", "Trial landscape", "Safety context", "Payer evidence", "Repurposing rationale"];

const workflowMap: Record<string, { chains: string[]; sources: string[]; governance: string[]; output: string }> = {
  "Disease burden": {
    chains: ["Chain D", "Chain P"],
    sources: ["EpiEngine inputs", "Literature", "Registries / RWE context", "Comparator sources"],
    governance: ["Evidence classification", "Assumption labeling", "Source provenance"],
    output: "Disease burden and indication-priority brief",
  },
  "Trial landscape": {
    chains: ["Chain B", "Chain D"],
    sources: ["ClinicalTrials.gov", "PubMed", "Endpoint context", "Biomarker sources"],
    governance: ["Eligibility caveats", "Trial status provenance", "Human review"],
    output: "Trial landscape and feasibility signal summary",
  },
  "Safety context": {
    chains: ["Chain C", "Chain A"],
    sources: ["FDA labels", "FAERS-oriented context", "PubMed", "Class-effect literature"],
    governance: ["Association vs causation guardrail", "Contradiction detection", "Review before export"],
    output: "Safety narrative and label-context packet",
  },
  "Payer evidence": {
    chains: ["Chain P", "Chain D"],
    sources: ["Burden sources", "Comparator context", "Published HEOR/RWE", "Guideline context"],
    governance: ["Scenario projection labels", "Assumption register", "Source traceability"],
    output: "Payer question and value-evidence gap map",
  },
  "Repurposing rationale": {
    chains: ["Chain R", "Chain A", "Chain D"],
    sources: ["OpenTargets", "ChEMBL", "PubMed", "Trials", "Safety sources"],
    governance: ["Causal hypothesis labeling", "Validation need flags", "Residual risk summary"],
    output: "Repurposing rationale and validation-needs brief",
  },
};

export function DemoSandbox() {
  const [selectedFunction, setSelectedFunction] = useState(functions[0]);
  const [selectedType, setSelectedType] = useState(queryTypes[0]);
  const workflow = useMemo(() => workflowMap[selectedType], [selectedType]);

  return (
    <section className="rounded-[2rem] border border-slate-300 bg-white p-6 shadow-xl">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Workflow preview</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">Select a buyer context</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This workflow preview is illustrative only. Demo requests submit through the form above; this preview does not run backend retrieval.
          </p>

          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-950">Function</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {functions.map((item) => (
                <button
                  key={item}
                  onClick={() => setSelectedFunction(item)}
                  className={cx(
                    "rounded-full border px-3 py-2 text-xs font-semibold transition",
                    selectedFunction === item ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-950">Query type</p>
            <div className="mt-3 grid gap-2">
              {queryTypes.map((item) => (
                <button
                  key={item}
                  onClick={() => setSelectedType(item)}
                  className={cx(
                    "rounded-2xl border p-3 text-left text-sm font-semibold transition",
                    selectedType === item ? "border-teal-300 bg-teal-50 text-teal-950" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                  )}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Illustrative activation</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">{selectedFunction}: {selectedType}</h3>
            </div>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${accentStyles.teal}`}>Preview only</span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <PreviewBlock title="Chains" items={workflow.chains} />
            <PreviewBlock title="Sources" items={workflow.sources} />
            <PreviewBlock title="Governance checks" items={workflow.governance} />
            <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5">
              <p className="text-sm font-semibold text-orange-950">Expected output</p>
              <p className="mt-2 text-sm leading-6 text-orange-900">{workflow.output}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
