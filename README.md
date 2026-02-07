# AI Business Dashboard

A full-stack, AI-enabled business operations dashboard for tracking **projects, leads, employees, and executive reports**.

## Tech Stack
- **Frontend:** Next.js 14, React, TailwindCSS, Recharts, Supabase Auth
- **Backend:** FastAPI, Supabase (Postgres + Storage), PDF report generation
- **AI:** Gemini integration with resilient local fallback insights

## Repository Structure
- `frontend/` → application UI + dashboards + AI copilot
- `backend/` → FastAPI APIs, AI services, report generation
- `supabase/` → schema + seed data
- `docs/` → product docs and reference material

## Features
- Secure login with Supabase auth on frontend.
- Full CRUD workflows for projects and leads.
- Business metrics aggregation endpoint (`/api/metrics`).
- AI Deep Dive endpoint (`/api/insights/deep-dive`) for executive analysis.
- **AI Copilot chat endpoint** (`/api/ai/copilot`) for natural-language Q&A.
- Report generation pipeline with asynchronous PDF generation.
- Modern analytics UI for dashboard, reports, and operations pages.

## Local Setup

### 1) Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Required environment variables (backend `.env`):
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `GOOGLE_API_KEY` (optional; fallback AI still works without it)

### 2) Frontend
```bash
cd frontend
npm install
npm run dev
```

Optional frontend env:
- `NEXT_PUBLIC_API_URL=http://localhost:8000`
- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`

## Notes
- If Gemini credentials are unavailable, AI endpoints automatically return deterministic local insights.
- API docs are available via FastAPI Swagger at `http://localhost:8000/docs`.
