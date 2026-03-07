# Frontend audit report — layout, stacking, sidebar, responsive

**Scope:** Web frontend (Expo/React Native Web) — layout, stacking/overlap, sidebar tabs, bottom tab bar, Events/Messages screens, and responsive behavior when the viewport is shrunk.

**Purpose:** Diagnose every observed issue with root causes and code evidence before making edits.

---

## 1. Sidebar buttons “still don’t work”

### 1.1 What’s implemented

- **DesktopTabContext** (`mobile/src/contexts/DesktopTabContext.tsx`) holds `activeTab` and `setActiveTab`. Sidebar calls `onSelectTab(tab)`; content is chosen by `activeTab`, not only by pathname.
- **Pathname overwriting state:** A `useEffect` syncs `pathname → activeTab`. When the user clicks a tab, the code sets a ref `skipNextPathnameSync` to `true`, updates state, and calls `router.replace(TAB_TO_ROUTE[tab])`. The effect is supposed to skip one pathname sync when the ref is true so the pathname doesn’t immediately reset `activeTab` back to Explore.

**Evidence — context and skip logic:**

```39:47:mobile/src/contexts/DesktopTabContext.tsx
  useEffect(() => {
    if (pathname == null) return;
    if (skipNextPathnameSync.current) {
      skipNextPathnameSync.current = false;
      return;
    }
    const tab = pathnameToTab(pathname);
    setActiveTabState(tab);
  }, [pathname]);
```

```33:37:mobile/src/contexts/DesktopTabContext.tsx
  const setActiveTab = useCallback((tab: DesktopTabId) => {
    skipNextPathnameSync.current = true;
    setActiveTabState(tab);
    router.replace(TAB_TO_ROUTE[tab] as any);
  }, []);
```

### 1.2 Why the sidebar can still appear broken

1. **Only one sync is skipped.** If `pathname` updates more than once (e.g. React batching or expo-router emitting an intermediate value), the first run is skipped and a later run can still set `activeTab` from pathname. If pathname is still `/(tabs)` at that moment, content flips back to Explore.
2. **When desktop is active, `<Tabs>` is not mounted.** For `showSidebar === true`, the layout renders `DesktopTabProvider` → `DesktopShellWithTabs` and does **not** render the `<Tabs>` component at all. So expo-router’s internal “current tab” may not be updated by navigation in the same way as when the tab navigator is mounted. If `router.replace('/(tabs)/events')` does not reliably update the URL or router state on web, then:
   - The next time the effect runs (e.g. after a re-render or later pathname emission), `pathname` might still be `/(tabs)` and `pathnameToTab(pathname)` returns `'explore'`, overwriting `activeTab`.
3. **Resize from desktop → mobile.** When the user shrinks the window below the breakpoint, `showSidebar` becomes false and the app switches to the bottom `<Tabs>` layout. The active screen is then driven by the **route**, not by the previous desktop `activeTab`. If the URL was never updated to e.g. `/(tabs)/events` (because `router.replace` didn’t take effect on web), the user sees Explore again and concludes “sidebar doesn’t work.”

**Evidence — desktop vs tabs branch:**

```160:172:mobile/app/(tabs)/_layout.tsx
  if (showSidebar) {
    return (
      <DesktopTabProvider>
        <DesktopShellWithTabs />
      </DesktopTabProvider>
    );
  }

  return (
    <PremiumDarkBackground style={{ flex: 1 }}>
      {tabs}
    </PremiumDarkBackground>
  );
```

**Conclusion:** The sidebar can fail because (a) pathname sync can overwrite state after the single skipped run, and (b) `router.replace` may not update the URL/router state on web when the tab navigator isn’t mounted, so after resize the wrong tab is shown.

---

## 2. Stacking when the screen is shrunk

### 2.1 Purple banners overlapping event cards

**Component:** Events screen uses `BannerImage` (purple strip with sparkles) inside each event card.

**Evidence — Events card and banner:**

```61:70:mobile/app/(tabs)/events.tsx
    return (
      <TouchableOpacity
        style={s.card}
        ...
      >
        <BannerImage style={s.banner}>
          <Ionicons name="sparkles" size={20} color={colors.primaryLight} />
        </BannerImage>
        <View style={s.cardBody}>
```

```148:150:mobile/app/(tabs)/events.tsx
  card: { flex: 1, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, overflow: 'hidden', ... },
  banner: { height: 50, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flexDirection: 'row', alignItems: 'center', padding: 14 },
```

**Evidence — BannerImage definition:**

```76:82:mobile/src/components/Backgrounds.tsx
export function BannerImage({ children, style }: { children?: React.ReactNode; style?: ViewStyle }) {
  return (
    <ImageBackground source={images.banner} style={[styles.banner, style]} resizeMode="cover">
      {children}
    </ImageBackground>
  );
}
```

```145:145:mobile/src/components/Backgrounds.tsx
  banner: { minHeight: 50, justifyContent: 'center', alignItems: 'center' },
```

**Cause:**  
`Backgrounds.tsx` uses `minHeight: 50` for the banner; Events passes `height: 50` in `s.banner`. Style array is `[styles.banner, style]`, so the passed `height: 50` should win. On React Native Web, `ImageBackground` can behave differently: the image (e.g. `purple-banner.jpg`) may drive layout or create a stacking context, and in narrow or constrained layouts the banner can expand or overlap adjacent content. No explicit `height` is set on the wrapper in `Backgrounds` (only `minHeight`), so in some web layouts the strip can grow and visually “stack” over the card body or other cards.

**Recommendation:** Use a fixed `height` (e.g. 50) on the banner in `Backgrounds` (or ensure the merged style always includes `height` and that the banner container has `overflow: 'hidden'`) so the strip cannot grow on web.

---

### 2.2 Text overlapping inside event cards (time/location, etc.)

**Evidence — card body and info block:**

```70:89:mobile/app/(tabs)/events.tsx
        <View style={s.cardBody}>
          <View style={s.dateBox}>...</View>
          <View style={s.info}>
            <Text style={s.title} numberOfLines={1}>{item.title}</Text>
            <View style={s.meta}>
              <Ionicons name="time-outline" ... />
              <Text style={s.metaText}>{d.toLocaleTimeString(...)}</Text>
              ...
              <Text style={s.metaText}>{item.attendee_count || 0}...</Text>
            </View>
            {item.venue_name && <Text style={s.venue}>📍 {item.venue_name}</Text>}
            {item.description && <Text style={s.desc} numberOfLines={2}>...</Text>}
          </View>
          <TouchableOpacity style={s.rsvpBtn}>...</TouchableOpacity>
        </View>
```

```150:161:mobile/app/(tabs)/events.tsx
  cardBody: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  ...
  info: { flex: 1 },
  title: { color: '#fff', fontSize: 15, fontWeight: '700' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  metaText: { color: 'rgba(255,255,255,0.35)', fontSize: 11 },
  venue: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 3 },
  desc: { color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 3, lineHeight: 16 },
```

**Cause:**  
The card has `flex: 1` and no `minHeight`. The card body is a row with `alignItems: 'center'`. In a two-column FlatList on web, when the column is narrow or the layout engine assigns a constrained height to the item, the row can be squashed. The `info` block has `flex: 1` but no `minWidth: 0`; on web, flex children can fail to shrink and cause overflow or overlap. If the card’s height is constrained, title/meta/venue/desc can overlap.

**Recommendation:** Give the event card a sensible `minHeight` (or ensure the content area can grow), and set `minWidth: 0` on `s.info` so the text column can shrink and wrap instead of overlapping.

---

### 2.3 Text overlapping in Messages list (“Direct chat” / “Tap to open”)

**Evidence — Messages row:**

```81:95:mobile/app/(tabs)/messages.tsx
            <TouchableOpacity style={styles.row} ...>
              <View style={styles.avatar}>...</View>
              <View style={styles.mid}>
                <View style={styles.topLine}>
                  <Text style={styles.name}>{label}</Text>
                  {lastAt ? <Text style={styles.time}>{timeAgo(lastAt)}</Text> : null}
                </View>
                <Text style={styles.preview} numberOfLines={1}>
                  {lastAt ? 'Tap to open' : 'No messages yet'}
                </Text>
              </View>
              ...
            </TouchableOpacity>
```

```125:132:mobile/app/(tabs)/messages.tsx
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 14 },
  ...
  mid: { flex: 1 },
  topLine: { flexDirection: 'row', justifyContent: 'space-between' },
  name: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  time: { color: colors.textMuted, fontSize: fontSize.xs },
  preview: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: 2 },
```

**Cause:**  
`mid` has `flex: 1` but no `minWidth: 0`. In a flex row on React Native Web, a flex child without `minWidth: 0` can refuse to shrink below content size. On narrow viewports the row gets squeezed and the `topLine` (e.g. “Direct chat” + “2/20”) and the `preview` (“Tap to open”) can overlap.

**Recommendation:** Add `minWidth: 0` to `styles.mid` so the middle column can shrink and text can truncate/wrap without overlapping.

---

### 2.4 Bottom tab bar partially covered by content

**Evidence — tab bar style (absolute, no z-index):**

```46:57:mobile/app/(tabs)/_layout.tsx
  tabBarStyle: {
    backgroundColor: 'transparent',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(147,51,234,0.2)',
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
```

**Evidence — lists without bottom padding for the bar:**

- **Events:** `contentContainerStyle={{ padding: 12 }}` — no extra bottom padding for the 64px bar.
- **Messages:** No `contentContainerStyle` with `paddingBottom`; content can scroll under the bar.
- **Explore (index):** `contentContainerStyle={{ paddingHorizontal: gap, paddingTop: gap, paddingBottom: gap }}` — only a small gap, not 64px+.

```128:128:mobile/app/(tabs)/events.tsx
        contentContainerStyle={{ padding: 12 }}
```

```315:315:mobile/app/(tabs)/index.tsx
        contentContainerStyle={{ paddingHorizontal: gap, paddingTop: gap, paddingBottom: gap }}
```

**Cause:**  
The tab bar is `position: 'absolute'` and `bottom: 0` with `height: 64`, and has no `zIndex`. Scrollable content has no reserved space at the bottom, so (1) list content scrolls under the bar and (2) on web the tab bar can sit behind scrolling content depending on stacking context. So the bar is partially covered and content appears to “stack” over it.

**Recommendation:**  
- Add a `zIndex` to the tab bar (e.g. 10) so it stays above scroll content.  
- Add `paddingBottom` to each tab’s list (e.g. 64 + 16 or 80) so the last items are not hidden under the bar.

---

## 3. Global background glows and stacking

**Evidence — PremiumDarkBackground:**

```16:27:mobile/src/components/Backgrounds.tsx
export function PremiumDarkBackground({ children, style }: { ... }) {
  return (
    <LinearGradient ...>
      <View style={styles.plumGlowTop} pointerEvents="none" />
      <View style={styles.plumGlowRight} pointerEvents="none" />
      <View style={styles.goldGlowBottom} pointerEvents="none" />
      {children}
    </LinearGradient>
  );
}
```

```115:139:mobile/src/components/Backgrounds.tsx
  plumGlowTop: {
    position: 'absolute',
    top: '-10%',
    left: '-5%',
    width: '60%',
    height: '50%',
    ...
  },
  plumGlowRight: { ... },
  goldGlowBottom: { ... },
```

**Cause:**  
Large percentage-sized, absolutely positioned glow divs sit as siblings to `children` in the gradient. On web, stacking order is DOM order; `children` come after the glows so they should paint on top. If any child creates a new stacking context with a lower effective z-order or the glows get a higher `z-index` elsewhere, the glows could appear on top of content. Currently no `zIndex` is set on the glows, so this is a potential (not proven) cause of “purple overlaying content” in edge cases.

**Recommendation:** Keep glows behind content by explicitly setting a lower `zIndex` on the glow views (e.g. 0) and a higher one on the main content wrapper (e.g. 1) if needed.

---

## 4. Responsive breakpoint and layout switch

**Evidence — breakpoint and usage:**

```1:27:mobile/src/hooks/useBreakpoint.ts
  const { width } = useWindowDimensions();
  ...
  const isDesktop = isWeb && width >= breakpoints.lg;
  ...
  showSidebar: isDesktop,
```

`breakpoints.lg` is 1024 (from `constants/breakpoints`). When `width < 1024`, `showSidebar` is false and the app uses the bottom `<Tabs>`; when `width >= 1024`, it uses the desktop shell and sidebar. The same tab screens (Explore, Messages, Events, Profile) are used in both branches, but in the desktop branch they are rendered inside `DesktopTabContent` with no tab bar, and in the mobile branch they are inside `<Tabs>` with the absolute tab bar. So:

- Lists are not given extra bottom padding when used in the tab bar layout.
- When switching from desktop to narrow, the active screen is determined by the URL; if the URL wasn’t updated by the sidebar, the wrong tab is shown.

---

## 5. Summary table

| Issue | Root cause | Location (evidence) |
|-------|------------|---------------------|
| Sidebar clicks don’t switch content | Pathname sync overwrites `activeTab` after one skip; `router.replace` may not update URL when `<Tabs>` not mounted | `DesktopTabContext.tsx` (effect + setActiveTab), `_layout.tsx` (showSidebar branch) |
| Wrong tab after shrinking window | Active tab on resize comes from route; URL may still be `/(tabs)` | Same as above |
| Purple banners over event cards | Banner uses `minHeight`; on web ImageBackground can grow or overlap | `Backgrounds.tsx` (BannerImage, styles.banner), `events.tsx` (BannerImage + s.banner) |
| Text overlap in event cards | Card has no minHeight; `info` has no minWidth: 0; row can be squashed | `events.tsx` (s.card, s.cardBody, s.info) |
| “Direct chat” / “Tap to open” overlap | `mid` has flex: 1 without minWidth: 0 on narrow viewports | `messages.tsx` (styles.mid, row, topLine, preview) |
| Tab bar covered by content | Tab bar absolute, no zIndex; lists have no paddingBottom for 64px bar | `_layout.tsx` (tabBarStyle), `events.tsx`, `messages.tsx`, `index.tsx` (contentContainerStyle) |
| Glows over content (possible) | Absolute glows, no explicit zIndex | `Backgrounds.tsx` (PremiumDarkBackground, plum/gold styles) |

---

## 6. Recommended fix order (no edits made in this report)

1. **Tab bar:** Add `zIndex` to tab bar and `paddingBottom` (e.g. 80) to Events, Messages, and Explore list content so the bar is always visible and content doesn’t sit under it.
2. **Messages overlap:** Add `minWidth: 0` to the Messages row’s middle column (`styles.mid`).
3. **Events card overlap:** Add `minWidth: 0` to `s.info`; consider `minHeight` for the card or the card body so meta/venue/desc don’t squash.
4. **Banner strip:** Fix banner height in `Backgrounds` (e.g. explicit `height: 50` and `overflow: 'hidden'`) so it doesn’t grow on web.
5. **Sidebar/URL sync:** Harden desktop tab state (e.g. ignore pathname for a short period after a sidebar click, or only sync when pathname differs from current tab; ensure `router.replace` is used in a way that updates the URL on web when the tab navigator isn’t mounted).
6. **Glows:** Optionally set explicit `zIndex` on glow views and content wrapper so glows stay behind.

This report is diagnostic only; no code changes were made. Implement fixes in the order above (or as preferred) after review.
