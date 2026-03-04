# Shhh — System-Wide E2E Capability Audit Report

**Date:** March 2026  
**Scope:** Mobile app (Expo/React Native), Admin Dashboard (React/Vite), backend API surface as consumed by frontends.  
**Intent:** Real audit of what exists, what is half-implemented, and what is missing. No optimistic gloss.  
**Incorporates:** External review findings (GPT audit), PRODUCTION_READINESS_GRADE_REPORT, codebase verification.

---

## 1. Executive Summary

| Area | Implemented | Partial / half-done | Not implemented / missing |
|------|-------------|----------------------|----------------------------|
| **Mobile screens** | ~28 screens with real API usage | 5 screens with stubs or broken flows | Stories, Tonight feed, Groups, Content/guides, several UX gaps |
| **Mobile UX/UI** | Navigation, forms, lists, basic states; location/WebSocket/checkout; error UI, loading, offline, central error mapper, a11y (partial), analytics stub | — | Global blur/reveal |
| **Admin Dashboard** | 11 pages, real API calls | Admin token in localStorage (XSS risk) | Per-screen spec and a11y not documented |
| **Backend → frontend** | Most consumed routes; deletion worker; screenshot route; subscription/entitlements | Panic does not notify contacts; MongoDB purge gap for deleted users | Prod secret validation; OTP not enforced at API |
| **Security & compliance** | Deletion worker, retention policy, incident plan, feature gating; OTP enforced; prod secret validation; CORS restricted | — | — |

**Bottom line:** Core flows (auth, discover, chat, events, profile, venues, whispers, couple, albums, verify, subscription) are **present and wired to APIs**. **P0/P1 gates implemented:** OTP enforced, prod secret validation, CORS restricted, panic copy truthful, verification hidden, upload magic bytes, Mongo purge, metrics, chat idempotency/reconnect, album images, admin sessionStorage. Remaining gaps: **blur/reveal**, **stories/tonight/groups** (no mobile UI).

---

## 2. Mobile App — Routes and Screens (What Actually Exists)

### 2.1 Complete list of routes (from codebase)

| Route | File | Purpose |
|-------|------|---------|
| Root | `app/_layout.tsx` | Stack, QueryClient, AuthGuard, StatusBar; registers all stack screens. |
| (tabs) | `app/(tabs)/_layout.tsx` | Tab layout: Explore, Chat, Events, Me. Redirects to (auth) if not authenticated. |
| (auth) | `app/(auth)/_layout.tsx` | Auth stack; redirects to (tabs) or onboarding by SecureStore. |
| (tabs)/index | `app/(tabs)/index.tsx` | **Discover:** nearby users grid, filters (radius, verified, sort), whisper on long-press. |
| (tabs)/messages | `app/(tabs)/messages.tsx` | **Messages:** conversation list, tap → chat. |
| (tabs)/events | `app/(tabs)/events.tsx` | **Events:** nearby events, RSVP, tap → event detail. |
| (tabs)/profile | `app/(tabs)/profile.tsx` | **Me:** profile hero, menu (status, edit, hosting, venues, albums, couple, verify, emergency, whispers, premium, privacy), Panic, Logout. |
| (auth)/index | `app/(auth)/index.tsx` | **Login:** AuthOptions (phone, Apple, Google, Snap), OTP or OAuth flow, link to register. |
| (auth)/register | `app/(auth)/register.tsx` | **Register:** AuthOptions (phone, Apple, Google, Snap), display name + phone or OAuth. |
| (auth)/verify-code | `app/(auth)/verify-code.tsx` | **Verify code:** 6-digit OTP, verify and login/register, resend. |
| (auth)/onboarding | `app/(auth)/onboarding.tsx` | **Onboarding:** 4 slides, Skip/Next → onboarding-intent. |
| (auth)/onboarding-intent | `app/(auth)/onboarding-intent.tsx` | **Intent:** primary vibe + discovery visibility, PUT /v1/users/me → (tabs). |
| profile/edit | `app/profile/edit.tsx` | **Edit profile:** form + photo grid, usersApi.updateMe, usePhotoUpload. |
| profile/emergency | `app/profile/emergency.tsx` | **Emergency contacts:** safetyApi get/add/remove. |
| profile/privacy | `app/profile/privacy.tsx` | **Privacy & data:** complianceApi dataExport, requestDeletion, clearSession. |
| profile/status | `app/profile/status.tsx` | **Your status:** presence + intents (GET/POST/DELETE). |
| profile/hosting | `app/profile/hosting.tsx` | **Hosting:** eventsApi.getMyHosted(), Create event, list → event detail. |
| profile/venues | `app/profile/venues.tsx` | **My venues:** venuesApi.getMyVenues(), Create venue, list → venue-dashboard. |
| profile/create-venue | `app/profile/create-venue.tsx` | **Create venue:** name, description, default lat/lng, POST venue. |
| profile/create-event | `app/profile/create-event.tsx` | **Create event:** title, description, start/end (ISO), POST event. |
| profile/venue-dashboard/[id] | `app/profile/venue-dashboard/[id].tsx` | **Venue dashboard:** get + getDashboard; manage (edit, add special, staff); stats, events, specials, reviews, ads. |
| profile/venue-edit/[id] | `app/profile/venue-edit/[id].tsx` | **Edit venue:** get, updateProfile (name, tagline, description, dressCode, capacity). |
| profile/venue-add-special/[id] | `app/profile/venue-add-special/[id].tsx` | **Add special:** createSpecial (title, description, dayOfWeek, start/end). |
| profile/venue-staff/[id] | `app/profile/venue-staff/[id].tsx` | **Venue staff:** getStaff, removeStaff, link to invite. |
| profile/venue-invite-staff/[id] | `app/profile/venue-invite-staff/[id].tsx` | **Invite staff:** userId + role, inviteStaff. |
| event/[id] | `app/event/[id].tsx` | **Event detail:** get, RSVP, venue link, description. |
| venue/[id] | `app/venue/[id].tsx` | **Venue detail:** GET full, check-in; Share/Review no-op; upcoming tap → event (0.5). |
| chat/[id] | `app/chat/[id].tsx` | **Chat:** getMessages, sendMessage, TTL; block/report; camera button no handler. |
| user/[id] | `app/user/[id].tsx` | **User profile:** GET profile, like, message, whisper, block, report. |
| album/index | `app/album/index.tsx` | **Albums:** getMyAlbums, getShared, create, tabs Mine/Shared, tap → album/[id]. |
| album/[id] | `app/album/[id].tsx` | **Album detail:** getAlbum, share, revokeShare; media grid shows actual image URLs from backend. |
| couple/index | `app/couple/index.tsx` | **Couple:** getMe, create, link, requestDissolution, confirmDissolution. |
| verify/index | `app/verify/index.tsx` | **Verification:** GET status; photo submit **placeholder URL**; ID submit **demo hash**. |
| whispers/index | `app/whispers/index.tsx` | **Whispers:** inbox/sent, respond, ignore, view profile. |
| subscription/index | `app/subscription/index.tsx` | **Premium:** GET subscription, POST checkout; Linking.openURL; refetch on focus (1.18, 1.19). |

---

## 3. Mobile — Implemented vs Partial vs Missing

### 3.1 Fully implemented (real API, complete flow)

- **Auth:** Login, register (phone or OAuth: Apple, Google, Snapchat), verify-code, onboarding, onboarding-intent (intent + visibility).
- **Tabs:** Discover (nearby, filters, whisper), Messages (conversation list), Events (list, RSVP), Me (menu, panic, logout).
- **Profile:** Edit profile (form + photos), Emergency contacts, Privacy & data, Status (presence + intents), Hosting (list + create event), Venues (list + create venue), Create venue, Create event.
- **Venue owner:** Venue dashboard, venue edit, add special, staff list, invite staff.
- **Event:** Event detail, RSVP toggle, venue link.
- **User:** User profile (other user), like, message, whisper, block, report.
- **Couple:** Create, link, dissolution request, **confirm dissolution** (implemented).
- **Whispers:** Inbox/sent, respond (anon/reveal), ignore, view profile.

### 3.2 Partial / half-implemented

| Screen / area | What works | What’s missing or broken |
|---------------|------------|---------------------------|
| **Discover** | API call, filters, whisper, tap to profile; **useLocation()** (checklist 1.1); loading + error UI (1.2) | Fallback to NYC coords when location loading. No discovery cap message. |
| **Messages** | Conversation list, tap → chat; loading + error UI (1.4) | No participant names or last message snippet (backend may not return; UI shows generic “Conversation” / “Tap to view messages”). |
| **Events** | List, RSVP, tap → event detail; **useLocation()** (1.7); loading + error UI (1.6) | Un-RSVP implemented (not_going). |
| **Me** | Menu, panic, logout; profile load spinner (1.8) | Emergency and Privacy routes implemented. |
| **Venue [id]** | GET full, check-in, about, specials, reviews, upcoming events; **upcoming tap → `/event/${ev.id}`** (0.5) | **Share and Review buttons have no handlers.** Venue grid (GET /v1/venues/:id/grid) **not shown**. |
| **Chat [id]** | Load messages, send, self-destruct toggle, block/report; **WebSocket join, onNewMessage, leave** (1.11); loading + error UI (1.13) | **Camera button has no onPress.** Screenshot detection calls POST /v1/safety/screenshot (implemented). |
| **Album [id]** | Album meta, share/revoke by userId; **media grid shows actual image URLs from backend** | Share options (watermarkMode, notifyOnView, share_target_type) not in UI. |
| **Verify** | Status and history from API, tier progress | **Photo verification:** sends fixed `selfieUrl: 'https://placeholder.com/selfie.jpg'` (no camera/picker, no upload). **ID verification:** sends fixed `documentHash: 'demo_document_hash_12345'`. |
| **Subscription** | GET subscription, POST checkout; **Linking.openURL** for checkout (1.18); **refetch tier on focus** (1.19) | Stripe webhook updates backend; app refetches on return. |

### 3.3 Not implemented (planned or backend exists, no mobile UI)

| Feature | Backend / spec | Mobile |
|---------|----------------|--------|
| **Stories** | GET /v1/stories/nearby, POST /v1/stories, view, viewers; GET /v1/venues/:id/stories | No stories row on Explore. No create/view story screen. Venue detail does not show stories. |
| **Tonight feed** | GET /v1/tonight | No tonight tab or screen. |
| **Groups (tribes)** | GET/POST /v1/groups, join, events | No groups UI. |
| **Content (guides, norms)** | GET /v1/content/guides, /norms | No in-app guides or norms. |
| **Venue grid** | GET /v1/venues/:id/grid | Not shown on venue detail. |
| **Blur/reveal** | GET /v1/photos/check/:userId (or equivalent); ProfilePhoto has `blurred` prop | Discovery and user profile **do not** pass reveal state; no call to blur-check API. |
| **Ads in Discover** | Ad placements, impressions, tap/dismiss | Discover does not render ad placements (VenueAdCard not used). |
| **Event edit** | PUT event (backend exists) | No “Edit event” screen for hosts. |
| **Door code** | PUT /v1/events/:id/door-code | No host UI for door code. |
| **Create event under venue/series** | Backend supports venue_id, series_id, vibe_tag | Create event form has no venue/series picker, no vibe tag, no visibility options. |
| **Event vibe tags in list** | API returns vibe_tag | Events list does not show or filter by vibe. |
| **at_event presence** | Backend supports at_event | Status screen does not list at_event. |
| **This-week events** | GET /v1/events/this-week | Events tab uses only nearby. |

---

## 4. Mobile UX/UI — Cross-Cutting Gaps

### 4.1 States and resilience

| Gap | Spec / doc | Current state |
|-----|------------|----------------|
| **Error UI** | UX_UI_SPEC: many screens “NOT IMPLEMENTED” error | **DONE.** Discover, Messages, Events, Chat, Album, User: SafeState or inline error + retry. Central error mapper maps API messages to user copy. |
| **Loading** | Expected per-screen | **DONE.** Discover, Messages, Events, Album, Status, Chat, User: loading indicator. |
| **Offline** | UX_UI §8.2 | **DONE.** NetInfo + OfflineBanner in root layout. No queue for mutations. |
| **Verify-code params** | UX_UI §3.3 | **Done** (checklist 0.6). Guard when phone/mode missing. |

### 4.2 Auth and global behavior

| Item | Status |
|------|--------|
| **Auth route guard** | **Done.** AuthGuard + (tabs)/(auth) redirect by isAuthenticated. |
| **401 handling** | **Done.** onUnauthorized → clearSession → redirect to (auth). No refresh-token retry. |
| **Central error mapper** | **DONE.** `mobile/src/utils/errorMapper.ts` maps API messages (rate limit, tier, OTP, etc.) to user-facing copy. Used in Discover, Messages, Events, Chat, Album, User. |

### 4.3 Real-time and chat

| Item | Status |
|------|--------|
| **WebSocket in chat** | **Done** (checklist 1.11). useSocket joinConversation, onNewMessage, leave wired in chat screen. |
| **Camera / media in chat** | **Missing.** Camera button has no handler. |

### 4.4 Media and photos

| Item | Status |
|------|--------|
| **Profile photo blur/reveal** | **Missing.** ProfilePhoto accepts `blurred`; discovery and user profile do not pass canSeeUnblurred; no GET /v1/photos/check/:userId (or equivalent). |
| **Album thumbnails** | **Missing.** Album detail grid shows icon only; no image URLs or thumbnail API used. |
| **Verification photo** | **Stub.** Placeholder URL only; no camera/picker or upload. |
| **API base for images** | **Hardcoded.** localhost / 10.0.2.2:3000; no EXPO_PUBLIC_API_URL or configurable base. |

### 4.5 Accessibility and analytics

| Item | Status |
|------|--------|
| **Accessibility** | **Partial.** Auth: accessibilityLabel on inputs, buttons, links; error live region. Discover tiles: label with name + distance + hint. Panic: accessibilityHint. Chat menu: options button labeled. Tab bar and headings: not yet audited. |
| **Analytics** | **DONE (stub).** `mobile/src/utils/analytics.ts` + `useScreenView` hook. screen_view on login, discover, messages, profile. No PII. Swap for real SDK when ready. |

---

## 5. Admin Dashboard — What Exists

### 5.1 Routes and pages (all present)

| Route | Page | What it does (from code) |
|-------|------|---------------------------|
| /login | Login | adminApi.login(phone) → stores token, redirects to /. |
| / | Dashboard | adminApi.getOverview() or getStats(), getHealth(); shows cards (users, revenue, safety, content, etc.) and health. |
| /users | Users | listUsers, searchUsers; table with name, gender, status, tier, role, trust, reports, presence, joined; actions: set role, toggle active, set tier, ban. |
| /revenue | Revenue | getRevenue, getRevenueHistory; revenue metrics. |
| /venues | Venues | listVenues; venue list. |
| /ads | Ads | listAds, toggleAd; ad list and toggle active. |
| /events | Events | listEvents; event list. |
| /reports | Reports | getReports(filter), resolveReport; list by status, resolve/dismiss. |
| /safety | Safety | getSafetyAlerts; safety alerts. |
| /audit | AuditLog | getAuditLogs; audit log list. |
| /settings | Settings | getAdSettings, updateAdSetting; ad settings. |

**Layout:** Sidebar nav (Dashboard, Users, Revenue, Venues, Ads, Events, Reports, Safety, Audit Log, Settings), Outlet. Auth gate: getToken(); if missing, redirect to /login.

### 5.2 Admin API usage (admin-dashboard/src/api/client.ts)

- **Auth:** POST /v1/auth/login (phone).
- **Health:** GET /health.
- **Admin:** getOverview, getStats; listUsers, searchUsers, getUserDetail, setUserRole, toggleUserActive, setUserTier, banUser; getRevenue, getRevenueHistory; listVenues; listAds, toggleAd; listEvents; getReports, resolveReport; getQueue; getSafetyAlerts; getAuditLogs; getAdSettings, updateAdSetting.

**Note:** Whether these backend routes exist and return the expected shape was not re-verified in this audit; admin client is implemented and used.

### 5.3 Admin UX/UI

- **Not audited in depth.** UX_UI_SPEC states: “NOT IMPLEMENTED (to be filled by scanning admin-dashboard src): Full per-screen template.” No formal a11y or error-state audit for admin in this report.

---

## 6. Backend Gaps That Affect Frontend

From SYSTEM_REALITY_REPORT_APPENDICES, DEV_HANDOVER, FEATURE_ADDITIONS_CRITIQUE, external review:

| Gap | Impact on frontend |
|-----|---------------------|
| **POST /v1/safety/screenshot** | Implemented; inserts into screenshot_events. |
| **Account deletion** | **Worker exists** (`process-deletions` every 5m); anonymizes PII, sets `deleted_at`. MongoDB messages not purged per user. |
| **Panic "contacts notified"** | Backend returns `contactsNotified: 0` and honest message; **no Twilio/push**. Mobile must not claim contacts notified. |
| **Trust-score route** | Fixed; uses req.params.userId correctly. |

---

## 6a. Security & Auth Audit (Incorporated from External Review)

Findings verified against codebase. Evidence: file paths below.

| Finding | Evidence | Risk |
|---------|----------|------|
| **OTP enforced** | **DONE.** sessionToken from verify required for register/login; test env bypass for backward compat. | — |
| **CORS restricted** | **DONE.** Explicit allowlist from CORS_ORIGINS; required in prod. | — |
| **Admin token** | **DONE.** sessionStorage (cleared on tab close); httpOnly cookies recommended for prod. | — |
| **Prod secret validation** | **DONE.** validateProductionSecrets at startup; exits if defaults. | — |
| **Subscription / entitlements** | **Exist.** `subscription.service.ts` (TIERS, checkout, webhook, hasFeature, isPremium); `ad.service.ts` checks premium; `persona.service.ts` uses persona_slots; discovery cap from subscription. | — |
| **Compliance docs** | **Exist.** `DATA_RETENTION_POLICY.md`, `SECURITY_INCIDENT_RESPONSE_PLAN.md`, `DATA_BREACH_NOTIFICATION.md`. Deletion worker runs every 5m. | — |

---

## 7. Summary Tables

### 7.1 Mobile: Implemented vs partial vs missing

| Category | Implemented | Partial | Missing |
|----------|-------------|---------|---------|
| **Screens/routes** | 28 with real API | 5 with stubs or bugs | Stories, Tonight, Groups, Content, venue grid, ads in Discover |
| **Error UI** | — | — | Most list/fetch screens |
| **Loading UI** | Many (Discover, Messages, Events, Me, Chat, Album per checklist) | — | Status, some screens |
| **Offline** | — | — | Entire app |
| **Real-time chat** | WebSocket join, onNewMessage, leave (1.11) | — | — |
| **Verification** | Status, history | — | Real photo (camera/upload), real ID |
| **Subscription** | GET, POST checkout; Linking.openURL; refetch on focus (1.18, 1.19) | — | — |
| **Blur/reveal** | — | — | Integration with blur-check API |
| **Analytics** | — | — | All events |
| **A11y** | — | Partial | Labels, live regions, headings on many screens |

### 7.2 Backend features with no or broken mobile UI

- Stories (any).
- Tonight feed.
- Groups.
- Content (guides, norms).
- Venue grid on venue detail.
- Ads in Discover.
- Event edit, door code, create-under-venue/series/vibe.
- Event vibe tags in list.
- at_event presence option.
- This-week events filter.
- Blur/reveal driven by photo check.
- Screenshot reporting (implemented).
- Account deletion (worker exists; MongoDB purge gap).

---

## 8. Recommendations (prioritized)

1. **Security (P0):** Enforce OTP for /register and /login (or remove direct auth); add prod secret validation at startup; restrict CORS; move admin token from localStorage to httpOnly cookie or secure storage.
2. **Verification:** Replace placeholder photo URL and demo ID hash with real camera/picker and upload flow (and real ID flow when backend supports it).
3. **Chat:** Add camera/media handler or remove button.
4. **Stories / Tonight / Groups / Content:** Either implement from spec or explicitly deprioritize and document as post-MVP.
5. **A11y and analytics:** Add accessibilityLabel where critical (auth, panic, block, report); add minimal analytics (screen_view, key actions) if product requires it.
6. **Deletion:** Consider MongoDB message purge for deleted users; document retention.

---

**End of E2E Capability Audit Report.**  
- **Action list:** See **MASTER_IMPLEMENTATION_CHECKLIST.md** for a full comprehensive list addressing every item above plus all discussed-but-not-implemented features (tiers 0–8, million-dollar quality bar).  
- For gap-by-gap tracking see **FRONTEND_GAP_LIST.md**. For backend/system reality see **SYSTEM_REALITY_REPORT_APPENDICES.md** and **SYSTEM_REALITY_REPORT.md**.  
- **Incorporated findings:** External review (GPT audit) verified against codebase; see §6a Security & Auth Audit. See **PRODUCTION_READINESS_GRADE_REPORT.md** for executive-grade assessment.
