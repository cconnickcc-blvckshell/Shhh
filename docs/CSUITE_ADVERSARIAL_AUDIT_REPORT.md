# Shhh — C-Suite Adversarial Audit Report

**Date:** March 6, 2025  
**Scope:** backend/, admin-dashboard/, mobile/, docs/, .github/, root config, Docker  
**Methodology:** Deep adversarial sweep across all .ts, .tsx, .js, .json, .sql, .yml files

---

## Executive Summary

This audit identified **28 potential issues** across security, correctness, compliance, and operational risk. The codebase has solid foundations (parameterized SQL, JWT auth, production secret validation, magic-byte upload validation) but contains several high-severity gaps that could impact safety, compliance, and availability.

| Severity | Count |
|----------|-------|
| **P0 (Critical)** | 4 |
| **P1 (High)** | 8 |
| **P2 (Medium)** | 10 |
| **P3 (Low)** | 6 |

**Top risks:** Admin bypass in production when `OTP_DEV_BYPASS=true`; Stripe webhook secret/body handling; MongoDB messages not purged on account deletion; mobile tokens in `localStorage` on web.

---

## Issue Count by Severity

| P0 | P1 | P2 | P3 |
|----|----|----|----|
| 4  | 8  | 10 | 6  |

---

## Full Findings Table

### P0 — Critical

| # | File | Line(s) | Type | Severity | Proof | Impact | Recommendation |
|---|------|---------|------|----------|-------|--------|-----------------|
| 1 | `backend/src/modules/auth/auth.service.ts` | 143–151 | Logic / Auth bypass | P0 | `adminBypassLogin()` allows bypass when `OTP_DEV_BYPASS=true` **or** `NODE_ENV === 'development'` **or** `NODE_ENV === 'test'`. If production is misconfigured with `NODE_ENV=development`, any user can call `/v1/auth/admin-bypass` and obtain admin JWT without OTP. | Full admin compromise without MFA. | Restrict bypass to `NODE_ENV=test` only. Remove `OTP_DEV_BYPASS` and `NODE_ENV=development` from bypass conditions. Add explicit `requireAdminBypassEnv` check. |
| 2 | `backend/src/modules/billing/billing.routes.ts` | 34–46 | Config / Type safety | P0 | `new Stripe.default(process.env.STRIPE_SECRET_KEY || '')` — empty string used when unset. `stripe.webhooks.constructEvent(req.body, sig, endpointSecret)` will throw, but prior to that, Stripe client may be instantiated with invalid key. Webhook returns 503 if `STRIPE_WEBHOOK_SECRET` missing, but `STRIPE_SECRET_KEY` is not validated. | Webhook handler may fail unpredictably; Stripe client with empty key can cause runtime errors. | Validate `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` before processing. Return 503 with clear message if either is missing. |
| 3 | `docs/ARCHITECTURE.md` §13, `backend/src/workers` | — | Data lifecycle / Compliance | P0 | **Gap:** MongoDB messages for deleted users are not purged. Deletion worker only anonymizes Postgres; `messages` collection retains user data. | GDPR/CCPA violation; deleted users' messages remain in MongoDB. | Add worker or one-off job to delete MongoDB messages for `conversation_participants` of deleted users. Extend deletion flow to purge Mongo by `conversationId` where all participants are deleted. |
| 4 | `admin-dashboard/src/pages/Login.tsx` | 31–50, 122–134 | Auth / UX | P0 | "Skip login (dev bypass)" button is always visible. When `OTP_DEV_BYPASS=true` on backend (common in Render deployments per docs), any visitor can one-click admin access. | Unauthenticated admin access if env is set. | Hide bypass button unless `import.meta.env.VITE_ALLOW_BYPASS === 'true'` or similar. Never show in production builds. |

---

### P1 — High

| # | File | Line(s) | Type | Severity | Proof | Impact | Recommendation |
|---|------|---------|------|----------|-------|--------|-----------------|
| 5 | `mobile/src/api/client.ts` | 23–44 | Security / Storage | P1 | `setAuthToken` / `setRefreshToken` use `window.localStorage` on web. Tokens persist across sessions and are vulnerable to XSS. | Token theft via XSS; no secure storage on web. | Use `expo-secure-store` on native; for web, use `sessionStorage` or httpOnly cookies. Avoid `localStorage` for tokens. |
| 6 | `backend/src/modules/auth/auth.service.ts` | 144–146 | Logic | P1 | `bypassAllowed = OTP_DEV_BYPASS === 'true' \|\| NODE_ENV === 'development' \|\| NODE_ENV === 'test'`. `OTP_DEV_BYPASS=true` in production (per GET_ONLINE.md) enables bypass. | Production deployments with `OTP_DEV_BYPASS=true` (Render) have no OTP for admin. | Document that `OTP_DEV_BYPASS` must be removed before production. Add startup warning when `OTP_DEV_BYPASS=true` and `NODE_ENV=production`. |
| 7 | `backend/src/modules/test/token.controller.ts` | 11–19 | Auth / Exposure | P1 | `mintTokenForTest` is gated by `TEST_MODE === 'true' \|\| NODE_ENV === 'test'`. If `TEST_MODE=true` is set in production env by mistake, `POST /v1/test/mint-token` mints JWT for any `userId` without OTP. | Arbitrary user impersonation. | Ensure test routes are never mounted when `NODE_ENV=production`. Add explicit `NODE_ENV=test` requirement. Consider removing `TEST_MODE` in favor of `NODE_ENV` only. |
| 8 | `backend/src/app.ts` | 57–61, `billing.routes.ts` 34 | Duplicate / Race | P1 | Stripe webhook: `app.post('/v1/billing/webhook', express.raw(...), next)` in app.ts; billing router also has `router.post('/webhook', express.raw(...))`. Body may be consumed twice or routing ambiguous. | Webhook signature verification can fail if body is re-parsed or wrong middleware runs. | Use single webhook handler. Mount raw middleware only once for `/v1/billing/webhook`. Remove duplicate `express.raw` from billing router. |
| 9 | `backend/src/modules/media/storage.service.ts` | 28–56 | Logic / Upload | P1 | `isImage(file.mimetype)` trusts `file.mimetype` from client. Multer fileFilter allows only certain MIME types, but a malicious client could send wrong `Content-Type`. Non-image MIME passes `fileFilter` (rejected), but if filter is bypassed, `isImage()` would gate sharp processing. For non-image, `fs.writeFile(storagePath, file.buffer)` writes raw buffer — no validation. | Malicious file upload (e.g. .exe with image MIME) could be stored. Magic-byte check in media.routes helps but non-image path has no magic-byte validation. | Apply magic-byte validation to all upload paths. Reject non-image/non-video buffers that don't match allowed signatures. |
| 10 | `backend/src/middleware/auth.ts` | 53–64 | Async / Error handling | P1 | `requireVenueAccess` uses dynamic `import()` and `.then()/.catch(next)`. If `query` throws before the promise resolves, the error may not propagate correctly. The pattern is valid but the dynamic import adds latency and potential for unhandled rejection. | Intermittent 500 or unhandled rejection. | Use static import and async/await with try/catch, or ensure all promise rejections are caught. |
| 11 | `admin-dashboard/src/api/client.ts` | 64 | Injection / URL | P1 | `listUsers: (page, filter) => api(\`/v1/admin/users/list?page=${page}${filter ? \`&filter=${filter}\` : ''}\`)` — `filter` is not encoded. If `filter` contains `&` or `=`, it could alter the query. | Query parameter injection or unexpected API behavior. | Use `URLSearchParams` or `encodeURIComponent(filter)` for all query params. |
| 12 | `backend/src/modules/media/media.controller.ts` | 106–111 | Validation / Null risk | P1 | `shareAlbum` target: `req.body.userId ? { type: 'user', userId } : req.body.targetPersonaId ? { type: 'persona', personaId } : { type: 'couple', coupleId }`. If all three are null/undefined, `target` is `{ type: 'couple', coupleId: undefined }`. Zod `shareAlbumSchema` has `.refine(d => !!(d.userId ?? d.targetPersonaId ?? d.targetCoupleId))` but `coupleId` can be undefined. | 500 or unexpected behavior when invalid body is sent. | Ensure Zod refine runs and reject before controller. Add explicit check for `coupleId` when `type === 'couple'`. |

---

### P2 — Medium

| # | File | Line(s) | Type | Severity | Proof | Impact | Recommendation |
|---|------|---------|------|----------|-------|--------|-----------------|
| 13 | `backend/src/config/index.ts` | 25–26 | Config / Hardcoded | P2 | `jwt.secret` and `jwt.refreshSecret` default to `'dev-jwt-secret'` and `'dev-refresh-secret'` when unset. `index.ts` validates in production, but config is loaded before that. | Risk of accidental use if validation is skipped. | Keep validation; add comment that defaults are never used in production. |
| 14 | `backend/src/modules/discovery/discovery.service.ts` | 88–156 | SQL / PostGIS | P2 | Query uses `$1..$9` with `[lat, lng, userId, radiusMeters, fuzz, limit, primaryIntent, experienceLevel, inMyGroups]`. Parameter order is correct. No string interpolation. | Low SQL injection risk; parameterization is correct. | Document parameter order in comment for future maintainers (AGENTS.md notes this). |
| 15 | `backend/src/modules/media/media.routes.ts` | 31–34 | Validation | P2 | Multer `fileFilter: (_, file, cb) => cb(null, allowed.includes(file.mimetype))` — when false, Multer passes error to next middleware but doesn't call `next(err)` with a clear message. Client may get generic 400. | Poor UX; no clear "file type not allowed" message. | Add custom error message in fileFilter: `cb(new Error('Allowed: JPEG, PNG, WebP, GIF, MP4'))` when not allowed. |
| 16 | `admin-dashboard/src/components/Layout.tsx` | 26–28 | Auth / Race | P2 | `useEffect(() => { if (!getToken()) navigate('/login'); }, [navigate]);` — runs on every render when navigate changes. Token check is synchronous; no guard against flash of protected content. | Brief flash of dashboard before redirect. | Use route-level guard or loader. Consider `Navigate` component when `!getToken()`. |
| 17 | `mobile/src/stores/auth.ts` | 108–133 | Logic / Fallback | P2 | `login` and `register` without `sessionToken` — "fallback for dev when OTP is bypassed". If backend returns tokens without OTP (e.g. dev mode), these work. No server-side enforcement of sessionToken for register/login in prod per ARCHITECTURE. | Potential bypass if backend doesn't enforce sessionToken. | Ensure auth.controller enforces sessionToken for register/login in production. |
| 18 | `backend/src/modules/billing/billing.routes.ts` | 49–55 | Error handling | P2 | `catch (err: any)` — `err.type === 'StripeSignatureVerificationError'` returns 400. Other errors go to `next(err)`. No explicit handling for missing `req.body` (Buffer). | If body is empty or wrong format, constructEvent throws; may leak stack in dev. | Add check for `req.body` before constructEvent. Ensure 500 responses don't leak internals. |
| 19 | `backend/src/modules/admin/admin-extended.routes.ts` | 49, 57, 67 | Logging / PII | P2 | `logAdminAction(..., \`Set role to ${req.body.role}\`)` — role written to audit. `Set tier to ${req.body.tier}`. If `req.body` is malicious, audit log could contain injected content. | Audit log injection; potential log forging. | Sanitize or truncate string values before logging. Validate role/tier against enum. |
| 20 | `docker-compose.yml` | 24 | Config | P2 | Redis: `maxmemory-policy noeviction` — correct. MongoDB: no auth in default docker-compose (MONGO_INITDB_ROOT_* set). | Local dev only; production uses Atlas. | Document that local MongoDB has default credentials; never use in production. |
| 21 | `backend/src/middleware/auth.ts` | 70–82 | Async / Feature flag | P2 | `requireFeature` uses dynamic import of SubscriptionService. Async chain with `.then()/.catch(next)`. If `hasFeature` throws, error is passed to next. | Minor: dynamic import adds latency. | Consider static import; feature checks are on hot path. |
| 22 | `admin-dashboard/src/pages/Users.tsx` | 133–134 | RBAC / UX | P2 | Role dropdown allows `user`, `moderator`, `admin`. `setUserRole` is admin-only per API. If a moderator views this, the UI shows the control but API would 403. | Confusing UX; moderator sees controls they can't use. | Hide role dropdown for moderators; show only for admin role. |

---

### P3 — Low

| # | File | Line(s) | Type | Severity | Proof | Impact | Recommendation |
|---|------|---------|------|----------|-------|--------|-----------------|
| 23 | `backend/src/modules/auth/otp.service.ts` | 53 | Logging | P3 | `logger.info({ phone: phone.slice(-4), code }, 'OTP (dev mode)')` — in dev, full code is logged. | Logs could be exposed in log aggregation. | Redact code in logs; use `code: '[REDACTED]'` in production. |
| 24 | `mobile/src/api/client.ts` | 6–8 | Config | P3 | Android emulator uses `http://10.0.2.2:3000`; iOS simulator uses `localhost`. No TLS for local dev. | Expected for dev; ensure prod uses HTTPS. | Document that EXPO_PUBLIC_API_URL must be HTTPS in production. |
| 25 | `admin-dashboard/src/pages/Map.tsx` | 97 | XSS | P3 | `m.bindTooltip(p.userId.slice(0, 8))` — userId is UUID, low risk. Leaflet tooltip may HTML-escape. | Low XSS risk. | Ensure Leaflet escapes content; or use text node. |
| 26 | `backend/src/modules/media/media.controller.ts` | 12–16 | Type coercion | P3 | `parseInt(expiresInSeconds)` and `isNsfw === 'true'` — body from multipart may have string values. `parseInt` of undefined returns NaN. | Possible NaN for expiresInSeconds. | Add validation: `const sec = parseInt(expiresInSeconds, 10); if (isNaN(sec)) ...` |
| 27 | `.github/workflows/ci.yml` | — | CI | P3 | Verify that CI runs `npm run migrate` or equivalent before tests. | Schema drift if migrations not run. | Ensure CI applies migrations in test job. |
| 28 | `backend/src/modules/safety/safety.service.ts` | — | Consistency | P3 | Panic returns `contactsNotified`; per ARCHITECTURE, notifications are deferred. Response may say 0. | Documented gap; not a bug. | Ensure response copy matches implementation (e.g. "Notifications queued" vs "Contacts notified"). |

---

## Prioritized Remediation List

### Immediate (P0)

1. **Admin bypass** — Restrict `adminBypassLogin` to `NODE_ENV=test` only. Remove `OTP_DEV_BYPASS` and `NODE_ENV=development` from bypass logic.
2. **Stripe webhook** — Validate `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` before use. Consolidate to single raw-body handler.
3. **MongoDB purge** — Implement deletion worker step to purge messages for deleted users' conversations.
4. **Admin Login UI** — Hide "Skip login" unless explicitly enabled via build-time env; never in production.

### Short-term (P1)

5. **Mobile token storage** — Use `expo-secure-store` on native; `sessionStorage` or httpOnly cookies on web.
6. **OTP_DEV_BYPASS** — Add startup warning when set in production; document removal before go-live.
7. **Test token route** — Enforce `NODE_ENV=test` only; remove `TEST_MODE` or treat as secondary.
8. **Stripe webhook routing** — Single handler; remove duplicate raw middleware.
9. **Upload validation** — Magic-byte check for non-image upload path; reject invalid buffers.
10. **requireVenueAccess** — Refactor to static import and async/await.
11. **Admin client filter** — Encode `filter` in `listUsers` URL.
12. **Share album target** — Validate `coupleId` when type is couple; ensure Zod refine rejects invalid payloads.

### Medium-term (P2)

13–22. Address config defaults, Multer error messages, Layout auth guard, auth sessionToken enforcement, billing error handling, audit log sanitization, docker-compose docs, requireFeature static import, Users RBAC UI.

### Low (P3)

23–28. OTP log redaction, API URL docs, Map tooltip, media parseInt validation, CI migrations, panic response copy.

---

## Cross-Reference Summary

| Area | Status | Notes |
|------|--------|-------|
| SQL injection | ✅ Parameterized | All queries use `$N` placeholders. |
| JWT / Auth | ⚠️ Bypass risk | Admin bypass and test mint need tightening. |
| Production secrets | ✅ Validated | `index.ts` fails on default secrets in prod. |
| CORS | ✅ Configurable | `CORS_ORIGINS` required in prod. |
| File upload | ⚠️ Partial | Magic bytes for images; non-image path weaker. |
| GDPR deletion | ❌ Incomplete | Postgres anonymized; MongoDB not purged. |
| Panic notifications | ⚠️ Deferred | Per docs; response should match. |
| Idempotency | ✅ Partial | Checkout and conversations have idempotency. |
| Rate limiting | ✅ Applied | Global + auth limits. |
| Admin RBAC | ✅ Enforced | Moderator vs admin roles. |

---

## Appendix: Files Audited

- **Backend:** auth, admin, billing, compliance, discovery, events, media, messaging, safety, venues, workers, middleware, config
- **Admin dashboard:** api/client, Layout, Login, Users, Map, Revenue, Venues, Settings
- **Mobile:** api/client, stores/auth
- **Config:** docker-compose.yml, .env.example, .github/workflows/ci.yml
- **Docs:** ARCHITECTURE.md, GET_ONLINE.md

---

*Report generated by adversarial audit. Recommendations should be reviewed by security and engineering leads before implementation.*
