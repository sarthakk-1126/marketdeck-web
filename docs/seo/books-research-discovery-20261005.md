# Books and Research discovery release — 5 October 2026

## Scope and intent

The Books hub previously placed three expanded navigation panels ahead of the actual books. Stockproof PR 82 collapses those panels into one native disclosure while preserving all 12 crawlable links, 25 illustrated guides and newer mobile filter controls. It is deployed at 2e43a57cc4ce64d8f4204b61a93877ec7fdf7ae9.

This web release publishes three distinct editorial resources:

- `/intelligence/notes/investing-book-to-research-workflow/`: apply a reading idea to a company research note, with original cash-conversion and valuation examples.
- `/intelligence/notes/strategy-backtest-research-checklist/`: specify and review a historical experiment, with signal/fill, cost and attempt-history examples.
- `/intelligence/issues/investing-research-workbook/`: six-page fictional Cedar case and printable workbook, available in crawlable HTML and a text-readable PDF.

These are application workflows, not additional book summaries or competing method landing pages. They link to existing Books, method guides and the public Research Terminal landing page. The articles explicitly state the current Python editing/export and unavailable-execution boundaries. No trading performance or complete-summary claim is made.

## Source and design checks

Publisher/author material, official NSE resources, the SEC statement introduction and the original backtest-overfitting paper were checked. Fictional company figures, cost arithmetic and workflow diagrams are MarketDeck originals. AI assistance and limitations are disclosed; no invented analyst biography, ratings or keyword volumes.

The workbook embeds its font and supplies offline note space. All six pages were rendered and visually checked; PDF text extraction passes. Existing illustrated Learning reader, homepage carousel, Portfolio source/markup/styles, authentication, calculations, infrastructure and deployment configuration are preserved.

## Sitemap release gate

The actual baseline was 12,890 URLs on 5 October, with Research Terminal present but all 38 approved Books identities absent. The earlier Books gate expected a nonexistent generic topic family. It now validates the actual source-owned families: learning_methods, learning_paths and learning_compare. Duplicate source identities also fail with the intended diagnostic.

`books_seo_publication.py` imports the exact 38 Books identities from a fresh deployed Stockproof inventory. `editorial_discovery_publication.py` imports exactly the three above HTML identities from the installed web inventory exporter. The companion PDF remains outside the sitemap. Both reuse the central publisher and require an exact URL delta, byte-equivalent retained records, unchanged unrelated families, current root agreement and a matching dry run before activation. Generated `public/sitemap.xml` remains a build artifact, not a replacement for the central production sitemap pipeline.

## Validation

- Production web build passed.
- 18 article/Intelligence tests passed, including metadata, schema, contextual links, figures and all registered article targets.
- 11 publication tests passed, including actual topic families, exact additions, retained records and missing/duplicate/private/stale rejection.
- Current Django Books template rendered 25 books and 12 links with a default-closed disclosure. Live keyboard expansion verified.
- Worked arithmetic: cash-conversion ratios; valuation gaps; net illustrative trade difference INR 559 and return 5.47%.

Activation evidence and exact live URL verification are recorded separately after deployment. No Google indexation or ranking result is implied by a sitemap entry. The connected GSC Wizard account reports an expired trial; no paid submission or URL inspection has been performed.
