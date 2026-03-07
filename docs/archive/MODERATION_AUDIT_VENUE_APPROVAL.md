# Moderation Workflow Audit: Venue Creation Approval

**Issue:** User approved a venue creation moderation report. It disappeared—didn't go to resolved, didn't create a report, nothing. Just gone.

**Date:** 2025-03-06

---

## 1. Flow Summary

### Approve Click Path

| Step | File | Line | Action |
|------|------|------|--------|
| 1 | `admin-dashboard/src/pages/Moderation.tsx` | 197 | User clicks Approve → `resolveMod(m.id, 'approved')` |
| 2 | `admin-dashboard/src/pages/Moderation.tsx` | 68-69 | `resolveMod` calls `adminApi.resolveModeration(id, 'approved')` then `load()` |
| 3 | `admin-dashboard/src/api/client.ts` | 103 | `resolveModeration` → `POST /v1/admin/moderation/:id/resolve` |
| 4 | `backend/src/modules/admin/admin.routes.ts` | 24-28 | Route: `logAdminAction`, then `ctrl.resolveModeration` |
| 5 | `backend/src/modules/admin/admin.controller.ts` | 36-45 | `resolveModeration` → `modSvc.resolveModerationItem(id, status, adminId)` |
| 6 | `backend/src/modules/admin/moderation.service.ts` | 96-101 | `resolveModerationItem` → **only** `UPDATE moderation_queue SET status, resolved_at, assigned_to` |

### Reload After Approve

| Step | File | Line | Action |
|------|------|------|--------|
| 7 | `admin-dashboard/src/pages/Moderation.tsx` | 47 | `load()` calls `adminApi.getQueue(undefined, 'pending')` |
| 8 | `backend/src/modules/admin/moderation.service.ts` | 4-22 | `getQueue` fetches `WHERE mq.status = $1` (pending only) |
| 9 | UI | - | Approved item has `status='approved'` → **no longer in pending** → **disappears** |

---

## 2. Key Files

| File | Purpose |
|------|---------|
| `backend/src/modules/admin/moderation.service.ts` | `getQueue`, `resolveModerationItem`, `resolveReport` |
| `backend/src/modules/admin/admin.controller.ts` | `resolveModeration` handler |
| `backend/src/modules/admin/admin.routes.ts` | `POST /moderation/:id/resolve` route |
| `admin-dashboard/src/pages/Moderation.tsx` | Kanban UI, Approve/Reject buttons |
| `admin-dashboard/src/api/client.ts` | `getQueue`, `resolveModeration` |
| `backend/src/modules/venues/venues.service.ts` | 25-27: inserts `venue_verification` into moderation_queue |
| `backend/src/database/migrations/002_couples_verification_safety.sql` | 68-78: `moderation_queue` schema |

---

## 3. Bugs Identified

### Bug A: Items Disappear (Primary UX Bug)

**Cause:** Mod Queue column only loads `status='pending'`. After approve/reject, items get `status='approved'` or `status='rejected'` and are excluded from the next fetch.

**Location:** `Moderation.tsx` line 47, `moderation.service.ts` lines 4-22

**Fix:** Add a "Resolved Mod" column that fetches approved/rejected items so they don't vanish.

---

### Bug B: Venue Approval Does Nothing to the Venue

**Cause:** `resolveModerationItem` (moderation.service.ts:96-101) only updates `moderation_queue`. No type-specific logic for `venue_verification`.

**Effect:** When approved:
- Venue stays as-is (no `verified_safe_at` set)
- No audit log for the venue
- Venue is already visible (created with `is_active=true`)

When rejected:
- Venue remains visible; no action to hide it

**Location:** `moderation.service.ts` lines 96-101

**Fix:** Add type-specific logic:
- `venue_verification` + approved → set `venues.verified_safe_at = NOW()`, add audit log
- `venue_verification` + rejected → set `venues.is_active = false` to hide from discovery

---

### Bug C: Verification Items Same Issue

**Cause:** For `verification_photo` and `verification_id`, the generic `resolveModerationItem` only updates the queue. It does NOT call `VerificationService.approveVerification` / `rejectVerification`, so:
- Verification record stays `pending`
- User never gets tier upgrade
- Moderation queue and verification state diverge

**Note:** Verification module has dedicated `/v1/verification/:id/approve` and `/v1/verification/:id/reject` routes, but the admin dashboard uses the generic `/v1/admin/moderation/:id/resolve` for all types. Those routes are not wired to the admin flow.

---

### Bug D: Reports vs Moderation Confusion

**Clarification:** Moderation queue items are in `moderation_queue`, not `reports`. Resolving a moderation item does not and should not create a `reports` row. The user's expectation of "create a report" may mean "create an audit record"—`logAdminAction` in admin.routes.ts:27 does insert into `admin_actions`, so there is an audit trail. No fix needed for reports.

---

## 4. Tables Involved

| Table | Role |
|------|------|
| `moderation_queue` | Holds pending/approved/rejected moderation items (venue_verification, verification_photo, etc.) |
| `reports` | User-to-user reports (separate from moderation queue) |
| `admin_actions` | Audit log for admin actions (populated by `logAdminAction`) |
| `venues` | Target of `venue_verification`; needs `verified_safe_at` / `is_active` on approve/reject |
| `audit_logs` | User-facing audit; not used for moderation resolution today |

---

## 5. Venue Creation vs Venue Verification

**Naming:** The codebase uses `venue_verification` (not `venue_creation`). Venues are created immediately in `venues.service.ts` `createVenue`; a row is then inserted into `moderation_queue` with type `venue_verification` for admin review. So "venue creation report" = moderation queue item of type `venue_verification`.

---

## 6. Concrete Fixes (Implemented)

### Fix A: Resolved Mod column (items no longer disappear)

| File | Change |
|------|--------|
| `backend/src/modules/admin/moderation.service.ts` | `getQueue` supports comma-separated status; added `getResolvedModeration()` |
| `backend/src/modules/admin/admin.controller.ts` | Added `getResolvedModeration` handler |
| `backend/src/modules/admin/admin.routes.ts` | Added `GET /moderation/resolved` route |
| `admin-dashboard/src/api/client.ts` | Added `getResolvedModeration()` |
| `admin-dashboard/src/pages/Moderation.tsx` | Added `resolvedQueue` state, Resolved Mod column, load resolved items on refresh |

### Fix B: Venue approval applies to venue

| File | Change |
|------|--------|
| `backend/src/modules/admin/moderation.service.ts` | `resolveModerationItem` (lines 107–151): fetches item, applies type-specific logic for `venue_verification`: approved → set `venues.verified_safe_at`, audit log; rejected → set `venues.is_active = false`, audit log |
