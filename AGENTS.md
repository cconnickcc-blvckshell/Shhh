## Cursor Cloud specific instructions

### Services Overview

| Service | Port | Purpose |
|---------|------|---------|
| Backend API | 3000 | Express + TypeScript REST API + WebSocket |
| PostgreSQL + PostGIS | 5432 | Primary database with geospatial |
| Redis | 6379 | Caching, rate limiting, geo lookups |
| MongoDB | 27017 | Message storage with TTL auto-delete |

### Starting Infrastructure

```bash
# Docker must be running first (sudo dockerd if not already up)
sudo docker compose up -d
```

### Running the Backend

```bash
cd backend
npm run migrate   # first time or after schema changes
npm run dev       # starts on port 3000 with hot reload
```

### Key Commands

See `backend/package.json` scripts for lint/test/build/typecheck commands.

### Non-obvious Gotchas

- **Docker in Cloud VM**: Requires `fuse-overlayfs` storage driver and `iptables-legacy`. The `dockerd` must be started with `sudo` before `docker compose up`.
- **PostGIS queries**: The discovery module uses `ST_DWithin` with geography casts. Parameter ordering in dynamic SQL is `[lat, lng, userId, radiusMeters, fuzz, ...filters]` — be careful when adding new filter parameters to maintain correct `$N` indexing.
- **JWT tier enforcement**: Several endpoints require minimum verification tiers. When testing, update `users.verification_tier` directly in PostgreSQL to bypass verification flow.
- **MongoDB connection**: Uses `authSource=admin` in the connection string. If MongoDB auth fails, check that `MONGO_INITDB_ROOT_USERNAME` matches the connection string credentials.
- **Express 5 types**: `req.params.id` returns `string | string[]` — cast to `string` when passing to service methods.
- **Rate limiting on auth**: Auth endpoints are limited to 5 requests per 15 minutes. In tests, this resets between test suite runs but can cause failures if running tests repeatedly in quick succession.
