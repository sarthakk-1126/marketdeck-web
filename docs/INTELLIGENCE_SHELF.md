# MarketDeck Intelligence editorial shelf

## Scope

The homepage Brief area becomes a manual editorial shelf. `/intelligence/` contains a featured shelf and searchable library; `/intelligence/issues/` contains every approved magazine. Existing note/issue URLs, manuscripts, PDFs, product cards, globe and product applications remain unchanged.

At release there is one approved magazine and three already-published learning notes. Notes are explicitly online-only; only a verified PDF receives a PDF action. Research Foundations remains a draft. No placeholder issues, repeated magazine clones, invented dates or readership metrics are used. Reading time estimates rendered words at 220 words/minute.

## Add an edition

Use the established `content/briefs.json` publication workflow. Preserve id, title, slug, edition, summary, cover, source, assets, publicationStatus, approvedAt, pdfPath and pageCount. Existing PDF generation additionally expects the legacy PDF alias. Give each edition a unique permanent slug and review the manuscript, cover and PDF before setting publicationStatus to published and recording approval.

Optional metadata added here:
- topics: ai-quant, equities, markets, fno, india, crypto, research-craft.
- featured: false excludes an entry from shelves but retains it in the archive.
- publishedAt: actual ISO publication date; otherwise approvedAt is used.

Only populated topics appear as filters. Shelves show up to eight featured entries: dated published issues newest-first, then existing notes. The archive renders all approved magazines in static HTML; client-side enhancement provides search and 12-at-a-time browsing. Without JavaScript every entry and reading link remains visible.

The notes metadata array matches slugs to the existing content in src/index.template.html, adding topics and existing local coverArt. It is not a separate CMS or duplicated manuscript.

## Behaviour

No autoplay. Previous/next buttons, thumbnail selection, Left/Right/Home/End keys, mobile horizontal swipes, topic and format filters, search, reset and empty states. Focus remains on controls; polite live regions announce updates. Vertical scrolling and pinch zoom remain available. Swiping a cover does not activate its reading link. Reduced-motion preferences remove enhancement animation.

Read online is the primary action; existing issue HTML canonical URLs remain unchanged. PDFs are downloadable companions. PDF HTTP Link canonical headers need a separate hosting change and are NOT claimed or changed here.

## QA

Run `node scripts/build.mjs`, `node scripts/build.mjs --review`, and `node --test tests/*.test.mjs`. For browser QA install Playwright 1.56.0 and Chromium, run `node tests/shelf-fixtures.mjs`, serve public on port 4173, then run `python scripts/qa-intelligence-shelf.py --out .preview/intel`.

Delete only the temporary `public/__shelf-qa/` fixture directory before publishing. The fixture generator is never called by the production build. It exercises 0/1/25 items without publishing synthetic entries. `--public --base https://marketdeck.in` checks the real deployment without fixture URLs.

CSS and browser JavaScript are versioned, self-hosted and intel-class-scoped. No new runtime dependencies, tracking, browser storage, subscriptions or product-service changes.

Accessibility pattern basis: https://www.w3.org/WAI/tutorials/carousels/
