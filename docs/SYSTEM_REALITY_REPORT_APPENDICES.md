# Shhh System Reality Report — Appendices (CTO Audit)

This document extends `SYSTEM_REALITY_REPORT.md` with exhaustive reference material. Cite both when presenting to the CTO.

> **Enhancement work:** When adding or changing routes, update **Appendix A** (route matrix). See **docs/ENHANCEMENT_ROADMAP.md** and **docs/README.md** for doc sync checklist.

---

## Appendix A: Complete API Route & Auth Matrix

Every v1 route with method, path, auth, tier/role, and source file. Single source of truth for "does this endpoint exist and who can call it."

| Method | Path (under /v1) | Auth | Tier | Role | Source file |
|--------|------------------|------|------|------|-------------|
| POST | auth/register | No | — | — | auth/auth.routes.ts |
| POST | auth/login | No | — | — | auth/auth.routes.ts |
| POST | auth/refresh | No | — | — | auth/auth.routes.ts |
| DELETE | auth/logout | Yes | 0 | — | auth/auth.routes.ts |
| POST | auth/phone/send-code | No (rate-limited) | — | — | auth/auth.routes.ts |
| POST | auth/phone/verify | No (rate-limited) | — | — | auth/auth.routes.ts |
| POST | auth/push-token | Yes | 0 | — | auth/auth.routes.ts |
| GET | users/me | Yes | 0 | — | users/users.routes.ts |
| PUT | users/me | Yes | 0 | — | users/users.routes.ts |
| GET | users/:id/profile | Yes | 0 | — | users/users.routes.ts |
| POST | users/:id/like | Yes | 1 | — | users/users.routes.ts |
| POST | users/:id/pass | Yes | 0 | — | users/users.routes.ts |
| POST | users/:id/block | Yes | 0 | — | users/users.routes.ts |
| POST | users/:id/report | Yes | 0 | — | users/users.routes.ts |
| GET | users/:userId/trust-score | Yes | 0 | — | app.ts (inline) |
| GET | discover | Yes | 0 | — | discovery/discovery.routes.ts |
| POST | discover/location | Yes | 0 | — | discovery/discovery.routes.ts |
| GET | conversations | Yes | 0 | — | messaging/messaging.routes.ts |
| POST | conversations | Yes | 1 | — | messaging/messaging.routes.ts |
| GET | conversations/:id/messages | Yes | 0 | — | messaging/messaging.routes.ts |
| POST | conversations/:id/messages | Yes | 0 | — | messaging/messaging.routes.ts |
| PUT | conversations/:id/retention | Yes | 0 | — | messaging/messaging.routes.ts |
| POST | conversations/session | Yes | 0 | — | messaging/session.routes.ts |
| POST | conversations/:id/consent | Yes | 0 | — | messaging/session.routes.ts |
| POST | conversations/panic-wipe | Yes | 0 | — | messaging/session.routes.ts |
| POST | presence/state | Yes | 0 | — | discovery/presence.routes.ts |
| GET | presence/me | Yes | 0 | — | discovery/presence.routes.ts |
| POST | presence/reaffirm | Yes | 0 | — | discovery/presence.routes.ts |
| DELETE | presence/me | Yes | 0 | — | discovery/presence.routes.ts |
| GET | presence/venue/:venueId | Yes | 0 | — | discovery/presence.routes.ts |
| GET | personas | Yes | 0 | — | users/persona.routes.ts |
| GET | personas/active | Yes | 0 | — | users/persona.routes.ts |
| POST | personas | Yes | 0 | — | users/persona.routes.ts |
| POST | personas/:id/activate | Yes | 0 | — | users/persona.routes.ts |
| PUT | personas/:id | Yes | 0 | — | users/persona.routes.ts |
| DELETE | personas/:id | Yes | 0 | — | users/persona.routes.ts |
| GET | intents | Yes | 0 | — | users/intent.routes.ts |
| POST | intents | Yes | 0 | — | users/intent.routes.ts |
| DELETE | intents/:flag | Yes | 0 | — | users/intent.routes.ts |
| GET | preferences | Yes | 0 | — | users/preferences.routes.ts |
| PUT | preferences | Yes | 0 | — | users/preferences.routes.ts |
| PUT | photos/preference | Yes | 0 | — | users/blur.routes.ts |
| POST | photos/reveal | Yes | 0 | — | users/blur.routes.ts |
| DELETE | photos/reveal/:userId | Yes | 0 | — | users/blur.routes.ts |
| GET | photos/reveals | Yes | 0 | — | users/blur.routes.ts |
| GET | photos/check/:userId | Yes | 0 | — | users/blur.routes.ts |
| POST | whispers | Yes | 0 | — | discovery/whisper.routes.ts |
| GET | whispers/inbox | Yes | 0 | — | discovery/whisper.routes.ts |
| GET | whispers/sent | Yes | 0 | — | discovery/whisper.routes.ts |
| POST | whispers/:id/respond | Yes | 0 | — | discovery/whisper.routes.ts |
| POST | whispers/:id/seen | Yes | 0 | — | discovery/whisper.routes.ts |
| POST | whispers/:id/ignore | Yes | 0 | — | discovery/whisper.routes.ts |
| GET | ads/feed | Yes | 0 | — | ads/ad.routes.ts |
| GET | ads/chat | Yes | 0 | — | ads/ad.routes.ts |
| GET | ads/post-event | Yes | 0 | — | ads/ad.routes.ts |
| POST | ads/:id/impression | Yes | 0 | — | ads/ad.routes.ts |
| POST | ads/:id/tap | Yes | 0 | — | ads/ad.routes.ts |
| POST | ads/:id/dismiss | Yes | 0 | — | ads/ad.routes.ts |
| POST | ads/placements | Yes | 0 | — | ads/ad.routes.ts |
| GET | ads/placements/:id/stats | Yes | 0 | — | ads/ad.routes.ts |
| GET | venues/nearby | Yes | 0 | — | venues/venues.routes.ts |
| GET | venues/geofence-check | Yes | 0 | — | venues/venues.routes.ts |
| POST | venues | Yes | 2 | — | venues/venues.routes.ts |
| GET | venues/:id | Yes | 0 | — | venues/venues.routes.ts |
| PUT | venues/:id | Yes | 0 | — | venues/venues.routes.ts |
| PUT | venues/:id/verified-safe | Yes | 0 | — | venues/venues.routes.ts |
| POST | venues/:id/claim | Yes | 2 | — | venues/venue-identity.routes.ts |
| POST | venues/:id/announcements | Yes | 2 | — | venues/venue-identity.routes.ts |
| GET | venues/announcements/nearby | Yes | 0 | — | venues/venue-identity.routes.ts |
| POST | venues/:id/checkin | Yes | 0 | — | venues/venue-identity.routes.ts |
| POST | venues/:id/checkout | Yes | 0 | — | venues/venue-identity.routes.ts |
| GET | venues/:id/attendees | Yes | 0 | — | venues/venue-identity.routes.ts |
| GET | venues/:id/grid | Yes | 0 | — | venues/venue-identity.routes.ts |
| GET | venues/:id/stats | Yes | 0 | — | venues/venue-identity.routes.ts |
| POST | venues/:id/chat-rooms | Yes | 2 | — | venues/venue-identity.routes.ts |
| GET | venues/:id/chat-rooms | Yes | 0 | — | venues/venue-identity.routes.ts |
| GET | venues/:id/full | Yes | 0 | — | venues/venue-dashboard.routes.ts |
| GET | venues/:id/dashboard | Yes | 2 | — | venues/venue-dashboard.routes.ts |
| GET | venues/:id/analytics | Yes | 2 | — | venues/venue-dashboard.routes.ts |
| GET | venues/:id/trends | Yes | 2 | — | venues/venue-dashboard.routes.ts |
| PUT | venues/:id/profile | Yes | 2 | — | venues/venue-dashboard.routes.ts |
| GET | venues/:id/staff | Yes | 0 | — | venues/venue-dashboard.routes.ts |
| POST | venues/:id/staff | Yes | 2 | — | venues/venue-dashboard.routes.ts |
| DELETE | venues/:id/staff/:staffId | Yes | 2 | — | venues/venue-dashboard.routes.ts |
| GET | venues/:id/reviews | Yes | 0 | — | venues/venue-dashboard.routes.ts |
| POST | venues/:id/reviews | Yes | 0 | — | venues/venue-dashboard.routes.ts |
| GET | venues/:id/specials | Yes | 0 | — | venues/venue-dashboard.routes.ts |
| POST | venues/:id/specials | Yes | 2 | — | venues/venue-dashboard.routes.ts |
| GET | tonight | Yes | 0 | — | tonight/tonight.routes.ts |
| GET | events/nearby | Yes | 0 | — | events/events.routes.ts |
| POST | events | Yes | 2 | — | events/events.routes.ts |
| GET | events/:id | Yes | 0 | — | events/events.routes.ts |
| GET | events/:id/attendees | Yes | 0 | — | events/events.routes.ts |
| GET | events/:id/chat-rooms | Yes | 0 | — | events/events.routes.ts |
| POST | events/:id/rsvp | Yes | 0 | — | events/events.routes.ts |
| POST | events/:id/checkin | Yes | 0 | — | events/events.routes.ts |
| GET | safety/contacts | Yes | 0 | — | safety/safety.routes.ts |
| POST | safety/contacts | Yes | 0 | — | safety/safety.routes.ts |
| DELETE | safety/contacts/:id | Yes | 0 | — | safety/safety.routes.ts |
| POST | safety/checkin | Yes | 0 | — | safety/safety.routes.ts |
| POST | safety/panic | Yes | 0 | — | safety/safety.routes.ts |
| POST | safety/screenshot | Yes | 0 | — | safety/safety.routes.ts |
| POST | safety/venue-distress | Yes | 0 | — | safety/safety.routes.ts |
| POST | compliance/data-export | Yes | 0 | — | compliance/compliance.routes.ts |
| DELETE | compliance/account-deletion | Yes | 0 | — | compliance/compliance.routes.ts |
| POST | compliance/consent | Yes | 0 | — | compliance/compliance.routes.ts |
| POST | compliance/consent/withdraw | Yes | 0 | — | compliance/compliance.routes.ts |
| POST | media/upload | Yes | 0 | — | media/media.routes.ts |
| POST | media/upload/self-destruct | Yes | 0 | — | media/media.routes.ts |
| GET | media/my | Yes | 0 | — | media/media.routes.ts |
| GET | media/:id | Yes | 0 | — | media/media.routes.ts |
| DELETE | media/:id | Yes | 0 | — | media/media.routes.ts |
| POST | media/:id/view | Yes | 0 | — | media/media.routes.ts |
| POST | media/albums | Yes | 0 | — | media/media.routes.ts |
| GET | media/albums/my | Yes | 0 | — | media/media.routes.ts |
| GET | media/albums/shared | Yes | 0 | — | media/media.routes.ts |
| GET | media/albums/:id | Yes | 0 | — | media/media.routes.ts |
| DELETE | media/albums/:id | Yes | 0 | — | media/media.routes.ts |
| POST | media/albums/:id/media | Yes | 0 | — | media/media.routes.ts |
| DELETE | media/albums/:id/media/:mediaId | Yes | 0 | — | media/media.routes.ts |
| POST | media/albums/:id/share | Yes | 0 | — | media/media.routes.ts |
| DELETE | media/albums/:id/share/:userId | Yes | 0 | — | media/media.routes.ts |
| POST | e2ee/keys/register | Yes | 0 | — | messaging/e2ee.routes.ts |
| GET | e2ee/keys/:userId | Yes | 0 | — | messaging/e2ee.routes.ts |
| GET | e2ee/keys/:userId/bundle | Yes | 0 | — | messaging/e2ee.routes.ts |
| POST | e2ee/keys/prekeys | Yes | 0 | — | messaging/e2ee.routes.ts |
| POST | e2ee/keys/conversation | Yes | 0 | — | messaging/e2ee.routes.ts |
| GET | e2ee/keys/conversation/:conversationId | Yes | 0 | — | messaging/e2ee.routes.ts |
| GET | billing/tiers | No | — | — | billing/billing.routes.ts |
| GET | billing/subscription | Yes | 0 | — | billing/billing.routes.ts |
| POST | billing/checkout | Yes | 0 | — | billing/billing.routes.ts |
| POST | billing/webhook | No | — | — | billing/billing.routes.ts (Stripe sig) |
| POST | couples | Yes | 0 | — | couples/couples.routes.ts |
| GET | couples/me | Yes | 0 | — | couples/couples.routes.ts |
| POST | couples/link | Yes | 0 | — | couples/couples.routes.ts |
| POST | couples/dissolve | Yes | 0 | — | couples/couples.routes.ts |
| POST | couples/confirm-dissolution | Yes | 0 | — | couples/couples.routes.ts |
| GET | verification/status | Yes | 0 | — | verification/verification.routes.ts |
| POST | verification/photo | Yes | 0 | — | verification/verification.routes.ts |
| POST | verification/id | Yes | 1 | — | verification/verification.routes.ts |
| POST | verification/:id/approve | Yes | 2 | — | verification/verification.routes.ts |
| POST | verification/:id/reject | Yes | 2 | — | verification/verification.routes.ts |
| POST | references | Yes | 2 | — | references/references.routes.ts |
| GET | references/:userId | Yes | 0 | — | references/references.routes.ts |
| GET | admin/stats | Yes | — | moderator | admin/admin.routes.ts |
| GET | admin/moderation | Yes | — | moderator | admin/admin.routes.ts |
| GET | admin/reports | Yes | — | moderator | admin/admin.routes.ts |
| POST | admin/reports/:id/resolve | Yes | — | moderator | admin/admin.routes.ts |
| GET | admin/users/:userId | Yes | — | moderator | admin/admin.routes.ts |
| POST | admin/users/:userId/ban | Yes | — | admin | admin/admin.routes.ts |
| POST | admin/users/:userId/trust-score | Yes | — | moderator | admin/admin.routes.ts |
| GET | admin/audit-logs | Yes | — | moderator | admin/admin.routes.ts |
| GET | admin/overview | Yes | — | moderator | admin/admin-extended.routes.ts |
| GET | admin/revenue | Yes | — | moderator | admin/admin-extended.routes.ts |
| GET | admin/revenue/history | Yes | — | moderator | admin/admin-extended.routes.ts |
| GET | admin/users/list | Yes | — | moderator | admin/admin-extended.routes.ts |
| GET | admin/users/search | Yes | — | moderator | admin/admin-extended.routes.ts |
| POST | admin/users/:userId/role | Yes | — | admin | admin/admin-extended.routes.ts |
| POST | admin/users/:userId/toggle-active | Yes | — | admin | admin/admin-extended.routes.ts |
| POST | admin/users/:userId/set-tier | Yes | — | admin | admin/admin-extended.routes.ts |
| GET | admin/venues/list | Yes | — | moderator | admin/admin-extended.routes.ts |
| GET | admin/ads/list | Yes | — | moderator | admin/admin-extended.routes.ts |
| POST | admin/ads/:id/toggle | Yes | — | moderator | admin/admin-extended.routes.ts |
| GET | admin/events/list | Yes | — | moderator | admin/admin-extended.routes.ts |
| GET | admin/safety/alerts | Yes | — | moderator | admin/admin-extended.routes.ts |
| GET | admin/settings/ads | Yes | — | moderator | admin/admin-extended.routes.ts |
| PUT | admin/settings/ads/:id | Yes | — | admin | admin/admin-extended.routes.ts |

Static: `GET /health`, `GET /docs`, `GET /docs.json`, `GET /uploads/*` (express.static). No auth on health, docs, billing/webhook (webhook validated by Stripe signature).

---

## Appendix B: Schema & Migration Summary

| Migration | File | Tables added / key changes |
|-----------|------|----------------------------|
| 001 | `001_initial.sql` | users, refresh_tokens, couples, user_profiles, locations (PostGIS), verifications, user_references, blocks, venues, events, event_rsvps, conversations, conversation_participants, user_interactions, reports, audit_logs, consent_records, data_deletion_requests; PostGIS + uuid extensions; idx_locations_geom GIST |
| 002 | `002_couples_verification_safety.sql` | trust_scores, emergency_contacts, safety_checkins, geofences, moderation_queue, content_flags; couples dissolution columns |
| 003 | `003_media_albums.sql` | media, albums, album_media, album_shares, media_view_tracking; idx_media_expires |
| 004 | `004_push_tokens.sql` | push_tokens |
| 005 | `005_presence_personas_venue_identity.sql` | presence, personas, intent_flags, venue_accounts, venue_announcements, venue_checkins, venue_chat_rooms, photo_reveals, subscriptions, screenshot_events; session columns on conversations; blur_photos on user_profiles |
| 006 | `006_e2ee_keys.sql` | user_keys, prekey_bundles, conversation_keys |
| 007 | `007_whispers_onboarding_shield.sql` | whispers; onboarding columns on users; event lifecycle columns |
| 008 | `008_ads_venue_overhaul.sql` | ad_placements, ad_impressions, ad_cadence_rules, ad_controls; venue_analytics, venue_staff, venue_reviews, venue_specials; venue profile columns |
| 009 | `009_admin_rbac_phone_pepper.sql` | role on users; admin_actions table; phone_hash comment HMAC |
| 010 | `010_bidirectional_preferences.sql` | Bidirectional preferences / show_as fields |

**Critical schema notes:**  
- `data_deletion_requests`: no application code updates status or triggers user deletion.  
- `screenshot_events`: table exists; no INSERT path in API (screenshot route missing).  
- `safety_checkins.alert_sent`: set true only for panic; no worker sets it for missed check-ins.  
- MongoDB: single collection `messages`; TTL index on `expiresAt`.

---

## Appendix C: Threat Model & Abuse Vectors

| Threat | Mitigation in code | Gap | Evidence |
|--------|--------------------|-----|----------|
| Phone enumeration | Phone hashed (HMAC); rate limit on send-code | Per-IP only; no per-phone global cap beyond OTP Redis | otp.service.ts; rateLimiter.ts |
| Token theft | Refresh rotation; hash in DB | Access token in localStorage (web) | auth.service.ts; mobile auth.ts |
| Privilege escalation | requireTier, requireRole | Trust-score route wrong param; some PUTs lack owner check | app.ts line 121; venues.routes.ts |
| Message interception | E2EE keys server-side | Messages plaintext; no client E2EE | message.model.ts; mobile |
| Discovery scraping | Auth; 30s cache | No per-user rate limit; 100 km radius | discovery.service.ts |
| Whisper spam | Service pending cap | No global rate limit on POST /whispers | whisper.service.ts |
| Malicious upload | Multer 20MB | No magic-bytes or extension allowlist | media.routes.ts |
| Admin abuse | logAdminAction | No quorum; no appeal | adminAuth.ts; admin.routes.ts |
| GDPR | Export; deletion request | Deletion never executed | compliance.service.ts |
| Panic false assurance | DB + audit | No SMS/push; misleading message | safety.service.ts panic() |
| Screenshot trust | Table exists | 404; user told "notified" | useScreenshotDetection.ts |

---

## Appendix D: Evidence Appendix (Critical Bugs)

**Bug 1: Trust-score route param**  
- File: `backend/src/app.ts` lines 119–122  
- Code: `trustSvc.getScore(req.params.id as string || req.params.userId as string)`  
- Issue: Route is `GET /v1/users/:userId/trust-score`. Express gives `req.params.userId`, not `req.params.id`. Fix: use only `req.params.userId`.

**Bug 2: Account deletion never runs**  
- File: `backend/src/modules/compliance/compliance.service.ts` lines 41–54  
- Gap: No consumer of `data_deletion_requests`; no worker sets `users.deleted_at`. Seam: New worker that processes pending requests and performs purge.

**Bug 3: Screenshot endpoint missing**  
- Mobile: `mobile/src/hooks/useScreenshotDetection.ts` line 21 calls `POST /v1/safety/screenshot`  
- Backend: `backend/src/modules/safety/safety.routes.ts` has no such route. Seam: Add route and controller/service that insert into `screenshot_events`.

**Bug 4: Panic "contacts notified"**  
- File: `backend/src/modules/safety/safety.service.ts` lines 51–73  
- Gap: Returns contactsNotified and "Panic alert sent" but no Twilio/push. Seam: Implement notify or change copy.

---

## Appendix E: Mobile Screen × API Coverage

| Screen | APIs used | Gap |
|--------|-----------|-----|
| (auth)/index | sendOTP, login | — |
| (auth)/verify-code | phone/verify, login or register | — |
| (tabs)/index | discoverApi.nearby, updateLocation; ads feed/impression/tap/dismiss | — |
| (tabs)/messages | getConversations | — |
| (tabs)/events | eventsApi.nearby | — |
| chat/[id] | getMessages, sendMessage; useSocket; **useScreenshotDetection → 404** | Screenshot only |
| user/[id] | getMe; like, pass, block, report | — |
| Safety | safetyApi contacts/checkin/panic; useDistressGesture | — |
| Whispers, Albums, Subscription, venue/[id] | Corresponding APIs | — |

---

## Appendix F: GDPR/CCPA Compliance Mapping

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Art. 15 Access | Working | requestDataExport; POST /compliance/data-export |
| Art. 17 Erasure | Stub | Request only; no processor |
| Art. 20 Portability | Working | Export includes profile, messages, interactions, conversations, audit, consent |
| Consent Art. 7 | Working | recordConsent, withdrawConsent |
| Data minimisation | Working | Hash only; audit ip_hash, user_agent_hash |
| Retention | Partial | Message TTL; no audit purge; no deletion processing |
| Breach procedure | Missing | N/A |

---

## Appendix G: Runbook & Operational Readiness

| Task | Command / location | Status |
|------|--------------------|--------|
| Start infra | `docker compose up -d` | Working |
| Migrations | `cd backend && npm run migrate` | Working |
| Seed | `cd backend && npm run seed` | Working |
| Backend | `cd backend && npm run dev` | Working |
| Admin | `cd admin-dashboard && npm run dev` | Working |
| Mobile web | `cd mobile && npx expo start --web` | Working |
| Health | `GET /health` | Working |
| Tests | `cd backend && npm test` | Jest; needs Docker |
| Load smoke | `k6 run loadtest/smoke.js` | loadtest/smoke.js |
| Process deletion | — | **NOT IMPLEMENTED** |
| Panic notify | — | **NOT IMPLEMENTED** |
| Screenshot report | — | **NOT IMPLEMENTED** (404) |

---

## Appendix H: Dependencies & Known Risks

| Package | Version | Risk |
|---------|---------|------|
| express | ^4.21.0 | Stable |
| pg | ^8.13.0 | PostGIS lng/lat order |
| ioredis | ^5.4.1 | Eviction allkeys-lru; use noeviction for auth |
| mongoose | ^8.7.0 | authSource=admin required |
| socket.io | ^4.8.0 | CORS '*' in prod |
| stripe | ^20.4.0 | Webhook raw body |
| bullmq | ^5.70.1 | No retry in workers |
| tweetnacl | ^1.0.3 | E2EE server only; client not wired |

---

## Appendix I: How to Reproduce Critical Failures

1. **Trust-score:** GET /v1/users/<uuid>/trust-score with Bearer token; unit test with params.userId only.  
2. **Screenshot 404:** curl POST /v1/safety/screenshot with auth → 404; or trigger screenshot in chat screen.  
3. **Deletion:** DELETE /v1/compliance/account-deletion; query data_deletion_requests and users.deleted_at — no change.  
4. **Panic:** POST /v1/safety/panic; response says contacts notified; no Twilio/push called.  
5. **Redis eviction:** Fill Redis; send OTP; verify can fail if otp key evicted.
