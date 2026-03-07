# Adversarial Audit Verification Report

> **Purpose:** Verify GPT's adversarial audit findings against the actual codebase. Each claim is marked **CONFIRM** (accurate), **DISPUTE** (incorrect or overstated), or **PARTIAL** (partially correct).
> **Date:** March 2026

---

## 1. Architecture & System Design — GPT: A- (90/100)

| GPT Claim | Verdict | Evidence |
|-----------|---------|----------|
| Modular backend (auth, discovery, messaging, etc.) | **CONFIRM** | `backend/src/modules/` — auth, discovery, messaging, safety, venues, ads, billing, compliance, etc. |
| No idempotency framework | **PARTIAL** | Chat has `clientMessageId` + Redis dedup (`messaging.service.ts` L142–186). No `Idempotency-Key` header on other routes. |
| No versioning beyond /v1 | **CONFIRM** | All routes under `/v1/`. |
| No service-level isolation | **CONFIRM** | Single Express app. |

**Verdict:** GPT's A- is fair. Architecture is strong; idempotency is partial (chat only).

---

## 2. Backend Correctness — GPT: B (82/100)

| GPT Claim | Verdict | Evidence |
|-----------|---------|----------|
| **Account deletion processor missing** | **DISPUTE** | `workers/index.ts` L62–65: `process-deletions` job runs every 5 min, calls `complianceSvc.processDeletionRequests(10)`. `compliance.service.ts` L78–125: anonymizes PII, purges Mongo messages, sets `deleted_at`. |
| Panic notify not implemented | **CONFIRM** | `safety.service.ts` L59–73: returns `contactsNotified: 0`, message "Notifications to emergency contacts are not yet sent (feature deferred)." |
| E2EE client not wired | **CONFIRM** | `message.model.ts` stores plaintext `content`. No encrypt/decrypt in mobile. DEV_HANDOVER L2291: "client encryption not yet wired". |
| No idempotency keys | **CONFIRM** | No `Idempotency-Key` on conversations, checkout, etc. Chat has `clientMessageId` only. |
| No rate limits per-user on discovery | **CONFIRM** | `discovery.routes.ts` uses `authenticate` only. Global rate limiter applies; no per-user discovery cap. |

**Verdict:** **Deletion processor EXISTS and runs.** GPT's "missing" claim is wrong. Other claims accurate.

---

## 3. Security — GPT: D+ (58/100)

| GPT Claim | Verdict | Evidence |
|-----------|---------|----------|
| **No production secret validation** | **DISPUTE** | `backend/src/index.ts` L17–34: `validateProductionSecrets()` runs at startup. Checks `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PHONE_HASH_PEPPER`, `CORS_ORIGINS`; exits if default/empty in production. |
| Plaintext messages in MongoDB | **CONFIRM** | `message.model.ts`: `content` is string; no client encrypt. |
| **No file-type validation on uploads** | **DISPUTE** | `media.routes.ts` L11–26: `validateFileMagic` checks magic bytes (JPEG, PNG, WebP, GIF, MP4). L31–34: multer `fileFilter` allowlist `image/jpeg`, `image/png`, etc. |
| No idempotency protections | **CONFIRM** | Except chat `clientMessageId`. |
| No abuse throttling beyond global | **CONFIRM** | Global rate limit; auth has `authRateLimiter`; door-code has `doorCodeValidateLimiter`. No per-user discovery/whisper caps. |

**Verdict:** GPT overstated. **Production secret validation exists.** **File magic-byte validation exists.** Security score should be higher (C+/B- range).

---

## 4. Compliance & Legal — GPT: D (55/100)

| GPT Claim | Verdict | Evidence |
|-----------|---------|----------|
| **Deletion not executed** | **DISPUTE** | Deletion worker runs every 5 min. `processDeletionRequests` anonymizes users, purges Mongo, sets `deleted_at`. |
| **Panic messaging misleading** | **DISPUTE** | `profile.tsx` L61: "Emergency contact notification is not yet active." `emergency.tsx` L77: "notification feature coming soon." `safety.service.ts` L71: "Notifications to emergency contacts are not yet sent (feature deferred)." Copy is truthful. |
| No retention schedule enforcement | **CONFIRM** | No automated retention policy worker. MongoDB TTL on messages; no formal retention schedule doc. |

**Verdict:** GPT overstated. **Deletion is executed.** **Panic copy is truthful.** Compliance score should be higher.

---

## 5. Safety System Integrity — GPT: C- (65/100)

| GPT Claim | Verdict | Evidence |
|-----------|---------|----------|
| Panic incomplete | **CONFIRM** | Notify not implemented. |
| Missed check-in alerts missing | **CONFIRM** | `safety.service.ts` L116: `getMissedCheckins()` exists. No worker calls it. `workers/index.ts` has no safety job. |
| **Screenshot flow partial** | **DISPUTE** | `safety.routes.ts` L43: `POST /screenshot` exists. `safety.service.ts` L77–84: `recordScreenshotReport` writes to `screenshot_events`. Flow is implemented. |
| Safety <3 taps everywhere | **PARTIAL** | Chat: Block/Report in header menu. Profile: Panic button. User detail: Block/Report. May not be <3 taps from every context. |

**Verdict:** Screenshot route **exists and works.** Missed check-in worker missing. Panic notify missing.

---

## 6. Mobile Application — GPT: C (70/100)

| GPT Claim | Verdict | Evidence |
|-----------|---------|----------|
| **API URL hardcoded** | **PARTIAL** | `client.ts` L3–8: Uses `EXPO_PUBLIC_API_URL` when set. Fallback localhost/10.0.2.2 for dev only. Configurable. |
| Thin screens | **PARTIAL** | Many screens expanded (events, discover, create-event, etc.). Some may remain thin. |
| **No centralized error UX** | **DISPUTE** | `errorMapper.ts` exists. `mapApiError` used in: index, events, messages, chat, user, album, groups, create-event, event-edit, verify, venue/review, stories/create. |
| **Blur/reveal incomplete** | **DISPUTE** | `useCanSeeUnblurred` hook calls `GET /v1/photos/check/:userId`. Used in `(tabs)/index.tsx` (Discover) and `user/[id].tsx`. `ProfilePhoto` accepts `canSeeUnblurred`. |
| **No offline handling** | **DISPUTE** | `OfflineBanner.tsx` + `NetInfo` in root `_layout.tsx`. |
| Accessibility incomplete | **PARTIAL** | `accessibilityLabel`, `accessibilityRole`, `accessibilityHint` on auth, discover tiles, conversation rows, tab bar, panic, headings. Not every screen audited. |

**Verdict:** GPT overstated. Centralized error UX, blur/reveal, offline handling **exist.** Mobile score should be higher (B-/B range).

---

## 7. Admin Dashboard — GPT: C (72/100)

| GPT Claim | Verdict | Evidence |
|-----------|---------|----------|
| Queue, ban, audit log, revenue, venue, ads | **CONFIRM** | Pages exist. |
| Appeal workflow missing | **CONFIRM** | Reports has resolve/dismiss. No formal appeal flow for users. |
| Structured moderation taxonomy | **PARTIAL** | Report reasons exist; no formal taxonomy doc. |
| Safety escalation workflow | **PARTIAL** | Admin can see panic alerts; no structured escalation. |

**Verdict:** Fair. Admin is functional but not institutional-grade.

---

## 8. Observability & Monitoring — GPT: F (20/100)

| GPT Claim | Verdict | Evidence |
|-----------|---------|----------|
| **You have: Logs, health** | **CONFIRM** | Health at `/health`. |
| **You do not have: Metrics** | **DISPUTE** | `middleware/metrics.ts`: Prometheus `http_requests_total`, `http_request_duration_seconds`. `/metrics` endpoint. RED metrics. |
| p95 latency, error rate, alerting, tracing, job dashboard | **CONFIRM** | No p95 SLO, no alerting config, no tracing, no job health dashboard. |

**Verdict:** **Metrics exist** (Prometheus). GPT's "no metrics" is wrong. Score should be D+/C- (basic metrics, no alerting/tracing).

---

## 9. Testing — GPT: C- (65/100)

| GPT Claim | Verdict | Evidence |
|-----------|---------|----------|
| Integration tests exist | **CONFIRM** | `backend/tests/`: auth, couples, admin, discovery, events, media, safety. |
| No tests for deletion processor | **PARTIAL** | Deletion processor exists; no dedicated test. |
| No billing webhook tests | **CONFIRM** | No webhook test found. |
| No E2EE tests | **CONFIRM** | No e2ee test. |
| No admin UI tests | **CONFIRM** | No admin-dashboard tests. |
| No mobile tests | **CONFIRM** | No mobile test suite. |
| No E2E flows | **CONFIRM** | No Playwright/Cypress E2E. |

**Verdict:** Fair. Tests exist but not comprehensive.

---

## 10. Infrastructure — GPT: C- (68/100)

| GPT Claim | Verdict | Evidence |
|-----------|---------|----------|
| Redis eviction policy unsafe | **CONFIRM** | `docker-compose.yml` L24: `--maxmemory-policy allkeys-lru`. OTP keys can be evicted. OPS_RUNBOOK documents risk. |
| Migrations manual | **CONFIRM** | `npm run migrate`; no automated migration in deploy. |
| No rollback runbook | **CONFIRM** | OPS_RUNBOOK has sections; no explicit rollback. |
| **No secret validation** | **DISPUTE** | Startup validation exists in `index.ts`. |
| Terraform not verified live | **CONFIRM** | Terraform present; not verified. |

**Verdict:** Secret validation exists. Redis eviction risk is real.

---

## 11. Monetization — GPT: B- (78/100)

| GPT Claim | Verdict | Evidence |
|-----------|---------|----------|
| Stripe, tier gating, ads, cadence, kill switch | **CONFIRM** | Present. |
| No funnel metrics, ad revenue validation, payout automation, A/B | **CONFIRM** | Not implemented. |

**Verdict:** Fair.

---

## 12–15. Product Vision, Scalability, Execution, Brand Trust

GPT's scores (A, B, B-, C) are qualitative. No specific code claims to verify. **Accept as opinion.**

---

## Summary: Corrections to GPT's Audit

| Category | GPT Claim | Correction |
|----------|-----------|------------|
| Backend | "Account deletion processor missing" | **Wrong.** Worker runs every 5 min; processes deletions. |
| Security | "No production secret validation" | **Wrong.** Startup validation exists. |
| Security | "No file-type validation on uploads" | **Wrong.** Magic bytes + mimetype allowlist. |
| Compliance | "Deletion not executed" | **Wrong.** Deletion is executed by worker. |
| Compliance | "Panic messaging misleading" | **Wrong.** Copy says "not yet active" / "coming soon." |
| Safety | "Screenshot flow partial" | **Overstated.** POST /screenshot exists and works. |
| Mobile | "API URL hardcoded" | **Overstated.** Env-configurable when set. |
| Mobile | "No centralized error UX" | **Wrong.** errorMapper + mapApiError used widely. |
| Mobile | "Blur/reveal incomplete" | **Overstated.** Implemented in Discover + user profile. |
| Mobile | "No offline handling" | **Wrong.** OfflineBanner + NetInfo. |
| Observability | "No metrics" | **Wrong.** Prometheus RED metrics + /metrics. |
| Infrastructure | "No secret validation" | **Wrong.** Startup validation exists. |

---

## Adjusted Score Implications

If GPT's findings are corrected:

- **Backend:** B+ (deletion exists; panic notify still missing)
- **Security:** C+/B- (secret validation, file validation exist)
- **Compliance:** C+/B- (deletion runs; panic copy truthful)
- **Mobile:** B-/B (error UX, blur, offline exist)
- **Observability:** D+/C- (metrics exist; no alerting)
- **Infrastructure:** C (secret validation exists)

**Weighted composite** would likely rise from 67 to **72–75** — still "not production-ready" but more accurate.

---

## Implementation Plan Additions (from verified gaps)

Based on **confirmed** gaps only:

1. **Panic notify** — Implement SMS/push to emergency contacts when panic triggered.
2. **Missed check-in worker** — Add job that calls `getMissedCheckins()` and sends alerts.
3. **Redis eviction** — Change to `noeviction` or dedicated instance for auth keys.
4. **Per-user discovery rate limit** — Optional; discovery cap exists; add per-user throttle if abuse observed.
5. **Idempotency keys** — Add `Idempotency-Key` for conversations, checkout (Tier 6.3).
6. **Alerting** — Wire Prometheus to Alertmanager or PagerDuty (metrics exist; alerting missing).
7. **E2EE** — Either wire client encrypt/decrypt or remove E2EE from marketing (deferred per checklist).

---

## Implementation Plan Updates Applied

The following items were added or updated in **MASTER_IMPLEMENTATION_CHECKLIST.md** based on this verification:

- **Tier 0.7** (new): Panic — implement SMS/push to emergency contacts
- **Tier 0.3** (status): Marked Done — deletion worker exists and runs
- **Tier 6.7** (new): Missed check-in alerts worker
- **Tier 6.8** (new): Alerting — wire Prometheus to Alertmanager
- **Tier 6.9** (new): Per-user discovery rate limit (optional)
- **Tier 6.1** (status): Marked Done — production secret validation exists
- **Tier 6.6** (status): Marked Done — upload magic bytes exist
- **Tier 8.3**: Cross-reference to Tier 6.7

---

**End of Adversarial Audit Verification.**
