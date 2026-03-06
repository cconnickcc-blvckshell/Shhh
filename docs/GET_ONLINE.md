# Get Shhh Running Online

Step-by-step guide to connect the app to cloud databases and deploy it online.

---

## Where Do Env Vars Go?

| Service | Variables | Notes |
|---------|-----------|-------|
| **Backend** (Railway, Render) | `DATABASE_URL`, `REDIS_URL`, `MONGODB_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PHONE_HASH_PEPPER`, `CORS_ORIGINS`, `TWILIO_*`, `STRIPE_*`, `GOOGLE_CLIENT_ID`, `APPLE_*`, `SNAP_*` | All secrets live here. Never in frontend. |
| **Vercel** (mobile web) | `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_GOOGLE_CLIENT_ID`, `EXPO_PUBLIC_SNAP_CLIENT_ID` | Only `EXPO_PUBLIC_*` — exposed to browser. No secrets. |
| **Supabase / Upstash / Atlas** | None | You copy connection strings from their dashboards into your **Backend** env vars. |

**Database URLs (Supabase):** Use two URLs. `DATABASE_URL` = pooler (for app). `DATABASE_MIGRATION_URL` = direct (for migrations). See Part 3.

---

## Prerequisites

- GitHub repo pushed
- Accounts: [Supabase](https://supabase.com), [Upstash](https://upstash.com), [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- (Optional) [Railway](https://railway.app) or [Render](https://render.com) for backend
- (Optional) [Vercel](https://vercel.com) for web frontend

---

## Part 1: Local Verification (Do This First)

Confirm everything works locally before moving to cloud.

```bash
# 1. Start databases
docker compose up -d

# 2. Run migrations (from project root)
cd backend && npm run migrate

# 3. Start backend
npm run dev

# 4. Verify
curl http://localhost:3000/health
```

Expected: `{"status":"ok",...}`

---

## Part 2: Cloud Databases

### 2.1 Supabase (PostgreSQL + PostGIS)

1. [Supabase Dashboard](https://supabase.com/dashboard) → **New Project**
2. Set region, database password, create.
3. **Settings** → **Database** → copy **Connection string** (URI).
4. Use **direct** for migrations:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require
   ```
5. Use **pooler** for app (after migrations):
   ```
   postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
   ```
6. Enable PostGIS: SQL Editor → run `CREATE EXTENSION IF NOT EXISTS postgis;`

### 2.2 Upstash (Redis)

1. [Upstash Console](https://console.upstash.com/) → **Create Database**
2. Copy Redis URL: `redis://default:[PASSWORD]@[ENDPOINT].upstash.io:6379`

### 2.3 MongoDB Atlas

1. [Atlas](https://www.mongodb.com/cloud/atlas) → **Create Cluster**
2. **Database Access** → Add user
3. **Network Access** → Add IP `0.0.0.0/0` (or your deploy platform IPs)
4. **Connect** → Drivers → copy URI. Add `authSource=admin` if missing:
   ```
   mongodb+srv://[USER]:[PASSWORD]@[CLUSTER].mongodb.net/shhh_messages?retryWrites=true&w=majority&authSource=admin
   ```

---

## Part 3: Run Migrations Against Supabase

Supabase has two connection modes. **Direct** (port 5432) works for migrations; **pooler** (port 6543) can block some DDL. Use `DATABASE_MIGRATION_URL` for migrations.

From project root:

```bash
cd backend
DATABASE_MIGRATION_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require" \
DATABASE_SSL=true \
npm run migrate
```

Or add to `.env` (migrations use `DATABASE_MIGRATION_URL`; app uses `DATABASE_URL`):

```env
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
DATABASE_MIGRATION_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require
DATABASE_SSL=true
```

Then: `cd backend && npm run migrate`

---

## Part 4: Deploy Backend (Railway or Render)

### Option A: Railway

1. [Railway](https://railway.app) → **New Project** → **Deploy from GitHub**
2. Select your repo, set **Root Directory** to `backend`
3. **Variables** → add:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Supabase **pooler** URL (for app) |
   | `DATABASE_MIGRATION_URL` | Supabase **direct** URL (only if you run migrations from Railway; else run locally) |
   | `DATABASE_SSL` | `true` |
   | `REDIS_URL` | Upstash URL |
   | `MONGODB_URL` | Atlas URL |
   | `JWT_SECRET` | `openssl rand -hex 32` |
   | `JWT_REFRESH_SECRET` | `openssl rand -hex 32` |
   | `PHONE_HASH_PEPPER` | `openssl rand -hex 32` |
   | `NODE_ENV` | `production` |
   | `CORS_ORIGINS` | `https://your-app.vercel.app,https://yourdomain.com` |

4. Deploy. Railway assigns a URL like `https://xxx.up.railway.app`
5. Copy the backend URL for the frontend.

### Option B: Render

1. [Render](https://render.com) → **New** → **Web Service**
2. Connect repo, set **Root Directory** to `backend`
3. **Build Command:** `npm ci && npm run build`
4. **Start Command:** `npm start`
5. Add the same env vars as Railway.
6. Deploy. URL like `https://shhh-backend.onrender.com`

### Option C: Docker (Fly.io, ECS, etc.)

```bash
cd backend
docker build -t shhh-backend .
docker run -p 3000:3000 --env-file .env shhh-backend
```

---

## Part 5: Deploy Web Frontend (Vercel)

1. [Vercel](https://vercel.com) → **Import** your repo
2. **Root Directory:** `mobile`
3. **Build Command:** `npm run build` (Expo web)
4. **Output Directory:** `dist`
5. **Environment Variables:**
   - `EXPO_PUBLIC_API_URL` = your backend URL (e.g. `https://xxx.up.railway.app`)

6. Deploy. Add the Vercel URL to backend `CORS_ORIGINS`.

---

## Part 6: Wire It Together

1. **Backend** `CORS_ORIGINS` must include your frontend URL(s).
2. **Frontend** `EXPO_PUBLIC_API_URL` must point to your backend URL.
3. Redeploy backend after adding frontend URL to CORS.
4. Test: open web app → login/register → verify API calls work.

---

## Checklist

- [ ] Docker running locally, migrations applied
- [ ] Supabase project created, PostGIS enabled
- [ ] Upstash Redis created
- [ ] MongoDB Atlas cluster created, IP whitelisted
- [ ] Migrations run against Supabase
- [ ] Backend deployed (Railway/Render)
- [ ] Frontend deployed (Vercel)
- [ ] `CORS_ORIGINS` includes frontend URL
- [ ] `EXPO_PUBLIC_API_URL` set on Vercel
- [ ] Health check: `curl https://your-backend/health`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Migrations fail on Supabase | Use **direct** connection, not pooler. Add `DATABASE_SSL=true`. |
| Backend exits on startup | Check Postgres/Redis/Mongo connect. In prod, all four secrets required. |
| CORS errors from frontend | Add frontend URL to `CORS_ORIGINS` (comma-separated, no trailing slash). |
| 401 on API calls | JWT/auth flow; ensure `EXPO_PUBLIC_API_URL` has no trailing slash. |
| **ECONNREFUSED 127.0.0.1:6379** (Redis) | Render has no local Redis. Add `REDIS_URL` in Render Dashboard → Environment. Use [Upstash](https://upstash.com) (free tier) or Redis Cloud. |
| **ECONNREFUSED / timeout** (PostgreSQL) | Add `DATABASE_URL` in Render. Use Render PostgreSQL add-on or [Supabase](https://supabase.com). |
| **ECONNREFUSED** (MongoDB) | Add `MONGODB_URL` in Render. Use [MongoDB Atlas](https://mongodb.com/cloud/atlas) (free tier). |
| **ENOENT / address: "%20--tls%20-u%20redis://..."** (Redis) | You pasted the redis-cli command. Use only the URL. For Upstash use `rediss://default:PASSWORD@host:6379` (double s = TLS). |
| **self-signed certificate in certificate chain** (PostgreSQL) | Add `DATABASE_SSL_REJECT_UNAUTHORIZED=false` in Render Environment. Some cloud Postgres use internal CAs. |
| **Connection terminated due to connection timeout** (PostgreSQL) | 1) **Supabase paused:** Free tier projects pause after inactivity — open Supabase Dashboard to wake. 2) **Use pooler:** `DATABASE_URL` must use port **6543** (pooler), not 5432. Format: `postgresql://postgres.[REF]:[PWD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require`. 3) **DATABASE_SSL=true** in Render. 4) **Pool size:** Add `DATABASE_POOL_SIZE=5` if Supabase free tier (15 conn limit). 5) **Try direct URL** as fallback: port 5432, `db.[REF].supabase.co` — sometimes more reliable than pooler. |
| **Admin dashboard "Skip login" fails** | 1) **Render:** Add `OTP_DEV_BYPASS=true` in Environment → Redeploy. 2) **Vercel:** Add `VITE_API_URL=https://your-backend.onrender.com` in Environment Variables → Redeploy. 3) **CORS:** Add `https://shhh-admin.vercel.app` (or your admin URL) to `CORS_ORIGINS` on Render. 4) **DB:** Run `npm run seed` against production DB so at least one admin exists. |

### Render: Required Environment Variables

Render containers have **no local databases**. You must set these in **Dashboard → Your Web Service → Environment**:

| Variable | Where to get it |
|----------|-----------------|
| `DATABASE_URL` | Render PostgreSQL add-on, or Supabase pooler URL |
| `REDIS_URL` | [Upstash](https://console.upstash.com/) → Create Database → copy URL |
| `MONGODB_URL` | [MongoDB Atlas](https://cloud.mongodb.com/) → Connect → Drivers → copy URI (add `authSource=admin`) |
| `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PHONE_HASH_PEPPER` | `openssl rand -hex 32` (three different values) |
| `CORS_ORIGINS` | Your frontend URL(s), comma-separated, no trailing slash |
| `NODE_ENV` | `production` |
| `OTP_DEV_BYPASS` | `true` — Enables one-click "Skip login" on admin dashboard (remove when Twilio configured) |
