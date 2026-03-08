# Shhh — Functional Assessment (Waves 9–15)

> **Purpose:** Verification checklist for all improvements added in Waves 9–15.  
> **Last updated:** March 2026

---

## Test Environment Setup

```bash
# 1. Start infrastructure
sudo docker compose up -d

# 2. Run migrations
cd backend && npm run migrate

# 3. Start backend
cd backend && npm run dev   # Port 3000 (or 3001/3002 if in use)

# 4. Start admin dashboard
cd admin-dashboard && npm run dev   # Port 5173

# 5. Start mobile (web)
cd mobile && npx expo start --web   # Port 8081
```

**Backend tests:** `cd backend && npm test` — 86 tests (visibility, verification, messaging sync, admin cookie auth, discovery block filter).

---

## Wave 9: Pass with Reason

| Test | Steps | Expected |
|------|-------|----------|
| Pass flow | User profile → tap X (close) → "Not interested" or "Block" | Alert with two options |
| Reason selection | "Not interested" → "Not my type" / "Too far" / "Just browsing" / "Other" / "Skip" | Second alert with reason chips |
| API | `POST /v1/users/:id/pass` with `{ "reason": "not_my_type" }` | 200, stored in `user_interactions.pass_reason` |
| ConnectionWindowModal | Trigger connection limit modal | Slides up (animationType="slide") |

**Verification:** `SELECT pass_reason FROM user_interactions WHERE type='pass' LIMIT 5;`

---

## Wave 10: Edge-Case Handling

| Test | Steps | Expected |
|------|-------|----------|
| Event 404 | Navigate to `/event/invalid-uuid` or deleted event | Alert "Event unavailable" + "Go back" |
| Chat 404 | Navigate to `/chat/invalid-uuid` | "This conversation is no longer available" (mapApiError) |

---

## Wave 11: Accessibility & Empty State Polish

| Test | Steps | Expected |
|------|-------|----------|
| SafeState | Empty/error/loading screen | accessibilityRole="summary", labels on retry |
| Discover empty CTA | Empty Discover → "Create an event" | accessibilityLabel present |
| User profile actions | Like, Message, Whisper, Report | accessibilityRole="button", accessibilityLabel |
| VenueAdCard | "Why am I seeing this?" link | accessibilityLabel="Why am I seeing this ad?" |
| Me screen | Logout, MenuItem, User ID copy | accessibilityLabel present |
| Edit Profile Save | Save button | accessibilityState disabled when !isDirty |
| Event RSVP | RSVP button | accessibilityState disabled when loading |

**Verification:** Enable TalkBack (Android) or VoiceOver (iOS) and navigate; all interactive elements should announce.

---

## Wave 12: Tier Funnel & Progressive Disclosure

| Test | Steps | Expected |
|------|-------|----------|
| Admin Tier Funnel | Dashboard → top section | "Tier Funnel" card: Signups, Verified, Premium |
| Create Event | Profile → Create event → "Show advanced options" | Toggle reveals Visibility, tier min, radius, location revealed |
| Edit Profile | Profile → Edit → "Show advanced options" | Toggle reveals Discovery & Privacy, Hosting; Primary vibe in About |

---

## Wave 13: Trust Score, Swipe, Micro-Copy

| Test | Steps | Expected |
|------|-------|----------|
| Admin Trust Score | Dashboard → Trust Score Distribution | Histogram: 0-20, 21-40, 41-60, 61-80, 81-100, N/A |
| API | `GET /v1/admin/stats/trust-scores` (admin token) | 200, `{ bucket_0_20, bucket_21_40, ... }` |
| Whispers swipe | Whispers inbox → pending whisper → swipe left (native) | Red "Ignore" action revealed; tap to ignore |
| Micro-copy | Trigger 403, 401, whisper expired, profile not found | Human-friendly messages from mapApiError |

---

## Wave 14: Unread Sync, Onboarding, Push Throttle

| Test | Steps | Expected |
|------|-------|----------|
| Unread on notification | Receive new message (WebSocket) while not in chat | Badge refetches, count updates |
| Unread on app focus | Background app → receive message → foreground | Badge refetches |
| Mark-read when viewing | In chat → receive new message | POST /read called, badge correct |
| Onboarding Browse first | Login → onboarding → onboarding-intent | "Browse first" primary CTA; "Set up my vibe" secondary |
| Push throttle | Send 3 messages to user within 30s | Max 1 push sent (Redis `push:throttle:{userId}`) |

**API:** `POST /v1/conversations/:id/read` — 204, sets unread_count=0.

---

## Wave 15: Analytics, Activity Feed, Feed Integrity

| Test | Steps | Expected |
|------|-------|----------|
| Conversion Funnel | Admin Dashboard → load | Card shows Signups, Verified, Liked, Messaged, Whispered, RSVP'd counts |
| Live Activity Feed | Admin Dashboard → load | Scrollable list of recent audit_logs (user.registered, user.login, etc.) |
| GPS velocity check | POST /v1/discover/location twice with implausible jump (e.g. NYC → Tokyo in 1 min) | Second update silently skipped (no DB change) |

**API:** `GET /v1/admin/analytics/funnel` — 200, `{ signups, verified, hasLiked, hasMessaged, hasWhispered, hasRsvpd }`.  
**API:** `GET /v1/admin/activity-feed?limit=20` — 200, array of `{ id, action, displayName, createdAt }`.

---

## P0–P1: Visibility, Tier 2 ID, Onboarding, httpOnly Cookies

| Test | Steps | Expected |
|------|-------|----------|
| **A.6 Block → profile** | User A blocks B → A views B profile | 404 "User not found" |
| **A.6 Block → like/pass** | A blocks B → A likes or passes B | 403 |
| **A.6 Block → conversation** | A blocks B → A creates conversation with B | 403 |
| **A.6 Block → whisper** | A blocks B → A sends whisper to B | 403 |
| **A.6 Block → discovery** | A blocks B → A fetches discover | B does not appear in results |
| **B.6 Tier 2 ID** | Profile → Verify → Tier 2 current → Pick ID or Take photo | Upload, submit, "Submitted for review" |
| **B.6 Moderation resolve** | Admin → Moderation → verification_id item → Approve | User promoted to tier 2 |
| **C.12 Onboarding** | Onboarding slides | "Skip intro" label; dotDone for completed slides |
| **B.8 Cookie auth** | Admin login with ADMIN_HTTPONLY_COOKIE=true → request without Bearer | 200 (cookie sent automatically with credentials: include) |

**Automated:** visibility.test.ts (8), verification.test.ts (7), discovery block test, admin cookie test.

---

## Automated Test Results

| Suite | Tests | Status |
|-------|-------|--------|
| auth | 12 | ✅ Pass |
| admin | 12 | ✅ Pass (trust-scores, funnel, activity-feed, cookie auth) |
| discovery | 5 | ✅ Pass (block filter) |
| events | 14 | ✅ Pass |
| couples | 4 | ✅ Pass |
| media | 16 | ✅ Pass |
| safety | 5 | ✅ Pass |
| messaging | 2 | ✅ Pass |
| visibility | 8 | ✅ Pass |
| verification | 7 | ✅ Pass |
| **Total** | **86** | **✅ All pass** |

---

## Manual Test Checklist

- [ ] Admin: Login (bypass if OTP_DEV_BYPASS=true), Dashboard shows Tier Funnel + Conversion Funnel + Trust Score Distribution + Live Activity Feed
- [ ] Mobile: Onboarding-intent shows "Browse first" as primary
- [ ] Mobile: Onboarding slides show "Skip intro", dotDone for completed
- [ ] Mobile: Create event → "Show advanced options" toggles visibility section
- [ ] Mobile: Edit profile → "Show advanced options" toggles Discovery & Hosting
- [ ] Mobile: User profile X → Not interested → reason chips
- [ ] Mobile: Block user → profile 404, like/pass 403, whisper 403
- [ ] Mobile: Verify → Tier 2 → Pick ID / Take photo → submit for review
- [ ] Admin: Moderation → verification_id → Approve → user tier 2
- [ ] Mobile: Whispers inbox → swipe left on pending (native) → Ignore
- [ ] Mobile: Chat → receive message → badge updates; leave chat → badge refetches
- [ ] Mobile: Event 404 → Alert "Event unavailable"
- [ ] Admin: With ADMIN_HTTPONLY_COOKIE=true, login then refresh; cookie auth works without Bearer

---

## Known Limitations

- **Swipe to Ignore:** Native only (Platform.OS !== 'web'); web keeps tap Ignore
- **Push throttle:** Requires Redis; 30s window per user
- **Admin bypass:** Requires `OTP_DEV_BYPASS=true` in backend env for one-click login
