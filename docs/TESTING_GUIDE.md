# Shhh — Testing Guide

> **Purpose:** How to run tests, what they cover, and how to add new tests.  
> **Audience:** Developers, CI maintainers.

---

## 1. Overview

| Layer | Location | Framework | Notes |
|-------|----------|-----------|-------|
| Backend | `backend/tests/` | Jest | Integration tests; require Docker services |
| Admin | — | — | No automated tests |
| Mobile | — | — | No Jest/Detox tests |
| Load | `loadtest/` | k6 | Smoke and stress scenarios |

---

## 2. Backend Tests

### Prerequisites

- Docker (PostgreSQL, Redis, MongoDB) — CI provides these; locally use `docker compose up -d`
- `.env` at project root (or defaults from `backend/src/config/index.ts`)

### Run

```bash
cd backend
npm test
```

Runs Jest with `--forceExit --detectOpenHandles`. Tests use `NODE_ENV=test` and `LOG_LEVEL=silent`.

### Test Suites

| File | Coverage |
|------|----------|
| `auth.test.ts` | Registration, login, refresh, logout, OTP (with devCode) |
| `discovery.test.ts` | Location update, nearby discovery (PostGIS) |
| `events.test.ts` | Create event, RSVP, check-in |
| `couples.test.ts` | Create couple, link, dissolve |
| `safety.test.ts` | Contacts, check-in, panic, screenshot |
| `admin.test.ts` | Admin routes (stats, moderation, ban) |
| `media.test.ts` | Upload, albums, share |

### Setup

- `tests/setup.ts` loads `.env` from `backend/../.env` (project root)
- `tests/helpers.ts` provides auth helpers, API request helpers
- Tests use real DB/Redis/Mongo; no mocks for persistence

### Adding Tests

1. Create `backend/tests/<module>.test.ts`
2. Use `describe`/`it`; import helpers from `./helpers`
3. Use unique data (e.g. `phone: +1555${Date.now()}`) to avoid collisions with rate limits
4. Clean up if needed (e.g. delete test user) or rely on test DB isolation

---

## 3. CI Configuration

`.github/workflows/ci.yml`:

- **Services:** Postgres (PostGIS), Redis, MongoDB
- **Env:** `DATABASE_URL`, `REDIS_URL`, `MONGODB_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `NODE_ENV=test`
- **Steps:** `npm ci` → `npm run migrate` → `npm test`

---

## 4. Load Tests (k6)

### Prerequisites

- [k6](https://k6.io/docs/get-started/installation/) installed

### Smoke (5 VUs, 30s)

```bash
cd loadtest
k6 run smoke.js
```

Or from root: `k6 run loadtest/smoke.js`

### Stress (ramp to 500 VUs)

```bash
cd loadtest
k6 run stress.js
```

### Against Production

```bash
cd loadtest
k6 run -e API_URL=https://api.shhh.app smoke.js
```

### Thresholds

Smoke typically uses p95 < 500ms, error rate < 5%. Adjust in script if needed.

---

## 5. Manual / E2E

- **Admin:** No Playwright/Cypress. Manual testing via `admin-dashboard` on port 5173.
- **Mobile:** No Detox. Manual testing via Expo Go or device.
- **E2E:** Consider adding Playwright for web flows or Detox for mobile when prioritizing quality.

---

## 6. Test Credentials

See `docs/REVIEW_CREDENTIALS.md` for seeded test accounts (phone, OTP devCode, admin roles).
