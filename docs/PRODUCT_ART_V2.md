# MarketDeck product artwork V2

Owner-authorized publication: 23 September 2026.

## Scope
Five original AI-assisted conceptual illustrations: business foundations, price structure, derivatives geometry, source-linked commentary and digital infrastructure. Not real application screenshots or market data.

## Delivery
1400 x 800 previews, 520 x 290 thumbnails and 1040 x 580 high-density thumbnails. Versioned self-hosted WebP paths with exact SHA-256 hashes and dimensions in asset-manifest.json.
Export total: 633268 bytes across 15 files.
Thumbnails preserve unwarped subjects in a central safe band with edge-tone extensions. Only the object-position CSS property changes; card sizes and motion are unchanged. FNO preview uses a seamless full-frame crop. Old files remain for rollback.

## Reproduction
Run python scripts/prepare-product-art-v2.py ORIGINAL_DIRECTORY with Pillow 12.3.0, then node scripts/build.mjs and node scripts/build.mjs --review.
Original PNGs remain in the review artifacts and connected image workspace; generation task IDs and source hashes are recorded without signed URLs.

## Verification
Fifteen Node contracts plus browser image loading, mobile/desktop overflow and product selection checks. Normal-motion cards are focused and fully docked before click targeting. Globe, product event code, magazine and deployment configuration are protected from change. See the release PR and workflow logs for final results.
