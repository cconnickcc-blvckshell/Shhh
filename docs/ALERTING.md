# Alerting — Prometheus + Alertmanager

**Purpose:** Wire Prometheus metrics to Alertmanager or PagerDuty; define alert rules for error rate, latency, job failures.  
**Source:** MASTER_IMPLEMENTATION_CHECKLIST Tier 6.8, ADVERSARIAL_AUDIT_VERIFICATION.

---

## Metrics Exposed

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `http_requests_total` | Counter | method, route, status | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | method, route | Request latency |
| `worker_job_failures_total` | Counter | job | Worker job failures (after all retries) |

**Endpoint:** `GET /metrics` (Prometheus scrape format)

---

## Alert Rules (Prometheus)

Create `alerts.yml` or add to your Prometheus config:

```yaml
groups:
  - name: shhh-backend
    rules:
      # High error rate (5xx)
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m])) 
          / sum(rate(http_requests_total[5m])) > 0.05
        for: 2m
        labels: { severity: critical }
        annotations:
          summary: "High 5xx error rate (>5%)"

      # High latency (p99 > 5s)
      - alert: HighLatency
        expr: |
          histogram_quantile(0.99, 
            sum(rate(http_request_duration_seconds_bucket[5m])) by (le, route)
          ) > 5
        for: 5m
        labels: { severity: warning }
        annotations:
          summary: "p99 latency > 5s on {{ $labels.route }}"

      # Worker job failures
      - alert: WorkerJobFailures
        expr: increase(worker_job_failures_total[15m]) > 0
        for: 1m
        labels: { severity: warning }
        annotations:
          summary: "Worker job {{ $labels.job }} failed (moved to DLQ)"
```

---

## Alertmanager Setup

1. **Install Alertmanager** (or use managed Prometheus/Alertmanager)
2. **Configure receivers** (email, PagerDuty, Slack):

```yaml
# alertmanager.yml
route:
  receiver: 'default'
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  routes:
    - match: { severity: critical }
      receiver: 'pagerduty'
      continue: true
    - match: { severity: warning }
      receiver: 'slack'

receivers:
  - name: 'default'
    # ...
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: '<PAGERDUTY_SERVICE_KEY>'
  - name: 'slack'
    slack_configs:
      - api_url: '<SLACK_WEBHOOK_URL>'
        channel: '#alerts'
```

3. **Prometheus config** — add `alerting` and `rule_files`:

```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - /etc/prometheus/alerts.yml
```

---

## PagerDuty Integration

1. Create a Prometheus integration in PagerDuty
2. Use the integration key as `service_key` in Alertmanager
3. Critical alerts (HighErrorRate) route to PagerDuty for 24/7 on-call

---

## SLO Targets (Reference)

| SLO | Target | Alert Threshold |
|-----|--------|-----------------|
| Error rate | < 1% 5xx | > 5% for 2m |
| Latency p99 | < 2s | > 5s for 5m |
| Worker jobs | 0 failures | Any failure in 15m |

---

## File Locations

| Path | Purpose |
|------|---------|
| `backend/src/middleware/metrics.ts` | Prometheus metrics |
| `backend/src/workers/index.ts` | worker_job_failures_total |
| `docs/ALERTING.md` | This document |
