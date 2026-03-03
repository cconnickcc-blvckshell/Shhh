# Shhh — Launch Blitz Plan

**Purpose:** Combined launch and marketing plan for Shhh. Not "an app launch"—a **private social environment** inside a culturally volatile niche.  
**Source:** Expanded from GPT marketing framework; aligned with Shhh architecture, E2E audit, and production readiness.  
**Related:** [SOFT_LAUNCH_WEB_PLAN.md](./SOFT_LAUNCH_WEB_PLAN.md), [E2E_CAPABILITY_AUDIT_REPORT.md](./E2E_CAPABILITY_AUDIT_REPORT.md), [PRODUCTION_READINESS_GRADE_REPORT.md](./PRODUCTION_READINESS_GRADE_REPORT.md), [CONSOLIDATED_CTO_REVIEW.md](./CONSOLIDATED_CTO_REVIEW.md).

---

## Execution Rules (Non-Negotiable)

> **No phase may begin unless its acceptance checklist is fully satisfied.**  
> **All limits** (invites/day, rate limits, badge expiry, waitlist thresholds) **must be config-driven.**  
> **No explicit sexual language** in any public asset.  
> **No claims of anonymity.** Say "discretion by design," not "anonymous."  
> **All marketing messaging** must route through the approved copy sheet.

---

## Table of Contents

1. [Master Timeline](#master-timeline-week-by-week)
2. [Role & Responsibility Matrix](#role--responsibility-matrix)
3. [Strategic Objectives](#strategic-objectives-three-simultaneous-goals)
4. [First 60 Seconds Gate](#first-60-seconds-acceptance-criteria)
5. [CTO Gate](#cto-gate-backend-readiness-before-blitz)
6. [Phase 0 — Harden](#phase-0--harden-before-ignition-24-weeks-pre-launch)
7. [Phase 1 — Seed](#phase-1--controlled-seeding-week-2-to-1)
8. [Phase 2 — Detonation](#phase-2--the-weekend-detonation-48-hour-cluster)
9. [Phase 3 — Scarcity](#phase-3--controlled-scarcity-week-12-post-launch)
10. [Phase 4 — Viral Loop](#phase-4--viral-loop-engineering-week-3)
11. [Creative Kit](#creative-kit-required-deliverables)
12. [App Store & ASO](#app-store-readiness--aso)
13. [Lifecycle Messaging](#lifecycle-messaging)
14. [Paid Strategy](#paid-strategy-post-validation-only)
15. [Safety & Trust Controls](#safety--trust-controls)
16. [Club Activation Kit](#club-activation-kit)
17. [Influencer Budget](#influencer-budget-structure)
18. [Analytics Schema](#analytics-event-schema)
19. [Invite System Spec](#invite-system-spec)
20. [Moderation Playbook](#moderation-playbook-outline)
21. [Risk Matrix](#risk-assessment-matrix)
22. [Post-Launch Analysis](#post-launch-analysis-framework)
23. [KPIs](#key-performance-targets)
24. [Decision Gates](#decision-gates-gono-go-at-phase-boundaries)
25. [Positioning Safety](#critical-positioning-safety)
26. [Contingency](#contingency-plans)
27. [Approved Copy Sheet](#approved-copy-sheet-reference)

---

## Master Timeline (Week-by-Week)

| Week | Phase | Focus | Key Milestones |
|------|-------|-------|-----------------|
| **-4** | 0 | Harden | Cloud DBs live; load test passed; observability on |
| **-3** | 0 | Harden | Onboarding locked; invite system shipped; analytics wired |
| **-2** | 0 → 1 | Harden + Seed | Brand language final; Founding Circle outreach begins |
| **-1** | 1 | Seed | 1,000–2,000 users; influencer contracts signed; club event confirmed |
| **0** | 2 | Detonation | Launch weekend; club event + influencer cluster + community codes |
| **+1** | 3 | Scarcity | Limited invites live; Founder badge countdown; waitlist visible |
| **+2** | 3 | Scarcity | Invite limits peak; "Last chance" messaging |
| **+3** | 4 | Viral | Referral perks live; badge tiers; organic growth focus |
| **+4+** | 4 | Viral | Scale paid only if D7 > 25%, CPI < $4 |

---

## Role & Responsibility Matrix

| Area | Owner | Support | Approver |
|------|-------|---------|----------|
| **Backend readiness** | CTO / Eng Lead | DevOps | CTO |
| **Onboarding + value clarity** | Product | Design, Eng | Product |
| **Invite/referral system** | Eng | Product | CTO |
| **Analytics + dashboards** | Eng | Product | Product |
| **Moderation playbook** | Ops / Community | Legal | COO |
| **Brand language** | Marketing / Founder | Legal | Founder |
| **Community outreach** | Marketing / Founder | — | Founder |
| **Influencer deals** | Marketing | Legal | Founder |
| **Club event** | Marketing / Ops | Eng (QR, tech) | Founder |
| **Launch weekend ops** | Ops | Eng (on-call) | COO |

---

## Strategic Objectives (Three Simultaneous Goals)

| Objective | What it means |
|-----------|---------------|
| **1. Signal dominance** | First-mover in a niche that rewards discretion. Be the *obvious* choice for people who want proximity + privacy. |
| **2. Cultural framing** | Never "hookup swinger app." Always "private social layer for real-world connection." Protects App Store, Stripe, ad accounts, valuation. |
| **3. Controlled retention** | Not installs. Day 1, Day 7, invite conversion. Blitz amplifies weaknesses; product must hold. |

---

## First 60 Seconds Acceptance Criteria

**Everything depends on the first-use moment.** This is a hard gate before Phase 1.

| Criterion | Spec | Pass/Fail |
|-----------|------|-----------|
| **Value clarity** | User lands → understands what Shhh is in 1 sentence | |
| **Signup speed** | Completes signup in < 60s median | |
| **Immediate payoff** | Sees something compelling immediately (nearby "pulse," curated grid, or invite room) | |
| **First action** | Sends first action (follow, react, message, or join) within 2 minutes | |

**This is how a "million-dollar app" feels:** no confusion, no friction, instant momentum.

---

## CTO Gate: Backend Readiness Before Blitz

> **Blitz marketing amplifies weaknesses instantly. If product isn't stable, blitz becomes public failure.**

### Minimum Viable Stability (Must Pass Before Phase 1)

| Capability | Target | Current State | Action |
|------------|--------|---------------|--------|
| **Concurrent users** | 1,000+ | k6 tests exist; no prod load test | Run load test at 2x target before Phase 1 |
| **Auth bursts** | 100+ req/min during launch window | Rate limiter exists; must be deterministic (see §Auth Rate Limits) | Per-IP, per-device, per-phone limits; launch-week config tuning |
| **Real-time spikes** | WebSocket joins, presence updates | Socket.io; Redis presence | Load-test WebSocket join storm |
| **Moderation load** | Reports, blocks, panic | Admin dashboard; manual review | Ensure 1–2 humans on standby during Phase 2 |
| **Database** | Postgres + Redis + Mongo under load | Supabase/Upstash/Atlas target stack | Migrate to cloud DBs before Phase 0; see [GET_ONLINE.md](./GET_ONLINE.md) |

### Observability Minimum

- Request metrics (rate, error, latency) — Prometheus RED or equivalent
- At least one SLO (e.g. p95 < 500ms for discovery)
- Alerting on error spike or latency degradation

**Verdict:** Do not enter Phase 1 until these pass. See [CONSOLIDATED_CTO_REVIEW.md](./CONSOLIDATED_CTO_REVIEW.md) §3.1 for P0 gates.

### Auth Rate Limits (Deterministic)

| Limit Type | Spec | Launch-Week Tuning |
|------------|------|---------------------|
| **Per-IP** | Auth attempts per 15 min | Config flag to bump (e.g. 50 → 100) |
| **Per-device** | Same device, multiple accounts | Throttle after N attempts |
| **Per-phone** | OTP send + verify per number | Separate from login submit |
| **OTP resend** | Distinct limit from initial send | e.g. 3 resends per 15 min |
| **Login submit** | Distinct from OTP | e.g. 10 attempts per 15 min |

**No vague "100/15min global."** Each limit must be explicit, config-driven, and tunable for launch weekend.

### Load Test Script (Outline)

| Test | Duration | Target | Pass Criteria |
|------|----------|--------|---------------|
| Ramp to 1,000 concurrent | 10 min ramp, 5 min hold | 1,000 users | p95 latency < 500ms; error rate < 0.1% |
| Auth burst | 2 min | 100 req/min | No 429; p95 < 2s |
| WebSocket join storm | 1 min | 500 joins | All join within 5s; no disconnects |
| Discovery spike | 5 min | 500 req/min | Cache hit; p95 < 200ms |

### Observability Checklist

- [ ] HTTP request rate, error rate, p50/p95/p99 latency (by route or route group)
- [ ] WebSocket connection count, join/leave rate
- [ ] Redis hit rate, connection pool usage
- [ ] PostgreSQL connection count, slow query log
- [ ] SLO: `GET /v1/discover` p95 < 500ms
- [ ] Alert: error rate > 1% for 5 min
- [ ] Alert: p95 latency > 2s for 2 min
- [ ] Dashboard: real-time installs, auth success/fail, active users

---

## Phase 0 — Harden Before Ignition (2–4 Weeks Pre-Launch)

**Goal:** Lock product stability and brand language. No launch into instability.

### 0.1 Product Hardening Checklist

| Item | Owner | Sub-Tasks | Done |
|------|-------|-----------|------|
| **Pixel-perfect onboarding** | Product/Eng | No layout shift; no tap dead zones; keyboard avoids content; loading states on every async step; error states with retry | |
| **60-second value clarity** | Product | First screen (or Entry Shell) answers: "What is this?" "Why should I care?" "What do I do next?" in < 60s; no jargon. See §First 60 Seconds. | |
| **Invite/referral system** | Eng | Codes (unique, revocable); tracking (who invited whom); limit per user; redemption flow; analytics event `invite_sent`, `invite_redeemed` | |
| **Analytics** | Eng | Events: `screen_view`, `signup_start`, `signup_complete`, `onboarding_complete`, `invite_sent`, `invite_redeemed`; CPI, D1, D7 in dashboard | |
| **Moderation flows** | Ops | Admin queue; severity tiers; 24–48h SLA; escalation path; response templates (see §Moderation Playbook) | |
| **Stress test** | Eng | 5–10x projected load; all tests pass; no memory leak over 30 min | |
| **Cloud DBs** | Eng | Supabase, Upstash, Atlas live; migrations run; connection strings in prod env | |
| **Observability** | Eng | Metrics, SLO, alerting; dashboard for launch weekend | |

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

### 0.4 Phase 0 Week-by-Week

| Week | Focus | Deliverables |
|------|-------|--------------|
| **-4** | Infra + stability | Cloud DBs live; load test passed; observability deployed; P0 gates (OTP, secrets, CORS) verified |
| **-3** | Product + analytics | Onboarding locked; invite system shipped; analytics events wired; moderation playbook v1; First 60 Seconds spec pass |
| **-2** | Polish + brand | Value clarity < 60s; brand language final; Creative Kit delivered; stress test at 10x; sign-off from CTO, Product, Ops, Legal |

### 0.5 Launch Readiness Sign-Off

- [ ] CTO: Backend passes load test; observability live; auth rate limits deterministic
- [ ] Product: Onboarding flow approved; First 60 Seconds criteria pass
- [ ] Ops: Moderation playbook; 24–48h response SLA for reports
- [ ] Legal: Positioning language approved; no policy–system mismatch
- [ ] Marketing: Creative Kit delivered; approved copy sheet in use

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

### 1.5 Community Outreach Playbook

**Target community criteria:**
- Private, vetted membership (not public forums)
- Organizer has direct relationship with members
- Size: 200–1,000 members (too small = no impact; too large = hard to control)
- Values alignment: discretion, consent, safety

**Outreach sequence:**
1. Warm intro to organizer (via mutual contact if possible)
2. 15-min call: explain Shhh, Founding Circle concept, no public promotion
3. Offer: X codes for organizer to distribute; Founder badge for early joiners
4. Ask: "Who else in your network runs similar communities?" (expand)
5. Follow-up: codes delivered within 48h; check-in at Day 3 and Day 7

**Red flags:** Organizer wants payment; wants public mention; has history of drama or controversy.

### 1.6 Influencer Vetting & Outreach

**Vetting criteria:**
- Audience: sex-positive, lifestyle, relationship content (not explicit)
- Engagement rate > 3%; authentic comments (not bot-heavy)
- No recent brand controversies or App Store rejections
- Willing to use soft framing ("discovery" not "ad")

**Outreach template (adapt):**
> "We're launching a private social app for people who value discretion and real-world connection. We're looking for a few creators to get early access before we go wider. No scripted content—just your honest take. We'd love to send you a code and a brief. Interested in a 15-min call?"

**Contract points (non-exclusive):**
- Post timing window (e.g. within 48h of launch)
- No explicit language or imagery
- Disclosure (e.g. "early access" or "partner" per platform rules)
- Ownership of content; right to request removal if policy violation
- Payment: 50% on signing, 50% on post delivery

### 1.7 Club Partner Criteria

- Established venue (1+ year); known in the community
- Willing to host branded-but-subtle activation (no signage that screams "app")
- Staff can assist with onboarding (QR, download, first use)
- Exclusive or semi-exclusive for launch weekend (no competing events)

### 1.8 Organizer Thank-You Boundary

**Document the boundary. Keep it clean and defensible.**

| Allowed | Not Allowed |
|---------|-------------|
| Gift (e.g. premium bottle, branded merch, dinner) | Cash-for-access |
| Thank-you note; recognition in private | "Pay to promote to members" |
| Early access codes for organizer's community | Payment for distribution of codes |
| Founding Circle badge for organizer | Any quid-pro-quo that implies paid promotion |

**Principle:** Organizers get early access and status because they add value; not because they pay or are paid.

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

### 2.3 Club Event Run-of-Show (Template)

| Time | Activity | Owner |
|------|----------|-------|
| **T-2h** | Ambassadors arrive; QR stations set; tablets charged; test download flow | Ops |
| **T-1h** | Venue doors open; first guests; ambassadors greet, no hard sell | Ops |
| **T-0** | Peak arrival; QR codes at bar, entrance, lounge; "Early access" badge unlock for attendees | Ops |
| **T+1h** | Check download count; troubleshoot any issues; circulate for feedback | Ops + Eng |
| **T+2h** | Wind down; collect feedback; thank venue staff | Ops |
| **T+24h** | Post-event report: installs, signups, qualitative feedback | Ops |

**Tech checklist:** QR codes link to App Store / web PWA; fallback: manual code entry if QR fails; tablets for on-the-spot signup if phone issues.

### 2.4 Club Activation Kit

**Prevents chaos. Pack before event.**

| Item | Spec |
|------|------|
| **QR fallbacks** | Short code entry (e.g. SHHH-XXXX) + typed URL (shhh.app/join/XXXX) if QR fails |
| **Ambassador script** | 30-second, non-cringe: "Shhh is a private way to connect with people nearby. Scan for early access. I can walk you through it." No hard sell. |
| **Badge unlock verification** | Flow to confirm attendee got Founder/early-access badge; troubleshoot if not |
| **Offline backup** | Printed cards with codes (minimal, premium design); hand out if tech fails |
| **Privacy signage** | "No photos unless opt-in" + wristband system (e.g. green = OK to photograph; default = no) |

**Pack list:** QR stands, tablets (charged), printed cards, wristbands, ambassador script cards.

### 2.5 Influencer Post Schedule (48h Cluster)

| Slot | Creator | Platform | Format | Notes |
|------|----------|----------|--------|-------|
| Fri 6pm | Creator 1 | IG Story + Reel | "Something I've been testing…" | Teaser |
| Fri 10pm | Creator 2 | TikTok | Discovery-style; no explicit | Peak evening |
| Sat 10am | Creator 3 | IG | Carousel or Reel | Morning scroll |
| Sat 2pm | Creator 4 | TikTok | Same framing | Afternoon |
| Sat 6pm | Creator 5 | IG + Story | "Finally can share…" | Evening |
| Sat 10pm | Creator 6 (upper-mid) | Multi | Main drop | Amplify earlier posts |

**Stagger = extended algorithmic visibility.** Same weekend = clustering; different times = sustained spike.

### 2.6 Weekend Ops Playbook

**On-call roster:**
- 1 engineer (backend, DB, deploy)
- 1 ops (moderation, user issues, club event support)

**Shift coverage:** 2x 12h shifts (e.g. 8am–8pm, 8pm–8am) for moderation; engineer on-call 24h.

**Escalation:**
- Error rate > 2%: Engineer investigates; consider rate limit or feature flag
- Moderation backlog > 50: Ops lead adds temp moderator; prioritize safety reports
- Negative viral post: No public response; internal comms; post-mortem within 48h

**Monitoring:** Dashboard on big screen (TV or projector) with: installs, auth success/fail, active users, error rate, p95 latency. Refresh every 5 min during peak.

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

### 3.3 Scarcity Logic (Implementation)

| Mechanic | Spec | Example |
|----------|------|---------|
| **Daily invite limit** | N invites per user per day; reset at local midnight (or fixed timezone e.g. America/Toronto for launch) | N = 3 for first week; 5 for week 2. Store rule in config. |
| **Visible count** | "Invite Remaining: X" in UI; updates when invite sent | Creates urgency |
| **Founder badge sunset** | Badge visible until date X; after X, badge hidden; "Last chance" banner 3 days before | X = 14 days post-launch |
| **Waitlist** | If invite limit reached or codes exhausted, show queue; "X people ahead of you" | Queue position = signup order; no fake numbers |

### 3.4 A/B Test Ideas (Optional)

- Invite limit: 3 vs 5 per day (impact on conversion vs scarcity feel)
- Founder badge sunset: 7 vs 14 days (urgency vs inclusivity)
- Waitlist copy: "Join the waitlist" vs "You're in line—we'll notify you"

### 3.5 Guardrails

- Do not over-restrict; 2-week window is enough
- After Week 2, ease invite limits gradually (e.g. 5 → 10 per day)
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

### 4.3 Referral Mechanics (Spec)

| Element | Spec |
|---------|------|
| **Invite flow** | User taps "Invite"; selects contact or copies link; link includes `?ref=userId` or code |
| **Redemption** | New user signs up via link/code; `invite_redeemed` event; inviter gets credit |
| **Perk tiers** | 1 referral = extra invite; 3 referrals = badge upgrade; 5 = early access to feature |
| **Tracking** | `invite_sent`, `invite_redeemed`, `referrer_id`, `referred_at` |

### 4.4 Viral Loop Math

**K-factor = invites per user × conversion rate.**

- If each user sends 2 invites and 30% convert: K = 0.6 (sub-viral but compounding)
- If each user sends 3 invites and 40% convert: K = 1.2 (viral)
- Target: K > 0.5 for sustained organic growth without paid

**Optimization levers:** Increase invites per user (UX, perks), increase conversion (landing page, value prop).

### 4.5 When to Scale Paid

Only after:
- Day 7 retention stable (> 25%)
- CPI under $4
- No critical bugs in top 5 flows
- Moderation queue < 24h
- K-factor > 0.3 (organic baseline established)

---

## Creative Kit (Required Deliverables)

**Without this, creators improvise → poor conversion or platform scrutiny.**

| Asset | Spec |
|-------|------|
| **6–10 vertical videos** (7–12 sec) | 3 angles: (1) Mystery/discovery — "I wasn't sure I should show this…"; (2) Discretion/control — "proximity without exposure"; (3) Invite scarcity — "I only have 3 invites" |
| **12–18 story frames** | Templates with safe copy; no explicit terms |
| **8 stills** | Brand vibe, premium, not explicit |
| **3 landing page hero variations** | For A/B test |
| **Do/Don't language sheet** | For creators: no explicit terms, no implied sex acts, no "anonymous" promises; use approved copy sheet |

**All creative must route through approved copy sheet.** No improvisation on positioning.

---

## App Store Readiness & ASO

**App Store is a marketing channel—don't treat it like a formality.**

| Element | Spec |
|---------|------|
| **App name / subtitle** | Keywords that stay safe (no "hookup," "swingers," etc.); "Private social" / "Proximity" / "Discretion" |
| **Screenshot set** | Sells "private social" without sexual implication; premium, mysterious |
| **Preview video** | Clean, premium, mysterious; no explicit or suggestive content |
| **Privacy nutrition labels** | Aligned with reality (location, contacts, etc.); no over-claim |
| **Review-response templates** | Support optics; empathetic, consistent; escalate policy questions |

**ASO keywords:** Proximity, discretion, private, connection, nearby, real-world. Avoid adult-adjacent terms.

---

## Lifecycle Messaging

**Turn waitlist into a weapon. Without this, waitlist becomes a graveyard.**

| Sequence | Trigger | Content |
|----------|---------|---------|
| **Waitlist confirmation** | Day 0 | "You're on the list. We'll notify you when you're up." |
| **Waitlist nurture** | Day 2 | Soft value reminder; "What to expect when you're in" |
| **Waitlist nurture** | Day 5 | Scarcity hint; "Limited spots opening soon" |
| **"You're up"** | Invite window opens | "Your invite is ready. Expires in 24h." + CTA |
| **Re-engagement** | D2 post-signup | Nudge: "Who's nearby tonight?" |
| **Re-engagement** | D5 post-signup | "You have 3 invites left. Share with someone you trust." |
| **Event-mode** | Opt-in | "Tonight at [venue]. X people nearby." |

**Channels:** Email + SMS (opt-in). Keep copy consistent with approved sheet.

---

## Paid Strategy (Post-Validation Only)

**Design for paid now; run only after validation.**

| Element | Spec |
|---------|------|
| **Retargeting pool** | Site visitors, waitlist signups, engaged users (D1 retainers); pixel/ID setup |
| **Spark ads / whitelisting** | If you buy rights to influencer posts; run as ads with creator approval |
| **CPI guardrails** | Daily cap (e.g. $500/day max until validated); CPI target < $4 |
| **Kill-switch criteria** | CPI > $6 for 48h → pause; D1 < 35% → pause; moderation backlog > 50 → pause |

**Do not run paid until:** D7 > 25%, CPI < $4, K-factor > 0.3, no P0 bugs.

---

## Safety & Trust Controls

**Policy ↔ enforcement parity. Protects you and increases conversion (users trust the environment).**

| Control | Spec |
|---------|------|
| **Consent/harassment policy** | Surfaced in-product; 1-tap access from profile, chat, report flow |
| **Block + report** | 2 taps max from any screen where abuse can occur |
| **Device/IP throttles** | Throttle auth and signup from abusive IPs/devices; config-driven |
| **Ban evasion strategy** | Device fingerprinting-lite, phone verification on re-signup; flag suspicious patterns |
| **"No anonymity" rule** | Say "discretion by design," not "anonymous"; never promise anonymity you cannot guarantee |

**In-product copy:** "We take harassment seriously. Block and report in 2 taps. We review within 24h."

---

## Influencer Budget Structure

### Blitz Tier (Real Impact)

| Item | Cost |
|------|------|
| 5 mid-tier creators @ $6k | $30k |
| 1 upper mid-tier @ $20k | $20k |
| Club event (venue, staff, visuals) | $15k–$40k |
| **Total** | **$65k–$90k** |

##### Lean Tier (Under $20k)

| Item | Cost |
|------|------|
| 1–2 club events (venue, staff, minimal branding) | $5k–$12k |
| Community organizer thank-you (gift, not payment; see §Organizer Boundary) | $500–$1k |
| Organic seeding only; no paid influencer | $0 |
| **Total** | **$5.5k–$13k** |

- Hyper-local activation only
- 1–2 club events
- Organic seeding via communities
- No paid influencer; rely on Founding Circle word-of-mouth

**Reality:** Under $20k = slower ramp, but viable if product is strong and community is tight.

### Mid Tier ($20k–$50k)

| Item | Cost |
|------|------|
| 2–3 mid-tier creators @ $4k–$6k | $8k–$18k |
| 1 club event | $8k–$15k |
| Community codes + Founding Circle | $1k |
| **Total** | **$17k–$34k** |

---

## Analytics Event Schema

**Required events for launch:**

| Event | When | Properties |
|-------|------|------------|
| `screen_view` | Screen mount | screen_name |
| `signup_start` | User taps "Get Started" or equivalent | source (phone, apple, google, snap) |
| `signup_complete` | User completes registration | source, time_to_complete |
| `onboarding_complete` | User finishes onboarding | intent_selected |
| `invite_sent` | User sends invite | channel (link, copy, share) |
| `invite_redeemed` | New user signs up via invite | referrer_id |
| `discovery_view` | User views Discover grid | result_count |
| `first_message_sent` | User sends first message | conversation_id |

**Derived metrics:**
- CPI = paid spend / installs
- Day 1 retention = users active 24h after signup / total signups
- Day 7 retention = users active 7d after signup / total signups
- Invite conversion = invite_redeemed / invite_sent
- Funnel drop-off = signup_start → signup_complete → onboarding_complete (each step)

---

## Invite System Spec

**Technical requirements:**

| Requirement | Spec |
|-------------|------|
| **Code format** | Alphanumeric, 8–12 chars; no ambiguous chars (0/O, 1/l) |
| **Uniqueness** | One code per user or per batch; revocable |
| **Limit** | N per user per day; configurable |
| **Reset time** | Local midnight per user, or fixed timezone (e.g. America/Toronto for launch); config-driven. Not UTC if user base is regional. |
| **Redemption** | Code or link; link includes `?ref=code` or `?ref=userId` |
| **Tracking** | `invite_codes` table or equivalent: code, user_id, created_at, redeemed_at, redeemed_by |

**UX requirements:**

- Invite entry: optional on signup (e.g. "Have a code?"); or required for gated launch
- Invite send: share sheet (link, copy, message); or in-app invite flow
- Visible count: "Invite Remaining: X" in profile or dedicated invite screen

---

## Moderation Playbook Outline

**Severity tiers:**

| Tier | Examples | Response SLA |
|------|-----------|---------------|
| **P0** | CSAM, threats, imminent harm | Immediate; escalate to legal/law enforcement |
| **P1** | Harassment, non-consensual imagery, hate | < 4h |
| **P2** | Spam, impersonation, policy violation | < 24h |
| **P3** | Low-priority reports, edge cases | < 48h |

**Actions:** Warn, restrict, suspend, ban. Document in audit log.

**Response templates (internal):**
- Acknowledge: "We've received your report and will review within 24h."
- Action taken: "We've taken action on this report. Thank you for helping keep Shhh safe."
- No action: "After review, we didn't find a policy violation. If you have more info, please reply."

**Escalation:** P0 → Legal + law enforcement. P1 → Senior moderator. P2/P3 → Standard queue.

---

## Risk Assessment Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Server overload | Medium | High | Load test; rate limit; waitlist |
| Negative influencer post | Low | High | Vet carefully; no public response |
| App Store rejection | Medium | High | Positioning language; no explicit content |
| Moderation backlog | Medium | Medium | 2 shifts; temp moderators; prioritize P0/P1 |
| CPI > $6 | Medium | Medium | Pause paid; optimize or go organic |
| Community drama | Low | Medium | Private communities; organizer vetting |
| Data breach | Low | Critical | Security audit; encryption; access controls |
| Regulatory scrutiny | Low | High | Policy–system parity; legal review |

---

## Post-Launch Analysis Framework

**When:** Day 7–10 after launch weekend.

**Questions to answer:**

1. **Funnel:** Where do users drop off? (signup → onboarding → first discovery → first message)
2. **Retention:** What do D1 retainers do that D1 churners don't?
3. **Invite:** Who sends invites? Who converts? What's the K-factor?
4. **Technical:** Any errors or latency spikes? What caused them?
5. **Moderation:** Report volume; response time; repeat offenders?

**Decisions:** Scale paid? Fix onboarding? Double down on referral? Pause and iterate?

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

## Decision Gates (Go/No-Go at Phase Boundaries)

| Gate | Before | Criteria | Decision |
|------|--------|----------|----------|
| **0 → 1** | Phase 1 | Load test pass; observability live; sign-off from CTO, Product, Ops, Legal | No → extend Phase 0; Yes → begin seeding |
| **1 → 2** | Phase 2 | 1,000+ users; D1 > 40%; influencer contracts signed; club event confirmed | No → extend Phase 1 or reduce Phase 2 scope; Yes → detonate |
| **2 → 3** | Phase 3 | Launch weekend complete; no critical outages; moderation queue < 24h | No → pause; fix; Yes → scarcity |
| **3 → 4** | Phase 4 | Scarcity period complete; D7 > 25%; invite conversion > 30% | No → iterate on product; Yes → viral loop |
| **4 → Scale** | Paid scale | D7 stable; CPI < $4; K > 0.3; no P0 bugs | No → organic only; Yes → increase paid spend |

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
- [ ] First 60 Seconds acceptance criteria pass
- [ ] Founder badge implemented
- [ ] Invite codes + tracking (config-driven limits, reset timezone)
- [ ] Scarcity mechanics (limited invites, visible count)
- [ ] Safety controls: consent/harassment policy in-product; block+report 2 taps max

### Ops

- [ ] Moderation playbook documented
- [ ] 24–48h response SLA for reports
- [ ] On-call roster for launch weekend
- [ ] Club event staff trained

### Marketing

- [ ] Brand language finalized
- [ ] Creative Kit delivered (videos, story frames, stills, landing page variants, Do/Don't sheet)
- [ ] App Store assets ready (screenshots, preview video, ASO keywords)
- [ ] Influencer contracts/agreements
- [ ] Club partner confirmed
- [ ] Community organizer intros completed
- [ ] Lifecycle messaging sequences built (waitlist, re-engagement, event-mode)

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

## Approved Copy Sheet (Reference)

**All marketing and creator content must use approved language.** Maintain a separate doc (e.g. `COPY_SHEET.md` or Notion) with:

- **Do:** "Private social layer," "proximity without exposure," "discretion by design," "connect with people nearby—on your terms"
- **Don't:** Explicit sexual terms, "anonymous," "hookup," "swingers," implied sex acts, promises you cannot keep

Creators receive the Do/Don't sheet before contract. No improvisation.

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | March 2026 | Initial launch plan; expanded from GPT marketing framework |
| 1.1 | March 2026 | Expanded depth: master timeline, RACI, load test, observability, Phase 0–4 detail, analytics, invite spec, moderation, risk matrix, decision gates |
| 1.2 | March 2026 | GPT review: Execution rules, First 60 Seconds gate, auth rate limits (deterministic), Creative Kit, App Store & ASO, Lifecycle messaging, Paid strategy, Safety & Trust Controls, Club Activation Kit, Organizer boundary, invite reset timezone, approved copy sheet |

---

## Related Documents

- [SOFT_LAUNCH_WEB_PLAN.md](./SOFT_LAUNCH_WEB_PLAN.md) — Web-first soft launch
- [E2E_CAPABILITY_AUDIT_REPORT.md](./E2E_CAPABILITY_AUDIT_REPORT.md) — What exists today
- [PRODUCTION_READINESS_GRADE_REPORT.md](./PRODUCTION_READINESS_GRADE_REPORT.md) — Technical grades
- [CONSOLIDATED_CTO_REVIEW.md](./CONSOLIDATED_CTO_REVIEW.md) — P0/P1 gates
- [GET_ONLINE.md](./GET_ONLINE.md) — Deployment steps
