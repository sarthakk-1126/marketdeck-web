## Direct answer: the three VaR methods estimate the same tail question with different models

Value at Risk, or VaR, is a threshold for potential loss over a stated horizon and confidence level. A one-day 95% VaR of 2% is commonly read as a model threshold whose loss should be exceeded on roughly 5% of days under the model and measurement setup. It is not a maximum possible loss. Losses beyond the threshold can be much larger.

Historical VaR, Parametric VaR and Cornish-Fisher VaR differ mainly in how they construct the lower tail. Historical VaR reads the empirical tail of the observed return sample. Parametric VaR fits the mean and standard deviation into a normal-distribution model. Cornish-Fisher starts from a normal quantile and adjusts it using the sample's skewness and excess kurtosis. The Reserve Bank of Australia's market-risk research describes historical simulation and variance-covariance VaR as distinct approaches and emphasizes that results depend on method assumptions and data. [S1]

MarketDeck shows the methods separately rather than averaging them into one “risk score.” It also shows a Kupiec proportion-of-failures calibration result for each method and confidence level. [S2] [S4] The current implementation uses the same historical return sample to estimate each VaR threshold and to count breaches, so that calibration result is an in-sample diagnostic. It is useful for checking internal consistency on the observed window; it is not out-of-sample evidence that the model will forecast future tail losses accurately.

## What a confidence level means

VaR needs at least three pieces of information: a horizon, a confidence level and a return or profit-and-loss definition. “95% VaR” without the horizon is incomplete. MarketDeck's Portfolio Analysis currently reports one-day VaR at 95% and 99% confidence using its reconstructed current-book daily-return series. [S4]

For a 95% one-day VaR, the target exceedance probability is 5%. For a 99% one-day VaR, it is 1%. Moving from 95% to 99% pushes farther into the loss tail, so the estimated threshold normally becomes larger in magnitude. The RBA's worked variance-covariance example similarly uses 1.645 standard deviations for a one-tailed 95% threshold and 2.33 for 99%, while stressing that those numbers follow from the model assumptions. [S1]

A confidence level is not a statement that “losses cannot exceed this amount.” It defines a quantile. The remaining tail is precisely where exceedances live.

## Historical VaR: let the observed sample define the tail

Historical VaR sorts the observed return sample and takes the lower-tail empirical quantile. If q is the 5th percentile of daily returns, the 95% historical VaR is reported as the positive loss fraction −q.

The attraction is transparency. Historical VaR does not impose a normal distribution on returns. If the sample contains asymmetry, fat tails or unusual observations, those observations directly influence the empirical quantile. The RBA describes historical simulation as using historical daily changes without assuming a statistical distribution for those changes. [S1]

The limitation follows from the same feature. The sample can only show events that occurred in the chosen window, and the tail contains relatively few observations. At 99% confidence, even a long daily sample has very little information in the final 1%. A calm historical window can understate what a future stressed window might contain. A single extreme observation can also move an empirical quantile sharply when the sample is small.

Historical VaR is therefore model-light, not assumption-free. The choice of window, return construction, interpolation rule and current portfolio definition still matter.

## Parametric VaR: summarize the sample with mean and volatility

MarketDeck's Parametric VaR uses the familiar Gaussian form:

VaR = −(μ + zσ)

Here μ is the sample mean daily return, σ is sample daily volatility, and z is the lower-tail standard-normal quantile for the selected confidence. At 95%, z is approximately −1.645; at 99%, approximately −2.326.

This approach compresses the distribution into its first two moments. It is efficient and easy to interpret, but it carries a strong shape assumption. The RBA describes variance-covariance VaR as relying on normally distributed asset returns and portfolio profit/loss in its example. [S1] RiskMetrics is one of the classic historical references for this family of market-risk techniques. [S3]

If returns are materially skewed or heavy-tailed, the normal curve can place too little or too much mass in the region that matters. That is why a parametric VaR number should be read together with distribution diagnostics rather than treated as inherently more scientific because it has a formula.

## Cornish-Fisher VaR: adjust the normal quantile for shape

Cornish-Fisher VaR keeps the parametric structure but replaces the normal z with an adjusted quantile. In MarketDeck the expansion is:

z_cf = z + (z² − 1)S / 6 + (z³ − 3z)K / 24 − (2z³ − 5z)S² / 36

S is the sample skewness and K is sample excess kurtosis. The final threshold is then:

VaR_CF = −(μ + z_cf σ)

The idea is intuitive: if the sample is asymmetric or has heavier tails than a normal distribution, a normal quantile may not describe the observed shape well. Cornish-Fisher modifies the quantile using measured higher moments rather than pretending those moments are zero. MarketDeck uses the adjustment as another model, not as a guaranteed improvement. [S4]

That restraint matters. Higher moments are themselves noisy estimates. A highly unusual sample can create a large adjustment, and an approximation that works well for one distribution can over-correct another. The appropriate comparison is therefore not “Cornish-Fisher is better”; it is “what assumptions caused the threshold to move, and how did each model calibrate on the observed sample?”

[[figure]]

## Worked example: one synthetic 20-day return sample

Consider this synthetic series of 20 daily returns, expressed as decimals:

−0.060, −0.035, −0.025, −0.018, −0.012, −0.008, −0.005, −0.003, −0.001, 0.000, 0.002, 0.004, 0.006, 0.008, 0.009, 0.011, 0.013, 0.015, 0.020, 0.035.

Using MarketDeck's documented conventions, the sample mean is about −0.22% per day and sample standard deviation about 2.085%. The sample has approximately −1.005 skewness and 1.403 excess kurtosis. These values are deliberately derived from the displayed synthetic observations, not live portfolio data.

| 95% one-day method | Approximate threshold | What drives it |
|---|---|---|
| Historical | 3.625% | Interpolated 5th percentile of observed returns |
| Parametric | 3.650% | Mean, sample standard deviation and normal 5% quantile |
| Cornish-Fisher | 4.147% | Mean and volatility plus sample skewness and excess kurtosis |

The three results are close enough to recognize the same loss scale, but the Cornish-Fisher threshold is larger because the synthetic sample is negatively skewed and has positive excess kurtosis. That difference is not a signal to trade. It is evidence that distributional shape matters to the tail estimate.

The small sample also demonstrates why tail statistics need humility. At 95% confidence, the expected number of exceedances over 20 observations is only one. One extreme day can therefore dominate both the threshold and its calibration. Kupiec's original verification work emphasizes that low-probability VaR accuracy is difficult to verify reliably in small samples. [S2]

## Kupiec calibration: observed breaches versus the stated rate

A VaR model makes an observable frequency claim. If a 95% one-day threshold is well calibrated over repeated observations, the loss should exceed the threshold about 5% of the time. The Kupiec proportion-of-failures test asks whether the observed exceedance frequency is statistically consistent with that target rate. [S2]

MarketDeck counts an exceedance when the daily return is less than negative VaR. A large positive return is not a breach. If n is the number of observations, x the number of exceedances, and p = 1 − confidence, the likelihood-ratio statistic compares the likelihood under the target p with the likelihood under the observed x/n rate. [S4]

The displayed result uses calibration language: “consistent” or “not consistent” at the stated test threshold. It does not label a portfolio safe or dangerous. A model can pass a frequency test while still producing economically severe exceedance losses, and a rejection can arise from model misspecification, regime change or sample instability rather than from a permanent property of the portfolio.

## The important MarketDeck caveat: this is currently an in-sample check

Formal VaR backtesting is often described as comparing model-generated forecasts with subsequently realised profit and loss. The RBA's backtesting discussion uses that forward-looking operational framing: VaR estimates from risk reports are compared with realised P&L. [S1]

MarketDeck's current Portfolio Analysis implementation is narrower. It computes each VaR estimate from a historical return window and counts threshold exceedances on that same return window. [S4] In other words, the data help determine the threshold and are then used again to assess how often that threshold was crossed.

That is still a useful calibration diagnostic. It can reveal, for example, that a parametric threshold is badly inconsistent with the empirical frequency in the very sample whose moments generated it. But it is not a clean out-of-sample test, because the observations are not independent held-out evidence. Passing this check should never be described as proof that future VaR forecasts are accurate.

A stricter forecasting exercise would estimate a model using information available up to each date, generate the next threshold, then compare it with the next realised return, repeating through a holdout or rolling window. MarketDeck does not currently claim that procedure on this page.

## Why distribution tests sit next to VaR

Parametric VaR assumes a distributional shape; Cornish-Fisher explicitly reacts to measured shape. It is therefore useful to inspect skewness, excess kurtosis and formal normality tests in the same research workflow.

Negative skewness means the left tail is longer or more influential than the right tail in the measured sample. Positive excess kurtosis indicates more tail mass and a sharper center than a normal distribution in the moment-ratio sense used by the implementation. Those descriptive statistics help explain why a Cornish-Fisher threshold may separate from a Gaussian threshold.

A normality-test rejection does not automatically invalidate every use of mean and volatility, and a non-rejection does not prove returns are truly normal. Statistical tests have power limits and financial returns can exhibit volatility clustering and changing regimes. The point of exposing the diagnostics is to make assumptions inspectable.

## Percent VaR and rupee VaR answer related questions

A percentage threshold describes loss relative to the portfolio value basis. A rupee threshold multiplies that percentage by the latest reconstructed portfolio value used by the page. [S4] The percentage is useful for comparing scale across portfolios; the rupee amount gives the threshold a concrete monetary interpretation.

Both inherit the same model assumptions. Converting 3% into ₹30,000 on a ₹10 lakh portfolio does not make the underlying quantile more certain. It simply changes units.

## Common mistakes when reading VaR

- Treating VaR as worst-case loss. It is a quantile, and the tail beyond it remains open.
- Comparing 95% and 99% VaR without noticing the change in expected exceedance frequency.
- Assuming Historical VaR is assumption-free. Window choice and empirical sampling still matter.
- Assuming Parametric VaR is objective because it is formulaic. Normality is a model choice.
- Treating Cornish-Fisher as automatically superior. Higher-moment estimates can be unstable.
- Calling an in-sample Kupiec diagnostic “out-of-sample validated.” MarketDeck does not make that claim. [S4]
- Reading “consistent” as “safe.” Kupiec tests calibration frequency, not the acceptability of the loss amount.

## Limitations that remain after using three methods

All three methods are backward-looking because their inputs come from historical returns. If correlations, volatility or distribution shape change, the next period can differ materially from the estimation window. The RBA notes that historical information may not be a good predictor of the future and that VaR should be supplemented by other risk-management techniques. [S1]

VaR also compresses the tail to one threshold. It does not tell you the expected size of losses after the threshold is breached. It does not capture liquidity, gaps that cannot be traded through, operational constraints or every nonlinear payoff effect. Portfolio composition itself can change.

For these reasons, MarketDeck presents VaR as one research lens among distribution, drawdown, factor exposure, diversification and risk-return geometry. A single tail number is not a portfolio verdict.

## Frequently asked questions

### Which VaR method should I trust?

There is no universally correct answer from the method name alone. Historical VaR leans on the empirical sample, Parametric VaR leans on a normal model, and Cornish-Fisher adjusts a normal quantile using sample skewness and excess kurtosis. Compare the assumptions, the window and the calibration evidence rather than selecting a method because it gives the largest or smallest number.

### Does 99% VaR mean I will not lose more than that amount?

No. A 99% VaR is a model quantile with an approximately 1% target exceedance probability under the stated setup. Losses beyond the threshold are possible and can be much larger. [S1]

### What does a failed Kupiec result mean?

It means the observed breach frequency was not statistically consistent with the model's stated confidence at the test threshold used. It does not mean the portfolio itself failed, and it does not identify the cause. In MarketDeck's current page the check is in-sample, so it should be interpreted as calibration evidence on the measured window, not future predictive validation. [S4]

### Why can Cornish-Fisher VaR be smaller as well as larger than Parametric VaR?

Because the adjustment depends on the signs and magnitudes of sample skewness and excess kurtosis together with the selected quantile. It is not a fixed “fat-tail surcharge.” Different distribution shapes can move the adjusted quantile in different directions, which is another reason to inspect the inputs rather than rank models mechanically.