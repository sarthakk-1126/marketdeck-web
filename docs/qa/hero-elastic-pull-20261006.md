# Elastic hero blocks and five-segment charge meter

## Scope

The existing `.market-block-hero` cube on the MarketDeck main homepage. Base: `d69ead4940d09d506b14dd761b18d0342a211033`.

Implemented the approved five blue pill segments, numeric charge count, and a restrained hint beneath the cube. Desktop artwork reserves 54px for the meter; tablet/phone layouts place it in normal flow beneath the artwork. The existing headline, descriptions, actions, trust copy, decorative caption, product handoff, quote data, and reveal sequence are preserved.

## Interaction

- Pointer down raycasts the actual instanced block. A deliberate drag captures the pointer after a 10px movement threshold.
- The picked block follows a camera-facing plane with increasing resistance. Translation is capped at 0.30 scene units, below the 0.43 block width. Neighbours follow at a smaller strength.
- Blocks keep their geometry. Pull translation uses a damped spring; releasing adds the existing local ripple and settles back without a fling or camera shake.
- A completed drag needs at least 24px of pointer movement and 0.09 scene units of intended displacement to add one charge. It never also queues a tap.
- Valid taps, Enter/Space, and completed pulls share the existing five-press counter. Its 12-second inactivity reset, 1.8-second return cooldown, 8.2-second reveal, close/Escape handling, focus restoration, and fifty sourced quotes are retained.
- Phone horizontal pulls work with native vertical panning and pinch zoom. Touch devices see “Pull sideways to charge.”
- Pointer cancellation, lost capture, blur, scrolling, resize, motion changes, and page hiding cancel an incomplete pull without charge. Reduced motion clears pull translation immediately, leaves the existing static pose, and hides the inactive meter.
- The progressbar has numeric ARIA values and announces committed changes once, rather than updating a live region on every frame.

`overflow: clip` prevents programmatic focus/scroll-to-artwork from horizontally scrolling the hero's deliberately extended artwork container and clipping its text.

## Performance

Uses the existing renderer, 216-block InstancedMesh, lights, shared geometry, adaptive quality, offscreen handling, and drawing-buffer caps. No dependency, server process, API call, per-block mesh, or second WebGL context was added.

Bundled renderer: 585,397 → 587,268 bytes, +1,871 raw bytes / +656 gzip bytes. The progress DOM is updated only when committed charge or reveal state changes.

## Verification

- Production build and review build: passed.
- Source syntax and `git diff --check`: passed.
- 26 distinct hero browser checks verified in local Chromium/SwiftShader: existing animation, hover, pauses, taps, five-press reveal, quote attribution/timing, keyboard, focus restore, real synthetic touch gestures, five pulls, mixed input, bounded pointer capture outside the cube, cancellation, reduced motion, context loss, blocked module, denied WebGL, save-data, CTA handoff, and 320/360/390/430/768/1024/1440/1920/2560px compositions.
- The full browser run passed 25 cases; one existing console-error check encountered `ERR_CERT_AUTHORITY_INVALID` loading the external analytics script in the test environment. Its fixture now isolates that external request. A targeted final rerun of that check and the two desktop pull/layout cases passed 3/3. Runtime analytics code was unchanged.
- Inspected the actual desktop 3/5 render, captured pull, phone 3/5 render, and responsive captures. The final desktop render retains the full headline after artwork/keyboard focus.
- Homepage HTML equals base after removing only the new charge markup and its hero asset cache versions. No metadata, SEO, analytics, quote-data, or unrelated page changes remain in the diff.

## Existing repository check failures

`npm run check` reports 23/26 file suites passing both here and on an isolated unchanged-main worktree after the same production/review builds. The same three suites fail on both:

| Suite | Existing assertion |
| --- | --- |
| `homepage.test.mjs` | External dependency allow-list excludes the existing platform analytics client. |
| `pe-ratio-magazine.test.mjs` | Generator output lacks the expected “Continue your valuation research” copy. |
| `product-art.test.mjs` | Test expects the previous `data-preview-src` markup. |

The build also rewrites analytics placement in generated pages and injects Lens into the account redirect. Those existing generated-output differences were removed from this change; all unrelated generated pages were restored.

## Release boundary

Prepared on a feature branch for draft review. No production deployment, merge, VPS build, service restart, or infrastructure change. Browser tests use software rendering and synthetic touch; physical phone GPU smoothness remains a device-level check.
