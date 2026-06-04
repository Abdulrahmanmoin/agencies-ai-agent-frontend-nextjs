# AgencyOS — Web Frontend

Next.js 16 (App Router, React 19, Tailwind v4) chat UI for the AgencyOS multi-agent backend.
Palette: navy `#000075` (primary) + powder blue `#B0E0E6` (accent).

It's a thin client over the backend's UI-agnostic orchestrator: chat on the left, a live
**Artifacts** panel on the right (requirements, plan, tasks, risks, proposal — rendered as
markdown cards). HITL pauses (confirmation / clarification) appear as highlighted assistant
prompts; just reply and the graph resumes. No ClickUp yet — current agent functionality only.

## Run (two terminals)

**1. Backend (FastAPI)** — from `../agency-operating-system-ai-agent`:

```powershell
.\.venv\Scripts\python.exe scripts\serve_api.py   # http://127.0.0.1:8000
```

> Use this script, not `uvicorn ...` directly: on Windows uvicorn forces the ProactorEventLoop,
> which psycopg (the Postgres checkpointer) can't use. The script runs uvicorn under a
> selector-loop `asyncio.run`. Do not add `--reload`.

**2. Frontend** — from `./my-app`:

```powershell
npm run dev        # http://localhost:3000
```

The backend URL is configurable via `.env.local` (`NEXT_PUBLIC_API_URL`, default
`http://localhost:8000`).

## Endpoints used

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/conversations` | start a conversation, returns the capabilities greeting |
| `POST` | `/api/conversations/{id}/messages` | send a turn (auto-resumes paused HITL graphs) |
| `POST` | `/api/conversations/{id}/upload` | attach meeting material (pdf/txt/docx → notes text; audio → transcription) |
| `GET`  | `/api/conversations/{id}/artifacts` | current agent outputs as markdown cards |
| `DELETE` | `/api/conversations/{id}` | release the conversation's Postgres connection |

Use the 📎 button by the composer to upload notes (pdf/txt/docx) or audio (mp3/wav/m4a/…). The
file is merged into the conversation's graph state, then ask the agent to *extract requirements*,
*make a plan*, or *handle this end to end*.
