# Shhh — Documentation Index

Use this index to keep scope when working on the codebase. **Docs are aligned with the current program** (February 2026). Update the relevant doc when you add or change routes, modules, or screens.

| Document | Purpose | When to read/update |
|----------|---------|---------------------|
| **ARCHITECTURE.md** | System overview, file tree, API ledger (§4), dependencies, workflows. | When adding routes, modules, or tables: update §2, §4, §6. |
| **DEV_HANDOVER.md** | Deep reference: every backend module (§4), schema, mobile routes and API, real-time, workers, safety, billing, env. | When changing a module or endpoints: update the corresponding §4.x and schema/API tables. |
| **UX_UI_SPEC.md** | Per-screen UX/UI (mobile + admin): layout, API, states, implementation notes. Aligned with current screens. | When implementing or auditing a screen. |
| **UX_BEHAVIOR_SPEC.md** | Invariants, user states, safety flows, copy, consent, a11y gates. | When designing flows or copy. |
| **E2E_CAPABILITY_AUDIT_REPORT.md** | **E2E audit** of what exists vs partial vs missing (mobile, admin, backend). No optimistic gloss. | When assessing ship-readiness or planning fixes. |
| **MASTER_IMPLEMENTATION_CHECKLIST.md** | **Single checklist** for E2E audit items and discussed-but-not-implemented features. Tiers 0–8, status ✅/⬜. | When planning sprints or prioritizing; use with E2E audit. |
| **SCOPE_PIVOT_TODO.md** | **Scope when pivoting:** done vs remaining by tier; full remaining list with ID, action, where. | When switching tasks or returning to implementation. |
| **SOFT_LAUNCH_WEB_PLAN.md** | **Web soft launch:** one codebase, sidebar on web, entry shell, layout constraint, trust signals. Phases 1–4 (post–CTO review). | When doing web-first soft launch or web layout. |
| **SYSTEM_REALITY_REPORT.md** | CTO-facing audit: capability matrix, deep dives, test strategy. | When capability set or high-level architecture changes. |
| **SYSTEM_REALITY_REPORT_APPENDICES.md** | Full route matrix (method, path, auth, tier, file); schema/migrations; threat model. | When adding or changing any route: update Appendix A. |
| **GAME_CHANGER_ROADMAP.md** | Prioritized backlog of game-changer ideas; themed phases. Progress and "Implemented" list. | When picking or implementing a game-changer; update after build. |
| **ENHANCEMENT_ROADMAP.md** | Enhancement work (branch `shh-enhancement-trial`): phases, doc sync checklist. | Optional: when following that branch. |
| **FRONTEND_GAP_LIST.md** | Frontend gap list (mobile) by feature. | Sync with E2E audit and checklist. |
| **FEATURE_ADDITIONS_CRITIQUE.md** | Feature grades vs current system; game-changer ideas; discovery cap. | Optional: mark implemented items. |
| **REVIEW_CREDENTIALS.md** | Review/test credentials and access. | When testing or handing off to reviewers. |

**Working from this codebase:** Use **ARCHITECTURE.md**, **DEV_HANDOVER.md**, and **UX_UI_SPEC.md** as the source of truth for what exists. Use **E2E_CAPABILITY_AUDIT_REPORT.md** and **MASTER_IMPLEMENTATION_CHECKLIST.md** to drive what to build next; **SCOPE_PIVOT_TODO.md** to avoid losing scope when pivoting.
