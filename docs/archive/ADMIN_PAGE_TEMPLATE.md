# Admin Dashboard — Per-Screen Template

**Purpose:** Document each admin page per UX_UI_SPEC §4 (Intent, Entry, Exit, Data, States, Error, A11y).  
**Standard:** MASTER_IMPLEMENTATION_CHECKLIST Tier 5.1, 5.2, 5.3.

---

## Shared Components

| Component | Purpose |
|-----------|---------|
| `AdminLoading` | Loading state with `role="status"`, `aria-live="polite"` |
| `AdminError` | Error state with `role="alert"`, Retry button |
| `Layout` | Nav with `role="navigation"`, `aria-label`; links with `aria-current` |

---

## Page Inventory

| Page | Intent | Entry | Exit | Data | States | Error | A11y |
|------|--------|-------|------|------|--------|-------|------|
| **Dashboard** | Overview metrics; system health | Nav → Dashboard | Nav to other pages | getOverview, getStats, getHealth | Loading, Error, Empty fallback | AdminError + Retry | role="main", aria-label |
| **Users** | List, search, filter, ban, role | Nav → Users | Nav to other pages | listUsers, searchUsers | Loading, Error | AdminError + Retry | role="main", table role="grid", scope="col" |
| **Revenue** | MRR, ad revenue, subscriptions | Nav → Revenue | Nav to other pages | getRevenue | Loading, Error | AdminError + Retry | role="main", aria-label |
| **Venues** | List venues, check-ins, events | Nav → Venues | Nav to other pages | listVenues | Loading, Error, Empty | AdminError + Retry | role="main", aria-label |
| **Ads** | Ad placements, toggle active | Nav → Ads | Nav to other pages | listAds, toggleAd | Loading, Error | AdminError + Retry | role="main", aria-label |
| **Events** | List events, phase, capacity | Nav → Events | Nav to other pages | listEvents | Loading, Error | AdminError + Retry | role="main", aria-label |
| **Reports** | Content reports, resolve/dismiss | Nav → Reports | Nav to other pages | getReports, resolveReport | Loading, Error, Empty | AdminError + Retry | role="main", aria-label |
| **Safety** | Panic alerts, missed check-ins, reports | Nav → Safety | Nav to other pages | getSafetyAlerts | Loading, Error | AdminError + Retry | role="main", aria-label |
| **Audit Log** | System audit trail | Nav → Audit Log | Nav to other pages | getAuditLogs | Loading, Error | AdminError + Retry | role="main", table role="grid", scope="col" |
| **Settings** | Ad controls, system info | Nav → Settings | Nav to other pages | getAdSettings, updateAdSetting | Loading, Error | AdminError + Retry | role="main", aria-label |
| **Login** | Auth | Direct /login | Redirect to / on success | admin login API | Loading, Error | Inline error message | Form labels |

---

## Quality Bar (Tier 5.2, 5.3)

- **No silent failures:** Every API call has `.catch()` that sets error state; `AdminError` displays with Retry.
- **Loading state:** Every data-fetching page shows `AdminLoading` until data arrives.
- **Accessibility:** `role="main"`, `aria-label` on main content; tables use `role="grid"`, `scope="col"` on headers; nav uses `role="navigation"`, `aria-current="page"` on active link.

---

## File Locations

| Path | Purpose |
|------|---------|
| `admin-dashboard/src/components/AdminPageState.tsx` | AdminLoading, AdminError |
| `admin-dashboard/src/components/Layout.tsx` | Nav + Outlet |
| `admin-dashboard/src/pages/*.tsx` | All pages |
