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
  onClose,
}: {
  artifacts: Artifact[];
  conversationId: string | null;
  onClose?: () => void;
}) {
  return (
    <aside className="flex h-full w-full flex-col border-l border-powder bg-powder-bg">
      <div className="flex items-start justify-between gap-2 border-b border-powder px-5 py-4">
        <div>
          <h2 className="text-sm font-bold tracking-wide text-navy uppercase">Deliverables</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Produced by the agents · download as DOCX or PDF
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Hide deliverables"
            aria-label="Hide deliverables"
            className="shrink-0 rounded-md p-1 text-navy/50 transition hover:bg-powder-soft hover:text-navy"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
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
