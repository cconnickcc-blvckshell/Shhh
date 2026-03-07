# Shhh — Future Improvements Ledger

> **Purpose:** Single ledger for planned implementations, ideas, and enhancements. All entries scored for feasibility, impact, and effort.  
> **Last updated:** March 2026  
> **Source:** GPT operational review, archived docs (GAME_CHANGER_ROADMAP, ADMIN_DASHBOARD_FUTURE_PLAN, ME_SECTION_IMPROVEMENTS, FEATURE_ADDITIONS_CRITIQUE, ARCHITECTURE_SCALE_RISK_DEEP_DIVE, CSUITE_MASTER_AUDIT, etc.)

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
| Status | Partial (messages, checkout done) |

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
| Status | Partial (metrics exist; dashboards not wired) |

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
| Tier Funnel | Signup → verified → premium | 5 | 4 | 2 | P2 | Not started |
| Trust Score Distribution | Histogram, outliers | 5 | 3 | 2 | P2 | Not started |
| Retention Cohorts | D1/D7 by cohort | 4 | 4 | 3 | P2 | Not started |

### B.6 Me Section (from ME_SECTION_IMPROVEMENTS)

| Id | Idea | Feas | Impact | Effort | Urgency | Status |
|----|------|------|-------|--------|---------|-------|
| Edit Profile: Card sections | 5 | 2 | 1 | P3 | Not started |
| Character count for bio | 5 | 2 | 1 | P3 | Not started |
| "Unsaved changes" warning | 5 | 3 | 1 | P2 | Not started |
| User ID display + Copy | 5 | 2 | 1 | P3 | Not started |
| Create venue: location picker | 4 | 4 | 2 | P1 | Not started |
| Create/Edit event: date/time pickers | 5 | 4 | 2 | P1 | Not started |
| Verification: Tier 2 ID flow | 3 | 5 | 4 | P1 | Not started |
| Empty state illustrations | 4 | 4 | 2 | P2 | Not started |
| Success toast on save | 5 | 3 | 1 | P2 | Not started |
| Markdown in Guides/Norms | 4 | 3 | 2 | P2 | Not started |
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
| MongoDB purge for deleted users | Deletion worker extends to Mongo | 4 | 5 | 2 | P0 | Not started |
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
| GC-7.8 | "No" as first-class (pass with reason) | 5 | 3 | 2 | P2 | Not started |
| GC-7.9 | Couple's joint profile in discovery | 4 | 4 | 3 | P2 | Not started |
| GC-N.1 | Reveal L3 / vault-level reveal | 3 | 4 | 4 | P2 | Not started |
| GC-N.2 | Vibes / soft reputation after event | 3 | 3 | 3 | P3 | Not started |
| GC-N.5 | "Ad why am I seeing this?" explainer | 5 | 3 | 1 | P2 | Not started |

---

## Part C: Strategic Note — Venues as the Weapon

> *"The real strategic weapon in this platform isn't chat or discovery. It's venues. That single system could completely change how the network grows and monetizes if it's designed correctly."*

**Implication:** Prioritize venue-centric improvements (B.1, A.10) when sequencing growth vs. pure feature work.

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
