# Shhh — API Changelog

> **Purpose:** Track breaking changes and deprecations for API consumers (mobile, admin).  
> **Format:** [Keep a Changelog](https://keepachangelog.com/).

---

## [Unreleased]

### Added

- `PUT /v1/events/:id` — Update event (host only; title, description, venue, series, times, capacity, vibe, visibility)
- OAuth sign-in: `POST /v1/auth/oauth/apple`, `POST /v1/auth/oauth/google`, `POST /v1/auth/oauth/snap` (idToken for Apple/Google, authCode for Snapchat)
- OTP session token: `POST /v1/auth/phone/verify` returns `sessionToken`; register/login require it in production
- PWA: `manifest.json`, theme-color meta, Add to Home Screen support for web build
- Target stack: Supabase (PostgreSQL + PostGIS), Redis, MongoDB — see `docs/SUPABASE_REDIS_MONGO_SETUP.md`

---

## [1.0.0] — 2026-02

### Added

- Full v1 REST API (see `docs/ARCHITECTURE.md` §4)
- WebSocket (Socket.io) for real-time messaging, typing, read receipts
- OTP auth: `POST /v1/auth/phone/send-code`, `POST /v1/auth/phone/verify`
- Discovery, presence, personas, intents, preferences
- Whispers, venues, events, groups, stories, tonight feed
- Media, albums, share/revoke
- Ads (feed, chat, post-event, placements)
- Billing (Stripe)
- Safety (contacts, check-in, panic, screenshot, venue-distress)
- Compliance (data export, deletion request, consent)
- Admin (moderation, reports, users, venues, ads, events, safety, audit)

### Notes

- All routes under `/v1/`. No versioning beyond path prefix.
- Swagger UI at `/docs`, raw spec at `/docs.json`.
- No formal deprecation policy yet; breaking changes will be documented here.

---

## Changelog Conventions

When making breaking changes:

1. Add entry under `[Unreleased]` with `### Breaking` or `### Deprecated`
2. Describe old vs new behavior
3. Suggest migration path (e.g. "Use `GET /v1/personas` instead of `GET /v1/personas/me`")
4. On release, move to dated version and clear `[Unreleased]`
