# MarketDeck Phase 4 — finance/YMYL trust audit
Date: 2026-09-26

This audit records the existing trust controls before Phase 4 changes. The goal
is consistency and inspectability, not adding generic disclaimers everywhere.

## Executive finding

MarketDeck already has meaningful trust controls, but they are unevenly
distributed across products.

Strongest existing patterns:

- StockProof: filing/source trace, stale-price/period context, visible methodology
  and assumption panels, extensive calculation investigations.
- F&O: explicit live-vs-snapshot state, historical backtest framing, refusal to
  invent unavailable fills.
- Commentary: source-linked citation index, machine-transcript limitations,
  clear separation between attributed commentary and AI-generated interpretation.
- Crypto: provider attribution plus separate market-data and tax disclaimers.
- Intelligence: source-linked articles, synthetic-example labels, organizational
  authorship, AI-assistance disclosure, and a public editorial/corrections policy.

Main Phase-4 gap: there is no single public MarketDeck trust/methodology contract
that makes those conventions discoverable and consistent across all products.

## Roadmap matrix

| Item | State | Existing evidence | Remaining work |
| --- | --- | --- | --- |
| SG-04A primary-source/provenance | PARTIAL | StockProof Source Trace and filing evidence; Commentary citations; Crypto provider attribution | Standardize visible source/provenance presentation across Charting, F&O and other material data views |
| SG-04B methodology pages | PARTIAL | StockProof methodology panels and factor methodology; F&O backtest framing; Intelligence source methodology | Add stable public methodology destinations for material calculations where currently embedded only in UI/code |
| SG-04C timestamps / periods / state | PARTIAL | F&O “as of … IST — not live”; StockProof filing periods/stale markers; Charting as-of UI; Crypto snapshot wording | Define one cross-product vocabulary for live/stored/cached/historical/stale/unavailable and verify every material view |
| SG-04D calculation definitions / denominators | PARTIAL | StockProof assumptions panels; Intelligence worked examples explicitly discuss denominators; F&O/crypto deterministic calculators | Consolidate definitions for material calculations and make denominator conventions easy to find from outputs |
| SG-04E publisher / editorial / AI / corrections | PARTIAL | Public Intelligence editorial standards and AI-assistance disclosure exist | Surface a central MarketDeck research-standards destination from all public products; preserve correction limits honestly |
| SG-04F genuine authorship only | PASS | Intelligence schema uses MarketDeck organization; editorial policy says no fictitious expert review/credentials; no fake analyst identity is required by product pages | Preserve as a release invariant |
| SG-04G research vs personalized recommendations | PASS | StockProof AI Mode deterministically refuses security/advice/personal-book questions; F&O backtests/paper trading say not prediction/advice; Charting historical stats say not recommendation/signal; Commentary and Crypto carry visible boundaries | Preserve as a release invariant; do not weaken for growth copy |
| SG-04H visible vs machine dates | PARTIAL | Intelligence has source-reviewed/published/modified dates; product data often has as-of periods | Cross-check visible dates against schema/metadata and prevent cosmetic “freshness” dates |
| SG-04I methodology version identifiers | GAP | Individual documents are version-controlled, but no shared public methodology-version convention exists | Define stable version IDs for material methodologies and expose them where interpretation can change |

## Product observations

### StockProof
Current design is already close to the desired trust model. Results expose a
Data basis and Source Trace. Portfolio analysis exposes method name, window,
sample count, confidence and value basis plus methodology/assumption detail.
This should be the reference pattern for Phase 4.

### Charting
The product distinguishes historical statistics from recommendations and has
an as-of caption, but source/provider and data-state explanation is less
prominent than StockProof. The first implementation target is a compact
visible “Data basis” block for public acquisition pages.

### F&O
The strongest current control is state labeling: stored snapshots explicitly
say the time and “not live”, while outages are treated differently. Historical
replays also refuse to invent fills and clearly state that one realized
historical outcome is not a prediction. Phase 4 should expose stable
methodology/source destinations rather than rewriting this framing.

### Commentary
The citation index is already unusually explicit: it states that transcript
matching is automated, coverage is partial, and the product is not endorsing
mentions. AI interpretation and AI opinion have separate visible disclosures.
Phase 4 should preserve that separation and link to the central trust hub.

### Crypto World
Provider attribution is explicit where CoinGecko/Binance data appears, and
market-data snapshots are distinguished from tax calculations. Tax and market
disclaimers are intentionally separate. Phase 4 should standardize timestamps
and methodology/version links without collapsing these different risk domains.

### MarketDeck Intelligence
The editorial layer already supplies the site-wide policy foundation:
source-linked articles, hypothetical/synthetic-example labels, MarketDeck as
publisher, explicit AI assistance, no fabricated expert review, and correction
limitations. The next step is to make these principles discoverable from the
whole suite, not just Intelligence.

## Phase-4 implementation order

1. Public MarketDeck Research Standards / Methodology hub.
2. Link that hub from all six public shells without instrumenting private routes.
3. Standardize source + data-state vocabulary.
4. Add/normalize stable methodology destinations and denominator definitions.
5. Audit visible/machine-readable dates.
6. Introduce methodology-version IDs for interpretation-sensitive calculations.

## Non-goals

- no invented experts, credentials, review boards or testimonials;
- no generic disclaimer spam;
- no claims that provider data is “real time” unless the product actually knows
  it is live;
- no methodology version that changes merely because code was redeployed;
- no removal of product-specific disclosures where the domain-specific wording
  is materially important.
