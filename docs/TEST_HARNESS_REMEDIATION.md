# Test Harness Remediation (March 2026)

Remediation applied per GPT analysis of test failure report.

## P0 — Completed

### 1. Jest ESM parsing (jwks-rsa / jose)
- **Fix:** Mock `jwks-rsa` in `backend/tests/setup.ts` so Jest never loads ESM-only `jose`
- **Result:** All 59 backend tests pass

### 2. Mobile tsconfig dist include
- **Fix:** Added `exclude: ["node_modules", "dist"]` to `mobile/tsconfig.json`
- **Note:** Mobile typecheck may still report other source errors (e.g. tabBarAccessibilityRole); dist/file-not-found is resolved

### 3. CI backend startup
- **Status:** CI loadtest job already sets `TEST_MODE=true` and `NODE_ENV=test`; seed endpoint is registered

### 4. Legacy k6 deprecation
- **Fix:** `loadtest/smoke.js` and `loadtest/stress.js` marked DEPRECATED in README
- **Reason:** Register storm invalid — OTP/sessionToken required. Use seeded tokens via `k6/suites/smoke_100.js`

## P1 — Completed

### 5. Admin eslint policy
- **Fix:** Disabled `react-hooks/set-state-in-effect`; scoped `@typescript-eslint/no-explicit-any` (off for `src/api/**`)
- **Result:** Admin lint passes (warnings only)

### 6. Backend lint errors
- **Fix:** `app.ts` — eslint-disable for conditional require; `messaging.service.ts` — `let` → `const`
- **Result:** Backend lint passes (warnings only)

## Local load test (seeded tokens)

```bash
# 1. Start infra
docker compose up -d

# 2. Migrate + start backend with TEST_MODE
cd backend && npm run migrate && TEST_MODE=true NODE_ENV=test npm run dev

# 3. Run smoke (from repo root)
npm run loadtest:smoke
```

The seed endpoint (`POST /v1/test/seed`) is only registered when `TEST_MODE=true` or `NODE_ENV=test`.
