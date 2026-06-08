"use client";

import { useState } from "react";
import { downloadUrl, type Artifact } from "../lib/api";
import Markdown from "./Markdown";

function Card({ artifact, conversationId }: { artifact: Artifact; conversationId: string | null }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="overflow-hidden rounded-xl border border-powder bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 bg-powder-soft px-4 py-2.5">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <span className="text-navy/60 text-xs">{open ? "▾" : "▸"}</span>
          <span className="text-sm font-semibold text-navy">{artifact.title}</span>
        </button>
        {conversationId && (
          <div className="flex shrink-0 items-center gap-1">
            <a
              href={downloadUrl(conversationId, artifact.agent, "docx")}
              className="rounded-md border border-navy/20 bg-white px-2 py-1 text-[11px] font-semibold text-navy transition hover:bg-navy hover:text-white"
              title={`Download ${artifact.title} as Word (.docx)`}
            >
              DOCX
            </a>
            <a
              href={downloadUrl(conversationId, artifact.agent, "pdf")}
              className="rounded-md border border-navy/20 bg-white px-2 py-1 text-[11px] font-semibold text-navy transition hover:bg-navy hover:text-white"
              title={`Download ${artifact.title} as PDF`}
            >
              PDF
            </a>
          </div>
        )}
      </div>
      {open && (
        <div className="px-4 py-3">
          <Markdown>{artifact.markdown}</Markdown>
        </div>
      )}
    </div>
  );
}

export default function ArtifactPanel({
  artifacts,
  conversationId,
}: {
  artifacts: Artifact[];
  conversationId: string | null;
}) {
  return (
    <aside className="flex h-full w-full flex-col border-l border-powder bg-powder-bg">
      <div className="border-b border-powder px-5 py-4">
        <h2 className="text-sm font-bold tracking-wide text-navy uppercase">Artifacts</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Outputs produced by the agents · download as DOCX or PDF
        </p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {artifacts.length === 0 ? (
          <div className="mt-10 px-2 text-center text-sm text-slate-400">
            Nothing yet. Ask for a plan, proposal, requirements, tasks, or risks and they’ll
            appear here.
          </div>
        ) : (
          artifacts.map((a) => (
            <Card key={a.agent} artifact={a} conversationId={conversationId} />
          ))
        )}
      </div>
    </aside>
  );
}
