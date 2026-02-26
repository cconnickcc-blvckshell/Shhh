# Shhh

Geosocial networking backend API built with Node.js, Express, TypeScript, PostgreSQL/PostGIS, Redis, and MongoDB.

## Quick Start

```bash
# Start infrastructure services
docker compose up -d

# Install dependencies
cd backend && npm install

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

The API will be available at `http://localhost:3000`.

## Tech Stack

- **Runtime**: Node.js 22 + TypeScript (strict mode)
- **Framework**: Express with Helmet, CORS, compression, rate limiting
- **Database**: PostgreSQL 16 + PostGIS 3.4 (geospatial queries)
- **Cache**: Redis 7 (session caching, geolocation cache)
- **Messages**: MongoDB 7 (message storage with TTL)
- **Auth**: JWT with refresh token rotation, Argon2id hashing
- **Real-time**: Socket.io WebSocket server
- **Validation**: Zod schema validation
- **Logging**: Pino structured logging

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/v1/auth/register` | Register with phone |
| POST | `/v1/auth/login` | Login with phone |
| POST | `/v1/auth/refresh` | Refresh access token |
| DELETE | `/v1/auth/logout` | Logout (revoke tokens) |
| GET | `/v1/users/me` | Get current user profile |
| PUT | `/v1/users/me` | Update profile |
| POST | `/v1/users/:id/like` | Like a user |
| POST | `/v1/users/:id/pass` | Pass on a user |
| POST | `/v1/users/:id/block` | Block a user |
| POST | `/v1/users/:id/report` | Report a user |
| GET | `/v1/discover` | Find nearby users (PostGIS) |
| POST | `/v1/discover/location` | Update location |
| GET | `/v1/conversations` | List conversations |
| POST | `/v1/conversations` | Create conversation |
| GET | `/v1/conversations/:id/messages` | Get messages |
| POST | `/v1/conversations/:id/messages` | Send message |
| GET | `/v1/events/nearby` | Find nearby events |
| POST | `/v1/events` | Create event |
| POST | `/v1/events/:id/rsvp` | RSVP to event |
| POST | `/v1/events/:id/checkin` | Check in at event |
| POST | `/v1/compliance/data-export` | GDPR data export |
| DELETE | `/v1/compliance/account-deletion` | Request account deletion |
| POST | `/v1/compliance/consent` | Record consent |

## Scripts

```bash
npm run dev        # Start dev server with hot reload
npm run build      # TypeScript compilation
npm run lint       # ESLint check
npm run lint:fix   # Auto-fix lint issues
npm run test       # Run test suite
npm run typecheck  # TypeScript type checking
npm run migrate    # Run database migrations
```

## Architecture

```
backend/src/
├── config/         # Database, Redis, MongoDB, app config
├── middleware/      # Auth, rate limiting, validation, errors
├── modules/
│   ├── auth/       # JWT auth, registration, login
│   ├── users/      # Profiles, likes, blocks, reports
│   ├── discovery/  # PostGIS geolocation engine
│   ├── messaging/  # Conversations + MongoDB messages
│   ├── events/     # Events, RSVPs, check-ins
│   └── compliance/ # GDPR data export, deletion, consent
├── websocket/      # Socket.io real-time messaging
└── database/       # Migrations
```
