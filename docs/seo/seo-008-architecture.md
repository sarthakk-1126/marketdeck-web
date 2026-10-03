# SEO-008 — Source-owned inventory and atomic sitemap publication

Status: architecture selected for implementation; NOT deployed. Production admission remains gated on the readiness register below. Audit date: 2026-09-24.

This document supplements, not silently replaces, [url-policy.md](url-policy.md) and [inventory-contract.md](inventory-contract.md). The existing 24-field record remains authoritative. A source-code audit is not a production database census, runtime attestation, or Google indexing report.

## 1. Decision

Use a hybrid: six source-owned, read-only inventory producers; one central validator/publisher; static XML served by Caddy from a dedicated persistent artifact directory outside all deployment checkouts.

- `marketdeck-web` owns the protocol, family approvals, web/editorial producer, publisher, reconciliation tooling and root sitemap index.
- Each Django product owns its inventory command, its database reads, canonical builders and shared page/inventory eligibility rules. It does not export credentials or private records.
- The VPS coordinator executes fixed allowlisted commands inside the currently running product containers. It does not import all applications into one Python process, connect directly to every database, call live data vendors, or render page views to discover candidates.
- The publisher accepts complete compatible producer generations, validates them, builds URL sets, and atomically switches the root index only after every referenced child exists and passes validation.
- Caddy serves only XML from the public artifact directory. Internal inventory JSON, observations, logs, approvals and checksums stay outside the web root.
- The root is a FLAT sitemap index: its children are URL-set files, never other sitemap indexes.

This separates data ownership, publication approval and delivery. A product outage need not make the already-published XML unreadable. A VPS/Caddy outage still affects delivery: this is not multi-region availability.

## 2. Verified source revisions

| Repository | Branch | Audited revision |
| --- | --- | --- |
| marketdeck-web | main | `58c0ba7ab76fcd7d5ee1a3ea51a51471dd635984` |
| stockproof | master | `ec954c5b284f530e76b7f9bc9583ec29aa8cb949` |
| charting-v1 | master | `04b3805870bda418fe9f59db982ef19a6ae7bc3b` |
| fo-analytics-v1 | master | `88f773d35e39218aaa687ae9365dc1eb3d871667` |
| market-commentary-v1 | master | `ca29c7b986226d8c5ba5fd2d1598a58c4fa6c4c8` |
| crypto-tools-v1 | master | `cefb563b84f09c120b5b5ddc187ca05a233a4f20` |

The optional `finance-data-core/master` ref was `d98afd32595ac4d42b7b1b65d6a7dbedc631a9c9`. That is NOT a substitute for a consumer's installed dependency: Charting pins v0.4.1 and F&O pins v0.8.0. Record the consumer's actual dependency identity without dumping credential-bearing installation URLs.

No platform-core change, deployment, reset or private-record enumeration is required.

## 3. Findings that change the implementation plan

### Existing work is useful but not an exhaustive inventory

StockProof has eight `PAGE_SEO` landings, `approved_public_landing_identities()`, and `approved_preset_identities()`. The clean screener is separate. Directory page counts and company/statement/peer/Trace/fund enumeration are not supplied by those two helpers. A company directory row currently requires a snapshot; counting every Company record would overstate its pages. A company overview can instead qualify from annual or quarterly history. Statement eligibility follows the rendered annual-history-first, snapshot-fallback sources. NAV point counts exclude null NAV rows through `fund_returns.series_from_rows()`.

Charting has three static landings and `eligible_chart_symbols()`. The searchable universe includes locally ingested extras, and its own documentation mentions demo symbols. This is evidence of a possible approval leak, not proof that production currently contains those examples. The policy already requires a stable public-label/data gate for extras. Also, page resolution can bypass a stale search cache for a newly ingested symbol, while inventory currently intersects the cached list. A shared uncached approval/recognition snapshot must remove that parity gap without breaking user search.

F&O has eight stable landings and `supported_chain_entity_symbols()`. The latter is explicitly a candidate list, not an eligible sitemap list. The actual closed-market HTML fallback uses `analytics.market_snapshot.latest()` and the `MarketSnapshot` model, then `build_snapshot_chain_view()`; do not substitute the separate live-capture table merely because its name sounds appropriate. Preserve NIFTY/BANKNIFTY support, empty-state noindex, outage 503 and all existing provider/compliance gates.

Commentary has three acquisition routes. Its current metadata selection is route-only, whereas COM-02 explicitly calls market date/channel/window selections utility state. Resolve that mismatch in the Commentary adapter/readiness batch; do not change the Constitution to conceal it. Status is operational and excluded; noindex is not protection for operational data.

Crypto has 22 `STABLE_PAGES` entries. The ten tool landings are a subset, not ten additional URLs. Coin inventory already uses the latest-snapshot predicate; it still needs run provenance, exclusions, coverage reconciliation and production verification. The current coin predicate has no age threshold: never invent one in the sitemap alone. Any agreed freshness gate must be shared with page behavior.

### The web sitemap has an active writer

The committed `public/sitemap.xml` contains 20 URLs: root and credits, four Intelligence collection/policy pages, three learning hubs, ten notes and one published issue. It contains no product inventory. `scripts/editorial.mjs` rewrites the root sitemap during builds. That writer must be explicitly retired at cutover or it could overwrite the suite index.

`/intelligence/library/` is generated and already in the current sitemap but is not explicitly enumerated as its own Constitution family. Record an explicit INT-09 library approval amendment, retaining the existing route, rather than silently dropping it or pretending it was already registered. The current learning hub spelling is `/intelligence/futures-options/`.

Article and BreadcrumbList schema, CollectionPage/ItemList schema and an editorial-policy page already exist. SEO-010 is an audit/completion task, not a greenfield schema installation.

### Deployment success is not revision attestation

The five product deploy workflows fetch/reset the host checkout to `origin/master` and run `docker compose up -d --build` for the service. They do not pin deployment to the workflow event SHA or attest the running image's source revision. The web workflow invokes a constrained SSH command. Historical VPS evidence shows Caddy serving `marketdeck-web/public` read-only at `/srv/marketdeck-web` and routing the five product mounts through Compose.

These are source and dated-host observations. The current Compose mounts, running images and Caddy configuration still require a fresh redacted read-only VPS check. Opera is disconnected; an independent fetch environment could not resolve the site. Neither condition proves a site outage. No fresh production database counts or live URL certification were obtained in this audit.

## 4. Alternatives

| Option | Fit and tradeoff | Decision |
| --- | --- | --- |
| A. Web build generates everything centrally | Good for editorial manifests; wrong owner for five application databases. Would require cross-app dependencies, credentials or stale committed exports. | Reject as sole design. |
| B. Root index links to product sitemap endpoints | Clear ownership and valid protocol when children are URL sets. Raw on-request generation couples crawler requests to DB/analytics and app availability; cached endpoints could mitigate this. | Viable alternative, but not preferred delivery for this VPS. |
| C. Deploy-time aggregation only | Simple release trigger, but misses ingestion, lifecycle changes and editorial withdrawals between deployments. Concurrent deploys create publication races. | Use deploy as one trigger, not the only source of freshness. |
| D. Scheduled central aggregation only | Sees data changes independently of releases, but direct cross-database querying duplicates ownership; a careless implementation can publish partial output. | Use scheduling with isolated producers and admission gates. |
| E. Source-owned exports plus central persistent static publication | Keeps DB credentials inside owners, avoids vendor calls during enumeration, supports complete per-owner generations, atomic publication and controlled last-known-good retention. Requires a small coordinator and one scoped serving change. | Selected. |

This is an engineering choice for the observed architecture, not a Google preference for one hosting pattern.

## 5. Canonical family map

All accepted page URLs use `https://marketdeck.in`. Expected eligible response is anonymous HTML 200, with exactly one matching canonical and no noindex in HTML or headers. Other statuses remain audit evidence, never sitemap rows. External provider access is forbidden for EVERY producer below. DB means the owner's database only.

| Family | Source and shared eligibility | Canonical / pagination | XML group | DB | Initial page lastmod |
| --- | --- | --- | --- | --- | --- |
| WEB-01/02 | Explicit approved root/credits source and built output | `/`, `/credits/`; no query identities | web | No | Omit unless a substantive source revision date is maintained |
| INT-01/02/05 | Editorial generator, approved substantive collection/policy output | `/intelligence/`, `/intelligence/issues/`, `/intelligence/editorial-policy/` | intelligence | No | Omit collection dates initially |
| Proposed INT-09 | `libraryPage()` and catalog; explicit policy reconciliation required | `/intelligence/library/` | intelligence | No | Omit initially |
| INT-08 | `LEARNING_HUBS`; required learning-path entries and at least two published relevant guides | Three source-registered hub paths, not every topic | intelligence | No | Omit until collection-change evidence exists |
| INT-03 | Both article metadata and briefs publication/approval gates, valid source and generated article | `/intelligence/notes/{slug}/` | intelligence | No | Verified `modifiedAt`, otherwise omit |
| INT-04 | Published and approved briefs issue, valid HTML and required assets | `/intelligence/issues/{slug}/` | intelligence | No | Verified `lastUpdated`, otherwise omit |
| INT-06/07 | Companion PDFs are B; drafts/review output excluded | HTML is preferred; no PDF or draft entry | None | No | Not applicable |
| SP-01/12–17/21 | `PAGE_SEO`, clean explanatory landing and family-specific substantive-content check | Eight clean named routes; no selected calculator/compare/SAST state | stockproof-catalog | Some coverage checks | Omit initially |
| SP-08 clean | `screener_seo()` plus clean explanatory screener | `/screener/screener/` | stockproof-catalog | Coverage read | Omit initially |
| SP-02 | Actual browse population: Company with a usable latest snapshot row, deterministic ticker ordering | `/screener/companies/`, then `?page=N`; non-empty real pages only | stockproof-catalog | Yes | Omit initially |
| SP-09 | Active scheme directory population, existing stable ordering | `/screener/funds/`, then `?page=N`; not the smaller detail-eligible set | stockproof-catalog | Yes | Omit initially |
| SP-11 | Actual EtfListing directory population and stable ordering | `/screener/etfs/`, then `?page=N` | stockproof-catalog | Yes | Omit initially |
| SP-03 | Real Company and snapshot OR annual OR quarterly history, through shared overview gate | Named `company_detail` reversal, source ticker | stockproof-companies | Yes | Omit initially |
| SP-04 | Same annual-first/snapshot-fallback statement sources and populated-cell predicate as view; zero is data | Named `statement` reversal for the three registered statement slugs | stockproof-companies | Yes | Omit initially |
| SP-05 | Sector exists; rendered target and at least one rendered other company have snapshots | Named `peer_comparison` reversal | stockproof-companies | Yes | Omit initially |
| SP-06 | `company_facts.company_trace_score()` / shared inputs; composite exists and not below floor | Named `quality_score` reversal; no alternate formula | stockproof-companies | Yes | Omit initially |
| SP-10 | Active real scheme, code/name, at least two non-null stored NAV points, latest NAV/date | `/screener/funds/{scheme_code}/`; one identity for MF and ETF, preserve plan/option source IDs | stockproof-funds | Yes | Omit initially |
| SP-07 | `PRESET_SCREENS`, same evaluation/result ordering as rendered preset; page-one explanatory empty state remains allowed | `?screen=key`; real later pages `?screen=key&page=N`; no hard-coded count | stockproof-catalog | Yes for current result pages | Omit initially |
| CH-01/05/06 | Three `PAGE_SEO` routes, with substantive breadth/leaderboard evidence | `/charts/`, `/charts/breadth/`, `/charts/leaderboard/` | charting | Some coverage checks | Omit initially |
| CH-04 | Source-owned recognized/public-approved instrument and at least two distinct daily bars; reconcile cache and extra-symbol approval | `/charts/{canonical_symbol}/`; aliases not listed | charting | Yes | Omit initially |
| FO-01/02/03/05–09 | Eight `PUBLIC_PAGES`; clean explanatory/data landing as appropriate | Fixed `/futures-and-options/...` named reversals | fo | Some coverage checks | Omit initially |
| FO-04 | Supported candidate plus usable persisted snapshot through shared rendered-chain predicate; never a vendor probe | `/futures-and-options/analytics/chain/{symbol}/`; no expiry/window expansion | fo | Yes | Omit initially |
| COM-01/02/03 | Acquisition registry; market/coverage source scope and data evidence; clean route only | `/commentary/`, `/commentary/citations/market/`, `/commentary/citations/coverage/` | commentary | Some coverage checks | Omit initially |
| CR-01–11/14 root | The twelve original stable routes, shared per-family substantive-content gates | Source-owned named reversal; only `/crypto/pulse/`, not dated Pulse | crypto-pages | Some coverage checks | Omit initially |
| CR-13/15/16/18 | Ten `tool_landing` registry entries; substantive clean forms/explanation | Clean compare, calculators, compliance and portfolio landings | crypto-pages | Some page reads | Omit initially |
| CR-12 | `is_eligible_coin_entity()` and latest snapshot ordered by `-fetched_at,-pk`; exact source ID | `/crypto/coins/{coingecko_id}/` | crypto-coins | Yes | Omit initially |
| All C/D/E and remaining B/F | Owned category/exclusion/remediation records, not private-table scans | Canonical null where none legitimately exists; no auth/token/result/export URLs | None | No private reads | Not applicable |

Retirement applies at the owning source: deleting or disabling an entity, failing its shared content gate, withdrawing publication or removing an approved registry key removes admission on the next validated generation. Keep the exclusion/reason in the private audit ledger. A URL that becomes known-private or explicitly withdrawn triggers immediate revocation handling, not ordinary stale retention. Page access/noindex/404/410 behavior must also be correct; removing a sitemap entry alone does not remove a page from Google.

## 6. Query and identity rules

Only directory `page=N` and approved StockProof `screen=key` plus real `page=N` are identity-bearing queries in v1. Prefer no `page=1`, ASCII normalized positive integers, deterministic `screen` then `page`, no duplicate keys, and no fragments.

Tracking, display variants, comparisons, calculator inputs and all arbitrary queries are never enumerated. Existing approved display variants may continue canonicalizing to clean pages; this is not permission to emit them as additional inventory. Preserve legitimate double mounting of `/screener/screener/`. Reverse in each application, normalize its configured script prefix once, apply its trusted public mount once, and test mounted and unmounted execution. Never infer public origin from Host or historical email settings.

MF/ETF detail deduplication is by scheme code, not name or exchange symbol. Coin identity is the stored source ID, not a symbol-to-slug guess. No universe is produced by scraping arbitrary links; links are discovery evidence only.

## 7. Protocol and independent evidence

Use the 24 record fields in inventory-contract.md and the accompanying `inventory-v1.schema.json`. Source-only exporters leave `deployed_sha`, `last_verified_at` and Google observations unclaimed unless independently supplied by verified evidence. `declared_canonical` is the expected source declaration, not a claim that production HTML was fetched. `sitemap_membership` and inbound-link state start unknown when unobserved.

Envelope v1 adds: schema version, run ID, UTC generated time, generator version, environment, producer, source revision, source snapshot IDs, complete/failed enumeration status, safe error codes, record count and records SHA-256. Failure is explicit and cannot publish a successful-looking partial record array. Valid empty data and failed data are different states.

Deterministic record order is canonical URL (null last), repository, route and source identifier. The digest covers the ordered record array encoded as UTF-8 JSON with sorted object keys, no insignificant spaces, literal Unicode, JSON control-character escaping, and no NaN/Infinity. The Python reference is `json.dumps(records, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False)`. V1 provenance uses ASCII object keys and JSON-safe integers rather than floating-point facts. JavaScript producers must match test vectors rather than assume arbitrary JSON serialization is equivalent.

Structural schema checks do NOT prove canonical equality, declared counts/hashes, route approval, uniqueness, absence of private data or live correctness. Mandatory semantic validation checks those separately. Public XML contains only `loc` and an optional justified `lastmod`, never the 24-field records.

Store source inventory, live observations and Google observations separately, then reconcile. A new source export must not erase a previous inspection record or invent a new inspection date. Runtime deployment identity and source revision are separate. Database snapshot IDs, code revision, installed source-registry version and eligibility-rule version belong in provenance, without environment values, tokens or raw DB URLs.

Read one consistent owner-local snapshot. PostgreSQL implementations should use a bounded read-only repeatable-read transaction; SQLite implementations need a consistent read transaction. Do not claim transaction-wide consistency from an ordinary default read-committed block. No model writes, migrations, ingestion, caches that mix data generations, or private user/session/token reads are allowed in an exporter.

## 8. XML and serving layout

Ten logical groups initially: `web`, `intelligence`, `stockproof-catalog`, `stockproof-companies`, `stockproof-funds`, `charting`, `fo`, `commentary`, `crypto-pages`, `crypto-coins`.

Physical file pattern: `/sitemap-{group}-{part:04d}-{sha256_of_xml}.xml`. The root `/sitemap.xml` points directly to these URL sets. Use one file per non-empty group until its size requires splitting. Engineering split limits are 10,000 URLs OR 10,000,000 uncompressed UTF-8 bytes, whichever is reached first; these are conservative project limits, not Google's maxima. No empty group files and no nested indexes.

Root-level child files deliberately avoid a dependency on Search Console overriding subdirectory scope. There is no need for a `/sitemaps/` directory containing siblings from unrelated mounts. Use proper XML serialization, including one escaping pass for ampersands in source tickers and identity queries. Do not double-percent-encode route reversals. Do not emit priority/changefreq or unsupported schema extensions.

Proposed host paths, subject to the fresh mount check:

- public XML: `/opt/factory/seo-public/`
- private state/staging: `/opt/factory/seo-state/`
- Caddy read-only mount of public XML: `/srv/marketdeck-seo/`

Do not write generated runtime state inside `marketdeck-web/public`, an app checkout, or platform-core. Add a narrowly matched Caddy handler for `/sitemap.xml` and generated `/sitemap-*.xml` names before the existing static fallback. The private state directory is NEVER mounted into Caddy. Validate adapted Caddy configuration before reload and keep a rollback backup. Preserve product mounts, robots.txt, www redirects and all application traffic.

## 9. Atomicity, freshness and failure

1. Lock the coordinator. Capture active container/image and publisher revision identities; reject unsupported protocol or eligibility-rule versions.
2. Collect a complete producer artifact with timeout and sanitized error codes. No central vendor or DB credential access.
3. Validate schema, checksums, record count, family coverage, source/policy approval, URI/query contracts and same-owner mount boundaries. Do not silently deduplicate conflicting A records.
4. Join separately collected technical observations and approval state. At initial activation, every admitted URL requires successful anonymous verification; unverified candidates stay visible outside the published set.
5. Build content-addressed URL sets in staging. Validate both URL/byte limits after XML escaping, parse XML independently, and check index-to-child completeness.
6. Copy complete immutable children to the public store, fsync them, and atomically replace the root index on the SAME filesystem. A failed step leaves the previous root index intact.
7. Save a private release manifest, producer generation map, reconciliation report, revision evidence and rollback pointer.

Per-owner complete generations isolate failures. A failed producer may retain its last compatible, still-approved generation under an explicit bounded stale policy while unrelated successful owners advance. Never mark that producer fresh. Proposed operational defaults: collect hourly and after successful deployment/ingestion/publication; warn after two missed expected runs, stop accepting new URLs from that owner immediately, and escalate retained state after 24 hours. The stale deadline for each family must be reviewed against observed data/update cadence before production activation; it is NOT a new market-data eligibility cutoff.

Known unpublishing, privacy violations, revoked approvals or incompatible rule changes override last-known-good. Rebuild the current index and revoke retained child files containing withdrawn URLs; do not serve a knowingly unsafe historical XML just to preserve a hash. Retain otherwise-safe superseded XML for at most 30 days to handle clients holding an older index. Never roll back to an artifact invalidated by a revocation. A stale timer alone must not silently drop an entire product: record an owned decision and show degraded status.

Initial HTTP cache policy: root index max-age 60 seconds; child files max-age 300 seconds with revalidation. Longer caching requires a reviewed withdrawal policy. Hashes and child lastmod change only when the serialized XML actually changes. These are engineering defaults subject to deployment measurement.

Availability is temporal: validation proves an observation at a recorded time, not that a URL can never later fail. Temporary HTTP failures trigger investigation/retries, not an automatic mass declaration that valid entities have ceased to exist.

## 10. Honest lastmod

Initially omit lastmod for dynamic entities, collections, directories, presets and tool landings unless a source-owned substantive-change timestamp is proven. A fetch timestamp, a daily-bar trading date, a latest child timestamp or deployment time alone does not reliably capture corrections, removals and all displayed content changes.

Use validated article `modifiedAt` or issue `lastUpdated` where they match substantive editorial updates. Do not substitute approval time or source-review time. Collection lastmod later needs a content/membership fingerprint that detects removals as well as additions. A later shared content-fingerprint ledger may supply first-observed substantive-change times, clearly recorded as such and never backdated. XML index child-lastmod, if used, is the time that child's bytes changed, not the page's date.

Companion issue PDFs remain B and absent from acquisition XML. Add the correct HTTP Link canonical to their HTML issue during lifecycle work; this is MarketDeck's chosen duplicate policy, not a claim that Google cannot index PDFs.

## 11. Readiness register and acceptance

| ID | Required work | Interim accountable owner |
| --- | --- | --- |
| INV-01 | Complete StockProof entity, valid-directory and actual-preset-page enumerators; parity and bounded DB work | StockProof engineering |
| INV-02 | Charting uncached recognition/approval parity and public-label/provenance rule for extras; keep recognized-but-unapproved records visible as F | Charting engineering + SEO lead |
| INV-03 | F&O persisted `MarketSnapshot` eligibility shared with rendered semantics; candidate is not eligibility; preserve provider/compliance gates | F&O engineering |
| INV-04 | Commentary COM-02 query boundary and substantive clean-page coverage; separately track operational-status access control | Commentary engineering |
| INV-05 | Review data-driven static-landing coverage gates and unresolved freshness policy; do not invent a looser sitemap-only rule | Each product owner + SEO lead |
| INV-06 | Explicit library-family policy amendment, editorial unpublish/orphan tests and retirement of old root writer | Web/editorial engineering |
| INV-07 | Running-image/source attestation, fresh Caddy/Compose check, persisted artifact mount and rollback test | Release engineering |
| INV-08 | Full production dry-run census, technical URL verification, all eight reconciliation differences and owned exceptions | SEO lead |

The three previously reported Charting baseline test failures are separate test debt; reproduce the baseline comparison and introduce no new failures. SEO tests are not a financial or legal correctness audit of tax tools. SEC-001 remains separate and no credentials may enter this work.

Preserve all five sets from inventory-contract.md: expected candidates, approved eligible canonicals, deployed sitemap URLs, crawlable public inbound targets, and live-verified canonicals. Compute all eight defined directional differences. Do not inflate coverage by deleting hard candidates. Zero approved denominator is not_applicable, not 100%. Every discrepancy requires owner, evidence, revision, first/last seen and next action; suppressions need a reason and expiry.

## 12. Verification and rollout

Unit tests: shared gate parity, source ordering, missing-data and retirement states, snapshot selection, canonical construction under both mounts, duplicate keys, XML escaping, count/hash correctness, cross-owner URLs, foreign origins, private/action routes and publication gates. Block network access in these tests.

Integration tests: deterministic exports from synthetic DB fixtures; failure versus empty; stable directory/preset boundaries; all expected families accounted for; atomic publication failure injection; index-to-child validity; safe retention/revocation; no stale rollback after privacy withdrawal; producer version mismatch; restart recovery; concurrent runs.

Production verifier: anonymous actual GET responses, no session cookies or submissions; check status before redirects, HTML and X-Robots-Tag, canonical count/equality, entity identity, meaningful content, internal anchors and public robots access. Titles or accessibility trees alone do not certify canonical/noindex. Cap request rate and concurrency, stop/back off on 429/5xx, and explicitly budget provider-triggering routes. Never bypass compliance or introduce crawler-specific content. Inventory enumeration itself remains provider-free. Expand this same verifier in SEO-011 rather than building a second crawler.

Release order: protocol and test vectors; owner adapters in parallel; web producer/publisher; isolated fixture tests; redacted VPS preflight; production dry-run and baseline counts; gate reconciliation; full initial technical verification; stage XML; validate scoped Caddy change; atomic activation; external recheck; Search Console submission. Until activation the existing 20-URL sitemap remains untouched.

Plan for five local Django adapter tasks and one web/publisher integration task for SEO-008. The central pure publisher may be implemented/tested from chat, reducing Codex authoring but not eliminating runtime acceptance. Budget later discovery/schema work separately and measure performance before estimating repairs. Do not promise a fixed total number of repair tasks or guaranteed indexing.

## 13. Current official Google requirements

Checked 2026-09-24. Google documents a 50,000-URL or 50 MB uncompressed limit per sitemap, UTF-8, fully qualified URLs and XML escaping. It recommends canonical URLs and accurate significant-update lastmod; priority/changefreq are ignored. Root-level placement avoids the default descendant-path scope restriction. Submission is a hint, not an indexing guarantee. [G1]

An index can reference up to 50,000 sitemap files, with same-site and same/deeper-directory requirements unless an appropriate cross-site arrangement exists. An index must not point to another index. [G2, G3]

Keep redirects, canonical declarations and sitemap preferences consistent. Google supports HTTP canonical links for non-HTML documents. [G4] Robots disallow does not implement noindex and can stop Google reading it. [G5] HTTP 200 alone is not a quality/indexing guarantee; use truthful invalid/error statuses. [G6] Sitemap discovery and recrawling take time; Search Console observations must be obtained rather than inferred. [G3, G7]

- G1: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- G2: https://developers.google.com/search/docs/crawling-indexing/sitemaps/large-sitemaps
- G3: https://support.google.com/webmasters/answer/7451001
- G4: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- G5: https://developers.google.com/search/docs/crawling-indexing/block-indexing
- G6: https://developers.google.com/crawling/docs/troubleshooting/http-status-codes
- G7: https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl

## 14. Source evidence ledger

Resolve these paths at the audited revisions in section 2, not at an unrecorded moving branch:

- marketdeck-web: `docs/seo/url-policy.md`, `docs/seo/inventory-contract.md`, `scripts/editorial.mjs`, `scripts/articles.mjs`, `scripts/intelligence.mjs`, `content/briefs.json`, `content/articles/metadata.json`, `public/sitemap.xml`, `public/robots.txt`, `.github/workflows/deploy.yml`.
- stockproof: `screener/seo.py`, `screener/views.py` (browse, detail, statements, peers, Trace, funds), `screener/company_facts.py`, `screener/fund_returns.py`, `Dockerfile`, `.github/workflows/deploy.yml`.
- charting-v1: `charting/seo.py`, `watchlist/universe.py`, `charts/services.py`, `requirements.txt`, `.github/workflows/deploy.yml`.
- fo-analytics-v1: `foanalytics/seo.py`, `analytics/views.py`, `analytics/services.py`, `analytics/market_snapshot.py`, `analytics/datasource.py`, `requirements.txt`, `.github/workflows/deploy.yml`.
- market-commentary-v1: `marketcommentary/seo.py`, `.github/workflows/deploy.yml`, and the COM rows of the Constitution.
- crypto-tools-v1: `crypto/seo.py`, `.github/workflows/deploy.yml` and the CR rows of the Constitution.
- Historical host evidence: user-provided 2026-09-23 routing/Compose/deploy inspection transcripts. Fresh host verification is explicitly outstanding; no secret-bearing configuration is reproduced here.

This architecture adds no acquisition URLs by itself. The schema and documentation branch must not be mistaken for a deployed inventory service.
