# Admin Dashboard — Future Enhancement Plan

**Status:** Living document — some items implemented, others planned  
**Last updated:** March 2026  
**Current spec:** See **docs/UX_UI_SPEC.md** §4 for full admin dashboard documentation (all pages, StatusBar, shortcuts, design system).

---

## Overview

This document captures ideas for enhancing the admin dashboard with richer visualizations, real-time feedback, and a more engaging operator experience. It also includes **Admin Control** features — configurable settings that let operators control the app without code changes. Items are organized by concept, with implementation notes and suggested phasing.

---

## Implementation Status (Completed)

| Item | Status | Notes |
|------|--------|-------|
| Military command map | ✅ Done | Leaflet + CartoDB Dark Matter, heatmap, user dots, `/map` |
| Moderation Kanban | ✅ Done | Reports + mod queue columns, drag-to-resolve, `/moderation` |
| Revenue sparkline | ✅ Done | MRR card sparkline + 30-day bar chart on Revenue page |
| Status bar + live KPIs | ✅ Done | Top bar: Online, Panic, Reports, Mod; auto-refresh 60s |
| Keyboard shortcuts | ✅ Done | R refresh, 1-9 nav, M map, D dashboard |
| Skeleton loaders | ✅ Done | Cards + table skeletons replace spinners |
| Neon glassmorphism design | ✅ Done | Theme, GlassCard, GlassButton, Layout redesign |

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

## 3. Military Command Console — Neon World Map

### Concept

A large, full-screen world map styled like a military command center: dark base, neon accents (green/cyan/magenta), scan-line or grid overlays. Interactive: see where users are, hot vs dead cities, expansion reach, and growth over time.

### Refinements

- **Hot vs dead cities:** Heatmap or density clustering — bright neon = active users; dim/gray = low or no activity.
- **Expansion reach:** Time-lapse or slider: "users by week" to see how coverage grows.
- **User dots:** Neon pins or pulses at user locations; click for user card.
- **City labels:** Neon-styled labels for major cities; intensity reflects activity.
- **Scan lines / grid:** Optional overlay for that CRT/command-center feel.
- **Zoom/pan:** Smooth, responsive; full-screen or large panel.

### Free Assets & Libraries

| Asset | License | Notes |
|-------|---------|------|
| **Leaflet** | BSD-2-Clause | Core map library; lightweight, no API key needed. |
| **Leaflet.heat** | BSD-2-Clause | Heatmap layer for hot-city density; works with dark tiles. |
| **CartoDB Dark Matter** | Free | Dark tiles: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png` — no key. |
| **Maps.black** | Open | Multiple dark tile styles; no auth. |
| **svgMap** | MIT | Country-level SVG map; good for choropleth by country. |
| **react-globe.gl** | MIT | 3D globe (Three.js); can be styled dark + neon. |
| **Mapbox Dark** | Free tier | `mapbox/dark-v10`; requires API key. |
| **darkly-neon** (GitHub) | Open | Mapbox Studio style for neon-on-dark; requires Mapbox. |

### Neon Styling (No Extra Assets)

- **CSS:** `box-shadow`, `text-shadow`, `filter: drop-shadow()` for glow.
- **Canvas/SVG:** Draw markers and lines with neon colors (`#00ff88`, `#00ffff`, `#ff00ff`).
- **Overlay:** Semi-transparent grid or scan-line div over the map.

### Data Requirements

- Same as 3D Globe: `GET /v1/admin/presence/geo` for live user locations.
- Aggregated by city: `GET /v1/admin/stats/cities` with `{ city, lat, lng, activeCount, newThisWeek }` for hot/dead and expansion.

### Recommended Approach

1. **Leaflet + CartoDB Dark Matter** — free, no API key, dark base.
2. **Custom neon markers** — CSS glow + colored circles for user density.
3. **Heatmap layer** — Leaflet.heat or similar for hot-city visualization.
4. **Optional:** Swap to Mapbox + darkly-neon if you want a more polished neon base and have a Mapbox key.

---

## 4. Additional Dashboard Ideas

| Idea | Description | Status |
|------|-------------|--------|
| **Pulse / Heartbeat** | One big "heartbeat" line that pulses with real-time activity (messages, discoveries, signups). | Planned |
| **Conversation Rivers** | Streams of messages flowing between regions or user clusters. | Planned |
| **Tier Funnel** | Funnel chart: signup → verified → premium, with drop-off rates. | Planned |
| **Trust Score Distribution** | Histogram or curve of trust scores; flag outliers. | Planned |
| **Moderation Queue** | Kanban of reports/photos; drag to approve/reject. | ✅ Done |
| **Live Activity Feed** | Scrolling feed of recent actions (signup, message, panic, distress). | Planned |
| **Session Duration** | Distribution of session lengths; "stickiness" over time. | Planned |
| **Geographic Growth** | Map of "new users this week" by region. | Planned |
| **Retention Cohorts** | D1/D7 retention by signup cohort. | Planned |
| **Safety Dashboard** | Panic, distress, reports over time; response times. | Planned |
| **Revenue Sparkline** | Revenue over time with MRR and churn. | ✅ Done |
| **Dark Mode Toggle** | Simple theme switch for long admin sessions. | Planned |

---

## 5. Suggested Phasing

### Phase 1 — Quick Wins

- Live activity feed
- Signup marble drop (or simpler "counter + animation")
- ~~Basic geographic dots on a 2D map~~ ✅ (Map page)
- ~~**Military command map:** Leaflet + CartoDB Dark Matter + neon markers (hot/dead cities)~~ ✅
- ~~Moderation queue Kanban~~ ✅
- ~~Revenue sparkline~~ ✅

### Phase 2 — Deeper

- Full 3D globe with clustering and click-through
- Command console map: heatmap layer, expansion time-lapse, scan-line overlay
- Tier funnel and retention cohorts
- Admin Control: feature flags, content blocks (see §8)

### Phase 3 — Polish

- Sound and milestone animations
- Heat layers and time-of-day filters
- Pulse/heartbeat visualization
- Admin Control: rate limits, maintenance mode, announcements

---

## 6. Technical Considerations

- **Performance:** For 10k+ points, use clustering or sampling; avoid rendering every user as a separate mesh.
- **Privacy:** Aggregate or anonymize; avoid exposing exact locations in the UI.
- **Real-time:** WebSockets or short-interval polling for live updates.
- **Fallback:** Ensure the dashboard works without WebGL (e.g. 2D map + counters).

---

## 7. Recommended First Step

Start with: **marble drop + live activity feed + simple 2D map**, then evolve into the 3D globe and more advanced visualizations.

---

## 8. Admin Control — App Configuration Without Code

Operators should control the app through the dashboard instead of editing code or env vars. Below are controls to add.

### 8.1 Feature Flags & Toggles

| Control | Purpose | Where Today |
|---------|---------|-------------|
| Discovery cap (free/premium) | Change caps without deploy | Config/env |
| Premium features | Toggle premium features on/off | Hardcoded |
| OAuth providers | Enable/disable Apple, Google, Snap | Env |
| Whispers | Enable/disable whispers | Config |
| Verification required | Require verification for discovery | Config |

**Implementation:** `feature_flags` table (`key`, `enabled`, `value_json`). Admin UI toggles; backend reads from DB.

### 8.2 Content Management

| Control | Purpose |
|---------|---------|
| Community guides | Edit `/content/guides` text |
| Community norms | Edit `/content/norms` |
| Onboarding copy | Edit onboarding steps |
| FAQ / help | Edit help content |
| Landing page | Edit hero, features, CTA |
| Error messages | Customize common error messages |

**Implementation:** `content_blocks` table (`slug`, `title`, `body`, `updated_at`). Admin UI to edit; API serves from DB.

### 8.3 Rate Limits & Throttling

| Control | Purpose |
|---------|---------|
| Discovery rate limit | Per-user or global discovery limit |
| Auth rate limit | OTP send limit (e.g. 5/15min) |
| API rate limits | Per-endpoint limits |
| Signup rate limit | Limit signups per IP/hour |

**Implementation:** Store in DB or Redis. Admin UI to set; backend reads at runtime.

### 8.4 Announcements & Maintenance

| Control | Purpose |
|---------|---------|
| Platform announcement | Banner or modal for all users |
| Maintenance mode | Show "We'll be back soon" and block writes |
| Scheduled maintenance | Start/end time and message |

**Implementation:** `announcements` table. Maintenance flag in DB or Redis; backend checks before handling writes.

### 8.5 Geo & Discovery

| Control | Purpose |
|---------|---------|
| Default discovery radius | Default km for nearby |
| Max discovery radius | Upper limit |
| Min/max age filters | Default or limits for age filters |
| Supported cities/regions | Restrict to certain areas |

**Implementation:** `geo_config` or similar. Admin UI to edit; discovery service reads from DB/config.

### 8.6 Ad Controls (Extend Existing)

| Control | Purpose |
|---------|---------|
| CPM by surface | Per-surface pricing |
| Cadence rules | Max per 24h, min gap |
| Per-venue approval | Approve venues for ads |
| Budget caps | Per-placement or global caps |

**Implementation:** Extend `ad_controls` and related tables; add admin UI for these fields.

### 8.7 User & Safety

| Control | Purpose |
|---------|---------|
| Auto-ban rules | Ban after N reports or trust score |
| Trust score thresholds | What defines "trusted" |
| Verification auto-approve | Auto-approve under certain conditions |
| Bulk actions | Ban/export by filter |

**Implementation:** Rules in DB; worker or middleware applies. Admin UI to configure.

### 8.8 Venue & Events

| Control | Purpose |
|---------|---------|
| Venue claim approval | Approve/reject claims |
| Event featuring | Feature events in discovery |
| Event visibility | Hide/show events |
| Default venue tier | Default tier for new venues |

**Implementation:** Add approval workflow and "featured"/"hidden" flags; admin UI to manage.

### 8.9 Integrations & Webhooks

| Control | Purpose |
|---------|---------|
| Webhook URLs | Configure endpoints |
| Retry policy | Retries, backoff |
| Stripe test/live | Switch mode (with care) |

**Implementation:** Store URLs and config in DB; never store raw secrets in admin UI.

### 8.10 Operational

| Control | Purpose |
|---------|---------|
| Cache invalidation | Clear Redis keys (e.g. discovery cache) |
| Trigger jobs | Run presence decay, etc. |
| Export data | Export users, reports, etc. |
| Audit log filters | Search/filter audit log |

### 8.11 Suggested Priority for Admin Control

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| P0 | Feature flags | Medium | High |
| P0 | Content blocks (guides, norms) | Medium | High |
| P1 | Platform announcement | Low | Medium |
| P1 | Rate limit overrides | Low | Medium |
| P1 | Maintenance mode | Low | High when needed |
| P2 | Geo config (radius, etc.) | Medium | Medium |
| P2 | Venue claim approval | Medium | Medium |
| P2 | Ad cadence/CPM UI | Medium | Medium |
| P3 | Auto-ban rules | High | Medium |
| P3 | Cache invalidation | Low | Low |

### 8.12 Quick Wins

1. **Feature flags** — DB table + admin UI; backend checks flags before enabling features.
2. **Content blocks** — DB table for guides/norms; API reads from DB instead of static content.
3. **Announcement banner** — One row in DB; mobile app shows it when present.
4. **Maintenance mode** — Single flag; backend returns 503 and a message when set.

---

*Items marked ✅ in Implementation Status are done. Admin Control items are planned.*
