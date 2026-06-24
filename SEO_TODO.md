# SEO TODO

Outstanding SEO work for maggieclucy.com. Health score: **51 → 58/100** after the first quick-win batch (re-audited on the local build). Quick wins applied so far are listed under "Done" at the bottom.

The site is a client-side-rendered Vite + React 19 SPA on S3/CloudFront. **The single root cause behind most remaining Critical/High findings is the lack of SSR/prerendering** — every route serves an empty `<div id="root">`, so non-JS crawlers (social scrapers, GPTBot, PerplexityBot, Bing) see no content. The re-audit confirmed this is now the dominant ceiling: it caps Technical (JS-rendering 40/100), GEO (accessibility 40/100), and On-Page (per-route meta only post-JS).

Category scores after re-audit: Technical 61, Schema 82, Performance 68, GEO 36, On-Page ~62, Content ~44, Images ~70.

---

## Critical — structural

- [ ] **Prerender or SSR the routes.** Highest-leverage change; unlocks the canonical, thin-content, and AI-crawler findings at once. Options: build-time prerender (`vite-plugin-prerender` / `@prerenderer/renderer-puppeteer`) keeping static S3/CloudFront hosting, or migrate to Astro/Remix.
  - Static content (home `<h1>`, contact bio, reel embed, per-route `<head>`/JSON-LD) snapshots cleanly — the main win.
  - API-driven pages (`/film`, `/photo`): either (a) fetch prod API at build + snapshot, with a **rebuild-on-upload trigger** to avoid staleness, or (b) leave client-rendered and rely on Googlebot's JS rendering.
- [~] **Static canonical points every route to `/`.** Interim fix applied — removed the hardcoded `<link rel="canonical">` from `index.html` so non-JS crawlers no longer see every route as a duplicate of home (the per-route JS `Seo` canonical stays). **Full fix still pending: prerender per-route canonicals.**
- [ ] **`og:url` (and og:title/description) hardcoded to the homepage in static HTML.** Inner routes shared on social show the home preview. Unlike canonical, removing it does NOT help — social scrapers don't run JS, so they'd see the home OG card regardless. **Genuinely prerender-dependent; do not treat as a quick win.**

## Quick wins (new, from re-audit — safe, code-only)

- [ ] **Merge the 4 Google Fonts `<link>`s into 2** combined `?family=A&family=B` requests — fewer render-blocking round-trips.
- [ ] **Named AI-crawler `Allow` rules in `robots.txt`** (GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot) — marginal but free positive signal.

## High — content (needs real info from Maggie; code can be wired ahead of copy)

- [ ] **Per-project descriptions.** Add a `description` field to the `Project`/`Photo` types and render it on `/film` and `/photo`. Biggest E-E-A-T lever — those pages are currently media + titles only.
- [ ] **Expand the bio to ~200–300 words** (`contact.tsx`). Grammar already fixed, but still ~70 words. Add years active, production types, gear, specialization.
- [ ] **Add a context paragraph + `<h1>` to `/reel`.** That page currently has zero prose and no heading.
- [ ] **Add a `## Work` / specialties section to `llms.txt`.** Re-audit flagged this as the highest-ROI move under the CSR constraint — gives LLMs citable facts to answer "what has she shot?" (genres, notable projects, gear). Needs Maggie's input.

## High — infra (CloudFront / Terraform)

- [ ] **Soft 404 fix.** Unknown paths return HTTP 200 + the shell. Add a `custom_error_response` for 404 → `/index.html` in the CloudFront Terraform, plus a `noindex` catch-all route in the router.

## Medium — code (no new data needed)

- [ ] **`VideoObject` schema on `/reel`** (eligible for video rich results) + **`ProfilePage`** JSON-LD block. Extend the `Seo` component to inject per-route JSON-LD. Note: `ProfilePage` with `mainEntity` can replace the standalone `Person` block in `index.html`. (`WebSite` block ✅ done.)

## Medium — infra / data

- [ ] **Verify prod security headers.** `curl -I https://maggieclucy.com` and confirm the CloudFront managed security-headers policy actually applies (HSTS, X-Content-Type-Options, X-Frame-Options, ideally Referrer-Policy / CSP).
- [ ] **Image sitemap for `/photo`.** High value for a photographer. Needs image URLs generated at build time or from the assets API.
- [ ] **Real `lastmod` dates in `sitemap.xml`.** Current values are placeholders — replace with real content-update dates, ideally auto-stamped at deploy.

## Low

- [ ] **`og:image` per inner page.** Add an `ogImage` prop to the `Seo` component (e.g. billboard for `/contact`, a reel thumbnail for `/film`). Inner pages currently inherit the home OG image or none.
- [~] **Mobile tap targets.** Added `padding` to home + `TitleBar` nav links to reach ~48px. **Still open:** `TitleBar` is cramped on 375px (logo + 4 links, no hamburger) — a mobile menu would be the fuller fix.
- [ ] **IndexNow** (optional) — Bing/Yandex instant-indexing key in `public/` + a POST on deploy.
- [ ] **Starblues `@font-face` metric overrides** (`size-adjust`/`ascent-override`) — `font-display: swap` still causes some CLS on the 120px home `<h1>` when the decorative font swaps in. Low priority given the full-screen video context.

---

## Done (quick wins, already applied)

- [x] Schema `email`: `mailto:` → bare address; **LinkedIn added to `sameAs`** (`index.html`)
- [x] `font-display: swap` on self-hosted `@font-face` (`index.css`)
- [x] Hero video `poster` — now a dedicated first-frame still (`assets/images/landing-poster.jpg`), so no flash; LCP element paints immediately. Added a matching `<link rel="preload" as="image" fetchpriority="high">` in `index.html`.
- [x] `noindex, nofollow` on the `/admin` route (`admin.tsx`)
- [x] Sitemap: `lastmod` added (placeholder dates), `priority` removed (`public/sitemap.xml`)
- [x] Bio grammar fix — sentence fragment + run-on (`contact.tsx`)
- [x] `alt` on the festival laurel image (`ProjectDisplay.tsx`)
- [x] `public/llms.txt` for AI crawlers
- [x] `WebSite` JSON-LD block added (`index.html`)
- [x] Removed wrong static canonical from `index.html` (interim canonical fix)
- [x] `Archivo`/`Roboto` moved from CSS `@import` → `<link>` in `index.html` (un-blocks render)
- [x] `<link rel="sitemap">` added to `index.html`
- [x] Scoped the global `body *` font-size transition to `h1,h2,h3,p`
- [x] Mobile tap-target padding on home + `TitleBar` nav links
- [x] (earlier) `<head>` Open Graph / Twitter / canonical / robots / JSON-LD `Person`; `robots.txt`; `sitemap.xml`; per-route `Seo` component; image `alt` text

### Audit notes / corrections
- The visual agent flagged Bebas Neue + Inter as unused — **they are used in `photo.css`**, so they were intentionally kept.
- Per-route titles/canonicals from the `Seo` component only exist after JS runs, so they help Googlebot but not non-JS crawlers — another reason prerendering is the priority.
