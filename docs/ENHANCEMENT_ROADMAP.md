# Shhh — Enhancement Roadmap (shh-enhancement-trial)

> **Branch:** `shh-enhancement-trial`  
> **Purpose:** Add features from the Feature Additions Critique and Game-Changer Ideas **without breaking existing behavior or duplicating existing code.**  
> **Last roadmap update:** 2026-02-26 (Phase C complete). Update this date each time you complete a phase or sync docs.  
> **Docs index:** See **docs/README.md** for the full list of docs to review and update throughout progression.

---

## 🚨 GOLD STANDARD (READ BEFORE EVERY TASK)

**Work with the existing system. Do not create duplicates. Follow what is already built.**

### Always

- **Read before you build.** Before adding any endpoint, table, or module: check `docs/ARCHITECTURE.md`, `docs/DEV_HANDOVER.md`, and the relevant backend files. If something already exists (table, route, service method), **extend it** — do not add a second one.
- **Follow existing patterns.** New code must match: Service → Controller → Routes (or routes-only for small modules); same middleware (`authenticate`, `validate(zod)`, `requireTier` / `requireRole`); same DB access (`query()` from config/database, parameterized SQL); same error handling (`next(err)`, `errorHandler`).
- **Additive only.** New migrations (e.g. `011_*.sql`), new columns or tables, new routes under `/v1/*`. Do not refactor or rename working code unless the roadmap explicitly says so (e.g. fixing the trust-score param).
- **One source of truth.** API contract: `docs/SYSTEM_REALITY_REPORT_APPENDICES.md` (Appendix A) and `docs/ARCHITECTURE.md` §4. After adding routes, **update both** so the next step never loses scope.
- **Update docs at each phase.** After every phase (or meaningful batch of work), update the docs listed in [Doc Sync Checklist](#doc-sync-checklist) so scope and current state are never lost.

### Never

- **Do not duplicate.** No second "reveal" table if `photo_reveals` exists; no second "album share" if `album_shares` exists; no new "discovery" service if `discovery.service.ts` already does PostGIS. Extend.
- **Do not bypass existing auth.** Use `authenticate` and `requireTier` / `requireRole` from existing middleware; do not invent new auth patterns.
- **Do not change working API contracts.** Existing request/response shapes stay; add optional body fields or new endpoints instead of breaking changes.
- **Do not commit to `main` or to any branch other than `shh-enhancement-trial`.** All work stays on this branch until merge is approved.

---

## Where Existing Things Live (Quick Reference)

Use this to avoid creating duplicates. **When in doubt, grep the codebase and read the doc.**

| Concern | Where it lives | Doc reference |
|--------|----------------|---------------|
| Auth, OTP, push | `backend/src/modules/auth/` | DEV_HANDOVER §4.1, ARCHITECTURE §4 |
| Users, profile, like/pass/block/report | `backend/src/modules/users/` | DEV_HANDOVER §4.2 |
| **Blur / reveal** | `backend/src/modules/users/blur.service.ts`, `blur.routes.ts`; table `photo_reveals` | ARCHITECTURE §4 (Photos), Appendix A |
| Personas | `backend/src/modules/users/persona.*`; table `personas` | DEV_HANDOVER §4.3 |
| Couples | `backend/src/modules/couples/` | DEV_HANDOVER §4.4 |
| Verification | `backend/src/modules/verification/` | DEV_HANDOVER §4.5 |
| Discovery, location, nearby | `backend/src/modules/discovery/discovery.service.ts`, `discovery.routes.ts`; PostGIS, Redis cache | DEV_HANDOVER, ARCHITECTURE §4 |
| Presence | `backend/src/modules/discovery/presence.*`; table `presence` | Appendix A |
| Whispers | `backend/src/modules/discovery/whisper.*`; table `whispers` | DEV_HANDOVER §13, Appendix A |
| Conversations, messages | `backend/src/modules/messaging/`; MongoDB `messages` | DEV_HANDOVER §7 |
| Session, consent, panic-wipe | `backend/src/modules/messaging/session.*` | Appendix A |
| E2EE | `backend/src/modules/messaging/e2ee.*` | Appendix A |
| Media, albums, share | `backend/src/modules/media/`; tables `media`, `albums`, `album_media`, `album_shares` | DEV_HANDOVER, ARCHITECTURE §4 |
| Events | `backend/src/modules/events/`; `lifecycle.service.ts` | DEV_HANDOVER §10 |
| Venues, check-in, attendees, chat rooms | `backend/src/modules/venues/` (venues, venue-identity, venue-dashboard) | DEV_HANDOVER §10, Appendix A |
| Safety | `backend/src/modules/safety/` | DEV_HANDOVER §11, Appendix A |
| Compliance | `backend/src/modules/compliance/` | ARCHITECTURE §4 |
| Ads | `backend/src/modules/ads/`; tables `ad_placements`, `ad_impressions`, etc. | DEV_HANDOVER §9 |
| Billing, subscriptions | `backend/src/modules/billing/`; table `subscriptions` | DEV_HANDOVER §14 |
| Admin | `backend/src/modules/admin/admin.routes.ts`, `admin-extended.routes.ts` | ARCHITECTURE §4, Appendix A |
| Migrations | `backend/src/database/migrations/` (001–010) | ARCHITECTURE §2, §6 |
| Route mounting | `backend/src/app.ts` | Single place all routes are mounted |

---

## Doc Sync Checklist

**At the end of every phase (or meaningful batch), update these so the next step never loses scope:**

| Doc | What to update |
|-----|----------------|
| **docs/ARCHITECTURE.md** | §2 File tree (new files/modules), §4 API Ledger (new endpoints), §6 Schema (new tables/cols), §11 Env (new vars). Bump "Last updated" if substantive. |
| **docs/DEV_HANDOVER.md** | Relevant §4.x module (new endpoints, tables, rules). Add new section if new module. TOC if new major section. |
| **docs/SYSTEM_REALITY_REPORT_APPENDICES.md** | Appendix A (route matrix): add every new method/path/auth/tier/source file. Schema/migrations if changed. |
| **docs/FEATURE_ADDITIONS_CRITIQUE.md** | Optional: mark implemented items in Part 2 checklist; add a short "Implemented on shh-enhancement-trial" note if useful. |
| **docs/ENHANCEMENT_ROADMAP.md** | This file: tick completed phases, update "Last roadmap update" date, add any new "Where existing things live" rows. |

---

## Phase 0: Fix First (Do Before New Features)

**Goal:** Fix known bugs and gaps so new work does not build on broken foundations.

| # | Task | Existing location | Action | Doc update after |
|---|------|-------------------|--------|-------------------|
| 0.1 | Trust-score route param | `app.ts` inline handler for `GET /v1/users/:userId/trust-score` | Use `req.params.userId` only (not `req.params.id`). | ARCHITECTURE, Appendix A note |
| 0.2 | Missing `POST /v1/safety/screenshot` | `safety.routes.ts` | Add endpoint if mobile expects it; implement or document as no-op. | ARCHITECTURE §4, Appendix A |
| 0.3 | Deletion worker | `data_deletion_requests` table; no worker | Add worker (or scheduled job) that processes rows. **Semantics: anonymize first, hard delete later** — conservative to avoid irreversible data loss. | ARCHITECTURE §6, DEV_HANDOVER, Appendix |
| 0.4 | Panic notifications | `safety.service.ts` (panic creates record, audit) | Optionally notify emergency contacts (SMS/push) when panic is triggered; document if deferred. | ARCHITECTURE §5.5, DEV_HANDOVER §11 |

**Before Phase 0:** Read `backend/src/app.ts`, `backend/src/modules/safety/safety.routes.ts`, `backend/src/modules/safety/safety.service.ts`, `backend/src/modules/compliance/compliance.service.ts` (deletion).  
**After Phase 0:** Run existing tests; update ARCHITECTURE, DEV_HANDOVER, Appendix A as in table.

---

## Phase A: Core Hook + Monetization

**Goal:** Reveal system (levels 0–2, global + conversation scope), conversation retention modes, vault album share options, stealth mode (backend prefs + push behavior). Align with FEATURE_ADDITIONS_CRITIQUE Phase A.

### Phase A.1 — Permissioned reveal (extend existing)

- **Existing:** `photo_reveals` (from_user_id, to_user_id, expires_at), `users/blur.service.ts`, `users/blur.routes.ts` under `/v1/photos/*`.
- **Do not duplicate:** Do not create a new `reveals` table unless we explicitly migrate from `photo_reveals`; prefer adding columns to `photo_reveals` or a single new table that replaces it in one migration.
- **Add:** Level (0–2 first; L3/vault later), scope_type (global, conversation), scope_id nullable. Enforce in `GET /v1/media/:id` and profile photo reads. Revocation = delete or revoked_at; cache-bust.
- **Cautions:** Keep levels simple at first. Event/venue scoping should come later if UX gets heavy. **Risk is UX complexity, not backend.**
- **Before you build:** Read `blur.service.ts`, `photo_reveals` in migrations (005), and media.service.ts (who can see media).
- **After you build:** New migration (e.g. 011); update ARCHITECTURE §4 (Photos/Reveal), §6 schema; Appendix A; DEV_HANDOVER users/blur section.

### Phase A.2 — Conversation retention modes

- **Existing:** MongoDB `messages` with `expiresAt` TTL; `conversations` table in Postgres (metadata).
- **Do not duplicate:** Do not add a second conversation store; extend Postgres `conversations` with retention columns.
- **Add:** `retention_mode` (ephemeral | timed_archive | persistent), `archive_at`, `default_message_ttl_seconds`. Worker or cron that sets conversation read-only when archive_at reached. Optional per-message ttl in POST message body.
- **Cautions:** **Defaults matter.** Avoid exposing too many options up front; choose a sensible default and keep UI simple.
- **Before you build:** Read `messaging.service.ts`, `message.model.ts`, and Postgres schema for conversations.
- **After you build:** Migration; ARCHITECTURE §4 (Messaging), §6; Appendix A; DEV_HANDOVER §7.

### Phase A.3 — Vault albums (extend album share)

- **Existing:** `album_shares` (album_id, shared_with_user_id, can_download, expires_at, revoked_at). Share is user-only.
- **Do not duplicate:** Same table; add columns or new share target table linked to album_shares.
- **Add:** share_target_type (user | persona | couple), share_target_id; watermark_mode, notify_on_view; enforce no direct file URL when can_download=false (signed URLs only).
- **Before you build:** Read `album.service.ts`, migration 003 (album_shares), media.service.ts (access check).
- **After you build:** Migration; ARCHITECTURE §4 (Media & Albums), §6; Appendix A; DEV_HANDOVER media/album section.

### Phase A.4 — Stealth mode (backend)

- **Existing:** User preferences in `user_profiles` or similar; push in `auth/push.service.ts`.
- **Do not duplicate:** No new “settings” module if preferences already live in user_profiles or a single settings table.
- **Add:** Store stealth flags (e.g. neutral_notifications, app_lock_preference); push payload logic to avoid explicit content when neutral mode on. No app lock logic on server (client-only).
- **Cautions:** **App Store / store listing language must be careful** — do not market as "hide affairs" or similar; position as discretion and privacy.
- **Before you build:** Read user_profiles schema, push.service.ts, and any existing preferences.
- **After you build:** ARCHITECTURE §4, §11 (env if needed); Appendix A; DEV_HANDOVER.

**After all of Phase A:** Run full test suite; update ENHANCEMENT_ROADMAP “Last roadmap update” and tick Phase A done.

---

## Phase B: Density + Stickiness

**Goal:** Venue grid (GET venues/:id/grid), event-centric engine (attendees, chat rooms, post-event prompts), whispers categories + quotas.

### Phase B.1 — Venue grid

- **Existing:** `venue-identity.routes.ts` has `GET /:id/attendees`. Venue check-ins in DB.
- **Do not duplicate:** Reuse attendees or add a single `GET /v1/venues/:id/grid` that returns privacy-safe tiles (persona, badges, fuzzed distance). Add anonymous_mode to check-in if not present.
- **Cautions:** **Make anonymous mode default-friendly** so first-time users aren't exposed before they choose.
- **Before you build:** Read venue-identity.service.ts and venue check-in schema.
- **After you build:** ARCHITECTURE §4 (Venues), Appendix A; DEV_HANDOVER §10.

### Phase B.2 — Event-centric engine

- **Existing:** `events` module, `lifecycle.service.ts`, venue attendees/chat-rooms.
- **Add:** GET events/:id/attendees (or derive from venue), GET events/:id/chat-rooms; at “post” lifecycle, trigger post-event prompts (e.g. “Keep chatting?”, “Reveal?”). Store prompt state to avoid spam.
- **Before you build:** Read events.service.ts, lifecycle.service.ts, venue-identity for attendees/chat-rooms.
- **Cautions:** **Avoid notification spam post-event** — one thoughtful prompt or batched prompt, not a flood.
- **After you build:** ARCHITECTURE §4, §5; Appendix A; DEV_HANDOVER.

### Phase B.3 — Whispers categories + quotas

- **Existing:** `whispers` table, `whisper.service.ts`, `whisper.routes.ts`.
- **Add:** category (e.g. compliment/invite/curious), reveal_policy; config for max_per_day, max_pending; unique constraint one pending per (from, to); rate limit.
- **Cautions:** **Don't over-complicate reveal-on-response rules early** — keep first version simple.
- **Before you build:** Read whisper.service.ts and migrations (007).
- **After you build:** Migration if needed; ARCHITECTURE §4; Appendix A; DEV_HANDOVER §13.

**After all of Phase B:** Doc sync; tick Phase B in this roadmap.

---

## Phase C: Moat + Polish

**Goal:** Density-aware radius (optional), discovery cap (free = 30 closest, premium expands), premium feature gating (requireFeature / tier flags), venue safety hooks (conditional). Defer voice drops per critique.

### Phase C.1 — Discovery cap (free vs premium)

- **Existing:** `discovery.service.ts` (PostGIS, radius, filters). Subscriptions in `billing`, `subscriptions` table.
- **Add:** In discovery flow: if user is free tier, limit result set to 30 closest (by distance); if premium, no cap or higher cap. When context is venue/event (e.g. “who’s here”), do not apply cap or use higher cap. Framing: “expand your circle” not “unlock profiles.”
- **Before you build:** Read discovery.service.ts, ad.service.ts or billing for tier check pattern.
- **Cautions:** **Watch for "pay-to-match" perception.** As a soft monetization lever it's acceptable; as a hard wall it would damage the vibe. Monitor NPS/retention after rollout.
- **After you build:** ARCHITECTURE §4 (Discovery), Appendix A; DEV_HANDOVER; FEATURE_ADDITIONS_CRITIQUE Part 3 (implemented note).

### Phase C.2 — Premium feature gating

- **Existing:** `requireTier(n)` in middleware; `subscriptions` table with tier.
- **Add:** Feature flags per tier (e.g. features_json or tier → feature set); middleware or helper requireFeature('vault' | 'reveal_l3' | …). Use on relevant endpoints so UI and API stay in sync.
- **Before you build:** Read middleware/auth, billing/subscription.service.ts.
- **After you build:** ARCHITECTURE §7, §4; DEV_HANDOVER §14.

### Phase C.3 — Density-aware radius (optional)

- **Existing:** Discovery uses radius from request; MAX_DISCOVERY_RADIUS_KM in config.
- **Add:** Server-side logic that expands radius if nearby count &lt; N, contracts if &gt; M; return computed radius in response. Optional.
- **Before you build:** Read discovery.service.ts and how radius is used.
- **After you build:** ARCHITECTURE §4; Appendix A.

### Phase C.4 — Venue safety hooks (conditional)

- **Existing:** Safety module, panic flow; venue staff in venue-dashboard.
- **Add:** Only if venue staff and escalation model are stable: optional “distress to venue security” when user opts in and venue is partner.
- **Before you build:** Read safety.routes.ts, venue-dashboard (staff).
- **After you build:** ARCHITECTURE §4, §5; Appendix A; DEV_HANDOVER §11.

**After all of Phase C:** Full doc sync; tick Phase C; update ENHANCEMENT_ROADMAP “Last roadmap update.”

---

## Game-Changer Ideas (Backlog)

The full backlog (themed phases, existing hooks, before/after build) is in **docs/GAME_CHANGER_ROADMAP.md**. These are **not** in the phased sequence above. When implementing any of them:

1. **Check “Where existing things live”** so you extend, not duplicate.
2. **Follow the same “Before you build / After you build”** and doc sync.
3. **Add a line to this roadmap** under a new “Implemented game-changers” section with the idea name and branch/PR reference.

Examples to add when done: “Tonight” feed, venue vibe/theme nights, venue-issued passes, intent as first-class (Social/Curious/Lifestyle), “We’re new” / “Experienced” badges, etc.

---

## Progress Log (Update as You Go)

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 0 | ✅ Done | Trust-score param fixed; POST /v1/safety/screenshot added; deletion worker (process-deletions every 5m); panic response documented (notifications deferred) |
| Phase A.1 | ✅ Done | Reveal level (0–2), scope_type, scope_id (migration 011); blur.service + media GET enforce |
| Phase A.2 | ✅ Done | retention_mode, archive_at, default_message_ttl_seconds, is_archived (012); PUT retention; archive-conversations worker |
| Phase A.3 | ✅ Done | album_shares: share_target_type/id, watermark_mode, notify_on_view (013); share by persona/couple |
| Phase A.4 | ✅ Done | Stealth: preferences_json.neutral_notifications; push.service getStealthPreference + neutral title/body |
| Phase B.1 | ✅ Done | GET /v1/venues/:id/grid; venue_checkins.anonymous_mode (014); check-in body optional anonymousMode |
| Phase B.2 | ✅ Done | GET events/:id/attendees, events/:id/chat-rooms; event_post_prompts (015); lifecycle keep_chatting prompt |
| Phase B.3 | ✅ Done | whispers category, reveal_policy (016); max_per_day; one pending per (from,to) unique index |
| Phase C.1 | ✅ Done | Discovery: free=30 cap, premium/venue/event=50; discoveryCap, radiusUsedKm, computedRadiusKm in response |
| Phase C.2 | ✅ Done | requireFeature(feature) middleware; SubscriptionService.hasFeature; tier features_json |
| Phase C.3 | ✅ Done | Density-aware: computedRadiusKm when count < 15 and radius < max |
| Phase C.4 | ✅ Done | POST /v1/safety/venue-distress (checked-in user → notify venue staff via WebSocket) |

**Implemented game-changers:** (add when done)

- GC-1.1 Tonight feed: GET /v1/tonight (events + venues with currentAttendees; branch `shh-enhancement-trial`).
- GC-1.2 Venue vibe / theme nights: events.vibe_tag (migration 017), create/filter by vibe (branch `shh-enhancement-trial`).

---

## External Review (GPT) — Verdict & Cautions

*CTO-grade review of this roadmap. Summary preserved so it stays in scope.*

**Verdict:** This is the right roadmap, on the right branch, in the right order — **as long as UX simplicity and intent lanes are enforced ruthlessly.**

- **Roadmap quality:** Enterprise-grade. Gold standard, "where existing things live," phase gating, doc sync, additive-only, branch isolation.
- **Branch strategy:** Correct. Work stays on `shh-enhancement-trial` until merge approved.
- **Phase 0:** Non-negotiable; must complete before any new UX ships. Deletion worker: **anonymize first, hard delete later** (conservative).
- **Phase A:** Reveal = psychological safety net; keep levels 0–2 first, event/venue scoping later. Retention = defaults matter. Stealth = high ROI; App Store language careful. Vault = high stickiness, low friction.
- **Phase B:** Venue grid = strong gravity; anonymous mode default-friendly. Event engine = scene-based on-ramp; avoid notification spam post-event. Whispers = don't over-complicate reveal-on-response early.
- **Phase C:** Discovery cap = conditional yes; watch "pay-to-match" perception. Feature gating = good hygiene. Density radius = optional; don't tune prematurely.
- **Vibe / gravity / retention / revenue:** Roadmap preserves adult, calm, curious-friendly vibe; events + venues = front door; retention = installed-app retention; revenue = discretion + control, not pay-to-match.

---

## Risks & Cautions (Product/UX — Not Roadmap Flaws)

These are **product/UX risks** to hold in mind; they are not blockers and are not in the phase tables above.

1. **Onboarding narrative** — Singles need reassurance this isn't "a swinger trap"; lifestyle users need reassurance it's not "normie chaos." Intent lanes and event tags must do that work.
2. **Language discipline** — App Store / store copy must stay boring and safe. In-app copy can be warmer. Do not market stealth as "hide affairs."
3. **UX progressive disclosure** — Too many toggles too early = overwhelm. Defaults matter; reveal options and retention modes should be simple at first.

**Enforce intent lanes and UX simplicity at every step.**

---

## Reminder at Every Step

- **Follow and work with the existing.** No duplicates. Gold standard.
- **Update docs throughout** so scope is never lost: ARCHITECTURE, DEV_HANDOVER, Appendix A, this ENHANCEMENT_ROADMAP.
- **All work stays on branch `shh-enhancement-trial`.**
