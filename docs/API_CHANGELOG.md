# Shhh — API Changelog

> **Purpose:** Track breaking changes and deprecations for API consumers (mobile, admin).  
> **Format:** [Keep a Changelog](https://keepachangelog.com/).

---

## [Unreleased]

_No unreleased changes._

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
