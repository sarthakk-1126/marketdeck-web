# Research Desk audit and release

Audited 4 October 2026 against the deployed application sources and stored public filings. Scope: six product repositories, reusable routes, authentication, company data, persistence and deployment boundaries. This is a focused integration audit, not a claim that every unrelated feature in every product has been retested.

| Repository | Existing capability | Research Desk decision |
| --- | --- | --- |
| marketdeck-web | Static storefront, local esbuild bundles, shared Lens and product shortcuts | Own the small desk bundle and stylesheet; add Lens and homepage entry points |
| stockproof | Companies, annual NSE filings, source traces, corrected owners' profit, peers, calculators, private Note rows and shared login | Own server-rendered shell, public filing/search endpoints and owner-scoped desk state |
| charting-v1 | Company jump resolver, stored broker-sourced market history, indicators and chart research | Link to its existing workspace; do not copy or expose its market-price data in the public desk |
| fo-analytics-v1 | Option calculator and strategy/payoff tools | Retain existing Lens shortcuts; no new derivatives calculations in this stocks workspace |
| crypto-tools-v1 | Independent crypto research and calculators | Retain shared navigation; no cross-product database access |
| market-commentary-v1 | Citation/search research | Retain shared navigation; no model or commentary API dependency |

## Supported inputs and known gaps

AnnualFinancials supplies reporting period, recorded basis/format, publication date and its provenance, stored date, statement values and XBRL source traces. Existing `year_metrics` is reused, including its documented owners' profit correction. Revenue, net profit, operating cash flow, EBIT, diluted EPS and derived net margin are supported. Monetary statement values use INR; EPS uses INR/share; margin uses percent.

The audited TCS store contains eight annual periods, FY2018–19 through FY2025–26. Operating cash flow is absent in the first three periods. FY2021–22 and FY2022–23 contain filed EPS of zero; the desk preserves zero and declines to run an EPS scenario from it. The latest stored TCS revenue is ₹267,021 crore, profit ₹49,210 crore and operating cash flow ₹52,094 crore. Publication and storage dates are displayed separately.

Bank total income is not silently relabelled revenue. Missing values remain null. Unknown or changed reporting bases break chart comparisons; peers need the exact period, basis and statement format. Peer growth needs comparable annual periods separated by 300–430 days and a positive prior revenue. The view is reporting history, not a point-in-time investment backtest. Original NSE links are only available when the existing stored snapshot identifies the matching latest document; earlier periods link to the source-trace tables.

The peer request is bounded to 30 alphabetically ordered companies in the stored sector, with the limit and omitted/missing coverage disclosed. Public filing payloads are cached briefly; private desk responses and the page are never cached. No provider calls, LLM calls, paid service, job, migration or infrastructure change is required.

## Interaction and persistence

One small company tile provides restrained pointer tilt. Five flat research choices give real-data hover/focus previews and useful destinations. Reduced motion disables the tilt and transitions. The metric mixer allows three metrics, with a common positive index base and explicit unit conflicts. Reporting-period selection links charts, peers and scenarios. Source details and pinned observations expose values, basis and dates. Scenarios disclose equations and user assumptions and can be copied into private notes.

Saved desks reuse the user's existing company Note rows with the `MarketDeck Research Desk / v1` prefix. Ordinary notes remain unchanged. Company notes display structured desks as readable links rather than editable JSON. New pin values are reconstructed from server-side filing data; previously saved pins retain their captured evidence. Owner filters, CSRF and optimistic update versions protect writes. Client state stays in page memory; no private desk content is sent to analytics or persistent browser storage. Edits during an in-flight save stay unsaved until a subsequent save succeeds.

## Validation

- Five independent JavaScript calculation tests: shared baseline, gaps, basis changes, units, peers and scenario arithmetic.
- Thirteen Django tests: data/provenance, bank missing states, owner isolation, stale writes, CSRF, payload bounds and captured evidence.
- Browser checks at 1440px and 390px: navigator, mixer, shared timeline, evidence/source dialog, zero-EPS scenario, compound calculator, signed-out notes, saved-account round trip, edits during save, reduced motion and horizontal overflow. No page errors.
- Backend integration checks: 279/280 pass in the existing application image, covering Research Desk, ordinary company notes, the shared shell, statements, peers and cross-product links. An existing portfolio asset-inventory assertion is also confirmed failing in the untouched image.
- Web suite: 96/98 tests pass. The two failures also reproduce on untouched main (91/93): an artwork `data-preview-src` assertion and an outdated external-runtime allowlist assertion after existing platform analytics integration. Neither is introduced by this feature.

Release uses the existing repository review/merge and application deployment process. No reverse proxy, Compose definition, database schema, systemd, firewall or cron edits. Root assets must be available before activating the backend template. Verify production HTTP responses, assets, default TCS, a bank's missing states, company/Lens entry points and private-state 401 after rollout.
