# MarketDeck shared URL and indexing constitution

Status: authoritative policy specification. This document does not change runtime behaviour. Any redirect, canonical, status-code, robots, sitemap, proxy, template, or route change requires a separate implementation and release.

## Scope and authority

The preferred public origin is `https://marketdeck.in`. The policy covers the seven public surfaces served there: the `marketdeck-web` root, MarketDeck Intelligence, StockProof, Charting, F&O, Commentary, and Crypto World. Caddy currently serves the root/static surface from `marketdeck-web/public` and proxies product mounts with `handle_path`; `/opt/factory/Caddyfile` is the deployment owner, not part of this change.

Route names for product repositories are described by source owner when their code is not present in this checkout. Those names must be replaced by verified named-route identifiers during implementation; they must not be guessed from URL shapes. Repository labels marked `external` identify the audited application, not a claim about an unverified Git slug.

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
- `www.marketdeck.in` is an origin-level duplicate. A later Caddy change should permanently redirect it to the preferred origin while preserving path and allowed query. Until that repair, it is class B and excluded from inventories of approved canonicals.
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

| ID | Internal discovery requirement | Private/auth considerations | Invalid-state behaviour | Content eligibility | Notes / future work |
| --- | --- | --- | --- | --- | --- |
| INT-01 | Homepage and global/editorial navigation | None | Unknown child path 404 | Contains approved entries and useful hub copy | Client-side search is not a URL publication system. |
| INT-02 | Hub and issue navigation | None | Empty impossible archive page 404 if URL pagination is added | Lists approved published issues | Preserve real pagination identity if later introduced. |
| INT-03 | Hub/library plus contextual related links | Drafts excluded from production | Unknown/unapproved slug 404 in production | Manifest status `published`, approval date present, substantive/source-linked copy, unique metadata | Current seven guides satisfy the manifest model; inventory must read the manifest. |
| INT-04 | Hub and archive | Drafts excluded from production | Unknown/unapproved slug 404 | Published/approved manifest record, complete HTML, truthful dates/sources | Do not infer an archive from files alone. |
| INT-05 | Hub/footer or article policy link | None | 404 when absent | Accurate, maintained policy | Public reference, not an auth/ops policy. |
| INT-06 | Linked as secondary download from matching HTML | PDFs must contain no private review data | Missing edition 404; retired duplicate may be 410 | Byte-valid approved edition matching the HTML issue | Multiple equivalent filenames remain B; choose lifecycle/redirect and HTTP `Link` canonical in later work. |
| INT-07 | No production discovery | Owner review controls; no public sitemap | Unknown draft 404 | Never eligible before explicit publication approval | Review build already emits noindex; retain this gate. |

### 3. StockProof (`StockProof`, external repository)

| ID | Repository; mount; source owner | Pattern and page family | Class; intended indexing | Preferred/canonical semantics | Allowed query; presentation duplicates | Sitemap |
| --- | --- | --- | --- | --- | --- | --- |
| SP-01 | `StockProof` external; `/screener/`; product root view | `/screener/` — product/research landing | A; index | Clean self-canonical | Tracking/presentation only consolidate | Eligible |
| SP-02 | same; company directory view | `/screener/companies/` and valid pagination — company directory | A | Each real page self-canonical; omitted/default page consolidates to page 1 | `page` only when valid; sort/display variants consolidate unless deliberately published | Eligible |
| SP-03 | same; company detail view/model | `/screener/company/{company_id_or_slug}/` — company overview | A after entity eligibility | Stable source-owned company identifier, self-canonical | `range=1M|1Y|3Y|5Y|Max` is B presentation state and consolidates to company URL | Eligible |
| SP-04 | same; company statements view | `/screener/company/{id}/{profit-loss|balance-sheet|cash-flow}/` — financial statement research | A when substantive | Each statement is distinct and self-canonical; do not collapse to overview | Period/display controls consolidate unless a separately approved finite publication | Eligible |
| SP-05 | same; peers view | `/screener/company/{id}/peers/` — peer analysis | A when materially useful | Self-canonical, not automatically company-home canonical | Non-semantic sort/display consolidate | Eligible |
| SP-06 | same; quality/Trace Score view | `/screener/company/{id}/{quality-score route}/` — Trace Score | A when explanation and entity evidence are substantive; otherwise F | Self-canonical only after eligibility; route label may differ from UI label | Presentation controls consolidate | Conditional |
| SP-07 | same; curated-screen registry/views | `/screener/{screen route}/{approved_preset}/` — one of the finite curated screens | A when registry-approved | Each approved preset has one stable preferred URL | Only registry-owned finite preset keys; duplicate default/sort state consolidates | Eligible |
| SP-08 | same; screener/search engine | Arbitrary filter/search/result URLs | C; noindex | No false canonical to an unrelated preset or root | User filters, formulas, search, pagination of custom result state | No |
| SP-09 | same; fund directory and scheme records | `/screener/funds/` plus valid pagination — mutual-fund directory | A | Real pages self-canonical | Valid `page`; display/sort defaults consolidate | Eligible |
| SP-10 | same; fund detail view | `/screener/funds/{scheme_code}/` — mutual fund or ETF detail | A only for eligible record | Scheme code is identity; self-canonical. Identical displayed names are not deduplication evidence | Range/chart presentation consolidates | Eligible after record gate |
| SP-11 | same; ETF directory view/ETF records | `/screener/etfs/` plus valid pagination — ETF directory | A for real pages; impossible pages E | Directory pages self-canonical; ETF detail links to SP-10, never a competing `/etfs/{id}/` | Valid `page`; sort/display consolidate | Eligible for real pages |
| SP-12 | same; calculator view | `/screener/calculators/` — multi-calculator landing and submitted state | A landing; C user-result state | Clean landing self-canonical; input/result query is not a new canonical | Documented calculator inputs may remain usable but are noindex result state | Landing only |
| SP-13 | same; IPO calendar view | `/screener/{ipo-calendar route}/` | A when maintained | Clean self-canonical | Finite date/navigation controls are presentation unless explicitly published | Eligible |
| SP-14 | same; SAST filings view | `/screener/{sast route}/` | A when source-linked and current | Clean self-canonical | Search/date/filter state C | Eligible landing |
| SP-15 | same; market breadth view | `/screener/{market-breadth route}/` | A when substantive/current | Clean self-canonical | Display/date parameters consolidate or become C | Eligible landing |
| SP-16 | same; sector rotation view | `/screener/{sector-rotation route}/` | A when substantive/current | Clean self-canonical | Display/date parameters consolidate or become C | Eligible landing |
| SP-17 | same; Learning/glossary views | `/screener/{learning route}/` and stable glossary entries | A for substantive curated pages | One stable URL per approved entry | Search/filter state C | Eligible |
| SP-18 | same; account/personal views | Portfolio, transactions, watchlist, notes, saved formulas, AI Mode/Workspace, reports | D; noindex | No public canonical | User/account state only | No |
| SP-19 | same; token-share view | Public token share URL using synthetic example `/share/REDACTED` | D/C; noindex | Never canonical acquisition content | Token is access state, never inventory identity | No |
| SP-20 | same; auth/admin/API owners | Login/signup/reset/verification/admin/internal/API endpoints | D; noindex where HTML | No public canonical | Operational parameters only | No |

| ID | Internal discovery requirement | Private/auth considerations | Invalid-state behaviour | Content eligibility | Notes / future work |
| --- | --- | --- | --- | --- | --- |
| SP-01 | Root product navigation | Signed-out public response only | Unknown child route 404 | Useful product orientation | Verify source route name in product repo. |
| SP-02 | Product root and pagination links | None | Impossible page E/404 | Non-empty page, stable order, canonical entities | HTML pagination observed. |
| SP-03 | Company directory, screens, peers and related entities | No user overlays in canonical HTML | Unknown company already fails; preserve E | Authoritative company record, public status, minimum financial/evidence completeness | About 486 observed is audit context, not an inventory constant. |
| SP-04 | Company navigation and overview | None | Unknown company/subpage 404 | Entity-specific statement data, period labels, sources and non-thin rendering | Statements remain distinct when useful. |
| SP-05 | Company navigation | None | Unknown company 404; no valid peer set becomes F/clear empty state, not fake peers | Meaningful comparison set, definitions, entity context | Confirm usefulness per template/data. |
| SP-06 | Company navigation | Method details must not expose internal secrets | Unknown entity 404 | Score exists, components/explanation/provenance are sufficient | If thin/opaque, retain as F remediation rather than canonicalize away. |
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
| SP-17 | Learning hub and contextual links | None | Unknown term 404 | Curated, substantive, maintained entry | Do not index empty taxonomy pages. |
| SP-18 | No public acquisition links | Authentication/authorization, private/no-store | Unauthorized 401/403 or login flow; missing object 404 | Never public eligible | Includes owner-side share management. |
| SP-19 | Only intentional recipient distribution | Token secrecy; revoke/expiry; private/no-store as appropriate | Invalid/expired token 404/410, never leak existence | Never A under current product | Never record real tokens. |
| SP-20 | No acquisition links | Strong auth/authorization and safe caching | Correct 4xx, never HTML soft 200 | Never eligible | API/helper JSON excluded. |

### 4. Charting (`Charting`, external repository)

| ID | Repository; mount; source owner | Pattern and page family | Class; intended indexing | Preferred/canonical semantics | Allowed query; presentation duplicates | Sitemap |
| --- | --- | --- | --- | --- | --- | --- |
| CH-01 | `Charting` external; `/charts/`; home view | `/charts/` — charting landing | A | Clean self-canonical | Presentation/tracking consolidate | Eligible |
| CH-02 | same; accounts root/home alias | `/charts/accounts/` — duplicate public home | B/F until migrated | Exact duplicate should permanently redirect/canonicalize to `/charts/`; preserve descendants | None at alias | No |
| CH-03 | same; account views | `/charts/accounts/**` except exact root — auth/profile flows | D | Must not be swept into CH-02 redirect | Auth state only | No |
| CH-04 | same; recognized-instrument chart view/universe | `/charts/{symbol}/` — instrument chart | A for recognized eligible instruments; F when recognized but temporarily data-incomplete | Stable universe identity, self-canonical | Range/interval/indicator/layout presentation is B/C and not new canonical identity | Eligible after universe/data gate |
| CH-05 | same; breadth view | `/charts/{breadth route}/` | A when substantive | Clean self-canonical | Display/date state consolidates or C | Eligible landing |
| CH-06 | same; relative-strength leaderboard | `/charts/{relative-strength route}/` | A when substantive | Clean self-canonical | Sort/window display state consolidates unless finite approved publication | Eligible landing |
| CH-07 | same; search/scan results | Arbitrary instrument search or scan/filter results | C; noindex | No canonical promotion from result state | Search/filter/sort/pagination state | No |
| CH-08 | same; personal views | Watchlist, saved scans/layouts, alerts | D | No public canonical | User state | No |
| CH-09 | same; data/API owners | Chart data, fundamentals JSON, helper, auth/admin/API routes | D | No page canonical | Request parameters are operational | No |

| ID | Internal discovery requirement | Private/auth considerations | Invalid-state behaviour | Content eligibility | Notes / future work |
| --- | --- | --- | --- | --- | --- |
| CH-01 | Platform and product navigation | Signed-out public response | Unknown child 404 | Useful product/research landing | — |
| CH-02 | Remove links to alias; keep descendant links correct | Do not redirect account descendants | Alias redirect only after route-boundary tests | Genuine exact homepage equivalence | Later migration required. |
| CH-03 | No acquisition links | Auth/authorization and private/no-store | Correct 401/403/404 | Never eligible | Route ordering must protect descendants. |
| CH-04 | Leaderboard, search and valid related-instrument links | User layouts must not alter public canonical | Invented symbol is E/404; recognized temporarily empty instrument gets explicit unavailable/F handling | Membership in authoritative recognized universe plus minimum labeled observations/metadata | Current arbitrary-symbol fake 200 is an explicit repair. |
| CH-05 | Product/research navigation | None | Unsupported universe/date 404 or unavailable | Defined universe, sources, freshness | — |
| CH-06 | Product navigation and links to every listed valid entity | None | Invalid window 400/404 | Recognized universe, methodology, current data, non-empty list | Hundreds of links are discovery evidence, not a guessed universe. |
| CH-07 | Forms may link to clean action, not combinations | Saved scans move to D | Invalid query 400; valid empty result C | Not eligible absent curated publishing | — |
| CH-08 | No public discovery | Auth/authorization, private/no-store | Correct 401/403/404 | Never eligible | — |
| CH-09 | No acquisition discovery | Protect non-public data/functions | Correct JSON 4xx, no HTML fallback | Never eligible | Explicitly excluded from inventory/sitemap. |

### 5. F&O (`F&O`, external repository)

| ID | Repository; mount; source owner | Pattern and page family | Class; intended indexing | Preferred/canonical semantics | Allowed query; presentation duplicates | Sitemap |
| --- | --- | --- | --- | --- | --- | --- |
| FO-01 | `F&O` external; `/futures-and-options/`; product root | `/futures-and-options/` | A | Clean self-canonical | Tracking/presentation consolidate | Eligible |
| FO-02 | same; option calculator view | Stable option-calculator landing; submitted result state | A landing; C result | Landing self-canonical; user inputs/results do not become canonicals | Calculator inputs allowed for utility only | Landing only |
| FO-03 | same; chain view | Stable option-chain landing/default current chain | A landing when useful | One clean preferred landing | Expiry/display/sort state B/C; only explicitly approved finite pages may differ | Eligible landing |
| FO-04 | same; symbol-chain view and recognized derivative universe | Symbol-specific chain route | A for supported recognized symbol/current public data | Source-owned symbol identity, self-canonical | Expiry/display variants consolidate or C | Conditional |
| FO-05 | same; historical-chain view | Historical chain landing/query | A explanatory landing; C arbitrary requested result | Clean landing self-canonical | Symbol/date/expiry requests C by default | Landing only |
| FO-06 | same; liquidity finder | Stable liquidity-finder landing/results | A landing; C arbitrary filters | Clean landing self-canonical | Filters/sorts C | Landing only |
| FO-07 | same; seasonality view | Stable seasonality landing/results | A landing; C arbitrary symbol/window result | Clean landing self-canonical | Symbol/window/date C unless published finite preset | Landing only |
| FO-08 | same; strategy-builder view | Strategy-builder landing and ad-hoc strategy state | A landing; C constructed state | Clean landing self-canonical | Legs, strikes, expiries, prices C | Landing only |
| FO-09 | same; backtest/historical-replay view | Backtest/replay landing and result | A landing; C ad-hoc result | Clean landing self-canonical | Strategy/date/symbol/result identifiers C; saved objects D | Landing only |
| FO-10 | same; personal views | Saved strategies, saved backtests, paper positions | D | No public canonical | User/object IDs | No |
| FO-11 | same; operator routes | Trading-day/operator controls and internal operations | D | No public canonical | Operational parameters | No |
| FO-12 | same; auth/API owners | Login/account/admin/API/helper/service routes | D | No public canonical | Operational/auth parameters | No |

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

### 6. Commentary (`market-commentary-v1`, external repository)

| ID | Repository; mount; source owner | Pattern and page family | Class; intended indexing | Preferred/canonical semantics | Allowed query; presentation duplicates | Sitemap |
| --- | --- | --- | --- | --- | --- | --- |
| COM-01 | `market-commentary-v1`; `/commentary/`; root/search-entry view | `/commentary/` — product/search landing | A | Clean self-canonical | Empty/default search parameters consolidate | Eligible |
| COM-02 | same; market-view | Stable market-view route | A when substantive | Clean self-canonical | Presentation/window controls consolidate or C | Eligible |
| COM-03 | same; coverage view | Stable coverage route | A | Clean self-canonical | Display/search controls C | Eligible |
| COM-04 | same; status view | Stable status route | C pending public-value decision; F if intended as acquisition content but presently thin/operational | No sitemap canonical promotion until owner decision | Operational filters | No pending decision |
| COM-05 | same; stock-results view | Stock results with symbol/window/start/end/source state | C; noindex | Do not canonicalize arbitrary results as a company publication | `symbol`, `window`, `start`, `end`, `source` as utility state | No |
| COM-06 | same; transcript search | Arbitrary keyword transcript search/results | C; noindex | Clean search landing may be COM-01; results are not equivalent content canonicals | Keyword, source, date, pagination | No |
| COM-07 | same; AI Research Digest view | AI request/query/result state | C; noindex; D when account-bound | No public acquisition canonical | Prompt/query/model/result identifiers | No |
| COM-08 | same; personal/auth views | Saved/account/workspace/admin routes | D | No public canonical | User/auth state | No |
| COM-09 | same; API/helper owners | API, transcript JSON, health/internal helpers | D | No page canonical | Operational parameters | No |

| ID | Internal discovery requirement | Private/auth considerations | Invalid-state behaviour | Content eligibility | Notes / future work |
| --- | --- | --- | --- | --- | --- |
| COM-01 | Platform and product navigation | Signed-out public entry | Unknown child 404 | Stable explanation and search entry | Search utility does not make result states A. |
| COM-02 | Root/product navigation | None | Unsupported state 400/404 | Source scope, freshness, substantive market context | Verify exact named route in repo. |
| COM-03 | Root/product navigation | None | Unknown source/entity 404 | Transparent coverage/source list and update state | — |
| COM-04 | Operational navigation only while C | Must not expose sensitive system detail | Correct status codes; unavailable service should not emit acquisition soft 200 | Owner must decide whether reader-facing coverage/freshness explanation is substantive | Explicit unresolved decision; do not guess. |
| COM-05 | Search form; no combinatorial crawl links | Account annotations D | Invalid symbol/date 400/404; empty valid query C | Not A absent explicit curated company publication feature | A future stable company/topic page needs a publishing workflow and route. |
| COM-06 | Search form only | Respect transcript/source access rights | Invalid query 400; missing record 404 | Never A merely because results are useful | Avoid query crawl space. |
| COM-07 | Tool entry only | Prompts/results may be private; safe caching | Invalid/expired result 404/410 | Not public eligible | — |
| COM-08 | No acquisition links | Auth/authorization, private/no-store | Correct 401/403/404 | Never eligible | — |
| COM-09 | No acquisition links | Protect internal/source data | Correct JSON 4xx | Never eligible | — |

### 7. Crypto World (`crypto-tools-v1`, external repository)

| ID | Repository; mount; source owner | Pattern and page family | Class; intended indexing | Preferred/canonical semantics | Allowed query; presentation duplicates | Sitemap |
| --- | --- | --- | --- | --- | --- | --- |
| CR-01 | `crypto-tools-v1`; `/crypto/`; product root | `/crypto/` | A | Clean self-canonical | Tracking/presentation consolidate | Eligible |
| CR-02 | same; markets view | Stable markets route | A | Clean self-canonical | Sort/display/currency/page variants consolidate unless real pagination | Eligible landing; real pages conditional |
| CR-03 | same; fundamentals view/data coverage | Stable fundamentals route | A | Clean self-canonical | Sort/filter/display C/B | Eligible landing |
| CR-04 | same; news view | Stable news route | A when curated/source-linked | Clean self-canonical | Search/filter/date state C | Eligible landing |
| CR-05 | same; DeFi view | Stable DeFi route | A when substantive | Clean self-canonical | Sort/display C/B | Eligible landing |
| CR-06 | same; premium view | Stable premium route | A when public research page | Clean self-canonical | Asset/date/display C/B | Eligible landing |
| CR-07 | same; premium-cost view | Stable premium-cost route | A when public research page | Clean self-canonical | Asset/date/display C/B | Eligible landing |
| CR-08 | same; Nifty-correlation view | Stable correlation route | A landing | Clean self-canonical | Coin/window/date/result state C/B | Eligible landing |
| CR-09 | same; derivatives-positioning view | Stable positioning route | A when substantive/current | Clean self-canonical | Asset/window/display state C/B | Eligible landing |
| CR-10 | same; options-implied-move view | Stable implied-move route | A landing; C submitted state | Clean landing self-canonical | Contract/expiry/input result state C | Landing only |
| CR-11 | same; exit-cost view | Stable exit-cost route | A landing; C submitted state | Clean landing self-canonical | Asset/size/venue result state C | Landing only |
| CR-12 | same; coin detail/data coverage | `/crypto/coins/{coingecko_id}/` | A for recognized eligible coin | Exact source `coingecko_id`, self-canonical | Display/currency/range parameters consolidate | Eligible after record gate |
| CR-13 | same; compare view | Stable compare landing and selected comparison | A landing; C arbitrary comparison | Clean landing self-canonical | Coin sets, order, windows and metrics are utility state | Landing only |
| CR-14 | same; Pulse view | Current stable Pulse route; dated/expired Pulse paths | A for current stable page when substantive; E for ephemeral dated URLs that no longer exist | Do not invent or canonicalize a historical archive | Date/display state is not an archive | Current landing only |
| CR-15 | same; calculator views | Public calculator landings and submitted results | A landings; C result state | Each genuinely distinct stable tool landing self-canonical | User inputs/results C | Landings only |
| CR-16 | same; Schedule VDA/filing workflow views | Public explanatory landing; workflow steps/submissions | A landing; C/D workflow state | Clean explanatory landing self-canonical | Filing inputs, step, draft/submission IDs C/D | Landing only |
| CR-17 | same; upload/result views | Uploads and generated/personal results | C when intentionally public utility; otherwise D | No acquisition canonical | File/result/token identifiers | No |
| CR-18 | same; account/personal views | Saved/personal/account/admin routes | D | No public canonical | User/auth state | No |
| CR-19 | same; API/helper owners | API, JSON, health, internal/service routes | D | No page canonical | Operational parameters | No |

| ID | Internal discovery requirement | Private/auth considerations | Invalid-state behaviour | Content eligibility | Notes / future work |
| --- | --- | --- | --- | --- | --- |
| CR-01 | Platform/product navigation | Signed-out public response | Unknown child 404 | Useful orientation and tool links | — |
| CR-02 | Root and pagination when real | None | Impossible pages 404 | Authoritative market records, stable order, useful rows | About 100 observed is not a fixed inventory. |
| CR-03 | Root and coin links | None | Unsupported filters 400; unavailable data explicit | Defined coverage, methodology, freshness | About 250 observed entities must be enumerated from data. |
| CR-04 | Root/research navigation | Respect source/licence constraints | Missing article/source 404 | Source links, timestamps, substantive curation | Arbitrary search stays C. |
| CR-05 | Root/research navigation | None | Unsupported protocol/chain 404 | Defined metrics, coverage, freshness | — |
| CR-06 | Root/research navigation | Distinguish public premium metric from paid/private account | Unknown asset/date 404 or unavailable | Defined methodology/source/freshness | Verify exact source route. |
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
| CR-18 | No acquisition links | Auth/authorization, private/no-store | Correct 401/403/404 | Never eligible | — |
| CR-19 | No acquisition links | Protect internal data/functions | Correct JSON 4xx | Never eligible | Explicit API exclusion. |

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
2. Repair impossible StockProof ETF pagination to return E/404.
3. Validate StockProof Trace Score and peer-page substantive eligibility.
4. Define fund/scheme completeness, lifecycle, and replacement rules from real records.
5. Migrate exact `/charts/accounts/` home duplicate without redirecting account descendants.
6. Reject invented Charting symbols and separately model recognized instruments with temporary missing observations.
7. Decide whether Commentary status is reader-facing public content or operational utility.
8. Implement HTML/PDF lifecycle and HTTP canonical handling for equivalent Intelligence PDFs.
9. Map every external product family to verified repository and named-route identifiers before runtime work.

## Non-goals of this constitution

This document does not generate an inventory, approve every observed database record, change robots or sitemap output, promise Google indexing, create stable pages from arbitrary searches, create historical Pulse archives, or authorize deployment.
