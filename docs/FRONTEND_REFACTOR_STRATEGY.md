# Frontend Refactor Strategy — Web Authority First

**Status:** Authoritative plan. No skipping.  
**Related:** [FRONTEND_AUDIT_REPORT.md](./FRONTEND_AUDIT_REPORT.md) (diagnostics) | [SOFT_LAUNCH_WEB_PLAN.md](./SOFT_LAUNCH_WEB_PLAN.md) (original web plan) | [UX_UI_SPEC.md](./UX_UI_SPEC.md) (design system, blur gap).

---

## Strategic principle

> **Web is your showroom. Mobile is your engine.**  
> We stabilize both — but we **design for web authority first**.

The backend is overqualified for the frontend. Fixable. But we need a **disciplined rebuild path**, not patch chaos.

---

## The strategic goal (soft launch)

For soft launch, web must:

- **Never visually collapse**
- **Never flicker between tabs**
- **Never show broken blur logic**
- **Never expose inconsistent spacing**
- **Never feel like a React Native app stretched onto a browser**

If someone opens it on a MacBook, it must feel **intentional**.  
Not “mobile app in a browser.”

---

## Immediate structural moves (order is fixed)

Do this in order. No skipping.

---

### 1. Navigation: one authority (web first)

**Current problem:** Three authorities = drift.

| Authority | Today |
|-----------|--------|
| DesktopTabContext | State owner (activeTab) |
| router.replace | URL |
| Conditional `<Tabs>` mount | Which navigator is active |

**Target:**

- **The URL is the single source of truth.**
- The tab navigator is **always mounted** (no conditional unmount when `showSidebar`).
- The **sidebar is a controlled UI** that triggers navigation (e.g. `router.push` / `router.replace` to tab routes).
- **DesktopTabContext becomes a derived helper** — e.g. `activeTab = pathnameToTab(pathname)` — not the state owner.
- No `skipNextPathnameSync` or pathname-vs-state hacks.

If the URL says `/events`, the app shows Events. Always.  
Luxury apps never “seem confused.”

**Implementation notes:**

- In `(tabs)/_layout.tsx`: always render `<Tabs>` (or the same navigator) for the tab routes; on desktop, optionally hide the tab bar via `tabBarStyle: { display: 'none' }` and render the sidebar as a sibling that navigates via `router.replace('/(tabs)/events')` etc.
- Remove or simplify DesktopTabContext to a read-only derivation from pathname (or remove it and use pathname directly where needed).

---

### 2. Web layout spine (three primitives)

Screens must stop improvising flex at the root. Three structural primitives are mandatory.

#### PageShell

- Wraps the main content area (e.g. tab content).
- Centers content.
- Max width constraint: **1100–1280px** (align with existing `layout.contentMaxWidth`).
- Vertical padding.
- Background discipline (e.g. PremiumDarkBackground or delegated to parent).

#### ContentColumn

- Consistent **internal** max width: **800–900px** for reading/content density.
- Auto horizontal centering.
- **Never collapses** (minWidth / minHeight as needed).

#### Card

- **Enforced** padding (from theme).
- **Enforced** radius (single card radius across product).
- **Enforced** background (theme surface/card).
- **Enforced** overflow (e.g. `overflow: 'hidden'`).
- **Enforced** minHeight (no card collapse under ~900px width).

No screen may directly define layout root styling again.  
That stops now.

**Implementation:** Add or designate components (e.g. in `mobile/src/components/layout/` or `ui/`): `PageShell`, `ContentColumn`, `Card`. Screens use these instead of raw View + ad-hoc flex.

---

### 3. Flexbox hardening (why things stack)

On web, React Native Web behaves differently than native. Enforce globally:

| Rule | Purpose |
|------|--------|
| Every flex **row** child must include `minWidth: 0` | Prevents overflow/overlap when row is constrained (see [FRONTEND_AUDIT_REPORT.md](./FRONTEND_AUDIT_REPORT.md) — Messages mid, Events info). |
| Cards must define `minHeight` | Prevents card body squashing and text overlap. |
| No layout relies on image **natural height** | Deterministic height; no “banner grows” on web. |
| ImageBackground must use **explicit height** | Same; BannerImage and any ImageBackground get a fixed height (or maxHeight + overflow hidden). |
| No component mixes `minHeight` and `height` in layered style arrays in an ambiguous way | One clear contract (e.g. height wins; or minHeight only with overflow hidden). |

The banner overlap from the audit is a symptom of uncontrolled layout contracts.  
Web must be **deterministic**.

---

### 4. Blur invariant (trust = luxury)

**UX behavior spec:** We never expose before consent.

**UX/UI spec today:** “No global blur/reveal check per viewer in ProfilePhoto; component accepts optional `blurred` prop but discovery/profile views do not pass reveal state.”

That’s a **brand violation**. For soft launch web:

- Discovery grid (and any profile photo surface) must **always respect viewer context**.
- **ProfilePhoto** must receive a **viewer-aware** prop (e.g. `canSeeUnblurred: boolean`) derived from API (e.g. GET `/v1/photos/check/:userId` or equivalent), not a one-off `blurred` per screen.
- **No screen decides blur in isolation.** One place resolves “can this viewer see unblurred?” and passes it down.

**Implementation:** Extend ProfilePhoto API to `canSeeUnblurred`; add a small hook or context that calls the check API and passes result into discovery/profile; remove ad-hoc `blurred` from screens. See [UX_UI_SPEC.md](./UX_UI_SPEC.md) §1.3.

---

### 5. State standardization (SafeState)

**Today:** Some screens show nothing, some spinners, some plain text. Inconsistent.

**Target:** One component (or a small set) for screen-level state:

- **loading** variant
- **empty** variant
- **error** variant
- **offline** variant

Every screen uses it. No more inline “No one nearby” or one-off error boxes without a shared pattern.

It must look **intentional**.

**Implementation:** Add `SafeState` (or equivalent) in `mobile/src/components/ui/`; migrate (tabs)/index, events, messages, profile, and other key screens to use it.

---

### 6. Visual discipline (million-dollar feel)

Design tokens exist; enforcement is weak. Introduce:

| Area | Rule |
|------|------|
| **Grid** | 8px grid enforcement (spacing from theme; no arbitrary 7px/13px). |
| **Card radius** | Single card radius across entire product. |
| **Shadows** | Controlled usage (theme shadows only; no one-off shadowColor/Radius). |
| **Typography** | No mixed font weights without a clear hierarchy rule. |
| **Headers** | Consistent header scale (e.g. one lg for page title). |
| **Hover (web)** | Hover state system for cards, nav, buttons (web only). |
| **Motion** | Timing standard: **150–200ms** for transitions; no raw Expo default transitions that feel jittery. |

Not flashy. **Controlled.**

#### Brand-defining interaction (Discover cards)

Signature interaction: discover cards **glow + scale on hover**. It must feel like mass, not CSS tricks.

- **Scale:** 1.02–1.03 max (subtle).
- **Timing:** 150–180ms for transition (implemented: 160ms, ease-out on Discover tiles via Reanimated).
- **Shadow:** Interpolation smooth; no pop (shadow opacity/radius interpolated with scale).
- **No jitter** when moving between cards.

If it feels “react-y” or jerky, it becomes cheap instantly. Luxury motion feels like mass.

---

## Layout Contract Gate (required before deploy)

**This is structural QA, not optional polish.**

Before web goes public, verify:

- [ ] No screen renders without **PageShell** (or an explicit exception documented).
- [ ] No screen defines **raw root flex** (no `<View style={{ flex: 1, padding: 13, ... }}>` at screen root).
- [ ] No **ImageBackground** without **explicit height** (or maxHeight + overflow hidden).
- [ ] No **flex row** child without **minWidth: 0** where the child can shrink (e.g. text columns).
- [ ] No **card** without **minHeight** (no collapse under ~900px width).
- [ ] No **inline arbitrary spacing** (use theme spacing only; 8px grid).
- [ ] No **blur logic bypass** (blur decided in one place; ProfilePhoto receives viewer context).

Run this checklist before every soft launch deploy.

---

## Screen root convention (mandatory)

**Invariant:** No screen defines raw root layout. All tab screens must use the layout spine.

- **Rule:** Every tab screen component must return **PageShell** as the root element. Anything else fails review.
- **Disallow:** `style={{ flex: 1 }}` (or any ad-hoc root flex) at screen root level. Not philosophically — programmatically.
- **Convention:** Screen components must start with:
  ```tsx
  return (
    <PageShell>
  ```
  Exceptions (e.g. auth screens, modal roots) must be documented.

**Enforcement:** Rigidity creates polish. Options:
- **Code review:** Checklist item: “Does this screen root with PageShell?”
- **Script:** Run before commit or in CI (e.g. `mobile/scripts/check-page-shell.js`) that parses or greps tab screen files and fails if any `(tabs)/*.tsx` (except `_layout.tsx`) does not contain `PageShell` as the root return element.

---

## Soft launch web checklist

Before showing publicly, web must satisfy:

**Navigation**

- [ ] URL-driven (URL = source of truth)
- [ ] No flicker between tabs
- [ ] Resize does not reset tab

**Layout**

- [ ] No stacking (no purple banners over cards; no text overlap in cards or lists)
- [ ] No overflow bleed
- [ ] No card collapse under 900px width

**Blur**

- [ ] Always correct (viewer context)
- [ ] Never exposes by mistake

**State**

- [ ] Loading looks intentional
- [ ] Empty looks intentional
- [ ] Error looks designed

**Perception**

- [ ] No UI jitter
- [ ] No raw Expo default transitions
- [ ] No inline inconsistent spacing

---

## Recommended execution plan

**Week 1 — Structure**

- Navigation authority fix (URL = truth; Tabs always mounted; sidebar triggers navigation; remove/simplify DesktopTabContext).
- PageShell + ContentColumn + Card primitives; start wrapping tab screens.
- Flexbox hardening (minWidth: 0, card minHeight, ImageBackground explicit height).

**Week 2 — Correctness and state**

- Blur system enforcement (canSeeUnblurred, single place for viewer check, ProfilePhoto + discovery/profile).
- SafeState component; migrate loading/empty/error/offline on key screens.

**Week 3 — Polish**

- Motion system (150–200ms; replace default transitions where needed).
- Hover polish (web only).
- Visual rhythm tightening (8px grid, single card radius, header scale).

After that, the same features will feel like a different product.

---

## Hard truth

We tried to build too many features before freezing the visual spine. That’s common; it’s not fatal.

This is a **Frontend Refactor Sprint**. Not feature work. Not polish. **Structure.**

---

## Doc history

- **Created:** From CTO directive (web authority first, one navigation authority, layout spine, flex hardening, blur invariant, SafeState, visual discipline). Replaces ad-hoc “next fix” lists with a single ordered plan.
- **References:** FRONTEND_AUDIT_REPORT.md (root causes and code refs), SOFT_LAUNCH_WEB_PLAN.md, UX_UI_SPEC.md.
