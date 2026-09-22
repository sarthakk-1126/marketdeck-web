# Hero globe quality pass

STATUS: PASS — local implementation and verification, 22 September 2026.

Branch: `codex/premium-homepage`. Starting commit: `fac80d3cd135f75e4ed075413126a8c6e8b36d80`.

## Scope and rendering

The hero remains a real Three.js sphere. The homepage HTML, CSS, headline, CTAs, section order, product destinations, shared animation controller, camera framing, geographic orientation and scroll/card choreography are unchanged.

- Replaced the generic standard surface material with readable Earth-specific shaders: linear-light color handling, restrained color grading, soft day/twilight separation, cool shadow fill and subtle normal detail.
- Replaced the winter day texture with detailed 4K/2K Earth maps. Restored normal-map detail at 2K using lossless WebP. Retained the existing geographic night-light maps.
- Added an ocean mask for dark blue water and selective specular reflection, without shiny continents.
- Added a thin elevated cloud shell, mapped cloud coverage and subtle surface shadows. Lower quality levels retain clouds composited on the surface.
- Replaced the hard blue circumference with an atmosphere whose optical density fades exponentially toward the outer edge. No full-screen bloom or postprocessing.
- Emphasized India with a broad, soft regional light adjustment, stronger geographic city lights in twilight, fine network arcs and warm-core/cyan-halo city points. No drawn country border or live-data claim. Seven nodes now share one points draw rather than seven individual sphere draws.
- Increased surface geometry from 96x64 to 128x96 segments and preserved capped anisotropic filtering and antialiasing.

The lighting is an artistic photographic approximation. Clouds and city lights are representative maps, not current weather or real-time measurements. Motion remains the existing subtle drift and pointer response.

## Sources and reproducibility

All maps are self-hosted derivatives of [Solar System Scope textures](https://ftp.solarsystemscope.com/textures/), provided under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Public attribution is updated in `/credits/` and its generator.

| Map | Source | Transformation |
| --- | --- | --- |
| Day surface | [8K day map](https://ftp.solarsystemscope.com/textures/download/8k_earth_daymap.jpg) | Lanczos resize to 4096x2048 and 2048x1024; WebP quality 92 |
| Cloud coverage | [8K cloud map](https://ftp.solarsystemscope.com/textures/download/8k_earth_clouds.jpg) | Grayscale, Lanczos resize; packed into red channel |
| Ocean reflectivity | [2K specular map](https://ftp.solarsystemscope.com/textures/download/2k_earth_specular_map.tif) | Grayscale, resize to tier dimensions; packed into green channel |
| Normal detail | [2K normal map](https://ftp.solarsystemscope.com/textures/download/2k_earth_normal_map.tif) | Original 2048x1024 dimensions; lossless WebP |
| Night lights, retained | [8K night map](https://ftp.solarsystemscope.com/textures/download/8k_earth_nightmap.jpg) | Existing V2 4K/2K WebP derivatives unchanged |

`scripts/prepare-earth.py` reproduces the new maps with Python/Pillow. Supply a source directory containing `day.jpg`, `clouds.jpg`, `specular.tif`, and `normal.tif`; run `python scripts/prepare-earth.py <source-directory>`. Packed cloud/ocean WebP uses quality 78, blue channel zero. Data maps stay linear; color maps use sRGB. No runtime dependencies were added. Raw downloads remain in ignored `.preview/globe-polish/`.

## Performance and fallback

| Asset | Bytes |
| --- | ---: |
| Bundled globe module | 548,095 |
| Day 4K / 2K | 840,354 / 245,486 |
| Cloud/ocean 4K / 2K | 1,040,806 / 315,602 |
| Normal 2K | 306,744 |
| Night 4K / 2K, unchanged | 294,472 / 82,306 |

Globe module plus its four textures totals **3,030,471 bytes** at 4K or **1,498,233 bytes** at 2K, before transport compression of JavaScript. These are file payloads, not GPU memory estimates or whole-page transfer totals. The extra cloud map and improved surface/normal detail increase the optional visual payload. Immediate HTML, headline, CTA and poster loading remain unchanged.

- Existing single animation clock, lazy module loading, initialization timeout, visibility handling, resource disposal and context-loss fallback remain intact.
- Existing DPR cap of 1.5 and desktop drawing-buffer budget of 1.6 million pixels remain intact. Small-screen policy continues using the poster without loading WebGL.
- Devices reporting a texture limit below 4096 load only 2K maps. Regression coverage exercises this branch.
- Existing adaptive cadence thresholds remain intact. Quality level 1 removes the extra cloud shell, cloud shadow sampling, normal-detail sampling and four arcs. Clouds remain composited on the Earth. Level 2 also applies the existing 0.8 drawing-buffer scale.
- At a 1440x900 in-app browser viewport, the final full-quality 4K renderer reported a **16.67ms average frame cadence**, quality 0, with a 1425x900 buffer (scrollbar excluded). This is approximately 60fps for that local observation; the browser's physical GPU backend was not independently identified.
- Isolated headless Chromium 141 with SwiftShader, 1440x900 at DPR 1, no video recording, settled to quality 2 and a 1152x720 buffer. After roughly 25 seconds it reported **38.89ms average cadence** (approximately 26fps), with no console errors. Software rendering remains a slower path; these measurements are not a guarantee across hardware.
- Reduced motion retains the existing static presentation and usable ordinary gallery. Texture/module/WebGL failure, timeout or context loss leaves the poster and HTML controls functional.

## Verification

Passed:

- `npm run build` and `npm run build:review`.
- `npm run check`: syntax checks and all 9 unit checks.
- `node --check src/earth-shaders.js`.
- `npm run test:browser`: all **24** browser tests, including the new constrained-texture/shader-compilation test.
- `git diff --check`.

Browser coverage includes immediate content with the WebGL module blocked, first/return entrance and early interaction, forward/reverse/fast scroll docking, motion toggle, OS reduced-motion changes, context loss, texture/WebGL/storage denial, initialization timeout, keyboard product selection, pending/configured destinations, deep anchors/history/resize and no-JavaScript reading. Responsive checks passed at 320, 375, 390, 430, 768, 1024, 1440, 1920 and 2560 CSS pixels.

Visual review compared the pre-change hero against the new full-quality and adaptive renders: finer land/cloud detail, distinct ocean shading, softer atmosphere, more legible Indian city illumination, and unchanged text/CTA composition. The in-app browser also confirmed the final five-card dock and the 390px mobile poster with no document overflow. Large-screen automated layout checks passed. Physical Safari/iOS/Android devices and physical high-DPI panels were not tested.

Local evidence is intentionally untracked under `.preview/globe-polish/`: `before.png`, `after-full-quality.png`, `after-early.png`, `after.png`, `docked.png`, `mobile.png`, and `browser-results.json`. The two headless after captures show full and adapted quality respectively; the in-app capture records final full quality.

## Files changed

- `src/globe.js` — renderer integration and quality controls.
- `src/earth-shaders.js` — new surface, cloud, atmosphere and node shaders.
- `scripts/prepare-earth.py` — reproducible source-map conversion.
- `public/assets/earth/day-2k.webp`, `day-4k.webp`, `normal.webp` — improved maps.
- `public/assets/earth/cloud-ocean-2k.webp`, `cloud-ocean-4k.webp` — new packed maps.
- `public/assets/globe.js` — rebuilt production bundle.
- `scripts/editorial.mjs`, `public/credits/index.html` — asset attribution only.
- `tests/browser/homepage.spec.mjs` — constrained texture-device regression.
- `docs/V2_ASSETS.md`, `docs/GLOBE_POLISH.md` — historical manifest note and current report.

- BUSINESS LOGIC CHANGED: NO
- ROUTES CHANGED: NO
- DEPLOYMENT CONFIG CHANGED: NO

DO NOT MERGE. DO NOT PUSH. Local commit only.
