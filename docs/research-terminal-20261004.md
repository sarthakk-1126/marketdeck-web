# Company research terminal — 4 October 2026

The existing Research Desk is extended into a company workspace. Its filing mixer,
timeline, exact-period peers, source trace, notes and guarded owner-private saves
are reused. Existing Charting and F&O remain the authorities for their engines,
permissions and market-data gates.

## Features

| View | Behavior and data contract |
| --- | --- |
| Research | Existing metric mixer, indexed/actual scales, dates, missing-data gaps and pins |
| Charting | Same-origin company chart; stored OHLC, indicators, drawings and saved layouts remain in Charting |
| Value Lab | Earnings/exit, equity cash flow, firm DCF and dividend models; editable assumptions, up to six return comparisons, clickable sensitivity grid and year-by-year calculation |
| Reverse valuation | Bounded implied growth for a user-entered comparison price; never a fetched quote or forecast |
| F&O | Existing historical chain, strategy builder and manual option calculator; supported stock universe and live-data gates preserved |
| Peers / Scenarios | Existing exact-period comparisons and deterministic business/earnings/compound scenarios |
| Changes | Server-captured annual filing baseline; new/revised/removed periods, numeric/basis/date changes; explicit review advances the snapshot |
| Thesis / Notes | Private editable claims, supporting/counter evidence, invalidation conditions and linked filing pins |

Investing, Chart research and Options modes select the workspace layout. The
inspector can collapse and resize with mouse or keyboard. A linked company chart
can sit beside research/valuation. Focus mode and horizontal mobile tabs preserve
the active canvas. The company tile alone has restrained tilt/hover previews;
reduced motion disables it.

## Valuation conventions

- Per-share equity/dividend cash flows use the required equity return. Firm FCFF
  uses WACC and a single cash/debt bridge; totals and diluted shares both use crore
  units. Debt is never deducted again in equity cash flow models.
- Earnings valuation discounts future EPS × exit multiple and each forecast
  dividend. EPS and dividends grow at the same assumed rate, stated on screen.
- Cash-flow terminal growth must be below the discount rate. Negative modeled
  equity remains negative. No missing figure becomes zero.
- Filed positive diluted EPS can explicitly seed an assumption with its filing
  source/date. Editing clears the seed label. Other inputs are user assumptions.
- Three named valuation scenarios can be kept. Four thesis questions are bounded
  to 500 characters per field. All private state stays in the existing Note
  envelope; CSRF, ownership, optimistic revisions and no-store responses remain.
- No LLM, paid service, broker execution, provider change, new table, migration,
  infrastructure or shared-auth configuration change.

## Embed contract and release order

Only designated engine views with `embed=desk` permit `SAMEORIGIN` framing and
`frame-ancestors 'self'`; ordinary pages retain DENY. Embedded responses are
private/no-store and noindex. The bridge posts only readiness/company/title to
the same-origin parent; it never exports prices or saved records. GET forms and
date links retain embed state; other product links open a full workspace tab.
The embedded stock picker is locked to the outer company navigator. Unsupported
embedded symbols return 404 instead of silently falling back to an index.

1. Deploy marketdeck-web assets through its existing workflow.
2. Deploy charting-v1 and fo-analytics-v1 opt-in views through their workflows.
3. Deploy stockproof template/backend through its existing workflow.
4. Verify production Value Lab, real price chart, historical availability,
   deterministic calculator, sources, frame headers and mobile layout.

The new template loads `/assets/research-terminal.js`; the existing V1 bundle
is retained. Old open clients can save notes without erasing terminal state.
Rollback the StockProof template/backend before removing new engine/assets.

## Pre-release verification

- 12 JS calculation tests pass, including independently derived perpetuity,
  enterprise bridge, earnings dividends, reverse solves and filing deltas.
- StockProof: 48 targeted tests pass; Charting: 44 pass; F&O: 85 tests,
  77 pass and 8 real-cache checks skip when their archives are absent.
  Tests run in isolated layers over the running application images, without
  production volumes or network access.
- Two browser scripts pass at 1440×1050 and 390×844: sources, gaps, original
  scenarios, valuation, reverse, engine host wiring, pins/thesis, saved/reopened
  private state, baselines, layout and reduced motion. No page errors/outer
  horizontal overflow. Embedded host fixtures are explicitly labeled; engine
  rendering/pricing has separate Django checks and production verification.
- The full web suite passes 107/109; both failures reproduce on unchanged
  upstream (100/102): stale analytics runtime allowlist and an artwork preview
  attribute check. They are outside this feature.
- An existing historical-chain archive fetch RuntimeError now becomes an honest
  unavailable-data state, tested without invented expiries or prices.

Run `npm run build:review`, `npm run build`, `npm run check` and
`node --test tests/research-*.test.mjs`. Browser scripts require
`RD_TEST_ORIGIN`, an isolated fixture session path and optional `RD_CHROMIUM`.
