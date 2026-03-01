# Shhh — Developer Handover Document

> **Version**: 0.5.0 | **Last updated**: February 2026 | **Status**: Active development  
> **Implementation status:** **docs/E2E_CAPABILITY_AUDIT_REPORT.md** (what's done vs partial vs missing), **docs/MASTER_IMPLEMENTATION_CHECKLIST.md** (single checklist), **docs/SCOPE_PIVOT_TODO.md** (scope when pivoting), **docs/SOFT_LAUNCH_WEB_PLAN.md** (web soft launch). Update the relevant §4.x and schema/API tables when adding or changing modules.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Quick Start](#2-quick-start)
3. [Architecture Overview](#3-architecture-overview)
4. [Backend Module Reference](#4-backend-module-reference)
5. [Database Schema Reference](#5-database-schema-reference)
6. [Mobile App Reference](#6-mobile-app-reference)
7. [Real-Time System](#7-real-time-system)
8. [Background Workers](#8-background-workers)
9. [Ad System](#9-ad-system)
10. [Venue System](#10-venue-system)
11. [Safety & Trust](#11-safety--trust)
12. [Presence & Persona System](#12-presence--persona-system)
13. [Whisper System](#13-whisper-system)
14. [Billing & Premium](#14-billing--premium)
15. [Security Posture](#15-security-posture)
16. [Infrastructure](#16-infrastructure)
17. [Known Limitations & Technical Debt](#17-known-limitations--technical-debt)
18. [Environment Variables Reference](#18-environment-variables-reference)
19. [Deployment Checklist](#19-deployment-checklist)
20. [Coding Conventions](#20-coding-conventions)

---

## 1. Project Overview

### What is Shhh?

Shhh is a **privacy-native, proximity-driven social platform for adults**. It connects people who are physically near each other — at venues, events, or just out in the world — using real-time geolocation, ephemeral messaging, and layered privacy controls. The product is designed for an audience that values discretion, safety, and authenticity above all else.

### Core Philosophy

| Principle | What it means in practice |
|-----------|--------------------------|
| **Time as a first-class constraint** | Messages expire. Presence decays. Whispers have a 4-hour TTL. Intent flags auto-expire. Nothing lingers unless someone actively re-affirms it. |
| **Proximity beats prediction** | Discovery is powered by PostGIS `ST_DWithin`, not recommendation algorithms. You see who is *actually nearby*, not who an ML model thinks you'd like. |
| **Privacy is the default** | Photos are blurred by default. Phone numbers are HMAC-SHA256 hashed with a server-side pepper before storage. Identity is gated behind a 4-tier verification system. Location is fuzzed by 300 m unless the user opts into precise mode. |

### Performance Targets

| Metric | Target |
|--------|--------|
| Concurrent users | 100,000 |
| Uptime SLA | 99.99% |
| Discovery query latency (p95) | < 200 ms |
| Message delivery (e2e) | < 500 ms |
| API response time (p95) | < 300 ms |

### Product Surfaces

| Surface | Technology | Purpose |
|---------|-----------|---------|
| Mobile app | React Native + Expo 55 | Primary user-facing client |
| Admin dashboard | React + Vite SPA | Moderation, reports, audit logs |
| Backend API | Express + TypeScript | REST API + WebSocket server |

---

## 2. Quick Start

### Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | 22.x (LTS) | Runtime for backend + tooling |
| Docker + Docker Compose | Latest | PostgreSQL, Redis, MongoDB |
| npm | Bundled with Node 22 | Package manager (lockfile is `package-lock.json`) |

> **Note:** The project uses `npm`, not `pnpm` or `yarn`. All three sub-projects (`backend`, `mobile`, `admin-dashboard`) have `package-lock.json` files.

### Step-by-Step Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd shhh

# 2. Copy env file
cp .env.example .env

# 3. Start infrastructure (PostgreSQL + PostGIS, Redis, MongoDB)
docker compose up -d

# 4. Wait for services to be healthy
docker compose ps   # all should show "healthy"

# 5. Install backend dependencies
cd backend
npm install

# 6. Run database migrations
npm run migrate

# 7. Start the development server
npm run dev
# → API running at http://localhost:3000
# → Swagger UI at http://localhost:3000/docs
# → Health check at http://localhost:3000/health

# 8. (Optional) Install and run admin dashboard
cd ../admin-dashboard
npm install
npm run dev
# → Dashboard at http://localhost:5173

# 9. (Optional) Install mobile dependencies
cd ../mobile
npm install
npx expo start
```

### Seeding Demo Data

Run `npm run seed` from the backend directory. Located at `/backend/src/database/seed.ts`. Idempotent (safe to run multiple times).

Creates:
- 6 users across verification tiers (0–3) with photos, bios, locations
- 1 venue (The Purple Room) with features and specials
- 1 event
- 1 ad placement
- 1 conversation between first two users
- Sets first user as admin (`role = 'admin'`)

```bash
cd backend
npm run seed
```

To bypass verification tiers for testing, update the user directly in PostgreSQL:

```sql
UPDATE users SET verification_tier = 2 WHERE id = '<user-id>';
```

### Running Tests

```bash
cd backend

# All tests (requires Docker services running)
npm test

# Watch mode
npm run test:watch

# Lint
npm run lint

# Type checking
npm run typecheck
```

The test suite contains **55 tests** across 7 suites: `auth`, `discovery`, `events` (including Tonight feed), `couples`, `safety`, `admin`, `media`, and the test framework uses **Jest** with **Supertest** for HTTP assertions.

---

## 3. Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                │
│   React Native (iOS/Android)     Admin Dashboard (React/Vite)    │
│   Expo 55, expo-router           @tanstack/react-query           │
│   Zustand state, Socket.io       react-router-dom                │
└───────────────┬─────────────────────────┬───────────────────────┘
                │  HTTPS / WSS            │  HTTPS
                ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Express 4)                        │
│                                                                   │
│  Middleware Pipeline:                                             │
│   Helmet → CORS → compression → JSON (10MB limit) →              │
│   globalRateLimiter (100 req/15min) → Router → errorHandler       │
│                                                                   │
│   REST API (/v1/*)            WebSocket (Socket.io)               │
│   Swagger UI (/docs)          Rooms: user:{id}, conversation:{id} │
│                                                                   │
│   Background Workers (BullMQ)                                     │
│   6 scheduled jobs via Redis                                      │
└──────┬─────────────┬────────────────┬─────────────────────────────┘
       │             │                │
       ▼             ▼                ▼
┌──────────┐  ┌───────────┐   ┌──────────────┐
│PostgreSQL │  │   Redis    │   │   MongoDB    │
│+ PostGIS  │  │  7-alpine  │   │     7        │
│  16-3.4   │  │   :6379    │   │   :27017     │
│  :5432    │  │            │   │              │
│           │  │ Uses:      │   │ Uses:        │
│ 45+ tables│  │ - Cache    │   │ - messages   │
│ GIST idx  │  │ - Presence │   │   collection │
│ PostGIS   │  │ - OTP      │   │ - TTL index  │
│ geog casts│  │ - Cooldown │   │   on         │
│           │  │ - BullMQ   │   │   expiresAt  │
└──────────┘  └───────────┘   └──────────────┘
```

### Why Three Datastores?

| Datastore | Why it exists | What it stores |
|-----------|--------------|----------------|
| **PostgreSQL + PostGIS** | Relational integrity, geospatial queries (`ST_DWithin`, `ST_Distance`), ACID transactions | Users, profiles, venues, events, conversations metadata, verification, trust scores, billing, ads — everything except messages |
| **Redis 7** | Sub-millisecond reads, key expiry, BullMQ job scheduling | Presence state cache, OTP codes (5-min TTL), ad cooldowns, discovery result cache (30s), rate limit counters, geo coordinates (`GEOADD`) |
| **MongoDB 7** | Document-flexible message storage, native TTL index for auto-deletion | Chat messages with `expiresAt` TTL index — messages auto-delete when TTL expires; no application code needed |

### The Trade-Off: MongoDB May Collapse Into PostgreSQL

MongoDB currently holds only the `messages` collection. Once E2EE is fully wired (client-side encryption), messages become opaque blobs and their schema flexibility is irrelevant. At that point, MongoDB can be replaced with a `messages` table in PostgreSQL (with a TTL cleanup worker replacing the TTL index). This simplifies ops from 3 databases to 2. **Decision is pending post-E2EE implementation.**

---

## 4. Backend Module Reference

The backend has **24 route modules** wired in `app.ts`. Each module follows the **Service → Controller → Routes** pattern (some smaller modules skip the controller and wire handlers directly in routes).

### 4.1 Auth Module

**What it does:** User registration, login, JWT token management, OTP verification, push token registration.

**Key files:**
- `modules/auth/auth.service.ts` — JWT generation, Argon2id hashing, token rotation
- `modules/auth/auth.controller.ts` — HTTP handler functions
- `modules/auth/auth.routes.ts` — Route definitions
- `modules/auth/otp.service.ts` — OTP generation, Twilio SMS, dev-mode code bypass
- `modules/auth/push.service.ts` — Expo push notification token management

**Endpoints:**

| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| POST | `/v1/auth/register` | No | — | Register with phone + displayName. Returns `{userId, accessToken, refreshToken}` |
| POST | `/v1/auth/login` | No | — | Login with phone. Returns tokens. |
| POST | `/v1/auth/refresh` | No | — | Rotate refresh token. Old token is revoked. |
| DELETE | `/v1/auth/logout` | Yes | 0 | Revoke all refresh tokens for the user |
| POST | `/v1/auth/phone/send-code` | No | — | Send OTP via Twilio (returns `devCode` in dev mode) |
| POST | `/v1/auth/phone/verify` | No | — | Verify OTP code |
| POST | `/v1/auth/push-token` | Yes | 0 | Register Expo push notification token |

**Database tables owned:** `users`, `refresh_tokens`, `push_tokens`

**Key business rules:**
- Phone numbers are SHA-256 hashed before storage — the raw phone is **never** persisted
- Registration creates a user at tier 0 and an empty `user_profiles` row
- Access tokens expire in 2h (dev) or 15m (prod); refresh tokens expire in 7 days
- Refresh token rotation: old token is revoked on each refresh call (one-time use)
- OTP rate limited to 5 attempts per 15 minutes per phone number
- In dev/test mode without Twilio credentials, OTP codes are returned in the response as `devCode`
- **Stealth (neutral notifications):** If `user_profiles.preferences_json.neutral_notifications === true`, `push.service.sendPush` uses generic title/body ("Notification", "You have a new notification"); set via `PUT /v1/users/me` with `preferencesJson`
- Every auth action is logged to `audit_logs`

### 4.2 Users Module

**What it does:** User profile CRUD, like/pass interactions, blocking, reporting.

**Key files:**
- `modules/users/users.service.ts` — Profile CRUD, like/pass/block/report logic
- `modules/users/users.controller.ts` — HTTP handlers
- `modules/users/users.routes.ts` — Route definitions
- `modules/users/trust.service.ts` — Trust score algorithm

**Endpoints:**

| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/users/me` | Yes | 0 | Get own profile (join users + user_profiles) |
| PUT | `/v1/users/me` | Yes | 0 | Update profile fields |
| POST | `/v1/users/:id/like` | Yes | 1 | Like a user. Returns `{matched: boolean}` |
| POST | `/v1/users/:id/pass` | Yes | 0 | Pass on a user |
| POST | `/v1/users/:id/block` | Yes | 0 | Block a user (bidirectional filtering) |
| POST | `/v1/users/:id/report` | Yes | 0 | Report a user with reason |
| GET | `/v1/users/:userId/trust-score` | Yes | 0 | Get or recalculate trust score |

**Database tables owned:** `user_profiles`, `user_interactions`, `blocks`, `reports`, `trust_scores`

**Key business rules:**
- Likes require tier 1 (photo-verified); passing requires only tier 0
- Matching is mutual: if A likes B and B has already liked A, `{matched: true}` is returned
- Blocks are stored as (blocker_id, blocked_id) pairs; discovery queries filter both directions
- Profile fields updatable: `displayName`, `bio`, `gender`, `sexuality`, `photosJson`, `preferencesJson`, `kinks`, `experienceLevel`, `isHost`
- `photosJson` and `preferencesJson` are stored as JSONB columns
- `kinks` is a PostgreSQL `text[]` array

### 4.3 Personas Module

**What it does:** Allows users to create multiple identity personas (solo, couple, anonymous, traveler) gated by subscription tier.

**Key files:**
- `modules/users/persona.service.ts` — CRUD, switching, slot enforcement
- `modules/users/persona.routes.ts` — Route definitions

**Endpoints:**

| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/personas` | Yes | 0 | List all personas for current user |
| GET | `/v1/personas/active` | Yes | 0 | Get currently active persona |
| POST | `/v1/personas` | Yes | 0 | Create a new persona (slot-limited) |
| POST | `/v1/personas/:id/activate` | Yes | 0 | Switch to this persona |
| PUT | `/v1/personas/:id` | Yes | 0 | Update persona fields |
| DELETE | `/v1/personas/:id` | Yes | 0 | Delete persona (cannot delete active) |

**Database tables owned:** `personas`

**Key business rules:**
- Number of persona slots is gated by subscription tier: Free=1, Discreet=2, Phantom=3, Elite=5
- Persona types: `solo`, `couple`, `anonymous`, `traveler`
- Only one persona can be active at a time (`is_active` column)
- Cannot delete the currently active persona — must switch first
- Couple personas can link to a partner via `linked_partner_id`
- Each persona has its own `display_name`, `bio`, `kinks`, `photos_json`, `preferences_json`
- Active persona name is used in venue check-ins and presence listings

### 4.4 Couples Module

**What it does:** Couple linking with invite codes, dissolution with 7-day cooldown.

**Key files:**
- `modules/couples/couples.service.ts` — Create, link, dissolve
- `modules/couples/couples.controller.ts` — HTTP handlers
- `modules/couples/couples.routes.ts` — Route definitions

**Endpoints:**

| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| POST | `/v1/couples` | Yes | 0 | Create couple, returns invite code |
| GET | `/v1/couples/me` | Yes | 0 | Get current couple info |
| POST | `/v1/couples/link` | Yes | 0 | Link with invite code |
| POST | `/v1/couples/dissolve` | Yes | 0 | Request dissolution (starts 7-day cooldown) |
| POST | `/v1/couples/confirm-dissolution` | Yes | 0 | Confirm dissolution (both must confirm after cooldown) |

**Database tables owned:** `couples`

**Key business rules:**
- Invite codes are hashed (SHA-256) before storage
- Couple status transitions: `pending` → `active` → `dissolved`
- Dissolution requires a **7-day cooling-off period** — neither partner can immediately unlink
- Both partners must call `confirm-dissolution` after the cooldown expires
- `dissolution_confirmed_by` is a UUID array tracking which partners have confirmed

### 4.5 Verification Module

**What it does:** 4-tier identity verification system (phone → photo → ID → references).

**Key files:**
- `modules/verification/verification.service.ts` — Submit, approve, reject
- `modules/verification/verification.controller.ts` — HTTP handlers
- `modules/verification/verification.routes.ts` — Route definitions

**Endpoints:**

| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/verification/status` | Yes | 0 | Check verification status |
| POST | `/v1/verification/photo` | Yes | 0 | Submit photo verification |
| POST | `/v1/verification/id` | Yes | 1 | Submit ID verification (requires tier 1) |
| POST | `/v1/verification/:id/approve` | Yes | 2 | Admin: approve verification |
| POST | `/v1/verification/:id/reject` | Yes | 2 | Admin: reject verification |

**Database tables owned:** `verifications`

**Key business rules:**
- Tier 0 → 1: Photo verification (selfie with pose challenge, admin approval)
- Tier 1 → 2: ID verification (government ID hash, admin approval)
- Tier 2 → 3: 3+ references from tier 2+ users (automatic promotion)
- Photo verification generates a random pose challenge to prevent static photo attacks
- ID document is hashed (SHA-256) and the raw document is never stored
- Verification submissions are added to the `moderation_queue` for admin review

### 4.6 References Module

**What it does:** User reference / vouching system for trust building.

**Key files:**
- `modules/references/references.service.ts` — Create, get references
- `modules/references/references.controller.ts` — HTTP handlers
- `modules/references/references.routes.ts` — Route definitions

**Endpoints:**

| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| POST | `/v1/references` | Yes | 2 | Create reference for a user (requires tier 2) |
| GET | `/v1/references/:userId` | Yes | 0 | Get references for a user |

**Database tables owned:** `user_references`

**Key business rules:**
- Only tier 2+ users can write references
- References have a 1–5 rating and optional encrypted comment
- A user can only write one reference per target user (UNIQUE constraint)
- References from tier 2+ users receive 1.5× weight in trust score calculation
- When a user accumulates 3+ references from tier 2+ users, they automatically promote to tier 3

### 4.7 Discovery Module

**What it does:** PostGIS-powered geolocation discovery of nearby users.

**Key files:**
- `modules/discovery/discovery.service.ts` — `ST_DWithin` queries, location update, Redis caching
- `modules/discovery/discovery.controller.ts` — HTTP handlers
- `modules/discovery/discovery.routes.ts` — Route definitions

**Endpoints:**

| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/discover?lat=&lng=&radius=&venueId=&eventId=` | Yes | 0 | Find nearby users. Free tier capped at 30 results; premium or venue/event context uses higher cap. Response: data, count, discoveryCap, radiusUsedKm, computedRadiusKm? (density-aware). |
| POST | `/v1/discover/location` | Yes | 0 | Update user's location |

**Database tables owned:** `locations`

**Key business rules:**
- **Discovery cap:** Free subscription = 30 closest; premium = 50. Query params `venueId` or `eventId` bypass cap (e.g. "who's here" context). Config: `DISCOVERY_CAP_FREE`, `DISCOVERY_CAP_PREMIUM`.
- **Density-aware:** When result count < 15 and radius < max, response includes `computedRadiusKm` (suggested larger radius to "expand your circle").
- Location is stored as PostGIS `GEOMETRY(Point, 4326)` with GIST index
- Discovery uses `ST_DWithin` with geography casts for meter-accurate distance
- Maximum discovery radius: 100 km (configurable via `MAX_DISCOVERY_RADIUS_KM`)
- Location is fuzzed by 300 m by default (`DEFAULT_LOCATION_FUZZ_METERS`) unless precise mode is enabled
- Discovery results are cached in Redis for 30 seconds
- Blocked users are filtered out of discovery results (both directions)
- Redis `GEOADD` is also used for fast geo lookups

### 4.8 Presence Module

**What it does:** Real-time presence state machine with 8 states and automatic decay.

**Key files:**
- `modules/discovery/presence.service.ts` — State transitions, decay, venue-scoped queries
- `modules/discovery/presence.routes.ts` — Route definitions

**Endpoints:**

| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| POST | `/v1/presence/state` | Yes | 0 | Set presence state with optional venue/event binding |
| GET | `/v1/presence/me` | Yes | 0 | Get current presence (Redis-cached) |
| POST | `/v1/presence/reaffirm` | Yes | 0 | Extend presence timer without changing state |
| DELETE | `/v1/presence/me` | Yes | 0 | Go invisible |
| GET | `/v1/presence/venue/:venueId` | Yes | 0 | Get users with presence at a venue |

**Database tables owned:** `presence`

See [Section 12: Presence & Persona System](#12-presence--persona-system) for full details on states, decay, and ad/discovery interactions.

### 4.9 Intents Module

**What it does:** Time-scoped intent flags that signal what a user is looking for tonight.

**Key files:**
- `modules/users/intent.service.ts` — Set, remove, clean expired
- `modules/users/intent.routes.ts` — Route definitions

**Endpoints:**

| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/intents` | Yes | 0 | List active intents |
| POST | `/v1/intents` | Yes | 0 | Set an intent flag with TTL |
| DELETE | `/v1/intents/:flag` | Yes | 0 | Remove a specific intent |

**Database tables owned:** `intent_flags`

See [Section 12: Presence & Persona System](#12-presence--persona-system) for the full intent flag list and how intents affect ads and discovery.

### 4.10 Whispers Module

**What it does:** Anonymous proximity-based signaling with optional identity reveal.

**Key files:**
- `modules/discovery/whisper.service.ts` — Send, respond, reveal, cleanup
- `modules/discovery/whisper.routes.ts` — Route definitions

**Endpoints:**

| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| POST | `/v1/whispers` | Yes | 0 | Send whisper (toUserId, message; optional category, revealPolicy). Quotas: max pending, max per day; one pending per (from, to). |
| GET | `/v1/whispers/inbox` | Yes | 0 | Received whispers |
| GET | `/v1/whispers/sent` | Yes | 0 | Sent whispers |
| POST | `/v1/whispers/:id/respond` | Yes | 0 | Respond to a whisper (with optional reveal) |
| POST | `/v1/whispers/:id/seen` | Yes | 0 | Mark whisper as seen |
| POST | `/v1/whispers/:id/ignore` | Yes | 0 | Ignore whisper |

**Database tables owned:** `whispers` (migration 016: category, reveal_policy; unique index one pending per from/to)

**Key business rules:** category (compliment, invite, curious, other), reveal_policy (on_response, anonymous_only, never); max pending 3, max per day 20.

See [Section 13: Whisper System](#13-whisper-system) for full details.

### 4.11 Messaging Module

**What it does:** Conversation management (PostgreSQL) + message storage (MongoDB) + ephemeral/self-destructing messages.

**Key files:**
- `modules/messaging/messaging.service.ts` — CRUD for conversations and messages
- `modules/messaging/messaging.controller.ts` — HTTP handlers
- `modules/messaging/messaging.routes.ts` — Route definitions
- `modules/messaging/message.model.ts` — Mongoose schema with TTL index
- `modules/messaging/ephemeral.service.ts` — Disappearing and view-once messages

**Endpoints:**

| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/conversations` | Yes | 0 | List conversations with last message |
| POST | `/v1/conversations` | Yes | 1 | Create conversation (requires tier 1) |
| GET | `/v1/conversations/:id/messages` | Yes | 0 | Get messages for a conversation |
| POST | `/v1/conversations/:id/messages` | Yes | 0 | Send message (text, image, location) |
| PUT | `/v1/conversations/:id/retention` | Yes | 0 | Set retention (mode, archiveAt?, defaultMessageTtlSeconds?) |

**Database tables owned:**
- PostgreSQL: `conversations`, `conversation_participants` (columns: retention_mode, archive_at, default_message_ttl_seconds, is_archived)
- MongoDB: `messages` collection

**Key business rules:**
- Conversation metadata lives in PostgreSQL; message content lives in MongoDB
- Messages have a TTL index on `expiresAt` — MongoDB auto-deletes expired documents
- **Retention:** `retention_mode` (ephemeral | timed_archive | persistent), `archive_at` (read-only after), `default_message_ttl_seconds`; worker `archive-conversations` runs every 1m to set `is_archived` when `archive_at` passed; sending is rejected when conversation is archived
- Message content types: `text`, `image`, `location`
- All messages have `isEncrypted: true` by default (infrastructure ready for E2EE)
- View-once media auto-deletes 5 seconds after all participants have viewed it
- Ephemeral messages accept a `ttlSeconds` parameter for custom expiry (or use conversation default)

### 4.12 Sessions Module

**What it does:** Time-bounded chat sessions with mutual consent, panic wipe capability.

**Key files:**
- `modules/messaging/session.service.ts` — Session creation, consent, panic wipe
- `modules/messaging/session.routes.ts` — Route definitions

**Endpoints:**

| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| POST | `/v1/conversations/session` | Yes | 0 | Create time-bounded session chat |
| POST | `/v1/conversations/:id/consent` | Yes | 0 | Grant consent to participate |
| POST | `/v1/conversations/panic-wipe` | Yes | 0 | Wipe ALL conversations and messages |

**Database tables owned:** Adds columns to `conversations`: `session_expires_at`, `session_ttl_hours`, `panic_wiped_at`, `requires_mutual_consent`, `consent_granted_by`

**Key business rules:**
- Session chats have a configurable TTL (default 24h, max 168h/7 days)
- `requires_mutual_consent` defaults to `true` — all participants must call `/consent` before messaging
- Panic wipe deletes ALL messages from MongoDB for ALL of the user's conversations, sets `panic_wiped_at` on each conversation, and emits `conversation_wiped` via WebSocket to all other participants
- Panic wipe is logged to `audit_logs` with `gdpr_category: 'safety'`
- A background worker (every 5 min) expires session chats that have passed their TTL

### 4.13 E2EE Module

**What it does:** End-to-end encryption key infrastructure (key registration, prekey bundles, conversation keys).

**Key files:**
- `modules/messaging/e2ee.service.ts` — Key registration, prekey claims, conversation keys
- `modules/messaging/e2ee.routes.ts` — Route definitions

**Endpoints:**

| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| POST | `/v1/e2ee/keys/register` | Yes | 0 | Register public key (x25519-xsalsa20-poly1305) |
| GET | `/v1/e2ee/keys/:userId` | Yes | 0 | Get user's public key + fingerprint |
| GET | `/v1/e2ee/keys/:userId/bundle` | Yes | 0 | Get identity key + claim one prekey |
| POST | `/v1/e2ee/keys/prekeys` | Yes | 0 | Upload batch of prekeys (1–100) |
| POST | `/v1/e2ee/keys/conversation` | Yes | 0 | Store encrypted conversation key |
| GET | `/v1/e2ee/keys/conversation/:conversationId` | Yes | 0 | Retrieve encrypted conversation key |

**Database tables owned:** `user_keys`, `prekey_bundles`, `conversation_keys`

**Key business rules:**
- Algorithm: `x25519-xsalsa20-poly1305` (NaCl/TweetNaCl)
- Key fingerprint is derived from the public key: first 16 chars + `...` + last 8 chars
- Prekeys are one-time-use: claimed prekeys are marked `is_used = true`
- Conversation keys are encrypted per-participant (each user stores their own encrypted copy)
- **Important limitation:** The server-side infrastructure is complete, but client-side encryption/decryption is **not yet wired** in the mobile app. Messages are currently stored as plaintext in MongoDB.

### 4.14 Events Module

**What it does:** Event creation, RSVP, check-in, and lifecycle management.

**Key files:**
- `modules/events/events.service.ts` — CRUD, RSVP, check-in
- `modules/events/events.controller.ts` — HTTP handlers
- `modules/events/events.routes.ts` — Route definitions
- `modules/events/lifecycle.service.ts` — Automated phase transitions

**Endpoints:**

| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/events/nearby?lat=&lng=&radius=&vibe=` | Yes | 0 | Find nearby events (optional vibe; service supports date filter for tonight feed) |
| POST | `/v1/events` | Yes | 2 | Create event (optional vibeTag, locationRevealedAfterRsvp, visibilityRule, visibilityTierMin, visibilityRadiusKm) |
| GET | `/v1/events/:id` | Yes | 0 | Get event details |
| GET | `/v1/events/:id/attendees` | Yes | 0 | Privacy-safe attendee list (persona + badges, no user ids) |
| GET | `/v1/events/:id/chat-rooms` | Yes | 0 | Chat rooms linked to this event |
| POST | `/v1/events/:id/rsvp` | Yes | 0 | RSVP to event |
| POST | `/v1/events/:id/checkin` | Yes | 0 | Check in at event |
| PUT | `/v1/events/:id/door-code` | Yes | 0 | Set door code (host or venue staff; body: code, optional expiresAt) |
| POST | `/v1/events/validate-door-code` | Yes | 0 | Validate code, grant RSVP + check-in (body: eventId, code); rate-limited |

**Database tables owned:** `events` (017: vibe_tag; 019: door_code_hash, door_code_expires_at; 020: location_revealed_after_rsvp; 021: visibility_rule, visibility_tier_min, visibility_radius_km), `event_rsvps`, `event_post_prompts` (015)

**Key business rules:**
- Event creation requires tier 2 (ID-verified)
- Events have a 6-phase lifecycle: `discovery` → `upcoming` → `live` → `winding_down` → `post` → `archived`
- The lifecycle worker transitions events every 60 seconds based on time:
  - `upcoming` → `discovery`: 24h before start (sends push notifications to nearby users)
  - `discovery`/`upcoming` → `live`: at start time
  - `live` → `winding_down`: 1h before end
  - `live`/`winding_down` → `post`: at end time (sends reference + keep_chatting prompts once per attendee via `event_post_prompts`)
  - `post` → `archived`: 48h after end
- **Post-event prompts:** `event_post_prompts` stores (event_id, user_id, prompt_type) so reference and keep_chatting are sent at most once per user per event
- RSVP statuses: `going`, `maybe`, `declined`, `checked_in`
- Events can be private (require invite code) or public
- **Vibe tag (017):** Optional `vibe_tag` on events: `social_mix`, `lifestyle`, `kink`, `couples_only`, `newbie_friendly`; filter nearby by `vibe=` query param
- **Door code (019):** Event host or venue staff can set a door code (PUT `/v1/events/:id/door-code`). Attendees validate with POST `/v1/events/validate-door-code` (eventId, code); on success they are added/updated as checked-in. Code stored as SHA-256 hash; optional expiresAt. Rate-limited.
- **Location revealed after RSVP (020):** When `location_revealed_after_rsvp` is true, venue name/lat/lng are redacted in GET event and nearby/tonight until the user has RSVP'd (going or checked_in); shown as "Location revealed after RSVP".
- **Visibility rules (021):** `visibility_rule` (open | tier_min | invite_only | attended_2_plus), `visibility_tier_min`, `visibility_radius_km`. Nearby and tonight feed filter to events the viewer can see; GET event returns 403 if viewer does not meet rule. invite_only events are excluded from lists.

### 4.14.1 Tonight feed

**What it does:** Single aggregator for "what's happening tonight": nearby events (filtered by date) and nearby venues with current check-in counts.

**Key files:** `modules/tonight/tonight.service.ts`, `tonight.controller.ts`, `tonight.routes.ts`

**Endpoint:** GET `/v1/tonight?lat=&lng=&date=&radius=` (auth required). Returns `{ data: { events, venues, date } }`. Events capped at 30, venues at 20; each venue includes `currentAttendees`. Date defaults to today (UTC) if omitted.

### 4.15 Venues Module

**What it does:** Venue CRUD with geofencing.

**Key files:**
- `modules/venues/venues.service.ts` — CRUD + geofence queries
- `modules/venues/venues.controller.ts` — HTTP handlers
- `modules/venues/venues.routes.ts` — Route definitions

**Endpoints:**

| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/venues/nearby` | Yes | 0 | Find nearby venues |
| GET | `/v1/venues/geofence-check` | Yes | 0 | Check if user is inside a geofence |
| POST | `/v1/venues` | Yes | 2 | Create venue (requires tier 2) |
| GET | `/v1/venues/:id` | Yes | 0 | Get venue details |
| PUT | `/v1/venues/:id` | Yes | 0 | Update venue (owner only) |
| PUT | `/v1/venues/:id/verified-safe` | Yes | 0 | Self-attest verified safe (owner only; optional body: checklistJson or metadata) |

**Database tables owned:** `venues` (018: verified_safe_at, verified_safe_metadata; 020: venue_type physical|promoter|series), `geofences`

**Key business rules:**
- Venue creation requires tier 2
- Geofences are stored as PostGIS `GEOMETRY(Polygon, 4326)` with GIST index
- Geofence containment is checked via PostGIS `ST_Contains`
- **Verified safe (018):** Owner can self-attest via PUT `/v1/venues/:id/verified-safe` (optional body: checklistJson). GET venue, nearby, and tonight feed include `verifiedSafe: true` when `verified_safe_at` is set. No PII in attestation.

### 4.16 Venue Identity Module

**What it does:** First-class venue accounts — claiming, check-ins, announcements, chat rooms.

**Key files:**
- `modules/venues/venue-identity.service.ts` — Claim, announce, check-in/out, chat rooms
- `modules/venues/venue-identity.routes.ts` — Route definitions

**Endpoints:**

| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| POST | `/v1/venues/:id/claim` | Yes | 2 | Claim a venue (email + phone) |
| POST | `/v1/venues/:id/announcements` | Yes | 2 | Create announcement |
| GET | `/v1/venues/announcements/nearby` | Yes | 0 | Get nearby announcements |
| POST | `/v1/venues/:id/checkin` | Yes | 0 | Check in (body optional: anonymousMode; default true for privacy) |
| POST | `/v1/venues/:id/checkout` | Yes | 0 | Check out |
| GET | `/v1/venues/:id/attendees` | Yes | 0 | Get current attendees |
| GET | `/v1/venues/:id/grid` | Yes | 0 | Privacy-safe grid (anonymous tiles or persona + badges; no user ids) |
| GET | `/v1/venues/:id/stats` | Yes | 0 | Get venue stats |
| POST | `/v1/venues/:id/chat-rooms` | Yes | 2 | Create chat room |
| GET | `/v1/venues/:id/chat-rooms` | Yes | 0 | Get active chat rooms |

**Database tables owned:** `venue_accounts`, `venue_announcements`, `venue_checkins` (014: anonymous_mode default true), `venue_chat_rooms`

**Key business rules:**
- Venue claiming requires tier 2; email and phone are hashed before storage
- A venue can only be claimed once (`is_claimed = true` constraint)
- **Check-in:** optional `anonymousMode` (default true); when true, user appears as anonymous on venue grid
- **Grid:** GET `/v1/venues/:id/grid` returns privacy-safe tiles (anonymous or personaType + badges); no user ids
- Announcements have types: `announcement`, `promotion`, `event_promo`, `special`
- Announcements are geospatially filtered using `ST_DWithin` against the venue location
- Chat rooms can have `auto_close_at` for time-limited rooms (e.g., event-bound)
- Venue check-in prevents duplicates — if already checked in, returns `alreadyCheckedIn: true`

### 4.17 Venue Dashboard Module

**What it does:** Analytics, staff management, reviews, specials for venue owners.

**Key files:**
- `modules/venues/venue-dashboard.service.ts` — Dashboard, analytics, staff, reviews, specials
- `modules/venues/venue-dashboard.routes.ts` — Route definitions

**Endpoints:**

| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/venues/:id/full` | Yes | 0 | Full public venue profile |
| GET | `/v1/venues/:id/dashboard` | Yes | 2 | Owner dashboard overview |
| GET | `/v1/venues/:id/analytics` | Yes | 2 | Analytics range (default 30 days) |
| GET | `/v1/venues/:id/analytics/density` | Yes | 2 | Density intelligence: peakLastDays (peak check-ins), eventTypePerformance (aggregates; no PII) |
| GET | `/v1/venues/:id/trends` | Yes | 2 | Weekly trends from 90 days |
| PUT | `/v1/venues/:id/profile` | Yes | 2 | Update venue profile |
| GET | `/v1/venues/:id/staff` | Yes | 0 | List staff |
| POST | `/v1/venues/:id/staff` | Yes | 2 | Invite staff member |
| DELETE | `/v1/venues/:id/staff/:staffId` | Yes | 2 | Remove staff |
| GET | `/v1/venues/:id/reviews` | Yes | 0 | Get reviews + summary |
| POST | `/v1/venues/:id/reviews` | Yes | 0 | Submit review (must have visited) |
| GET | `/v1/venues/:id/specials` | Yes | 0 | Get specials |
| POST | `/v1/venues/:id/specials` | Yes | 2 | Create special |

**Database tables owned:** `venue_analytics`, `venue_staff`, `venue_reviews`, `venue_specials`

**Key business rules:**
- Dashboard aggregates real-time stats: current check-ins, active chat rooms, nearby presence count
- Reviews require at least one previous check-in (enforced via query)
- Reviews are anonymous by default (`is_anonymous = true`)
- Vibe tags are stored as `text[]` — freeform strings like "chill", "loud", "friendly"
- Staff roles: `owner`, `manager`, `staff`, `security`, `dj`
- Specials support recurring schedules (day_of_week + start/end time)
- **Density intelligence (GC-1.4):** GET `/v1/venues/:id/analytics/density` returns `peakLastDays` (date, peakHour, peakCount from venue_analytics) and `eventTypePerformance` (event type, eventCount, totalAttendees, avgAttendees). Aggregates only; no PII.

### 4.18 Safety Module

**What it does:** Emergency contacts, check-ins, panic alerts, screenshot reporting.

**Key files:**
- `modules/safety/safety.service.ts` — Contacts CRUD, check-in, panic, recordScreenshotReport
- `modules/safety/safety.controller.ts` — HTTP handlers
- `modules/safety/safety.routes.ts` — Route definitions

**Endpoints:**

| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/safety/contacts` | Yes | 0 | List emergency contacts |
| POST | `/v1/safety/contacts` | Yes | 0 | Add emergency contact |
| DELETE | `/v1/safety/contacts/:id` | Yes | 0 | Remove emergency contact |
| POST | `/v1/safety/checkin` | Yes | 0 | Safety check-in |
| POST | `/v1/safety/panic` | Yes | 0 | Trigger panic (recorded; notifications to contacts not yet sent) |
| POST | `/v1/safety/screenshot` | Yes | 0 | Record screenshot report (body: optional targetUserId, conversationId) |
| POST | `/v1/safety/venue-distress` | Yes | 0 | Signal distress to venue security (body: venueId). User must be checked in; notifies active venue staff via WebSocket. |

**Database tables owned:** `emergency_contacts`, `safety_checkins`, `screenshot_events`

**Key business rules:** Venue distress is conditional on venue staff being present; audit_logs action `safety.venue_distress` records each call.

See [Section 11: Safety & Trust](#11-safety--trust) for full details.

### 4.19 Media / Albums Module

**What it does:** Photo/video upload with Sharp processing, private albums with granular sharing.

**Key files:**
- `modules/media/media.service.ts` — Upload, get, delete, view tracking, cleanup
- `modules/media/media.controller.ts` — HTTP handlers (Multer multipart)
- `modules/media/media.routes.ts` — Route definitions
- `modules/media/album.service.ts` — Album CRUD, sharing, access control
- `modules/media/storage.service.ts` — Local file storage + Sharp thumbnail generation

**Endpoints:**

| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| POST | `/v1/media/upload` | Yes | 0 | Upload photo/video (multipart) |
| POST | `/v1/media/upload/self-destruct` | Yes | 0 | Upload self-destructing media |
| GET | `/v1/media/my` | Yes | 0 | List own media |
| GET | `/v1/media/:id` | Yes | 0 | Get media (access controlled) |
| DELETE | `/v1/media/:id` | Yes | 0 | Delete own media |
| POST | `/v1/media/:id/view` | Yes | 0 | Track media view (duration) |
| POST | `/v1/media/albums` | Yes | 0 | Create private album |
| GET | `/v1/media/albums/my` | Yes | 0 | List own albums |
| GET | `/v1/media/albums/shared` | Yes | 0 | Albums shared with me |
| GET | `/v1/media/albums/:id` | Yes | 0 | Get album (access controlled) |
| DELETE | `/v1/media/albums/:id` | Yes | 0 | Delete album |
| POST | `/v1/media/albums/:id/media` | Yes | 0 | Add media to album |
| DELETE | `/v1/media/albums/:id/media/:mediaId` | Yes | 0 | Remove media from album |
| POST | `/v1/media/albums/:id/share` | Yes | 0 | Share album (userId or targetPersonaId or targetCoupleId; watermarkMode, notifyOnView) |
| DELETE | `/v1/media/albums/:id/share/:userId` | Yes | 0 | Revoke album share |

**Database tables owned:** `media`, `albums`, `album_media`, `album_shares` (share_target_type, share_target_id, watermark_mode, notify_on_view), `media_view_tracking`

**Key business rules:**
- Files are stored locally in `backend/uploads/` directory (future: S3/GCS via `storage_provider` column)
- Sharp generates thumbnails for images
- **Album share:** Can target user, persona, or couple; options include `watermarkMode`, `notifyOnView`; persona/couple resolved to user id(s) for access checks
- Self-destructing media has an `expires_at` timestamp; cleanup worker runs every 10 minutes
- View-once media tracks viewers in `media_view_tracking` — once all conversation participants have viewed, the media auto-deletes in 5 seconds
- Album sharing emits `album_shared` via WebSocket; revoking emits `album_revoked`
- Albums are private by default (`is_private = true`)
- Album access control: owner always has access; others need an active share (not revoked, not expired)
- `can_download` flag controls whether shared users can download (vs view-only)
- Static uploads are served via `express.static` at `/uploads`

### 4.20 Blur/Reveal Module

**What it does:** Photo blur preferences and mutual photo reveals.

**Key files:**
- `modules/users/blur.service.ts` — Blur preference, reveal, revoke, mutual check
- `modules/users/blur.routes.ts` — Route definitions

**Endpoints:**

| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| PUT | `/v1/photos/preference` | Yes | 0 | Set blur preference |
| POST | `/v1/photos/reveal` | Yes | 0 | Reveal photos to a specific user |
| DELETE | `/v1/photos/reveal/:userId` | Yes | 0 | Revoke photo reveal |
| GET | `/v1/photos/reveals` | Yes | 0 | List reveals with mutual status |
| GET | `/v1/photos/check/:userId` | Yes | 0 | Check if you can see unblurred photos |

**Database tables owned:** `photo_reveals`, adds `blur_photos` column to `user_profiles`

**Key business rules:**
- Users can set `blur_photos = true` on their profile; all their photos appear blurred to others
- **Reveal level/scope (migration 011):** Optional `level` (0–2), `scope_type` (global, conversation), `scope_id`; `GET /v1/media/:id` enforces — returns 404 if requester has no reveal from owner
- Reveals are directional: A can reveal to B without B revealing to A
- Reveals can have an `expires_at` for time-limited reveals
- The `getMutualReveals` query includes an `is_mutual` flag showing if the other person has also revealed to you

### 4.21 Compliance Module

**What it does:** GDPR/CCPA compliance — data export, account deletion, consent tracking.

**Key files:**
- `modules/compliance/compliance.service.ts` — Export, delete, consent
- `modules/compliance/compliance.controller.ts` — HTTP handlers
- `modules/compliance/compliance.routes.ts` — Route definitions

**Endpoints:**

| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| POST | `/v1/compliance/data-export` | Yes | 0 | Export all user data (GDPR Art. 20) |
| DELETE | `/v1/compliance/account-deletion` | Yes | 0 | Request account deletion (GDPR Art. 17) |
| POST | `/v1/compliance/consent` | Yes | 0 | Record consent |
| POST | `/v1/compliance/consent/withdraw` | Yes | 0 | Withdraw consent |

**Database tables owned:** `consent_records`, `data_deletion_requests`

**Key business rules:**
- Data export aggregates from all tables: profile, conversations, messages, locations, interactions, verifications
- Account deletion: `requestAccountDeletion` inserts a row into `data_deletion_requests`; a **background worker** (`process-deletions`, every 5m) processes pending requests by **anonymizing** the user (phone_hash, email_hash, password_hash cleared; user_profiles PII cleared), then marking the request completed. Semantics: anonymize first, hard delete later.
- Consent records track `consent_type`, `version`, `granted_at`, `withdrawn_at`

### 4.22 Admin Module

**What it does:** Moderation dashboard, report management, user administration, audit logs.

**Key files:**
- `modules/admin/moderation.service.ts` — Stats, queue, reports, user detail, trust, audit
- `modules/admin/admin.controller.ts` — HTTP handlers
- `modules/admin/admin.routes.ts` — Route definitions

**RBAC:** The `users` table has a `role` column: `'user' | 'moderator' | 'admin' | 'superadmin'`. Admin routes use `requireRole('moderator')` middleware; destructive actions (e.g. banning) use `requireRole('admin')`. Every admin action is logged via `logAdminAction()` to the `admin_actions` table with justification.

**Endpoints:**

| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/v1/admin/stats` | Yes | moderator | Dashboard statistics |
| GET | `/v1/admin/moderation` | Yes | moderator | Moderation queue |
| GET | `/v1/admin/reports` | Yes | moderator | Report list |
| POST | `/v1/admin/reports/:id/resolve` | Yes | moderator | Resolve report |
| GET | `/v1/admin/users/:userId` | Yes | moderator | User detail view |
| POST | `/v1/admin/users/:userId/ban` | Yes | admin | Ban user |
| POST | `/v1/admin/users/:userId/trust-score` | Yes | moderator | Recalculate trust score |
| GET | `/v1/admin/audit-logs` | Yes | moderator | Audit trail |

**Database tables owned:** `moderation_queue`, `content_flags`, `admin_actions`

**Key business rules:**
- Admin endpoints require `requireRole('moderator')`; banning requires `requireRole('admin')`
- Banning sets `is_active = false` on the user; `logAdminAction()` is called on report resolution and user bans
- `admin_actions` table logs every admin action with `admin_user_id`, `action`, `target_type`, `target_id`, `justification`
- Moderation queue items have priority levels and can be assigned to specific admins
- Content flags can be automated or from user reports

### 4.23 Ads Module

**What it does:** Location-targeted advertising with cadence controls and kill switch.

**Key files:**
- `modules/ads/ad.service.ts` — Ad eligibility, impressions, taps, dismissals, placement management
- `modules/ads/ad.routes.ts` — Route definitions

See [Section 9: Ad System](#9-ad-system) for full details.

### 4.24 Billing Module

**What it does:** Stripe-powered premium subscriptions with 4 tiers.

**Key files:**
- `modules/billing/subscription.service.ts` — Checkout, webhook, activation, tier management
- `modules/billing/billing.routes.ts` — Route definitions

See [Section 14: Billing & Premium](#14-billing--premium) for full details.

---

## 5. Database Schema Reference

### 5.1 Migration Files

| File | What it adds |
|------|-------------|
| `001_initial.sql` | Core tables: `users`, `refresh_tokens`, `couples`, `user_profiles`, `locations`, `verifications`, `user_references`, `blocks`, `venues`, `events`, `event_rsvps`, `conversations`, `conversation_participants`, `user_interactions`, `reports`, `audit_logs`, `consent_records`, `data_deletion_requests`. PostGIS + UUID extensions. |
| `002_couples_verification_safety.sql` | `trust_scores`, `emergency_contacts`, `safety_checkins`, `geofences`, `moderation_queue`, `content_flags`. Adds dissolution columns to `couples`. Venue enhancements. |
| `003_media_albums.sql` | `media`, `albums`, `album_media`, `album_shares`, `media_view_tracking` |
| `004_push_tokens.sql` | `push_tokens` |
| `005_presence_personas_venue_identity.sql` | `presence`, `personas`, `intent_flags`, `venue_accounts`, `venue_announcements`, `venue_checkins`, `venue_chat_rooms`, `photo_reveals`, `subscriptions`, `screenshot_events`. Session columns on `conversations`. Blur column on `user_profiles`. |
| `006_e2ee_keys.sql` | `user_keys`, `prekey_bundles`, `conversation_keys` |
| `007_whispers_onboarding_shield.sql` | `whispers`. Onboarding columns on `users`. Event lifecycle columns. |
| `008_ads_venue_overhaul.sql` | `ad_placements`, `ad_impressions`, `ad_cadence_rules`, `ad_controls`, `venue_analytics`, `venue_staff`, `venue_reviews`, `venue_specials`. Venue profile columns. |
| `009_admin_rbac_phone_pepper.sql` | `role` column on `users` (`user` \| `moderator` \| `admin` \| `superadmin`), `admin_actions` table. |

### 5.2 All Tables by Domain

#### Identity & Auth (6 tables)

```sql
-- Core user accounts
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_hash VARCHAR(128) UNIQUE NOT NULL,   -- HMAC-SHA256 of phone (with pepper)
    email_hash VARCHAR(128) UNIQUE,             -- HMAC-SHA256 of email (with pepper)
    password_hash VARCHAR(256),                  -- Argon2id hash
    is_active BOOLEAN DEFAULT true,
    verification_tier INTEGER DEFAULT 0,         -- 0=phone, 1=photo, 2=ID, 3=refs
    role VARCHAR(20) DEFAULT 'user',             -- user | moderator | admin | superadmin (RBAC)
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ                       -- soft delete for GDPR
);

-- JWT refresh token rotation
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY, user_id UUID FK→users,
    token_hash VARCHAR(256) UNIQUE NOT NULL,
    device_fingerprint VARCHAR(256),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ, created_at TIMESTAMPTZ
);

-- User profiles (1:1 with users)
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY FK→users,
    display_name VARCHAR(50) NOT NULL,
    bio TEXT DEFAULT '',
    birthdate DATE, gender VARCHAR(30), sexuality VARCHAR(50),
    photos_json JSONB DEFAULT '[]'::jsonb,
    verification_status VARCHAR(20) DEFAULT 'unverified',
    preferences_json JSONB DEFAULT '{}'::jsonb,
    kinks TEXT[] DEFAULT '{}',
    experience_level VARCHAR(20) DEFAULT 'new',
    is_host BOOLEAN DEFAULT false,
    blur_photos BOOLEAN DEFAULT false,
    travel_mode_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
);

-- Verification submissions
CREATE TABLE verifications (
    id UUID PRIMARY KEY, user_id UUID FK→users,
    type VARCHAR(20) CHECK (IN ('photo','id','reference')),
    status VARCHAR(20) CHECK (IN ('pending','approved','rejected')),
    attempt_count INTEGER DEFAULT 1,
    selfie_url TEXT, id_document_hash VARCHAR(256),
    liveness_score REAL, created_at TIMESTAMPTZ
);

-- Trust references
CREATE TABLE user_references (
    id UUID PRIMARY KEY,
    from_user_id UUID FK→users, to_user_id UUID FK→users,
    rating INTEGER CHECK (1-5),
    comment_encrypted TEXT, is_visible BOOLEAN DEFAULT true,
    UNIQUE(from_user_id, to_user_id)
);

-- Push notification tokens
CREATE TABLE push_tokens (
    id UUID PRIMARY KEY, user_id UUID FK→users,
    token TEXT NOT NULL, platform VARCHAR(10) CHECK (IN ('ios','android','web')),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, token)
);
```

#### Social (4 tables)

```sql
-- Couple linking
CREATE TABLE couples (
    id UUID PRIMARY KEY,
    partner_1_id UUID FK→users, partner_2_id UUID FK→users,
    invite_code_hash VARCHAR(128) UNIQUE,
    status VARCHAR(20) CHECK (IN ('pending','active','dissolved')),
    dissolution_requested_at TIMESTAMPTZ,
    dissolution_confirmed_by UUID[],
    cooldown_expires_at TIMESTAMPTZ
);

-- Likes/passes
CREATE TABLE user_interactions (
    from_user_id UUID FK→users, to_user_id UUID FK→users,
    type VARCHAR(10) CHECK (IN ('like','pass')),
    PRIMARY KEY (from_user_id, to_user_id)
);

-- Blocks
CREATE TABLE blocks (
    blocker_id UUID FK→users, blocked_id UUID FK→users,
    reason TEXT, sync_to_partner BOOLEAN DEFAULT false,
    PRIMARY KEY (blocker_id, blocked_id)
);

-- Trust scores (cached calculation)
CREATE TABLE trust_scores (
    user_id UUID PRIMARY KEY FK→users,
    score REAL, tier_points REAL, reference_points REAL,
    age_points REAL, report_penalty REAL,
    badge VARCHAR(20), calculated_at TIMESTAMPTZ
);
```

#### Personas & Presence (3 tables)

```sql
-- Persona system
CREATE TABLE personas (
    id UUID PRIMARY KEY, user_id UUID FK→users,
    type VARCHAR(20) CHECK (IN ('solo','couple','anonymous','traveler')),
    display_name VARCHAR(50) NOT NULL,
    bio TEXT, avatar_media_id UUID FK→media,
    photos_json JSONB, preferences_json JSONB,
    kinks TEXT[], is_active BOOLEAN DEFAULT false,
    blur_photos BOOLEAN DEFAULT false,
    linked_partner_id UUID FK→users
);

-- Presence state machine
CREATE TABLE presence (
    user_id UUID PRIMARY KEY FK→users,
    state VARCHAR(20) CHECK (IN ('invisible','nearby','browsing','at_venue','at_event','open_to_chat','paused','cooldown')),
    venue_id UUID FK→venues, event_id UUID FK→events,
    expires_at TIMESTAMPTZ NOT NULL,
    affirmed_at TIMESTAMPTZ, decay_minutes INTEGER DEFAULT 30
);

-- Intent flags (time-scoped)
CREATE TABLE intent_flags (
    id UUID PRIMARY KEY, user_id UUID FK→users,
    persona_id UUID FK→personas,
    flag VARCHAR(30) CHECK (IN ('open_tonight','traveling','hosting','at_event',
        'looking_for_friends','looking_for_more','just_browsing',
        'new_in_town','couples_only','single_friendly')),
    expires_at TIMESTAMPTZ NOT NULL
);
```

#### Discovery & Location (2 tables)

```sql
-- PostGIS locations
CREATE TABLE locations (
    user_id UUID PRIMARY KEY FK→users,
    geom_point GEOMETRY(Point, 4326) NOT NULL,  -- GIST indexed
    accuracy_meters REAL DEFAULT 0,
    is_precise_mode BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
);

-- Whispers (anonymous proximity signals)
CREATE TABLE whispers (
    id UUID PRIMARY KEY,
    from_user_id UUID FK→users, to_user_id UUID FK→users,
    message TEXT CHECK (length <= 100),
    status VARCHAR(20) CHECK (IN ('pending','seen','responded','expired','ignored')),
    response TEXT CHECK (length <= 100),
    revealed BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ NOT NULL, responded_at TIMESTAMPTZ
);
```

#### Messaging (4 tables PG + 1 MongoDB collection)

```sql
-- Conversation metadata (PostgreSQL)
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    type VARCHAR(20) CHECK (IN ('direct','group','event')),
    is_encrypted BOOLEAN DEFAULT true,
    encryption_key_id VARCHAR(256),
    last_message_at TIMESTAMPTZ,
    session_expires_at TIMESTAMPTZ,
    session_ttl_hours INTEGER DEFAULT 0,
    panic_wiped_at TIMESTAMPTZ,
    requires_mutual_consent BOOLEAN DEFAULT true,
    consent_granted_by UUID[]
);

CREATE TABLE conversation_participants (
    conversation_id UUID FK→conversations, user_id UUID FK→users,
    unread_count INTEGER DEFAULT 0,
    PRIMARY KEY (conversation_id, user_id)
);

-- E2EE key infrastructure
CREATE TABLE user_keys (
    user_id UUID PRIMARY KEY FK→users,
    public_key TEXT NOT NULL,
    key_fingerprint VARCHAR(64),
    algorithm VARCHAR(20) DEFAULT 'x25519-xsalsa20-poly1305'
);

CREATE TABLE prekey_bundles (
    id UUID PRIMARY KEY, user_id UUID FK→users,
    prekey_public TEXT NOT NULL,
    is_used BOOLEAN DEFAULT false
);

CREATE TABLE conversation_keys (
    conversation_id UUID FK→conversations, user_id UUID FK→users,
    encrypted_key TEXT NOT NULL, key_version INTEGER DEFAULT 1,
    PRIMARY KEY (conversation_id, user_id)
);
```

MongoDB `messages` collection:

```javascript
{
  conversationId: String,        // indexed
  senderId: String,
  content: String,
  contentType: 'text' | 'image' | 'location',
  isEncrypted: Boolean,          // default: true
  expiresAt: Date,               // TTL index (auto-delete)
  readBy: [{ userId: String, readAt: Date }],
  createdAt: Date                // indexed
}
// Compound index: { conversationId: 1, createdAt: -1 }
```

#### Venues (8 tables)

```sql
CREATE TABLE venues (
    id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address_hash VARCHAR(256),
    type VARCHAR(30) DEFAULT 'club',
    verified_owner_id UUID FK→users,
    lat DOUBLE PRECISION NOT NULL, lng DOUBLE PRECISION NOT NULL,
    rating REAL DEFAULT 0, capacity INTEGER,
    tagline VARCHAR(200), cover_photo_url TEXT, logo_url TEXT,
    website_url TEXT, instagram_handle VARCHAR(50),
    dress_code TEXT, age_minimum INTEGER DEFAULT 18,
    price_range VARCHAR(10) DEFAULT '$$',
    features TEXT[] DEFAULT '{}', amenities TEXT[] DEFAULT '{}',
    rules_json JSONB DEFAULT '[]'::jsonb,
    description TEXT, photos_json JSONB DEFAULT '[]'::jsonb,
    hours_json JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE venue_accounts (venue_id UUID PK FK→venues, ...);
CREATE TABLE venue_announcements (id UUID PK, venue_id FK→venues, ...);
CREATE TABLE venue_checkins (id UUID PK, venue_id FK→venues, user_id FK→users, ...);
CREATE TABLE venue_chat_rooms (id UUID PK, venue_id FK→venues, ...);
CREATE TABLE venue_analytics (id UUID PK, venue_id FK→venues, date DATE, ...);
CREATE TABLE venue_staff (id UUID PK, venue_id FK→venues, user_id FK→users, role, ...);
CREATE TABLE venue_reviews (id UUID PK, venue_id FK→venues, user_id FK→users, ...);
CREATE TABLE venue_specials (id UUID PK, venue_id FK→venues, ...);
CREATE TABLE geofences (id UUID PK, venue_id FK→venues, geom_polygon GEOMETRY(Polygon,4326), ...);
```

#### Events (2 tables)

```sql
CREATE TABLE events (
    id UUID PRIMARY KEY,
    venue_id UUID FK→venues, host_user_id UUID FK→users,
    title VARCHAR(200) NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL,
    type VARCHAR(30) DEFAULT 'party',
    phase VARCHAR(20) DEFAULT 'upcoming' CHECK (IN ('discovery','upcoming','live','winding_down','post','archived')),
    status VARCHAR(20) DEFAULT 'upcoming' CHECK (IN ('upcoming','active','completed','cancelled')),
    capacity INTEGER, is_private BOOLEAN DEFAULT false,
    discovery_radius_km INTEGER DEFAULT 50,
    auto_checkin_enabled BOOLEAN DEFAULT true,
    reference_prompts_sent BOOLEAN DEFAULT false
);

CREATE TABLE event_rsvps (
    event_id UUID FK→events, user_id UUID FK→users,
    status VARCHAR(20) CHECK (IN ('going','maybe','declined','checked_in')),
    plus_ones INTEGER DEFAULT 0, arrived_at TIMESTAMPTZ,
    PRIMARY KEY (event_id, user_id)
);
```

#### Media (4 tables)

```sql
CREATE TABLE media (
    id UUID PRIMARY KEY, user_id UUID FK→users,
    filename VARCHAR(255), original_name VARCHAR(255),
    mime_type VARCHAR(100), size_bytes BIGINT,
    storage_path TEXT NOT NULL,
    storage_provider VARCHAR(20) DEFAULT 'local' CHECK (IN ('local','s3','gcs')),
    is_nsfw BOOLEAN DEFAULT false,
    moderation_status VARCHAR(20) DEFAULT 'pending',
    metadata_json JSONB, expires_at TIMESTAMPTZ, deleted_at TIMESTAMPTZ
);

CREATE TABLE albums (id UUID PK, owner_id UUID FK→users, name, is_private BOOLEAN DEFAULT true, ...);
CREATE TABLE album_media (album_id FK→albums, media_id FK→media, sort_order, PK(album_id,media_id));
CREATE TABLE album_shares (album_id FK→albums, shared_with_user_id FK→users, granted_by FK→users,
    can_download BOOLEAN, expires_at, revoked_at, PK(album_id,shared_with_user_id));
CREATE TABLE media_view_tracking (media_id FK→media, viewer_id FK→users, viewed_at, view_duration_ms, PK(media_id,viewer_id));
```

#### Ads (3 tables + 1 config table)

```sql
CREATE TABLE ad_placements (
    id UUID PRIMARY KEY, venue_id UUID FK→venues,
    surface VARCHAR(20) CHECK (IN ('discover_feed','chat_list','post_event','venue_page')),
    headline VARCHAR(100) NOT NULL, body TEXT, media_url TEXT,
    cta_text VARCHAR(30) DEFAULT 'Learn More', cta_url TEXT,
    target_radius_km INTEGER DEFAULT 50,
    target_intents TEXT[] DEFAULT '{}', target_genders TEXT[] DEFAULT '{}',
    budget_cents INTEGER DEFAULT 0, spent_cents INTEGER DEFAULT 0,
    max_impressions INTEGER, impression_count INTEGER DEFAULT 0, tap_count INTEGER DEFAULT 0,
    cpm_cents INTEGER DEFAULT 1500, is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMPTZ, expires_at TIMESTAMPTZ
);

CREATE TABLE ad_impressions (
    id UUID PK, placement_id FK→ad_placements, user_id FK→users,
    surface VARCHAR(20), shown_at TIMESTAMPTZ, tapped_at TIMESTAMPTZ,
    dismissed_at TIMESTAMPTZ, dismiss_ttl_days INTEGER DEFAULT 7
);

CREATE TABLE ad_cadence_rules (surface VARCHAR(20) PK, max_per_24h, min_gap_minutes, skip_first_open, skip_during_intents, is_enabled);
CREATE TABLE ad_controls (id VARCHAR(30) PK, value JSONB);  -- 'global', 'city_overrides'
```

#### Billing (1 table)

```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY, user_id UUID FK→users,
    tier VARCHAR(20) CHECK (IN ('free','discreet','phantom','elite')),
    stripe_subscription_id VARCHAR(128), stripe_customer_id VARCHAR(128),
    status VARCHAR(20) CHECK (IN ('active','past_due','cancelled','expired')),
    current_period_start TIMESTAMPTZ, current_period_end TIMESTAMPTZ,
    persona_slots INTEGER DEFAULT 1,
    features_json JSONB DEFAULT '{}'::jsonb
);
```

#### Safety (3 tables)

```sql
CREATE TABLE emergency_contacts (
    id UUID PK, user_id FK→users,
    name VARCHAR(100), phone_hash VARCHAR(128), relationship VARCHAR(50)
);

CREATE TABLE safety_checkins (
    id UUID PK, user_id FK→users, event_id FK→events,
    type VARCHAR(20) CHECK (IN ('arrived','periodic','departed','panic')),
    location GEOMETRY(Point,4326),
    expected_next_at TIMESTAMPTZ, responded_at TIMESTAMPTZ,
    alert_sent BOOLEAN DEFAULT false
);

CREATE TABLE screenshot_events (
    id UUID PK, reporter_id FK→users, target_user_id FK→users,
    conversation_id FK→conversations, detected_at TIMESTAMPTZ,
    response_action VARCHAR(30) DEFAULT 'notify'
);
```

#### Compliance & Audit (4 tables)

```sql
CREATE TABLE audit_logs (
    id UUID PK, user_id FK→users, action VARCHAR(100),
    ip_hash VARCHAR(128), user_agent_hash VARCHAR(128),
    metadata_json JSONB, gdpr_category VARCHAR(30)
);

CREATE TABLE reports (
    id UUID PK, reporter_id FK→users, reported_user_id FK→users,
    reason VARCHAR(50), description TEXT,
    status VARCHAR(20) CHECK (IN ('pending','reviewing','resolved','dismissed'))
);

CREATE TABLE consent_records (user_id FK→users, consent_type VARCHAR(50), version, granted_at, withdrawn_at, PK(user_id,consent_type));
CREATE TABLE data_deletion_requests (id UUID PK, user_id FK→users, status CHECK (IN ('pending','processing','completed')));
CREATE TABLE moderation_queue (id UUID PK, type, target_id, target_type, priority, status, assigned_to FK→users);
CREATE TABLE content_flags (id UUID PK, content_type, content_id, user_id FK→users, flag_type, confidence, source, status);

-- Photo blur/reveal
CREATE TABLE photo_reveals (
    from_user_id UUID FK→users, to_user_id UUID FK→users,
    revealed_at TIMESTAMPTZ, expires_at TIMESTAMPTZ,
    PRIMARY KEY (from_user_id, to_user_id)
);
```

### 5.3 Key Indexes

| Index | Type | Purpose |
|-------|------|---------|
| `idx_locations_geom` | GIST | Fast PostGIS geospatial queries on user locations |
| `idx_geofences_geom` | GIST | Fast geofence containment checks |
| `idx_users_phone_hash` | B-tree | Login lookup by hashed phone |
| `idx_users_active` | Partial B-tree | Filter active users only |
| `idx_presence_state` | Partial B-tree | Filter non-invisible presence |
| `idx_presence_expires` | B-tree | Decay worker scans |
| `idx_whispers_expires` | B-tree | Whisper cleanup worker |
| `idx_ad_placements_surface` | Partial B-tree | Active ads by surface |
| `idx_audit_logs_created` | B-tree | Time-range queries on audit trail |
| `idx_venue_checkins_venue` | Partial B-tree | Current attendees (not checked out) |
| `idx_prekeys_available` | Partial B-tree | Available (unused) prekeys for E2EE |
| MongoDB `messages(conversationId, createdAt)` | Compound | Message pagination |
| MongoDB `messages(expiresAt)` | TTL | Auto-delete expired messages |

### 5.4 PostGIS Usage Notes

- All geometry columns use **SRID 4326** (WGS 84 / GPS coordinates)
- Distance queries use **geography casts**: `geom_point::geography` converts from planar geometry to spherical geography for meter-accurate distance calculations
- `ST_DWithin(geog1, geog2, distance_meters)` is the primary discovery operator — it uses the GIST index
- `ST_MakePoint(lng, lat)` — **note the order**: longitude first, latitude second (PostGIS convention)
- `ST_Distance` returns distance in meters when used with geography casts
- Location fuzzing adds random offset of up to 300m to coordinates before returning to clients

---

## 6. Mobile App Reference

### 6.1 Screen Routes

The mobile app uses **expo-router** (file-based routing). All screens are in `mobile/app/`.

| Route | File | Description |
|-------|------|-------------|
| `/(auth)` | `app/(auth)/_layout.tsx` | Auth flow layout |
| `/(auth)/index` | `app/(auth)/index.tsx` | Login screen |
| `/(auth)/register` | `app/(auth)/register.tsx` | Registration screen |
| `/(auth)/verify-code` | `app/(auth)/verify-code.tsx` | OTP verification (guard when phone/mode missing) |
| `/(auth)/onboarding` | `app/(auth)/onboarding.tsx` | Post-registration onboarding |
| `/(auth)/onboarding-intent` | `app/(auth)/onboarding-intent.tsx` | Intent selection |
| `/(tabs)` | `app/(tabs)/_layout.tsx` | Tab navigator (Explore, Chat, Events, Me) |
| `/(tabs)/index` | `app/(tabs)/index.tsx` | **Discover** — nearby user grid (useLocation, loading/error UI) |
| `/(tabs)/messages` | `app/(tabs)/messages.tsx` | Conversations list (loading/error UI) |
| `/(tabs)/events` | `app/(tabs)/events.tsx` | Nearby events (useLocation, loading/error UI) |
| `/(tabs)/profile` | `app/(tabs)/profile.tsx` | Me — profile + menu (loadProfile spinner, error UI) |
| `/chat/[id]` | `app/chat/[id].tsx` | Chat (WebSocket join/onNewMessage/leave, error UI, screenshot detection) |
| `/user/[id]` | `app/user/[id].tsx` | User profile view (error UI with retry) |
| `/venue/[id]` | `app/venue/[id].tsx` | Venue detail |
| `/event/[id]` | `app/event/[id].tsx` | Event detail |
| `/album/index` | `app/album/index.tsx` | Album list (loading/error UI) |
| `/album/[id]` | `app/album/[id].tsx` | Album detail |
| `/profile/edit` | `app/profile/edit.tsx` | Edit profile |
| `/profile/status` | `app/profile/status.tsx` | Presence & intents |
| `/profile/emergency` | `app/profile/emergency.tsx` | Emergency contacts |
| `/profile/privacy` | `app/profile/privacy.tsx` | Privacy & data |
| `/profile/hosting` | `app/profile/hosting.tsx` | Hosting |
| `/profile/create-event` | `app/profile/create-event.tsx` | Create event |
| `/profile/venues` | `app/profile/venues.tsx` | My venues |
| `/profile/create-venue` | `app/profile/create-venue.tsx` | Create venue |
| `/profile/venue-dashboard/[id]` | `app/profile/venue-dashboard/[id].tsx` | Venue dashboard |
| `/profile/venue-edit/[id]` | `app/profile/venue-edit/[id].tsx` | Edit venue |
| `/profile/venue-add-special/[id]` | `app/profile/venue-add-special/[id].tsx` | Add special |
| `/profile/venue-staff/[id]` | `app/profile/venue-staff/[id].tsx` | Venue staff |
| `/profile/venue-invite-staff/[id]` | `app/profile/venue-invite-staff/[id].tsx` | Invite staff |
| `/couple/index` | `app/couple/index.tsx` | Couple management |
| `/verify/index` | `app/verify/index.tsx` | Verification submission |
| `/subscription/index` | `app/subscription/index.tsx` | Subscription / Stripe (Linking.openURL for checkout, refetch on focus) |
| `/whispers/index` | `app/whispers/index.tsx` | Whisper inbox/sent |

### 6.2 Hooks

| Hook | File | What it does |
|------|------|-------------|
| `useSocket` | `src/hooks/useSocket.ts` | Socket.io connection with JWT auth. Provides `joinConversation`, `leaveConversation`, `sendTyping`, `stopTyping`, `onNewMessage`, `onTyping`, `onAlbumShared` |
| `useLocation` | `src/hooks/useLocation.ts` | Expo location permissions, GPS tracking, sends location to API. Defaults to NYC (40.7128, -74.006) on web. |
| `usePhotoUpload` | `src/hooks/usePhotoUpload.ts` | Image picker + multipart upload to `/v1/media/upload`. Supports camera and library. Self-destruct option. |
| `useDistressGesture` | `src/hooks/useDistressGesture.ts` | Accelerometer-based shake detection (5 shakes in 3s). Triggers panic API call with location. Vibration feedback. 30s cooldown. |
| `useScreenshotDetection` | `src/hooks/useScreenshotDetection.ts` | Expo screen capture listener. Reports to `/v1/safety/screenshot`. Alerts user that other person was notified. |
| `usePushNotifications` | `src/hooks/usePushNotifications.ts` | Requests notification permissions, registers Expo push token via `/v1/auth/push-token`. |

### 6.3 State Management (Zustand)

Single store: `useAuthStore` in `src/stores/auth.ts`.

**State shape:**

```typescript
interface AuthState {
  userId: string | null;
  token: string | null;
  refreshToken: string | null;
  profile: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
```

**Actions:**
- `sendOTP(phone)` — calls `/v1/auth/phone/send-code`, returns `{devCode?}` in dev mode
- `verifyAndLogin(phone, code)` — verify OTP then login, navigate to tabs
- `verifyAndRegister(phone, code, displayName)` — verify OTP then register, navigate to onboarding
- `login(phone)` — direct login (dev fallback, bypasses OTP)
- `register(phone, displayName)` — direct register (dev fallback)
- `logout()` — revoke tokens, clear state, navigate to auth
- `loadProfile()` — fetches `/v1/users/me`
- `setTokens(token, refreshToken, userId)` — stores tokens, sets `isAuthenticated`

Token persistence: `window.localStorage` on web (key: `shhh_token`).

### 6.4 API Client Architecture

`src/api/client.ts` exports a generic `api<T>()` function and domain-specific API objects:

```typescript
api<T>(path, options)        // Generic fetch wrapper with auth header injection
authApi.{register, login, refresh, logout}
usersApi.{getMe, updateMe, like, pass, block, report}
discoverApi.{nearby, updateLocation}
messagingApi.{getConversations, createConversation, getMessages, sendMessage}
eventsApi.{nearby, create, get, rsvp}
safetyApi.{getContacts, addContact, checkIn, panic}
albumsApi.{getMyAlbums, getShared, getAlbum, create, share, revokeShare}
```

**API base URL:** Hardcoded in `src/api/client.ts` (and in usePhotoUpload, useSocket, ProfilePhoto):
- Web: `http://localhost:3000`
- Native: `http://10.0.2.2:3000` (Android emulator); iOS simulator typically `localhost:3000`
- For production web/native, introduce `EXPO_PUBLIC_API_URL` and use it when set; document in SOFT_LAUNCH_WEB_PLAN.

**Auth guard:** Root `app/_layout.tsx` wraps the app in `AuthGuard` (`src/components/AuthGuard.tsx`): unauthenticated users are redirected to `/(auth)`; 401 responses trigger `onUnauthorized` (clear session, redirect to login).

### 6.5 Web layout (soft launch)

When `Platform.OS === 'web'` and viewport width ≥ 1024px (`useBreakpoint().showSidebar`):

- **Sidebar:** `WebSidebar` (`src/components/WebSidebar.tsx`) shows Explore, Chat, Events, Me; drives navigation via `router.replace`; pathname drives active state. Trust line “Private · Verified · Safe” in footer.
- **Content:** Tabs render with tab bar hidden; content area wrapped in `maxWidth: theme.layout.contentMaxWidth` (1280px), centered.
- **Entry:** Unauthenticated web users see `WebEntryShell` first from `(auth)/index` (hero line, “Enter”, “Learn how it works” modal); “Enter” reveals login form. See **docs/SOFT_LAUNCH_WEB_PLAN.md**.
- **Breakpoints:** `src/constants/breakpoints.ts`; `useBreakpoint()` for isDesktop, isWeb, contentMaxWidth. Discover 5 cols, Events 2 cols, Albums 4 cols on desktop.
- **Signature interaction:** Discover cards use `useHover()` for glow + scale on hover. Sidebar items have focus ring for keyboard nav.

### 6.5 Theme System

`src/constants/theme.ts` exports design tokens:

**Colors** — dark purple palette:
- Primary: `#9333EA` (purple)
- Background: `#050508` (near-black)
- Surface: `#0E0B16` (dark purple tint)
- Text: `#F4F0FA` (light lavender)
- Accent: `#C084FC` (light purple)
- Heart: `#EC4899` (pink)

**Spacing scale:** `xxs(2)`, `xs(4)`, `sm(8)`, `md(16)`, `lg(24)`, `xl(32)`, `xxl(48)`

**Font sizes:** `xxs(10)`, `xs(11)`, `sm(13)`, `md(15)`, `lg(17)`, `xl(22)`, `xxl(28)`, `hero(36)`

**Border radii:** `xs(4)`, `sm(8)`, `md(12)`, `lg(16)`, `xl(24)`, `xxl(32)`, `full(9999)`

**Shadows:**
- `glow`: Purple glow effect (`shadowColor: #9333EA`, `shadowOpacity: 0.4`, `shadowRadius: 12`)
- `card`: Standard card shadow

### 6.6 Photo Rendering

Photos are rendered using standard React Native `<Image>` components. Key details:
- Profile photos are stored as JSONB in `photos_json` — an array of URL strings
- Photos served from `/uploads` path on the backend via `express.static`
- CORS is configured to `origin: '*'` for cross-origin image loading
- Blur effect is applied client-side when `blur_photos` is true and no reveal exists
- Thumbnails are generated server-side via Sharp

---

## 7. Real-Time System

### 7.1 WebSocket Setup

The WebSocket server is built on **Socket.io** and initialized in `backend/src/websocket/index.ts`. It shares the HTTP server with Express.

**Configuration:**
```typescript
const io = new SocketServer(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
});
```

### 7.2 Authentication

WebSocket connections authenticate via JWT in the handshake:

```typescript
// Client
const socket = io(WS_URL, {
  auth: { token: accessToken },
  transports: ['websocket'],
});

// Server middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  const payload = jwt.verify(token, config.jwt.secret);
  socket.data.user = payload;
  next();
});
```

### 7.3 Room Management

| Room pattern | When joined | Purpose |
|-------------|-------------|---------|
| `user:{userId}` | On connection | Personal notifications, whisper events, album sharing |
| `conversation:{conversationId}` | On `join_conversation` event | Chat messages, typing indicators, read receipts |

### 7.4 Events — Client → Server (Emitted by client)

| Event | Payload | Description |
|-------|---------|-------------|
| `join_conversation` | `conversationId: string` | Join a conversation room |
| `leave_conversation` | `conversationId: string` | Leave a conversation room |
| `typing` | `{ conversationId: string }` | Start typing indicator |
| `stop_typing` | `{ conversationId: string }` | Stop typing indicator |
| `message_read` | `{ conversationId, messageId }` | Mark message as read |

### 7.5 Events — Server → Client (Listened by client)

| Event | Payload | Sent to | Source |
|-------|---------|---------|--------|
| `new_message` | Full message object | `conversation:{id}` room | Messaging service |
| `user_typing` | `{ userId, conversationId }` | `conversation:{id}` room | Typing event |
| `user_stop_typing` | `{ userId, conversationId }` | `conversation:{id}` room | Stop typing event |
| `message_read` | `{ userId, conversationId, messageId }` | `conversation:{id}` room | Read receipt |
| `media_self_destructed` | `{ mediaId }` | `conversation:{id}` room | Media TTL expiry |
| `whisper_received` | `{ whisperId, message, distance, expiresAt }` | `user:{id}` room | Whisper service |
| `whisper_response` | `{ whisperId, response }` | `user:{id}` room | Whisper respond |
| `whisper_revealed` | `{ whisperId, response, revealedName, revealedUserId }` | `user:{id}` room | Whisper reveal |
| `album_shared` | Album data object | `user:{id}` room | Album share |
| `album_revoked` | `{ albumId }` | `user:{id}` room | Album revoke |
| `conversation_wiped` | `{ conversationId }` | `user:{id}` room | Panic wipe |
| `presence_expired` | `{ message }` | `user:{id}` room | Presence decay worker |

### 7.6 Helper Functions

The websocket module exports helper functions used by services:

```typescript
emitNewMessage(conversationId, message)       // New chat message
emitToUser(userId, event, data)               // Any event to a specific user
emitMediaSelfDestructed(conversationId, id)   // Media TTL expired
emitAlbumShared(userId, albumData)            // Album shared notification
emitAlbumRevoked(userId, albumId)             // Album access revoked
```

---

## 8. Background Workers

All background jobs run via **BullMQ** with a single `cleanup` queue connected to Redis. Workers are started in `backend/src/workers/index.ts` after the server boots (non-fatal if they fail to start).

### 8.1 Job Schedule

| Job Name | Schedule | What it does |
|----------|----------|-------------|
| `decay-presence` | Every **60 seconds** | Deletes expired presence rows, emits `presence_expired` to affected users |
| `clean-intents` | Every **5 minutes** | Deletes intent flags where `expires_at <= NOW()` |
| `expire-sessions` | Every **5 minutes** | Finds session conversations past their TTL, deletes their MongoDB messages, marks as wiped |
| `cleanup-media` | Every **10 minutes** | Finds media with `expires_at < NOW()`, deletes files from disk, soft-deletes records |
| `clean-whispers` | Every **5 minutes** | Updates expired whispers to status `expired` |
| `event-lifecycle` | Every **60 seconds** | Transitions events through phases (discovery→upcoming→live→winding_down→post→archived), sends push notifications |
| `process-deletions` | Every **5 minutes** | Processes pending `data_deletion_requests`: anonymizes user + profile, marks request completed |
| `archive-conversations` | Every **1 minute** | Sets `is_archived = true` on conversations where `archive_at <= NOW()` (read-only thereafter) |

### 8.2 Worker Configuration

```typescript
const worker = new Worker('cleanup', handler, {
  connection: new IORedis(config.redis.url, { maxRetriesPerRequest: null }),
  concurrency: 2,
});
```

- **Concurrency:** 2 (jobs run in parallel)
- **Scheduler:** Uses `upsertJobScheduler` for idempotent schedule creation
- **Error handling:** Failed jobs are logged but do not crash the server

### 8.3 How to Monitor

- BullMQ stores job state in Redis. Use `redis-cli` to inspect:
  ```bash
  redis-cli KEYS "bull:cleanup:*"
  ```
- Worker logs are emitted via Pino structured logging
- Failed jobs fire the `worker.on('failed')` handler and are logged with job name and error

---

## 9. Ad System

### 9.1 Overview

The ad system serves **venue-created advertisements** to mobile users across 4 surfaces. It is designed with strict privacy guardrails — no tracking pixels, no third-party SDKs, no data sharing. Revenue comes from CPM (cost per 1000 impressions).

### 9.2 Four Surfaces

| Surface | Route | Max per 24h | Min gap | Skip during |
|---------|-------|-------------|---------|-------------|
| `discover_feed` | `GET /v1/ads/feed` | 2 | 30 min | First open of day |
| `chat_list` | `GET /v1/ads/chat` | 1 | 24h (1440 min) | `open_to_chat` intent |
| `post_event` | `GET /v1/ads/post-event` | 1 | 0 min | — |
| `venue_page` | (embedded in venue detail) | 3 | 10 min | — |

### 9.3 Hardcoded Guardrails (Non-Configurable)

These are in code, not in the database. They cannot be changed by admin UI:

```typescript
const HARDCODED_GUARDRAILS = {
  discover_feed: { maxPer24h: 2 },
  chat_list:     { maxPer24h: 1 },
  post_event:    { maxPer24h: 1 },
  venue_page:    { maxPer24h: 3 },
};
```

The database `ad_cadence_rules` table can have lower limits than these, but never higher. The code takes `min(db_limit, hardcoded_limit)`.

### 9.4 Ad Eligibility Algorithm

When a client requests an ad, the service checks in order:

1. **Premium check** — if user has any active paid subscription, return `null` (no ads ever)
2. **Global kill switch** — `ad_controls` table, key `global`, check `value.enabled`
3. **Surface enabled** — `ad_cadence_rules.is_enabled` for this surface
4. **User cooldown** — Redis key `ad_cooldown:{userId}:{surface}` (set after each impression)
5. **24h impression cap** — count recent impressions for this user/surface
6. **Dismissed placements** — exclude placements dismissed in last 7 days
7. **Intent filter** — if surface is `chat_list` and user has `open_to_chat` presence, skip
8. **Geo filter** — if lat/lng provided, filter by `ST_DWithin` against venue location
9. **Select** — order by `cpm_cents DESC, random()`, take first

### 9.5 Revenue Model & CPM

- Default CPM: **$15.00** (1500 cents per 1000 impressions)
- Venues set their own CPM when creating placements
- `spent_cents` is incremented by `cpm_cents / 1000` per impression
- Budget cap: placement deactivates when `spent_cents >= budget_cents`
- Impression cap: placement deactivates when `impression_count >= max_impressions`

### 9.6 Targeting

Ads are targeted by:
- **Location**: `ST_DWithin` from venue to user's current position, within `target_radius_km`
- **Intent flags**: `target_intents` array matches user's active intents
- **Gender**: `target_genders` array (optional filter)

### 9.7 Admin Controls

- **Global kill switch**: `ad_controls` table, key `global`, value `{"enabled": true, "density_multiplier": 1.0}`
- **City overrides**: `ad_controls` table, key `city_overrides`
- Cadence rules are configurable per surface via `ad_cadence_rules` table

### 9.8 Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/ads/feed` | Yes | Get discover feed ad |
| GET | `/v1/ads/chat` | Yes | Get chat list ad |
| GET | `/v1/ads/post-event` | Yes | Get post-event ad |
| POST | `/v1/ads/:id/impression` | Yes | Record impression |
| POST | `/v1/ads/:id/tap` | Yes | Record tap |
| POST | `/v1/ads/:id/dismiss` | Yes | Dismiss ad (7-day cooldown) |
| POST | `/v1/ads/placements` | Yes | Create placement (venue) |
| GET | `/v1/ads/placements/:id/stats` | Yes | Placement analytics |

---

## 10. Venue System

### 10.1 Venue Account Lifecycle

1. **Creation**: A tier 2+ user creates a venue with name, location, type
2. **Claiming**: A user claims the venue via `POST /v1/venues/:id/claim` with email, contact name, phone (all hashed)
3. **Staff management**: Owner invites staff with roles: `owner`, `manager`, `staff`, `security`, `dj`
4. **Subscription tiers**: Venue accounts have their own tiers: `free`, `basic`, `premium`, `enterprise` (stored in `venue_accounts.subscription_tier`)

### 10.2 Dashboard Features

The venue dashboard (`GET /v1/venues/:id/dashboard`) returns a combined view:

```json
{
  "realtime": { "currentlyCheckedIn": 45, "activeChatRooms": 3, "nearbyOnline": 12 },
  "today": { "checkins": 120, "unique_visitors": 85, "profile_views": 340, "ad_impressions": 50, "ad_taps": 3, "ad_revenue_cents": 750 },
  "upcomingEvents": [...],
  "activeAds": [...],
  "recentReviews": [...],
  "specials": [...]
}
```

Additional analytics endpoints:
- `GET /v1/venues/:id/analytics?days=30` — Daily aggregates
- `GET /v1/venues/:id/trends` — Weekly averages from 90 days grouped by day of week

### 10.3 Reviews

- Users must have at least one check-in at the venue to leave a review
- Reviews are anonymous by default
- Include 1–5 rating and freeform `vibe_tags` array
- One review per user per venue (upsert on conflict)
- Review summary includes average rating and most common vibe tag

### 10.4 Specials

Recurring or one-time promotions. Each special has:
- Title, description
- `day_of_week` (0=Sunday through 6=Saturday)
- `start_time`, `end_time` (TIME type)
- `is_recurring` flag

### 10.5 Chat Room Lifecycle

1. Venue owner creates a room: `POST /v1/venues/:id/chat-rooms` with name and optional `autoCloseHours`
2. Room is listed for users who check in: `GET /v1/venues/:id/chat-rooms`
3. Room auto-closes when `auto_close_at` passes (the listing query filters these out)
4. Owner can bind a room to an event via `eventId`

### 10.6 Announcements

Venue owners can broadcast announcements to nearby users:
- Geofiltered with `ST_DWithin` (default 50 km radius)
- Types: `announcement`, `promotion`, `event_promo`, `special`
- Time-limited with `expires_at`
- View and tap counts are tracked for analytics

---

## 11. Safety & Trust

### 11.1 4-Tier Verification System

| Tier | Requirements | What it unlocks |
|------|-------------|-----------------|
| **0 — Phone** | Register with phone number | Browse, view profiles, basic features |
| **1 — Photo** | Submit selfie with random pose challenge + admin approval | Like users, create conversations |
| **2 — ID** | Submit government ID (hash stored) + admin approval | Create events/venues, write references, admin access |
| **3 — Vouched** | 3+ references from tier 2+ users | Full trust badge, weighted references |

Verification flow:
1. User submits photo/ID via `POST /v1/verification/photo` or `/id`
2. Submission is added to `moderation_queue` (priority based on type)
3. Admin reviews via `GET /v1/admin/moderation`
4. Admin approves (`POST /v1/verification/:id/approve`) → user's `verification_tier` is upgraded
5. Tier 3 promotion is automatic when reference threshold is met

### 11.2 Trust Score Algorithm

```
Score = tier_points + reference_points + age_points - report_penalty

tier_points      = verification_tier × 25           (max 75)
reference_points = min(weighted_ref_sum × 2, 30)    (max 30)
age_points       = min(account_days / 30 × 5, 20)   (max 20)
report_penalty   = actionable_reports × 10

Total: 0–100
```

**Weighted reference sum:** References from tier 2+ users have a 1.5× multiplier on their rating.

**Badges:**

| Range | Badge |
|-------|-------|
| 75–100 | `trusted` |
| 50–74 | `established` |
| 25–49 | `verified` |
| 0–24 | `new` |

**Caching:** Trust scores are cached in the `trust_scores` table and only recalculated if `calculated_at` is older than 1 hour.

### 11.3 Panic Wipe Mechanics

The panic wipe (`POST /v1/conversations/panic-wipe`) is a nuclear option:

1. Finds ALL conversations the user is part of
2. Deletes ALL MongoDB messages for each conversation
3. Sets `panic_wiped_at` on each conversation (prevents re-sending)
4. Emits `conversation_wiped` WebSocket event to all other participants
5. Logs to `audit_logs` with `gdpr_category: 'safety'`

The panic endpoint (`POST /v1/safety/panic`) is separate — it creates a `panic` type safety check-in and logs contacts for notification.

### 11.4 Covert Distress Gesture (Shake Detection)

The mobile hook `useDistressGesture` detects a distress pattern:

```
Configuration:
  SHAKE_THRESHOLD = 800      (acceleration delta / time)
  REQUIRED_SHAKES = 5        (shakes needed)
  WINDOW_MS = 3000           (3-second window)
```

When triggered:
1. Device vibrates with pattern `[0, 100, 50, 100, 50, 100]` (haptic confirmation)
2. Gets current GPS coordinates (high accuracy)
3. Calls `POST /v1/safety/panic` with lat/lng
4. 30-second cooldown before re-triggering

This runs silently in the background on all screens via the accelerometer sensor.

### 11.5 Screenshot Detection

The `useScreenshotDetection` hook:
1. Listens for `expo-screen-capture` screenshot events
2. Reports to `POST /v1/safety/screenshot` with optional `conversationId`
3. Alerts the user: "The other person has been notified that a screenshot was taken."
4. Records in `screenshot_events` table

### 11.6 Emergency Contacts

- Users add contacts with name, phone (hashed), and relationship
- Contacts are listed via `GET /v1/safety/contacts`
- When a panic event occurs, the system records which contacts should be notified
- **Future:** SMS/push notifications to emergency contacts (Twilio integration pending)

### 11.7 Check-In System

Safety check-ins (`POST /v1/safety/checkin`) record:
- Type: `arrived`, `periodic`, `departed`, `panic`
- GPS coordinates (stored as PostGIS Point)
- `expected_next_at`: when the user is expected to check in again
- `alert_sent`: whether a missed-checkin alert was triggered

**Missed check-in flow (planned):**
- If `expected_next_at` passes without a new check-in, the system should alert emergency contacts
- Currently the `responded_at` and `alert_sent` columns exist but the alert worker is not yet built

---

## 12. Presence & Persona System

### 12.1 Eight Presence States

| State | Default decay (min) | Description |
|-------|-------------------|-------------|
| `invisible` | 0 (permanent) | User is not visible to anyone |
| `nearby` | 30 | Passively nearby; shown in discovery |
| `browsing` | 15 | Actively looking at profiles |
| `at_venue` | 120 (2h) | Checked into a specific venue |
| `at_event` | 240 (4h) | Attending an event |
| `open_to_chat` | 60 (1h) | Actively wants to receive messages |
| `paused` | 30 | Temporarily paused (e.g., busy) |
| `cooldown` | 15 | Post-interaction cooldown |

### 12.2 Decay Mechanics

- Each state has a default decay timer. Users can override up to 480 minutes.
- Presence is stored in both **PostgreSQL** (durable) and **Redis** (cache, TTL matches decay)
- The `decay-presence` worker runs every 60 seconds to delete expired rows
- When presence expires, the user receives a `presence_expired` WebSocket event prompting re-affirmation
- Users can re-affirm presence (`POST /v1/presence/reaffirm`) to extend the timer without changing state

### 12.3 Persona Switching and Isolation

- Users switch personas via `POST /v1/personas/:id/activate`
- This deactivates all other personas (`UPDATE personas SET is_active = false WHERE user_id = $1`)
- Then activates the selected one
- Active persona name appears in venue check-ins and presence listings
- Each persona has isolated `photos_json`, `preferences_json`, `bio`, `kinks`
- Intent flags can be scoped to a persona via `persona_id`

### 12.4 Intent Flags

10 available flags, each with a configurable TTL (default 8h, max 48h):

| Flag | Meaning |
|------|---------|
| `open_tonight` | Available this evening |
| `traveling` | Visiting from out of town |
| `hosting` | Hosting at home/venue |
| `at_event` | Currently at an event |
| `looking_for_friends` | Social / platonic interest |
| `looking_for_more` | Romantic / physical interest |
| `just_browsing` | No commitment, exploring |
| `new_in_town` | Recently moved / visiting |
| `couples_only` | Only interested in couples |
| `single_friendly` | Open to singles |

### 12.5 How Presence Affects Discovery and Ads

- Discovery results include presence state of each user (if not invisible)
- `invisible` users are excluded from discovery and venue attendee lists
- Ads on the `chat_list` surface are suppressed when user has `open_to_chat` presence (don't interrupt active social engagement)
- Intent flags can be used for ad targeting (`target_intents` on placements)
- Venue-scoped presence: `GET /v1/presence/venue/:venueId` shows users currently present at a venue

---

## 13. Whisper System

### 13.1 How Anonymous Proximity Signaling Works

Whispers are short (max 100 chars) anonymous messages sent from one user to another who is nearby. The sender's identity is hidden until they choose to reveal.

**Flow:**
1. User A sees User B in discovery results
2. User A sends a whisper: `POST /v1/whispers` with `toUserId` and `message`
3. User B receives a WebSocket event `whisper_received` with the message and approximate distance (e.g., "245m away")
4. User B can:
   - **See** it (`POST /v1/whispers/:id/seen`)
   - **Respond** with a short reply (`POST /v1/whispers/:id/respond`)
   - **Ignore** it (`POST /v1/whispers/:id/ignore`)
5. If User B responds with `reveal: true`, both parties learn each other's identity

### 13.2 Reveal Mechanics

When responding, the recipient can set `reveal: true`:
- The system fetches the recipient's `display_name`
- Emits `whisper_revealed` to the sender with `revealedName` and `revealedUserId`
- Sets `whisper.revealed = true` in the database
- After reveal, the sender's identity is also shown in the recipient's inbox (via JOIN on `user_profiles`)

### 13.3 Cadence Limits and TTL

| Limit | Value | Purpose |
|-------|-------|---------|
| Whisper TTL | 4 hours | Whispers auto-expire (status → `expired` via worker) |
| Max pending whispers | 3 | A user can have at most 3 unresolved whispers at a time |
| Duplicate guard | 1 per target | Cannot whisper the same person twice while a pending whisper exists |
| Block check | Bidirectional | Cannot whisper someone who blocked you (or whom you blocked) |

### 13.4 Distance Calculation

The whisper service calculates the actual distance between sender and receiver using PostGIS:
```sql
SELECT ST_Distance(l1.geom_point::geography, l2.geom_point::geography)
FROM locations l1, locations l2
WHERE l1.user_id = $sender AND l2.user_id = $receiver
```
This distance is rounded to the nearest meter and sent as "245m away" or "nearby" if unavailable.

---

## 14. Billing & Premium

### 14.1 Four Subscription Tiers

| Tier | Price/mo | Persona Slots | Key Features |
|------|----------|---------------|-------------|
| **Free** | $0 | 1 | Basic features, ads shown |
| **Discreet** | $9.99 | 2 | Anonymous browsing, no ads |
| **Phantom** | $19.99 | 3 | + Expanded discovery radius, visibility schedule |
| **Elite** | $39.99 | 5 | + Priority safety, unlimited albums |

### 14.2 Feature Matrix

| Feature | Free | Discreet | Phantom | Elite |
|---------|------|----------|---------|-------|
| Anonymous browsing | ❌ | ✅ | ✅ | ✅ |
| Expanded radius | ❌ | ❌ | ✅ | ✅ |
| Visibility schedule | ❌ | ❌ | ✅ | ✅ |
| Priority safety | ❌ | ❌ | ❌ | ✅ |
| Unlimited albums | ❌ | ❌ | ❌ | ✅ |
| Ad-free | ❌ | ✅ | ✅ | ✅ |
| Persona slots | 1 | 2 | 3 | 5 |

### 14.3 Feature Gating (API)

Use **`requireFeature(feature)`** from `middleware/auth.ts` to protect routes by subscription feature. Features are stored in `subscriptions.features_json` (e.g. `expandedRadius`, `anonymousBrowsing`, `vault`). `SubscriptionService.hasFeature(userId, feature)` returns true if the user has an active subscription that includes the feature. Apply on relevant endpoints so UI and API stay in sync.

### 14.4 Stripe Integration Points

**Stripe SDK:** `stripe` npm package (v20.x)

**Endpoints:**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/v1/billing/tiers` | No | List all tiers with pricing |
| GET | `/v1/billing/subscription` | Yes | Get user's current subscription |
| POST | `/v1/billing/checkout` | Yes | Create Stripe Checkout Session |
| POST | `/v1/billing/webhook` | No | Stripe webhook handler |

**Checkout flow:**
1. Client calls `POST /v1/billing/checkout` with `{tier: 'phantom'}`
2. Service creates or retrieves Stripe customer
3. Creates a Checkout Session with subscription mode
4. Returns `{checkoutUrl, sessionId}` to client
5. Client opens `checkoutUrl` in browser/webview
6. On success, Stripe sends webhook to `POST /v1/billing/webhook`

### 14.5 Webhook Handling

The webhook handler processes two event types:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate subscription: cancel existing, create new with tier features |
| `customer.subscription.deleted` | Set subscription status to `cancelled` |

**Signature verification:** The webhook uses `stripe.webhooks.constructEvent(rawBody, sigHeader, webhookSecret)` with the `STRIPE_WEBHOOK_SECRET` env var. Forged webhooks return 400. The webhook route uses `express.raw({ type: 'application/json' })` for raw body parsing (required for signature verification).

---

## 15. Security Posture

### 15.1 JWT Rotation Strategy

```
Access Token:
  Algorithm: HS256 (jsonwebtoken)
  Secret: JWT_SECRET env var
  Expiry: 2h (dev) / 15m (prod)
  Payload: { userId, tier }

Refresh Token:
  Format: UUID v4
  Storage: SHA-256 hash in refresh_tokens table
  Expiry: 7 days
  Rotation: Old token revoked on each refresh
  Revocation: All tokens revoked on logout
```

### 15.2 Argon2id Configuration

```typescript
argon2.hash(password, {
  type: argon2.argon2id,
  memoryCost: 65536,    // 64 MB
  timeCost: 3,          // 3 iterations
  parallelism: 4,       // 4 threads
});
```

### 15.3 Rate Limiting

| Scope | Window | Max Requests |
|-------|--------|-------------|
| Global (all endpoints) | 15 minutes | 100 (configurable via env) |
| Auth endpoints | 15 minutes | 5 (prod) / 50 (dev) |
| OTP requests | 15 minutes | 5 per phone number |

Rate limiting uses `express-rate-limit` with standard headers and no legacy headers.

### 15.4 Helmet Configuration

```typescript
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
```

Helmet applies these headers by default:
- `Content-Security-Policy`
- `Cross-Origin-Opener-Policy`
- `Cross-Origin-Resource-Policy: cross-origin` (custom — needed for photo serving)
- `X-DNS-Prefetch-Control`
- `X-Frame-Options: SAMEORIGIN`
- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options: nosniff`
- `X-Permitted-Cross-Domain-Policies`
- `Referrer-Policy`
- `X-XSS-Protection: 0` (deprecated, disabled)

### 15.5 PII Hashing

Phone and email use HMAC-SHA256 with a server-side pepper (not plain SHA-256). Utility functions in `/backend/src/utils/hash.ts`:
- `hashPhone(phone)` — `crypto.createHmac('sha256', PEPPER).update(phone).digest('hex')`
- `hashEmail(email)` — Same, with `email.toLowerCase()` before hashing

The `PHONE_HASH_PEPPER` env var is required; generate with `openssl rand -hex 32`.

**Threat model:** Plain SHA-256 of phone numbers is trivially reversible (10B possible numbers, rainbow tables). HMAC with server-side pepper requires compromising the pepper to attack; the pepper is never stored with the data.

| Field | Hashed as | Stored in |
|-------|----------|-----------|
| Phone number | `hashPhone()` (HMAC-SHA256 + pepper) | `users.phone_hash` |
| Email | `hashEmail()` (HMAC-SHA256 + pepper) | `users.email_hash`, `venue_accounts.email_hash` |
| ID document | `hashGeneric()` (SHA-256) | `verifications.id_document_hash` |
| Emergency contact phone | `hashPhone()` | `emergency_contacts.phone_hash` |
| Venue contact phone | `hashPhone()` | `venue_accounts.contact_phone_hash` |
| IP address | `hashGeneric()` | `audit_logs.ip_hash` |
| User agent | `hashGeneric()` | `audit_logs.user_agent_hash` |
| Venue address | `hashGeneric()` | `venues.address_hash` |

### 15.6 Audit Logging Scope

Audit logs (`audit_logs` table) record:

| Action | GDPR Category | When |
|--------|---------------|------|
| `user.registered` | `account` | Registration |
| `user.login` | `account` | Login |
| `user.logout` | `account` | Logout |
| `safety.panic_wipe` | `safety` | Panic wipe triggered |
| Various admin actions | `moderation` | Ban, resolve report, etc. |
| Data export | `compliance` | GDPR data export |
| Account deletion | `compliance` | Deletion request |

---

## 16. Infrastructure

### 16.1 Docker Compose (Local Dev)

`docker-compose.yml` runs three services:

| Service | Image | Port | Config |
|---------|-------|------|--------|
| PostgreSQL + PostGIS | `postgis/postgis:16-3.4` | 5432 | User: `shhh_dev`, Pass: `shhh_dev_password`, DB: `shhh` |
| Redis | `redis:7-alpine` | 6379 | 256MB max memory, LRU eviction |
| MongoDB | `mongo:7` | 27017 | Root user: `shhh_dev`, Pass: `shhh_dev_password`, DB: `shhh_messages` |

All services have health checks with 5s interval and 5 retries. Persistent volumes: `pgdata`, `mongodata`.

### 16.2 Terraform (AWS Production)

Located in `terraform/`. Provisions:

| Resource | Service | Details |
|----------|---------|---------|
| VPC | Networking | Multi-AZ, public + private subnets |
| Aurora PostgreSQL Serverless v2 | Database | 0.5–16 ACU, encrypted, 30-day backup |
| ElastiCache Redis | Cache | 2 nodes, 7.0 engine, TLS, auto-failover |
| ECS Fargate | Compute | 1024 CPU / 2048 MB, 2–20 task scaling |
| ALB | Load balancer | HTTPS termination |
| ECR | Container registry | Immutable tags, scan on push |
| Secrets Manager | Secrets | DB URL, Redis URL, JWT secret |
| CloudWatch | Logging | 90-day retention |

**Terraform variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `environment` | `production` | Deployment environment |
| `aws_region` | `us-east-1` | Primary region |
| `aws_secondary_region` | `us-west-2` | Secondary region |
| `domain_name` | `shhh.app` | Application domain |
| `db_instance_class` | `db.r6g.large` | RDS instance class |
| `redis_node_type` | `cache.r6g.large` | ElastiCache node type |
| `ecs_cpu` | `1024` | ECS task CPU units |
| `ecs_memory` | `2048` | ECS task memory (MB) |
| `min_capacity` | `2` | Minimum ECS tasks |
| `max_capacity` | `20` | Maximum ECS tasks |

**Auto-scaling policy:** Target tracking at 70% CPU utilization, 60s scale-out cooldown, 300s scale-in cooldown.

### 16.3 CI/CD Pipeline (GitHub Actions)

`.github/workflows/ci.yml` defines 4 jobs:

| Job | Depends on | Steps |
|-----|-----------|-------|
| `backend-lint-typecheck` | — | `npm ci` → `tsc --noEmit` → `eslint` |
| `backend-test` | lint-typecheck | Start PG/Redis/Mongo services → `npm ci` → `npm run migrate` → `npm test` |
| `backend-build` | lint-typecheck | `npm ci` → `tsc` |
| `admin-dashboard` | — | `npm ci` → `tsc --noEmit` → `vite build` |

Triggered on push/PR to `main`. Uses Node 22.

### 16.4 EAS Build Configuration (iOS/Android)

The mobile app uses Expo 55 with expo-router. Build commands:

```bash
npx expo start                    # Local dev server
npx expo start --android          # Android emulator
npx expo start --ios              # iOS simulator
npx expo start --web              # Web browser
```

For production builds, use EAS Build (Expo Application Services):

```bash
eas build --platform ios
eas build --platform android
```

### 16.5 Load Testing (k6)

No k6 scripts exist yet. The performance targets (100k concurrent, <200ms p95) imply they will be needed. Key scenarios to test:
- Discovery query under load (PostGIS)
- WebSocket connection scaling
- Auth endpoint rate limiting
- Message throughput

---

## 17. Known Limitations & Technical Debt

### 17.1 Phone-Based Identity

**Current:** Users are identified by SHA-256 hashed phone numbers. This has privacy limitations (rainbow table attacks on phone number space).

**Plan:** Upgrade to cryptographic keypair identity where the user's device generates a key pair and registers the public key. Phone becomes a secondary recovery mechanism. The E2EE key infrastructure (`user_keys` table) is the foundation for this.

### 17.2 Admin Power Constraints

**Current:** RBAC is implemented: `role` column (`user` | `moderator` | `admin` | `superadmin`), `requireRole('moderator')` for admin routes, `requireRole('admin')` for destructive actions (banning). `admin_actions` table logs every admin action with justification; `logAdminAction()` is called on report resolution and user bans.

**Needed:**
- Quorum for destructive admin actions (require 2+ admins to agree)
- Appeal flow for banned users

### 17.3 MongoDB Consolidation Decision

**Current:** MongoDB holds only the `messages` collection with TTL auto-deletion.

**Decision pending:** Once E2EE client-side encryption is wired, messages become opaque ciphertext blobs. At that point, MongoDB can be replaced with a PostgreSQL `messages` table with a worker-based cleanup job (replacing TTL index). This would:
- Eliminate one database dependency
- Simplify backups and migrations
- Reduce DevOps burden

### 17.4 E2EE: Infrastructure Only

**Current state:** The server-side E2EE infrastructure is complete:
- `user_keys` table for identity keys (x25519-xsalsa20-poly1305)
- `prekey_bundles` table for one-time prekeys
- `conversation_keys` table for per-conversation symmetric keys
- Full REST API for key management

**Not yet wired:** The mobile app does not perform client-side encryption/decryption. Messages are stored as plaintext in MongoDB. The `tweetnacl` and `tweetnacl-util` packages are in `backend/package.json` but the encryption logic is not integrated into the message send/receive flow.

### 17.5 Stock Photos

**Current:** Profile photos are stock/placeholder images stored as URLs in `photos_json` JSONB. Real photo uploads go to `backend/uploads/` via Multer + Sharp, but the profile photo flow in the mobile app may reference external URLs.

### 17.6 Web Preview Auth Issues

The mobile app's API client uses `window.localStorage` for token persistence on web. This has known issues:
- No `expo-secure-store` on web (falls back to localStorage)
- Cross-origin requests may fail if CORS is misconfigured
- The web preview (`expo start --web`) uses `http://localhost:3000` as API base, but the backend's `crossOriginResourcePolicy: 'cross-origin'` helmet setting may conflict with CSP headers

### 17.7 Missing Functionality

| Feature | Status | Notes |
|---------|--------|-------|
| SMS notifications to emergency contacts | Schema ready, integration pending | Twilio SDK imported but not called on panic |
| Missed check-in alerts | Schema ready, worker not built | `expected_next_at` and `alert_sent` columns exist |
| Push notification delivery | Infrastructure ready | Uses Expo push API; needs EAS project setup |
| Photo moderation | Schema ready, auto-approve | `moderation_status` defaults to `auto_approved`; no AI moderation |
| Content flagging automation | Schema ready, manual only | `content_flags` table exists but no automated detection |
| Travel mode | Column exists | `travel_mode_until` on profiles; not enforced anywhere |
| Venue subscription billing | Column exists | `venue_accounts.subscription_tier` set but no Stripe integration |

---

## 18. Environment Variables Reference

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `DATABASE_URL` | `postgresql://shhh_dev:shhh_dev_password@localhost:5432/shhh` | Yes | PostgreSQL + PostGIS connection string |
| `REDIS_URL` | `redis://localhost:6379` | Yes | Redis connection string |
| `MONGODB_URL` | `mongodb://shhh_dev:shhh_dev_password@localhost:27017/shhh_messages?authSource=admin` | Yes | MongoDB connection string. **Must include `?authSource=admin`** |
| `JWT_SECRET` | `dev-jwt-secret` | Yes (prod) | JWT signing secret. Change for production! |
| `JWT_REFRESH_SECRET` | `dev-refresh-secret` | Yes (prod) | Refresh token signing secret. Change for production! |
| `JWT_ACCESS_EXPIRY` | `2h` (dev) / `15m` (prod) | No | Access token lifetime |
| `JWT_REFRESH_EXPIRY` | `7d` | No | Refresh token lifetime |
| `PORT` | `3000` | No | API server port |
| `NODE_ENV` | `development` | No | Environment mode (`development`, `test`, `production`) |
| `LOG_LEVEL` | `debug` | No | Pino log level (`debug`, `info`, `warn`, `error`) |
| `RATE_LIMIT_WINDOW_MS` | `900000` (15 min) | No | Rate limit window in milliseconds |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | No | Max requests per window |
| `DEFAULT_LOCATION_FUZZ_METERS` | `300` | No | Location randomization radius in meters |
| `MAX_DISCOVERY_RADIUS_KM` | `100` | No | Maximum discovery search radius |
| `TWILIO_ACCOUNT_SID` | — | Prod only | Twilio account SID for SMS OTP |
| `TWILIO_AUTH_TOKEN` | — | Prod only | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | — | Prod only | Twilio sender phone number |
| `PHONE_HASH_PEPPER` | — | Yes | HMAC secret for phone/email hashing. Generate with `openssl rand -hex 32` |
| `STRIPE_SECRET_KEY` | — | Prod only | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | — | Prod only | Stripe webhook signing secret (from Stripe dashboard) |
| `APP_URL` | `shhh://` | No | App deep link scheme for Stripe redirect |

---

## 19. Deployment Checklist

### Pre-Production Deploy

- [ ] **Generate strong secrets:**
  - `JWT_SECRET` — at least 64 random bytes hex-encoded
  - `JWT_REFRESH_SECRET` — different from JWT_SECRET
  - Set `JWT_ACCESS_EXPIRY=15m` for production
- [ ] **Set up Twilio:**
  - Create Twilio account
  - Get Account SID, Auth Token, phone number
  - Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
  - Test OTP flow
- [ ] **Set up Stripe:**
  - Create Stripe account
  - Get secret key
  - Set `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
  - Configure webhook endpoint: `https://api.shhh.app/v1/billing/webhook`
  - Enable `checkout.session.completed` and `customer.subscription.deleted` events
- [ ] **Domain & SSL:**
  - Register `shhh.app` domain
  - Configure ACM certificate in AWS
  - Set up ALB HTTPS listener
  - Configure DNS A record to ALB
- [ ] **MongoDB Atlas:**
  - Create MongoDB Atlas cluster (or equivalent)
  - Update `MONGODB_URL` with production connection string
  - Ensure `authSource=admin` is in the connection string
  - Create TTL index on `messages.expiresAt`
- [ ] **Run Terraform:**
  ```bash
  cd terraform
  terraform init
  terraform plan
  terraform apply
  ```
- [ ] **Run migrations:**
  ```bash
  npm run migrate
  ```
- [ ] **Set `NODE_ENV=production`**
- [ ] **Set `LOG_LEVEL=info`** (not debug in prod)
- [ ] **Verify rate limits** are appropriate for production traffic
- [ ] **Test health check:** `curl https://api.shhh.app/health`

### App Store Submission

- [ ] EAS Build for iOS and Android
- [ ] App Store Connect: privacy labels, age rating (17+), content description
- [ ] Google Play: content rating questionnaire, data safety section
- [ ] Screenshots and app preview video
- [ ] Privacy policy URL
- [ ] Terms of service URL
- [ ] Support URL and contact email

---

## 20. Coding Conventions

### TypeScript Configuration

**Strict mode enabled.** Key `tsconfig.json` settings:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### ESLint Rules

The backend uses `@typescript-eslint/eslint-plugin` with `@typescript-eslint/parser`. Configuration is in `backend/.eslintrc.cjs`.

Key rules:
- No unused variables (`@typescript-eslint/no-unused-vars`)
- No explicit `any` (warning, not error — there are pragmatic uses)
- Consistent type imports

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| TypeScript files | `kebab-case` | `auth.service.ts`, `venue-dashboard.routes.ts` |
| React components | `PascalCase` | `Layout.tsx`, `Dashboard.tsx` |
| Directories | `kebab-case` | `modules/`, `venue-identity/` |
| SQL migrations | `NNN_description.sql` | `001_initial.sql`, `008_ads_venue_overhaul.sql` |

### Service / Controller / Routes Pattern

Every backend module follows this pattern:

```
modules/<name>/
  ├── <name>.service.ts     # Business logic, database queries
  ├── <name>.controller.ts  # HTTP request/response handling (optional)
  └── <name>.routes.ts      # Express Router with route definitions
```

**Service:** Pure business logic. Receives typed parameters, returns data or throws errors. No access to `req`/`res`. All database queries happen here.

**Controller (optional):** Extracts parameters from `req`, calls service methods, formats `res`. Many smaller modules skip this and handle directly in routes.

**Routes:** Creates an `express.Router()`, applies middleware (`authenticate`, `validate`, `requireTier`), and wires handlers.

### Error Handling

Errors are created using `http-errors` or by attaching `statusCode` to plain Error objects:

```typescript
// Using http-errors
import createError from 'http-errors';
throw createError(404, 'User not found');

// Using Object.assign (common pattern in this codebase)
throw Object.assign(new Error('Phone number already registered'), { statusCode: 409 });
```

The centralized `errorHandler` middleware:
- Extracts `statusCode` (defaults to 500)
- Returns 500 errors as generic "Internal server error" (hides implementation details)
- Includes stack trace in development mode only
- Logs 5xx errors at `error` level, 4xx at `warn` level

### Validation (Zod)

Every endpoint with a request body uses Zod schema validation via the `validate()` middleware:

```typescript
import { z } from 'zod';
import { validate } from '../../middleware/validation';

router.post('/', authenticate, validate(z.object({
  phone: z.string().min(10),
  displayName: z.string().min(2).max(50),
})), handler);
```

Validation errors return:
```json
{
  "error": {
    "message": "Validation error",
    "details": [
      { "field": "phone", "message": "String must contain at least 10 character(s)" }
    ]
  }
}
```

The `validate()` middleware supports `body`, `query`, or `params` as the source.

### Response Format

All API responses follow this envelope:

```json
// Success (single item)
{ "data": { ... } }

// Success (list)
{ "data": [...], "count": 42 }

// Error
{ "error": { "message": "Something went wrong", "details": [...] } }
```

### Logging

Pino structured logging with `pino-pretty` in development:

```typescript
import { logger } from '../../config/logger';

logger.info({ userId, tier }, 'Subscription activated');
logger.error({ err }, 'Failed to connect to PostgreSQL');
logger.warn({ statusCode, message }, 'Client error');
logger.debug({ userId, conversationId }, 'Joined conversation room');
```

Log level is controlled by `LOG_LEVEL` env var (default: `debug` in dev).

---

## Appendix: Route Mount Points

Quick reference for how routes are mounted in `app.ts`:

| Prefix | Router import | Source |
|--------|--------------|--------|
| `/v1/auth` | `authRoutes` | `modules/auth/auth.routes.ts` |
| `/v1/users` | `usersRoutes` | `modules/users/users.routes.ts` |
| `/v1/couples` | `couplesRoutes` | `modules/couples/couples.routes.ts` |
| `/v1/verification` | `verificationRoutes` | `modules/verification/verification.routes.ts` |
| `/v1/references` | `referencesRoutes` | `modules/references/references.routes.ts` |
| `/v1/discover` | `discoveryRoutes` | `modules/discovery/discovery.routes.ts` |
| `/v1/conversations` | `messagingRoutes` | `modules/messaging/messaging.routes.ts` |
| `/v1/events` | `eventsRoutes` | `modules/events/events.routes.ts` |
| `/v1/venues` | `venuesRoutes` | `modules/venues/venues.routes.ts` |
| `/v1/safety` | `safetyRoutes` | `modules/safety/safety.routes.ts` |
| `/v1/compliance` | `complianceRoutes` | `modules/compliance/compliance.routes.ts` |
| `/v1/media` | `mediaRoutes` | `modules/media/media.routes.ts` |
| `/uploads` | `express.static` | `backend/uploads/` |
| `/v1/presence` | `presenceRoutes` | `modules/discovery/presence.routes.ts` |
| `/v1/personas` | `personaRoutes` | `modules/users/persona.routes.ts` |
| `/v1/intents` | `intentRoutes` | `modules/users/intent.routes.ts` |
| `/v1/whispers` | `whisperRoutes` | `modules/discovery/whisper.routes.ts` |
| `/v1/ads` | `adRoutes` | `modules/ads/ad.routes.ts` |
| `/v1/venues` | `venueIdentityRoutes` | `modules/venues/venue-identity.routes.ts` |
| `/v1/venues` | `venueDashboardRoutes` | `modules/venues/venue-dashboard.routes.ts` |
| `/v1/conversations` | `sessionRoutes` | `modules/messaging/session.routes.ts` |
| `/v1/photos` | `blurRoutes` | `modules/users/blur.routes.ts` |
| `/v1/e2ee` | `e2eeRoutes` | `modules/messaging/e2ee.routes.ts` |
| `/v1/billing` | `billingRoutes` | `modules/billing/billing.routes.ts` |
| `/v1/admin` | `adminRoutes` | `modules/admin/admin.routes.ts` |
| `/docs` | Swagger UI | OpenAPI 3.0 spec |
| `/docs.json` | Raw spec | JSON format |
| `/health` | Inline handler | Returns `{status, timestamp, version, modules}` |

> **Note:** Some prefixes are shared (e.g., `/v1/venues` has 3 route groups, `/v1/conversations` has 2). Express merges them — order matters for parameter matching.

---

## 21. Troubleshooting

### Docker services healthy but API fails
1. Check PostgreSQL: `sudo docker compose exec postgres pg_isready -U shhh_dev -d shhh`
2. Check Redis: `sudo docker compose exec redis redis-cli ping`
3. Check MongoDB: `sudo docker compose exec mongodb mongosh --eval "db.adminCommand('ping')"`
4. Check PostGIS: `sudo docker compose exec postgres psql -U shhh_dev -d shhh -c "SELECT PostGIS_Version();"`
5. Check migrations: `cd backend && npm run migrate`
6. Check `.env` file exists at workspace root (not in `/backend`)

### Migration failures
- If `functions in index predicate must be marked IMMUTABLE`: You used `NOW()` in a partial index WHERE clause. Use a plain index without the predicate.
- If a migration partially applied: Delete the row from `schema_migrations` and drop any tables created by that migration, then re-run.
- PostGIS extension missing: `sudo docker compose exec postgres psql -U shhh_dev -d shhh -c "CREATE EXTENSION IF NOT EXISTS postgis;"`

### API returns 401 on all endpoints
- JWT may have expired (15min in production, 2h in dev)
- Token may have been generated with a different JWT_SECRET (after backend restart with changed env)
- Clear Redis: `sudo docker compose exec redis redis-cli FLUSHALL`

### Photos not loading in web preview
- CORS issue: Helmet must have `crossOriginResourcePolicy: { policy: 'cross-origin' }`
- Check the photo URL: `curl -I http://localhost:3000/uploads/photos/stock/person_1.jpg`
- Verify `Cross-Origin-Resource-Policy: cross-origin` header is present

### Rate limit hit during development
- Auth rate limit is 50/15min in dev, 5/15min in production
- Clear: `sudo docker compose exec redis redis-cli FLUSHALL`

### Web preview shows login screen despite having token
- Token in localStorage may be expired
- Clear: Open DevTools Console → `localStorage.clear()` → refresh → re-login

---

## 22. Runbook

### Rotate JWT secret
1. Set new `JWT_SECRET` in `.env`
2. Restart backend: `npm run dev`
3. All existing tokens are now invalid — users must re-login
4. To revoke all refresh tokens: `DELETE FROM refresh_tokens WHERE revoked_at IS NULL;`

### Revoke all tokens globally
```sql
UPDATE refresh_tokens SET revoked_at = NOW() WHERE revoked_at IS NULL;
```
All users will be logged out on next token refresh.

### Disable ads globally
```sql
UPDATE ad_controls SET value = '{"enabled": false}'::jsonb WHERE id = 'global';
```
No ads will be served until re-enabled. No backend restart needed.

### Disable whispers (abuse spike)
```sql
-- Option 1: Expire all pending whispers
UPDATE whispers SET status = 'expired' WHERE status IN ('pending', 'seen');

-- Option 2: Block new whispers by setting max to 0
-- In the WhisperService, MAX_PENDING_WHISPERS would need a DB/Redis override
```

### Emergency: ban a user immediately
```sql
UPDATE users SET is_active = false WHERE id = 'USER_UUID';
INSERT INTO admin_actions (admin_user_id, action, target_type, target_id, justification)
VALUES ('ADMIN_UUID', 'emergency_ban', 'user', 'USER_UUID', 'Reason for emergency ban');
```

### Rotate phone hash pepper
1. This is a BREAKING CHANGE — all existing phone hashes become invalid
2. Set new `PHONE_HASH_PEPPER` in `.env`
3. Run a migration script to re-hash all phones (requires access to original phone numbers, which we don't store)
4. **In practice: don't rotate the pepper. If compromised, rotate and force all users to re-register.**

### Reset dev database completely
```bash
sudo docker compose down -v
sudo docker compose up -d
sleep 10
cd backend && npm run migrate && npm run seed
```

### Load testing
k6 scripts are at `/workspace/loadtest/`:
- `k6 run loadtest/smoke.js` — 5 VUs, 30s
- `k6 run loadtest/stress.js` — ramp to 500 VUs
- Against production: `k6 run -e API_URL=https://api.shhh.app loadtest/smoke.js`

