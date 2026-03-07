# Shhh — Operations Guide

> **Purpose:** Single reference for deployment, runbook, testing, and alerting.  
> **Audience:** DevOps, on-call engineers, developers.  
> **Last updated:** March 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Get Online (Cloud Setup)](#2-get-online-cloud-setup)
3. [Runbook (Incidents & Debugging)](#3-runbook-incidents--debugging)
4. [Testing](#4-testing)
5. [Deployment (AWS/Terraform)](#5-deployment-awsterraform)
6. [Alerting](#6-alerting)

---

## 1. Overview

| Component | Stack | Deployment |
|-----------|-------|------------|
| Backend API | Node.js, Express, TypeScript | Render, Railway, or ECS (Docker) |
| Admin Dashboard | React, Vite | Vercel (static SPA) |
| Mobile Web | Expo web | Vercel (root: `mobile`) |
| Infrastructure | Terraform | AWS (VPC, ALB, ECS, RDS, ElastiCache) |

**Services:** PostgreSQL+PostGIS (Supabase or RDS), Redis (Upstash or ElastiCache), MongoDB Atlas. See **docs/DEV_HANDOVER.md** §18 for env vars.

---

## 2. Get Online (Cloud Setup)

### 2.1 Where Env Vars Go

| Service | Variables | Notes |
|---------|-----------|-------|
| **Backend** (Render, Railway) | `DATABASE_URL`, `REDIS_URL`, `MONGODB_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PHONE_HASH_PEPPER`, `CORS_ORIGINS`, `TWILIO_*`, `STRIPE_*` | All secrets here. Never in frontend. |
| **Vercel** (mobile web) | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID`, `EXPO_PUBLIC_SNAP_CLIENT_ID` | Only `EXPO_PUBLIC_*` — exposed to browser. |

**Database:** Use `DATABASE_URL` = pooler (port 6543); `DATABASE_MIGRATION_URL` = direct (port 5432) for migrations. See **DEV_HANDOVER** §18.2.

### 2.2 Prerequisites

- GitHub repo pushed
- Accounts: [Supabase](https://supabase.com), [Upstash](https://upstash.com), [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- (Optional) [Render](https://render.com) or [Railway](https://railway.app), [Vercel](https://vercel.com)

### 2.3 Cloud Databases

**Supabase:** Create project → Settings → Database → copy pooler (6543) and direct (5432) URLs. Enable PostGIS: `CREATE EXTENSION IF NOT EXISTS postgis;`

**Upstash:** Create Database → copy Redis URL. Use `rediss://` (double s) for TLS.

**MongoDB Atlas:** Create cluster → add user, whitelist `0.0.0.0/0` → copy URI. Add `authSource=admin`.

### 2.4 Migrations

```bash
cd backend
DATABASE_MIGRATION_URL="postgresql://postgres:[PWD]@db.[REF].supabase.co:5432/postgres?sslmode=require" \
DATABASE_SSL=true npm run migrate
```

### 2.5 Deploy Backend (Render)

1. New Web Service → Connect repo, Root: `backend`
2. Build: `npm ci && npm run build` | Start: `npm start`
3. Add env vars (see DEV_HANDOVER §18.6). **Do not set** `OTP_DEV_BYPASS` in prod.

### 2.6 Deploy Web Frontend (Vercel)

1. Import repo → Root: `mobile`
2. Build: `npm run build` | Output: `dist`
3. Env: `EXPO_PUBLIC_API_URL` = backend URL
4. Add Vercel URL to backend `CORS_ORIGINS`

### 2.7 Troubleshooting

| Issue | Fix |
|-------|-----|
| Migrations fail | Use direct URL (5432), `DATABASE_SSL=true` |
| Connection timeout (Postgres) | Supabase free tier pauses — wake in Dashboard. Use pooler (6543). `DATABASE_POOL_SIZE=5` for free tier. |
| 429 Too Many Requests | `RATE_LIMIT_MAX_REQUESTS=5000`, `AUTH_RATE_LIMIT_MAX=50` |
| Two accounts can't see each other | Web: grant location. Radius: use "All" (100km). Both must have opened app. |
| Twilio trial | Only sends to verified numbers. Add in Twilio Console or upgrade. |

---

## 3. Runbook (Incidents & Debugging)

### 3.1 Health Check

```bash
curl http://localhost:3000/health
```

Returns `status`, `version`, `modules`.

### 3.2 Common Failures

| Symptom | Check |
|---------|-------|
| 5xx | Logs (`LOG_LEVEL=debug`), DB/Redis/Mongo connectivity |
| OTP failing | Redis eviction (`noeviction` recommended), rate limit, Twilio vars |
| Discovery empty | PostGIS enabled, client sending lat/lng, 30s cache |
| WebSocket disconnect | JWT expiry, CORS |
| Messages not real-time | Client must `join_conversation` after connect |

### 3.3 Database

```bash
cd backend && npm run migrate   # Forward-only
cd backend && npm run seed     # Dev only
```

No automated rollback. Restore from backup to revert.

### 3.4 Redis

```bash
redis-cli CONFIG GET maxmemory-policy   # Prefer noeviction
redis-cli KEYS "otp:*"                 # Dev: clear OTP
```

### 3.5 Security Incidents

- **Token compromise:** Rotate `JWT_SECRET`, `JWT_REFRESH_SECRET`
- **PII exposure:** Rotate `PHONE_HASH_PEPPER`; rehash affected data
- **Ban user:** `POST /v1/admin/users/:userId/ban` (admin role)

See **DEV_HANDOVER** §22 Runbook for rotate JWT, revoke tokens, disable ads, ban user.

---

## 4. Testing

### 4.1 Backend (Jest)

```bash
cd backend
npm test
```

Requires Docker (Postgres, Redis, Mongo). Suites: `auth`, `discovery`, `events`, `couples`, `safety`, `admin`, `media`.

### 4.2 Load Tests (k6)

```bash
npm run loadtest:smoke    # 100 VUs, ~3 min
npm run loadtest:baseline # 1000 VUs
npm run loadtest:stress   # 10k VUs
```

Backend needs `TEST_MODE=true` or `NODE_ENV=test`. See `loadtest/README.md`.

### 4.3 CI

`.github/workflows/ci.yml`: lint, typecheck, backend-test, build, loadtest-smoke.

### 4.4 Manual

- Admin: manual on port 5173
- Mobile: Expo Go or device. No Detox/Playwright.

---

## 5. Deployment (AWS/Terraform)

For full AWS production (ECS, RDS, ElastiCache):

- **Terraform:** `terraform/main.tf`, `ecs.tf`, `database.tf`, `alb.tf`, `vpc.tf`
- **State:** S3 bucket `shhh-terraform-state`
- **Apply:** `terraform init && terraform plan -var-file=production.tfvars && terraform apply`

See `docs/DEPLOYMENT_GUIDE.md` (archived) for full details.

---

## 6. Alerting

**Endpoint:** `GET /metrics` (Prometheus scrape). Protect with `METRICS_SECRET` Bearer token.

**Metrics:** `http_requests_total`, `http_request_duration_seconds`, `worker_job_failures_total`

**Alert rules:** High 5xx rate (>5%), p99 latency >5s, worker job failures. Configure Alertmanager or PagerDuty. See `docs/ALERTING.md` (archived) for YAML examples.
