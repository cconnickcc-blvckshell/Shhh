# Shhh — Continuous Improvement: Toward an Addictive, Magnetic Product

> **Purpose:** Strategic improvement plan based on user + corporate review. Focus: sequence, perception, loops, density — not structural rebuilds.  
> **Principle:** The machine is built. Now: how do humans behave inside it?  
> **Audience:** Swingers and hookup culture, inviting for singles. Styled for the lifestyle. See §7 for full context.  
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

## 2. First-Time Experience (C+ → B+/A-)

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
| Discovery-first entry (minimal auth to see feed) | Not started |
| Defer full profile until first meaningful interaction | Not started |
| Defer verification until user hits tier gate | Partial |
| Progressive disclosure for privacy tools | Partial (Edit Profile) |

### Tactical Items
- [ ] Allow "browse-only" mode: see blurred discovery with minimal signup (phone or email)
- [ ] **Browse-only must show activity indicators** — not empty tiles. Signals like: "3 people nearby now", "2 events tonight", "Someone whispered 5m ago". Humans react strongly to evidence of life; these create curiosity.
- [ ] Prompt profile completion only when user attempts like/message
- [ ] Move verification prompts to moment of need (e.g. "Verify to message")
- [ ] Onboarding: show discovery preview before any form

### Lifestyle-Specific First-Time
- [ ] Intent picker (Social / Curious / Lifestyle / Couple) — exists; ensure it feels welcoming, not gatekeeping. "Curious" and "Lifestyle" should both feel valid.
- [ ] First discovery feed filtered by intent; show "people like you" (same primary_intent or compatible)
- [ ] No judgment language; "exploring" not "just looking"

---

## 3. Core Flows (B- → A-)

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

## 4. Trust & Safety (B → A)

### Problem
Safety exists technically, but users don't see it. Trust systems must be visible.

### Principle: Expose the Machinery
People trust systems when they see signals: verified badges, block confirmation, report outcomes, moderation responses.

| Action | Status |
|--------|--------|
| Verified badges prominent on profiles | Partial |
| Block confirmation with clear feedback | Partial |
| Report outcome feedback ("We've reviewed your report") | Not started |
| Moderation response visibility | Not started |
| Safety score or trust indicator (where appropriate) | Partial (Trust Score backend) |

### Tactical Items
- [ ] After block: "You won't see each other. They can't contact you."
- [ ] After report: "Thanks. We'll review within 24h." + follow-up when resolved
- [ ] Verified badge on every discovery tile and profile
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

## 5. Polish (B → A)

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

## 6. Product Narrative (Unclear → Strong Hypothesis)

### Problem
Reviewer unsure how to categorize the product. Narrative problem.

### Compressed Story
**"Real-world lifestyle discovery."** Not dating. Not chat. Not events. Discovery of people and venues in the same lifestyle sphere. Target audience: swingers and hookup culture, inviting for singles wanting casual play (see §7).

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

## 7. Lifestyle Audience & Product Focus

> **For contributors:** This section defines the target audience and product wedge. All improvements should be evaluated against whether they serve this audience and reinforce the wedge.

### Product Vision
Shhh aims to **replace Tinder, Grindr, FetLife, and Snapchat** for a specific audience: **swingers and hookup culture**, inviting for **singles wanting casual play**, but **styled for the lifestyle**. Not a generic dating app with a lifestyle label — built for this audience from the ground up.

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
| **Couple profile in messaging** | — | When messaging a couple, both see? Shared inbox? Needs product decision |
| **Lifestyle-specific copy** | — | Onboarding, empty states, error messages — tone aligned for audience |

### Tactical Items (Lifestyle)

- [ ] **Joint couple in discovery:** When both partners are linked, show a single tile "Alex & Jamie" with combined photos/bio. Discovery service returns couple entities; frontend renders couple tile.
- [ ] **Album share UI:** Add persona/couple as share targets in album share flow. `share_target_type`, `share_target_id` in API; mobile needs picker.
- [ ] **Date mode:** Couple-to-couple invite flow. Product spec needed.
- [ ] **Discretion prominence:** Ensure blur, reveal, and privacy cues are visible on discovery tiles, profile hero, and first-time flows. Not buried in settings.
- [ ] **Singles welcome** in copy: Onboarding, filters, and empty states explicitly say "Couples and singles" or equivalent.
- [ ] **Event types:** Ensure create-event supports: party, club night, takeover, hotel, private. Vibe tags match real lifestyle events.
- [ ] **Tone audit:** All user-facing copy — direct, playful, non-judgmental. No "dating" or corporate language.

### Competitive Landscape
- **Feeld, 3Fun, SDC, Kasidie** — existing lifestyle apps. Most are dated, clunky, or generic dating UX with a lifestyle label.
- **Shhh wedge:** Modern, lifestyle-native UX — discovery + events + ephemeral + discretion, built for this audience from the ground up.

### Wedge Strategy
- Don't beat Tinder/Grindr everywhere. Be **better for a specific slice**: people who want discovery + events + lifestyle in one place.
- Win one community first: one city, one event type, one scene. Density in one wedge before expansion.

---

## 8. Technical Hygiene (B+ → A)

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

## 9. Operational Readiness (B → A-)

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

## 10. Monetization (C+ → B+/A-)

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
- [ ] "See who liked you" — high value for lifestyle (reduces cold outreach)
- [ ] Priority discovery — appear higher for couples/singles seeking couples
- [ ] Vault / album sharing — premium privacy; share with couple/persona targets

---

## 11. Admin Control (B → A)

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

## 12. Growth & Retention (C → B+/A)

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
- [ ] "12 people nearby" (discovery)
- [ ] "5 attending tonight" (events)
- [ ] "3 people typing" (messaging)
- [ ] Live counts on tabs, tiles, and empty states

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
- [ ] **Trigger design:** Explicitly design what starts each loop (push, in-app cue, email)

---

## 13. Implementation Rhythm

### Continuous Improvement Sprints
1. **Sequence sprints:** Reorder onboarding, defer profile/verification
2. **Perception sprints:** Trust visibility, interaction grammar, motion hierarchy
3. **Lifestyle sprints:** Joint couple in discovery, album share UI, discretion prominence, tone audit (see §7)
4. **Density sprints:** Activity indicators, live counts, "12 nearby", "5 attending tonight"
5. **Loop sprints:** Invite flow, retention instrumentation, trigger design
6. **Control sprints:** Admin runtime config, runbooks, audit logs

### Success Metric
**Behavior-driven evolution.** When real communities use the system, observe:
- Where do users drop off?
- What do they do repeatedly?
- What do they ask for?
- What surprises us?

Use those clues for the next improvement cycle. Software that evolves with behavior becomes durable.

---

## 14. Cross-Reference

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
