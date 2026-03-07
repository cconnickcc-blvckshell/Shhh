# Shhh — Documentation Audit Report

> **Purpose:** C-suite-ready assessment of documentation completeness, accuracy, and freshness across the Shhh codebase.  
> **Auditor:** Documentation Auditor Agent  
> **Date:** March 2026

---

## Executive Summary

The Shhh platform has a **strong documentation foundation** with 60+ docs in `docs/`, a well-maintained `ARCHITECTURE.md`, and a clear doc index. However, **significant gaps** exist between documentation and implementation: **~60% of public API endpoints lack OpenAPI/Swagger descriptions**, several docs contain **outdated or contradictory statements** (e.g., "no metrics" when Prometheus metrics exist), and **configuration is partially undocumented**. The mobile app has **no README**. In-code comment quality is **sparse**—JSDoc is rare; only 2 TODOs exist. Documentation coverage is **B-** overall: good structure and depth in core docs, but API docs, env vars, and operational runbooks need updates.

**Key metrics:**

| Metric | Score | Notes |
|--------|-------|-------|
| Doc structure & index | A | docs/README.md, ARCHITECTURE.md, DEV_HANDOVER.md well-organized |
| API documentation (Swagger) | D | ~40 endpoints in Swagger vs ~100+ in ARCHITECTURE ledger |
| Configuration documentation | B- | .env.example comprehensive; 10+ env vars used but not documented |
| Doc–code accuracy | C+ | OPS_RUNBOOK, SYSTEM_REALITY_REPORT, DEPLOYMENT_GUIDE contain outdated "no metrics" claims |
| In-code comments | C | Minimal JSDoc; discovery.service has good interface docs; complex logic often uncommented |
| Mobile/Admin docs | B / C | Admin README good; mobile has no README |

---

## 1. Documentation Coverage Map

### 1.1 Core Reference Docs

| Document | Completeness | Accuracy | Freshness | Notes |
|----------|--------------|----------|-----------|-------|
| **docs/README.md** | ✅ Complete | ✅ | ✅ | Master index; links to all major docs |
| **docs/ARCHITECTURE.md** | ✅ Complete | ✅ | ✅ | File tree, API ledger §4, schema §6, workflows; March 2026 |
| **docs/DEV_HANDOVER.md** | ✅ Complete | ✅ | ✅ | Deep reference; 20 sections; module-by-module |
| **docs/SCHEMA_OVERVIEW.md** | ✅ Complete | ✅ | ✅ | High-level schema; aligns with migrations |
| **docs/GLOSSARY.md** | ✅ Complete | ✅ | ✅ | Domain terms |
| **docs/GET_ONLINE.md** | ✅ Complete | ✅ | ✅ | Cloud setup; Supabase, Upstash, Atlas; Render/Vercel |
| **.env.example** | ✅ Complete | ⚠️ Partial | ✅ | Well-organized by target; missing 10+ vars (see §3) |
| **AGENTS.md** | ✅ Complete | ⚠️ Minor | ✅ | Says "Express 5 types" but ARCHITECTURE says Express 4 |

### 1.2 Operational & Technical Docs

| Document | Completeness | Accuracy | Freshness | Notes |
|----------|--------------|----------|-----------|-------|
| **docs/OPS_RUNBOOK.md** | ✅ | ❌ **Outdated** | ⚠️ | Line 124: "No metrics/tracing" — **FALSE**. Prometheus `/metrics` exists |
| **docs/DEPLOYMENT_GUIDE.md** | ✅ | ❌ **Outdated** | ⚠️ | Line 166: "No Prometheus/metrics in codebase" — **FALSE** |
| **docs/SYSTEM_REALITY_REPORT.md** | ✅ | ❌ **Outdated** | ⚠️ | Lines 52, 66, 100, 124, 168, 216: "No metrics" — **FALSE** |
| **docs/WEBSOCKET_EVENT_CATALOG.md** | ✅ | ✅ | ✅ | Events, rooms, helpers; aligns with websocket/index.ts |
| **docs/DATA_FLOWS.md** | ✅ | ✅ | ✅ | Sequence diagrams |
| **docs/TESTING_GUIDE.md** | ✅ | ✅ | ✅ | Backend tests, load tests |
| **docs/FEATURE_FLAGS.md** | ✅ | ✅ | ✅ | Ads kill switch, cadence |
| **docs/API_CHANGELOG.md** | ✅ | ✅ | ✅ | Breaking changes |

### 1.3 Project READMEs

| Document | Completeness | Accuracy | Notes |
|----------|--------------|----------|-------|
| **README.md** (root) | ✅ | ✅ | Quick start, tech stack, subset of API; points to ARCHITECTURE |
| **admin-dashboard/README.md** | ✅ | ⚠️ Minor | Says "hardcoded" API URL; actually uses `VITE_API_URL` |
| **mobile/README.md** | ❌ **Missing** | — | No README in mobile/ |
| **loadtest/README.md** | ✅ | ✅ | k6 structure, suites, metrics |

---

## 2. Gap Analysis

### 2.1 Code Without Doc Reference

| Location | Current State | Gap | Priority |
|----------|---------------|-----|----------|
| **backend/src/middleware/metrics.ts** | Prometheus RED metrics, `/metrics` endpoint | Not in ARCHITECTURE §4 API ledger; OPS_RUNBOOK says "no metrics" | **High** |
| **backend/src/modules/test/** | Test-only routes (`/v1/test/health`, reset, seed, token) | Not documented in ARCHITECTURE; test-only, NODE_ENV=test | Medium |
| **backend/src/modules/auth/auth.routes.ts:88–97** | `GET /admin-bypass-status`, `POST /admin-bypass` | Admin dashboard uses these; not in API ledger or Swagger | Medium |
| **DISCOVERY_RATE_LIMIT_PER_MIN** | Used in discoveryRateLimit.ts | Not in .env.example or ARCHITECTURE §11 | Medium |
| **RATE_LIMIT_MODE**, **TEST_MODE** | Used in discoveryRateLimit, test controllers | Not in .env.example | Low |
| **DATABASE_SSL_REJECT_UNAUTHORIZED** | Used in database.ts | In .env.example (Render section) but not in ARCHITECTURE §11 | Low |
| **mobile/** (entire app) | 50+ screens, hooks, components | No README; no doc for mobile structure, env, or run instructions | **High** |

### 2.2 Docs Referencing Non-Existent or Stale Code

| Document | Reference | Issue | Priority |
|----------|-----------|-------|----------|
| **docs/OPS_RUNBOOK.md:124** | "No metrics/tracing" | Prometheus metrics exist at `/metrics` | **High** |
| **docs/DEPLOYMENT_GUIDE.md:166** | "No Prometheus/metrics in codebase" | `middleware/metrics.ts` exists | **High** |
| **docs/SYSTEM_REALITY_REPORT.md** | "No metrics", "No OpenTelemetry or Prometheus" (multiple lines) | Prometheus RED metrics implemented | **High** |
| **docs/ARCHITECTURE.md:269** | "(no compliance-extended)" | Correct—module does not exist; note is accurate | — |
| **admin-dashboard/README.md:38** | "Base URL: hardcoded in client.ts" | Uses `VITE_API_URL` from env | Medium |
| **AGENTS.md** | "Express 5 types" | Project uses Express 4; may be typo or future note | Low |

### 2.3 Public APIs Without OpenAPI/Swagger Descriptions

**Swagger covers ~40 paths.** ARCHITECTURE §4 lists 100+ endpoints. Missing from Swagger:

| Category | Missing Endpoints (sample) | Priority |
|----------|----------------------------|----------|
| **Auth** | `/phone/send-code`, `/phone/verify`, `/oauth/apple`, `/oauth/google`, `/oauth/snap`, `/push-token` | **High** |
| **Users** | `/me` PUT, `/:id/profile`, `/:id/pass`, `/:userId/trust-score` | **High** |
| **Discovery** | `/crossing-paths`, `/location` POST | **High** |
| **Presence** | All 5 endpoints | **High** |
| **Personas** | All 6 endpoints | **High** |
| **Intents** | All 3 endpoints | Medium |
| **Preferences** | GET, PUT | Medium |
| **Whispers** | All 6 endpoints | **High** |
| **Ads** | All 8 endpoints | **High** |
| **Stories** | All 5 endpoints | **High** |
| **Groups** | All 8 endpoints | **High** |
| **Series** | All 5 endpoints | Medium |
| **Content** | All 3 endpoints | Medium |
| **Tonight** | GET | Medium |
| **Venues** | `/geofence-check`, `/:id/grid`, `/:id/verified-safe` | **High** |
| **Venue Identity** | claim, announcements, checkin, checkout, grid, stats, chat-rooms, stories | **High** |
| **Venue Dashboard** | full, dashboard, analytics, trends, staff, reviews, specials | Medium |
| **Media** | `/upload/self-destruct`, albums (all), `/:id/view` | **High** |
| **Events** | `/this-week`, `/my`, `/:id/attendees`, `/:id/chat-rooms`, `/:id/door-code`, `validate-door-code` | **High** |
| **Messaging** | `/:id/retention` | Medium |
| **Blur/Photos** | All 5 endpoints | Medium |
| **E2EE** | All endpoints | Medium |
| **Session** | Consent, panic-wipe | Medium |
| **Billing** | `/tiers`, `/subscription`, `/checkout`, `/webhook` | **High** |
| **Safety** | `/:id` DELETE, `/screenshot`, `/venue-distress` | Medium |
| **Compliance** | `/consent/withdraw` | Low |
| **Admin Extended** | All 18+ endpoints | **High** |

---

## 3. Configuration Documentation Gaps

### 3.1 Environment Variables Used But Not in .env.example

| Variable | Location | Purpose |
|----------|----------|---------|
| `DISCOVERY_RATE_LIMIT_PER_MIN` | discoveryRateLimit.ts | Per-user discovery cap (default 60) |
| `RATE_LIMIT_MODE` | discoveryRateLimit.ts | `capacity` → 10000 limit |
| `TEST_MODE` | test controllers, discoveryRateLimit | Bypass limits in tests |
| `DATABASE_SSL` | database.ts, migrate.ts | SSL for Postgres |
| `DATABASE_POOL_SIZE` | database.ts | Connection pool size |
| `DISCOVERY_CAP_FREE` | config/index.ts | Free tier discovery cap (30) |
| `DISCOVERY_CAP_PREMIUM` | config/index.ts | Premium discovery cap (50) |
| `APP_URL` | subscription.service.ts | Stripe success/cancel URLs |
| `OTP_DEV_BYPASS` | auth.routes, auth.service, otp.service | Dev bypass; in GET_ONLINE but not .env.example local section |

**Note:** .env.example covers Render, Vercel, Admin well; local dev section omits some optional vars.

---

## 4. Comment Quality Scorecard

### 4.1 JSDoc / Inline Comments

| Area | Score | Notes |
|------|-------|-------|
| **Backend services** | C+ | discovery.service.ts has good interface docs (`DiscoveryFilters`, `PrimaryIntent`); most services have no JSDoc |
| **Backend routes** | D | Route files have minimal comments; no JSDoc on handlers |
| **Backend config** | B | config/index.ts has inline comments for migrationUrl |
| **Admin dashboard** | D | Components and pages have little to no JSDoc |
| **Mobile** | D | Hooks, components, screens largely uncommented |
| **WebSocket** | C | websocket/index.ts has no file-level doc; emit helpers are self-explanatory |

### 4.2 TODO / FIXME / HACK

| Location | Content | Priority |
|----------|---------|----------|
| mobile/src/utils/analytics.ts:13 | `// TODO: Integrate real analytics SDK` | Low |
| mobile/src/utils/analytics.ts:20 | `// TODO: Integrate real analytics SDK. Never log PII.` | Low |

**Total:** 2 TODOs. No FIXME or HACK found.

### 4.3 Complex Logic Without Explanatory Comments

| Location | Logic | Gap |
|----------|-------|-----|
| backend/src/modules/discovery/discovery.service.ts:88–155 | PostGIS `ST_DWithin` query with 9 params, fuzz, discovery_visible_to | No comment explaining param order ($1–$9) or PostGIS gotcha |
| backend/src/modules/discovery/discovery.service.ts:183–207 | `getCrossingPaths` SQL with venue_checkins join | GC-5.4 ref in interface; no inline comment on algorithm |
| backend/src/middleware/auth.ts | Tier enforcement, requireTier logic | No doc on tier semantics |
| backend/src/modules/users/trust.service.ts | Trust score formula | ARCHITECTURE §5.4 documents it; service has no inline reference |
| backend/src/modules/ads/ad.service.ts | getEligibleAd targeting, cadence | Complex logic; no high-level comment |

---

## 5. Prioritized Improvement List

### High Priority

| # | Action | Location | Effort |
|---|--------|----------|--------|
| 1 | **Fix "no metrics" in OPS_RUNBOOK, DEPLOYMENT_GUIDE, SYSTEM_REALITY_REPORT** | docs/ | 1 hr |
| 2 | **Add `/metrics` to ARCHITECTURE §4 API ledger** | docs/ARCHITECTURE.md | 15 min |
| 3 | **Create mobile/README.md** (quick start, env, structure) | mobile/ | 2 hr |
| 4 | **Expand Swagger to cover Auth (OTP, OAuth, push-token)** | backend/src/config/swagger.ts | 2 hr |
| 5 | **Expand Swagger to cover Presence, Personas, Whispers, Ads** | backend/src/config/swagger.ts | 3 hr |
| 6 | **Document admin-bypass endpoints** (or mark internal) | docs/ARCHITECTURE.md, GET_ONLINE | 30 min |

### Medium Priority

| # | Action | Location | Effort |
|---|--------|----------|--------|
| 7 | **Add remaining API paths to Swagger** (Venues, Events, Media, Billing, Admin Extended) | backend/src/config/swagger.ts | 4 hr |
| 8 | **Add missing env vars to .env.example** (DISCOVERY_RATE_LIMIT_PER_MIN, DISCOVERY_CAP_*, etc.) | .env.example | 30 min |
| 9 | **Fix admin-dashboard README** (VITE_API_URL, not hardcoded) | admin-dashboard/README.md | 5 min |
| 10 | **Add JSDoc to discovery.service.ts** (param order, PostGIS note) | backend/src/modules/discovery/discovery.service.ts | 30 min |
| 11 | **Add JSDoc to trust.service.ts** (formula reference) | backend/src/modules/users/trust.service.ts | 15 min |

### Low Priority

| # | Action | Location | Effort |
|---|--------|----------|--------|
| 12 | **Resolve Express 4 vs 5 note in AGENTS.md** | AGENTS.md | 5 min |
| 13 | **Add JSDoc to ad.service getEligibleAd** | backend/src/modules/ads/ad.service.ts | 20 min |
| 14 | **Document test routes** (NODE_ENV=test only) | docs/TESTING_GUIDE.md or ARCHITECTURE | 15 min |
| 15 | **Resolve analytics TODOs** or convert to tracked issues | mobile/src/utils/analytics.ts | — |

---

## 6. Summary Table

| Category | Finding | Priority |
|----------|---------|----------|
| **Doc accuracy** | OPS_RUNBOOK, DEPLOYMENT_GUIDE, SYSTEM_REALITY_REPORT claim "no metrics" — incorrect | High |
| **API docs** | ~60% of endpoints missing from Swagger | High |
| **Mobile docs** | No README | High |
| **Config docs** | 10+ env vars not in .env.example | Medium |
| **Admin README** | Says "hardcoded" but uses VITE_API_URL | Medium |
| **In-code comments** | Sparse JSDoc; 2 TODOs; complex logic often uncommented | Medium |
| **Doc–code parity** | ARCHITECTURE file tree and API ledger largely accurate | — |

---

## 7. Recommendations for C-Suite

1. **Allocate 1–2 days** to correct outdated operational docs (metrics, deployment) to avoid confusion during incidents.
2. **Prioritize Swagger expansion** for external or partner-facing APIs; internal admin endpoints can remain lower priority.
3. **Add mobile/README.md** before onboarding new mobile developers.
4. **Establish a doc review gate** in PRs: when adding routes or env vars, require updates to ARCHITECTURE and .env.example.
5. **Consider auto-generating OpenAPI** from route definitions (e.g., tsoa, routing-controllers) to reduce drift.

---

*End of report.*
