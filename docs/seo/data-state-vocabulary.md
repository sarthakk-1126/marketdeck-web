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
