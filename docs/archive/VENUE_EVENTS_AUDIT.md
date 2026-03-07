# Venue–Events Relationship Audit

**User-reported issue:** In venues there is no way to create an event in any way, and no way to view active events.

**Audit date:** 2025-03-06

---

## 1. Schema: Venue–Event Relationship

### Tables

| Table | Key columns | Relationship |
|-------|-------------|--------------|
| `venues` | `id` (UUID) | — |
| `events` | `id`, `venue_id` (UUID FK → venues.id) | Many events per venue |

**Schema source:** `backend/src/database/migrations/001_initial.sql`

```sql
-- events table (lines 138–154)
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID REFERENCES venues(id),  -- FK, nullable
    host_user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    ...
);
```

- **`venue_id`** is optional (nullable). Events can exist without a venue.
- Indexes: `idx_events_venue_starts` (031) for `(venue_id, starts_at)`.
- Related: `presence`, `venue_chat_rooms`, `event_series` also reference `venue_id` and/or `event_id`.

---

## 2. Event Creation Flow

### Backend

| File | Behavior |
|------|----------|
| `backend/src/modules/events/events.service.ts` | `createEvent(hostUserId, data)` accepts `venueId?: string` (optional) |
| `backend/src/modules/events/events.routes.ts` | `POST /` with `createEventSchema` (venueId optional) |
| `backend/src/modules/events/events.controller.ts` | Passes `req.body` to `createEvent` |

**Create event payload:** `venueId` is optional. Events can be created with or without a venue.

### Mobile UI

| File | Behavior |
|------|----------|
| `mobile/app/profile/create-event.tsx` | Create-event form; loads venues from `getNearby` + `getMyVenues`; user picks venue via chips |
| `mobile/app/profile/hosting.tsx` | "Create event" button → `router.push('/profile/create-event')` |

**Entry points for create event:**

- Profile → Hosting → "Create event"
- No entry from venue context (venue detail, venue dashboard, My Venues)

---

## 3. Venue Detail / Dashboard — Events Display

### Public venue profile (`GET /v1/venues/:id/full`)

| File | Behavior |
|------|----------|
| `backend/src/modules/venues/venue-dashboard.service.ts` | `getFullVenueProfile` includes `upcomingEvents` (up to 5) |
| `mobile/app/venue/[id].tsx` | Renders "UPCOMING EVENTS" when `venue.upcomingEvents?.length > 0` |

**Events shown:** Up to 5 upcoming/active events. Section only appears if there are events.

### Venue owner dashboard (`GET /v1/venues/:id/dashboard`)

| File | Behavior |
|------|----------|
| `backend/src/modules/venues/venue-dashboard.service.ts` | `getDashboard` includes `upcomingEvents` (up to 5) |
| `mobile/app/profile/venue-dashboard/[id].tsx` | Renders "Upcoming events" when `upcomingEvents.length > 0` |

**Events shown:** Same as public profile; no "Create event" action.

---

## 4. Events Listing — Venue Filter

### Public events API

| Endpoint | File | Venue filter? |
|----------|------|---------------|
| `GET /v1/events/nearby` | `events.controller.ts` → `getNearby` | No |
| `GET /v1/events/this-week` | `events.controller.ts` → `getThisWeek` | No |

**`EventsService.getNearbyEvents`** filters by lat/lng, vibe, date range. No `venueId` parameter.

### Admin events API

| Endpoint | File | Venue filter? |
|----------|------|---------------|
| `GET /v1/admin/events/list` | `admin-extended.service.ts` → `listEvents` | No |

Returns all events with `venue_name`; no `venueId` query param.

---

## 5. UI Gaps

| Gap | Location | Impact |
|-----|----------|--------|
| No "Create event" from venue context | Venue dashboard, venue detail, My Venues | Venue owners must go Profile → Hosting → Create event and manually pick venue |
| No "Create event" in venue dashboard | `profile/venue-dashboard/[id].tsx` | Same as above |
| No "Create event" on venue detail | `venue/[id].tsx` | Same as above |
| "Events at this venue" is read-only | Venue detail & dashboard | Can view events but not create from venue |
| Events tab cannot filter by venue | `(tabs)/events.tsx` | Users cannot see only events at a given venue |
| Admin Events has no venue filter | `admin-dashboard/src/pages/Events.tsx` | Admins cannot filter events by venue |

---

## 6. File Inventory

| Category | Path |
|----------|------|
| **Venues routes** | `backend/src/modules/venues/venues.routes.ts` |
| **Venue dashboard routes** | `backend/src/modules/venues/venue-dashboard.routes.ts` |
| **Venue identity routes** | `backend/src/modules/venues/venue-identity.routes.ts` |
| **Events routes** | `backend/src/modules/events/events.routes.ts` |
| **Venue detail (public)** | `mobile/app/venue/[id].tsx` |
| **Venue dashboard (owner)** | `mobile/app/profile/venue-dashboard/[id].tsx` |
| **Events tab** | `mobile/app/(tabs)/events.tsx` |
| **Create event** | `mobile/app/profile/create-event.tsx` |
| **Admin Venues** | `admin-dashboard/src/pages/Venues.tsx` |
| **Admin Events** | `admin-dashboard/src/pages/Events.tsx` |

---

## 7. Fix Recommendations

### A. Add "Create event" from venue context

**1. Venue dashboard (owner/staff)**

- **File:** `mobile/app/profile/venue-dashboard/[id].tsx`
- **Change:** Add "Create event" button in the Manage section (with Edit venue, Add special, Staff).
- **Navigation:** `router.push({ pathname: '/profile/create-event', params: { venueId: id } })`
- **Create-event screen:** Pre-select `venueId` from route params when present.

**2. Create-event screen pre-select**

- **File:** `mobile/app/profile/create-event.tsx`
- **Change:** Read `venueId` from `useLocalSearchParams()`; if present, set `venueId` and optionally hide/disable venue selector.

**3. Venue detail (public)**

- **File:** `mobile/app/venue/[id].tsx`
- **Change:** If user is owner/staff (e.g. from `getMyVenues`), show "Create event" in actions.
- **Alternative:** Always show "Create event" and let backend enforce ownership; create-event form pre-fills venue.

### B. Add "Events at this venue" section

**1. Backend: events by venue**

- **File:** `backend/src/modules/events/events.service.ts`
- **Add:** `getEventsByVenue(venueId: string, options?: { limit?: number })`
- **File:** `backend/src/modules/events/events.routes.ts`
- **Add:** `GET /v1/events?venueId=:id` or `GET /v1/venues/:id/events`

**2. Venue dashboard routes**

- **File:** `backend/src/modules/venues/venue-dashboard.routes.ts`
- **Add:** `GET /:id/events` → returns events for that venue (or reuse events service).

**3. Mobile API client**

- **File:** `mobile/src/api/client.ts`
- **Add:** `eventsApi.byVenue(venueId: string)` and/or `venuesApi.getEvents(venueId: string)`.

**4. Venue detail & dashboard**

- **Files:** `mobile/app/venue/[id].tsx`, `mobile/app/profile/venue-dashboard/[id].tsx`
- **Change:** Use new endpoint if `upcomingEvents` is empty or limited; add "View all events" link to events tab with venue filter.

### C. Events tab venue filter

**1. Backend**

- **File:** `backend/src/modules/events/events.service.ts`
- **Change:** Add optional `venueId` to `getNearbyEvents` and filter by it.
- **File:** `backend/src/modules/events/events.routes.ts`
- **Change:** Add `venueId` to `nearbyQuerySchema` and pass to service.

**2. Mobile**

- **File:** `mobile/src/api/client.ts`
- **Change:** Add `venueId` param to `eventsApi.nearby` and `eventsApi.thisWeek`.
- **File:** `mobile/app/(tabs)/events.tsx`
- **Change:** When opened from venue (e.g. via params), pass `venueId` to filter.

### D. Admin dashboard venue filter

**1. Backend**

- **File:** `backend/src/modules/admin/admin-extended.service.ts`
- **Change:** Add optional `venueId` to `listEvents`.
- **File:** `backend/src/modules/admin/admin-extended.routes.ts`
- **Change:** Read `venueId` from query and pass to service.

**2. Admin UI**

- **File:** `admin-dashboard/src/pages/Events.tsx`
- **Change:** Add venue dropdown; call `listEvents` with selected `venueId`.
- **File:** `admin-dashboard/src/api/client.ts`
- **Change:** `listEvents(venueId?: string)`.

---

## Summary

| Item | Status |
|------|--------|
| Schema: `venue_id` FK on events | ✅ Present, optional |
| Event creation accepts `venueId` | ✅ Yes |
| Venue detail shows events | ✅ Yes (up to 5) |
| Venue dashboard shows events | ✅ Yes (up to 5) |
| Create event from venue | ❌ No |
| Events filter by venue | ❌ No |
| Admin events filter by venue | ❌ No |

**Priority fixes:**

1. Add "Create event" to venue dashboard with pre-filled `venueId`.
2. Add `GET /v1/venues/:id/events` (or equivalent) for full event list per venue.
3. Pre-select venue in create-event when opened from venue context.
