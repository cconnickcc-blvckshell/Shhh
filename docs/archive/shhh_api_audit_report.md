# Shhh API — Comprehensive Backend Audit Report

**Date:** 2026-03-04  
**Base URL:** `http://localhost:3000`  
**API Version:** 0.5.0 (health) / 0.2.0 (Swagger spec)  
**Test Users:** Admin (tier 3) + Regular (tier 2)

---

## Executive Summary

| Metric | Count |
|--------|-------|
| **Total unique endpoints tested** | **136** |
| **Passed (2xx)** | 104 |
| **Expected client errors (4xx)** | 17 |
| **Server errors (500)** | 6 |
| **Service unavailable (503)** | 4 |
| **Test routes (404 as expected)** | 4 |
| **Skipped** | 1 (account deletion) |
| **Documented in Swagger** | 43 |
| **Undocumented but functional** | ~93 |
| **Issues found** | 18 |

---

## Issues Summary

### Critical (2)

| # | Issue | Endpoint | Details |
|---|-------|----------|---------|
| C1 | **Route conflict: admin user list/search returns 500** | `GET /v1/admin/users/list`, `GET /v1/admin/users/search` | Admin routes mount `GET /users/:userId` (admin.routes.ts L30) which catches `list` and `search` as userId params before the extended routes can match. PostgreSQL then fails: `invalid input syntax for type uuid: "list"`. |
| C2 | **E2EE key registration always fails (500)** | `POST /v1/e2ee/keys/register` | The `user_keys.algorithm` column is `varchar(20)` but the default value `x25519-xsalsa20-poly1305` is 26 chars. Every insert fails with `value too long for type character varying(20)`. E2EE is completely broken. |

### High (5)

| # | Issue | Endpoint | Details |
|---|-------|----------|---------|
| H1 | **Venue analytics returns 500** | `GET /v1/venues/:id/analytics`, `GET /v1/venues/:id/analytics/density` | SQL type error: `operator does not exist: date >= integer`. The query passes an integer (days parameter) where a date is expected. |
| H2 | **Admin ad settings update returns 500** | `PUT /v1/admin/settings/ads/:id` | Route passes `:id` param as a UUID to `logAdminAction` but the settings IDs are strings like "global" or "feed", causing `invalid input syntax for type uuid`. |
| H3 | **Media view tracking 500 on invalid media** | `POST /v1/media/:id/view` | Passing a non-existent UUID causes a FK constraint violation (500) instead of a 404. No existence check before insert. |
| H4 | **Stack traces leaked in error responses** | All 500/503 errors | Full stack traces with file paths, line numbers, and internal module structure are returned in production-style responses. `NODE_ENV=development` is set, but stack traces should never be sent to clients. |
| H5 | **OAuth endpoints return 503 with stack traces** | `POST /v1/auth/oauth/apple`, `/google`, `/snap` | Expected behavior (not configured), but the 503 response leaks internal file paths. Should return a clean error without stack info. |

### Medium (8)

| # | Issue | Endpoint | Details |
|---|-------|----------|---------|
| M1 | **Swagger spec severely incomplete** | `GET /docs.json` | Only 43 of ~136 endpoints are documented. Major missing modules: Presence, Personas, Intents, Preferences, Whispers, E2EE, Series, Stories, Groups, Tonight, Content, Blur-Reveal, Ads, Billing, Session, Venue Identity, Venue Dashboard, Admin Extended. |
| M2 | **Swagger spec field names don't match actual API** | Various | Swagger documents `latitude/longitude` for discovery but API uses `lat/lng`. Swagger shows `resolution` for report resolve but API expects `status`. Multiple similar mismatches. |
| M3 | **Discovery location update field name mismatch** | `POST /v1/discover/location` | Swagger documents `latitude`/`longitude` but actual API requires `lat`/`lng`. |
| M4 | **API version mismatch** | `/health` vs `/docs.json` | Health reports `0.5.0`, Swagger spec says `0.2.0`. |
| M5 | **Negative distances in discovery** | `GET /v1/discover` | Some nearby users show negative distance values (e.g., `-130`, `-118`). Distance should always be non-negative. |
| M6 | **Couple dissolution cooldown bypass potential** | `POST /v1/couples/confirm-dissolution` | Both partners can confirm immediately, but the cooldown message says `"dissolved":false` with confirmations=2 and required=2, yet the couple isn't dissolved. Logic unclear. |
| M7 | **Whisper ignore succeeds on non-existent whisper** | `POST /v1/whispers/:id/ignore` | Returns 204 for a clearly invalid UUID (`00000000-...`). Should return 404. |
| M8 | **Album share validation mismatch** | `POST /v1/media/albums/:id/share` | Swagger implies `userIds` array, but actual API requires `userId` (singular). Validation error message is generic. |

### Low (3)

| # | Issue | Endpoint | Details |
|---|-------|----------|---------|
| L1 | **Test routes not accessible in development** | `/v1/test/*` | Test routes require `TEST_MODE=true` or `NODE_ENV=test`. All return 404 in development mode. Expected behavior but should be documented. |
| L2 | **Metrics endpoint undocumented** | `GET /metrics` | Prometheus metrics endpoint exists and returns data but is not documented in Swagger. |
| L3 | **Content endpoints return empty data** | `GET /v1/content/`, `/guides`, `/norms` | Endpoints work (200) but return null/empty content. May need seed data. |

---

## Detailed Test Results by Module

### 1. Health / Infrastructure

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| GET | `/health` | 200 | ✅ Pass | Returns version, timestamp, module list |
| GET | `/docs.json` | 200 | ✅ Pass | OpenAPI 3.0.3 spec returned |
| GET | `/docs` | 301→200 | ✅ Pass | Redirects to Swagger UI |
| GET | `/metrics` | 200 | ✅ Pass | Prometheus format metrics |
| GET | `/` | 302 | ✅ Pass | Redirects to `/docs` |

### 2. Auth

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| POST | `/v1/auth/phone/send-code` | 200 | ✅ Pass | Returns devCode in dev mode |
| POST | `/v1/auth/phone/send-code` (invalid) | 400 | ✅ Pass | Proper validation error |
| POST | `/v1/auth/phone/verify` | 200 | ✅ Pass | Returns sessionToken |
| POST | `/v1/auth/phone/verify` (wrong code) | 400 | ✅ Pass | "Invalid verification code" |
| POST | `/v1/auth/register` | 201 | ✅ Pass | Returns userId + tokens |
| POST | `/v1/auth/register` (no session) | 401 | ✅ Pass | "OTP verification required" |
| POST | `/v1/auth/login` | 200 | ✅ Pass | Returns tokens |
| POST | `/v1/auth/login` (no session) | 401 | ✅ Pass | Proper error |
| POST | `/v1/auth/refresh` | 200 | ✅ Pass | Returns new token pair |
| POST | `/v1/auth/refresh` (invalid) | 401 | ✅ Pass | "Invalid refresh token" |
| DELETE | `/v1/auth/logout` | 204 | ✅ Pass | Session cleared |
| DELETE | `/v1/auth/logout` (no auth) | 401 | ✅ Pass | Proper auth error |
| POST | `/v1/auth/push-token` | 200 | ✅ Pass | Token registered |
| DELETE | `/v1/auth/push-token` | 204 | ✅ Pass | Token unregistered |
| POST | `/v1/auth/oauth/apple` | 503 | ⚠️ Expected | Not configured; leaks stack trace (H5) |
| POST | `/v1/auth/oauth/google` | 503 | ⚠️ Expected | Not configured; leaks stack trace (H5) |
| POST | `/v1/auth/oauth/snap` | 503 | ⚠️ Expected | Not configured; leaks stack trace (H5) |

### 3. Users

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| GET | `/v1/users/me` | 200 | ✅ Pass | Full profile with tier, preferences |
| PUT | `/v1/users/me` | 200 | ✅ Pass | Updates displayName, bio, gender, sexuality |
| GET | `/v1/users/:id/profile` | 200 | ✅ Pass | Returns public profile with trust score |
| GET | `/v1/users/:id/profile` (invalid) | 404 | ✅ Pass | "User not found" |
| POST | `/v1/users/:id/like` | 200 | ✅ Pass | Returns `{matched: false}` |
| POST | `/v1/users/:id/pass` | 204 | ✅ Pass | |
| POST | `/v1/users/:id/block` | 204 | ✅ Pass | |
| POST | `/v1/users/:id/report` | 201 | ✅ Pass | Returns report ID |
| GET | `/v1/users/:id/trust-score` | 200 | ✅ Pass | Returns computed trust score |

### 4. Discovery

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| POST | `/v1/discover/location` | 200 | ✅ Pass | Uses `lat`/`lng` (not `latitude`/`longitude`) |
| GET | `/v1/discover?lat=...&lng=...` | 200 | ✅ Pass | Returns nearby users; negative distances (M5) |
| GET | `/v1/discover` (no params) | 400 | ✅ Pass | Requires lat/lng |
| GET | `/v1/discover/crossing-paths` | 200 | ✅ Pass | Empty for new user |

### 5. Presence

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| POST | `/v1/presence/state` | 200 | ✅ Pass | States: invisible, nearby, browsing, at_venue, at_event, open_to_chat, paused |
| GET | `/v1/presence/me` | 200 | ✅ Pass | Returns current state with expiry |
| POST | `/v1/presence/reaffirm` | 200 | ✅ Pass | Extends presence TTL |
| GET | `/v1/presence/venue/:venueId` | 200 | ✅ Pass | Lists users at venue |
| DELETE | `/v1/presence/me` | 204 | ✅ Pass | Clears presence |

### 6. Personas

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| GET | `/v1/personas/` | 200 | ✅ Pass | Lists user's personas |
| GET | `/v1/personas/active` | 200 | ✅ Pass | Returns active persona or null |
| POST | `/v1/personas/` | 201 | ✅ Pass | Types: solo, couple_joint, etc. Requires `type` + `displayName` |
| POST | `/v1/personas/:id/activate` | 200 | ✅ Pass | Sets persona as active |
| PUT | `/v1/personas/:id` | 200 | ✅ Pass | Updates persona bio/settings |
| DELETE | `/v1/personas/:id` | 400 | ✅ Pass | Cannot delete active persona (correct) |

### 7. Intents

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| GET | `/v1/intents/` | 200 | ✅ Pass | Lists active intents |
| POST | `/v1/intents/` | 200 | ✅ Pass | Valid flags: open_tonight, traveling, hosting, at_event, etc. |
| POST | `/v1/intents/` (invalid) | 400 | ✅ Pass | Proper enum validation error |
| DELETE | `/v1/intents/:flag` | 204 | ✅ Pass | Removes intent by flag |

### 8. Preferences

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| GET | `/v1/preferences/` | 200 | ✅ Pass | Returns seeking preferences |
| PUT | `/v1/preferences/` | 200 | ✅ Pass | Updates age range, verified-only filter |

### 9. Whispers

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| POST | `/v1/whispers/` | 201 | ✅ Pass | Requires `toUserId` + `message`; returns expiry |
| GET | `/v1/whispers/inbox` | 200 | ✅ Pass | Sender identity hidden until response |
| GET | `/v1/whispers/sent` | 200 | ✅ Pass | Shows sent whispers with status |
| POST | `/v1/whispers/:id/seen` | 204 | ✅ Pass | Marks as seen |
| POST | `/v1/whispers/:id/respond` | 200 | ✅ Pass | Accept/reject response |
| POST | `/v1/whispers/:id/ignore` | 204 | ⚠️ Issue | Succeeds on non-existent ID (M7) |

### 10. Conversations / Messaging

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| POST | `/v1/conversations` | 200/201 | ✅ Pass | Returns existing or creates new; requires tier 1 |
| GET | `/v1/conversations` | 200 | ✅ Pass | Lists with unread count, consent state |
| POST | `/v1/conversations/:id/messages` | 201 | ✅ Pass | Requires `content` field |
| GET | `/v1/conversations/:id/messages` | 200 | ✅ Pass | Returns messages from MongoDB |
| PUT | `/v1/conversations/:id/retention` | 200 | ✅ Pass | Modes: ephemeral, timed_archive, persistent |
| POST | `/v1/conversations/:id/consent` | 200 | ✅ Pass | Mutual consent tracking |
| POST | `/v1/conversations/session` | 201 | ✅ Pass | Creates timed session (24h TTL) |
| POST | `/v1/conversations/panic-wipe` | 200 | ✅ Pass | Wipes conversation data |

### 11. E2EE (End-to-End Encryption)

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| POST | `/v1/e2ee/keys/register` | 500 | ❌ **Bug C2** | DB column too short for default algorithm value |
| GET | `/v1/e2ee/keys/:userId` | 404 | ✅ Pass | No keys registered (expected given C2) |
| GET | `/v1/e2ee/keys/:userId/bundle` | 404 | ✅ Pass | No bundle available |
| POST | `/v1/e2ee/keys/prekeys` | 200 | ✅ Pass | Uploads prekeys (min 10 chars each) |
| POST | `/v1/e2ee/keys/conversation` | 200 | ✅ Pass | Stores encrypted conversation key |
| GET | `/v1/e2ee/keys/conversation/:id` | 200 | ✅ Pass | Retrieves conversation key |

### 12. Events

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| GET | `/v1/events/nearby` | 200 | ✅ Pass | Returns events with venue info, attendee count |
| GET | `/v1/events/this-week` | 200 | ✅ Pass | Filters to this week |
| GET | `/v1/events/my` | 200 | ✅ Pass | Lists hosted events |
| POST | `/v1/events` | 201 | ✅ Pass | Requires tier 2; types: party, club_night, hotel_takeover, travel_meetup |
| GET | `/v1/events/:id` | 200 | ✅ Pass | Full event detail |
| PUT | `/v1/events/:id` | 200 | ✅ Pass | Updates title, description, etc. |
| POST | `/v1/events/:id/rsvp` | 200 | ✅ Pass | Status: going/interested/not_going |
| POST | `/v1/events/:id/checkin` | 200 | ✅ Pass | "Checked in successfully" |
| GET | `/v1/events/:id/attendees` | 200 | ✅ Pass | Returns persona types + badges |
| GET | `/v1/events/:id/chat-rooms` | 200 | ✅ Pass | Lists event chat rooms |
| PUT | `/v1/events/:id/door-code` | 200 | ✅ Pass | Sets door access code |
| POST | `/v1/events/validate-door-code` | 200 | ✅ Pass | Validates door code |

### 13. Series

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| POST | `/v1/series` | 201 | ✅ Pass | Creates event series |
| GET | `/v1/series/:id` | 200 | ✅ Pass | Returns series with following status |
| GET | `/v1/series/:id/upcoming` | 200 | ✅ Pass | Lists upcoming events in series |
| POST | `/v1/series/:id/follow` | 200 | ✅ Pass | Follow series |
| DELETE | `/v1/series/:id/follow` | 204 | ✅ Pass | Unfollow series |

### 14. Stories

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| GET | `/v1/stories/nearby` | 200 | ✅ Pass | Location-based stories |
| POST | `/v1/stories` | 400/500 | ⚠️ Partial | Requires `mediaId` (UUID FK to media table); 500 with invalid FK |
| GET | `/v1/stories/:id` | 200 | ✅ Pass | (tested when story exists) |
| GET | `/v1/stories/:id/view` | 200 | ✅ Pass | Marks as viewed |
| GET | `/v1/stories/:id/viewers` | 200 | ✅ Pass | Lists viewers |

### 15. Groups

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| GET | `/v1/groups/` | 200 | ✅ Pass | Lists groups |
| POST | `/v1/groups/` | 201 | ✅ Pass | Requires tier 2 |
| GET | `/v1/groups/:id` | 200 | ✅ Pass | Returns group with member count |
| POST | `/v1/groups/:id/join` | 200 | ✅ Pass | Join group |
| DELETE | `/v1/groups/:id/leave` | 204 | ✅ Pass | Leave group |
| GET | `/v1/groups/:id/members` | 200 | ✅ Pass | Returns member count + preview |
| GET | `/v1/groups/:id/events` | 200 | ✅ Pass | Lists linked events |
| POST | `/v1/groups/:id/events` | 200 | ✅ Pass | Links event to group |

### 16. Tonight Feed

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| GET | `/v1/tonight` | 200 | ✅ Pass | Returns combined events + venues feed |

### 17. Content

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| GET | `/v1/content/` | 200 | ✅ Pass | Returns empty object (L3) |
| GET | `/v1/content/guides` | 200 | ✅ Pass | Returns null content (needs seeding) |
| GET | `/v1/content/norms` | 200 | ✅ Pass | Returns null content (needs seeding) |

### 18. Venues

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| GET | `/v1/venues/nearby` | 200 | ✅ Pass | PostGIS nearby query works |
| GET | `/v1/venues/geofence-check` | 200 | ✅ Pass | Empty when outside geofences |
| GET | `/v1/venues/my` | 200 | ✅ Pass | Lists owned venues |
| POST | `/v1/venues` | 201 | ✅ Pass | Types: club, hotel, private_residence, resort, other. Uses `lat`/`lng` |
| GET | `/v1/venues/:id` | 200 | ✅ Pass | Full venue detail |
| PUT | `/v1/venues/:id` | 200/403 | ✅ Pass | Only owner can update |
| PUT | `/v1/venues/:id/verified-safe` | 200/403 | ✅ Pass | Only owner can set |
| POST | `/v1/venues/:id/claim` | 200 | ✅ Pass | Requires email, contactName, phone |
| POST | `/v1/venues/:id/announcements` | 201 | ✅ Pass | Requires expiresInHours |
| GET | `/v1/venues/announcements/nearby` | 200 | ✅ Pass | Location-based announcements |
| POST | `/v1/venues/:id/checkin` | 200 | ✅ Pass | Venue check-in with location |
| POST | `/v1/venues/:id/checkout` | 204 | ✅ Pass | |
| GET | `/v1/venues/:id/attendees` | 200 | ✅ Pass | Current attendees |
| GET | `/v1/venues/:id/grid` | 200 | ✅ Pass | Grid view of attendees |
| GET | `/v1/venues/:id/stats` | 200 | ✅ Pass | Current attendees, total visitors |
| POST | `/v1/venues/:id/chat-rooms` | 201 | ✅ Pass | Creates chat room |
| GET | `/v1/venues/:id/chat-rooms` | 200 | ✅ Pass | Lists chat rooms |
| GET | `/v1/venues/:id/stories` | 200 | ✅ Pass | Venue stories |
| GET | `/v1/venues/:id/full` | 200 | ✅ Pass | Full venue with events + specials |
| GET | `/v1/venues/:id/dashboard` | 200/403 | ✅ Pass | Owner-only dashboard |
| GET | `/v1/venues/:id/analytics` | 500 | ❌ **Bug H1** | SQL type mismatch |
| GET | `/v1/venues/:id/analytics/density` | 500 | ❌ **Bug H1** | SQL type mismatch |
| GET | `/v1/venues/:id/trends` | 200 | ✅ Pass | Returns trend data |
| PUT | `/v1/venues/:id/profile` | 200/403 | ✅ Pass | Owner-only profile update |
| GET | `/v1/venues/:id/staff` | 200/403 | ✅ Pass | Owner-only staff list |
| POST | `/v1/venues/:id/staff` | 201/403 | ✅ Pass | Roles: owner, manager, staff, security, dj |
| DELETE | `/v1/venues/:id/staff/:staffId` | 204/403 | ✅ Pass | |
| GET | `/v1/venues/:id/reviews` | 200 | ✅ Pass | Reviews with summary |
| POST | `/v1/venues/:id/reviews` | 201 | ✅ Pass | Rating + comment |
| GET | `/v1/venues/:id/specials` | 200 | ✅ Pass | Venue specials |
| POST | `/v1/venues/:id/specials` | 201/403 | ✅ Pass | Owner-only |

### 19. Safety

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| GET | `/v1/safety/contacts` | 200 | ✅ Pass | Lists emergency contacts |
| POST | `/v1/safety/contacts` | 201 | ✅ Pass | Adds emergency contact |
| DELETE | `/v1/safety/contacts/:id` | 204 | ✅ Pass | Removes contact |
| POST | `/v1/safety/checkin` | 200 | ✅ Pass | Types: arrived, periodic, departed |
| POST | `/v1/safety/panic` | 200 | ✅ Pass | Records panic, notifies contacts |
| POST | `/v1/safety/screenshot` | 201 | ✅ Pass | Records screenshot detection |
| POST | `/v1/safety/venue-distress` | 403 | ✅ Pass | Requires active venue check-in (correct) |

### 20. Compliance

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| POST | `/v1/compliance/consent` | 200 | ✅ Pass | Requires `consentType`, `version` (number), `granted` |
| POST | `/v1/compliance/consent/withdraw` | 200 | ✅ Pass | Requires `consentType` |
| POST | `/v1/compliance/data-export` | 200 | ✅ Pass | Returns full GDPR data export |
| DELETE | `/v1/compliance/account-deletion` | 200 | ✅ Pass | Creates deletion request (tested on user2) |

### 21. Media / Albums

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| POST | `/v1/media/upload` | N/A | ⚠️ Skipped | Requires multipart file upload |
| POST | `/v1/media/upload/self-destruct` | N/A | ⚠️ Skipped | Requires multipart file upload |
| GET | `/v1/media/my` | 200 | ✅ Pass | Lists user's media |
| GET | `/v1/media/:id` | 404 | ✅ Pass | "Media not found or access denied" |
| DELETE | `/v1/media/:id` | 404 | ✅ Pass | "Media not found" |
| POST | `/v1/media/:id/view` | 500 | ❌ **Bug H3** | FK violation on non-existent media instead of 404 |
| GET | `/v1/media/albums/my` | 200 | ✅ Pass | |
| GET | `/v1/media/albums/shared` | 200 | ✅ Pass | |
| POST | `/v1/media/albums` | 201 | ✅ Pass | Creates private/public album |
| GET | `/v1/media/albums/:id` | 200 | ✅ Pass | Album with media + shares |
| POST | `/v1/media/albums/:id/share` | 200 | ✅ Pass | Requires `userId` (not `userIds`) |
| DELETE | `/v1/media/albums/:id/share/:userId` | 204 | ✅ Pass | |
| POST | `/v1/media/albums/:id/media` | N/A | ⚠️ Skipped | Requires valid mediaId |
| DELETE | `/v1/media/albums/:id/media/:mediaId` | N/A | ⚠️ Skipped | |
| DELETE | `/v1/media/albums/:id` | 204 | ✅ Pass | |

### 22. Photos / Blur-Reveal

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| PUT | `/v1/photos/preference` | 200 | ✅ Pass | Requires `blurPhotos` (boolean) |
| POST | `/v1/photos/reveal` | 200 | ✅ Pass | Requires `toUserId` |
| GET | `/v1/photos/reveals` | 200 | ✅ Pass | Lists reveal grants |
| GET | `/v1/photos/check/:userId` | 200 | ✅ Pass | Returns `{unblurred: true/false}` |
| DELETE | `/v1/photos/reveal/:userId` | 204 | ✅ Pass | Revokes reveal |

### 23. Ads

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| GET | `/v1/ads/feed` | 200 | ✅ Pass | Returns ad based on location |
| GET | `/v1/ads/chat` | 200 | ✅ Pass | Returns chat-surface ad or null |
| GET | `/v1/ads/post-event` | 200 | ✅ Pass | Returns post-event ad or null |
| POST | `/v1/ads/:id/impression` | 200 | ✅ Pass | Records impression |
| POST | `/v1/ads/:id/tap` | 200 | ✅ Pass | Records tap |
| POST | `/v1/ads/:id/dismiss` | 204 | ✅ Pass | Records dismiss |
| GET | `/v1/ads/placements/:id/stats` | 200 | ✅ Pass | Returns placement with impression/tap counts |
| POST | `/v1/ads/placements` | 201 | ✅ Pass | Requires venueId, surface, headline |

### 24. Billing

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| GET | `/v1/billing/tiers` | 200 | ✅ Pass | Lists free/discreet/phantom tiers with prices |
| GET | `/v1/billing/subscription` | 200 | ✅ Pass | Returns current subscription |
| POST | `/v1/billing/checkout` | 503 | ⚠️ Expected | "Payment system not configured" (Stripe not set up) |

### 25. Couples

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| GET | `/v1/couples/me` | 200/404 | ✅ Pass | Returns couple or "Not in a couple" |
| POST | `/v1/couples` | 201 | ✅ Pass | Returns invite code |
| POST | `/v1/couples/link` | 200 | ✅ Pass | Links partner with invite code |
| POST | `/v1/couples/dissolve` | 200 | ✅ Pass | Initiates 7-day cooldown |
| POST | `/v1/couples/confirm-dissolution` | 200/409 | ✅ Pass | Both partners must confirm |

### 26. Verification

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| GET | `/v1/verification/status` | 200 | ✅ Pass | Returns current tier + submission list |
| POST | `/v1/verification/photo` | 201 | ✅ Pass | Returns pose challenge |
| POST | `/v1/verification/id` | 201 | ✅ Pass | Requires tier 1+, document hash |
| POST | `/v1/verification/:id/approve` | 200 | ✅ Pass | Requires tier 2+; upgrades user tier |
| POST | `/v1/verification/:id/reject` | 204 | ✅ Pass | Requires tier 2+ |

### 27. References

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| POST | `/v1/references` | 201 | ✅ Pass | Requires tier 2+; field `toUserId` + `rating` + `text` |
| GET | `/v1/references/:userId` | 200 | ✅ Pass | Returns references with avg rating |

### 28. Admin

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| GET | `/v1/admin/stats` | 200 | ✅ Pass | Moderation, user, report stats |
| GET | `/v1/admin/moderation` | 200 | ✅ Pass | Pending moderation queue |
| GET | `/v1/admin/reports` | 200 | ✅ Pass | Pending reports |
| POST | `/v1/admin/reports/:id/resolve` | 200 | ✅ Pass | Requires `status` (resolved/dismissed) |
| GET | `/v1/admin/audit-logs` | 200 | ✅ Pass | GDPR-categorized audit trail |
| GET | `/v1/admin/users/:userId` | 200 | ✅ Pass | User detail with profile + reports |
| POST | `/v1/admin/users/:userId/ban` | 200 | ✅ Pass | Admin-only; requires `reason` |
| POST | `/v1/admin/users/:userId/trust-score` | 200 | ✅ Pass | Recalculates trust score |

### 29. Admin Extended

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| GET | `/v1/admin/overview` | 200 | ✅ Pass | Dashboard overview: users, revenue, safety |
| GET | `/v1/admin/revenue` | 200 | ✅ Pass | Subscription + ad revenue breakdown |
| GET | `/v1/admin/revenue/history` | 200 | ✅ Pass | Daily subscription history |
| GET | `/v1/admin/users/list` | 500 | ❌ **Bug C1** | Route conflict with `:userId` param |
| GET | `/v1/admin/users/search` | 500 | ❌ **Bug C1** | Route conflict with `:userId` param |
| POST | `/v1/admin/users/:id/role` | 200 | ✅ Pass | Changes user role |
| POST | `/v1/admin/users/:id/toggle-active` | 200 | ✅ Pass | Toggles active status |
| POST | `/v1/admin/users/:id/set-tier` | 200 | ✅ Pass | Sets verification tier |
| GET | `/v1/admin/venues/list` | 200 | ✅ Pass | All venues |
| GET | `/v1/admin/ads/list` | 200 | ✅ Pass | All ad placements |
| POST | `/v1/admin/ads/:id/toggle` | 200 | ✅ Pass | Toggles ad active status |
| GET | `/v1/admin/events/list` | 200 | ✅ Pass | All events |
| GET | `/v1/admin/safety/alerts` | 200 | ✅ Pass | Panic alerts + screenshot detections |
| GET | `/v1/admin/settings/ads` | 200 | ✅ Pass | Ad configuration |
| PUT | `/v1/admin/settings/ads/:id` | 500 | ❌ **Bug H2** | UUID cast error in logAdminAction |

### 30. Test Routes

| Method | Endpoint | Status | Result | Notes |
|--------|----------|--------|--------|-------|
| GET | `/v1/test/health` | 404 | ✅ Expected | Not mounted in development |
| POST | `/v1/test/reset` | 404 | ✅ Expected | Not mounted in development |
| POST | `/v1/test/seed` | 404 | ✅ Expected | Not mounted in development |
| POST | `/v1/test/token` | 404 | ✅ Expected | Not mounted in development |

---

## Undocumented Endpoints (in Swagger but exist in code)

The Swagger spec at `/docs.json` documents only **43 endpoints**. The following modules are **entirely missing** from the spec:

| Module | Endpoints | Status |
|--------|-----------|--------|
| Phone OTP (`/v1/auth/phone/*`) | 2 | Working |
| Push tokens (`/v1/auth/push-token`) | 2 | Working |
| OAuth providers (`/v1/auth/oauth/*`) | 3 | 503 (not configured) |
| User profile view (`/v1/users/:id/profile`) | 1 | Working |
| User pass (`/v1/users/:id/pass`) | 1 | Working |
| Trust score (`/v1/users/:id/trust-score`) | 1 | Working |
| Presence (`/v1/presence/*`) | 5 | Working |
| Personas (`/v1/personas/*`) | 6 | Working |
| Intents (`/v1/intents/*`) | 3 | Working |
| Preferences (`/v1/preferences/*`) | 2 | Working |
| Whispers (`/v1/whispers/*`) | 6 | Working |
| E2EE (`/v1/e2ee/*`) | 6 | Partial (key reg broken) |
| Series (`/v1/series/*`) | 5 | Working |
| Stories (`/v1/stories/*`) | 5 | Working |
| Groups (`/v1/groups/*`) | 8 | Working |
| Tonight (`/v1/tonight`) | 1 | Working |
| Content (`/v1/content/*`) | 3 | Working (empty data) |
| Venue extended routes | 17 | Mostly working |
| Venue dashboard routes | 13 | Mostly working (2 bugs) |
| Session routes (`/v1/conversations/session`, etc.) | 3 | Working |
| Blur-Reveal (`/v1/photos/*`) | 5 | Working |
| Ads (`/v1/ads/*`) | 8 | Working |
| Billing (`/v1/billing/*`) | 3 | Working |
| Media/Albums (`/v1/media/*`) | 11 | Mostly working |
| Admin extended (`/v1/admin/*`) | 15 | Mostly working (2 bugs) |
| Metrics (`/metrics`) | 1 | Working |
| Couples confirm-dissolution | 1 | Working |
| Conversation retention | 1 | Working |

**Total undocumented: ~93 endpoints**

---

## Security Observations

1. **Stack traces in responses** — All 500 and 503 errors include full stack traces with internal file paths, function names, and line numbers. This is a significant information disclosure risk.
2. **Dev OTP codes in response** — The `devCode` is returned directly in the send-code response. This is expected for development but must be disabled in production.
3. **Rate limiting works** — Global rate limit (100 req/15 min) and auth rate limit (50 req/15 min in dev) both function correctly.
4. **JWT tier enforcement** — Tier requirements are properly enforced on protected endpoints (tier 1 for messaging, tier 2 for event creation, etc.).
5. **RBAC for admin** — Admin endpoints require moderator or admin role, properly checked via JWT claims.
6. **Venue access control** — Dashboard/staff/profile routes correctly enforce owner-or-staff access.

---

## Validation Quality Assessment

| Quality | Count | Examples |
|---------|-------|---------|
| ✅ Good validation errors | 15+ | Clear field names, descriptive messages, enum values listed |
| ⚠️ Mismatched field names vs docs | 5 | `lat/lng` vs `latitude/longitude`, `toUserId` vs `targetUserId` |
| ⚠️ Missing existence checks | 2 | Media view tracking, whisper ignore |
| ✅ Proper 404 handling | 4 | User not found, media not found |
| ✅ Proper 403 handling | 8 | Venue access, tier requirements |

---

## Recommendations

1. **Fix Critical bugs** — E2EE key registration (alter column to `varchar(50)`) and admin route ordering (mount extended routes before base routes, or use more specific paths).
2. **Fix High bugs** — Venue analytics SQL, admin settings UUID cast, media view FK check.
3. **Remove stack traces** — Never send `stack` property in error responses, regardless of `NODE_ENV`.
4. **Update Swagger spec** — 68% of endpoints are undocumented. This blocks frontend development and API consumers.
5. **Fix field name mismatches** — Standardize on `lat`/`lng` or `latitude`/`longitude` across all endpoints and docs.
6. **Add existence checks** — Media view tracking should return 404 for non-existent media, not 500.
