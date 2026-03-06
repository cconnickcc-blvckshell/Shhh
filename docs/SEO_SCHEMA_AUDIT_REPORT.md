# Shhh App — SEO & Schema Audit Report

**Prepared for:** C-Suite  
**Date:** March 6, 2026  
**Scope:** admin-dashboard, mobile web, public-facing pages  
**Auditor:** Agent 5 — SEO & Schema Auditor

---

## Executive Summary

The Shhh app has **minimal SEO and schema implementation** today. The primary public-facing asset—the **WebEntryShell** landing page—lacks meta tags, structured data, and crawlability signals. The admin dashboard is an internal tool with basic HTML but no SEO investment. **No sitemap or robots.txt exists.** Schema coverage is effectively zero.

**Key findings:**
- **Meta tags:** Missing `description`, `og:*`, `twitter:*` on all public pages
- **Structured data:** No JSON-LD (Organization, WebSite, WebApplication)
- **Crawlability:** No sitemap, no robots.txt, SPA rewrites may limit indexing
- **Performance:** No lazy loading on hero images; fonts block critical path
- **Schema:** No app links (android-app, ios-app), no BreadcrumbList, no FAQPage

**Recommended priority:** Focus on the **mobile web landing page** (WebEntryShell) first—it is the main acquisition surface. Admin dashboard SEO is low priority (internal tool). Venue/event share URLs are shareable but require SSR or prerendering for rich previews.

---

## 1. SEO Opportunity Matrix

| # | Finding | Location | Current State | Opportunity | Impact | Effort |
|---|---------|----------|---------------|-------------|--------|--------|
| 1 | Meta description | `mobile/app/+html.tsx`, `admin-dashboard/index.html` | **Missing** | Add unique, keyword-rich description (155–160 chars) | **High** | Low |
| 2 | Open Graph tags | `mobile/app/+html.tsx` | **Missing** | Add og:title, og:description, og:image, og:url, og:type | **High** | Low |
| 3 | Twitter Card tags | `mobile/app/+html.tsx` | **Missing** | Add twitter:card, twitter:title, twitter:description, twitter:image | **High** | Low |
| 4 | Document title | `mobile/app/+html.tsx` | **Missing** (no `<title>`) | Add `<title>Shhh — Privacy-Native Social</title>` | **High** | Low |
| 5 | robots.txt | Root of mobile web deploy | **Missing** | Create `/robots.txt` with sitemap reference | **High** | Low |
| 6 | Sitemap | Root of mobile web deploy | **Missing** | Create `/sitemap.xml` (landing, /terms, /privacy if added) | **High** | Medium |
| 7 | JSON-LD Organization | `mobile/app/+html.tsx` | **Missing** | Add Organization + WebSite schema | **High** | Low |
| 8 | JSON-LD WebApplication | `mobile/app/+html.tsx` | **Missing** | Add WebApplication with app links | **Medium** | Low |
| 9 | App links (android-app, ios-app) | `mobile/app/+html.tsx` | **Missing** | Add `<link rel="alternate">` for deep links | **Medium** | Low |
| 10 | Canonical URL | All pages | **Missing** | Add canonical to landing; consider for venue/event if SSR | **Medium** | Low |
| 11 | Semantic HTML / headings | `WebEntryShell.tsx` | Uses `<Text>` (divs); no h1/h2 hierarchy | Add semantic wrappers (h1, h2, section, main) for web | **Medium** | Medium |
| 12 | Lazy loading images | `WebEntryShell.tsx` hero, `events.tsx` | No loading="lazy" | Add loading="lazy" for below-fold images | **Medium** | Low |
| 13 | Critical path (fonts) | `admin-dashboard/index.html`, `+html.tsx` | Google Fonts block render | Preload critical font; use font-display: swap | **Medium** | Low |
| 14 | Admin meta tags | `admin-dashboard/index.html` | Title only; no description | Add meta description (low priority) | **Low** | Low |
| 15 | FAQPage schema | WebEntryShell "How it works" | Modal content not structured | Add FAQPage JSON-LD for trust/FAQ content | **Low** | Medium |
| 16 | BreadcrumbList | Venue/event detail pages | N/A (auth-gated) | Add if venue/event become public/SSR | **Low** | Medium |
| 17 | Privacy/Terms pages | WebEntryShell footer | Text only; no routes | Add `/terms`, `/privacy` public routes + links | **High** (compliance) | Medium |

---

## 2. Schema Coverage Map

| Schema Type | Status | Location | Notes |
|-------------|--------|----------|-------|
| **Organization** | ❌ Missing | — | Add in `+html.tsx` |
| **WebSite** | ❌ Missing | — | Add with SearchAction if search exists |
| **WebApplication** | ❌ Missing | — | Add with appCategory, operatingSystem |
| **SoftwareApplication** | ❌ Missing | — | Alternative to WebApplication |
| **BreadcrumbList** | ❌ N/A | — | Venue/event pages auth-gated |
| **FAQPage** | ❌ Missing | — | WebEntryShell "How it works" content |
| **Event** | ❌ N/A | — | Event detail auth-gated |
| **Place** | ❌ N/A | — | Venue detail auth-gated |
| **Open Graph** | ❌ Missing | — | og:title, og:description, og:image, og:url |
| **Twitter Card** | ❌ Missing | — | twitter:card summary_large_image |
| **App links** | ❌ Missing | — | android-app, ios-app alternate links |

---

## 3. Detailed Findings

### 3.1 Meta Tags

| Location | Current | Recommended |
|----------|---------|-------------|
| **mobile/app/+html.tsx** | charset, viewport, theme-color, apple-mobile-web-app-* | Add: `<title>`, `<meta name="description">`, `og:*`, `twitter:*` |
| **admin-dashboard/index.html** | charset, viewport, title "Shhh Command Center" | Add: meta description; og/twitter optional (internal) |

**Implementation (mobile `+html.tsx`):**
```tsx
<title>Shhh — Privacy-Native Social for Adults</title>
<meta name="description" content="Who's nearby. Who's open. Right now. Shhh is a discreet, proximity-driven social platform for adults who value privacy, safety, and authentic connections. Free · Verified · 18+" />
<meta property="og:title" content="Shhh — Privacy-Native Social" />
<meta property="og:description" content="Who's nearby. Who's open. Right now. A discreet, proximity-driven social platform for adults." />
<meta property="og:image" content="https://shhh.app/og-image.png" />
<meta property="og:url" content="https://shhh.app/" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Shhh — Privacy-Native Social" />
<meta name="twitter:description" content="Who's nearby. Who's open. Right now." />
<meta name="twitter:image" content="https://shhh.app/og-image.png" />
```

**Note:** `og:image` and `twitter:image` require a 1200×630px image at `/og-image.png` (or equivalent) in `mobile/public/`.

---

### 3.2 Sitemap & robots.txt

**Current:** None.

**Recommended:**

**robots.txt** (in `mobile/public/` for static export):
```
User-agent: *
Allow: /
Disallow: /(auth)/verify-code
Disallow: /(tabs)/
Disallow: /chat/
Disallow: /profile/
Sitemap: https://shhh.app/sitemap.xml
```

**sitemap.xml** (static or generated at build):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://shhh.app/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://shhh.app/terms</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://shhh.app/privacy</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```

**Implementation:** Add `robots.txt` and `sitemap.xml` to `mobile/public/`. Expo static export copies `public/` to `dist/`, so they will be at `dist/robots.txt` and `dist/sitemap.xml`. Vercel serves static files before applying the SPA rewrite, so these will be accessible. If needed, add explicit rewrites in `vercel.json` to bypass the catch-all.

---

### 3.3 JSON-LD Structured Data

**Organization + WebSite** (add to `+html.tsx` `<head>`):
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Shhh",
  "url": "https://shhh.app",
  "logo": "https://shhh.app/icon-512.png",
  "description": "Privacy-native social platform for adults. Proximity-driven, verified, ephemeral by design."
}
</script>
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Shhh",
  "url": "https://shhh.app",
  "description": "Who's nearby. Who's open. Right now."
}
</script>
```

**WebApplication** (for app store / rich results):
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Shhh",
  "applicationCategory": "SocialNetworkingApplication",
  "operatingSystem": "iOS, Android",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
}
</script>
```

---

### 3.4 App Links (Smart App Banners)

**android-app:**
```html
<link rel="alternate" href="intent://shhh.app/#Intent;scheme=shhh;package=app.shhh.mobile;end" />
```

**ios-app:**
```html
<meta name="apple-itunes-app" content="app-id=YOUR_APP_STORE_ID" />
```

**Note:** Replace `YOUR_APP_STORE_ID` when the iOS app is published. The `app.json` shows `bundleIdentifier: app.shhh.mobile`.

---

### 3.5 Semantic HTML & Heading Hierarchy

**WebEntryShell.tsx** uses React Native `Text` and `View`, which render as `<div>` and `<span>` on web. For SEO:

- Wrap hero headline in `<h1>` (or use `accessibilityRole="header"` + `accessibilityLevel={1}` if RN supports)
- Section titles ("HOW IT WORKS", "TRUST & SAFETY", "PREMIUM") as `<h2>`
- Use `<main>`, `<section>`, `<nav>`, `<footer>` where appropriate

**Expo/RN Web:** Use `expo-router/Head` or platform-specific rendering. For static export, consider a web-only wrapper that injects semantic HTML via `dangerouslySetInnerHTML` or a `_layout.web.tsx` that wraps content in proper structure.

---

### 3.6 Page Load Performance

| Issue | Location | Recommendation |
|-------|----------|----------------|
| **Fonts block render** | `admin-dashboard/index.html` loads Google Fonts synchronously | Add `rel="preload"` for critical font; use `font-display: swap` |
| **Hero image** | `WebEntryShell.tsx` — `/hero.png` | Add `loading="lazy"` for below-fold; hero is above-fold—keep eager or preload |
| **PWA icons** | `manifest.json` references `/icon-192.png`, `/icon-512.png` | Ensure these exist in `mobile/public/` |
| **No preconnect for API** | — | If API is on same domain, not needed; if CORS cross-origin, consider preconnect |

---

### 3.7 URL Structure & Canonical

- **Landing:** Typically `/(auth)` or `/` — add `<link rel="canonical" href="https://shhh.app/" />` in `+html.tsx`
- **Venue/event share URLs:** `https://shhh.app/venue/{id}` — these require auth; crawlers will see login. For share previews, consider:
  - **Option A:** SSR or prerender for `/venue/[id]` and `/event/[id]` with meta tags (requires Expo SSR or separate Next.js/Remix page)
  - **Option B:** Open Graph API — backend endpoint that returns OG meta for a given venue/event ID; use `og:url` with that URL and let Facebook/Twitter fetch it (requires server-side meta injection)

---

### 3.8 Mobile-Friendliness Signals

- **Viewport:** ✅ Present (`width=device-width, initial-scale=1`)
- **Touch targets:** ✅ Adequate (buttons, nav)
- **Font sizing:** ✅ Readable
- **Content width:** ✅ No horizontal scroll (max-width, responsive)

---

### 3.9 Public Pages Inventory

| Route | Public? | Indexable? | SEO Notes |
|-------|---------|------------|-----------|
| `/` (WebEntryShell) | Yes (unauthenticated) | Yes | Primary landing; needs full SEO |
| `/(auth)` | Yes | Yes | Same as `/` when showing WebEntryShell |
| `/(auth)/register` | Yes | Partial | Auth form; low SEO value |
| `/terms` | No (doesn't exist) | — | **Add** for compliance + SEO |
| `/privacy` | No (doesn't exist) | — | **Add** for compliance + SEO |
| `/venue/[id]` | Auth-gated | No | Share URL exists; crawlers see login |
| `/event/[id]` | Auth-gated | No | Same |
| Admin dashboard | Internal | Noindex recommended | Add `noindex` if public URL |

---

## 4. Prioritized Recommendations

### P0 — Critical (Do First)

1. **Add document title and meta description** to `mobile/app/+html.tsx`
2. **Add Open Graph and Twitter Card tags** to `mobile/app/+html.tsx`
3. **Create og-image.png** (1200×630) and place in `mobile/public/`
4. **Add JSON-LD Organization + WebSite** to `+html.tsx`
5. **Create robots.txt** in `mobile/public/`
6. **Create sitemap.xml** in `mobile/public/` (or at build)

### P1 — High Impact

7. **Add canonical URL** to landing in `+html.tsx`
8. **Add WebApplication JSON-LD** with app links
9. **Add app links** (android-app, ios-app) for deep linking
10. **Add /terms and /privacy** public routes; link from WebEntryShell footer

### P2 — Medium Impact

11. **Semantic HTML** in WebEntryShell (h1, h2, main, section, footer)
12. **Lazy loading** for below-fold images
13. **Font optimization** (preload, font-display: swap) in admin-dashboard and mobile
14. **FAQPage schema** for "How it works" content

### P3 — Lower Priority

15. **Admin dashboard** meta description + noindex if publicly accessible
16. **Venue/event OG meta** via backend endpoint if share previews are important

---

## 5. Implementation Checklist

| Task | File(s) | Est. Effort |
|------|---------|--------------|
| Title + meta description | `mobile/app/+html.tsx` | 15 min |
| OG + Twitter tags | `mobile/app/+html.tsx` | 15 min |
| og-image.png asset | `mobile/public/` | Design task |
| JSON-LD Organization, WebSite, WebApplication | `mobile/app/+html.tsx` | 30 min |
| robots.txt | `mobile/public/robots.txt` | 10 min |
| sitemap.xml | `mobile/public/sitemap.xml` | 15 min |
| Canonical link | `mobile/app/+html.tsx` | 5 min |
| App links (android-app, ios-app) | `mobile/app/+html.tsx` | 15 min |
| /terms, /privacy routes | `mobile/app/terms.tsx`, `privacy.tsx` | 1–2 hrs |
| Footer links in WebEntryShell | `WebEntryShell.tsx` | 30 min |
| Semantic HTML (h1, h2, etc.) | `WebEntryShell.tsx` | 1 hr |
| Lazy loading images | `WebEntryShell.tsx`, events | 30 min |

---

## 6. Appendix: File Reference

| File | Purpose |
|------|---------|
| `mobile/app/+html.tsx` | Root HTML for web; add meta, JSON-LD, canonical here |
| `mobile/src/components/WebEntryShell.tsx` | Landing page; add semantic structure, footer links |
| `mobile/public/manifest.json` | PWA manifest; already has name, description |
| `admin-dashboard/index.html` | Admin SPA shell; low SEO priority |
| `mobile/vercel.json` | Rewrites; ensure robots.txt, sitemap.xml are served |

---

*End of report*
