# Shhh — Continuous Improvement: Toward an Addictive, Magnetic Product

> **Purpose:** Strategic improvement plan based on user + corporate review. Focus: sequence, perception, loops, density — not structural rebuilds.  
> **Principle:** The machine is built. Now: how do humans behave inside it?  
> **Audience:** Swingers and hookup culture, inviting for singles. Styled for the lifestyle. See §9 for full context.  
> **Last updated:** March 2026

---

## 1. Improvement Philosophy

**Key insight:** Almost none of the weaknesses are structural. They are about sequence, perception, loops, and **density**. Structural flaws require rebuilding. Perception and loops can be improved iteratively.

**Four dimensions:**
- **Sequence** — When things happen (value before effort)
- **Perception** — What users see and feel (trust, polish)
- **Loops** — Behaviors that repeat (discovery → interaction → return)
- **Density** — Evidence of life. Social apps live or die on density. Not features. Not polish. Users must feel: *"people like me are active here right now."* Many improvements exist purely to increase perceived density.

**Stage:** Early products are engineering-driven. Mature products are behavior-driven. Shhh is transitioning. The moment real communities use the system, surprising behaviors appear. Those behaviors become clues for the next round of improvements.

---

## 2. UX / Product Invariants

> **For contributors:** These behaviors must be true everywhere. They prevent drift. Cursor, future devs, and tired-you-at-1:30am all need invariants or entropy wins.

| Invariant | Description |
|-----------|--------------|
| **Immediate feedback** | Every user action gets immediate feedback within 100ms |
| **No destructive action without confirmation** | No block, delete, dissolve, or irreversible action without confirmation or undo path |
| **Async states** | Every async action has loading, success, and failure states |
| **Network failure guidance** | Every network failure has human-readable retry guidance |
| **Privacy state visible** | Privacy state (blur, reveal, visibility tier) is always visible when relevant |
| **Single unread truth** | Unread counts must reconcile to a single backend truth |
| **Empty states teach** | Empty states must teach the next best action |
| **Premium gate explains benefit** | Every premium gate explains the benefit, not just the restriction |

---

## 3. Critical Perception Gaps

> **Reality anchor:** The 5 things that currently make the product feel less premium than it is.

1. **Too much setup before value** — Users must complete forms before seeing discovery
2. **Privacy power exists but is not visible** — Blur, reveal, visibility tiers exist; users don't see them
3. **Density is under-signaled** — No "12 nearby", "5 attending"; feels empty even when it isn't
4. **Messaging reliability is under-communicated** — Retry, sync, unread reconciliation not surfaced
5. **Premium tier benefits are psychologically muddy** — "What do I get?" unclear at upgrade prompts

---

## 4. First-Time Experience (C+ → B+/A-)

### Problem
Friction before value. Humans are sensitive to effort vs reward in the first minute.

### Principle: Tutorial Paradox
The best tutorial is invisible. If someone sees something interesting immediately, they tolerate setup.

### Target Sequence
```
1. Open app
2. See activity nearby
3. Curiosity triggered
4. THEN complete profile
```

### Improvement Pattern
**Delay complexity.** Show discovery → then profile → then verification → then privacy tools.

| Action | Status |
|--------|--------|
| Discovery-first entry (minimal auth to see feed) | Done (Browse first) |
| Defer full profile until first meaningful interaction | Done (Wave 1: prompt on like/message/whisper) |
| Defer verification until user hits tier gate | Partial |
| Progressive disclosure for privacy tools | Partial (Edit Profile) |

### Tactical Items
- [x] Allow "browse-only" mode: see blurred discovery with minimal signup (phone or email) — Browse first in onboarding-intent
- [x] **Browse-only must show activity indicators** — not empty tiles. GET /v1/discover/activity; "X people nearby • X events tonight" bar on Discover (Wave 1)
- [x] Prompt profile completion only when user attempts like/message/whisper (Wave 1: requireProfileComplete gate)
- [ ] Move verification prompts to moment of need (e.g. "Verify to message")
- [ ] Onboarding: show discovery preview before any form

### Browse-Only Constraints (Anti-Abuse)
Browse-first cannot become creep-first. Define explicitly:
- [ ] **Can see:** Blurred discovery tiles, activity counts, event list (no attendee IDs)
- [ ] **Cannot do:** Like, message, whisper, view full profile, view unblurred photos
- [ ] **Forced to complete profile when:** User attempts like, message, whisper, or RSVP
- [ ] **Anti-abuse:** Rate limit browse-only sessions; require phone/email to browse; block screenshot abuse where possible
- [ ] **Rollout:** `feature.browse_only_v1`

### Lifestyle-Specific First-Time
- [ ] Intent picker (Social / Curious / Lifestyle / Couple) — exists; ensure it feels welcoming, not gatekeeping. "Curious" and "Lifestyle" should both feel valid.
- [ ] First discovery feed filtered by intent; show "people like you" (same primary_intent or compatible)
- [ ] No judgment language; "exploring" not "just looking"

---

## 5. Core Flows (B- → A-)

### Problem
Flows work but mental model is confusing. Three overlapping concepts: proximity, visibility rules, ephemeral communication.

### Principle: Presence → Interaction → Gathering
The unifying concept is **presence**. People appear → people talk → people meet. Discovery, messaging, and events are not three features; they are stages of the same human behavior. Users should understand human behavior, not feature lists.

| Stage | Answers |
|-------|---------|
| **Presence** (Discovery) | "Who is around me right now?" |
| **Interaction** (Messaging) | "Who can I talk to?" |
| **Gathering** (Events) | "Where are people meeting?" |

### Improvement Pattern
**Visual metaphors.** Humans understand maps, circles, and movement better than menus.

| Action | Status |
|--------|--------|
| Unified map/circle metaphor for discovery + events | Partial (Map page exists) |
| Clear visual link: discovery tile → event → venue | Not started |
| Single "nearby" mental model across tabs | Not started |
| Reduce menu depth; surface by context | Not started |

### Tactical Items
- [ ] Discovery + Events share same spatial metaphor (map or radius rings)
- [ ] "Tonight" / "Nearby" as primary frame, not separate sections
- [ ] Inline event/venue context on discovery tiles when relevant
- [ ] One-tap path from "see someone" → "see where they're going"

### Lifestyle-Specific Flows
- [ ] Couple tile in discovery → tap → couple profile (both partners) → message/whisper
- [ ] Event tile → "5 attending" → RSVP → see attendees (privacy-safe) → message
- [ ] Venue → "Who's here tonight" → grid or list → tap to connect

---

## 6. Trust & Safety (B → A)

### Problem
Safety exists technically, but users don't see it. Trust systems must be visible.

### Principle: Expose the Machinery
People trust systems when they see signals: verified badges, block confirmation, report outcomes, moderation responses.

| Action | Status |
|--------|--------|
| Verified badges prominent on profiles | Partial |
| Block confirmation with clear feedback | Done (Wave 2) |
| Report outcome feedback ("We've reviewed your report") | Partial (Wave 2: 24h message) |
| Moderation response visibility | Not started |
| Safety score or trust indicator (where appropriate) | Partial (Trust Score backend) |

### Tactical Items
- [x] After block: "You won't see each other. They can't contact you." (Wave 2)
- [x] After report: "Thanks. We'll review within 24h." (Wave 2; follow-up when resolved not yet)
- [x] Verified badge on every discovery tile and profile (already present)
- [ ] Optional "community guidelines" reminder on first report
- [ ] Trust badge / score visible to user on own profile (builds confidence)

### System Transparency Signals
People trust systems that appear actively governed. Add subtle trust signals:
- [ ] "Last active 2 minutes ago" (presence)
- [ ] "Verified today" (fresh verification)
- [ ] "Reported users removed this week" (moderation outcome summary)

### Lifestyle-Specific Trust
For swingers/hookups, verification and references matter more. Ensure:
- [ ] Verified badge on every discovery tile and profile (not just detail view)
- [ ] Experience level (newbie, experienced, veteran) visible where appropriate
- [ ] Host badge for users who host events
- [ ] Reference system surfaced (backend exists; UX may need polish)

---

## 7. Polish (B → A)

### Problem
Premium products are defined by consistency, not individual screens.

### Principle: Interaction Grammar
Every animation, modal, transition, button feedback must follow the same rhythm. Humans detect pattern harmony. When everything moves the same way, the product feels expensive.

### Motion Hierarchy
Not all animations should be equal. Different actions have different motion weight. This creates a feeling of physical depth.

| Weight | Actions | Duration |
|--------|---------|----------|
| Small | Button press, like, chip tap | 120–180ms |
| Medium | Modal open, toast, sheet | 250ms |
| Large | Screen change, major transition | 350–400ms |

| Action | Status |
|--------|--------|
| Animation timing constants (modal, fade, nav) | Partial |
| Consistent modal animation (slide vs fade) | Partial |
| Button feedback (press, loading, success) | Partial |
| Skeleton/loading states consistent | Partial |
| Error state treatment consistent | Partial |

### Tactical Items
- [ ] Audit all modals: single animation type (e.g. slide from bottom)
- [ ] Audit all buttons: same press feedback, same loading state
- [ ] Apply motion hierarchy: small (120–180ms), medium (250ms), large (350–400ms)
- [ ] Create interaction grammar doc (timing, easing, states)
- [ ] Apply grammar to Me sub-pages and remaining screens

---

## 8. Product Narrative (Unclear → Strong Hypothesis)

### Problem
Reviewer unsure how to categorize the product. Narrative problem.

### Compressed Story
**"Real-world lifestyle discovery."** Not dating. Not chat. Not events. Discovery of people and venues in the same lifestyle sphere. Target audience: swingers and hookup culture, inviting for singles wanting casual play (see §9).

### Two-Layer Narrative
- **External** (what users say): "See who's nearby in the lifestyle community."
- **Internal** (what the system is): *Presence-driven social discovery.* Never force users to understand the internal concept.

| Action | Status |
|--------|--------|
| Landing/marketing copy reflects "lifestyle discovery" | Unknown |
| In-app copy (onboarding, empty states) aligned | Partial |
| App store description aligned | Unknown |
| Internal docs and pitch deck aligned | Partial |

### Tactical Items
- [ ] One-line pitch: "See who's nearby and open right now — real-world lifestyle discovery."
- [ ] All empty states, onboarding, and error copy use consistent language
- [ ] Avoid "dating" or "chat" as primary frame; lead with "discovery" and "nearby"

---

## 9. Lifestyle Audience & Product Focus

> **For contributors:** This section defines the target audience and product wedge. All improvements should be evaluated against whether they serve this audience and reinforce the wedge.

### Product Vision
Shhh aims to **replace the functions this audience currently patches together across Tinder, Grindr, FetLife, Snapchat, and event groups** — for **swingers and hookup culture**, inviting for **singles wanting casual play**, but **styled for the lifestyle**. Not a generic dating app with a lifestyle label; built for this audience from the ground up. (We are not replacing all four apps broadly; we are serving a specific slice.)

| Competitor | What we replace for this audience |
|------------|----------------------------------|
| **Tinder** | Swipe discovery, match, chat |
| **Grindr** | Real-time proximity, "who's nearby" |
| **FetLife** | Lifestyle identity, events, community |
| **Snapchat** | Ephemeral, stories, streaks |

### Target Audience
- **Primary:** Couples and singles in the lifestyle (swingers, open relationships, poly, ENM)
- **Secondary:** Singles wanting casual play, curious, not yet "in the scene"
- **Tone:** Direct, playful, non-judgmental. Discretion-first. Never corporate or "dating app" language.

### What "Styled for the Lifestyle" Implies

**Discretion**
- Blur is default; reveal is permissioned. Users control who sees what and for how long.
- Privacy cues visible: "Only visible to matches", "Visible after reveal", "Anonymous mode active"
- Location fuzzing, optional precise mode, panic wipe, shake-to-alert

**Couples as first-class**
- Couples can link; both show as a unit in discovery when relevant
- Shared messaging (or clear path from "couple" to "both in conversation")
- Event filters: couples_only, single_friendly, newbie_friendly

**Verification**
- Tier 1 (phone), Tier 2 (ID photo), Tier 3 (reference). Verified status prominent.
- Trust badges, experience level, host status — visible to reduce uncertainty

**Events as core**
- "Tonight", "This weekend", "Takeover at X" — not an afterthought
- Vibe tags: lifestyle, kink, couples_only, newbie_friendly, social_mix, talk_first
- Location revealed after RSVP for privacy-sensitive events

**Singles welcome**
- Explicit in positioning: "Couples and singles"
- Filters: singles_only, couples_only, single_friendly
- No second-class treatment; single users are part of the ecosystem

### Current Implementation Inventory

**What exists (backend + mobile)**

| Area | Status | Location / Notes |
|------|--------|-----------------|
| **Couple linking** | ✅ Done | `POST /v1/couples`, `POST /v1/couples/link` (invite code), dissolution with 7-day cooldown. Mobile: `app/couple/index.tsx` |
| **Personas** | ✅ Done | Types: solo, couple, anonymous, traveler. Couple persona has `linked_partner_id`. Slots gated by tier. `modules/users/persona.service.ts` |
| **Primary intent** | ✅ Done | social, curious, lifestyle, couple. Onboarding + discovery filter. `discovery.service.ts`, `onboarding-intent.tsx` |
| **Event vibe tags** | ✅ Done | lifestyle, kink, couples_only, newbie_friendly, social_mix, talk_first. `events.service.ts` |
| **Blur / reveal** | ✅ Done | `blur_photos`, `profile_visibility_tier` (all/after_reveal/after_match), photo reveals with TTL. `blur.service.ts`, `useCanSeeUnblurred` |
| **Whispers** | ✅ Done | Anonymous until reveal; reveal_policy. `whisper.service.ts` |
| **Album share** | ✅ API only | Share to userId, targetPersonaId, targetCoupleId. Mobile UI: `userId` only; persona/couple not wired |
| **Venue grid** | ✅ Done | `anonymous_mode` for check-ins; privacy-safe tiles. `GET /venue/:id/grid` |

**What's missing or partial**

| Gap | Priority | Notes |
|-----|----------|-------|
| **Joint couple in discovery** | P2 | Discovery returns individuals. No "Alex & Jamie" tile. IMPROVEMENTS_LEDGER GC-7.9 |
| **Album share UI** | P1 | Persona/couple targets not in mobile UI. `UX_UI_SPEC` §3.16 edge cases |
| **Date mode** | P2 | Couple invite couple. IMPROVEMENTS_LEDGER GC-7.3 |
| **Couple profile in messaging** | — | **Needs product decision doc.** See §9 Couple Messaging Decision |
| **Lifestyle-specific copy** | — | Onboarding, empty states, error messages — tone aligned for audience |

### Tactical Items (Lifestyle)

- [ ] **Joint couple in discovery** — See delivery contract below
- [ ] **Album share UI:** Add persona/couple as share targets in album share flow. `share_target_type`, `share_target_id` in API; mobile needs picker.
- [ ] **Date mode:** Couple-to-couple invite flow. Product spec needed.
- [x] **Discretion prominence** — Privacy cues (after_match, after_reveal) on discovery tiles; profile hero (Wave 2)
- [ ] **Singles welcome** in copy — See delivery contract below
- [ ] **Event types:** Ensure create-event supports: party, club night, takeover, hotel, private. Vibe tags match real lifestyle events.
- [ ] **Tone audit:** All user-facing copy — direct, playful, non-judgmental. No "dating" or corporate language.

### Delivery Contracts (Implementation-Ready Specs)

**Joint couple in discovery**
| Dimension | Spec |
|-----------|------|
| **Backend** | Discovery service emits `entityType: 'user' | 'couple'`; couple tile returns `coupleId`, `partnerPreview[]`, `sharedIntent`, `visibilityPolicy` |
| **Frontend** | Combined card layout with dual avatars and couple badge |
| **Analytics** | `discovery_tile_impression`, `discovery_tile_open`, `couple_tile_message_start` |
| **Rollout** | `feature.couple_discovery_v1` |
| **Success metric** | CTR discovery tile → profile; whisper rate; message-start rate |

**Discretion prominence** — Wave 2 partial
| Dimension | Spec |
|-----------|------|
| **Source of truth** | `user_profiles.blur_photos`, `profile_visibility_tier`; `GET /v1/photos/check/:userId` |
| **Frontend surfaces** | Discovery tile badge (after_match, after_reveal); profile hero badge ✓ |
| **Analytics** | `privacy_cue_view`, `blur_reveal_initiated` (not yet) |
| **Rollout** | `feature.discretion_prominence_v1` (not yet) |

**Singles welcome in copy**
| Dimension | Spec |
|-----------|------|
| **Surfaces** | Onboarding intent picker; discovery filter chips; empty states (Discover, Events) |
| **Copy** | "Couples and singles" or "Singles welcome" where relevant |
| **Analytics** | `intent_picker_selection`, `filter_usage` |
| **Rollout** | No flag; ship with copy pass |

### Competitive Landscape
- **Feeld, 3Fun, SDC, Kasidie** — existing lifestyle apps. Most are dated, clunky, or generic dating UX with a lifestyle label.
- **Shhh wedge:** Modern, lifestyle-native UX — discovery + events + ephemeral + discretion, built for this audience from the ground up.

### Wedge Strategy
- Don't beat Tinder/Grindr everywhere. Be **better for a specific slice**: people who want discovery + events + lifestyle in one place.
- Win one community first: one city, one event type, one scene. Density in one wedge before expansion.

### Couple Messaging Decision (Unresolved)
This is a contract boundary, not a small detail. Requires a specific decision doc:
- [ ] **Joint inbox vs mirrored inbox** — Do both partners see one shared thread or separate?
- [ ] **Who can reply** — Either partner? Both must approve?
- [ ] **Attribution** — Messages attributed per partner or per couple entity?
- [ ] **Dissolution** — What happens to conversations when couple dissolves?
- [ ] **Read receipts** — Per partner or per couple?
- [ ] **Blocks** — Block couple entity or individual?

---

## 10. Technical Hygiene (B+ → A)

### Problem
Edge risks under load, not missing features.

### Principle: Reinforcing Beams
Cross-store consistency and centralized entitlements don't change the product but make the system safer.

### Canonical Data Authority
Postgres is the canonical ledger. MongoDB and Redis are projections or cache. This prevents subtle drift. Every write that must be durable goes to Postgres first; other stores derive from it.

| Action | Status |
|--------|--------|
| Outbox pattern (Postgres/Mongo/Redis consistency) | Not started |
| Centralized entitlements engine | Not started |
| Discovery engine split (eligibility, ranking, cap) | Not started |

### Tactical Items
- [ ] Enforce canonical authority: Postgres = ledger; Mongo/Redis = projection/cache
- [ ] Outbox pattern for message delivery and conversation state
- [ ] Single "can user do X?" authority (entitlements service)
- [ ] Discovery: separate eligibility, ranking, and cap contracts

---

## 11. Operational Readiness (B → A-)

### Problem
Tools exist but lack operational playbooks. Engineers need to know exactly what to do when something breaks.

### Principle: Runbooks
Large systems survive because of playbooks, not features.

| Runbook | Status |
|---------|--------|
| Database outage | Not started |
| Redis full / eviction | Not started |
| Twilio failure / fallback | Not started |
| Message queue backlog | Not started |
| Payment webhook failure | Not started |
| Supabase storage failure | Not started |

### Tactical Items
- [ ] Add runbooks to OPS_GUIDE or docs/runbooks/
- [ ] Each runbook: symptom, diagnosis, remediation, escalation
- [ ] Link runbooks to alert rules (Prometheus/Alertmanager)

### Failure Simulation
Occasionally break the system on purpose. Drills:
- [ ] Disable Redis (verify fallback behavior)
- [ ] Simulate Twilio failure (verify graceful degradation)
- [ ] Drop database connection pool (verify recovery)
Teams learn real operational reflexes. Airlines do this; serious engineering teams do too.

---

## 12. Monetization (C+ → B+/A-)

### Problem
Payment infrastructure exists; upgrade psychology is unclear. People pay for: **status**, **access**, **power**, **certainty**.

### Principle: Map Features to Psychology
Premium features must map clearly to one of these. Certainty is especially powerful in social apps — users pay to reduce uncertainty.

| Category | Example |
|----------|---------|
| Status | Verified badge, premium label |
| Access | Better discovery visibility, event priority |
| Power | Advanced privacy controls, reveal controls |
| Certainty | "See who liked you", "See who viewed your profile", "Priority discovery" |

### Tactical Items
- [ ] Audit current premium features: which category does each serve?
- [ ] Ensure at least one strong hook per category (including certainty)
- [ ] Certainty hooks: "See who liked you", "See who viewed your profile", "Priority discovery"
- [ ] Upgrade prompts at moment of friction (e.g. "Verify to message")
- [ ] Clear "what you get" for each tier on paywall

### Lifestyle-Specific Monetization
- [ ] Couple personas / extra slots — already gated by tier; ensure value is clear
- [ ] "See who liked you" — high value for lifestyle (reduces cold outreach). **Rollout:** `feature.see_who_liked_v1`
- [ ] Priority discovery — appear higher for couples/singles seeking couples
- [ ] Vault / album sharing — premium privacy; share with couple/persona targets

---

## 13. Admin Control (B → A)

### Problem
Some configuration requires code deploys. Admin should be a control center.

### Principle: Runtime Over Deploy-Time
Rate limits, visibility rules, moderation thresholds, feature toggles → runtime controls.

| Action | Status |
|--------|--------|
| Feature flags in DB | Not started |
| Rate limits configurable via admin | Not started |
| Moderation thresholds configurable | Not started |
| Content rules (e.g. blocklist) in admin | Not started |

### Tactical Items
- [ ] Admin Control panel (see IMPROVEMENTS_LEDGER B.5)
- [ ] Feature flags table + admin UI
- [ ] Rate limit config in DB, admin editable
- [ ] Moderation confidence thresholds configurable

### Admin Audit Logs
Every admin change must record: **who** changed it, **what** changed, **when**. Otherwise admin control eventually becomes chaos.

---

## 14. Growth & Retention (C → B+/A)

### Problem
Features exist; loops are not fully designed. Social systems survive on loops, not features.

### Principle: Loops Over Features
```
user joins → discovers someone → interaction → curiosity → return visit
user attends event → sees activity → invites friend → network expands
```

### Loops Need Triggers
A loop is the behavior pattern. A **trigger** is what starts it. Example: Loop = user sees nearby → message → return. Trigger = push notification → curiosity → open app.

| Trigger Type | Example |
|--------------|---------|
| Nearby user alerts | "3 people nearby now" |
| Event reminders | "Event starts in 1 hour" |
| Whisper notifications | "Someone whispered to you" |
| Profile likes | "Someone liked your profile" |

### Density Signals
These signals change behavior dramatically. Users must feel "people like me are active here right now."

**Invariant: No fake density.** No inflated counts. No "someone nearby" if there isn't. No manipulative ghost activity. If this product loses trust on reality, it dies instantly.

- [ ] "12 people nearby" (discovery) — real count from discovery service
- [ ] "5 attending tonight" (events) — real RSVP count
- [ ] "3 people typing" (messaging) — real presence
- [ ] Live counts on tabs, tiles, and empty states
- [ ] **Rollout:** `feature.density_signals_v1`

### Target Loops
| Loop | Status |
|------|--------|
| Discovery → like/whisper → match → message → return | Partial |
| Event → RSVP → check-in → see attendees → invite friend | Partial |
| Venue → tonight feed → event → attend | Partial |
| Referral / invite flow | Not started |

### Tactical Items
- [ ] Design and implement invite/referral flow
- [ ] Post-event prompt: "Invite someone who'd love this"
- [ ] Retention cohorts in admin (D1, D7)
- [ ] Re-engagement triggers (see Trigger table above)
- [ ] Loop instrumentation: track where users drop in each loop
- [ ] **Trigger design** — See delivery contract below

### Trigger Design Delivery Contract
| Dimension | Spec |
|-----------|------|
| **Backend** | Push service; event reminder jobs; whisper notification path |
| **Triggers** | Nearby user alerts, event reminders, whisper notifications, profile likes |
| **Analytics** | `push_sent`, `push_open`, `trigger_to_action` (e.g. push → open → message) |
| **Rollout** | `feature.triggers_v1` (per trigger type) |
| **Success metric** | Push open rate; time from trigger to app open; conversion to message/RSVP |

---

## 15. Metric Tree

> **Without metrics, CI docs become elegant poetry.** For each improvement area, define what metric proves it worked.

| Area | Metrics |
|------|---------|
| **First-time experience** | Browse-to-signup conversion; signup-to-profile-complete conversion; time-to-first-interest; time-to-first-message |
| **Density** | Sessions/day; return within 24h; tile open rate; event RSVP rate; nearby refresh rate |
| **Trust** | Block action completion rate; report completion rate; profile verification completion; message acceptance/response rate |
| **Messaging** | Unread reconciliation accuracy; retry success rate; sync-on-foreground success |
| **Loops** | Discovery → like rate; like → message rate; event RSVP → check-in rate; referral conversion |
| **Premium** | Upgrade prompt → conversion; certainty feature usage; churn by tier |

---

## 16. Implementation Rhythm

### Sequencing Matrix (Ship Order)

| Wave | Goal | Must ship together | Must not start before | Status |
|------|------|--------------------|-----------------------|--------|
| **Wave 1** | First-session value | Browse-only, activity indicators, deferred profile gates | — | ✅ Done |
| **Wave 2** | Trust perception | Privacy cues, visible verification, report feedback | Wave 1 | ✅ Done |
| **Wave 3** | Messaging reliability | Unread reconciliation, retry UI, state sync | Wave 1 | ✅ Done |
| **Wave 4** | Density & triggers | Live counts, re-engagement pushes, event reminders | Analytics events | ✅ Done (March 2026) |
| **Wave 5** | Growth loops | Referral flow, post-event invites, venue amplification | Density signals stable | — |

Prevents random side-quests. "Cool idea syndrome" sneaks in otherwise.

### Continuous Improvement Sprints (Themes)
1. **Sequence sprints:** Reorder onboarding, defer profile/verification
2. **Perception sprints:** Trust visibility, interaction grammar, motion hierarchy
3. **Lifestyle sprints:** Joint couple in discovery, album share UI, discretion prominence, tone audit (see §9)
4. **Density sprints:** Activity indicators, live counts, "12 nearby", "5 attending tonight"
5. **Loop sprints:** Invite flow, retention instrumentation, trigger design
6. **Control sprints:** Admin runtime config, runbooks, audit logs

### Rollout Flags (Risky Improvements)
Every risky improvement must be behind a flag:

| Feature | Flag |
|---------|------|
| Browse-only mode | `feature.browse_only_v1` |
| Couple discovery tiles | `feature.couple_discovery_v1` |
| Density signals | `feature.density_signals_v1` |
| Triggers / push nudges | `feature.triggers_v1` (per trigger type) |
| Premium certainty features | `feature.see_who_liked_v1` |

### Success Metric
**Behavior-driven evolution.** When real communities use the system, observe:
- Where do users drop off?
- What do they do repeatedly?
- What do they ask for?
- What surprises us?

Use those clues for the next improvement cycle. Software that evolves with behavior becomes durable.

---

## 17. Cross-Reference

| Doc | Purpose |
|-----|---------|
| **IMPROVEMENTS_LEDGER** | Tactical feature list with feasibility/impact; GC-7.3, GC-7.9 for couple features |
| **ROADMAP** | Planned work by area |
| **CONTINUOUS_IMPROVEMENT** | Strategic principles, sequences, loops, lifestyle focus (this doc) |
| **UX_UI_SPEC** | Screen-level design; couple/index, album share edge cases |
| **ARCHITECTURE** | Technical structure; couples, personas, blur, discovery |
| **DEV_HANDOVER** | Deep technical reference; couples module, personas, presence, blur/reveal |

---

*"Right now Shhh looks less like a museum piece and more like a complex instrument waiting for musicians."*

**Review integration (March 2026):** GPT product review integrated — added density as fourth dimension, presence framing, motion hierarchy, canonical data authority, failure simulation, certainty psychology, admin audit logs, trigger design, and density signals.

**Lifestyle integration (March 2026):** Added §7 Lifestyle Audience & Product Focus — product vision (replace Tinder/Grindr/FetLife/Snapchat for swingers/hookup culture), implementation inventory (couples, personas, blur, events), gaps (joint couple in discovery, album share UI), tactical items, competitive landscape, wedge strategy. Expanded Trust & Safety with lifestyle-specific trust. Added lifestyle sprints to Implementation Rhythm.

**GPT execution pass (March 2026):** Added §2 UX/Product Invariants (immediate feedback, no destructive action without confirmation, async states, etc.). Added §3 Critical Perception Gaps (5 reality anchors). Added delivery contracts for Joint couple, Discretion prominence, Singles welcome, Trigger design (backend, frontend, analytics, rollout, success metric). Added §15 Metric Tree (metrics per improvement area). Added Sequencing Matrix (Wave 1–5 with must-ship-together and dependencies). Added Browse-only constraints (can see, cannot do, forced complete, anti-abuse). Added density invariant: no fake density. Added Couple Messaging Decision (unresolved; joint inbox, attribution, dissolution, etc.). Sharpened product vision: "replace the functions this audience patches together" not "replace all four apps broadly." Added Rollout Flags table for risky improvements.
