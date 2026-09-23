# MarketDeck Intelligence — first information-architecture release

Date: 23 September 2026. Published feature: verified on actual production HTTPS. This closeout adds documentation and removes completed one-shot tooling; it does not change the public application tree. The closeout PR discussion records its final merge/deployment receipt.

## Scope and resume audit

This release owns topic hubs, article clustering, breadcrumbs, educational content, contextual internal links, minimal product-to-education links and programmatic SEO feasibility. Search Console, index coverage, domain-wide technical SEO, off-page work and campaign measurement remain with the separate SEO owner. The global visual system and product business logic are frozen.

The supplied resume handoff was older than the actual repository. At resumption, main already contained all three hubs, three new guides, breadcrumbs, schema, sitemap integration and internal links at `95fbe8f688d4efdd03e881f7f32ea4d2a7135448`, rather than the original baseline `a3a9f30dbec2d37ae3906fd169e5184e41533d31`. The product learning-link commits were also published. Remaining work was live verification, visual/preservation review and release cleanup, not rebuilding the feature.

The existing `feature/ia-hubs-deeplinks-20260923` branch was retained. Its application/content trees matched published main exactly; only its temporary QA workflow differed. Main's published history was reconciled into this same branch without modifying the application tree. No unrelated open PR was changed.

## Published commits and existing deployments

| Repository | Feature commit | Deployment evidence |
|---|---|---|
| marketdeck-web | `95fbe8f688d4efdd03e881f7f32ea4d2a7135448` | [35889328312](https://github.com/sarthakk-1126/marketdeck-web/actions/runs/35889328312), success |
| stockproof | `2dfc6d6e3674d9bf27e60f1504d746ec931c2bd6` | [35891245384](https://github.com/sarthakk-1126/stockproof/actions/runs/35891245384), success |
| charting-v1 | `c3e7d5e3fb51f596ca5a1f52757739022b84798d` | [35891989948](https://github.com/sarthakk-1126/charting-v1/actions/runs/35891989948), success |
| fo-analytics-v1 | `7ba7551893b9f550aa4d358b3016a6a69054308c` | [35891602612](https://github.com/sarthakk-1126/fo-analytics-v1/actions/runs/35891602612), success |

## Architecture before and after

Before this feature, Intelligence had an editorial library and magazine archive but no dedicated canonical learning hubs for these three subjects. The release establishes the connected path: narrow educational page -> subject hub -> supporting article -> relevant product -> education. Existing article slugs remain stable. Concepts without real guides do not receive invented URLs.

### New hubs

| Canonical URL | Purpose |
|---|---|
| https://marketdeck.in/intelligence/equities/ | Business-first stock research, statements, ratios, cash flow, valuation and source-linked analysis; apply in Screener. |
| https://marketdeck.in/intelligence/technical-analysis/ | Chart reading, timeframe, scale, support/resistance and context; apply in Charts. |
| https://marketdeck.in/intelligence/futures-options/ | Beginner contract language, calls/puts, premium, expiry and volatility risk; apply in F&O. |

Each hub has one H1, title, description, canonical, introduction, Start Here guide, three learning steps, concept groups, real supporting guides, related hubs, a tool link and breadcrumbs. Existing editorial components/styles are reused; this is not a new global design system.

### New narrow guides

| Canonical URL | Primary intent |
|---|---|
| https://marketdeck.in/intelligence/notes/pe-ratio-vs-earnings-yield/ | Explain the inverse ratios, comparable earnings denominators, rupee examples and practical limitations. |
| https://marketdeck.in/intelligence/notes/support-vs-resistance-stock-charts/ | Explain contextual price zones, timeframe, repeated tests, breakouts and risk without guaranteed predictions. |
| https://marketdeck.in/intelligence/notes/call-option-vs-put-option-india/ | Explain calls/puts, strike, premium, expiry and hypothetical payoff examples without personalized-trade or guaranteed-return framing. |

The guides include original explanatory figures, source references, hypothetical rupee examples, contextual article links, a hub link and a relevant tool link. They are substantive content, not placeholders.

## Existing articles, breadcrumbs and internal links

Seven articles now have a primary subject hub: the three new guides plus `business-before-the-stock`, `read-nse-company-announcements-results`, `a-chart-is-a-question`, and `iv-rank-vs-iv-percentile-nifty-options`. Applicable breadcrumbs are `MarketDeck > Intelligence > Subject > Article`, with matching structured data. Cross-topic guides such as `five-research-lenses` retain the appropriate broader hierarchy rather than being arbitrarily forced into a subject.

Hub reading lists connect to real guides; subject articles connect back to hubs; contextual references connect related articles; relevant tool links support learn -> apply. P/E connects with business research/results/research lenses, support/resistance with chart reading, and calls/puts with the IV comparison. No article URL migration was required.

Each product adds one native expandable `Learn with MarketDeck Intelligence` section and three ordinary links:

| Product route | Education destinations |
|---|---|
| `/screener/` | Equities hub; stock-screening guide; P/E versus earnings yield. |
| `/charts/` | Technical Analysis hub; chart-reading guide; support versus resistance. |
| `/futures-and-options/` | Futures & Options hub; calls versus puts; IV rank versus IV percentile. |

Each product commit changes exactly three files and adds 24 lines: one homepage include, one nine-line fragment and one focused test. No new product CSS, JavaScript, form, API, model or calculation is involved. Commentary and Crypto product UIs were not changed; relevant education links there remain a later opportunity.

## Schema, canonical and sitemap

Hubs expose `CollectionPage` with an embedded `ItemList`, plus `BreadcrumbList`. New guides expose `Article` and `BreadcrumbList`. Structured data reflects visible content; no fabricated ratings, reviews, prices or credentials were added.

All six new canonical URLs enter the existing generated sitemap, whose verified release contains 19 canonical entries. The six pages have one H1, a self-referencing HTTPS canonical and a description. No page-level noindex was detected in their reviewed HTML or verified response headers. This is implementation/discoverability evidence, not proof of Google indexing.

## QA evidence and limitations

### Prior source QA reused

[Reviewed release QA 35880686993](https://github.com/sarthakk-1126/marketdeck-web/actions/runs/35880686993): 34 tests passed, zero failed; 48 local responsive cases; 12 accessibility scans; seven no-JavaScript pages; 191 local links/anchors. Its source snapshot and logs were recovered and inspected rather than restarting successful checks.

The preservation report passed for 77 protected files: homepage outside the intended editorial shelf remained identical, the existing CSS prefix was preserved, and magazine/PDF content remained identical. These are source/preservation checks, not a claim that every unrelated product integration suite was rerun.

### Actual live release verification

[Live release run 35895181774](https://github.com/sarthakk-1126/marketdeck-web/actions/runs/35895181774) completed both independent jobs successfully:

- 18 public URL integrity comparisons passed against the reviewed release: homepage, library, magazine archive/issue/PDF, all six new pages, three stylesheets and three guide figures.
- 48 live editorial page/viewport cases passed. The six new pages were checked at 320, 390, 768, 1440 and 1920 CSS pixels; existing guides/library/archive at 390 and 1440.
- 196 internal links/anchors passed, including five actual product destinations excluded by the local-origin check.
- 12 full-page axe scans of the six new pages at 390/1440 reported zero violations in the configured WCAG A/AA rule set.
- Seven editorial pages remained usable with JavaScript disabled.
- 15 product viewport/keyboard checks passed, with three exact education links per product, zero document overflow and zero scoped axe violations in the added sections.
- Nine product-to-education destinations returned HTTP 200; all three product disclosures worked with JavaScript disabled.

The full-page screenshots for all six new pages at 390/1440 matched the prior reviewed screenshots pixel-for-pixel; all three explanatory figure screenshots matched as well. Automated accessibility checks are not a comprehensive accessibility certification. Product verification covers the changed templates/links and live rendering, not a new run of every financial, authentication or end-to-end product suite.

### Lazy images and assets: focused follow-up

The initial library screenshot did not wait for the lazy-loaded magazine cover. [Focused live asset run 35896483707](https://github.com/sarthakk-1126/marketdeck-web/actions/runs/35896483707) passed 20 desktop/mobile cases over the homepage, library, magazine archive/issue and six new pages. All 48 discovered same-origin image/style/script assets returned HTTP 200 and matched reviewed bytes exactly, including the original magazine cover and figures. All inspected images decoded successfully; the loaded library screenshot was reviewed and the cover is intact. No production image, CSS or loading behavior was changed.

An earlier diagnostic probe (`35896123868`) failed in the QA harness because inactive homepage product previews intentionally have no src until selected. The corrected probe exercised all five native preview tabs before checking images; it did not invent URLs, suppress broken-image assertions or change the application.

### Original stopping point

Prior live run `35892101149` stopped at `intelligence-shelf-v1.css`, preventing its later browser steps from running. Its actual SHA-256 was `96b33f960d564c17d247a62846d920d39e4e41aa25b37ec1d074128cda924c7e`: exactly the reviewed stylesheet without its final learning-door/hub-link rules. The correct release hash is `50794855c074370183aa3c36fca769108d732a0bc2f6708af3a086a205e960f3`.

The resumed public-URL comparison received the correct stylesheet without any production edit or cache-provider setting change. This is consistent with a transient stale cached asset. The test was not weakened to accept old CSS, and a cache-busting query was not counted as a public-URL pass.

HTML integrity allows only the single previously inspected Cloudflare analytics injection, identified by its exact block hash; all remaining HTML must match the release. Static assets require raw byte equality.

## Preservation and cleanup

Functionality impact is confined to the intended education content and navigation. Business logic, financial formulas, chart/indicator calculations, F&O analytics, database/migrations, authentication semantics and deployment infrastructure are unchanged by this release. Global colors, fonts and design tokens are unchanged. Product UIs were not redesigned; the sole product addition is the small native learning disclosure.

The closeout removes the completed `scripts/prepare-product-learning-links.py` one-shot writer and the branch's temporary `.github/workflows/ia-live-finish.yml`. Original deployment workflows and maintainable feature/build/test files remain. No temporary source-snapshot workflow or payload is part of the final production feature diff. The entire published `public/` tree remains `618ad976a2b829f0831c40c904ab9079c263185e`.

## Prioritized next content clusters — backlog only

This is a proposed editorial sequence based on the existing learning paths, not measured search-volume or ranking research. These are topics, not new public URLs.

| Priority | Equities | Technical Analysis | Futures & Options |
|---|---|---|---|
| P1 | ROE vs ROCE; profit vs operating cash flow | Chart timeframes; volume context | Strike vs spot; intrinsic vs time value; option premium |
| P2 | Standalone vs consolidated results; market cap vs enterprise value | Candlesticks; moving averages | Open interest vs volume; futures vs options |
| P3 | Deeper evidence-led valuation applications | RSI and indicator limitations | Greeks and strategy structures after the beginner foundation |

Each future guide needs a distinct question, substantive example, source references where necessary, an assigned hub and useful contextual links. Do not create empty pages or filler simply to populate concept lists.

## Programmatic stock pages — feasibility only, not implemented

Candidate examples remain `/stocks/reliance-industries/`, `/stocks/tcs/` and `/stocks/hdfc-bank/`. No stock-page route or generator is authorized or shipped in this release. Before a separate owner-approved pilot, require:

1. **Unique user value:** company-specific, source-linked business context, filing/announcement evidence, comparable financial series and an explainable research workflow. Substituting company names in generic prose is insufficient. Confirm data rights before publishing extracted or licensed data.
2. **Canonical/identity policy:** one stable company entity despite ticker aliases, renamed companies and multiple tool routes. Coordinate with the SEO owner before choosing canonical relations; avoid competing near-identical screener/chart/stock landing pages.
3. **Freshness contract:** show reporting period, source publication/as-of date and last successful refresh. Define filing/corporate-action refresh triggers, failure alerts and stale-data display policy. A new generation timestamp must not imply fresh underlying financial data.
4. **Duplicate/thin-content gate:** reject empty or mostly templated pages, unsupported analysis and pages without enough unique evidence. Determine crawl/index treatment with the SEO owner instead of adding everything blindly to the sitemap.
5. **Internal linking:** connect eligible company pages with real research guides, appropriate hubs and useful tool states. Link related companies only when the comparison helps; avoid indexable parameter combinations and generated link farms.
6. **Small pilot:** test an evidence-rich company set, data accuracy, canonical consistency, user usefulness and maintenance burden before scaling. Indexing/ranking claims require separate evidence and ownership.

## Handoff to the separate SEO campaign

The six new canonical pages and their internal-link network are published for the campaign owner to inspect. Search Console submission/coverage, Google-selected canonicals, crawl monitoring, query impressions and ranking/traffic/conversion measurement remain with that owner. Refresh that workspace from current main before continuing URL work; do not recreate these hubs or confuse the F&O education URL with the distinct product URL.

Report the transient stale stylesheet observation for future release-cache review; no infrastructure change is made here. Successful deployment, structured data and QA are not evidence that Google indexed or ranked any page.

Next architecture work is a small P1 guide batch within these hubs, then low-risk Commentary/Crypto education connections when suitable published material exists. Mass programmatic stock-page deployment is not the automatic next step.
