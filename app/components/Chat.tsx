"use client";

import { useEffect, useRef, useState } from "react";
import {
  createConversation,
  getArtifacts,
  sendMessage,
  uploadFile,
  type Artifact,
  type TurnResponse,
} from "../lib/api";
import {
  deleteConversation,
  getActiveId,
  getConversation,
  listConversations,
  rememberActiveId,
  upsertConversation,
  type StoredConversation,
} from "../lib/history";
import ArtifactPanel from "./ArtifactPanel";
import Markdown from "./Markdown";
import Sidebar from "./Sidebar";

type Role = "user" | "assistant";

interface ChatMessage {
  role: Role;
  text: string;
  awaiting?: boolean; // assistant is asking a HITL question (confirmation / clarification)
}

export default function Chat() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const started = useRef(false);

  // Auto-scroll the transcript on new messages.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function refreshArtifacts(id: string) {
    try {
      setArtifacts(await getArtifacts(id));
    } catch {
      /* non-fatal — keep last known artifacts */
    }
  }

  // Persist a conversation's transcript to the sidebar history (only once it has real content).
  function persist(id: string, msgs: ChatMessage[]) {
    if (!msgs.some((m) => m.role === "user")) return; // don't list greeting-only chats
    upsertConversation(id, msgs);
    setConversations(listConversations());
    rememberActiveId(id);
  }

  // Start a brand-new conversation (server creates the thread + returns the capabilities greeting).
  async function openNew() {
    setConnecting(true);
    setError(null);
    setArtifacts([]);
    setMessages([]);
    setConversationId(null);
    try {
      const conv = await createConversation();
      setConversationId(conv.conversation_id);
      rememberActiveId(conv.conversation_id);
      setMessages(conv.greeting ? [{ role: "assistant", text: conv.greeting }] : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect to the backend.");
    } finally {
      setConnecting(false);
    }
  }

  function handleSelect(id: string) {
    if (id === conversationId || busy) return;
    const conv = getConversation(id);
    if (!conv) return;
    setError(null);
    setConversationId(id);
    setMessages(conv.messages);
    rememberActiveId(id);
    refreshArtifacts(id);
  }

  function handleDelete(id: string) {
    deleteConversation(id);
    setConversations(listConversations());
    if (id === conversationId) openNew();
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || busy || !conversationId) return;

    setInput("");
    setError(null);
    const afterUser: ChatMessage[] = [...messages, { role: "user", text }];
    setMessages(afterUser);
    persist(conversationId, afterUser);
    setBusy(true);
    try {
      const res: TurnResponse = await sendMessage(conversationId, text);
      const reply = res.message ?? res.question ?? "(no response)";
      const afterReply: ChatMessage[] = [
        ...afterUser,
        { role: "assistant", text: reply, awaiting: res.awaiting_input },
      ];
      setMessages(afterReply);
      persist(conversationId, afterReply);
      await refreshArtifacts(conversationId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "That turn failed.";
      const afterErr: ChatMessage[] = [
        ...afterUser,
        {
          role: "assistant",
          text: `⚠️ Sorry — that turn failed (${msg}). This is usually a temporary network/LLM issue. Your conversation is intact — just send the message again.`,
        },
      ];
      setMessages(afterErr);
      persist(conversationId, afterErr);
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(file: File) {
    if (!conversationId || uploading || busy) return;
    setError(null);
    setUploading(true);
    const afterUser: ChatMessage[] = [...messages, { role: "user", text: `📎 Uploading ${file.name}…` }];
    setMessages(afterUser);
    try {
      const res = await uploadFile(conversationId, file);
      const afterReply: ChatMessage[] = [...afterUser, { role: "assistant", text: res.message }];
      setMessages(afterReply);
      persist(conversationId, afterReply);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "upload failed";
      setMessages([...afterUser, { role: "assistant", text: `⚠️ Upload failed: ${msg}` }]);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = ""; // allow re-uploading the same file
    }
  }

  async function restoreOrOpen() {
    const list = listConversations();
    setConversations(list);
    const activeId = getActiveId();
    const existing = activeId ? list.find((c) => c.id === activeId) : undefined;
    if (existing) {
      setConversationId(existing.id);
      setMessages(existing.messages);
      setConnecting(false);
      refreshArtifacts(existing.id);
    } else {
      await openNew();
    }
  }

  // Restore the last chat (or open a fresh one) once on mount; StrictMode-safe via `started`.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void restoreOrOpen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const gridCols =
    sidebarOpen && panelOpen
      ? "lg:grid-cols-[260px_1fr_minmax(340px,420px)]"
      : sidebarOpen
        ? "lg:grid-cols-[260px_1fr]"
        : panelOpen
          ? "lg:grid-cols-[1fr_minmax(340px,420px)]"
          : "lg:grid-cols-1";

  return (
    <div className={`grid h-screen grid-cols-1 ${gridCols}`}>
      {/* History sidebar (lg+) */}
      {sidebarOpen && (
        <div className="hidden h-screen lg:block">
          <Sidebar
            conversations={conversations}
            activeId={conversationId}
            onSelect={handleSelect}
            onNew={openNew}
            onDelete={handleDelete}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Chat column */}
      <section className="flex h-screen min-w-0 flex-col">
        <header className="flex items-center gap-3 border-b border-powder bg-navy px-6 py-4">
          {/* Sidebar toggle (lg+) */}
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-pressed={sidebarOpen}
            title={sidebarOpen ? "Hide chat history" : "Show chat history"}
            aria-label={sidebarOpen ? "Hide chat history" : "Show chat history"}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-powder/40 text-powder transition hover:bg-white/10 lg:flex"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18" />
            </svg>
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-powder font-bold text-navy">
            A
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">AgencyOS</h1>
            <p className="text-xs text-powder">Agency Operating System · multi-agent intake</p>
          </div>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-powder">
            <span
              className={`h-2 w-2 rounded-full ${connecting ? "bg-amber-300" : error ? "bg-red-400" : "bg-emerald-400"}`}
            />
            {connecting ? "connecting…" : error ? "offline" : "connected"}
          </span>
          {/* Deliverables panel toggle (lg+) */}
          <button
            type="button"
            onClick={() => setPanelOpen((v) => !v)}
            aria-pressed={panelOpen}
            title={panelOpen ? "Hide deliverables" : "Show deliverables"}
            className="ml-3 hidden items-center gap-1.5 rounded-lg border border-powder/40 px-2.5 py-1.5 text-xs font-semibold text-powder transition hover:bg-white/10 lg:flex"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
            Deliverables
            {artifacts.length > 0 && (
              <span className="rounded-full bg-powder px-1.5 text-[10px] font-bold text-navy">
                {artifacts.length}
              </span>
            )}
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
          {connecting && (
            <p className="text-sm text-slate-400">
              Connecting… first connect can take ~30s if the database is asleep.
            </p>
          )}
          {error && !messages.length && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
              <div className="mt-1 text-xs text-red-500">
                Is the backend running at {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}?
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <Bubble key={i} message={m} />
          ))}

          {busy && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="h-2 w-2 animate-bounce rounded-full bg-navy [animation-delay:-0.2s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-navy [animation-delay:-0.1s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-navy" />
              <span className="ml-1">agents are working…</span>
            </div>
          )}
        </div>

        <div className="border-t border-powder bg-white px-4 py-3">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.txt,.md,.docx,.mp3,.wav,.m4a,.mp4,.ogg,.webm,.flac,audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={connecting || uploading || busy || !conversationId}
              title="Attach meeting notes (pdf, txt, docx) or audio"
              className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl border border-powder bg-powder-bg text-navy transition hover:bg-powder-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              {uploading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy border-t-transparent" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              )}
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              disabled={connecting || !conversationId}
              placeholder='Try: "make a plan", "draft a proposal", or "handle this end to end"'
              className="max-h-40 min-h-[44px] flex-1 resize-none rounded-xl border border-powder bg-powder-bg px-4 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-navy focus:ring-2 focus:ring-powder disabled:opacity-60"
            />
            <button
              onClick={handleSend}
              disabled={busy || connecting || !input.trim()}
              className="h-[44px] shrink-0 rounded-xl bg-navy px-5 text-sm font-semibold text-white transition hover:bg-navy-soft disabled:cursor-not-allowed disabled:opacity-40"
            >
              Send
            </button>
          </div>
          <p className="mx-auto mt-1.5 max-w-3xl text-center text-[11px] text-slate-400">
            Enter to send · Shift+Enter for a new line · 📎 attach meeting notes (pdf/txt/docx) or
            audio
          </p>
        </div>
      </section>

      {/* Artifact panel */}
      {panelOpen && (
        <div className="hidden h-screen lg:block">
          <ArtifactPanel
            artifacts={artifacts}
            conversationId={conversationId}
            onClose={() => setPanelOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-navy px-4 py-2.5 text-sm whitespace-pre-wrap text-white">
          {message.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div
        className={`max-w-[85%] rounded-2xl rounded-bl-sm border px-4 py-3 ${
          message.awaiting
            ? "border-amber-300 bg-amber-50"
            : "border-powder bg-white"
        }`}
      >
        {message.awaiting && (
          <div className="mb-1 text-[11px] font-semibold tracking-wide text-amber-600 uppercase">
            Needs your input
          </div>
        )}
        <Markdown>{message.text}</Markdown>
      </div>
    </div>
  );
}
