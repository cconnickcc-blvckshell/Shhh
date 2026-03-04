# Load Tests

Production-grade load testing harness for Shhh. Supports 100 / 1,000 / 10,000+ concurrent users with deterministic seed users and traffic mix.

## Prerequisites

- [k6](https://k6.io/docs/get-started/installation/) installed
- Backend running with `TEST_MODE=true` (or `NODE_ENV=test`)
- Services: Postgres, Redis, MongoDB (e.g. `docker compose up -d`)

## Quick Start

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Migrate and start backend
cd backend && npm run migrate && TEST_MODE=true npm run dev

# 3. Run smoke (from repo root)
npm run loadtest:smoke
```

## Load Test Philosophies

| Mode | Purpose | Rate limits | Success criteria |
|------|---------|-------------|------------------|
| **Capacity** | Test infra (can the server handle it?) | Relaxed (10000/min in test) | Low latency, low 5xx |
| **Realistic** | Test real user experience | Prod limits | Obey retryAfter, client-like pacing |
| **Abuse** | Test guardrails | Prod limits | Expect 429s for abusive traffic |

CI smoke uses **capacity** mode (`DISCOVERY_RATE_LIMIT_PER_MIN=10000`) so infra is tested without policy friction. Use `smoke_realistic.js` (future) for client-like pacing.

## Tiers

| Tier | Suite | VUs | Duration | Use |
|------|-------|-----|----------|-----|
| A (CI) | smoke_100 | 100 | ~2.5 min | PR gate (capacity) |
| B (Nightly) | baseline_1000 | 1000 | ~10 min | Regression |
| C (AWS) | stress_10000 | 10k | ~30 min | On-demand |
| Soak | soak_4h | 500 | 4h | Memory/leak |
| Chaos | chaos_redis_restart | 500 spike | ~2 min | Graceful degradation |

## Response Classification & Detailed Reporting

The smoke suite records status codes per endpoint and error class. At the end of each run, `handleSummary` prints:

- **STATUS HISTOGRAMS BY ENDPOINT** — e.g. `discover: 200:1522, 429:2000, 403:1170`
- **ERROR CLASS BY ENDPOINT (non-2xx)** — e.g. `discover: rate_limited:2000`, `create_conversation: auth_denied:1164`
- **PER-ENDPOINT SUMMARY** — pass rate, total, top 3 status codes with hints (auth missing, rate limit, validation, etc.)
- **FAILURE PATTERN** — endpoints sorted by fail rate with likely cause (auth/tier gate, rate limit, validation, etc.)

During the run, VUs 1–10 each log their first failure per endpoint. Example: `[FAIL SAMPLE] create_conversation status=403 (auth_denied) vu=2 idemKey=k6-load-2-... body=...`

Error classes: `auth_denied` (401/403), `conflict` (409), `validation` (400/422), `rate_limited` (429), `tier_gate_or_partial` (203), `server_error` (5xx).

## Structure

```
loadtest/
├── k6/
│   ├── lib/           # config, api, auth, metrics, thresholds, mix, classifier
│   ├── scenarios/     # auth, discovery, chat, venue, ads, safety, compliance
│   ├── suites/        # smoke_100, baseline_1000, stress_10000, soak_4h, chaos
│   └── reports/       # Generated artifacts (gitignored)
├── smoke.js           # DEPRECATED — register storm invalid (OTP required). Use k6/suites/smoke_100.js with seeded tokens.
└── stress.js          # DEPRECATED — same. Use baseline_1000.js or stress_10000.js.
```

## Environment

| Var | Default | Description |
|-----|---------|-------------|
| API_URL | http://localhost:3000 | Backend base URL |
| WS_URL | derived from API_URL | WebSocket URL |
| LOAD_TIER | smoke | Tier for thresholds |
| SEED_FILE | — | Pre-generated users JSON (optional) |
| LOAD_MIX_* | — | Override traffic mix (e.g. LOAD_MIX_DISCOVERY=50) |

## Traffic Mix (Baseline)

- 40% Discovery
- 20% Presence
- 15% Chat (REST + WS)
- 10% Events/Venues
- 5% Ads
- 5% Safety
- 3% Compliance
- 2% Subscription

## Backend Requirements (Test Harness API)

When `TEST_MODE=true`:

- `GET /v1/test/health` — confirm test mode
- `POST /v1/test/reset` — clear Redis cache/rate-limit keys
- `POST /v1/test/seed` — create N users (tier 1, locations)
- `POST /v1/test/token` — mint JWT for userId (no OTP)

k6 calls reset → seed before load; never registers during load.
- Prometheus metrics: `http_requests_total`, `http_request_duration_seconds`, `ws_connections_current`, `worker_queue_depth`, `dlq_depth`, `worker_job_failures_total`

## CI / Nightly

- **CI**: `loadtest-smoke` job runs on PR/push; fails on threshold regression
- **Nightly**: `nightly-load.yml` runs baseline; artifacts retained 14 days

## Against Production

```bash
k6 run -e API_URL=https://api.shhh.app -e LOAD_TIER=smoke loadtest/k6/suites/smoke_100.js
```

Note: Production must have seed endpoint disabled. Use pre-generated SEED_FILE or OTP flow.
