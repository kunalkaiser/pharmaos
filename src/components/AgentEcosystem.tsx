"use client";

import { useState } from "react";
import { agentClusters } from "@/lib/evidara-content";
import { DetailPanel, accentStyles, cx } from "./DetailPanel";
import { Icon } from "./Icon";

export function AgentEcosystem() {
  const [activeId, setActiveId] = useState(agentClusters[0].id);
  const activeCluster = agentClusters.find((cluster) => cluster.id === activeId) ?? agentClusters[0];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mx-auto flex max-w-sm items-center justify-center rounded-3xl border border-slate-200 bg-slate-950 p-6 text-center text-white shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-200">Central node</p>
            <p className="mt-2 text-xl font-semibold">EvidenceOS Orchestrator</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {agentClusters.map((cluster) => {
            const active = cluster.id === activeId;
            return (
              <button
                key={cluster.id}
                onMouseEnter={() => setActiveId(cluster.id)}
                onFocus={() => setActiveId(cluster.id)}
                onClick={() => setActiveId(cluster.id)}
                className={cx("rounded-3xl border p-5 text-left transition", active ? "border-slate-300 bg-white shadow-md" : `${accentStyles[cluster.accent]} hover:bg-white`)}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/75">
                  <Icon name={cluster.id === "governance" ? "governance" : cluster.id === "retrieval" ? "database" : cluster.id === "epi" ? "target" : "network"} />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-950">{cluster.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{cluster.role}</p>
              </button>
            );
          })}
        </div>
        <div className="mt-5 rounded-3xl border border-violet-100 bg-violet-50 p-5 text-center">
          <p className="text-sm font-semibold text-violet-950">Shared Context Layer: wiki.read() / wiki.write()</p>
          <p className="mt-2 text-sm text-violet-900">Supports continuity, contradiction detection, and evidence versioning across a session.</p>
        </div>
      </div>
      <DetailPanel
        eyebrow="Selected agent cluster"
        title={activeCluster.title}
        description={`${activeCluster.role} This transparent operating model shows what the system is doing without framing agents as autonomous bots.`}
        details={activeCluster.examples}
        trust="Agent activity is represented as inspectable evidence work: retrieve, inspect, synthesize, classify, and govern."
      />
    </div>
  );
}
