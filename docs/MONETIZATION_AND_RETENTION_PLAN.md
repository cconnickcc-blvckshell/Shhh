# Shhh — Monetization & Retention Plan

**Purpose:** Inventory what's built vs planned, evaluate ads and subscriptions, and define a plan to accomplish monetization + retention without ruining the experience.  
**Principle:** A million-dollar aesthetic without million-dollar mechanics is just expensive art.  
**Related:** [DEV_HANDOVER.md](./DEV_HANDOVER.md) §9 Ads, §14 Billing; [PRODUCTION_READINESS_GRADE_REPORT.md](./PRODUCTION_READINESS_GRADE_REPORT.md); [FEATURE_ADDITIONS_CRITIQUE.md](./FEATURE_ADDITIONS_CRITIQUE.md); [LAUNCH_PLAN.md](./LAUNCH_PLAN.md).

---

## Guiding Principle

> **Premium = power, not scarcity.**

Gate power, safety, and comfort—not core discovery or matching. Users must feel they *gain* something by upgrading, not that they're being *punished* for staying free.

---

## 1. What's Built / Wired

### 1.1 Subscription (Stripe)

| Component | Status | Location |
|-----------|--------|----------|
| **Tiers** | ✅ | Free, Discreet ($9.99), Phantom ($19.99), Elite ($39.99) |
| **Checkout** | ✅ | `POST /v1/billing/checkout` → Stripe Checkout Session |
| **Webhook** | ✅ | `checkout.session.completed`, `customer.subscription.deleted` |
| **Feature gating** | ✅ | `SubscriptionService.hasFeature()`, `requireFeature()` middleware |
| **Persona slots** | ✅ | Gated by tier (1/2/3/5) |
| **Mobile screen** | ✅ | `app/subscription/index.tsx` — tier cards, Upgrade → `Linking.openURL` |

**Features per tier (backend):**

| Feature | Free | Discreet | Phantom | Elite |
|---------|------|----------|---------|-------|
| anonymousBrowsing | ❌ | ✅ | ✅ | ✅ |
| expandedRadius | ❌ | ❌ | ✅ | ✅ |
| visibilitySchedule | ❌ | ❌ | ✅ | ✅ |
| prioritySafety | ❌ | ❌ | ❌ | ✅ |
| unlimitedAlbums | ❌ | ❌ | ❌ | ✅ |
| No ads | ❌ | ✅ | ✅ | ✅ |

### 1.2 Discovery Cap

| Component | Status | Spec |
|-----------|--------|------|
| **Free cap** | ✅ | 30 results (`DISCOVERY_CAP_FREE`) |
| **Premium cap** | ✅ | 50 results (`DISCOVERY_CAP_PREMIUM`) |
| **Venue/event bypass** | ✅ | `venueId` or `eventId` in query bypasses cap |
| **Response** | ✅ | `discoveryCap`, `radiusUsedKm`, `computedRadiusKm` in response |

### 1.3 Ads

| Component | Status | Location |
|-----------|--------|----------|
| **Backend** | ✅ | `GET /v1/ads/feed`, `/ads/chat`, `/ads/post-event`; impression/tap/dismiss |
| **Surfaces** | ✅ | discover_feed (2/24h), chat_list (1/24h), post_event (1), venue_page (3/24h) |
| **Premium check** | ✅ | Paid users get `null` (no ads) |
| **Cadence** | ✅ | Redis cooldown, 24h cap, dismiss 7-day cooldown |
| **VenueAdCard** | ✅ | `mobile/src/components/VenueAdCard.tsx` — tap, dismiss |
| **Mobile integration** | ❌ | **VenueAdCard not used in Discover, Messages, Events** |

**Gap:** Ads backend is ready; mobile does not fetch or render ads on any surface.

### 1.4 Retention Mechanics (Built)

| Component | Status | Notes |
|-----------|--------|-------|
| **Conversation retention** | ✅ | `retention_mode`, `archive_at`, `default_message_ttl_seconds`; worker archives |
| **Presence decay** | ✅ | Worker decays presence; intents auto-expire |
| **Whispers** | ✅ | 4h TTL; inbox/sent |
| **Lifecycle messaging** | ❌ | Not implemented (waitlist, re-engagement, event-mode) |

---

## 2. What's Planned / Discussed

### 2.1 From FEATURE_ADDITIONS_CRITIQUE

| Idea | Verdict | Notes |
|------|---------|-------|
| **Reveal levels** (0–2, global + conversation scope) | Good ask | Blur → reveal; gate higher levels by tier |
| **Vault albums** | Good ask | Share target/options; premium feature |
| **Whisper quotas** | Good ask | Free: N/day; premium: more |
| **Stealth mode** | Good ask | Backend prefs + push behavior; "discretion by design" |
| **Persona expiry** | Good ask | Burn/temporary personas |
| **Ads UX** | Mostly done | Backend done; mobile gap |
| **Premium = power** | Good ask | Gate power/safety/comfort, not matching |

### 2.2 From LAUNCH_PLAN

| Idea | Status |
|------|--------|
| Lifecycle messaging (waitlist, D2/D5 re-engagement, event-mode) | Planned |
| Referral perks (invite → extra invite, badge) | Planned |
| K-factor tracking | Planned |

### 2.3 From GAME_CHANGER_ROADMAP

| Idea | Relevance |
|------|------------|
| Venue density intelligence | Venue revenue; already built |
| Revenue share / attribution for venues | Align venues with growth |
| "Tonight" feed | Retention driver; backend exists, mobile gap |
| Stories | Retention + ephemeral; backend exists, mobile gap |

---

## 3. Evaluation: What Works, What's Broken, What's Missing

### 3.1 Subscription

| Aspect | Status | Fix |
|--------|--------|-----|
| **Checkout flow** | Broken on mobile | `Linking.openURL` leaves app; no return flow; no in-app browser |
| **Success/cancel URLs** | `shhh://subscription/success` | Deep link must be handled; refetch on return |
| **Feature enforcement** | Partial | `expandedRadius` used in discovery; `anonymousBrowsing`, `visibilitySchedule` not wired to UI |
| **Upgrade visibility** | Low | Premium link in profile menu; no soft paywall or "See more" CTA in Discover |

### 3.2 Ads

| Aspect | Status | Fix |
|--------|--------|-----|
| **Mobile integration** | Missing | Fetch `GET /v1/ads/feed` in Discover; render VenueAdCard |
| **Chat list ad** | Missing | Fetch `GET /v1/ads/chat` in Messages |
| **Post-event ad** | Missing | Fetch after event detail / RSVP flow |
| **Experience risk** | Medium | Cadence is strict (2/24h Discover); avoid interruptive placement |
| **Revenue validation** | None | No CPM data; no venue placements in seed |

### 3.3 Retention

| Aspect | Status | Fix |
|--------|--------|-----|
| **D1/D7 tracking** | Stub | `analytics.ts` + `useScreenView`; need `signup_complete`, `first_action` |
| **Re-engagement** | Missing | No push/email sequences |
| **Event-mode** | Missing | No "Tonight at X" nudge |
| **First 60 seconds** | Gate | Value clarity, signup speed, immediate payoff |

---

## 4. Ad System: Experience-Safe Integration

### 4.1 Placement Rules (Preserve Experience)

| Surface | When to show | UX rule |
|---------|--------------|---------|
| **Discover** | After grid loads; as a card in the list (not interstitial) | Max 1 ad per scroll; native card style; dismissible |
| **Messages** | At top of list, below header (not between conversations) | Single slot; 24h cooldown; skip if `open_to_chat` |
| **Post-event** | After RSVP or event detail view | One-time; soft CTA "Discover more at [Venue]" |

**Never:** Interstitial popup, ad between every N items, ad during active chat.

### 4.2 Implementation Checklist

| Task | Location | Effort |
|------|----------|--------|
| Fetch `GET /v1/ads/feed` when Discover loads | `(tabs)/index.tsx` | S |
| Render VenueAdCard as grid card (or top banner) | Same | S |
| Call `POST /v1/ads/:id/impression` when ad in view | VenueAdCard or parent | S |
| Fetch `GET /v1/ads/chat` when Messages loads | `(tabs)/messages.tsx` | S |
| Render ad at top of conversation list | Same | S |
| Post-event: fetch after RSVP | `event/[id].tsx` | S |
| Seed 1–2 ad placements for testing | `backend/src/database/seed.ts` | S |

### 4.3 Experience Guardrails

- **Discover:** Insert ad as card 3–5 (not first); user can scroll past; no auto-play.
- **Messages:** Collapsible or subtle; "Sponsored" label; tap → venue.
- **Kill switch:** `ad_controls.global.enabled = false` turns off all ads immediately.

---

## 5. Subscription: Fix Checkout + Surface Value

### 5.1 Checkout Fix

| Option | Pros | Cons |
|--------|------|------|
| **A. In-app browser (WebView)** | Stays in app; better UX | Stripe Checkout in WebView can have 3DS issues; some platforms restrict |
| **B. Deep link return** | Simple | User leaves app; may not return |
| **C. Stripe Payment Element (embedded)** | Best UX | Requires more integration; not Checkout Session |

**Recommendation:** Start with **B** (deep link) + robust return handling:
- `success_url`: `shhh://subscription?success=1`
- `cancel_url`: `shhh://subscription?cancel=1`
- Subscription screen: `useFocusEffect` refetch; show "Welcome to Phantom" on success.
- Add `subscription/success` and `subscription/cancel` routes that redirect to subscription screen with query params.

### 5.2 Surface Value (Soft Paywalls)

| Moment | CTA | Destination |
|--------|-----|-------------|
| **Discover at cap** | "You've seen 30 today. Upgrade for 50." | Subscription |
| **Persona limit** | "Create another persona — upgrade to Discreet." | Subscription |
| **Album limit** | "Unlimited albums with Elite." | Subscription |
| **Ad shown** | "Go ad-free with Discreet." | Subscription |

**Principle:** Show value at the moment of constraint, not as a wall before core action.

### 5.3 Feature Wiring

| Feature | Where to enforce | Status |
|---------|------------------|--------|
| expandedRadius | Discovery controller | ✅ Done |
| anonymousBrowsing | Discovery query (hide viewer from "who viewed") | ⬜ Todo |
| visibilitySchedule | Presence/visibility logic | ⬜ Todo |
| unlimitedAlbums | Album create/list | ⬜ Todo |
| prioritySafety | Panic/check-in response | ⬜ Todo (or defer) |

---

## 6. Retention Engineering

### 6.1 Metrics to Track

| Event | When | Purpose |
|-------|------|---------|
| `signup_complete` | After registration | Funnel |
| `onboarding_complete` | After intent selection | Activation |
| `first_discovery_view` | First Discover load | Activation |
| `first_message_sent` | First message in any conversation | Activation |
| `first_like` | First like | Activation |
| `day_1_active` | Open app 24h after signup | D1 retention |
| `day_7_active` | Open app 7d after signup | D7 retention |

### 6.2 Retention Loops

| Loop | Mechanism | Status |
|------|------------|--------|
| **Event-driven** | "Tonight at [Venue]" — 3 people nearby | ⬜ Build |
| **Re-engagement** | D2: "Who's nearby tonight?"; D5: "You have 3 invites" | ⬜ Build |
| **Whisper** | "Someone is curious about you" | ✅ Exists |
| **Presence** | "X people online now" | ✅ Exists |
| **Crossing paths** | "You've both been at [Venue]" | Backend exists; mobile gap |

### 6.3 Lifecycle Messaging (From LAUNCH_PLAN)

| Sequence | Channel | Trigger |
|----------|---------|---------|
| Waitlist confirm | Email/SMS | Day 0 |
| Waitlist nurture | Email | Day 2, Day 5 |
| "You're up" | Email/SMS | Invite window |
| Re-engagement | Push | D2, D5 post-signup |
| Event-mode | Push | Opt-in; "Tonight at X" |

**Requires:** Email/SMS provider (Resend, Twilio); push (Expo); preference storage.

---

## 7. Phased Plan (Without Ruining Experience)

### Phase 1 — Fix & Surface (2–3 weeks)

**Goal:** Make existing monetization work and visible.

| # | Task | Owner | Experience impact |
|---|------|-------|-------------------|
| 1 | Fix subscription deep link return; refetch on success | Eng | Low — improves upgrade flow |
| 2 | Add "See more" / upgrade CTA when Discover at cap | Eng | Low — soft paywall |
| 3 | Integrate ads in Discover (card in grid) | Eng | Low — 1–2/day max |
| 4 | Seed 1–2 ad placements for dev/staging | Eng | None |
| 5 | Wire `anonymousBrowsing` to discovery (if "who viewed" exists) or defer | Eng | Low |
| 6 | Add analytics events: signup_complete, first_message_sent, first_like | Eng | None |

### Phase 2 — Ads Everywhere, Soft Paywalls (1–2 weeks)

| # | Task | Owner | Experience impact |
|---|------|-------|-------------------|
| 7 | Integrate ads in Messages (top of list) | Eng | Low — 1/24h |
| 8 | Integrate post-event ad | Eng | Low — one-time |
| 9 | "Go ad-free" CTA when ad shown | Eng | Low |
| 10 | Persona limit CTA when user hits slot cap | Eng | Low |
| 11 | Album limit CTA (if limit enforced) | Eng | Low |

### Phase 3 — Retention Mechanics (2–3 weeks)

| # | Task | Owner | Experience impact |
|---|------|-------|-------------------|
| 12 | D1/D7 retention dashboard (internal) | Eng | None |
| 13 | Re-engagement push: D2, D5 | Eng | Medium — must be valuable, not spam |
| 14 | Event-mode push: "X people at [Venue] tonight" | Eng | Low — opt-in |
| 15 | Lifecycle email: waitlist, "You're up" | Eng | Low |
| 16 | "Tonight" feed (if backend ready) | Eng | High — retention driver |

### Phase 4 — Power Features (Backlog)

| # | Task | Notes |
|---|------|-------|
| 17 | Reveal levels (0–2) | Gate L2 by tier |
| 18 | Vault share options | Premium |
| 19 | Whisper quotas | Free: N/day; premium: more |
| 20 | Stealth mode | Backend prefs + push |
| 21 | Visibility schedule | Phantom/Elite |

---

## 8. Experience Guardrails (Non-Negotiable)

| Rule | Why |
|------|-----|
| **No interstitial ads** | Destroys flow |
| **No ad during active chat** | Respect engagement |
| **Max 2 ads/day in Discover** | Already in backend; don't increase |
| **Soft paywall only** | "See more" at cap, not "pay to see anyone" |
| **Premium = power** | Gate comfort/safety, not matching |
| **Kill switch** | `ad_controls.global` — instant off |
| **Monitor NPS/retention** | If conversion up but retention down, relax free tier |

---

## 9. Revenue Model Summary

| Stream | Status | Notes |
|--------|--------|-------|
| **Subscriptions** | Live | Discreet, Phantom, Elite; fix checkout return |
| **Ads (CPM)** | Backend ready | Mobile integration; $15 CPM default |
| **Venue subscriptions** | Schema exists | `venue_accounts.subscription_tier`; not yet productized |
| **Tickets/events** | Discussed | Link to Eventbrite/Stripe; future |

---

## 10. Success Criteria

| Metric | Target | When |
|--------|--------|------|
| **Subscription conversion** | > 2% of MAU | 3 months post-launch |
| **Ad revenue** | CPM validated; no negative NPS | After Phase 2 |
| **D1 retention** | > 40% | Launch |
| **D7 retention** | > 25% | Launch |
| **Paywall perception** | "Power not punishment" | User feedback |

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | March 2026 | Initial plan; inventory, evaluation, phased plan |

---

## Related Documents

- [DEV_HANDOVER.md](./DEV_HANDOVER.md) — Ads (§9), Billing (§14)
- [PRODUCTION_READINESS_GRADE_REPORT.md](./PRODUCTION_READINESS_GRADE_REPORT.md) — Monetization grade
- [FEATURE_ADDITIONS_CRITIQUE.md](./FEATURE_ADDITIONS_CRITIQUE.md) — Premium = power
- [LAUNCH_PLAN.md](./LAUNCH_PLAN.md) — Lifecycle messaging, KPIs
