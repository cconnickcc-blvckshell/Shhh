# Shhh — Architecture Document

> Last updated: Sprint 5 | v0.5.0 | February 2026  
> **Enhancement work:** Follow **docs/ENHANCEMENT_ROADMAP.md** (branch `shh-enhancement-trial`). Update this doc’s §2, §4, §6, §11 when adding modules, routes, or schema.

---

## 1. System Overview

Shhh is a privacy-native, proximity-driven geosocial platform for adults. The backend is a monolithic Node.js (Express 4 + TypeScript) API designed for horizontal scaling, backed by PostgreSQL (with PostGIS for geospatial queries), Redis (caching, presence, OTP, rate limits, BullMQ job queue), and MongoDB (message storage with TTL). The admin dashboard is a React + Vite SPA; the primary client is a React Native + Expo 55 mobile app.

```
┌─────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                │
│   React Native (iOS/Android)     Admin Dashboard (React + Vite)  │
│   Expo 55, expo-router           @tanstack/react-query           │
│   Zustand state, Socket.io       react-router-dom                │
└───────────────┬─────────────────────────┬───────────────────────┘
                │  HTTPS / WSS            │  HTTPS
                ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Express 4)                       │
│   Helmet → CORS → compression → JSON (10MB) → globalRateLimit  │
│   → Router → errorHandler                                        │
│                                                                  │
│   REST API (/v1/*)            WebSocket (Socket.io)              │
│   Swagger UI (/docs)          Rooms: user:{id}, conversation:{id}│
│   /uploads (static)           BullMQ workers (same process)      │
└──────┬─────────────┬────────────────┬────────────────────────────┘
       │             │                │
       ▼             ▼                ▼
┌──────────┐  ┌───────────┐   ┌──────────────┐
│PostgreSQL │  │   Redis    │   │   MongoDB    │
│+ PostGIS  │  │  7-alpine  │   │     7        │
│  16-3.4   │  │   :6379    │   │   :27017     │
│  :5432    │  │            │   │              │
│           │  │ Cache,     │   │ messages     │
│ 45+ tables│  │ Presence,  │   │ TTL index    │
│ GIST idx  │  │ OTP,       │   │ expiresAt    │
│           │  │ BullMQ     │   │              │
└──────────┘  └───────────┘   └──────────────┘
```

---

## 2. File Tree

```
/workspace/
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI (main)
├── admin-dashboard/                  # React + Vite admin SPA (port 5173)
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts             # API client with JWT
│   │   ├── components/
│   │   │   └── Layout.tsx            # App shell with nav
│   │   ├── pages/
│   │   │   ├── Login.tsx             # Admin login (phone + OTP)
│   │   │   ├── Dashboard.tsx         # Stats overview
│   │   │   ├── Users.tsx             # User management
│   │   │   ├── Revenue.tsx           # Revenue / subscriptions
│   │   │   ├── Venues.tsx            # Venue list
│   │   │   ├── Ads.tsx               # Ad placements
│   │   │   ├── Events.tsx            # Events
│   │   │   ├── Reports.tsx           # Report management
│   │   │   ├── Safety.tsx            # Safety / panic
│   │   │   ├── AuditLog.tsx          # Audit trail
│   │   │   └── Settings.tsx          # Settings
│   │   ├── App.tsx                   # Router setup
│   │   ├── main.tsx                  # Entry point
│   │   └── index.css                 # Global styles
│   ├── package.json
│   └── tsconfig.json
├── mobile/                           # React Native + Expo 55
│   ├── app/
│   │   ├── _layout.tsx               # Root layout, auth guard
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx             # Login
│   │   │   ├── verify-code.tsx       # OTP entry
│   │   │   └── register.tsx          # Registration
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx           # Tab navigator
│   │   │   ├── index.tsx             # Discover (nearby grid)
│   │   │   ├── messages.tsx          # Conversations
│   │   │   ├── events.tsx            # Nearby events
│   │   │   └── profile.tsx           # Profile + safety
│   │   ├── onboarding/
│   │   │   └── index.tsx             # Onboarding flow
│   │   ├── user/
│   │   │   └── [id].tsx              # User profile view
│   │   ├── venue/
│   │   │   └── [id].tsx              # Venue detail
│   │   ├── album/
│   │   │   └── [id].tsx              # Album view
│   │   ├── couple/
│   │   │   └── index.tsx             # Couple linking
│   │   ├── verify/
│   │   │   └── index.tsx             # Verification
│   │   ├── subscription/
│   │   │   └── index.tsx             # Subscription / billing
│   │   ├── whispers/
│   │   │   └── index.tsx             # Whispers list
│   │   ├── profile/
│   │   │   ├── edit.tsx              # Edit profile
│   │   │   └── status.tsx            # Status
│   │   └── chat/
│   │       └── [id].tsx              # Chat (self-destruct toggle)
│   ├── src/
│   │   ├── api/client.ts             # Full API client
│   │   ├── stores/auth.ts            # Zustand auth store
│   │   ├── constants/theme.ts        # Design tokens
│   │   └── hooks/useSocket.ts        # Socket.io hook
│   └── package.json
├── backend/                          # Node.js + Express 4 + TypeScript (port 3000)
│   ├── src/
│   │   ├── config/
│   │   │   ├── index.ts              # Environment config
│   │   │   ├── logger.ts             # Pino logger
│   │   │   ├── database.ts           # PostgreSQL pool
│   │   │   ├── redis.ts              # ioredis client
│   │   │   ├── mongodb.ts            # Mongoose (authSource=admin)
│   │   │   └── swagger.ts            # OpenAPI 3.0 spec
│   │   ├── middleware/
│   │   │   ├── auth.ts               # JWT + tier enforcement
│   │   │   ├── adminAuth.ts          # Admin role (moderator/admin)
│   │   │   ├── rateLimiter.ts        # Global + auth rate limits
│   │   │   ├── errorHandler.ts       # Centralized error handler
│   │   │   └── validation.ts         # Zod schema validation
│   │   ├── modules/
│   │   │   ├── auth/                 # Phone OTP, JWT, push tokens
│   │   │   │   ├── auth.service.ts   # JWT, Argon2id, token rotation
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── otp.service.ts    # OTP send/verify (Redis)
│   │   │   │   └── push.service.ts   # Push token registration
│   │   │   ├── users/                # Profiles, like/pass/block/report
│   │   │   │   ├── users.service.ts
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users.routes.ts
│   │   │   │   ├── trust.service.ts  # Trust score
│   │   │   │   ├── persona.routes.ts # Personas
│   │   │   │   ├── persona.service.ts
│   │   │   │   ├── blur.routes.ts    # Photo blur/reveal
│   │   │   │   ├── blur.service.ts
│   │   │   │   ├── intent.routes.ts  # Intent flags
│   │   │   │   ├── intent.service.ts
│   │   │   │   ├── preferences.routes.ts
│   │   │   │   └── preferences.service.ts
│   │   │   ├── couples/              # Couple linking
│   │   │   ├── verification/        # Multi-tier verification
│   │   │   ├── references/           # User references
│   │   │   ├── discovery/            # PostGIS discovery
│   │   │   │   ├── discovery.service.ts
│   │   │   │   ├── discovery.controller.ts
│   │   │   │   ├── discovery.routes.ts
│   │   │   │   ├── presence.routes.ts # Presence (online/away)
│   │   │   │   ├── presence.service.ts
│   │   │   │   ├── whisper.routes.ts # Whispers
│   │   │   │   └── whisper.service.ts
│   │   │   ├── messaging/            # Conversations, messages, E2EE
│   │   │   │   ├── message.model.ts  # Mongoose (TTL)
│   │   │   │   ├── messaging.service.ts
│   │   │   │   ├── messaging.controller.ts
│   │   │   │   ├── messaging.routes.ts
│   │   │   │   ├── ephemeral.service.ts
│   │   │   │   ├── session.routes.ts # Session, consent, panic-wipe
│   │   │   │   ├── session.service.ts
│   │   │   │   ├── e2ee.routes.ts    # E2EE key exchange
│   │   │   │   └── e2ee.service.ts
│   │   │   ├── events/               # Events & RSVPs (vibe_tag, date filter)
│   │   │   ├── tonight/              # Tonight feed (events + venues aggregator)
│   │   │   │   ├── tonight.service.ts
│   │   │   │   ├── tonight.controller.ts
│   │   │   │   └── tonight.routes.ts
│   │   │   ├── venues/               # Venues + identity + dashboard
│   │   │   │   ├── venues.service.ts
│   │   │   │   ├── venues.controller.ts
│   │   │   │   ├── venues.routes.ts
│   │   │   │   ├── venue-identity.routes.ts
│   │   │   │   ├── venue-identity.service.ts
│   │   │   │   ├── venue-dashboard.routes.ts
│   │   │   │   └── venue-dashboard.service.ts
│   │   │   ├── safety/               # Emergency contacts, check-in, panic
│   │   │   ├── compliance/           # GDPR/CCPA (export, deletion, consent)
│   │   │   ├── media/                # Upload, albums, self-destruct media
│   │   │   │   ├── media.service.ts
│   │   │   │   ├── storage.service.ts
│   │   │   │   ├── album.service.ts
│   │   │   │   ├── media.controller.ts
│   │   │   │   └── media.routes.ts
│   │   │   ├── ads/                  # Ad placements, impressions
│   │   │   │   ├── ad.service.ts
│   │   │   │   └── ad.routes.ts
│   │   │   ├── billing/              # Subscriptions (Stripe)
│   │   │   │   ├── subscription.service.ts
│   │   │   │   └── billing.routes.ts
│   │   │   ├── admin/                # Moderation (admin.routes)
│   │   │   │   ├── moderation.service.ts
│   │   │   │   ├── admin.controller.ts
│   │   │   │   ├── admin.routes.ts
│   │   │   │   ├── admin-extended.routes.ts # Extended admin APIs
│   │   │   │   └── admin-extended.service.ts
│   │   │   └── (no compliance-extended)
│   │   ├── websocket/
│   │   │   └── index.ts              # Socket.io rooms
│   │   ├── workers/
│   │   │   └── index.ts              # BullMQ workers (optional)
│   │   ├── database/
│   │   │   ├── migrate.ts            # Migration runner
│   │   │   ├── seed.ts               # Dev seed data
│   │   │   └── migrations/
│   │   │       ├── 001_initial.sql
│   │   │       ├── 002_couples_verification_safety.sql
│   │   │       ├── 003_media_albums.sql
│   │   │       ├── 004_push_tokens.sql
│   │   │       ├── 005_presence_personas_venue_identity.sql
│   │   │       ├── 006_e2ee_keys.sql
│   │   │       ├── 007_whispers_onboarding_shield.sql
│   │   │       ├── 008_ads_venue_overhaul.sql
│   │   │       ├── 009_admin_rbac_phone_pepper.sql
│   │   │       ├── 010_bidirectional_preferences.sql
│   │   │       ├── 011_reveal_level_scope.sql
│   │   │       ├── 012_conversation_retention.sql
│   │   │       ├── 013_album_share_options.sql
│   │   │       ├── 014_venue_grid_anonymous.sql
│   │   │       ├── 015_event_attendees_post_prompts.sql
│   │   │       ├── 016_whispers_categories_quotas.sql
│   │   │       ├── 017_events_vibe_tag.sql
│   │   │       └── 018_venue_verified_safe.sql
│   │   ├── app.ts                    # Express app, route mounting
│   │   └── index.ts                  # Server entry, attach Socket.io
│   ├── tests/
│   │   ├── setup.ts
│   │   ├── helpers.ts
│   │   ├── auth.test.ts
│   │   ├── discovery.test.ts
│   │   ├── events.test.ts
│   │   ├── couples.test.ts
│   │   ├── safety.test.ts
│   │   ├── admin.test.ts
│   │   └── media.test.ts
│   ├── loadtest/                     # k6 load tests (optional)
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.ts
├── docker-compose.yml                # PostgreSQL+PostGIS, Redis, MongoDB
├── .env.example                      # Environment template
├── AGENTS.md                         # Cloud agent instructions
├── README.md
├── terraform/                        # Optional infra (e.g. GCP)
└── docs/
    ├── ARCHITECTURE.md               # This file
    ├── DEV_HANDOVER.md              # Dev handover
    ├── SYSTEM_REALITY_REPORT.md     # CTO audit
    └── SYSTEM_REALITY_REPORT_APPENDICES.md
```

---

## 3. Dependencies

### Backend (`backend/package.json`)

| Package | Purpose |
|---------|---------|
| express ^4 | HTTP framework |
| cors, helmet, compression | Security and compression |
| express-rate-limit | Request rate limiting |
| pg | PostgreSQL driver |
| ioredis | Redis client (cache, OTP, BullMQ) |
| mongoose | MongoDB ODM (messages, authSource=admin) |
| jsonwebtoken | JWT creation/verification |
| argon2 | Password hashing (Argon2id) |
| zod | Request validation |
| uuid | UUID generation |
| socket.io | WebSocket server |
| bullmq | Job queue (workers) |
| multer | Multipart uploads |
| sharp | Image processing (thumbnails, etc.) |
| stripe | Billing / subscriptions |
| twilio | SMS OTP (optional) |
| tweetnacl, tweetnacl-util | E2EE (e.g. key exchange) |
| pino / pino-pretty | Structured logging |
| http-errors | HTTP error creation |
| swagger-jsdoc, swagger-ui-express | OpenAPI / Swagger UI |
| dotenv | Environment variables |

### Admin Dashboard (`admin-dashboard/package.json`)

| Package | Purpose |
|---------|---------|
| react / react-dom | UI framework |
| react-router-dom | Client-side routing |
| @tanstack/react-query | Server state management |
| vite | Build tool |
| typescript | Type checking |

### Mobile (`mobile/package.json`)

| Package | Purpose |
|---------|---------|
| expo ~55 | React Native framework |
| expo-router | File-based navigation |
| zustand | Client state management |
| @tanstack/react-query | Server state |
| socket.io-client | Real-time WebSocket |
| expo-secure-store | Secure token storage |
| expo-image-picker | Photo selection |
| expo-location | Geolocation |

### Infrastructure (Docker Compose)

| Service | Image | Port |
|---------|-------|------|
| PostgreSQL + PostGIS | postgis/postgis:16-3.4 | 5432 |
| Redis | redis:7-alpine | 6379 |
| MongoDB | mongo:7 | 27017 |

---

## 4. API Ledger

### Authentication
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| POST | `/v1/auth/phone/send-code` | No | — | Send OTP (rate limited; dev returns `devCode`) |
| POST | `/v1/auth/phone/verify` | No | — | Verify OTP, returns tokens |
| POST | `/v1/auth/register` | No | — | Register with phone |
| POST | `/v1/auth/login` | No | — | Login with phone |
| POST | `/v1/auth/refresh` | No | — | Refresh JWT tokens |
| DELETE | `/v1/auth/logout` | Yes | 0 | Revoke all refresh tokens |
| POST | `/v1/auth/push-token` | Yes | 0 | Register push token |
| DELETE | `/v1/auth/push-token` | Yes | 0 | Remove push token |

### Users & Profiles
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/users/me` | Yes | 0 | Get own profile |
| PUT | `/v1/users/me` | Yes | 0 | Update profile (preferencesJson may include neutral_notifications for stealth push) |
| GET | `/v1/users/:id/profile` | Yes | 0 | Get another user's profile (for discovery) |
| POST | `/v1/users/:id/like` | Yes | 1 | Like user (returns match flag) |
| POST | `/v1/users/:id/pass` | Yes | 0 | Pass on user |
| POST | `/v1/users/:id/block` | Yes | 0 | Block user |
| POST | `/v1/users/:id/report` | Yes | 0 | Report user |
| GET | `/v1/users/:userId/trust-score` | Yes | 0 | Get trust score (param: `userId`) |

### Couples
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| POST | `/v1/couples` | Yes | 0 | Create couple, get invite code |
| GET | `/v1/couples/me` | Yes | 0 | Get couple info |
| POST | `/v1/couples/link` | Yes | 0 | Link with invite code |
| POST | `/v1/couples/dissolve` | Yes | 0 | Request dissolution (7-day cooldown) |
| POST | `/v1/couples/confirm-dissolution` | Yes | 0 | Confirm dissolution |

### Verification
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/verification/status` | Yes | 0 | Check verification status |
| POST | `/v1/verification/photo` | Yes | 0 | Submit photo verification |
| POST | `/v1/verification/id` | Yes | 1 | Submit ID verification |
| POST | `/v1/verification/:id/approve` | Yes | 2 | Admin: approve verification |
| POST | `/v1/verification/:id/reject` | Yes | 2 | Admin: reject verification |

### References
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| POST | `/v1/references` | Yes | 2 | Create reference for user |
| GET | `/v1/references/:userId` | Yes | 0 | Get references for user |

### Discovery
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/discover?lat=&lng=&radius=&venueId=&eventId=` | Yes | 0 | Find nearby users (PostGIS). Free tier capped at 30; premium or venue/event context uses higher cap. Response: data, count, discoveryCap, radiusUsedKm, computedRadiusKm? (density-aware suggestion). |
| POST | `/v1/discover/location` | Yes | 0 | Update user location |

### Messaging
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/conversations` | Yes | 0 | List conversations |
| POST | `/v1/conversations` | Yes | 1 | Create conversation |
| GET | `/v1/conversations/:id/messages` | Yes | 0 | Get messages |
| POST | `/v1/conversations/:id/messages` | Yes | 0 | Send message |
| PUT | `/v1/conversations/:id/retention` | Yes | 0 | Set retention (mode, archiveAt?, defaultMessageTtlSeconds?) |

### Media & Albums
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| POST | `/v1/media/upload` | Yes | 0 | Upload photo/video |
| POST | `/v1/media/upload/self-destruct` | Yes | 0 | Upload self-destructing media |
| GET | `/v1/media/my` | Yes | 0 | List own media |
| GET | `/v1/media/:id` | Yes | 0 | Get media (access controlled) |
| DELETE | `/v1/media/:id` | Yes | 0 | Delete own media |
| POST | `/v1/media/:id/view` | Yes | 0 | Track media view |
| POST | `/v1/media/albums` | Yes | 0 | Create private album |
| GET | `/v1/media/albums/my` | Yes | 0 | List own albums |
| GET | `/v1/media/albums/shared` | Yes | 0 | List albums shared with me |
| GET | `/v1/media/albums/:id` | Yes | 0 | Get album (access controlled) |
| DELETE | `/v1/media/albums/:id` | Yes | 0 | Delete album |
| POST | `/v1/media/albums/:id/media` | Yes | 0 | Add media to album |
| DELETE | `/v1/media/albums/:id/media/:mediaId` | Yes | 0 | Remove from album |
| POST | `/v1/media/albums/:id/share` | Yes | 0 | Share album (userId or targetPersonaId or targetCoupleId; watermarkMode, notifyOnView) |
| DELETE | `/v1/media/albums/:id/share/:userId` | Yes | 0 | Revoke album share |

### Events
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/events/nearby?lat=&lng=&radius=&vibe=` | Yes | 0 | Find nearby events (optional vibe: social_mix, lifestyle, kink, couples_only, newbie_friendly) |
| POST | `/v1/events` | Yes | 2 | Create event (optional vibeTag) |
| GET | `/v1/events/:id` | Yes | 0 | Get event details |
| GET | `/v1/events/:id/attendees` | Yes | 0 | Privacy-safe attendee list (persona + badges) |
| GET | `/v1/events/:id/chat-rooms` | Yes | 0 | Chat rooms linked to event |
| POST | `/v1/events/:id/rsvp` | Yes | 0 | RSVP to event |
| POST | `/v1/events/:id/checkin` | Yes | 0 | Check in at event |

### Tonight feed
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/tonight?lat=&lng=&date=&radius=` | Yes | 0 | Aggregator: events (for date, default today) + nearby venues with currentAttendees. Capped (30 events, 20 venues). |

### Presence
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/presence/status` | Yes | 0 | Get presence status (e.g. online/away) |
| PUT | `/v1/presence` | Yes | 0 | Update presence (online/away) |

### Personas
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/personas/me` | Yes | 0 | Get own personas |
| PUT | `/v1/personas/me` | Yes | 0 | Update personas |

### Intents
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/intents/me` | Yes | 0 | Get intent flags |
| PUT | `/v1/intents/me` | Yes | 0 | Update intents |

### Preferences
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/preferences/me` | Yes | 0 | Get preferences |
| PUT | `/v1/preferences/me` | Yes | 0 | Update preferences (e.g. discovery radius) |

### Whispers
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/whispers/inbox` | Yes | 0 | List received whispers |
| GET | `/v1/whispers/sent` | Yes | 0 | List sent whispers |
| POST | `/v1/whispers` | Yes | 0 | Send whisper (body: toUserId, message; optional category, revealPolicy). Quotas: max pending, max per day. |
| (other) | `/v1/whispers/...` | Yes | 0 | Respond, mark seen, ignore |

### Ads
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/ads/placements` | Yes | 0 | Get ad placements (e.g. for feed) |
| POST | `/v1/ads/impressions` | Yes | 0 | Record impression |
| (other) | `/v1/ads/...` | Yes | 0 | Cadence, controls (as implemented) |

### Venues
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/venues/nearby` | Yes | 0 | Find nearby venues (each includes verifiedSafe) |
| GET | `/v1/venues/geofence-check` | Yes | 0 | Check geofence containment |
| POST | `/v1/venues` | Yes | 2 | Create venue |
| GET | `/v1/venues/:id` | Yes | 0 | Get venue details (includes verifiedSafe) |
| GET | `/v1/venues/:id/grid` | Yes | 0 | Privacy-safe grid (anonymous or persona + badges) |
| PUT | `/v1/venues/:id` | Yes | 0 | Update venue (owner only) |
| PUT | `/v1/venues/:id/verified-safe` | Yes | 0 | Self-attest verified safe (owner only; body: optional checklistJson/metadata) |

### Venue Identity & Dashboard
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| (mounted under `/v1/venues`) | | Yes | — | Venue accounts, announcements, check-ins, chat rooms, analytics, staff, reviews, specials (see routes) |

### Session, Consent, Panic-Wipe
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| (mounted under `/v1/conversations`) | | Yes | 0 | Session consent, panic-wipe (clear session/keys) |

### E2EE
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| (mounted under `/v1/e2ee`) | | Yes | 0 | Key upload/fetch, prekey bundles, conversation keys |

### Billing
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/billing/subscription` | Yes | 0 | Get subscription status |
| POST | `/v1/billing/checkout` | Yes | 0 | Create Stripe checkout session |
| (other) | `/v1/billing/...` | Yes | 0 | Webhooks, portal (as implemented) |

### Photos (Blur / Reveal)
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| (mounted under `/v1/photos`) | | Yes | 0 | Blur/reveal photo (optional level 0–2, scope_type, scope_id; GET /media/:id enforces reveal) |

### Safety
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/safety/contacts` | Yes | 0 | List emergency contacts |
| POST | `/v1/safety/contacts` | Yes | 0 | Add emergency contact |
| DELETE | `/v1/safety/contacts/:id` | Yes | 0 | Remove contact |
| POST | `/v1/safety/checkin` | Yes | 0 | Safety check-in |
| POST | `/v1/safety/panic` | Yes | 0 | Trigger panic (recorded; notifications to contacts deferred) |
| POST | `/v1/safety/screenshot` | Yes | 0 | Record screenshot report (optional targetUserId, conversationId) |
| POST | `/v1/safety/venue-distress` | Yes | 0 | Signal distress to venue security (user must be checked in; notifies active venue staff via WebSocket) |

### Compliance (GDPR/CCPA)
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| POST | `/v1/compliance/data-export` | Yes | 0 | Export all user data |
| DELETE | `/v1/compliance/account-deletion` | Yes | 0 | Request account deletion |
| POST | `/v1/compliance/consent` | Yes | 0 | Record consent |
| POST | `/v1/compliance/consent/withdraw` | Yes | 0 | Withdraw consent |

### Admin (role: moderator or admin)
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/v1/admin/stats` | Yes | moderator | Dashboard statistics |
| GET | `/v1/admin/moderation` | Yes | moderator | Moderation queue |
| GET | `/v1/admin/reports` | Yes | moderator | Report list |
| POST | `/v1/admin/reports/:id/resolve` | Yes | moderator | Resolve report |
| GET | `/v1/admin/users/:userId` | Yes | moderator | User detail view |
| POST | `/v1/admin/users/:userId/ban` | Yes | moderator | Ban user |
| POST | `/v1/admin/users/:userId/trust-score` | Yes | moderator | Recalculate trust score |
| GET | `/v1/admin/audit-logs` | Yes | moderator | Audit trail |

### Admin Extended (under `/v1/admin`; role: moderator or admin)
| Method | Path | Auth | Role | Description |
|--------|------|------|------|-------------|
| GET | `/v1/admin/overview` | Yes | moderator | Dashboard overview |
| GET | `/v1/admin/revenue` | Yes | moderator | Revenue overview |
| GET | `/v1/admin/revenue/history` | Yes | moderator | Revenue history (query: days) |
| GET | `/v1/admin/users/list` | Yes | moderator | Paginated user list (query: page, filter) |
| GET | `/v1/admin/users/search` | Yes | moderator | User search (query: q, page) |
| POST | `/v1/admin/users/:userId/role` | Yes | admin | Set user role |
| POST | `/v1/admin/users/:userId/toggle-active` | Yes | admin | Toggle user active |
| POST | `/v1/admin/users/:userId/set-tier` | Yes | admin | Set verification tier |
| GET | `/v1/admin/venues/list` | Yes | moderator | List venues |
| GET | `/v1/admin/ads/list` | Yes | moderator | List ad placements |
| POST | `/v1/admin/ads/:id/toggle` | Yes | moderator | Toggle ad placement |
| GET | `/v1/admin/events/list` | Yes | moderator | List events |
| GET | `/v1/admin/safety/alerts` | Yes | moderator | Safety/panic alerts |
| GET | `/v1/admin/settings/ads` | Yes | moderator | Ad controls |
| PUT | `/v1/admin/settings/ads/:id` | Yes | admin | Update ad control |

### Documentation
| Method | Path | Description |
|--------|------|-------------|
| GET | `/docs` | Swagger UI |
| GET | `/docs.json` | Raw OpenAPI JSON |
| GET | `/health` | Health check + module list |

---

## 5. Key Workflows

### 5.1 Registration & Verification Flow
```
User                    API                    Database / Redis
 │                       │                        │
 ├─ POST /auth/phone/   ─▶ Store OTP in Redis     │
 │     send-code         │  (or return devCode)    │
 │  ◀─ {devCode?}       ─┤                        │
 ├─ POST /auth/phone/   ─▶ Verify OTP             │
 │     verify            ├─ Create/load user      ─▶
 │  ◀─ {tokens, user}   ─┤                        │
 │  (Or POST /auth/register, POST /auth/login)   │
 │                       │                        │
 ├─ POST /verification/ ─▶ Generate pose challenge │
 │     photo             ├─ Store verification    ─▶
 │                       ├─ Add to mod queue      ─▶
 │  ◀─ {poseChallenge}  ─┤                        │
 │       ADMIN           │                        │
 ├─ POST /verification/ ─▶ Approve                │
 │     :id/approve      ├─ Upgrade to tier 1      ─▶
 ├─ POST /verification/ ─▶ Store ID, mod queue    │
 │     id (tier 1+)     ─▶                        │
 │       ADMIN approve  ├─ Upgrade to tier 2      ─▶
 │  (After 3+ refs from tier 2+ users → tier 3)  │
```

### 5.2 Couple Linking Flow
```
Partner A               API                  Partner B
 │                       │                      │
 ├─ POST /couples ──────▶ Generate invite code  │
 │  ◀─ {inviteCode} ────┤                      │
 │                       │                      │
 │   Share code offline  │                      │
 │   ─────────────────────────────────────────▶ │
 │                       │                      │
 │                       │◀── POST /couples/link ─┤
 │                       │    {inviteCode}      │
 │                       ├─ Activate couple ───▶│
 │                       │                      │
 │  Dissolution:         │                      │
 ├─ POST /dissolve ─────▶ Start 7-day cooldown  │
 │                       │                      │
 │  (After 7 days)       │                      │
 │                       │◀── POST /confirm ────┤
 ├─ POST /confirm ──────▶ Both confirmed →      │
 │                       │ dissolve couple       │
```

### 5.3 Discovery & Matching Flow
```
User A                  API                    Database
 │                       │                        │
 ├─ POST /discover/     ─▶ Upsert locations table │
 │     location          ├─ Redis GEOADD         │
 │                       │                        │
 ├─ GET /discover?      ─▶ Check Redis cache      │
 │   lat=&lng=&radius=   │  Cache miss →          │
 │                       ├─ PostGIS ST_DWithin   ─▶
 │                       ├─ Filter blocks         │
 │                       ├─ Apply location fuzz   │
 │                       ├─ Cache 30s in Redis    │
 │  ◀─ [{users}] ───────┤                        │
 │                       │                        │
 ├─ POST /users/:id/    ─▶ Record interaction     │
 │     like              ├─ Check mutual like    ─▶
 │  ◀─ {matched: true}  ─┤                        │
```

### 5.4 Trust Score Algorithm
```
Score = tier_points + reference_points + age_points - report_penalty

tier_points      = verification_tier × 25          (max 75)
reference_points = min(weighted_ref_sum × 2, 30)   (max 30)
age_points       = min(account_days / 30 × 5, 20)  (max 20)
report_penalty   = actionable_reports × 10

Total: 0–100 → Badge:
  75+ = "trusted"
  50+ = "established"
  25+ = "verified"
  <25 = "new"
```

### 5.5 Safety Panic Flow
```
User                    API                    System
 │                       │                        │
 ├─ POST /safety/panic ─▶ Create panic checkin    │
 │   {lat, lng}          ├─ Get emergency contacts│
 │                       ├─ Audit log (safety)    │
 │  ◀─ {checkinId,       │  Notifications to     │
 │      contactsNotified:0, emergencyContactsOnFile}  contacts deferred   │
 │                       │  (SMS/push not yet implemented).               │
```

### 5.6 Private Album Sharing Flow
```
Owner                   API                    Recipient
 │                       │                        │
 ├─ POST /media/upload  ─▶ Store + thumbnail      │
 │  ◀─ {mediaId, url}   ─┤                        │
 │                       │                        │
 ├─ POST /albums ───────▶ Create private album    │
 │  ◀─ {albumId}        ─┤                        │
 │                       │                        │
 ├─ POST /albums/:id/   ─▶ Link media to album    │
 │     media             │                        │
 │                       │                        │
 ├─ POST /albums/:id/   ─▶ Grant access           │
 │     share             ├─ WebSocket emit ──────▶│
 │                       │  album_shared           │
 │                       │                        │
 │                       │◀── GET /albums/:id ────┤
 │                       ├─ Return media list ───▶│
 │                       │                        │
 ├─ DELETE /albums/:id/ ─▶ Revoke access           │
 │     share/:userId     ├─ WebSocket emit ──────▶│
 │                       │  album_revoked          │
```

### 5.7 Self-Destructing Media

Self-destructing media uses two mechanisms:

1. **MongoDB TTL index** on `messages.expiresAt` auto-deletes message docs
2. **PostgreSQL** `media.expires_at` triggers cleanup via scheduled job
3. **View tracking** in `media_view_tracking` records who viewed + duration
4. **WebSocket** emits `media_self_destructed` when TTL expires

---

## 6. Database Schema (ERD Summary)

### PostgreSQL (45+ tables; migrations 001–018)

Core: `users`, `refresh_tokens`, `user_profiles`, `locations` (PostGIS, GIST), `blocks`, `user_interactions`, `reports`, `trust_scores`, `schema_migrations`.

Auth & verification: `verifications`, `user_references`. Couples: `couples`. Discovery: (locations). Messaging: `conversations`, `conversation_participants` (012: retention_mode, archive_at, default_message_ttl_seconds, is_archived; worker archive-conversations every 1m). Events: `events`, `event_rsvps`, `venues`, `geofences`. Safety: `emergency_contacts`, `safety_checkins`. Compliance: `audit_logs`, `consent_records`, `data_deletion_requests` (worker processes pending requests every 5m: anonymize user + profile, then mark completed). Moderation: `moderation_queue`, `content_flags`.

Added in later migrations: `push_tokens` (004), media/albums (003), `presence`, `personas`, `intent_flags`, `venue_accounts`, `venue_announcements`, `venue_checkins`, `venue_chat_rooms`, `photo_reveals` (005; 011 adds level, scope_type, scope_id), `subscriptions`, `screenshot_events` (008), `user_keys`, `prekey_bundles`, `conversation_keys` (006), `whispers`, onboarding/shield (007), `ad_placements`, `ad_impressions`, `ad_cadence_rules`, `ad_controls`, `venue_analytics`, `venue_staff`, `venue_reviews`, `venue_specials` (008), `admin_actions` (009), `bidirectional_preferences` (010). Album shares (013): `album_shares` gains share_target_type, share_target_id, watermark_mode, notify_on_view. Stealth: `user_profiles.preferences_json.neutral_notifications`; push.service uses it for generic title/body. Venue grid (014): `venue_checkins.anonymous_mode` (default true); GET /venues/:id/grid returns privacy-safe tiles. Event post prompts (015): `event_post_prompts` (event_id, user_id, prompt_type) avoids duplicate reference/keep_chatting pushes. Whispers (016): `whispers.category`, `whispers.reveal_policy`; unique index one pending per (from, to); max per day enforced. Events (017): `events.vibe_tag` optional (social_mix, lifestyle, kink, couples_only, newbie_friendly). Venues (018): `verified_safe_at`, `verified_safe_metadata` (self-attest or partner; no PII). Phone/email hashing uses HMAC-SHA256 with `PHONE_HASH_PEPPER` (009).

### MongoDB

| Collection | Purpose | Indexes |
|------------|---------|---------|
| messages | Chat messages | conversationId+createdAt, TTL on expiresAt |

---

## 7. Security Architecture

| Layer | Implementation |
|-------|----------------|
| Transport | TLS 1.3 (in production) |
| Auth | JWT (15min access, 7-day refresh rotation); phone OTP (Redis, rate limited) |
| Password | Argon2id (64MB memory, 3 iterations, 4 parallelism) |
| PII at rest | HMAC-SHA256 with pepper for phone/email (see `PHONE_HASH_PEPPER`) |
| Rate limiting | 100 req/15min global, 5 req/15min auth |
| Headers | Helmet (crossOriginResourcePolicy) |
| Input | Zod schema validation on endpoints |
| SQL | Parameterized queries only (pg driver) |
| Access control | Tier-based middleware (0–3) for app; admin uses role (moderator/admin). Premium features: `requireFeature(feature)` checks subscription `features_json` (e.g. expandedRadius, vault). |

### Verification Tiers
| Tier | Requirements | Capabilities |
|------|-------------|--------------|
| 0 | Phone only | Browse, view profiles |
| 1 | Photo verified | Like users, create conversations |
| 2 | ID verified | Create events/venues, write references, admin API access |
| 3 | 3+ references from tier 2+ | Full trust badge |

### Admin RBAC
Admin routes use `requireRole('moderator')` or `requireRole('admin')`; user role stored in `users.role` (e.g. user, moderator, admin, superadmin). Sensitive actions (set role, set tier, toggle active, update ad control) require `admin`.

---

## 8. Deployment / Run

1. **Infrastructure:** Start Docker (e.g. `sudo dockerd &` if needed), then `docker compose up -d` (PostgreSQL:5432, Redis:6379, MongoDB:27017). MongoDB uses `authSource=admin` in the connection string.
2. **Backend:** `cd backend && npm run migrate` (first time or after schema changes), then `npm run dev` (port 3000, hot reload). Optional: `npm run seed` for dev data.
3. **Admin dashboard:** `cd admin-dashboard && npm run dev` (port 5173).
4. **Mobile:** `cd mobile && npx expo start` (Expo 55; web at 8082).

See `AGENTS.md` for gotchas (e.g. PostGIS parameter order, JWT tier testing via `users.verification_tier`, rate limits on auth).

---

## 9. CI/CD Pipeline

```yaml
GitHub Actions (.github/workflows/ci.yml)
├── backend-lint-typecheck     # ESLint + tsc --noEmit
├── backend-test               # Jest with PG/Redis/Mongo services
├── backend-build              # tsc compilation
└── admin-dashboard            # tsc + vite build
```

---

## 10. Test Coverage

| Suite | Tests | Modules Covered |
|-------|-------|-----------------|
| auth.test.ts | 10 | Registration, login, refresh, logout, validation |
| discovery.test.ts | 4 | Location update, nearby query, validation |
| events.test.ts | 4 | Create, get, RSVP, check-in |
| couples.test.ts | 4 | Create, link, get, dissolve |
| safety.test.ts | 5 | Contacts CRUD, check-in, panic |
| admin.test.ts | 6 | Stats, queue, user detail, trust, audit, auth |
| media.test.ts | (see suite) | Media upload, albums, access |
| **Total** | 7 suites | auth, discovery, events, couples, safety, admin, media |

---

## 11. Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DATABASE_URL | postgresql://...localhost:5432/shhh | PostgreSQL connection |
| REDIS_URL | redis://localhost:6379 | Redis connection |
| MONGODB_URL | mongodb://...localhost:27017/... | MongoDB (use authSource=admin) |
| JWT_SECRET | (dev value) | JWT signing secret |
| JWT_REFRESH_SECRET | (dev value) | Refresh token secret |
| JWT_ACCESS_EXPIRY | 15m | Access token lifetime |
| JWT_REFRESH_EXPIRY | 7d | Refresh token lifetime |
| PHONE_HASH_PEPPER | (required for hashing) | Pepper for HMAC-SHA256 phone/email hashing |
| PORT | 3000 | API server port |
| NODE_ENV | development | Environment mode |
| LOG_LEVEL | debug | Pino log level |
| RATE_LIMIT_WINDOW_MS | 900000 | Rate limit window |
| RATE_LIMIT_MAX_REQUESTS | 100 | Max requests per window |
| DEFAULT_LOCATION_FUZZ_METERS | 300 | Location randomization |
| MAX_DISCOVERY_RADIUS_KM | 100 | Max search radius |
| STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET | — | Billing (subscriptions) |
| TWILIO_* | — | SMS OTP (optional; dev can use devCode) |

---

## 12. Current Notes / Gaps

- **Trust score route:** Fixed on `shh-enhancement-trial`: handler uses `req.params.userId` only.
- **Screenshot:** `POST /v1/safety/screenshot` implemented; records to `screenshot_events` (optional targetUserId, conversationId).
- **Account deletion:** Worker `process-deletions` runs every 5m; anonymizes user + profile, then marks request completed (anonymize first, hard delete later).
- **Panic alerts:** Emergency contacts are not yet notified via SMS/push; response returns `contactsNotified: 0`, `emergencyContactsOnFile`; feature deferred.
