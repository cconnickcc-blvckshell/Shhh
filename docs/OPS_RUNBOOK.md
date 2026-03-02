# Shhh — Operations Runbook

> **Purpose:** Incident response, debugging, and operational procedures for the Shhh platform.  
> **Audience:** DevOps, on-call engineers, backend maintainers.

---

## 1. Prerequisites & Health Checks

### Required Services

| Service | Port | Health check |
|---------|------|--------------|
| PostgreSQL + PostGIS | 5432 | `pg_isready -U shhh_dev -d shhh` |
| Redis | 6379 | `redis-cli ping` |
| MongoDB | 27017 | `mongosh --eval "db.adminCommand('ping')"` |

### API Health Endpoint

```bash
curl http://localhost:3000/health
```

Returns: `status`, `version`, `modules` (list of loaded modules). If any core module fails to load, the server may not start or health may report degraded.

### Required Environment Variables (Production)

| Variable | Purpose | Risk if missing/default |
|----------|---------|-------------------------|
| `JWT_SECRET` | Access token signing | Token forgery |
| `JWT_REFRESH_SECRET` | Refresh token signing | Token forgery |
| `PHONE_HASH_PEPPER` | HMAC for phone hashing | PII exposure, enumeration |
| `DATABASE_URL` | PostgreSQL connection | API down |
| `REDIS_URL` | Redis connection | OTP, cache, rate limits fail |
| `MONGODB_URL` | Message storage | Messaging fails |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | Required in prod; app exits if missing |

**Note:** Production startup validates JWT_SECRET, JWT_REFRESH_SECRET, PHONE_HASH_PEPPER, CORS_ORIGINS; app exits if defaults or missing.

---

## 2. Common Failure Modes & Debugging

### API returns 5xx

1. **Check logs:** `LOG_LEVEL=debug` for verbose; Pino outputs JSON.
2. **Database:** `DATABASE_URL` correct? Migrations applied? `SELECT 1` from psql.
3. **Redis:** OTP, presence, rate limits use Redis. If Redis is down, auth and discovery degrade.
4. **MongoDB:** Messages stored here. If down, message send/fetch fails.

### OTP / Auth failing

- **Rate limit:** Auth endpoints limited (5/15m prod, 50 dev). Check `REDIS_URL` and Redis eviction policy.
- **Redis eviction:** If `maxmemory-policy` is `allkeys-lru`, OTP keys can be evicted under memory pressure. Use `noeviction` or a dedicated Redis instance for auth keys.
- **Twilio:** In production, OTP requires `TWILIO_*` env vars. In dev, `devCode` is returned when Twilio not configured.

### Discovery returns empty or errors

- **PostGIS:** Ensure PostGIS extension is enabled: `CREATE EXTENSION IF NOT EXISTS postgis;`
- **Location:** Discovery requires `lat`, `lng` in query. Check client is sending coordinates.
- **Cache:** 30s Redis cache per user. Stale results possible; cache key includes user id and coords.

### WebSocket disconnects

- **CORS:** Socket.io uses `cors: { origin: '*' }`. In production, restrict if needed.
- **Token:** Client must send `auth.token` (JWT) in handshake. Expired token causes reject.
- **Ping/pong:** Default 60s timeout, 25s interval. Long-running connections should stay within these limits.

### Messages not delivered in real time

- **WebSocket:** Client must call `join_conversation` with conversation id after connecting. Without it, `new_message` is not received.
- **MongoDB:** Messages stored in MongoDB with TTL. If MongoDB is down, message persistence fails.

---

## 3. Database Operations

### Run migrations

```bash
cd backend && npm run migrate
```

Runs `backend/src/database/migrate.ts`; applies `migrations/*.sql` in order. Idempotent (checks `schema_migrations`).

### Seed (development only)

```bash
cd backend && npm run seed
```

Idempotent by `phone_hash`. See `docs/REVIEW_CREDENTIALS.md` for test accounts.

### Rollback

No automated rollback. Migrations are forward-only. To revert, restore from backup or write a new migration that undoes changes.

---

## 4. Redis

### Check eviction policy

```bash
redis-cli CONFIG GET maxmemory-policy
```

Recommendation: `noeviction` for auth/OTP keys, or a dedicated instance. Default in docker-compose may be `allkeys-lru`.

### Clear OTP (development)

```bash
redis-cli KEYS "otp:*"
redis-cli DEL "otp:<phone_hash>"
```

---

## 5. Logs & Observability

- **Logger:** Pino in `backend/src/config/logger.ts`. Level from `LOG_LEVEL`.
- **No metrics/tracing:** No Prometheus, OpenTelemetry, or request metrics. Debug via logs only.
- **Workers:** BullMQ workers log job counts and duration. Check `workers/index.ts` for job names.

---

## 6. Deployment & Rollback

### Deploy (Terraform + ECS)

Terraform files: `terraform/main.tf`, `ecs.tf`, `database.tf`, `alb.tf`, `vpc.tf`. Run from `terraform/` with appropriate variables.

### Rollback

1. **ECS:** Revert to previous task definition. No automatic rollback.
2. **Database:** Migrations are not automatically rolled back. Restore from backup if needed.
3. **Application:** Redeploy previous image/tag.

---

## 7. Security Incidents

### Suspected token compromise

- Rotate `JWT_SECRET` and `JWT_REFRESH_SECRET`. All existing tokens invalidated.
- Consider clearing `refresh_tokens` table if storing hashes.

### Suspected PII exposure

- Phone/email are hashed with `PHONE_HASH_PEPPER`. Rotate pepper; existing hashes become invalid (re-registration needed for affected users).
- Audit `audit_logs` and `admin_actions` for suspicious access.

### GDPR deletion request backlog

- `data_deletion_requests` table stores requests. No worker currently processes them.
- Manual process: run a script that sets `users.deleted_at`, anonymizes/removes related data per policy, updates request status.

---

## 8. Quick Reference

| Task | Command |
|------|---------|
| Start infra | `docker compose up -d` |
| Migrate | `cd backend && npm run migrate` |
| Seed | `cd backend && npm run seed` |
| Backend dev | `cd backend && npm run dev` |
| Admin dev | `cd admin-dashboard && npm run dev` |
| Run tests | `cd backend && npm test` (requires Docker services) |
| Load smoke | `cd loadtest && k6 run smoke.js` |
