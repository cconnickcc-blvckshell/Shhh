# Shhh — Architecture Scale Risk Deep Dive (50k–100k Users)

**Prepared for:** C-Suite / CTO  
**Date:** March 2026  
**Scope:** Full platform — backend, admin dashboard, mobile app  
**Methodology:** Codebase audit mapped against three primary scale risks

---

## Executive Summary

This document maps the three highest-impact architectural risks at 50k–100k users to the current Shhh codebase. It provides evidence-based findings, gap analysis, and a phased remediation roadmap.

| Risk | Current State | Target State | Priority |
|------|---------------|--------------|----------|
| **1. Discovery & presence state consistency** | Monolithic query, ad hoc cap logic, no policy versioning | Deterministic pipeline, centralized policy, versioned ranking | Phase 2 |
| **2. Cross-store consistency (Postgres, Mongo, Redis, WebSocket)** | No outbox, partial Mongo deletion, direct emits | Outbox pattern, full deletion orchestration, domain events | Phase 2 |
| **3. Entitlement & policy drift** | Scattered `if` checks across 15+ files | Centralized entitlements engine, single policy contract | Phase 2 |

**Bottom line:** The platform is transitioning from "app logic" to "policy system logic." At small scale, scattered checks work. At 50k–100k users, **different parts of the system will start disagreeing about reality**—and trust evaporates fast.

---

## 1. Discovery and Presence — State Consistency Risk

### 1.1 Current Architecture (Evidence)

**Discovery pipeline today:**

```
GET /v1/discovery?lat=&lng=&radius=...
  → DiscoveryController.discover()
    → subscriptionService.getSubscription(userId)     # Cap decision
    → discoveryService.getNearbyUsers(userId, lat, lng, filters, { limit })
      → Redis cache check (30s TTL, key = discover:{userId}:{lat}:{lng}:...)
      → Single 150-line SQL query:
          - JOIN user_profiles, users, locations, presence
          - ST_DWithin (PostGIS geo)
          - blocks, seeking_*, discovery_visible_to
          - ORDER BY distance, last_active
          - LIMIT $6
      → Redis set cache
  → res.json({ data: users, discoveryCap: limit })
```

**Key files:**

| File | Responsibility |
|------|----------------|
| `backend/src/modules/discovery/discovery.controller.ts` | Cap decision (free vs premium vs venue/event), radius, primaryIntent |
| `backend/src/modules/discovery/discovery.service.ts` | Single `getNearbyUsers()` — geo + filters + blocks + presence in one query |
| `backend/src/modules/messaging/initiation-cap.service.ts` | Message initiation cap (separate from discovery cap) |
| `backend/src/modules/discovery/presence.service.ts` | Presence state (Postgres + Redis), decay worker |

**Gaps identified:**

1. **No split contracts** — "Who is nearby," "who is eligible," "who is messageable," and "who is capped" are all computed in one place. No `DiscoveryEligibility`, `DiscoveryRanking`, or `MessagingEligibility` as distinct concepts.

2. **Cap logic duplicated** — Discovery cap lives in `DiscoveryController` (subscription tier → limit). Initiation cap lives in `InitiationCapService` (subscription tier → Redis incr). Different keys, different semantics. No single "what can this user do right now?" contract.

3. **Cache key brittleness** — `discover:${userId}:${lat.toFixed(2)}:${lng.toFixed(2)}:...` — small lat/lng changes bust cache. No filter-hash versioning. No "why this user is visible but not messageable" explainability.

4. **Presence freshness** — `locations.updated_at` used as `last_active`; `presence.expires_at` checked in query. No explicit "location freshness" invariant. Worker decays presence every 1m; no guarantee location and presence stay in sync under burst.

5. **No policy versioning** — Filter logic, cap logic, and ranking are hardcoded. A/B tests or regional overrides would require code changes.

### 1.2 Recommended Architecture

**Phase 1 — Lock invariants:**

- Define source of truth: `locations` = current location; `presence` = online/visibility state; both must be fresh (TTL or `updated_at` threshold).
- Document: "Discovery eligibility = within radius + not blocked + mutual seeking + discovery_visible_to + presence not expired."

**Phase 2 — Build discovery engine:**

```
location update
  → normalize + validate
  → write locations (Postgres)
  → optionally refresh presence
  → invalidate discovery cache for affected users

discovery request
  → candidate generation (geo + base filters)
  → policy filtering (blocks, seeking, visibility)
  → ranking (distance, presence, intents)
  → cap application (subscription tier, venue/event bypass)
  → response shaping
```

**Non-negotiable:** Do not let each endpoint independently decide "who should appear." Centralize discovery policy into one service; version the ranking/filter logic; cache short-lived candidate sets by `user + filterHash`; treat location freshness as a first-class invariant.

### 1.3 Hot-Path Read Amplification

**Current request path:**

```
request
  → auth check (JWT)
  → subscriptionService.getSubscription(userId)     # 1 DB call
  → usersService.getProfile(userId) [if primaryIntent missing]  # 1 DB call
  → discoveryService.getNearbyUsers(...)
    → Redis get (cache hit) OR
    → Postgres: 1 heavy query (profiles + users + locations + presence + blocks + intents)
  → Redis set (on miss)
```

**At scale:** One discovery request can trigger 2–3 DB round-trips plus Redis. Under burst, cache misses will spike; the geo query is expensive (ST_DWithin, multiple JOINs). No performance budgets (p50, p95, p99, DB calls per request).

**Recommendation:** Add metrics for discovery latency, cache hit rate, and DB calls per request. Create explicit stores/services for: presence state, geo index, entitlement/cap evaluation, ranked result assembly.

---

## 2. Cross-Store Consistency — Messaging, Ephemeral, Moderation

### 2.1 Current Architecture (Evidence)

**Stores and responsibilities:**

| Store | Current use | Intended role |
|-------|-------------|---------------|
| **Postgres** | Identity, auth, billing, blocks, subscriptions, conversations, participants, presence, locations, reports, moderation, deletion ledger | Source of truth for identity, consent, moderation, deletion |
| **MongoDB** | Message bodies (`Message` model: conversationId, senderId, content, ...) | Delivery/read-path optimization |
| **Redis** | Cache, rate limit, presence snapshot, initiation cap counters, OTP, BullMQ | Ephemeral derived state only |
| **WebSocket** | Live updates (new_message, presence_expired, whisper_received, etc.) | Transport only, never truth |

**Deletion flow today:**

```
User requests deletion
  → complianceService.requestAccountDeletion(userId)
  → INSERT data_deletion_requests
  → Worker (every 5m): processDeletionRequests()
    → Message.deleteMany({ senderId: userId })   # Mongo: only messages SENT by user
    → UPDATE users SET deleted_at = NOW(), ...
    → UPDATE user_profiles SET display_name = 'Deleted User', ...
```

**Gaps identified:**

1. **MongoDB deletion gap** — Only `senderId: userId` is purged. Messages where the user is a *recipient* (in a conversation with them) remain. Conversation still exists; other participant still sees it. GDPR/CCPA risk (CSUITE_MASTER_AUDIT_REPORT P0).

2. **No conversation purge** — `conversation_participants` and `conversations` are not updated. Deleted user remains as participant. `getConversations` for other users would still include the conversation.

3. **No outbox pattern** — Cross-store changes are not event-driven. Block user → write to `blocks`; no event to invalidate Mongo read-path, Redis presence, or WebSocket state. Each subsystem would need to be updated manually.

4. **No message lifecycle model** — Messages have `expiresAt`, `viewOnce`, `ttlSeconds` but no explicit state machine (active → expired → soft-deleted → hard-deleted → retained-for-safety). Moderation evidence retention vs user deletion is not formally modeled.

5. **Block propagation** — `blocks` table is checked in discovery and whisper. Messaging does not explicitly check blocks before `createConversation` (relies on discovery not showing blocked users; but API could be called directly). No WebSocket "user_blocked" to disconnect or hide.

### 2.2 Recommended Architecture

**Phase 1 — Fix deletion orchestration:**

```
delete request
  → identity tombstoned (users.deleted_at)
  → moderation retention decision (if under investigation, retain messages)
  → Mongo: purge ALL messages in conversations where user is participant
  → Postgres: soft-delete or anonymize conversation_participants
  → media purge job
  → search/index purge (if any)
  → ledger entry (audit_logs)
```

**Phase 2 — Outbox pattern:**

- Write canonical DB change + event record in one transaction.
- Background worker consumes event; updates Mongo/Redis/WebSocket fanout deterministically.
- Idempotent handlers only.

**Domain events to introduce:**

- `UserDeleted`
- `UserBlocked`
- `ConsentWithdrawn`
- `SubscriptionChanged`
- `VenueCheckInStarted` / `VenueCheckOutCompleted`

**Data lifecycle table:** Every user-generated artifact needs explicit state (active, expired, soft-deleted, hard-deleted, under-investigation, retained-for-safety, anonymized). State transitions need rules.

### 2.3 Evidence: Where Cross-Store Logic Lives

| Action | Postgres | Mongo | Redis | WebSocket |
|--------|----------|-------|-------|-----------|
| Block user | `blocks` INSERT | — | — | — (no emit) |
| Delete account | `users.deleted_at`, `user_profiles` | `Message.deleteMany({ senderId })` only | — | — |
| Send message | `conversation_participants` unread | `Message` INSERT | — | `emitNewMessage` |
| Presence decay | `presence` DELETE | — | `presence:${userId}` DEL | `emitToUser(..., 'presence_expired')` |
| Wipe conversation | `conversation_participants` update | `Message.deleteMany({ conversationId })` | — | `emitToUser(..., 'conversation_wiped')` |

Block does not trigger any Mongo/Redis/WebSocket update. Deletion does not purge recipient-side messages.

---

## 3. Entitlement and Policy Drift

### 3.1 Current Architecture (Evidence)

**Where policy checks live:**

| Location | Check | Source |
|----------|-------|--------|
| `middleware/auth.ts` | `requireTier(0\|1\|2)` | JWT `tier` (verification_tier) |
| `middleware/auth.ts` | `requireFeature('vault'\|...)` | SubscriptionService.hasFeature |
| `discovery.controller.ts` | `tier === 'free' ? capFree : capPremium` | SubscriptionService.getSubscription |
| `initiation-cap.service.ts` | `CAP_BY_TIER[tier]` | SubscriptionService.getSubscription |
| `subscription.service.ts` | `TIERS`, `hasFeature`, `isPremium` | subscriptions table |
| `discovery.service.ts` | `me.seeking_verified_only OR u.verification_tier >= 1` | Inline in SQL |
| `venue-dashboard.routes.ts` | `requireTier(2)` + `requireVenueAccess` | Middleware |
| `events.routes.ts` | `requireTier(2)` for create | Middleware |
| `messaging.routes.ts` | `requireTier(0)` list, `requireTier(1)` create | Middleware |
| `verification.routes.ts` | `requireTier(1)` submit, `requireTier(2)` approve | Middleware |
| `users.routes.ts` | `requireTier(1)` like | Middleware |
| `venues.routes.ts` | `requireTier(2)` create, getMy | Middleware |
| `groups.routes.ts` | `requireTier(2)` create | Middleware |
| `references.routes.ts` | `requireTier(2)` create | Middleware |
| `series.routes.ts` | `requireTier(2)` create | Middleware |

**Two different "tier" concepts:**

1. **Verification tier** (`users.verification_tier`): 0=phone, 1=photo, 2=ID, 3=refs. Used for `requireTier`, blur/reveal, seeking_verified_only.
2. **Subscription tier** (`subscriptions.tier`): free, discreet, phantom, elite. Used for discovery cap, initiation cap, features (expandedRadius, noAds, etc.).

**Gaps identified:**

1. **No entitlements engine** — No single service that answers: "What can this actor do right now, on this surface, under this policy version?"

2. **Scattered conditionals** — `if premium`, `if venue owner`, `if host`, `if verified`, `if discovery cap reached` live in controllers, services, and SQL. Adding promo states, grandfathered plans, or region-specific flags would require edits in many places.

3. **UI/API drift risk** — Mobile and admin dashboard do not call a central "my entitlements" API. They infer from tier/subscription responses. If backend adds a new gate, frontend may not know.

4. **Cap math duplication** — Discovery cap and initiation cap both depend on subscription tier but are implemented separately. `discreet` tier gets `discoveryCapFree` in discovery but same cap in initiation-cap. If product changes "discreet gets 40," two places must change.

### 3.2 Recommended Architecture

**Entitlements engine contract:**

```
Input: userId, role(s), subscription state, verification state, venue/event/host context, feature flags, policy version
Output:
  canMessage: boolean
  canSeeBeyondCap: boolean
  canWhisper: boolean
  adsEnabled: boolean
  maxDiscoveryCount: number
  maxInitiationCount: number
  panicFeaturesEnabled: boolean
  venueDashboardAccess: boolean
  ...
```

**Non-negotiable:** Do not let product rules live as scattered `if` statements. Backend enforces via entitlements service; frontend renders from it; analytics logs against it; support/admin tools can inspect it.

---

## 4. Phased Remediation Roadmap

### Phase 1 — Stop-Ship Hardening (Already in progress)

From CSUITE_MASTER_AUDIT_REPORT:

- [x] Admin bypass restricted to NODE_ENV=test
- [x] OTP devCode never returned in production
- [x] VITE_ALLOW_BYPASS gates bypass button
- [ ] MongoDB deletion: purge messages in conversations where user is participant
- [ ] Stripe webhook: single raw handler, validate secrets
- [ ] METRICS_SECRET for /metrics
- [ ] Token storage: sessionStorage / SecureStore

### Phase 2 — Scale Spine (Next 4–8 weeks)

| Task | Owner | Effort |
|------|-------|--------|
| **Discovery pipeline** — Split candidate generation, policy filter, ranking, cap into distinct steps; centralize in DiscoveryPolicyService | Backend | 2–3 wks |
| **Deletion orchestration** — Purge Mongo messages in user's conversations; update conversation_participants; add retention policy for moderation | Backend | 1 wk |
| **Outbox pattern** — Introduce domain_events table; emit UserBlocked, UserDeleted; worker fans out to Mongo/Redis/WebSocket | Backend | 2–3 wks |
| **Entitlements engine** — Create EntitlementsService; consolidate tier, subscription, feature checks; expose GET /v1/me/entitlements | Backend | 2 wks |
| **Performance budgets** — Add p50/p95/p99, DB calls/request, cache hit rate for discovery | Backend | 3–5 days |

### Phase 3 — Observability

| Metric | Source |
|--------|--------|
| Presence freshness | Age of locations.updated_at, presence.expires_at |
| Discovery mismatch rate | Compare discovery result vs messageability (sample) |
| Entitlement decision diffs | Log when UI shows X but API rejects |
| Deletion completion | Success/fail per store (Postgres, Mongo, Redis) |
| Message lifecycle state counts | active, expired, deleted, retained |

### Phase 4 — Product Expansion

Only after Phase 2–3: groups, stories, venues, premium mechanics, growth loops, richer admin analytics.

---

## 5. File-Level Evidence Index

| Concern | Files |
|---------|-------|
| Discovery pipeline | `discovery.service.ts`, `discovery.controller.ts`, `presence.service.ts` |
| Initiation cap | `initiation-cap.service.ts`, `messaging.service.ts` |
| Subscription/tier | `subscription.service.ts`, `auth.service.ts`, `middleware/auth.ts` |
| Deletion | `compliance.service.ts`, `workers/index.ts` |
| Mongo messages | `message.model.ts`, `messaging.service.ts`, `session.service.ts` |
| Blocks | `users.service.ts`, `discovery.service.ts`, `whisper.service.ts` |
| WebSocket emits | `websocket/index.ts`, `presence.service.ts`, `messaging.service.ts`, `whisper.service.ts`, `session.service.ts`, `safety.service.ts` |
| requireTier/requireFeature | `auth.ts`, `messaging.routes.ts`, `events.routes.ts`, `venues.routes.ts`, etc. |

---

## 6. Conclusion

At 100k users, the biggest risk is **not** infra cost. It is:

> **Different parts of the system will start disagreeing about reality.**

Discovery says user A is visible; messaging says A is capped. Billing says active; entitlement cache says expired. Deletion says done; Mongo still has messages. Once that happens in a proximity-based social app, trust evaporates fast.

The move now is to convert the product from "a set of features" into "a set of deterministic policy engines" — with invariants, state machines, policy contracts, lifecycle tables, and explicit source-of-truth boundaries.

---

*Document generated from codebase audit. Update when architecture changes.*
