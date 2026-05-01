"use client";

import { useState } from "react";
import { chains } from "@/lib/evidara-content";
import { accentStyles, cx } from "./DetailPanel";

export function ChainExplorer() {
  const [activeId, setActiveId] = useState(chains[0].id);
  const activeChain = chains.find((chain) => chain.id === activeId) ?? chains[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
      <div>
        <div className="rounded-3xl border border-teal-100 bg-teal-50 p-5 text-sm leading-6 text-teal-950">
          Chains are dynamic and can work together. EvidaraOS activates the evidence pathways needed for the question rather than forcing every query through a rigid pipeline.
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {chains.map((chain) => {
            const active = chain.id === activeId;
            return (
              <button
                key={chain.id}
                onClick={() => setActiveId(chain.id)}
                className={cx("rounded-3xl border p-5 text-left transition", active ? "border-slate-300 bg-white shadow-lg shadow-slate-200/80" : `${accentStyles[chain.accent]} hover:bg-white`)}
              >
                <p className="text-sm font-bold">{chain.title}</p>
                <p className="mt-3 text-sm font-semibold text-slate-950">{chain.subtitle}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{chain.purpose}</p>
              </button>
            );
          })}
        </div>
      </div>

      <aside className="animate-fade-in rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Selected chain</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">{activeChain.title}: {activeChain.subtitle}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <InfoBlock title="What it does" copy={activeChain.purpose} />
          <InfoBlock title="When it activates" copy={activeChain.activatesWhen} />
          <TagBlock title="Typical users" items={activeChain.users} />
          <TagBlock title="Typical outputs" items={activeChain.outputs} />
        </div>
      </aside>
    </div>
  );
}

function InfoBlock({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-5">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
    </div>
  );
}

function TagBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-3xl bg-slate-50 p-5">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">{item}</span>
        ))}
      </div>
    </div>
  );
}
