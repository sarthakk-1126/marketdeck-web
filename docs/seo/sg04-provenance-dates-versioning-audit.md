# SG-04A / SG-04H / SG-04I closeout audit

Review date: 2026-09-26  
Scope: StockProof, F&O Analytics, Charting, Crypto World and MarketDeck Intelligence  
Calculation inventory dependency: `docs/seo/sg04-methodology-audit.md`

This audit records public interpretation contracts. It does not change source ownership, claim independent verification of upstream observations, or grant redistribution rights.

## SG-04A — material public provenance

| Product / output family | Provenance class | Named origin | MarketDeck operation | Public boundary |
|---|---|---|---|---|
| StockProof company financials, filing facts and ratios | Primary filing / exchange | Company submissions published through NSE corporate-filings records | Store and normalize reported facts; derive ratios | Source Trace retains period, basis and evidence. Derived ratios are not exchange-published figures. |
| StockProof prices, market cap and technical measures | Exchange observation / provider | Source and observation time shown with the stored series | Apply documented formula to stored observations | Stored is not live; the product is not a bulk replacement for an upstream feed. |
| StockProof mutual-fund records | Provider / historical archive | AMFI-published scheme, NAV and performance records where identified | Retain identifiers and observation periods; calculate documented comparisons | Restated history and missing successor mappings remain source limitations, not estimates. |
| StockProof scores, ranks, portfolio metrics and calculators | MarketDeck-derived / user input | Filing, market or user-entered inputs named by the output | Apply the stable product method | No score is represented as an exchange, filing or provider recommendation. |
| F&O current chain, quotes and paper marks | Provider | Kite Connect when the enabled live-session path is usable | Create time-stamped chain snapshots; derive IV, Greeks, PCR, max pain and strategy measures | A stored snapshot cannot be reused as an execution fill; model outputs are not provider probabilities. |
| F&O replay, settlement, seasonality and liquidity | Exchange / historical archive | NSE F&O Bhavcopy and exchange settlement fields | Use recorded trades or explicitly labelled settlement marks over the selected dates | Untraded rows are not converted to trades; missing contracts stop the calculation. |
| F&O corporate actions and dividend assumptions | Exchange record | NSE-published corporate-action observations | Inform displayed adjustments or assumptions | No adjustment factor or zero dividend is invented when evidence is missing. |
| F&O pricing, probability, payoff and risk | MarketDeck-derived / user input | Displayed market inputs and strategy assumptions | Apply documented models | Not an exchange probability, empirical win rate or executable quote. |
| Charting OHLCV, index and breadth inputs | Exchange observation / provider / historical archive | Stored NSE instrument and benchmark series supplied through the identified path | Align observations and derive indicators, breadth and returns | Derived readings are MarketDeck outputs. Missing dates and insufficient history are excluded, not filled. |
| Charting leaderboards, scans and evaluations | MarketDeck-derived | Stored price series and visible rule/window | Rank or evaluate under the documented method | A rank or historical result is not exchange research or a recommendation. |
| Crypto coin markets and history | Provider | CoinGecko; Binance where identified | Store/record observations and derive documented measures | Each result inherits source timestamps; provider attribution does not imply endorsement or unrestricted redistribution. |
| Crypto protocol TVL, fees and revenue | Provider | DefiLlama | Aggregate eligible records or calculate stated multiples | A MarketDeck multiple is not relabelled as provider-published valuation. Provider-specific attribution remains visible. |
| Crypto India premium and cross-market comparison | Provider / venue | Applicable Indian venue, global USD source and identified FX input | Combine separate time-stamped inputs | Stale or incompatible combinations are unavailable, not estimated. |
| Crypto NIFTY comparison | Exchange observation / historical archive | Stored NIFTY 50 closes | Align shared historical dates and calculate returns/correlation | Historical series is not represented as a live index feed. |
| Crypto tax, portfolio and scenario tools | User input / MarketDeck-derived | Entered records plus displayed regime and formula | Calculate labelled scenarios | Not a tax filing, assessment or source-provider calculation. Product-specific tax wording remains authoritative. |
| Intelligence factual and time-sensitive claims | Primary source / filing / exchange / provider / research paper | Per-article linked source list | Attribute, summarize or calculate from cited inputs | Reported research is not claimed as independently replicated; source review is not an authority signal. |
| Intelligence examples, diagrams and interpretation | MarketDeck-derived / hypothetical | Explicitly cited inputs or labelled synthetic values | Produce reproducible educational examples | Hypothetical values are not live, stored or historical observations. |
| Intelligence archive content | Historical archive | Published MarketDeck issue/article plus its cited sources | Preserve publication and substantive revision history | Archive age is not disguised as current market data. |

Result: each stable product methodology now contains a visible product-specific provenance register. StockProof Source Trace and all existing per-page source/venue/provider disclosures remain the more specific evidence record.

## SG-04H — date-field comparison

| Date surface | Authoritative value | Visible / machine-readable comparison | Rule after closeout |
|---|---|---|---|
| Canonical page metadata | Preferred URL only | Canonicals do not encode freshness and remain unchanged by date work | No freshness inference from canonical creation/deploy time. |
| Article visible publication date | `content/articles/metadata.json:publishedAt` when present | Rendered through `<time datetime>` from the same field used by Article JSON-LD `datePublished` | First publication only; never deploy time. |
| Article visible modified date | `content/articles/metadata.json:modifiedAt` | Rendered through `<time datetime>` from the same field used by Article JSON-LD `dateModified` | Substantive content/method/correction changes only. The former hard-coded visible date was removed. |
| Structured data | Article metadata | `datePublished` is omitted when the legacy item has no recorded publication value; no date is guessed. `dateModified` is required by the current article contract. | Visible and JSON-LD values must match exactly. |
| Sitemap dates | Central inventory content-event publisher | Existing canonical inventory and event-derived `lastmod` are verified after production publication | A cosmetic site build must not advance `lastmod`. Methodology closeout may emit a substantive change event only for pages actually changed. |
| Atom/feed dates | Intelligence publication/content event | Feed is outside product methodology templates | Unchanged unless a published editorial entry itself changes under the feed contract. No method-page deploy timestamp is inserted. |
| Source-review dates | Per-source `reviewedAt` or issue source record | Visible beside the cited source | Records when the source was checked, not when the source was published or the article modified. |
| Filing/publication dates | Product Source Trace or cited primary source | Retained with the filing/article evidence when known; omitted when unknown | Never inferred from retrieval time. |
| Market/data as-of timestamps | Product/provider observation | Stays beside the output or in its page-level state label | Never replaced by method review, page publication or deploy time. |
| Method review/effective date | Stable methodology destination | Visible `<time datetime="2026-09-26">` on each of the five method pages | Describes method review only; does not imply refreshed upstream data. |

## SG-04I — version convention and public history

Convention: `PRODUCT-METHOD-major.minor`.

- Major: changes a formula, denominator, model basis, eligibility rule, core source role or assumption in a way that can change interpretation.
- Minor: adds an interpretation-sensitive method or materially clarifies scope without redefining existing results.
- No public version change: copy/style edits, tests, infrastructure, dependency refresh, monitoring or ordinary deployment.
- Stable methodology URLs remain unchanged.
- Stored historical outputs retain the method identifier that produced them when the product persists that relationship; they are not silently relabelled.

Baseline identifiers:

| Product | Stable URL | Identifier | Effective |
|---|---|---|---|
| StockProof | `/screener/methodology/` | `SP-METHOD-1.0` | 2026-09-26 |
| F&O | `/futures-and-options/methodology/` | `FO-METHOD-1.0` | 2026-09-26 |
| Charting | `/charts/methodology/` | `CH-METHOD-1.0` | 2026-09-26 |
| Crypto | `/crypto/methodology/` | `CR-METHOD-1.0` | 2026-09-26 |
| Intelligence | `/intelligence/methodology/` | `INT-METHOD-1.0` | 2026-09-26 |

The public append-only baseline and future change-history policy live at `/research-standards/#methodology-versioning`.

## Acceptance invariants

- No `platform-core` file or deployment is in scope.
- Product-specific source, tax, archive, execution, Source Trace and licensing wording remains authoritative.
- Missing values remain unavailable; no source, date, authority or freshness claim is fabricated.
- Robots, Atom and IndexNow behaviour are not intentionally changed.
- GA4 remains canonical-only and exactly once per canonical page.
- Sitemap inventory changes only if the authoritative canonical inventory changes; this closeout adds no new URL.

