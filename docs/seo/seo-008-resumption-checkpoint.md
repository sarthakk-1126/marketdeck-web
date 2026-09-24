# SEO-008 resumption checkpoint — 2026-09-24

Status: architecture/protocol branch only. No new production sitemap, deployment, application change or Search Console submission.

## Saved work recovered

Draft PR #16 and readiness issue #17 survived the interrupted session. Do not recreate either. The six application/default refs were reread and still match the audit revisions in `seo-008-architecture.md`. The original schema and test files were reconstructed in an isolated environment and matched their exact Git blob SHAs before execution:

- `inventory-v1.schema.json`: `de170fbee89669fb54582a585eef3da7de7bc8ed`
- `test_inventory_schema.py`: `81951b16fbad7d0666c26a607e350138d5c7d687`

Original schema tests rerun: 16 passed.

## Additional implementation completed

Added `inventory_protocol_reference.py` and `test_inventory_protocol.py`. These complement JSON Schema with deterministic encoding, ordered records, declared count/digest checks, duplicate record/canonical detection, producer ownership, A-record canonical equality, and complete-versus-failed handling.

Run from this directory:

```sh
python -m unittest test_inventory_schema test_inventory_protocol -v
```

Result in the isolated chat test environment: 33 tests passed. Python compilation passed. The exact new Git blobs match the tested local bytes:

- `inventory_protocol_reference.py`: `d9b070c5893658b4e658c8c470a7e9aa439fe1f7`
- `test_inventory_protocol.py`: `745d3f564b609ba6b0466ce48ce4873021477839`

These are NOT Django, production, database, browser or Google tests. The reference is not a public-URL approval system. A test intentionally demonstrates that a schema-valid private-route URL still requires rejection by the publisher's family allowlist. No consumer should interpret a successful integrity check as permission to publish.

## Serialization clarifications before producer implementation

The 24 record fields and schema version remain unchanged. For interoperable v1 encoding:

- JSON object keys are ASCII and lexically sorted; string values preserve original Unicode without normalization.
- Integers are restricted to the exact JavaScript/Python shared range, `-(2^53-1)` through `2^53-1`; represent larger source identifiers as strings. Floats, NaN and Infinity are forbidden in provenance.
- Reject duplicate JSON keys and lone Unicode surrogates.
- Record ordering uses Unicode code points, not locale-dependent collation. Canonical null sorts last; after the other identity keys, public identifier null sorts before a present identifier.
- Hash the exact deterministically ordered record array. Do not silently reorder an incoming artifact before validating its claimed hash/order.
- Finalization copies records and only supplies ordering/count/hash. It must not manufacture eligibility, source freshness, deployed revision, live observations, inbound links or Google state.

Do not copy this file into `finance-data-core` or make product builds depend on a sibling checkout. Product adapters can use a pinned copy of the small reference or an independently tested implementation with identical vectors. Record the reference revision in their implementation documentation.

## Additional documentation/source reconciliations

The Constitution remains authoritative, but several older rows are underspecified relative to the explicitly approved later implementation batches. Record amendments visibly; do not reverse deployed behavior merely to match a stale sentence.

1. SP-09 and SP-11 currently use the word `consolidates` for filters/order in the old table. SEO-003D explicitly implemented utility `noindex` with no canonical for semantic filter/order states, with explicit default ETF `order=name` consolidation. The source confirms that behavior. Clean directory pages are the only sitemap candidates, so this wording discrepancy does not justify publishing any filter state.
2. SP-08 describes arbitrary screener state as C but only hints at the clean tool landing. SEO-003E explicitly approved the clean explanatory screener as A. Record clean-versus-result states separately under the family; do not omit the clean landing or admit its arbitrary result pages.
3. SP-21 mentions `tickers`; the current view actually uses repeated `ticker`. This is a source-name correction, not permission to enumerate comparisons.
4. INT-09 library remains a proposed explicit family registration for an already-generated, already-listed public page. Do not pretend the amendment is merged; do not invent replacement URLs.
5. COM-02 is a real code/policy mismatch, not only stale wording: `metadata_for_route(view_name)` does not inspect date/window/channel request state. Fix the selected-state boundary in the Commentary readiness batch while preserving clean public routes.

Evidence: `marketdeck-web/docs/seo/url-policy.md` at `58c0ba7ab76fcd7d5ee1a3ea51a51471dd635984`; `stockproof/screener/views.py` and `screener/seo.py` at `ec954c5b284f530e76b7f9bc9583ec29aa8cb949`; `market-commentary-v1/marketcommentary/seo.py` at `ca29c7b986226d8c5ba5fd2d1598a58c4fa6c4c8`; the recorded approved SEO-003D/E/F tasks.

## Official documentation rechecked

Google's build-sitemap, large-sitemaps, Sitemaps report, canonicalization, noindex, HTTP-status and recrawl documentation were opened again on resumption. The selected flat XML layout, canonical-only listing, conservative lastmod and no-indexing-guarantee distinctions remain supported. The choice of central persistent static delivery is MarketDeck's engineering decision, not a Google requirement.

## Next executable work

Begin the StockProof read-only inventory producer in a local, tested checkout from `ec954c5b284f530e76b7f9bc9583ec29aa8cb949`. It must cover public source candidates and their exclusions, directory population/pagination, entity gates and real preset pagination without private-table reads, vendors, publishing or deployment. Treat unresolved content-approval questions as visible pending/F records rather than dropping them or loosening a page gate.

In parallel, obtain a redacted read-only VPS check of current source revisions, running image identities and Caddy mounts. Host Git HEAD is not evidence of the revision inside a running image. Opera still reported disconnected on resumption. No full production URL census or post-deploy head-tag certification is claimed.

Keep the root sitemap and all application default branches unchanged until the coordinator, producers, admission checks, rollback/revocation handling and production cutover gates pass.
