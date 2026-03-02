# Shhh Admin Dashboard

React + Vite moderation panel for the Shhh geosocial platform. Connects to the backend API for user management, moderation, revenue, venues, ads, events, reports, safety alerts, and audit logs.

## Prerequisites

- Backend API running at `http://localhost:3000` (see root [README](../README.md))
- Docker services (PostgreSQL, Redis, MongoDB) and migrations applied
- Seed data with admin-capable users (see [docs/REVIEW_CREDENTIALS.md](../docs/REVIEW_CREDENTIALS.md) for test credentials)

## Quick Start

```bash
npm install
npm run dev
```

Runs on **http://localhost:5173**.

## Pages

| Route | Purpose |
|-------|---------|
| `/login` | Phone + OTP login (uses backend `/v1/auth/login`) |
| `/` | Dashboard (overview, stats, health) |
| `/users` | User list, search, role/tier/ban actions |
| `/revenue` | Revenue metrics and history |
| `/venues` | Venue list |
| `/ads` | Ad placements, toggle active |
| `/events` | Event list |
| `/reports` | Report queue, resolve/dismiss |
| `/safety` | Safety/panic alerts |
| `/audit` | Audit log |
| `/settings` | Ad settings |

## API Client

- Base URL: `http://localhost:3000` (hardcoded in `src/api/client.ts`)
- Auth: JWT stored in `localStorage` as `admin_token`
- All admin routes require authentication; unauthenticated users are redirected to `/login`

## Build

```bash
npm run build
```

Output in `dist/`. Deploy as a static SPA; ensure the backend API URL is correct for the target environment.
