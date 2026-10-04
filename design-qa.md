# Homepage product-card preview QA

final result: blocked

## Target and scope

- Source visual truth: `/workspace/scratch/adf03b8116c5/upload/image(20261004-175404).png` (user-selected playable-preview concept; attached file `libfile_12e02e8054a48191a7552d39f7e6e2a5`).
- The attachment is a screenshot of the concept with viewer controls overlapping its lower corners. Those viewer controls are not product UI.
- User overrides: update only the five research-stack cards; retain current site colours and compact sizing; keep the work undeployed until the other deployment is finished.
- Baseline: `09442cb`, including the merged Research Desk changes.
- Implementation: homepage served by an isolated local preview rooted at `.preview/cards-site`.
- Implementation screenshot: unavailable. No screenshot or browser verification is claimed.
- Intended desktop comparison: 1440 × 1024 CSS pixels, DPR 1, Charting selected with a visible crosshair.
- Intended responsive checks: 390 and 320 CSS-pixel widths, all five cards, keyboard and touch controls.
- Source/implementation density normalization and focused/full-view comparison: not performed because the browser cannot load the preview.

## Blocking finding

[P1] Browser-rendered verification is unavailable in this session.

The cloud browser rejected `http://terminal.local:4173/` with `ERR_BLOCKED_BY_CLIENT`, followed by an explicit browser security-policy rejection. No alternate browser surface or navigation workaround was attempted after that policy rejection. Desktop/mobile screenshots, primary browser interactions, console-error inspection, and visual comparison remain required before merge/deployment.

## Required fidelity surfaces

- Typography: uses the existing homepage font tokens and icons; rendered wrapping and readability remain unverified.
- Spacing: card-only styles use 22/24px desktop padding, compact plots, 32px controls; mobile padding 19/20px and controls 36px. Actual layout and overflow remain unverified.
- Colours: existing `--surface`, `--blue` (#59a7f5), slate labels and borders; no global token changes. Visual comparison remains pending.
- Assets: existing icon sprite and original artwork retained for the no-JavaScript fallback. The preview charts are functional canvas plots of the bundled fictional datasets and calculated option payoff, not decorative replacements.
- Copy: existing product names, categories, leads and Explore links retained. Fictional sample labels added directly to the previews; no live feed or actual transcript is claimed.

## Completed non-browser verification

- Production bundle/build and review build succeeded.
- New calculation/data tests: 4/4 passed. Checked sorting, long-call/long-put premium losses, breakevens, covered-call cap and underlying loss, positive finite samples, and date endpoints.
- Full suite: 100/102 passed. Current-main baseline: 96/98 passed. The same two pre-existing failures occur in both: stale external-script allowlist and stale product-art preview assertions.
- A portfolio-specific assertion now checks its portfolio section rather than prohibiting educational sample rupee values anywhere on the homepage.
- JS syntax checks and `git diff --check` passed.
- Exact normalized HTML comparison: all markup outside the card grid is unchanged, apart from the two new preview asset tags.
- Existing global CSS/JS, original overview CSS, bot CSS/JS, portfolio CSS/JS and product destinations are byte-identical to baseline.
- Added JS/model/CSS transfer: 18,188 bytes raw; 5,790 bytes gzip, with no polling, new API calls or dependencies.

## Comparison history

No rendered comparison was possible. Do not interpret build or unit-test success as design QA passing.

## Before deployment

1. Confirm the user's other work/deployment is finished. Keep this draft unmerged in the meantime.
2. Rebase or merge the latest `main`, retaining concurrent changes.
3. Open the local preview in an allowed cloud-browser session; capture desktop and phone layouts.
4. Compare the card grid with the selected concept, allowing the requested current-palette, compact-sizing and unchanged-page adaptations.
5. Verify all filters, chart pointer/keyboard interaction, strategy switches and range control, source/excerpt switches, BTC/ETH, and Explore destinations.
6. Check 320/390px overflow, touch scrolling, reduced motion, no-JavaScript fallback and browser console errors.
7. Fix any P0/P1/P2 findings, re-capture, and update this report to `final result: passed` before merge/deploy.
