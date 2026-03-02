# Shhh — Glossary & Domain Model

> **Purpose:** Quick reference for domain terms used across the codebase and docs.  
> **Audience:** New developers, product, support.

---

## Core Concepts

| Term | Definition |
|------|------------|
| **Persona** | A user-created identity slot (e.g. "Weekend me", "Burner"). Users can have multiple personas; one is active at a time. Used for discovery and presence. |
| **Intent** | A flag indicating what the user is open to (e.g. `open_to_chat`, `looking`, `just_browsing`). Affects discovery matching and ad targeting. |
| **Whisper** | An anonymous or semi-anonymous message sent to another user. Has TTL (e.g. 4h); recipient can respond, reveal, or ignore. |
| **Tier** | Verification tier (0, 1, 2). Tier 0 = unverified; 1 = photo verified; 2 = ID verified. Gates features (e.g. like, create event). |
| **Presence** | User's current state (e.g. `invisible`, `nearby`, `browsing`, `at_venue`, `at_event`, `open_to_chat`, `paused`). Decays via worker; user must reaffirm. |
| **Crossing paths** | Pairs of users who have overlapping check-ins at the same venue (above a threshold). Used for discovery when both have `crossing_paths_visible`. |
| **Discovery** | The process of finding nearby users via PostGIS. Filtered by blocks, verification, intent, and `discovery_visible_to`. |
| **Couple** | Two users linked via invite code. Enables shared features (e.g. albums, joint visibility). |
| **Series** | Recurring events (e.g. "Trivia Tuesday"). Users can follow a series to see upcoming events. |

---

## Verification & Safety

| Term | Definition |
|------|-------------|
| **Verification** | Photo and/or ID verification to increase tier. Admin approves/rejects. |
| **Trust score** | Computed metric for user reputation (reports, interactions, verification). Used in moderation. |
| **Safety check-in** | User sets an expected return time; if missed, alert can be sent (worker not implemented). |
| **Panic** | Emergency action that records to DB and audit; intended to notify emergency contacts (SMS/push not implemented). |
| **Venue distress** | User signals distress at a venue; notifies active venue staff via WebSocket. |
| **Screenshot report** | Client detects screenshot in chat; reports to backend. Inserts into `screenshot_events` for moderation. |

---

## Monetization & Ads

| Term | Definition |
|------|-------------|
| **Ad placement** | A venue-created ad with surface (discover_feed, chat_list, post_event, venue_page), targeting, budget. |
| **Surface** | Where an ad can appear: discover feed, chat list, post-event, venue page. |
| **Cadence** | Rules per surface: max per 24h, min gap, skip during certain intents. |
| **Kill switch** | Global `ad_controls` row; when `enabled: false`, no ads served. |
| **Premium** | Subscription tier (Stripe). Premium users see no ads. |

---

## Technical

| Term | Definition |
|------|-------------|
| **E2EE** | End-to-end encryption. Server stores keys; client encryption not yet wired. |
| **Session** | Conversation-level consent and TTL. Panic-wipe clears session keys. |
| **TTL** | Time-to-live. Messages, whispers, presence, and media can have TTL for auto-expiry. |
| **Geofence** | Geographic boundary (e.g. around a venue). Used for check-in and discovery. |
| **Location fuzzing** | Random offset (e.g. 300m) applied to coordinates for privacy. |
