# MarketDeck public data-state vocabulary

This contract standardizes the words used when public MarketDeck pages describe
financial or market data. It does not replace product-specific disclosures.

## Preferred states

**Live** — obtained from an active provider/request/stream and current under the
product's stated freshness contract. When material, show the provider/source and
observation time. Do not call data “real time” unless that latency claim is
actually supported.

**Stored** — persisted by MarketDeck from an identified source. Stored does not
mean current. Show the source period/time where it changes interpretation.

**Snapshot** — a point-in-time capture. A snapshot is not live.

**Historical** — past observations, filings, results, or replay data used
descriptively. Show the relevant date or period.

**Stale** — the latest available stored observation is older than the product's
acceptable freshness boundary, or the source has stopped updating. Show the last
known observation/period.

**Unavailable** — no reliable value is available. Do not silently substitute
zero, an estimate, or a nearby observation.

## Provenance classes

- **Primary source** — issuer, regulator, exchange, filing, or another originating
  source for which MarketDeck has direct source evidence.
- **Provider** — a named external data provider supplying an observation/feed.
- **Derived** — calculated by MarketDeck from stated inputs. Method and denominator
  conventions must be discoverable.
- **Source-attributed commentary** — attributed to the underlying source rather
  than asserted as MarketDeck's own factual claim.
- **AI-assisted interpretation** — visibly separate from source-attributed facts.

## Vocabulary rules

- Prefer **stored** over **cached** for persisted user-visible data.
- Treat “real time” as a factual latency claim, not marketing copy.
- Never collapse stale/unavailable into zero.
- Derived values inherit the uncertainty and time-state of their inputs.
- Product-specific labels may be more precise, but must not contradict these
  definitions.

## Public-product implementation (2026-09-26)

- **MarketDeck / Intelligence** — the public Research Standards page exposes
  the shared definitions and stable anchors for every preferred state.
- **StockProof** — public filing, company, comparison and result copy uses
  **stored** for persisted data; existing filing periods, stale-price markers
  and unavailable reasons remain authoritative.
- **Charting** — the public shell already uses historical/as-of framing and has
  no user-visible persisted-data label that conflicts with this contract.
- **F&O** — live requests, stored snapshots, historical archives, not-live
  states and unavailable quotes remain distinct; the existing product-specific
  controls satisfy this vocabulary without copy changes.
- **Commentary** — persisted AI research outputs are described as **stored
  digests**; source-attributed commentary and AI interpretation remain separate.
- **Crypto World** — recorded market snapshots and stored order books remain
  distinct from browser-live prices; unavailable values are not rendered as
  zero.

Technical implementation text may still use terms such as cache or cached.
Those terms are not public data-state labels and must not leak into reader-facing
provenance or freshness copy.

