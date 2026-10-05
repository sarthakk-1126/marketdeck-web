# Research Terminal compact folio — 5 October 2026

Initial source base: `849838eca7f6fe18557eb8c56c9f602d742bb69b` (main / PR #84). Rebased without conflicts onto `66e79661d1a909b096b446e96a22408760fd645a` (PR #85 Strategy Lab); its ten changed files remain untouched.
Scope: homepage Research Terminal discovery only. The user selected the single folio hero and approved its page lift, source-light trace and restrained pointer tilt.

## Visual verification

- Source visual truth: `docs/qa/research-folio-reference-20261005.webp`; original selected ImageGen result `exec-2c4c76e7-1b9f-410a-83d5-4b858cac8292.png` (1984 × 792).
- Browser-rendered implementation: `docs/qa/research-folio-desktop-20261005.webp`, `research-folio-mobile-20261005.webp`, `research-folio-tablet-20261005.webp` in this directory.
- Full-view comparison: `docs/qa/research-folio-comparison-20261005.webp`.
- Focused comparison: `docs/qa/research-folio-focused-20261005.webp` (typography, CTA/copy, material/edge treatment).
- Desktop CSS viewport 1363 × 936, browser JPEG 1348 × 926, idle dark state. Screenshot normalized to the CSS viewport before cropping the 1236 × 322 card. Source section crop 1912 × 627, proportionally reduced to 1236 × 405. Its taller proportions are intentionally adapted to the user's explicit request for a ~320px hero; the source was not stretched.
- Phones verified with the real homepage in same-origin browser iframes: 320, 360, 390px CSS widths. Tablet widths: 760, 820, 1024px. This exercises actual media queries, not a scaled desktop screenshot. It is not physical-device testing.
- Final measured card heights: 403.94px at 320, about 388px at 360, 407.13px at 390, 322px at 820/1024/1363. No horizontal viewport overflow at the tested widths. At 760, the deliberately stacked layout is about 420px tall.

## Findings and comparison history

1. [P2, fixed] First 390px layout wrapped the secondary CTA onto a second 44px row, producing a 481px card. Reduced mobile button spacing, retained 44px primary targets, removed the secondary decorative arrow and bounded the folio. Post-fix browser capture shows both links on one row and a 407px card.
2. [P2, fixed] At tablet width the artwork could expand beyond its mobile slot and desktop CTA sizes caused a 355px card at 820px. Bound mobile artwork to 320px and reduced tablet CTA spacing/type. Post-fix tablet browser capture shows a contained folio and 322px card.
3. [P2, fixed] Removing animation during global pause could replay the page entrance on resume. The runtime now marks the entrance settled on completion, interruption or reduced-motion/mobile entry. Behavioral tests verify the settled state; the artwork's final appearance is unchanged.

No actionable P0/P1/P2 visual findings remain in the captured states.

## Required fidelity surfaces

- Typography: existing MarketDeck font stack, two-line white/blue headline, restrained kicker, readable HTML body and real CTA labels. Display size and spacing are deliberately reduced for the requested compact card. The embedded artwork labels are decorative, with the research relationship also exposed through an accessible figure label.
- Layout rhythm: one bordered 18px frame, asymmetric copy/art grid, no carousel footer/counter or satellite panels. Desktop card 322px. Mobile stack preserves both links and a compact bounded illustration.
- Colors/tokens: all component colours alias existing bg/surface/line/text/muted/blue tokens. No global token or unrelated stylesheet overrides.
- Asset fidelity: generated transparent graphite/sapphire folio, matching the approved material, perspective, spine and blue evidence line. Production WebP 1721 × 914, 172,754 bytes; one URL reused by masked layers and fetched once. No CSS/SVG substitute illustration.
- Copy/content: selected headline and concise two-line product copy. Landing and desk paths retained. Explicit illustrative/no-live-data semantics; no ticker, numbers, private state or fabricated results.

## Interaction and regression checks

- Desktop pointer input changes tilt within ±1.8°/±2.4°; pointer leave resets it. Touch input never tilts.
- Site footer motion control was clicked in the browser: body motion-paused true, trace animation none, stage transform none.
- CSS source trace runs on a 10-second cycle while the folio is visible. Station highlights pass Fundamentals → Value Lab → Thesis. Chart shape stays fixed.
- Intersection visibility, hidden tab, reduced-motion, global pause, pointer leave, touch and one-time entrance behavior pass the runtime test. No API calls, storage, analytics additions or continuous JavaScript render loop.
- Both links are real anchors to `/screener/research-terminal/` and `/screener/research-desk/`; those application routes are served by the production gateway, not the local static server.
- Console checked: no homepage application errors in the inspected local state; one Chrome extension metadata error is outside application code.
- `npm run build`: passed. Focused discovery/folio suite: 12/12 passed. Full suite after rebase: 131/134; the same 3 pre-existing failures also reproduced on the new untouched main (130/133): legacy magazine exclusion assertion, external runtime dependency allowlist assertion, old product-art preview assertion.
- Portfolio section HTML in both template and generated homepage is byte-identical to main (SHA256 prefix `cab491a032956ba8`). Portfolio CSS, JS and lens module are byte-identical. No sitemap/canonical, application/backend, infrastructure or deployment configuration changes.

## Implementation checklist

- [x] Match the selected folio direction and compact dimensions.
- [x] Resolve mobile/tablet spacing findings and compare again.
- [x] Preserve real links and static no-JavaScript artwork.
- [x] Integrate existing motion controls and visibility gates.
- [x] Verify Portfolio and unrelated generated output preservation.
- [x] Record pre-existing suite failures separately from this change.

Follow-up polish: none required for this scope. Physical touch-device inspection remains a separate optional check.

final result: passed
