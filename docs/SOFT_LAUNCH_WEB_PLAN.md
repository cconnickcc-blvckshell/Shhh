# Shhh — Soft Launch as Website/Web App: Plan (Post–CTO Review)

**Goal:** Soft-launch as a **visually stunning, million-dollar-feel website/web app** without rebuilding the existing product.  
**Constraint:** Reuse backend, auth, API client, navigation, and all current screens; add **adaptive web layout, mandatory entry experience, and signature polish** so the same codebase feels inevitably premium on web.

**Status:** In progress. Phase 1–4 implemented (layout, sidebar, grids, polish, entry shell, trust, env). PWA: manifest, theme-color, Add to Home Screen. Hero/logo from `mobile/public/` for Vercel.  
**Execution plan:** **[FRONTEND_REFACTOR_STRATEGY.md](./FRONTEND_REFACTOR_STRATEGY.md)** — web authority first, one navigation authority, layout spine, flex hardening, blur invariant, SafeState, visual discipline. Do in order; no skipping.  
**Brand assets:** `Shh.logo.on.black.png` (wordmark on black — header/footer); `shhh.hero.png` (hero image). Copy to `mobile/public/` for web build (hero.png, logo.png). PWA icons in `mobile/public/` (icon-192.png, icon-512.png).

---

## 0. Launch philosophy (CTO directive)

> We are not launching a “web version of a mobile app.”  
> We are launching **the product itself**, expressed through the web first.

**Principles:**

- **One codebase, one identity** — Expo-first; no separate web app; platform-appropriate layout only.
- **Emotion before functionality** — First impression (entry shell, hero moment) sets tone; then flows.
- **Trust before conversion** — Trust signals visible early; consent and discretion explicit.
- **Intentional moments** — At least one signature visual/interaction users remember; no “fluid chaos” on ultrawide.

The web soft launch is **the foundation**, not a compromise.

---

## 1. Current state (what we keep)

| Asset | Status | Reuse as-is |
|-------|--------|-------------|
| **Backend API** | Express, full REST + WebSocket | ✅ 100% |
| **Mobile app** | Expo 55, React Native, expo-router | ✅ Same codebase |
| **Web build** | `expo start --web` (react-native-web, Metro) | ✅ Already runs in browser |
| **Auth** | Phone OTP, OAuth (Apple, Google, Snapchat), JWT, useAuthStore, AuthGuard | ✅ AuthOptions (phone, Apple, Google, Snap) with pros/cons |
| **API client** | Same for web (localhost or env API_BASE) | ✅ No change |
| **Screens** | All 35+ routes (auth, tabs, chat, venue, album, etc.) | ✅ No new screens required for MVP web |
| **Theme** | `theme.ts` (colors, spacing, fontSize, radii, shadows) | ✅ Extend, don’t replace |
| **Backgrounds** | PremiumDarkBackground, LinearGradient, etc. | ✅ Work on web |

**Conclusion:** We do **not** build a second web app. We make the **existing Expo app** responsive and web-optimized so it looks and feels like a premium website on large screens.

---

## 2. Strategy: One codebase, adaptive web

- **Single codebase:** `mobile/` remains the app. No separate React/Vite “web app” unless product later demands a completely different web experience (e.g. marketing site with different info architecture).
- **Platform + viewport:** Use `Platform.OS === 'web'` and window width (breakpoints) to:
  - Switch **navigation**: bottom tabs on mobile, **sidebar nav** on web (desktop).
  - Widen **content**: max-width container (e.g. 1200–1400px) centered on web; more columns in grids (Discover, Events, albums).
  - Add **web-only polish**: hover states, optional custom web font, focus rings, subtle transitions.
- **Same URLs and routes:** expo-router works on web; deep links and auth flow stay identical.

---

## 3. What “visually stunning” means (without a rebuild)

| Area | Today (mobile-first) | Web enhancement (no rewrite) |
|------|----------------------|------------------------------|
| **Navigation** | Bottom tab bar (4 tabs) | On web: **sidebar** (vertical nav) with same 4 items; content area to the right. Feels like a web app, not a phone in a browser. |
| **Content width** | Full-width screens | On web: **locked max-width** 1200–1280px, centered column, **consistent vertical rhythm**; no fluid stretch on ultrawide. |
| **Grids** | Discover 2–3 columns; Events list | On web: **4–5 columns** Discover; Events as cards in a responsive grid; denser but still readable. |
| **Typography** | System / default | Optional: **one custom font** (e.g. Google Font) for headings on web only; keep system for body or use same font. |
| **Interactivity** | Tap only | **Hover states** on cards, buttons, nav items; **one signature brand-defining interaction** (e.g. discover cards glow/depth on hover, or “Enter” button motion) over-invested so users notice subconsciously. |
| **Focus / a11y** | Basic | **Visible focus rings** on web for keyboard nav; same screens, better accessibility. |
| **Entry experience** | App opens to login or tabs | **Mandatory:** Web Entry Shell when unauthenticated (hero image, logo, “Enter” + “Learn how it works”); tone-setting before auth. |
| **Trust** | In product, implied | **Explicit:** one persistent trust indicator near nav/header; one microcopy line (consent/privacy); one visible verification affordance early. |
| **Performance** | One bundle | Ensure **code-splitting** where possible (expo-router already lazy-loads routes); keep bundle size reasonable for web. |

We do **not** redesign every screen from scratch. We add a **web layout shell** (sidebar + content area), **responsive breakpoints** in key screens, and **targeted polish** (hover, font, focus).

---

## 4. Technical approach (recommended)

### 4.1 Layout: web vs native

- **File:** `mobile/app/(tabs)/_layout.tsx` (or a wrapper used only when `Platform.OS === 'web'`).
- **Logic:**
  - If **native** (iOS/Android): keep current `<Tabs>` with bottom tab bar.
  - If **web** and **width ≥ breakpoint (e.g. 768 or 1024):**
    - Render a **sidebar** (vertical list: Explore, Chat, Events, Me) and a **content area** that shows the active tab’s screen.
    - Use expo-router’s segment to know which tab is “active” and highlight it in the sidebar; clicking a sidebar item navigates to that tab (e.g. `router.replace('/(tabs)')` or the specific tab index).
  - If **web** and **width < breakpoint:** keep bottom tabs (or a collapsed sidebar that opens as a drawer) so tablets/small windows still work.

**Implementation options:**

- **A. Inline in `_layout.tsx`:** `Platform.OS === 'web' && useWindowDimensions().width >= 1024` → render `<View style={{ flexDirection: 'row' }}><Sidebar /><Outlet or tab content /></View>`. Tab “content” is the current child route (index, messages, events, profile). Expo-router’s `<Tabs>` might still work with `tabBarStyle: { display: 'none' }` on web when sidebar is shown; then sidebar just does `router.push('/(tabs)')` or similar to switch.
- **B. Platform-specific file:** `_layout.web.tsx` that implements the sidebar layout and uses a simple state or route to show the correct tab content; other platforms keep using `_layout.tsx` (default). Cleaner separation, slightly more to maintain.
- **C. Shared layout component:** One `AppLayout` that takes `platform` and `width` and returns either bottom Tabs or sidebar + content. Used by both `_layout.tsx` and, if needed, `_layout.web.tsx`.

**Recommendation:** Start with **A** (conditional inside existing `_layout.tsx`) to avoid file duplication; move to **B** if the file gets too large or you want different web routes later.

### 4.2 Breakpoints and responsive hooks

- Add a small **breakpoint** constant set (e.g. in `theme.ts` or `src/constants/breakpoints.ts`):
  - `sm: 640`, `md: 768`, `lg: 1024`, `xl: 1280`, `xxl: 1536` (or match Tailwind-style values).
- **Hook:** `useBreakpoint()` or use `useWindowDimensions()` and derive `isDesktop = width >= 1024`, `isWeb = Platform.OS === 'web'`. Use in layout and in key screens (Discover, Events, album list) to choose column count or layout variant.
- **No new dependency required;** `useWindowDimensions` is from React Native and works on web.

### 4.3 Signature layout constraint (locked)

- **Invariant:** Million-dollar feel = no accidental stretch; negative space intentional; content breathes.
- **Enforce on web:**
  - **maxWidth:** 1200–1280px (single source of truth, e.g. `theme.layout.contentMaxWidth`).
  - **Centered column:** `alignSelf: 'center'`, `width: '100%'`.
  - **Consistent vertical rhythm:** shared spacing scale (e.g. from `theme.spacing`) for sections; no ad-hoc margins on ultrawide.
- **Global:** Wrap main content in one wrapper; no “fluid chaos” on ultrawide monitors.

### 4.4 Content width and grids

- **Discover:** Already uses `useWindowDimensions()` and `cols`; extend so on web with width > 1024, `cols` is 4 or 5.
- **Events:** On desktop web, show event cards in a 2–3 column grid instead of single column if that fits the design.
- **Album list:** Already 2 columns; on web 3–4 columns is easy.

### 4.5 Web-only polish and one brand-defining interaction

- **Hover:** For web, use `style` with hover when possible; `useHover()` on cards and nav items (opacity/background).
- **Focus:** Add `focusStyle` or equivalent for focusable elements so keyboard users see a clear ring (e.g. `outline: 2px solid colors.primary` on web).
- **Font (optional):** Load one web font for headings on web only; keep body readable.
- **One brand-defining interaction (mandatory):** Pick **one** and over-invest so it’s subconsciously memorable. Options (choose one):
  - Discover cards: subtle glow + depth on hover (shadow/scale/opacity).
  - Sidebar icons: slight animation on hover (e.g. scale or color transition).
  - “Enter” / “Join” button on Entry Shell: unique motion curve (e.g. ease-out scale or gradient shift).
  - Profile/venue cards: tactile feel (e.g. lift + shadow on hover).
- No animations everywhere; one signature moment that says “this is not Tinder, this is its own universe.”

### 4.6 Web Entry Shell (mandatory — not optional)

For this brand (identity-driven, trust-sensitive, consent-based), unauthenticated web users **must** get a tone-setting first impression before auth.

- **Scope:** One route, one (or few) files; web-only when unauthenticated; reuse assets. Not a full marketing site.
- **Layout:** Full-height dark background; purple glow / smoke motif; one hero line.
- **Assets:**
  - **Hero:** `shhh.hero.png` — hero image (purple glow, intimate scene) as the main visual.
  - **Logo:** `Shh.logo.on.black.png` — wordmark on black; use in **header or footer** of the entry shell.
- **CTAs:** Two buttons only:
  - **“Enter”** — funnel into existing auth (phone → verify flow).
  - **“Learn how it works”** — modal or accordion on the same screen (no new site or route).
- **Purpose:** Establish tone, consent-first framing, discretion + legitimacy; then funnel into existing auth. No backend changes.

### 4.7 Explicit trust signals

Trust must be **visible**, not implied. Required in UI:

- **One persistent trust indicator** near nav or header (e.g. “Private · Verified · Safe” or a small badge row) so it’s always visible on web.
- **One microcopy line** reinforcing consent/privacy (e.g. on Entry Shell or auth screen: “You control who sees what. Always.”).
- **One clear verification affordance** visible early (e.g. on profile or Me: “Verify your account” or checkmark) so “verified” is not just text.

This separates “premium, consent-first” from “sleazy hookup” perception.

### 4.8 Meta and PWA

- Custom `<title>` and meta tags per route for SEO/share; favicon and app name in `app.json` / index.html.
- PWA basics if time allows.

### 4.9 What we avoid (to not rebuild)

- **No separate React/Vite “web app”** that reimplements screens (unless you later decide to split).
- **No full visual redesign** of every screen; we adapt layout and density, not flows.
- **No replacing React Native components with DOM-only components** for the whole app; we stay in RN/Expo for one codebase.

---

## 5. Phased plan (for review)

### Phase 1 — Web layout and navigation (foundation) ✅

- **1.1** ✅ Breakpoints in `src/constants/breakpoints.ts`; `useBreakpoint()` in `src/hooks/useBreakpoint.ts` (isWeb, isDesktop, showSidebar, contentMaxWidth).
- **1.2** ✅ `(tabs)/_layout.tsx`: when `showSidebar`, render `WebSidebar` + content area; Tabs with `tabBarStyle: { display: 'none' }`; sidebar drives navigation via `router.replace`.
- **1.3** ✅ `theme.layout.contentMaxWidth` (1280); content wrapper in layout with `maxWidth`, centered; spacing from theme.
- **Deliverable:** ✅ Desktop web shows sidebar and locked-width content.

### Phase 2 — Responsive density and grids ✅

- **2.1** ✅ Discover: `useBreakpoint().isDesktop` → 5 columns; else 2–3 by width.
- **2.2** ✅ Events: `numColumns = isDesktop ? 2 : 1`; `columnWrapperStyle` for gap.
- **2.3** ✅ Album list: `numColumns = isDesktop ? 4 : 2`.
- **Deliverable:** ✅ Key screens use space better on desktop.

### Phase 3 — Web polish and one signature interaction ✅

- **3.1** ✅ `useHover()` hook (`src/hooks/useHover.ts`); Discover tiles use it; sidebar has active + focus styles.
- **3.2** ✅ Sidebar items: focus ring via onFocus/onBlur state (border 2px primary); keyboard-accessible.
- **3.3** ✅ **Signature interaction:** Discover cards — glow (shadows.glow) + scale(1.03) on hover via `DiscoverTile` + `useHover`.
- **3.4** Optional: custom font for headings (not done).
- **Deliverable:** ✅ Web has hover + focus + one signature moment (discover card glow/depth).

### Phase 4 — Web Entry Shell, trust signals, and soft-launch readiness ✅

- **4.1** ✅ **Web Entry Shell:** `WebEntryShell` component; shown from `(auth)/index` when `Platform.OS === 'web' && !showLoginForm`; “Enter” sets `showLoginForm(true)` to reveal login; “Learn how it works” opens modal (proximity, consent, discreet copy). Hero/logo imagery: gradient + wordmark text for now; add `hero.png` / `logo-wordmark.png` to `mobile/assets/images/` when ready.
- **4.2** ✅ **Trust signals:** Persistent “Private · Verified · Safe” in sidebar footer; “You control who sees what. Always.” on Entry Shell footer. Verification affordance: existing on Me/profile (Verify).
- **4.3** Meta tags / favicon: document in runbook; not yet implemented.
- **4.4** ✅ API base: `EXPO_PUBLIC_API_URL` in `.env.example`; `client.ts` uses it when set (strip trailing slash).
- **4.5** Smoke-test: run `expo start --web` and validate entry → login → tabs; sidebar; grids; hover.
- **Deliverable:** ✅ Entry shell and trust visible; env documented.

---

## 6. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| **Expo/Metro web bundle size** | Rely on expo-router’s lazy loading; avoid pulling in heavy native-only deps on web; profile bundle if needed. |
| **react-native-web quirks** | Test ScrollView, FlatList, modals, and inputs on web; use Platform.OS where behavior differs. |
| **Sidebar + Tabs routing** | Use a single source of truth (e.g. current pathname) to drive both sidebar highlight and which tab content to show; avoid duplicate state. |
| **Location on web** | Already fallback in useLocation; optionally add “Use my location” button that calls browser geolocation and then updates discovery. |
| **SecureStore on web** | Expo SecureStore may use localStorage on web; confirm auth token persistence works. |

---

## 7. Out of scope for this plan

- **Native app store builds** (iOS/Android) — can follow later; this plan is web soft-launch.
- **Admin dashboard** — already a separate React/Vite app; no change needed for user-facing soft launch.
- **New features** (Stories, Tonight, etc.) — covered by MASTER_IMPLEMENTATION_CHECKLIST; this plan is layout and polish for existing app on web.
- **SSR / SEO** — not required for soft launch; add later if you need deep indexing.

---

## 8. Success criteria (post–CTO review)

- [x] **Web Entry Shell:** Unauthenticated web users see the entry screen (“Enter”, “Learn how it works”) before auth.
- [x] **Signature layout:** On desktop, content is **locked** max-width 1280px, centered.
- [x] On desktop browser, user sees **sidebar nav** and **contained content**.
- [x] **One brand-defining interaction:** Discover cards glow + scale on hover.
- [x] **Trust signals:** “Private · Verified · Safe” in sidebar; “You control who sees what. Always.” on Entry Shell.
- [ ] All flows smoke-tested on web: entry → auth, discover, events, chat, profile, venue, subscription.
- [x] **Hover** and **focus** on sidebar and discover cards.
- [x] **No second codebase:** one `mobile/` app; web is an output of the same app.
- [ ] Meta/favicon and production deploy runbook when ready.

---

## 9. Brand assets (for implementation)

- **Logo (header/footer):** `Shh.logo.on.black.png` — wordmark on black. Place in `mobile/assets/images/` (or equivalent) so the Expo web app can reference it; use in Web Entry Shell header or footer.
- **Hero:** `shhh.hero.png` — hero image (purple glow, intimate scene). Same location; use as main visual on the Entry Shell.
- If assets are provided elsewhere (e.g. workspace `assets/` with names like `c__Projects_Shhh_images_Shh.logo.on.black.png`), copy them into `mobile/assets/images/` with simpler names (e.g. `logo-wordmark.png`, `hero.png`) for easier imports and document the mapping here.

## 10. Layout Contract Gate (required before deploy)

Before web goes public, run the **Layout Contract Gate** — structural QA, not optional polish. See **[FRONTEND_REFACTOR_STRATEGY.md](./FRONTEND_REFACTOR_STRATEGY.md)** § Layout Contract Gate for the full checklist (PageShell on every screen, no raw root flex, ImageBackground explicit height, row children minWidth: 0, card minHeight, no arbitrary spacing, no blur bypass).

## 11. Deploying to Vercel (why you saw 404)

Vercel shows **“Ready”** when the deploy step runs, but **“No framework detected”** means it didn’t build your app — it deployed the repo root (or a default), so you get **404** when opening the URL.

**Fix: point Vercel at the Expo web app and use a static export.**

1. **In Vercel → Project → Settings → General**
   - Set **Root Directory** to **`mobile`** (so the app that gets built is the Expo app).
   - Save.

2. **Build settings** (Vercel can read these from `mobile/vercel.json` if root is `mobile`):
   - **Build Command:** `npm run build` (runs `expo export --platform web`).
   - **Output Directory:** `dist`.

3. **In the repo** (already done):
   - `mobile/app.json`: `expo.web.output` = `"static"`.
   - `mobile/package.json`: script `"build": "expo export --platform web"`.
   - `mobile/vercel.json`: `buildCommand`, `outputDirectory`, and SPA rewrites so routes serve `index.html`.

4. **Redeploy:** Push a commit or trigger a redeploy. Vercel will build from `mobile/`, run `npm run build`, and serve the contents of `mobile/dist/`. The preview URL should then render the app instead of 404.

5. **Production API:** Set env var **`EXPO_PUBLIC_API_URL`** in Vercel to your backend URL (e.g. `https://api.yourdomain.com`) so the web app talks to your API.

## 12. Next steps after review

1. **Stakeholder sign-off** on: one codebase, sidebar on web, **mandatory Entry Shell**, layout lock, one signature interaction, trust signals.
2. **Implement Phase 1** (layout + sidebar + signature layout constraint); validate in browser.
3. **Implement Phases 2–4** including Web Entry Shell and trust signals; iterate for soft-launch date.
4. **Document** web-specific env (e.g. `EXPO_PUBLIC_API_URL`) and deployment steps in ARCHITECTURE or a short runbook.

---

**End of plan.**  
For implementation scope (bugs and features) see **MASTER_IMPLEMENTATION_CHECKLIST.md** and **SCOPE_PIVOT_TODO.md**. For UX/UI details see **UX_UI_SPEC.md** and **UX_BEHAVIOR_SPEC.md**.
