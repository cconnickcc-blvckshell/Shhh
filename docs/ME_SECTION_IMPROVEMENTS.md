# Me Section Improvements

Master list of improvements for the Me (Profile) section. Status: ✅ Done | ⬜ Pending

---

## Phase 1: Foundation (Layout & Design System)

| # | Item | Status |
|---|------|--------|
| 1 | Create `SubPageHeader` component (back, title, subtitle, right action) | ✅ |
| 2 | Create `SectionLabel` component | ✅ |
| 3 | Wrap all Me sub-pages in `PageShell` | ✅ (status, notifications, privacy, emergency, album, album/[id]) |
| 4 | Use `PremiumDarkBackground` on all Me sub-pages | ✅ |
| 5 | Use `SafeState` for loading/error instead of ad-hoc spinners | ✅ |

---

## Phase 2: Shared Components

| # | Item | Status |
|---|------|--------|
| 6 | Use `Card` for section containers | ✅ (status, privacy) |
| 7 | Use `ContentColumn` for list-heavy screens | ✅ (emergency) |
| 8 | Typography tokens (fontSize.lg, etc.) | ⬜ Partial |

---

## Phase 3: Edit Profile

| # | Item | Status |
|---|------|--------|
| 9 | Use Card for sections | ⬜ |
| 10 | Photo grid with discover-style aspect ratio | ✅ (existing) |
| 11 | Add character count for bio | ⬜ |
| 12 | Add "Unsaved changes" warning on back | ⬜ |
| 13 | Add User ID display + Copy | ⬜ |

---

## Phase 4: Functional Gaps

| # | Item | Status |
|---|------|--------|
| 14 | Album: Add "Add photo" in album detail | ✅ |
| 15 | Album: `albumsApi.addMedia` in mobile client | ✅ |
| 16 | Profile menu: Remove duplicate Venues/My Venues | ✅ |
| 17 | Hosting: Edit button on event cards → event-edit | ✅ |
| 18 | Create venue: Add location picker (replace DEFAULT_LAT/LNG) | ⬜ |
| 19 | Create/Edit event: Date/time pickers | ⬜ |
| 20 | Verification: Implement Tier 2 ID flow | ⬜ |
| 21 | Subscription: Handle "Stripe not configured" with friendly message | ✅ |

---

## Phase 5: Remaining Pages to Upgrade

| Page | PageShell | PremiumDark | SubPageHeader | SafeState |
|------|-----------|-------------|---------------|-----------|
| profile/hosting | ✅ | ✅ | ✅ | ✅ |
| profile/venues | ✅ | ✅ | ✅ | ✅ |
| profile/create-venue | ⬜ | ✅ | ⬜ | ⬜ |
| profile/venue-dashboard/[id] | ⬜ | ⬜ | ⬜ | ⬜ |
| profile/venue-edit/[id] | ⬜ | ✅ | ⬜ | ⬜ |
| profile/create-event | ⬜ | ✅ | ⬜ | ⬜ |
| profile/event-edit/[id] | ⬜ | ✅ | ⬜ | ⬜ |
| couple | ✅ | ✅ | ✅ | ✅ |
| verify | ✅ | ✅ | ✅ | ✅ |
| whispers | ✅ | ✅ | ✅ | ⬜ |
| groups | ⬜ | ✅ | ⬜ | ⬜ |
| subscription | ✅ | ✅ | ✅ | ⬜ |
| content/guides | ⬜ | ⬜ | ⬜ | ⬜ |
| content/norms | ⬜ | ⬜ | ⬜ | ⬜ |

---

## Phase 6: Supabase Photo Buckets

See `docs/SUPABASE_PHOTO_BUCKETS.md`.

---

## Phase 7: Polish

| # | Item | Status |
|---|------|--------|
| 21 | Empty state illustrations | ⬜ |
| 22 | Success toast on save | ⬜ |
| 23 | Markdown in Guides/Norms | ⬜ |
| 24 | Accessibility (labels, contrast) | ⬜ |

---

## Reference

- Design system: `mobile/src/constants/theme.ts`
- Layout: `mobile/src/components/layout/`
- SubPageHeader: `mobile/src/components/SubPageHeader.tsx`
