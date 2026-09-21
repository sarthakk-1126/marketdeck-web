# MarketDeck Brief editorial workflow

## Source of truth and draft gate

`src/site-data.json` points to `content/briefs.json`. Each issue's metadata lives there once: id, title, slug, edition, summary, cover, pdfPath, pageCount, sourceReviewedAt, publicationStatus, source, assets. The source JSON holds editable page sections and primary-source references.

An issue is published only when `publicationStatus` is `published` **and** `approvedAt` is populated. This task has not approved or published the first issue. Production generation omits its page, cover, PDF, homepage card and sitemap URL. Review generation includes drafts and adds noindex; the local review server also sends X-Robots-Tag. `.preview/` is never deployment output.

If a previously published issue is changed back to draft while its old generated directory remains in `public/`, production generation fails closed. Review the change and remove that specific generated issue directory before rebuilding. The generator never silently deletes authored files or leaves a known draft in production output. Removed/renamed manifest entries also require explicit cleanup of their previous generated paths.

## Regenerate the first issue

Requires Python, ReportLab, pypdf, Pillow and Poppler (`pdftoppm` on PATH, or set `PDFTOPPM`). The generator also detects the configured Codex bundled Poppler on this workstation.

```sh
npm run brief:generate
npm run build
npm run build:review
npm run dev:review
```

Equivalent: `python scripts/generate-brief.py`. Here it was run using the bundled Python executable because the ordinary `python` alias is not configured. The PDF and cover are generated under `content/issues/research-foundations/`, never directly into production. The cover is rendered from actual PDF page 1; page count is checked against the manifest. Rebuild review output after editing content or regenerating files.

Local HTML: http://127.0.0.1:4173/intelligence/issues/research-foundations/
Local PDF: http://127.0.0.1:4173/intelligence/issues/research-foundations/marketdeck-brief.pdf
Archive: http://127.0.0.1:4173/intelligence/issues/

Render **every** PDF page with Poppler after edits; inspect for clipping, blank pages, small text and glyph failures. Check HTML and PDF links. Source access/review dates must reflect actual checking, not automatic assertions of freshness.

## Replace files, add or approve an issue

To replace an externally prepared PDF/cover, place approved files under that issue's `assets` directory using `marketdeck-brief.pdf` and `cover.webp`. Update actual pageCount, sourceReviewedAt and metadata, then build review output. Keep an editable source file and source citations.

For the next issue, add a new manifest entry and a source JSON with the same pages/sources structure. Run `python scripts/generate-brief.py <issue-id>` (the first issue is the default), render all pages, and inspect the local HTML/cover/PDF. Keep the old manifest entries and asset folders so older published issues stay accessible in the archive. Put the newest issue first if it should be featured.

Only after explicit owner editorial approval should a separate authorized change set `publicationStatus: "published"` and the real `approvedAt` date. Prepare the approved PDF/cover (remove draft labels in the editable source and PDF generator), rebuild production and review, inspect the sitemap, then use the repository's existing release process when separately authorized. Marking metadata is not authorization to push or deploy.

The current draft is evergreen research education, not current news or recommendations. Its six primary references come from SEBI Investor and NSE; source publication dates are explicitly marked unavailable where the page supplies none. Source review date: 22 September 2026. Hypothetical chart examples are labelled. No authors, returns, current figures, testimonials or account identities were invented.
