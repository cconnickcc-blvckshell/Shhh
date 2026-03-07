# Shhh — UX/UI Specification

> **Version**: 1.2.0 | **Last updated**: March 2026  
> **Purpose**: Frontend/visual counterpart to **ARCHITECTURE.md**. Screens, layout, components, interactions, and how the UI connects to the backend.  
> **Scope**: Mobile app (React Native + Expo 55, expo-router), Admin Dashboard (React + Vite). Routes and implementation status aligned with current codebase and **DEV_HANDOVER.md** §6; **E2E_CAPABILITY_AUDIT_REPORT.md** and **MASTER_IMPLEMENTATION_CHECKLIST.md** for full gap list.  
> **Companion**: **UX_BEHAVIOR_SPEC.md** (invariants, user states, safety flows, copy, a11y gates).

---

## Table of Contents

1. [Overview & Design System](#1-overview--design-system)
2. [Navigation & Entry](#2-navigation--entry)
3. [Mobile Screens (per-screen template)](#3-mobile-screens-per-screen-template)
4. [Admin Dashboard Screens](#4-admin-dashboard-screens)
5. [Component Library](#5-component-library)
6. [Store + API Contracts for UI](#6-store--api-contracts-for-ui)
7. [Singles Exposure Path (Curious Mode)](#7-singles-exposure-path-curious-mode)
8. [Cross-Cutting](#8-cross-cutting)

**Related:** **UX_BEHAVIOR_SPEC.md** (invariants, user states, safety flows, copy, a11y gates) | **ARCHITECTURE.md** (backend) | **DEV_HANDOVER.md** (API reference).

---

## 1. Overview & Design System

### 1.1 Tech Stack

| Surface | Stack | State / Data |
|--------|--------|--------------|
| Mobile | React Native, Expo 55, expo-router | Zustand (`useAuthStore`), `@tanstack/react-query` (root), local `useState` per screen |
| Admin | React, Vite, react-router-dom | @tanstack/react-query, layout wrapper |

### 1.2 Theme (mobile/src/constants/theme.ts)

- **Colors**: Primary `#9333EA`, background `#050508`, surface `#0E0B16`, text `#F4F0FA`, accent `#C084FC`, heart `#EC4899`; status: success/warning/danger/info; borders, overlays.
- **Spacing**: xxs(2) → xxl(48).
- **Font sizes**: xxs(10) → hero(36).
- **Border radii**: xs(4) → full(9999).
- **Shadows**: `glow` (purple), `card`.
- **Animation**: `animation.modalDuration(280)`, `animation.fadeDuration(200)`, `animation.navDuration(250)` — shared timing for modals, fades, nav transitions.

### 1.3 Imagery & Media

- Profile photos: JSONB array of paths; served from backend `/uploads`; client builds URL via `API_BASE + '/uploads' + path`. Blur applied client-side based on viewer context. Placeholder: Ionicons `person`.
- **Implemented:** ProfilePhoto receives `canSeeUnblurred` (from GET `/v1/photos/check/:userId` via hook `useCanSeeUnblurred`). Discovery tiles, user profile hero, and own profile pass it; single authority for blur. Legacy `blurred` prop still supported for backward compatibility.

---

## 2. Navigation & Entry

### 2.1 Mobile (expo-router, file-based)

- **Root** (`app/_layout.tsx`): Stack with `(auth)`, `(tabs)`, and stack screens. QueryClientProvider wraps app; **AuthGuard** wraps children and redirects unauthenticated users to `/(auth)`; 401 triggers `onUnauthorized` (clear session, redirect to login).
- **Auth group** `(auth)/`: index (login), register, verify-code, onboarding, onboarding-intent. No tab bar.
- **Tabs** `(tabs)/`: index (Explore/Discover), messages (Chat), events (Events), profile (Me). Tab bar: 64px height, purple active, bottom.
- **Stack (no tab bar)**: chat/[id], user/[id], venue/[id], event/[id], album/index, album/[id], couple/index, verify/index, subscription/index, whispers/index; profile/edit, profile/status, profile/emergency, profile/privacy, profile/hosting, profile/create-event, profile/venues, profile/create-venue, profile/venue-dashboard/[id], profile/venue-edit/[id], profile/venue-add-special/[id], profile/venue-staff/[id], profile/venue-invite-staff/[id].

### 2.2 Auth Gate

- **Implemented:** `AuthGuard` in `app/_layout.tsx` checks auth state; unauthenticated users are redirected to `/(auth)`; authenticated users leaving `/(auth)` go to `/(tabs)` or onboarding as appropriate. On 401 from API, `onUnauthorized` clears tokens and redirects to login.

### 2.3 Admin Dashboard

- **Routes**: `/login` (standalone), then under Layout: `/`, `/users`, `/revenue`, `/venues`, `/ads`, `/events`, `/reports`, `/moderation`, `/safety`, `/audit`, `/settings`, `/map`.

---

## 3. Mobile Screens (per-screen template)

For each screen: Intent, Entry points, Exit paths, Data dependencies (API), Store state, Layout, Components, Interactions, States (loading/empty/error/offline), Edge cases, Analytics events (privacy-safe), Accessibility.

---

### 3.1 (auth)/index — Login (and Web Entry Shell)

| Field | Description |
|-------|-------------|
| **Intent** | On web: first show Entry Shell (tone, “Enter”, “Learn how it works”); then login. AuthOptions: phone, Apple, Google, Snapchat — each with pros/cons. Phone leads into OTP; OAuth uses native flows then POST /auth/oauth/{apple|google|snap}. |
| **Entry points** | App cold start when not authenticated; link from Register "Already a member? Log in". On web, Entry Shell is the first view; “Enter” reveals AuthOptions then login form. |
| **Exit paths** | Phone: navigate to `/(auth)/verify-code` (params: phone, mode: 'login') or direct to `/(tabs)` if login succeeds. OAuth: POST /auth/oauth/* → tokens → `/(tabs)`. Link to `/(auth)/register`. |
| **Data dependencies (API)** | POST `/v1/auth/login` (phone + sessionToken); POST `/v1/auth/phone/send-code` (body: phone); POST `/v1/auth/oauth/apple`, `/oauth/google`, `/oauth/snap` (idToken or authCode). |
| **Store state** | `useAuthStore`: sendOTP, login, oauthApple, oauthGoogle, oauthSnap, isLoading, error, clearError. |
| **Layout** | AuthOptions first (phone, Apple, Google, Snap with pros/cons). Phone path: glow blob, logo, tagline, form (phone input), "Continue", link to register. KeyboardAvoidingView. |
| **Components** | AuthOptions (reusable); inline Text, TextInput, TouchableOpacity, ActivityIndicator, Ionicons. |
| **Interactions** | Select auth method; phone: enter phone (≥10 chars), tap Continue → send OTP and navigate; OAuth: tap provider → native flow → tokens. Tap Sign up → register. |
| **States** | **Loading**: button shows ActivityIndicator. **Error**: error box with alert icon and store error (mapApiError). **Empty**: default; no empty list. **Offline**: OfflineBanner in root layout. |
| **Edge cases** | Invalid phone length: button disabled. Rate limit (5/15min): error from API shown; no specific copy. Dev mode: devCode in alert. |
| **Analytics events** | NOT IMPLEMENTED. Suggested (privacy-safe): screen_view login, action send_otp_request, action login_success / login_fallback_otp. |
| **Accessibility** | Labels not wired to inputs (PHONE NUMBER is visual only). No accessibilityLabel on button/link. |

---

### 3.2 (auth)/register — Registration

| Field | Description |
|-------|-------------|
| **Intent** | Create account: AuthOptions (phone, Apple, Google, Snap). Phone: display name + phone, then OTP. OAuth: optional display name, then provider flow. |
| **Entry points** | Link from Login "Don't have an account? Sign up". |
| **Exit paths** | Phone: navigate to `/(auth)/verify-code` (params: phone, mode: 'register', displayName). OAuth: POST /auth/oauth/* → tokens → `/(auth)/onboarding`. Link to `/(auth)`. |
| **Data dependencies (API)** | POST `/v1/auth/phone/send-code`; POST `/v1/auth/register` (phone, displayName, sessionToken); POST `/v1/auth/oauth/apple`, `/oauth/google`, `/oauth/snap`. |
| **Store state** | useAuthStore: sendOTP, register, oauthApple, oauthGoogle, oauthSnap, isLoading, error, clearError. |
| **Layout** | AuthOptions first; phone path: glow, icon (sparkles), "Join Shhh", Display Name input, Phone input, "Get Started", "Already a member? Log in". |
| **Components** | AuthOptions (reusable); inline only. |
| **Interactions** | Select auth method; phone: fill display name (≥2) and phone (≥10), tap Get Started → send OTP and go to verify-code. OAuth: tap provider → flow. |
| **States** | Loading/error/empty/offline: same as login; no offline handling. |
| **Edge cases** | Same rate limit as login. Dev: registerDirect on send OTP failure. |
| **Analytics events** | NOT IMPLEMENTED. |
| **Accessibility** | Same gaps as login. |

---

### 3.3 (auth)/verify-code — OTP verification

| Field | Description |
|-------|-------------|
| **Intent** | Enter 6-digit OTP to complete login or registration. |
| **Entry points** | From login or register after send OTP; params: phone, mode ('login' | 'register'), displayName (if register). |
| **Exit paths** | Back arrow → router.back(). Success login → `/(tabs)`; success register → `/(auth)/onboarding`. |
| **Data dependencies (API)** | POST `/v1/auth/phone/verify` (phone, code) → returns sessionToken; then authApi.login or authApi.register (sessionToken required in prod). |
| **Store state** | useAuthStore: verifyAndLogin, verifyAndRegister, sendOTP. Local: digits[6], loading, error, resendTimer(60s). |
| **Layout** | Back, glow, icon, "Verify your number", "Enter the 6-digit code sent to", masked phone, 6 digit inputs, error line, resend "Resend code in Ns" / "Resend verification code". |
| **Components** | Inline only. |
| **Interactions** | Type digits (auto-advance); on 6 digits submit; Backspace moves focus back; Resend when timer 0. |
| **States** | Loading: ActivityIndicator. Error: red box, digits cleared, focus first. Empty: initial. |
| **Edge cases** | Wrong code: error message. Resend rate limit: from API. Missing params (phone/mode): guard in place — redirect or safe fallback when phone/mode missing. |
| **Analytics events** | NOT IMPLEMENTED. |
| **Accessibility** | No live region for error; digit inputs not grouped with label. |

---

### 3.4 (auth)/onboarding — Post-registration onboarding

| Field | Description |
|-------|-------------|
| **Intent** | Educate new users: signal vs profile, blur/reveal, ephemeral design, safety. |
| **Entry points** | After verifyAndRegister, router.replace('/(auth)/onboarding'). |
| **Exit paths** | Skip → `/(tabs)`. "Get Started" on last slide → `/(tabs)`. "Next" → next slide. |
| **Data dependencies (API)** | None. |
| **Store state** | None. Local: currentIndex, flatListRef. |
| **Layout** | Skip (top right), horizontal paged FlatList (4 slides), footer: dot indicators, "Next" / "Get Started" button. |
| **Components** | Inline only. Slides: icon, title, subtitle (accent color), body text. |
| **Interactions** | Swipe (scrollEnabled false — so only button/skip advance); tap Next/Get Started; tap Skip. |
| **States** | No loading/empty/error. |
| **Edge cases** | onMomentumScrollEnd syncs index with scroll (user could not swipe; scrollEnabled=false). |
| **Analytics events** | NOT IMPLEMENTED. Suggested: onboarding_slide_view, onboarding_complete, onboarding_skip. |
| **Accessibility** | No semantic "slide" or page control; dots not exposed as tab list. |

**Singles/Curious**: Onboarding does not set `primary_intent` or `discovery_visible_to`. See §7.

---

### 3.5 (tabs)/index — Discover (Explore)

| Field | Description |
|-------|-------------|
| **Intent** | Show nearby users in a grid; tap to profile, long-press to whisper; swipe to like/pass. |
| **Entry points** | Tab "Explore" (first tab); post-login default tab. |
| **Exit paths** | Tap tile → `/user/[userId]`. Long-press → in-place whisper overlay; send → overlay closes. Swipe right (native) → Messages tab. |
| **Data dependencies (API)** | POST `/v1/discover/location` (lat, lng); GET `/v1/discover?lat=&lng=&radius=50`. POST `/v1/whispers` (toUserId, message) for whisper. POST `/v1/users/:id/like`, `/v1/users/:id/pass` on swipe. |
| **Store state** | None. Local: users[], refreshing, whisperTarget, whisperText. |
| **Layout** | Social proof bar ("X people nearby right now") when users.length > 0. Full-screen FlatList, 2 or 3 columns (by width), 1.5px gap; pull-to-refresh. Whisper overlay: bottom bar with input, send, close. ListEmpty: compass icon, "No one nearby", "Pull down to refresh", CTA "Start something → Create an event". |
| **Components** | **DiscoverTile** (ProfilePhoto, presence bar, host badge, shield badge, intent badge, presence dot, distance/gender). Swipe gestures (Gesture.Pan) for like/pass. Left-edge strip for swipe-right-to-Messages. |
| **Interactions** | Tap tile → user profile. Long-press (400ms) → vibration, open whisper bar; type, send or close. **Swipe right** on tile → like (optimistic); **swipe left** → pass. **Swipe right** from left edge → Messages tab. Pull to refresh → variable reward toast ("X new people nearby") when count increases. |
| **States** | **Loading**: spinner/loading state when fetching. **Empty**: ListEmptyComponent with CTA. **Error**: error UI with retry. **Offline**: not implemented. |
| **Edge cases** | Location from **useLocation()** (web fallback to NYC 40.7128, -74.006). Discovery cap (30/50) from API; UI does not show "cap reached". |
| **Analytics events** | NOT IMPLEMENTED. |
| **Accessibility** | Tiles not labeled by name/role; long-press not announced. |

---

### 3.6 (tabs)/messages — Conversations list

| Field | Description |
|-------|-------------|
| **Intent** | List conversations; open chat on tap. |
| **Entry points** | Tab "Chat". |
| **Exit paths** | Tap row → `/chat/[id]`. |
| **Data dependencies (API)** | GET `/v1/conversations`. |
| **Store state** | None. Local: convos[], refreshing. |
| **Layout** | FlatList of rows: avatar (person/people icon + online dot), "Conversation" title, timeAgo(last_message_at), "Tap to view messages", unread badge. ListEmpty: icon, "No conversations", "Match with someone to start chatting". |
| **Components** | Inline only. |
| **Interactions** | Tap row → chat. Pull to refresh. |
| **States** | **Loading**: loading state shown. **Empty**: ListEmptyComponent. **Error**: error UI with retry. |
| **Edge cases** | Conversation list may show "Conversation" and "Tap to view messages" if API does not return participant names/last message; real names/snippet require API support and UI display. |
| **Analytics events** | NOT IMPLEMENTED. |
| **Accessibility** | Row has no accessibilityLabel with name/count. |

---

### 3.7 (tabs)/events — Nearby events

| Field | Description |
|-------|-------------|
| **Intent** | List nearby events; RSVP (heart); tap venue to venue detail. |
| **Entry points** | Tab "Events". |
| **Exit paths** | Tap card (if venue_id) → `/venue/[venue_id]`. Tap heart → toggle RSVP. |
| **Data dependencies (API)** | GET `/v1/events/nearby?lat=&lng=`, GET `/v1/tonight/feed`. POST `/v1/events/:id/rsvp` (status: 'going'; Idempotency-Key). |
| **Store state** | None. Local: events[], attending (Set<id>), refreshing, tonightFeed. |
| **Layout** | "TONIGHT" section header with badge ("X going tonight" from attendee counts). FlatList of cards: banner (sparkles), date box (day, month), title, time, attendee count, venue name, description, heart button. ListEmpty: flame icon, "No events nearby", CTA "Start something → Create an event". |
| **Components** | Inline only. |
| **Interactions** | Tap card → venue if venue_id else no nav. Tap heart → rsvp('going') or remove from attending (optimistic; idempotency key for retries). Pull to refresh. |
| **States** | **Loading**: loading state when fetching. **Empty**: ListEmptyComponent with CTA. **Error**: error UI. |
| **Edge cases** | Location from useLocation (web fallback NYC). Un-RSVP: local state; backend may support DELETE or "not_going" — check API. |
| **Analytics events** | NOT IMPLEMENTED. |
| **Accessibility** | Card not labeled by event name + date. |

---

### 3.8 (tabs)/profile — Me (profile + menu)

| Field | Description |
|-------|-------------|
| **Intent** | Show self profile summary and navigation to status, edit, albums, couple, verification, emergency, whispers, premium, privacy. |
| **Entry points** | Tab "Me". |
| **Exit paths** | Your Status → `/profile/status`. Edit Profile → `/profile/edit`. My Albums → `/album`. Couple → `/couple`. Verification → `/verify`. Emergency Contacts → no route (onPress empty). Whispers → `/whispers`. Premium → `/subscription`. Privacy & Data → no route. Panic Alert → confirm then safetyApi.panic. Log Out → logout(). |
| **Data dependencies (API)** | Profile from store (loaded via GET `/v1/users/me`). Panic: POST `/v1/safety/panic`. |
| **Store state** | useAuthStore: profile, userId, logout. |
| **Layout** | ScrollView: hero (ProfilePhoto, name, bio), **User ID row** (label, truncated ID, copy icon; tap copies to clipboard), stat pills (verification, experience, host), kinks tags, menu card (rows with icon, label, optional badge, chevron), Panic button (red), Log out. |
| **Components** | **ProfilePhoto**. Inline: StatPill, MenuItem (icon, label, onPress, badge, accent). User ID row uses expo-clipboard. |
| **Interactions** | Tap menu items; tap User ID → copy to clipboard, Alert "Copied"; tap Panic → Alert then API; tap Log out. |
| **States** | **Loading**: profile load spinner; loadProfile() when profile missing. **Empty**: name fallback "User". **Error**: error UI. |
| **Edge cases** | Emergency Contacts → `/profile/emergency`; Privacy & Data → `/profile/privacy` (screens exist). |
| **Analytics events** | NOT IMPLEMENTED. |
| **Accessibility** | Menu items not grouped; Panic should be clearly labeled. |

---

### 3.9 chat/[id] — Chat

| Field | Description |
|-------|-------------|
| **Intent** | View messages, send text; optional self-destruct; future: camera/media. |
| **Entry points** | From messages list; from user profile "Message". |
| **Exit paths** | Header back → previous screen. |
| **Data dependencies (API)** | GET `/v1/conversations/:id/messages`. POST `/v1/conversations/:id/messages` (content, contentType, ttlSeconds). |
| **Store state** | useAuthStore.userId for mine/theirs. Local: msgs[], input, selfDestruct, listRef. |
| **Layout** | "Reconnecting…" banner when useSocket.reconnecting. KeyboardAvoidingView: inverted FlatList (messages), input bar: timer (self-destruct toggle), camera (no handler), TextInput, send. Header: "Chat" (Stack config). |
| **Components** | Inline bubbles (mine/theirs), self-destruct label, time. **Optimistic send:** temp message with "Sending…" until API response. **Failed messages:** "Tap to try again" with retry icon; bubble border highlight. |
| **Interactions** | Type and send (optimistic UI); tap failed message to retry; toggle timer for self-destruct (30s); camera button NOT IMPLEMENTED — no action. |
| **States** | **Loading**: loading state. **Empty**: no messages. **Error**: error UI. **Offline**: not implemented. **Reconnecting**: banner at top. **Failed message**: tap to retry. |
| **Edge cases** | **WebSocket:** useSocket joinConversation, onNewMessage, leaveConversation wired; real-time messages and typing supported. useScreenshotDetection reports screenshots. |
| **Analytics events** | NOT IMPLEMENTED. |
| **Accessibility** | Messages not announced as sender + content; input has no label. |

---

### 3.10 user/[id] — User profile (other user)

| Field | Description |
|-------|-------------|
| **Intent** | View another user's profile; like, message, whisper, block, report. |
| **Entry points** | From Discover tile; from Whisper "View Profile" (after reveal). |
| **Exit paths** | Back → previous. Block → usersApi.block then router.back(). View Profile (whisper) → same screen. |
| **Data dependencies (API)** | GET `/v1/users/:id/profile`. POST `/v1/users/:id/like`. POST `/v1/conversations` (create). POST `/v1/whispers`. POST `/v1/users/:id/block`. POST `/v1/users/:id/report`. |
| **Store state** | useAuthStore.userId. Local: profile, whisperText, showWhisper, liked. |
| **Layout** | ScrollView: hero (ProfilePhoto fill, back, presence badge), **privacy cue badge** ("Only visible to matches" when profileVisibilityTier=after_match; "Visible after reveal" when after_reveal), name/age/shield, meta (gender, showAsRole, showAsRelationship), intents chips, bio, interests, stats (experience, references, rating, host), trust row, action buttons (block, whisper, like, message), whisper box (if open), report link, "Member since". |
| **Components** | **ProfilePhoto** (photosJson, fill). Inline: presence badge, privacy cue badge, intent chips, stats, action circles, whisper input. **Optimistic like:** heart fills immediately; reverts on API error. |
| **Interactions** | Back, set presence (no UI), like (optimistic UI, vibration, match alert on success), message (create conv → chat), whisper (toggle box, send), block (then back), report. |
| **States** | **Loading**: hourglass placeholder while !profile. **Error**: error UI with retry (no silent router.back()). **Empty**: N/A. |
| **Edge cases** | Like requires tier 1; API may reject — error in catch not always shown. GET `/v1/users/:id/profile` returns public/private by profile_visibility_tier (backend); UI shows privacy cue badge. |
| **Analytics events** | NOT IMPLEMENTED. |
| **Accessibility** | Large action buttons; report is low emphasis; no live region for match. |

---

### 3.11 profile/edit — Edit profile

| Field | Description |
|-------|-------------|
| **Intent** | Edit display name, bio, gender, sexuality, experience, interests, isHost, photos. |
| **Entry points** | Profile tab → Edit Profile. |
| **Exit paths** | Back (close): if isDirty → Alert "Unsaved changes" / Discard. Save → usersApi.updateMe, loadProfile, router.back(), in-app toast "Saved". |
| **Data dependencies (API)** | GET via store (profile). PUT `/v1/users/me` (displayName, bio, gender, sexuality, experienceLevel, isHost, kinks, photosJson). POST (upload) via usePhotoUpload → `/v1/media/upload`. |
| **Store state** | useAuthStore: profile, loadProfile. Local: form state, photos[], saving. usePhotoUpload: pickAndUpload, uploading, progress. |
| **Layout** | ScrollView: header (close with onBackPress, "Edit Profile", Save disabled when !isDirty or saving). **Card** sections for About (incl. Primary vibe), Discovery & Privacy, Hosting. **Progressive disclosure:** "Show advanced options" toggle reveals Discovery & Privacy and Hosting; Primary vibe always in About. Photo grid (6 slots): **progress bar** when uploading (0–100%). Bio: char count (500 max). |
| **Components** | **ProfilePhoto** (storagePath for single photo in slot). **Card** (layout). Inline: chips for gender/exp. |
| **Interactions** | Add photo (slot 0–5): pickAndUpload; progress bar during upload. Remove photo (tap on filled slot). Chips select one. Save validates and PUT. Back: unsaved changes → confirm discard. |
| **States** | **Loading**: Save shows "..." when saving. **Uploading**: slot shows progress bar. **Error**: Alert on save failure. **Saved**: in-app toast. |
| **Edge cases** | Photo verification uses placeholder URL in verify screen; edit does not handle verification-specific photos. |
| **Analytics events** | NOT IMPLEMENTED. |
| **Accessibility** | Photo slots not labeled; switch needs label. |

---

### 3.12 profile/status — Presence & intents

| Field | Description |
|-------|-------------|
| **Intent** | Set presence state and intent signals (visible to others). |
| **Entry points** | Profile tab → Your Status. |
| **Exit paths** | Back → profile. |
| **Data dependencies (API)** | GET `/v1/presence/me`. DELETE `/v1/presence/me` (go invisible). POST `/v1/presence/state` (state). GET `/v1/intents`. POST `/v1/intents` (flag, expiresInHours). DELETE `/v1/intents/:flag`. |
| **Store state** | None. Local: currentPresence, activeIntents[]. |
| **Layout** | ScrollView: header, current state dot + label, PRESENCE grid (6 cards: invisible, nearby, browsing, open_to_chat, at_venue, paused), SIGNALS section with chips (open_tonight, traveling, hosting, friends, more, browsing, new here, couples, singles OK). |
| **Components** | Inline cards and chips. |
| **Interactions** | Tap presence card → set state (API). Tap intent chip → toggle (POST/DELETE). |
| **States** | **Loading**: initial fetch no spinner; state appears when loaded. **Error**: Alert on set/toggle failure. |
| **Edge cases** | at_event not in PRESENCE_STATES list in UI; backend supports it. |
| **Analytics events** | NOT IMPLEMENTED. |
| **Accessibility** | Current state and cards need clear labels. |

---

### 3.13 venue/[id] — Venue detail

| Field | Description |
|-------|-------------|
| **Intent** | Show venue info; check-in, share, review; see realtime, about, features, dress code, specials, events, reviews. |
| **Entry points** | From Events card (venue_id); from Discover (if ad/venue link). |
| **Exit paths** | Back. Check In → POST. Share/Review: NOT IMPLEMENTED — no navigation or modal. |
| **Data dependencies (API)** | GET `/v1/venues/:id/full`. POST `/v1/venues/:id/checkin`. |
| **Store state** | None. Local: venue. |
| **Layout** | ScrollView: hero (placeholder icon, overlay, back), name, tagline, meta pills (price_range, age_minimum, type), action row (Check In, Share, Review), realtime card (currentlyCheckedIn, nearbyOnline), About, Features tags, Dress code, Specials, Upcoming events, Reviews summary. |
| **Components** | Inline only. |
| **Interactions** | Back; Check In → API (no feedback). Share/Review: no-op. Event card → router.push('/events'). |
| **States** | **Loading**: "Loading..." while !venue. **Error**: on fetch failure router.back(). |
| **Edge cases** | GET `/v1/venues/:id/full` may include realtime, reviews, specials, upcomingEvents — all optional. Venue grid (GC-5.2) NOT IMPLEMENTED in this screen. |
| **Analytics events** | NOT IMPLEMENTED. |
| **Accessibility** | Sections should be headings; actions labeled. |

---

### 3.14 album/index — Album list

| Field | Description |
|-------|-------------|
| **Intent** | List my albums and shared-with-me; create album. |
| **Entry points** | Profile → My Albums. |
| **Exit paths** | Back. Tap album → `/album/[id]`. Create → albumsApi.create, then refresh. |
| **Data dependencies (API)** | GET `/v1/media/albums/my`, GET `/v1/media/albums/shared`. POST `/v1/media/albums` (name, isPrivate). |
| **Store state** | None. Local: myAlbums[], sharedAlbums[], tab ('mine'|'shared'), showCreate, newName. |
| **Layout** | Header (back, title, add), tabs (My Albums | Shared with Me), create row (input + Create + close when showCreate), FlatList 2-col grid of album cards (icon, lock badge, name, count, owner if shared). ListEmpty per tab. |
| **Components** | Inline album card. |
| **Interactions** | Tab switch; add → show create row; Create → API, refresh; tap card → album detail. |
| **States** | **Loading**: loading state. **Empty**: "No albums yet" / "No shared albums". **Error**: error UI. |
| **Edge cases** | create(name, undefined, true) — description not in UI. |
| **Analytics events** | NOT IMPLEMENTED. |
| **Accessibility** | Tabs and cards need names. |

---

### 3.15 album/[id] — Album detail

| Field | Description |
|-------|-------------|
| **Intent** | View album media; share by user ID; revoke share. |
| **Entry points** | Album list → tap album. |
| **Exit paths** | Back. Share panel: share by userId (24h), revoke. |
| **Data dependencies (API)** | GET `/v1/media/albums/:id`. POST `/v1/media/albums/:id/share`. DELETE `/v1/media/albums/:id/share/:userId`. |
| **Store state** | None. Local: album, shareUserId, showShare. |
| **Layout** | Header (back, name + count, share icon), share box (input "User ID to share with", Share 24h, list "Shared with" + Revoke), FlatList 3-col photo grid (placeholder icon per item). ListEmpty: "No photos in this album". |
| **Components** | Inline. Media tiles show icon only — NOT IMPLEMENTED: actual image thumbnails (GET media URL or thumbnail). |
| **Interactions** | Toggle share panel; enter userId, Share; Revoke per user. |
| **States** | **Loading**: "Loading..." while !album. **Error**: Alert "Album not found or access denied", router.back(). **Empty**: no media. |
| **Edge cases** | Share target: UI uses userId; API may support persona/couple (share_target_type) — NOT IMPLEMENTED in UI. Album share payload (watermarkMode, notifyOnView) NOT IMPLEMENTED in UI. |
| **Analytics events** | NOT IMPLEMENTED. |
| **Accessibility** | Grid and share list need structure. |

---

### 3.16 couple/index — Couple management

| Field | Description |
|-------|-------------|
| **Intent** | Create couple (invite code), link with partner, or view active/dissolution state. |
| **Entry points** | Profile → Couple. |
| **Exit paths** | Back. Link success → Alert "Linked!". Dissolution → confirm then POST, refresh. |
| **Data dependencies (API)** | GET `/v1/couples/me`. POST `/v1/couples`. POST `/v1/couples/link` (inviteCode). POST `/v1/couples/dissolve`. |
| **Store state** | None. Local: couple, inviteCode, newCode, linkCode, loading. |
| **Layout** | Header; if active: couple card (partners, names, "Active since"), dissolution box or "Request Dissolution" button. If not: "Create" (Generate Invite Code, code display), divider, "Link with Partner" (8-char input, Link). |
| **Components** | Inline. |
| **Interactions** | Generate code → POST, show code. Link: 8 chars → POST link. Dissolution → Alert then POST. |
| **States** | **Loading**: "Loading..." until first load. **Error**: Alert on create/link/dissolve. |
| **Edge cases** | Confirm dissolution (both partners after cooldown) NOT IMPLEMENTED in UI — backend has POST `/v1/couples/confirm-dissolution`. |
| **Analytics events** | NOT IMPLEMENTED. |
| **Accessibility** | Code input and actions need labels. |

---

### 3.17 verify/index — Verification

| Field | Description |
|-------|-------------|
| **Intent** | Show verification tier progress; submit photo (tier 1) or ID (tier 2). |
| **Entry points** | Profile → Verification. |
| **Exit paths** | Back. |
| **Data dependencies (API)** | GET `/v1/verification/status`. POST `/v1/verification/photo` (selfieUrl placeholder). POST `/v1/verification/id` (documentHash demo). |
| **Store state** | None. Local: status, loading. |
| **Layout** | ScrollView: header, progress card (Tier 0–3 bar), tier cards (icon, label, desc, pending/Verify/Submit ID/lock), history section (type, status, date). |
| **Components** | Inline. |
| **Interactions** | Tap Verify (photo) or Submit ID → POST with placeholder/demo payload; Alert success; load(). |
| **States** | **Loading**: loading true until first load. **Error**: Alert on submit. |
| **Edge cases** | Photo verification uses selfieUrl: 'https://placeholder.com/selfie.jpg' — NOT IMPLEMENTED: real camera/picker and upload to GET signed URL or multipart. ID is demo hash. |
| **Analytics events** | NOT IMPLEMENTED. |
| **Accessibility** | Tier list and progress should be announced. |

---

### 3.18 subscription/index — Premium

| Field | Description |
|-------|-------------|
| **Intent** | Show subscription tiers; upgrade via Stripe checkout. |
| **Entry points** | Profile → Premium. |
| **Exit paths** | Back. Upgrade → POST checkout; **Linking.openURL(checkoutUrl)** opens Stripe in browser. |
| **Data dependencies (API)** | GET `/v1/billing/subscription`. POST `/v1/billing/checkout` (tier). |
| **Store state** | None. Local: currentTier. Refetch on focus (useFocusEffect). |
| **Layout** | ScrollView: header, hero "More privacy. More control.", tier cards (icon, name, price, features, Current badge or Upgrade button), disclaimer. |
| **Components** | Inline. |
| **Interactions** | Tap Upgrade → checkout API; **Linking.openURL** opens Stripe checkout in external browser. |
| **States** | **Error**: Alert on checkout failure. |
| **Edge cases** | Webhook success: refetch subscription on screen focus so currentTier updates after return from Stripe. |
| **Analytics events** | NOT IMPLEMENTED. |
| **Accessibility** | Tiers and Upgrade need clear labels. |

---

### 3.19 whispers/index — Whisper inbox/sent

| Field | Description |
|-------|-------------|
| **Intent** | List inbox/sent whispers; reply (anon or reveal), ignore; view profile after reveal. |
| **Entry points** | Profile → Whispers. |
| **Exit paths** | Back. Reply → POST respond, refresh. Ignore → POST ignore, refresh. View Profile → `/user/[from_user_id]`. ListEmpty CTA → Go to Discover. |
| **Data dependencies (API)** | GET `/v1/whispers/inbox`, GET `/v1/whispers/sent`. POST `/v1/whispers/:id/respond` (response, reveal). POST `/v1/whispers/:id/ignore`. |
| **Store state** | None. Local: tab, whispers[], responseText, respondingTo. |
| **Layout** | Header, tabs (Inbox | Sent), FlatList: card (**"Anonymous" badge** when inbox and !revealed), from/to name, distance, time, message, response if any, Reply/Ignore or reply box with Reply Anon / Reply & Reveal. **Swipe-left** on pending inbox whisper (native) reveals Ignore action. ListEmpty: icon, title, subtitle, "Go to Discover" CTA. |
| **Components** | Swipeable (native), inline. Anonymous badge for unrevealed senders in inbox. |
| **Interactions** | Tab switch; Reply → expand input; Reply Anon / Reply & Reveal → POST; Ignore → POST; View Profile when revealed. |
| **States** | **Empty**: "No whispers yet" / "No sent whispers" with CTA. **Error**: Alert on respond/ignore. |
| **Edge cases** | Expired whispers: status from API; UI shows all. |
| **Analytics events** | NOT IMPLEMENTED. |
| **Accessibility** | Cards and actions need labels. |

---

## 4. Admin Dashboard Screens

Admin is React + Vite, react-router-dom. **Routes** under Layout: `/`, `/users`, `/revenue`, `/venues`, `/ads`, `/events`, `/reports`, `/moderation`, `/safety`, `/audit`, `/settings`, `/map`. Login at `/login` (standalone).

### 4.1 Layout, Auth, and Global Features

**Layout** (`admin-dashboard/src/components/Layout.tsx`): Sidebar nav (Dashboard, Users, Revenue, Venues, Ads, Events, Reports, Moderation, Safety, Audit Log, Settings, Map). Hamburger menu for mobile. Auth gate: `getToken()` from `sessionStorage`; if missing, redirect to `/login`.

**StatusBar** (`components/StatusBar.tsx`): Top bar with live KPIs — Online, Panic, Distress, Reports, Mod. Links: Panic/Distress → `/safety`, Reports → `/reports`, Mod → `/moderation`. "Updated X ago", Refresh button. **Manual refresh only** (no auto-polling). Uses `useCommandCenter()`.

**CommandCenterContext** (`context/CommandCenterContext.tsx`): Provides `status` (onlineNow, panicAlerts, venueDistressAlerts, pendingReports, pendingMod, lastUpdated), `refresh()`, `isLive`. Fetches `GET /v1/admin/overview`. On `command-center-refresh` event, pages (e.g. Dashboard) reload.

**Keyboard shortcuts** (from CommandCenterContext):
| Key | Action |
|-----|--------|
| R | Refresh; dispatch `command-center-refresh` |
| 1 | Dashboard (/) |
| 2 | Users |
| 3 | Revenue |
| 4 | Venues |
| 5 | Ads |
| 6 | Events |
| 7 | Reports |
| 8 | Safety |
| 9 | Audit |
| 0 | Settings |
| M | Map |
| D | Dashboard (/) |

**API client** (`api/client.ts`): `VITE_API_URL` or `http://localhost:3000`. Token in `sessionStorage` key `admin_token`. All requests add `Authorization: Bearer`.

### 4.2 Login

| Field | Description |
|-------|-------------|
| **Intent** | Admin/moderator auth. Phone + OTP, or email + password, or dev bypass. |
| **Entry** | Unauthenticated; redirect from Layout. |
| **Exit** | Success → `/`. Access denied (non-admin) → clear token, show error. |
| **API** | `sendCode(phone)`, `verify(phone, code)`, `login(phone, sessionToken)`, `loginEmail(email, password)`, `bypassLogin()`. |
| **Modes** | **Phone**: Send code → verify → login. Dev: `devCode` shown when Twilio not configured. **Email**: `loginEmail` (min 8 chars password). **Bypass**: When `VITE_ALLOW_BYPASS=true`, "Skip login (dev bypass)" calls `POST /v1/auth/admin-bypass` (requires `OTP_DEV_BYPASS` on backend). |
| **Components** | GlassInput, GlassButton, theme. |
| **States** | Loading, error (access denied, network). |

### 4.3 Dashboard (/)

| Field | Description |
|-------|-------------|
| **Intent** | Command center overview — KPIs, health. |
| **API** | `getOverview()` → fallback `getStats()`, `getHealth()`. |
| **Layout** | **Tier Funnel** card (Signups → Verified → Premium). **Trust Score Distribution** histogram (0-20, 21-40, 41-60, 61-80, 81-100, N/A). Grid of GlassCards: Online Now, Total Users, New (24h), MRR, Paying Users, Ad Revenue, Panic Alerts, Venue Distress, Pending Reports, Pending Mod, Active Events, Active Venues, Whispers (24h). Sparklines for Online, Total, Panic, Reports. Health card: version, modules. |
| **Refresh** | Listens for `command-center-refresh`. |
| **States** | SkeletonCards, AdminError. |

### 4.4 Users (/users)

| Field | Description |
|-------|-------------|
| **Intent** | List, search, filter users; toggle active, set role. |
| **API** | `listUsers(page, filter)`, `searchUsers(q, page)`, `toggleUserActive(id, active)`, `setUserRole(id, role)`, `setUserTier`, `banUser`. |
| **Layout** | Search form, filter chips (active, banned, verified, hosts, admins), table: display_name, email, role, tier, is_active, actions. Toggle active, role dropdown. |
| **States** | SkeletonTable, AdminError, success toast. |

### 4.5 Revenue (/revenue)

| Field | Description |
|-------|-------------|
| **Intent** | MRR, ad revenue, paying users, impressions, taps. |
| **API** | `getRevenue()`, `getRevenueHistory(30)`. |
| **Layout** | Cards: MRR (sparkline), Ad Revenue, Paying Users, Total Impressions, Total Ad Taps, Ad Placements. Bar chart: 30-day revenue history. |
| **States** | SkeletonCards, AdminError. |

### 4.6 Venues (/venues)

| Field | Description |
|-------|-------------|
| **Intent** | List venues; view claimed/unclaimed, tier. |
| **API** | `listVenues()` → `GET /v1/admin/venues/list`. |
| **Layout** | Grid of GlassCards: name, tagline, type, price_range, Badge (Claimed/Unclaimed, venue_tier). |
| **States** | SkeletonCards, AdminError. |

### 4.7 Ads (/ads)

| Field | Description |
|-------|-------------|
| **Intent** | List ad placements; toggle active. |
| **API** | `listAds()`, `toggleAd(id, active)`. |
| **Layout** | Table: Venue, Surface, Headline, Impressions, Taps, CTR, Spent, Status, Actions (toggle). |
| **States** | SkeletonTable, AdminError. |

### 4.8 Events (/events)

| Field | Description |
|-------|-------------|
| **Intent** | List events; phase badges. |
| **API** | `listEvents()` → `GET /v1/admin/events/list`. |
| **Layout** | Grid of GlassCards: title, venue, phase (discovery, upcoming, live, winding_down, post, archived), date. Badge by phase color. |
| **States** | SkeletonCards, AdminError. |

### 4.9 Reports (/reports)

| Field | Description |
|-------|-------------|
| **Intent** | Report queue; filter by status; resolve/dismiss. |
| **API** | `getReports(status)`, `resolveReport(id, status)`. Status: pending, reviewing, resolved, dismissed. |
| **Layout** | Filter chips, list of report cards (reporter, reported, reason, description). Resolve / Dismiss buttons. |
| **States** | SkeletonCards, AdminError. |

### 4.10 Moderation (/moderation)

| Field | Description |
|-------|-------------|
| **Intent** | Kanban: Pending Reports, Resolved, Dismissed; Mod Queue (pending); Resolved Mod. Drag reports to resolve/dismiss; approve/reject mod items. |
| **API** | `getReports('pending'|'resolved'|'dismissed')`, `getQueue(undefined, 'pending')`, `getResolvedModeration()`, `resolveReport(id, status)`, `resolveModeration(id, 'approved'|'rejected')`. |
| **Layout** | Horizontal columns: Pending Reports (red), Resolved (green), Dismissed (grey), Mod Queue (pending items), Resolved Mod. Drag-and-drop for reports. Mod items: Approve / Reject. |
| **States** | SkeletonCards, AdminError. |

### 4.11 Safety (/safety)

| Field | Description |
|-------|-------------|
| **Intent** | Panic alerts (24h), venue distress (24h), missed check-ins. |
| **API** | `getSafetyAlerts()` → `GET /v1/admin/safety/alerts`. |
| **Layout** | Sections: Panic Alerts, Venue Distress, Missed Check-ins. GlassCards per alert (display_name, venue, timestamp). Empty state: "No panic alerts ✓". |
| **States** | SkeletonCards, AdminError. |

### 4.12 Audit Log (/audit)

| Field | Description |
|-------|-------------|
| **Intent** | Audit trail of admin actions. |
| **API** | `getAuditLogs(100)` → `GET /v1/admin/audit-logs?limit=100`. |
| **Layout** | Table: Time, User, Action, Category. Badge for GDPR category. |
| **States** | SkeletonTable, AdminError. |

### 4.13 Settings (/settings)

| Field | Description |
|-------|-------------|
| **Intent** | Ad controls: global kill switch, density multiplier. |
| **API** | `getAdSettings()`, `updateAdSetting('global', value)`. |
| **Layout** | Ad Controls card: Global Ad Switch (KILL ADS / ENABLE ADS), density multiplier, status. |
| **States** | SkeletonCards, AdminError. |

### 4.14 Map (/map)

| Field | Description |
|-------|-------------|
| **Intent** | Military command map — user locations, city heatmap, hot/dead cities. |
| **API** | `getPresenceGeo()`, `getStatsCities()`. |
| **Layout** | Leaflet map (CartoDB Dark Matter). View modes: users, heat, both. User markers: color by presence (online=purple, <7d=blue, 7–30d=orange, >30d=grey). Heat layer from city aggregates. Click marker → user card (userId, lastSeen). Legend: Online, <7d, 7–30d, >30d. Refresh button. |
| **States** | AdminError, loading. |

### 4.15 Admin Design System

**Theme** (`admin-dashboard/src/theme.ts`): Neon purple + black, glassmorphism. Colors: primary `#A855F7`, primaryGlow, primaryMuted, primaryBorder; accent, accentCyan, accentPink; bgBase, bgElevated, bgSurface, bgCard; text, textSecondary, textMuted, textDim; success, warning, danger, info (+ Muted variants). Font: Space Grotesk (display), DM Sans (body), JetBrains Mono. Glass: `rgba(15,10,28,0.65)`, blur 20px, purple border.

**Components** (`admin-dashboard/src/components/`):
| Component | Purpose |
|-----------|---------|
| GlassCard | Card with glass bg, optional accent color, hover glow |
| GlassButton | Primary, secondary, danger, success variants |
| GlassInput | Label, value, onChange, placeholder, type (text/password/email) |
| Badge | variant: success, warning, danger, primary, neutral |
| Sparkline | SVG sparkline; data, width, height, color, strokeWidth |
| AdminSkeleton | SkeletonCards(count), SkeletonTable(rows) |
| AdminPageState | AdminError(message, onRetry) |
| StatusBar | Live KPIs, refresh, keyboard hint |

---

## 5. Component Library

Reusable components referenced by mobile screens. All under `mobile/src/components/` unless inline.

### 5.1 ProfilePhoto

| Property | Type | Description |
|----------|------|-------------|
| storagePath | string \| null | Single image path (e.g. from album slot). |
| photosJson | array (strings) | First element used as image path. |
| size | number | Width/height when not fill. |
| blurred | boolean | (Legacy.) Applies opacity 0.3 when true. Prefer `canSeeUnblurred` for viewer-aware blur. |
| canSeeUnblurred | boolean \| null | When true show photo; when false or null blur. From GET `/v1/photos/check/:userId` via `useCanSeeUnblurred`. Single authority for blur. |
| borderRadius | number | Radius. |
| fill | boolean | AbsoluteFillObject; used in tiles/hero. |

**Behavior**: Builds URL as `API_BASE + '/uploads' + path`. If no photo, placeholder View with Ionicons person. Blur: when `canSeeUnblurred` is provided, show unblurred only when `true`; otherwise blur (or use legacy `blurred` if `canSeeUnblurred` not passed).

**Used by**: Discover tile, Profile hero, User hero, Edit profile photo slots.

### 5.2 VenueAdCard

| Property | Type | Description |
|----------|------|-------------|
| ad | { id, venue_id, headline, body?, venue_name?, … } | Ad object. |
| onDismiss | () => void | Optional callback after dismiss. |

**Behavior**: Tap → POST `/v1/ads/:id/tap`, router.push(`/venue/${venue_id}`). Dismiss → POST `/v1/ads/:id/dismiss`, onDismiss(). **Used by**: NOT REFERENCED in any scanned screen (Discover could show ads; currently not in index.tsx). Component exists in `mobile/src/components/VenueAdCard.tsx`.

### 5.3 ShhhShield

| Property | Type | Description |
|----------|------|-------------|
| verificationStatus | string | unverified \| photo_verified \| id_verified \| reference_verified. |
| size | number | Icon size (default 16). |

**Behavior**: Returns null if unverified; otherwise View with Ionicons shield variant and color by tier. **Used by**: NOT REFERENCED in scanned screens; Discover and User profile use inline shield badges. Can replace inline shield UI for consistency.

### 5.4 Inline / local components (not in component library)

- **StatPill** (profile): icon, value, color — pill with border.
- **MenuItem** (profile): icon, label, onPress, badge?, accent? — row with icon box, label, optional badge, chevron.
- **PRESENCE_COLORS / INTENT_ICONS** (Discover, User): maps for presence bar and intent badges.

---

## 6. Store + API Contracts for UI

### 6.1 Auth store (Zustand) — mobile/src/stores/auth.ts

| State | Type | Description |
|-------|------|-------------|
| userId | string \| null | Current user id. |
| token | string \| null | Access token (also set via setAuthToken for API client). |
| refreshToken | string \| null | Refresh token. |
| profile | object \| null | GET /v1/users/me result. |
| isAuthenticated | boolean | Derived from token presence. |
| isLoading | boolean | During auth actions. |
| error | string \| null | Last error message. |

**Actions**: sendOTP, verifyAndLogin, verifyAndRegister, login, register, logout, loadProfile, setTokens, clearError. Token persistence: web localStorage key `shhh_token`. **NOT IMPLEMENTED**: No refresh token rotation on 401 in API client; no automatic redirect to login on auth failure.

### 6.2 API client — mobile/src/api/client.ts

- **Base URL**: Web `http://localhost:3000`; Android emulator `http://10.0.2.2:3000`.
- **Auth**: getAuthToken/setAuthToken; `api()` adds `Authorization: Bearer` when token set.
- **Error handling**: On !res.ok, reads JSON body `err.error?.message` or falls back to `Request failed: ${res.status}`; throws Error. No global 401 logout or retry.

**Domain objects**: authApi, usersApi, discoverApi, messagingApi, eventsApi, safetyApi, albumsApi. Generic `api<T>(path, options)` for ad-hoc calls (e.g. whispers, presence, intents, venues, verification, billing).

### 6.3 Error mapping (API → user-facing)

| HTTP / source | User-facing / behavior |
|---------------|------------------------|
| 400 | err.message from body or "Request failed: 400" |
| 401 | Not handled globally; many screens catch and show nothing or Alert with err.message |
| 403 | err.message (e.g. tier) |
| 404 | Often router.back() or "not found" Alert |
| 429 | err.message (rate limit); no specific "Too many attempts" copy |
| 5xx | err.message or "Request failed: 5xx" |

**NOT IMPLEMENTED**: Central error mapper (e.g. code or status → copy). Suggested: map known backend error codes (e.g. RATE_LIMIT, TIER_REQUIRED, INVALID_OTP) to short, safe messages.

### 6.4 Contracts (key request/response)

- **GET /v1/users/me**: Profile with displayName, bio, gender, sexuality, photosJson, verificationStatus, experienceLevel, isHost, kinks, etc.
- **GET /v1/users/:id/profile**: Public/private profile (two-layer); may include presenceState, activeIntents, references, trustScore, joinedAt.
- **GET /v1/discover**: data (users), count, discoveryCap, radiusUsedKm, computedRadiusKm?; each user: userId, displayName, bio, distance, verificationStatus, experienceLevel, isHost, gender, photosJson, presenceState, activeIntents.
- **GET /v1/conversations**: data[] with id, type, last_message_at, unread_count (participant names/last message body not in current UI contract).
- **GET /v1/events/nearby**: data[] with id, title, starts_at, venue_id, venue_name, attendee_count, capacity, description.
- **GET /v1/venues/:id/full**: name, tagline, description, price_range, age_minimum, type, features, dress_code, realtime (currentlyCheckedIn, nearbyOnline), specials, upcomingEvents, reviews.summary.
- **GET /v1/whispers/inbox | /sent**: data[] with id, message, from_user_id, from_name, to_name, distance, status, response, revealed, created_at.
- **GET /v1/presence/me**: data.state. **GET /v1/intents**: data[] with flag.
- **GET /v1/verification/status**: currentTier, verifications[] (type, status, created_at).
- **GET /v1/billing/subscription**: data.tier.
- **GET /v1/couples/me**: data (status, partner names, dissolution_requested_at, cooldown_expires_at, etc.).

---

## 7. Singles Exposure Path (Curious Mode)

### 7.1 Backend support (from GAME_CHANGER_ROADMAP / ENHANCEMENT_ROADMAP)

- **primary_intent** (user_profiles): e.g. social, curious, lifestyle, couple; discovery filter; onboarding can set default.
- **discovery_visible_to** (user_profiles): all \| social_and_curious \| same_intent; discovery only shows "them" to "me" if "them" allows "me".
- **Experience level**: new, curious, experienced, veteran; discovery filter; profile shows badge.
- **Event tags / vibe_tag**: newbie_friendly, social_mix, talk_first; onboarding intent can tailor first feed and default discovery filters.

### 7.2 Current UI vs required

| Item | Status | Required |
|------|--------|----------|
| Onboarding asking "Social / Curious / Lifestyle / Couple" (or single choice) | **NOT IMPLEMENTED** | Add step(s) after last onboarding slide or before first Discover: set primary_intent (and optionally discovery_visible_to) via PUT /v1/users/me; then navigate to (tabs). |
| Default discovery filter by primary_intent | **NOT IMPLEMENTED** | Discover screen: pass primaryIntent (and discovery_visible_to) from profile to GET /v1/discover (query params or default from profile). |
| Profile "Curious" / "New to this" badge | **PARTIAL** | experienceLevel shown in profile and Discover; no explicit "Curious" lane label. Optional: show primary_intent and discovery_visible_to in profile/edit and profile/status. |
| Event tags (newbie_friendly, social_mix) in Events list | **NOT IMPLEMENTED** | eventsApi.nearby and GET /v1/events/this-week support vibe/tag; UI does not filter or show tags. Add filter chips or tags on cards. |
| "Only show me to Social + Curious" control | **NOT IMPLEMENTED** | Add in profile/edit or profile/status: discovery_visible_to (all \| social_and_curious \| same_intent) via PUT /v1/users/me. |

### 7.3 Suggested onboarding flow (curious mode)

1. After (auth)/onboarding "Get Started", show optional **Intent picker**: "What brings you here?" — Social / Curious / Lifestyle / Couple (single or multi; product decision). Save via PUT /v1/users/me (primary_intent, optionally discovery_visible_to).
2. If "Curious", optionally set discovery_visible_to to **social_and_curious** by default (config or one-time prompt).
3. Navigate to (tabs); Discover first load uses primary_intent (and discovery_visible_to) so default results match lane.
4. Events default filter or "This week" feed: prefer newbie_friendly / social_mix when primary_intent is curious/social.

---

## 8. Cross-Cutting

### 8.1 Animations

- **NOT IMPLEMENTED**: No shared animation constants or layout transitions. Tab bar uses simple opacity/dot. Suggested: standardize press opacity (activeOpacity 0.7–0.8), optional Animated for presence/whisper feedback.

### 8.2 Offline & connectivity

- **NOT IMPLEMENTED**: No NetInfo or offline banner; no queue for failed mutations; no cached reads. Required for robustness: detect offline, show banner or inline message, optionally retry or queue.

### 8.3 Real-time (WebSocket)

- useSocket provides joinConversation, leaveConversation, sendTyping, stopTyping, onNewMessage, onTyping, onAlbumShared. **Chat screen**: NOT IMPLEMENTED — does not join room or subscribe to new_message; only initial fetch and optimistic send. Required: chat/[id] mount → joinConversation(convId); onNewMessage → append to list; unmount → leaveConversation.

### 8.4 Safety hooks (used or available)

- **useDistressGesture**: 5 shakes in 3s → panic API; 30s cooldown; vibration. Can be mounted at root; not verified in scanned layouts.
- **useScreenshotDetection**: Reports to /v1/safety/screenshot; alerts user. Not verified in chat/profile.
- **usePushNotifications**: Register push token; not verified in app entry.

### 8.5 Accessibility summary

- Missing or partial: labeled inputs (auth, edit, whisper, album share), button/link accessibilityLabel, list item labels (conversations, events, discover tiles), live regions for errors and match alert, semantic headings (venue, profile sections). Tab bar and onboarding dots not exposed as tab/list. Recommend audit with screen reader and add labels and live regions per screen.

### 8.6 Analytics (privacy-safe)

- **NOT IMPLEMENTED**: No analytics SDK or events. Suggested: screen_view, tap (action + screen), no PII; optional: discovery_refresh, whisper_sent, match_shown, subscription_checkout_started.

---

**End of UX/UI Spec.**

- **ARCHITECTURE.md** — system truth (backend, API, data).
- **UX_UI_SPEC.md** (this doc) — surface truth (screens, layout, components).
- **UX_BEHAVIOR_SPEC.md** — human truth (invariants, user states, safety flows, copy, a11y gates).

For backend module and API ledger see **DEV_HANDOVER.md**.
