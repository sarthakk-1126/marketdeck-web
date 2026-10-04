# MarketDeck Lens — homepage guide and FAQ QA

final result: passed

## Scope and reference

Implement the user-approved floating MarketDeck Lens panel with searchable FAQs, typed guidance and real research links. The first version uses curated knowledge, not a generative model or live company data. Preserve the homepage hero, interactions, calculations, SEO and concurrent admin/server work.

Approved source: `/workspace/scratch/4f500b3673a6/generated_images/exec-ad6d87f5-0ee7-49b8-9d5a-79a4cce941ff.png`, 1672 × 941.

Implementation evidence: `.preview/lens-reference-viewport-20261004.jpg`, 1672 × 941, captured from the rendered preview in Chromium at a real 1672 × 941 iframe viewport, 1 CSS pixel per captured pixel. State: Guide open after asking “Help me research TCS”. The panel occupies x=1150, y=83, width=500, height=780, matching the reference frame.

Full comparison: `.preview/lens-comparison-final.jpg`, 3344 × 981, source and implementation side by side at original dimensions. Focused comparison: `.preview/lens-panel-comparison-final.jpg`, 1020 × 820, identical x=1150–1650/y=83–863 crops at 1:1. Both were opened and visually inspected.

Additional browser evidence: `.preview/lens-desktop-pass2-20261004.jpg`, `.preview/lens-faq-desktop-20261004.jpg`, and `.preview/lens-phone-verified-20261004.jpg`. Phone sheets were exercised in real 320 × 844 and 390 × 844 frame viewports. A 390 × 420 viewport verified the compact layout with FAQ search and three matching results visible.

## Fidelity review

| Surface | Result |
| --- | --- |
| Typography | Existing site font retained. One-line welcome heading, clear identity, readable answer and link hierarchy. Wide-screen heading and label sizing refined after comparison. |
| Spacing and layout | Fluid 380–500 px desktop frame, three welcome actions, user bubble, boxed guide answer and pinned composer match the approved composition. Phone layout becomes a bottom sheet with safe-area spacing. |
| Colors | Dark navy surfaces, quiet blue borders, pale text and muted supporting copy align with the mockup and existing homepage. |
| Assets | Actual MarketDeck M logo and existing icon sprite used in launcher, header and answer avatar. No replacement hero assets or decorative generated imagery. |
| Copy and behavior | Real company/chart routes and curated explanations replace approximate mockup text. FAQs, reset, source/privacy wording and disabled empty-send state are intentional additions required for a usable guide. |

Intentional deviations: Guide/FAQs navigation and Start again affordances add a slim control strip; welcome disclosure explains curated answers. The site's actual typography, icons and data terminology take precedence over approximate generated text. No unsupported live company figures or fabricated key events are shown.

## Findings and fixes

| Priority | Finding | Fix and post-fix evidence |
| --- | --- | --- |
| P2 | Early welcome/answer spacing hid useful choices and crowded the transcript. | Compacted welcome, boxed answer, refined spacing and fluid desktop width. Final full and focused comparisons retain the primary actions and pinned composer. |
| P2 | Disabling Send after submission lost composer focus. | Return focus to the input after submission. Enter and button submissions exercised in the rendered browser. |
| P1 | Chart resolver rejects a company name or bare ticker such as TCS. | Use verified NSE symbols, including TCS.NS. Real links resolved to `/screener/company/TCS.NS/` and `/charts/TCS.NS/` with the correct company heading/title. Ambiguous names use product search rather than invented symbols. |
| P2 | Reduced phone height crowded FAQ results. | Observe visualViewport and use a compact mode below 600 px available height. In the 390 × 420 frame the panel measured 390 × 404 at y=8, with search and matching results usable. |

No open P0, P1 or P2 findings remain.

## Functional and regression validation

- Build and syntax checks passed; generated bundles reproduce the tested source. `git diff --check` passed.
- Lens tests: 8/8 passed. Homepage tests: 12/12 passed.
- Full existing check: 77/78 passed. The one failure in `tests/product-art.test.mjs` expects a missing `data-preview-src` attribute and also fails on the pre-Lens baseline; unrelated product markup was preserved. Logs: `.preview/lens-final-check.log` and `.preview/lens-baseline.log`.
- Browser: launcher, close/backdrop, Escape and restored focus, Guide/FAQ arrow-key navigation, reset, typed questions, Send/Enter focus, FAQ category/filter/expand, empty results, unknown-question fallback and real company/chart navigation exercised.
- Production route construction uses curated same-origin URLs, encoded queries and registered company symbols. Dynamic text uses textContent; transcript is memory-only, capped at 20 exchanges. No API calls, third-party scripts or persisted conversation data.
- Site-owned browser console error check returned no errors. Extension metadata errors were unrelated to the page.

Limits: native iOS/Android soft keyboards were not directly exercised; reduced available-height behavior was validated in Chromium frames. Cloud Chromium had WebGL disabled and displayed the existing hero poster, so native hero animation was not revalidated here. Hero code is unchanged from the base.

## Deployment boundary

Static homepage markup, Lens stylesheet and bundled module only. Bundle is approximately 24.6 KB and stylesheet approximately 11 KB before transport compression. No paid model dependency, service restart, database, Caddy, firewall, systemd, cron or Compose changes.

Previous hero QA preserved in `docs/qa/market-block-20261002.md`.
