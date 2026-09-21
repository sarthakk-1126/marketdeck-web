# MarketDeck homepage V2 — local review report

STATUS: IMPLEMENTED — READY FOR REVIEW. This is a local review candidate, not visual approval or authorization to publish. Software-rendered performance is below the 60fps target; physical GPU/mobile testing remains outstanding.

## Scope and Git

- Repository: `marketdeck-web` only. Starting/current branch: `codex/premium-homepage`.
- Approved and starting HEAD: `6aae9f51fb6cc834fc17424fca0a3d6fa986e9dd`.
- Initial worktree clean, one checkout, no active merge/rebase/cherry-pick. No unrelated work discarded.
- Backup ref `backup/homepage-v1-6aae9f5` preserves that exact commit.
- The V2 commit is the commit containing this report; its full SHA and post-commit worktree state are provided in the final handoff.
- Product repositories were read only for local capture/artwork. No product calculations, business logic, APIs, auth, permissions, database, production routes, gateway configuration, SSH/deploy scripts, Actions or hosting changed.
- Nothing was pushed, merged, deployed or published. No email, subscription, account creation or analytics collection was performed.

## Preserved foundation

V1's graphite/navy palette, Inter/system and mono stacks, heading style, header/wordmark, button treatment, editorial cards/imagery, approach section, spacing and restrained accents remain. Computed tokens and before screenshots are in `V2_BASELINE.md`. No theme, font or framework migration occurred. The original attractive Earth artwork remains the immediate poster and fallback.

## Globe, entrance and shared scroll story

Source inspection established that V1 moved/scaled a flat perspective WebP plane. V2 uses Three.js r186, an opaque textured SphereGeometry, proper equirectangular NASA day and Solar System Scope night/normal maps, directional/ambient lighting, SRGB texture/output handling, ACES tone mapping and a thin atmospheric shell. Night emission is restricted to the shadowed surface. Seven geographically mapped Indian nodes and seven shallow curved routes sit above the sphere with depth testing; they are decorative, not a live market feed. India stays in view under constrained drift and damped pointer movement. Optional clouds were omitted.

The HTML heading, text, actions and poster are immediately available. The deferred renderer has a 2.4-second entrance (poster blend, slight settle, node/arc emergence), guarded session storage, early-input interruption and a late-load skip. It does not block navigation. First visit and return/late paths are exercised by browser tests; the recording captures `data-intro=fresh`.

One controller owns the animation frame and shared normalized native-scroll progress. Desktop (at least 1000px wide and 650px high, motion enabled) has a compact 240vh scene: slight approach, five image-bearing HTML selectors emerging at different depths, leveling and final docking. These are the same five DOM elements, not disposable clones. Gallery controls become interactive when nearly docked, with one focusable selected tab. The suite CTA bypasses the story immediately. Reverse/fast scroll, direct anchors, resize, keyboard and Back restoration are tested. Final spacing keeps lower cards clear of the upper product labels.

Below the desktop story threshold the gallery is ordinary document flow. Under 800px and on data-saving connections the renderer module/textures are not requested. Reduced motion defaults to a static scene and ordinary gallery; explicit motion-off also collapses the spacer and disables pointer/scroll motion. The visible button persists the visitor's explicit tab preference. No touch scroll interception or drag-to-spin is added.

There is one WebGL context with DPR capped at 1.5 and drawing buffer capped at 1.6 million desktop pixels (650,000 in the lighter renderer tier). Textures adapt to the supported texture limit. Measured workload first reduces optional arcs, then drawing resolution. Offscreen/hidden rendering pauses; teardown disposes resources. Texture/WebGL failure, 12-second initialization timeout, storage denial and context loss restore or retain the poster with usable HTML.

The exact final hybrid Flow video was not identified by the supplied path/reply. Motion follows the written V2 specification and approved V1 foundation; exact synchronization with that final cut is not claimed.

## Products, community and contact

The same selectors dock into a generous 3+2 gallery. Selection opens one shared enlarged detail panel: roughly 65% visual, clear description, three capabilities and configured destination. The preview stacks first on smaller screens. Full images load when reached/selected; the initial useful desktop load requests none. No carousel or simulated trading controls were added. Desktop quick navigation stays visible over the shared preview; the phone rail remains below the header and scrolls horizontally. Pointer, touch-sized targets, keyboard arrows/Home/End and focus transfer are covered.

StockProof and Charting use sanitized historical actual screenshots. F&O uses a signed-out local interface capture of its illustrative strategy UI. Commentary and Crypto World use existing representative artwork from their respective products, labelled as artwork rather than functional screenshots. Raw private references are not committed.

Configured paths remain `/screener/`, `/charts/`, `/futures-and-options/`. Commentary and Crypto World say destination link pending. Production reverse-proxy routing was not tested by the local static server.

There is one prominent stable platform field, grouped into 9 social, 4 Bharat/regional, 8 finance/community and 4 reading entries: 25 total. It contains 24 planned/unlinked entries and one real internal Intelligence link. **Confirmed external joinable destination count: 0.** The count is derived from enabled, confirmed, external, joinable URLs and deduplicated. Google Search is not counted or shown as a community. Platform names/icons do not imply partnership. Contact is a compact General / Partnerships / Support row with pending destinations; newsletter collection is explicitly unavailable. No fake href, email, mailto, form or backend exists. All configurable destinations remain in `src/site-data.json`.

## Intelligence and six-page draft

The existing three editorial cards now have real static learning-note URLs. `/intelligence/` and `/intelligence/issues/` are real index/archive pages. The first Brief, **Start with the evidence**, has six substantive pages, a cover rendered from PDF page 1, an accurate page count, edition, HTML reading/contents/source references and an ordinary on-demand PDF link.

Source metadata is centralized through `content/briefs.json`, referenced by site data. Editable copy: `content/issues/research-foundations.json`. PDF/cover: `content/issues/research-foundations/`. Regenerate with `python scripts/generate-brief.py` or `npm run brief:generate`; Python dependencies and next-issue/approval instructions are in `EDITORIAL_WORKFLOW.md`.

The six primary references, checked for this draft on 22 September 2026, are:

- SEBI Investor: [Stock market](https://investor.sebi.gov.in/securities-stockmarket.html), [trading](https://investor.sebi.gov.in/securities-trading.html), [understanding derivatives](https://investor.sebi.gov.in/understanding_derivatives.html), [derivatives risks](https://investor.sebi.gov.in/securities-risks_trade_derivatives.html).
- NSE: [financial results](https://www.nseindia.com/companies-listing/corporate-filings-financial-results), [corporate actions](https://www.nseindia.com/companies-listing/corporate-filings-actions).

The text is evergreen education with labelled hypothetical examples, no current statistics or recommendations. Source dates are marked unavailable where not supplied, with actual review dates separately recorded. Every PDF page was rasterized and visually inspected; six-page count verified with pypdf and the test suite. Poppler logged missing optional Symbol/ArialUnicode font substitutions, but the actual Helvetica page text, bullets and layouts rendered legibly with no observed clipping or blank pages.

The issue remains `draft`. Production requires both published status and an approval date. The default build excludes its HTML/PDF/cover/card and sitemap URL; the review build includes it with noindex. A stale known draft directory in production fails the build rather than silently remaining published. Published reading pages have canonical URLs; drafts and localhost are absent from the production sitemap. No CMS or runtime document service was added.

## Files, dependencies and assets

Source/controller additions: `src/globe.js`, `public/experience.js`, `scripts/bundle.mjs`, `scripts/editorial.mjs`, `scripts/community.mjs`, `scripts/generate-brief.py`. Content/reading additions: `content/`, `public/intelligence/`, `public/reading.css`, `public/credits/`, `public/sitemap.xml`. QA: `playwright.config.mjs`, browser tests and `scripts/capture-review.mjs`. README and companion documentation describe authoring and review.

Pinned/locked: Three.js 0.186.0 (MIT, runtime globe), esbuild 0.25.12 (MIT, build only), Simple Icons 15.20.0 (CC0 package with separate trademark rights, icon extraction only), Playwright 1.56.1 (Apache-2.0, QA only). Full npm audit: zero reported vulnerabilities. Build output remains committed static `public/`; server/CI changes are unnecessary.

`V2_ASSETS.md` documents exact Earth/product sources and transformations; `PLATFORM_ICON_SOURCES.json` records upstream brand sources/guidelines. NASA credits and Solar System Scope CC BY 4.0 attribution/license/modifications are publicly linked at `/credits/`. Existing V1 art provenance remains in `ASSETS.md`. No raw screenshots/video, downloaded source texture masters, QA artifacts, accounts or tokens are staged.

## Verification and evidence

Commands run:

- `npm run build` and `npm run build:review`: production bundle/static generation and review generation successful.
- `npm run check`: all syntax checks and **9/9** unit/contract checks pass.
- `npm run test:browser`: **23/23** browser cases pass, no skipped/flaky cases. Extra targeted post-spacing check: 2/2 pass.
- `npm audit --json` and `npm audit --omit=dev --json`: zero reported vulnerabilities.
- Bundled Python `scripts/generate-brief.py`: six pages and regenerated cover; Poppler rendered all six for inspection.
- `node scripts/capture-review.mjs`: actual-site recording, named screenshots and PerformanceObserver diagnostics; no captured page errors.
- `git diff --check`: clean.

Coverage includes first paint with blocked module, early input, session return, real renderer/buffer cap, shared forward/reverse/fast scrolling and same-element identity, motion-off mid-story, OS preference changes, WebGL/texture/context/storage/timeout failures, all product selections, roving focus, pending/configured links, anchors/resize/history, community semantics, on-demand images, no-JS articles/PDF and production draft exclusion.

Viewport widths inspected/tested: **320, 375, 390, 430, 768, 1024, 1440, 1920, 2560**. No document-level horizontal overflow in hero, tested transition or docking states. Screenshots are desktop Chromium viewport emulation, not physical phones. No physical Safari/iOS/Android, screen-reader software or production cross-product flow was tested. Full-page regression screenshots can place fixed navigation at the captured scroll position; the named viewport screenshots/recording are the visual review evidence.

Local review: http://127.0.0.1:4173/
Draft HTML: http://127.0.0.1:4173/intelligence/issues/research-foundations/
Draft PDF: http://127.0.0.1:4173/intelligence/issues/research-foundations/marketdeck-brief.pdf

Ignored local evidence under `.preview/v2/`:

- `marketdeck-v2-walkthrough.webm`: fresh entrance, pointer response, native scroll/emergence/docking, Charting and F&O selections.
- `settled-hero.png`, `mid-scroll.png`, `docking-complete.png`, `product-showcase.png`.
- `community.png`, `intelligence.png`, `brief-draft.png`, `mobile-fallback.png`.
- `width-*.png`, `baseline/`, `pdf-pages/page-1.png` through `page-6.png`.
- `browser-results.json`, `targeted-spacing-results.json`, `performance.json`.

## Performance and outstanding review limits

| Diagnostic | Final capture result |
| --- | --- |
| Initial HTML transfer | 32,308 bytes |
| Useful initial path, including HTML/CSS/poster/controller and nearby thumbnails | 457,174 bytes (0.457 MB) |
| Deferred desktop 4K globe code + maps | 1,471,717 bytes (1.472 MB) |
| All resources plus HTML observed at initial settled hero | 1,928,891 bytes |
| Full-size product previews at initial hero | 0 (verified by request inspection and regression) |
| Mobile observed resources, excluding document | 247,340 bytes; globe payload 0 bytes |
| Local LCP | 240 ms |
| Observed CLS across recorded journey | 0.0645 |
| Maximum observed Event Timing duration | 160 ms (not field INP) |
| Recent adapted frame cadence | 51.48 ms average, about 19.4fps |
| Synchronous renderer submission time | 0.34 ms average; not GPU execution time |
| Long tasks during recorded journey | 185, longest 743 ms |
| Captured JavaScript page errors | 0 |
| Intro evidence | fresh |


These measurements come from loopback HTTP, Chromium 141 headless, 1440×900 DPR1, no network/CPU throttling, with video capture and ANGLE Vulkan SwiftShader software graphics. They are local diagnostics, not Lighthouse or field Core Web Vitals. Event Timing durations are observed interactions, **not INP**. No Lighthouse/TBT result is relabelled as INP.

The globe adapts optional arcs first, then resolution to 1152×720 in this software run. The measured cadence does **not** establish the requested smooth 60fps capable-desktop target. Physical GPU testing and physical-phone performance remain outstanding; viewport emulation cannot prove them. There are renderer compilation/software-rasterization long tasks. The HTML/poster/CTA remain available and the lighter phone path downloads no globe assets. The exact final hybrid video and clean functional Commentary/Crypto captures remain unconfirmed; labelled available product artwork is used for review.

PRODUCT BUSINESS LOGIC / FORMULAS / AUTH / DATABASE CHANGED: NO

PRODUCTION PRODUCT ROUTES / DEPLOYMENT CONFIG CHANGED: NO

PUBLICATION / PUSH / MERGE / DEPLOY: NONE
