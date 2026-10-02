# Kinetic Market Block — tactile refinement QA

final result: passed

## Approved scope

Upgrade the existing genuine 3D hero with brighter steel-blue metal, silver highlights, soft blue backlighting, desktop hover ripples, phone tap ripples and an approximately six-second automatic transformation. Preserve all copy, controls, layout outside the artwork, functionality, calculations, data, SEO and concurrent work.

Base: main `551a27f`, including both Bots carousel corrections (#60 and #61). The approved visual direction comes from the current Kinetic Market Block and the user’s screenshot/lighting/ripple feedback. No new concept or unrelated redesign.

## Rendered evidence

Native Chromium/SwiftShader captures:
- `.preview/kinetic-desktop-v1.png`: 1712 × 919, brighter steel-blue metal and silver edges.
- `.preview/kinetic-hover-ripple.png`: 1440 × 900, individual picked tile and nearby local highlights.
- `.preview/kinetic-phone-ripple.png`: 390 × 844, native phone tap response.
- `.preview/kinetic-320-v1.png`, `.preview/kinetic-390-v1.png`, `.preview/kinetic-768-v1.png`, `.preview/kinetic-1024-v1.png`: responsive composition, unchanged typography/actions and no overflow.
- `.preview/ripple-motion-strip.jpg`: actual 400px native renders at elapsed offsets 0, 900, 2400 and 5900ms. Solid → open within the first second → open → solid. Cycle duration 6200ms.

Visually inspected desktop, phone and full-cycle captures. Complete sculpture and candle wicks fit inside the existing composition. Refined the initial bright pass to preserve darker recesses and stronger face contrast. No remaining material hero findings in the reviewed states.

## Interaction and accessibility

Raycasting picks the actual instanced block. That block moves slightly outward; neighbouring tiles receive a bounded travelling ripple and settle through a damped spring. A single instanced lighting attribute produces local blue highlights without extra meshes or bloom. The existing fill light follows the hit.

Phone tap briefly depresses the selected tile and emits a ripple. Tap state survives the touch pointerleave event. Passive input listeners do not prevent native scrolling; gestures beyond the tap threshold do not emit ripples. Links and buttons are excluded from artwork input. No pointer capture, scroll hijacking or new UI controls.

The existing motion control, operating-system reduced-motion preference, offscreen/document visibility handling and context-loss fallback remain authoritative. Paused frames are pixel-identical after pointer movement. Initial reduced motion uses a stable open pose. The fallback poster is exported from the same genuine native geometry.

## Verification

`npx playwright test --config playwright.kinetic.config.mjs`: 15 passed. Covers shader compilation/errors, bounded buffer, automatic first-second/full-cycle changes, individual desktop tile selection, ripple settlement, frozen paused images, actual phone touch taps and swipe scrolling, CTA handoff, 320/360/390/430/768/1024/1440/1920/2560px widths, reduced motion, blocked module, denied WebGL, save-data and context loss.

`npm run build`, `npm run build:review`, source syntax and `git diff --check`: passed. `npm run check`: 66/67. The same pre-existing product-art assertion expects absent `data-preview-src` attributes; the unchanged main template also lacks them. Unrelated UI/test left intact.

Exact template/generated-HTML comparison against main passes after normalizing only hero script/poster cache versions. Header, hero text/actions/trust copy, below-hero content, SEO metadata/JSON-LD and concurrent Bots CSS/JS are unchanged. Existing layout styles remain unchanged. All changed application code belongs to the hero renderer/controller or its asset cache versions.

## Resource and deployment boundary

216 existing instanced blocks; no added geometry per block. At most four ripples. Hover raycasting capped around 30Hz. Existing drawing-buffer caps and slow-GPU scaling retained (650,000 phone pixels; 1,300,000 desktop pixels). No new dependencies, postprocessing or server processes.

Builds/tests ran locally. Production deployment uses committed static public assets and the existing clean-main fast-forward deploy workflow. No VPS build or shared infrastructure changes. Caddy, Docker Compose, systemd, firewall, cron, databases and other projects untouched. VPS initial available memory approximately 1.05 GiB.

Cloud browser has WebGL disabled: live visual verification covers its exported poster/HTML/control path. Native 3D and interactions are verified in the local browser against the same assets; do not claim native cloud motion verification.

Production verification is recorded in the merged pull request and final task response.
