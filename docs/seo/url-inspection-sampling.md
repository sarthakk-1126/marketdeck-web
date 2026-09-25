# SG-03E — Google URL Inspection stratified sampling

MarketDeck has 12k+ approved canonicals, so URL Inspection is sampled rather than
used as a brute-force index checker.

Google's official Search Console API limits currently state:

- URL Inspection per site: 2,000 queries/day;
- URL Inspection per site: 600 queries/minute.

The MarketDeck default sampling budget is deliberately **200 URLs/day**, leaving
substantial quota for debugging and manual investigations.

Domain property:

`sc-domain:marketdeck.in`

The URL Inspection API returns information about Google's indexed version. It is
not equivalent to the Search Console **Test live URL** action.

## Cohort priority

The planner assigns each URL once, using this priority:

1. problematic;
2. newly published;
3. recently changed;
4. explicitly high-value;
5. stratified coverage.

Problematic state comes from prior inspection state only; crawler activity by
itself is not treated as an indexing problem.

New/changed state comes from the publisher's immutable canonical change events.

High-value URLs are explicitly versioned in:

`docs/seo/url-inspection-high-value.json`

The remaining budget is filled using deterministic round-robin coverage across
the publisher's canonical sitemap groups so StockProof's much larger population
cannot consume the entire sample.

The daily hash rotation changes the coverage sample over time while remaining
repeatable for the same UTC date.

## Private plan

Recommended output:

`/opt/factory/seo-state/url-inspection-plan-YYYY-MM-DD.json`

The plan contains ready-to-send request objects using:

- `inspectionUrl`;
- `siteUrl: sc-domain:marketdeck.in`;
- `languageCode: en-IN`.

The planner does **not** perform network calls or require Google credentials.
OAuth/API execution is a separate controlled step so credentials never enter
Git or chat.

## Acceptance

- only current Class A/sitemap-eligible canonicals may be sampled;
- explicit high-value entries must still be eligible;
- withdrawn URLs are never sampled;
- daily budget can never exceed 2,000;
- default budget is 200;
- coverage is stratified across URL groups;
- result is deterministic for a given day and input state;
- output is private mode 0600.
