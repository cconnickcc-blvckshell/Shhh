# Shhh — Documentation Index

Use this index to keep scope when working on the codebase. **Docs are aligned with the current program** (March 2026). Update the relevant doc when you add or change routes, modules, or screens.

## Core Reference

| Document | Purpose | When to read/update |
|----------|---------|---------------------|
| **ARCHITECTURE.md** | System overview, file tree, API ledger (§4), dependencies, workflows. | When adding routes, modules, or tables: update §2, §4, §6. |
| **DEV_HANDOVER.md** | Deep reference: every backend module (§4), schema, mobile routes and API, real-time, workers, safety, billing, env. | When changing a module or endpoints: update the corresponding §4.x and schema/API tables. |
| **GLOSSARY.md** | Domain terms: persona, intent, whisper, tier, presence, etc. | When onboarding or defining new concepts. |
| **SCHEMA_OVERVIEW.md** | High-level database schema; table purposes and relationships. | When adding tables or debugging data. |

## UX & Product

| Document | Purpose | When to read/update |
|----------|---------|---------------------|
| **UX_UI_SPEC.md** | Per-screen UX/UI (mobile + admin): layout, API, states, implementation notes. Aligned with current screens. | When implementing or auditing a screen. |
| **UX_BEHAVIOR_SPEC.md** | Invariants, user states, safety flows, copy, consent, a11y gates. | When designing flows or copy. |

## Audits & Planning

| Document | Purpose | When to read/update |
|----------|---------|---------------------|
| **CSUITE_MASTER_AUDIT_REPORT.md** | **C-suite master audit** — Consolidates 5-agent audit (bugs, docs, security, UX/UI, SEO). Prioritized remediation roadmap. | When presenting to leadership or planning remediation. |
| **CSUITE_ADVERSARIAL_AUDIT_REPORT.md** | Agent 1: Bug & discrepancy sweep — 28 issues with proof, severity, recommendations. | When fixing bugs or assessing correctness. |
| **DOCUMENTATION_AUDIT_REPORT.md** | Agent 2: Documentation coverage, gap analysis, in-code comments. | When improving docs or API coverage. |
| **SECURITY_AUDIT_ADVERSARIAL.md** | Agent 3: Security vulnerabilities — 17 findings with CVSS, proof, remediation. | When hardening security or responding to findings. |
| **UX_UI_AUDIT_REPORT.md** | Agent 4: Screen-by-screen UX/UI findings, workflows, accessibility. | When improving UX or fixing UI issues. |
| **SEO_SCHEMA_AUDIT_REPORT.md** | Agent 5: SEO opportunities, schema coverage, meta tags, structured data. | When improving discoverability or schema. |
| **CONSOLIDATED_CTO_REVIEW.md** | **Single source of truth** merging all audits; P0/P1 gates; contradictions resolved; actionable release plan. | When making go/no-go decisions or planning gates. |
| **PRODUCTION_READINESS_GRADE_REPORT.md** | Executive-grade assessment with proof, suggestions, future roadmap, decision framework for CEO/CTO/COO. | When assessing production readiness or presenting to leadership. |
| **E2E_CAPABILITY_AUDIT_REPORT.md** | **E2E audit** of what exists vs partial vs missing (mobile, admin, backend). No optimistic gloss. | When assessing ship-readiness or planning fixes. |
| **MASTER_IMPLEMENTATION_CHECKLIST.md** | **Single checklist** for E2E audit items and discussed-but-not-implemented features. Tiers 0–8, status ✅/⬜. | When planning sprints or prioritizing; use with E2E audit. |
| **SCOPE_PIVOT_TODO.md** | **Scope when pivoting:** done vs remaining by tier; full remaining list with ID, action, where. | When switching tasks or returning to implementation. |
| **SOFT_LAUNCH_WEB_PLAN.md** | **Web soft launch:** one codebase, sidebar on web, entry shell, layout constraint, trust signals. Phases 1–4 (post–CTO review). | When doing web-first soft launch or web layout. |
| **LAUNCH_PLAN.md** | **Launch blitz plan:** Phase 0–4 (harden, seed, detonate, scarcity, viral loop); CTO gate; influencer budget; KPIs; positioning safety. | When planning public launch or marketing blitz. |
| **MONETIZATION_AND_RETENTION_PLAN.md** | **Monetization + retention:** Inventory (subscription, ads, discovery cap); evaluation; ad integration; checkout fix; retention loops; phased plan without ruining experience. | When implementing or iterating on revenue and retention. |
| **SYSTEM_REALITY_REPORT.md** | CTO-facing audit: capability matrix, deep dives, test strategy. | When capability set or high-level architecture changes. |
| **SYSTEM_REALITY_REPORT_APPENDICES.md** | Full route matrix (method, path, auth, tier, file); schema/migrations; threat model. | When adding or changing any route: update Appendix A. |
| **GAME_CHANGER_ROADMAP.md** | Prioritized backlog of game-changer ideas; themed phases. Progress and "Implemented" list. | When picking or implementing a game-changer; update after build. |
| **ENHANCEMENT_ROADMAP.md** | Enhancement work (branch `shh-enhancement-trial`): phases, doc sync checklist. | Optional: when following that branch. |
| **FRONTEND_GAP_LIST.md** | Frontend gap list (mobile) by feature. | Sync with E2E audit and checklist. |
| **FEATURE_ADDITIONS_CRITIQUE.md** | Feature grades vs current system; game-changer ideas; discovery cap. | Optional: mark implemented items. |
| **ADMIN_DASHBOARD_FUTURE_PLAN.md** | Future admin dashboard ideas: 3D globe, marble drop, live activity feed, Admin Control (feature flags, content, rate limits, etc.), phasing. Implementation status for map, Kanban, sparkline. | When planning admin dashboard enhancements. |

## Operations & Technical

| Document | Purpose | When to read/update |
|----------|---------|---------------------|
| **GET_ONLINE.md** | **Quick start:** Local verification, cloud DB setup, deploy backend + frontend. | When getting the app running online for the first time. |
| **SUPABASE_REDIS_MONGO_SETUP.md** | **Target stack setup:** Supabase (Postgres + PostGIS), Redis, MongoDB. Step-by-step for production. | When configuring production infra or onboarding. |
| **OPS_RUNBOOK.md** | Incident response, debugging, health checks, rollback. | When on-call or troubleshooting. |
| **DEPLOYMENT_GUIDE.md** | Terraform, ECS, migrations, CI/CD, staging vs prod. | When deploying or changing infra. |
| **TESTING_GUIDE.md** | How to run backend tests, load tests; what's covered. | When adding tests or debugging CI. |
| **WEBSOCKET_EVENT_CATALOG.md** | All WebSocket events (client↔server); rooms, payloads. | When integrating real-time or debugging. |
| **DATA_FLOWS.md** | Sequence diagrams: auth, discovery, messaging, presence, distress. | When onboarding or debugging flows. |
| **FEATURE_FLAGS.md** | Ads kill switch, cadence rules; how to toggle. | When toggling features or responding to incidents. |
| **API_CHANGELOG.md** | Breaking changes, deprecations. | When making API changes. |
| **MOBILE_BUILD_RELEASE.md** | EAS Build, env vars, store submission, OTA updates. | When building or releasing mobile. |
| **REVIEW_CREDENTIALS.md** | Review/test credentials and access. | When testing or handing off to reviewers. |

## Policy & Legal

| Document | Purpose |
|----------|---------|
| **policies/POLICY_DOCUMENTATION_INDEX.md** | Master index of all policy documents (Terms, Privacy, AUP, Security, Modern Slavery, etc.) |
| **policies/** | Terms of Service, Privacy Policy, Acceptable Use, Community Guidelines, Refund, Payment Terms, Content Moderation, Appeal, DMCA, Location/Messaging/Media policies, Security, Vulnerability Disclosure, Incident Response, Data Breach, Data Retention, Data Subject Rights, Children's Privacy, DPA, Code of Conduct, Whistleblower, Conflict of Interest, Modern Slavery Statement, Human Trafficking Policy, Supply Chain Due Diligence, Supplier Code of Conduct, Cookie Policy, SLA/SLO, Support, Disaster Recovery, Business Continuity, Software License |

**Working from this codebase:** Use **ARCHITECTURE.md**, **DEV_HANDOVER.md**, and **UX_UI_SPEC.md** as the source of truth for what exists. Use **CONSOLIDATED_CTO_REVIEW.md** for go/no-go gates and release planning; **E2E_CAPABILITY_AUDIT_REPORT.md** and **MASTER_IMPLEMENTATION_CHECKLIST.md** to drive what to build next; **SCOPE_PIVOT_TODO.md** to avoid losing scope when pivoting. Use **OPS_RUNBOOK.md** and **DEPLOYMENT_GUIDE.md** for operations.
