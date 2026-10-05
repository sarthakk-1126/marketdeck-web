# Research Terminal — flagship discovery release

## Scope and verified product evidence

One homepage section and one Screener-owned product landing. The working desk, analytical engines, private-state APIs, authentication, Portfolio Analysis and the VaR research study are not redesigned. The existing public workspace was examined at desktop/tablet/mobile sizes. Its Research, Charting, Value Lab, F&O, Peers, Scenarios, Changes, Thesis and Notes views were opened without saving or modifying user records. Repository capability contracts are `docs/research-desk-audit-20261004.md` and `docs/research-terminal-20261004.md`.

The initial sources were web `75baca5` and Screener `08b54ac`. The continuation incorporated the completed premium-terminal releases, web `e1dcb2a` and Screener `d934928`, through normal merges into isolated worktrees. Those changes affect the actual terminal's assets/template, not this discovery design. They must survive deployment and any rollback. Production's pre-existing `.releases/` material and other local working copies remain untouched.

## Research and positioning

Primary-source product pages reviewed on 5 October 2026. These are qualitative positioning observations, not keyword-volume measurements, exhaustive feature comparisons or independent verification of competitors' marketing claims.

| Reference | Observed emphasis | Decision for MarketDeck |
| --- | --- | --- |
| [Screener.in](https://www.screener.in/) | Stock analysis and screening for Indian investors; company search is prominent. | Leave screening and company-directory intent with the existing Screener pages. |
| [Tijori](https://www.tijorifinance.com/) | Company/sector research, tracking timelines, financial comparison, reverse DCF and source links. | Do not pretend that valuation, sources or connected research are unique to MarketDeck. Demonstrate our specific period/basis-aware workflow. |
| [TIKR](https://www.tikr.com/) | Explicit idea-to-conviction workflow combining screening, financials, transcripts and valuation models. | Avoid an unsupported “only integrated platform” claim. Emphasize the actual MarketDeck workspace and research boundaries. |
| [Koyfin](https://www.koyfin.com/) | Customizable dashboards, financial analysis, graphing and multi-asset research. | Use a restrained, readable preview of real product concepts, not a borrowed terminal layout or data-coverage claim. |
| [Tickertape](https://www.tickertape.in/) | Public identity is research and investing across Indian/US stocks, ETFs and funds. | Keep this acquisition page about company research rather than another broad investing homepage. |
| [StockEdge](https://stockedge.com/) | Public identity emphasizes stock analysis, screening and research for India. | Preserve separation between finding a stock and investigating one in a connected desk. |
| [TradingView](https://www.tradingview.com/) | Market tracking and chart-oriented product entry points. | Keep standalone charting intent with MarketDeck Charting; describe the terminal as context-preserving access to the existing engine. |
| [Trendlyne](https://trendlyne.com/) | Retrieved public title emphasizes screeners and stock analysis; body extraction was unavailable. | No detailed feature-gap claim is made from an unreadable body. |

Zerodha Console, FinChat and the Bloomberg Terminal page were also requested, but the web fetches failed. No unverified detailed comparisons against those products are claimed. Search queries for company-research and valuation tools did not yield reliable volume or ranking evidence; no numerical demand estimate is invented.

### Intent ownership

Primary: a connected company-research workspace for Indian stocks. Secondary: company-analysis tools, valuation assumptions, compatible peer comparison and an equity-research workflow. Existing `/screener/` keeps screening/discovery; `/charts/` keeps dedicated price analysis; `/futures-and-options/` keeps derivatives; `/screener/portfolio-analysis/` keeps portfolio-level research. No company-by-terminal or scenario URL family is created.

Positioning: **One company. Keep the whole story.** Supporting statement: financials, charts, valuation, peers and thesis remain in one company context. This is a product proposition supported by the audited workflow, not a claim of market exclusivity.

## Design decisions

Insert the new section after the five-product overview and before Portfolio Analysis. Do not replace the hero, existing product cards, Lens, bots carousel or Portfolio visual. The homepage footer points to the public landing; company-specific “Open Research Desk” links keep going straight into the working desk.

The preview is an actual DOM component, not a screenshot: four selectable views (Fundamentals, Value Lab, Peers, Thesis), a three-position reporting-context control, and a source chip that responds to the selected period. Layered planes provide shallow depth on precise-pointer hover. There is no autoplay, video, WebGL, provider call or analytics event in the preview runtime. All graphs are explicitly illustrative and contain no company financial values or private research. All product capabilities remain readable outside the interactive visual.

The component aliases the homepage's current `--bg/--surface/--surface-raised/--text/--muted/--line/--blue` tokens; within Screener it aliases `--sp-canvas/--sp-surface/--sp-raised/--sp-text/--sp-text-2/--sp-line-mid/--sp-brand`. No palette hex colors are introduced by the component. The mobile layout reduces the preview and shows one panel at a time. Reduced motion removes transforms/transitions. Native buttons, pressed state, visible focus and arrow/Home/End controls support keyboard use. Without JavaScript, the first panel stays visible and nonfunctional preview buttons stay disabled; real CTA anchors remain available.

## Public/private SEO architecture

Chosen: `/screener/research-terminal/` is the one public landing; `/screener/research-desk/` and its company/saved-state variants remain noindex, canonical-free utility representations. Existing routes are not moved. Saved state remains owner-private, and anonymous state access must continue to return 401.

The new landing uses the existing `PAGE_SEO` and `SP-01 product_landing` source-owned registries. Clean and tracking-only requests receive one clean canonical. Semantic query states receive noindex, no canonical, no GA4 configuration and no acquisition graph. Arbitrary company child paths return 404. The product page does not load financial or private data; its anonymous render is tested with database access prohibited.

Metadata: `Research Terminal for Indian Company Analysis | MarketDeck`. Description: `Connect financial history, charts, valuation, peers and private research notes in one company workspace. Keep assumptions and sources in view.` WebPage and BreadcrumbList reference the established Organization/WebSite identity. SoftwareApplication, ratings, reviews, pricing offers and FAQPage are intentionally absent.

Official references checked: [Google noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing), [canonical consolidation](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [software application structured data](https://developers.google.com/search/docs/appearance/structured-data/software-app), [AI features](https://developers.google.com/search/docs/appearance/ai-features). Noindex is a search directive, not access control. Canonical signals do not guarantee Google's selected canonical. No special AI-search file or schema is required for this release.

## Publication and acceptance contract

Deploy shared static assets through the existing web workflow before activating the Screener landing template. Save exact immediate pre-release source/static and publisher snapshots before merging. Retain the running Screener image without deleting images or cache. Use existing workflows; no infrastructure, credentials, database schema, auth, providers or background jobs are changed.

Central publication is bounded to the one new source-owned landing. Preserve accepted records, private route exclusions and the separate P/E reconciliation issue. The expected accepted inventory delta is +1, subject to exact publisher validation. Document whether the producer run is a full enumeration or an explicitly bounded admission; never relabel old evidence as a fresh full census. IndexNow accepts only the resulting verified publication event and is not indexing proof.

## Verification and measurement

Focused tests cover structure, no-JS fallback, palette inheritance, keyboard hooks, no data collection, host-independent canonical identity, tracking/semantic query treatment, schema, one source registry entry, utility/private boundaries and invalid slugs. Browser QA covers 1440/1024/390 widths, actual panel switching and source changes, no overflow, reduced motion, no-JS CTA paths, SVG namespaces and console errors. QA blocks telemetry requests. Performance comparisons must use the same local origin, assets, viewport and repeat runs; initial live timing is diagnostic only, not a before/after field-CWV comparison.

After publication, monitor discovery/index status, non-brand queries, landing-to-workspace handoffs and consenting first-party product engagement. Do not equate Cloudflare IPs with humans or promise rankings/AI citations. SG-07C stays frozen, SG-09D stays observational, the company-reporting study stays rights-paused, and no new Intelligence article cluster is authorized by this release.
