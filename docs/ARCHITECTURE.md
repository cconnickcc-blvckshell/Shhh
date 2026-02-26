# Shhh — Architecture Document

> Last updated: Sprint 3 | v0.3.0

---

## 1. System Overview

Shhh is an enterprise-grade geosocial networking platform. The backend is a monolithic Node.js API designed for horizontal scaling, backed by PostgreSQL (with PostGIS for geospatial queries), Redis (caching/sessions), and MongoDB (message storage). The admin dashboard is a React SPA.

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│   React Native (iOS/Android)     Admin Dashboard (React)    │
└───────────────┬─────────────────────────┬───────────────────┘
                │  HTTPS / WSS            │  HTTPS
                ▼                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Express)                     │
│   Rate Limiter → Helmet → CORS → Auth → Router → Handler   │
│                                                             │
│   REST API (/v1/*)          WebSocket (Socket.io)           │
│   Swagger UI (/docs)        Real-time messaging             │
└──────┬─────────────┬────────────────┬───────────────────────┘
       │             │                │
       ▼             ▼                ▼
┌──────────┐  ┌───────────┐   ┌──────────────┐
│PostgreSQL │  │   Redis    │   │   MongoDB    │
│+ PostGIS  │  │  (Cache)   │   │ (Messages)   │
│  :5432    │  │   :6379    │   │   :27017     │
└──────────┘  └───────────┘   └──────────────┘
```

---

## 2. File Tree

```
/workspace/
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI pipeline
├── admin-dashboard/                  # React + Vite admin SPA
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts            # API client with auth
│   │   ├── components/
│   │   │   └── Layout.tsx            # App shell with nav
│   │   ├── pages/
│   │   │   ├── Login.tsx             # Admin login
│   │   │   ├── Dashboard.tsx         # Stats overview
│   │   │   ├── Reports.tsx           # Report management
│   │   │   └── AuditLog.tsx          # Audit trail viewer
│   │   ├── App.tsx                   # Router setup
│   │   ├── main.tsx                  # Entry point
│   │   └── index.css                 # Global styles
│   ├── package.json
│   └── tsconfig.json
├── mobile/                           # React Native + Expo mobile app
│   ├── app/
│   │   ├── _layout.tsx               # Root layout with auth guard
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx             # Login screen
│   │   │   └── register.tsx          # Registration screen
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx           # Tab navigator
│   │   │   ├── index.tsx             # Discover (nearby grid)
│   │   │   ├── messages.tsx          # Conversations list
│   │   │   ├── events.tsx            # Nearby events
│   │   │   └── profile.tsx           # Profile + safety
│   │   └── chat/
│   │       └── [id].tsx              # Chat screen with self-destruct toggle
│   ├── src/
│   │   ├── api/client.ts             # Full API client
│   │   ├── stores/auth.ts            # Zustand auth store
│   │   └── constants/theme.ts        # Design tokens
│   └── package.json
├── backend/                          # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── config/
│   │   │   ├── index.ts              # Environment config
│   │   │   ├── logger.ts             # Pino logger
│   │   │   ├── database.ts           # PostgreSQL pool
│   │   │   ├── redis.ts              # ioredis client
│   │   │   ├── mongodb.ts            # Mongoose connection
│   │   │   └── swagger.ts            # OpenAPI 3.0 spec
│   │   ├── middleware/
│   │   │   ├── auth.ts               # JWT verification + tier enforcement
│   │   │   ├── rateLimiter.ts        # Global + auth rate limits
│   │   │   ├── errorHandler.ts       # Centralized error handler
│   │   │   └── validation.ts         # Zod schema validation
│   │   ├── modules/
│   │   │   ├── auth/                 # Authentication & registration
│   │   │   │   ├── auth.service.ts   # JWT, Argon2id, token rotation
│   │   │   │   ├── auth.controller.ts
│   │   │   │   └── auth.routes.ts
│   │   │   ├── users/                # User profiles & interactions
│   │   │   │   ├── users.service.ts  # CRUD, like/pass/block/report
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users.routes.ts
│   │   │   │   └── trust.service.ts  # Trust score algorithm
│   │   │   ├── couples/              # Couple linking
│   │   │   │   ├── couples.service.ts # Invite, link, dissolve
│   │   │   │   ├── couples.controller.ts
│   │   │   │   └── couples.routes.ts
│   │   │   ├── verification/         # Multi-tier verification
│   │   │   │   ├── verification.service.ts
│   │   │   │   ├── verification.controller.ts
│   │   │   │   └── verification.routes.ts
│   │   │   ├── references/           # User reference system
│   │   │   │   ├── references.service.ts
│   │   │   │   ├── references.controller.ts
│   │   │   │   └── references.routes.ts
│   │   │   ├── discovery/            # PostGIS geolocation
│   │   │   │   ├── discovery.service.ts # ST_DWithin queries
│   │   │   │   ├── discovery.controller.ts
│   │   │   │   └── discovery.routes.ts
│   │   │   ├── messaging/            # Conversations & messages
│   │   │   │   ├── message.model.ts  # Mongoose schema (TTL)
│   │   │   │   ├── messaging.service.ts
│   │   │   │   ├── messaging.controller.ts
│   │   │   │   ├── messaging.routes.ts
│   │   │   │   └── ephemeral.service.ts # Disappearing/view-once
│   │   │   ├── events/               # Events & RSVPs
│   │   │   │   ├── events.service.ts
│   │   │   │   ├── events.controller.ts
│   │   │   │   └── events.routes.ts
│   │   │   ├── venues/               # Venue management
│   │   │   │   ├── venues.service.ts # CRUD + geofences
│   │   │   │   ├── venues.controller.ts
│   │   │   │   └── venues.routes.ts
│   │   │   ├── safety/               # Emergency features
│   │   │   │   ├── safety.service.ts # Contacts, check-ins, panic
│   │   │   │   ├── safety.controller.ts
│   │   │   │   └── safety.routes.ts
│   │   │   ├── compliance/           # GDPR/CCPA
│   │   │   │   ├── compliance.service.ts
│   │   │   │   ├── compliance.controller.ts
│   │   │   │   └── compliance.routes.ts
│   │   │   └── admin/                # Moderation dashboard
│   │   │       ├── moderation.service.ts
│   │   │       ├── admin.controller.ts
│   │   │       └── admin.routes.ts
│   │   ├── websocket/
│   │   │   └── index.ts              # Socket.io setup
│   │   ├── database/
│   │   │   ├── migrate.ts            # Migration runner
│   │   │   └── migrations/
│   │   │       ├── 001_initial.sql
│   │   │       └── 002_couples_verification_safety.sql
│   │   ├── app.ts                    # Express app factory
│   │   └── index.ts                  # Server entry point
│   ├── tests/
│   │   ├── setup.ts                  # Test env config
│   │   ├── helpers.ts                # Test utilities
│   │   ├── auth.test.ts              # 10 tests
│   │   ├── discovery.test.ts         # 4 tests
│   │   ├── events.test.ts            # 4 tests
│   │   ├── couples.test.ts           # 4 tests
│   │   ├── safety.test.ts            # 5 tests
│   │   └── admin.test.ts             # 6 tests
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.eslint.json
│   ├── .eslintrc.cjs
│   └── jest.config.ts
├── docker-compose.yml                # PostgreSQL, Redis, MongoDB
├── .env.example                      # Environment template
├── .gitignore
├── AGENTS.md                         # Cloud agent instructions
├── README.md
└── docs/
    └── ARCHITECTURE.md               # This file
```

---

## 3. Dependencies

### Backend (`backend/package.json`)

| Package | Purpose |
|---------|---------|
| express | HTTP framework |
| cors | Cross-origin support |
| helmet | Security headers |
| compression | Gzip responses |
| express-rate-limit | Request rate limiting |
| pg | PostgreSQL driver |
| ioredis | Redis client |
| mongoose | MongoDB ODM |
| jsonwebtoken | JWT creation/verification |
| argon2 | Password hashing (Argon2id) |
| zod | Request validation |
| uuid | UUID generation |
| socket.io | WebSocket server |
| pino / pino-pretty | Structured logging |
| http-errors | HTTP error creation |
| swagger-jsdoc | OpenAPI spec generation |
| swagger-ui-express | Swagger UI hosting |
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
| POST | `/v1/auth/register` | No | — | Register with phone |
| POST | `/v1/auth/login` | No | — | Login with phone |
| POST | `/v1/auth/refresh` | No | — | Refresh JWT tokens |
| DELETE | `/v1/auth/logout` | Yes | 0 | Revoke all refresh tokens |

### Users & Profiles
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/users/me` | Yes | 0 | Get own profile |
| PUT | `/v1/users/me` | Yes | 0 | Update profile |
| POST | `/v1/users/:id/like` | Yes | 1 | Like user (returns match flag) |
| POST | `/v1/users/:id/pass` | Yes | 0 | Pass on user |
| POST | `/v1/users/:id/block` | Yes | 0 | Block user |
| POST | `/v1/users/:id/report` | Yes | 0 | Report user |
| GET | `/v1/users/:userId/trust-score` | Yes | 0 | Get trust score |

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
| GET | `/v1/discover?lat=&lng=&radius=` | Yes | 0 | Find nearby users (PostGIS) |
| POST | `/v1/discover/location` | Yes | 0 | Update user location |

### Messaging
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/conversations` | Yes | 0 | List conversations |
| POST | `/v1/conversations` | Yes | 1 | Create conversation |
| GET | `/v1/conversations/:id/messages` | Yes | 0 | Get messages |
| POST | `/v1/conversations/:id/messages` | Yes | 0 | Send message |

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
| POST | `/v1/media/albums/:id/share` | Yes | 0 | Share album with user |
| DELETE | `/v1/media/albums/:id/share/:userId` | Yes | 0 | Revoke album share |

### Events
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/events/nearby` | Yes | 0 | Find nearby events |
| POST | `/v1/events` | Yes | 2 | Create event |
| GET | `/v1/events/:id` | Yes | 0 | Get event details |
| POST | `/v1/events/:id/rsvp` | Yes | 0 | RSVP to event |
| POST | `/v1/events/:id/checkin` | Yes | 0 | Check in at event |

### Venues
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/venues/nearby` | Yes | 0 | Find nearby venues |
| GET | `/v1/venues/geofence-check` | Yes | 0 | Check geofence containment |
| POST | `/v1/venues` | Yes | 2 | Create venue |
| GET | `/v1/venues/:id` | Yes | 0 | Get venue details |
| PUT | `/v1/venues/:id` | Yes | 0 | Update venue (owner only) |

### Safety
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/safety/contacts` | Yes | 0 | List emergency contacts |
| POST | `/v1/safety/contacts` | Yes | 0 | Add emergency contact |
| DELETE | `/v1/safety/contacts/:id` | Yes | 0 | Remove contact |
| POST | `/v1/safety/checkin` | Yes | 0 | Safety check-in |
| POST | `/v1/safety/panic` | Yes | 0 | Trigger panic alert |

### Compliance (GDPR/CCPA)
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| POST | `/v1/compliance/data-export` | Yes | 0 | Export all user data |
| DELETE | `/v1/compliance/account-deletion` | Yes | 0 | Request account deletion |
| POST | `/v1/compliance/consent` | Yes | 0 | Record consent |
| POST | `/v1/compliance/consent/withdraw` | Yes | 0 | Withdraw consent |

### Admin
| Method | Path | Auth | Tier | Description |
|--------|------|------|------|-------------|
| GET | `/v1/admin/stats` | Yes | 2 | Dashboard statistics |
| GET | `/v1/admin/moderation` | Yes | 2 | Moderation queue |
| GET | `/v1/admin/reports` | Yes | 2 | Report list |
| POST | `/v1/admin/reports/:id/resolve` | Yes | 2 | Resolve report |
| GET | `/v1/admin/users/:userId` | Yes | 2 | User detail view |
| POST | `/v1/admin/users/:userId/ban` | Yes | 2 | Ban user |
| POST | `/v1/admin/users/:userId/trust-score` | Yes | 2 | Recalculate trust score |
| GET | `/v1/admin/audit-logs` | Yes | 2 | Audit trail |

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
User                    API                    Database
 │                       │                        │
 ├─ POST /auth/register ─▶ Hash phone            │
 │                       ├─ Create user (tier 0) ─▶
 │                       ├─ Create profile       ─▶
 │  ◀─ {tokens, userId} ─┤                        │
 │                       │                        │
 ├─ POST /verify/photo  ─▶ Generate pose challenge│
 │                       ├─ Store verification   ─▶
 │                       ├─ Add to mod queue     ─▶
 │  ◀─ {poseChallenge}  ─┤                        │
 │                       │                        │
 │       ADMIN           │                        │
 ├─ POST /verify/:id/   ─▶ Approve verification  │
 │     approve           ├─ Upgrade to tier 1    ─▶
 │                       │                        │
 ├─ POST /verify/id     ─▶ Store ID hash         │
 │       (tier 1+ req)   ├─ Add to mod queue     ─▶
 │                       │                        │
 │       ADMIN           │                        │
 ├─ POST /verify/:id/   ─▶ Approve               │
 │     approve           ├─ Upgrade to tier 2    ─▶
 │                       │                        │
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
 │  ◀─ {contactsNotified}┤                        │
 │                       │  [Future: SMS/push     │
 │                       │   notifications to     │
 │                       │   emergency contacts]  │
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

### PostgreSQL Tables (20 tables)

| Table | Purpose | Key Relations |
|-------|---------|---------------|
| users | Core user accounts | PK for all user refs |
| refresh_tokens | JWT rotation tokens | FK → users |
| couples | Couple linking | FK → users (×2) |
| user_profiles | Extended profile data | FK → users |
| locations | PostGIS locations | FK → users, GIST index |
| verifications | Verification submissions | FK → users |
| user_references | Trust references | FK → users (×2) |
| blocks | User blocks | FK → users (×2) |
| trust_scores | Cached trust scores | FK → users |
| venues | Venue locations | FK → users (owner) |
| geofences | PostGIS geofence polygons | FK → venues |
| events | Events & parties | FK → venues, users |
| event_rsvps | RSVP tracking | FK → events, users |
| conversations | Chat metadata | — |
| conversation_participants | Chat members | FK → conversations, users |
| user_interactions | Like/pass tracking | FK → users (×2) |
| reports | User reports | FK → users (×2) |
| audit_logs | GDPR audit trail | FK → users |
| consent_records | Consent tracking | FK → users |
| data_deletion_requests | GDPR deletion | FK → users |
| emergency_contacts | Safety contacts | FK → users |
| safety_checkins | Check-in/panic records | FK → users, events |
| moderation_queue | Admin review queue | FK → users (assignee) |
| content_flags | Automated content flags | FK → users |
| schema_migrations | Migration tracking | — |

### MongoDB Collections

| Collection | Purpose | Indexes |
|------------|---------|---------|
| messages | Chat messages | conversationId+createdAt, TTL on expiresAt |

---

## 7. Security Architecture

| Layer | Implementation |
|-------|----------------|
| Transport | TLS 1.3 (in production) |
| Auth | JWT (15min access, 7-day refresh rotation) |
| Password | Argon2id (64MB memory, 3 iterations, 4 parallelism) |
| Data at rest | Hashed PII (SHA-256 for phone/email) |
| Rate limiting | 100 req/15min global, 5 req/15min auth |
| Headers | Helmet (CSP, HSTS, X-Frame-Options, etc.) |
| Input | Zod schema validation on all endpoints |
| SQL | Parameterized queries only (pg driver) |
| Access control | Tier-based middleware (0–3) |

### Verification Tiers
| Tier | Requirements | Capabilities |
|------|-------------|--------------|
| 0 | Phone only | Browse, view profiles |
| 1 | Photo verified | Like users, create conversations |
| 2 | ID verified | Create events/venues, write references, admin access |
| 3 | 3+ references from tier 2+ | Full trust badge |

---

## 8. CI/CD Pipeline

```yaml
GitHub Actions (.github/workflows/ci.yml)
├── backend-lint-typecheck     # ESLint + tsc --noEmit
├── backend-test               # Jest with PG/Redis/Mongo services
├── backend-build              # tsc compilation
└── admin-dashboard            # tsc + vite build
```

---

## 9. Test Coverage

| Suite | Tests | Modules Covered |
|-------|-------|-----------------|
| auth.test.ts | 10 | Registration, login, refresh, logout, validation |
| discovery.test.ts | 4 | Location update, nearby query, validation |
| events.test.ts | 4 | Create, get, RSVP, check-in |
| couples.test.ts | 4 | Create, link, get, dissolve |
| safety.test.ts | 5 | Contacts CRUD, check-in, panic |
| admin.test.ts | 6 | Stats, queue, user detail, trust, audit, auth |
| **Total** | **47** | 7 suites |

---

## 10. Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DATABASE_URL | postgresql://...localhost:5432/shhh | PostgreSQL connection |
| REDIS_URL | redis://localhost:6379 | Redis connection |
| MONGODB_URL | mongodb://...localhost:27017/... | MongoDB connection |
| JWT_SECRET | (dev value) | JWT signing secret |
| JWT_REFRESH_SECRET | (dev value) | Refresh token secret |
| JWT_ACCESS_EXPIRY | 15m | Access token lifetime |
| JWT_REFRESH_EXPIRY | 7d | Refresh token lifetime |
| PORT | 3000 | API server port |
| NODE_ENV | development | Environment mode |
| LOG_LEVEL | debug | Pino log level |
| RATE_LIMIT_WINDOW_MS | 900000 | Rate limit window |
| RATE_LIMIT_MAX_REQUESTS | 100 | Max requests per window |
| DEFAULT_LOCATION_FUZZ_METERS | 300 | Location randomization |
| MAX_DISCOVERY_RADIUS_KM | 100 | Max search radius |
