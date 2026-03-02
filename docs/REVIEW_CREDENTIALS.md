# Shhh — Review credentials & launch

Use these **phone numbers** to sign in after running the seed. Auth is **phone-based** (no password). In dev, Twilio is typically not configured, so the app may show an OTP in an alert or you can use direct login where supported.

---

## How to sign in

### Mobile app (Expo)

1. Open the app (e.g. `npx expo start` from `mobile/`).
2. On **Login**, enter one of the phone numbers below.
3. Tap **Continue**.
   - If the backend allows **direct login** for existing users, you may go straight to the main app.
   - Otherwise you’re sent to **Verify code**. In dev, the send-code response often includes **devCode** in an alert — enter that 6-digit code and continue.

### Admin dashboard

1. Open http://localhost:5173 (or 5174 if 5173 is in use) after `npm run dev` in `admin-dashboard/`.
2. On **Login**, enter the **Admin** phone number below.
3. Tap **Login**. The dashboard uses direct login (no OTP step). Backend must be running on port 3000 for login to succeed.

---

## Account list (by role)

| Role | Phone | Display name | Notes |
|------|--------|---------------|--------|
| **Admin** | `+15550000001` | Alex & Jamie | Use for **Admin dashboard** (Command Center). Also a linked couple (with Kira), host, ID-verified, lifestyle. |
| **Premium (Phantom)** | `+15550000004` | Jade | Active Phantom subscription (no ads, 3 personas, etc.). Use to test Premium screen and paywalled features. |
| **Venue host / Venue owner** | `+15550000003` | Marcus & Nia | `is_host` true, hosts events, reference-verified. After seed: **The Purple Room** is owned by this user — Me → **Venues** → tap venue for full Venue Dashboard (realtime, today, events, specials, staff). Tier 2+ required for “Venues” menu. Also hosts: Sasha & Dom `+15550000007`, Zara `+15550000010`, Nyx & Atlas `+15550000012`. |
| **Normal user** | `+15550000008` | Kai | Photo-verified, social intent, no host, no premium. Good default “normal” account. |
| **Curious (protected lane)** | `+15550000002` | Kira | Curious intent, `discovery_visible_to: social_and_curious`. Linked as partner to Alex & Jamie in seed. |
| **New / unverified** | `+15550000013` | Lily | Tier 0, unverified, curious. Use to test onboarding and tier-gated flows. |
| **Couple (other half)** | `+15550000002` | Kira | Same as Curious; linked to `+15550000001` (Alex & Jamie) in seed. Open **Couple** screen as either to see linked state. |

---

## Quick reference — phones only

- **Admin / couple / host:** `+15550000001`
- **Premium:** `+15550000004`
- **Venue host (other):** `+15550000003`, `+15550000007`, `+15550000010`, `+15550000012`
- **Normal:** `+15550000008`
- **Curious / couple partner:** `+15550000002`
- **New / unverified:** `+15550000013`

---

## Launch commands

From repo root (ensure Docker is up: `docker compose up -d`):

```bash
# Backend (API + WebSocket)
cd backend && npm run migrate && npm run dev
# → http://localhost:3000  (Swagger: http://localhost:3000/docs)

# Admin dashboard
cd admin-dashboard && npm run dev
# → http://localhost:5173

# Mobile (Expo)
cd mobile && npx expo start
# → Scan QR or use simulator; point API to backend (see mobile .env or api client base URL)
```

Seed (if not already run):

```bash
cd backend && npm run seed
```

---

## API base URL (mobile)

Mobile app talks to the backend via `mobile/src/api/client.ts`:  
- Web: `http://localhost:3000`  
- Android emulator: `http://10.0.2.2:3000`  
- iOS simulator: `http://localhost:3000`

Ensure the backend is running and reachable from the device/emulator.
