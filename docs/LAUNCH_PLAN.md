# Shhh — Launch Blitz Plan

**Purpose:** Combined launch and marketing plan for Shhh. Not "an app launch"—a **private social environment** inside a culturally volatile niche.  
**Source:** Expanded from GPT marketing framework; aligned with Shhh architecture, E2E audit, and production readiness.  
**Related:** [SOFT_LAUNCH_WEB_PLAN.md](./SOFT_LAUNCH_WEB_PLAN.md), [E2E_CAPABILITY_AUDIT_REPORT.md](./E2E_CAPABILITY_AUDIT_REPORT.md), [PRODUCTION_READINESS_GRADE_REPORT.md](./PRODUCTION_READINESS_GRADE_REPORT.md), [CONSOLIDATED_CTO_REVIEW.md](./CONSOLIDATED_CTO_REVIEW.md).

---

## Strategic Objectives (Three Simultaneous Goals)

| Objective | What it means |
|-----------|---------------|
| **1. Signal dominance** | First-mover in a niche that rewards discretion. Be the *obvious* choice for people who want proximity + privacy. |
| **2. Cultural framing** | Never "hookup swinger app." Always "private social layer for real-world connection." Protects App Store, Stripe, ad accounts, valuation. |
| **3. Controlled retention** | Not installs. Day 1, Day 7, invite conversion. Blitz amplifies weaknesses; product must hold. |

---

## CTO Gate: Backend Readiness Before Blitz

> **Blitz marketing amplifies weaknesses instantly. If product isn't stable, blitz becomes public failure.**

### Minimum Viable Stability (Must Pass Before Phase 1)

| Capability | Target | Current State | Action |
|------------|--------|---------------|--------|
| **Concurrent users** | 1,000+ | k6 tests exist; no prod load test | Run load test at 2x target before Phase 1 |
| **Auth bursts** | 100+ req/min during launch window | Rate limiter exists (100/15min global); auth-specific limits | Verify auth rate limits; consider temporary bump for launch weekend |
| **Real-time spikes** | WebSocket joins, presence updates | Socket.io; Redis presence | Load-test WebSocket join storm |
| **Moderation load** | Reports, blocks, panic | Admin dashboard; manual review | Ensure 1–2 humans on standby during Phase 2 |
| **Database** | Postgres + Redis + Mongo under load | Supabase/Upstash/Atlas target stack | Migrate to cloud DBs before Phase 0; see [GET_ONLINE.md](./GET_ONLINE.md) |

### Observability Minimum

- Request metrics (rate, error, latency) — Prometheus RED or equivalent
- At least one SLO (e.g. p95 < 500ms for discovery)
- Alerting on error spike or latency degradation

**Verdict:** Do not enter Phase 1 until these pass. See [CONSOLIDATED_CTO_REVIEW.md](./CONSOLIDATED_CTO_REVIEW.md) §3.1 for P0 gates.

---

## Phase 0 — Harden Before Ignition (2–4 Weeks Pre-Launch)

**Goal:** Lock product stability and brand language. No launch into instability.

### 0.1 Product Hardening Checklist

| Item | Owner | Done |
|------|-------|------|
| Pixel-perfect onboarding (no friction, no jank) | Product/Eng | |
| 60-second value clarity (first screen explains "why Shhh") | Product | |
| Invite/referral system (codes, tracking) | Eng | |
| Analytics: CPI, Day 1, Day 7 retention, funnel drop-offs | Eng | |
| Moderation + reporting flows (admin queue, response time) | Ops | |
| Server stress-tested for 5–10x projected load | Eng | |
| Cloud databases live (Supabase, Upstash, Atlas) | Eng | |
| Observability: metrics, SLO, alerting | Eng | |

### 0.2 Brand Positioning Language (Finalize)

**NOT:**
- "Hookup swinger app"
- "Dating for couples"
- Any explicit or suggestive phrasing

**YES:**
- "Private social layer for real-world connection"
- "Proximity without exposure"
- "Discretion by design"
- "Connect with people nearby—on your terms"

**Why:** Protects App Store, Stripe, ad accounts, long-term valuation. Subtlety is survival.

### 0.3 Launch Readiness Sign-Off

- [ ] CTO: Backend passes load test; observability live
- [ ] Product: Onboarding flow approved; value clarity < 60s
- [ ] Ops: Moderation playbook; 24–48h response SLA for reports
- [ ] Legal: Positioning language approved; no policy–system mismatch

---

## Phase 1 — Controlled Seeding (Week -2 to -1)

**Goal:** Seed culture before public noise. First 1,000–2,000 users define tone.

### 1.1 Target Channels

| Channel | Approach | Deliverable |
|---------|----------|-------------|
| **1–2 vetted swinger communities** | Private intro via organizer; no cold outreach | Founder badges, private group access |
| **1 club owner partner** | In-person intro; exclusive early access | Invite-only codes; "Founding Circle" identity |
| **2–3 mid-tier sex-positive influencers** | Soft tease only; no explicit promotion | Early access; "I wasn't sure if I should show this…" framing |

### 1.2 Deliverables

- **Founder badges** — Visible in-app; expires after X date (creates scarcity)
- **Private group access** — Dedicated space for Founding Circle
- **Invite-only onboarding codes** — Gated signup; codes distributed by organizers
- **"Founding Circle" identity** — Badge, exclusive label, early-event access

### 1.3 Success Metrics

- 1,000–2,000 users in app
- Day 1 retention > 40%
- Zero public leaks or negative press
- Organizer/club feedback: "feels exclusive, not cheap"

### 1.4 Risk Mitigation

- NDA or confidentiality expectation with influencers (soft; no legal hammer)
- Codes are single-use or limited-use to prevent abuse
- Moderation queue monitored daily; no backlog > 24h

---

## Phase 2 — The Weekend Detonation (48-Hour Cluster)

**Goal:** Synchronized ignition. Multiple social signals → App Store search spike → curiosity loop.

### 2.1 Simultaneous Stack (All Within 24–48 Hours)

#### A. Club Launch Event

| Element | Spec |
|---------|------|
| **Aesthetic** | Branded but subtle; dark, controlled lighting; no cheap promo signage |
| **Access** | QR codes for gated areas; brand ambassadors assist onboarding |
| **Unlock** | Early-access badge for attendees |
| **Staff** | 2–3 ambassadors; trained on app flow; no hard sell |

#### B. Influencer Cluster Drop

- **5–6 creators** post within 24–48 hours
- **Tone:** "I wasn't sure if I should even show this…" — Curiosity > promotion
- **Format:** Discovery, not ad. Soft tease. No explicit language.
- **Timing:** Stagger by 4–6 hours to extend algorithmic clustering

#### C. Private Community Activation

- Swinger groups receive private unlock codes during same weekend
- Codes unlock Founding Circle or early-access tier
- Creates FOMO: "I got in; you might not"

### 2.2 Momentum Mechanics

- Multiple signals → App Store search volume spike
- Search spike → curiosity loop
- Curiosity loop → installs → more signals (if retention holds)

**Critical:** If Day 1 retention drops below 35%, pause paid amplification. Fix product before scaling noise.

### 2.3 Weekend Ops

- **On-call:** 1 engineer + 1 ops during 48h window
- **Moderation:** 2 shifts (12h each) to clear report queue
- **Monitoring:** Dashboards on big screen; alert on error spike or latency > 1s

---

## Phase 3 — Controlled Scarcity (Week 1–2 Post-Launch)

**Goal:** Restrict supply to convert casual installs into emotional attachment.

### 3.1 Scarcity Mechanics

| Mechanic | Implementation |
|----------|----------------|
| **Limited daily invites** | Each user gets N invites/day; visible count |
| **"Invite Remaining: 3"** | In-app display; creates urgency |
| **Founder badge sunset** | Badge disappears after X date; "Last chance" messaging |
| **Waitlist queue** | Public waitlist; "X people ahead of you" |

### 3.2 Psychological Effect

Users must feel: **"I got in early."**

Scarcity converts installs into identity. Identity drives retention and referral.

### 3.3 Guardrails

- Do not over-restrict; 2-week window is enough
- After Week 2, ease invite limits gradually
- Founder badge sunset should feel earned, not punitive

---

## Phase 4 — Viral Loop Engineering (Week 3+)

**Goal:** Users become marketing. Growth shifts from paid ignition to self-propelling.

### 4.1 In-App Mechanics

| Mechanic | Purpose |
|---------|---------|
| **Referral unlock perks** | Extra invites, badge tier, or feature unlock for successful referrals |
| **Tiered badge system** | Founder → Early → Member; visible status |
| **Private event mode** | Events visible only to attendees; exclusivity |
| **Location-based cluster rooms** | "Who's at X tonight?" — real-time discovery |
| **Story-sharing mechanics** | Blurred screenshot-friendly; shareable without exposing identity |

### 4.2 Conversion Targets

- Invite conversion > 30%
- Referral-to-signup > 25%
- Day 7 retention > 25%

### 4.3 When to Scale Paid

Only after:
- Day 7 retention stable
- CPI under $4
- No critical bugs in top 5 flows
- Moderation queue < 24h

---

## Influencer Budget Structure

### Blitz Tier (Real Impact)

| Item | Cost |
|------|------|
| 5 mid-tier creators @ $6k | $30k |
| 1 upper mid-tier @ $20k | $20k |
| Club event (venue, staff, visuals) | $15k–$40k |
| **Total** | **$65k–$90k** |

### Lean Tier (Under $20k)

- Hyper-local activation only
- 1–2 club events
- Organic seeding via communities
- No paid influencer; rely on Founding Circle word-of-mouth

**Reality:** Under $20k = slower ramp, but viable if product is strong and community is tight.

---

## Key Performance Targets

### Launch Weekend (Phase 2)

| Metric | Target | Action if Missed |
|--------|--------|------------------|
| Installs | 5,000–20,000 | Analyze funnel; fix top drop-off |
| CPI | < $4 | Pause paid; optimize creative or audience |
| Day 1 retention | > 40% | Pause expansion; fix onboarding or value clarity |
| Day 7 retention | > 25% | Do not scale; diagnose churn |
| Invite conversion | > 30% | Improve invite UX; clarify value prop |

**Rule:** If targets miss, pause expansion. Do not scale noise over leakage.

---

## Critical Positioning Safety

**You operate near adult-adjacent territory.**

### Never

- Use explicit language in marketing
- Visually imply explicit acts
- Frame as "swinger sex tool"
- Promise anonymity you cannot guarantee

### Always

- **Privacy** — "Your data, your control"
- **Exclusivity** — "By invitation"
- **Connection** — "Real people, nearby"
- **Discretion** — "No one knows unless you choose"

### What This Protects

- App Store approval
- Stripe processing
- Ad accounts (Meta, Google)
- Long-term valuation
- Regulatory posture (DSA, UK OSA, etc.)

---

## Psychological Arc (User Journey)

| Week | Feeling | Tactics |
|------|--------|---------|
| **0** | Mystery | Teaser content; "something different" |
| **1** | Exclusivity | Limited invites; Founder badge; waitlist |
| **2** | Identity | "I'm a Founding Circle member" |
| **3+** | Lifestyle | Events, venues, discovery; Shhh as habit |

**Shhh must feel like a club, not a commodity.**

---

## Operational Checklist (Pre-Launch)

### Engineering

- [ ] Load test: 1,000 concurrent users
- [ ] Load test: 100 auth requests/min burst
- [ ] WebSocket join storm test
- [ ] Cloud DBs live (Supabase, Upstash, Atlas)
- [ ] Observability: metrics, SLO, alerting
- [ ] Invite/referral system implemented
- [ ] Analytics: CPI, D1, D7, funnel events

### Product

- [ ] Onboarding flow < 60s to value
- [ ] Founder badge implemented
- [ ] Invite codes + tracking
- [ ] Scarcity mechanics (limited invites, visible count)

### Ops

- [ ] Moderation playbook documented
- [ ] 24–48h response SLA for reports
- [ ] On-call roster for launch weekend
- [ ] Club event staff trained

### Marketing

- [ ] Brand language finalized
- [ ] Influencer contracts/agreements
- [ ] Club partner confirmed
- [ ] Community organizer intros completed

---

## Contingency Plans

| Scenario | Response |
|----------|----------|
| **Server overload** | Rate limit new signups; show waitlist; fix and resume |
| **Negative influencer post** | No public response; internal post-mortem; improve product |
| **App Store rejection** | Appeal with positioning language; remove any flagged content |
| **Moderation backlog** | Pause invites; add temp moderators; prioritize safety reports |
| **CPI > $6** | Pause paid; focus on organic and referral |

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | March 2026 | Initial launch plan; expanded from GPT marketing framework; aligned with E2E audit and production readiness |

---

## Related Documents

- [SOFT_LAUNCH_WEB_PLAN.md](./SOFT_LAUNCH_WEB_PLAN.md) — Web-first soft launch
- [E2E_CAPABILITY_AUDIT_REPORT.md](./E2E_CAPABILITY_AUDIT_REPORT.md) — What exists today
- [PRODUCTION_READINESS_GRADE_REPORT.md](./PRODUCTION_READINESS_GRADE_REPORT.md) — Technical grades
- [CONSOLIDATED_CTO_REVIEW.md](./CONSOLIDATED_CTO_REVIEW.md) — P0/P1 gates
- [GET_ONLINE.md](./GET_ONLINE.md) — Deployment steps
