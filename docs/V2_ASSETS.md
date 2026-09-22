> The hero texture/material entries below record V2. The subsequent globe-quality pass replaces the day maps and adds clouds/ocean reflectivity; current sources and transformations are in [GLOBE_POLISH.md](GLOBE_POLISH.md).

# V2 asset and dependency manifest

All runtime visual assets are self-hosted. No external texture, platform icon, font, PDF or product application is fetched by the homepage. `/credits/` provides public attribution; it is linked from the footer. This manifest supplements the original V1 `ASSETS.md`.

| Asset | Source / provenance | Terms and transformations |
| --- | --- | --- |
| `public/assets/earth/day-4k.webp`, `day-2k.webp` | NASA Earth Observatory, Blue Marble: Next Generation, January 2004 topography image. Credit: Reto Stöckli. [Documentation](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/) · [source JPEG](https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-topography/january/world.topo.200401.3x5400x2700.jpg) | NASA imagery usage guidance, not a NASA endorsement. [Terms](https://www.nasa.gov/nasa-brand-center/images-and-media/). Resized equirectangular map to 4096×2048 / 2048×1024; WebP conversion. |
| `night-4k.webp`, `night-2k.webp` | [Solar System Scope textures](https://ftp.solarsystemscope.com/textures/), `8k_earth_nightmap.jpg` | CC BY 4.0. Credited publicly with source, license and modifications. Resized and compressed. Night light texture is masked to the shadowed surface. |
| `normal.webp` | Solar System Scope, `2k_earth_normal_map.tif` | CC BY 4.0. Converted to RGB WebP. Linear color space, restrained normal scale. Same public attribution. |
| `india-earth.webp`, `india-earth-small.webp`, `mumbai-exchange.webp` | Existing V1 Image Gen assets | Preserved original commissioned illustrations. Full prompts and creation provenance remain in `ASSETS.md`. Earth poster is not used as a sphere texture. |
| `products/stockproof.webp`, `stockproof-small.webp` | User-supplied actual StockProof screenshot | Crop x238 y77 to x1836 y1019 excludes account sidebar and desktop/browser chrome. Historical interface capture, resized/WebP. No retained email or account identifier. |
| `products/charting.webp`, `charting-small.webp` | User-supplied actual Charting screenshot | Crop x15 y70 to x1322 y717 excludes browser chrome/taskbar. Historical interface capture; visible values are historical screenshot content, not live data or invented values. |
| `products/fno.webp`, `fno-small.webp` | Read-only authorized local F&O application at `127.0.0.1:8000` | Signed-out interface capture, crop x188 y96 width1700 height650. Labelled local interface / illustrative payoff. Actual application's illustrative chart is not presented as a live trading interface. |
| `products/commentary.webp`, `commentary-small.webp` | Existing `market-commentary-v1/static/images/commentary-studio.png` | Representative product artwork, not a functionality screenshot. Resized and labelled accordingly. Source repository only read. |
| `products/crypto.webp`, `crypto-small.webp` | Existing `crypto-tools-v1/crypto/static/crypto/img/home-hero-crypto.jpg` | Representative product hero artwork, not proof of functioning controls. Source repository only read. |
| `platforms/*.svg` | `simple-icons@15.20.0` | CC0 package; trademarks and brand guidelines remain separate. Exact upstream source/guideline links are recorded in `PLATFORM_ICON_SOURCES.json`. White marks on neutral surfaces identify platforms; no endorsement or confirmed profile is implied. Missing licensed marks use honest text, not fabricated logos. |
| Issue cover/PDF | Original MarketDeck editorial source plus retained V1 Earth illustration | Editable JSON and generator included. Sources cited in PDF and accessible HTML. Draft, not published. |

Raw references, downloaded texture originals, screenshots with application/browser chrome, recordings and QA files stay in ignored `.preview/` or their original local source locations. Only sanitized web derivatives are committed.

## Pinned additions

- `three@0.186.0` — MIT, one focused runtime dependency, bundled into a deferred self-hosted ES module. One canvas/context, no framework migration. Public license: `public/licenses/three.txt` and bundle legal comments.
- `esbuild@0.25.12` — MIT, authoring-time bundler only. Builds committed assets; deployment does not install or run it.
- `simple-icons@15.20.0` — CC0-1.0, development dependency used to extract local SVGs; no runtime package load. Public license: `public/licenses/simple-icons.txt`.
- `@playwright/test@1.56.1` — Apache-2.0, development-only regression, screenshot and actual-site recording tooling.

All versions are pinned in `package.json` and integrity-locked in `package-lock.json`. Node 20+ satisfies their package engine requirements. Both full and production-only npm audit reports showed zero reported vulnerabilities on 22 September 2026; this is a point-in-time registry result, not a guarantee.

The PDF authoring script uses the existing bundled Python/ReportLab/pypdf/Pillow/Poppler environment. No document-generation service or browser runtime dependency was added.
