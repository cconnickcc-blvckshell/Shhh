# Shhh — Scope / Pivot Todo (don’t lose scope)

**Use this when you pivot away and come back:** it’s the single list of what’s **done** vs **still to do** so you don’t lose scope.  
**Source of truth for actions:** **MASTER_IMPLEMENTATION_CHECKLIST.md** (full descriptions). This doc is the scannable checklist.

**Last updated:** February 2026 (after Tier 0 + Tier 1 batch).

---

## Summary

| Tier | Description | Done | Remaining |
|------|-------------|------|-----------|
| 0 | Critical bugs & backend gaps | 5 | 1 |
| 1 | Mobile fix broken/partial | 12 | 10 |
| 2 | Mobile cross-cutting UX | 0 | 10 |
| 3 | Mobile blur/reveal & media | 0 | 3 |
| 4 | Mobile new features (backend exists) | 0 | 12 |
| 5 | Admin dashboard | 0 | 3 |
| 6 | Backend-only | 0 | 6 |
| 7 | Game-changer / roadmap UI | 0 | 10 |
| **Total** | | **17** | **55** |

Tier 8 items are **deferred** (record only); not in the 52 remaining.

---

## ✅ Done (17 items) — for reference only

- **0.1** Trust-score route param (already correct)  
- **0.2** Screenshot route (already exists)  
- **0.4** Panic copy + success message  
- **0.5** Venue upcoming event → `/event/[id]`  
- **0.6** Verify-code guard (missing phone/mode)  
- **1.1** Discover: device location  
- **1.2** Discover: loading + error UI  
- **1.4** Messages: loading + error UI  
- **1.6** Events: loading + error UI  
- **1.7** Events: device location  
- **1.8** Me: profile load spinner  
- **1.11** Chat: WebSocket (join, newMessage, leave)  
- **1.13** Chat: loading + error UI  
- **1.18** Subscription: open Stripe URL  
- **1.19** Subscription: refetch on focus  
- **1.20** User profile: error UI with retry  
- **1.21** Album index: loading + error UI  

---

## ⬜ Remaining — comprehensive todo list

When you return, pick a tier or a batch below and implement. Update **MASTER_IMPLEMENTATION_CHECKLIST.md** and this file when you complete items.

---

### Tier 0 — ship-blockers (1 left)

| ID | Action | Where |
|----|--------|--------|
| 0.3 | Deletion worker: process `data_deletion_requests`, anonymize then hard delete, set `users.deleted_at` | backend: compliance worker / cron |

---

### Tier 1 — mobile fixes (10 left)

| ID | Action | Where |
|----|--------|--------|
| 1.3 | Discover: show “You’ve reached today’s limit” when API returns discoveryCap | (tabs)/index.tsx |
| 1.5 | Messages: participant names + last message snippet (API + UI) | backend GET conversations; (tabs)/messages.tsx |
| 1.9 | Venue [id]: Share + Review handlers (native share or deep link; review flow) | venue/[id].tsx |
| 1.10 | Venue [id]: show venue grid — GET /v1/venues/:id/grid | venue/[id].tsx |
| 1.12 | Chat: camera/media handler (pick → upload → send) or remove camera button | chat/[id].tsx |
| 1.14 | Album [id]: media grid thumbnails (real URLs, not placeholder icons) | album/[id].tsx + API |
| 1.15 | Album [id]: share options (watermarkMode, notifyOnView, share_target_type) | album/[id].tsx |
| 1.16 | Verify: real photo verification (camera/picker → upload → POST verification/photo) | verify/index.tsx |
| 1.17 | Verify: real ID verification or “coming soon” / hide | verify/index.tsx |
| 1.22 | Profile/Status: loading indicator until presence/intents loaded | profile/status.tsx |

---

### Tier 2 — cross-cutting UX (10)

| ID | Action | Where |
|----|--------|--------|
| 2.1 | Central error mapper (RATE_LIMIT, TIER_REQUIRED, etc. → user copy) | mobile api/util |
| 2.2 | Offline detection (NetInfo + banner or message) | root layout / provider |
| 2.3 | Accessibility: auth (accessibilityLabel, live region for errors) | (auth)/index, register, verify-code |
| 2.4 | Accessibility: Discover tiles (name/role/distance) | (tabs)/index.tsx |
| 2.5 | Accessibility: conversation list row labels | (tabs)/messages.tsx |
| 2.6 | Accessibility: tab bar (tab list, selected state, labels) | (tabs)/_layout.tsx |
| 2.7 | Accessibility: Panic / Block / Report (focusable, announced) | profile, user/[id], chat |
| 2.8 | Accessibility: headings (venue, profile, settings sections) | venue, user, profile screens |
| 2.9 | Analytics (screen_view, key actions, no PII) | root + key screens |
| 2.10 | API base URL from env (EXPO_PUBLIC_API_URL) | client.ts, ProfilePhoto |

---

### Tier 3 — blur/reveal & media (3)

| ID | Action | Where |
|----|--------|--------|
| 3.1 | Blur/reveal in discovery (GET photos/check/:userId → ProfilePhoto canSeeUnblurred) | (tabs)/index.tsx |
| 3.2 | Blur/reveal on user profile | user/[id].tsx |
| 3.3 | Discovery grid thumbnails (API or ?w= param) | ProfilePhoto + discover API |

---

### Tier 4 — new features, backend exists (12)

| ID | Action | Where |
|----|--------|--------|
| 4.1 | Stories: row on Explore, create story, story viewer | new screens + (tabs)/index |
| 4.2 | Venue stories on venue detail | venue/[id].tsx |
| 4.3 | Tonight feed (tab or section) — GET /v1/tonight | new tab/section |
| 4.4 | This-week events filter/section — GET /v1/events/this-week | (tabs)/events.tsx |
| 4.5 | Event vibe tags on cards + filter chips | events list |
| 4.6 | at_event presence on Status screen | profile/status.tsx |
| 4.7 | Ads in Discover (VenueAdCard, impression/tap/dismiss) | (tabs)/index.tsx |
| 4.8 | Event edit screen (host) | profile/event-edit/[id] or similar |
| 4.9 | Door code UI (host) — PUT /v1/events/:id/door-code | hosting / event dashboard |
| 4.10 | Create event: venue picker, series, vibe_tag, visibility, location_revealed_after_rsvp | profile/create-event.tsx |
| 4.11 | Content (guides, norms) — GET /v1/content/guides, /norms | new screen or Me menu |
| 4.12 | Groups (tribes) UI — list, join, group events | new screens |

---

### Tier 5 — admin (3)

| ID | Action | Where |
|----|--------|--------|
| 5.1 | Admin: per-screen template (Intent, Entry, Exit, Data, States, Error, A11y) | docs + audit |
| 5.2 | Admin: error and loading on each page | admin-dashboard pages |
| 5.3 | Admin: accessibility (labels, structure) | admin-dashboard |

---

### Tier 6 — backend-only (6)

| ID | Action | Where |
|----|--------|--------|
| 6.1 | Production secret validation at startup | backend config/index |
| 6.2 | Redis eviction noeviction (or safe policy) | docker-compose + docs |
| 6.3 | Idempotency keys (optional) on POST conversations, checkout | backend routes |
| 6.4 | Observability (metrics/tracing, SLOs, alerting) | backend |
| 6.5 | Worker retry/DLQ (BullMQ) | backend/src/workers |
| 6.6 | Upload security (file-type allowlist or magic-bytes) | media.routes / multer |

---

### Tier 7 — game-changer UI (10)

| ID | Action | Where |
|----|--------|--------|
| 7.1 | Crossing paths nudge — GET /v1/discover/crossing-paths | Discover or dedicated |
| 7.2 | Consent as product (consentState, “Revoke anytime”) in chat/list | chat, messages |
| 7.3 | Series and recurring events UI (browse, follow, upcoming) | events / new screens |
| 7.4 | Private/gated events UI (“Locked” / “Join to see”) | events |
| 7.5 | Verified safe venue badge on cards and detail | venue cards, venue/[id] |
| 7.6 | Venue density intelligence in dashboard | venue dashboard |
| 7.7 | Two-layer profile UI (public vs after_reveal/after_match) | discovery, profile |
| 7.8 | Tonight-only / burn persona (expires_at, is_burn in switcher) | persona UI |
| 7.9 | “Why am I seeing this ad?” modal | ads + backend placement metadata |
| 7.10 | Distress to venue security entry when checked in | safety / venue |

---

## When you return — suggested next batches

1. **Finish Tier 0:** 0.3 (deletion worker).  
2. **Finish Tier 1:** 1.3, 1.9, 1.10, 1.12, 1.14, 1.15, 1.16, 1.17, 1.22 (then 1.5 when backend is ready).  
3. **Quick wins (Tier 2):** 2.10 (API env), 2.1 (error mapper), 2.2 (offline banner).  
4. **Then:** Tier 2 a11y (2.3–2.8), Tier 3 blur/reveal, Tier 4 by priority (Tonight, Stories, event edit, etc.).

---

## Cross-references

- **Full actions and sources:** MASTER_IMPLEMENTATION_CHECKLIST.md  
- **Current system state:** E2E_CAPABILITY_AUDIT_REPORT.md  
- **Gap-by-gap:** FRONTEND_GAP_LIST.md  
- **Backend reality:** SYSTEM_REALITY_REPORT.md, SYSTEM_REALITY_REPORT_APPENDICES.md  

**After completing items:** set status to ✅ in MASTER_IMPLEMENTATION_CHECKLIST.md “Implementation progress” table and move the item from “Remaining” to “Done” in this file (or update the counts and table).
