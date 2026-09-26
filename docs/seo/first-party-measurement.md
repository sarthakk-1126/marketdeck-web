# Phase 3 first-party search / AI measurement contract

## Accounting rule

Google's Generative AI performance report for Search covers AI Overviews and AI
Mode. Google states that these impressions are included in the normal Web
Search Performance report. Therefore:

- Web impressions remain the headline Google Search total.
- Search Generative AI impressions are a subset of Web impressions.
- Never compute `web + search_genai`.
- A useful derived metric is `search_genai / web` when both values are known.
- If the Generative AI report is unavailable or below reporting thresholds,
  store that state explicitly; do not silently convert it to zero.

The same subset rule applies to Google's multimodal Search reporting when it is
reported inside Web Search performance.

## Current MarketDeck baseline

As of the SG-03B probe on 2026-09-26:

- Search Console settled through 2026-09-23.
- Last 28 settled days: 0 Web clicks and 0 Web impressions.
- Standard Search Console API query grouped by `searchAppearance`: no rows.
- The connected GSC Wizard does not currently expose the dedicated Google
  Generative AI report as a first-class MCP method.
- MarketDeck's Google Search generative-AI control remains Include.

This is an explicit no-observed-data state, not proof that the site can never
appear in AI Overviews or AI Mode.

## Private snapshot

Use `scripts/seo/first_party_measurement_snapshot.py` to normalize first-party
exports into a private snapshot. The script preserves the subset relationship
and refuses impossible values such as AI impressions greater than Web
impressions for the same reporting window.

The private production snapshot belongs under
`/opt/factory/seo-state/` with mode 0600.
