# Panic / Venue Distress Flow — Deep Audit Report

**User-reported issue:** Created a panic alert at a venue with another account. It doesn't show: (1) in the venue, (2) no alert notification in venue option anywhere, (3) doesn't show in admin dashboard.

**Date:** 2025-03-06

---

## 1. Implementation Overview

There are **two distinct safety flows** that are often conflated:

| Flow | Endpoint | Trigger Location | Persistence | Admin Visibility |
|------|----------|------------------|-------------|------------------|
| **Panic** | `POST /v1/safety/panic` | Profile tab → Panic Alert button | `safety_checkins` (type `panic`) + `audit_logs` | ✅ Yes (Safety page) |
| **Venue Distress** | `POST /v1/safety/venue-distress` | Venue detail → Distress button | `audit_logs` only | ❌ No |

**Root cause:** The user likely triggered **venue distress** (Distress button on venue page). Venue distress is **never persisted to `safety_checkins`** and **never queried by admin** — it only goes to `audit_logs` and emits a WebSocket event to venue staff.

---

## 2. File Inventory

### Backend — Safety Module
| File | Purpose |
|------|---------|
| `backend/src/modules/safety/safety.service.ts` | `panic()`, `recordVenueDistress()`, contacts, check-ins |
| `backend/src/modules/safety/safety.controller.ts` | HTTP handlers |
| `backend/src/modules/safety/safety.routes.ts` | Route definitions |
| `backend/src/modules/safety/panic-notify.service.ts` | SMS + push to emergency contacts (panic only) |

### Backend — Admin
| File | Purpose |
|------|---------|
| `backend/src/modules/admin/admin-extended.service.ts` | `getSafetyAlerts()` — queries `safety_checkins` type `panic` only |
| `backend/src/modules/admin/admin-extended.routes.ts` | `GET /v1/admin/safety/alerts` |

### Admin Dashboard
| File | Purpose |
|------|---------|
| `admin-dashboard/src/pages/Safety.tsx` | Safety Center — panic alerts, missed check-ins, pending reports |
| `admin-dashboard/src/api/client.ts` | `getSafetyAlerts()` |
| `admin-dashboard/src/pages/Venues.tsx` | Venue list — no distress alerts |
| `admin-dashboard/src/pages/Dashboard.tsx` | Overview — `panic_24h` from `safety_checkins` |

### Mobile
| File | Purpose |
|------|---------|
| `mobile/app/(tabs)/profile.tsx` | Panic Alert button → `safetyApi.panic(lat, lng)` |
| `mobile/app/venue/[id].tsx` | Distress button → `safetyApi.venueDistress(id)` |
| `mobile/app/profile/venue-dashboard/[id].tsx` | Venue owner dashboard — no distress alerts section |
| `mobile/src/api/client.ts` | `safetyApi.panic`, `safetyApi.venueDistress` |
| `mobile/src/hooks/useSocket.ts` | WebSocket — **no `venue_distress` listener** |

### WebSocket
| File | Purpose |
|------|---------|
| `backend/src/websocket/index.ts` | `emitToUser(userId, 'venue_distress', { userId, venueId })` |

---

## 3. Flow Trace

### 3.1 Panic (Profile → Panic Alert)
1. User taps **Panic Alert** on Profile tab.
2. `safetyApi.panic(lat, lng)` → `POST /v1/safety/panic`.
3. **Backend:**
   - Inserts `safety_checkins` (type `panic`, location, `alert_sent=true`).
   - Notifies emergency contacts via `panic-notify.service` (SMS + push).
   - Inserts `audit_logs` (`safety.panic_triggered`).
4. **Admin:** `getSafetyAlerts()` queries `safety_checkins WHERE type = 'panic'` → shows in Safety page.
5. **Dashboard overview:** `panic_24h` count from `safety_checkins`.

### 3.2 Venue Distress (Venue → Distress)
1. User taps **Distress** on venue detail page (must be checked in).
2. `safetyApi.venueDistress(venueId)` → `POST /v1/safety/venue-distress`.
3. **Backend:**
   - Verifies `venue_checkins` (user checked in at venue).
   - Selects `venue_staff` (active staff for venue).
   - Inserts `audit_logs` (`safety.venue_distress`, metadata: `{ venueId, staffNotified }`).
   - **Does NOT insert into `safety_checkins`.**
   - Emits `emitToUser(staffId, 'venue_distress', { userId, venueId })` for each staff.
4. **Admin:** `getSafetyAlerts()` does **not** query `audit_logs` for `safety.venue_distress` → **never shown**.
5. **Venue page:** No section showing active distress alerts.
6. **Venue dashboard:** No distress alerts section; no API to fetch them.
7. **Venue staff:** Receive WebSocket `venue_distress` only if:
   - They are in `venue_staff` with `is_active = true`.
   - They have an active WebSocket connection (mobile app open with `useSocket`).
   - **Mobile `useSocket` has no `onVenueDistress` handler** — staff would need to add a listener.

---

## 4. Identified Gaps

| # | Gap | Impact |
|---|-----|--------|
| 1 | **Venue distress not in `safety_checkins`** | Admin Safety page only queries `safety_checkins`; venue distress never appears. |
| 2 | **Admin `getSafetyAlerts()` ignores `audit_logs`** | No query for `safety.venue_distress` in admin. |
| 3 | **Venue page has no distress alerts display** | User who triggered distress sees no confirmation of active alerts at venue. |
| 4 | **Venue dashboard has no distress section** | Owner/staff dashboard shows stats but no active distress alerts. |
| 5 | **No API to fetch venue distress alerts** | No `GET /venues/:id/distress-alerts` or similar. |
| 6 | **Mobile `useSocket` has no `venue_distress` handler** | Venue staff do not receive in-app notification even if WebSocket emits. |
| 7 | **Admin Venues page has no distress count** | Venue list shows check-ins, events, ads — not distress. |
| 8 | **Venue distress requires venue staff** | If venue has no staff in `venue_staff`, `staffNotified: 0` and no one gets the WebSocket. |

---

## 5. Where Things Should Show (Intended vs Actual)

| Location | Panic | Venue Distress |
|----------|-------|----------------|
| **Admin Safety page** | ✅ Panic Alerts (24h) | ❌ Not shown |
| **Admin Dashboard overview** | ✅ panic_24h count | ❌ Not counted |
| **Admin Venues page** | N/A | ❌ No per-venue distress count |
| **Venue detail (mobile)** | N/A | ❌ No active alerts section |
| **Venue dashboard (mobile)** | N/A | ❌ No distress alerts section |
| **Venue staff (WebSocket)** | N/A | ⚠️ Emitted but no mobile listener |

---

## 6. Concrete Fix Recommendations

### 6.1 Persist Venue Distress for Admin Visibility (High Priority)

**Option A — Extend `safety_checkins`:** Add a new type or column.

- Migration: Add `venue_id UUID REFERENCES venues(id)` to `safety_checkins` (nullable).
- When `recordVenueDistress` runs: also insert a row into `safety_checkins` with `type = 'venue_distress'` (requires schema change: `CHECK (type IN (..., 'venue_distress'))`).
- **Simpler:** Use `event_id` as overload for venue context, or add `venue_id` column.

**Option B — Query `audit_logs` for venue distress:** No schema change.

- In `admin-extended.service.ts` `getSafetyAlerts()`: add a third query:
  ```sql
  SELECT al.*, p.display_name, v.name as venue_name
  FROM audit_logs al
  LEFT JOIN user_profiles p ON al.user_id = p.user_id
  LEFT JOIN venues v ON (al.metadata_json->>'venueId')::uuid = v.id
  WHERE al.action = 'safety.venue_distress'
    AND al.created_at > NOW() - INTERVAL '24 hours'
  ORDER BY al.created_at DESC
  ```
- Return as `venueDistressAlerts` in `getSafetyAlerts()`.
- Update `admin-dashboard/src/pages/Safety.tsx` to render a "Venue Distress (24h)" section.

### 6.2 Admin Safety Page — Add Venue Distress Section (High Priority)

- Add `venueDistressAlerts` to `getSafetyAlerts()` response (Option B above).
- In `Safety.tsx`, add a section:
  ```tsx
  <h3>Venue Distress (24h)</h3>
  {alerts.venueDistressAlerts?.length === 0 ? (
    <GlassCard>No venue distress in the last 24 hours ✓</GlassCard>
  ) : alerts.venueDistressAlerts?.map(...)}
  ```

### 6.3 Venue Dashboard — Show Distress Alerts (Medium Priority)

- Add `getVenueDistressAlerts(venueId)` to `venue-dashboard.service.ts` (query `audit_logs` where `action = 'safety.venue_distress'` and `metadata_json->>'venueId' = venueId`).
- Include in `getDashboard(venueId)` response.
- In `mobile/app/profile/venue-dashboard/[id].tsx`, add a "Distress Alerts" section (e.g. last 24h).

### 6.4 Venue Detail Page — Optional Alert Badge (Low Priority)

- If `GET /v1/venues/:id/full` or a new endpoint returns recent distress count for the venue, show a subtle badge (e.g. "1 distress alert in last 24h") for transparency. Lower priority since the distress button is the primary action.

### 6.5 Venue Staff — WebSocket Listener (Medium Priority)

- Add `onVenueDistress` to `mobile/src/hooks/useSocket.ts`:
  ```ts
  const onVenueDistress = useCallback((handler: MessageHandler) => {
    socketRef.current?.on('venue_distress', handler);
    return () => { socketRef.current?.off('venue_distress', handler); };
  }, []);
  ```
- In venue dashboard (or a dedicated staff view), use `useSocket().onVenueDistress` to show an immediate alert/toast when distress is signaled.
- Consider push notification for staff when app is backgrounded (separate worker/Expo push).

### 6.6 Admin Venues Page — Distress Count (Low Priority)

- In `listVenues()`, add a subquery for distress count per venue (last 24h from `audit_logs`).
- Display in the venue card (e.g. "2 distress" in red if > 0).

### 6.7 Dashboard Overview — Include Venue Distress (Low Priority)

- Add `venue_distress_24h` to `getDashboardOverview()` safety query.
- Optionally add to StatusBar or overview cards.

---

## 7. Summary

| Item | Status |
|------|--------|
| Panic flow | ✅ Working — persisted, admin shows it |
| Venue distress flow | ⚠️ Partially working — audit log + WebSocket, but no admin/venue UI |
| Admin Safety page | ❌ Missing venue distress |
| Venue dashboard | ❌ No distress alerts |
| Venue staff notification | ⚠️ WebSocket emitted, no mobile listener |

**Recommended priority:**  
1. Add venue distress to admin Safety page (Option B — query `audit_logs`).  
2. Add `onVenueDistress` to `useSocket` and surface in venue dashboard.  
3. Add distress alerts to venue dashboard API.  
4. Optionally persist venue distress to `safety_checkins` for consistency (Option A).
