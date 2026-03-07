# Discovery & Photos — Root Cause Review

> **Date:** March 2026  
> **Issue:** 70 users in DB but none show in Discover (except occasionally second account); profile pics and stories pics not showing.

---

## 1. Discovery: Why Users Don't Show Up

### Root Cause: `locations` Table

Discovery **requires** a row in `locations` for each user. The query does:

```sql
FROM user_profiles them
JOIN users u ON them.user_id = u.id
JOIN locations l ON them.user_id = l.user_id   -- ← Users without a row are EXCLUDED
```

**When do users get a `locations` row?**

- **Seed users:** Yes — seed script inserts NYC-area coords for 16 users.
- **Real signups:** **Only when they open Discover** and `load()` runs → `discoverApi.updateLocation(lat, lng)` → `POST /v1/discover/location`.

So if a user signs up but:
- Never opens the Discover tab, or
- Opens it before location is ready (web geo denied, etc.), or
- Signs up via admin/API without ever using the app

…they **never get a `locations` row** and are **invisible in discovery**.

### Other Filters (Less Likely)

- **discovery_visible_to:** Default is `'all'` (migration 023). NULL would fail the filter, but new profiles get the default.
- **seeking_*** (bidirectional): If your profile has `seeking_genders = ['woman']`, you’d only see women. Check Edit Profile → Discovery & Privacy.
- **Redis cache:** 30s TTL per user/lat/lng — can cause stale results, not wholesale missing users.

### Fix: Backfill Locations

Run a one-time backfill for users who have `user_profiles` but no `locations` row. Use NYC (or your test center) as default:

```sql
INSERT INTO locations (user_id, geom_point, is_precise_mode, updated_at)
SELECT up.user_id, ST_SetSRID(ST_MakePoint(-74.006, 40.7128), 4326), false, NOW()
FROM user_profiles up
WHERE NOT EXISTS (SELECT 1 FROM locations l WHERE l.user_id = up.user_id);
```

Then clear discovery cache (or wait 30s) and refresh Discover.

---

## 2. Photos: Why Profile Pics and Stories Don’t Show

### Root Cause: Ephemeral Filesystem on Render

- **Current setup:** Backend writes files to `backend/uploads/` (local disk).
- **URLs:** `getMediaUrl(path)` → `${API_BASE}/uploads${path}` (e.g. `https://your-api.onrender.com/uploads/photos/abc123.jpg`).
- **On Render:** The filesystem is **ephemeral**. On deploy or restart, `uploads/` is empty. Any uploaded files are lost.
- **Seed photos:** Paths like `/photos/stock/portrait_m1.jpg` — those files exist only in your local `backend/uploads/photos/stock/` and are never on Render.

So:
- **Profile pics:** `photos_json` holds paths like `/photos/xxx.jpg` → backend serves from `uploads/` → on Render, files don’t exist → 404.
- **Stories:** Same — `media.storage_path` points to local paths → 404 on production.

### Fix: Supabase Storage

You need **persistent object storage**. Supabase Storage is the right choice.

---

## 3. Supabase Bucket: What to Call It

### Option A: Single Bucket (Recommended)

**Bucket name:** `media`

**Path structure (matches current convention):**

| Path Prefix | Purpose |
|-------------|---------|
| `photos/` | Profile photos |
| `albums/` | Album media (or `albums/{albumId}/`) |
| `stories/` | 24h stories |
| `messages/` | Self-destruct message media |
| `verification/` | Verification selfies |

**Pros:** One bucket, simpler RLS, same path layout as today (`/photos/`, `/albums/`, etc.).

### Option B: Multiple Buckets

| Bucket | Purpose |
|--------|---------|
| `photos` | Profile photos |
| `albums` | Album media |
| `stories` | Stories |
| `messages` | Message media |
| `verification` | Verification |

**Pros:** Finer-grained RLS per content type. **Cons:** More buckets to manage.

### Recommendation

Use **one bucket named `media`** with the path structure above. That keeps `getMediaUrl` and `getThumbnailUrl` logic simple when you switch from local `uploads/` to Supabase URLs.

---

## 4. Implementation Status

### Locations backfill ✅

Script: `backend/src/database/backfill-locations.ts`

```bash
cd backend && npm run backfill:locations
```

Assigns varied coordinates across 35 cities in USA and Canada (deterministic per user_id). Run on production DB to backfill users without locations.

### Supabase Storage migration ✅

- **Backend:** When `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, uploads go to bucket `media` instead of local disk. Paths: `photos/`, `albums/`, `stories/`, `messages/`, `verification/`.
- **Mobile:** Set `EXPO_PUBLIC_MEDIA_URL=https://YOUR_PROJECT.supabase.co/storage/v1/object/public/media` in Vercel/Render so profile pics and stories load from Supabase.
- **Bucket:** Create bucket `media` in Supabase Dashboard → Storage. Make it **public** (Storage → media → Policies → enable public read).

### Next steps

1. **Production:** Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` to Render; add `EXPO_PUBLIC_MEDIA_URL` to Vercel.
2. **Backfill:** Run `npm run backfill:locations` against production DB.
3. **Existing photos:** Old uploads in local `uploads/` are not migrated. New uploads will use Supabase. To migrate existing files, run a separate script to copy from disk to Supabase.

See `docs/archive/SUPABASE_PHOTO_BUCKETS.md` for the original planning.
