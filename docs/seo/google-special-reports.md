# Google Generative AI and Multimodal reporting — SG-03B / SG-03C

## Official report state

Google's Search Console Generative AI performance report covers impressions from
AI Overviews and AI Mode. Google says the report is rolled out worldwide, but a
property may not see it until it has enough qualifying impressions.

Google's web multimodal reporting was announced on 2026-09-24 and is rolling
out globally. It covers searches that begin with images, including Lens, Circle
to Search, image uploads to Google Search, and Chrome's "Search this image".
Google exposes it as a multimodal search-type filter in the normal Performance
report and in the Generative AI performance report.

## MarketDeck accounting contract

These reports are **subsets**, not new additive traffic totals.

- Normal Web Search impressions remain the headline Search total.
- Search Generative AI impressions must never be added on top of Web Search
  impressions.
- Multimodal Search impressions must never be added on top of Web Search
  impressions.
- When a report is unavailable or below Google's reporting threshold, store
  `not_observed` rather than silently converting the state to zero.
- When report values become available, record their share of the parent Web
  total for the same reporting window.

This is enforced by `scripts/seo/first_party_measurement_snapshot.py`, which
rejects a reported subset larger than its parent.

## Current MarketDeck state — 2026-09-26

At implementation time:

- Search Console standard Web Performance data settled through 2026-09-23.
- The then-current 28-day Web baseline contained no settled MarketDeck clicks
  or impressions in the connected API response.
- Standard Search Console API `searchAppearance` grouping returned no rows.
- GSC Wizard exposes the standard Search Console API but does not currently
  expose a dedicated Generative AI or multimodal MCP method.
- Therefore Search Generative AI and multimodal are recorded as
  `not_observed`, not zero.

This is a measurement-availability statement, not a claim that MarketDeck
cannot appear in those Google experiences.

## Ingestion path

The private first-party snapshot accepts separate normalized inputs for:

- `search_genai`;
- `discover_genai`;
- `multimodal`.

Until these special reports are surfaced through an API available to this
stack, their values can be supplied from the Search Console export. The
measurement contract remains stable regardless of transport.

## Source references

- Search Console Help: Generative AI performance report (Search)
- Google Search Central Blog, 2026-09-24: web multimodal Search performance
  reporting in Search Console
- Search Console Help: Search generative AI control

SG-03B and SG-03C are implementation-complete when this accounting/ingestion
path and explicit not-observed state are live. Data presence itself is not an
implementation prerequisite.
