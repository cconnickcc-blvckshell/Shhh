## Cursor Cloud specific instructions

### Services Overview

| Service | Port | Purpose |
|---------|------|---------|
| Backend API | 3000 | Express + TypeScript REST API + WebSocket + Swagger UI |
| Admin Dashboard | 5173 | React + Vite moderation panel |
| PostgreSQL + PostGIS | 5432 | Primary database with geospatial |
| Redis | 6379 | Caching, rate limiting, geo lookups |
| MongoDB | 27017 | Message storage with TTL auto-delete |

### Starting Infrastructure

```bash
sudo dockerd &>/tmp/dockerd.log &   # if Docker not already running
sudo docker compose up -d
```

### Running the Backend

```bash
cd backend
npm run migrate   # first time or after schema changes
npm run dev       # starts on port 3000 with hot reload
```

### Running the Admin Dashboard

```bash
cd admin-dashboard
npm run dev       # starts on port 5173
```

### Key Commands

See `backend/package.json` for lint/test/build/typecheck commands. See `docs/ARCHITECTURE.md` for the full API ledger, file tree, and workflows.

### Non-obvious Gotchas

- **Docker in Cloud VM**: Requires `fuse-overlayfs` storage driver and `iptables-legacy`. The `dockerd` must be started with `sudo` before `docker compose up`.
- **PostGIS queries**: The discovery module uses `ST_DWithin` with geography casts. Parameter ordering in dynamic SQL must be carefully managed with sequential `$N` indexing.
- **JWT tier enforcement**: Several endpoints require minimum verification tiers. When testing, update `users.verification_tier` directly in PostgreSQL to bypass verification flow.
- **MongoDB connection**: Uses `authSource=admin` in the connection string.
- **Express 5 types**: `req.params.id` returns `string | string[]` — cast to `string` when passing to service methods.
- **Rate limiting on auth**: Auth endpoints are limited to 5 requests per 15 minutes. In tests, unique phone numbers are generated per test run to avoid collisions.
- **Swagger UI**: Available at `http://localhost:3000/docs`, raw spec at `/docs.json`.
