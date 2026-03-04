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

- **POST /v1/test/seed** — Creates N users with deterministic phones, locations, and returns `{ data: { users: [{ userId, accessToken, refreshToken, phone }] } }`. Max 5000 per request.

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
