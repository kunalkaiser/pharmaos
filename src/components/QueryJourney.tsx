"use client";

import { useState } from "react";
import { chains, journeySteps } from "@/lib/evidara-content";
import { DetailPanel, accentStyles, cx } from "./DetailPanel";
import { Icon } from "./Icon";

const activeChainIds = ["R", "A", "D", "P"];

export function QueryJourney() {
  const [activeId, setActiveId] = useState(journeySteps[0].id);
  const activeStep = journeySteps.find((step) => step.id === activeId) ?? journeySteps[0];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:flex-row md:items-center">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm">
          <Icon name="ask" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Example query</p>
          <p className="mt-1 text-lg font-semibold text-slate-950">Evaluate semaglutide for obstructive sleep apnea.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4 xl:grid-cols-8">
        {journeySteps.map((step, index) => {
          const active = step.id === activeId;
          return (
            <button
              key={step.id}
              onClick={() => setActiveId(step.id)}
              className={cx("rounded-2xl border p-3 text-left transition", active ? "border-teal-300 bg-teal-50 shadow-sm" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50")}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={cx("flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold", active ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-500")}>{index + 1}</span>
                {index < journeySteps.length - 1 ? <Icon name="arrow" className="hidden h-4 w-4 text-slate-300 xl:block" /> : null}
              </div>
              <p className={cx("mt-3 text-sm font-semibold", active ? "text-teal-950" : "text-slate-800")}>{step.label}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <DetailPanel eyebrow="Selected journey step" title={activeStep.title} description={activeStep.description} details={activeStep.details} trust="The reasoning pathway remains visible rather than hidden behind a single generated answer." />
        <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Likely chain activation</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {chains.filter((chain) => activeChainIds.includes(chain.id)).map((chain) => (
              <div key={chain.id} className={cx("rounded-2xl border p-4", accentStyles[chain.accent], chain.id === "P" && "border-dashed opacity-80")}>
                <p className="text-sm font-bold">{chain.title}</p>
                <p className="mt-1 text-xs leading-5">{chain.subtitle}</p>
                {chain.id === "P" ? <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.16em]">Optional</p> : null}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">Chains may activate together when a question spans biology, evidence, burden, value, and strategy.</p>
        </aside>
      </div>
    </div>
  );
}
