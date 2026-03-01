# Shhh — Master Implementation Checklist

**Purpose:** Single comprehensive list to address everything in **E2E_CAPABILITY_AUDIT_REPORT.md** and all further capability/features discussed but not yet implemented across the docs.  
**Standard:** Production-grade (“million-dollar app”) — no school-project shortcuts.  
**Sources:** E2E_CAPABILITY_AUDIT_REPORT.md, FRONTEND_GAP_LIST.md, UX_UI_SPEC.md, UX_BEHAVIOR_SPEC.md, GAME_CHANGER_ROADMAP.md, ENHANCEMENT_ROADMAP.md, FEATURE_ADDITIONS_CRITIQUE.md, SYSTEM_REALITY_REPORT.md, SYSTEM_REALITY_REPORT_APPENDICES.md, ARCHITECTURE.md, DEV_HANDOVER.md.

---

## Quality Bar: Million-Dollar App

| Principle | Requirement |
|-----------|-------------|
| **No silent failures** | Every API error path has user-visible feedback (message or retry). No empty catch blocks. |
| **No placeholder data in production** | No hardcoded URLs, demo hashes, or fake IDs in user-facing flows (verification, checkout, etc.). |
| **Real-time where promised** | Chat uses WebSocket for join, new messages, typing. No “send and pray” only. |
| **Location from device** | Discovery and events use device location (or explicit “use my location”), not hardcoded coordinates. |
| **Safety copy matches behavior** | Panic and screenshot copy must not claim actions (e.g. “contacts notified”) that the backend does not perform. |
| **Accessibility** | Auth, safety (panic/block/report), and primary flows meet a11y gates (labels, focus, live regions). |
| **Configurable endpoints** | API base URL and upload base come from env (e.g. `EXPO_PUBLIC_API_URL`), not hardcoded localhost. |
| **Offline-aware** | App detects connectivity and shows a clear state (banner or message); critical actions queue or explain. |
| **Analytics (privacy-safe)** | Screen views and key actions instrumented; no PII in events. |
| **Backend completeness** | Deletion requests processed; screenshot route exists; panic either notifies contacts or copy is updated. |

---

## Tier 0: Critical Bugs & Backend Gaps (Ship-Blockers)

| ID | Action | Source | Notes |
|----|--------|--------|-------|
| 0.1 | **Fix trust-score route param** — Use `req.params.userId` only in `GET /v1/users/:userId/trust-score` (not `req.params.id`). | SYSTEM_REALITY_REPORT, APPENDICES D, E2E Audit §6 | `backend/src/app.ts` |
| 0.2 | **Implement or document POST /v1/safety/screenshot** — Add route and handler that writes to `screenshot_events`; or document no-op and update mobile to not rely on it. | E2E Audit §6, FRONTEND_GAP, SYSTEM_REALITY | Mobile `useScreenshotDetection` calls it; 404 today. |
| 0.3 | **Deletion worker** — Process `data_deletion_requests`: anonymize then hard delete; set `users.deleted_at`. No consumer exists today. | E2E Audit §6, ENHANCEMENT Phase 0, SYSTEM_REALITY | compliance.service.ts inserts only. |
| 0.4 | **Panic: notify contacts or fix copy** — Either implement SMS/push to emergency contacts when panic is triggered, or change response/copy so we never say “contacts notified” until true. | E2E Audit §6, UX_BEHAVIOR §3.5, APPENDICES C/D | safety.service.ts returns contactsNotified but does not send. |
| 0.5 | **Venue detail: fix upcoming event tap** — Change `router.push('/events')` to `router.push(\`/event/${ev.id}\`)` on venue [id] upcoming event card. | E2E Audit §3.2, FRONTEND_GAP 8.2 | mobile/app/venue/[id].tsx |
| 0.6 | **Verify-code: guard missing params** — When `phone` or `mode` is missing (e.g. direct deep link), redirect or show error instead of crashing. | E2E Audit §4.1, UX_UI §3.3, FRONTEND_GAP 6.7 | mobile (auth)/verify-code |

---

## Tier 1: Mobile — Fix Broken / Partial (From E2E Audit)

| ID | Action | Source | Notes |
|----|--------|--------|-------|
| 1.1 | **Discover: use device location** — Replace hardcoded 40.7128, -74.006 with location from useLocation or explicit “use my location” permission. | E2E §3.2, FRONTEND_GAP 3.5, UX_UI §3.5 | (tabs)/index.tsx |
| 1.2 | **Discover: loading + error UI** — Add initial loading spinner; on load error show inline message + retry (no empty catch). | E2E §3.2, §4.1, FRONTEND_GAP 3.4, 9.2 | (tabs)/index.tsx |
| 1.3 | **Discover: discovery cap message** — When API returns at cap (e.g. discoveryCap), show “You’ve reached today’s limit” or similar. | FRONTEND_GAP 3.4, UX_UI §3.5 | |
| 1.4 | **Messages: loading + error UI** — Loading indicator; error state with retry. | E2E §3.2, §4.1 | (tabs)/messages.tsx |
| 1.5 | **Messages: participant names + last message** — Backend to return participant names and last message snippet in GET conversations; mobile to display them. | E2E §3.2, UX_UI §3.6, FRONTEND_GAP 5.2 | API contract + (tabs)/messages.tsx |
| 1.6 | **Events: loading + error UI** — Loading indicator; error state with retry. | E2E §3.2, §4.1 | (tabs)/events.tsx |
| 1.7 | **Events: use device location** — Same as 1.1 for events tab. | E2E §3.2 | (tabs)/events.tsx |
| 1.8 | **Me: profile load spinner** — Show loading while profile is null on first load. | E2E §3.2 | (tabs)/profile.tsx |
| 1.9 | **Venue [id]: Share + Review handlers** — Implement Share (native share or deep link) and Review (navigate to review flow or external). | E2E §3.2, FRONTEND_GAP 8.1, UX_UI §3.13 | venue/[id].tsx |
| 1.10 | **Venue [id]: show venue grid** — Call GET /v1/venues/:id/grid and render grid section (tiles; privacy-safe). | E2E §3.3, FRONTEND_GAP 8.3, UX_UI §3.13 | venue/[id].tsx |
| 1.11 | **Chat: WebSocket integration** — On mount joinConversation(convId); subscribe onNewMessage and append; subscribe typing; on unmount leaveConversation. | E2E §3.2, §4.3, FRONTEND_GAP 5.1, UX_UI §3.9, §8.3 | chat/[id].tsx + useSocket |
| 1.12 | **Chat: camera/media handler** — Either implement pick camera/gallery → upload media → send message with attachment, or remove camera button. | E2E §3.2, §4.3, FRONTEND_GAP 5.3 | chat/[id].tsx |
| 1.13 | **Chat: loading + error UI** — Initial loading spinner; error state + retry for send/fetch. | E2E §3.2, §4.1 | chat/[id].tsx |
| 1.14 | **Album [id]: media grid thumbnails** — Use media URLs or thumbnail API for grid items instead of placeholder icon only. | E2E §3.2, §4.4, FRONTEND_GAP 7.2, UX_UI §3.15 | album/[id].tsx + API |
| 1.15 | **Album [id]: share options in UI** — Expose share_target_type (user/persona/couple), watermarkMode, notifyOnView where API supports. | FRONTEND_GAP, UX_UI §3.15 | album/[id].tsx |
| 1.16 | **Verify: real photo verification** — Camera or image picker → upload → pass returned URL (or mediaId) to POST verification/photo; remove placeholder URL. | E2E §3.2, §4.4, FRONTEND_GAP 7.3, UX_UI §3.17 | verify/index.tsx |
| 1.17 | **Verify: real ID verification** — When backend supports document upload/verification, replace demo documentHash with real flow; until then document as “coming soon” or hide. | E2E §3.2, UX_UI §3.17 | verify/index.tsx |
| 1.18 | **Subscription: open Stripe URL** — On checkout success, open checkoutUrl in browser (Linking.openURL) instead of Alert only. | E2E §3.2, FRONTEND_GAP 8.6, UX_UI §3.18 | subscription/index.tsx |
| 1.19 | **Subscription: refresh tier after return** — After webhook or app resume, refetch subscription and update UI/tier. | E2E §3.2, UX_UI §3.18 | subscription/index.tsx |
| 1.20 | **User profile: error UI** — On profile fetch failure show message + retry instead of only router.back(). | E2E §4.1 | user/[id].tsx |
| 1.21 | **Album index: loading + error UI** — Loading indicator; error state with retry. | E2E §4.1 | album/index.tsx |
| 1.22 | **Profile/Status: loading indicator** — Initial load spinner until presence/intents loaded. | E2E §4.1 | profile/status.tsx |

---

## Tier 2: Mobile — Cross-Cutting UX

| ID | Action | Source | Notes |
|----|--------|--------|-------|
| 2.1 | **Central error mapper** — Map API codes (RATE_LIMIT, TIER_REQUIRED, INVALID_OTP, etc.) to user-facing copy; use in API client or shared hook. | E2E §4.2, FRONTEND_GAP 9.5, UX_UI §6.3 | mobile/src/api/ or shared util |
| 2.2 | **Offline detection** — Use NetInfo; show offline banner or inline message; optionally queue failed mutations or explain “try when back online.” | E2E §4.1, FRONTEND_GAP 9.3, UX_UI §8.2 | Root layout or provider |
| 2.3 | **Accessibility: auth** — accessibilityLabel on Login/Register/Verify inputs and buttons; live region for errors. | E2E §4.5, FRONTEND_GAP 9.1, UX_BEHAVIOR §6.1 | (auth)/index, register, verify-code |
| 2.4 | **Accessibility: Discover** — Tiles labeled by name/role/distance; long-press announced. | E2E §4.5, UX_BEHAVIOR §6.2 | (tabs)/index.tsx |
| 2.5 | **Accessibility: conversation list** — Row accessibilityLabel with conversation name and last activity. | E2E §4.5, UX_BEHAVIOR §6.2 | (tabs)/messages.tsx |
| 2.6 | **Accessibility: tab bar** — Tabs as tab list with selected state; labels (Explore, Chat, Events, Me). | UX_BEHAVIOR §6.2 | (tabs)/_layout.tsx |
| 2.7 | **Accessibility: Panic / Block / Report** — Focusable and clearly announced (e.g. “Panic alert – double tap to send”). | E2E §4.5, UX_BEHAVIOR §6.1 | profile, user/[id], chat |
| 2.8 | **Accessibility: headings** — Venue, profile, and settings sections use semantic headings for screen reader navigation. | UX_BEHAVIOR §6.2, UX_UI §8.5 | venue, user, profile screens |
| 2.9 | **Analytics** — Integrate analytics SDK; fire screen_view and key actions (privacy-safe, no PII). | E2E §4.5, FRONTEND_GAP 9.4, UX_UI §8.6 | Root + key screens |
| 2.10 | **API base URL from env** — Use EXPO_PUBLIC_API_URL (or equivalent) for API_BASE and uploads; no hardcoded localhost/10.0.2.2. | E2E §4.4, FRONTEND_GAP 4, 7.4 | mobile/src/api/client.ts, ProfilePhoto |

---

## Tier 3: Mobile — Blur/Reveal & Media

| ID | Action | Source | Notes |
|----|--------|--------|-------|
| 3.1 | **Blur/reveal in discovery** — Call GET /v1/photos/check/:userId (or equivalent) for each discover tile; pass canSeeUnblurred into ProfilePhoto so blurred state is correct. | E2E §3.3, §4.4, FRONTEND_GAP 3.2, 7.1, UX_UI §1.3 | (tabs)/index.tsx |
| 3.2 | **Blur/reveal on user profile** — Same for user/[id]: check reveal for viewer → profile; pass to ProfilePhoto. | E2E §3.3, UX_UI §5.1 | user/[id].tsx |
| 3.3 | **Discovery grid thumbnails** — Use thumbnail URL from API for grid when available (or ?w= size param); improve quality per FRONTEND_GAP §4. | FRONTEND_GAP §4 | ProfilePhoto + discover API contract |

---

## Tier 4: Mobile — New Features (Backend Exists, No or Partial UI)

| ID | Action | Source | Notes |
|----|--------|--------|-------|
| 4.1 | **Stories** — Stories row on Explore; create story screen (pick media, optional venue); story viewer (tap circle → view, record view). Call GET /v1/stories/nearby, POST /v1/stories, GET view, viewers. | E2E §3.3, FRONTEND_GAP 2.1–2.3, GAME_CHANGER GC-5.1 | Backend done (026). |
| 4.2 | **Venue stories** — On venue detail show or link to GET /v1/venues/:id/stories. | E2E §3.3, FRONTEND_GAP 2.3 | venue/[id].tsx |
| 4.3 | **Tonight feed** — New tab or section: GET /v1/tonight (events + venues with currentAttendees). | E2E §3.3, FRONTEND_GAP 8.8, GAME_CHANGER GC-1.1 | Backend done. |
| 4.4 | **This-week events** — Events tab: add filter or section for GET /v1/events/this-week. | E2E §3.3, FRONTEND_GAP 8.10, GAME_CHANGER GC-6.2 | (tabs)/events.tsx |
| 4.5 | **Event vibe tags** — Show vibe_tag on event cards; filter chips (newbie_friendly, social_mix, talk_first). | E2E §3.3, FRONTEND_GAP 1.6, 8.10, UX_UI §7.2 | events list + filters |
| 4.6 | **at_event presence** — Add at_event to Status screen presence options. | E2E §3.3, FRONTEND_GAP 9.6, UX_UI §3.12 | profile/status.tsx |
| 4.7 | **Ads in Discover** — Render ad placements from ads/feed (or placements) in Discover using VenueAdCard; impression/tap/dismiss. | E2E §3.3, FRONTEND_GAP 8.7, UX_UI §5.2 | (tabs)/index.tsx |
| 4.8 | **Event edit (host)** — Screen to edit event: load event, form (title, description, start/end, door code, visibility), PUT /v1/events/:id. | E2E §3.3, FRONTEND_GAP 1.3 | profile/event-edit/[id] or similar |
| 4.9 | **Door code (host)** — UI for host to set door code: PUT /v1/events/:id/door-code. Validate flow for attendee if needed. | E2E §3.3, FRONTEND_GAP 1.3, 8.10 | Hosting or event dashboard |
| 4.10 | **Create event: venue/series/vibe** — Create event form: venue picker, optional series, vibe_tag, visibility options, location_revealed_after_rsvp. | E2E §3.3, FRONTEND_GAP 1.3, 1.4 | profile/create-event.tsx |
| 4.11 | **Content (guides, norms)** — Screen or modal for GET /v1/content/guides and /norms; link from onboarding or help. | E2E §3.3, FRONTEND_GAP 8.10, GAME_CHANGER GC-4.2 | New screen or Me menu |
| 4.12 | **Groups (tribes)** — List groups, join, view group events; GET/POST /v1/groups, join, GET :id/events. | E2E §3.3, FRONTEND_GAP 8.9, GAME_CHANGER GC-6.1 | Backend done (027). |

---

## Tier 5: Admin Dashboard

| ID | Action | Source | Notes |
|----|--------|--------|-------|
| 5.1 | **Admin: per-screen template** — Document each admin page (Intent, Entry, Exit, Data, States, Error, A11y) per UX_UI_SPEC §4. | UX_UI_SPEC §4 | Docs + light audit |
| 5.2 | **Admin: error and loading** — Ensure each page has loading and error state (no silent failures). | Quality bar | admin-dashboard pages |
| 5.3 | **Admin: accessibility** — Labels and structure for tables and actions (blocking for public launch per UX_BEHAVIOR §6). | UX_BEHAVIOR §6 | admin-dashboard |

---

## Tier 6: Backend-Only (No Frontend Change)

| ID | Action | Source | Notes |
|----|--------|--------|-------|
| 6.1 | **Production secret validation** — Startup check: JWT_SECRET, PHONE_HASH_PEPPER (and other critical env) set and non-default in prod. | SYSTEM_REALITY_REPORT | backend/src/config or index |
| 6.2 | **Redis eviction** — Use noeviction (or safe policy) for auth/OTP keys; document in ARCHITECTURE. | SYSTEM_REALITY_REPORT, APPENDICES H | docker-compose + docs |
| 6.3 | **Idempotency keys** — Optional: support Idempotency-Key on POST conversations, checkout, or other duplicate-sensitive routes. | SYSTEM_REALITY_REPORT | backend routes |
| 6.4 | **Observability** — Metrics (e.g. Prometheus) and/or tracing (OpenTelemetry); SLOs and alerting. | SYSTEM_REALITY_REPORT | backend |
| 6.5 | **Worker retry/DLQ** — Retry policy and dead-letter handling for BullMQ workers. | SYSTEM_REALITY_REPORT Capability Matrix | backend/src/workers |
| 6.6 | **Upload security** — File-type allowlist or magic-bytes check for uploads. | APPENDICES C, FEATURE_ADDITIONS_CRITIQUE | media.routes / multer |

---

## Tier 7: Game-Changer / Roadmap (Prioritized Backlog)

*Backend for many of these is already implemented on `shh-enhancement-trial` (see GAME_CHANGER_ROADMAP Progress Log). Mobile UI is the gap.*

| ID | Action | Source | Notes |
|----|--------|--------|-------|
| 7.1 | **Crossing paths nudge** — GET /v1/discover/crossing-paths; show “You’ve both been at [Venue] — say hi?” when opted in. | GAME_CHANGER GC-5.4 | Backend done. |
| 7.2 | **Consent as product** — Show conversation consent state (requiresMutualConsent, grantedByMe, “Revoke anytime”) in chat or conversation list. | GAME_CHANGER GC-6.3 | GET conversations returns consentState. |
| 7.3 | **Series and recurring events** — Browse series, follow, see upcoming; POST /v1/series, GET :id/upcoming, follow. | GAME_CHANGER GC-2.3 | Backend done (022). |
| 7.4 | **Private/gated events** — Event visibility rules (tier_min, invite_only, radius); show “Locked” or “Join to see” where applicable. | GAME_CHANGER GC-2.2 | Backend done (021). |
| 7.5 | **Verified safe venue badge** — Show verifiedSafe on venue cards and detail. | GAME_CHANGER GC-1.5 | Backend done (018). |
| 7.6 | **Venue density intelligence** — Venue dashboard: peak times, event-type performance (GET /v1/venues/:id/analytics/density). | GAME_CHANGER GC-1.4 | Backend done. |
| 7.7 | **Two-layer profile** — Public vs after_reveal/after_match; discovery shows SFW subset until reveal. | GAME_CHANGER GC-3.2 | Backend done (024). |
| 7.8 | **Tonight-only / burn persona** — Persona create with expires_at, is_burn; show in switcher. | GAME_CHANGER GC-5.5 | Backend done (026). |
| 7.9 | **“Why am I seeing this ad?”** — Modal explaining placement (e.g. “Because you’re near [Venue]”); backend returns placement metadata. | FEATURE_ADDITIONS_CRITIQUE §10, GAME_CHANGER GC-N.5 | Small API + client. |
| 7.10 | **Distress to venue security** — In-app entry for POST /v1/safety/venue-distress when checked in at partner venue. | GAME_CHANGER, ENHANCEMENT Phase C.4 | Backend done. |

---

## Tier 8: Discussed / Deferred (Record Only)

| ID | Item | Source | Verdict |
|----|------|--------|---------|
| 8.1 | E2EE on wire (client encrypt/decrypt) | SYSTEM_REALITY, FEATURE_ADDITIONS | Defer; server-side keys exist, client not wired. |
| 8.2 | Refresh token retry on 401 | UX_UI §6.2 | Optional; redirect to login is done. |
| 8.3 | Missed check-in alerts worker | SYSTEM_REALITY | No worker calls getMissedCheckins or sends alerts. |
| 8.4 | Voice drops | GAME_CHANGER, ENHANCEMENT | Defer. |
| 8.5 | Burner/relay number | GAME_CHANGER GC-7.7 | Defer. |
| 8.6 | Revenue share / attribution; white-label | GAME_CHANGER GC-1.6 | Defer. |
| 8.7 | Tickets and gates (Eventbrite/Stripe) | GAME_CHANGER GC-2.4 | Defer. |

---

## Summary Counts

| Tier | Description | Count |
|------|-------------|-------|
| 0 | Critical bugs & backend gaps | 6 |
| 1 | Mobile fix broken/partial | 22 |
| 2 | Mobile cross-cutting UX | 10 |
| 3 | Mobile blur/reveal & media | 3 |
| 4 | Mobile new features (backend exists) | 12 |
| 5 | Admin dashboard | 3 |
| 6 | Backend-only | 6 |
| 7 | Game-changer / roadmap | 10 |
| 8 | Deferred (record only) | 7 |

**Total actionable (Tiers 0–7):** 72 items.

---

## Implementation progress — full status (Tiers 0–7)

**Done: 17 | Remaining: 55** (Tier 8 is deferred, not counted.)

| Tier | ID | Status | Notes |
|------|----|--------|-------|
| 0 | 0.1 | ✅ Done | Trust-score already used `userId` in app.ts. |
| 0 | 0.2 | ✅ Done | POST /v1/safety/screenshot exists (safety.routes.ts). |
| 0 | 0.3 | ⬜ Todo | Deletion worker (process data_deletion_requests). |
| 0 | 0.4 | ✅ Done | Panic copy + success message; no “contacts notified” until true. |
| 0 | 0.5 | ✅ Done | Venue upcoming event tap → `/event/${ev.id}`. |
| 0 | 0.6 | ✅ Done | Verify-code guard when phone/mode missing. |
| 1 | 1.1 | ✅ Done | Discover: useLocation(); device lat/lng. |
| 1 | 1.2 | ✅ Done | Discover: loading + error UI with retry. |
| 1 | 1.3 | ⬜ Todo | Discover: discovery cap message when API at cap. |
| 1 | 1.4 | ✅ Done | Messages: loading + error UI with retry. |
| 1 | 1.5 | ⬜ Todo | Messages: participant names + last message (API + UI). |
| 1 | 1.6 | ✅ Done | Events: loading + error UI with retry. |
| 1 | 1.7 | ✅ Done | Events: useLocation() for nearby. |
| 1 | 1.8 | ✅ Done | Me: profile load spinner + loadProfile when missing. |
| 1 | 1.9 | ⬜ Todo | Venue [id]: Share + Review handlers. |
| 1 | 1.10 | ⬜ Todo | Venue [id]: show venue grid (GET /venues/:id/grid). |
| 1 | 1.11 | ✅ Done | Chat: WebSocket join, onNewMessage, leave. |
| 1 | 1.12 | ⬜ Todo | Chat: camera/media handler or remove button. |
| 1 | 1.13 | ✅ Done | Chat: loading + error UI with retry. |
| 1 | 1.14 | ⬜ Todo | Album [id]: media grid thumbnails (not placeholder icons). |
| 1 | 1.15 | ⬜ Todo | Album [id]: share options (watermarkMode, notifyOnView, share_target_type). |
| 1 | 1.16 | ⬜ Todo | Verify: real photo (camera/picker + upload). |
| 1 | 1.17 | ⬜ Todo | Verify: real ID flow or document “coming soon”. |
| 1 | 1.18 | ✅ Done | Subscription: open Stripe URL (Linking.openURL). |
| 1 | 1.19 | ✅ Done | Subscription: refetch tier on focus. |
| 1 | 1.20 | ✅ Done | User profile: error UI with retry + back. |
| 1 | 1.21 | ✅ Done | Album index: loading + error UI with retry. |
| 1 | 1.22 | ⬜ Todo | Profile/Status: loading indicator until presence/intents loaded. |
| 2 | 2.1 | ⬜ Todo | Central error mapper (API codes → user copy). |
| 2 | 2.2 | ⬜ Todo | Offline detection (NetInfo + banner). |
| 2 | 2.3 | ⬜ Todo | Accessibility: auth (labels, live region). |
| 2 | 2.4 | ⬜ Todo | Accessibility: Discover tiles. |
| 2 | 2.5 | ⬜ Todo | Accessibility: conversation list rows. |
| 2 | 2.6 | ⬜ Todo | Accessibility: tab bar. |
| 2 | 2.7 | ⬜ Todo | Accessibility: Panic / Block / Report. |
| 2 | 2.8 | ⬜ Todo | Accessibility: headings (venue, profile, settings). |
| 2 | 2.9 | ⬜ Todo | Analytics (screen_view, key actions, no PII). |
| 2 | 2.10 | ⬜ Todo | API base URL from env (EXPO_PUBLIC_API_URL). |
| 3 | 3.1 | ⬜ Todo | Blur/reveal in discovery (photos/check + ProfilePhoto). |
| 3 | 3.2 | ⬜ Todo | Blur/reveal on user profile. |
| 3 | 3.3 | ⬜ Todo | Discovery grid thumbnails (API or ?w= param). |
| 4 | 4.1 | ⬜ Todo | Stories (row, create, viewer). |
| 4 | 4.2 | ⬜ Todo | Venue stories on venue detail. |
| 4 | 4.3 | ⬜ Todo | Tonight feed (tab or section). |
| 4 | 4.4 | ⬜ Todo | This-week events filter/section. |
| 4 | 4.5 | ⬜ Todo | Event vibe tags on cards + filter chips. |
| 4 | 4.6 | ⬜ Todo | at_event presence on Status screen. |
| 4 | 4.7 | ⬜ Todo | Ads in Discover (VenueAdCard). |
| 4 | 4.8 | ⬜ Todo | Event edit screen (host). |
| 4 | 4.9 | ⬜ Todo | Door code UI (host). |
| 4 | 4.10 | ⬜ Todo | Create event: venue/series/vibe/visibility. |
| 4 | 4.11 | ⬜ Todo | Content (guides, norms) screen or modal. |
| 4 | 4.12 | ⬜ Todo | Groups (tribes) UI. |
| 5 | 5.1 | ⬜ Todo | Admin: per-screen template (docs). |
| 5 | 5.2 | ⬜ Todo | Admin: error and loading on each page. |
| 5 | 5.3 | ⬜ Todo | Admin: accessibility. |
| 6 | 6.1 | ⬜ Todo | Production secret validation (startup). |
| 6 | 6.2 | ⬜ Todo | Redis eviction policy (noeviction). |
| 6 | 6.3 | ⬜ Todo | Idempotency keys (optional). |
| 6 | 6.4 | ⬜ Todo | Observability (metrics/tracing). |
| 6 | 6.5 | ⬜ Todo | Worker retry/DLQ. |
| 6 | 6.6 | ⬜ Todo | Upload security (allowlist/magic-bytes). |
| 7 | 7.1 | ⬜ Todo | Crossing paths nudge UI. |
| 7 | 7.2 | ⬜ Todo | Consent as product in chat/list. |
| 7 | 7.3 | ⬜ Todo | Series and recurring events UI. |
| 7 | 7.4 | ⬜ Todo | Private/gated events UI. |
| 7 | 7.5 | ⬜ Todo | Verified safe venue badge. |
| 7 | 7.6 | ⬜ Todo | Venue density intelligence in dashboard. |
| 7 | 7.7 | ⬜ Todo | Two-layer profile UI. |
| 7 | 7.8 | ⬜ Todo | Tonight-only / burn persona UI. |
| 7 | 7.9 | ⬜ Todo | “Why am I seeing this ad?” modal. |
| 7 | 7.10 | ⬜ Todo | Distress to venue security entry. |

---

## Recommended Order of Attack

1. **Tier 0** — All before any marketing or “launch” claim.
2. **Tier 1** — Fixes 1.1–1.22 (location, loading, error, venue/chat/album/verify/subscription).
3. **Tier 2** — Error mapper, offline, a11y, analytics, API base env.
4. **Tier 3** — Blur/reveal and thumbnails.
5. **Tier 4** — Stories, Tonight, events filters, ads, event edit/door code, create-event expansion, content, groups.
6. **Tier 5** — Admin polish and a11y.
7. **Tier 6** — Backend hardening (secrets, Redis, idempotency, observability, workers, upload security).
8. **Tier 7** — Game-changer UI (crossing paths, consent, series, gated events, badges, density, two-layer profile, persona expiry, ad explainer, venue distress).

---

**End of Master Implementation Checklist.**  
For current system state see **E2E_CAPABILITY_AUDIT_REPORT.md**. For gap-by-gap tracking see **FRONTEND_GAP_LIST.md**. For backend reality see **SYSTEM_REALITY_REPORT.md** and **SYSTEM_REALITY_REPORT_APPENDICES.md**.
