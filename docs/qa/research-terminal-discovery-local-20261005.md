# Research Terminal discovery — local acceptance, 5 October 2026

Status: local design, source, regression and browser gates pass. This document is not a production acceptance claim.

The existing premium terminal releases were incorporated without changing their engine files. Baselines are web `e1dcb2a601e640083daa5b1be4bd852bb423b7f9` and Screener `d934928070b01819d3e1859dd71843d4aac375b7`.

## Tests

- Web production bundle/static build and review build pass.
- Serialized full web suite: **115 tests, 113 passed, 2 failed**. Exact unchanged baseline: **109 tests, 107 passed, 2 failed**. Identical failures: existing homepage external-runtime allowlist omits the existing first-party analytics script; existing product-art test expects the obsolete `data-preview-src` attribute. Six new discovery tests pass. No new failures.
- Screener focused discovery, existing Research Desk, Portfolio discovery, public/query SEO boundaries, shared SEO foundation and source inventory: **89 tests, 88 passed, 1 skipped**. No failures. New acquisition render is tested with database access prohibited. The new route is explicitly included in existing route-cohort and inventory-count assertions.
- Seven bounded-publication unit tests pass: exact single admission, retained-record equivalence, source integrity/revision, missing/duplicate identity, ineligible/private record rejection and failed-source handling.
- Django system check reports no issues. Migration check reports no changes. No production databases or saved-user data were used in tests.

## Browser checks

Exact local HTML/assets are served through Playwright routes, without a live-network or localhost-server dependency. The Screener pages were rendered with Django against an isolated local SQLite database. Public production assets were not substituted with different design fixtures. External analytics requests were blocked throughout QA.

Homepage and landing pass at 1440, 1024 and 390 pixels: all four view controls, three context selections, source-chip/cursor changes, arrow/Home/End keyboard behavior, visible focus, reduced-motion suppression, one H1, one canonical and one GA4 configuration, valid inline SVG namespaces, no horizontal overflow or uncaught JavaScript errors. Compact Screener bridge points to the public landing. With JavaScript disabled, the first preview remains visible, preview controls remain disabled and real CTA anchors remain usable.

The 390px homepage section is about **740px tall**, including copy, actions, preview and explanation; the preview is intentionally smaller than its desktop version. Homepage accent resolves to `#59a7f5`; Screener accent resolves to `#1392fd`, taken from their own current tokens.

Screenshots are browser-captured illustrative component views, not real user desks:

- `research-terminal-discovery-home-desktop.webp`
- `research-terminal-discovery-home-mobile.webp`
- `research-terminal-discovery-landing-desktop.webp`

## Matched local performance comparison

One warmup and five retained observations per condition, interleaved before/after, same viewport/asset set, reduced motion. This is a local lab comparison, not field Core Web Vitals or a mobile-network simulation.

| Metric | Before | After |
| --- | ---: | ---: |
| Desktop median LCP | 236 ms | 228 ms |
| Mobile median LCP | 192 ms | 204 ms |
| Maximum observed CLS | 0 | 0 |
| DOM elements | 2,747 | 2,885 |
| Homepage HTML | 86,703 B | 93,161 B |

Added shared component CSS: **16,977 bytes** (gzip 4,049). JavaScript: **3,267 bytes** (gzip 1,237). No runtime library, API request, persistent identifier or autoplay timer is added by this component. The small timing difference is not evidence of a field speed improvement or regression.

## Separate build hygiene

Screener's production checkout contains pre-existing private `.releases/` deployment archives. A single `.dockerignore` exclusion prevents copying those archives into the new image. The archives themselves, Compose, Caddy, credentials, image history, database, and existing rollback artifacts are not changed or deleted. This does not claim to remediate any historical image contents.

## Deployment gates still required

Exact-source PR review and remote equality; verified immediate rollback; web shared assets deployed first; Screener landing deployed second; live desktop/mobile and handoff checks; exact live CSS/JS bytes; source exporter and central dry-run proving only one canonical addition; atomic activation; isolated IndexNow event; protected files/containers/utility routes verification. The company-reporting rights pause, SG-07C freeze, SG-09D observation and separate P/E reconciliation remain intact.
