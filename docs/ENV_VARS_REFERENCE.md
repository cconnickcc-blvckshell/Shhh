# Shhh — Environment Variables Reference (Complete)

**Purpose:** Single source of truth for what env vars the app actually uses, where they come from, and what to set.

---

## 1. APP_URL

| Used in | Purpose |
|---------|---------|
| `backend/src/modules/billing/subscription.service.ts` | Stripe checkout success/cancel redirect URLs |

**What it should be:**
- **Mobile app:** `shhh://` — custom URL scheme for deep links (Stripe redirects back to app)
- **Web app:** `https://your-app.vercel.app/` or `https://app.shhh.social/` — full URL so Stripe redirects to your web app

**Current value `shhh://`** is correct for mobile. If you have a web app for subscriptions, set it to your web URL (e.g. `https://shhh-7sks.onrender.com` is your backend — but subscriptions typically redirect to the *client* app, not the API). So:
- Mobile-only: `shhh://` ✓
- Web: `https://your-mobile-web.vercel.app/` (the URL users see in browser)

---

## 2. Database — What You Need

**The app uses PostgreSQL only via `DATABASE_URL`.** There is no `SUPABASE_URL` in the codebase.

| Variable | Required | Where to get it | Used for |
|----------|----------|-----------------|----------|
| **DATABASE_URL** | Yes | Supabase Dashboard → Settings → Database → **Connection string (URI)** | App runtime (queries, reads, writes) |
| **DATABASE_MIGRATION_URL** | Optional | Same place — use **direct** connection (port 5432) | Migrations only (when pooler blocks DDL) |
| **DATABASE_SSL** | Yes (cloud) | Set to `true` when using Supabase | SSL for Postgres |
| **DATABASE_POOL_SIZE** | Optional | Default 10 for cloud | Connection pool size |

**Supabase gives you two URLs:**
1. **Pooler** (port 6543) → use for `DATABASE_URL`
   ```
   postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
   ```
2. **Direct** (port 5432) → use for `DATABASE_MIGRATION_URL` (migrations only)
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require
   ```

**You do NOT need:**
- `SUPABASE_URL` — not used
- `SUPABASE_ANON_KEY` — not used
- `SUPABASE_SERVICE_ROLE_KEY` — not used

---

## 3. Photos / Media — Buckets?

**No buckets required.** The app stores uploads on the **local filesystem** (`backend/uploads/`).

| Storage | Implementation | Env vars needed |
|---------|----------------|-----------------|
| Photos, albums, self-destruct | Local disk (`backend/uploads/`) | **None** |
| S3 / GCS | Not implemented | N/A |

**On Render:** The filesystem is ephemeral — uploads are lost on redeploy. The app works; new uploads persist until the next deploy. For production persistence you'd need to add S3/GCS later (not in current codebase).

---

## 4. Required for Render (Backend)

| Variable | Source |
|----------|--------|
| **DATABASE_URL** | Supabase pooler URL (above) |
| **DATABASE_MIGRATION_URL** | Supabase direct URL (for migrations only) |
| **DATABASE_SSL** | `true` |
| **REDIS_URL** | Upstash or Redis Cloud |
| **MONGODB_URL** | MongoDB Atlas |
| **JWT_SECRET** | `openssl rand -hex 32` |
| **JWT_REFRESH_SECRET** | `openssl rand -hex 32` |
| **PHONE_HASH_PEPPER** | `openssl rand -hex 32` |
| **CORS_ORIGINS** | `https://shhh-admin.vercel.app,https://your-mobile.vercel.app` (comma-separated) |
| **NODE_ENV** | `production` |

---

## 5. Optional but Recommended

| Variable | Purpose |
|----------|---------|
| **TWILIO_ACCOUNT_SID**, **TWILIO_AUTH_TOKEN**, **TWILIO_PHONE_NUMBER** | SMS for OTP, panic alerts |
| **STRIPE_SECRET_KEY**, **STRIPE_WEBHOOK_SECRET** | Subscriptions |
| **GOOGLE_CLIENT_ID**, **APPLE_***, **SNAP_CLIENT_ID**, **SNAP_CLIENT_SECRET**, **SNAP_REDIRECT_URI** | OAuth sign-in |
| **APP_URL** | Stripe redirect (see §1) |
| **METRICS_SECRET** | Protect `/metrics` endpoint |

---

## 6. Do NOT Set in Production

| Variable | Reason |
|----------|--------|
| **OTP_DEV_BYPASS** | Backend exits on startup if set |

---

## 7. Twilio — Why It Works in Console But Not From the App

**Trial account limitation:** Twilio trial accounts can **only send SMS to phone numbers you've verified** in the Twilio Console.

| Scenario | Result |
|----------|--------|
| Send to +15196136330 (verified in Console) | Works |
| Send to any other number (not verified) | Fails with error 21608 |

**Fix:** Either (a) verify each user's number in [Twilio Console → Phone Numbers → Verified Caller IDs](https://www.twilio.com/console/phone-numbers/verified), or (b) upgrade to a paid Twilio account.

**Also:** Trial accounts must use your **trial/sandbox phone number** as `TWILIO_PHONE_NUMBER`. You cannot use a custom number until paid.

**Env vars (exact names):**
- `TWILIO_ACCOUNT_SID` — starts with `AC`
- `TWILIO_AUTH_TOKEN` — from Console (not the API key)
- `TWILIO_PHONE_NUMBER` — e.g. `+17164568981` (your trial number)

---

## 8. Photos / Albums — Persistent Storage

**Current:** Photos are stored in `backend/uploads/` (local disk). On Render, this is **ephemeral** — uploads are lost on redeploy.

**For production with albums:** You need persistent storage. Options:
- **Supabase Storage** — buckets for photos; requires adding storage integration to the codebase
- **AWS S3** — same; `storage_provider` column supports `s3` but it's not implemented yet
- **Render Disk** — Render offers persistent disks you can mount; would require config changes

**Right now:** The app works; new uploads persist until the next deploy. For a real launch with shared albums, you'd need to add S3/Supabase Storage. The schema (`storage_provider` = 'local'|'s3'|'gcs') is ready; the S3/GCS implementation is not in the codebase yet.

---

## 9. Quick Checklist for Render

- [ ] `DATABASE_URL` = Supabase pooler URL (port 6543)
- [ ] `DATABASE_SSL` = `true`
- [ ] `REDIS_URL` = Upstash URL
- [ ] `MONGODB_URL` = Atlas URL
- [ ] `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PHONE_HASH_PEPPER` = generated
- [ ] `CORS_ORIGINS` = your frontend URLs
- [ ] `NODE_ENV` = `production`
- [ ] `APP_URL` = `shhh://` (mobile) or your web app URL (web)
- [ ] No `OTP_DEV_BYPASS` in production
