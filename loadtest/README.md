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

## Tiers

| Tier | Suite | VUs | Duration | Use |
|------|-------|-----|----------|-----|
| A (CI) | smoke_100 | 100 | ~2.5 min | PR gate |
| B (Nightly) | baseline_1000 | 1000 | ~10 min | Regression |
| C (AWS) | stress_10000 | 10k | ~30 min | On-demand |
| Soak | soak_4h | 500 | 4h | Memory/leak |
| Chaos | chaos_redis_restart | 500 spike | ~2 min | Graceful degradation |

## Structure

```
loadtest/
├── k6/
│   ├── lib/           # config, api, auth, metrics, thresholds, mix
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

## Backend Requirements

- `POST /v1/test/seed` — creates N users when `TEST_MODE=true`
- Prometheus metrics: `http_requests_total`, `http_request_duration_seconds`, `ws_connections_current`, `worker_queue_depth`, `dlq_depth`, `worker_job_failures_total`

## CI / Nightly

- **CI**: `loadtest-smoke` job runs on PR/push; fails on threshold regression
- **Nightly**: `nightly-load.yml` runs baseline; artifacts retained 14 days

## Against Production

```bash
k6 run -e API_URL=https://api.shhh.app -e LOAD_TIER=smoke loadtest/k6/suites/smoke_100.js
```

Note: Production must have seed endpoint disabled. Use pre-generated SEED_FILE or OTP flow.
