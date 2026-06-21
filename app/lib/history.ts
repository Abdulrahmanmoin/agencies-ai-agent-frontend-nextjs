// Client-side conversation history (localStorage).
//
// The backend already persists each conversation's graph state in Postgres (keyed by
// conversation_id) and rehydrates it on any request, so continuing an old chat works server-side
// for free. All we need on the client is to remember the *list* of chats and the visible transcript
// so we can show a ChatGPT-style sidebar and repaint a conversation when it's reopened.

export interface StoredMessage {
  role: "user" | "assistant";
  text: string;
  awaiting?: boolean;
}

export interface StoredConversation {
  id: string;
  title: string;
  updatedAt: number;
  messages: StoredMessage[];
}

const KEY = "agencyos.conversations.v1";
const ACTIVE_KEY = "agencyos.activeConversation.v1";

function read(): StoredConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredConversation[]) : [];
  } catch {
    return [];
  }
}

function write(list: StoredConversation[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* quota exceeded / storage disabled — non-fatal, history just won't persist */
  }
}

export function listConversations(): StoredConversation[] {
  return read().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getConversation(id: string): StoredConversation | undefined {
  return read().find((c) => c.id === id);
}

/** Derive a short title from the first real (non-attachment) user message. */
export function deriveTitle(messages: StoredMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user" && !m.text.startsWith("📎"));
  const clean = (firstUser?.text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return "New chat";
  return clean.length > 40 ? `${clean.slice(0, 40)}…` : clean;
}

/** Insert or update a conversation, bumping it to the top (most-recent first). */
export function upsertConversation(id: string, messages: StoredMessage[]): StoredConversation {
  const list = read();
  const conv: StoredConversation = {
    id,
    title: deriveTitle(messages),
    updatedAt: Date.now(),
    messages,
  };
  const others = list.filter((c) => c.id !== id);
  write([conv, ...others]);
  return conv;
}

export function deleteConversation(id: string): void {
  write(read().filter((c) => c.id !== id));
  if (getActiveId() === id) rememberActiveId(null);
}

export function getActiveId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function rememberActiveId(id: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (id) window.localStorage.setItem(ACTIVE_KEY, id);
    else window.localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* non-fatal */
  }
}

/** Compact "3m ago" / "2h ago" / "5d ago" / date string for the sidebar. */
export function relativeTime(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}
