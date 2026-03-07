# Supabase Photo Bucket Planning

Planning document for migrating photo storage to Supabase Storage.

---

## Current Setup

- **Upload**: `POST /v1/media/upload` → backend stores file locally, returns `storage_path` / `url`
- **URLs**: `getMediaUrl(path)` → `${API_BASE}/uploads${path}` (backend serves files)
- **Thumbnails**: `getThumbnailUrl` expects `/photos/thumbs/thumb_{stem}.jpg`
- **Usage**: Profile photos (`photosJson`), albums (`storage_path`), stories (`media_storage_path`), messages (self-destruct)

---

## Proposed Bucket Layout

| Bucket / Path | Purpose |
|---------------|---------|
| `photos/` | Profile photos |
| `albums/{albumId}/` | Album media |
| `stories/` | Stories (24h TTL) |
| `messages/` | Self-destruct message media |
| `verification/` | Verification selfies |

---

## Path Conventions

- Keep `/photos/`, `/albums/`, etc. for compatibility with `getMediaUrl` / `getThumbnailUrl`
- Or switch to Supabase URLs and update `getMediaUrl` / `getThumbnailUrl` in `mobile/src/api/client.ts`

---

## Thumbnails

- **Option A**: Supabase Image Transformations (on-the-fly resize)
- **Option B**: Separate `thumbs/` prefix or bucket
- Ensure `getThumbnailUrl` matches chosen structure

---

## RLS (Row Level Security)

- Per-bucket RLS for `photos`, `albums`, `stories`, `messages`, `verification`
- Service role for backend uploads
- User role for reads where allowed (e.g. shared albums, revealed photos)

---

## Upload Flow Options

| Option | Description |
|--------|-------------|
| **A** | Backend proxies to Supabase (keeps current API, minimal client change) |
| **B** | Client gets signed upload URL from backend, uploads directly to Supabase |

---

## Migration Steps

1. Create buckets in Supabase Dashboard
2. Configure RLS policies
3. Backfill existing `/uploads/*` files into Supabase
4. Update `StorageService` in backend to use Supabase client
5. Update `getMediaUrl` to serve from Supabase (or CDN in front)
6. Deploy and verify

---

## Album Add-Photo API

- **Backend**: `POST /v1/media/albums/:id/media` with `{ mediaId }` — ✅ exists
- **Mobile**: `albumsApi.addMedia(albumId, mediaId)` — ✅ added
- Flow: Upload via `/v1/media/upload` → get `id` → call `addMedia(albumId, id)`
