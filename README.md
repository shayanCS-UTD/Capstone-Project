# Intelligent Approval Automation System

A full-stack web application that automates request approvals using a rule-based risk classification engine. Low-risk requests are auto-approved instantly; medium and high-risk requests are escalated to an administrator queue for manual review.

---

## Architecture

```
├── backend/         # FastAPI (Python) REST API
├── frontend/        # React + TailwindCSS SPA (Vite)
├── database/        # PostgreSQL schema (Supabase)
└── README.md
```

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 18, React Router v6, TailwindCSS, Vite    |
| Backend   | FastAPI, Pydantic v2, Uvicorn                   |
| Auth      | Supabase Auth (JWT)                             |
| Database  | PostgreSQL via Supabase (with Row-Level Security)|
| Deployment| Frontend → Vercel · Backend → any ASGI host     |

---

## Features

- **User registration & login** via Supabase Auth
- **Submit requests** (room booking, access permission, equipment checkout, other)
- **Automatic risk classification** — keyword-based engine scores every request 0–100
  - 🟢 LOW risk → auto-approved immediately
  - 🟡 MEDIUM / 🔴 HIGH risk → escalated to admin queue
- **Admin approval queue** — approve or reject with reason
- **Audit log** — full trail of every action (submit, auto-approve, escalate, approve, reject)
- **Role-based access** — admin-only routes and API endpoints
- **Responsive UI** with loading states, error handling, and status/risk badges

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1 — Database Setup

Run `database/schema.sql` in the Supabase SQL editor.

### 2 — Backend

```bash
cd backend
cp .env.example .env          # fill in Supabase keys
pip install -r requirements.txt
uvicorn main:app --reload
# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### 3 — Frontend

```bash
cd frontend
cp .env.example .env          # fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL
npm install
npm run dev
# App available at http://localhost:5173
```

---

## Environment Variables

### Backend (`backend/.env`)
| Variable             | Description                          |
|----------------------|--------------------------------------|
| `SUPABASE_URL`       | Your Supabase project URL            |
| `SUPABASE_KEY`       | Supabase anon (public) key           |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (bypasses RLS) |
| `JWT_SECRET`         | Secret for JWT signing               |
| `ENVIRONMENT`        | `development` or `production`        |
| `ALLOWED_ORIGINS`    | Comma-separated list of CORS origins |

### Frontend (`frontend/.env`)
| Variable              | Description                    |
|-----------------------|--------------------------------|
| `VITE_SUPABASE_URL`   | Your Supabase project URL      |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key           |
| `VITE_API_BASE_URL`   | Backend URL (e.g. `http://localhost:8000`) |

---

## API Reference

| Method | Endpoint                          | Auth     | Description                      |
|--------|-----------------------------------|----------|----------------------------------|
| POST   | `/auth/register`                  | —        | Register a new user              |
| POST   | `/auth/login`                     | —        | Login, returns JWT               |
| GET    | `/auth/me`                        | User     | Get current user profile         |
| POST   | `/requests/`                      | User     | Submit a new request             |
| GET    | `/requests/`                      | User     | List own requests                |
| GET    | `/requests/{id}`                  | User     | Get a specific request           |
| GET    | `/admin/requests`                 | Admin    | List pending/escalated requests  |
| PUT    | `/admin/requests/{id}/approve`    | Admin    | Approve a request                |
| PUT    | `/admin/requests/{id}/reject`     | Admin    | Reject a request with reason     |
| GET    | `/logs/`                          | User/Admin | Get audit logs                 |
| GET    | `/health`                         | —        | Health check                     |

---

## Risk Engine

The rule-based engine in `backend/app/risk_engine.py` scans request title + description:

- **HIGH risk keywords**: `urgent`, `emergency`, `override`, `bypass`, `admin`, `root`, `privilege`, `escalate`, `unrestricted`, `sensitive`, `confidential`, `executive`, `ceo`, `board`, `unlimited`, `mass`, `bulk`, `all users`, `system-wide`
- **MEDIUM risk keywords**: `temporary`, `extended`, `multiple`, `large`, `all day`, `overnight`, `weekend`, `special`, `exception`

Each HIGH match adds 20 points; each MEDIUM match adds 10 points (capped at 100).

---

## Deployment

### Frontend (Vercel)
The `frontend/vercel.json` is pre-configured with SPA rewrites. Import the repo in Vercel and set environment variables.

### Backend
Deploy to Railway, Fly.io, or any platform that supports Python/ASGI. Set the environment variables from `.env.example`.
