## Direct answer: an efficient frontier is conditional on both the data and the rules

An efficient frontier is the boundary of portfolios that offer the highest expected return for a given level of variance, or equivalently the lowest variance for a given expected return, under a stated model and constraint set. The idea comes from Markowitz's mean-variance framework: portfolio choice depends on expected returns, variances and covariances rather than on each asset considered in isolation. [S1]

A long-only frontier and an unconstrained frontier can be built from the same expected-return vector and covariance matrix yet trace different curves because they permit different weights. A long-only fully invested portfolio requires every asset weight to be at least zero and all weights to sum to one. An unconstrained fully invested formulation can allow negative weights, which represent short positions, and weights above 100%, which imply leverage funded by those shorts.

That distinction is not cosmetic. Constraints change the feasible set. A curve that can use −50% in one asset and +150% in another can reach combinations that a 0%-to-100% long-only portfolio cannot. MarketDeck therefore plots the two boundaries separately and labels the unconstrained curve as geometry rather than a recommended mix. [S4]

## Start with the portfolio, not the curve

For n assets with weight vector w, expected-return vector μ and covariance matrix Σ, the familiar mean-variance quantities are:

Expected portfolio return = wᵀμ

Portfolio variance = wᵀΣw

Portfolio volatility = sqrt(wᵀΣw)

The covariance terms are essential. If two holdings do not move together perfectly, combining them can change portfolio variance in ways that cannot be inferred from individual volatilities alone. Diversification in this framework is therefore a relationship among weights, variances and covariances, not simply a count of securities.

Markowitz's 1952 Portfolio Selection paper established the portfolio-selection framework that makes this trade-off explicit. [S1] Modern educational implementations often visualize many candidate portfolios in risk-return space and identify the efficient boundary. Zerodha Varsity, for example, teaches the efficient frontier in an Indian-investor education context. [S2] MarketDeck uses the same broad mathematical family but deliberately stops short of telling a user which point to choose.

## What “long-only” changes mathematically

A basic long-only, fully invested constraint set is:

Σ w_i = 1

0 ≤ w_i ≤ 1 for every asset i

Geometrically, the allowed weight vectors lie on a simplex. No asset can be short, no weight can exceed the full portfolio, and the portfolio does not borrow through net exposure above 100%. MathWorks' standard constrained frontier documentation describes this familiar non-negative, fully invested setup. [S3]

The constraint can remove parts of the unconstrained mean-variance boundary. That is not a defect in the long-only solution; it is the price of insisting that the portfolio remain inside a narrower feasible set.

Long-only does not automatically mean practical in every other sense. Real portfolios can face lot sizes, taxes, transaction costs, liquidity limits, concentration caps and regulatory constraints that are not represented by the simple simplex. It means only that the model prohibits negative weights and keeps the displayed allocation fully invested.

## What “unconstrained” means on MarketDeck

The unconstrained frontier is the classic closed-form mean-variance geometry over the same assets and same estimated covariance matrix, allowing the optimization to use negative or greater-than-one weights while preserving the fully invested weight sum. [S4]

A negative weight is a short position in the mathematical portfolio. If one asset has a weight of −30% and another 130%, the weights still sum to 100%, but the gross exposure is 160%. That is economically very different from a long-only 30%/70% mix. It can introduce borrowing, short-sale availability, financing costs, margin and path risks that the simple mean-variance geometry does not model.

This is why an unconstrained frontier can look dramatically “better” on a two-axis chart. The optimizer has more degrees of freedom. It can offset exposures and amplify estimated return differences. The curve describes what the mathematical inputs permit, not what a particular reader should hold.

## Worked example: the same two assets under two constraint sets

Consider two synthetic assets. Nothing in this example is a market forecast.

| Input | Asset A | Asset B |
|---|---|---|
| Expected annual return | 8% | 14% |
| Annual volatility | 10% | 20% |
| Correlation | 0.25 | 0.25 |

The implied covariance between the assets is 0.25 × 10% × 20% = 0.005 in decimal variance units. Suppose we ask for a portfolio with a 12% expected return. The two equations are:

0.08w_A + 0.14w_B = 0.12

w_A + w_B = 1

Solving them gives approximately 33.3% in A and 66.7% in B. Both weights are non-negative, so this point is feasible under both long-only and unconstrained rules. Its volatility is about 14.5% using the covariance inputs above.

Now ask for a 17% expected return using the same two expected returns. The equations imply w_A = −50% and w_B = 150%. That point is impossible for the long-only portfolio because no mixture of two assets returning 8% and 14% can have a model expected return above 14% without leverage or shorting. It is available to the unconstrained geometry because a short position in A finances exposure above 100% in B. The corresponding model volatility is about 29.2% with these synthetic assumptions.

| Target return | A weight | B weight | Long-only feasible? | Unconstrained feasible? |
|---|---|---|---|---|
| 12% | 33.3% | 66.7% | Yes | Yes |
| 17% | −50.0% | 150.0% | No | Yes |

The example explains why two frontiers can separate even when nothing about the historical data changed. The constraint set changed the set of portfolios the optimizer was allowed to consider.

[[figure]]

## Why the covariance matrix matters so much

The frontier is not a permanent property of a group of company names. It is a result of estimated μ and Σ over a particular data window. Change the window and the daily means, volatilities or correlations can change. Add a recently listed stock and the common history may shorten. Change the return definition or annualisation convention and the plotted coordinates can move.

This sensitivity is particularly important for expected returns. Small differences in estimated means can produce large changes in unconstrained optimal weights because the optimization effectively magnifies estimated edges through Σ⁻¹. The apparent precision of a smooth curve should not be confused with certainty about the inputs.

MarketDeck reduces one source of internal inconsistency by using one aligned-input builder for the frontier and the Black-Litterman implied-return laboratory. Stored close-to-close prices are aligned on dates common to all held companies; simple daily returns feed the calculation; historical arithmetic mean return is annualised by multiplying by 252; sample daily covariance is annualised by multiplying by 252. [S4]

Those conventions are visible because interpretation depends on them.

## How MarketDeck builds the two curves

MarketDeck displays a long-only and an unconstrained frontier over the same aligned portfolio inputs. [S4]

The long-only boundary is solved numerically over the probability simplex: every weight remains non-negative, all weights sum to one, and the algorithm traces the trade-off between variance and return. The implementation uses projected-gradient descent for the constrained problem.

The unconstrained boundary uses the classic closed-form mean-variance solution. Because negative weights and weights above 100% are allowed, it can extend beyond the long-only region. The page uses a solid line for the long-only boundary and a dashed line for the unconstrained geometry, with the current portfolio mix plotted as a neutral reference point.

Crucially, the individual weight vector behind every curve point is not surfaced as a target allocation. MarketDeck does not select a tangency portfolio, maximum-Sharpe point or “best” point for the user. The plot is a research map of historical mean and covariance under two constraint sets.

## “Efficient” is a model word, not a suitability judgment

Within the model, a portfolio is inefficient if another feasible portfolio offers more expected return for the same variance or less variance for the same expected return. That definition is conditional on the inputs and constraints.

It does not mean that every real investor should move to a point labelled efficient. A real decision can depend on taxes, liquidity, concentration rules, liabilities, time horizon, drawdown tolerance, tracking error, transaction costs and many other facts that are absent from the basic model.

This distinction matters because public educational material often moves quickly from “this curve is efficient” to “therefore choose a portfolio on it.” MarketDeck intentionally separates description from prescription. The current-mix marker helps a reader compare historical geometry without turning the chart into an allocation instruction.

## Why the current portfolio can sit below the frontier

A current mix can plot below a historical frontier for several ordinary reasons. Its weights may reflect cash-flow history rather than mathematical optimization. The investor may care about constraints not present in the model. The current mix can include deliberate concentration or legacy positions. And the frontier itself is estimated from historical returns that were not known with certainty when those positions were chosen.

Being below a fitted frontier therefore does not prove the portfolio is “bad.” It says that, under this historical mean-covariance model and this constraint set, another mathematical weight combination occupies a different risk-return location.

Likewise, being on the historical frontier does not validate the portfolio prospectively. If future means and covariances differ, the future frontier differs too.

## Long-only and unconstrained curves are useful together

Showing both curves creates an analytical comparison that one curve alone cannot provide.

If the curves are close through the relevant region, the long-only constraint is not costing much model efficiency for that set of historical inputs. If they separate sharply, the unconstrained solution is relying more heavily on shorting or leverage to produce its geometry. The size and location of that separation can prompt a better question: which estimated relationships are the unconstrained model exploiting?

The answer may involve expected-return differences, covariance hedges or both. That does not make the unconstrained curve a candidate portfolio. It makes it a diagnostic for understanding what the constraint is doing.

## Common mistakes when reading an efficient frontier

- Treating the curve as a forecast. The displayed coordinates come from historical estimates unless a different expected-return model is explicitly supplied.
- Assuming “unconstrained” means “more realistic.” It means fewer mathematical weight restrictions, which can imply economically demanding short and leveraged positions.
- Assuming long-only includes every practical constraint. It does not model costs, taxes, liquidity or user-specific suitability.
- Selecting the highest plotted return without examining risk and leverage.
- Calling the current mix inefficient as a broad judgment about the investor. The label has a narrower model definition.
- Comparing frontiers built from different windows or covariance definitions as if only portfolio weights changed.
- Reading a visually smooth curve as evidence that the input estimates are stable.

## Relationship to diversification and Black-Litterman

The frontier lens shares its core covariance structure with two nearby Portfolio Analysis questions.

Diversification asks how holdings move together. The same covariances and correlations that describe those relationships shape portfolio variance.

Black-Litterman asks a different question about returns. Instead of treating noisy historical means as the only expected-return input, reverse optimization can infer equilibrium-style returns from a covariance matrix and an existing weight vector, then blend those priors with explicit views. [S4] That is why the Portfolio Analysis research map connects Diversification, Risk–Return and Implied Returns rather than presenting them as unrelated calculators.

The connection does not collapse the concepts. A correlation matrix is not a frontier; a frontier is not a forecast; and Black-Litterman return implications are not automatically target weights.

## Limitations of the historical frontier

Historical arithmetic mean returns can be noisy, especially over short windows. Sample covariance can change through time. A common-date requirement can shorten the analysis when one holding has limited history. Corporate actions, price-source conventions and missing observations can affect the input series.

Mean-variance analysis also summarizes risk through variance. Two portfolios with the same variance can have very different skewness, kurtosis, drawdowns or tail losses. That is why MarketDeck keeps Tail Risk and Return Distribution as separate lenses rather than claiming the frontier is a complete risk model.

Finally, an unconstrained solution ignores the real-world frictions of shorting and leverage. Its value on the page is explanatory: it shows what the classical geometry would permit before the long-only constraint is imposed.

## Frequently asked questions

### Is the long-only frontier always below the unconstrained frontier?

The unconstrained feasible set contains the long-only feasible set, so removing constraints cannot make the mathematical opportunity set smaller. In regions where the unconstrained optimum already uses non-negative weights, the boundaries can coincide. Where negative or greater-than-one weights improve the fitted objective, the unconstrained boundary can extend beyond the long-only one.

### Does the efficient frontier tell me which portfolio to choose?

Not by itself. It maps the model trade-off conditional on estimated returns, covariance and constraints. MarketDeck deliberately does not surface a recommended point or allocation. A personal allocation decision would require objectives and constraints outside this descriptive research surface. [S4]

### Why does MarketDeck show an unconstrained curve if it may not be holdable?

Because it is a useful reference geometry. Comparing it with the long-only curve shows how much the non-negative-weight constraint changes the historical mean-variance opportunity set. The dashed curve is explicitly labelled as potentially containing short positions or leverage rather than presented as an investable recommendation.

### Why can the frontier change even when my holdings do not?

Because the estimates can change. New stored prices alter historical means and covariance; a different common window can alter both; adding or removing a holding changes the asset set. The frontier is therefore a dated analytical result, not a permanent property of the securities.