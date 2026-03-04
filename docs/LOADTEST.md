# Load Testing

Production-grade load testing harness. See `loadtest/README.md` for usage.

## Tiers

| Tier | Suite | VUs | CI | Nightly | AWS |
|------|-------|-----|----|---------|-----|
| A | smoke_100 | 100 | ✅ PR gate | — | — |
| B | baseline_1000 | 1000 | — | ✅ | — |
| C | stress_10000 | 10k | — | — | On-demand |
| Soak | soak_4h | 500 | — | — | On-demand |
| Chaos | chaos_redis_restart | 500 spike | — | — | Manual |

## Backend Test Hooks (Test Harness API)

When `TEST_MODE=true` or `NODE_ENV=test`. **Never registered in production.**

| Endpoint | Purpose |
|----------|---------|
| **GET /v1/test/health** | Confirm test mode enabled; returns `{ testMode, version, nodeEnv }` |
| **POST /v1/test/reset** | Clear Redis keys (discovery_rate, discover cache, ad_cooldown) for deterministic baseline |
| **POST /v1/test/seed** | Create N users with deterministic phones, locations, **verification_tier=1**; returns `{ data: { users: [{ userId, accessToken, refreshToken, phone }] } }`. Max 5000 per request. |
| **POST /v1/test/token** | Mint JWT for a seeded user by `userId` (no OTP). Use when tokens expire mid-run. |

**k6 flow:** `checkTestHealth()` → `resetTestState()` → `seedUsers()` — never registers during load.

**Other:** Checkout stub (returns fake URL when Stripe not configured); discovery rate limit 500/min in test mode.

## Response Classification & Status Histograms

The smoke suite records status codes per endpoint and error class. At end of run, `handleSummary` prints:

- **STATUS HISTOGRAMS BY ENDPOINT** — e.g. `discover: 200:203, 429:4389`
- **ERROR CLASS BY ENDPOINT (non-2xx)** — e.g. `create_conversation: auth_denied:1085`

Error classes: `auth_denied` (401/403), `conflict` (409), `validation` (400/422), `rate_limited` (429), `tier_gate_or_partial` (203), `server_error` (5xx).

Use this to diagnose "53% errors" — e.g. "34% were 429 from discovery because we reused too few tokens."

Discover check accepts 200, 203, or 204 (tier-gated/partial/empty).

## Metrics (Prometheus)

- `http_requests_total` — Request count by method, route, status
- `http_request_duration_seconds` — Latency histogram
- `ws_connections_current` — Active WebSocket connections
- `worker_queue_depth{queue="cleanup"}` — BullMQ queue depth
- `dlq_depth{queue="cleanup-dlq"}` — Dead-letter queue depth
- `worker_job_failures_total` — Jobs that exhausted retries

## AWS Distributed Load (Tier C)

For 10k–100k VUs, run distributed k6:

1. **k6 Operator (Kubernetes)** — Deploy k6-operator, run `K6` CR with script URL
2. **ECS/Fargate** — Run multiple k6 tasks with shared script, aggregate results
3. **Grafana Cloud k6** — Use Grafana's hosted load testing

Store results in S3; optionally push to Prometheus remote write. Use GitHub OIDC for credentials.

## Pipeline Order

1. **Smoke (100 VUs)** must achieve &lt;1% error before scaling
2. **Load (100–500)** — check p95/p99 and error rate
3. **Stress (1k+)** — find breakpoints
4. **Soak (hours)** — detect leaks

100k concurrent requires distributed k6 (Grafana Cloud, Kubernetes), not GitHub Actions.

## Graceful Degradation

Under extreme load the system should:

- Return 429 (rate limit) not 500
- Keep auth + safety endpoints responsive
- Avoid cascading failures (Redis eviction, DB locks)

The chaos suite validates 429 behavior during spikes.
