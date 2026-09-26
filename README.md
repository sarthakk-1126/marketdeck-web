# MarketDeck Web

The MarketDeck homepage is a static site. The existing deployment contract remains the committed contents of `public/`; no server build, framework migration, product routing change, or backend is required.

## Local authoring

Use Node.js 20+:

```sh
npm ci
npm run build
npm run build:review
npm run dev:review
```

Open http://127.0.0.1:4173. Review mode serves `.preview/review` on loopback and includes unpublished editorial drafts with `noindex`. `npm run dev` serves the production `public/` build, which excludes drafts. Choose another port with `-- --port 4180`. These servers intentionally do not implement product applications.

```sh
npm run check
npx playwright install chromium
npm run test:browser
node scripts/capture-review.mjs
```

Browser tests need the review server running. They start a separate production server on 4174. The recording command uses isolated Chromium and writes screenshots, diagnostics and an actual-site video under `.preview/v2/`, excluded from Git and production assets.

## Destinations

`src/site-data.json` owns product, platform, contact, newsletter and legal destinations. Use only confirmed URLs. `null` renders readable pending content, with no fake anchor or action. Community links also need `confirmed` and `enabled`; only external, joinable, confirmed, enabled, deduplicated destinations count as communities. An internal reading page is not counted as an external community.

Confirmed product routes remain `/screener/`, `/charts/`, `/futures-and-options/`. Commentary and Crypto World destinations are pending. The local server's response is not verification of production reverse-proxy routing.

## Content and editorial

See [the editorial workflow](docs/EDITORIAL_WORKFLOW.md). The six-page first Brief remains a local draft pending owner approval. All three learning notes have static HTML URLs. Reading works without JavaScript. No email collection or publishing service is added.

## Implementation

- `src/index.template.html`, `src/site-data.json`: homepage source and central configuration.
- `src/globe.js`: actual Three.js sphere, self-hosted mapped textures, lighting and geographic network.
- `public/experience.js`: one animation clock and shared native-scroll progress for globe and the same five HTML panels.
- `public/home.js`: progressive product selection, on-demand full previews and navigation.
- `scripts/build.mjs`, `scripts/editorial.mjs`: production/review static generation.
- `content/briefs.json`: issue metadata; `content/issues/`: editable issue source and generated PDF/cover.
- `docs/V2_REPORT.md`: implementation, checks, measurements and limitations.
- `docs/V2_ASSETS.md`: V2 asset provenance; `docs/ASSETS.md`: retained V1 artwork provenance.

HTML, poster, copy and actions render before WebGL. Mobile and data-saving connections use the poster; reduced motion keeps the scene static and the gallery ordinary. The visible motion control governs pointer and scroll choreography when the OS allows animation; `prefers-reduced-motion` remains authoritative. Hidden/offscreen rendering pauses. Renderer failure restores the poster. No product logic, authentication, database, APIs or live market data are implemented here.
