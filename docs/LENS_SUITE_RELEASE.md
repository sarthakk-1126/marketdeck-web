# MarketDeck Lens across the product suite — 4 October 2026

## Delivered scope

The existing approved Lens panel now has Guide, FAQs, Shortcuts and Portfolio sections. Calculator, Portfolio update and All shortcuts appear immediately in Guide. The searchable directory contains 82 curated user-facing destinations across all five products, saved work, portfolio analysis and learning. Dynamic company/instrument pages remain discoverable through company search; destructive, generated-on-POST, admin and internal operations routes are excluded.

The same versioned stylesheet/module mounts the panel in Screener, Charting, F&O, Commentary and Crypto World's shared base templates, covering their descendant pages. Homepage and generated public editorial/information pages load the same component. Product pages need only two asset tags; markup, knowledge and behavior remain owned by marketdeck-web.

## Portfolio contract

Portfolio update makes a user-triggered same-origin GET to `/screener/portfolio/`, with the existing session credentials, no-store caching, manual redirects and a 15-second abort limit. Redirects become a sign-in affordance before reaching the account service. No credentials or account data are sent to a model or third party.

The original authenticated owner-scoped Screener view remains the financial and authorization source of truth. Lens reads its rendered summary and FIFO holdings, retaining original formatting, missing-value semantics and dates/sources. It does not recalculate financial figures or fetch broker/market quotes. It shows the active portfolio name, invested/current values, unrealized and realized gains, missing-price warnings, every open lot, and links to switching portfolios, activity, gains and analysis. Crypto's uploaded-file portfolio remains a separate shortcut because it is not the saved equity ledger.

Portfolio data is held only in the current DOM and cleared on close, reset, pagehide or tab hiding. Pending requests are aborted; stale responses cannot repopulate the panel. No local/session storage, account identifiers or new database/API changes.

## Validation

- Reproducible build, syntax and diff whitespace checks passed.
- Focused Lens + homepage tests: 26/26 passed, including shortcut intent dispatch, safe routes, missing-price/partial-response behavior, redirect handling and lifecycle guards.
- Full check: 83/84 passed. The original product-art missing `data-preview-src` assertion remains the same pre-existing failure.
- Real Chromium previews of all five public products: shared panel and shortcuts opened successfully; desktop panel width about 409 px, height 780 px, no horizontal overflow.
- Source-appropriate styling inspected on Charting, F&O and Crypto; external SVG fill/stroke isolation fixed after Charting comparison.
- Real Screener `portfolio.html` content rendered by Django with explicitly synthetic values, then fetched through the Lens portfolio workflow in a real 320 × 844 frame. Summary, lots and provenance rendered; closing/reopening cleared the values. No customer records queried or modified by this fixture.
- Signed-out public portfolio request verified in Chromium: sign-in state, no cross-origin fetch of the account page. Full check logs in `.preview/lens-suite-check.log`; focused logs in `.preview/lens-suite-tests.log`.

Limits: a real customer's signed-in holdings were not inspected. The authenticated presentation path is validated with the real template and synthetic fixture; owner authentication and calculations reuse the existing portfolio view without modification. Native mobile keyboards remain untested; real narrow viewport frames were exercised. Shared selectors are an intentional presentation contract: a changed/partial portfolio template fails closed with the original workspace link.

## Release boundaries

Only shared Lens source/generated assets, public page asset tags, tests/docs, and the five product base-template asset includes changed. No infrastructure configuration, auth implementation, calculations, financial data jobs, database schema/records, admin or analytics changes. Production application template deployment must retain the changed template in its image and gracefully reload only application workers.
