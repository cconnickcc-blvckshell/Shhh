# Shhh — Mobile Build & Release Guide

> **Purpose:** How to build and release the Shhh mobile app (Expo/React Native).  
> **Audience:** Mobile developers, release managers.

---

## 1. Overview

- **Framework:** Expo 55, React Native
- **Navigation:** expo-router (file-based)
- **State:** Zustand, @tanstack/react-query
- **Build:** EAS Build (Expo Application Services) or local `npx expo run:android` / `npx expo run:ios`

---

## 2. Development

### Expo Go (no native build)

1. Start backend: `cd backend && npm run dev`
2. Start Android emulator (or physical device)
3. Run: `cd mobile && npx expo start`
4. Press `a` for Android or `i` for iOS simulator

Expo Go loads JS from Metro; no Gradle/Xcode build. Best for day-to-day dev.

### API URL

- **Development:** App uses `localhost` (web) or `10.0.2.2:3000` (Android emulator) for API.
- **Production:** Set `EXPO_PUBLIC_API_URL` in environment (e.g. `https://api.shhh.app`).
- **Location:** `.env` or `app.config.js`; see Expo env docs.

---

## 3. EAS Build

### Prerequisites

- EAS CLI: `npm i -g eas-cli`
- Expo account: `eas login`
- Project: `app.json` has `extra.eas.projectId` (replace `your-eas-project-id` with real ID)

### Build

```bash
cd mobile
eas build --platform android --profile development   # Dev APK
eas build --platform android --profile development  # Production APK
eas build --platform ios --profile development      # iOS (requires Apple dev account)
```

### Profiles

Configure in `eas.json` (create if missing). Typical profiles:

- `development` — Dev build with debug config
- `preview` — Internal testing
- `production` — Store release

---

## 4. Environment Variables

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API base URL. When set, app uses this instead of localhost/10.0.2.2. |

Set in `eas.json` per profile or via EAS Secrets:

```bash
eas secret:create --name EXPO_PUBLIC_API_URL --value https://api.shhh.app
```

---

## 5. App Configuration

| File | Purpose |
|------|---------|
| `app.json` | Expo config: name, slug, version, permissions, plugins |
| `app.config.js` | Optional: dynamic config from env |

### Permissions (Android)

- `CAMERA`, `READ_EXTERNAL_STORAGE`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`

### Permissions (iOS)

- Camera, Photo Library, Location (When In Use, Always) — in `infoPlist`

---

## 6. Release to Stores

### Android (Play Store)

1. Build: `eas build --platform android --profile production`
2. Download AAB/APK from EAS build page
3. Upload to Google Play Console

### iOS (App Store)

1. Build: `eas build --platform ios --profile production`
2. Requires Apple Developer account, provisioning profiles
3. Submit via EAS Submit or Transporter

```bash
eas submit --platform ios --latest
```

---

## 7. OTA Updates (Expo Updates)

Expo supports OTA JS updates without store submission. Configure:

- `expo-updates` in `app.json`
- EAS Update: `eas update --branch production`

---

## 8. Versioning

- **Version:** `app.json` → `expo.version` (e.g. `1.0.0`)
- **Build number:** `expo.ios.buildNumber`, `expo.android.versionCode` — increment for each store submission.

---

## 9. Known Gotchas

- **Windows:** `npx expo run:android` may fail (Gradle, NDK). Use EAS Build or WSL2.
- **JAVA_HOME:** Required for local Android build. Set to Android Studio JBR.
- **Expo Go:** Not for production; use EAS Build for standalone APK/IPA.
