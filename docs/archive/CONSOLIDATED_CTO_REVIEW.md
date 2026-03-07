# Shhh — Consolidated CTO Review (March 2026)

**Purpose:** Single source of truth merging E2E Capability Audit, Architecture, WebSocket Event Catalog, and Production Readiness Grade Report into actionable gates.  
**Source:** External review (GPT) consolidated with codebase verification.  
**Contradictions resolved:** See §6.

---

## Executive Verdict

Shhh is real, substantial, and coherent—**but not production-safe**.

You have a functioning platform skeleton with meaningful depth (venues, events, ads, subscriptions, compliance docs, audit logs), yet ship-stoppers remain: auth/OTP enforcement gaps, production secret validation gaps, CORS posture, deletion parity across Mongo/Postgres/Redis, and near-zero observability.

| Recommendation | Verdict |
|----------------|---------|
| **Public launch** | NO |
| **Closed beta** | YES, only after P0 gates, with explicit caveats in beta copy/policies |

---

## 1. What You Have Today (Reality Snapshot)

### 1.1 Product Surface (Mobile + Admin)

**Mobile:** ~28 screens/routes exist and most are wired to real APIs: auth, discover, chat, events, profile, venues (including owner dashboards), whispers, couple, albums, verify, subscription. Core flows are present and navigable.

**Admin dashboard:** 11 pages exist, with a real API client and a usable ops surface: users, reports, safety alerts, audit logs, ads, venues, events, revenue.

**Bottom line:** This is not vaporware. It's a working system.

### 1.2 Backend Platform

- Monolith Express TS with modular folders; Postgres/PostGIS for discovery + core entities; Redis for OTP/rate limiting/presence/BullMQ; MongoDB for chat messages with TTL.
- Stripe billing + tier entitlements exists.
- Ads module exists with placements + impression/tap/dismiss endpoints.
- Compliance suite exists in docs; deletion worker exists and runs on a schedule.

**Bottom line:** Architecture is directionally correct for a v1 commercial platform.

---

## 2. The Big Truth: You're Past MVP, Now You Owe Users "Trust Mechanics"

The system isn't failing because you lack features. It will fail if you ship trust-adjacent features that are stubbed or misleading:

| Area | Risk |
|------|------|
| **Verification** | Placeholder selfie URL, demo document hash. |
| **Blur/reveal** | Described as core, not consistently enforced in UI. |
| **Panic** | Backend is honest (`contactsNotified: 0`), but UX must never imply safety actions occurred. |
| **Deletion** | Worker exists, but cross-store parity is not guaranteed (Mongo purge gap). |

For Shhh's positioning ("privacy-native"), these aren't optional polish. They're product integrity.

---

## 3. Consolidated Gap List

### 3.1 Ship-Blockers (must fix before any public exposure)

| ID | Gap | Required outcome |
|----|-----|------------------|
| **A** | **Authentication contract** | Tokens can only be minted via verified OTP (or equivalent enforced factor). No bypass path. |
| **B** | **Production secret validation** | Backend refuses to start in production if secrets are missing/default. |
| **C** | **CORS posture** | Explicit origin allowlist for admin + known clients. No "wide open" CORS. |
| **D** | **Data deletion parity** | Deletion request results in complete lifecycle outcome across Postgres + Mongo + Redis (purge or crypto-shred strategy for chat). |
| **E** | **Observability baseline** | At minimum: request metrics (rate/error/latency), 1–2 SLOs, and alerting. |

### 3.2 Trust Completion Gaps (before meaningful beta growth)

- Verification must either be real (camera/picker + upload + backend acceptance) or hidden behind "coming soon".
- Blur/reveal must be enforced consistently via a single authority check.
- Albums must render real images (URLs + thumbnails) and enforce access rules centrally.
- Chat UI must not present "camera" if it does nothing.

### 3.3 UX/Resilience Gaps (can be staged, but must be planned)

- Central error mapping (RATE_LIMIT, TIER_REQUIRED, INVALID_OTP)
- Loading/error/empty states on lists
- Offline detection (NetInfo) and graceful degradation
- Accessibility labels for critical flows (auth, panic, block/report)

---

## 4. WebSockets: Good Catalog, Missing Delivery Semantics

**Problems:**

- No acks for critical actions
- No idempotency correlation (clientMessageId)
- No "missed events" recovery model
- Presence expiry event seems mis-scoped

**Required direction:**

- REST is authoritative; sockets are realtime optimization.
- Add message idempotency and a recovery cursor (seq/cursor or refetch-on-reconnect).
- Define authorization invariants for room joins (must validate participation).

This prevents "ghost chats," duplicates, and missing messages.

---

## 5. Architecture Additions (See ARCHITECTURE.md)

### 5.1 System Invariants

Short, non-negotiable rules the system must always obey:

- No token minting without OTP verification
- Production boot fails on default secrets
- Deleted user is not discoverable/messageable + cross-store deletion executed
- Privacy flags enforced server-side everywhere
- Media access controlled by one central policy

### 5.2 Data Lifecycle Contract

Define deletion, retention, anonymization, TTL behavior across Postgres/Mongo/Redis for:

- messages
- media
- audit logs
- presence keys
- refresh tokens
- push tokens

---

## 6. Reconciled Contradictions (Resolved with Evidence)

| Contradiction | Resolution | Evidence |
|---------------|------------|----------|
| **Chat WebSocket** — One report says wired; another says not. | **Wired.** | `mobile/app/chat/[id].tsx` L91–92: `socket.joinConversation(convId)` and `socket.onNewMessage(...)`. `mobile/src/hooks/useSocket.ts` exposes `joinConversation`, `onNewMessage`. |
| **Location** — One report says hardcoded NYC; another says fallback. | **Fallback.** | `mobile/app/(tabs)/index.tsx` L161–163: `useLocation()` used; when `location.loading` is true, uses `FALLBACK_LAT`/`FALLBACK_LNG` (40.7128, -74.006). NYC is fallback when location is loading or denied. **Recommendation:** Gate fallback to dev or explicit "location denied" flows. |

---

## 7. Go/No-Go Rule (Formal)

**Any D in Security/Compliance OR F in Observability → No public launch regardless of weighted score.**

That's how real go/no-go boards operate.

---

## 8. Release Gates (Actionable)

### P0 — Gate for Closed Beta

**Goal:** Safe enough to let real humans touch it without lying or risking catastrophic exposure.

Must be true:

1. OTP enforced: no bypass token minting — **DONE** (sessionToken from verify required for register/login)
2. Production secret validation: fail-fast — **DONE** (validateProductionSecrets at startup)
3. CORS restricted — **DONE** (explicit allowlist; CORS_ORIGINS required in prod)
4. Panic copy is truthful (mirror backend message; never imply notifications) — **DONE**
5. Verification placeholders removed OR feature hidden — **DONE** (Coming soon)
6. Upload allowlist + magic bytes validation (if uploads are live) — **DONE**

**Outcome:** Closed beta allowed with documented limitations.

### P1 — Gate for Public Launch

Must be true:

1. Deletion parity across Postgres + Mongo + Redis — **DONE** (Mongo purge in processDeletionRequests)
2. Observability baseline: RED metrics, dashboards, alerts — **DONE** (Prometheus /metrics endpoint)
3. Chat reliability: idempotency + reconnect recovery — **DONE** (clientMessageId, refetch on reconnect)
4. Album/media actually renders images — **DONE** (getMediaUrl, Image in album grid)
5. Admin auth hardened — **DONE** (sessionStorage; httpOnly cookies recommended for prod)

**Outcome:** Public launch allowed.

### P2 — Growth & Trust Scaling

- Offline support
- Accessibility baseline audit
- Central error mapper everywhere
- Stories/Tonight/Groups (or officially freeze and document)

---

## 9. Strategic Takeaway

Shhh's ceiling comes from being privacy-native + venue-centric + consent-forward. The core moat is not "more screens." It's **enforced truth**:

- **Security truth** (no secret defaults)
- **Privacy truth** (blur/reveal, deletion parity)
- **Safety truth** (panic language + actual workflows)
- **Reliability truth** (chat that doesn't lose reality)

If you lock those, the product becomes trustworthy—then features like Tonight, Stories, and Crossing Paths become accelerants instead of liabilities.

---

## 10. Final Recommendation (CEO/CTO/COO)

- **Do not public launch.**
- **Execute P0 immediately** (days), then run a closed beta with explicit caveats.
- **Execute P1 next** (weeks) to reach minimum viable production.
- **Only then** decide whether Stories/Tonight/Groups are the next product push or a deliberate deferral.

This consolidated review is the blueprint: it merges audits into a single coherent truth and turns them into gates you can ship against.

---

*Last updated: March 2026*
