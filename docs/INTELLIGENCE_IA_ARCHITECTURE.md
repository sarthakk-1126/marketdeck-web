# MarketDeck Intelligence information architecture

Status: implementation handoff · 23 September 2026

## Scope boundary

This document covers information architecture, topic hubs, editorial clustering, contextual internal links, learning paths, product-to-education links, article breadcrumbs, and the feasibility of narrow/programmatic SEO pages. The separate SEO campaign owns Search Console, index coverage, domain-wide crawling/indexing strategy, off-page work, campaign measurement, and broad technical SEO prioritisation.

No search volume, keyword-difficulty, ranking-probability, competitor-traffic, or indexing claims are made here. Public search results and competitor education structures are qualitative inputs only.

## Audit: current state

MarketDeck already has a strong editorial foundation: a premium Intelligence shelf, seven substantial source-linked guides, one published magazine, canonical HTML reading pages, Article/BreadcrumbList markup, a sitemap, and direct product destinations. The five products are real applications rather than thin marketing shells, so replacing their approved interfaces with long SEO landing pages would reduce usability and create unnecessary cross-repository risk.

The architectural weakness is connection rather than absence of content. The library is flat at `/intelligence/`: category filters help discovery inside the hub, but Equities, Technical Analysis and F&O do not yet have crawlable learning destinations of their own. Article breadcrumbs therefore cannot communicate a subject hierarchy, and product workspaces have few obvious paths back to relevant education. Several high-value beginner intents are also missing between broad pillar guides and more specialised research pieces.

## Problems and opportunities

| Item | SEO value | User value | Effort | Risk | Decision |
| --- | --- | --- | --- | --- | --- |
| Three substantive learning hubs | High | High | Medium | Low | Implement now |
| Hub-aware article breadcrumbs | High | High | Low | Low | Implement now |
| Contextual article → tool links | High | High | Low | Low | Implement now |
| Product → education links | Medium-high | High | Medium | Low if template-only | Implement minimally |
| Three beginner comparison guides | High | High | Medium | Low | Implement now to prevent thin hubs |
| Mass stock/company SEO pages | Unknown | Potentially high | High | High | Design separately; do not deploy |
| Indexable filter permutations | Low/uncertain | Low | High | High | Do not create |
| More empty category hubs | Low | Low | Low | Medium | Do not create yet |

## Site tree after this release

- `/intelligence/`
  - `/intelligence/equities/`
    - pillar: `/intelligence/notes/business-before-the-stock/`
    - `/intelligence/notes/pe-ratio-vs-earnings-yield/`
    - `/intelligence/notes/read-nse-company-announcements-results/`
  - `/intelligence/technical-analysis/`
    - pillar: `/intelligence/notes/a-chart-is-a-question/`
    - `/intelligence/notes/support-vs-resistance-stock-charts/`
  - `/intelligence/futures-options/`
    - `/intelligence/notes/call-option-vs-put-option-india/`
    - `/intelligence/notes/iv-rank-vs-iv-percentile-nifty-options/`
  - existing Markets, India, Crypto, AI & Quant, Research Craft filters remain discovery mechanisms until each has enough distinct content for a useful indexable hub.

The three hubs are editorial landing pages, not tag archives. Each has a plain-language introduction, beginner learning sequence, concept map, real published guides, a relevant product destination and links to adjacent hubs.

## Internal-linking map

The intended loop is:

`search question → article → subject hub → related guide → relevant product → education`.

Article links are contextual where the tool or concept is genuinely useful, with a quiet Learn → Apply panel as a secondary path. Hubs link only to real published guides. Article breadcrumbs become `MarketDeck > Intelligence > subject hub > article` when a primary hub exists. Articles without a justified primary hub retain the shorter hierarchy rather than being forced into the wrong category.

## Product ↔ education map

| Product | Primary education destination | Useful guide examples |
| --- | --- | --- |
| Screener | `/intelligence/equities/` | stock-screening framework; P/E vs earnings yield; NSE results |
| Charts | `/intelligence/technical-analysis/` | reading stock charts; support vs resistance |
| F&O | `/intelligence/futures-options/` | calls vs puts; IV rank vs IV percentile |
| Commentary | `/intelligence/` | source-linked research craft and market-evidence guides |
| Crypto | existing Crypto guide / Intelligence | fees vs revenue and token-value fundamentals |

Product changes should be small educational links or cards on existing home/workspace surfaces. They must not replace the applications, move core controls, or alter any calculation or workflow.

## Schema plan

- Keep `Article` and `BreadcrumbList` on article pages.
- Add `CollectionPage` + `BreadcrumbList` to the three subject hubs because they visibly collect and organise editorial content.
- Do not fabricate FAQ rich-result promises, ratings, review counts, offers, downloads, or credentials.
- Defer product `SoftwareApplication` markup until the separate SEO campaign and product owners agree the exact visible application metadata (category, offer/pricing representation and other fields). Avoid schema added merely because the type exists.

## Narrow supporting-page opportunities

The first narrow pages should answer distinct beginner questions rather than repeat a broad pillar:

- P/E ratio vs earnings yield
- support vs resistance
- call option vs put option

Next candidates, subject to search-intent review and existing-page overlap, include ROE vs ROCE, profit vs operating cash flow, market cap vs enterprise value, moving-average comparisons, RSI overbought vs oversold, strike vs spot, intrinsic vs time value, and open interest vs volume. Prefer one excellent page when two phrases describe the same intent.

## Programmatic SEO assessment

Do not launch mass `/stocks/{company}/` pages in this release. StockProof already contains real company-level data, but a separate design review is needed before deciding whether new canonical MarketDeck stock pages would add unique value or merely duplicate application pages. A future page is justified only if it combines materially unique fundamentals, valuation/history, price context, announcements, citations and useful product/research paths. A page built around one changing metric such as “RSI today” is too thin.

Do not make arbitrary filter/query combinations indexable. Curated landing pages should exist only when they have stable intent and unique visible value. Parameter handling, robots and domain-wide canonical policy belong to the broader SEO campaign unless an architecture page directly depends on them.

## Competitor/research observations

Public education products commonly organise learning by modules rather than a single chronological blog feed. MarketDeck should borrow the useful principle—clear subject progression and contextual next steps—without copying competitors’ wording, page templates, screenshots or examples. The differentiator is a tighter Learn → Apply bridge into MarketDeck’s own research tools and India-first worked examples.

## Preservation contract

This architecture must not alter financial formulas, screening logic, chart calculations, F&O pricing/analytics, data models, databases/migrations, APIs, authentication/session/permissions, market-data pipelines, commentary analysis, crypto calculations or other business semantics. Product UI additions are template/CSS-only educational navigation.

## Handoff to the separate SEO campaign

The broader SEO chat should continue to own Search Console, indexing status, crawl/index monitoring, robots and domain-wide canonical strategy, sitemap campaign decisions, backlinks, Core Web Vitals campaign monitoring and actual query/ranking performance. This architecture release should be judged first on correctness, usability, crawlable relationships and preservation—not on immediate ranking claims.

## Next architecture step

After enough content exists, evaluate whether Markets/India/Crypto deserve their own substantive hubs. Use real Search Console evidence when available to decide which subject deserves expansion. Separately design—not deploy—the programmatic company-page model and canonical relationship to existing StockProof company pages.
