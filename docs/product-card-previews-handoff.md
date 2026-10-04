# Interactive homepage cards — deployment hold

Prepared for the user's selected playable-preview concept on 4 October 2026.

**Do not merge or deploy this draft while the user's other deployment/work is in progress.** The user asked for the code to be ready for later deployment, and explicitly limited changes to the five homepage research-stack cards.

Branch: `feat/product-card-previews-20261004`.
Starting main: `09442cb` (Research Desk already included).
Visual gate: `design-qa.md` is currently blocked by local-preview browser policy. Final desktop/mobile browser QA is required before release.

## Result

- Screener: Growth, Quality and Low debt change the metric and sort three fictional companies.
- Charting: Price/Volume views and an inspectable crosshair, including arrow-key/Home/End input.
- F&O: Long call, long put and covered call with a real expiry calculation, native price slider and visible premium/strike assumptions. Covered call assumes the underlying was bought at ₹250.
- Commentary: illustrative earnings/filing excerpts; timestamp/note switches. No fake audio playback.
- Crypto: BTC/ETH redraw bundled illustrative series. These are not historical market observations.

All demos are local, marked fictional/illustrative, and require no LLM or paid data. No backend or VPS changes. No background animation or polling. Explore links and the original no-JavaScript card content remain.

## Validation and release

Build and review build succeeded. Four new tests pass. Full suite 100/102 versus baseline 96/98; both failures are the same pre-existing stale allowlist/artwork assertions. Markup outside the card grid and existing global, bot and portfolio assets remain unchanged.

When the user confirms the other work is finished, fetch latest main, reconcile any concurrent homepage edits, perform the browser checks in `design-qa.md`, and use the existing GitHub production deployment workflow. Do not enable auto-merge or run a production workflow from this draft.
