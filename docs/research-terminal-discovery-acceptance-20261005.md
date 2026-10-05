# MarketDeck Research Terminal — Flagship Discovery Report

**Date:** 5 October 2026
**Verdict:** **LIVE — product and SEO acceptance PASS, with a deployment-isolation follow-up.** The homepage section, public landing, protected workspace handoff, central sitemap and IndexNow release are complete. The existing deployment workflow also rebuilt/recreated its platform-core dependency; that exception is documented rather than claiming platform-core was not restarted.

[Homepage section](https://marketdeck.in/#research-terminal) · [Public Research Terminal landing](https://marketdeck.in/screener/research-terminal/) · [Working research desk](https://marketdeck.in/screener/research-desk/)

## 1. Current-state audit

The release resumed from preserved isolated worktrees rather than starting over. Initial audit sources were web `75baca5` and Screener `08b54ac`. Completed premium-terminal work was subsequently incorporated, making the immediate pre-release baselines web `e1dcb2a601e640083daa5b1be4bd852bb423b7f9` and Screener `d934928070b01819d3e1859dd71843d4aac375b7`. The newer actual-terminal design was retained. Production started with 12,889 accepted canonicals. The original user's separate dirty working copies and pre-existing deployment archives were not deleted or overwritten.

## 2. Research Terminal capability inventory

The audited workspace exposes Research, Charting, Value Lab, F&O, Peers, Scenarios, Changes, Thesis and Notes. It supports company selection; a three-metric mixer; indexed/actual financial history; linked reporting-period selection; source traces; compatible-period peer comparison; editable valuation assumptions; saved evidence and private desks. Investing, Chart research and Options research modes arrange the workspace. Existing product-specific coverage and access restrictions remain relevant.

## 3. Product differentiators

The proposition is a company context that persists while the research question changes. The meaningful evidence is the connection among financial periods, sources, peers, assumptions and private observations—not a claim that MarketDeck alone has charts, valuation or company research. The discovery release does not change any underlying model or calculation.

## 4. Competitor and positioning research

Qualitative primary-product research covered Screener.in, Tijori, TIKR, Koyfin, Tickertape, StockEdge, TradingView and the accessible portions of Trendlyne. Screener emphasizes company analysis/screening; Tijori and TIKR also describe connected research and valuation; Koyfin emphasizes customizable analysis/graphing. Therefore, no exclusivity, Bloomberg-alternative, institutional-grade or market-leadership claim was made. Some requested product-page fetches, including Zerodha Console, FinChat and Bloomberg, were unsuccessful; no detailed conclusions were invented from those failures. Full observations and source links are in [the research/design record](research-terminal-discovery-20261005.md).

## 5. Search-intent research

Primary intent: a connected company-research workspace for Indian stocks. Secondary language: company financial analysis, valuation assumptions, peer comparisons and research workflow. Research did not establish reliable numerical keyword volumes or expected rankings. Screener retains stock-finding/filtering intent; Charting retains dedicated price-analysis intent; Portfolio Analysis retains portfolio-level research. No thin keyword or ticker permutations were created.

## 6. Final positioning

**One company. Keep the whole story.** The supporting proposition connects financials, charts, valuation, peers and thesis without rebuilding company context.

## 7. Homepage information architecture

The new section sits after the product-suite overview and before Portfolio Analysis. The existing hero, product cards, Portfolio visual, Intelligence, Lens and bots/community sections were preserved. It is not appended to the bottom as an easily missed footer promotion.

## 8. Homepage section concept

The right-hand component is rendered HTML/CSS/inline SVG, not a screenshot. Four preview tabs expose Fundamentals, Value Lab, Peers and Thesis. Shallow layered planes and a source chip create restrained dimensionality. A visible disclosure identifies the interface as illustrative, without live market figures or private notes.

## 9. Interaction and motion

Selecting a tab changes the visible preview and explanatory readout. Selecting Earlier, Previous or Latest filing changes the source chip and financial-chart cursor. Pointer hover separates the layers slightly. There is no autoplay timer, new WebGL dependency, video, market API request, storage identifier or preview-specific analytics collector. Motion explains the connected context instead of creating an unrelated animation.

## 10. Desktop design

The layout pairs concise copy and calls to action with a miniature terminal. It inherits homepage tokens, including its existing blue accent, surfaces and typography. At 1440 and 1024 pixels, the tested controls, source state and layout pass. Existing homepage components were not restyled by the new stylesheet.

## 11. Mobile design

At 390 pixels, copy and actions precede a smaller single-panel terminal. The whole homepage section is approximately 740 pixels tall in the measured local layout. The preview, buttons and reporting context fit without horizontal overflow. The CTA remains a normal link outside the visualization. This was tested in Chromium; it is not a claim of exhaustive cross-browser/device certification.

## 12. Final homepage copy

**Eyebrow:** RESEARCH TERMINAL / COMPANY WORKSPACE
**Headline:** One company. Keep the whole story.
**Supporting copy:** Financials, charts, valuation, peers and your thesis. Move between them without losing the company you came to understand.
**Primary CTA:** Explore Research Terminal
**Secondary CTA:** Open the desk
**Access note:** Explore first. Sign in to save a private desk.

## 13. SEO architecture decision

Option A was selected: a separate, server-rendered public product landing. Existing application routes were not moved or reclassified. The new landing uses the established Screener PageSEO and source-inventory contracts rather than a new programmatic URL family.

## 14. Public URL

`https://marketdeck.in/screener/research-terminal/`

Exactly one new public canonical was admitted.

## 15. Workspace indexing and privacy policy

`/screener/research-desk/` and its company query states remain `noindex,follow`, canonical-free and outside the sitemap. Anonymous saved-state access remains HTTP 401. Private notes, thesis text, assumptions and saved-desk identifiers are not loaded into the public landing. Noindex is an indexing directive, not the authorization boundary; existing owner/authentication checks remain in place.

## 16. Landing-page architecture

The page contains a definition-led hero, interactive illustrative preview, four capability groups, a four-step research journey, explicit model/data/privacy boundaries, contextual product links and an opening CTA. It is useful without sign-in. Its anonymous-render tests prohibit database access.

## 17. Final landing copy and capabilities

**Headline:** Research Terminal. One company, in context.

**Definition:** MarketDeck Research Terminal is a company-research workspace for Indian stocks. Connect financial history, charting, valuation, peers, scenarios and your thesis without rebuilding the company context across separate tools.

**Access statement:** Explore the public workspace without signing in. Sign in to save desks, notes and evidence privately.

The four capability headings are **Read the business through its filings**, **Bring charts and peers into the picture**, **Make valuation assumptions explicit**, and **Keep evidence beside your thesis**. The research journey is Choose the company → Inspect a reporting period → Test an explanation → Save the evidence. Visible limitations explain that reporting history is not a point-in-time backtest, valuation depends on assumptions rather than price targets, F&O availability is instrument/data-dependent, and saved research requires an account. The exact complete copy is retained in Screener's `research_terminal_landing.html` at the production commit listed below.

## 18. Metadata

**Title:** Research Terminal for Indian Company Analysis | MarketDeck

**Description:** Connect financial history, charts, valuation, peers and private research notes in one company workspace. Keep assumptions and sources in view.

Canonical URLs are built from the trusted public origin, not arbitrary request hosts.

## 19. Structured data

WebPage and BreadcrumbList describe the visible product landing and reference MarketDeck's existing Organization/WebSite identities. No SoftwareApplication, FAQPage, reviews, ratings, invented offers or Dataset markup was introduced. Semantic utility-query responses do not emit the acquisition graph.

## 20. Internal links

Homepage section → public landing → working desk. A compact Screener-home block also links to the landing. The landing links to Screener, Charting, F&O, Portfolio Analysis, methodology and research standards. Existing company-specific Open Research Desk links retain their direct workspace destination.

## 21. Navigation changes

The homepage footer's Research Desk entry now points to the public landing as Research Terminal. The main global header was not expanded. No sitewide link grid or duplicate promotion across every product shell was added.

## 22. Implementation ownership

Web PR [#81](https://github.com/sarthakk-1126/marketdeck-web/pull/81) owns the homepage generator/template, shared discovery CSS/JS, documentation, tests and bounded-publication tooling. Screener PR [#67](https://github.com/sarthakk-1126/stockproof/pull/67) owns the route, render-only view, public metadata, SP-01 registry entry, templates, compact home bridge and regressions. The latter also excludes existing `.releases/` archives from Docker build inputs without deleting them. No analytical engine or saved-state implementation was edited.

## 23. Before/after performance

Matched local measurements used one warmup and five retained observations per condition, interleaved with the same assets and viewport. These are lab comparisons, not field Core Web Vitals or a mobile-network forecast.

| Metric | Before | After |
| --- | ---: | ---: |
| Desktop median LCP | 236 ms | 228 ms |
| Mobile median LCP | 192 ms | 204 ms |
| Maximum observed CLS | 0 | 0 |
| DOM elements | 2,747 | 2,885 |
| Local generated homepage HTML | 86,703 B | 93,161 B |

Shared CSS is 16,977 bytes; JavaScript is 3,267 bytes. Their measured gzip sizes are 4,049 and 1,237 bytes respectively. Live browser responses measured homepage HTML at 93,423 bytes and the landing at 32,536 bytes; these absolute live values are not substituted into the matched local comparison.

## 24. Accessibility

Native buttons expose pressed state, visible focus and Arrow/Home/End navigation. Reduced motion suppresses transforms/transitions. No essential text requires hover. Without JavaScript, the first preview remains visible, enhancement-only controls are disabled, and real CTA links still work. No account or analytics preference was changed by QA.

## 25. Live browser and visual acceptance

Live homepage and landing passed at 1440, 1024 and 390 pixels, including four-panel switching, reporting/source changes, keyboard interaction, reduced motion, canonical checks and handoff to the working desk. No horizontal overflow or uncaught JavaScript error was observed. The two inline SVGs render correctly in the preview. CSS/JS HTTP bytes match tested files exactly, avoiding the earlier SVG transfer problem.

[Live desktop homepage capture](qa/research-terminal-discovery-live-home-desktop.webp) · [Live mobile homepage capture](qa/research-terminal-discovery-live-home-mobile.webp) · [Live landing capture](qa/research-terminal-discovery-live-landing-desktop.webp)

## 26. Tests

Screener: **89 focused tests, 88 passed and 1 skipped, no failures**. Web: **115 serialized tests, 113 passed and 2 failed**; the exact unchanged baseline had the identical two failures in 109 tests. Those pre-existing failures concern the existing analytics-runtime allowlist and an obsolete artwork attribute assertion; there are zero new failures. Six new discovery tests and seven bounded-publication tests pass. System and migration-drift checks pass. Production HTTP verification added 18 route/agent checks plus exact asset/protected-file checks.

## 27. Canonical, indexability and analytics

Clean landing and tracking-only query: HTTP 200, one clean canonical, one GA4 configuration. Semantic company/saved-desk query states: noindex, no canonical, no GA4 configuration, no acquisition graph. Invented ticker child paths: 404. Ordinary and Googlebot user-agent checks agree on these policies; simulated user agents are not presented as verified Google crawls. QA blocked browser telemetry requests.

## 28. Publisher dry-run

`research-terminal-discovery-20261005-dry1` passed. The full, read-only Screener source export contained **17,715 records**. Publication deliberately retained the **17,705 previously accepted Screener records** and appended only the one freshly source-validated landing, creating a **17,706-record accepted envelope**. This is explicitly a bounded admission, not a claim that the entire current registry was republished. Other producer envelopes were retained exactly.

## 29. Central activation

Release `research-terminal-discovery-20261005-live1` activated at **2026-10-05 02:42:26 UTC**. Accepted canonicals: **12,889 → 12,890**. Created 1; updated 0; withdrawn 0. Screener catalog: 185 → 186. All nine other sitemap children remain byte-identical; live root and all ten children were fetched and reconciled. The new landing occurs exactly once, with zero duplicates and no working-desk URL. The P/E discrepancy remains excluded for separate reconciliation. Root SHA-256: `9ce152252e397947ac15490cd58caba04881646ca57d8170dbcf16f15b65f42c`.

## 30. IndexNow

Only the new landing was submitted: one release event, one chunk, one URL, HTTP **200 accepted**, first attempt. Existing notification/idempotency state was retained. Acceptance is not evidence of indexing, ranking or an AI citation. No historical bulk submission occurred.

## 31. Production commits

- MarketDeck web: `c4e9738db55e247d9f9489c10d5af1b06cfec7ad` — PR #81.
- Screener: `e6d006e3faa5f5a3e1c85783f4a85caacbda768e` — PR #67.

Screener's deployment run `37255571029`, attempt 2, succeeded at 02:35:42 UTC. Key running-image source files match the deployed checkout. Web shared assets were live before the new Screener template was activated.

## 32. Rollback and deployment exceptions

Immediate source/static and central-publisher archives were retained and their four archive checksums verified. The previous Screener image is retained as `factory-stockproof:rollback-research-terminal-discovery-20261005`; prior production sources include the newer premium-terminal work.

The first deploy attempt failed because this release's rollback Git reference was root-owned and mode 600. Its verified SHA was unchanged; correcting only that reference's owner/read permissions let the existing workflow fetch normally. No credential or infrastructure settings were changed for that repair.

**Deployment-isolation exception:** the existing workflow's `docker compose up -d --build stockproof` also built and recreated its platform-core dependency. The original strict container-isolation check failed and that failure is preserved. Workflow logs confirm the cause; this was not silently reclassified as an unrelated restart. No platform-core source edit was made by the discovery feature. Follow-up checks passed for the platform system, noindex/canonical-free login and signup, analytics client availability and anonymous admin redirect. This is not an exhaustive authenticated regression of the rebuilt dependency.

## 33. Remaining risks and preserved work

Product and SEO checks pass, but an exception-free deployment closeout is not claimed. The deployment owner should separately constrain service-only releases so unchanged shared dependencies are not rebuilt/recreated unintentionally. This task does not silently modify that pipeline or repeat the build. Existing dirty platform CSS, private archives, credentials, databases and rollback artifacts were not deleted. Robots, Atom and favicon bytes remain unchanged. P/E issue #69, SG-07C's pause, SG-09D's observation state and the company-reporting study's rights pause remain intact.

## 34. What to monitor

Over the next two to four weeks, record discovery and indexing of the new canonical, recurring non-brand queries, impressions/clicks, and landing-to-workspace engagement where consented first-party measurement supports it. Compare against the publication date and avoid interpreting crawler/Cloudflare IP counts as people. The initial indexing, ranking and citation outcomes are **not yet measured**, not zero and not guaranteed. No paid monitoring dependency or scheduled task was created.

## 35. Formal completion

**The requested homepage/product-discovery and basic SEO release is live and verified. Overall disposition: PASS WITH FOLLOW-UP**, because the existing deployment pipeline recreated a shared dependency despite the intended narrow release. The exception and health checks are recorded explicitly. No next Intelligence content cluster, new research study or unrelated roadmap phase was started.
