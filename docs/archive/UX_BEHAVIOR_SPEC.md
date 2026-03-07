# Shhh — UX Behavior Spec (Human Truth)

> **Version**: 1.0.0 | **Last updated**: February 2026  
> **Purpose**: Behavioral contract for how the product should feel, guide, and protect users. Companion to **UX_UI_SPEC.md** (surface/screens) and **ARCHITECTURE.md** (system).  
> **Use**: Invariants, user states, safety flows, copy rules, and accessibility gates that screens and flows must satisfy — not a screen inventory.

---

## Table of Contents

1. [UX Invariants](#1-ux-invariants)
2. [User State Models](#2-user-state-models)
3. [Safety Flows](#3-safety-flows)
4. [Copy & Tone Guidelines](#4-copy--tone-guidelines)
5. [Consent & Reveal Language](#5-consent--reveal-language)
6. [Accessibility Gates](#6-accessibility-gates)
7. [How This Doc Relates to UX_UI_SPEC](#7-how-this-doc-relates-to-ux_ui_spec)

---

## 1. UX Invariants

These are **non-negotiable**. Every screen and flow must be checkable against them. No exception for “launch speed.”

| # | Invariant | What it means in practice |
|---|-----------|---------------------------|
| I1 | **We never expose before consent** | No identity, photo, or contact is shown to another user without an explicit, reversible consent step (reveal, match, share). Default is blurred/anon until the user opts in. |
| I2 | **We never shame or rank users** | No scores, “hot or not,” or comparative rankings. Trust/reference systems are about safety and verification, not attractiveness or popularity. |
| I3 | **We default to less visibility, not more** | Presence, discovery radius, and profile visibility start at the most conservative setting. User opts *into* more exposure. |
| I4 | **We never surprise users with permanence** | If something is saved or lasting, we say so. Ephemeral (messages, presence, stories) is the default; anything that persists is clearly indicated. |
| I5 | **We always allow retreat without explanation** | Block, pass, revoke reveal, leave conversation, go invisible — no “why?” required. One action, no interrogation. |
| I6 | **We make safety findable in &lt;3 taps** | From any main screen, panic, block, report, or “I need out” must be reachable without hunting. Safety is not buried in settings. |
| I7 | **We don’t force a lane** | Curious, social, lifestyle, couple — user chooses. We don’t infer or push them into a category they didn’t pick. |

**Reference in UX_UI_SPEC**: Screens that touch identity, discovery, or safety should explicitly satisfy I1–I7 (e.g. Discover → I3, I7; Profile/Reveal → I1, I5; Safety menu → I6).

---

## 2. User State Models

The product should support distinct **psychological states**. Screens and actions should be designed for the state the user is likely in.

### 2.1 State definitions

| State | Description | Primary need |
|-------|-------------|--------------|
| **New / curious / anxious** | First install or first time in a context (event, venue). Unsure what’s allowed, who sees them, or how to retreat. | Clarity, control, low pressure, easy exit. |
| **Observing** | Browsing discovery, events, or venue without committing. Want to see who’s there and what’s happening without being “on the market.” | Invisibility or low visibility; no obligation to act. |
| **Testing boundaries** | Sending a whisper, liking, or revealing one photo. Testing whether the app and the other person feel safe. | Clear feedback, reversible actions, no lasting trace unless they choose. |
| **Actively engaging** | In conversation, at an event, or with intent signals on. Open to connection. | Presence, intent, and chat that feel live and respectful. |
| **Retreating / cooling off** | Block, pass, go invisible, revoke reveal, or leave. Need to step back without drama. | One-tap retreat, no “are you sure?” guilt, no explanation required. |

### 2.2 Mapping: states ↔ screens and actions

| State | Screens that serve it | Actions that must be enabled | Actions that must not be forced |
|-------|------------------------|-----------------------------|---------------------------------|
| New / curious / anxious | Onboarding, Discover (default low exposure), Events (tags: newbie-friendly), Profile status (presence = invisible) | Set intent, set discovery_visible_to, skip onboarding, pull to refresh | Auto-visible in discovery, auto-reveal, required profile completion |
| Observing | Discover, Events, Venue detail, Whispers (read-only) | Go invisible, browse without liking, view events/venue | Like, message, reveal, check-in (unless they choose) |
| Testing boundaries | User profile, Whisper compose, Chat (first message), Photo reveal | Whisper, like, one photo reveal, self-destruct message | Full profile reveal, permanent message, required reply |
| Actively engaging | Chat, Profile status (open_to_chat, intents), Discover (with presence) | Send message, set presence/intent, RSVP, check-in | — |
| Retreating / cooling off | Block, Pass, Revoke reveal, Go invisible, Leave conversation, Panic | Block, pass, revoke, invisible, leave, panic | “Why are you leaving?” or mandatory feedback |

**Reference in UX_UI_SPEC**: When adding or changing a screen, check which state(s) it serves and that the action set obeys the “must be enabled” / “must not be forced” columns.

---

## 3. Safety Flows

These are **end-to-end journeys**, not single screens. Each flow should be implementable and testable.

### 3.1 “I feel uncomfortable” → exit in 3 taps

- **Goal**: From any main context (Discover, Chat, Profile, Event), user can block or report or get to safety without digging.
- **Flow**: [Current screen] → [Safety/Report/Block entry] → [Confirm if destructive] → [Done + feedback].
- **Rules**: No more than 3 taps to “I’m out.” Block and report must not require explaining why (optional reason is fine). Success feedback: calm, non-alarming (“You’re in control” not “We’ve alerted the authorities” unless true).
- **Status vs UX_UI_SPEC**: Profile has Block/Report on user profile; Panic on Me. Missing: consistent “Safety” or “Need help?” entry from Chat and Discover. See UX_UI_SPEC §3.9, §3.5.

### 3.2 Someone screenshots → what both users see

- **Goal**: Screenshot is detected; reporter is notified; *screenshotee* gets clear, non-panic feedback that the other person was notified (per UX_UI_SPEC and backend).
- **Flow**: [Screenshot in chat/profile] → [Client reports to /v1/safety/screenshot] → [Recipient notified per backend] → [Reporter sees confirmation that “the other person was notified”].
- **Rules**: Copy must be factual and calm. No public shaming; no “X has been banned” to the screenshotee unless that’s true. See Copy & Tone §4.3.
- **Status**: useScreenshotDetection exists; UX_UI_SPEC notes “alerts user that other person was notified.” Flow not yet written in one place; both sides’ copy should be in this doc.

### 3.3 I regret revealing → revoke and recover

- **Goal**: User can revoke a photo reveal or shared album and understand that the other side loses access. No “take back” guilt copy.
- **Flow**: [Profile or Album share] → [Revoke reveal / Revoke share] → [Confirm if needed] → [Done]. Other user’s view updates (blurred / no access).
- **Rules**: One-tap revoke where possible. Copy: “Reveal revoked” / “Share removed” — neutral. No “They’ll be notified you revoked” unless we actually send that (then keep it factual).
- **Status**: Backend supports revoke; UX_UI_SPEC §3.10, §3.15. Flow and copy should be explicit here.

### 3.4 New and unsure → guardrails by default

- **Goal**: First-time or “curious” users get defaults that minimize exposure: discovery_visible_to = social_and_curious (or same_intent), presence = invisible until set, no auto-reveal.
- **Flow**: [Onboarding or first launch] → [Intent picker: Social / Curious / Lifestyle / Couple] → [Default discovery_visible_to for Curious] → [Discover shows only allowed audience].
- **Rules**: See UX_UI_SPEC §7 (Singles exposure path). Guardrails must be the default for “Curious”; no opt-in to safety.
- **Status**: UX_UI_SPEC marks onboarding intent and discovery filter as NOT IMPLEMENTED. This flow is the behavioral spec for when we implement it.

### 3.5 Panic and post-panic

- **Goal**: Panic is one action (e.g. shake or button). Contacts are notified with location. User sees clear confirmation; no secondary stress from the UI.
- **Flow**: [Trigger: shake or Panic button] → [Confirm: “Send alert to emergency contacts with your location?”] → [POST /v1/safety/panic] → [Confirmation: “Alert sent”]. Backend handles contact notification (see SYSTEM_REALITY_REPORT re: contactsNotified).
- **Rules**: Copy must be clear and calm. If backend does not yet send SMS/push to contacts, copy must not say “Your contacts have been notified” until it’s true (see SYSTEM_REALITY_REPORT_APPENDICES / reality report).
- **Status**: UX_UI_SPEC §3.8, §8.4. Backend panic implemented; contact notification is a known gap.

---

## 4. Copy & Tone Guidelines

Words *are* UX for Shhh. These rules apply to in-app copy, errors, and consent text.

### 4.1 Principles

- **Calm, adult, matter-of-fact.** No hype, no teen slang, no “OMG you matched!”
- **Discretion over exposure.** Prefer “Only you and they can see this” over “Public.”
- **Control over access.** Premium/features: frame as “more control” and “your rules,” not “unlock more people.”

### 4.2 Sex and lifestyle

- **Matter-of-fact, not explicit.** We name kinks, orientations, and preferences in settings and filters without euphemism or pornographic language.
- **No ranking or judgment.** We don’t say “real” or “serious” vs “just curious.” We use the user’s own labels (Social, Curious, Lifestyle, Couple).

### 4.3 Safety incidents

- **Factual and minimal.** “We’ve recorded this and the other person was notified.” No drama, no “You’re in danger” unless we’re actually escalating.
- **No false promises.** Don’t say “Your contacts have been notified” if we only recorded the event. See §3.5 and SYSTEM_REALITY_REPORT.

### 4.4 Errors and empty states

- **Neutral, actionable.** “Something went wrong. Pull down to try again.” Not “Error 500” or “You’re blocked.”
- **Empty states:** Align with discretion and calm. Example: “No one nearby right now” + “Pull down to refresh” instead of “No one wants to talk to you.” See review comment in GPT feedback: empty states should match brand tone.

### 4.5 Premium / paywall

- **Control and discretion.** “See who revealed to you,” “More personas,” “No ads,” “Presence scheduling.” Not “Get more matches” or “Unlock hot people.”

---

## 5. Consent & Reveal Language

Any time we expose identity, photos, or contact, language must be explicit and reversible.

### 5.1 Reveal (photo/profile)

- **Before reveal:** User must see what “reveal” means: “They will see your unblurred photos / full profile until you revoke.”
- **Confirm:** One clear action: “Reveal to [Name]” or “Reveal for 24 hours.” No pre-checked “I agree” that hides in a wall of text.
- **After revoke:** “Reveal revoked. They can no longer see your unblurred photos.” Neutral, not punitive.

### 5.2 Match / conversation

- **Mutual like:** “You’re both interested. You can message now.” No “It’s a match!” hype unless product chooses that tone; if so, keep it one line.
- **First message:** No implied consent beyond “they can see you’re typing.” Consent for more (e.g. album share) is separate.

### 5.3 Album share

- **Before share:** “Share album with [Name] for [duration]. They can view [and optionally download] until you revoke.”
- **Revoke:** “Share removed. They no longer have access.”

### 5.4 Consent as product (conversation)

- If the product ships “consent state” (e.g. requiresMutualConsent, grantedByMe), the UI must explain in plain language: “This conversation is private. Both of you have agreed to share. You can revoke anytime.” See ARCHITECTURE / GAME_CHANGER_ROADMAP GC-6.3.

---

## 6. Accessibility Gates

Accessibility is a **launch gate** for trust and store approval. Mark items so engineering and product can prioritize.

### 6.1 A11Y-BLOCKING (must fix before public launch)

- **Login / Register / Verify-code:** All inputs must have `accessibilityLabel` (or equivalent) tied to visible labels (e.g. “Phone number”, “Verification code”). Submit buttons must have clear labels (e.g. “Continue”, “Verify”).
- **Panic and primary safety actions:** Panic button and “Block” / “Report” must be focusable and announced (e.g. “Panic alert – double tap to send alert to emergency contacts”).
- **Critical errors:** Any error that blocks the user (e.g. invalid code, session expired) must be in a live region or announced so screen reader users get feedback.

### 6.2 A11Y-RECOMMENDED (before or shortly after launch)

- **Discover tiles:** Each tile must be labeled with name and role (e.g. “Alex, 2 km away, open to chat”).
- **Conversation list:** Each row labeled with conversation name and last activity (e.g. “Conversation with Alex, 5 minutes ago”).
- **Tab bar:** Tabs exposed as tab list with selected state; labels (Explore, Chat, Events, Me).
- **Onboarding:** Slides exposed as a list; “Slide 2 of 4”; Skip and Next/Get Started clearly labeled.
- **Headings:** Venue, Profile, and Settings sections use semantic headings so users can jump by section.

### 6.3 A11Y-POST-LAUNCH (backlog, not block)

- **Animations:** Respect reduced motion where supported.
- **Whisper / Chat:** Message list announcements (e.g. “Message from Alex: …”) for new messages.
- **Complex forms:** Edit profile, Album share – group related fields; ensure order and labels are correct.

### 6.4 Reference to UX_UI_SPEC

- UX_UI_SPEC §8.5 lists current gaps (labels, live regions, headings). Those items should be mapped into 6.1–6.3 above so that every gap has a gate (blocking / recommended / post-launch).

---

## 7. How This Doc Relates to UX_UI_SPEC

- **UX_UI_SPEC.md** = *surface truth*: screens, layout, API, components, states, edge cases. “What exists and what’s missing at the UI level.”
- **UX_BEHAVIOR_SPEC.md** (this doc) = *human truth*: invariants, user states, safety flows, copy, consent, accessibility gates. “What must be true for the product to feel right and be safe.”

**Use together:**

1. When designing a new screen or flow, check **UX_BEHAVIOR_SPEC** for invariants (§1), user state (§2), and any safety flow (§3); then implement in line with **UX_UI_SPEC** template.
2. When writing copy, use **UX_BEHAVIOR_SPEC** §4 and §5.
3. When prioritizing accessibility, use **UX_BEHAVIOR_SPEC** §6 (A11Y-BLOCKING first).
4. When reviewing launch readiness, confirm: invariants hold, safety flows are implementable, blocking a11y is done, and no copy violates §4–5.

---

**End of UX Behavior Spec.** For screens and technical UI detail see **UX_UI_SPEC.md**. For system and API see **ARCHITECTURE.md** and **DEV_HANDOVER.md**.
