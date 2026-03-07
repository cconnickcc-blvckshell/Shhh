# Shhh — Master Roadmap

> **Purpose:** Single reference for planned work: Me section, game-changers, admin dashboard.  
> **Last updated:** March 2026

---

## Table of Contents

1. [Me Section Improvements](#1-me-section-improvements)
2. [Admin Dashboard Enhancements](#2-admin-dashboard-enhancements)
3. [Game-Changer Ideas](#3-game-changer-ideas)
4. [Implementation Status Summary](#4-implementation-status-summary)

---

## 1. Me Section Improvements

**Source:** `docs/archive/ME_SECTION_IMPROVEMENTS.md`

### Completed

- SubPageHeader, SectionLabel, PageShell, PremiumDarkBackground, SafeState
- Card, ContentColumn on status, privacy, emergency
- Album: Add photo, albumsApi.addMedia
- Profile menu: Single Venues entry
- Hosting: Edit button → event-edit
- Subscription: Friendly "Stripe not configured" message
- Most sub-pages upgraded (hosting, venues, couple, verify, groups, content/guides, content/norms)

### Pending

| Item | Phase |
|------|-------|
| Typography tokens (fontSize.lg) | Phase 2 |
| Edit Profile: Card for sections, User ID + Copy | Phase 3 |
| ~~Character count for bio~~ | ✅ Done (Wave 1) |
| ~~Unsaved changes warning~~ | ✅ Done (Wave 1) |
| ~~Success toast on save~~ | ✅ Done (Wave 1) |
| ~~Create venue: Location picker~~ | ✅ Done (Wave 4) |
| ~~Create/Edit event: Date/time pickers~~ | ✅ Done (Wave 4) |
| Verification: Tier 2 ID flow | Phase 4 |
| Supabase photo buckets | Phase 6 — see `docs/archive/SUPABASE_PHOTO_BUCKETS.md` |

---

## 2. Admin Dashboard Enhancements

**Source:** `docs/archive/ADMIN_DASHBOARD_FUTURE_PLAN.md`

### Completed

- Military command map (Leaflet, heatmap, user dots)
- Moderation Kanban (reports + mod queue, drag-to-resolve)
- Revenue sparkline (MRR, 30-day chart)
- Status bar + live KPIs
- Keyboard shortcuts (R, 1-9, M, D)
- Skeleton loaders
- Neon glassmorphism design

### Planned

| Item | Description |
|------|-------------|
| 3D Globe | Online users as lights; heat layers, time-of-day filter |
| Marble Drop | Signup visualization — ball drops per signup |
| Admin Control | Feature flags, content, rate limits — control without code |
| Live activity feed | Real-time events in command center |

---

## 3. Game-Changer Ideas

**Source:** `docs/archive/GAME_CHANGER_ROADMAP.md`

Prioritized backlog of high-impact ideas. Key themes:

| Theme | Examples |
|-------|----------|
| Venues as heart | Tonight feed, venue vibe/theme nights, venue-issued passes |
| Discovery & presence | Discovery cap, presence decay tuning |
| Monetization | Subscription tiers, discovery cap for free vs premium |
| Safety | Panic improvements, check-in alerts |

**Before building:** Read ARCHITECTURE, DEV_HANDOVER, extend existing modules — do not duplicate.

---

## 4. Implementation Status Summary

| Area | Done | Pending |
|------|------|---------|
| Me section | Layout, design system, most sub-pages, bio char count, unsaved warning, success toast | Edit Profile Card sections, location picker, date pickers, Tier 2 ID |
| Admin dashboard | Map, Kanban, sparkline, status bar, shortcuts, design | 3D globe, marble drop, Admin Control |
| Game-changers | — | Tonight feed, venue themes, discovery cap, etc. |
| Polish (IMPROVEMENTS_LEDGER) | Wave 1–8: + User ID+Copy, Card sections, privacy cues, Markdown in Guides/Norms | See IMPROVEMENTS_LEDGER "What Remains" |

**Related docs:** `docs/IMPROVEMENTS_LEDGER.md` (full ledger with feasibility/impact/effort), `docs/archive/MASTER_IMPLEMENTATION_CHECKLIST.md`, `docs/archive/E2E_CAPABILITY_AUDIT_REPORT.md`, `docs/archive/CSUITE_MASTER_AUDIT_REPORT.md`
