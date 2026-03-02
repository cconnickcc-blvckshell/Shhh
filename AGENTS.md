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

### Running the Mobile App (Expo)

**Expo Go (no native build):** Easiest way to run on the Android emulator without building native code:

1. Start the **backend** (so the app can hit the API): `cd backend && npm run dev`
2. Start an **Android emulator** (e.g. from Android Studio → Device Manager → Run).
3. In the project root: `cd mobile && npx expo start`
4. Press **`a`** in the terminal — Expo opens your app in **Expo Go** on the emulator (JS loads from Metro; no Gradle/NDK build).

Requires **Expo Go** installed on the emulator (Expo usually installs it when you press `a`, or install from Play Store on the emulator). Use this for day-to-day dev; use EAS Build when you need a standalone APK or custom native code.

**Full native build (when needed):** `npm run android` / `npx expo run:android` builds the native app (fails on Windows with current toolchain; use EAS Build or WSL2).

**Opening in Android Studio:** The app is Expo-managed, so there is no `android/` folder in the repo by default. Generate native projects, then open the Android project:

```bash
cd mobile
npx expo prebuild
```

Then in Android Studio: **File → Open** → select the `mobile/android` folder. You can run the app from Android Studio (Play button) or keep using `npx expo run:android` from the `mobile` directory. Use **File → Sync Project with Gradle Files** if dependencies change.

**Windows — JAVA_HOME required for `expo run:android`:** Gradle needs a JDK. If you see "JAVA_HOME is not set", set it to Android Studio’s bundled JRE (PowerShell, current session): `$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"`. To set permanently: **System properties → Environment Variables** → add `JAVA_HOME` = `C:\Program Files\Android\Android Studio\jbr`.

**Android local build on Windows:** Local `npx expo run:android` can hit Gradle "Could not move temporary workspace" (fix: delete `mobile/android/.gradle`, add folder to Defender exclusions, keep `org.gradle.configuration-cache=false` in gradle.properties) and NDK 27 / react-native-reanimated C++ errors. For a reliable Android build, use **EAS Build**: `npx eas build --platform android --profile development` (builds on Linux; install the resulting APK on device/emulator). Alternatively try building under WSL2.

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
