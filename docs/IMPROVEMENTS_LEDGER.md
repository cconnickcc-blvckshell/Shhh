# Shhh — Future Improvements Ledger

> **Purpose:** Single ledger for planned implementations, ideas, and enhancements. All entries scored for feasibility, impact, and effort.  
> **Last updated:** March 2026  
> **Source:** GPT operational review, GPT polish review, archived docs (GAME_CHANGER_ROADMAP, ADMIN_DASHBOARD_FUTURE_PLAN, ME_SECTION_IMPROVEMENTS, FEATURE_ADDITIONS_CRITIQUE, ARCHITECTURE_SCALE_RISK_DEEP_DIVE, CSUITE_MASTER_AUDIT, etc.)

---

## Grading Metrics

| Metric | 1 | 2 | 3 | 4 | 5 |
|--------|---|---|---|---|---|
| **Feasibility** | Very hard / high risk | Hard | Moderate | Straightforward | Trivial |
| **Impact** | Low / niche | Minor | Moderate | High | Critical |
| **Effort** | Large (months) | Medium-large | Medium | Small | Tiny |
| **Urgency** | P3 (backlog) | P2 (next quarter) | P1 (next sprint) | P0 (blocking) |

**Dependencies:** What must exist first. **Status:** Not started | In progress | Deferred | Done.

---

## Part A: Operational Nervous Systems (GPT Review)

*"The gap between a working prototype and a real network."*

### A.1 Notification Orchestration

**Idea:** Central notification brain — decides push vs in-app vs silent vs aggregate. Example: 3 messages while asleep → 1 notification "3 new messages." Prevents spam loops between push and WebSocket.

| Metric | Score | Notes |
|--------|-------|-------|
| Feasibility | 3 | Extend PushService; add aggregation window, dedup logic |
| Impact | 5 | Critical for UX; prevents notification fatigue |
| Effort | 3 | 2–4 weeks; new service or extend push.service |
| Urgency | P1 | Before scale |
| Dependencies | Push tokens, WebSocket events already exist |
| Status | Not started |

---

### A.2 State Synchronization / Reconciliation

**Idea:** Deterministic pipeline for server truth vs client state vs real-time. Prevents duplicate messages, missing messages, wrong unread counts when user offline → push → opens app.

| Metric | Score | Notes |
|--------|-------|-------|
| Feasibility | 3 | Extend messaging API; add sync tokens or cursor-based reconciliation |
| Impact | 5 | Critical for trust; wrong counts = broken UX |
| Effort | 4 | 1–2 weeks; unread_count already exists; add sync protocol |
| Urgency | P1 | Before scale |
| Dependencies | WebSocket, push, GET messages |
| Status | Not started |

---

### A.3 Idempotency Control (Duplicate-Event Immunity)

**Idea:** Extend idempotency keys beyond chat. Currently: `clientMessageId` for messages, `idempotency-key` for checkout. Add for: conversation creation, album sharing, event RSVP.

| Metric | Score | Notes |
|--------|-------|-------|
| Feasibility | 5 | Pattern exists; idempotencyMiddleware in place |
| Impact | 4 | Prevents duplicate conversations, payments, RSVPs |
| Effort | 2 | Small; add middleware to 3–5 routes |
| Urgency | P1 | Before scale |
| Dependencies | idempotency.ts middleware |
| Status | Partial |

**Notes:** Wave 3: Added idempotency to albums-share, events-rsvp. Messages, checkout, conversations already done. Client should send `Idempotency-Key` header (16–128 chars) for retries.

---

### A.4 Abuse Detection & Trust Automation

**Idea:** Behavioral anomaly detection — 20 whispers in 10 min, same message to 30 users, rapid profile view scanning = bot signals. Throttle or shadow-ban before moderators see.

| Metric | Score | Notes |
|--------|-------|-------|
| Feasibility | 3 | New service; Redis counters, thresholds, config |
| Impact | 5 | Critical for adult communities |
| Effort | 3 | 2–4 weeks |
| Urgency | P1 | Before scale |
| Dependencies | Whisper, messaging, discovery rate limits |
| Status | Not started |

---

### A.5 Feed Integrity Controls

**Idea:** Beyond 300m fuzz: velocity checks, GPS plausibility, account age weighting. Prevent "teleport across the map."

| Metric | Score | Notes |
|--------|-------|-------|
| Feasibility | 4 | Add location validation in discovery.service |
| Impact | 4 | Prevents spoofing, bot discovery |
| Effort | 2 | 1–2 weeks |
| Urgency | P2 | After scale |
| Dependencies | locations, ST_DWithin |
| Status | Not started |

---

### A.6 Privacy Boundary Enforcement (Visibility Policy Engine)

**Idea:** Single authority: "Can user A see user B?" — blocked, couple persona, venue check-in, anonymous whisper, premium visibility. Currently scattered in discovery and messaging.

| Metric | Score | Notes |
|--------|-------|-------|
| Feasibility | 3 | Extract into VisibilityPolicyService; consolidate checks |
| Impact | 5 | Critical for privacy; scattered = bugs |
| Effort | 3 | 2–3 weeks |
| Urgency | P1 | Before scale |
| Dependencies | blocks, discovery_visible_to, personas |
| Status | Not started |

---

### A.7 Moderation Workflow Automation

**Idea:** Triage automation — priority scoring, duplicate report clustering, confidence scoring. Five reports + screenshot + trust drop = jump to top.

| Metric | Score | Notes |
|--------|-------|-------|
| Feasibility | 4 | Extend moderation_queue; add scoring, clustering |
| Impact | 4 | Prevents moderator drowning |
| Effort | 3 | 2–3 weeks |
| Urgency | P2 | After scale |
| Dependencies | moderation_queue, reports |
| Status | Not started |

---

### A.8 Content Lifecycle / Forensic Shadow Archive

**Idea:** TTL messages expire; what happens to unread counts? Evidence for moderation? Moderation-only forensic archive — users see expiration; mods have evidence.

| Metric | Score | Notes |
|--------|-------|-------|
| Feasibility | 3 | Extend deletion worker; add moderation_archive collection |
| Impact | 4 | Compliance, evidence for reports |
| Effort | 3 | 2–3 weeks |
| Urgency | P2 | Before legal/compliance review |
| Dependencies | MongoDB messages, TTL, deletion worker |
| Status | Not started |

---

### A.9 Analytics Instrumentation

**Idea:** Conversion funnel, message reply rates, venue traffic, discovery engagement, ad performance. Currently analytics is stub.

| Metric | Score | Notes |
|--------|-------|-------|
| Feasibility | 4 | Add events; backend or client-side analytics |
| Impact | 5 | Eyes of the product; flying blind without |
| Effort | 3 | 2–4 weeks; schema + instrumentation |
| Urgency | P1 | Before launch |
| Dependencies | Event schema (LAUNCH_PLAN has analytics schema) |
| Status | Not started |

---

### A.10 Growth Mechanics

**Idea:** Invite flows, venue partnerships, event amplification, viral loops. Venues as local growth hubs.

| Metric | Score | Notes |
|--------|-------|-------|
| Feasibility | 4 | Extend venues, events; add invite/referral |
| Impact | 5 | Apps don't grow automatically |
| Effort | 3 | 2–4 weeks |
| Urgency | P2 | Post-launch |
| Dependencies | Venues, events, invite system |
| Status | Not started |

---

### A.11 Economic Control Systems

**Idea:** Spend limits, fraud checks, chargeback monitoring, venue billing reconciliation. Extend ads kill switch.

| Metric | Score | Notes |
|--------|-------|-------|
| Feasibility | 3 | Stripe webhooks, ad_controls extension |
| Impact | 4 | Fraud appears when money flows |
| Effort | 3 | 2–3 weeks |
| Urgency | P2 | When revenue scales |
| Dependencies | Stripe, ad_controls |
| Status | Not started |

---

### A.12 Operational Observability

**Idea:** Dashboards and alerts — latency, queue backlog, API error rates, WebSocket failures, worker health. Before users notice.

| Metric | Score | Notes |
|--------|-------|-------|
| Feasibility | 4 | Prometheus /metrics exists; add Grafana, Alertmanager |
| Impact | 5 | Determines survival in production |
| Effort | 2 | 1–2 weeks; wire existing metrics |
| Urgency | P0 | Before production |
| Dependencies | metrics.ts, OPS_GUIDE alerting |
| Status | Partial |

**Notes:** Wave 3: OPS_GUIDE §6 expanded with Prometheus scrape config, Grafana guidance. Metrics exist; dashboards/Alertmanager deployment-specific.

---

## Part B: Archived Ideas (Not Yet Implemented)

### B.1 Venue-Centric (from GAME_CHANGER_ROADMAP)

*Note: Many items implemented on main (tonight, vibe_tag, event_series, etc.). Remaining gaps below.*

| Id | Idea | Feas | Impact | Effort | Urgency | Status |
|----|------|------|-------|--------|---------|-------|
| GC-1.1 | "Tonight" feed | 4 | 5 | 3 | P1 | ✅ Done (GET /v1/tonight) |
| GC-1.2 | Venue vibe / theme nights | 5 | 4 | 2 | P2 | ✅ Done (events.vibe_tag) |
| GC-1.3 | Venue-issued passes / door codes | 4 | 4 | 3 | P2 | Check migrations 019 |
| GC-1.4 | Venue dashboard: density intelligence | 4 | 3 | 2 | P2 | Check venue-dashboard |
| GC-1.5 | "Verified safe" venue badge | 5 | 4 | 2 | P2 | Check migrations 018 |
| GC-2.1 | Venue = promoter / pop-up / series | 3 | 4 | 4 | P2 | Check venue_type |
| GC-2.2 | Private but discoverable events | 4 | 4 | 3 | P2 | Check visibility_rule |
| GC-2.3 | Series and recurring events | 3 | 4 | 4 | P2 | ✅ Done (event_series) |

### B.2 Growth & Intent (from GAME_CHANGER_ROADMAP)

| Id | Idea | Feas | Impact | Effort | Urgency | Status |
|----|------|------|-------|--------|---------|-------|
| GC-3.1 | Intent as first-class | 4 | 4 | 2 | P1 | ✅ Done (primary_intent) |
| GC-3.2 | Two-layer profile (SFW public / NSFW private) | 3 | 5 | 4 | P2 | Check profile_visibility_tier |
| GC-3.3 | Event tags + onboarding intent | 5 | 4 | 2 | P2 | ✅ Done (vibe_tag, primary_intent) |
| GC-3.4 | "Curious" as protected lane | 4 | 4 | 2 | P2 | ✅ Done (discovery_visible_to) |
| GC-4.2 | How it works / community norms | 5 | 3 | 2 | P2 | ✅ Done (content_slots, guides, norms) |

### B.3 Ephemeral & Live (from GAME_CHANGER_ROADMAP)

| Id | Idea | Feas | Impact | Effort | Urgency | Status |
|----|------|------|-------|--------|---------|-------|
| GC-5.1 | Stories that die (24h) | 4 | 4 | 3 | P2 | ✅ Done (stories, story_views) |
| GC-5.2 | "Live" at venue (opt-in, time-limited) | 4 | 4 | 2 | P2 | Check venue_checkins.live_until |
| GC-5.3 | Quick photo reply (view-once / 24h) | 4 | 3 | 2 | P2 | Check message schema |
| GC-5.4 | "We keep crossing paths" (soft nudge) | 3 | 4 | 3 | P2 | Check crossing_paths |
| GC-5.5 | Tonight-only persona | 4 | 3 | 2 | P2 | ✅ Done (personas.expires_at, is_burn) |

### B.4 Community (from GAME_CHANGER_ROADMAP)

| Id | Idea | Feas | Impact | Effort | Urgency | Status |
|----|------|------|-------|--------|---------|-------|
| GC-6.1 | Groups or tribes | 3 | 5 | 4 | P2 | ✅ Done (groups module) |
| GC-6.2 | Events as home screen | 5 | 4 | 2 | P2 | Check GET /v1/events/this-week |

### B.5 Admin Dashboard (from ADMIN_DASHBOARD_FUTURE_PLAN)

| Id | Idea | Feas | Impact | Effort | Urgency | Status |
|----|------|------|-------|--------|---------|-------|
| 3D Globe | Online users as lights; heat layers | 3 | 3 | 4 | P3 | Not started |
| Marble Drop | Signup visualization | 4 | 2 | 2 | P3 | Not started |
| Admin Control | Feature flags, content, rate limits in DB | 4 | 5 | 3 | P1 | Not started |
| Live Activity Feed | Scrolling feed of recent actions | 4 | 3 | 2 | P2 | Not started |
| Tier Funnel | Signup → verified → premium | 5 | 4 | 2 | P2 | Done (Wave 12) |
| Trust Score Distribution | Histogram, outliers | 5 | 3 | 2 | P2 | Not started |
| Retention Cohorts | D1/D7 by cohort | 4 | 4 | 3 | P2 | Not started |

### B.6 Me Section (from ME_SECTION_IMPROVEMENTS)

| Id | Idea | Feas | Impact | Effort | Urgency | Status |
|----|------|------|-------|--------|---------|-------|
| Edit Profile: Card sections | 5 | 2 | 1 | P3 | ✅ Done (Wave 7) |
| Character count for bio | 5 | 2 | 1 | P3 | ✅ Done (Wave 1) |
| "Unsaved changes" warning | 5 | 3 | 1 | P2 | ✅ Done (Wave 1) |
| User ID display + Copy | 5 | 2 | 1 | P3 | ✅ Done (Wave 7) |
| Create venue: location picker | 4 | 4 | 2 | P1 | ✅ Done (Wave 4) |
| Create/Edit event: date/time pickers | 5 | 4 | 2 | P1 | ✅ Done (Wave 4) |
| Verification: Tier 2 ID flow | 3 | 5 | 4 | P1 | Not started |
| Empty state illustrations | 4 | 4 | 2 | P2 | Not started |
| Success toast on save | 5 | 3 | 1 | P2 | ✅ Done (Wave 1) |
| Markdown in Guides/Norms | 4 | 3 | 2 | P2 | ✅ Done (Wave 8) |
| Accessibility (labels, contrast) | 4 | 4 | 3 | P1 | Not started |

### B.7 Scale & Architecture (from ARCHITECTURE_SCALE_RISK_DEEP_DIVE)

| Id | Idea | Feas | Impact | Effort | Urgency | Status |
|----|------|------|-------|--------|---------|-------|
| Discovery engine | Split contracts: eligibility, ranking, cap | 3 | 5 | 4 | P2 | Not started |
| Outbox pattern | Cross-store consistency for Postgres/Mongo/Redis | 3 | 5 | 4 | P2 | Not started |
| Entitlements engine | Centralized policy; single contract | 3 | 5 | 4 | P2 | Not started |

### B.8 Security & Compliance (from CSUITE_MASTER_AUDIT)

| Id | Idea | Feas | Impact | Effort | Urgency | Status |
|----|------|------|-------|--------|---------|-------|
| MongoDB purge for deleted users | Deletion worker extends to Mongo | 4 | 5 | 2 | P0 | Done |
| JWT in httpOnly cookies (web) | Replace localStorage/sessionStorage | 3 | 4 | 2 | P1 | Not started |
| /metrics authentication | Bearer or IP allowlist | 5 | 3 | 1 | P1 | Partial (METRICS_SECRET exists) |

### B.9 Feature Additions (from FEATURE_ADDITIONS_CRITIQUE)

| Id | Idea | Feas | Impact | Effort | Urgency | Status |
|----|------|------|-------|--------|---------|-------|
| Permissioned reveal L0–L2 | Conversation-scoped, TTL, revoke | 4 | 5 | 3 | P1 | Partial |
| Conversation retention modes | Ephemeral / timed_archive / persistent | 3 | 4 | 4 | P2 | Not started |
| Event-centric interaction | Discovery boost, post-event prompts | 4 | 5 | 3 | P1 | Partial |
| Vault album share | Persona/couple target, watermark_mode | 4 | 5 | 3 | P1 | Partial |

### B.10 Wild Cards (from GAME_CHANGER Theme 7)

| Id | Idea | Feas | Impact | Effort | Urgency | Status |
|----|------|------|-------|--------|---------|-------|
| GC-7.1 | Anonymous question at venue | 4 | 4 | 2 | P2 | Not started |
| GC-7.2 | Vibe check at door (staff marks attendee) | 3 | 3 | 3 | P3 | Not started |
| GC-7.3 | Date mode (couple invite couple) | 4 | 4 | 3 | P2 | Not started |
| GC-7.8 | "No" as first-class (pass with reason) | 5 | 3 | 2 | P2 | ✅ Done (Wave 9) |
| GC-7.9 | Couple's joint profile in discovery | 4 | 4 | 3 | P2 | Not started |
| GC-N.1 | Reveal L3 / vault-level reveal | 3 | 4 | 4 | P2 | Not started |
| GC-N.2 | Vibes / soft reputation after event | 3 | 3 | 3 | P3 | Not started |
| GC-N.5 | "Ad why am I seeing this?" explainer | 5 | 3 | 1 | P2 | ✅ Done (VenueAdCard) |

---

## Part C: Polish & Interaction Quality (GPT Review)

*"The difference between a side project and a premium product is rarely giant features. It's thousands of tiny behaviors that make the system feel predictable, responsive, and trustworthy."*

### C.1 Instant Feedback Loops (Optimistic UI)

**Idea:** Message sent → bubble appears immediately with "sending"; like pressed → heart animates; photo upload → progress indicator appears. App behaves as if action succeeded while network catches up.

**Hard boundary:** Optimistic UI only for reversible, low-risk actions. Never for billing, moderation, safety, identity, or destructive actions.

| Good | Not good |
|------|----------|
| Message bubble, like tap, save profile draft | Subscription change, account deletion, ban, venue verification, panic |

| Feas | Impact | Effort | Urgency | Status |
|------|--------|--------|---------|--------|
| 5 | 5 | 3 | P1 | Partial |

**Notes:** Wave 5: Photo upload progress indicator (edit profile, album). Chat, like done. Backend ready.

---

### C.2 State Transparency

**Idea:** Platform rule — every async action has a shared UI state machine, not ad hoc labels.

**Contract:** Every async action exposes: `idle` | `pending` | `success` | `failed` | `retrying` | `stale/offline`

| Feas | Impact | Effort | Urgency | Status |
|------|--------|--------|---------|--------|
| 5 | 5 | 2 | P1 | Partial |

**Notes:** Wave 2: Reconnect banner in Chat; useSocket exposes connected/reconnecting. Reusable state machine, not per-screen labels.

---

### C.3 Failure Resilience

**Idea:** Failed message → "Tap to retry"; offline → messages queue, UI shows "offline", sync when back. User shouldn't think about network.

**Explicit requirements (not hand-wavy):**
- Client outbox for pending mutations
- Idempotency key per mutation
- Retry policy
- Reconciliation after reconnect
- Terminal failure state (when retries exhausted)

| Feas | Impact | Effort | Urgency | Status |
|------|--------|--------|---------|--------|
| 4 | 5 | 3 | P1 | Partial |

**Notes:** Wave 2: Chat failed message → "Tap to retry"; retry flow with _retrying state. No offline queue yet; idempotency makes retries safe. See A.3.

---

### C.4 Correct Unread Counts Everywhere

**Idea:** Unread counts consistent across chat list, conversation, push, badges, WebSocket. One drift = lost trust.

**Shared invariant:** Unread is not merely UI polish. It is a domain invariant, sync problem, notification problem, and badge problem. Cross-link: **A.2 State Synchronization**.

| Feas | Impact | Effort | Urgency | Status |
|------|--------|--------|---------|--------|
| 3 | 5 | 2 | P0 | Partial (getUnreadTotal, badge exist) |

**Notes:** Needs sync protocol; belongs to both polish and core architecture.

---

### C.5 Intelligent Notifications

**Idea:** Multiple messages → one "3 new messages"; "John and 2 others liked you"; no push if conversation already open.

| Feas | Impact | Effort | Urgency | Status |
|------|--------|--------|---------|--------|
| 4 | 5 | 3 | P1 | Partial (InAppToast suppresses when in conversation) |

**Notes:** Overlaps A.1 Notification Orchestration; server-side aggregation missing.

---

### C.6 Empty States That Guide Behavior

**Idea:** "Nothing near you tonight yet. Start something → Create an event." instead of "No events found." Micro-onboarding moments.

| Feas | Impact | Effort | Urgency | Status |
|------|--------|--------|---------|--------|
| 5 | 4 | 2 | P2 | Done |

**Notes:** Wave 1: Discovery ("Start something → Create event"), Events, Albums ("Create album"), Whispers ("Go to Discover") — all with CTAs.

---

### C.7 Consistent Animation Language

**Idea:** Modals slide up; back slides right; new content fades in. Humans notice inconsistency.

| Feas | Impact | Effort | Urgency | Status |
|------|--------|--------|---------|--------|
| 5 | 4 | 2 | P2 | Partial |

**Notes:** Wave 5: `animation` constants in theme. Wave 9: ConnectionWindowModal uses animationType="slide" for bottom sheet.

---

### C.8 Predictable Navigation Behavior

**Idea:** Back always works same; swipe consistent; tabs preserve scroll position.

| Feas | Impact | Effort | Urgency | Status |
|------|--------|--------|---------|--------|
| 5 | 4 | 1 | P2 | Partial (Expo Router defaults) |

**Notes:** Audit custom nav and deep links.

---

### C.9 Privacy Cues

**Idea:** Blur indicators; "Only visible to matches" badges; "Anonymous mode active." Build trust.

| Feas | Impact | Effort | Urgency | Status |
|------|--------|--------|---------|--------|
| 5 | 5 | 2 | P1 | Partial |

**Notes:** Wave 7: "Only visible to matches" / "Visible after reveal" on user profile; "Anonymous" badge on whisper cards. Blur exists.

---

### C.10 Progressive Disclosure

**Idea:** Basic profile first; advanced options behind toggle; safety tools when needed.

| Feas | Impact | Effort | Urgency | Status |
|------|--------|--------|---------|--------|
| 5 | 4 | 2 | P2 | Done |

**Notes:** Wave 12: "Show advanced options" toggle on Create Event (visibility, tier, radius, location revealed) and Edit Profile (Discovery & Privacy, Hosting). Primary vibe moved to About for always-visible access.

---

### C.11 Small Social Signals

**Idea:** Typing indicators; read receipts; "Last active"; reaction emojis. Missing = feels empty.

| Feas | Impact | Effort | Urgency | Status |
|------|--------|--------|---------|--------|
| 4 | 4 | 3 | P2 | Partial (typing, presence) |

**Notes:** Read receipts, reactions need schema + UI.

---

### C.12 Polished Onboarding Friction

**Idea:** Minimal info first; show value immediately; delay complexity. Browse discovery before full profile.

| Feas | Impact | Effort | Urgency | Status |
|------|--------|--------|---------|--------|
| 4 | 5 | 3 | P1 | Not started |

**Notes:** Product decision: allow browse without full profile.

---

### C.13 Micro-Copy Quality

**Idea:** "We couldn't send that message. Tap to try again." instead of "Error: invalid request." Human tone.

| Feas | Impact | Effort | Urgency | Status |
|------|--------|--------|---------|--------|
| 5 | 4 | 2 | P2 | Partial |

**Notes:** Wave 2: mapApiError expanded (timeout, 404, 500, network); human tone. OfflineBanner copy improved.

---

### C.14 Performance Consistency

**Idea:** Smooth scrolling; image loading; screen transitions. Same everywhere.

| Feas | Impact | Effort | Urgency | Status |
|------|--------|--------|---------|--------|
| 4 | 4 | 3 | P2 | Partial |

**Notes:** Virtualization for Discovery, events, albums; image optimization.

---

### C.15 Edge-Case Handling

**Idea:** User deleted mid-conversation; message expires while reading; event cancelled while RSVP'd; mutual block. Handle gracefully.

| Feas | Impact | Effort | Urgency | Status |
|------|--------|--------|---------|--------|
| 4 | 5 | 3 | P1 | Partial |

**Notes:** Wave 10: Event 404/cancelled shows Alert "Event unavailable" + Go back. Chat 404 shows "This conversation is no longer available" (mapApiError). Deletion/MongoDB gap; expiry UI; block race remain.

---

### C.16 Variable Reward Reinforcement (Ethical)

**Idea:** Variable reward reinforcement (operant conditioning) — when rewards appear unpredictably, humans check more often. Casinos, slot machines, social media feeds use this. The ethical version: design so the *real world* produces unpredictable value, not fake notifications or manipulative timers.

**Why Shhh fits:** Real life is already variable — people appear nearby, events start, someone enters a venue, a whisper arrives. The platform doesn't need to fake it.

**Core loop:** User opens app → checks discovery → sometimes nothing / sometimes new people / sometimes whisper / sometimes event. That unpredictability is the hook.

**Three variable reward surfaces:**

| Surface | Mechanism | Design tweak |
|---------|-----------|--------------|
| Nearby Discovery | Grid is the "slot machine" | Small visual pulse when new users enter radius; "3 new people nearby" |
| Tonight Feed | Events inherently unpredictable | FOMO energy; nothing vs huge party |
| Whispers | Pure variable reward — who, what, interesting? | Mystery creates engagement |

**Key implementation:** Pull-to-refresh on discovery. Same backend query, but the gesture creates the psychological loop ("maybe someone new appeared"). Used by Instagram, Reddit, Twitter.

**Social proof layer:** "12 people nearby right now"; "5 people going tonight"; "3 people liked you." Reduces uncertainty; humans move toward activity.

**Ethical guardrail:** Real events, real people, real proximity — not fake notifications, artificial scarcity, or manipulative timers.

**Warning — no goblin mode:** No fake counters; no fabricated "someone is nearby" nudges; no synthetic urgency. Only real-world state surfaced better.

| Feas | Impact | Effort | Urgency | Status |
|------|--------|--------|---------|--------|
| 5 | 5 | 2 | P1 | Partial |

**Notes:** Wave 5: "X new people nearby" toast on refresh; "X going tonight" badge on Events. Social proof bar, pull-to-refresh done.

---

### C.17 Swipe Actions (Mobile)

**Idea:** More swipe gestures for addictive UX — e.g. swipe from right opens messages; swipe between discovery/events; swipe to like/pass. Reduces taps, feels fluid.

| Feas | Impact | Effort | Urgency | Status |
|------|--------|--------|---------|--------|
| 4 | 4 | 3 | P2 | Partial |

**Notes:** Wave 6: Swipe-right on discovery tile = like; swipe-left = pass. Swipe from left edge = open messages. Native only.

---

## Part D: Strategic Note — Venues as the Weapon

> *"The real strategic weapon in this platform isn't chat or discovery. It's venues. That single system could completely change how the network grows and monetizes if it's designed correctly."*

**Implication:** Prioritize venue-centric improvements (B.1, A.10) when sequencing growth vs. pure feature work.

---

## Part E: Polish Quick Reference

| Rank | Entry | Impact | Feas | Urgency |
|------|-------|--------|------|---------|
| 1 | C.4 Unread counts | 5 | 3 | P0 |
| 2 | C.1 Optimistic UI | 5 | 5 | P1 |
| 3 | C.2 State transparency | 5 | 5 | P1 |
| 4 | C.3 Failure resilience | 5 | 4 | P1 |
| 5 | C.5 Intelligent notifications | 5 | 4 | P1 |
| 6 | C.9 Privacy cues | 5 | 5 | P1 |
| 7 | C.12 Onboarding friction | 5 | 4 | P1 |
| 8 | C.15 Edge-case handling | 5 | 4 | P1 |
| 9 | C.16 Variable reward (pull-to-refresh, pulse, social proof) | 5 | 5 | P1 |
| 10 | C.6 Empty states | 4 | 5 | P2 |
| 11 | C.7 Animation language | 4 | 5 | P2 |
| 12 | C.17 Swipe actions (mobile) | 4 | 4 | P2 |

---

## Quick Reference: Top 10 by Impact × Feasibility

| Rank | Entry | Impact | Feas | Effort |
|------|-------|--------|------|--------|
| 1 | A.12 Operational Observability | 5 | 4 | 2 |
| 2 | A.1 Notification Orchestration | 5 | 3 | 3 |
| 3 | A.2 State Synchronization | 5 | 3 | 2 |
| 4 | A.6 Visibility Policy Engine | 5 | 3 | 3 |
| 5 | A.9 Analytics Instrumentation | 5 | 4 | 3 |
| 6 | B.8 MongoDB purge | 5 | 4 | 2 |
| 7 | A.10 Growth mechanics | 5 | 4 | 3 |
| 8 | A.3 Idempotency extension | 4 | 5 | 2 |
| 9 | B.6 Create venue: location picker | 4 | 4 | 2 |
| 10 | B.6 Create/Edit event: date/time pickers | 4 | 5 | 2 |

---

## What Remains (Post–Wave 12)

**High priority (P0–P1):**
- **C.4** Unread counts sync protocol (cursor-based reconciliation)
- **A.1** Notification orchestration (aggregate "3 new messages")
- **A.2** State synchronization / reconciliation
- **A.6** Visibility policy engine (single "Can A see B?" authority)
- **A.9** Analytics instrumentation (conversion funnel, reply rates)
- **B.6** Verification Tier 2 ID flow
- **C.12** Polished onboarding friction
- ~~**C.15** Edge-case handling~~ Partial (Wave 10: event 404, chat 404)
- **B.8** JWT in httpOnly cookies (web)

**Medium priority (P2):**
- **A.5** Feed integrity (velocity checks, GPS plausibility)
- **A.7** Moderation workflow automation
- **A.10** Growth mechanics (invite flows, viral loops)
- **B.5** Admin: 3D Globe, Marble Drop, Admin Control, ~~Tier Funnel~~ ✅, Retention Cohorts
- **C.7** Full animation application across modals
- ~~**B.6** Empty state illustrations, Accessibility~~ Partial (Wave 11: accessibility labels on key buttons, SafeState, CTAs)
- ~~**GC-7.8** "No" as first-class (pass with reason)~~ ✅ Wave 9

**Strategic / larger:**
- Discovery engine (split contracts)
- Outbox pattern (Postgres/Mongo/Redis consistency)
- Entitlements engine
- Supabase photo buckets
