# Shhh — Adversarial Security Audit Report

**Classification:** Confidential — C-Suite  
**Date:** March 2026  
**Scope:** backend/, admin-dashboard/, mobile/, config, auth, APIs, database, file uploads, WebSockets, env handling  
**Methodology:** Attacker-perspective, manual code review + exploit path analysis  

---

## Executive Summary

The Shhh platform has a solid security baseline: parameterized SQL, Zod validation, JWT auth, production secret checks, and tier-based access control. However, **several high-impact findings** require immediate attention before production launch, particularly around **admin bypass exposure**, **OTP leakage in dev/prod**, **unauthenticated metrics**, and **sensitive data exposure**.

| Severity | Count | Key Risks |
|----------|-------|-----------|
| **Critical** | 2 | Admin bypass in prod; OTP devCode in API response when Twilio unconfigured |
| **High** | 4 | Admin bypass status disclosure; metrics unauthenticated; Stripe webhook bypass; JWT in localStorage (XSS) |
| **Medium** | 6 | OTP in logs; refresh token no rate limit; admin presence geo PII; test routes conditional; CORS prod config |
| **Low** | 5 | Info disclosure; LIKE wildcard abuse; sessionStorage token; dev stack traces |

**Recommendation:** Address Critical and High findings within 2 weeks. Medium findings within 4 weeks. Low findings in next sprint.

---

## Vulnerability Matrix by Severity

| ID | File:Line | Type | Severity | One-line |
|----|-----------|------|----------|----------|
| V1 | auth.routes.ts:88-96, auth.service.ts:143-164 | Auth bypass | **Critical** | Admin bypass allows full login without OTP when OTP_DEV_BYPASS=true |
| V2 | otp.service.ts:60-69 | Sensitive data exposure | **Critical** | OTP devCode returned in API response when Twilio not configured |
| V3 | auth.routes.ts:88-95 | Information disclosure | **High** | GET /admin-bypass-status reveals whether bypass is available |
| V4 | app.ts:77 | Missing auth | **High** | GET /metrics unauthenticated; exposes internal metrics |
| V5 | billing.routes.ts:34-56 | Webhook security | **High** | Stripe webhook has no rate limit; no IP allowlist |
| V6 | mobile/api/client.ts:24-44 | Token storage | **High** | JWT + refresh in localStorage; XSS can steal tokens |
| V7 | otp.service.ts:61-67 | Sensitive data in logs | **Medium** | OTP code logged in dev/OTP_DEV_BYPASS mode |
| V8 | auth.routes.ts:102 | Missing rate limit | **Medium** | POST /refresh has no auth rate limit; brute-force refresh tokens |
| V9 | admin-extended.service.ts:99-101 | PII exposure | **Medium** | GET /admin/presence/geo returns user lat/lng to moderators |
| V10 | app.ts:140-144 | Conditional routes | **Medium** | Test routes depend on NODE_ENV=test; TEST_MODE alone doesn't mount |
| V11 | config/index.ts:50 | CORS | **Medium** | Production with no CORS_ORIGINS rejects all; verify fail-safe |
| V12 | errorHandler.ts:35-37 | Stack trace | **Medium** | 500 errors expose stack in development |
| V13 | admin-dashboard Login.tsx | UX/Info | **Low** | "Skip login" button always visible; hints at bypass |
| V14 | admin-extended.service.ts:59 | Search bypass | **Low** | searchUsers: `%` in query returns all users (ILIKE wildcard) |
| V15 | admin-dashboard client.ts:9 | Token storage | **Low** | Admin JWT in sessionStorage (XSS risk but session-scoped) |
| V16 | app.ts:114 | Static files | **Low** | /uploads static; verify path traversal protection (express/send) |
| V17 | +html.tsx:21 | XSS surface | **Low** | dangerouslySetInnerHTML for static CSS; no user input |

---

## Full Findings with Proof and Remediation

### V1 — Admin Bypass Allows Full Login Without OTP [CRITICAL]

| Field | Value |
|-------|-------|
| **File** | `backend/src/modules/auth/auth.routes.ts:96`, `backend/src/modules/auth/auth.service.ts:143-164` |
| **Type** | Authentication bypass |
| **Severity** | Critical |
| **CVSS** | 9.1 (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N) |

**Proof:**  
When `OTP_DEV_BYPASS=true` or `NODE_ENV=development|test`, `POST /v1/auth/admin-bypass` returns full JWT for the first admin/moderator user. No phone, no OTP required.

```bash
curl -X POST https://api.example.com/v1/auth/admin-bypass \
  -H "Content-Type: application/json" \
  -d '{}'
# Response: { "data": { "accessToken": "...", "refreshToken": "...", "userId": "..." } }
```

**Impact:** If `OTP_DEV_BYPASS=true` is left in production (e.g. Render env before Twilio is configured), any attacker can obtain admin JWT and full platform access.

**Remediation:**
1. **Never** allow `OTP_DEV_BYPASS` in production. Add to `validateProductionSecrets()`: reject boot if `OTP_DEV_BYPASS=true` when `NODE_ENV=production`.
2. Remove `admin-bypass` route from production builds, or gate behind `NODE_ENV=test` only.
3. Document in `.env.example`: "Remove OTP_DEV_BYPASS once Twilio is configured."

---

### V2 — OTP Code Returned in API Response [CRITICAL]

| Field | Value |
|-------|-------|
| **File** | `backend/src/modules/auth/otp.service.ts:60-69` |
| **Type** | Sensitive data exposure |
| **Severity** | Critical |
| **CVSS** | 8.6 (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N) |

**Proof:**  
When Twilio is not configured, `sendOTP` returns `devCode` in the response. When `OTP_DEV_BYPASS=true` (no Twilio), same behavior.

```bash
curl -X POST https://api.example.com/v1/auth/phone/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"+15551234567"}'
# Response: { "data": { "sent": true, "devCode": "123456" } }
```

**Impact:** Attacker can obtain OTP for any phone number without receiving SMS. Enables account takeover.

**Remediation:**
1. **Never** return `devCode` when `NODE_ENV=production`.
2. When `OTP_DEV_BYPASS=true` and Twilio not configured, return `devCode` only if request IP is in allowlist (e.g. localhost, Render private IP) or require a dev-only header.
3. In production, fail with 503 if Twilio not configured; never return OTP in response.

---

### V3 — Admin Bypass Status Information Disclosure [HIGH]

| Field | Value |
|-------|-------|
| **File** | `backend/src/modules/auth/auth.routes.ts:88-95` |
| **Type** | Information disclosure |
| **Severity** | High |
| **CVSS** | 5.3 (AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N) |

**Proof:**  
`GET /v1/auth/admin-bypass-status` is unauthenticated and returns:

```json
{ "bypassAvailable": true, "hint": "Set OTP_DEV_BYPASS=true in Render → Environment" }
```

**Impact:** Reveals to attackers that backend may support bypass, and how to enable it. Aids reconnaissance.

**Remediation:**
1. Remove this endpoint in production, or return `{ "bypassAvailable": false }` always when `NODE_ENV=production`.
2. If kept for admin dashboard UX, require authentication and admin role.

---

### V4 — Metrics Endpoint Unauthenticated [HIGH]

| Field | Value |
|-------|-------|
| **File** | `backend/src/app.ts:77` |
| **Type** | Missing authentication |
| **Severity** | High |
| **CVSS** | 5.3 (AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N) |

**Proof:**  
`GET /metrics` returns Prometheus metrics (request counts, routes, WebSocket connections, etc.) without authentication.

```bash
curl https://api.example.com/metrics
# Exposes: http_requests_total, ws_connections_current, etc.
```

**Impact:** Information leakage about traffic patterns, endpoints, and system health. Can aid DoS or targeted attacks.

**Remediation:**
1. Require authentication (Bearer token) for `/metrics`.
2. Or restrict by IP (e.g. Prometheus / monitoring only).
3. Or use a separate internal port with network isolation.

---

### V5 — Stripe Webhook Without Rate Limit or IP Allowlist [HIGH]

| Field | Value |
|-------|-------|
| **File** | `backend/src/modules/billing/billing.routes.ts:34-56` |
| **Type** | Webhook security |
| **Severity** | High |
| **CVSS** | 6.5 (AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:N) |

**Proof:**  
`POST /v1/billing/webhook` uses raw body and verifies Stripe signature. No rate limit, no IP allowlist. Stripe signature verification is correct, but if an attacker obtains a valid webhook secret (e.g. from env leak), they could replay or forge events.

**Impact:** Replay attacks, forged subscription events if secret is compromised.

**Remediation:**
1. Add rate limiting per IP for webhook endpoint (e.g. 100/min).
2. Optionally allowlist Stripe IPs (Stripe publishes IP ranges).
3. Ensure `STRIPE_WEBHOOK_SECRET` is not logged or exposed.

---

### V6 — JWT and Refresh Token in localStorage (XSS Risk) [HIGH]

| Field | Value |
|-------|-------|
| **File** | `mobile/src/api/client.ts:24-44` |
| **Type** | Token storage (XSS amplification) |
| **Severity** | High |
| **CVSS** | 6.1 (AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N) |

**Proof:**  
On web, `setAuthToken` and `setRefreshToken` use `localStorage`. Any XSS on the page can read tokens and impersonate the user.

```javascript
// Attacker can exfiltrate via:
localStorage.getItem('shhh_token');
localStorage.getItem('shhh_refresh_token');
```

**Impact:** If XSS exists anywhere in the app (e.g. via unsanitized user content), attacker steals session.

**Remediation:**
1. **Web:** Use `sessionStorage` instead of `localStorage` (reduces persistence; not a full fix).
2. **Better:** Use httpOnly cookies for auth on web; backend sets `Set-Cookie` with `httpOnly; Secure; SameSite=Strict`.
3. Ensure no `dangerouslySetInnerHTML` or unsanitized user content; CSP headers.

---

### V7 — OTP Code Logged [MEDIUM]

| Field | Value |
|-------|-------|
| **File** | `backend/src/modules/auth/otp.service.ts:61-67` |
| **Type** | Sensitive data in logs |
| **Severity** | Medium |

**Proof:**  
```javascript
logger.info({ phone: phone.slice(-4), code }, 'OTP (dev mode - no Twilio)');
logger.warn({ phone: phone.slice(-4), code }, 'OTP bypass (no Twilio) — remove OTP_DEV_BYPASS when Twilio is configured');
```

**Remediation:** Never log `code`. Log only `phone: phone.slice(-4)` and a generic message. Remove code from logs in all code paths.

---

### V8 — Refresh Token Endpoint No Rate Limit [MEDIUM]

| Field | Value |
|-------|-------|
| **File** | `backend/src/modules/auth/auth.routes.ts:102` |
| **Type** | Missing rate limit |
| **Severity** | Medium |

**Proof:**  
`POST /v1/auth/refresh` uses `validate(refreshSchema)` but no `authRateLimiter`. Attacker can brute-force refresh tokens (UUIDs).

**Remediation:** Apply `authRateLimiter` or a dedicated refresh limiter (e.g. 10/min per IP) to `/refresh`.

---

### V9 — Admin Presence Geo Returns User Lat/Lng [MEDIUM]

| Field | Value |
|-------|-------|
| **File** | `backend/src/modules/admin/admin-extended.service.ts` (getPresenceGeo) |
| **Type** | PII exposure |
| **Severity** | Medium |

**Proof:**  
`GET /v1/admin/presence/geo` returns `{ userId, lat, lng, lastSeen, presenceState }` for moderators. Real-time location of all users.

**Remediation:** Document as acceptable for moderation/safety; ensure access is logged and audited. Consider fuzzing or bucketing coordinates for non-safety use cases.

---

### V10 — Test Routes Conditional on NODE_ENV [MEDIUM]

| Field | Value |
|-------|-------|
| **File** | `backend/src/app.ts:140-144` |
| **Type** | Misconfiguration risk |
| **Severity** | Medium |

**Proof:**  
Test routes (`/v1/test/seed`, `/v1/test/token`, `/v1/test/reset`) are mounted only when `config.nodeEnv === 'test'`. If `NODE_ENV` is accidentally set to `test` in production, these routes become available.

**Remediation:** Add explicit check: `config.nodeEnv === 'test' && process.env.ALLOW_TEST_ROUTES === 'true'`. Never allow in production.

---

### V11 — CORS Production Configuration [MEDIUM]

| Field | Value |
|-------|-------|
| **File** | `backend/src/config/index.ts:50` |
| **Type** | CORS misconfiguration |
| **Severity** | Medium |

**Proof:**  
When `CORS_ORIGINS` is empty in production, `config.cors.origins` is `[]`, and `cors({ origin: false })` rejects all. That is fail-safe, but if `CORS_ORIGINS` is misconfigured (e.g. `*` or overly permissive), cross-origin issues arise.

**Remediation:** Validate `CORS_ORIGINS` in production: no `*`, no `null`; must be explicit origins. Add to `validateProductionSecrets()`.

---

### V12 — Stack Trace in 500 Responses (Development) [MEDIUM]

| Field | Value |
|-------|-------|
| **File** | `backend/src/middleware/errorHandler.ts:35-37` |
| **Type** | Information disclosure |
| **Severity** | Medium |

**Proof:**  
When `NODE_ENV=development` and status >= 500, `stack` is included in response.

**Remediation:** Already correct for production. Ensure `NODE_ENV` is never `development` in production.

---

### V13–V17 — Low Severity [LOW]

- **V13:** Admin Login UI shows "Skip login" always — UX hints at bypass. Hide when not in dev.
- **V14:** `searchUsers` with `%` in query returns all users (ILIKE wildcard). Sanitize or escape `%` and `_`.
- **V15:** Admin JWT in sessionStorage — XSS risk but session-scoped. Prefer httpOnly cookies.
- **V16:** `/uploads` static — verify `express.static` / `send` path traversal protection. Use `path.resolve` and ensure resolved path is under root.
- **V17:** `dangerouslySetInnerHTML` in `+html.tsx` for static CSS — no user input. Low risk; avoid for future dynamic content.

---

## Positive Security Controls Observed

| Control | Implementation |
|---------|----------------|
| SQL injection | Parameterized queries throughout; no string concatenation |
| NoSQL injection | Mongoose parameterized; `$in` with safe arrays |
| JWT validation | `jwt.verify` with secret; no `alg:none` |
| Production secrets | `validateProductionSecrets()` fails boot on default secrets |
| Rate limiting | Global 100/15min; auth 5/15min; discovery per-user |
| CORS | Explicit origins; `false` when empty in prod |
| Helmet | Security headers enabled |
| File upload | Magic-byte validation; MIME allowlist; 20MB limit |
| Input validation | Zod schemas on most endpoints |
| Admin RBAC | `requireRole('moderator'|'admin')`; sensitive actions require admin |
| WebSocket auth | JWT in handshake; conversation membership verified |

---

## Prioritized Remediation Roadmap

| Priority | Timeframe | Action |
|----------|-----------|--------|
| P0 | Immediate | Block `OTP_DEV_BYPASS` in production; never return `devCode` in prod |
| P0 | Immediate | Remove or gate `GET /admin-bypass-status` in production |
| P1 | 1 week | Protect `/metrics`; add auth or IP allowlist |
| P1 | 1 week | Move web tokens to httpOnly cookies or sessionStorage + CSP |
| P1 | 1 week | Add rate limit to `/refresh` |
| P2 | 2 weeks | Remove OTP from logs; add Stripe webhook rate limit |
| P2 | 2 weeks | Harden test routes; validate CORS_ORIGINS in prod |
| P3 | 4 weeks | Address low-severity findings |

---

## Appendix: Files Reviewed

- `backend/src/` — app, config, middleware, modules (auth, admin, discovery, media, messaging, events, billing, etc.)
- `admin-dashboard/src/` — api client, Login, Pages
- `mobile/src/` — api client, auth store
- `mobile/app/` — auth flows, +html
- `.env.example` — env var reference

---

*Report generated by adversarial security audit. Re-audit recommended after remediation.*
