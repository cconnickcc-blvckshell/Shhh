# Shhh — UX/UI Audit Report

> **Audit Date:** March 2026  
> **Scope:** Admin Dashboard, Mobile App (Web + Native), Cross-cutting UX  
> **Format:** C-suite executive summary + screen-by-screen findings + prioritized improvements

---

## Executive Summary

The Shhh platform has a **solid foundation** with consistent design systems, loading/error/empty states, and a coherent visual language. However, **several blocking and high-severity issues** require immediate attention before production, particularly in **auth flows**, **safety/panic**, and **accessibility**.

### Key Metrics

| Area | Status | Critical Issues |
|------|--------|-----------------|
| Admin Dashboard | Functional | 2 blocking, 4 degrades |
| Mobile Auth | At risk | 1 blocking (missing import) |
| Mobile Discovery/Messaging | Good | 2 degrades |
| Safety/Panic | **Critical** | 1 blocking (panic location bug) |
| Accessibility | Gaps | 8+ polish items |

### Top 3 Priorities

1. **Fix panic alert location bug** — `location.coords` is undefined; panic sends no coordinates (safety-critical).
2. **Add missing `Alert` import** — Login/Register OAuth flows crash when Google/Snap not configured.
3. **Improve admin auth persistence** — Token in `sessionStorage`; no refresh handling; redirect loop risk.

---

## 1. Admin Dashboard — Screen-by-Screen Findings

### 1.1 Login

| Issue | Severity | Description |
|-------|----------|-------------|
| Dev bypass prominent | Degrades | "Skip login (dev bypass)" is first CTA; confusing in prod-like environments |
| No auth persistence | Degrades | Token in `sessionStorage`; refresh may lose session |
| No protected-route redirect | Degrades | Visiting `/` without token redirects to login via Layout `useEffect`; brief flash possible |
| Form labels not associated | Polish | `GlassInput` label is visual only; no `htmlFor`/`id` for screen readers |
| Error feedback | Good | Error box with retry; `mapApiError`-style messaging |

**Improvement:** Add `aria-describedby` for error; hide dev bypass when `NODE_ENV=production`; add token refresh on mount.

---

### 1.2 Dashboard

| Issue | Severity | Description |
|-------|----------|-------------|
| Fallback API logic | Good | Falls back to `getStats` when `getOverview` fails |
| Loading/error states | Good | `SkeletonCards`, `AdminError` with retry |
| Health card | Good | Shows version, modules |
| No empty state for cards | Polish | Cards always show 0 when no data; acceptable |

**Improvement:** Add `aria-live="polite"` for live-updating stats.

---

### 1.3 Users

| Issue | Severity | Description |
|-------|----------|-------------|
| Search + pagination | Degrades | `load` in `useEffect` depends on `page`, `filter`; search triggers via form submit only — OK |
| No "Next" disabled | Degrades | Next button never disabled; users can paginate past last page |
| No success feedback | Degrades | Ban/Unban, role change — no toast or inline confirmation |
| Table overflow on mobile | Degrades | Wide table; horizontal scroll exists but cramped |
| Role select | Degrades | Native `<select>`; no styled dropdown; small touch target on mobile |

**Improvement:** Disable Next when `page * pageSize >= total`; add brief success feedback; improve table responsiveness.

---

### 1.4 Revenue

| Issue | Severity | Description |
|-------|----------|-------------|
| Loading/error | Good | `SkeletonCards`, `AdminError` |
| Bar chart | Good | 30-day revenue; tooltip on hover |
| Subscription table | Good | Tier, subscribers, revenue |

**Improvement:** Add `role="img"` and `aria-label` for chart.

---

### 1.5 Venues

| Issue | Severity | Description |
|-------|----------|-------------|
| Empty state | Good | "No venues yet" in card |
| Loading/error | Good | Skeleton, AdminError |

**Improvement:** Add venue detail link or quick actions.

---

### 1.6 Ads

| Issue | Severity | Description |
|-------|----------|-------------|
| Table layout | Good | Clear columns |
| Toggle feedback | Degrades | Pause/Activate — no loading state; optimistic update only |

**Improvement:** Show loading on toggle; disable row during request.

---

### 1.7 Events

| Issue | Severity | Description |
|-------|----------|-------------|
| Phase colors | Good | Semantic mapping |
| Empty state | Degrades | No explicit "No events" when list empty |

**Improvement:** Add empty state card.

---

### 1.8 Reports

| Issue | Severity | Description |
|-------|----------|-------------|
| Filter "reviewing" | Degrades | API may not support "reviewing"; verify backend |
| Resolve/Dismiss | Good | Clear actions |

**Improvement:** Align filter values with API.

---

### 1.9 Moderation

| Issue | Severity | Description |
|-------|----------|-------------|
| Drag-and-drop | Degrades | Only pending reports draggable; Mod Queue items not draggable — inconsistent |
| Empty state copy | Degrades | Resolved/Dismissed columns say "Empty"; Pending says "Drag reports here" — resolved/dismissed don't accept drops from Mod Queue |
| Mod Queue | Good | Approve/Reject buttons; clear layout |

**Improvement:** Clarify drag behavior; add `aria-dropeffect` for columns.

---

### 1.10 Safety

| Issue | Severity | Description |
|-------|----------|-------------|
| Panic alerts | Good | Card per alert; timestamp |
| Missed check-ins | Good | Warning styling |
| Pending reports | Good | Resolve/Dismiss actions |

**Improvement:** Add link to user profile from alert.

---

### 1.11 Audit Log

| Issue | Severity | Description |
|-------|----------|-------------|
| (Not fully audited) | — | Standard list pattern expected |

---

### 1.12 Settings

| Issue | Severity | Description |
|-------|----------|-------------|
| Ad toggle | Good | KILL ADS / ENABLE ADS |
| System info | Good | Version, env, rate limits |
| Hardcoded env | Polish | "development" may be static |

**Improvement:** Source env from API or build.

---

### 1.13 Map

| Issue | Severity | Description |
|-------|----------|-------------|
| View mode buttons | Degrades | "Dots", "Heat", "Both" — only one should be primary; logic uses `viewMode === 'users'` etc. correctly |
| Leaflet.heat | Good | Heat layer; user markers |
| Selected user | Good | Card with userId, lastSeen |
| Loading | Good | Skeleton for map area |

**Improvement:** Ensure only active view mode has primary style (code appears correct; verify visually).

---

### 1.14 Layout & Navigation

| Issue | Severity | Description |
|-------|----------|-------------|
| Mobile sidebar | Good | Hamburger; overlay; 260px drawer |
| Desktop sidebar | Good | Always visible; hamburger hidden |
| No logout | Degrades | No explicit logout control; token cleared on 401 only |
| Focus visible | Good | `:focus-visible` in CSS |
| Keyboard shortcuts | Good | R, 1-9, M mentioned in StatusBar |

**Improvement:** Add logout button; ensure token refresh before expiry.

---

## 2. Mobile App — Screen-by-Screen Findings

### 2.1 Auth Flow

#### Login (`(auth)/index`)

| Issue | Severity | Description |
|-------|----------|-------------|
| **Alert not imported** | **Blocks** | `Alert.alert` used for Google/Snap "Not configured" but `Alert` not in react-native imports — **runtime crash** |
| Web entry shell | Good | `WebEntryShell` for first-time web visitors |
| OTP inline | Good | `VerifyCodeInline` with 6-digit input, auto-advance |
| Error display | Good | `accessibilityLiveRegion="polite"` on error |
| Back navigation | Good | Back from phone step to choose |

**Improvement:** Add `Alert` to imports: `import { ..., Alert } from 'react-native'`.

---

#### Register (`(auth)/register`)

| Issue | Severity | Description |
|-------|----------|-------------|
| Alert import | Good | `Alert` imported |
| handleContinue fallback | Degrades | On sendOTP failure, tries `registerDirect` — confusing; may mask real errors |
| Dev mode | Degrades | `setTimeout` + `Alert.alert` for devCode — intrusive on web |

**Improvement:** Remove registerDirect fallback or make explicit; devCode only in dev.

---

#### Verify Code (`(auth)/verify-code`)

| Issue | Severity | Description |
|-------|----------|-------------|
| Missing params | Good | Redirect to login when phone/mode missing |
| Resend timer | Good | 60s countdown |
| Digit inputs | Good | Auto-advance; backspace handling |
| Error state | Good | Clear digits, refocus |

**Improvement:** Add `accessibilityLabel` to digit inputs; group with `aria-describedby`.

---

### 2.2 Discovery (`(tabs)/index`)

| Issue | Severity | Description |
|-------|----------|-------------|
| SafeState | Good | Loading, error, empty with retry |
| Radius chip | Degrades | Cycles 5→25→50→5; label shows current value — "next" not obvious |
| Whisper overlay | Good | Long-press; inline input; send |
| Crossing paths | Good | Horizontal scroll; accessibility label |
| Discovery cap banner | Good | Info when at limit |
| Ad card | Good | VenueAdCard with dismiss |
| Stories row | Good | Add + nearby stories |

**Improvement:** Add "km" or "radius" to chip label; consider stepper UX.

---

### 2.3 Messages (`(tabs)/messages`)

| Issue | Severity | Description |
|-------|----------|-------------|
| Loading/error/empty | Good | SafeState |
| Consent hint | Good | "Consent pending", "You consented" |
| Refresh | Good | RefreshControl |

**Improvement:** Add swipe-to-delete or archive (if supported by API).

---

### 2.4 Chat (`chat/[id]`)

| Issue | Severity | Description |
|-------|----------|-------------|
| Safety menu | Good | Block, Report, Safety info |
| Send loading | Degrades | No loading state on send button during request |
| Self-destruct toggle | Good | Timer icon; placeholder change |
| Error state | Good | Retry, Go back |
| Empty messages | Good | "No messages yet" |

**Improvement:** Disable send + show spinner during send.

---

### 2.5 User Profile (`user/[id]`)

| Issue | Severity | Description |
|-------|----------|-------------|
| Block without confirm | Degrades | Tap block → immediate block and `router.back()` — no confirmation |
| Report without confirm | Degrades | Tap report → immediate API call — no confirmation |
| Like/Match | Good | Vibration; match alert |
| Whisper | Good | Anonymous input; send |
| ConnectionWindowModal | Good | Cap reached; tier options |

**Improvement:** Add confirmation dialogs for Block and Report.

---

### 2.6 Profile / Me (`(tabs)/profile`)

| Issue | Severity | Description |
|-------|----------|-------------|
| **Panic location bug** | **Blocks** | `location?.coords?.latitude` — `useLocation` returns `{ latitude, longitude }` directly; **coords is undefined** → panic sends `undefined, undefined` |
| Panic confirmation | Good | Alert before send |
| Menu items | Good | Clear navigation |
| Logout | Good | Log Out button |

**Improvement:** Use `location?.latitude` and `location?.longitude` in handlePanic.

---

### 2.7 Emergency Contacts (`profile/emergency`)

| Issue | Severity | Description |
|-------|----------|-------------|
| Add/remove | Good | Form; confirmation for remove |
| Cap note | Good | "Maximum 5 contacts" |
| Empty state | Good | "Add your first contact" |

**Improvement:** Add `accessibilityLabel` to form inputs.

---

### 2.8 Venue Detail (`venue/[id]`)

| Issue | Severity | Description |
|-------|----------|-------------|
| Load error | Degrades | `catch` → `router.back()` — no error message |
| Check-in / Distress / Share / Review | Good | Clear actions |
| Grid loading | Good | ActivityIndicator |
| Verified safe badge | Good | Green badge |

**Improvement:** Show error state with retry instead of silent back.

---

### 2.9 Event Detail (`event/[id]`)

| Issue | Severity | Description |
|-------|----------|-------------|
| RSVP failure | Degrades | `catch` empty — no user feedback; state may not revert |
| Door code (host) | Good | Input + Set |
| Edit (host) | Good | Link to event-edit |
| Loading | Good | ActivityIndicator |

**Improvement:** On RSVP error, show Alert and revert `attending` state.

---

### 2.10 Events Tab (`(tabs)/events`)

| Issue | Severity | Description |
|-------|----------|-------------|
| (Uses SafeState) | Good | Loading, error, empty |

---

## 3. Cross-Cutting Findings

### 3.1 Loading States

| Surface | Pattern | Status |
|---------|---------|--------|
| Admin | SkeletonCards, SkeletonTable | Good |
| Mobile | SafeState, ActivityIndicator | Good |
| Chat send | None | Missing |

---

### 3.2 Error States

| Surface | Pattern | Status |
|---------|---------|--------|
| Admin | AdminError + Retry | Good |
| Mobile | SafeState error + onRetry | Good |
| API errors | mapApiError | Good |

---

### 3.3 Empty States

| Surface | Pattern | Status |
|---------|---------|--------|
| Admin | "No X yet", "Empty" | Good |
| Mobile | SafeState empty | Good |

---

### 3.4 Navigation

| Issue | Severity |
|-------|----------|
| Tab bar | Good |
| Back buttons | Good |
| Deep links | Not audited |

---

### 3.5 Accessibility

| Issue | Severity | Location |
|-------|----------|----------|
| Focus visible | Good | Admin CSS |
| aria-label on nav | Good | Admin Layout |
| aria-current | Good | Admin nav |
| Login inputs | Degrades | No label association |
| Verify code digits | Degrades | No group/label |
| Discover tiles | Good | accessibilityLabel, accessibilityHint |
| Chat options | Good | accessibilityLabel |
| Panic button | Good | accessibilityLabel, accessibilityHint |
| Touch targets | Degrades | Some buttons < 44px (e.g. Moderation Approve/Dismiss) |
| Contrast | Not audited | Dark theme; verify WCAG AA |

---

### 3.6 Mobile Responsiveness (Admin)

| Breakpoint | Behavior |
|------------|----------|
| < 768px | Sidebar drawer; overlay; dashboard 2-col grid; map height adjusted |
| ≥ 768px | Sidebar always visible; hamburger hidden |

---

## 4. Workflow Breakdown

### 4.1 Admin: Login → Dashboard

1. Visit `/login` → form
2. Phone + OTP or dev bypass
3. Token stored; navigate to `/`
4. **Gap:** No token refresh; session may expire silently

### 4.2 Mobile: Login → Discover

1. AuthOptions → phone or OAuth
2. **Bug:** OAuth "Not configured" → crash (Alert not imported)
3. Phone → OTP → verify-code or inline
4. Navigate to (tabs)
5. Discover loads with location

### 4.3 Mobile: Panic Alert

1. Profile → Panic Alert
2. Confirm in Alert
3. **Bug:** `location.coords` undefined → API receives null coordinates
4. Alert recorded; message shown

### 4.4 Mobile: Chat

1. Messages → tap conversation
2. Load messages; join socket room
3. Send message — no loading indicator
4. Block/Report via header menu

---

## 5. Prioritized UX Improvement List

### P0 — Blocks Usage (Fix Immediately)

| # | Item | Location | Fix |
|---|------|----------|-----|
| 1 | Panic sends no location | `profile.tsx` handlePanic | Use `location?.latitude`, `location?.longitude` |
| 2 | Alert not imported | `(auth)/index.tsx` | Add `Alert` to react-native imports |

---

### P1 — Degrades Experience

| # | Item | Location | Fix |
|---|------|----------|-----|
| 3 | Block/Report no confirmation | `user/[id].tsx` | Add Alert.alert before block/report |
| 4 | Chat send no loading | `chat/[id].tsx` | Disable send + spinner during request |
| 5 | Venue load error silent | `venue/[id].tsx` | Show error state + retry |
| 6 | Event RSVP failure silent | `event/[id].tsx` | Alert on error; revert state |
| 7 | Users pagination | `Users.tsx` | Disable Next when no more pages |
| 8 | Admin logout | Layout | Add logout button |
| 9 | Register handleContinue fallback | `register.tsx` | Remove or clarify registerDirect fallback |

---

### P2 — Polish

| # | Item | Location | Fix |
|---|------|----------|-----|
| 10 | Login form labels | `Login.tsx`, GlassInput | Associate labels with inputs |
| 11 | Verify code a11y | `verify-code.tsx` | Group digits; aria-describedby |
| 12 | Admin table overflow | Users, Ads | Improve mobile table UX |
| 13 | Moderation drag copy | Moderation.tsx | Clarify "Drag reports here" |
| 14 | Touch targets | Moderation, Ads | Ensure ≥ 44px |
| 15 | Dev bypass visibility | Admin Login | Hide in production |

---

## 6. Accessibility Notes

- **Admin:** `role="main"`, `aria-label` on pages; `:focus-visible`; nav has `aria-current`. Tables need `scope` on headers (partially done).
- **Mobile:** Many screens have `accessibilityLabel` on key actions; error regions use `accessibilityLiveRegion="polite"`. Gaps: form labels, digit inputs, some small touch targets.
- **Contrast:** Dark theme (purple/black) — recommend WCAG AA audit for text/background and button states.
- **Screen readers:** Test with TalkBack (Android) and VoiceOver (iOS) for critical paths: login, panic, chat.

---

## 7. Summary Table

| Severity | Count | Examples |
|----------|-------|----------|
| Blocks usage | 2 | Panic location, Alert import |
| Degrades experience | 9 | Block/Report confirm, send loading, pagination, logout |
| Polish | 6 | Labels, a11y, touch targets, dev bypass |

---

*Report generated from codebase audit. Recommend running E2E tests for auth, panic, and chat flows after fixes.*
