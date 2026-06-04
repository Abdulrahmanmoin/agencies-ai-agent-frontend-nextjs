// Thin client for the AgencyOS FastAPI backend (see agencyos/api/app.py).

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type TurnKind = "message" | "awaiting_confirmation" | "awaiting_clarification";

export interface TurnResponse {
  kind: TurnKind;
  message: string | null;
  question: string | null;
  awaiting_input: boolean;
  conversation_id: string;
}

export interface Artifact {
  agent: string;
  title: string;
  markdown: string;
}

export interface NewConversation {
  conversation_id: string;
  greeting: string | null;
}

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${detail || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function createConversation(): Promise<NewConversation> {
  const res = await fetch(`${BASE}/api/conversations`, { method: "POST" });
  return asJson<NewConversation>(res);
}

export async function sendMessage(id: string, message: string): Promise<TurnResponse> {
  const res = await fetch(`${BASE}/api/conversations/${id}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  return asJson<TurnResponse>(res);
}

export interface UploadResponse {
  kind: "audio" | "notes";
  filename: string;
  message: string;
}

export async function uploadFile(id: string, file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/api/conversations/${id}/upload`, {
    method: "POST",
    body: form,
  });
  return asJson<UploadResponse>(res);
}

export async function getArtifacts(id: string): Promise<Artifact[]> {
  const res = await fetch(`${BASE}/api/conversations/${id}/artifacts`);
  const data = await asJson<{ artifacts: Artifact[] }>(res);
  return data.artifacts;
}
