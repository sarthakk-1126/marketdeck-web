# Market Block hidden quote reveal

Result: preview verification passed. Production deployment uses the existing static-file workflow.

Base: production main `ac1bf22113388b023dd576aad4d64b8a43ca3059` (tree `fed3e1ac1931e0cc4af6d4a4ca437e1faaa9cc25`).

Five valid taps/clicks on actual 3D blocks start an 8.2-second scene: tactile ripples and incremental compression, a 350ms anticipation, a 1.5-second outward sweep, a readable quote hold, then a 1.95-second reconstruction. The native dialog uses the existing canvas/renderer and instanced geometry. The camera initially extends the original artwork window to avoid a fullscreen position jump, then centres the scene. Portrait composition widens the block frame to keep the words clear. A 12-second inactivity reset and brief return cooldown prevent unintended sequences. No audio, counters, extra dependencies or external quote requests.

Quote: “Price is what you pay; value is what you get.” — Benjamin Graham, as explicitly credited by Warren Buffett in Berkshire Hathaway's 2008 shareholder letter, printed page 5 / PDF page 4: https://www.berkshirehathaway.com/letters/2008ltr.pdf#page=4. The reveal includes this primary-source attribution link.

## Verification

- 21 browser checks passed across existing hero and new reveal behavior. The six reveal checks passed again after the final portrait composition refinement.
- Actual desktop mouse and mobile touch events: first four stay within the hero; fifth reveals; automatic reconstruction restores canvas dimensions, scroll position, existing text/links, and navigation.
- Reveal screenshots inspected at 320px, 390px and 1440px. Existing hero layout tested from 320px through 2560px with no overflow.
- Empty-space presses and drags do not count. Native phone swipes and CTA navigation work. Keyboard activation, Escape, close control, modal focus and focus restoration work.
- Initial reduced motion remains pixel-stable. Changing to reduced motion during the reveal immediately restores the static hero. Existing motion pause, save-data, denied WebGL, blocked module, context loss and poster recovery remain operational. Resize/context loss inside the reveal verified.
- `npm run build`, source syntax and `git diff --check` passed. `npm run check` passes 12 of 13 test files; the unchanged pre-existing `product-art.test.mjs` assertion expects absent `data-preview-src` markup. The baseline homepage also lacks that markup.
- Exact generated HTML/template comparison against the base passes after normalizing only the two hero asset cache versions. All SEO/JSON-LD, navigation, existing hero copy/buttons, other UI and concurrent work preserved.

Browser evidence uses Chromium software WebGL and phone emulation, not a physical handset performance measurement.

## Resource and release scope

Reuses one renderer, 216 instanced blocks and six candle wicks. No second WebGL context, particles, bloom passes, added per-block objects or server processing. Original drawing-buffer caps retained: 650,000 phone pixels and 1,300,000 desktop pixels, with slow-GPU reduction. Combined compressed renderer/controller/style increase is approximately 2.8 KB.

Release is a clean-main static-file fast-forward via the existing `deploy-marketdeck-web` workflow. No VPS builds, Docker/service restarts, database writes or shared infrastructure edits. Production status and live checks are recorded in the PR.
