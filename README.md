# MarketDeck Web

The public MarketDeck homepage, deployed as static files behind the central Caddy gateway at https://marketdeck.in/.

This repository does not own authentication or the product applications. This implementation adds no backend, database, framework, analytics service, or runtime dependency.

## Develop and validate

Use Node.js 20 or later. No package installation is required.

```sh
npm run build
npm run dev
npm run check
```

Open http://127.0.0.1:4173. The server binds to loopback only. `npm run dev -- --port 4180` selects another port. Reload the browser after changes.

`npm run build` produces `public/index.html`. Deploy the entire `public/` directory through the existing static deployment workflow. The generated HTML is committed, so the current deployment model needs no build or routing changes. Do not deploy the repository root.

## One place for destinations

Edit `src/site-data.json`, then run `npm run build` and commit both the source and regenerated HTML.

- Products: `products[].url`
- Community/social: `community[].platforms[].url`
- Newsletter: `newsletter.url`
- General contact, partnerships, support: `contact[].url`
- Legal documents: `legal.privacy` and `legal.terms`

Use confirmed root-relative paths, HTTPS URLs, or a confirmed `mailto:` destination. A `null` URL renders readable, non-interactive pending content. Never substitute `#` or a guessed profile. The build rejects unsupported destination protocols.

The three confirmed production paths are `/screener/`, `/charts/`, and `/futures-and-options/`. They are owned by other applications; the local static server intentionally returns 404 for these paths. Commentary and Crypto World remain pending until their URLs are supplied. No contact email, social account, newsletter service, or form submission endpoint has been invented.

## Files

- `src/index.template.html`: semantic homepage content and three original learning notes.
- `src/site-data.json`: product descriptions and all configurable destinations.
- `scripts/build.mjs`: small dependency-free static renderer; produces crawlable HTML.
- `public/home.css`: responsive homepage styles, scoped components, motion preferences.
- `public/home.js`: progressively enhanced tabs, article reader, mobile navigation, and subtle ambient motion.
- `public/assets/`: optimized original illustrations, icon sprite, and favicon.
- `tests/homepage.test.mjs`: route, pending-state, SEO, asset, no-JavaScript content, and destination validation checks.
- `docs/ASSETS.md`: artwork provenance and generation prompts.
- `docs/HOMEPAGE_REPORT.md`: implementation and verification report.

## Behaviour and accessibility

All meaningful text, product links, community destinations, and learning notes are in the initial HTML. Without JavaScript, product and community panels remain visible, anchor links work, the mobile menu uses native details, and learning notes expand inline. With JavaScript, tabs support arrow keys, Home/End, and roving focus. Articles use a native modal dialog with Escape dismissal and focus restoration.

The hero is an optimized raster Earth with subtle layered motion. It requires no WebGL or video download. The OS reduced-motion preference disables animation, and an explicit pause control stores only a session-scoped preference. Animation pauses when the document is hidden; hero and orbit animations also pause offscreen. No live prices, user statistics, ratings, or source citations are fabricated.

## Follow-up configuration

When destinations are finalized, update the JSON and rebuild. Add a real newsletter or contact destination only after its receiving service exists. Future blog pages can use the existing editorial structure; this change does not invent a blog route or add a CMS.
