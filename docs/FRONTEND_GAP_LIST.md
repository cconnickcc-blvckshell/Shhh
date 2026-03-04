# Frontend Gap List — Mobile App

> **Source**: Cross-reference of **ARCHITECTURE.md**, **UX_UI_SPEC.md**, and **UX_BEHAVIOR_SPEC.md** against the mobile app.  
> **Purpose**: Single list of missing or partial features on the frontend so they can be prioritized and implemented.

**Recent implementation (Phases 1–6):** Auth guard + premium splash, 401 → login, route guards in (tabs)/(auth). Event detail screen + “events open” from list. Report/block in chat (header menu), Emergency Contacts screen, Privacy & Data screen. Explore: radius + primaryIntent filters, Verified toggle, “Active now” sort. Conversation list: Direct/Group label, time ago, unread badge. Chat: loading state, empty state. **Phase 6:** Onboarding intent step (primary_intent + discovery_visible_to); Couples confirm-dissolution flow. **Event-host:** Me → Hosting (when isHost), “Events I’m hosting” (GET `/v1/events/my`), Create event form (POST `/v1/events`). **Venue controls** (owner/dashboard, create venue, staff, analytics): backend only — not in mobile. See git history for details.

---

## Summary

| Category | Count |
|----------|------|
| Events & hosts | 6 |
| Stories | 3 |
| Discovery & profile | 5 |
| Chat & real-time | 4 |
| Auth, onboarding, safety | 8 |
| Media & photos | 4 |
| Venues, albums, others | 10+ |
| Accessibility & polish | 6+ |

---

## 1. Events & event hosters

| # | Gap | Spec reference | Current state |
|---|-----|----------------|---------------|
| 1.1 | **Event detail screen** | ARCH: GET `/v1/events/:id`; UX_UI §3.7: tap card → venue. | **DONE.** `app/event/[id].tsx` added; Events tab taps open event detail (title, date/time, venue, vibe tag, description, RSVP, venue link). |
| 1.2 | **Events “don’t open”** | Same. | **DONE.** Tap event card → `/event/[id]` → event detail screen. |
| 1.3 | **Host-specific experience** | ARCH: POST `/v1/events` (tier 2), PUT `/v1/events/:id/door-code`; GAME_CHANGER: create events under venue/promoter. | **DONE.** Me → Hosting; Create event (venue picker, series ID, vibe, visibility); Edit event (`profile/event-edit/[id]`); Door code UI on event detail (host only). |
| 1.4 | **Create event (hosts)** | ARCH: POST `/v1/events` (tier 2). | **DONE.** `profile/create-event.tsx`: title, description, start/end, venue picker (nearby + my venues), series ID, event type, vibe, visibility, location_revealed_after_rsvp. |
| 1.5 | **Control host “page”** | UX expectation: event hosters have a different page (their events, controls). | **DONE.** Me → Hosting (host-only) → list of events I host + Create event. |
| 1.6 | **Event vibe tags in UI** | UX_UI §7.2: eventsApi.nearby and GET /v1/events/this-week support vibe; UI does not filter or show tags. | **DONE.** Events list shows vibe_tag on cards; filter chips for vibe selection. |

---

## 2. Stories

| # | Gap | Spec reference | Current state |
|---|-----|----------------|---------------|
| 2.1 | **Stories on Discover / home** | ARCH: GET `/v1/stories/nearby`, POST `/v1/stories`; GAME_CHANGER GC-5.1. | **DONE.** Explore has stories row (nearby circles + Add); `stories/create.tsx`, `stories/view/[id].tsx`. |
| 2.2 | **Create / view stories** | ARCH: POST `/v1/stories` (mediaId, venueId, ttlHours); GET `/v1/stories/:id/view`, `/viewers`. | **DONE.** Create screen (pick/take photo); viewer records view; tap circle → view story. |
| 2.3 | **Venue stories** | ARCH: GET `/v1/venues/:id/stories`. | **DONE.** Venue detail shows Stories section; `stories/venue/[id].tsx` for venue story viewer. |

---

## 3. Discovery & profile

| # | Gap | Spec reference | Current state |
|---|-----|----------------|---------------|
| 3.1 | **Duplicate key “hosting” (fixed)** | React list keys. | `profile.activeIntents` could contain duplicates (e.g. `hosting` twice), causing “two children with the same key” in UserDetailScreen. **Fixed** by rendering `[...new Set(profile.activeIntents)]`. |
| 3.2 | **Blur/reveal per viewer** | UX_UI §1.3, §5.1: pass `canSeeUnblurred` from GET `/v1/photos/check/:userId` into ProfilePhoto. | ProfilePhoto accepts `blurred` but discovery and user profile do not pass reveal state. No call to blur-check API; blur not driven by consent. |
| 3.3 | **Discovery filters** | UX_UI §7.2: primaryIntent, discovery_visible_to; ARCH: GET discover supports filters. | **DONE.** Explore passes `primaryIntent` from profile and `radius` (5/25/50 km); filter bar: radius chips, Verified toggle, “Nearest” / “Active now” sort. Location still hardcoded (see 3.5). |
| 3.4 | **Discovery cap / empty state** | UX_UI §3.5: discovery cap (30/50) from API; UI does not show “cap reached”. | **DONE.** Cap banner when API returns at cap; error state + retry on load. |
| 3.5 | **Location** | UX_UI §3.5: useLocation hook exists but Discover does not use it. | **DONE.** Discover and Events use useLocation(); device lat/lng. |

---

## 4. Profile pictures blurry on grid (Explore)

| Cause | Fix |
|-------|-----|
| **API base URL hardcoded** | `ProfilePhoto` and `client.ts` use `http://localhost:3000` (web) or `http://10.0.2.2:3000` (Android). If backend runs on another port (e.g. 3006), image requests go to the wrong host and can fail or look wrong. **Use env (e.g. `EXPO_PUBLIC_API_URL`) for API_BASE everywhere.** |
| **No thumbnails for grid** | Backend can store `thumbnailPath` (media.service, storage.service). Discovery returns `photosJson` with full paths (e.g. `/photos/stock/portrait_w1.jpg`). Grid uses full-size image in a small tile, so scaling down can look soft on high-DPI. **Option A**: Discovery/API returns thumbnail path for list/grid; ProfilePhoto uses it when `size` is small. **Option B**: Backend serves a size param (e.g. `?w=200`) and client uses it for grid. |
| **Blur style** | ProfilePhoto “blur” is `opacity: 0.3`, not a blur kernel. If `blurred` were ever passed true in discovery by mistake, photos would look washed out. Confirm discovery never passes `blurred` (it doesn’t today). |
| **Image resolution** | Ensure grid tile size is at least 1x–2x device pixel ratio (e.g. tileW * 2 for retina). React Native Image with `resizeMode="cover"` and explicit width/height is correct; ensure source image is sufficiently large or use thumbnail. |

**Recommended**: (1) Configurable API base via env. (2) Use or add thumbnail URL for discovery grid (backend already has thumbnails for uploads; discovery could return first photo + thumbnail path). (3) Do not pass `blurred` in discovery unless viewer has not revealed.

---

## 5. Chat & real-time

| # | Gap | Spec reference | Current state |
|---|-----|----------------|---------------|
| 5.1 | **WebSocket in chat** | UX_UI §3.9, §8.3: useSocket joinConversation, onNewMessage, typing. | Chat only does initial fetch and optimistic send. No joinConversation, onNewMessage, or typing. |
| 5.2 | **Conversation list copy** | UX_UI §3.6: participant names and last message snippet NOT IMPLEMENTED. | **PARTIAL.** List shows “Direct chat” / “Group chat”, time ago, unread badge, “Tap to open” / “No messages yet”. Participant names still require backend to return them. |
| 5.3 | **Camera / media in chat** | UX_UI §3.9: camera button no action. | Camera button has no handler. |
| 5.4 | **Self-destruct / ephemeral** | ARCH: message ttlSeconds, viewOnce. | Toggle exists; backend supports it; flow not fully verified end-to-end. |

---

## 6. Auth, onboarding, safety

| # | Gap | Spec reference | Current state |
|---|-----|----------------|---------------|
| 6.1 | **Auth route guard** | UX_UI §2.2: no global route guard. | **DONE.** `AuthGuard` + premium splash; (tabs)/_layout and (auth)/_layout redirect by auth state; root layout wraps Stack with AuthGuard. |
| 6.2 | **Onboarding intent** | UX_UI §7.2: onboarding does not set primary_intent or discovery_visible_to. | **DONE.** New screen `(auth)/onboarding-intent`: primary vibe (Social/Curious/Lifestyle/Couple) + who can see you (all/social_and_curious/same_intent). Persisted via PUT /v1/users/me. New users see slides → intent → tabs; returning users skip to tabs (expo-secure-store flag). |
| 6.3 | **Emergency contacts** | UX_UI §3.8: Emergency Contacts → no route (onPress empty). | **DONE.** `app/profile/emergency.tsx`: list, add (name, phone, relationship), remove; Me → Emergency Contacts. |
| 6.4 | **Privacy & Data** | UX_UI §3.8: Privacy & Data → no route. | **DONE.** `app/profile/privacy.tsx`: Export my data, Request account deletion; Me → Privacy & Data. |
| 6.5 | **Panic copy** | UX_BEHAVIOR §3.5, §4.3: do not say “contacts notified” if backend only records. | Confirm copy matches backend behavior (SYSTEM_REALITY_REPORT). |
| 6.6 | **Safety entry from Chat/Discover** | UX_BEHAVIOR §3.1: Safety/Report/Block in &lt;3 taps from any main context. | **DONE (Chat).** Chat header ⋯ menu: Block, Report, Safety info. Discover: profile has Block/Report on user detail; grid could add overflow later. |
| 6.7 | **Verify-code missing params** | UX_UI §3.3: missing params (phone/mode) can crash. | No guard when params missing. |
| 6.8 | **401 / token refresh** | UX_UI §6.2: no refresh token rotation on 401; no auto redirect to login. | **DONE (redirect).** On 401, API client calls `onUnauthorized` → `clearSession()` → redirect to `/(auth)`. No refresh-token retry yet. |

---

## 7. Media & photos

| # | Gap | Spec reference | Current state |
|---|-----|----------------|---------------|
| 7.1 | **Blur/reveal check** | See §3.2. | ProfilePhoto not given canSeeUnblurred; no integration with `/v1/photos/check/:userId`. |
| 7.2 | **Album media thumbnails** | UX_UI §3.15: media tiles show icon only; actual image thumbnails NOT IMPLEMENTED. | **DONE.** Album grid uses actual URLs from backend (getMediaUrl). |
| 7.3 | **Verification photo upload** | UX_UI §3.17: selfieUrl placeholder; real camera/picker and upload NOT IMPLEMENTED. | **DONE.** Verify screen: pick/take photo → upload → POST /v1/verification/photo. |
| 7.4 | **API base for images** | Same as §4. | **DONE.** EXPO_PUBLIC_API_URL; ProfilePhoto uses getMediaUrl from client. |

---

## 8. Venues, albums, others

| # | Gap | Spec reference | Current state |
|---|-----|----------------|---------------|
| 8.0 | **Venue controls (owner/dashboard)** | ARCH: POST `/v1/venues`, GET `/v1/venues/:id/dashboard`, venue-identity (claim, announcements, checkin, grid, stats, stories, chat-rooms), venue-dashboard (analytics, staff, reviews, specials). | **DONE (mobile).** Me → Venues (when verificationTier ≥ 2): GET `/v1/venues/my`, list “Venues I manage,” Create venue (POST `/v1/venues`), Venue Dashboard (realtime, today, upcoming events, specials, reviews, ads, Manage staff). Dashboard and staff/analytics routes require owner or staff (requireVenueAccess). Seed: The Purple Room owned by Marcus & Nia (+15550000003). |
| 8.1 | **Venue Share/Review** | UX_UI §3.13: Share/Review no-op. | **DONE.** Share uses native Share; Review navigates to `/venue/review/[id]`. |
| 8.2 | **Venue event card** | UX_UI §3.13: Event card → router.push('/events'). | **DONE.** Tap → `/event/${ev.id}`. |
| 8.3 | **Venue grid (GC-5.2)** | UX_UI §3.13: NOT IMPLEMENTED in venue screen. | **DONE.** Venue detail calls GET `/v1/venues/:id/grid`; renders grid section. |
| 8.4 | **Un-RSVP** | UX_UI §3.7: no DELETE or “not_going” API call. | **DONE.** Event detail calls `eventsApi.rsvp(id, 'going'|'not_going')`; toggle reflects server state. |
| 8.5 | **Couple dissolution confirm** | UX_UI §3.16: confirm dissolution NOT IMPLEMENTED. | **DONE.** Couple screen shows "Confirm dissolution" when dissolution requested; calls POST `/v1/couples/confirm-dissolution`. Both partners can confirm; after cooldown and both confirmed, link dissolves. |
| 8.6 | **Stripe checkout in app** | UX_UI §3.18: opening Stripe URL in browser NOT IMPLEMENTED. | Upgrade shows Alert with URL only. |
| 8.7 | **Ads in Discover** | UX_UI §5.2: VenueAdCard NOT REFERENCED. | **DONE.** Discover fetches ads/feed; VenueAdCard with impression tracking. |
| 8.8 | **Tonight feed** | ARCH: GET `/v1/tonight`. | **DONE.** Events tab has Tonight section (horizontal scroll of events + venues). |
| 8.9 | **Groups (tribes)** | ARCH: GET/POST `/v1/groups`, join, events. | **DONE.** `groups/index.tsx`, `groups/[id].tsx`; Me → Groups. |
| 8.10 | **Content (guides, norms)** | ARCH: GET `/v1/content/guides`, `/norms`. | **DONE.** `content/guides.tsx`, `content/norms.tsx`; Me → Guides, Community Norms. |

---

## 9. Accessibility & polish

| # | Gap | Spec reference | Current state |
|---|-----|----------------|---------------|
| 9.1 | **A11Y labels** | UX_BEHAVIOR §6.1–6.3; UX_UI §8.5. | **DONE (partial).** Auth: accessibilityLabel on inputs, buttons, links; error live region. Discover tiles: name + distance + hint. Panic: accessibilityHint. Chat menu: options button. Tab bar still needs labels. |
| 9.2 | **Error UI** | UX_UI: many screens have NOT IMPLEMENTED error (load catch empty). | **DONE.** Discover, Messages, Events, Chat, Album, User: SafeState or inline error + retry. mapApiError for user copy. |
| 9.3 | **Offline** | UX_UI §8.2: no NetInfo or offline banner. | **DONE.** NetInfo + OfflineBanner in root layout. |
| 9.4 | **Analytics** | UX_UI §8.6: no analytics SDK or events. | **DONE (stub).** analytics.ts + useScreenView; screen_view on login, discover, messages, profile. No PII. |
| 9.5 | **Central error mapper** | UX_UI §6.3: no central mapping of API codes to user-facing copy. | **DONE.** mobile/src/utils/errorMapper.ts; used in Discover, Messages, Events, Chat, Album, User. |
| 9.6 | **at_event presence** | UX_UI §3.12: at_event not in PRESENCE_STATES list in UI; backend supports it. | **DONE.** Status screen includes at_event option. |

---

## 10. Quick reference: backend exists, mobile missing

- **Event detail**: GET `/v1/events/:id` — **DONE.** Event detail screen + RSVP.
- **My hosted events**: GET `/v1/events/my` — **DONE.** Hosting screen.
- **Create event**: POST `/v1/events` — **DONE.** Create event form with venue picker, series, vibe, visibility, location_revealed_after_rsvp.
- **Update event**: PUT `/v1/events/:id` — **DONE.** Edit event screen (host only).
- **Door code**: PUT `/v1/events/:id/door-code` — **DONE.** Event detail (host only).
- **Venue owner / dashboard**: GET `/v1/venues/:id/dashboard` — **DONE.** Me → Venues → tap venue → dashboard.
- **Create venue**: POST `/v1/venues` — **DONE.** Me → Venues → Create venue.
- **My venues**: GET `/v1/venues/my` — **DONE.** Me → Venues list (owner/staff).
- **Stories**: POST/GET `/v1/stories`, GET nearby, view, viewers — **DONE.** Stories row, create, viewer, venue stories.
- **Tonight**: GET `/v1/tonight` — **DONE.** Tonight section in Events tab.
- **Groups**: GET/POST `/v1/groups`, join, events — **DONE.** Groups list + detail.
- **Venue grid**: GET `/v1/venues/:id/grid` — **DONE.** Venue detail grid section.
- **Venue stories**: GET `/v1/venues/:id/stories` — **DONE.** Venue detail + stories/venue/[id].
- **Blur check**: GET `/v1/photos/check/:userId` — **TODO.** Not yet used in ProfilePhoto.
- **This week events**: GET `/v1/events/this-week` — **DONE.** Events tab filter.

---

**End of Frontend Gap List.** Prioritize by user impact (e.g. events opening, host flows, stories, then blur/reveal, then a11y and polish).
