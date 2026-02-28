# Shhh — Game-Changer Roadmap (Ideas Backlog)

> **Branch:** Same as enhancement work — `shh-enhancement-trial` (or a dedicated branch per initiative).  
> **Purpose:** Prioritized backlog of high-impact ideas from **docs/FEATURE_ADDITIONS_CRITIQUE.md** Part 2 (and optional new ideas) for product review and phased implementation.  
> **Last roadmap update:** 2026-02-26 (initial). Update when items are reprioritized or implemented.  
> **Source:** **docs/FEATURE_ADDITIONS_CRITIQUE.md** (Part 2: Game-Changer Ideas; Part 3: discovery cap, GPT review).  
> **Enhancement first:** Core phased work is in **docs/ENHANCEMENT_ROADMAP.md** (Phases 0–C). Use this doc once that baseline is solid.

---

## 🚨 GOLD STANDARD (SAME AS ENHANCEMENT ROADMAP)

**Work with the existing system. Do not duplicate. Follow what is already built.**

- **Read before you build.** Check `docs/ARCHITECTURE.md`, `docs/DEV_HANDOVER.md`, and the relevant backend files. Extend existing tables, routes, and services — do not add a second "discovery," "events," or "venues" stack.
- **Follow existing patterns.** Service → Controller → Routes; same middleware (`authenticate`, `validate(zod)`, `requireTier` / `requireFeature`); same DB access and error handling.
- **Additive only.** New migrations (e.g. `017_*.sql`), new columns or tables, new routes under `/v1/*`. Do not break existing API contracts.
- **Doc sync.** After implementing any game-changer: update **ARCHITECTURE.md** (§2, §4, §6), **DEV_HANDOVER.md**, **SYSTEM_REALITY_REPORT_APPENDICES.md** (Appendix A), and add the item to **Implemented game-changers** in this file and in **ENHANCEMENT_ROADMAP.md**.

---

## Where Existing Things Live (Quick Reference)

Same as **docs/ENHANCEMENT_ROADMAP.md** — use that table. Key for game-changers:

| Concern | Where it lives |
|--------|-----------------|
| Events, lifecycle, attendees, chat-rooms | `backend/src/modules/events/`, `lifecycle.service.ts` |
| Venues, check-in, grid, attendees, staff | `backend/src/modules/venues/` (venue-identity, venue-dashboard) |
| Discovery, location, cap | `backend/src/modules/discovery/`; config `discoveryCapFree` / `discoveryCapPremium` |
| Personas | `backend/src/modules/users/persona.*`; table `personas` |
| Whispers | `backend/src/modules/discovery/whisper.*`; table `whispers` |
| Intents | `backend/src/modules/users/intent.*`; table `intent_flags` |
| Subscriptions, features | `backend/src/modules/billing/subscription.service.ts`; `subscriptions.features_json` |
| Safety, panic, venue-distress | `backend/src/modules/safety/` |

---

## Doc Sync Checklist (Per Game-Changer)

| Doc | What to update |
|-----|----------------|
| **docs/ARCHITECTURE.md** | §2 File tree, §4 API Ledger, §6 Schema, §11 Env if new vars. |
| **docs/DEV_HANDOVER.md** | Relevant §4.x module; new section if new domain. |
| **docs/SYSTEM_REALITY_REPORT_APPENDICES.md** | Appendix A (every new route). |
| **docs/ENHANCEMENT_ROADMAP.md** | "Implemented game-changers" — add item + branch/PR. |
| **docs/GAME_CHANGER_ROADMAP.md** | This file: Progress log; move item to Implemented. |
| **docs/FEATURE_ADDITIONS_CRITIQUE.md** | Optional: check off in Part 2 Idea Checklist. |

---

## Theme 1: Venues as the Heart of the App

**Why it matters (from critique):** If the app becomes *the* way to discover who's at a venue, plan the night, and prove you were there, venues and promoters will care—and pay or partner.

### GC-1.1 — "Tonight" feed

- **Idea:** One place: "What's happening tonight." Events (with venue + vibe tag), venues with live check-in counts (opt-in), optional "I'm out tonight" (time-limited, vague location). Social calendar + Snap Map for the night without exposing exact location.
- **Existing:** Events `getNearbyEvents`, lifecycle phases; venues `getVenueStats`, check-ins; discovery.
- **Do not duplicate:** Reuse events and venues APIs; add a single **aggregator** endpoint or client composition.
- **Add:** e.g. `GET /v1/tonight?lat=&lng=&date=` returning events (with venue, vibe, attendee count), venues with `currentAttendees` (opt-in), optionally "I'm out" flags (new table or presence-derived). Keep response size bounded; paginate or cap.
- **Cautions:** Privacy — "I'm out tonight" must be vague and opt-in. Performance — single round-trip or two; cache where possible.
- **Before you build:** Read `events.service.ts`, `venue-identity.service.ts` (stats), `lifecycle.service.ts`. Decide: one backend endpoint vs client calling events + venues and merging.
- **After you build:** ARCHITECTURE §4, Appendix A; DEV_HANDOVER events/venues section.

### GC-1.2 — Venue vibe / theme nights

- **Idea:** Venue sets a tag for the night: "Social mix," "Lifestyle," "Kink," "Couples only," "Newbie friendly." Discovery and event listing filter by that tag.
- **Existing:** `venues` table; `events` (venue_id, type); no `vibe` or `theme` on venue or event.
- **Do not duplicate:** Add columns or a small table; do not build a second "venue profile" system.
- **Add:** e.g. `venue_night_themes` (venue_id, date/date_range, theme_tag) or `events.vibe_tag`; allow filter on GET events/nearby and GET venues/nearby by `vibe=` or `theme=`. Tags: enum or configurable list (Social mix, Lifestyle, Kink, Couples only, Newbie friendly).
- **Cautions:** Schema: one row per venue per night vs. event-level tag. Event already has `type`; vibe can be event-level or inherited from venue for that night.
- **Before you build:** Read events and venues schema (migrations 001, 008); event create/update flows.
- **After you build:** Migration; ARCHITECTURE §4, §6; Appendix A; DEV_HANDOVER §10.

### GC-1.3 — Venue-issued passes / keys (private events)

- **Idea:** For private or ticketed events: promoter creates event, gets shareable "door code" or QR. At door, staff validates; attendee's app unlocks that event's chat room + attendee list.
- **Existing:** Events (invite_code_hash in 001); venue_staff; event_rsvps; venue_chat_rooms (event_id).
- **Do not duplicate:** Extend events (e.g. door_code, door_code_expires_at) and RSVP flow; do not add a second "ticketing" system in v1.
- **Add:** Event-level door code (or reuse invite_code for "member" access); endpoint to validate code and grant in-app access (e.g. RSVP or "checked in" by code). Optional QR = encoding of code. Document legal frame: private membership event.
- **Cautions:** Security: code must be unguessable; rate-limit validation attempts. PII: who validated at door is sensitive — audit only, no broad sharing.
- **Before you build:** Read events schema, event_rsvps, venue_chat_rooms; compliance around event access.
- **After you build:** ARCHITECTURE §4, §6; Appendix A; DEV_HANDOVER §10, §14.

### GC-1.4 — Venue dashboard: density intelligence

- **Idea:** Anonymized stats for venues: "Peak check-ins last 30 days," "Repeat visitors," "Event types that fill the room." No PII; aggregate only. Premium or partner tier for venues.
- **Existing:** `venue_analytics` (008): checkins, unique_visitors, peak_hour, etc.; venue-dashboard routes.
- **Do not duplicate:** Extend `venue_analytics` or add aggregate views; do not build a second analytics store.
- **Add:** Ensure daily (or periodic) job populates venue_analytics; add dashboard endpoints or expand existing ones to expose aggregates (peak times, event_type performance). Gate behind venue subscription or partner flag.
- **Cautions:** Aggregates only; no user-level data to venue. Retention and storage policy for analytics.
- **Before you build:** Read `venue_analytics` schema, venue-dashboard.service.ts.
- **After you build:** ARCHITECTURE §4; DEV_HANDOVER §10.

### GC-1.5 — "Verified safe" venue badge

- **Idea:** Venue completes a checklist (staff training, distress protocol, safe exit). Badge on venue page and in discovery. Self-attest or third-party.
- **Existing:** `venues` table; no badge or attestation fields.
- **Do not duplicate:** Add columns or one small table (venue_attestations); do not build a full "certification" platform in v1.
- **Add:** e.g. `venues.verified_safe_at`, `venues.verified_safe_metadata` (JSON) or table `venue_safe_attestations` (venue_id, checklist_json, attested_at, method). GET venue and discovery include `verifiedSafe: true` when set. No PII in attestation.
- **Cautions:** Liability: badge is informational; clear wording that it's self-attest or partner program. Moderation if third-party.
- **Before you build:** Read venues migrations; venue-dashboard and venues.routes.
- **After you build:** Migration; ARCHITECTURE §4, §6; Appendix A; DEV_HANDOVER §10.

### GC-1.6 — Revenue share / attribution; white-label (defer or narrow)

- **Ideas:** (1) Users who subscribed after check-in at Venue X attributed to venue; venue gets cut or ad discount. (2) "Shhh at [Venue]": venue branding, your tech; one network.
- **Verdict:** High value but high complexity (billing attribution, contracts, white-label config). **Defer** until core venue and subscription flows are stable; then design as a separate initiative with product/legal.

---

## Theme 2: Promoters & Private Events

**Why it matters:** Most game-changing events are run by promoters. Let "venue" mean physical place or promoter; private but discoverable in-app.

### GC-2.1 — Venue = any host (promoter, pop-up, series)

- **Idea:** "Venue" can be a physical place, a promoter ("PopUp by Jane"), or a series ("Rooftop First Fridays"). Onboarding: apply as venue/promoter; verify; create events under that profile. Events can be "at" a fixed place or "location revealed after RSVP."
- **Existing:** `venues` (physical, lat/lng); `events` (venue_id, host_user_id). No promoter entity.
- **Do not duplicate:** Extend venues (e.g. venue_type: physical | promoter | series; parent_venue_id for promoter-under-venue) or add `promoters` table linked to events. One event model.
- **Add:** Migration for venue_type and/or promoters; event create allows promoter_id or venue_id; "location revealed after RSVP" = event.visibility or event.location_revealed_after_rsvp; enforce in GET event detail and RSVP flow.
- **Cautions:** Verification and trust for promoters; avoid spam/fake events. Legal: private membership framing.
- **Before you build:** Read venues and events schema; admin or verification flows for "claim venue."
- **After you build:** Migration; ARCHITECTURE §4, §6; Appendix A; DEV_HANDOVER §10.

### GC-2.2 — Private but discoverable; secret / gated events

- **Idea:** Events in-app only; to see them you're a member (signed up, verified to event's required level). Promoter sets: who can see (tier 1+, invite only, any member in 50 mi). "Secret" events: only visible to users who've been to 2+ events, or tier 2+, or invited.
- **Existing:** Events (is_private, invite_code_hash); event_rsvps; verification tier.
- **Do not duplicate:** Extend event visibility rules; do not build a second "event visibility" engine.
- **Add:** e.g. `events.visibility_rule` (open | tier_min | invite_only | attended_2_plus); `events.visibility_radius_km`; or `event_invites` table. Discovery and GET events filter by current user's tier and history. Invite-only = list of user_ids or invite codes.
- **Cautions:** "Attended 2+" requires counting event_rsvps (status checked_in or going); cache or index for performance.
- **Before you build:** Read events, event_rsvps, discovery flow.
- **After you build:** ARCHITECTURE §4, §6; Appendix A; DEV_HANDOVER §10.

### GC-2.3 — Series and recurring events

- **Idea:** "Every first Friday at X" = a series. Users follow series, get reminders, see "who's going" (privacy-safe) for next occurrence.
- **Existing:** Events (one-off); no series entity.
- **Do not duplicate:** Add `event_series` (or events.series_id + series table); do not duplicate event CRUD.
- **Add:** Table event_series (name, venue_id or promoter_id, recurrence_rule, next_occurrence); events.series_id; create next occurrence when previous ends or on schedule. GET series/:id/upcoming; follow = user_series_follows (user_id, series_id). Notifications from lifecycle or a worker.
- **Cautions:** Recurrence complexity (cron vs. on-demand); timezone handling.
- **Before you build:** Read events and lifecycle.service.
- **After you build:** Migration; ARCHITECTURE §4, §6; Appendix A; DEV_HANDOVER §10.

### GC-2.4 — Tickets and gates (optional)

- **Idea:** Link to Eventbrite/Stripe or native ticketing; "Get ticket" + "See who's going on Shhh." After purchase, in-app access to event chat and attendee list.
- **Verdict:** High value, high integration and legal complexity. **Defer** until event visibility and series are solid; then design with billing team.

---

## Theme 3: Growth Without Dilution (Intent & Onboarding)

**Why it matters:** Same app, clear intents and filters so everyone finds their lane — singles and curious without scaring them; lifestyle users without diluting the scene.

### GC-3.1 — Intent as first-class

- **Idea:** Intent central to discovery and positioning: Just social, Curious, Lifestyle / open to more, Couple. Discovery filters: "Show me: Social + Curious." No one forced into a lane they didn't choose.
- **Existing:** `intent_flags` (open_tonight, traveling, at_event, looking_for_friends, etc.); discovery already has filters. May need to align "intent" with a primary lane (social/curious/lifestyle/couple).
- **Do not duplicate:** Extend intent_flags or user_profiles (primary_intent); do not add a second "preference" system.
- **Add:** e.g. user_profiles.primary_intent or intent_flags with a canonical set (social, curious, lifestyle, couple); discovery filters by intent; default filters in onboarding. Ensure bidirectional preferences still apply.
- **Cautions:** Backward compatibility with existing intent_flags; migration of existing users (default to "social" or "curious").
- **Before you build:** Read intent_flags, discovery filters, bidirectional_preferences.
- **After you build:** Migration if new column; ARCHITECTURE §4; Appendix A; DEV_HANDOVER §4.7, §12.

### GC-3.2 — Two-layer profile (SFW public / NSFW private)

- **Idea:** Public (discovery): SFW — face or blurred, short bio, intents. Private (after match/reveal): NSFW, vault, more photos. Normies can stay "social" and never show explicit until they choose.
- **Existing:** user_profiles (photos_json, blur_photos); photo_reveals; media and albums. No explicit "public vs private" layer beyond blur/reveal.
- **Do not duplicate:** Model as "default visible" vs "reveal or match only"; reuse blur and reveal; do not add a second profile store.
- **Add:** Clarify in product: discovery shows SFW subset (e.g. first photo or blur, bio, intents); "private" content = vault or post-reveal media. May be mostly client and policy: what we send in GET profile for discovery vs GET after match. Optional: profile.visibility_tier (all | after_reveal | after_match).
- **Cautions:** Consistency with blur/reveal; no leaking of private content in discovery.
- **Before you build:** Read user_profiles, blur.service, discovery response shape.
- **After you build:** ARCHITECTURE §4; DEV_HANDOVER §4.2, §4.20.

### GC-3.3 — Event tags that set expectation; onboarding "What brings you here?"

- **Idea:** Events labeled "Social mix," "Newbie friendly," "Lifestyle," "Kink," "Couples only." Onboarding: single or multi choice — Social / Curious / Lifestyle / Couple; tailor first feed and default discovery filters.
- **Existing:** Events have `type`; onboarding_completed, onboarding_step on users. No event "audience" or "vibe" tag in discovery sense; no onboarding intent capture in DB.
- **Do not duplicate:** Add event tag (or reuse type with extended enum); store onboarding intent in user_profiles or onboarding table.
- **Add:** events.audience_tag or events.vibe_tag (enum); GET events/nearby filter by tag. Onboarding: store selected intents in user_profiles or users; discovery default filter by that. No new "onboarding" service — extend existing auth/onboarding flow.
- **Cautions:** Event tags overlap with GC-1.2 (venue vibe); unify as one tag set for events (and optionally venue night).
- **Before you build:** Read events schema, mobile onboarding if any; discovery defaults.
- **After you build:** Migration if new column; ARCHITECTURE §4; DEV_HANDOVER §10.

### GC-3.4 — "Curious" as protected lane

- **Idea:** Curious users can set "only show me to other Curious or Social" so they're not immediately in front of heavy lifestyle users.
- **Existing:** Discovery bidirectional preferences; no "show me only to" filter.
- **Do not duplicate:** Extend discovery filter or user preference; one place for "who can see me" rule.
- **Add:** e.g. user_profiles.discovery_visible_to (all | social_and_curious | same_intent). Discovery query: when building "them" side, filter by "me.discovery_visible_to" so that "them" is in allowed set for "me." Requires intent or segment on both sides.
- **Cautions:** Performance (extra join or filter); default = all to avoid shrinking discovery for existing users.
- **Before you build:** Read discovery SQL and bidirectional preferences.
- **After you build:** Migration if new column; ARCHITECTURE §4; DEV_HANDOVER §4.7.

---

## Theme 4: Friction Reduction & Pull Into Lifestyle

**Why it matters:** Demystify, reduce social friction, reward good behavior. One good experience away from curious → lifestyle.

### GC-4.1 — "We're new" vs "Experienced" badge

- **Idea:** Couples or singles can badge "New to this" so others know to be patient and respectful. "Experienced" can filter for same.
- **Existing:** user_profiles (experience_level exists in schema); personas; no explicit "new to lifestyle" badge.
- **Do not duplicate:** Use or extend experience_level; do not add a second "badge" system beyond trust_scores.
- **Add:** experience_level or new field new_to_lifestyle: boolean (or enum new | experienced | prefer_not_say). Discovery filter; show on profile. Optional: aggregate into "Experienced" badge for trust.
- **Cautions:** Wording: "New to this" not "Virgin" or judgmental; "Experienced" not "Pro."
- **Before you build:** Read user_profiles schema, discovery filters.
- **After you build:** Migration if new; ARCHITECTURE §4; DEV_HANDOVER §4.2.

### GC-4.2 — How it works / success stories; community norms in-app

- **Idea:** In-app or linked guides: "Your first mixer," "What to expect," "Consent and boundaries." Real (anonymous) success stories. Short, visible community norms: consent, respect, no harassment, how reporting works.
- **Existing:** No content CMS in backend. Could be static in-app or links; or minimal backend (e.g. markdown or curated list of URLs).
- **Do not duplicate:** Do not build a full CMS. Static content or one simple table (e.g. content_slots: key, title, body_md, link, locale).
- **Add:** Optional: GET /v1/content/guides and GET /v1/content/norms (or single GET /v1/content?keys=guides,norms). Return static or DB-backed copy. Client renders. Alternatively, content fully in client; backend only for feature-flag or A/B.
- **Cautions:** Moderation and updates; i18n if needed later.
- **Before you build:** Decide static vs backend; if backend, one small table.
- **After you build:** ARCHITECTURE §4 if new routes; Appendix A.

### GC-4.3 — Beginner-friendly event types

- **Idea:** "Social mixer (no play)," "Newbie night," "Talk first." Tag and filter so the right people see the right events.
- **Existing:** events.type (party, club_night, etc.); can add audience_tag or event_type_tag.
- **Do not duplicate:** Extend event type or tags (align with GC-1.2 / GC-3.3).
- **Add:** Same as GC-3.3 event tags; ensure "Newbie friendly," "Social mix," "Talk first" are in the enum or tag set and filterable.
- **After you build:** See GC-3.3.

---

## Theme 5: Ephemeral / "Live" (Snapchat-Like)

**Why it matters:** Ephemeral and "right now" create FOMO and reduce cost of participating. You have disappearing messages and TTL; double down where it fits.

### GC-5.1 — Stories that die (24h)

- **Idea:** User or venue posts a "story": photo or short clip, 24h (or 6h) then gone. Viewers see who viewed (optional). Use case: "Tonight's vibe at [Venue]," "Getting ready."
- **Existing:** Media (upload, TTL for self-destruct); no "story" type or story_viewers.
- **Do not duplicate:** Model stories as media with type=story and TTL; or new table stories (user_id, venue_id nullable, media_id, expires_at). Reuse media storage and cleanup.
- **Add:** e.g. stories table (id, user_id, venue_id, media_id, expires_at); story_views (story_id, viewer_id, viewed_at). GET /v1/stories/nearby or GET /v1/venues/:id/stories. Worker or TTL to delete. Optional: view list visible to author only.
- **Cautions:** Storage and bandwidth; 24h TTL strict. Venue stories: who can post (venue staff only?).
- **Before you build:** Read media, upload flow, cleanup workers.
- **After you build:** Migration; ARCHITECTURE §4, §6; Appendix A; DEV_HANDOVER media/venues.

### GC-5.2 — "Live" at a venue (opt-in, time-limited)

- **Idea:** Opt-in: "I'm here" with time limit (e.g. 2h). Shown as dot/tile on venue map/grid; no identity until match/reveal. When time's up, disappear from "live."
- **Existing:** venue_checkins (checked_in_at, checked_out_at); presence (state, expires_at); venue grid.
- **Do not duplicate:** Could be implemented as presence state "at_venue" + venue_id + short expires_at, or check-in with "live_until." Reuse grid and presence.
- **Add:** Option A: presence.live_until or check-in live_duration_minutes; grid filters "live" only if within window. Option B: venue_checkins.live_until; worker or client triggers checkout when expired. Return "live" count or live tiles in GET venue grid.
- **Cautions:** Privacy: "live" must be opt-in and clearly time-bound.
- **Before you build:** Read presence, venue_checkins, venue grid.
- **After you build:** ARCHITECTURE §4, §6; DEV_HANDOVER §10.

### GC-5.3 — Quick photo reply (view-once / 24h)

- **Idea:** In chat: send photo that's view-once or 24h. Reduces "this is forever" anxiety.
- **Existing:** Self-destructing media upload; messages with media; view tracking.
- **Do not duplicate:** Reuse message + media with ttlSeconds or view_once flag; do not add a second "story" in chat.
- **Add:** POST message body: attachment with view_once or ttl_seconds; store in message doc; client enforces view-once or TTL. May already be supported by existing self-destruct media + message flow.
- **Before you build:** Read messaging, media upload (self-destruct), view tracking.
- **After you build:** ARCHITECTURE §4; DEV_HANDOVER §7.

### GC-5.4 — "We keep crossing paths" (soft nudge)

- **Idea:** "You've both been at the same venue 3 times" (anonymized until both opt in). Optional "Say hi?" Nudge — not gamified like Snap streaks.
- **Existing:** venue_checkins (venue_id, user_id, checked_in_at); no "crossing paths" aggregation.
- **Do not duplicate:** Add aggregation or periodic job that computes "same venue N times"; do not store full history forever.
- **Add:** Query or materialized view: pairs (user_a, user_b, venue_id, count) where count >= 2 or 3; only expose if both have opted in (e.g. preferences.crossing_paths_visible). Push or in-app nudge: "You've been at [Venue] a few times — say hi?" Privacy: no identity until both opt in.
- **Cautions:** Heavy query; consider batch job and cache. Opt-in must be clear.
- **Before you build:** Read venue_checkins, preferences.
- **After you build:** ARCHITECTURE §4, §6; DEV_HANDOVER §10.

### GC-5.5 — Tonight-only persona

- **Idea:** Persona that expires at end of night (or 6h). "One night, no trace." Fits "burn" persona from critique.
- **Existing:** Personas (no expires_at in current schema); FEATURE_ADDITIONS_CRITIQUE §6 suggests expires_at, is_burn.
- **Do not duplicate:** Add personas.expires_at and optionally is_burn; worker to deactivate. Discovery and presence use only active persona.
- **Add:** Migration: personas.expires_at, personas.is_burn; persona create/update allows expires_at; worker or cron sets is_active=false when expires_at passed. "Tonight-only" = expires_at = end of night (client or server).
- **Before you build:** Read personas schema (005), persona.service.
- **After you build:** Migration; ARCHITECTURE §4, §6; DEV_HANDOVER §12.

---

## Theme 6: Community / Tribe (FetLife-Like)

**Why it matters:** Belonging and events with better UX and privacy than forum sprawl.

### GC-6.1 — Groups or tribes

- **Idea:** User-created or curated: "New to lifestyle," "Couples only," "[City] regulars." Join → see group events, who's in group (privacy-safe), group chat or announcements. Discovery can filter "in my groups."
- **Existing:** No groups table. Events, discovery, messaging are per-user or per-conversation.
- **Do not duplicate:** Add one groups model (group_id, name, description, visibility, created_by); group_members; optionally group_events (event_id, group_id). Do not build a second "social graph."
- **Add:** Tables: groups, group_members; optionally group_events. Routes: GET/POST /v1/groups, POST /v1/groups/:id/join, GET /v1/groups/:id/members (privacy-safe), GET /v1/groups/:id/events. Discovery filter by "in my groups" = show users who share at least one group. Moderation: who can create groups; abuse.
- **Cautions:** Scope creep (forums, posts); keep v1 to membership and event listing only.
- **Before you build:** Read events, discovery, schema patterns.
- **After you build:** Migration; ARCHITECTURE §2, §4, §6; Appendix A; DEV_HANDOVER new §4.x.

### GC-6.2 — Events as home screen

- **Idea:** "Tonight" and "This week" as primary tabs: calendar of events (venue + vibe tag), RSVP, "Who's going," after-event "vibe" tags.
- **Existing:** Events nearby; lifecycle; event_post_prompts. Mobile determines "home" — backend already supports events and prompts.
- **Do not duplicate:** Backend is mostly ready; ensure GET events/nearby and GET tonight (if built) support date range and ordering. Client change for "events as home."
- **Add:** Backend: optional GET /v1/events/this-week or extend nearby with date range; ensure response includes vibe/tag and attendee count. Rest is client and copy.
- **After you build:** ARCHITECTURE §4; Appendix A.

### GC-6.3 — Writing and education; respect and consent as product

- **Idea:** Tasteful articles/tips; "Read" section or links. Consent flow before first message; "Revoke anytime" visible; report/block one tap.
- **Existing:** No content CMS; reporting and block exist. Consent in messaging (session consent).
- **Do not duplicate:** Content = static or GC-4.2 content endpoint. Consent = extend existing session/consent flow and make it visible in UI (backend already has consent records).
- **Add:** Content: see GC-4.2. Consent: ensure GET /v1/conversations or first-message flow returns consent state; client shows "Revoke anytime" and one-tap report/block. No new backend for "consent as product" beyond clarity in API.
- **After you build:** Doc only or small content API.

---

## Theme 7: Wild Cards (One-Liners to Explore)

| Id | Idea | Existing hook | Verdict / note |
|----|------|----------------|----------------|
| GC-7.1 | Anonymous question at venue | Whispers; venue check-in | "Someone at this venue asked you a question." Reply to reveal who asked. Extend whispers with venue_id and anonymous flag; or new endpoint POST /v1/venues/:id/anonymous-question. |
| GC-7.2 | Vibe check at door | venue_staff | Staff marks attendee "vibe checked" (friendly, respectful). New table or venue_staff_actions (staff_id, user_id, action, created_at). Moderation for abuse. **Conditional.** |
| GC-7.3 | Date mode (couple invite couple) | Couples; events | Couple creates "date": time, place, optional venue; invite another couple. Private event within app. Extend events (type=double_date, invited_couple_id) or new event_invites. |
| GC-7.4 | Algorithm (people who liked X also liked Y) | event_rsvps; likes; check-ins | Aggregate, privacy-safe. "People who checked in at A also went to B." Discovery or "Tonight" boost. **Defer** until enough data; then differential privacy or aggregate only. |
| GC-7.5 | Distress to venue security | Safety; venue_distress | **Implemented** in Phase C.4 (POST /v1/safety/venue-distress). |
| GC-7.6 | Location as message | Messages; media types | Message type with lat/lng + TTL. Fits existing message model. Add type=location, body or attachment with coords + expires_at. |
| GC-7.7 | Burner/relay number | — | Regulatory and infra complexity. **Defer.** |
| GC-7.8 | "No" as first-class action | Pass, block, report | Optional short reason (for algorithm only). Extend pass or add "not_for_me" with reason_id; use in discovery ranking, no shaming. |
| GC-7.9 | Couple's joint profile | Couples; discovery | Two accounts linked; one shared profile in discovery. "We're a couple" obvious; each has own app. Extend discovery to return couple profile when both linked; show one tile per couple. |
| GC-7.10 | Wearables check-in | Check-in; presence | Optional: "I'm at the gym" or "[venue type]" from Apple Watch. Low-friction check-in; opt-in, time-bound. Backend: same check-in or presence API; client = watch app. **Defer** until mobile is stable. |

---

## New Ideas for Review (Not in Critique)

These are **additions** for product/team review; not from FEATURE_ADDITIONS_CRITIQUE.md.

| Id | Idea | Rationale |
|----|------|-----------|
| GC-N.1 | **Reveal L3 / vault-level reveal** | Critique deferred "Level 3 vault" until vault albums were clear. Vault and album share are now in place (Phase A.3). Consider adding reveal level 3 (vault) that grants access to vault album content when both have vault and mutually reveal at L3. |
| GC-N.2 | **Vibes / soft reputation (conditional)** | Critique §8: vibe tags only after real-world overlap (event/venue/conversation); one per (from, to, context); aggregate into badges. Now that event/venue check-in and post-event prompts exist, consider lightweight vibe_tags table and "give vibe" after event. **Conditional:** avoid gaming; no public counts. |
| GC-N.3 | **Voice drops (defer)** | Critique and ENHANCEMENT_ROADMAP defer voice drops (storage, playback, anti-save). Leave deferred until core media and retention are solid. |
| GC-N.4 | **Discovery cap in venue/event context** | Already implemented: venueId/eventId in discover query bypasses free cap (Phase C.1). No further work needed. |
| GC-N.5 | **"Ad why am I seeing this?"** | Critique §10: add UI that explains privacy stance and surface. Backend can return placement metadata (e.g. "Because you're near [Venue]" or "General feed"); no new ad logic. Small API addition + client modal. |

---

## Progress Log (Update as You Go)

| Theme | Item | Status | Notes |
|-------|------|--------|-------|
| — | (Phase C.4) Distress to venue security | ✅ Done | Implemented in ENHANCEMENT_ROADMAP Phase C.4 (POST /v1/safety/venue-distress). |
| 1 | Tonight feed | ✅ Done | GET /v1/tonight; events + venues with currentAttendees; optional date, radius. |
| 1 | Venue vibe / theme nights | ✅ Done | events.vibe_tag (migration 017); create/filter by vibe. |
| 1 | Venue-issued passes | ⬜ Not started | |
| 1 | Venue density intelligence | ⬜ Not started | |
| 1 | Verified safe venue badge | ⬜ Not started | |
| 2 | Venue = any host (promoter) | ⬜ Not started | |
| 2 | Private / gated events | ⬜ Not started | |
| 2 | Series and recurring events | ⬜ Not started | |
| 3 | Intent as first-class | ⬜ Not started | |
| 3 | Two-layer profile | ⬜ Not started | |
| 3 | Event tags + onboarding intent | ⬜ Not started | |
| 3 | Curious protected lane | ⬜ Not started | |
| 4 | We're new / Experienced badge | ⬜ Not started | |
| 4 | How it works / norms content | ⬜ Not started | |
| 5 | Stories (24h) | ⬜ Not started | |
| 5 | Live at venue | ⬜ Not started | |
| 5 | Quick photo reply (view-once) | ⬜ Not started | |
| 5 | Crossing paths nudge | ⬜ Not started | |
| 5 | Tonight-only persona | ⬜ Not started | |
| 6 | Groups / tribes | ⬜ Not started | |
| 6 | Events as home screen | ⬜ Not started | |
| 7 | (See Theme 7 table) | — | Wild cards: pick and prioritize. |

**Implemented game-changers (add when done):**

- Venue distress to security (Phase C.4, branch `shh-enhancement-trial`).
- GC-1.1 Tonight feed: GET /v1/tonight (events + venues with currentAttendees; branch `shh-enhancement-trial`).
- GC-1.2 Venue vibe / theme nights: events.vibe_tag (migration 017), create/filter by vibe (branch `shh-enhancement-trial`).

---

## How to Use This Roadmap

1. **Prioritize** with product: pick one theme or 2–3 items for a sprint. Dependencies: e.g. Tonight feed (GC-1.1) benefits from venue vibe (GC-1.2) and event tags (GC-3.3).
2. **Before you build:** Read the "Existing" and "Do not duplicate" lines; read the referenced code and docs.
3. **Implement** following the same patterns as ENHANCEMENT_ROADMAP (migrations, routes, services, tests).
4. **After you build:** Run tests; update ARCHITECTURE, DEV_HANDOVER, Appendix A; add to "Implemented game-changers" here and in ENHANCEMENT_ROADMAP.md; optionally check off in FEATURE_ADDITIONS_CRITIQUE.md Part 2 checklist.
5. **New ideas:** Add to "New Ideas for Review" or Theme 7 with a short rationale; get product sign-off before implementing.

---

## Link from Other Docs

- **ENHANCEMENT_ROADMAP.md** — "Game-Changer Ideas" section points here for the full backlog; "Implemented game-changers" there should stay in sync with this Progress log.
- **docs/README.md** — Add this document to the index so it’s discoverable.
