# Shhh Social — Frontend styling and issues: full handover

**Purpose:** This document describes every screen, layout, and styling detail of the Shhh mobile/web app, and lists every known frontend issue in full detail. It is intended for a developer (or AI) to fix the frontend without guessing or breaking things again. Do not downplay or omit issues. The goal is a visually stunning, professional landing page and app.

---

## 1. Tech stack and routing (critical context)

- **Framework:** Expo (React Native) with **Expo Router** (file-based routing).
- **Platforms:** iOS, Android, **Web** (same codebase; web is deployed to Vercel).
- **Entry:** `app/_layout.tsx` is the root. It wraps the app in `QueryClientProvider`, `StatusBar`, `AuthGuard`, and a root `Stack` navigator.
- **Auth flow:**
  - `AuthGuard` redirects unauthenticated users to `/(auth)` and authenticated users away from `/(auth)` to `/(tabs)`.
  - The **landing / “front” page** is **not** a separate route. It is rendered **inside** `(auth)/index.tsx` (LoginScreen) when `Platform.OS === 'web' && !showLoginForm`. So the “front page” is the **WebEntryShell** component shown conditionally on the login screen. The URL when viewing it is typically `/(auth)` or the root.
- **Breakpoints (web):** Defined in `src/constants/breakpoints.ts`: `sm: 640`, `md: 768`, `lg: 1024`, `xl: 1280`, `xxl: 1536`. `useBreakpoint()` in `src/hooks/useBreakpoint.ts` exposes `isDesktop = isWeb && width >= 1024` and **`showSidebar: isDesktop`**. So on web at viewport ≥1024px, the app shows the **desktop layout** (sidebar + main content). Below that, it shows the **mobile layout** (bottom tab bar).
- **Desktop tab content:** When `showSidebar` is true, the tabs navigator is **not** used for the main content. Instead, `(tabs)/_layout.tsx` renders **DesktopTabContent**, which uses **pathname** (`usePathname()` from expo-router) to pick one of: DiscoverScreen (index), MessagesScreen (messages), EventsScreen (events), ProfileScreen (profile). So the visible tab is driven by the **current pathname**. The sidebar uses `router.replace(item.route)` to navigate (e.g. `/(tabs)/messages`). If the pathname does not update on web (e.g. Vercel/SSR or client-side routing quirk), the UI will **always show the same screen** (e.g. only grid/Explore).

---

## 2. File and layout map

- **`app/_layout.tsx`** — Root: Stack with `(auth)`, `(tabs)`, and many other screens (chat, profile/*, album, user, event, venue, verify, whispers, subscription). Header is hidden by default; some screens override.
- **`app/(auth)/_layout.tsx`** — Stack for auth: index, register, verify-code, onboarding, onboarding-intent. Header hidden.
- **`app/(auth)/index.tsx`** — **LoginScreen.** On web when `!showLoginForm`: returns **WebEntryShell** (the “landing page”). After “Enter” or on native: shows phone input form, logo (AppIconImage), “Shhh”, “YOUR SECRET IS SAFE”, link to register.
- **`app/(tabs)/_layout.tsx`** — Tab layout. If **not** desktop: renders `<Tabs>` (bottom tab bar, 4 tabs: Explore, Chat, Events, Me). If desktop (`showSidebar`): renders PremiumDarkBackground → row of **WebSidebar** + content area → **DesktopTabContent** (single screen by pathname) + optional desktop header for non-Explore tabs.
- **`app/(tabs)/index.tsx`** — Discover/Explore: filters (radius 5/25/50 km, Verified toggle, Nearest/Active now), grid of user tiles. When `showSidebar`: also a hero row (BrandMark + “Where consent meets curiosity”) above filters. Grid uses `GAP_DESKTOP = 16` / `GAP_MOBILE = 6`, 3 columns on desktop (max tile width 300px), 2–3 on mobile.
- **`app/(tabs)/messages.tsx`** — Chat list (conversations).
- **`app/(tabs)/events.tsx`** — Events list (cards with BannerImage).
- **`app/(tabs)/profile.tsx`** — Profile/Me: hero (photo, name, badges), menu items (Edit, Privacy, Hosting, etc.).
- **`src/components/WebEntryShell.tsx`** — The **landing / front page** component (used only on web, from LoginScreen). Contains: gradient background, glows, ScrollView, wrap (maxWidth 1100), top bar (BrandMark + “Coming Soon” pill), grid (hero card left + side card right), and “Learn how it works” modal.
- **`src/components/WebSidebar.tsx`** — Desktop nav: BrandMark (compact) at top, then nav items (Explore, Chat, Events, Me) via `router.replace(route)`, then “Private · Verified · Safe” at bottom.
- **`src/components/BrandMark.tsx`** — Logo: gradient rounded square + “Shhh” + optional “social” (when not compact). Used in WebEntryShell top bar, WebSidebar, and Explore hero.

---

## 3. Design tokens (theme)

- **`src/constants/theme.ts`:**  
  - **Colors:** primary `#7C2BFF`, primaryLight `#B35CFF`, accentGold `#D4AF37`, background `#06040A`, surface `#0B0712`, text `#F7F2FF`, textSecondary `#C9B9E6`, textMuted `#9D86C7`, border `rgba(255,255,255,0.14)`, etc.  
  - **Spacing:** xxs 2, xs 4, sm 8, md 16, lg 24, xl 32, xxl 48.  
  - **Font sizes:** xxs 10 … hero 36.  
  - **Border radius:** xl 18, xxl 26, full 9999.  
  - **Shadows:** glow (plum), card (heavy), cardSoft.  
  - **Layout:** contentMaxWidth 1280, sidebarWidth 240.  
- **`src/constants/breakpoints.ts`:** breakpoints as above; CONTENT_MAX_WIDTH 1280, SIDEBAR_WIDTH 240.

---

## 4. Landing page (WebEntryShell) — structure and styles in detail

**When it’s shown:** Only when `Platform.OS === 'web'` and LoginScreen has `showLoginForm === false`. One “Enter” press sets `showLoginForm` to true and replaces the landing with the phone login form.

**Component structure (current):**

1. **Root:** `LinearGradient` (colors `#06040A`, `#0B0712`, `#08050E`, `#06040A`), style `full` (flex 1, minHeight 100vh on web).
2. **Ambient glows (absolute):** Three circular Views: glowPlum (top-left), glowPlum2 (top-right), glowGold (bottom). Large (350–400px), semi-transparent plum/gold. These sit **behind** content but can affect perceived contrast.
3. **ScrollView:** style `scroll` (flex 1), contentContainerStyle `scrollContent` (flexGrow 1, paddingBottom 40, **alignItems: 'center'**). The wrap is centered horizontally by this.
4. **Wrap:** View with style `wrap` + `maxWidth: 1100`. Wrap has: marginHorizontal 'auto', paddingHorizontal 18, paddingTop 34, paddingBottom 28, width '100%'. On React Native Web, `marginHorizontal: 'auto'` with a centered parent is intended to center the block.
5. **Top bar (top):** flexDirection row, justifyContent space-between, marginBottom 18.  
   - Left: **BrandMark** (full: gradient mark 44px, “Shhh”, “social”) in a Pressable (brandTouch).  
   - Right: **Pill:** dot (9px circle, primaryLight) + “Coming Soon” text (12px, uppercase, letterSpacing 1.2, textMuted).
6. **Grid:** flexDirection row, gap 18, marginTop 14. If width < 960 (`isNarrow`), grid becomes column (gridStack).  
   - **Hero card (left):** flex 1.1, minHeight 380, borderRadius xxl (26), border stroke, padding 30, shadows.card. Contains:  
     - heroGlow (absolute, transparent — placeholder).  
     - **Kicker:** pill with spark dot (12px, accentGold) + “Where consent meets curiosity” (12px, uppercase, muted).  
     - **H1:** “A lifestyle community for ” + nested `<Text style={h1Plum}>couples</Text>, ” + `<Text style={h1Gold}>singles</Text>, and ” + `<Text style={h1Plum}>explorers</Text>.`  
       - **Current h1 style:** marginTop 16, marginBottom 10, **fontSize 32**, lineHeight 1.2, color text, fontWeight '700'. Nested spans: h1Plum (plum color), h1Gold (gold color).  
       - **Reported bug:** This headline is **overlapping and illegible** in production — it appears as a thick, blurred purple/gold bar. Likely causes: nested Text layout on web, lineHeight/overflow, or text being clipped/overdrawn by the hero card or glows. **Must be fixed so the full headline is readable and not overlapping.**  
     - **Sub:** 16px, lineHeight 1.55, muted, maxWidth 480.  
     - **Features:** row of chips (Proximity grid, Discreet + verified, Events & venues, Privacy controls). Each: chipDot (10px circle) + label.  
     - **Glowline:** 1px line, primaryLight, opacity 0.4.  
     - **Fineprint:** 12px muted, “Launching first in Ontario…”  
   - **Side card (right):** flex 0.9, same border/shadow as hero, backgroundColor rgba(255,255,255,0.05), cardInner padding 22.  
     - “Get early access” (cardTitle).  
     - Short copy (cardP).  
     - **Enter** button: LinearGradient (plum → plum2), “Enter” label.  
     - **Learn how it works** button (outline).  
     - **Fineprint:** “By joining, you agree to our terms. **18+ only.**”  
     - **Links area:** Only a line of text: “Consent-first. No harassment. No minors.” **There are no clickable links to Terms of Service, Privacy Policy, or any other legal/policy pages.** The copy says “agree to our terms” but **no TOS link exists**. This is a **critical omission** for a proper landing page and for legal/compliance.

7. **Modal:** “How Shhh works” — Proximity-first, Consent-first, Discreet by design copy. No links.

**Missing or wrong for a proper website landing page:**

- **No footer** with links to Terms of Service, Privacy Policy, Cookie Policy, Contact, etc. The page must be restyled and extended to include a **proper footer** with real links. Those routes/pages may not exist yet (only `profile/privacy` exists for logged-in users); they may need to be added (e.g. `/terms`, `/privacy` as public pages).
- **Headline overlap** must be fixed (see above).
- **No hero image** — the “hero” is a text card only. If a hero image or logo treatment is desired, it must be specified and implemented without breaking layout.
- **Spacing and overlap:** User reports “all overlapped and looking like shit.” Every section (top bar, hero, side card, buttons, fineprint) must be reviewed for: sufficient padding/margin, no text overlapping other text or controls, and correct stacking order (no glows or absolute elements obscuring copy).
- **Logo:** BrandMark is used in the top bar. If it appears small or underutilized, sizing/placement should be adjusted so the logo is a clear, professional focal point.

---

## 5. Tabs “only stay on grid” — possible causes and details

- **Intended behavior:** On desktop, WebSidebar items call `router.replace('/(tabs)')`, `router.replace('/(tabs)/messages')`, etc. DesktopTabContent uses `usePathname()` to choose which screen to render. So when pathname is `/(tabs)/messages`, MessagesScreen should render; when `/(tabs)/events`, EventsScreen; when `/(tabs)/profile`, ProfileScreen.
- **Observed behavior:** User reports that **none of the tabs work; it only stays on grid.** So either:
  1. **Pathname never changes on web:** e.g. `router.replace` does not update the URL or the router state in the web build (Vercel), so pathname stays `/(tabs)` or `/(tabs)/` and DiscoverScreen always renders.  
  2. **Pathname format mismatch:** usePathname() might return a different shape (e.g. with base path, trailing slash, or hash). The code checks `pathname === '/(tabs)'`, `pathname === '/(tabs)/'`, and `pathname?.startsWith('/(tabs)/messages')` etc. Any difference in format (e.g. `/tabs/messages` without parens, or full URL path) would cause the wrong screen to show or always fall back to Discover.  
  3. **Sidebar not visible or not clickable:** e.g. z-index, overlay, or pointer-events so that only “grid” (Explore) is accessible.  
  4. **Desktop layout not active:** If `showSidebar` is false (e.g. breakpoint or useWindowDimensions returning a small width on load), the bottom tab bar would show instead; if that bar is broken or not visible on web, user might only see the initial tab (Explore).

**What to verify/fix:** Ensure on web at desktop width: (a) pathname updates when sidebar items are clicked, (b) pathname comparison in DesktopTabContent matches the actual pathname format (log it if needed), (c) sidebar is visible and clickable, (d) no single-tab fallback due to incorrect pathname checks.

---

## 6. Desktop layout (authenticated) — in detail

- **Structure when showSidebar:**  
  PremiumDarkBackground (flex 1) → View (webRow: flex 1, flexDirection row) → WebSidebar (fixed width 240) + View (contentWrap: flex 1, alignItems center, minHeight 0, overflow hidden on web) → View (contentInner: width 100%, maxWidth 1280, flex 1, minHeight 0, overflow hidden on web) → View (tabsWrap: flex 1, minHeight 0) → DesktopTabContent.
- **DesktopTabContent:** If title !== 'Explore', a desktop header View is rendered (padding, borderBottom) with the tab title (Chat, Events, Me). Then a screenWrap View (flex 1, minHeight 0) wraps the chosen Screen component (DiscoverScreen, MessagesScreen, EventsScreen, or ProfileScreen).
- **WebSidebar:** 240px wide, borderRight, BrandMark (compact) at top, then four Pressables (Explore, Chat, Events, Me) with router.replace(route), then “Private · Verified · Safe” at bottom. Active state uses primarySoft background and primaryLight label.

---

## 7. Mobile layout (authenticated)

- **Tabs:** Bottom tab bar (position absolute, bottom 0), 4 tabs. Tab bar is hidden when showSidebar (desktop). Each tab has icon + label; active has a small dot. Headers: Explore shows “Shhh” as header title; others use default.
- **Screens:** Same four screens as desktop; they are rendered by the Tabs navigator (not by pathname picker).

---

## 8. Auth screens (non-landing)

- **(auth)/index.tsx (login form):** AuthScreenBackground, glow, centered content (maxWidth 420), AppIconImage (72px), “Shhh”, “YOUR SECRET IS SAFE”, phone input, Continue button, link to register. No WebEntryShell when showLoginForm is true.
- **Other (auth) screens:** register, verify-code, onboarding, onboarding-intent — not described here but exist under (auth).

---

## 9. Explicit list of issues to fix (do not skip)

1. **Landing (WebEntryShell) — headline overlap:** The main headline (“A lifestyle community for couples, singles, and explorers.”) is overlapping and illegible (blurred/thick bar). Fix text layout (nested Text, lineHeight, overflow, or remove overlapping elements) so the full headline is clearly readable.
2. **Landing — no TOS/Policy links:** The page says “By joining, you agree to our terms” but has **no link to Terms of Service**. There are **no links** to Privacy Policy, Cookie Policy, or other legal pages. Add a **proper footer** (and/or inline links) with **clickable links** to Terms of Service, Privacy Policy, and any other required policies. Create routes/pages for these if they do not exist (e.g. public `/terms`, `/privacy`).
3. **Landing — overall overlap and polish:** Review entire landing for overlapping elements, cramped spacing, and “looking like shit.” Ensure: clear spacing between sections, no text/control overlap, professional typography and hierarchy. Make it look like a **proper website landing page**, not a broken single-page mock.
4. **Tabs only stay on grid:** On desktop web, clicking Chat, Events, or Me does not switch the main content; only Explore/grid is shown. Fix pathname-based tab switching (router.replace updating pathname, pathname comparison, and/or sidebar visibility/clickability) so all four tabs work.
5. **Logo/hero utilization:** Ensure the logo (BrandMark) is used prominently and clearly on the landing and that any intended “hero” treatment (image or visual) is implemented without breaking layout or overlapping copy.
6. **Grid spacing (if still an issue):** On desktop, the Explore grid should have clear spacing between tiles (currently GAP_DESKTOP 16 and marginBottom on tiles). If it still looks cluttered, increase gaps or adjust layout.
7. **No stacking of tab content:** Ensure only one tab content is visible at a time (no Chat/Events/Profile overlaying the grid). Current implementation uses a single screen by pathname; if stacking still occurs, fix layout/overflow or mounting so only the active tab is shown.

---

## 10. What the front screen MUST become (requirements)

- A **proper website landing page** with:  
  - Clear, readable headline and copy (no overlap).  
  - Prominent, professional use of logo/brand.  
  - **Footer (and/or inline) links to:** Terms of Service, Privacy Policy, and any other policies (e.g. Cookie Policy, Community Guidelines). Links must be **clickable** and point to real pages or placeholders.  
  - Sufficient spacing and hierarchy so the page does not look broken or “like shit.”  
  - Optional: hero image or stronger hero section, if specified, without breaking the above.  
- Tabs (Explore, Chat, Events, Me) must **all work** on desktop; clicking each must show the correct screen.  
- The app must progress toward a **visually stunning, million-dollar quality** frontend; no downplaying of layout or styling issues.

---

## 11. File reference (quick)

| What | File |
|------|------|
| Landing page UI | `mobile/src/components/WebEntryShell.tsx` |
| Where landing is shown | `mobile/app/(auth)/index.tsx` (when web && !showLoginForm) |
| Desktop tabs by pathname | `mobile/app/(tabs)/_layout.tsx` (DesktopTabContent) |
| Sidebar nav | `mobile/src/components/WebSidebar.tsx` |
| Logo | `mobile/src/components/BrandMark.tsx` |
| Theme | `mobile/src/constants/theme.ts` |
| Breakpoints | `mobile/src/constants/breakpoints.ts`, `mobile/src/hooks/useBreakpoint.ts` |
| Auth redirect | `mobile/src/components/AuthGuard.tsx` |
| Root routes | `mobile/app/_layout.tsx` |

Use this document as the single source of truth for frontend structure, styling, and issues when making changes. Fix issues in the order that unblocks the user (e.g. headline overlap and TOS links first, then tab switching).
