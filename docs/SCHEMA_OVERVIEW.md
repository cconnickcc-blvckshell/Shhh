# Shhh — Schema Overview

> **Purpose:** High-level view of the database schema. For full DDL, see `backend/src/database/migrations/*.sql`.  
> **Last updated:** March 2026.

---

## 1. Core Tables

| Table | Purpose |
|-------|---------|
| `users` | Core user; `phone_hash`, `verification_tier`, `deleted_at` |
| `user_profiles` | Display name, bio, photos, preferences, kinks, experience_level |
| `refresh_tokens` | JWT refresh token hashes; rotation support |
| `locations` | PostGIS point; user's current location with expiry |
| `blocks` | Blocked user pairs |
| `likes` | Like/pass interactions for discovery |

---

## 2. Auth & Verification

| Table | Purpose |
|-------|---------|
| `verifications` | Photo/ID verification submissions; admin approve/reject |
| `references` | User references (tier 2) |

---

## 3. Couples

| Table | Purpose |
|-------|---------|
| `couples` | Partner link; `invite_code_hash`, status (pending/active/dissolved) |

---

## 4. Discovery & Presence

| Table | Purpose |
|-------|---------|
| `presence` | Current presence state; `expires_at` (decay worker) |
| `personas` | User personas; `expires_at`, `is_burn` |
| `intents` | Intent flags per user |
| `preferences` | Discovery radius, etc. |

---

## 5. Messaging

| Table | Purpose |
|-------|---------|
| `conversations` | Conversation metadata; participants |
| `conversation_participants` | Membership |
| `sessions` | E2EE session keys; consent, TTL |

**MongoDB:** `messages` collection; TTL index on `expiresAt`.

---

## 6. Venues & Events

| Table | Purpose |
|-------|---------|
| `venues` | Venue profile; PostGIS for location |
| `venue_geofences` | Geofence boundaries |
| `venue_staff` | Staff membership |
| `venue_analytics` | Daily aggregates |
| `events` | Event metadata; `venue_id`, `series_id`, `vibe_tag` |
| `event_series` | Recurring event series |
| `event_attendees` | RSVP, check-in |
| `event_chat_rooms` | Chat rooms linked to events |

---

## 7. Whispers

| Table | Purpose |
|-------|---------|
| `whispers` | Whisper messages; TTL, status (pending/revealed/responded/ignored) |

---

## 8. Media & Albums

| Table | Purpose |
|-------|---------|
| `media` | Uploaded media; `storage_path`, `ttl_seconds` |
| `albums` | Private albums |
| `album_shares` | Share to user/persona/couple |

---

## 9. Ads

| Table | Purpose |
|-------|---------|
| `ad_placements` | Ad creatives; surface, targeting, budget |
| `ad_impressions` | Impressions, taps, dismissals |
| `ad_cadence_rules` | Per-surface rules (max per 24h, etc.) |
| `ad_controls` | Global kill switch (`id='global'`, `value.enabled`) |

---

## 10. Safety & Compliance

| Table | Purpose |
|-------|---------|
| `safety_contacts` | Emergency contacts |
| `safety_checkins` | Check-in records; `alert_sent` for panic |
| `screenshot_events` | Screenshot reports |
| `data_deletion_requests` | GDPR deletion requests (no worker processes) |
| `consents` | Consent records |
| `audit_logs` | Audit trail |
| `admin_actions` | Admin action log |

---

## 11. Groups (Tribes)

| Table | Purpose |
|-------|---------|
| `groups` | Group metadata |
| `group_members` | Membership |
| `group_events` | Events linked to groups |

---

## 12. Key Indexes

- **PostGIS:** `locations.geom_point`, `venues` (GIST)
- **Auth:** `users.phone_hash`, `refresh_tokens.token_hash`
- **Discovery:** `locations.updated_at`, `blocks`, `likes`
- **Ads:** `ad_placements.surface`, `ad_impressions(user_id, surface)`

---

## 13. Migration Order

Migrations run sequentially: `001_initial.sql` through `027_groups_tribes.sql`. See `backend/src/database/migrations/` for full list.
