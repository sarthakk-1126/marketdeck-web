# When Portfolio VaR Methods Disagree: A Reproducible Simulation

MARKETDECK INTELLIGENCE / ORIGINAL RESEARCH

When Portfolio VaR Methods Disagree: A Reproducible Simulation
Same theoretical volatility. Different tail shapes. Three estimates that answer the same probability question—but do not always agree.

Published 4 October 2026 · Substantively modified 4 October 2026 · Sources reviewed 4 October 2026 · INT-VAR-SIM-1.0

The direct finding. In these generated distributions, shape—not just volatility—changes tail thresholds. At 99% confidence with 1,260 estimation observations, median Gaussian VaR stays near 2.32% in all four processes. Historical and Cornish-Fisher move from roughly 2.31–2.32% under normality to 3.90–3.92% in the skew-and-fat-tail mixture. Larger estimates do not guarantee better breach calibration. These are controlled model-behavior results, not forecasts of Indian or other actual market returns.

## Study design at a glance

Estimation / holdout pairs96,000

Repetitions per condition8,000

Estimation observations252 / 756 / 1,260

Independent holdout2,000 observations

Confidence levels95% / 99%

Generated observations264,576,000

Each process has theoretical mean zero and standard deviation 1% per synthetic observation. We center and scale the generating distribution using its theoretical moments; we do not force every realized estimation sample to have those moments. That leaves estimation noise visible. Each repetition generates one estimation sample and a separately seeded holdout from the same process. All methods and both confidence levels share that pair, so comparisons are paired rather than confounded by different return draws.

The estimation lengths are familiar as approximately one, three and five trading years, but only as an analogy. No generated observation is an actual trading day. These are scalar synthetic return series, not simulated holdings, a reconstructed investor portfolio or a market-calibrated universe.

### Four explicit generating processes

Normal: 0.01 × Z, Z ~ N(0,1).

Negative skew: skew-normal shape α = −5. Set δ = −5/√26 and X = δ|Z₁| + √(1−δ²)Z₂, with independent standard normals. Return = 0.01 × (X−δ√(2/π))/√(1−2δ²/π).

Fat tails: 0.01 × √(6/8) × Student t₈. Population excess kurtosis is 1.5. The fourth moment exists; the eighth does not, making estimated high moments particularly noisy.

Skew and fat tails: independently choose X ~ N(0,1) with probability 0.95, or N(−4,2²) with probability 0.05. Return = 0.01 × (X+0.2)/√1.91. This combines a rare negative shock and a larger scale; it is an iid mixture, not a persistent volatility regime.

No separate regime-switching scenario was added. Temporal persistence, autocorrelation and clustered volatility are outside this experiment; an iid mixture cannot establish results about them.

## Key results: 99% VaR with 1,260 estimation observations

VaR is a loss threshold in percent per synthetic observation. The breach target here is 1%. Every rate is aggregated over 8,000 independently generated pairs. p25–p75 describes variation between estimates, not a confidence interval. MCSE is Monte Carlo standard error of the aggregate mean or frequency, not uncertainty about actual markets.

Full results: see the public HTML tables and frozen aggregate JSON.

Figure 1. Median estimated loss (%) at 99% confidence, n = 1,260. All values are printed in the comparison table. Generated results, not market observations. [Methodology](/intelligence/notes/when-var-methods-disagree/#methodology).

Figure 2. Mean holdout breach rate (%) at 99% confidence, n = 1,260. The dashed line is the 1% target, not a recommended risk limit. [Methodology](/intelligence/notes/when-var-methods-disagree/#methodology).

## Why the methods disagree

### Normal returns: similar centers, different estimation dispersion

At n = 1,260 and 99%, Historical, Gaussian and Cornish-Fisher median thresholds are 2.308%, 2.326% and 2.321%. Their mean breach rates are 1.076%, 1.008% and 1.027%. The normal model's mean and standard deviation summarize this generating process well. Historical quantiles instead rely on relatively few tail order statistics; Cornish-Fisher estimates extra moments even when their population values are zero. Similar median estimates therefore need not have the same variability or rejection frequency.

### Negative skew: the Gaussian shape misses the asymmetric tail

Gaussian mean breach frequency rises to 2.589%, against the 1% target, while Historical reaches 1.073% and Cornish-Fisher 1.099%. Matching mean and variance does not match a negatively skewed tail. The moment adjustment moves Cornish-Fisher toward the empirical estimate in this particular skew-normal process. That is evidence about this process and truncation—not a universal endorsement of moment correction.

### Fat tails: larger is not synonymous with correctly calibrated

For t₈ at the same n and confidence, Cornish-Fisher's median threshold is 2.608%, above Historical's 2.480%. Its mean breach rate is 0.846%, below the 1% target, while Gaussian is 1.392%, above it. Under- and over-breaching are both departures from the stated probability claim. A larger threshold may be conservative for coverage, but this test does not assess utility, capital costs or the magnitude of losses beyond the threshold.

### Combined skew and fat tails: confidence level changes the story

At 99%, Historical and Cornish-Fisher median thresholds are 3.917% and 3.902%, with mean breach rates 1.075% and 1.084%. Gaussian breaches average 3.110%. But Cornish-Fisher at 95% averages 3.758% breaches against a 5% target, and rejects coverage in 75.11% of repetitions. Agreement at one tail probability does not validate the whole distribution.

### Sample size: fewer observations in the tail

A 252-observation estimation sample has only about 2.52 expected observations below a population 1% quantile. At 1,260, that becomes 12.6. These are expectations, not required counts. Interpolation and sampling variation matter at 99%, particularly for Historical VaR. For normal returns, Historical's 99% interquartile width changes from 0.275 percentage points at n = 252 to 0.138 at n = 1,260. Longer estimation generally reduces dispersion here; it does not eliminate approximation bias or make iid-generated evidence applicable to shifting markets.

### 95% versus 99%: more than a larger multiplier

The lower 1% tail has fewer empirical observations and responds differently to kurtosis terms than the lower 5% tail. Do not extrapolate calibration at one confidence level to the other. The full tables expose both levels for every process and sample length. We report no composite score and no universal winner.

## Independent holdout calibration and Kupiec

For each threshold, a breach is a holdout return strictly less than the negative loss threshold. Its rate has denominator 2,000. The targets are 5% at 95% confidence and 1% at 99%, giving 100 or 20 expected holdout breaches if the threshold equals the true quantile. We apply the deployed Kupiec proportion-of-failures function and reject at p-value < 0.05.

The test checks unconditional coverage. It does not check breach independence, tail-loss severity, expected shortfall, model stability or investment suitability. Its chi-square reference is asymptotic. Rejection proportions include estimation uncertainty: thresholds are estimated, not known population quantiles. Consequently, even under a normal process the rejection proportion need not equal 5%. Increasing holdout length with estimation length fixed can make small estimation errors easier to detect. A non-rejection is not proof of calibration.

We flag a material intermethod disagreement when (largest − smallest threshold) / median absolute threshold exceeds 20%, evaluated per repetition. This is a descriptive study convention, not a trading rule. The denominator is the paired repetition count, and identical disagreement rates across methods are deliberate.

## Full result tables: all 72 conditions

Values are rounded once for display. The linked aggregate JSON retains full precision. Scroll tables horizontally if needed; the page itself remains within the viewport. All rows are present in server-delivered HTML, with no data fetch or account required.

### Normal

Full results: see the public HTML tables and frozen aggregate JSON.

### Negative skew

Full results: see the public HTML tables and frozen aggregate JSON.

### Fat tails

Full results: see the public HTML tables and frozen aggregate JSON.

### Skew and fat tails

Full results: see the public HTML tables and frozen aggregate JSON.

### Disagreement and numerical diagnostics

Full results: see the public HTML tables and frozen aggregate JSON.

No nonfinite estimates, negative thresholds, CF confidence-order crossings or derivative failures were observed in this frozen run. We tested the CF quantile derivative over lower-tail probabilities 0.001–0.1. These diagnostics do not prove the approximation is accurate, valid outside that interval, or stable for another distribution. A finite number is not sufficient validation.

## Methodology: known definitions, exact implementation

Let c be confidence, q = 1−c, μ the sample mean, s the standard deviation with denominator n−1, and z the standard normal q-quantile. Let mₖ = mean((r−μ)ᵏ), S = m₃/m₂³ᐟ² and K = m₄/m₂²−3. Moment denominators are n, with no sample-bias adjustment. Units below are return fractions; tables multiply by 100.

HistoricalVaR = −Q(q), empirical quantile with h = (n−1)q and linear interpolation between sorted observations. No nearest-rank substitution.

Gaussian / ParametricVaR = −(μ + z s).

Cornish-FisherzCF = z + (z²−1)S/6 + (z³−3z)K/24 − (2z³−5z)S²/36; VaR = −(μ + zCF s). This specified four-cumulant approximation is not an exact distribution quantile.

Kupiecp = 1−c, T = 2,000, x = breaches, p̂ = x/T. LR = 2[(T−x) log((1−p̂)/(1−p)) + x log(p̂/p)]. Use 0 log 0 = 0 at boundaries. p-value = erfc(√(LR/2)), equivalent to the upper tail of χ² with one degree of freedom.

The frozen pure calculation reference is [StockProof metrics.py at 54da275](https://github.com/sarthakk-1126/StockProof/blob/54da2757850dd520ab9c0734a7689bba2dfce41b/screener/metrics.py). The experiment vectorizes VaR estimation for local compute efficiency and proves agreement with those exact functions at relative tolerance 10⁻¹²; Kupiec calls the reference function directly. No production Portfolio calculation has been changed.

Invalid sample/confidence/nonfinite input fails validation. Constant samples make moment-based Cornish-Fisher unavailable; they are tested as an edge case and are not among the generated study samples. We do not clip negative thresholds, winsorize observations, rearrange CF quantiles, smooth estimates or silently discard unstable results. Publication fails on a nonfinite output. Missing results are unavailable, not zero.

Monte Carlo standard error equals the across-repetition sample standard deviation divided by √8,000. For rejection percentages the same rule is applied to the binary rejection indicator and multiplied by 100. These errors describe simulation precision conditional on the design. They do not include uncertainty from choosing the generating processes.

## Reproduce the frozen study

Use Python 3.12.14 and NumPy 2.3.5. No network, credentials, exchange feed or database is needed during calculation. Download/clone the public code and aggregate result file; numerical samples are regenerated rather than distributed as a giant price file.

python -m pip install numpy==2.3.5
python scripts/research/var_simulation.py --replications 8000
python -m unittest discover -s scripts/research -p "test_*.py"
python scripts/research/validate_run.py

Master seed 20261004. PCG64 receives SeedSequence([20261004, scenario_index, train_length, replication_index, role]). Scenario indices are 0–3 in the design order; replication indices are 0–7,999; role 0 estimates and role 1 holds out. Methods and confidence levels draw no further randomness. Different sample lengths have distinct streams, not nested histories.

Generated-observation SHA-256, in the script's scenario/sample/repetition order, train then holdout, little-endian float64: 3228830e1e7d68109eb4ee59652624a6cd1708dbbe0a9bd4e09e8537725fa6b4. Floating-point/library changes can alter byte hashes; reproduce with the pinned environment before claiming an exact match.

A 128-repetition cost pilot took 1.33 seconds locally. The 4,000-repetition run took 43.89 seconds and missed the rejection-frequency split limit (4.30 percentage points versus 4). The 8,000 run took 84.78 seconds and passed all preregistered limits. Maximum equal-half differences were 0.980% relative median VaR, 0.0586 percentage points mean breaches and 2.125 percentage points rejection frequency. Checkpoints and exact byte-for-byte rerun evidence are in the validation record. Numerical convergence is not a claim of real-market accuracy.

[Simulation source](https://github.com/sarthakk-1126/marketdeck-web/blob/research-var-sim-1.0/scripts/research/var_simulation.py)

[Frozen calculation reference](https://github.com/sarthakk-1126/marketdeck-web/blob/research-var-sim-1.0/scripts/research/canonical_metrics.py)

[Formula, equivalence and edge-case tests](https://github.com/sarthakk-1126/marketdeck-web/blob/research-var-sim-1.0/scripts/research/test_var_simulation.py)

[All aggregate results, full precision](https://github.com/sarthakk-1126/marketdeck-web/blob/research-var-sim-1.0/content/research/var-simulation-results.json)

[Convergence and reproducibility evidence](https://github.com/sarthakk-1126/marketdeck-web/blob/research-var-sim-1.0/docs/research/var-validation.json)

[Study contract and rights register](https://github.com/sarthakk-1126/marketdeck-web/blob/research-var-sim-1.0/docs/research/var-study-contract.md)

## Relationship to Portfolio Analysis

The methods match MarketDeck's conceptual and tested implementation definitions. The current product's Kupiec diagnostic uses the same historical sample used to estimate its threshold: it is in-sample. This study estimates on one generated sample and tests on an independently generated holdout: it is out-of-sample simulation. Neither is a prospective real-market validation. Product outputs are not silently relabeled as holdout results.

[Read the conceptual VaR guide](/intelligence/notes/portfolio-var-historical-parametric-cornish-fisher/), [verify the product methodology](/screener/methodology/#portfolio-analysis), or [explore the public Portfolio Analysis overview](/screener/portfolio-analysis/). This public study needs no portfolio upload or account.

## What this evidence does—and does not—establish

The findings isolate distribution shape and estimation-sample effects under fixed iid processes and identical train/holdout laws. Real returns can have changing regimes, dependence, costs, nonlinear holdings, missingness and structural breaks. None is validated here. The fourth scenario changes mixture scale per independent observation but does not model a volatility time series.

Four deliberately chosen processes are not an exhaustive model comparison. Student t₈ creates noisy higher-moment estimates. Cornish-Fisher truncation can be biased even without a monotonicity flag. Aggregated means can hide rare estimation failures; interquartile ranges omit the most extreme estimates. Kupiec is a limited coverage diagnostic and its rejection fraction is not a probability that a model is “wrong.” We do not assess expected shortfall, forecast profits, recommend a method for every investor, rank portfolios or claim simulated returns represent Indian markets.

All numerical return inputs, output tables, figures and text are MarketDeck-created. No NSE/BSE observations, third-party price dataset, company financial database or real/private user portfolio data enters this study. Sources below document methods, not borrowed numerical data. Authoring/code assistance does not constitute independent peer review; MarketDeck is the publisher, with no invented researcher credentials or external-review claim.

## Method references and source register

Reviewed 4 October 2026. Citation links are methodology references; no source table, empirical dataset, or long excerpt is reproduced.

[NumPy quantile documentation](https://numpy.org/doc/stable/reference/generated/numpy.quantile.html) — linear interpolation convention. Execution is pinned to NumPy 2.3.5, not whatever version the live documentation later shows.

[NumPy parallel random generation documentation](https://numpy.org/doc/stable/reference/random/parallel.html) — SeedSequence and separated streams.

[NIST: measures of skewness and kurtosis](https://www.itl.nist.gov/div898/handbook/eda/section3/eda35b.htm) — moment-ratio definitions and excess-kurtosis convention.

[Glyn Holton: the Cornish-Fisher expansion](https://www.value-at-risk.net/the-cornish-fisher-expansion/) — cumulant-based quantile approximation and its scope. Our exact specified truncation is printed above; adding moments is not assumed to guarantee improvement.

[Paul H. Kupiec (1995), Techniques for verifying the accuracy of risk measurement models](https://fedinprint.org/item/fedgfe/34596/original) — original Federal Reserve working-paper bibliographic record and full-text destination; no claim that the blocked SSRN copy was reviewed.

[Jose A. Lopez (1997), Regulatory evaluation of value-at-risk models](https://www.newyorkfed.org/medialibrary/media/research/staff_reports/research_papers/9710.pdf) — primary methodological discussion of coverage-based evaluation.

[MarketDeck product methodology](/screener/methodology/#portfolio-analysis) and the pinned code reference — implementation conventions, not independent authority.

## Version, corrections and citation

INT-VAR-SIM-1.0 · First publication: 4 October 2026. No material corrections at initial publication. Interpretation-sensitive changes to formulas, denominators, scenarios or eligibility require a new method version and dated change entry. Corrections identify affected results and reasons; prior entries remain visible. This URL and table/figure anchors remain stable. Cosmetic builds do not advance research dates.

Suggested citation: MarketDeck Intelligence (2026), “When Portfolio VaR Methods Disagree: A Reproducible Simulation”, INT-VAR-SIM-1.0, published 4 October 2026, https://marketdeck.in/intelligence/notes/when-var-methods-disagree/. When citing a number, include scenario, estimation n, confidence, method, metric and units; specify synthetic independent-holdout evidence.

To report an error, [open a public issue](https://github.com/sarthakk-1126/marketdeck-web/issues) with the table row and reproduction details. Do not post credentials or private portfolio information.
