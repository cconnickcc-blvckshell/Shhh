# Shhh — Production Readiness Grade Report

**Classification:** Internal — Principal Architect / CTO  
**Date:** March 2026  
**Scope:** End-to-end commercial for-profit app assessment (backend, mobile, admin, infra, compliance, UX, monetization).  
**Tone:** Realistic, not optimistic. Grades reflect what exists today, not roadmap.  
**Audience:** CEO, CTO, COO — decision support with proof, suggestions, and future roadmap.

---

## Document Map (Executive Navigation)

| Section | For | Purpose |
|---------|-----|---------|
| Executive Summary | All | One-page overview |
| §1–10 Dimension grades | CTO | Technical detail with proof |
| §11–14 Scores & conclusion | All | Final numbers and recommendation |
| **§15 Proof Appendix** | CTO / Legal | File paths, line numbers, code evidence |
| **§16 Concrete Suggestions** | CTO / Engineering | Actionable fixes with effort |
| **§17 Future Implementation Ideas** | CEO / Product | Roadmap backlog |
| **§18 Executive Decision Framework** | CEO / CTO / COO | Go/no-go, cost, risk, options |
| **§19 Related Documents** | All | Links to other audits and checklists |

---

## Executive Summary

| Dimension | Grade | One-line verdict |
|-----------|-------|-----------------|
| **Backend core** | C+ | Feature-rich; gaps: panic notify, E2EE, prod secrets, MongoDB purge. |
| **Mobile app** | C | Core flows work; many screens partial; location/WebSocket done per checklist. |
| **Admin dashboard** | C | Pages exist; no tests, no appeal flow, no per-screen UX audit. |
| **Infrastructure** | C- | Docker + Terraform present; no prod validation, migrations manual, Redis eviction risk. |
| **Security** | D+ | No prod secret check, plaintext messages, upload validation weak. |
| **Compliance / Legal** | D | Deletion worker exists; MongoDB purge gap; panic copy; policy–system parity. |
| **Testing** | D | Backend tests exist (7 suites) but require Docker; mobile/admin zero automated tests. |
| **Observability** | F | Logs only; no metrics, tracing, SLOs, or alerting. |
| **Monetization** | C | Stripe + ads implemented; checkout UX broken, no in-app browser; ad revenue not validated. |
| **UX / Polish** | D+ | No error UI on many screens, no loading states, no offline, a11y not audited. |

**Overall production readiness: 48/100 — Not ready for public launch.**

### CEO / COO TL;DR

- **Launch?** No. Fix P0 (secrets, Redis, panic copy, verify) + add metrics first.
- **Closed beta?** Yes, with documented caveats (panic, verification, E2EE).
- **Time to production-ready:** ~3–4 weeks (1–2 engineers).
- **Biggest risks:** Weak prod secrets; no observability; E2EE expectation mismatch.
- **Revenue path:** Subscription checkout fixed; ads in Discover (backend ready, mobile gap).

### Formal Go/No-Go Rule

**Any D in Security/Compliance OR F in Observability → No public launch regardless of weighted score.**

Current: Security D+, Compliance D, Observability F → **No launch.**

---

## 1. Backend

### 1.1 What works

- Auth: phone OTP (Twilio/devCode), JWT + refresh, RBAC (tier, role).
- Discovery: PostGIS, Redis cache, location fuzzing, blocks filtered.
- Messaging: conversations, MongoDB TTL, panic wipe, WebSocket events.
- Presence, intents, personas: state machine, decay worker.
- Venues, events, ads, safety (contacts, check-in, panic), compliance (export, deletion request, consent).
- Admin: moderation queue, reports, ban, audit logs, extended admin.
- Media: upload, Sharp, albums, share/revoke, self-destruct.
- Billing: Stripe checkout, webhook, tier features.
- API: Zod validation, error handler, rate limiting, Swagger.

### 1.2 Critical gaps

| Gap | Impact | Evidence |
|-----|--------|----------|
| Account deletion | Worker exists and runs every 5m. Gaps: MongoDB messages not purged per user; verify worker in prod | `workers/index.ts` L62–65, 86; `compliance.service.ts` L80–119 anonymizes users only |
| Panic does not notify contacts | API returns `contactsNotified: 0` and honest message; mobile must not claim otherwise | `safety.service.ts` L67–72: no Twilio/push |
| Messages plaintext in MongoDB | Privacy expectation mismatch; E2EE implied | `message.model.ts`; no client encrypt/decrypt |
| No production secret validation | Weak JWT/pepper in prod if misconfigured | `config/index.ts` has defaults; no startup check |
| Redis eviction `allkeys-lru` | OTP/cooldown keys evicted under memory pressure | `docker-compose.yml` |
| No idempotency keys | Duplicate conversations, double checkout | No `Idempotency-Key` handling |
| Missed check-in worker | No alerts when user misses check-in | `getMissedCheckins()` exists; no job calls it |

### 1.3 Grade: C+ (72/100)

**Rationale:** Core flows are implemented and testable. Architecture is sound. Critical compliance and safety gaps prevent a higher grade.

---

## 2. Mobile App

### 2.1 What works

- Auth: login, register, OTP, onboarding, intent.
- Tabs: Discover, Messages, Events, Me.
- Profile: edit, emergency, privacy, status, hosting, venues.
- Venue owner: dashboard, edit, specials, staff.
- Event: detail, RSVP.
- User profile: like, message, whisper, block, report.
- Couple: create, link, dissolution.
- Whispers: inbox/sent, respond, ignore.
- Album: list, create, share/revoke (media grid placeholder only).
- Verify: status (photo/ID stubs).
- Subscription: GET subscription, POST checkout (Alert only, no browser).

### 2.2 Critical gaps

| Gap | Impact | Evidence |
|-----|--------|----------|
| Chat has no WebSocket | No real-time messages, typing, read receipts | `useSocket` exists; chat screen does not use it |
| Location hardcoded (40.7128, -74.006) | Discovery/events show wrong location | `(tabs)/index.tsx`, `events.tsx` |
| No error UI on most screens | Silent failures; poor UX | Discover, Messages, Events, Chat, Album, User |
| No loading indicators | Blank screens until data arrives | Many screens |
| Verify: placeholder URL / demo hash | Verification flow fake | `verify/index.tsx` |
| Subscription: no in-app browser | Checkout URL in Alert only | `subscription/index.tsx` |
| Album: placeholder icons only | No actual images in grid | `album/[id].tsx` |
| API base hardcoded | Real devices need configurable URL | `client.ts` localhost / 10.0.2.2 |
| No blur/reveal in discovery | Core product feature missing | No `GET /v1/photos/check/:userId` |
| No offline detection | No banner, no queue | No NetInfo |
| No accessibility audit | Unknown a11y compliance | No labels, live regions, etc. |

### 2.3 Not implemented (backend exists)

- Stories, Tonight feed, Groups, Content (guides/norms).
- Venue grid, Ads in Discover, Event edit, Door code.
- Blur/reveal, at_event presence, this-week events.

### 2.4 Grade: C (70/100)

**Rationale:** Core flows exist. Many screens are thin or broken. Real-time chat and location are table stakes for a dating/social app and are not delivered.

---

## 3. Admin Dashboard

### 3.1 What works

- 11 pages: Login, Dashboard, Users, Revenue, Venues, Ads, Events, Reports, Safety, Audit, Settings.
- API client with JWT; calls backend admin routes.
- Layout with sidebar nav.

### 3.2 Gaps

- No automated tests.
- No appeal/dispute flow for bans.
- No per-screen UX template (loading, error, a11y).
- Safety page shows data but no workflow for panic/missed check-ins.
- No quorum or approval chain for destructive actions.

### 3.3 Grade: C (70/100)

**Rationale:** Functional for internal use. Not production-hardened for trust & safety operations.

---

## 4. Infrastructure

### 4.1 What works

- Docker Compose: Postgres (PostGIS), Redis, MongoDB; healthchecks.
- CI: lint, typecheck, test, build on `main`; admin build.
- Terraform: VPC, ALB, ECS, RDS, ElastiCache.

### 4.2 Gaps

- No env validation at startup (prod can run with defaults).
- Migrations manual; not in deploy pipeline.
- Redis eviction policy risky for auth keys.
- No rollback or multi-region documented.
- Terraform not run/verified in audit.

### 4.3 Grade: C- (65/100)

**Rationale:** Infra exists. Production hardening and ops discipline are missing.

---

## 5. Security

### 5.1 What works

- Phone/email hashed (HMAC-SHA256 + pepper).
- JWT + refresh; admin actions logged.
- Helmet, CORS, Multer 20MB limit.
- E2EE key storage API (server-side only).

### 5.2 Gaps

- No prod secret validation.
- Messages plaintext in MongoDB.
- Upload: no file-type allowlist or magic-bytes check.
- No per-user rate limit on discovery/whisper.

### 5.3 Grade: D+ (58/100)

**Rationale:** Basic hygiene present. Critical gaps (secrets, E2EE, upload validation) are high risk.

---

## 6. Compliance / Legal

### 6.1 What works

- Policy suite comprehensive (ToS, Privacy, AUP, DMCA, etc.).
- Policies aligned with product philosophy.
- Deletion request recorded; export implemented; consent recorded.

### 6.2 Gaps

- Deletion worker exists (every 5m); MongoDB messages not purged per deleted user; backup retention not automated.
- Panic API is honest; mobile copy must not imply "contacts notified."
- Policy–system parity matrix shows multiple high/medium risks.
- No retention schedule enforced in code for audit_logs, messages.

### 6.3 Grade: D (55/100)

**Rationale:** Policies are strong. Execution lags; over-promising creates legal exposure.

---

## 7. Testing

### 7.1 What exists

- Backend: 7 Jest suites (auth, discovery, events, couples, safety, admin, media).
- Tests require Docker (Postgres, Redis, MongoDB).
- CI runs tests on `main` with services.
- Load tests: k6 smoke/stress in `loadtest/`.

### 7.2 Gaps

- Mobile: zero automated tests (no Jest, Detox, E2E).
- Admin: zero automated tests.
- Backend tests fail locally without Docker.
- No coverage reporting.
- No E2E tests for critical flows (auth → discover → chat).

### 7.3 Grade: D (55/100)

**Rationale:** Backend has tests; frontends have none. Coverage and E2E are absent.

---

## 8. Observability

### 8.1 What exists

- Pino logger; level from config.
- Health endpoint: status, timestamp, version, modules.

### 8.2 Gaps

- No metrics (request rate, latency, error rate).
- No tracing (OpenTelemetry, correlation ids).
- No alerting or SLOs.
- No dashboard (Grafana, etc.).

### 8.3 Grade: F (40/100)

**Rationale:** Logs only. Cannot validate SLOs or debug production without instrumentation.

---

## 9. Monetization

### 9.1 What works

- Stripe: checkout, webhook, tier features.
- Ads: four surfaces, cadence, kill switch, targeting, CPM.

### 9.2 Gaps

- Checkout: Alert with URL only; no `Linking.openURL`.
- No in-app refresh of tier after webhook.
- Ad revenue flow not validated (payouts manual).
- No A/B or density control for ads.

### 9.3 Grade: C (70/100)

**Rationale:** Plumbing exists. UX and revenue validation are incomplete.

---

## 10. UX / Polish

### 10.1 What works

- Dark theme, fingerprint branding.
- Tab navigation, forms, lists.
- Auth flow, profile flows.

### 10.2 Gaps

- No error UI on many screens.
- No loading indicators.
- No offline banner.
- No central error mapper (RATE_LIMIT, TIER_REQUIRED, etc.).
- Accessibility not audited.
- Venue: Share/Review no-op; upcoming events tap wrong.
- Chat: camera button no handler.

### 10.3 Grade: D+ (58/100)

**Rationale:** Core flows navigable. Resilience and polish are missing.

---

## 11. Weighted Overall Score

| Dimension | Weight | Grade (0–100) | Weighted |
|-----------|--------|---------------|----------|
| Backend | 25% | 72 | 18.0 |
| Mobile | 20% | 70 | 14.0 |
| Admin | 5% | 70 | 3.5 |
| Infrastructure | 10% | 65 | 6.5 |
| Security | 15% | 58 | 8.7 |
| Compliance | 10% | 55 | 5.5 |
| Testing | 5% | 55 | 2.75 |
| Observability | 5% | 40 | 2.0 |
| Monetization | 3% | 70 | 2.1 |
| UX/Polish | 2% | 58 | 1.16 |

**Weighted total: 62.01 / 100**

Adjusted for **ship-blockers** (deletion, panic, E2EE claim, prod secrets):

**Effective production readiness: 48/100**

---

## 12. Ship-Blocker Summary

Before any public launch (including soft launch):

1. **Verify deletion in prod** — Worker exists (`process-deletions` every 5m). Confirm it runs in prod; consider MongoDB message purge for deleted users.
2. **Fix panic copy or implement notify** — API is honest (`contactsNotified: 0`). Ensure mobile UI never says "contacts notified."
3. **Production secret validation** — Fail fast if JWT_SECRET, PHONE_HASH_PEPPER are default in prod.
4. **Chat WebSocket** — Per MASTER_IMPLEMENTATION_CHECKLIST 1.11 Done; verify in build.
5. **Location from device** — Per checklist 1.1, 1.7 Done; verify fallback behavior when location denied.

---

## 13. Comparison to Industry Benchmarks

| Benchmark | Shhh | Typical production app |
|-----------|------|------------------------|
| Backend test coverage | ~7 suites, no coverage % | 70%+ unit, integration, E2E |
| Frontend tests | 0 | Jest + E2E (Cypress/Detox) |
| Observability | Logs only | Metrics, tracing, alerting, SLOs |
| GDPR deletion | Request only | Executed within 30 days |
| E2EE | Server keys only | Client encrypt/decrypt or not claimed |
| Error handling | Many silent | Every path has user feedback |
| Accessibility | Not audited | WCAG 2.1 AA for critical flows |

---

## 14. Conclusion

Shhh has a **solid foundation**: feature-rich backend, coherent architecture, thoughtful policies, and a mobile app that covers most screens. The gap between "what exists" and "what a commercial for-profit app must deliver before production" is significant.

**Strengths:** Architecture, policy suite, core API surface, admin tooling, Stripe/ads plumbing.

**Weaknesses:** Compliance execution (deletion), safety honesty (panic), security (secrets, E2EE), observability, frontend resilience, testing breadth.

**Recommendation:** Do not launch publicly until P0 ship-blockers are resolved and at least basic observability (metrics + 1–2 SLOs) is in place. A closed beta with informed users who accept known limitations may be acceptable.

---

## 15. Proof Appendix (Evidence for Every Claim)

Evidence is file path + line number or code snippet. Verifiable by grepping the repo.

### 15.1 Backend — Critical Gaps

| Claim | Proof |
|-------|-------|
| **Account deletion** | Worker **exists** and runs every 5m. `backend/src/workers/index.ts` L62–65, L86: `process-deletions` job calls `complianceSvc.processDeletionRequests(10)`. `compliance.service.ts` L80–119: anonymizes PII, sets `users.deleted_at`. **Status: IMPLEMENTED.** |
| **Panic "contacts notified"** | `backend/src/modules/safety/safety.service.ts` L67–72: returns `contactsNotified: 0`, `message: 'Panic recorded. Notifications to emergency contacts are not yet sent (feature deferred).'` API is honest. Mobile UI must not claim otherwise. |
| **Messages plaintext** | `backend/src/modules/messaging/message.model.ts`: `content` stored as string; no encrypt/decrypt. `mobile/src` has no encrypt before send or decrypt after receive. |
| **No prod secret validation** | `backend/src/config/index.ts` L24–26: `JWT_SECRET` defaults to `'dev-jwt-secret'`; `backend/src/utils/hash.ts` L3: `PHONE_HASH_PEPPER` defaults to `'shhh-dev-pepper-change-in-production'`. No startup check for `NODE_ENV=production`. |
| **Redis eviction** | `docker-compose.yml` L24: `--maxmemory-policy allkeys-lru`. OTP and cooldown keys can be evicted under memory pressure. OPS_RUNBOOK.md L49–50 documents this risk. |
| **No idempotency** | `grep -r "Idempotency-Key\|idempotency" backend/src` returns nothing. |
| **Missed check-in worker** | `safety.service.ts` has `getMissedCheckins()`; `workers/index.ts` has no job that calls it or sends alerts. |

### 15.2 Mobile — Critical Gaps

| Claim | Proof |
|-------|-------|
| **Chat WebSocket** | MASTER_IMPLEMENTATION_CHECKLIST marks 1.11 Done. `mobile/app/chat/[id].tsx` and `useSocket` — verify `joinConversation`, `onNewMessage` are wired. |
| **Location** | `mobile/app/(tabs)/index.tsx` L161–163: `useLocation()` used; `lat/lng` from location or `FALLBACK_LAT/LNG` when loading. Events tab: 1.7 Done per checklist. |
| **API base** | `mobile/src/api/client.ts` L3–8: `EXPO_PUBLIC_API_URL` used when set; fallback `localhost` (web) or `10.0.0.2.2` (Android emulator). Configurable for prod builds. |
| **Verify placeholder** | `mobile/app/verify/index.tsx`: check for `selfieUrl: 'https://placeholder.com/...'` or `documentHash: 'demo_...'`. |
| **Album placeholder** | `mobile/app/album/[id].tsx`: media grid shows icon only; no image URLs. |
| **Blur/reveal** | `useCanSeeUnblurred` exists in Discover; `GET /v1/photos/check/:userId` or equivalent must be called. Checklist 3.1–3.2 Todo. |

### 15.3 Infrastructure

| Claim | Proof |
|-------|-------|
| **Docker Compose** | `docker-compose.yml`: Postgres (PostGIS), Redis, MongoDB; healthchecks. |
| **CI** | `.github/workflows/ci.yml`: backend lint, typecheck, test, build; admin tsc + vite build. Triggers on `main`. |
| **Terraform** | `terraform/*.tf`: main, ecs, alb, vpc, database, variables, outputs. |
| **Migrations manual** | OPS_RUNBOOK.md: "Run migrations" is manual step; no pipeline automation. |

### 15.4 Compliance / Policy

| Claim | Proof |
|-------|-------|
| **Policy–system parity** | `docs/policies/POLICY_SYSTEM_PARITY_MATRIX.md`: deletion "partial" (worker exists; matrix may be outdated); panic "no" for notify; missed check-in "no". |
| **Deletion in policy** | Privacy Policy: "we aim to" and timeframes. Deletion worker processes within 5m schedule. |

---

## 16. Concrete Suggestions (Actionable Fixes)

Each item: **What** | **Where** | **Effort** | **Test**

### 16.1 P0 — Ship Blockers (Before Any Launch)

| # | Suggestion | Location | Effort | Verification |
|---|------------|----------|--------|--------------|
| 1 | **Production secret validation** | `backend/src/config/index.ts` or `index.ts` startup | S (2–4h) | If `NODE_ENV=production` and `JWT_SECRET`/`PHONE_HASH_PEPPER` are default → process exits with clear error. |
| 2 | **Redis eviction** | `docker-compose.yml` L24; Terraform Redis config | S (1h) | Change to `noeviction` or dedicated instance for auth keys. |
| 3 | **Panic mobile copy** | Mobile panic success message | S (1h) | Ensure UI never says "contacts notified"; use API message. |
| 4 | **Verify placeholder removal** | `mobile/app/verify/index.tsx` | M (4–8h) | Camera/picker → upload → pass real URL; or hide ID flow and document "coming soon". |

### 16.2 P1 — Trust & Retention (Before Beta)

| # | Suggestion | Location | Effort | Verification |
|---|------------|----------|--------|--------------|
| 5 | **Missed check-in worker** | `backend/src/workers/index.ts` | M (4–8h) | New job; call `getMissedCheckins()`; send push/SMS; set `alert_sent`. |
| 6 | **Admin appeal flow** | New route `POST /v1/appeals`; admin UI | L (2–3d) | Ban → appeal → admin view → approve/reject. |
| 7 | **Upload file-type validation** | `backend/src/modules/media/media.routes.ts` | S (2–4h) | Magic bytes or allowlist; reject non-image/video with 400. |
| 8 | **Observability (metrics)** | `backend/src`: middleware for request duration + status | M (1–2d) | Prometheus or CloudWatch; at least `/health`, `/v1/discover` p95. |

### 16.3 P2 — UX & Polish

| # | Suggestion | Location | Effort | Verification |
|---|------------|----------|--------|--------------|
| 9 | **Central error mapper** | `mobile/src/api/` or shared hook | M (4–8h) | Map RATE_LIMIT, TIER_REQUIRED, INVALID_OTP → user-facing copy. |
| 10 | **Offline detection** | `mobile/app/_layout.tsx` or provider | M (4–8h) | NetInfo; banner when offline; "try when back online" for mutations. |
| 11 | **Album thumbnails** | `mobile/app/album/[id].tsx` + API | M (4–8h) | Use media URLs or thumbnail endpoint; no placeholder icons. |
| 12 | **Blur/reveal in discovery** | `(tabs)/index.tsx`; `GET /v1/photos/check/:userId` | M (4–8h) | Pass `canSeeUnblurred` to ProfilePhoto. |

### 16.4 Effort Legend

- **S** = Small (1–4h)
- **M** = Medium (4h–2d)
- **L** = Large (2–5d)

---

## 17. Future Implementation Ideas (Roadmap Backlog)

From `docs/GAME_CHANGER_ROADMAP.md`, `docs/ENHANCEMENT_ROADMAP.md`, `docs/MASTER_IMPLEMENTATION_CHECKLIST.md`. Prioritized by impact and backend readiness.

### 17.1 Backend Ready — Mobile UI Gap

| Idea | Backend | Mobile | Impact | Notes |
|------|---------|--------|--------|-------|
| **Tonight feed** | `GET /v1/tonight` | No tab/screen | High | Events + venues with live check-in; social calendar. |
| **Stories** | `GET /v1/stories/nearby`, POST, view | No row/screen | High | Stories row on Explore; create/view. |
| **Groups (tribes)** | `GET/POST /v1/groups`, join | No UI | Medium | List groups, join, view group events. |
| **Venue grid** | `GET /v1/venues/:id/grid` | Not shown | Medium | Venue detail grid section. |
| **Ads in Discover** | Ad placements, impressions | VenueAdCard not used | Medium | Render ad placements in Discover. |
| **Event edit** | `PUT /v1/events/:id` | No screen | Medium | Host edit event (title, door code, etc.). |
| **Crossing paths** | `GET /v1/discover/crossing-paths` | No UI | High | "You've both been at [Venue] — say hi?" |
| **Verified safe venue badge** | `verifiedSafe` | Not shown | Medium | Badge on venue cards. |
| **Consent as product** | `GET conversations` returns consentState | No UI | Medium | Show "Revoke anytime" in chat. |

### 17.2 Product Differentiation (Moat)

| Idea | Source | Effort | Rationale |
|------|--------|--------|-----------|
| **Venue density intelligence** | GC-1.4 | M | Peak times, event-type performance; venue dashboard. |
| **Two-layer profile** | GC-3.2 | M | Public vs after_reveal; discovery shows SFW until reveal. |
| **Tonight-only / burn persona** | GC-5.5 | M | Persona with `expires_at`, `is_burn`. |
| **"Why am I seeing this ad?"** | GC-N.5 | S | Modal explaining placement. |
| **Distress to venue security** | GC | S | POST /v1/safety/venue-distress when checked in. |

### 17.3 Deferred (Record Only)

- E2EE on wire (client encrypt/decrypt) — server keys exist; client not wired.
- Voice drops, burner/relay number.
- Revenue share / white-label; tickets and gates (Eventbrite/Stripe).

---

## 18. Executive Decision Framework

### 18.1 CEO — Strategic Questions

| Question | Answer | Implication |
|----------|--------|-------------|
| **Can we launch now?** | No. P0 ship-blockers and observability gap. | Delay public launch until P0 + basic metrics. |
| **Can we do a closed beta?** | Yes, with caveats. | Users must accept: panic does not notify contacts; verification is placeholder; no E2EE. Document in beta ToS. |
| **What's the fastest path to revenue?** | Fix subscription checkout UX (already done per checklist); ensure Stripe webhook and tier refresh. Ads in Discover (backend ready; mobile UI gap). | Prioritize 1.18, 1.19, 4.7. |
| **What differentiates us?** | Privacy-first, consent-forward, retreat, venue-centric. | Invest in Tonight feed, crossing paths, verified safe venue, two-layer profile. |

### 18.2 CTO — Technical Decisions

| Decision | Options | Recommendation |
|----------|---------|-----------------|
| **Observability** | (A) Prometheus + Grafana self-hosted (B) CloudWatch (C) Datadog/New Relic | (B) if AWS; (A) if cost-sensitive. Start with request duration + status by route. |
| **E2EE** | (A) Implement client encrypt/decrypt (B) Remove E2EE from marketing (C) Defer | (B) for now; (A) for v2 if privacy is a core sell. |
| **Panic notify** | (A) Implement Twilio SMS + push (B) Keep "not yet sent" message | (A) if safety is critical; (B) for MVP with clear copy. |
| **Deletion** | Worker exists | Verify worker runs in prod; document purge order for MongoDB messages. |

### 18.3 COO — Operational Readiness

| Area | Status | Action |
|------|--------|--------|
| **On-call** | No runbook for alerts | Add 2–3 SLOs (health, p95 discover); wire to PagerDuty/Slack. |
| **Migrations** | Manual | Add migration step to deploy pipeline or document and automate. |
| **Rollback** | Not documented | Document: revert ECS task def; no automatic DB rollback. |
| **Secrets** | No validation | Add startup check; fail fast. |

### 18.4 Cost / Effort Summary (Rough)

| Phase | Scope | Effort |
|-------|-------|--------|
| **P0** | Prod secrets, Redis, panic copy, verify placeholder | 1–2 days |
| **P1** | Missed check-in, appeal, upload validation, metrics | 1 week |
| **P2** | Error mapper, offline, album thumbnails, blur/reveal | 1–2 weeks |
| **Observability** | Metrics + 2 SLOs + alerting | 2–3 days |

**Total to "minimum viable production":** ~3–4 weeks for 1–2 engineers.

### 18.5 Risk Mitigation Options

| Risk | Mitigation |
|------|------------|
| **GDPR deletion** | Worker implemented; verify in prod; add integration test; consider MongoDB message purge. |
| **Panic false assurance** | API already honest; audit mobile copy. |
| **Weak secrets** | Add startup validation; fail fast. |
| **No observability** | Add metrics + 1–2 SLOs before any traffic. |
| **E2EE expectation** | Do not market as E2EE; document "server-side keys only" in Privacy Policy. |

### 18.6 External Service Costs (Rough, for COO)

| Service | Purpose | Est. monthly (low traffic) |
|---------|---------|----------------------------|
| AWS (ECS, RDS, ElastiCache) | Hosting | $200–500 |
| Twilio | OTP, panic SMS (if implemented) | $50–200 |
| Stripe | Subscriptions | % of revenue |
| CloudWatch / Datadog | Metrics, alerting | $0–100 (CloudWatch free tier) |
| Push (FCM/APNs) | Notifications | Free |

---

## 19. Related Documents

| Document | Purpose |
|----------|---------|
| `docs/SYSTEM_REALITY_REPORT.md` | CTO technical audit; capability matrix |
| `docs/SYSTEM_REALITY_REPORT_APPENDICES.md` | Route matrix, schema, threat model, runbook |
| `docs/E2E_CAPABILITY_AUDIT_REPORT.md` | Mobile/admin/backend capability audit |
| `docs/MASTER_IMPLEMENTATION_CHECKLIST.md` | 72 actionable items; progress tracking |
| `docs/GAME_CHANGER_ROADMAP.md` | Future product ideas; backend-ready features |
| `docs/policies/POLICY_SYSTEM_PARITY_MATRIX.md` | Policy vs system capability mapping |
| `docs/OPS_RUNBOOK.md` | Incident response, debugging, migrations |
| `docs/CONSOLIDATED_CTO_REVIEW.md` | Single source of truth; P0/P1 gates; contradictions resolved |

---

*Last updated: March 2026*
