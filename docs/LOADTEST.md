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

## Backend Test Hooks

When `TEST_MODE=true` or `NODE_ENV=test`:

- **POST /v1/test/seed** — Creates N users with deterministic phones, locations, **verification_tier=1** (for conversation create), and returns `{ data: { users: [{ userId, accessToken, refreshToken, phone }] } }`. Max 5000 per request.
- **Checkout stub** — When Stripe is not configured, `POST /v1/billing/checkout` returns a fake URL (200) instead of 503.
- **Discovery rate limit** — Raised to 500/min per user (configurable via `DISCOVERY_RATE_LIMIT_PER_MIN`).
- **CI env** — `loadtest-smoke` job sets `DISCOVERY_RATE_LIMIT_PER_MIN=500`.

## Response Classification & Status Histograms

The smoke suite records status codes per endpoint and error class. At end of run, `handleSummary` prints:

- **STATUS HISTOGRAMS BY ENDPOINT** — e.g. `discover: 200:203, 429:4389`
- **ERROR CLASS BY ENDPOINT (non-2xx)** — e.g. `create_conversation: auth_denied:1085`

Error classes: `auth_denied` (401/403), `conflict` (409), `validation` (400/422), `rate_limited` (429), `tier_gate_or_partial` (203), `server_error` (5xx).

Use this to diagnose "53% errors" — e.g. "34% were 429 from discovery because we reused too few tokens."

Discover check accepts 200 or 203 (tier-gated/partial responses).

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

## Graceful Degradation

Under extreme load the system should:

- Return 429 (rate limit) not 500
- Keep auth + safety endpoints responsive
- Avoid cascading failures (Redis eviction, DB locks)

The chaos suite validates 429 behavior during spikes.
