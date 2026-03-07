# Admin Dashboard Map & Presence/Geo Endpoints — Deep Audit

**Date:** March 6, 2025  
**User-reported issue:** Map shows 2 dots in NYC when 2 accounts are actually online in Ontario, Canada. Map is not live/real-time.

---

## 1. Where Admin Map Gets Its Data

| Endpoint | Route | Purpose |
|----------|-------|---------|
| `getPresenceGeo` | `GET /v1/admin/presence/geo` | User locations for dots (userId, lat, lng, lastSeen, presenceState) |
| `getStatsCities` | `GET /v1/admin/stats/cities` | City-like aggregates for heat layer (lat, lng, activeCount, newThisWeek) |

**Admin API client:** `admin-dashboard/src/api/client.ts` L109–110  
**Backend routes:** `backend/src/modules/admin/admin-extended.routes.ts` L99–105  
**Backend service:** `backend/src/modules/admin/admin-extended.service.ts` L213–265  

---

## 2. Data Flow: Tables & Fields

### `getPresenceGeo` (user dots)

```
locations (l)                    presence (p)
├── user_id  ──────────────────► user_id
├── geom_point (PostGIS)         ├── state → presenceState
├── updated_at → lastSeen        └── expires_at > NOW() = "online"
└── expires_at
```

**Query (admin-extended.service.ts L214–226):**
```sql
SELECT l.user_id, ST_Y(l.geom_point::geometry) as lat, ST_X(l.geom_point::geometry) as lng,
       l.updated_at as "lastSeen", p.state as "presenceState"
FROM locations l
LEFT JOIN presence p ON l.user_id = p.user_id AND p.expires_at > NOW()
WHERE (l.expires_at IS NULL OR l.expires_at > NOW())
ORDER BY l.updated_at DESC LIMIT 5000
```

**Source tables:**
- `locations` — `geom_point`, `updated_at`, `user_id`, `expires_at`
- `presence` — `state`, `expires_at` (optional join)

### `getStatsCities` (heat layer)

Uses `locations` + `users` for grid aggregation (~11km cells). Same `locations.geom_point` source.

### Location write path (how coords get into `locations`)

```
Mobile app                    Backend
useLocation() ──► discoverApi.updateLocation(lat, lng)
                         │
                         ▼ POST /v1/discover/location
                         │
discovery.service.updateLocation(userId, lat, lng)
                         │
                         ▼ INSERT/UPDATE locations (geom_point)
```

**Write:** `backend/src/modules/discovery/discovery.service.ts` L44–56  
**Route:** `backend/src/modules/discovery/discovery.routes.ts` L34  
**Controller:** `backend/src/modules/discovery/discovery.controller.ts` L79–86  

---

## 3. Root Cause: Why NYC Instead of Ontario

The map displays coordinates stored in `locations`. Those coords come from the mobile app via `POST /v1/discover/location`. NYC (40.7128, -74.006) appears when:

### A. Mobile app sends NYC fallback

| File | Line | Issue |
|------|------|-------|
| `mobile/src/hooks/useLocation.ts` | 14–15 | `DEFAULT_LAT = 40.7128`, `DEFAULT_LNG = -74.006` |
| `mobile/src/hooks/useLocation.ts` | 61–62 | **Web:** When `navigator.geolocation` fails or is denied, calls `discoverApi.updateLocation(DEFAULT_LAT, DEFAULT_LNG)` |
| `mobile/src/hooks/useLocation.ts` | 74–75 | **Native:** When `Location.getCurrentPositionAsync` throws, calls `discoverApi.updateLocation(DEFAULT_LAT, DEFAULT_LNG)` |

**Result:** Any user who opens the app on web without granting location, or whose GPS fails, overwrites their real location with NYC in the database.

### B. Discover screen timing

| File | Line | Behavior |
|------|------|----------|
| `mobile/app/(tabs)/index.tsx` | 55–56 | `FALLBACK_LAT`, `FALLBACK_LNG` = NYC |
| `mobile/app/(tabs)/index.tsx` | 169–170 | `lat = location.loading ? FALLBACK_LAT : location.latitude` |
| `mobile/app/(tabs)/index.tsx` | 204 | `discoverApi.updateLocation(lat, lng)` in `load()` |

`load()` runs only when `!location.loading` (L224–228). At that point, if web geolocation was denied, `location` still holds `DEFAULT_LAT/LNG` and `loading: false` — so NYC is sent.

### C. Seed data

| File | Line | Behavior |
|------|------|----------|
| `backend/src/database/seed.ts` | 89–94 | Seeds all users with `jLat = 40.7128 + rand`, `jLng = -74.006 + rand` (NYC area) |

If the 2 "Ontario" accounts are from seed data or were never updated by real GPS, they will show in NYC.

### D. Admin map initial center (cosmetic only)

| File | Line | Behavior |
|------|------|----------|
| `admin-dashboard/src/pages/Map.tsx` | 55 | Map `center: [40.7128, -74.006]` when no data |

This only affects initial view; dot positions come from the API.

---

## 4. Presence State, lastSeen, lastActive for Color Coding

### Available from API

`getPresenceGeo` returns:
- `lastSeen` — `locations.updated_at` (last location update)
- `presenceState` — `presence.state` when `presence.expires_at > NOW()`, else `'unknown'`

### Current usage in Map

| File | Line | Current behavior |
|------|------|------------------|
| `admin-dashboard/src/pages/Map.tsx` | 78–90 | Single `createIcon()` — all markers use `theme.colors.primary` (neon purple) |
| `admin-dashboard/src/pages/Map.tsx` | 93–102 | `geo.forEach` — no branching on `presenceState` or `lastSeen` |

**Conclusion:** `presenceState` and `lastSeen` are returned but not used for color. All dots are purple.

---

## 5. Current vs Desired Color Logic

### Current

- All markers: neon purple (`#A855F7`)

### Desired

| Color | Condition |
|-------|-----------|
| **Neon purple** | Online now (`presenceState` present and not `'invisible'`) |
| **Blue** | Active within a week (`lastSeen` within 7 days, not online) |
| **Orange** | 1 week–1 month inactive (`lastSeen` 7–30 days ago) |
| **Grey** | Inactive over a month (`lastSeen` > 30 days ago) |

### Implementation notes

- **Online now:** `presenceState && presenceState !== 'invisible' && presenceState !== 'unknown'`
- **Active within week:** `lastSeen` within 7 days (and not online)
- **1 week–1 month:** `lastSeen` 7–30 days ago
- **Over a month:** `lastSeen` > 30 days ago

---

## 6. Files Involved

| Area | File | Role |
|------|------|------|
| **Admin map UI** | `admin-dashboard/src/pages/Map.tsx` | Map component, markers, heat, load |
| **Admin API** | `admin-dashboard/src/api/client.ts` | `getPresenceGeo`, `getStatsCities` |
| **Theme** | `admin-dashboard/src/theme.ts` | Colors (primary, info, warning, textDim) |
| **Backend admin** | `backend/src/modules/admin/admin-extended.service.ts` | `getPresenceGeo`, `getStatsCities` |
| **Backend admin** | `backend/src/modules/admin/admin-extended.routes.ts` | Route handlers |
| **Discovery** | `backend/src/modules/discovery/discovery.service.ts` | `updateLocation` (writes to `locations`) |
| **Discovery** | `backend/src/modules/discovery/discovery.controller.ts` | `updateLocation` controller |
| **Discovery** | `backend/src/modules/discovery/discovery.routes.ts` | `POST /location` route |
| **Presence** | `backend/src/modules/discovery/presence.service.ts` | Presence upsert/decay |
| **Mobile** | `mobile/src/hooks/useLocation.ts` | Location hook, NYC fallback |
| **Mobile** | `mobile/app/(tabs)/index.tsx` | Discover screen, `updateLocation` call |
| **Mobile** | `mobile/src/api/client.ts` | `discoverApi.updateLocation` |
| **DB** | `backend/src/database/migrations/001_initial.sql` | `locations` table |
| **DB** | `backend/src/database/migrations/005_presence_personas_venue_identity.sql` | `presence` table |
| **Seed** | `backend/src/database/seed.ts` | NYC-area seed locations |

---

## 7. Concrete Fix Recommendations

### Fix 1: Stop writing NYC fallback to backend (primary fix for wrong locations)

**Problem:** When location fails, the app overwrites real coords with NYC.

**File:** `mobile/src/hooks/useLocation.ts`

| Line | Change |
|------|--------|
| 59–62 | When web geolocation fails: **do not** call `discoverApi.updateLocation(DEFAULT_LAT, DEFAULT_LNG)`. Either skip the API call or surface an error so the user knows location is unavailable. |
| 73–75 | When native `getCurrentPositionAsync` fails: same — do not send NYC. Skip update or show error. |

**Alternative:** Only call `updateLocation` when we have a real position. Add a flag like `hasRealLocation` and avoid sending fallback coords to the API.

### Fix 2: Avoid Discover load with fallback coords

**File:** `mobile/app/(tabs)/index.tsx`

| Line | Change |
|------|--------|
| 224–228 | Only run `load()` when `!location.loading` **and** we have non-fallback coords (e.g. `location.permissionGranted` or `location.latitude !== FALLBACK_LAT`). Or gate `updateLocation` so it is never called with fallback values. |

### Fix 3: Add color coding to admin map

**File:** `admin-dashboard/src/pages/Map.tsx`

| Line | Change |
|------|--------|
| 77–90 | Replace single `createIcon()` with `createIcon(color: string)` that accepts a color. |
| 92–102 | For each `p`, compute `color` from `p.presenceState` and `p.lastSeen`: purple if online, blue if &lt; 7d, orange if 7–30d, grey if &gt; 30d. Pass `color` to `createIcon(color)`. |

**Helper (add near top of component):**
```ts
function getMarkerColor(p: { presenceState?: string; lastSeen: string }): string {
  const isOnline = p.presenceState && p.presenceState !== 'invisible' && p.presenceState !== 'unknown';
  if (isOnline) return theme.colors.primary; // neon purple
  const age = Date.now() - new Date(p.lastSeen).getTime();
  const day = 86400000;
  if (age < 7 * day) return theme.colors.info;      // blue
  if (age < 30 * day) return theme.colors.warning;  // orange
  return theme.colors.textDim;                       // grey
}
```

### Fix 4: Make map more live/real-time

**File:** `admin-dashboard/src/pages/Map.tsx`

| Line | Change |
|------|--------|
| 40 | Add polling: `useEffect(() => { const id = setInterval(load, 30000); return () => clearInterval(id); }, []);` (refresh every 30s). Or add a "Live" toggle that enables/disables polling. |

### Fix 5: Filter deleted users in getPresenceGeo

**File:** `backend/src/modules/admin/admin-extended.service.ts`

| Line | Change |
|------|--------|
| 214–223 | Add `JOIN users u ON l.user_id = u.id AND u.deleted_at IS NULL` so soft-deleted users are excluded. |

### Fix 6: Optional — improve seed data for non-NYC testing

**File:** `backend/src/database/seed.ts`

| Line | Change |
|------|--------|
| 89–90 | Use varied coordinates (e.g. Ontario: 43.65, -79.38) or make seed locations configurable so dev/test data isn’t all NYC. |

---

## Summary

| Issue | Root cause | Fix location |
|-------|------------|--------------|
| Dots in NYC instead of Ontario | Mobile sends NYC fallback when location fails | `mobile/src/hooks/useLocation.ts` L59–62, L73–75 |
| Map not live | Single load on mount, manual Refresh only | `admin-dashboard/src/pages/Map.tsx` L40 |
| No color coding | All markers use `theme.colors.primary` | `admin-dashboard/src/pages/Map.tsx` L77–102 |
| presenceState/lastSeen unused | Not wired to marker color | Same as above |
| Deleted users on map | No `deleted_at` filter | `admin-extended.service.ts` L214–223 |
