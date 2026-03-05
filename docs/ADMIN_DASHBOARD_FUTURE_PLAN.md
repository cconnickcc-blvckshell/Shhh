# Admin Dashboard — Future Enhancement Plan

**Status:** Ideas / Spitball  
**Last updated:** 2026-03-05

---

## Overview

This document captures ideas for enhancing the admin dashboard with richer visualizations, real-time feedback, and a more engaging operator experience. Items are organized by concept, with implementation notes and suggested phasing.

---

## 1. 3D Globe — Online Users Map

### Concept

An interactive 3D globe where online accounts appear as little lights. Zoomed out: clusters of light. Zoomed in: individual dots with density/spread visible. Gives a visceral sense of where users are and how activity is distributed.

### Refinements

- **Heat layers:** Toggle a heatmap overlay by density so hotspots (e.g. NYC, LA) stand out.
- **Time-of-day filter:** Show who's online "right now" vs "in their evening" (local time).
- **Clustering:** Zoomed out = clusters; zoomed in = individual dots.
- **Click-through:** Click a dot → user card (ID, tier, last active).
- **Pulse/glow:** Dots pulse or glow based on recency of activity.
- **Trails (optional):** Faint movement trails for users who changed location recently.

### Tech Stack

- Three.js + globe library (e.g. `react-globe.gl`, `three-globe`)
- Or simpler: 2D map (Mapbox/Leaflet) with globe-style projection

### Data Requirements

- New endpoint: `GET /v1/admin/presence/geo` returning `{ lat, lng, userId, lastSeen }[]` for active users
- Uses existing presence/location data

---

## 2. 3D Cylinder / Marble Drop — Signup Visualization

### Concept

A 3D tube or cylinder. Every time someone signs up, a ball or marble drops into it. Visual fun that shows "how many accounts are in my system" and makes growth tangible.

### Refinements

- **Color coding:** Marbles by tier (free vs premium), signup source (phone vs OAuth), or signup date.
- **Sound:** Optional soft "plink" on each drop.
- **Accumulation:** Marbles stack at the bottom; scroll/zoom to see history.
- **Milestones:** At 1k, 10k, etc., a brief celebration animation or badge.
- **Speed:** "Drops per minute" or "drops today" so growth feels tangible.
- **Alternative metaphors:** Water filling a tank, coins into a jar, particles into a vortex.

### Data Requirements

- Webhook or poll on signup events
- Or: `GET /v1/admin/stats/signups` with counts and timestamps

---

## 3. Additional Dashboard Ideas

| Idea | Description |
|------|-------------|
| **Pulse / Heartbeat** | One big "heartbeat" line that pulses with real-time activity (messages, discoveries, signups). |
| **Conversation Rivers** | Streams of messages flowing between regions or user clusters. |
| **Tier Funnel** | Funnel chart: signup → verified → premium, with drop-off rates. |
| **Trust Score Distribution** | Histogram or curve of trust scores; flag outliers. |
| **Moderation Queue** | Kanban of reports/photos; drag to approve/reject. |
| **Live Activity Feed** | Scrolling feed of recent actions (signup, message, panic, distress). |
| **Session Duration** | Distribution of session lengths; "stickiness" over time. |
| **Geographic Growth** | Map of "new users this week" by region. |
| **Retention Cohorts** | D1/D7 retention by signup cohort. |
| **Safety Dashboard** | Panic, distress, reports over time; response times. |
| **Revenue Sparkline** | Revenue over time with MRR and churn. |
| **Dark Mode Toggle** | Simple theme switch for long admin sessions. |

---

## 4. Suggested Phasing

### Phase 1 — Quick Wins

- Live activity feed
- Signup marble drop (or simpler "counter + animation")
- Basic geographic dots on a 2D map

### Phase 2 — Deeper

- Full 3D globe with clustering and click-through
- Tier funnel and retention cohorts
- Moderation queue Kanban

### Phase 3 — Polish

- Sound and milestone animations
- Heat layers and time-of-day filters
- Pulse/heartbeat visualization

---

## 5. Technical Considerations

- **Performance:** For 10k+ points, use clustering or sampling; avoid rendering every user as a separate mesh.
- **Privacy:** Aggregate or anonymize; avoid exposing exact locations in the UI.
- **Real-time:** WebSockets or short-interval polling for live updates.
- **Fallback:** Ensure the dashboard works without WebGL (e.g. 2D map + counters).

---

## 6. Recommended First Step

Start with: **marble drop + live activity feed + simple 2D map**, then evolve into the 3D globe and more advanced visualizations.

---

*This plan is for future implementation. No code changes have been made.*
