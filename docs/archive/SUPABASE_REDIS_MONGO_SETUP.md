# Supabase + Redis + MongoDB Setup Guide

This guide configures Shhh to run with **Supabase** (PostgreSQL + PostGIS), **Redis**, and **MongoDB** — the target production stack.

**How it works:** The backend uses standard PostgreSQL (`pg`), Redis (`ioredis`), and MongoDB (`mongoose`). No Supabase SDK — just connection strings. Migrations run via `npm run migrate` and read `DATABASE_URL` from `.env`.

---

## 1. Supabase (PostgreSQL + PostGIS)

### Create project

1. [Supabase Dashboard](https://supabase.com/dashboard) → New Project
2. Choose region, set database password, create project.

### Enable PostGIS (optional — migrations do this)

PostGIS is required for discovery. Migration `001_initial.sql` runs `CREATE EXTENSION IF NOT EXISTS postgis`. Supabase has PostGIS available; the migration will enable it. You can also run manually in SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Get connection string

1. **Settings** → **Database**
2. **Connection string** → **URI**
3. Use the **direct** connection for migrations (pooler can block some DDL):
   - `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`
4. Add `?sslmode=require` if not present.
5. For the **app** (after migrations), you can use the **pooler** for serverless:
   - `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require`

### Run migrations

From project root, with `.env` containing `DATABASE_URL`:

```bash
cd backend
npm run migrate
```

Or inline (use **direct** connection for migrations):

```bash
cd backend
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require" DATABASE_SSL=true npm run migrate
```

**Migrations:** The script reads `backend/src/database/migrations/*.sql` in order, runs each file in a transaction, and records it in `schema_migrations`. Idempotent — already-applied files are skipped.

**Flow:** `npm run migrate` → `tsx src/database/migrate.ts` → loads `.env` from project root → `getPool()` uses `DATABASE_URL` → connects to Postgres → runs SQL files. Same flow for local Postgres or Supabase; only the URL changes.

### Environment variables

```env
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
DATABASE_SSL=true
DATABASE_POOL_SIZE=20
```

---

## 2. Redis

### Option A: Upstash (serverless-friendly)

1. [Upstash Console](https://console.upstash.com/) → Create database
2. Copy the Redis URL (e.g. `redis://default:xxx@xxx.upstash.io:6379`)

```env
REDIS_URL=redis://default:[PASSWORD]@[ENDPOINT].upstash.io:6379
```

### Option B: Redis Cloud

1. [Redis Cloud](https://redis.com/try-free/) → Create subscription
2. Create database, copy connection string

```env
REDIS_URL=redis://default:[PASSWORD]@[HOST]:[PORT]
```

### Option C: Self-hosted (Docker)

```bash
docker run -d -p 6379:6379 redis:7-alpine
```

```env
REDIS_URL=redis://localhost:6379
```

---

## 3. MongoDB

### Option A: MongoDB Atlas

1. [Atlas](https://www.mongodb.com/cloud/atlas) → Create cluster
2. Database Access → Add user
3. Network Access → Add IP (or 0.0.0.0/0 for cloud backends)
4. Connect → Drivers → Copy connection string

```env
MONGODB_URL=mongodb+srv://[USER]:[PASSWORD]@[CLUSTER].mongodb.net/shhh_messages?retryWrites=true&w=majority
```

### Option B: Self-hosted (Docker)

```bash
docker run -d -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=shhh_dev \
  -e MONGO_INITDB_ROOT_PASSWORD=shhh_dev_password \
  mongo:7
```

```env
MONGODB_URL=mongodb://shhh_dev:shhh_dev_password@localhost:27017/shhh_messages?authSource=admin
```

---

## 4. Full .env template

```env
# Supabase
DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
DATABASE_SSL=true
DATABASE_POOL_SIZE=20

# Redis (Upstash / Redis Cloud / self-hosted)
REDIS_URL=redis://default:[PASSWORD]@[ENDPOINT]:6379

# MongoDB (Atlas / self-hosted)
MONGODB_URL=mongodb+srv://[USER]:[PASSWORD]@[CLUSTER].mongodb.net/shhh_messages?retryWrites=true&w=majority

# Rest of config (see .env.example)
NODE_ENV=production
JWT_SECRET=...
JWT_REFRESH_SECRET=...
PHONE_HASH_PEPPER=...
CORS_ORIGINS=https://app.yourdomain.com,https://admin.yourdomain.com
# ... etc
```

---

## 5. Verify

```bash
cd backend
npm run migrate
npm run dev
```

```bash
curl http://localhost:3000/health
```

---

## 6. Local development

For local dev, use docker-compose (Postgres, Redis, MongoDB):

```bash
sudo docker compose up -d
```

Then `.env` can use the default local URLs. Supabase/Upstash/Atlas are only needed for staging/production.
