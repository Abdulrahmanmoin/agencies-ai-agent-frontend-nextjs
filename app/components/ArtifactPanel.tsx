"use client";

import { useState } from "react";
import type { Artifact } from "../lib/api";
import Markdown from "./Markdown";

function Card({ artifact }: { artifact: Artifact }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="overflow-hidden rounded-xl border border-powder bg-white shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 bg-powder-soft px-4 py-2.5 text-left"
      >
        <span className="text-sm font-semibold text-navy">{artifact.title}</span>
        <span className="text-navy/60 text-xs">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="px-4 py-3">
          <Markdown>{artifact.markdown}</Markdown>
        </div>
      )}
    </div>
  );
}

export default function ArtifactPanel({ artifacts }: { artifacts: Artifact[] }) {
  return (
    <aside className="flex h-full w-full flex-col border-l border-powder bg-powder-bg">
      <div className="border-b border-powder px-5 py-4">
        <h2 className="text-sm font-bold tracking-wide text-navy uppercase">Artifacts</h2>
        <p className="mt-0.5 text-xs text-slate-500">Outputs produced by the agents</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {artifacts.length === 0 ? (
          <div className="mt-10 px-2 text-center text-sm text-slate-400">
            Nothing yet. Ask for a plan, proposal, requirements, tasks, or risks and they’ll
            appear here.
          </div>
        ) : (
          artifacts.map((a) => <Card key={a.agent} artifact={a} />)
        )}
      </div>
    </aside>
  );
}
