# Shhh — Documentation Index

Use this index to keep scope when working on the codebase. **Update the relevant docs as you progress** (see ENHANCEMENT_ROADMAP.md Doc Sync Checklist).

| Document | Purpose | When to read/update |
|----------|---------|---------------------|
| **ENHANCEMENT_ROADMAP.md** | **Single source for enhancement work on branch `shh-enhancement-trial`.** Gold standard rules, phase-by-phase tasks, "where existing things live," doc sync checklist. | **Read before every enhancement task.** Update after every phase or batch (progress log, "Last roadmap update"). |
| **ARCHITECTURE.md** | System overview, file tree, API ledger (§4), DB schema (§6), security, env. | When adding routes, modules, or tables: update §2, §4, §6, §11 as needed. |
| **DEV_HANDOVER.md** | Deep backend reference: every module (§4), schema, mobile, real-time, workers, safety, billing, conventions. | When changing a module or adding endpoints: update the corresponding §4.x and any schema/API tables. |
| **SYSTEM_REALITY_REPORT_APPENDICES.md** | Appendix A = full route matrix (method, path, auth, tier, source file). Schema/migrations, threat model, etc. | When adding or changing any route: update Appendix A. Update schema/migrations list if needed. |
| **SYSTEM_REALITY_REPORT.md** | CTO-facing audit: capability matrix, deep dives, roadmap, test strategy. | Update when capability set or high-level architecture changes. |
| **FEATURE_ADDITIONS_CRITIQUE.md** | Feature grades vs current system; Part 2 = game-changer ideas; Part 3 = GPT review + discovery cap. | Optional: mark implemented items in checklists; add implementation notes. |
| **GAME_CHANGER_ROADMAP.md** | **Prioritized backlog of game-changer ideas** (from Critique Part 2 + new ideas). Same gold standard as ENHANCEMENT_ROADMAP; themed phases (Venues, Promoters, Intent, Ephemeral, Community, Wild cards). Progress log and "Implemented" list. | When picking or implementing a game-changer: read "Existing" and "Do not duplicate"; after build, update ARCHITECTURE, DEV_HANDOVER, Appendix A, and both roadmaps. |

**Rule:** Work with the existing system; do not create duplicates. Follow **ENHANCEMENT_ROADMAP.md** for all enhancement work on `shh-enhancement-trial`. Use **GAME_CHANGER_ROADMAP.md** for the ideas backlog and themed implementation order.
