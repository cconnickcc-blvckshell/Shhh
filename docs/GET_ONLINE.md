# Get Shhh Running Online

Step-by-step guide to connect the app to cloud databases and deploy it online.

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

From project root, with `.env` containing your Supabase **direct** URL:

```bash
cd backend
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require" \
DATABASE_SSL=true \
npm run migrate
```

Or add to `.env` temporarily:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require
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
   | `DATABASE_URL` | Supabase pooler URL |
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
