# SEO-008F web inventory and publisher operations

This document describes the implementation boundary delivered by SEO-008F. It does not authorize production activation, a Caddy change, a robots change, deployment, or Search Console submission.

## Web/editorial inventory

Generate a source-owned inventory artifact with:

```text
node scripts/seo/export-web-inventory.mjs --output <private-path>/marketdeck-web.json --environment production
```

The exporter reads only repository-owned editorial sources and registries. It emits all current public candidates plus audit/remediation representations. It never treats review output, generated HTML, a companion PDF, or an unresolved record as public admission evidence. When Git is available its revision is authoritative; an explicitly supplied `--source-revision` must match it. A deterministic source digest is used only when Git identity is unavailable.

## Root writer handoff

`MARKETDECK_SITEMAP_OWNER` has two accepted values:

- unset or `legacy`: the editorial build continues to write the current 20-URL `public/sitemap.xml` exactly as before;
- `publisher`: the editorial build does not write or replace `sitemap.xml`.

Any other value fails closed before editorial generation starts. The `publisher` value must remain inactive until the separate INV-07 release coordinates the persistent public XML store, private state store, validated Caddy handler, rollback procedure, and central publisher activation. Do not enable it independently: that would create a missing-writer window. At coordinated activation there is one root owner, never two.

## Publisher

`scripts/seo/publish_sitemaps.py` consumes exactly one complete inventory-v1 artifact from each of the six approved producers. It has no application, database, vendor, or network imports. Its default is dry-run; `--activate` is required for an atomic root switch.

Three pairwise isolated paths are mandatory:

- `--staging`: complete candidate XML before publication;
- `--public`: XML only (`sitemap.xml` and immutable content-addressed children);
- `--private`: inventories, release manifests, accepted-generation state, reconciliation evidence, and the publisher lock.

Activation validates all six artifacts, stages and independently parses every XML file, copies/verifies immutable children, and atomically replaces the root from a temporary file on the public store filesystem. It commits the private active-release pointer and accepted inventories only after the root switch. Existing content-addressed children may be reused only when their bytes match.

Failed or missing fresh generations can retain a compatible accepted owner generation with explicit `stale_degraded` state. Known revocations are applied to the proposed admitted set even when an owner is retained, and a release containing a revoked URL is not rollback-safe. Retention time is coordinator policy and never changes page eligibility or silently removes an owner.

## Verification commands

```text
npm run test:seo
python -m unittest tests.seo_publisher_test -v
node scripts/seo/export-web-inventory.mjs --output <private-temp>/marketdeck-web.json --environment test --generated-at 2026-09-24T00:00:00Z --run-id verification
```

The repository-wide preservation commands remain `npm test`, `npm run check`, `npm run build`, `npm run build:review`, and `npm run test:browser`. No command in this implementation performs a deployment or changes live/root serving.
