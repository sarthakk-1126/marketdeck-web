# Kinetic Market Block hero — design QA

final result: passed

## Visual truth and captures

Selected source: `/workspace/scratch/4f500b3673a6/generated_images/exec-78cbddda-0287-43a9-b359-513efa10eb62.png` (1712 × 919 pixels). This is the second displayed concept in the latest ideation set, Kinetic Market Block.

Native browser implementation: `.preview/kinetic-desktop-v1.png` (1712 × 919 pixels, CSS viewport 1712 × 919, device scale factor 1). Full-view comparison: `.preview/kinetic-comparison-final.jpg`, both images downsampled to 856 × 460 without density mismatch. Focused sculpture comparison: `.preview/kinetic-detail-comparison.jpg`, proportional crops fitted within equal 500 × 550 regions.

Responsive browser captures: `.preview/kinetic-320-v1.png`, `.preview/kinetic-390-v1.png`, `.preview/kinetic-768-v1.png`, `.preview/kinetic-1024-v1.png`. Mobile CSS viewport 390 × 844 at density 1; full-page capture inspected with its top 1000 pixels, including the complete hero and start of the suite.

State: dark theme, open sculpture pose, first viewport. The reference is a still concept. The implementation is actual Three.js geometry with a continuous open/reassemble cycle, restrained rotation, candle columns and a travelling signal. Native material rendering intentionally replaces the concept's offline photographic rendering. The later agreed refinement uses fewer, larger elements and restrained glow.

Cloud browser preview: `https://marketdeck.in/kinetic-review-20261002/` and its 390px responsive iframe. Rendered poster, typography, primary CTA and product handoff inspected. The local terminal preview endpoint is blocked by the browser's network. WebGL is disabled in that browser, so native motion and GPU rendering were verified with the repository's Chromium/SwiftShader tests; cloud verification covers the browser's fallback path. The poster is an exported render of the same sculpture, 900 × 900, approximately 78 KB.

## Findings and fixes

No remaining P0/P1/P2 findings in the reviewed hero.

Comparison history:
1. P1: Initial lighting produced broad white faces and an overly visible blue plane. Replaced the room environment with controlled studio reflections, lowered seam opacity, and refined lighting. P2: The initial sculpture was too large at desktop heights. Increased camera framing and aligned the hero bottom with the first viewport. Post-fix evidence: final desktop full-view/detail comparisons.
2. P2: The native phone pose clipped the tallest candle wicks. Increased the phone camera span. Re-captured 320/360/390/430px and confirmed full sculpture clearance. Post-fix evidence: final 390px native capture.
3. Final lighting/ground pass: preserved graphite surfaces and existing blue accents; a modest ground glow anchors the volume. Re-captured native desktop/phone renders. No new layout or content findings.

Required fidelity surfaces:
- Typography: Existing font families, copy, hierarchy and buttons retained. Desktop headline size is scoped to the hero's necessary composition. Existing phone typography and button treatments retained.
- Spacing/layout: Stable copy on the left; art on the right. Phones place the art below the copy/actions/trust row. No horizontal overflow at 320–2560px. Hero art does not intercept pointer input. Bottom cue remains visible on desktop.
- Colors/tokens: Existing navy, graphite, blue and subtle teal language retained. Blue signal and metal reflections use the site's established palette.
- Artwork: Real beveled instanced meshes, perspective camera, PBR metal, studio environment and lights. Geometry and pixel counts are capped. The raster poster is used only while loading or when WebGL/data-saving prevents rendering. No flattened animated hero image stands in for 3D on supported devices.
- Content: Hero copy, CTAs, trust labels, navigation and template content below the hero are byte-for-byte unchanged against latest main. SEO metadata and JSON-LD are unchanged. No product code, data, calculations or formulas changed. Concurrent WhatsApp homepage changes retained by rebasing.

## Verification

`npx playwright test --config playwright.kinetic.config.mjs`: native shader compilation, bounded buffer, pixel-identical paused frames, session/controller interactions, nine viewport widths, reduced motion, WebGL denial, blocked module, save-data, context loss and product handoff. Twelve tests passed; affected tests re-run after framing refinements.

Browser console: no application errors in the native hero test (the analytics script is stubbed only in that test to avoid network-dependent telemetry). Cloud browser's disabled-WebGL condition was observed; a preflight now keeps the poster and avoids downloading Three.js on unsupported browsers.

`npm run build`, `npm run build:review`, source syntax checks passed. `npm run check`: 66/67 pass. The remaining product-art test expects `data-preview-src` attributes removed from the existing homepage in earlier work. Confirmed the same failure against unchanged latest main; unrelated code/test left unchanged.

Deployment uses committed `public/` artifacts. Existing deployment script was inspected: clean-main check and `git pull --ff-only`, no server build or service restart. No shared infrastructure files are part of this change.

## Follow-up polish

P3: An optional future material pass could add a finer brushed-metal finish. Not required for composition, motion, accessibility or deployment.

## Implementation checklist

- [x] Native 3D, fallback and responsive composition verified
- [x] Copy/UI/SEO/math boundary checked
- [x] Motion and resource limits verified
- [x] Preview before deployment
- [ ] Merge/deploy and verify the production response and UI
