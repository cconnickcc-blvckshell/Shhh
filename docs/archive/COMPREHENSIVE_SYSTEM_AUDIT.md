# Comprehensive System Audit — Shhh

**Date:** 2026-03-05  
**Scope:** Backend, Mobile (Expo), Admin Dashboard, Loadtest, Configuration, Security, Connectivity, Workflows  
**Purpose:** Senior team review — no edits. Findings only.

---

## Executive Summary

This audit identifies bugs, discrepancies, security risks, connectivity issues, and workflow problems across the Shhh codebase. Items are categorized by severity (Critical, High, Medium, Low) and area.

---

## 1. Backend

### 1.1 Critical — Stripe Webhook Signature Verification Broken

| Field | Value |
|-------|-------|
| **Concern** | Stripe webhooks require the **raw request body** (Buffer) for `stripe.webhooks.constructEvent()`. The global `express.json()` middleware in `app.ts` runs **before** all routes and parses the body. By the time the request reaches `/v1/billing/webhook`, the body is already consumed and `req.body` is a parsed object, not the raw Buffer. Signature verification will fail or be insecure. |
| **Path** | `backend/src/app.ts` (line 56: `app.use(express.json())`), `backend/src/modules/billing/billing.routes.ts` (line 34: `express.raw()` on route) |
| **Fix** | Mount the webhook route **before** `express.json()`, or use a separate Express app/path that only uses `express.raw()` for the webhook URL. |

### 1.2 High — NODE_ENV May Not Be Production on Render

| Field | Value |
|-------|-------|
| **Concern** | Deploy logs show `env: "development"`. If Render does not set `NODE_ENV=production`, `validateProductionSecrets()` and `validateProductionDataServices()` are skipped. The app could start with default dev secrets or localhost URLs if env vars are misconfigured. |
| **Path** | `backend/src/index.ts`, `backend/src/config/index.ts` |
| **Recommendation** | Ensure `NODE_ENV=production` is set in Render Environment. Add a startup log that explicitly confirms production mode. |

### 1.3 Medium — MongoDB Messages Not Purged on User Deletion

| Field | Value |
|-------|-------|
| **Concern** | Per ARCHITECTURE.md and prior audits: messages for deleted users remain in MongoDB. The deletion worker handles Postgres but does not purge MongoDB `messages` collection for deleted users. GDPR/data retention risk. |
| **Path** | `backend/src/workers/`, `backend/src/modules/compliance/` |
| **Reference** | ARCHITECTURE.md, E2E audit |

### 1.4 Medium — Negative Discovery Distances

| Field | Value |
|-------|-------|
| **Concern** | Some nearby users return negative distance values (e.g., -130m, -118m). Distance should be non-negative. Indicates a bug in PostGIS `ST_Distance` usage or geography cast. |
| **Path** | `backend/src/modules/discovery/discovery.service.ts` |
| **Reference** | docs/shhh_api_audit_report.md M5, SHHH_E2E_AUDIT_REPORT.md |

### 1.5 Low — Silent Catch Blocks Swallowing Errors

| Field | Value |
|-------|-------|
| **Concern** | Multiple `catch {}` or `catch () => {}` blocks swallow errors without logging. Failures become invisible. |
| **Paths** | `mobile/app/(auth)/register.tsx:93`, `mobile/app/(auth)/index.tsx:234`, `mobile/src/stores/auth.ts:176`, `mobile/src/api/client.ts:54`, `mobile/app/venue/[id].tsx:40`, `mobile/app/verify/index.tsx:26`, `mobile/app/whispers/index.tsx:19`, `mobile/app/(auth)/verify-code.tsx:92`, `mobile/src/hooks/useDistressGesture.ts`, `mobile/src/hooks/usePushNotifications.ts`, `mobile/src/hooks/useScreenshotDetection.ts` |
| **Recommendation** | Log errors in catch blocks or surface to user where appropriate. |

---

## 2. Mobile (Expo)

### 2.1 Critical — Sign Up / Navigation Not Working on Web (User-Reported)

| Field | Value |
|-------|-------|
| **Concern** | User reports: "I click sign up on the landing page but nothing happens." Despite switching from `Link asChild` to `router.push('/(auth)/register')`, the issue persists. Possible causes: (1) Web static export routing quirk; (2) Pressable/TouchableOpacity not receiving clicks on web (z-index, overlay, or event handling); (3) AuthGuard or layout redirect interfering; (4) Path resolution differs on static export. |
| **Paths** | `mobile/app/(auth)/index.tsx`, `mobile/src/components/WebEntryShell.tsx`, `mobile/app/(auth)/_layout.tsx`, `mobile/src/components/AuthGuard.tsx` |
| **Recommendation** | Debug on deployed Vercel URL: add console.log to Sign up onPress; verify router.push is called; check for overlays blocking clicks; test with `<a href="/register">` as fallback for web. |

### 2.2 High — API Base URL Fallback Wrong for iOS

| Field | Value |
|-------|-------|
| **Concern** | When `EXPO_PUBLIC_API_URL` is not set, fallback is `Platform.OS === 'web' ? 'http://localhost:3000' : 'http://10.0.2.2:3000'`. `10.0.2.2` is the Android emulator host. On **iOS simulator**, the host is `localhost`. iOS would incorrectly use `10.0.2.2`, causing connection failures. |
| **Path** | `mobile/src/api/client.ts` lines 4–8 |
| **Fix** | Use `Platform.OS === 'ios' ? 'http://localhost:3000' : Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000'` (or equivalent). |

### 2.3 High — Tokens in localStorage on Web

| Field | Value |
|-------|-------|
| **Concern** | JWT access and refresh tokens are stored in `localStorage` on web. localStorage is accessible to any script on the same origin (XSS). If the app has an XSS vulnerability, tokens can be stolen. |
| **Path** | `mobile/src/api/client.ts`, `mobile/src/stores/auth.ts` |
| **Recommendation** | Consider httpOnly cookies for web, or document XSS mitigation (CSP, input sanitization). |

### 2.4 Medium — SecureStore on Web

| Field | Value |
|-------|-------|
| **Concern** | `expo-secure-store` is used for `ONBOARDING_DONE_KEY` in auth layout. On web, SecureStore may not persist (falls back to in-memory or fails). Users on web may repeatedly see onboarding or experience inconsistent state. |
| **Path** | `mobile/app/(auth)/_layout.tsx`, `mobile/app/(auth)/onboarding-intent.tsx` |
| **Recommendation** | Use `localStorage` or a web-compatible store for onboarding state on web. |

### 2.5 Medium — Analytics Not Implemented

| Field | Value |
|-------|-------|
| **Concern** | `mobile/src/utils/analytics.ts` contains TODOs: "Integrate real analytics SDK". Screen views and events are stubbed. No D1/D7 retention tracking, funnel analytics, or conversion measurement. |
| **Path** | `mobile/src/utils/analytics.ts` |
| **Reference** | MONETIZATION_AND_RETENTION_PLAN.md, LAUNCH_PLAN.md |

### 2.6 Low — Excessive `any` Types

| Field | Value |
|-------|-------|
| **Concern** | Widespread use of `any` in API responses, profile, and component props reduces type safety and hides schema drift. |
| **Paths** | `mobile/src/stores/auth.ts`, `mobile/src/api/client.ts`, `mobile/app/(tabs)/index.tsx`, `mobile/app/(tabs)/events.tsx`, `mobile/app/venue/[id].tsx`, many others |
| **Recommendation** | Define shared types for API responses and user/profile models. |

### 2.7 Low — dangerouslySetInnerHTML

| Field | Value |
|-------|-------|
| **Concern** | `mobile/app/+html.tsx` uses `dangerouslySetInnerHTML` for static CSS. Content is hardcoded (no user input). Low risk but worth noting for future changes. |
| **Path** | `mobile/app/+html.tsx` line 21 |

---

## 3. Admin Dashboard

### 3.1 High — API Base Hardcoded

| Field | Value |
|-------|-------|
| **Concern** | `API_BASE` is hardcoded to `'http://localhost:3000'`. `.env.example` mentions `VITE_API_URL` but it is not used. Admin dashboard cannot connect to production backend without code change. |
| **Path** | `admin-dashboard/src/api/client.ts` line 1 |
| **Fix** | Use `import.meta.env.VITE_API_URL || 'http://localhost:3000'`. |

### 3.2 Medium — No Token Refresh

| Field | Value |
|-------|-------|
| **Concern** | Admin uses access token only. No refresh flow. When access token expires (~15m in prod), admin session ends. User must re-authenticate. |
| **Path** | `admin-dashboard/src/api/client.ts`, `admin-dashboard/src/pages/Login.tsx` |
| **Recommendation** | Implement refresh token flow or document short session expectation. |

### 3.3 Low — Token in sessionStorage

| Field | Value |
|-------|-------|
| **Concern** | Admin token stored in `sessionStorage`. Same XSS considerations as mobile localStorage. |

---

## 4. Connectivity & Configuration

### 4.1 Medium — CORS_ORIGINS Must Include All Frontend URLs

| Field | Value |
|-------|-------|
| **Concern** | If `CORS_ORIGINS` does not include the exact Vercel URL (e.g., `https://shhh.vercel.app`) or custom domain (`https://shhh.social`), API requests from the frontend will be rejected. Common deployment oversight. |
| **Path** | `backend/src/config/index.ts`, Render Environment |
| **Reference** | GET_ONLINE.md |

### 4.2 Medium — EXPO_PUBLIC_API_URL Build-Time Only

| Field | Value |
|-------|-------|
| **Concern** | `EXPO_PUBLIC_*` vars are baked in at build time. Changing Vercel env and redeploying is required to point to a new backend. No runtime override. |
| **Path** | Vercel build, `mobile/src/api/client.ts` |

### 4.3 Low — Render Logs Show env: "development"

| Field | Value |
|-------|-------|
| **Concern** | Startup log shows `env: "development"`. Suggests `NODE_ENV` may not be set to `production` on Render. Verify Render Environment has `NODE_ENV=production`. |

---

## 5. Security

### 5.1 High — Stripe Webhook (see 1.1)

### 5.2 Medium — Test Routes Enabled by TEST_MODE or NODE_ENV=test

| Field | Value |
|-------|-------|
| **Concern** | `/v1/test/reset`, `/v1/test/seed`, `/v1/test/token`, `/v1/test/health` are enabled when `TEST_MODE=true` OR `NODE_ENV=test`. If Render accidentally has `NODE_ENV=test`, test routes are exposed. Seed and token endpoints can create users and mint JWTs. |
| **Path** | `backend/src/app.ts` lines 133–137 |
| **Recommendation** | Restrict test routes to `NODE_ENV=test` only, or require an additional secret. |

### 5.3 Low — Default Secrets in Development

| Field | Value |
|-------|-------|
| **Concern** | Dev defaults (`dev-jwt-secret`, `dev-refresh-secret`, etc.) are blocked in production by `validateProductionSecrets()`. Ensure production never uses these. |

---

## 6. Workflow & API

### 6.1 Medium — Auth Flow: sessionToken Optional in Dev

| Field | Value |
|-------|-------|
| **Concern** | In dev, OTP can be bypassed with `devCode`. `sessionToken` is optional for login/register. Ensures dev velocity but must not leak to production. |
| **Path** | `backend/src/modules/auth/otp.service.ts`, `mobile` auth flows |

### 6.2 Medium — OAuth Providers Require Client IDs

| Field | Value |
|-------|-------|
| **Concern** | Google, Apple, Snap sign-in require `EXPO_PUBLIC_GOOGLE_CLIENT_ID`, `EXPO_PUBLIC_SNAP_CLIENT_ID`, and backend `GOOGLE_CLIENT_ID`, `APPLE_CLIENT_ID`, `SNAP_*`. If not configured, `Alert.alert('Not configured', ...)` is shown. Document which env vars are required for each provider. |

### 6.3 Low — API Response Shape Inconsistencies

| Field | Value |
|-------|-------|
| **Concern** | Some endpoints return `{ data: ... }`, others may differ. Mobile client assumes `body.data` in several places. Ensure backend contract is consistent. |

---

## 7. Loadtest

### 7.1 Low — k6 Uses Older JS Syntax

| Field | Value |
|-------|-------|
| **Concern** | k6 scripts avoid optional chaining and object spread for engine compatibility. Maintainability consideration. |
| **Path** | `loadtest/k6/` |

### 7.2 Low — Smoke Suite Depends on Test Harness

| Field | Value |
|-------|-------|
| **Concern** | Smoke tests require `TEST_MODE=true`, `/v1/test/seed`, and seeded users with `verification_tier=1`. CI must configure backend accordingly. |
| **Path** | `.github/workflows/ci.yml`, `loadtest/k6/` |

---

## 8. Documentation & Consistency

### 8.1 Low — Multiple Audit/Checklist Docs

| Field | Value |
|-------|-------|
| **Concern** | ARCHITECTURE.md, E2E_CAPABILITY_AUDIT_REPORT.md, MASTER_IMPLEMENTATION_CHECKLIST.md, SHHH_E2E_AUDIT_REPORT.md, CONSOLIDATED_CTO_REVIEW.md, SYSTEM_REALITY_REPORT.md, etc. Some findings may be outdated. Recommend periodic consolidation. |

### 8.2 Low — .env.example vs Actual Usage

| Field | Value |
|-------|-------|
| **Concern** | `VITE_API_URL` in `.env.example` for admin is not wired in code. `DATABASE_SSL_REJECT_UNAUTHORIZED` documented but logic was reverted (cloud default). Keep docs in sync with implementation. |

---

## 9. Summary Table

| ID | Severity | Area | Concern |
|----|----------|------|---------|
| 1.1 | Critical | Backend | Stripe webhook body already parsed; signature verification broken |
| 1.2 | High | Backend | NODE_ENV may be development on Render |
| 1.3 | Medium | Backend | MongoDB messages not purged on user deletion |
| 1.4 | Medium | Backend | Negative discovery distances |
| 1.5 | Low | Backend/Mobile | Silent catch blocks |
| 2.1 | Critical | Mobile | Sign up does nothing on web (user-reported) |
| 2.2 | High | Mobile | API fallback wrong for iOS simulator |
| 2.3 | High | Mobile | Tokens in localStorage (XSS risk) |
| 2.4 | Medium | Mobile | SecureStore on web may not persist |
| 2.5 | Medium | Mobile | Analytics not implemented |
| 2.6 | Low | Mobile | Excessive `any` types |
| 3.1 | High | Admin | API base hardcoded |
| 3.2 | Medium | Admin | No token refresh |
| 4.1 | Medium | Config | CORS must include all frontend URLs |
| 4.2 | Medium | Config | EXPO_PUBLIC_* build-time only |
| 5.2 | Medium | Security | Test routes enabled by TEST_MODE |
| 6.1 | Medium | Workflow | sessionToken optional in dev |
| 11.1 | Medium | Backend | Geofence polygon SQL injection risk |
| 11.2 | Medium | Backend | Safety lat/lng string interpolation (use params) |
| 11.3 | Medium | Backend | Seed role concatenation |
| 11.4 | Low | Backend | Route params not validated as UUID |
| 11.5 | Low | Backend | Upload body not validated |
| 11.6 | Low | Backend | Multer mimetype vs magic bytes (documented) |
| 11.7 | Low | Backend | E2EE key access control (confirm by design) |
| 11.8 | Low | Backend | Venue full without requireVenueAccess |
| 11.9 | Low | Mobile | setOnUnauthorized race |
| 11.10 | Low | Mobile | Refresh queue edge case |
| 11.11 | Low | Backend | WebSocket room verification |
| 11.12 | Low | Backend | Verification :id not validated |
| 11.13 | Low | Backend | Intent flag as any |
| 11.14 | Low | Backend | Controller return consistency |
| 11.15 | Low | Backend | npm audit high severity |

---

## 10. Recommended Priority Order for Senior Review

1. **Stripe webhook** (1.1) — Payment integrity
2. **Sign up not working** (2.1) — User-reported blocker
3. **API base URLs** (2.2, 3.1) — Connectivity
4. **NODE_ENV on Render** (1.2) — Production safety
5. **MongoDB purge on deletion** (1.3) — Compliance
6. **Token storage** (2.3) — Security
7. **Test route exposure** (5.2) — Security
8. **Negative distances** (1.4) — Data correctness
9. **Admin token refresh** (3.2) — UX
10. **Silent catches** (1.5) — Observability

---

## 11. Additional Findings (Deep Dive)

### 11.1 Medium — Geofence Polygon SQL Injection Risk

| Field | Value |
|-------|-------|
| **Concern** | `createGeofence()` builds SQL with `polygon.map(p => \`${p[0]} ${p[1]}\`).join(', ')` interpolated directly into `ST_GeomFromText('POLYGON((${closed}))')`. If polygon coordinates come from user input and are not strictly validated as numbers, malicious values could inject SQL. |
| **Path** | `backend/src/modules/venues/venues.service.ts` lines 142–151 |
| **Recommendation** | Validate each coordinate with `z.number()` or ensure polygon is always from trusted source. Use parameterized geometry if possible. |

### 11.2 Medium — Safety Service lat/lng String Interpolation

| Field | Value |
|-------|-------|
| **Concern** | `safety.service.ts` uses `ST_MakePoint(${lng}, ${lat})` with template literals. Values are validated by Zod as numbers before reaching the service, so risk is mitigated. However, if validation is ever bypassed or a new code path is added, this pattern is fragile. |
| **Path** | `backend/src/modules/safety/safety.service.ts` lines 51, 66 |
| **Recommendation** | Use parameterized queries: `ST_MakePoint($1, $2)` with `[lng, lat]` in the values array. |

### 11.3 Medium — Database Seed Role Concatenation

| Field | Value |
|-------|-------|
| **Concern** | `seed.ts` line 74: `role = \'' + u.role + '\''` concatenates `u.role` into SQL. Seed data is static, but if seed format ever accepts external input, this could be dangerous. |
| **Path** | `backend/src/database/seed.ts` |
| **Recommendation** | Use parameterized query: `$3` with `u.role` in params array. |

### 11.4 Low — Route Params Not Validated as UUID

| Field | Value |
|-------|-------|
| **Concern** | Many routes use `req.params.id` or `req.params.userId` without Zod validation. Invalid UUIDs may cause 500s or unexpected behavior. Examples: `DELETE /albums/:id/share/:userId`, various `/:id` routes. |
| **Paths** | `backend/src/modules/media/media.routes.ts`, `backend/src/modules/users/blur.routes.ts`, others |
| **Recommendation** | Add param validation middleware or validate in controller. |

### 11.5 Low — Upload category/expiresInSeconds Not Validated

| Field | Value |
|-------|-------|
| **Concern** | `media.controller.upload()` reads `category`, `expiresInSeconds`, `isNsfw` from `req.body` without Zod validation. `category` could be arbitrary; `expiresInSeconds` is parsed with `parseInt` (NaN possible). |
| **Path** | `backend/src/modules/media/media.controller.ts` lines 12–17 |
| **Recommendation** | Add `validate()` with schema for upload body. |

### 11.6 Low — Multer fileFilter Relies on Client mimetype

| Field | Value |
|-------|-------|
| **Concern** | Multer's `fileFilter` checks `file.mimetype` which can be spoofed by the client. `validateFileMagic` correctly checks actual file bytes. Both are used, so risk is mitigated. Document that magic-byte check is the security layer. |
| **Path** | `backend/src/modules/media/media.routes.ts` |

### 11.7 Low — E2EE getPublicKey/claimPrekey Access Control

| Field | Value |
|-------|-------|
| **Concern** | `GET /keys/:userId` and `GET /keys/:userId/bundle` allow any authenticated user to fetch another user's public keys. This is likely by design for E2EE (public keys are meant to be shared). Confirm no sensitive data is exposed. |
| **Path** | `backend/src/modules/messaging/e2ee.routes.ts` |

### 11.8 Low — Venue Full Profile Without requireVenueAccess

| Field | Value |
|-------|-------|
| **Concern** | `GET /:id/full` returns full venue profile without `requireVenueAccess`. Any authenticated user can fetch it. May be intentional for public discovery; verify no private venue data is included. |
| **Path** | `backend/src/modules/venues/venue-dashboard.routes.ts` line 11 |

### 11.9 Low — setOnUnauthorized Race on Clear

| Field | Value |
|-------|-------|
| **Concern** | `setOnUnauthorized` is called with `useAuthStore.getState().clearSession`. If multiple 401s fire concurrently, `clearSession` may run multiple times. `clearSession` calls `router.replace('/(auth)')` which could cause navigation thrashing. |
| **Path** | `mobile/app/_layout.tsx`, `mobile/src/stores/auth.ts` |

### 11.10 Low — Refresh Queue Rejections Not Cleared on Success

| Field | Value |
|-------|-------|
| **Concern** | In `refreshAccessToken()`, on success we `refreshQueue.forEach(q => q.resolve(newAccess))` then `refreshQueue = []`. On catch we `refreshQueue.forEach(q => q.reject(err))` then `refreshQueue = []`. If one of the queued callers throws before we clear, the queue could be left in a bad state. Edge case. |
| **Path** | `mobile/src/api/client.ts` |

### 11.11 Low — WebSocket Room Names From Params

| Field | Value |
|-------|-------|
| **Concern** | Socket joins `user:${userId}` and `conversation:${conversationId}`. `userId` comes from JWT (trusted). `conversationId` from client. Ensure conversation membership is verified before allowing join. |
| **Path** | `backend/src/websocket/index.ts` |

### 11.12 Low — Verification approve/reject :id Not Validated

| Field | Value |
|-------|-------|
| **Concern** | `POST /:id/approve` and `POST /:id/reject` use `req.params.id` without validation. Service may expect UUID; invalid format could cause errors. |
| **Path** | `backend/src/modules/verification/verification.routes.ts` |

### 11.13 Low — Intent flag Param as `any`

| Field | Value |
|-------|-------|
| **Concern** | `DELETE /:flag` passes `req.params.flag as any` to service. Intent flags should be an enum; casting to `any` bypasses type safety. |
| **Path** | `backend/src/modules/users/intent.routes.ts` line 35 |

### 11.14 Low — Missing Error Response in Some Controllers

| Field | Value |
|-------|-------|
| **Concern** | Some controller branches do `res.status(404).json(...); return;` but the `return` may be missed in other branches, causing "headers already sent" if code continues. |
| **Example** | `media.controller.getMedia`: `if (!media) { res.status(404)...; return; }` — correct. Audit other controllers for consistency. |

### 11.15 Low — npm audit Reports 1 High Severity Vulnerability

| Field | Value |
|-------|-------|
| **Concern** | Build logs show "1 high severity vulnerability". Run `npm audit` and address. |
| **Path** | `backend/package.json`, `package-lock.json` |

---

## 12. Updated Summary Count

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 4 |
| Medium | 15 |
| Low | 21+ |

---

*End of audit. No code edits were made. Pass to senior team for review and prioritization.*
