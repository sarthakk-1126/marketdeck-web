# SEO-008F — Web/editorial producer and central sitemap publisher implementation brief

Status: implementation brief for `seo/seo-008f-web-publisher`.  
Base protocol revision: `6e8f6be6f7bb03f21f00322cf0d38fc33e1f54a5`.  
Do not merge, deploy, alter Caddy, submit Search Console, or replace the live root sitemap in this task.

## Objective

Implement the final source-owned `marketdeck-web` inventory producer and the pure central validator/publisher described by SEO-008. This work must preserve the existing MarketDeck UI and application behavior. Unresolved INV-05 pages remain F/pending and cannot enter public XML.

The current production root sitemap remains the existing 20-URL file until a later coordinated cutover. The implementation must make that cutover possible without silently changing today's production output.

## Current source facts

- `scripts/editorial.mjs` currently writes `public/sitemap.xml`.
- Current `public/sitemap.xml` contains 20 web/editorial URLs and no product URLs.
- Editorial issue truth is `content/briefs.json`; published means `publicationStatus === "published"` AND non-empty `approvedAt`.
- Article truth is the intersection of `content/briefs.json::notes` and `content/articles/metadata.json`; both publication/approval gates must pass.
- `scripts/intelligence.mjs::LEARNING_HUBS` is the finite hub registry. Do not infer hubs from topic strings or directories.
- Existing generated pages include root, credits, Intelligence root, library, issues archive, editorial policy, three learning hubs, ten approved notes, one approved issue.
- `research-foundations` is currently a draft issue and must not become Class A or sitemap-eligible.
- Companion PDFs are non-sitemap representations and must never become public XML rows.
- The existing generated-output lifecycle detects one published->draft stale issue case but removed/renamed manifest entries can still leave orphaned generated HTML unless explicitly checked.
- `/intelligence/library/` is already public and already in the current sitemap; this task must explicitly register it as INT-09 rather than silently relying on historical output.

## Hard safety boundaries

1. No product database access, vendor/network calls, credentials, cookies, private records, account IDs or share tokens.
2. No `platform-core` change.
3. No financial/calculation behavior changes.
4. No UI redesign. Existing HTML/CSS/JS appearance and user workflows must remain unchanged except invisible SEO build/publisher plumbing and truthful lifecycle failure behavior.
5. No live sitemap replacement in this task.
6. No use of request Host or legacy subdomains. Preferred origin is exactly `https://marketdeck.in`.
7. Do not invent `lastmod`. Only source-owned article `modifiedAt` and published issue `lastUpdated` may initially supply page lastmod.
8. A producer failure must never look like a successful empty generation.
9. Publisher default mode must be non-activating/dry-run.
10. Never silently deduplicate conflicting eligible canonical URLs.

# Phase A — shared web/editorial inventory producer

Implement a source-owned `marketdeck-web` inventory-v1 producer that emits the pinned 24-field records and v1 envelope.

A Node implementation is preferred because it can import the actual editorial registries/functions and avoids a second parser for `LEARNING_HUBS`. It must match the pinned Python wire reference exactly for canonical UTF-8 JSON ordering/hashing. Use cross-language test vectors.

Suggested paths:
- `scripts/seo/inventory-protocol.mjs`
- `scripts/seo/web-inventory.mjs`
- `scripts/seo/export-web-inventory.mjs`
- tests under `tests/seo-*.test.mjs`

The exact paths may differ if there is a cleaner local convention, but keep SEO-008 code isolated and obvious.

## A1. Required candidate families

Emit explicit records for:

- WEB-01 root: `https://marketdeck.in/`
- WEB-02 credits: `https://marketdeck.in/credits/`
- INT-01 Intelligence root: `/intelligence/`
- INT-02 issue archive: `/intelligence/issues/`
- INT-05 editorial policy: `/intelligence/editorial-policy/`
- INT-09 library: `/intelligence/library/` (explicit new registration)
- INT-08 one record for each exact `LEARNING_HUBS` key/path, only when the same substantive hub gate used by the generator passes
- INT-03 every authored note identity from the authoritative manifests/metadata with publication state preserved
- INT-04 every issue identity from `content/briefs.json`, including non-published items as visible audit/exclusion/remediation records rather than silently dropping them
- INT-06/07 companion PDF/draft/review representations as non-sitemap audit records where appropriate

Only Class A + eligible + index + self-canonical records may set `sitemap_eligible=true`.

## A2. Notes

A note may be Class A only when:
- the manifest note exists;
- manifest publicationStatus is published;
- manifest approvedAt is populated;
- matching article metadata exists exactly once;
- article metadata publicationStatus is published;
- article metadata approvedAt is populated;
- slug/source path are valid and consistent;
- source Markdown exists and the existing article-depth/source checks pass;
- generated canonical path is exactly `/intelligence/notes/{slug}/`.

Use article `modifiedAt` as `content_updated_at` only after strict date validation. Do not substitute approval date or source-review date.

Manifest/metadata drift must fail closed or emit a non-admitted remediation record according to whether the source is structurally invalid versus intentionally unpublished. Do not let an authored note disappear silently.

## A3. Issues

A published issue may be Class A only when:
- manifest issue exists;
- publicationStatus is published;
- approvedAt is populated;
- slug/source/assets are valid;
- required source JSON and advertised assets exist;
- page count/content structure satisfy the existing generator checks.

Use `lastUpdated` as `content_updated_at` only when present and valid. Do not use approvedAt/sourceReviewedAt as lastmod.

Draft/unapproved issues are not public acquisition pages. Keep them visible in the private inventory as exclusion/pending records; they must be sitemap-ineligible.

Companion PDFs must be represented separately as non-sitemap representations. Do not emit PDF URLs into public XML. Preserve the HTML issue as preferred canonical. Do not falsely claim live HTTP Link canonical observation; source expectation and live verification are separate.

## A4. Hubs and singleton pages

The three learning hubs are finite registry identities, not tag archives. Reuse the same minimum-content/required-sequence checks as `learningHub()`; do not write a looser exporter-only rule.

Root, credits, Intelligence root/archive/library/editorial-policy are explicit source-approved singletons. They still leave deployed/live/Google observation fields unknown in the source-only export.

## A5. Envelope/wire

Match `docs/seo/inventory-v1.schema.json` and `docs/seo/inventory_protocol_reference.py` exactly:
- deterministic record sort;
- literal UTF-8;
- sorted object keys;
- no floats/NaN/Infinity;
- duplicate-key/duplicate-identity rejection;
- record_count/hash;
- producer ownership;
- eligible canonical uniqueness;
- failure generation with zero records;
- strict RFC3339 UTC generated_at;
- source revision conflict detection when Git is available;
- honest deterministic source digest only if no Git identity is available and the contract permits it.

Schema validation and semantic validation are separate tests.

# Phase B — generated editorial lifecycle / orphan protection

Strengthen production build lifecycle without changing UI.

Production generation must fail closed if generated public HTML exists for:
- an issue no longer in the authoritative issue manifest;
- an issue changed from published to draft/unapproved;
- a note no longer in the approved authored-note set;
- a renamed/removed note or issue leaving a stale generated `index.html`.

Do not auto-delete authored/generated directories during a normal build. Emit a sanitized error identifying a stable family/slug-safe identity only; no secrets.

Review output may include explicitly supported draft review pages with noindex as today, but `.preview` remains non-deployment output.

Add withdrawal/orphan regression tests:
- published -> draft with stale public directory => production build fails;
- removed manifest issue with stale public directory => fails;
- renamed issue old directory => fails;
- removed/renamed note stale directory => fails;
- after explicit fixture cleanup => build succeeds;
- current valid published set => succeeds;
- review generation never becomes sitemap/public admission evidence.

# Phase C — retire the old root writer safely, not prematurely

Refactor `scripts/editorial.mjs` so sitemap ownership can be handed to the central publisher at coordinated cutover.

Requirements:
- today's default production build behavior must remain compatible until cutover;
- introduce an explicit, fail-closed cutover control (for example a clearly named environment variable or build option) under which editorial generation DOES NOT write/replace the root sitemap;
- tests must prove legacy mode still produces the current 20-URL sitemap from the current fixtures;
- tests must prove publisher-owned-root mode cannot overwrite `sitemap.xml`;
- document that the flag/control is activated only together with the Caddy/persistent-store cutover in INV-07;
- do not change `public/robots.txt` yet.

No silent dual-writer state at final activation.

# Phase D — central pure validator/publisher

Implement a central publisher in `marketdeck-web`, preferably Python using only the standard library plus the pinned schema tooling if already available in the test environment. Keep it independent of Django/product imports.

Suggested paths:
- `scripts/seo/publisher.py`
- `scripts/seo/publish_sitemaps.py`
- tests under `docs/seo` or a dedicated Python test directory

It consumes complete inventory-v1 artifacts from exactly:
- marketdeck-web
- stockproof
- charting-v1
- fo-analytics-v1
- market-commentary-v1
- crypto-tools-v1

It must never connect to their databases or call vendors.

## D1. Admission validation

Before XML generation:
- strict JSON parsing / duplicate-key rejection;
- JSON Schema validation;
- semantic integrity validation;
- compatible schema/protocol/generator policy;
- complete generation status;
- exact producer identity;
- preferred origin exactly `https://marketdeck.in`;
- unique record identity;
- unique eligible canonical across ALL owners, not just per producer;
- approved page-family -> XML-group mapping;
- approved mount boundary for each owner;
- approved query identity rules;
- no fragments/credentials/non-HTTPS/foreign origins;
- no C/D/E/F/B in public XML;
- no records with sitemap_eligible=false;
- do not infer live verification or Google state.

Unknown eligible family or cross-owner mount must fail publication, not be silently omitted.

## D2. Logical XML groups

Initial groups:
- web
- intelligence
- stockproof-catalog
- stockproof-companies
- stockproof-funds
- charting
- fo
- commentary
- crypto-pages
- crypto-coins

Use explicit family mapping, not URL-prefix guessing alone.

One non-empty group may use one child until split thresholds require more.

## D3. XML format

Child filename:
`sitemap-{group}-{part:04d}-{sha256_of_exact_xml_bytes}.xml`

Root `sitemap.xml` is a FLAT sitemap index directly referencing URL-set children.

Engineering split thresholds:
- max 10,000 URLs per child; OR
- max 10,000,000 uncompressed UTF-8 XML bytes per child;
whichever is reached first.

Requirements:
- fully qualified canonical URLs only;
- deterministic URL order;
- correct XML escaping;
- no empty child files;
- independently parse every generated XML document;
- verify every root child exists and hash/name agrees with bytes;
- no nested sitemap indexes;
- exact count reconciliation between admitted records and child URL rows;
- do not emit priority/changefreq.

## D4. Honest lastmod

Initially emit page `lastmod` only for:
- INT-03 note with validated source `content_updated_at`;
- INT-04 published issue with validated source `content_updated_at`.

Omit for everything else.

If root child lastmod is emitted, it is the actual child-byte-change time recorded by publisher state, never a page/deploy/fetch date. It is acceptable to omit root child lastmod initially for determinism.

## D5. Public/private storage separation

The implementation must support three distinct paths:
- staging workspace;
- public XML artifact store;
- private state/evidence store.

Private inventory JSON, release manifests, reconciliation evidence and logs must never be written inside public XML storage.

Default CLI mode is dry-run/non-activating.

## D6. Atomic publication

Activation must:
1. generate and validate all child XML in staging;
2. copy immutable content-addressed children to public store;
3. fsync files as practical;
4. verify them after copy;
5. atomically replace root `sitemap.xml` with `os.replace` (or equivalent) on the SAME filesystem;
6. fsync parent directory as practical;
7. only then commit private release metadata.

Failure injection at every step must prove old root remains intact.

Never overwrite a content-addressed child with different bytes.

## D7. Release/private state

Record privately:
- release ID;
- publisher code revision;
- producer -> source revision / run ID / records digest;
- admitted counts by group;
- child filename/hash/count/bytes;
- root hash;
- previous root/release pointer;
- timestamp;
- dry-run vs activated;
- revocation inputs;
- validation result.

No secrets or raw private rows.

## D8. Last-known-good / failure / revocation behavior

Implement the pure state machinery needed for later coordinator use:
- a failed new producer artifact can never replace a compatible accepted generation;
- known withdrawal/revocation/privacy override must remove the affected URL immediately from the proposed release even if another owner's generation is retained;
- never roll back to a release invalidated by a revocation;
- retained producer state must be marked stale/degraded in private state, never fresh;
- do not silently drop an entire owner solely because a timer elapsed;
- retention duration remains configuration/policy, not a page eligibility rule.

Synthetic tests must cover safe retention, unsafe revocation override, and stale rollback prohibition.

# Phase E — reconciliation primitives

Implement pure set/reconciliation helpers for:
- EXPECTED_CANDIDATE_PUBLIC
- APPROVED_ELIGIBLE_CANONICAL
- SITEMAP_URLS
- CRAWLABLE_INTERNAL_LINK_TARGETS
- LIVE_VERIFIED_CANONICALS

Compute all eight directional differences from the contract.

Do not implement a second web crawler in this task. Inputs for live/discovery sets may be fixture/artifact files. INV-08 later supplies production observations.

Coverage denominator is always APPROVED_ELIGIBLE_CANONICAL. Zero denominator => not_applicable, never 100%.

# Tests — minimum acceptance

## Web producer
- exact current candidate families and counts;
- explicit INT-09 library;
- ten published notes admitted from dual gates;
- one published issue admitted;
- draft research-foundations issue excluded from A/XML;
- three hubs only, no inferred topic hubs;
- current current eligible web/editorial URLs reproduce the existing 20-URL set before cutover;
- modifiedAt/lastUpdated only;
- no PDF in eligible set;
- failure vs valid empty distinction;
- source revision / generated_at / run_id validation;
- exact UTF-8 bytes and pinned protocol vectors.

## Lifecycle
All orphan/withdrawal cases listed above.

## Publisher
- six-producer complete happy path;
- missing/failed producer;
- schema mismatch;
- generator/protocol mismatch;
- duplicate cross-owner eligible canonical;
- foreign origin;
- invalid mount;
- unapproved query;
- unknown A family;
- XML escaping;
- deterministic repeat;
- 10,000 URL boundary;
- 10,000,000-byte boundary;
- exact child hashes/filenames;
- independent XML parse;
- flat-index enforcement;
- empty group omission;
- honest lastmod;
- no B/C/D/E/F leakage;
- atomic failure injection before/after child copies and before root switch;
- immutable-child collision;
- safe last-known-good retention;
- immediate revocation override;
- stale rollback prohibition;
- private/public directory separation;
- concurrent publisher lock/serialization or explicit refusal of a concurrent run;
- restart recovery from private release state.

## Preservation
Run current:
- `npm test`
- `npm run check`
- Intelligence tests
- article tests
- homepage/browser tests where locally available
- build and build:review

No new failure relative to baseline. No visual/UI changes are expected.

# Reporting

Return a final implementation report with:
- branch and exact commits;
- files changed;
- line counts;
- tests discovered/passed/failed/skipped;
- current eligible web/editorial count;
- XML fixture counts and byte/hash examples;
- failure-injection results;
- proof old root is unchanged in default mode;
- proof publisher-owned mode prevents editorial overwrite;
- any unresolved issue as PARTIAL rather than claiming PASS.

Do not push unless explicitly instructed by the owner. Do not create/merge PRs. Do not deploy.
