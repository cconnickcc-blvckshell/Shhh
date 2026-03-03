# Shhh — Data Flow & Sequence Diagrams

> **Purpose:** High-level flows for onboarding and debugging.  
> **Format:** Mermaid-style sequence diagrams (text-based).

---

## 1. Auth Flow (Phone OTP or OAuth → Tokens)

**Phone path:** User selects phone → send-code → verify (returns sessionToken) → register/login with sessionToken.

**OAuth path:** User selects Apple/Google/Snap → native OAuth flow → POST /auth/oauth/{apple|google|snap} with idToken (Apple/Google) or authCode (Snap) → backend verifies, creates/links user → returns tokens.

```
User          Mobile App         API                    Redis              PostgreSQL
  |               |                |                      |                      |
  |-- Enter phone -->|               |                      |                      |
  |               |-- POST /auth/phone/send-code -->|      |                      |
  |               |                |-- Store OTP (5m TTL) -->|                     |
  |               |                |<-- devCode (dev) -----|                      |
  |               |<-- 200 { devCode } ------------|      |                      |
  |               |                |                      |                      |
  |-- Enter code -->|               |                      |                      |
  |               |-- POST /auth/phone/verify ----->|      |                      |
  |               |                |-- Validate OTP ------->|                      |
  |               |                |-- Create OTP session (sessionToken) -->|      |
  |               |<-- 200 { verified, sessionToken } ----|                      |
  |               |-- POST /auth/register or /auth/login (sessionToken) -->|      |
  |               |                |-- Check user exists ------------------>|      |
  |               |                |-- Create JWT + refresh hash ----------->|      |
  |               |<-- 200 { accessToken, refreshToken } --|                  |
  |               |-- Store tokens (SecureStore)    |                      |      |
```

---

## 2. Discovery Flow (Location → Nearby Users)

```
Mobile          API                 Redis              PostgreSQL (PostGIS)
  |               |                   |                          |
  |-- POST /discover/location (lat,lng) -->|                      |
  |               |-- Update users.last_location -------->|       |
  |               |-- Invalidate cache key ------->|              |
  |               |                   |                          |
  |-- GET /discover?lat=&lng=&radius= -->|                         |
  |               |-- Cache key: discover:{userId}:{rounded_coords} |
  |               |-- GET from Redis ---------->|                  |
  |               |   (if hit, return cached; 30s TTL)            |
  |               |-- If miss:                                    |
  |               |   SELECT ... ST_DWithin(geography, point, radius) |
  |               |   -- Filter: blocks, deleted, discovery_visible_to |
  |               |-- SET cache ------------------>|               |
  |               |<-- 200 { users[] } -----------|               |
```

---

## 3. Messaging Flow (REST + WebSocket)

```
User A (Mobile)     API                 MongoDB           WebSocket          User B (Mobile)
     |               |                     |                    |                    |
     |-- POST /conversations (create) ---->|                    |                    |
     |               |-- Insert conversation (Postgres)         |                    |
     |               |-- Return conversationId                  |                    |
     |<-- 200 { id } -|                     |                    |                    |
     |               |                     |                    |                    |
     |-- connect socket (auth.token) -------------------------->|                    |
     |               |                     |                    |-- join user:B      |
     |-- join_conversation(id) ----------->|                    |                    |
     |               |                     |                    |-- join conv:id    |
     |               |                     |                    |                    |
     |-- POST /conversations/:id/messages (body) -->|            |                    |
     |               |-- Insert message (MongoDB) -->|           |                    |
     |               |-- emitNewMessage(convId, msg) ---------->|-- new_message ---->|
     |<-- 200 { message } -|               |                    |                    |
     |               |                     |                    |                    |
     |-- typing -------->|                  |                    |-- user_typing ---->|
     |-- stop_typing -->|                  |                    |-- user_stop_typing |
```

---

## 4. Presence Decay (Worker)

```
BullMQ Worker      PostgreSQL           Redis              WebSocket
     |                  |                   |                    |
     |-- Every 60s (decay-presence job)     |                    |
     |-- SELECT presence WHERE expires_at < NOW()                 |
     |<-- rows -------|                   |                    |
     |-- For each: DELETE presence        |                    |
     |-- emitToUser(userId, 'presence_expired', { message }) -->|
     |                  |                   |                    |
```

---

## 5. Venue Distress (User → Staff)

```
User (Mobile)      API                 PostgreSQL         WebSocket (staff)
     |               |                     |                    |
     |-- POST /safety/venue-distress (venueId) -->|              |
     |               |-- Verify user checked in at venue         |
     |               |-- Insert audit_log                        |
     |               |-- SELECT venue_staff (active) ----------->|
     |               |-- For each staffId:                      |
     |               |   emitToUser(staffId, 'venue_distress', { userId, venueId }) -->|
     |<-- 200 -------|                     |                    |
```
