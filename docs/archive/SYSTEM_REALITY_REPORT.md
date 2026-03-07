# Shhh — System Reality Report (CTO Audit)

**Classification:** Internal — Principal Architect + Product Critic  
**Date:** February 2026  
**Scope:** Full stack (backend, mobile, admin, infra); evidence-based only.

---

## Repo structure and entrypoints

| Package | Entrypoint | Key paths |
|--------|------------|-----------|
| Backend | `backend/src/index.ts` | `createApp()` in `backend/src/app.ts`; workers in `backend/src/workers/index.ts`; WebSocket in `backend/src/websocket/index.ts` |
| Admin | `admin-dashboard/src/main.tsx` | Routes in `admin-dashboard/src/App.tsx`; API client `admin-dashboard/src/api/client.ts` |
| Mobile | Expo entry `mobile/app/_layout.tsx` | Tab layout `mobile/app/(tabs)/_layout.tsx`; auth store `mobile/src/stores/auth.ts`; API `mobile/src/api/client.ts` |
| Infra | `docker-compose.yml` (root) | Terraform: `terraform/main.tf`, `ecs.tf`, `database.tf`, `alb.tf`, `vpc.tf` |
| CI | `.github/workflows/ci.yml` | Backend lint/typecheck/test/build; admin-dashboard build |

---

# 1) Executive Summary

## What the system can do today

- **Auth:** Phone-based registration/login with JWT + refresh rotation; OTP send/verify (Twilio in prod, `devCode` in dev); Argon2id not used for phone-only flow (no password in seed/auth). Evidence: `backend/src/modules/auth/auth.service.ts`, `auth.routes.ts`, `otp.service.ts`.
- **RBAC & tiers:** `authenticate`, `requireTier(0|1|2)`, `requireRole('moderator'|'admin')` applied on routes; admin actions logged to `admin_actions`. Evidence: `backend/src/middleware/auth.ts`, `adminAuth.ts`; route usage across `backend/src/modules/*/**.routes.ts`.
- **Discovery:** PostGIS `ST_DWithin` + Redis 30s cache; location fuzzing (300 m); blocks and deleted users filtered. Evidence: `backend/src/modules/discovery/discovery.service.ts`.
- **Messaging:** Conversations in Postgres; messages in MongoDB with TTL index; panic wipe; session TTL; WebSocket `new_message`, typing, read receipts. Evidence: `backend/src/modules/messaging/messaging.service.ts`, `message.model.ts`, `session.service.ts`; `backend/src/websocket/index.ts`.
- **Presence, intents, personas:** State machine, decay worker (60s), persona slots by subscription. Evidence: `backend/src/modules/discovery/presence.service.ts`, `backend/src/modules/users/intent.service.ts`, `persona.service.ts`; `backend/src/workers/index.ts`.
- **Whispers:** Send/respond/reveal/ignore; 4h TTL; cleanup worker. Evidence: `backend/src/modules/discovery/whisper.service.ts`, `whisper.routes.ts`.
- **Venues/events:** CRUD, geofence, check-in, venue identity, dashboard, lifecycle worker. Evidence: `backend/src/modules/venues/*.ts`, `backend/src/modules/events/lifecycle.service.ts`.
- **Ads:** Four surfaces; premium check; global kill switch; cadence/cooldown; CPM; targeting (geo, intents). Evidence: `backend/src/modules/ads/ad.service.ts`, `ad.routes.ts`.
- **Safety:** Emergency contacts (CRUD), check-in, panic (DB + audit only; no SMS/push to contacts). Evidence: `backend/src/modules/safety/safety.service.ts`, `safety.routes.ts`.
- **Compliance:** Data export (user, profile, interactions, conversations, messages, audit, consent); account deletion request (insert only); consent record/withdraw. Evidence: `backend/src/modules/compliance/compliance.service.ts`.
- **Admin:** Moderation queue, reports resolve/ban, audit logs, extended admin (users/venues/ads/events list, role/tier/toggle). Evidence: `backend/src/modules/admin/admin.routes.ts`, `admin-extended.routes.ts`, `moderation.service.ts`, `admin-extended.service.ts`.
- **Media/albums:** Upload (Multer 20MB), Sharp, self-destruct, albums, share/revoke, view tracking. Evidence: `backend/src/modules/media/media.service.ts`, `media.routes.ts`, `album.service.ts`.
- **E2EE:** Server-side key storage (identity, prekeys, conversation keys); REST API. Evidence: `backend/src/modules/messaging/e2ee.service.ts`, `e2ee.routes.ts`. No client encryption in mobile.
- **Billing:** Stripe checkout and webhook; tier features (persona slots, etc.). Evidence: `backend/src/modules/billing/subscription.service.ts`, `billing.routes.ts`.
- **Mobile:** Expo 55, expo-router; auth flow (OTP → verify → login/register); discover, messages, events, profile, chat, venue, album, whispers, subscription screens; Zustand auth store; Socket.io in `mobile/src/hooks/useSocket.ts`.
- **Admin dashboard:** Login, Dashboard, Users, Revenue, Venues, Ads, Events, Reports, Safety, Audit, Settings. Evidence: `admin-dashboard/src/App.tsx`, `pages/*.tsx`.
- **Infra:** Docker Compose (Postgres+PostGIS, Redis, MongoDB); CI (lint, typecheck, test, build) on push/PR to `main`; Terraform (VPC, ALB, ECS, RDS, ElastiCache). Evidence: `docker-compose.yml`, `.github/workflows/ci.yml`, `terraform/*.tf`.

## What the system cannot do (evidence-led)

- **Account deletion execution:** `requestAccountDeletion` only inserts into `data_deletion_requests`; no worker or cron sets `users.deleted_at` or purges data. Evidence: `backend/src/modules/compliance/compliance.service.ts` (lines 41–54); grep shows no consumer of `data_deletion_requests`.
- **Screenshot reporting API:** Implemented. `POST /v1/safety/screenshot` exists in `safety.routes.ts` and inserts into `screenshot_events`. Optional push to target user not implemented.
- **Panic → notify contacts:** `panic()` writes to `safety_checkins` and `audit_logs` and returns `contactsNotified`; no Twilio/push to emergency contacts. Evidence: `backend/src/modules/safety/safety.service.ts` (lines 51–73).
- **Missed check-in alerts:** `getMissedCheckins()` exists but no worker calls it or sends alerts. Evidence: `backend/src/modules/safety/safety.service.ts` (lines 75–90); `backend/src/workers/index.ts` (no safety job).
- **E2EE on wire:** Messages stored plaintext in MongoDB; `isEncrypted: true` is schema default only. Evidence: `backend/src/modules/messaging/message.model.ts`; no encrypt/decrypt in `mobile/src` for send/receive.
- **Trust-score route param:** Fixed. Handler uses `req.params.userId` correctly. Evidence: `backend/src/app.ts` (lines 133–139).
- **Idempotency keys:** No `Idempotency-Key` handling on any route; duplicate submissions (e.g. double-tap create conversation) can create duplicates. Evidence: grep for idempotency/key across `backend/src` returns nothing.
- **Distributed tracing / metrics:** No OpenTelemetry or Prometheus; only Pino logs. Evidence: `backend/src/config/logger.ts`; no metrics/tracing in `backend/src`.
- **Production env validation:** No startup check that required secrets (e.g. `PHONE_HASH_PEPPER`, `JWT_SECRET`) are set and non-default in prod. Evidence: `backend/src/config/index.ts` (reads env with defaults).

## Top 8 risks (ranked by severity)

| # | Risk | Category | Evidence / impact |
|---|------|----------|--------------------|
| 1 | GDPR deletion not executed | Data / Compliance | `data_deletion_requests` never processed; users cannot be fully deleted as promised. |
| 2 | Panic "contacts notified" is false | Safety | `safety.service.ts` returns `contactsNotified` but no SMS/push sent; legal/safety exposure. |
| 3 | Messages not E2EE | Security | `message.model.ts` stores plaintext; handover states E2EE infra only; client not wired. |
| 4 | No production secret validation | Ops / Security | Weak or default JWT/pepper in prod if env misconfigured. |
| 5 | No deletion/processing worker | Ops | Backlog of `data_deletion_requests` and no automated cleanup. |
| 6 | Redis eviction policy | Data | Worker startup logs "Eviction policy is allkeys-lru. It should be noeviction"; OTP/cooldown keys could be evicted. `docker-compose.yml`: `maxmemory-policy allkeys-lru`. |
| 7 | Admin escalation / appeal | Trust | No quorum for destructive actions; no appeal flow for bans (documented in handover as needed). |
| 8 | Observability gap | Ops | No SLOs, no metrics, no alerting; 100k-user target unverifiable. |

## Ship-readiness score: **52/100**

- **Justification:** Core flows (auth, discover, chat, presence, venues, events, ads, admin moderation, compliance export) exist and are testable. Critical gaps: GDPR deletion not executed; panic-notify is misleading; E2EE is server-only; no production hardening (secret checks, eviction policy, observability). Score reflects “feature-complete in many areas but material compliance/safety/correctness gaps and missing production safeguards.”

---

# 2) Capability Matrix

| Area | Capability | Status | Evidence (paths) | Risk | Notes |
|------|------------|--------|-------------------|------|--------|
| Auth | Phone + OTP | Working | `auth.service.ts`, `otp.service.ts`, `auth.routes.ts` | Low | devCode in dev when no Twilio |
| Auth | JWT + refresh rotation | Working | `auth.service.ts`, refresh token hash in DB | Low | |
| Auth | RBAC (tier + role) | Working | `auth.ts` requireTier, `adminAuth.ts` requireRole, routes | Low | |
| API | Validation (Zod) | Working | `validation.ts`, schema usage in routes | Low | 400 + details format |
| API | Error handling | Working | `errorHandler.ts`, statusCode from errors | Low | 500 message hidden in prod |
| API | Rate limiting | Working | `rateLimiter.ts` global + auth; config from env | Medium | Auth 5/15m prod, 50 dev |
| API | Pagination | Partial | Admin extended: `listUsers`, `searchUsers`, `listVenues`, etc. with page/limit. Messaging: `getMessages(..., before, limit)`. Many list endpoints use fixed LIMIT only | Medium | Inconsistent across modules |
| API | Idempotency | Missing | No Idempotency-Key or idempotent handlers | Low | Double-submit possible |
| Data | Postgres schema | Working | 10 migrations in `backend/src/database/migrations/*.sql` | Low | |
| Data | Indexes / constraints | Working | GIST on locations/geofences; FKs; unique where needed | Low | |
| Data | Migrations | Working | `migrate.ts` runs in order; applied in CI | Low | |
| Data | Seed | Working | `seed.ts`; idempotent by phone_hash | Low | |
| Data | TTL / lifecycle | Working | MongoDB TTL on messages; workers for presence, intents, sessions, media, whispers, events | Medium | Redis eviction risk |
| Data | Audit logs | Working | `audit_logs` and `admin_actions`; auth, compliance, safety, admin | Low | |
| Realtime | Socket.io auth | Working | JWT in handshake; `websocket/index.ts` | Low | |
| Realtime | Rooms | Working | `user:${userId}`, `conversation:${id}` | Low | |
| Realtime | Event contracts | Working | new_message, user_typing, message_read, etc.; emit helpers | Low | |
| Realtime | Delivery guarantees | Stub | No acks or retries; fire-and-forget | Medium | |
| Realtime | Offline | Missing | No offline queue or sync in mobile | Medium | |
| Workers | Schedules | Working | BullMQ in `workers/index.ts`; 1m/5m/10m schedules | Low | |
| Workers | Failure handling | Partial | `worker.on('failed')` logs; no retry policy or DLQ | Medium | |
| Workers | Idempotency | Partial | Decay/cleanup by time windows; no job dedup keys | Low | |
| Workers | Monitoring | Missing | No metrics or dashboard for jobs | Medium | |
| Security | Secrets | Partial | Env vars; no prod validation in code | High | |
| Security | Hashing (phone/email) | Working | `utils/hash.ts` HMAC-SHA256 + pepper | Low | |
| Security | PII handling | Working | Hash only; no raw phone/email in DB | Low | |
| Security | Upload security | Partial | Multer limit 20MB; no file-type allowlist in code | Medium | |
| Security | E2EE | Stub (server) | `e2ee.service.ts`, `e2ee.routes.ts`; mobile no encrypt | High | |
| Privacy | Data export | Working | `compliance.service.ts` requestDataExport | Low | |
| Privacy | Account deletion | Stub | Request only; no processor | High | |
| Privacy | Consent | Working | recordConsent, withdrawConsent | Low | |
| Privacy | Location fuzzing | Working | `config.geo.defaultFuzzMeters`, discovery.service | Low | |
| Privacy | Screenshot handling | Working | POST /v1/safety/screenshot inserts into screenshot_events | Low | |
| Mobile | Routing | Working | expo-router; (auth), (tabs), chat, venue, etc. | Low | |
| Mobile | State | Working | Zustand in `stores/auth.ts` | Low | |
| Mobile | API client | Working | `api/client.ts`; auth header; domain APIs | Low | Android 10.0.2.2 |
| Mobile | Auth flow | Working | sendOTP → verify → login/register; dev fallback | Low | |
| Mobile | Key screens | Partial | Discover, messages, events, profile, chat, venue, album, whispers, subscription | Medium | Some screens thin |
| Mobile | Photo upload/render | Working | usePhotoUpload, ProfilePhoto; /uploads | Low | |
| Admin | Moderation | Working | Queue, reports, resolve, ban; logAdminAction | Low | |
| Admin | Auditability | Working | admin_actions, audit log fetch | Low | |
| Admin | Dispute/appeal | Missing | No appeal flow in code or routes | Medium | |
| Ads | Cadence / kill switch | Working | `ad.service.ts`; global + cadence; hardcoded caps | Low | |
| Ads | Targeting | Working | Geo, intents, premium skip | Low | |
| Ads | Measurement | Partial | Impressions/taps; no attribution or dashboard | Low | |
| Observability | Logs | Working | Pino in `config/logger.ts` | Low | |
| Observability | Metrics/tracing | Missing | None | High | |
| Observability | Alerting/SLOs | Missing | None | High | |
| Deployment | Docker | Working | `docker-compose.yml`; healthchecks | Low | |
| Deployment | Env | Partial | `.env.example`; no validation at startup | Medium | |
| Deployment | CI | Working | `ci.yml`; backend + admin; tests on main/PR | Low | |
| Deployment | Terraform | Designed | main, ecs, database, alb, vpc, variables, outputs | Medium | Not run in audit |
| Deployment | Migrations in prod | Documented | Manual step in handover | Medium | No automated pipeline |
| Deployment | Rollback / multi-region | Partial | Terraform present; rollback/multi-region not verified | Medium | |

---

# 3) Deep Dives (A–M)

## A) Architecture & boundaries

- **Implemented:** Single Express app in `backend/src/app.ts` mounts all v1 routes; `index.ts` creates HTTP server, attaches Socket.io, starts workers. Admin and mobile are separate codebases; mobile and admin call same API. Config loaded from root `.env` in `backend/src/config/index.ts` (path `../../..`).
- **Missing:** No API versioning beyond `/v1`; no BFF or gateway layer; admin and mobile share backend without separate rate limits or quotas. No documented boundary for “admin-only” vs “app” data.
- **Failure modes:** If `.env` is not at repo root, backend may use defaults (e.g. dev JWT secret). Route order in `app.ts` matters (e.g. `/v1/venues` mounted twice); wrong order could shadow routes.
- **Improvements:** (1) Validate config at startup and fail if `NODE_ENV=production` and secrets are default. (2) Add a single “system health” module that checks DB/Redis/Mongo and optional external deps. (3) Document route mount order and any shadowing risks.

## B) API correctness

- **Implemented:** Auth: `authenticate` and `requireTier`/`requireRole` on protected routes. Validation: Zod in `middleware/validation.ts`; 400 with `error.details[]`. Error handler in `errorHandler.ts`; 5xx message hidden in prod. Global rate limit (config) and auth-specific (5/50 per 15m). Pagination in admin-extended and messaging (`before`, `limit`).
- **Missing:** No idempotency keys. (Trust-score fixed: uses `req.params.userId` in `app.ts`.) Auth rate limiter is per-IP; no per-user or per-phone cap on sensitive actions beyond OTP. No standard pagination (cursor vs offset) across all list APIs.
- **Failure modes:** Double POST (e.g. create conversation) creates two resources. Rate limit bypass by IP rotation.
- **Improvements:** (1) Add optional `Idempotency-Key` for POST/PUT on conversation create, message send, billing checkout. (2) Document pagination contract (offset/limit vs cursor) and apply consistently.

## C) Data integrity

- **Implemented:** Migrations 001–010 in `backend/src/database/migrations/`; sequential apply; `schema_migrations` table. Seed in `backend/src/database/seed.ts`; idempotent by phone_hash. GIST indexes on `locations`, `geofences`; TTL on MongoDB `messages.expiresAt`. Audit: `audit_logs` and `admin_actions` written from auth, compliance, safety, admin.
- **Missing:** No worker or cron that processes `data_deletion_requests` (e.g. set `users.deleted_at`, anonymize or delete related data). Soft-deleted users are filtered in queries (`deleted_at IS NULL`) but deletion is never triggered. No foreign-key cascade or documented purge order for GDPR.
- **Failure modes:** Users request deletion and never get fully deleted; backlog grows. Manual purge without a defined order could violate FK or leave orphaned records.
- **Improvements:** (1) Add a scheduled job (e.g. daily) that processes `data_deletion_requests` with status `pending`: set `users.deleted_at`, clear PII where needed, delete or anonymize messages/interactions, then set request status to `completed`. (2) Document purge order and retention for audit_logs. (3) Consider hard-delete or anonymization policy for messages.

## D) Realtime

- **Implemented:** Socket.io in `backend/src/websocket/index.ts`; JWT in `handshake.auth.token`; rooms `user:${userId}` and `conversation:${conversationId}`. Events: join/leave conversation, typing, stop_typing, message_read; server emits new_message, user_typing, user_stop_typing, message_read, media_self_destructed, album_shared, album_revoked, etc. Helpers: `emitNewMessage`, `emitToUser`, `emitMediaSelfDestructed`, `emitAlbumShared`, `emitAlbumRevoked`. Mobile `useSocket.ts` connects with token and joins conversation.
- **Missing:** No client or server ack for critical events; no retry or “last event id” resume. No explicit reconnection or backoff in mobile (Socket.io client default). Presence_expired and whisper events documented in handover but emit targets not fully traced in this audit.
- **Failure modes:** Message sent but socket disconnected before emit; client never sees it until poll (if any). Reconnect storm under load. No way to detect “delivered” vs “sent.”
- **Improvements:** (1) Ensure messaging flow updates conversation and then emits; consider idempotent message key so client can dedupe. (2) Document which events are critical and add at-least-once delivery (e.g. store-and-forward for new_message). (3) Mobile: explicit reconnect/backoff and optional short polling fallback for messages.

## E) Background jobs

- **Implemented:** BullMQ single queue `cleanup` in `backend/src/workers/index.ts`; jobs: decay-presence (60s), clean-intents (5m), expire-sessions (5m), cleanup-media (10m), clean-whispers (5m), event-lifecycle (60s). Schedules via `upsertJobScheduler`. Concurrency 2; failed job logged.
- **Missing:** No retry policy (e.g. exponential backoff); no dead-letter queue or alert on repeated failure. No job-level idempotency key (e.g. “decay-presence” could in theory run overlapping if delayed). Worker start failure is non-fatal (log only) so server can run without workers. No metrics (job duration, failure count).
- **Failure modes:** Redis blip causes job failure; no retry. Repeated failures go unnoticed. Overlap if a job runs longer than schedule interval.
- **Improvements:** (1) Add retry with backoff for transient errors. (2) Add a small “heartbeat” or metric for “last successful run” per job name and alert if stale. (3) Consider idempotent job keys (e.g. by date window) where applicable.

## F) Security

- **Implemented:** Phone/email hashed in `backend/src/utils/hash.ts` (HMAC-SHA256 + pepper). JWT in `auth.ts`; refresh token hashed in DB. Admin actions in `adminAuth.ts` and logged. Helmet with `crossOriginResourcePolicy: 'cross-origin'`. Multer file size 20MB in `media.routes.ts`. E2EE key storage and API in `e2ee.service.ts`/`e2ee.routes.ts`.
- **Missing:** No startup check that `JWT_SECRET`, `PHONE_HASH_PEPPER` are set and not default in production. Upload does not validate file magic/extension allowlist (only Multer). Messages in MongoDB are plaintext; mobile does not encrypt before send or decrypt after receive. No rate limit per user on expensive operations (e.g. discovery). Abuse: whisper spam limited by service logic but no global per-user cap on whisper send.
- **Failure modes:** Deploy with default secrets; tokens or hashes compromised. Malicious file upload if Multer type check is bypassed. Message content visible to anyone with DB access. DoS via expensive discovery or whisper floods.
- **Improvements:** (1) In `config/index.ts` or startup: if `NODE_ENV===production`, require non-default `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PHONE_HASH_PEPPER` and exit if not set. (2) Validate uploaded file type (magic bytes or allowlist). (3) Document E2EE as “server keys only; client encryption TBD” and add client encrypt/decrypt to mobile send/receive path. (4) Per-user rate limit or cap on discovery and whisper endpoints.

## G) Privacy/compliance

- **Implemented:** Data export in `compliance.service.ts` (requestDataExport) aggregates user, profile, interactions, conversations, messages, audit_logs, consents; logs export to audit. Account deletion request: insert into `data_deletion_requests` and audit. Consent: recordConsent, withdrawConsent with version. Location fuzzing in discovery. Screenshot: table `screenshot_events` in migration 005; mobile hook calls API.
- **Missing:** No worker processes `data_deletion_requests` (see C). Screenshot route implemented: POST /v1/safety/screenshot inserts into screenshot_events; optional push to target not implemented. Panic returns “contactsNotified” but no code sends SMS/push to emergency contacts. No retention policy (e.g. audit_logs, messages) documented or enforced in code.
- **Failure modes:** Deletion requests never fulfilled; GDPR Art. 17 not satisfied. Panic gives false assurance. Long-term retention of PII in logs/messages.
- **Improvements:** (1) Implement deletion worker (see C). (2) Either implement panic notification (Twilio/push) or change copy to “Alert recorded; contacts will not be notified until this is implemented.” (3) Document retention (audit, messages, safety_checkins) and add cleanup jobs if needed.

## H) Mobile app

- **Implemented:** Expo 55; expo-router: (auth)/index, register, verify-code, onboarding; (tabs)/index (discover), messages, events, profile; chat/[id], user/[id], venue/[id], album, couple, verify, subscription, whispers; profile/edit, profile/status. Auth: `stores/auth.ts` with sendOTP, verifyAndLogin, verifyAndRegister, login/register fallback, loadProfile, logout; token in localStorage (web). API client in `api/client.ts` with auth header; discoverApi, messagingApi, eventsApi, safetyApi, albumsApi, etc. useSocket for conversations. usePhotoUpload, useLocation, useDistressGesture, useScreenshotDetection, usePushNotifications. Theme in `constants/theme.ts`.
- **Missing:** E2EE: no encrypt before send or decrypt after receive in `api/client.ts` or chat screen. Screenshot hook calls POST /v1/safety/screenshot (implemented). Android base URL hardcoded to 10.0.2.2 (emulator); no env for API URL. Some screens may be thin (e.g. subscription, verify). No offline queue or sync.
- **Failure modes:** Real device on different network needs configurable API URL. Message content not protected end-to-end. Offline sends fail without retry.
- **Improvements:** (1) API_BASE from env (e.g. EXPO_PUBLIC_API_URL) with fallback. (2) Plan and implement E2EE in send/receive path. (3) Add simple offline detection and retry or queue for critical mutations.

## I) Admin dashboard

- **Implemented:** React + Vite; routes in `App.tsx`: Login, Dashboard, Users, Revenue, Venues, Ads, Events, Reports, Safety, AuditLog, Settings. Layout in `Layout.tsx`. API client in `api/client.ts` (base URL, auth header). Extended admin API used for user/venue/ads/events lists and actions.
- **Missing:** No appeal or dispute flow in UI or API. Report resolve accepts notes but no structured “resolution type” or user-facing outcome. Safety page may show data but no workflow to act on missed check-ins or panic. No quorum or approval chain for ban.
- **Failure modes:** Moderator bans by mistake; user has no in-app appeal. Panic/missed check-ins visible but no action path. Confusion on what “resolve” means for reporter/reported.
- **Improvements:** (1) Add appeal API (e.g. POST /v1/admin/appeals or similar) and an Appeals view. (2) Define resolution types for reports and show them to users. (3) Safety: link to “notify contacts” or “mark responded” for panic/missed check-ins when that backend exists. (4) Document quorum/approval for destructive actions and implement if required.

## J) Ads & monetization

- **Implemented:** `ad.service.ts`: getEligibleAd checks premium (no ads), global kill switch, cadence rules, Redis cooldown, 24h impression cap, dismissed placements, intent skip (chat_list + open_to_chat), geo filter; recordImpression, recordTap, recordDismiss; placement create and stats. Surfaces: discover_feed, chat_list, post_event, venue_page with hardcoded max per 24h. CPM and budget in DB.
- **Missing:** No dashboard for ad revenue or fill rate in app (admin has Ads page). No A/B or density control beyond cadence. “Revenue realism” not validated (no billing integration for ad payouts). Kill switch is DB-only; no circuit breaker in code if DB fails.
- **Failure modes:** Ad controls query fails and could throw; caller should handle null. No alert if fill rate drops. Venues may expect payouts that are not automated.
- **Improvements:** (1) Harden getEligibleAd: if ad_controls or cadence query fails, return null and log. (2) Add simple revenue/fill metrics to admin or venue dashboard. (3) Document revenue flow (CPM → spent_cents; payouts to venues manual or future).

## K) UX/UI (summary)

- **Current:** Dark theme (purple/lavender); fingerprint branding; phone-first login; tab bar (Discover, Messages, Events, Profile). Admin: standard layout with sidebar/nav; tables and forms.
- **Friction:** Login requires OTP; no password recovery. Screenshot flow fails silently. Panic says “contacts notified” when they are not. No clear “decision cockpit” for moderators (e.g. single view for report + user + history). Mobile API base URL not configurable for real devices.
- **Next-level:** Design tokens (spacing, type scale, radii) in `mobile/src/constants/theme.ts`; extend to admin for consistency. Component library (buttons, cards, inputs) shared or documented. High-impact: (1) Fix screenshot and panic copy/behavior. (2) Configurable API URL. (3) Onboarding clarity (steps, permissions). (4) Discovery filters and empty states. (5) Chat read states and typing. (6) Venue/event cards and CTAs. (7) Safety center (contacts, check-in, panic) with clear expectations. (8) Admin: report detail + user context in one view. (9) Error states and retry. (10) Accessibility (labels, contrast).

## L) Observability

- **Implemented:** Pino logger in `backend/src/config/logger.ts`; level from config; pino-pretty in development. Logs in workers (count, duration). Health endpoint returns status, timestamp, version, modules.
- **Missing:** No metrics (request rate, latency, error rate by route). No tracing (no OpenTelemetry or correlation ids). No alerting or SLO definitions. No dashboard (Grafana etc.). LOG_LEVEL and structure are the only levers.
- **Failure modes:** Production issue requires log scraping only; no quick view of error rate or p95. Cannot validate “p95 < 300ms” or “99.99% uptime” without instrumentation.
- **Improvements:** (1) Add request duration and status code metrics (e.g. Prometheus or CloudWatch). (2) Add a correlation id middleware and include in logs. (3) Define 2–3 SLOs (e.g. /health success, p95 latency for /v1/discover) and add a simple alert if breached. (4) Document runbook and where to look (logs, DB, Redis).

## M) Deployment & ops

- **Implemented:** `docker-compose.yml`: Postgres (PostGIS), Redis, MongoDB; healthchecks; volumes. `.env.example` at root; backend loads via `config/index.ts` from root. CI: `.github/workflows/ci.yml` — backend lint/typecheck, test (with services), build; admin-dashboard tsc and vite build. Terraform: vpc, alb, ecs, database, variables, outputs.
- **Missing:** No enforced env validation (see F). CI triggers on `main`; branch `cursor/development-environment-setup-8b20` may not run CI unless workflow is updated. No migration run in CI for “staging” or prod; handover says run manually. No documented rollback (e.g. previous ECS task def, DB rollback). Multi-region not verified in Terraform.
- **Failure modes:** Deploy with wrong or default env. Migrations not run after deploy. Rollback ad hoc. Region failure has no documented failover.
- **Improvements:** (1) Add config validation and fail fast. (2) Run migrations in deploy pipeline or document and automate. (3) Document rollback (revert task def, no automatic DB rollback). (4) Add branch or tag to CI if development branch is primary.

---

# 4) UX/UI Report (condensed)

- **Critical flows:** Onboarding: (auth) → verify-code → tabs or onboarding. Discovery: (tabs)/index → discover API → cards. Chat: messages list → chat/[id] → send/receive via socket. Whispers: whispers index → send/respond. Venues: (tabs)/events or venue/[id]. Safety: profile or dedicated screens for contacts, check-in, panic. Ads: served in discover/chat/post-event/venue; no dedicated “ads” screen for users.
- **Friction:** (1) Screenshot notification does not reach backend (404). (2) Panic says “contacts notified” but they are not. (3) API URL for non-emulator devices. (4) No single “report context” view for admins. (5) Empty states and error states not audited.
- **Design system:** `mobile/src/constants/theme.ts`: colors (primary, background, surface, text, accent), spacing, font sizes, radii, shadows. Use consistently; extend to admin for shared language.
- **10 high-impact UI upgrades:** (1) Implement screenshot endpoint and success/error feedback. (2) Correct panic copy or implement notify. (3) EXPO_PUBLIC_API_URL. (4) Onboarding progress and permission rationale. (5) Discovery filters and “no results” state. (6) Chat: read receipts and typing clarity. (7) Venue/event cards with clear CTAs. (8) Safety hub with expectations. (9) Admin: combined report + user + history view. (10) Global error boundary and retry for critical actions.

---

# 5) Prioritized Roadmap

## P0 — Ship blockers (before beta)

| Item | Outcome | Code areas | Effort | Test |
|------|---------|------------|--------|------|
| Process account deletion | GDPR deletion executable | New worker or cron; `compliance.service` or new processor; set `users.deleted_at`, purge/anonymize per policy | M | Unit: processor; integration: request → verify deleted |
| Panic copy or notify | No false “contacts notified” | Either implement notify (Twilio/push) in `safety.service.ts` or change response/copy in API and mobile | M | Integration: panic → verify message/notify |
| Production secret check | Fail fast on weak secrets | `config/index.ts` or startup script; check JWT_SECRET, PHONE_HASH_PEPPER in prod | S | Start server with defaults in prod → must exit |

## P1 — Trust & retention

| Item | Outcome | Code areas | Effort | Test |
|------|---------|------------|--------|------|
| Missed check-in worker | Alerts when user misses check-in | New job in `workers/index.ts`; call `safety.service.getMissedCheckins()`; send push/SMS; set alert_sent | M | Integration: set expected_next_at in past → run job → alert |
| Admin appeal flow | Users can appeal ban | New route e.g. POST /v1/appeals or under admin; table appeals; admin view to approve/reject | L | E2E: ban → appeal → resolve |
| Upload file-type validation | Reject non-image/video | `media.routes.ts` or controller; magic bytes or allowlist | S | Unit: upload non-image → 400 |
| Redis eviction | OTP/cooldown safe | `docker-compose.yml` and Terraform: noeviction or dedicated instance for auth keys | S | Deploy and verify config |

## P2 — Monetization without UX damage

| Item | Outcome | Code areas | Effort | Test |
|------|---------|------------|--------|------|
| Ad null-safety | No 500 on missing controls | `ad.service.ts`: guard ad_controls/cadence query result | S | Unit: mock empty controls → null ad |
| Revenue visibility | Venues see ad performance | Admin or venue dashboard: aggregate spent_cents, impressions by placement | M | Manual or integration |
| E2EE client | Messages encrypted on device | Mobile: encrypt payload before send; decrypt on receive; use e2ee API for keys | L | E2E: send message → DB has ciphertext only |

## P3 — Moat features

| Item | Outcome | Code areas | Effort | Test |
|------|---------|------------|--------|------|
| Idempotency keys | No duplicate creates | Middleware or per-route; Redis or DB key store; apply to conversation create, send message, checkout | M | E2E: same key twice → 200 + single resource |
| Request metrics | Latency and error rate | Middleware to record duration and status; export to Prometheus or CloudWatch | M | Deploy and query metrics |
| SLO + alert | p95 and error rate alerts | Define SLOs; wire metrics to alerting (e.g. CloudWatch alarms) | M | Simulate load and breach |

---

# 6) Test Strategy

## Missing coverage map

- **Backend:** Tests exist in `backend/tests/`: auth, couples, admin, discovery, events, media, safety (and helpers, setup). No dedicated tests for: compliance (export/deletion), E2EE routes, billing webhook, ads service, presence, whispers, venue-identity, session/panic-wipe, full messaging flow with MongoDB. Integration tests use real DB/Redis/Mongo in CI.
- **Admin:** No automated tests in repo (no `admin-dashboard/src/**/*.test.*` or e2e).
- **Mobile:** No Jest or Detox tests found in `mobile/`.
- **E2E:** No Playwright/Cypress for web or app flows.
- **Load:** k6 in `loadtest/smoke.js` (register, location, discover, me, health); `stress.js` exists. No discovery-heavy or WebSocket load scenario.

## Highest-value tests to add

1. **Integration: Account deletion processor** — Request deletion → run processor → assert user soft-deleted and request status updated. Prevents regression on P0.
2. **Unit: AdService getEligibleAd** — Mock DB/Redis; assert null when premium, when kill switch off, when over cap; assert ad when eligible. Prevents 500 and logic bugs.
3. **E2E (admin):** Login → open report → resolve with notes → verify audit. Covers critical moderator path.
4. **E2E (mobile):** Login (with devCode) → open discover → open user → like. Covers happy path.
5. **Load: Discovery** — k6 scenario: N users, each does discover with varying lat/lng/radius; threshold p95 < 500ms (relaxed from 200ms initially).
6. **Load: WebSocket** — k6 WS or artillery: connect, join conversation, send messages; assert delivery and threshold.

## Load test plan (k6)

- **Scenarios:** (1) Smoke (existing): register, location, discover, me, health; 5 VUs, 30s; p95 < 500, error rate < 5%. (2) Discovery-heavy: 20 VUs, each 10 discover calls with random coords; p95 < 500. (3) Mixed: register + discover + get conversations + get messages; 10 VUs, 60s. (4) WebSocket: connect, join 1 conversation per user, send 5 messages; 10 VUs; delivery rate and p95.
- **Thresholds:** Start with p95 < 500ms and error rate < 5%; tighten to p95 < 300ms and < 1% when stable. Add discovery-specific threshold (e.g. p95 < 400ms) when PostGIS is optimized.

---

## Extended appendices (CTO reference)

For an exhaustive, CTO-grade reference, see **`docs/SYSTEM_REALITY_REPORT_APPENDICES.md`**, which adds:

- **Appendix A: Complete API Route & Auth Matrix** — Every v1 route (method, path, auth, tier, role, source file) in one table.
- **Appendix B: Schema & Migration Summary** — All 10 migrations with tables and critical schema notes (data_deletion_requests, screenshot_events, safety_checkins.alert_sent, MongoDB).
- **Appendix C: Threat Model & Abuse Vectors** — Threat, mitigation in code, gap, and evidence path per vector.
- **Appendix D: Evidence Appendix (Critical Bugs)** — File, line, code snippet, and exact seam for trust-score param, account deletion, screenshot endpoint, panic "contacts notified."
- **Appendix E: Mobile Screen × API Coverage** — Which screens call which APIs; only screenshot is 404.
- **Appendix F: GDPR/CCPA Compliance Mapping** — Article-to-implementation status and evidence.
- **Appendix G: Runbook & Operational Readiness** — Commands and status (implemented vs NOT IMPLEMENTED).
- **Appendix H: Dependencies & Known Risks** — Key packages, versions, and risks.
- **Appendix I: How to Reproduce Critical Failures** — Step-by-step for trust-score, screenshot 404, deletion, panic, Redis eviction.

Together, **SYSTEM_REALITY_REPORT.md** (~5,200 words) and **SYSTEM_REALITY_REPORT_APPENDICES.md** (~3,200 words) form a single audit of ~8,400 words with file paths and seams on every major claim.

---

*End of report. All claims tied to file paths or explicit “NOT IMPLEMENTED” with seam.*
