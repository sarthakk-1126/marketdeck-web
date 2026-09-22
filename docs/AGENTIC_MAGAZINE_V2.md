# MarketDeck Brief — magazine edition 2.0

Owner request: replace the sparse published outline with a proper readable, chart-rich interactive magazine, then publish it. Scope is the magazine and its existing homepage/archive placement only. No product application, auth, data, routing, deployment, globe or animation changes.

## Outputs

- 12 A4 pages, vector-first charts and diagrams, selectable text.
- Clickable contents, 12 outline entries, footer navigation and linked primary references.
- 5 multiline text fields and 6 checkboxes on the research worksheet. No JavaScript, submission endpoint, network tracking or credentials are involved. Form support and saving vary between viewers; use a compatible desktop reader when browser/mobile support is incomplete.
- Versioned `marketdeck-brief-v2.pdf` and `cover-v2.webp`; the stable `marketdeck-brief.pdf` is replaced with identical new PDF bytes. The versioned URL avoids relying on a cached copy of the old filename.
- Eight derived web graphics plus the expanded HTML manuscript; existing HTML issue slug is unchanged.
- Original Research Foundations issue remains an unpublished draft.

## Reproduce

Use Python 3.12 and Node 22 (the editorial JavaScript needs no npm runtime dependencies):

```sh
python -m pip install reportlab==4.4.9 PyMuPDF==1.26.7 Pillow==12.3.0
python scripts/prepare-agentic-magazine.py
node --check scripts/editorial.mjs
node --test tests/*.test.mjs
```

The established `python scripts/generate-brief.py agentic-trading-frontier-02` command also routes to this renderer. Edit `content/issues/agentic-trading-frontier-v2.json`, regenerate, render and inspect every page. Keep the review date truthful; do not automatically assert freshness. Publish updates only with owner authorization.

The preparation script updates the approved issue manifest, generates the PDF/cover, exports web figures, updates the editorial asset-copy contract and regenerates public/review HTML. It deliberately does not rebuild the globe bundle. It checks page count, form count, valid internal destinations and page bounds. Rendered output still requires visual review.

## Evidence boundaries

- Ablation chart: Fin-Analyst Table 6, PDF page 7, offline historical TSLA experiment. Values are percentage-point changes after removing individual roles: -30.65, -14.35, -11.74, +2.42 and +2.95. These are not live returns and are not additive.
- The same paper contains inconsistent live BTC figure/table/prose summaries. They are not silently reconciled and are not used in a performance chart.
- Leverage/exit charts: aggregate observations in the author-maintained DXRG research companion. Median leverage is 5.0x in all six volatility groups. The 43.2% and 49.3% exit figures use different denominators, explicitly labelled in the graphic.
- The DXAP record is mainly paper execution at live prices plus a small real-capital book. It is not described as thousands of wholly real-money agents or as the current product's performance.
- All workflow diagrams are original editorial schematics, not MarketDeck broker integrations or instructions to enable autonomous execution.
- Seven primary sources are linked. The PDF source page records publication dates, review date and study limitations. Experiments were not independently replicated.

## QA recorded locally

12 rendered pages inspected; 88 links; 12 outline entries; 11 form fields; no out-of-page text; no invalid internal destination; text-field and checkbox save/reopen roundtrip passed. The original PDF has been replaced, not merely decorated. PDF contains approximately 3,000 words including sources, diagrams and worksheet labels.

Expected deterministic PDF on the pinned renderer: 67,974 bytes; SHA-256 `8029bc7abb970df798ce177a39d796b84fb7bf259e973b0febda5c0127a09e83`. Any mismatch must be inspected rather than labelled identical automatically.
