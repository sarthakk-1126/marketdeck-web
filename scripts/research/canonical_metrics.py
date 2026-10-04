"""
Portfolio & per-holding return/risk metrics (Tasks 4-5). Pure functions on
plain lists of floats -- no Django, no DB, no dates -- so every formula is
unit-testable against a hand-computed reference number, which is exactly how
the tests exercise them. The DB-facing assembly (turning stored daily closes
into aligned return series) lives in screener/portfolio.py; this module is
only the arithmetic, and every function's docstring states the exact formula
it implements so the metrics page can cite it verbatim (Source Trace).

Conventions used throughout, stated once:
- "returns" means a list of SIMPLE daily returns r_t = close_t/close_{t-1} - 1.
- Sample standard deviation (ddof=1, divide by n-1) is used for volatility,
  Sharpe, Sortino, and beta's covariance/variance -- the standard choice for
  a sample of historical returns rather than a known population.
- 252 trading days/year is the annualization factor (the conventional Indian
  and global equity market count).
"""
import math
from typing import NamedTuple

TRADING_DAYS_PER_YEAR = 252


def _mean(xs):
    return sum(xs) / len(xs)


def _sample_std(xs):
    """Sample standard deviation (ddof=1). None if fewer than 2 points."""
    n = len(xs)
    if n < 2:
        return None
    m = _mean(xs)
    return math.sqrt(sum((x - m) ** 2 for x in xs) / (n - 1))


def simple_daily_returns(closes):
    """r_t = close_t / close_{t-1} - 1 for each consecutive pair. A day whose
    prior close is 0 (never expected in real data) is skipped rather than
    dividing by zero. Input must be in chronological (oldest-first) order."""
    out = []
    for i in range(1, len(closes)):
        prev = closes[i - 1]
        if prev:
            out.append(closes[i] / prev - 1)
    return out


def annualized_volatility(returns):
    """Annualized volatility = sample_std(daily returns) × √252. None if
    fewer than 2 returns."""
    sd = _sample_std(returns)
    return None if sd is None else sd * math.sqrt(TRADING_DAYS_PER_YEAR)


def annualized_return(returns):
    """Geometric annualized return = (∏(1 + r_t))^(252/n) − 1. The
    compounded growth over the window, scaled to a yearly rate. None for an
    empty series."""
    if not returns:
        return None
    growth = 1.0
    for r in returns:
        growth *= (1 + r)
    return growth ** (TRADING_DAYS_PER_YEAR / len(returns)) - 1


def sharpe_ratio(returns, risk_free_annual):
    """Sharpe = mean(daily excess) / sample_std(daily excess) × √252, where
    daily excess = r_t − (risk_free_annual / 252). Reward per unit of total
    volatility. None if <2 returns or zero volatility."""
    if len(returns) < 2:
        return None
    daily_rf = risk_free_annual / TRADING_DAYS_PER_YEAR
    excess = [r - daily_rf for r in returns]
    sd = _sample_std(excess)
    if not sd:
        return None
    return _mean(excess) / sd * math.sqrt(TRADING_DAYS_PER_YEAR)


def sortino_ratio(returns, risk_free_annual):
    """Sortino = mean(daily excess) / downside_deviation × √252. Like Sharpe
    but penalizes only downside volatility: downside_deviation =
    √( Σ min(0, excess_t)² / n ) (target semi-deviation over ALL n periods,
    not only the down days). None if <2 returns, or if there is no downside
    at all (deviation 0)."""
    if len(returns) < 2:
        return None
    daily_rf = risk_free_annual / TRADING_DAYS_PER_YEAR
    excess = [r - daily_rf for r in returns]
    downside_sq = [min(0.0, e) ** 2 for e in excess]
    dd = math.sqrt(sum(downside_sq) / len(excess))
    if not dd:
        return None
    return _mean(excess) / dd * math.sqrt(TRADING_DAYS_PER_YEAR)


def max_drawdown(values):
    """Maximum drawdown of a value/level series (e.g. portfolio value or a
    price): the largest peak-to-trough fractional decline, as a negative
    number (−0.35 = a 35% fall from a prior high). 0.0 for a series that only
    ever rises. None for an empty series. Input must be chronological."""
    if not values:
        return None
    peak = values[0]
    mdd = 0.0
    for v in values:
        if v > peak:
            peak = v
        if peak:
            dd = v / peak - 1
            if dd < mdd:
                mdd = dd
    return mdd


def covariance(xs, ys):
    """Sample covariance (ddof=1) of two equal-length, index-aligned series.
    None if fewer than 2 points or lengths differ."""
    n = len(xs)
    if n < 2 or n != len(ys):
        return None
    mx, my = _mean(xs), _mean(ys)
    return sum((xs[i] - mx) * (ys[i] - my) for i in range(n)) / (n - 1)


def variance(xs):
    """Sample variance (ddof=1). None if fewer than 2 points."""
    sd = _sample_std(xs)
    return None if sd is None else sd * sd


def beta(asset_returns, market_returns):
    """CAPM beta = Cov(asset, market) / Var(market), on index-aligned daily
    return series of equal length. The asset's sensitivity to market moves:
    1.0 moves with the market, >1 amplifies it, <1 dampens it. None if the
    series are too short, misaligned, or the market has zero variance."""
    cov = covariance(asset_returns, market_returns)
    var = variance(market_returns)
    if cov is None or not var:
        return None
    return cov / var


def alpha_annualized(asset_returns, market_returns, risk_free_annual, beta_value):
    """CAPM regression intercept (Jensen's alpha), annualized. From the daily
    regression r_asset − rf = α + β(r_market − rf): α_daily = mean(asset excess)
    − β × mean(market excess); annualized ≈ α_daily × 252. The return not
    explained by market exposure. None if the series are too short."""
    if len(asset_returns) < 2 or len(asset_returns) != len(market_returns) or beta_value is None:
        return None
    daily_rf = risk_free_annual / TRADING_DAYS_PER_YEAR
    asset_excess = [r - daily_rf for r in asset_returns]
    market_excess = [r - daily_rf for r in market_returns]
    alpha_daily = _mean(asset_excess) - beta_value * _mean(market_excess)
    return alpha_daily * TRADING_DAYS_PER_YEAR


def correlation(xs, ys):
    """Pearson correlation of two aligned series, for the beta regression's
    R (its square is R²). None if too short or either series is constant."""
    cov = covariance(xs, ys)
    sx, sy = _sample_std(xs), _sample_std(ys)
    if cov is None or not sx or not sy:
        return None
    return cov / (sx * sy)


def _percentile(sorted_xs, p):
    """The p-th percentile (p in [0, 100]) of an already-sorted list, using
    linear interpolation between closest ranks (numpy's default method), so
    results match what people expect from a spreadsheet/numpy. None for empty
    input."""
    if not sorted_xs:
        return None
    if len(sorted_xs) == 1:
        return sorted_xs[0]
    rank = p / 100.0 * (len(sorted_xs) - 1)
    lo = int(rank)
    hi = min(lo + 1, len(sorted_xs) - 1)
    frac = rank - lo
    return sorted_xs[lo] + (sorted_xs[hi] - sorted_xs[lo]) * frac


def historical_var(returns, confidence):
    """Historical (non-parametric) 1-day Value at Risk at `confidence` (e.g.
    0.95), as a POSITIVE loss fraction. It is minus the (1 − confidence)
    empirical quantile of the daily return distribution: the loss the
    portfolio met or exceeded on the worst (1 − confidence) share of days in
    the window. 0.023 means "on the worst 5% of days (at 95%), the daily loss
    was at least 2.3%". None if fewer than 2 returns."""
    if len(returns) < 2:
        return None
    q = _percentile(sorted(returns), (1.0 - confidence) * 100.0)
    return -q


def parametric_var(returns, confidence):
    """Parametric (variance-covariance / Gaussian) 1-day Value at Risk at
    `confidence`, as a POSITIVE loss fraction. Assumes daily returns are
    normal: VaR = −(μ + z·σ), where μ and σ are the sample mean and std of
    the daily returns and z = Φ⁻¹(1 − confidence) is the standard-normal
    quantile (z₉₅ ≈ −1.645, z₉₉ ≈ −2.326). None if fewer than 2 returns."""
    if len(returns) < 2:
        return None
    from statistics import NormalDist
    mu = _mean(returns)
    sd = _sample_std(returns)
    z = NormalDist().inv_cdf(1.0 - confidence)  # negative for confidence > 0.5
    return -(mu + z * sd)


def cornish_fisher_var(returns, confidence):
    """Cornish-Fisher (modified) 1-day VaR at `confidence`, as a POSITIVE
    loss fraction -- the same parametric shape as `parametric_var` but with
    the normal quantile z replaced by the Cornish-Fisher expansion that
    adjusts for the SAMPLE's own skew and excess kurtosis:

        z_cf = z + (z²−1)S/6 + (z³−3z)K/24 − (2z³−5z)S²/36

    (Cornish & Fisher 1937; applied to VaR by Zangari, P. (1996), "A VaR
    methodology for portfolios with non-normal returns", RiskMetrics
    Monitor Q2; Favre, L. & Galeano, J.-A. (2002), Journal of Alternative
    Investments 5(2):21-25.) S is skewness, K is excess kurtosis (see
    `skewness`/`excess_kurtosis` below) of the SAME return series VaR is
    computed on.

    docs/advanced_quantitative_investigation.md §4.2 measured this expansion
    as monotone (a valid quantile) over every stored series' own 0.1%-10%
    tail, but NOT a clean improvement on the historical VaR: it matches
    well on a diversified, near-normal-kurtosis series and OVER-corrects on
    negatively-skewed index-like series -- show it only alongside its own
    Kupiec backtest verdict (kupiec_pof_test), never as a standalone
    'better' number. None if fewer than 3 returns (skewness/kurtosis need at
    least 3 points) or the sample has zero variance."""
    if len(returns) < 3:
        return None
    from statistics import NormalDist
    mu = _mean(returns)
    sd = _sample_std(returns)
    if not sd:
        return None
    S = skewness(returns)
    K = excess_kurtosis(returns)
    if S is None or K is None:
        return None
    z = NormalDist().inv_cdf(1.0 - confidence)
    z_cf = (
        z
        + (z ** 2 - 1) * S / 6
        + (z ** 3 - 3 * z) * K / 24
        - (2 * z ** 3 - 5 * z) * S ** 2 / 36
    )
    return -(mu + z_cf * sd)


def sharpe_standard_error(sharpe_annualized, n_returns):
    """Standard error of an ANNUALIZED Sharpe-ratio estimate, per Lo, A. W.
    (2002), "The Statistics of Sharpe Ratios", Financial Analysts Journal
    58(4):36-52: under the i.i.d.-returns assumption, SE(SR) ≈
    √((1 + SR²/2)/T), annualized by ×√252 -- i.e. SE_annual =
    √(252/T) × √(1 + SR_annual²/2), T = the number of daily returns the
    Sharpe ratio was estimated over. Reproduces the investigation's own
    dmtest figure exactly (Sharpe −0.57 over T=1,240 → SE 0.49, 95%
    interval [−1.52, +0.39]).

    The i.i.d. assumption is the same one the distribution diagnostics
    above test and often reject (volatility clustering inflates the true
    uncertainty beyond this formula) -- the same disclosure serves both.
    None if fewer than 2 returns or the Sharpe ratio itself is unavailable."""
    if sharpe_annualized is None or n_returns < 2:
        return None
    return math.sqrt(TRADING_DAYS_PER_YEAR / n_returns) * math.sqrt(1 + sharpe_annualized ** 2 / 2)


def sharpe_confidence_interval(sharpe_annualized, standard_error, z=1.96):
    """95% (default) confidence interval around an annualized Sharpe ratio,
    as (low, high). None if either input is unavailable."""
    if sharpe_annualized is None or standard_error is None:
        return None
    return (sharpe_annualized - z * standard_error, sharpe_annualized + z * standard_error)


# --- Kupiec's VaR backtest (argued for in the investigation, §4.1) ---------
# Kupiec, P. (1995), "Techniques for Verifying the Accuracy of Risk
# Measurement Models", Journal of Derivatives 3(2):73-84: the
# proportion-of-failures (POF) likelihood-ratio test for whether a VaR
# model's realized exceedance rate is statistically consistent with its
# stated confidence level.


class KupiecResult(NamedTuple):
    """One VaR method's backtest at one confidence level."""
    n: int                       # days in the backtest window
    exceedances: int             # x: days the actual loss exceeded VaR
    expected_exceedances: float  # (1 - confidence) * n
    likelihood_ratio: "float | None"   # None only when n == 0
    p_value: "float | None"
    consistent: "bool | None"    # p_value >= 0.05, i.e. "not rejected"


def _chi2_1_sf(x):
    """Survival function of a chi-squared distribution with 1 degree of
    freedom, in closed form: since Z² ~ χ²(1) for Z ~ N(0,1),
    P(χ²(1) > x) = P(|Z| > √x) = erfc(√(x/2)) -- exact, no gamma function
    needed (verified against scipy.stats.chi2.sf(x, 1) to 12+ significant
    figures across x = 0.5 .. 20 during development)."""
    if x <= 0:
        return 1.0
    return math.erfc(math.sqrt(x / 2.0))


def kupiec_pof_test(n, exceedances, confidence):
    """Kupiec's proportion-of-failures likelihood-ratio test:

        LR = −2·ln[(1−p)^(n−x) · p^x] + 2·ln[(1−x/n)^(n−x) · (x/n)^x]  ~ χ²(1)

    where p = 1 − confidence is the target exceedance rate, x = observed
    exceedances in n trading days. `consistent = True` means the VaR
    model's actual exceedance rate cannot be statistically distinguished
    from what the stated confidence promises (p_value >= 0.05, the same 5%
    threshold the investigation's own table judges by); `False` means the
    backtest REJECTS the model at the 5% level -- language stays purely
    calibration-language ("consistent with" / "not consistent with"),
    never "safe"/"risky".

    An exceedance is a day the LOSS exceeded the VaR threshold, i.e.
    return < −VaR (VaR stored as the app does, a positive loss fraction) --
    NOT abs(return) > VaR, which would double-count gains as "exceedances"
    and silently corrupt every count in this test. Callers must count `x`
    with that convention; this function only runs the likelihood-ratio
    arithmetic on whatever (n, x) it is given.

    x=0 and x=n are the two boundary cases where a naive x·ln(x/n) or
    (n−x)·ln(1−x/n) term would be 0·ln(0) (undefined) -- both limits are 0,
    handled explicitly below. None (as a KupiecResult with p_value=None,
    consistent=None) only when n == 0; every other input yields a real p."""
    if n <= 0:
        return KupiecResult(
            n=n, exceedances=exceedances, expected_exceedances=0.0,
            likelihood_ratio=None, p_value=None, consistent=None,
        )
    p = 1.0 - confidence
    x = exceedances
    observed_rate = x / n

    def term(count, rate):
        # count * ln(rate), with the 0*ln(0) limit -> 0.
        if count == 0:
            return 0.0
        return count * math.log(rate)

    log_null = term(n - x, 1.0 - p) + term(x, p)
    log_alt = term(n - x, 1.0 - observed_rate) + term(x, observed_rate)
    lr = -2.0 * log_null + 2.0 * log_alt
    lr = max(lr, 0.0)  # guards a microscopic negative from float rounding when x/n == p exactly
    p_value = _chi2_1_sf(lr)
    return KupiecResult(
        n=n, exceedances=x, expected_exceedances=p * n,
        likelihood_ratio=lr, p_value=p_value, consistent=p_value >= 0.05,
    )


def count_var_exceedances(returns, var_fraction):
    """Count the days a return series' LOSS exceeded a (positive-fraction)
    VaR estimate -- the correct directional convention for a VaR backtest:
    an exceedance is `return < −var_fraction` (the loss on that day was
    WORSE than the threshold), never `abs(return) > var_fraction`, which
    would count a large GAIN as a VaR breach and roughly double the
    apparent exceedance rate on any series with a fat right tail. None if
    `var_fraction` is None (VaR itself wasn't computable)."""
    if var_fraction is None:
        return None
    threshold = -var_fraction
    return sum(1 for r in returns if r < threshold)


# --- Distributional analysis of returns (docs/advanced_quantitative_investigation.md §2) ---
# Jarque-Bera, Shapiro-Wilk and Anderson-Darling normality tests, plus
# skewness and excess kurtosis -- pure Python, no numpy/scipy, each
# implementation calibrated by Monte Carlo (correct Type-I error under
# N(0,1), correct power under a heavy-tailed alternative) and, where a
# citable exact reference value exists, checked against it -- see
# screener/tests/test_distribution_diagnostics.py for both. All four
# functions below share one minimum-sample threshold: below it a formal
# normality test is not reliable enough to report (the investigation's own
# Monte Carlo calibration starts at n=60; 20 is a conservative floor below
# which even the DESCRIPTIVE skew/kurtosis numbers are too noisy to show).

MIN_N_FOR_NORMALITY_TESTS = 20


def skewness(xs):
    """Population (moment-ratio) skewness g₁ = m₃ / m₂^1.5, where mₖ is the
    k-th central moment divided by n (population, not sample, moments --
    the convention Jarque-Bera and the Cornish-Fisher expansion both use).
    0 for a symmetric distribution; positive means a longer right tail.
    None if fewer than 3 points or the sample has zero variance."""
    n = len(xs)
    if n < 3:
        return None
    m = _mean(xs)
    m2 = sum((x - m) ** 2 for x in xs) / n
    if not m2:
        return None
    m3 = sum((x - m) ** 3 for x in xs) / n
    return m3 / m2 ** 1.5


def excess_kurtosis(xs):
    """Population excess kurtosis g₂ = m₄ / m₂² − 3, where mₖ is the k-th
    central moment divided by n. 0 for a normal distribution; positive
    ("leptokurtic") means fatter tails and a sharper peak than normal.
    None if fewer than 3 points or the sample has zero variance."""
    n = len(xs)
    if n < 3:
        return None
    m = _mean(xs)
    m2 = sum((x - m) ** 2 for x in xs) / n
    if not m2:
        return None
    m4 = sum((x - m) ** 4 for x in xs) / n
    return m4 / m2 ** 2 - 3.0


class NormalityTestResult(NamedTuple):
    """One normality test's statistic and p-value, or both None with a
    reason when the series is too short."""
    statistic: "float | None"
    p_value: "float | None"
    unavailable_reason: str = ""


def jarque_bera_test(xs):
    """Jarque, C. M. & Bera, A. K. (1987), "A test for normality of
    observations and regression residuals", International Statistical
    Review 55(2):163-172: JB = n/6·(S² + K²/4) ~ χ²(2) under the null,
    where S is skewness and K is excess kurtosis. p = exp(−JB/2) is the
    EXACT χ²(2) survival function (no gamma function needed) -- verified
    against scipy.stats.jarque_bera to 12+ significant figures during
    development. None below MIN_N_FOR_NORMALITY_TESTS observations."""
    n = len(xs)
    if n < MIN_N_FOR_NORMALITY_TESTS:
        return NormalityTestResult(
            None, None, f"needs at least {MIN_N_FOR_NORMALITY_TESTS} observations; this window has {n}",
        )
    S, K = skewness(xs), excess_kurtosis(xs)
    if S is None or K is None:
        return NormalityTestResult(None, None, "zero variance in this window")
    jb = n / 6.0 * (S ** 2 + K ** 2 / 4.0)
    return NormalityTestResult(jb, math.exp(-jb / 2.0))


def _norm_ppf(p):
    from statistics import NormalDist
    return NormalDist().inv_cdf(p)


def shapiro_wilk_test(xs):
    """Shapiro, S. S. & Wilk, M. B. (1965), Biometrika 52:591-611, with the
    weights and p-value approximation of Royston, J. P. (1992),
    "Approximating the Shapiro-Wilk W-test for non-normality", Statistics
    and Computing 2:117-119 (Algorithm AS R94, Applied Statistics 44(4),
    1995) -- the n > 5 branch, which is what applies for any series this
    app stores (MIN_N_FOR_NORMALITY_TESTS = 20).

    W is the squared correlation between the sorted sample and the
    expected order statistics of a standard normal; W close to 1 means the
    sample looks normal. Reproduces R's shapiro.test(1:100) exactly
    (W=0.95472, p=0.001722) and shapiro.test(1:20) (W=0.9604, p=0.551) --
    see the test suite -- and matches scipy.stats.shapiro to 6 decimal
    places across every n and distribution shape checked during
    development. None below MIN_N_FOR_NORMALITY_TESTS observations."""
    n = len(xs)
    if n < MIN_N_FOR_NORMALITY_TESTS:
        return NormalityTestResult(
            None, None, f"needs at least {MIN_N_FOR_NORMALITY_TESTS} observations; this window has {n}",
        )
    xs_sorted = sorted(xs)
    mean = _mean(xs_sorted)
    ss = sum((v - mean) ** 2 for v in xs_sorted)
    if not ss:
        return NormalityTestResult(None, None, "zero variance in this window")

    # Expected order statistics of a standard normal sample (Blom-type
    # positions specific to AS R94 -- (i - 3/8)/(n + 1/4)).
    m = [_norm_ppf((i - 0.375) / (n + 0.25)) for i in range(1, n + 1)]
    mm = sum(v * v for v in m)
    sqrt_mm = math.sqrt(mm)

    u = 1.0 / math.sqrt(n)
    a_n = (
        -2.706056 * u ** 5 + 4.434685 * u ** 4 - 2.071190 * u ** 3
        - 0.147981 * u ** 2 + 0.221157 * u + m[n - 1] / sqrt_mm
    )
    a_n1 = (
        -3.582633 * u ** 5 + 5.682633 * u ** 4 - 1.752461 * u ** 3
        - 0.293762 * u ** 2 + 0.042981 * u + m[n - 2] / sqrt_mm
    )
    phi = (mm - 2 * m[n - 1] ** 2 - 2 * m[n - 2] ** 2) / (1 - 2 * a_n ** 2 - 2 * a_n1 ** 2)

    a = [0.0] * (n + 1)  # 1-indexed, matching Royston's own indexing
    a[n] = a_n
    a[n - 1] = a_n1
    a[1] = -a_n
    a[2] = -a_n1
    for i in range(3, n - 1):
        a[i] = m[i - 1] / math.sqrt(phi)

    w_numerator = sum(a[i + 1] * xs_sorted[i] for i in range(n)) ** 2
    w_stat = w_numerator / ss
    w_stat = min(w_stat, 1.0)  # guards a microscopic float overshoot past 1.0

    if n <= 11:
        gamma = -2.273 + 0.459 * n
        arg = gamma - math.log(1 - w_stat) if w_stat < 1 else float("inf")
        w = -math.log(arg) if arg > 0 else float("inf")
        mu = 0.5440 - 0.39978 * n + 0.025054 * n ** 2 - 0.0006714 * n ** 3
        sigma = math.exp(1.3822 - 0.77857 * n + 0.062767 * n ** 2 - 0.0020322 * n ** 3)
    else:
        w = math.log(1 - w_stat) if w_stat < 1 else float("-inf")
        ln_n = math.log(n)
        mu = -1.5861 - 0.31082 * ln_n - 0.083751 * ln_n ** 2 + 0.0038915 * ln_n ** 3
        sigma = math.exp(-0.4803 - 0.082676 * ln_n + 0.0030302 * ln_n ** 2)

    if math.isinf(w):
        return NormalityTestResult(w_stat, 0.0)
    z = (w - mu) / sigma
    from statistics import NormalDist
    p_value = 1.0 - NormalDist().cdf(z)
    return NormalityTestResult(w_stat, p_value)


_LOG_SQRT_2PI = 0.5 * math.log(2 * math.pi)
_SQRT_2 = math.sqrt(2.0)


def _log_norm_cdf(x):
    """log(Φ(x)), the standard normal log-CDF, numerically stable deep into
    the negative tail. Needed because the Anderson-Darling statistic sums
    log(Φ(order statistic)) terms, and a real single-stock return series
    can have an extreme outlier day (the investigation measured NMDC at a
    +26σ day from 383 excess kurtosis) -- going through
    statistics.NormalDist().cdf(x) first underflows to EXACTLY 0.0 (via
    1+erf(x/√2) cancelling to 0.0 in float64) for x below about −10,
    turning math.log(0) into a crash on real data, not a hypothetical.
    math.erfc avoids that cancellation and stays accurate to about x=−27;
    beyond that this falls back to the standard Mills-ratio asymptotic
    expansion, which is exact in the limit and never underflows since it
    is computed directly in log-space."""
    if x >= 0:
        return math.log1p(-0.5 * math.erfc(x / _SQRT_2))
    t = -x / _SQRT_2
    if t < 25.0:  # erfc(25) ~ 8e-274, still comfortably representable
        return math.log(0.5) + math.log(math.erfc(t))
    # Φ(x) ~ φ(x)/(−x) · (1 − 1/x² + 3/x⁴) for x -> −∞ (Mills ratio).
    return -0.5 * x * x - _LOG_SQRT_2PI - math.log(-x) + math.log1p(-1.0 / (x * x) + 3.0 / (x ** 4))


# Asymptotic (n -> infinity) null distribution of the Stephens-corrected
# Anderson-Darling statistic A*² = A²·(1 + 0.75/n + 2.25/n²) for testing
# normality with both parameters estimated ("Case 3": Anderson & Darling
# 1952; Stephens, M. A. (1974), "EDF statistics for goodness of fit",
# JASA 69:730-737). This table was built for this investigation via a
# 2,000,000-replication Monte Carlo at n=800 (where the Stephens
# finite-sample factor is already 1.0009, i.e. indistinguishable from the
# n -> infinity limit) -- not transcribed from a remembered closed-form
# polynomial, because that could not be independently verified without a
# reference implementation in this environment (no scipy at runtime; scipy
# provides only 5 hardcoded critical values for this exact test, reproduced
# as the 5 entries below, and no continuous asymptotic p-value formula to
# check a closed form against). The 5 classical reference points --
# 0.561/0.631/0.752/0.873/1.035 at the 15%/10%/5%/2.5%/1% significance
# levels -- are the EXACT values Stephens (1974) published and scipy hard-
# codes internally as `_Avals_norm` (confirmed by reading
# scipy/stats/_morestats.py directly); the Monte Carlo reproduced all five
# to within 0.002 before they were snapped to the exact citable figures.
# The rest of the table is this session's own Monte Carlo, giving a smooth,
# continuous p-value everywhere instead of only at 5 fixed points -- cross-
# checked against scipy.stats.goodness_of_fit's independent Monte Carlo
# simulation (a genuinely different method: per-sample refitting at the
# series' own finite n, run at n=60/250/1245 under both the null and a
# t(4) alternative) and agreeing on both the statistic and the p-value to
# within Monte Carlo noise in every case checked.
#
# Each entry is (z, p) = (the A*² value, the exceedance probability P(A*²
# > z)); sorted ascending by z. log(p) is interpolated linearly between
# neighboring z (p decays roughly exponentially in z through the bulk of
# this range, so this is smooth and, importantly, always monotone).
_AD_ASYMPTOTIC_TABLE = (
    (0.09949, 0.999), (0.10678, 0.998), (0.11862, 0.995), (0.12961, 0.99),
    (0.14326, 0.98), (0.14842, 0.975), (0.16759, 0.95), (0.18178, 0.925),
    (0.19388, 0.9), (0.21465, 0.85), (0.23322, 0.8), (0.25073, 0.75),
    (0.26797, 0.7), (0.28515, 0.65), (0.30284, 0.6), (0.32114, 0.55),
    (0.34045, 0.5), (0.36117, 0.45), (0.38358, 0.4), (0.40844, 0.35),
    (0.4364, 0.3), (0.46925, 0.25), (0.50884, 0.2), (0.561, 0.15),
    (0.59157, 0.125), (0.631, 0.1), (0.64885, 0.09), (0.66905, 0.08),
    (0.6804, 0.075), (0.69226, 0.07), (0.71905, 0.06), (0.752, 0.05),
    (0.76917, 0.045), (0.79011, 0.04), (0.81329, 0.035), (0.84052, 0.03),
    (0.873, 0.025), (0.91295, 0.02), (0.93591, 0.0175), (0.96283, 0.015),
    (0.99485, 0.0125), (1.035, 0.01), (1.08308, 0.0075), (1.15674, 0.005),
    (1.28078, 0.0025), (1.44407, 0.001), (1.57085, 0.0005), (1.72991, 0.0002),
    (1.85009, 0.0001),
)
_AD_TABLE_Z = tuple(z for z, _p in _AD_ASYMPTOTIC_TABLE)
_AD_TABLE_P = tuple(p for _z, p in _AD_ASYMPTOTIC_TABLE)


def _ad_asymptotic_p_value(z):
    """P(A*² > z) under the calibrated asymptotic null table above. Below
    the smallest tabulated z, the series fits a normal about as well as a
    Monte Carlo sample ever does -- p is clipped to 1.0 rather than
    extrapolated (there is nothing meaningful above p=0.999). Above the
    largest tabulated z (p=0.0001, already a 1-in-10,000 event), log(p) is
    extrapolated log-linearly from the table's own last segment -- this
    keeps a genuinely extreme series (a fat-fingered data point, or NMDC's
    real 383 excess-kurtosis year) reporting a very small but honestly
    computed, never-nan p-value instead of an undefined one."""
    if z <= _AD_TABLE_Z[0]:
        return 1.0
    if z >= _AD_TABLE_Z[-1]:
        z1, z2 = _AD_TABLE_Z[-2], _AD_TABLE_Z[-1]
        p1, p2 = _AD_TABLE_P[-2], _AD_TABLE_P[-1]
        slope = (math.log(p2) - math.log(p1)) / (z2 - z1)
        return max(math.exp(math.log(p2) + slope * (z - z2)), 1e-300)
    lo, hi = 0, len(_AD_TABLE_Z) - 1
    while hi - lo > 1:
        mid = (lo + hi) // 2
        if _AD_TABLE_Z[mid] <= z:
            lo = mid
        else:
            hi = mid
    z1, z2 = _AD_TABLE_Z[lo], _AD_TABLE_Z[hi]
    p1, p2 = _AD_TABLE_P[lo], _AD_TABLE_P[hi]
    frac = (z - z1) / (z2 - z1)
    return math.exp(math.log(p1) + frac * (math.log(p2) - math.log(p1)))


def normal_tail_probability(z_score):
    """One-sided probability that a standard normal draw is at least
    |z_score| standard deviations from the mean: Φ(−|z|). Used to translate
    a return series' own worst/best day (expressed in σ units) into a
    plain-language 'how rare would this be under a normal distribution'
    frequency, e.g. z=−5 -> ≈1 in 3.5 million days -- the same reading the
    investigation itself used for the 45.5%-of-companies-have-a-−5σ-day
    finding (docs/advanced_quantitative_investigation.md §2.2)."""
    return math.exp(_log_norm_cdf(-abs(z_score)))


def anderson_darling_test(xs):
    """Anderson & Darling (1952); the "Case 3" finite-sample correction
    A*² = A²·(1 + 0.75/n + 2.25/n²) is Stephens, M. A. (1974), "EDF
    statistics for goodness of fit", JASA 69:730-737 -- the same citation
    the investigation used. A² itself is the standard EDF statistic

        A² = −n − (1/n)·Σᵢ (2i−1)·[ln Φ(w₍ᵢ₎) + ln(1 − Φ(w₍ₙ₊₁₋ᵢ₎))]

    over the standardized, sorted sample w. See `_ad_asymptotic_p_value`
    for how the p-value itself is computed and validated. None below
    MIN_N_FOR_NORMALITY_TESTS observations."""
    n = len(xs)
    if n < MIN_N_FOR_NORMALITY_TESTS:
        return NormalityTestResult(
            None, None, f"needs at least {MIN_N_FOR_NORMALITY_TESTS} observations; this window has {n}",
        )
    mean = _mean(xs)
    sd = _sample_std(xs)
    if not sd:
        return NormalityTestResult(None, None, "zero variance in this window")
    w = sorted((v - mean) / sd for v in xs)
    total = 0.0
    for i in range(1, n + 1):
        total += (2 * i - 1) * (_log_norm_cdf(w[i - 1]) + _log_norm_cdf(-w[n - i]))
    a_squared = -n - total / n
    a_squared = max(a_squared, 0.0)  # guards a microscopic negative from float rounding
    a_star_squared = a_squared * (1 + 0.75 / n + 2.25 / n ** 2)
    return NormalityTestResult(a_star_squared, _ad_asymptotic_p_value(a_star_squared))


# --- Multiple linear regression (Fama-French Phase C) ----------------------
# A general k-regressor OLS, added for the three-factor (market/SMB/HML)
# exposure regression. It reuses the SAME Gauss-Jordan inverse the efficient
# frontier solves its covariance matrix with rather than growing a second
# matrix routine -- one implementation, one set of tests, no new dependency
# (doctrine: pure Python unless a library genuinely reduces complexity, and a
# 4x4 normal-equations solve does not justify numpy).
#
# `invert_matrix` was written for frontier.py and now lives HERE, because this
# module is the pure-arithmetic one -- frontier.py imports Django models, and
# reaching into it from here would have made metrics.py depend on the ORM,
# breaking the no-Django contract this file's docstring states. frontier.py
# re-exports it under its original name, so nothing that used it moved.


def invert_matrix(matrix):
    """Gauss-Jordan inverse of a square matrix, or None if singular (e.g. two
    perfectly-correlated assets, or the same regressor passed twice). Small N
    only -- fine for a portfolio-sized covariance matrix or a 4x4 XtX."""
    n = len(matrix)
    aug = [list(matrix[i]) + [1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]
    for col in range(n):
        pivot = max(range(col, n), key=lambda r: abs(aug[r][col]))
        if abs(aug[pivot][col]) < 1e-12:
            return None
        aug[col], aug[pivot] = aug[pivot], aug[col]
        pivot_val = aug[col][col]
        aug[col] = [x / pivot_val for x in aug[col]]
        for r in range(n):
            if r != col:
                factor = aug[r][col]
                aug[r] = [aug[r][k] - factor * aug[col][k] for k in range(2 * n)]
    return [row[n:] for row in aug]


class OLSResult(NamedTuple):
    """One fitted OLS regression, with everything needed to judge whether the
    fit means anything -- not just the coefficients.

    `coefficients[0]` is always the intercept; `coefficients[1:]` are in the
    same order as the regressor columns passed in, and `standard_errors` is
    index-aligned to it."""
    coefficients: list          # [intercept, b1, ..., bk]
    standard_errors: list       # aligned to coefficients
    t_statistics: list          # coefficient / standard error (None if SE is 0)
    r_squared: float
    adjusted_r_squared: "float | None"
    residual_std: float         # s = sqrt(RSS / (n - k)), in daily return units
    n: int                      # observations
    k: int                      # estimated parameters, INCLUDING the intercept


def ols_regression(y, regressors):
    """Ordinary least squares of `y` on `regressors` (a list of equal-length
    columns), with an intercept added automatically.

        b = (XᵀX)⁻¹ Xᵀy,  where X = [1 | x₁ | ... | x_k]
        RSS = Σ(y − ŷ)²,   s² = RSS / (n − k)
        Var(b) = s² (XᵀX)⁻¹,  SE(b_j) = √(Var(b)_jj)
        R² = 1 − RSS / Σ(y − ȳ)²

    Returns an OLSResult, or None when the regression cannot be estimated:
    mismatched lengths, no observations, fewer observations than parameters
    (n ≤ k leaves no residual degrees of freedom, so standard errors do not
    exist and any "fit" is an artefact), a singular XᵀX (perfectly collinear
    regressors -- e.g. the same factor passed twice), or a constant y (R² is
    undefined when the total sum of squares is zero).

    Homoskedastic (classical) standard errors -- the textbook OLS formula.
    Daily financial returns are mildly heteroskedastic and autocorrelated, so
    these are, if anything, slightly optimistic; the display says so."""
    n = len(y)
    if n == 0 or not regressors:
        return None
    if any(len(col) != n for col in regressors):
        return None

    # Design matrix with the leading intercept column.
    x_rows = [[1.0] + [col[i] for col in regressors] for i in range(n)]
    k = 1 + len(regressors)
    if n <= k:
        return None

    xtx = [[sum(x_rows[i][a] * x_rows[i][b] for i in range(n)) for b in range(k)] for a in range(k)]
    xty = [sum(x_rows[i][a] * y[i] for i in range(n)) for a in range(k)]
    inv = invert_matrix(xtx)
    if inv is None:
        return None

    coefficients = [sum(inv[a][b] * xty[b] for b in range(k)) for a in range(k)]
    fitted = [sum(coefficients[a] * x_rows[i][a] for a in range(k)) for i in range(n)]
    rss = sum((y[i] - fitted[i]) ** 2 for i in range(n))
    y_mean = _mean(y)
    tss = sum((v - y_mean) ** 2 for v in y)
    if tss <= 0:
        return None

    dof = n - k
    s_squared = rss / dof
    residual_std = math.sqrt(max(0.0, s_squared))
    # inv[j][j] can go microscopically negative on a near-singular matrix;
    # max(0, ...) keeps that from raising instead of reporting SE 0.
    standard_errors = [math.sqrt(max(0.0, s_squared * inv[j][j])) for j in range(k)]
    t_statistics = [
        (coefficients[j] / standard_errors[j]) if standard_errors[j] else None
        for j in range(k)
    ]
    r_squared = 1.0 - rss / tss
    adjusted = 1.0 - (1.0 - r_squared) * (n - 1) / dof
    return OLSResult(
        coefficients=coefficients,
        standard_errors=standard_errors,
        t_statistics=t_statistics,
        r_squared=r_squared,
        adjusted_r_squared=adjusted,
        residual_std=residual_std,
        n=n,
        k=k,
    )
