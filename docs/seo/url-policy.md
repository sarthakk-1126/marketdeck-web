# MarketDeck shared URL and indexing constitution

Status: authoritative policy specification. This document does not change runtime behaviour. Any redirect, canonical, status-code, robots, sitemap, proxy, template, or route change requires a separate implementation and release.

## Scope and authority

The preferred acquisition/public-content origin is `https://marketdeck.in`. The policy covers the seven acquisition surfaces served there: the `marketdeck-web` root, MarketDeck Intelligence, StockProof, Charting, F&O, Commentary, and Crypto World. Caddy currently serves the root/static surface from `marketdeck-web/public` and proxies product mounts with `handle_path`; `/opt/factory/Caddyfile` is the deployment owner, not part of this change.

The authentication/platform boundary is separately deployed at `https://platform.marketdeck.in/`. It is not a second acquisition origin. Its root, signup, login, OAuth, phone verification, email verification, logout, operator pages, admin, and internal APIs are class D and never belong in an acquisition sitemap. In particular, Platform Core is **not** served at `https://marketdeck.in/login/` or `https://marketdeck.in/signup/`.

Product route names, namespaces, view owners, templates, access rules, and enumeration sources below were verified against the sibling repositories and revisions recorded in the current-source evidence section. A route pattern is always interpreted after Caddy's public mount; Django's internal path alone is not a canonical URL.

The policy applies in this order:

1. Establish that the record and route are real.
2. Establish content eligibility and public/privacy status.
3. Choose exactly one preferred URL for each distinct eligible page.
4. Consolidate only genuinely equivalent representations.
5. Expose approved canonicals through crawlable internal links and, where eligible, the sitemap.

## Classification and required treatment

| Class | Meaning | Indexing and canonical treatment | Sitemap and discovery |
| --- | --- | --- | --- |
| A | Distinct public content | Indexable only when eligibility passes; self-canonical. | Sitemap eligible; requires at least one crawlable internal link. |
| B | Equivalent representation | Consolidate to the actual equivalent preferred URL. Use a permanent redirect for an exact permanent alias; otherwise canonicalize only when the content is genuinely equivalent. | Duplicate representation is excluded from the sitemap. |
| C | Public utility state | Usually `noindex`; it may remain accessible and crawlable when users need it. A canonical must not falsely claim equivalence. | Never sitemap eligible. |
| D | Private or operational | Authentication/authorization is primary. Add `noindex` to crawlable responses and appropriate private/no-store caching where required. | Never in a public sitemap or public acquisition navigation. |
| E | Invalid or retired | Return `404` or `410`; redirect only to a genuine equivalent replacement. | Never in sitemap; internal links must be removed or repaired. |
| F | Public content needing repair | Keep in an explicit remediation backlog. Do not silently erase it from the candidate inventory. | Promote to A only after the stated eligibility and technical repairs pass. |

`indexable` is an intended policy, not a claim that a search engine has indexed the URL. `sitemap eligible` is also not automatic sitemap membership.

## Shared rules

### Origin, paths, and representations

- Every preferred URL uses `https://marketdeck.in`, a lowercase host, and the route's chosen trailing-slash convention.
- Product mounts are exactly `https://marketdeck.in/screener/`, `https://marketdeck.in/charts/`, `https://marketdeck.in/futures-and-options/`, `https://marketdeck.in/commentary/`, `https://marketdeck.in/crypto/`, and `https://marketdeck.in/intelligence/`. Platform/authentication routes use `https://platform.marketdeck.in/` instead.
- `www.marketdeck.in` is an origin-level duplicate. A later Caddy change should permanently redirect it to the preferred origin while preserving path and allowed query. Until that repair, it is class B and excluded from inventories of approved canonicals.
- Future canonical generation must use an explicit trusted MarketDeck public origin plus a mount-aware reversed route. It must not blindly derive canonicals from the request `Host`, legacy `SITE_BASE_URL` values (including historical product subdomains), internal container URLs, or factory-test hostnames. Existing configuration is not changed by this specification.
- Scheme, company, instrument, and coin identifiers are source-owned identities. Similar names or syntactically valid strings do not establish entity validity.
- Fragments are client navigation and do not create separate canonical pages.
- JSON, API, health, static-asset, and service-to-service endpoints are not acquisition pages even when publicly reachable.

### Pagination

A real page of a directory has its own identity, self-canonical, and may be A. Page 2 and later must not canonicalize to page 1 merely because they share a template. Eligibility requires a non-empty, in-range page produced from the authoritative dataset with stable ordering. An omitted page or the default page value may consolidate to page 1. Impossible, negative, malformed, or empty out-of-range pages are E and must return `404` (or `410` only for deliberately retired pages), not a successful directory.

### Query strings

The presence of `?` never determines policy by itself.

- Tracking parameters (`utm_*`, `gclid`, equivalent campaign IDs), presentation toggles, duplicate defaults, and non-semantic sort choices normally consolidate to the clean preferred URL.
- A finite, source-controlled preset may retain identity only when it has a stable route or approved parameter value, substantive differentiated content, internal discovery, and inventory ownership.
- Arbitrary keyword, date, symbol-combination, filter, upload, or user-entered result states are C unless a publishing feature deliberately promotes a specific state.
- Unknown parameters must not create new canonicals. Implementations should ignore/reject them consistently, canonicalize only if the rendered content is actually equivalent, and keep them out of sitemap enumeration.
- Allowed parameters below are an allowlist for application behaviour, not an instruction to index every combination.

### Invalid, empty, and temporarily unavailable entities

An identifier is valid only when found in the authoritative application dataset. Invented identifiers are E. A recognized entity temporarily lacking observations is not the same as an invented entity: return a truthful entity page or an explicit temporary/unavailable response, keep it out of `APPROVED_ELIGIBLE_CANONICAL` until minimum content passes, and do not manufacture data. Soft-404 pages, fake charts, and successful empty directories are failures.

### Private and sensitive surfaces

Accounts, login, signup, verification, password reset, admin, portfolios, transactions, watchlists, notes, saved work, owner controls, APIs, internal operations, and service-to-service routes are D. Public token-share pages remain D/C distribution utilities, not acquisition pages. Authentication and authorization cannot be replaced by robots directives. Documentation and inventories must use synthetic or redacted tokens and identifiers only.

## Route-family register

The tables jointly form each route-family record. The first table records ownership, identity, indexing, query, canonical, and sitemap policy. The second table records discovery, privacy, invalid-state, eligibility, and remediation. `None` in Allowed query means the preferred canonical has no semantic query parameters; ordinary tracking cleanup still follows the shared rule.

### 1. Root/static (`marketdeck-web`)

| ID | Repository; mount; source owner | Pattern and page family | Class; intended indexing | Preferred/canonical semantics | Allowed query; presentation duplicates | Sitemap |
| --- | --- | --- | --- | --- | --- | --- |
| WEB-01 | `marketdeck-web`; `/`; `src/index.template.html`, `scripts/build.mjs` | `/` — platform homepage | A; index when production build is approved | `https://marketdeck.in/`, self-canonical | None; tracking variants consolidate | Eligible |
| WEB-02 | `marketdeck-web`; `/`; `scripts/editorial.mjs` | `/credits/` — asset and licence credits | A; public reference | Clean self-canonical | None | Eligible |
| WEB-03 | `marketdeck-web`; `/`; static server/build | `/assets/**`, `/licenses/**`, JS/CSS/media | D; non-HTML support resources | No page canonical | Cache/version parameters only; never identities | No |
| WEB-04 | `marketdeck-web`; local review only; review build/server | `.preview/**`, review-mode pages | D; noindex/nofollow and non-production | No public canonical | Review controls only | No |
| WEB-05 | `marketdeck-web`; `/`; build/deployment owners | `/robots.txt`, `/sitemap.xml`, health/deployment artefacts | D; machine/operational resources, not landing pages | No HTML canonical | None | No (the sitemap is the container) |

| ID | Internal discovery requirement | Private/auth considerations | Invalid-state behaviour | Content eligibility | Notes / future work |
| --- | --- | --- | --- | --- | --- |
| WEB-01 | Site-wide brand/home links | None | Unknown root paths must not fall back to homepage with 200 | Production-approved, substantive homepage | Repair `www` at Caddy separately. |
| WEB-02 | Footer link | None | Missing page is 404 | Accurate attribution/licence content | Keep source/transform statements current. |
| WEB-03 | Referenced by eligible HTML only | Do not publish source maps/secrets | Missing asset is 404 | N/A | Excluded from URL inventory except operational QA. |
| WEB-04 | No production links | Review access must not leak drafts | Unknown preview is 404 | Never eligible | Existing review `noindex` gate remains authoritative. |
| WEB-05 | Standard machine locations only | May expose no secrets or internal topology | Missing/invalid artefact is 404 | Valid syntax and deployment provenance | This task does not modify either file. |

### 2. MarketDeck Intelligence (`marketdeck-web`)

| ID | Repository; mount; source owner | Pattern and page family | Class; intended indexing | Preferred/canonical semantics | Allowed query; presentation duplicates | Sitemap |
| --- | --- | --- | --- | --- | --- | --- |
| INT-01 | `marketdeck-web`; `/intelligence/`; `scripts/intelligence.mjs` | `/intelligence/` — editorial hub | A; index | Clean self-canonical | Client-side library filters/search are presentation state and consolidate | Eligible |
| INT-02 | same; `scripts/intelligence.mjs` | `/intelligence/issues/` — published issue archive | A; index | Clean self-canonical | Client-side filters/pagination do not create URLs | Eligible |
| INT-03 | same; `scripts/articles.mjs`, `content/articles/metadata.json` | `/intelligence/notes/{published_slug}/` — substantive guide | A; index eligible publication | One approved slug, self-canonical | None | Eligible |
| INT-04 | same; `scripts/editorial.mjs`, `content/briefs.json` | `/intelligence/issues/{published_slug}/` — HTML issue | A; index eligible publication | HTML reading edition is preferred, self-canonical | None | Eligible |
| INT-05 | same; `scripts/articles.mjs` | `/intelligence/editorial-policy/` — editorial policy | A; index | Clean self-canonical | None | Eligible |
| INT-06 | same; issue assets | `/intelligence/issues/{published_slug}/{edition}.pdf` — PDF copy | B; equivalent companion | Consolidate to the matching preferred HTML issue only after HTTP canonical/lifecycle policy is implemented | Download/cache parameters are non-semantic | No |
| INT-07 | same; review generator and manifests | Draft/unapproved note or issue HTML/PDF | D (or C for explicitly shared review); noindex | No public canonical until approval | Review parameters do not confer publication | No |
| INT-08 | same; `scripts/intelligence.mjs::LEARNING_HUBS`, generated by `scripts/editorial.mjs` | `/intelligence/equities/`, `/intelligence/futures-options/`, `/intelligence/technical-analysis/` — stable learning hubs | A; index | Each registry-backed hub is distinct public content and self-canonical | No query identity; client-side or fragment state does not create another page | Eligible |

| ID | Internal discovery requirement | Private/auth considerations | Invalid-state behaviour | Content eligibility | Notes / future work |
| --- | --- | --- | --- | --- | --- |
| INT-01 | Homepage and global/editorial navigation | None | Unknown child path 404 | Contains approved entries and useful hub copy | Client-side search is not a URL publication system. |
| INT-02 | Hub and issue navigation | None | Empty impossible archive page 404 if URL pagination is added | Lists approved published issues | Preserve real pagination identity if later introduced. |
| INT-03 | Hub/library plus contextual related links | Drafts excluded from production | Unknown/unapproved slug 404 in production | Manifest status `published`, approval date present, substantive/source-linked copy, unique metadata | Published manifest-backed guides remain one family; inventory must read the manifest rather than hard-code article rows or counts. |
| INT-04 | Hub and archive | Drafts excluded from production | Unknown/unapproved slug 404 | Published/approved manifest record, complete HTML, truthful dates/sources | Do not infer an archive from files alone. |
| INT-05 | Hub/footer or article policy link | None | 404 when absent | Accurate, maintained policy | Public reference, not an auth/ops policy. |
| INT-06 | Linked as secondary download from matching HTML | PDFs must contain no private review data | Missing edition 404; retired duplicate may be 410 | Byte-valid approved edition matching the HTML issue | Multiple equivalent filenames remain B; choose lifecycle/redirect and HTTP `Link` canonical in later work. |
| INT-07 | No production discovery | Owner review controls; no public sitemap | Unknown draft 404 | Never eligible before explicit publication approval | Review build already emits noindex; retain this gate. |
| INT-08 | Intelligence root, global reading shelf, relevant guides, product-learning links, and adjacent learning hubs | None | A slug absent from `LEARNING_HUBS` is not generated and must 404 | Registry membership, distinct maintained introduction and concept map, plus the generator's minimum of two published relevant guides | Crawlable links must expose every approved hub; do not infer hubs from topic tags alone. |

### 3. StockProof (`stockproof`)

| ID | Repository; mount; source owner | Pattern and page family | Class; intended indexing | Preferred/canonical semantics | Allowed query; presentation duplicates | Sitemap |
| --- | --- | --- | --- | --- | --- | --- |
| SP-01 | `stockproof`; `/screener/`; `screener:home`, `screener.views.home_view` | `/screener/` — product/research landing | A; index | Clean self-canonical | Tracking/presentation only consolidate | Eligible |
| SP-02 | same; `screener:company_browse`, `screener.views.company_browse_view` | `/screener/companies/` and valid pagination — company directory | A | Each real page self-canonical; omitted/default page consolidates to page 1 | `page` only when valid; `q`, `sector`, `sort`, and `dir` are selection/presentation state | Eligible |
| SP-03 | same; `screener:company_detail`, `screener.views.company_detail_view` | `/screener/company/{ticker}/` — company overview | A after entity eligibility | Stable source-owned ticker, self-canonical | `range=1M|1Y|3Y|5Y|Max` is B presentation state and consolidates to company URL | Eligible |
| SP-04 | same; `screener:statement`, `screener.views.statement_view` | `/screener/company/{ticker}/statement/{profit-loss|balance-sheet|cash-flow}/` — financial statement research | A when substantive | Each statement is distinct and self-canonical; do not collapse to overview | None | Eligible |
| SP-05 | same; `screener:peer_comparison`, `screener.views.peer_comparison_view` | `/screener/company/{ticker}/peers/` — peer analysis | A when materially useful | Self-canonical, not automatically company-home canonical | No current semantic query | Eligible |
| SP-06 | same; `screener:quality_score`, `screener.views.company_quality_score_view` | `/screener/company/{ticker}/quality-score/` — Trace Score | A when explanation and entity evidence are substantive; otherwise F | Self-canonical only after eligibility | None | Conditional |
| SP-07 | same; `screener:screener`, `screener.views.screener_view`, `screens.PRESET_SCREENS` | `/screener/screener/?screen={approved_key}` — finite curated screen | A when registry-approved | The allowlisted `screen` query is identity-bearing; every approved key has one normalized URL | Only a `PRESET_SCREENS` key plus normalized pagination; custom filters combined with it become C | Eligible |
| SP-08 | same; `screener:screener`, `screener.views.screener_view` | `/screener/screener/` with arbitrary result state | C; noindex | Clean tool landing may self-canonical; arbitrary results must not claim equivalence to a preset or root | `q`, `sector`, `min_roe`, `max_debt_equity`, `formula`, custom columns and result `page` | No |
| SP-09 | same; `screener:funds`, `screener.views.funds_view` | `/screener/funds/` plus valid pagination — mutual-fund directory | A | Real pages self-canonical | Valid `page`; filter/search state consolidates | Eligible |
| SP-10 | same; `screener:fund_detail`, `screener.views.fund_detail_view` | `/screener/funds/{scheme_code}/` — mutual fund or ETF detail | A only for eligible record | Scheme code is identity; self-canonical. Identical displayed names are not deduplication evidence | Range/chart presentation consolidates | Eligible after record gate |
| SP-11 | same; `screener:etfs`, `screener.views.etfs_view` | `/screener/etfs/` plus valid pagination — ETF directory | A for real pages; impossible pages E | Directory pages self-canonical; ETF detail links to SP-10, never a competing `/etfs/{id}/` | Valid `page`; filter/order state consolidates | Eligible for real pages |
| SP-12 | same; `screener:calculators`, `screener.views.calculators_view` | `/screener/calculators/` — multi-calculator landing and submitted state | A landing; C user-result state | Clean landing self-canonical; input/result query is not a new canonical | Documented GET calculator inputs may remain usable but are noindex result state | Landing only |
| SP-13 | same; `screener:ipo_calendar`, `screener.views.ipo_calendar_view` | `/screener/ipo-calendar/` | A when maintained | Clean self-canonical | None currently | Eligible |
| SP-14 | same; `screener:sast_filings`, `screener.views.sast_filings_view` | `/screener/sast-filings/` | A when source-linked and current | Clean self-canonical | None currently | Eligible landing |
| SP-15 | same; `screener:market_breadth`, `screener.views.market_breadth_view` | `/screener/market-breadth/` | A when substantive/current | Clean self-canonical | `window` and `weighting` are selection/presentation state and consolidate | Eligible landing |
| SP-16 | same; `screener:sector_rotation`, `screener.views.sector_rotation_view` | `/screener/sector-rotation/` | A when substantive/current | Clean self-canonical | `window` and `weighting` are selection/presentation state and consolidate | Eligible landing |
| SP-17 | same; `screener:learning`, `screener.views.learning_view`, `screener.learning` | `/screener/learning/` — single static glossary | A for substantive curated content | One self-canonical page; concepts are sections, not separate URLs | None | Eligible |
| SP-18 | same; account/personal views | Portfolio, transactions, watchlist, notes, saved formulas, AI Mode/Workspace, reports | D; noindex | No public canonical | User/account state only | No |
| SP-19 | same; `screener:shared`, `screener.views.shared_view` | `/screener/shared/{token}/` — anonymous read-only token share | D/C; noindex | Never canonical acquisition content | Token is access state, never inventory identity | No |
| SP-20 | same; auth/admin/API/action owners | `/screener/accounts/**`, `/screener/register/`, `/screener/verify/**`, `/screener/admin/**`, `/screener/api/internal/**`, exports and preference/action routes | D; noindex where HTML | No public canonical | Operational parameters only | No |
| SP-21 | same; `screener:multiples_comparison`, `screener.views.multiples_comparison_view` | `/screener/compare/` — comparable-company workbench | A explanatory landing; C selected comparison state | Clean landing self-canonical; chosen tickers/sector are utility state | `tickers`, `sector`, `add` and related selections are C | Landing only |

| ID | Internal discovery requirement | Private/auth considerations | Invalid-state behaviour | Content eligibility | Notes / future work |
| --- | --- | --- | --- | --- | --- |
| SP-01 | Root product navigation | Signed-out public response only | Unknown child route 404 | Useful product orientation | Route, view and `screener/home.html` verified. |
| SP-02 | Product root and pagination links | None | Impossible page E/404 | Non-empty page, stable order, canonical entities | HTML pagination observed. |
| SP-03 | Company directory, screens, peers and related entities | No user overlays in canonical HTML | Unknown company already fails; preserve E | Authoritative company record, public status, minimum financial/evidence completeness | About 486 observed is audit context, not an inventory constant. |
| SP-04 | Company navigation and overview | None | Unknown company/subpage 404 | Entity-specific statement data, period labels, sources and non-thin rendering | Statements remain distinct when useful. |
| SP-05 | Company navigation | None | Unknown company 404; no valid peer set becomes F/clear empty state, not fake peers | Meaningful comparison set, definitions, entity context | Remaining evidence is record-level content completeness, unavailable until the future inventory queries real rows; ticket: define/test the minimum populated peer set before approval. |
| SP-06 | Company navigation | Method details must not expose internal secrets | Unknown entity 404 | Score exists, components/explanation/provenance are sufficient | Remaining evidence is record-level score/explanation completeness; ticket: define/test that gate during inventory implementation and retain failures as F. |
| SP-07 | Screens hub and relevant research pages | None | Unknown preset 404 | Registry membership, stable definition, differentiated intro/results | Audit observed 29; enumerate registry, never hard-code count. |
| SP-08 | May be reachable from form; do not mass-link combinations | Saved/user filters may be D | Invalid syntax 400/404; empty legitimate result can remain C | Never A without explicit publishing workflow | Avoid faceted crawl explosion. |
| SP-09 | Product/funds hub and bidirectional pagination | None | Impossible page 404 | Non-empty page of authoritative public scheme records | Candidate count comes from data. |
| SP-10 | Fund/ETF directories and related links | None | Unknown code 404 | Real scheme code; distinguish Direct/Regular and option identity; usable NAV history and metadata; public status; no terminal/merged record without replacement policy | Do not deduplicate by displayed name; do not automatically approve all observed schemes. |
| SP-11 | Product root and fund navigation | None | Current successful impossible pages are F until repaired to E/404 | Non-empty page from real ETF records | Repair out-of-range behaviour before A promotion. |
| SP-12 | Product navigation | Do not place user inputs in indexable metadata | Invalid input 400 with helpful UI; no fabricated result | Landing has explanatory copy, definitions, examples and stable controls | Multiple sections remain one landing unless future distinct tools justify routes. |
| SP-13 | Product/research navigation | None | Invalid dates 400/404 | Source-backed entries, truthful as-of date, useful empty-period handling | Time navigation does not automatically create archives. |
| SP-14 | Product/research navigation | None | Invalid filters 400; missing filing 404 | Source-linked filings, timestamps, coverage disclosure | Search results remain C. |
| SP-15 | Product/research navigation | None | Unsupported market/date 404 or clear unavailable | Defined universe, freshness and source coverage | — |
| SP-16 | Product/research navigation | None | Unsupported sector/date 404 or unavailable | Defined taxonomy, freshness, methodology | — |
| SP-17 | Product/reference navigation | Personal Learning Notes remain D panels/actions | There is no public concept-detail route; unknown note concept actions validate against the static glossary | Curated, substantive, maintained single-page glossary | Do not invent per-concept URLs. |
| SP-18 | No public acquisition links | Authentication/authorization, private/no-store | Unauthorized 401/403 or login flow; missing object 404 | Never public eligible | Includes owner-side share management. |
| SP-19 | Only intentional recipient distribution | Token secrecy; revoke/expiry; private/no-store as appropriate | Invalid/expired token 404/410, never leak existence | Never A under current product | Never record real tokens. |
| SP-20 | No acquisition links | Strong auth/authorization and safe caching | Correct 4xx, never HTML soft 200 | Never eligible | API/helper JSON excluded. |
| SP-21 | Company/research navigation may link to clean landing | No account data; saved selections, if introduced, become D | Unknown tickers are rejected/ignored from the real `Company` queryset, never invented | Landing explains comparison metrics; selected result is not independently published | Public GET, read-only; current template is `screener/multiples_comparison.html`. |

### 4. Charting (`charting-v1`)

| ID | Repository; mount; source owner | Pattern and page family | Class; intended indexing | Preferred/canonical semantics | Allowed query; presentation duplicates | Sitemap |
| --- | --- | --- | --- | --- | --- | --- |
| CH-01 | `charting-v1`; `/charts/`; unnamed root route, `accounts.views.home` | `/charts/` — charting landing | A | Clean self-canonical | `range=3M|6M|1Y` is featured-chart presentation | Eligible |
| CH-02 | same; `accounts:home`, `accounts.views.home` | `/charts/accounts/` — duplicate public home | B/F until migrated | Exact duplicate should permanently redirect/canonicalize to `/charts/`; preserve descendants | Same `range` presentation state | No |
| CH-03 | same; account views | `/charts/accounts/**` except exact root — auth/profile flows | D | Must not be swept into CH-02 redirect | Auth state only | No |
| CH-04 | same; `charts:chart`, `charts.views.chart_view`, `watchlist.universe.searchable_symbols` | `/charts/{symbol}/` — instrument chart | A for recognized eligible instruments; F when recognized but temporarily data-incomplete | Stable universe identity, self-canonical | Timeframe, compare, indicators, drawings and layouts are presentation/utility state | Eligible after universe/data gate |
| CH-05 | same; `breadth:detail`, `breadth.views.breadth_detail` | `/charts/breadth/` | A when a stored snapshot is substantive | Clean self-canonical | None | Eligible landing |
| CH-06 | same; `leaderboard:list`, `leaderboard.views.leaderboard_list` | `/charts/leaderboard/` | A when stored ledger is substantive | Clean self-canonical | `order=asc|desc` is presentation and consolidates | Eligible landing |
| CH-07 | same; `accounts:jump_to_chart` and `charts:jump` | `/charts/accounts/jump/` and `/charts/jump/` — symbol navigation actions | C; noindex | Redirect to a recognized CH-04 entity; no independent canonical | `symbol_input`, and `current_symbol` on chart jump | No |
| CH-08 | same; `scans:*`, `watchlist:*`, `alerts:list`, `chart_layouts:*` | `/charts/scans/**`, `/charts/watchlist/**`, `/charts/alerts/`, `/charts/layouts/**` | D | No public canonical | User state; POST actions; owned IDs | No |
| CH-09 | same; data/API owners | Chart data, fundamentals JSON, helper, auth/admin/API routes | D | No page canonical | Request parameters are operational | No |

| ID | Internal discovery requirement | Private/auth considerations | Invalid-state behaviour | Content eligibility | Notes / future work |
| --- | --- | --- | --- | --- | --- |
| CH-01 | Platform and product navigation | Signed-out public response | Unknown child 404 | Useful product/research landing | — |
| CH-02 | Remove links to alias; keep descendant links correct | Do not redirect account descendants | Alias redirect only after route-boundary tests | Genuine exact homepage equivalence | Later migration required. |
| CH-03 | No acquisition links | Auth/authorization and private/no-store | Correct 401/403/404 | Never eligible | Route ordering must protect descendants. |
| CH-04 | Leaderboard, search and valid related-instrument links | User layouts must not alter public canonical | Invented symbol is E/404; recognized temporarily empty instrument gets explicit unavailable/F handling | Membership in authoritative recognized universe plus minimum labeled observations/metadata | Current arbitrary-symbol fake 200 is an explicit repair. |
| CH-05 | Product/research navigation | None | Unsupported universe/date 404 or unavailable | Defined universe, sources, freshness | — |
| CH-06 | Product navigation and links to every listed valid entity | None | Invalid window 400/404 | Recognized universe, methodology, current data, non-empty list | Hundreds of links are discovery evidence, not a guessed universe. |
| CH-07 | Forms may submit to the action; action URLs are not acquisition links | No state mutation | Unknown input redirects with an error; only `resolve_symbol()` output reaches CH-04 | Never independently eligible | Both actions are GET navigation helpers. |
| CH-08 | No public discovery | Every view is `login_required`; object lookups are owner-scoped | Correct login redirect/404 | Never eligible | Scan runs/backtests and CSV exports are user-specific, not public utilities. |
| CH-09 | No acquisition discovery | Protect non-public data/functions | Correct JSON 4xx, no HTML fallback | Never eligible | Explicitly excluded from inventory/sitemap. |

### 5. F&O (`fo-analytics-v1`)

| ID | Repository; mount; source owner | Pattern and page family | Class; intended indexing | Preferred/canonical semantics | Allowed query; presentation duplicates | Sitemap |
| --- | --- | --- | --- | --- | --- | --- |
| FO-01 | `fo-analytics-v1`; `/futures-and-options/`; project `home`, `analytics.home_views.home` | `/futures-and-options/` | A | Clean self-canonical | Tracking/presentation consolidate | Eligible |
| FO-02 | same; `analytics:option_calculator`, `calculator_views.option_calculator` | `/futures-and-options/analytics/calculator/` | A landing; C POST result | Landing self-canonical; submitted inputs/results do not become canonicals | Calculator inputs are POST utility state | Landing only |
| FO-03 | same; `analytics:chain`, `analytics.views.chain` | `/futures-and-options/analytics/chain/` — default NIFTY chain | A landing when useful | Clean default landing | `expiry` and `window` are selection/presentation state | Eligible landing |
| FO-04 | same; `analytics:chain_for_symbol`, `analytics.views.chain` | `/futures-and-options/analytics/chain/{symbol}/` | A for a supported recognized symbol/current public data | Valid source-owned symbol path, self-canonical | `expiry` and `window` consolidate to symbol page | Conditional |
| FO-05 | same; `analytics:historical_chain`, `historical_chain_views.historical_chain` | `/futures-and-options/analytics/historical-chain/` | A explanatory landing; C requested result | Clean landing self-canonical | `symbol`, `date`, `expiry` are utility selection state | Landing only |
| FO-06 | same; `analytics:liquidity_finder`, `liquidity_views.liquidity_finder` | `/futures-and-options/analytics/liquidity/` | A | Clean self-canonical | None | Eligible |
| FO-07 | same; `analytics:seasonality_analysis`, `seasonality_views.seasonality_analysis` | `/futures-and-options/analytics/seasonality/` | A landing; C selected-symbol state | Clean landing self-canonical | `symbol` is utility selection state | Landing only |
| FO-08 | same; `analytics:strategy_build`, `strategy_views.strategy_build` | `/futures-and-options/analytics/strategy/build/` | A landing; C constructed state | Clean landing self-canonical | GET `symbol`, `category`; POST legs, templates, premiums and calculations are utility state | Landing only |
| FO-09 | same; `analytics:backtest_run`, `backtest_views.backtest_run` | `/futures-and-options/analytics/backtest/` | A landing; C ad-hoc result | Clean landing self-canonical | GET `symbol` is selection; POST expiry, entry date and legs are result state; saved IDs D | Landing only |
| FO-10 | same; `analytics:strategy_list/detail`, `backtest_list/detail`, `paper_*` | `/futures-and-options/analytics/strategy/saved/**`, `/futures-and-options/analytics/backtest/saved/**`, `/futures-and-options/analytics/paper/**` | D | No public canonical | User/object IDs | No |
| FO-11 | same; `analytics:trading_day*`, `trading_day_views` | `/futures-and-options/analytics/ops/trading-day/**` | D | No public canonical | Staff/operator state; POST actions | No |
| FO-12 | same; project auth/admin and `analytics` API owners | `/futures-and-options/accounts/**`, `/futures-and-options/admin/**`, `/futures-and-options/api/internal/**`, `/futures-and-options/analytics/api/**` | D | No public canonical | Operational/auth parameters | No |

| ID | Internal discovery requirement | Private/auth considerations | Invalid-state behaviour | Content eligibility | Notes / future work |
| --- | --- | --- | --- | --- | --- |
| FO-01 | Platform/product navigation | Signed-out public response | Unknown child 404 | Substantive orientation to tools/data | — |
| FO-02 | Product/tools navigation | Do not expose user entries | Bad input 400 with helpful errors | Stable explanation, definitions, assumptions, example | Results are not acquisition pages. |
| FO-03 | Product/tools navigation | None | Unsupported expiry/symbol 404 or explicit unavailable | Defined data source, freshness, useful chain | Do not multiply all expiries into sitemap. |
| FO-04 | Chain/leader directories with crawlable links | None | Invented/unsupported symbol 404 | Authoritative supported derivative, current coverage, sufficient chain context | Enumerate from real instrument coverage. |
| FO-05 | Product/tools navigation | Saved history is D | Impossible request 400/404 | Landing explains coverage and limitations | No inferred historical archive. |
| FO-06 | Product/tools navigation | None | Invalid filters 400 | Stable tool explanation/methodology | Result combinations C. |
| FO-07 | Product/tools navigation | None | Unsupported symbol/window 400/404 | Stable methodology and coverage | — |
| FO-08 | Product/tools navigation | Saved strategies D | Invalid legs/contract 400 | Educational landing with assumptions/risks | Constructed payoff is user state. |
| FO-09 | Product/tools navigation | Saved results D | Invalid/expired replay 404/410 | Landing documents methodology, biases, limits | No user result in sitemap. |
| FO-10 | No acquisition links | Auth/authorization, private/no-store | Correct 401/403/404 | Never eligible | — |
| FO-11 | No public links | Operator authorization and audit controls | Correct 401/403/404 | Never eligible | — |
| FO-12 | No acquisition links | Strong auth where required | Correct 4xx; no page fallback | Never eligible | APIs explicitly excluded. |

### 6. Commentary (`market-commentary-v1`)

| ID | Repository; mount; source owner | Pattern and page family | Class; intended indexing | Preferred/canonical semantics | Allowed query; presentation duplicates | Sitemap |
| --- | --- | --- | --- | --- | --- | --- |
| COM-01 | `market-commentary-v1`; `/commentary/`; project `home`, `citations.views.search_view` | `/commentary/` — product/search landing | A | Clean self-canonical | Empty/default search parameters consolidate | Eligible |
| COM-02 | same; `citations:market`, `citations.views.market_view` | `/commentary/citations/market/` | A when substantive | Clean self-canonical | `window`, `start`, `end`, `channel`/`channels` are utility selection state | Eligible landing |
| COM-03 | same; `citations:coverage`, `citations.views.coverage_view` | `/commentary/citations/coverage/` | A | Clean self-canonical | None | Eligible |
| COM-04 | same; `citations:status`, `citations.views.status_view` | `/commentary/citations/status/` — ingestion/quota/spend/backlog operations | D; currently anonymous but intended noindex and operationally protected | No acquisition canonical | None | No |
| COM-05 | same; `citations:results`, `citations.views.results_view` | `/commentary/citations/results/` | C; noindex | Do not canonicalize arbitrary results as a company publication | `symbol`, `window`, `start`, `end`, `channel`/`channels` | No |
| COM-06 | same; `citations:keyword`, `citations.views.keyword_view` | `/commentary/citations/keyword/` | C; noindex | Root is the clean search entry; result state is not an equivalent published page | `q`, `window`, `start`, `end`, `channel`/`channels` | No |
| COM-07 | same; `citations:research`, `citations.research_views.research_view` | `/commentary/citations/research/` | C; noindex; D for spend/action state | No public acquisition canonical | `symbol`, `video`, finite `schema`, finite `temperature`; generated/cached digest state | No |
| COM-08 | same; personal/auth views | Saved/account/workspace/admin routes | D | No public canonical | User/auth state | No |
| COM-09 | same; API/helper owners | API, transcript JSON, health/internal helpers | D | No page canonical | Operational parameters | No |

| ID | Internal discovery requirement | Private/auth considerations | Invalid-state behaviour | Content eligibility | Notes / future work |
| --- | --- | --- | --- | --- | --- |
| COM-01 | Platform and product navigation | Signed-out public entry | Unknown child 404 | Stable explanation and search entry | Search utility does not make result states A. |
| COM-02 | Root/product navigation | None | Unsupported state 400/404 | Source scope, freshness, substantive market context | Verified as `citations:market`; keep only the clean landing eligible. |
| COM-03 | Root/product navigation | None | Unknown source/entity 404 | Transparent coverage/source list and update state | — |
| COM-04 | No acquisition navigation; operator navigation only | The anonymous view exposes daily vendor/API usage, configured-model state, spend and backlog; future work must add access control and noindex without treating robots as protection | Correct operational status; do not fall back to acquisition content | Never acquisition-eligible in its current operational form | Source resolves the prior question: class D, not a reader-facing content page. |
| COM-05 | Search form; no combinatorial crawl links | Account annotations D | Invalid symbol/date 400/404; empty valid query C | Not A absent explicit curated company publication feature | A future stable company/topic page needs a publishing workflow and route. |
| COM-06 | Search form only | Respect transcript/source access rights | Invalid query 400; missing record 404 | Never A merely because results are useful | Avoid query crawl space. |
| COM-07 | Tool entry only | Prompts/results may be private; safe caching | Invalid/expired result 404/410 | Not public eligible | — |
| COM-08 | No acquisition links | Auth/authorization, private/no-store | Correct 401/403/404 | Never eligible | — |
| COM-09 | No acquisition links | Protect internal/source data | Correct JSON 4xx | Never eligible | — |

### 7. Crypto World (`crypto-tools-v1`)

| ID | Repository; mount; source owner | Pattern and page family | Class; intended indexing | Preferred/canonical semantics | Allowed query; presentation duplicates | Sitemap |
| --- | --- | --- | --- | --- | --- | --- |
| CR-01 | `crypto-tools-v1`; `/crypto/`; `crypto:home`, `crypto.views.home` | `/crypto/` | A | Clean self-canonical | Tracking/presentation consolidate | Eligible |
| CR-02 | same; `crypto:markets`, `crypto.market_views.markets` | `/crypto/markets/` | A | Clean self-canonical | No current server-side pagination/sort query | Eligible landing |
| CR-03 | same; `crypto:fundamentals`, `crypto.market_views.fundamentals` | `/crypto/fundamentals/` | A | Clean self-canonical | `sort` and `dir` are presentation and consolidate | Eligible landing |
| CR-04 | same; `crypto:news`, `crypto.market_views.news` | `/crypto/news/` | A when curated/source-linked | Clean self-canonical | `source` is a utility filter and consolidates | Eligible landing |
| CR-05 | same; `crypto:defi`, `crypto.market_views.defi` | `/crypto/defi/` | A when substantive | Clean self-canonical | `chain` is a utility filter and consolidates | Eligible landing |
| CR-06 | same; `crypto:premium`, `crypto.market_views.premium` | `/crypto/premium/` | A when public research page | Clean self-canonical | `asset` is selection/presentation and consolidates | Eligible landing |
| CR-07 | same; `crypto:premium_cost`, `crypto.market_views.premium_cost` | `/crypto/premium/cost/` | A landing; C calculation state | Clean landing self-canonical | GET form inputs/results are utility state | Landing only |
| CR-08 | same; `crypto:correlation`, `crypto.market_views.correlation` | `/crypto/correlation/` | A landing | Clean self-canonical | Current view uses fixed covered assets/windows; future selections are C/B | Eligible landing |
| CR-09 | same; `crypto:positioning`, `crypto.market_views.positioning` | `/crypto/positioning/` | A when substantive/current | Clean self-canonical | `sort` and `dir` are presentation and consolidate | Eligible landing |
| CR-10 | same; `crypto:options`, `crypto.market_views.options` | `/crypto/options/` | A landing; C selected state | Clean landing self-canonical | `coin` selects among actual covered coins and consolidates | Landing only |
| CR-11 | same; `crypto:exit_cost_calculator`, `crypto.market_views.exit_cost_calculator` | `/crypto/exit-cost/` | A landing; C submitted state | Clean landing self-canonical | GET `coin` and `amount_inr` are utility result state | Landing only |
| CR-12 | same; coin detail/data coverage | `/crypto/coins/{coingecko_id}/` | A for recognized eligible coin | Exact source `coingecko_id`, self-canonical | Display/currency/range parameters consolidate | Eligible after record gate |
| CR-13 | same; `crypto:compare`, `crypto.market_views.compare` | `/crypto/compare/` | A landing; C arbitrary comparison | Clean landing self-canonical | GET `a`, `b`, `c` selected CoinGecko IDs are utility state | Landing only |
| CR-14 | same; `crypto:pulse_index` and `crypto:pulse` | `/crypto/pulse/` and `/crypto/pulse/{YYYY-MM-DD}/` | A for the stable root; C for today's ephemeral dated render; E for every non-today date | Root self-canonical; the dated render is not a durable canonical or historical archive | Date is path state validated strictly against today | Root only |
| CR-15 | same; `crypto:tax_calculator`, `profit_loss_calculator`, `inr_converter`, `dca_calculator`, `loss_offset` | `/crypto/crypto-tax-calculator/`, `/crypto/crypto-profit-loss-calculator/`, `/crypto/crypto-to-inr/`, `/crypto/crypto-sip-calculator/`, `/crypto/crypto-loss-offset/` | A landings; C POST result state | Each distinct stable tool landing self-canonical | User inputs/results are POST state | Landings only |
| CR-16 | same; `crypto:schedule_vda`, `derivatives`, `ais_reconciliation` | `/crypto/schedule-vda/`, `/crypto/crypto-derivatives-tax/`, `/crypto/ais-reconciliation/` | A explanatory landings; C upload/result workflow | Each clean explanatory landing self-canonical | Uploaded transaction/file state and exports are C/D | Landings only |
| CR-17 | same; upload/download/result owners | POST state on CR-16 plus `/crypto/**/template.csv` downloads | C for anonymous calculation/download utility; D if user-identifying storage is later introduced | No acquisition canonical for result or download/action response | File inputs and download actions | No |
| CR-18 | same; `crypto:portfolio`, `crypto.portfolio_views.portfolio` | `/crypto/portfolio/` — stateless portfolio-analysis form/result | A explanatory landing; C POST result | Clean landing self-canonical; submitted lots/results have no public canonical | Portfolio lots and valuation inputs are POST-only utility state | Landing only |
| CR-19 | same; `crypto:healthz` and project/service owners | `/crypto/healthz/` plus any internal/service endpoints | D/non-HTML | No page canonical | Operational parameters | No |

| ID | Internal discovery requirement | Private/auth considerations | Invalid-state behaviour | Content eligibility | Notes / future work |
| --- | --- | --- | --- | --- | --- |
| CR-01 | Platform/product navigation | Signed-out public response | Unknown child 404 | Useful orientation and tool links | — |
| CR-02 | Root and pagination when real | None | Impossible pages 404 | Authoritative market records, stable order, useful rows | About 100 observed is not a fixed inventory. |
| CR-03 | Root and coin links | None | Unsupported filters 400; unavailable data explicit | Defined coverage, methodology, freshness | About 250 observed entities must be enumerated from data. |
| CR-04 | Root/research navigation | Respect source/licence constraints | Missing article/source 404 | Source links, timestamps, substantive curation | Arbitrary search stays C. |
| CR-05 | Root/research navigation | None | Unsupported protocol/chain 404 | Defined metrics, coverage, freshness | — |
| CR-06 | Root/research navigation | No account boundary in current app | Unknown asset falls back to a real available asset; no invented row | Defined methodology/source/freshness | Route/view/template verified; asset is presentation state. |
| CR-07 | Root/research navigation | Same as CR-06 | Invalid input 400/404 | Substantive explanation and data coverage | — |
| CR-08 | Root/tools navigation | None | Unsupported coin/window 400/404 | Methodology, sample window, aligned data and limitations | Results remain C. |
| CR-09 | Root/research navigation | None | Unsupported instrument 404 | Defined derivative venue/universe, freshness | — |
| CR-10 | Root/tools navigation | User inputs not indexed | Invalid contract/input 400/404 | Landing definitions, assumptions and current coverage | — |
| CR-11 | Root/tools navigation | User sizes/venues not indexed | Invalid input 400 | Landing methodology, fee/slippage caveats | — |
| CR-12 | Markets/fundamentals and related-coin links | None | Unknown ID already fails; preserve E/404 | Real covered record, public status, sufficient market/fundamental metadata and freshness | Do not guess IDs from names. |
| CR-13 | Root/tools navigation | User-selected comparisons may be sensitive only if saved/account-bound | Unknown coin 404; malformed set 400 | Landing is substantive; result combinations not A | Order variants must not multiply URLs. |
| CR-14 | Root/current research navigation | None | Expired dated path 404/410; never successful empty archive | Current page has real current edition/data and truthful timestamp | Yesterday's failure proves no historical contract; do not fabricate one. |
| CR-15 | Root/tools hub | Inputs/results not indexable | Invalid input 400 | Stable explanatory content, definitions, examples | Enumerate only approved tool landings. |
| CR-16 | Root/compliance tools hub | Filing data may be highly sensitive; auth/private/no-store where applicable | Invalid/expired workflow 404/410 | Public landing has maintained scope/disclaimer; workflow never A | Separate education from user filing state. |
| CR-17 | No acquisition links to individual state | Access control, retention and private/no-store | Invalid/expired token/result 404/410 | Never A under current product | Never inventory real identifiers. |
| CR-18 | Root/tools navigation may link to clean landing | Current source installs no local account/session model and persists no visitor portfolio; submitted financial inputs remain non-indexable and must not be logged | Invalid form input returns the form with errors; no URL-addressable result | Landing explains the tool; POST result never eligible | If persistence/accounts are later added, the saved state becomes D. |
| CR-19 | No acquisition links | Protect internal data/functions | Correct JSON 4xx | Never eligible | Explicit API exclusion. |

## Current-source verification evidence

Verified 2026-09-23 against the local checked-out sources below. No sibling branch, worktree, configuration, or database was changed or queried. `CLAUDE.md` was read where present; `marketdeck-web` and `platform-core` have no repository instruction file at their roots.

| Repository | Revision inspected | Applicable instruction file |
| --- | --- | --- |
| `marketdeck-web` | `seo/seo-001-url-constitution` at SEO-001 commit `72cfe7bf5fd103a0d3a22d9efda14eeff6c1c67e` before this verification | none found |
| `stockproof` | `master` at `a797f5d7f18de3fa8aaadc35e78a6b2547f444be` | `CLAUDE.md` |
| `charting-v1` | `master` at `889f187f5264a465b5e5e9b9e9256da47fd5a325` | `CLAUDE.md` |
| `fo-analytics-v1` | `master` at `1ca43d8689b23614b9bdc982ebccb57d7187afcd` | `CLAUDE.md` |
| `market-commentary-v1` | `master` at `a8fc1c9bf285cf4f9eb192720582b37eb8cccfdc` | `CLAUDE.md` |
| `crypto-tools-v1` | `master` at `c837216783d8cbf6530d9e3a0591f709953c4bed` | `CLAUDE.md` |
| `platform-core` | `master` at `4dcd59961a903d00ef4ace5c45ba8a4661b66d88` | none found |
| `finance-data-core` | `master` at `d98afd32595ac4d42b7b1b65d6a7dbedc631a9c9` | `CLAUDE.md` |

### Static root and Intelligence evidence

| IDs | Current source contract |
| --- | --- |
| WEB-01–05 | `src/index.template.html`, `scripts/build.mjs`, and `scripts/editorial.mjs` own the static HTML/machine output. There is no Django namespace. Production pages are anonymous GET/static responses; review output is generated separately with `noindex`. Static assets, licences, robots and sitemap are non-page resources. |
| INT-01–08 | `scripts/intelligence.mjs`, `scripts/articles.mjs`, `scripts/editorial.mjs`, `content/briefs.json`, and `content/articles/metadata.json` own routes and publication eligibility. Pages are anonymous static GETs. `publicationStatus` plus approval gates distinguish published records from drafts. `LEARNING_HUBS` is the finite registry for INT-08, and `editorial.mjs` generates `/intelligence/{slug}/` for each key; the current keys are `equities`, `technical-analysis`, and `futures-options`. All generated HTML templates declare the preferred origin; PDFs are downloads and presently lack the separate HTTP canonical lifecycle required by INT-06. |

### StockProof evidence

All names below are in namespace `screener` unless identified as project-level. Every current StockProof page template extends `screener/base_v2.html`; `screener/templates/screener/base.html` does not exist and is not a future SEO dependency.

| IDs | Route/view/template and method/access | Query, validation, pagination, and enumeration evidence |
| --- | --- | --- |
| SP-01 | `screener:home` → `screener.views.home_view` → `screener/home.html`; anonymous read-only GET | `Company` aggregates and `PRESET_SCREENS`; singleton route. |
| SP-02 | `screener:company_browse` → `company_browse_view` → `company_browse.html`; anonymous GET | `Company.objects.all()` with `q`, real-sector `sector`, finite `sort`, `dir`, and `page`; 50 rows. Current out-of-range values clamp to the nearest real page rather than 404, so impossible requested pages remain an E/F repair. |
| SP-03 | `screener:company_detail` → `company_detail_view` → `company_detail.html`; anonymous GET with optional authenticated personal panels | `get_object_or_404(Company, ticker=...)` validates existence. `range` only selects price history presentation. Enumeration is the eligible public `Company` queryset. |
| SP-04 | `screener:statement` → `statement_view` → `statement.html`; anonymous GET | `STATEMENT_FIELDS` allowlists exactly `profit-loss`, `balance-sheet`, `cash-flow`; company uses `get_object_or_404`; `AnnualFinancials`/snapshot content gates. |
| SP-05 | `screener:peer_comparison` → `peer_comparison_view` → `peer_comparison.html`; anonymous GET | Company 404 validation; peers come from same real sector and require snapshots. No semantic query. |
| SP-06 | `screener:quality_score` → `company_quality_score_view` → `quality_score.html`; anonymous GET | Company 404 validation; eligibility must test the computed entity-specific score/explanation, not merely route existence. |
| SP-07–08 | `screener:screener` → `screener_view` → `screener.html`; anonymous GET, with owned saved-formula data only for authenticated users | `screens.PRESET_SCREENS` is the finite registry for identity-bearing `screen`. `q`, `sector`, thresholds, `formula`, columns and arbitrary combinations are C. Results paginate at 50 and currently clamp invalid pages, a repair before canonical pagination approval. |
| SP-09 | `screener:funds` → `funds_view` → `funds.html`; anonymous GET | `MutualFundScheme` is ordered/paged at 50; filters are `asset_class`, `sub_category`, `amc`, `q`, `include_closed`, `page`. Out-of-range currently returns an empty 200 and must be repaired to E. |
| SP-10 | `screener:fund_detail` → `fund_detail_view` → `fund_detail.html`; anonymous GET | `get_object_or_404(MutualFundScheme, scheme_code=...)`; NAV eligibility from `FundNavHistory`. `scheme_code`, active/closed lifecycle, plan and option are record identity; displayed name is not. ETF detail is this same route. |
| SP-11 | `screener:etfs` → `etfs_view` → `etfs.html`; anonymous GET | `EtfListing.select_related("scheme")` is the ETF source; filters `sub_category`, `amc`, `q`, `tracked`, finite `order`, `page`; 50 rows. Out-of-range is currently empty 200 and is explicitly E/F repair. |
| SP-12 | `screener:calculators` → `calculators_view` → `calculators.html`; anonymous GET query-form handling in one route | Clean multi-calculator page is stable; company/load and numeric inputs are result state, not identities. |
| SP-13–17 | `screener:ipo_calendar`, `sast_filings`, `market_breadth`, `sector_rotation`, `learning` → same-named view owners/templates; anonymous GET | IPO/SAST read stored/source-backed records; breadth/rotation accept finite `window`/`weighting` presentation; glossary inventory is `screener.learning`, one route with section concepts. |
| SP-18 | Named watchlist, portfolio/transaction, saved-formula, notes, learning-note, `ai_mode`, workspace and reports routes; page templates extend `base_v2` | Personal pages/actions are `login_required` or expose only the signed-in user's panels. Workspace/report streams and PDF are user-specific/action/download responses. Never enumerate. |
| SP-19 | `screener:shared` → `shared_view` → `shared_screener.html`/`shared_portfolio.html`; anonymous read-only token GET | `ShareLink` token existence, expiry/revocation and kind are validated; invalid token renders `shared_invalid.html` with 404. Tokens are never inventory identifiers. |
| SP-20 | Project `login/logout`, Django auth reset, `screener` register/verify/platform-auth, admin, `api/internal`, preference POSTs, exports, share management and clear/run/stream actions | HTML auth/account routes are D; JSON/service/action/download responses are non-landing D. Mutations are POST/login/flag gated as implemented. |
| SP-21 | `screener:multiples_comparison` → `multiples_comparison_view` → `multiples_comparison.html`; anonymous read-only GET | Selected tickers resolve through `Company`; sector choices come from real records. The clean workbench can be A, while selected comparison state is C. |

### Charting evidence

| IDs | Route/view/template and method/access | Query, validation, pagination, and enumeration evidence |
| --- | --- | --- |
| CH-01–02 | Unnamed project root and `accounts:home` both call `accounts.views.home` → `accounts/home.html`; anonymous GET with authenticated personal cards | Both render the same home content and accept only featured-chart `range`, proving the exact duplicate. `/accounts/` descendants are separate patterns and must not share the redirect rule. |
| CH-03 | Project login/Django auth plus `accounts:register`, verification, theme and flag-gated platform-auth routes; account templates extend `base.html` | Auth/token/action state; D and never enumerated. |
| CH-04 | `charts:chart` → `charts.views.chart_view` → `charts/chart.html`; anonymous GET | Current view passes any `<str:symbol>` to `load_price_dataframe` and can render an empty fake page. Approval must validate membership in `watchlist.universe.searchable_symbols()`: `finance_data_core.universe.UNIVERSE`, `charts.instruments.INDEX_INSTRUMENTS`, plus distinct locally ingested extras. Unknown symbol is E; recognized/no observations is separately pending/F. |
| CH-05 | `breadth:detail` → `breadth.views.breadth_detail` → `breadth/detail.html`; anonymous read-only GET | One stored shared snapshot from `breadth.services.current_snapshot`; no query/pagination. |
| CH-06 | `leaderboard:list` → `leaderboard.views.leaderboard_list` → `leaderboard/list.html`; anonymous read-only GET | Stored shared ledger; `order` only reverses presentation. Rows link recognized symbols. `leaderboard:export` is a CSV action, not a landing. |
| CH-07 | `accounts:jump_to_chart` and `charts:jump` are anonymous GET redirect actions | Both use `watchlist.universe.resolve_symbol`; invalid input redirects with a message. No mutation, HTML landing, or inventory record. |
| CH-08 | Namespaces `scans`, `watchlist`, `alerts`, `chart_layouts`; all views are `login_required`, and object access is owner-scoped | Includes scan run/export/backtest, saved layouts, watchlist mutations and alerts; all user-specific D. |
| CH-09 | `charts:chart_data` and `charts:chart_fundamentals` return JSON; `leaderboard:export` and scan exports return downloads; internal API/admin/auth helpers are non-landing D | `timeframe` and `compare` affect JSON presentation. Entity validation must match CH-04 before returning a successful payload. |

### F&O evidence

All product tools are under Django namespace `analytics`; because the project mounts them at internal `analytics/`, their public URLs retain `/futures-and-options/analytics/` after mount-aware reversal.

| IDs | Route/view/template and method/access | Query, validation, pagination, and enumeration evidence |
| --- | --- | --- |
| FO-01 | Project `home` → `analytics.home_views.home` → `home.html`; anonymous GET | Stable singleton, backed by stored market/session summaries. |
| FO-02 | `analytics:option_calculator` → `calculator_views.option_calculator` → `option_calculator.html`; anonymous GET/POST | All numerical fields and calculation mode are POST result state. |
| FO-03–04 | `analytics:chain` and `chain_for_symbol` → `analytics.views.chain` → `chain.html`; anonymous GET | `datasource.validate_symbol`, `SUPPORTED_SYMBOLS`, and liquid stock universe govern real symbols; `expiry`/`window` select chain presentation. `chain_json` is separate JSON. |
| FO-05 | `analytics:historical_chain` → `historical_chain_views.historical_chain` → `historical_chain.html`; anonymous GET | `symbol`, `date`, `expiry` are validated selections against supported symbols/archive availability, not canonical multiplication. |
| FO-06 | `analytics:liquidity_finder` → `liquidity_views.liquidity_finder` → `liquidity_finder.html`; anonymous read-only GET | `stock_liquidity.liquidity_table()` and `stock_universe.liquid_stock_universe()` are the stored/measured enumeration source; no query. |
| FO-07 | `analytics:seasonality_analysis` → `seasonality_views.seasonality_analysis` → `seasonality.html`; anonymous read-only GET | `symbol` validates against index plus liquid-stock sources and falls back to default; selected state is C. |
| FO-08 | `analytics:strategy_build` → `strategy_views.strategy_build` → `strategy_build.html`; anonymous GET/POST | GET `symbol`/finite `category`; POST legs/templates/recalculation/live fetch. Only `save` mutates and requires login. JSON context/premium/live/reprice endpoints are helpers. |
| FO-09 | `analytics:backtest_run` → `backtest_views.backtest_run` → `backtest_run.html`; anonymous GET/POST | GET symbol and POST expiry/entry/legs form an ad-hoc result. Only save uses authenticated ownership. No result URL is public canonical. |
| FO-10 | `strategy_list/detail`, `backtest_list/detail/detail_json`, and `paper_open/list/detail`; page templates under `analytics/` | All are `login_required` and use owned-object lookups. Paper/open can mutate positions; saved families are D. |
| FO-11 | `analytics:trading_day*` → `trading_day_views`; HTML page plus POST actions | `founder_required` staff gate intentionally 404s unauthorized users; operational D. |
| FO-12 | Project account/admin/internal API plus `analytics:chain_json`, strategy JSON helpers and saved-backtest JSON | JSON/auth/action/service endpoints are D/non-landing. The future inventory's stable-route allowlist must be reviewed from `foanalytics/urls.py` and `analytics/urls.py`; no current registry should be invented. |

### Commentary evidence

All content routes use namespace `citations`, render templates extending `templates/base.html`, and are anonymous unless a spend action's runtime gate requires login.

| IDs | Route/view/template and method/access | Query, validation, pagination, and enumeration evidence |
| --- | --- | --- |
| COM-01 | Project `home` → `citations.views.search_view` → `citations/search.html`; anonymous GET | Stable search entry. Nifty 500 choices come from `citations.universe.nifty500_options()` backed by `finance_data_core.universe.UNIVERSE`; active source choices come from `Channel`. |
| COM-02 | `citations:market` → `market_view` → `market.html`; anonymous GET | `window/start/end/channels` are bounded research selection; source data are active `Video`/`Citation` records. Clean landing only is A. |
| COM-03 | `citations:coverage` → `coverage_view` → `coverage.html`; anonymous GET | Enumerates active `Channel` records and earliest ingested `Video`; no query. |
| COM-04 | `citations:status` → `status_view` → `status.html`; currently anonymous GET | Actual content is today's YouTube/TranscriptAPI/OpenRouter quota, spend/configuration and ingestion backlog. This resolves it as operational D; future ticket: access-control and noindex implementation. |
| COM-05 | `citations:results` → `results_view` → `results.html`; anonymous GET | Symbol must be in the real Nifty 500 lookup before citations render. Window/date/source combinations remain C; no pagination. |
| COM-06 | `citations:keyword` → `keyword_view` → `keyword_results.html`; anonymous GET | FTS query/date/channel combinations are arbitrary C; `TranscriptChunk`/`Video`/`Channel` data are result sources. |
| COM-07 | `citations:research` → `research_views.research_view` → `research.html`; anonymous cached reads, gated generation | Symbol/video/schema/temperature select cached/generated utility state. `research_generate`, `research_video`, `research_flag`, and flag-gated `research_opinion` are POST actions, never landings. |
| COM-08–09 | Project accounts/admin/platform-auth and `/api/internal/ops-summary`; account templates extend `base.html`; API returns JSON | Auth, owner, ops, generation/action and service state are D. No public URL inventory adapter enumerates them. |

### Crypto evidence

All names use namespace `crypto`; all HTML templates extend `crypto/base.html`. `cryptotools/urls.py` mounts the app at internal root because Caddy strips `/crypto`; `FORCE_SCRIPT_NAME`/mount-aware reversal reapplies the public prefix.

| IDs | Route/view/template and method/access | Query, validation, pagination, and enumeration evidence |
| --- | --- | --- |
| CR-01 | `crypto:home` → `crypto.views.home` → `crypto/home.html`; anonymous GET | Stable singleton. |
| CR-02–05 | `markets`, `fundamentals`, `news`, `defi` in `crypto.market_views`; anonymous read-only GET | Market/fundamental candidates come from real covered database rows (`top_coins_by_market_cap`, fundamentals services/models); news source and DeFi chain are filters. No current URL pagination. |
| CR-06–11 | `premium`, `premium_cost`, `correlation`, `positioning`, `options`, `exit_cost_calculator`; anonymous GET | Asset/coin/sort and calculator inputs select presentation/results. Covered choices are derived from stored service/model rows. Only clean stable landings are A. |
| CR-12 | `crypto:coin_detail` → `market_views.coin_detail` → `coin_detail.html`; anonymous GET | `services.coin_with_latest_snapshot(coingecko_id)` returns `None` and raises 404 for an unknown ID. Candidate/eligibility source is real `Coin` plus page-family coverage/snapshot data, never guessed IDs. |
| CR-13 | `crypto:compare` → `market_views.compare` → `compare.html`; anonymous GET | `a/b/c` must occur in `top_coins_by_market_cap(limit=250)` or the view falls back to real defaults. Selected combinations are C. |
| CR-14 | `crypto:pulse_index` and `crypto:pulse`; anonymous GET | Root is stable. Dated view strictly parses `YYYY-MM-DD` and 404s unless the date equals local today; there is no persisted pulse model or scheduler. Today's dated response is ephemeral C, all other dates E. |
| CR-15 | Five named calculator views/templates; anonymous GET/POST | Clean explanatory pages are stable; submitted tax/P&L/conversion/DCA/loss-offset results are request-bound C. |
| CR-16–17 | `schedule_vda`, `derivatives`, `ais_reconciliation` plus three named CSV-template downloads; anonymous GET/POST/download | Clean explanatory workflow pages can be A. Uploaded files, computed results, CSV exports/templates and all request data are C/non-landing and never enumerated. |
| CR-18 | `crypto:portfolio` → `portfolio_views.portfolio` → `portfolio.html`; anonymous GET/POST | Current app deliberately has no Django auth/session/admin or persistent visitor portfolio model. Clean landing can be A; submitted lots/results are C and must remain non-addressable. |
| CR-19 | `crypto:healthz` → plain-text `HttpResponse`; any deployment helpers | Operational non-HTML D. |

### Platform Core evidence

Platform Core is read-only evidence for the boundary, not an eighth acquisition application.

| Family | Source-backed policy |
| --- | --- |
| Platform root | Project `home` → `accounts.views.home` → `accounts/home.html` at `https://platform.marketdeck.in/`; D, no acquisition canonical or sitemap membership. |
| Signup/login | Project names `signup` and `login` → `accounts.views.signup/login_view`; `/signup/` and `/login/` require/validate a product `client` plus safe `next`; GET forms and POST mutations are D. |
| OAuth/phone/verification/logout | `/auth/google/start/`, `/auth/google/callback/`, `/auth/phone/`, `/verify/{uidb64}/{token}/`, `/resend-verification/`, `/logout/`; token/callback/action routes are D. |
| Operations | Namespace `ops` under `/ops/**`; every view uses the `requires(...)` permission wrapper, including JSON palette, exports and mutating entitlement/cleanup actions; D. |
| Admin/internal API | `/admin/**` and `/api/internal/**`; protected operational/service surfaces, D/non-HTML. |

## Cross-application implementation requirements

Future implementation tickets must test canonical tags and status codes after `handle_path` prefix stripping so applications emit public mounted URLs, not internal paths. A public route may enter `APPROVED_ELIGIBLE_CANONICAL` only when its owner confirms:

- authoritative record existence and public status;
- correct mounted URL and preferred-origin canonical;
- successful substantive response without soft-404 behaviour;
- unique, accurate title/primary heading and useful content for the page family;
- required provenance, timestamps, definitions, and data completeness;
- no private/account/token material;
- at least one crawlable internal inbound link;
- inclusion/exclusion consistent with the inventory contract.

## Explicit remediation backlog

The following remain F or unresolved and must receive owned implementation tickets rather than disappearing from candidate counts:

1. Redirect duplicate `www` origin to the preferred origin at Caddy.
2. Repair impossible StockProof company, fund, and ETF pagination to return E/404 instead of clamping or rendering an empty 200.
3. Validate StockProof Trace Score and peer-page substantive eligibility.
4. Define fund/scheme completeness, lifecycle, and replacement rules from real records.
5. Migrate exact `/charts/accounts/` home duplicate without redirecting account descendants.
6. Reject invented Charting symbols and separately model recognized instruments with temporary missing observations.
7. Protect/noindex Commentary's currently anonymous operational status dashboard; source verification classifies it D.
8. Implement HTML/PDF lifecycle and HTTP canonical handling for equivalent Intelligence PDFs.
9. Build the mount-aware canonical helper/contract from an explicit trusted public origin; do not use request hosts or legacy `SITE_BASE_URL` product subdomains.
10. Keep Platform Core on `platform.marketdeck.in` outside acquisition sitemaps and add explicit noindex/private-cache controls where its HTML responses are crawlable.

## Non-goals of this constitution

This document does not generate an inventory, approve every observed database record, change robots or sitemap output, promise Google indexing, create stable pages from arbitrary searches, create historical Pulse archives, or authorize deployment.
