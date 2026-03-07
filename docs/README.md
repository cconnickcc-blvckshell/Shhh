# Shhh — Documentation Index

Use this index to keep scope when working on the codebase. **Docs are aligned with the current program** (March 2026). **11 master documents** live here; everything else is in `archive/`.

---

## 11 Master Documents

| # | Document | Covers |
|---|----------|--------|
| 1 | **ARCHITECTURE.md** | System overview, file tree, API ledger, schema |
| 2 | **DEV_HANDOVER.md** | Backend modules, schema, mobile, env vars (§18) |
| 3 | **OPS_GUIDE.md** | Get online, runbook, testing, deployment, alerting |
| 4 | **UX_UI_SPEC.md** | Per-screen UX/UI (mobile + admin) |
| 5 | **AUDIT_AND_STATUS.md** | Index to audit reports (in archive), implementation status |
| 6 | **ROADMAP.md** | Me section, admin dashboard, game-changers |
| 7 | **IMPROVEMENTS_LEDGER.md** | Planned implementations, ideas, enhancements — feasibility, impact, effort |
| 8 | **GLOSSARY.md** | Domain terms |
| 9 | **WEBSOCKET_EVENT_CATALOG.md** | Real-time events |
| 10 | **FEATURE_FLAGS.md** | Ads kill switch, cadence |
| 11 | **policies/POLICY_DOCUMENTATION_INDEX.md** | Policy index |

---

## Quick Reference

| When you need… | Read |
|----------------|------|
| Routes, modules, schema | ARCHITECTURE, DEV_HANDOVER |
| Deploy, runbook, tests | OPS_GUIDE |
| Screen layout, admin pages | UX_UI_SPEC |
| Audit reports, checklists | AUDIT_AND_STATUS (points to archive) |
| Planned work | ROADMAP |
| Ideas, improvements, scoring | IMPROVEMENTS_LEDGER |
| Domain terms | GLOSSARY |
| WebSocket events | WEBSOCKET_EVENT_CATALOG |
| Feature toggles | FEATURE_FLAGS |
| Legal/policy | policies/ |

---

## Archived Documentation

All other docs (audit reports, launch plans, scale risk, etc.) are in **`docs/archive/`**. See `archive/README.md` for the full list and what supersedes each.

**Working from this codebase:** Use **ARCHITECTURE.md**, **DEV_HANDOVER.md**, and **UX_UI_SPEC.md** as the source of truth. Use **OPS_GUIDE.md** for operations. Use **AUDIT_AND_STATUS.md** to find audit reports in archive.
