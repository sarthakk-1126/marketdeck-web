# Original research publication contract — v1

Established 4 October 2026. Owner: MarketDeck editorial/research. This is a publication gate, not a guarantee of citations or traffic.

## Contract required for each study

1. **Question:** one real research question; record qualitative demand evidence and existing-page overlap.
2. **Objective:** descriptive, causal or predictive; this pilot is descriptive only. Predeclare thresholds before inspecting results.
3. **Universe:** authoritative source, extraction timestamp, entity grain, population denominator and selection bias.
4. **Eligibility:** explicit inclusion/exclusion, active/historical handling and unavailable metadata. Do not infer lifecycle from record absence.
5. **Source register:** owner, source identity/URL, source date, extraction/update date, used fields, transformation and limitations for every input family.
6. **Rights:** classify each output green/yellow/red. This pilot intends authored aggregate results only, but source-specific restrictions must still be resolved before clearance. No raw redistribution, downloadable company CSV, transcript corpus or Dataset schema.
7. **Dictionary:** grain, types, units, meaning, provenance and unavailable semantics for each input/output.
8. **Calculations:** executable rules, numerator, denominator, period/window, duplicate handling, units and rounding.
9. **Missing policy:** null is unavailable; never zero-fill, extrapolate, impute or call an absent stored record an absent filing.
10. **Business exceptions:** separate bank and nonfinancial statement formats. NBFC/insurer identity requires verified classification; sector is not a substitute. Do not compare bank EBIT/operating margin to industrial EBIT/margin.
11. **Dates:** cutoff is the observed database snapshot, period end is not publication/retrieval. Count unique period-end dates; years/quarters are not automatically consecutive or comparable.
12. **Reproducibility:** retain immutable aggregate snapshot, exact read-only query/script, source revision, output digest, independent reconciliation and boundary tests. Never retain secrets or private user data.
13. **Version:** interpretation-sensitive method ID `MD-RC-1.0`; major changes for eligibility/definitions, minor for additive analyses. Ordinary deploys do not bump method version.
14. **Corrections:** stable URL/anchors; append dated reason, affected results and prior/new version. Correct substantive errors visibly, update modified date only for substantive changes. Cosmetic changes are not fresh research.
15. **Publication date:** actual first public release date, never guessed in advance.
16. **Cutoff:** exact successful extraction timestamp; latest observed period and ingestion date reported separately.
17. **Method ID:** visible with the study, tables and reproducibility section.
18. **Outputs:** research contract, source register/dictionary, reviewed aggregate JSON, calculation/test scripts, one substantial canonical note, accessible figures and measurement ledger. Public artifacts contain aggregates only.
19. **Review gate:** source/rights complete; independent numbers reconcile; denominators explicit; business exceptions; no unsupported claims; mobile/static rendering; schema/canonical/GA4; publisher dry-run no unexplained movement; rollback; exact production asset bytes.
20. **Measurement:** URL/publication/cutoff; crawler discovery, indexing, impressions/queries/clicks, earned links/mentions, correct AI citations/referrals and qualified product use. Record unavailable as unavailable. Traffic/citations require observation time, not a release-time success claim.

## Evidence language

- FACT: directly observed source/property, scoped to date and universe.
- DERIVED RESULT: deterministic calculation from identified records.
- INTERPRETATION: what a result means within the observed sample.
- LIMITATION: evidence boundary, selection bias or missing provenance.
- INFERENCE: explicitly identified conclusion not directly measured; no unsupported causal inference.

## Pilot protocol before data audit

Question: How much annual and quarterly reporting history does MarketDeck's current covered company store support, and what limits like-for-like comparison?

Universe: current Company records in the authoritative live StockProof database. FinancialSnapshot is not annual history. Inclusion: all covered entities, including no-history entities. No claim that the store is all Indian listed companies.

Depth thresholds: distinct annual period ends >=3 and >=5; distinct standalone quarter ends >=4, >=8 and >=12. Depth alone does not imply consecutive, aligned or economically comparable periods. Empty histories remain in the denominator.

Audit dimensions: annual/quarterly depth distributions; format/basis consistency; statement availability and genuine null values; period gaps; latest-period distribution/recency; unavailable lifecycle/classification metadata; stored sectors only with classification-rights review. Reproducible comparison eligibility must be stricter than depth and must not claim comparability beyond tested fields.

Publish only findings supported by the fresh audit. If provenance, rights or necessary business classification is incomplete, pause affected claims or the release rather than fabricate them. No second study without CEO review.
