# VaR simulation research contract — INT-VAR-SIM-1.0

This applies the preserved twenty-part publication contract to the replacement public pilot. The earlier company-reporting work at bf2a6f1 remains PAUSED — RIGHTS REVIEW REQUIRED; it is neither rejected nor published. Its files and branch are unchanged.

## Question / descriptive objective

When do Historical, Gaussian and Cornish-Fisher loss thresholds disagree, and does a larger estimate imply better held-out breach calibration? This is estimator behavior, not a forecast, portfolio recommendation or model-selection rule for investors.

## Population, sources and rights

All numerical return observations are generated locally by NumPy PCG64 from fully specified distributions. No exchange, company, price, user, account or portfolio dataset enters the experiment. MarketDeck owns the generated observations, outputs and authored tables/figures/text (GREEN). Mathematical definitions are independently implemented/reused with source citations, not copied source tables or long quotations. NumPy software licensing is distinct from numerical-data rights. No third-party data acquisition is authorized.

Source register: current MarketDeck pure calculations, StockProof revision 54da2757850dd520ab9c0734a7689bba2dfce41b, screener/metrics.py; NumPy quantile/random documentation; NIST moment definitions; Kupiec original paper; published Cornish-Fisher approximation literature. References establish methodology only, not external numerical input. Record source-review date at actual review.

## Preregistered conditions

- Four processes: normal; skew-normal shape -5; Student t with 8 degrees of freedom; 95% N(0,1) + 5% N(-4,2²).
- Center each process using its theoretical mean and scale using theoretical variance, then multiply by 0.01. Population mean 0, standard deviation 1% per synthetic observation. Never standardize each realized sample to the target moments.
- Train lengths 252, 756, 1260; holdout 2000 independent draws from the identical process. These lengths are only intuitive 1/3/5-trading-year analogies, not actual trading days.
- Confidence 95%, 99%; all methods share the same train and holdout within each replicate for paired comparison.
- Independent RNG streams per scenario, train length, replicate, train/holdout: SeedSequence([20261004, scenario_index, train_length, replicate, role]), PCG64. Confidence/method uses no additional randomness.
- Benchmark cost at 128 repetitions; examine 1000/2000/4000 repetitions, increase to 8000 if convergence warrants. No selection of a favorable seed or scenario.
- Convergence gate: compare equal halves, maximum relative median-VaR difference <=2%, mean breach-rate difference <=0.15 percentage points and rejection-frequency difference <=4 percentage points. Report Monte Carlo errors and all conditions, including instability; this is numerical stabilization, not proof of real-world accuracy.

## Method / numerical rules

Historical is minus the interpolated empirical (1-c) quantile, rank (n-1)(1-c), linear interpolation. Gaussian = -(mean + z sample_std), standard deviation ddof=1. Cornish-Fisher uses z+(z²-1)S/6+(z³-3z)K/24-(2z³-5z)S²/36 with moment-ratio skewness S=m3/m2^1.5 and excess kurtosis K=m4/m2²-3 (moments divide by n, no bias adjustment). Reuse the exact deployed pure module as a frozen reference and prove equivalence of vectorized calculation over generated/edge fixtures. Production calculations remain untouched.

Breach iff holdout_return < -VaR, strictly, not absolute return. Kupiec LR = 2[(T-x)log((1-x/T)/(1-p))+x log((x/T)/p)], p=1-c, using 0 log 0=0 boundaries; survival erfc(sqrt(LR/2)), reject at p-value <0.05. Test is unconditional coverage, not independence or loss-severity validation. Holdout expected breaches 100 or 20; reference chi-square is asymptotic. Estimation uncertainty means rejection frequencies need not equal nominal 5% even for a correctly specified process.

No smoothing/winsorization/rearrangement, negative-VaR clipping or silent exclusion of unstable CF estimates. Record all finite estimates; nonfinite fails publication. Separately flag CF derivative nonmonotonicity anywhere over lower-tail probabilities [0.001,0.1], and 99%-below-95% threshold ordering. Do not describe flagged approximations as valid quantiles merely because they are numeric.

## Outputs, dictionary and acceptance

Grain is scenario × train length × confidence × method. Outputs: median/p25/p75 estimated loss %; median and mean held-out breach %; signed mean breach error in percentage points; Monte Carlo SE of mean breach%; Kupiec rejection % with Monte Carlo SE; intermethod disagreement % (>20% range relative to median absolute threshold); CF monotonicity/order flags. Denominator of each replicate-rate summary is the replication count; breach denominator is 2000 per replicate. p25/p75 describe between-estimation dispersion, not confidence intervals. Round once in the public renderer; retain full precision in JSON. No composite score or universal winner.

Version INT-VAR-SIM-1.0 changes only for interpretation-sensitive rules. Publish one Intelligence-owned research note, with distinct research labeling, real generated-result captions and stable table/figure/method/source anchors. Dates must match actual publication and frozen run. Keep source code and aggregate JSON with pinned Python/NumPy versions and run digest. Corrections append dated reason and affected values, preserve URL/anchors and prior method ID; cosmetic deploys do not refresh research dates.

Acceptance: determinism; RNG role separation; independent formula fixtures; canonical equivalence; convergence and uncertainty; full table consistency; finite numeric boundaries; rights/source register; no private data; mobile/desktop/static visual checks; asset bytes; Article/Breadcrumb without Dataset/FAQPage; canonical/GA4; zero unexplained publisher drift; rollback and exact IndexNow event.

Relationship to product: product Kupiec uses its estimation history (in-sample). This study uses independently generated held-out observations. No product formula, UI or privacy behavior changes. Measurement establishes unavailable/pending outcomes truthfully: crawler, discovery/index, impressions/clicks, referring domains/mentions, correct AI citations/referrals and Portfolio handoffs. SG-07C stays frozen; no automated citation experiment.
