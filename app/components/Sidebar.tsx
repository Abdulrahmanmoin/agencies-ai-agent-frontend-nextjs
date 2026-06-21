"use client";

import { relativeTime, type StoredConversation } from "../lib/history";

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onClose,
}: {
  conversations: StoredConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}) {
  return (
    <aside className="flex h-screen w-full flex-col border-r border-powder bg-powder-bg">
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <span className="text-[11px] font-bold tracking-wide text-navy uppercase">Chats</span>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Hide chat history"
            aria-label="Hide chat history"
            className="rounded-md p-1 text-navy/50 transition hover:bg-powder-soft hover:text-navy"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
            </svg>
          </button>
        )}
      </div>
      <div className="px-3 pt-1 pb-2">
        <button
          type="button"
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-soft"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
          New chat
        </button>
      </div>

      <div className="px-4 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
        Recent
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {conversations.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-slate-400">
            No conversations yet. Start one above.
          </p>
        ) : (
          conversations.map((c) => {
            const active = c.id === activeId;
            return (
              <div
                key={c.id}
                className={`group flex items-center gap-1 rounded-lg pr-1 pl-2 transition ${
                  active ? "bg-powder-soft" : "hover:bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className="min-w-0 flex-1 py-2 text-left"
                >
                  <div
                    className={`truncate text-sm ${
                      active ? "font-semibold text-navy" : "text-slate-700"
                    }`}
                  >
                    {c.title}
                  </div>
                  <div className="truncate text-[11px] text-slate-400">
                    {relativeTime(c.updatedAt)}
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(c.id)}
                  title="Delete chat"
                  aria-label="Delete chat"
                  className="shrink-0 rounded-md p-1.5 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </nav>

      <div className="border-t border-powder px-4 py-3 text-[11px] text-slate-400">
        History is saved in this browser.
      </div>
    </aside>
  );
}
