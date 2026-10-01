## Direct answer: XIRR follows your cash flows; portfolio history follows a portfolio definition

XIRR and a portfolio-return history can both be expressed as percentages, but they answer different questions. XIRR is a money-weighted annualised return: it uses the amount and exact date of each cash flow and finds the annual rate that makes the discounted value of those flows equal to zero. Microsoft describes XIRR as the internal rate of return for cash flows that are not necessarily periodic, discounts succeeding payments on a 365-day year, and requires at least one positive and one negative cash flow. [S1]

A reconstructed portfolio history is different. It starts with a portfolio definition — for example, the quantities held today — and asks how that fixed set of quantities would have moved through a historical price window. That can be useful for studying volatility, drawdown, correlation and other properties of the current book, but it is not the investor's actual account-equity path if holdings changed through time.

MarketDeck deliberately keeps those two ideas separate. The Portfolio Analysis performance lens uses the full transaction ledger for XIRR, while its historical research series reconstructs today's quantities over stored close dates common to the held companies. [S3] The first asks what happened to the investor's dated money. The second asks how the current mix behaved over a comparable historical window.

## Why cash-flow timing changes the answer

Suppose two investors both finish with the same rupee gain. One invested most of the capital two years ago; the other invested most of it three months ago. Their absolute gain can be identical while the annualised return on their money is very different. XIRR captures that difference because each cash flow carries its own date.

The sign convention matters. Money invested is an outflow and therefore negative. Money received from a sale is an inflow and therefore positive. If assets remain in the portfolio at the end of the measurement period, their terminal value acts like a final positive cash flow for the purpose of solving the rate. This is an accounting device for the return calculation, not a claim that the positions were actually sold.

The implementation boundary also matters. Some portfolio products calculate XIRR only on current holdings; others can include the historical transaction path. Zerodha's current support material, for example, explicitly distinguishes current-holdings calculations from historical-trade calculations, illustrating why the label “XIRR” alone does not tell you which cash flows a product included. [S2] When comparing platforms, inspect the cash-flow scope rather than assuming identical numbers should result.

## The XIRR equation

For dated cash flows C_i occurring on dates d_i, XIRR solves for the annual rate r that makes net present value zero:

XNPV(r) = Σ C_i / (1 + r)^((d_i − d_0) / 365) = 0

The denominator is based on the actual number of days from the first cash-flow date divided by 365. Microsoft's XIRR definition uses this 365-day convention and describes XIRR as the rate corresponding to XNPV equal to zero. [S1]

There is usually no simple algebraic rearrangement for r when many irregular cash flows exist. A numerical root finder is used instead. MarketDeck's canonical solver begins with Newton's method and falls back to bisection when necessary. [S3] That numerical detail belongs to product methodology; the conceptual point for a reader is simpler: the rate is the one annual rate that reconciles every dated outflow and inflow in the schedule.

[[figure]]

## Worked example: one investor, four dated flows

Consider a deliberately synthetic schedule. It is not market data and excludes taxes, brokerage and other costs.

| Date | Cash-flow event | Amount |
|---|---|---|
| 1 Jan 2024 | Initial purchase | −₹100,000 |
| 1 Jul 2024 | Additional purchase | −₹50,000 |
| 1 Mar 2025 | Sale proceeds | +₹20,000 |
| 1 Jan 2026 | Terminal value of remaining holdings | +₹155,000 |

Solving the Actual/365 XNPV equation for these four flows gives an annualised XIRR of about 9.26%. That number is not simply total profit divided by total money invested. It incorporates when the second ₹50,000 entered the portfolio and when the ₹20,000 was received.

Now change only the timing of the second purchase. If the additional ₹50,000 had been invested much later, the same final cash amounts would generally imply a different XIRR because that capital was exposed for a different period. This is why XIRR is described as money weighted: larger cash flows and their timing influence the measured investor experience.

The example also shows why a single “portfolio return” label can be ambiguous. A time series built from daily portfolio values might calculate percentage change between observations, a time-weighted chain of sub-period returns, a CAGR between endpoints, or a reconstructed current-book return. Those are different objects. Before comparing percentages, identify the cash-flow treatment and denominator.

## What reconstructed current-book history asks instead

Imagine that the portfolio today contains 40 shares of Company A and 25 shares of Company B. A current-book reconstruction can hold those quantities constant and value 40 A plus 25 B on each historical date where both companies have stored closes. The result is a clean historical series for the composition that exists now.

That series can answer useful questions. How volatile would today's mix have been over the common window? What was its largest historical peak-to-trough decline? How correlated were the holdings? What daily-return series should feed the portfolio's risk and distribution diagnostics?

But it does not know that the investor may have bought Company A only six months ago, sold Company B last year and later repurchased it, or held entirely different quantities at earlier dates. The historical line therefore must not be described as “your account value in 2023” merely because it contains a 2023 date.

| Measure | Primary input | Main question | What it should not be called |
|---|---|---|---|
| XIRR | Actual dated buys, sells and terminal value | What annualised rate reconciles the investor's cash-flow history? | A fixed-holdings backtest |
| Current-book history | Today's quantities plus stored historical closes | How did the current composition behave over a common historical window? | The investor's literal historical account equity |
| Daily current-book returns | Changes in that reconstructed value series | What return series describes the current mix for risk analysis? | Money-weighted investor return |

The distinction becomes especially important when a portfolio has changed substantially. A position added yesterday can still contribute years of history to a current-book reconstruction if years of stored prices exist. That is useful for studying the asset's historical behaviour inside today's mix, but it says nothing about whether the investor owned it during those years.

## How MarketDeck builds the XIRR schedule

MarketDeck's Portfolio Analysis uses the complete stored transaction ledger for each transacted company. Every buy becomes a negative cash flow on the transaction date. Every sell becomes a positive cash flow on its transaction date. Remaining shares are valued using the latest stored price and added as a terminal positive flow. [S3]

A fully closed position still contributes its historical buys and sells even though there is no remaining holding to value. An open position needs a stored terminal price. If MarketDeck cannot value the remaining shares of a company, it excludes that company's flows as a whole rather than keeping its purchase outflows while omitting the unpriced terminal asset. [S3] That fail-closed rule avoids mechanically depressing XIRR through an incomplete cash-flow schedule.

The cash-flow schedule is shown beside the result so the reader can inspect what entered the calculation. That is more important than treating a percentage as self-explanatory. If a return looks surprising, the first questions should be: which transactions were included, which positions were valued, what terminal date was used, and was anything unavailable?

## Why XIRR and reconstructed return can move in opposite directions

A portfolio can have a positive XIRR while the current-book historical window looks weak. That can happen if the investor bought after a historical decline, added capital at favourable times, realised gains, or no longer holds positions that drove earlier cash flows.

The reverse is also possible. Today's holdings may have an attractive reconstructed historical path while the investor's XIRR is poor because capital entered near expensive dates, sales locked in losses, or earlier positions performed badly. There is no contradiction. The measures condition on different histories.

This is also why replacing one with the other can produce bad analysis. If the question is “how did my money perform given when I invested it?”, use the cash-flow lens. If the question is “what historical risk characteristics does my current mix exhibit?”, a reconstructed current-book series can be appropriate. If the question is “how did my actual allocation evolve day by day?”, neither measure alone is sufficient; that requires a transaction-path account-equity reconstruction.

## Common mistakes when reading XIRR

- Treating XIRR as a forecast. It is a summary of a realised cash-flow schedule plus the chosen terminal valuation.
- Comparing XIRRs without checking the included transaction history. Platform definitions can differ. [S2]
- Calling a current-book reconstruction “my historical portfolio value.” It is the history of today's quantities, not necessarily the history of the account.
- Ignoring the terminal-value basis. An open position needs a valuation date and price source.
- Treating an unavailable XIRR as zero. If there is no valid positive/negative sign change or a reliable root cannot be established, “unavailable” is a different state from a 0% return. [S1] [S3]
- Comparing a money-weighted return directly with a benchmark price return and assuming the difference is manager skill. Cash-flow timing, distributions, benchmark construction and measurement windows must be made comparable first.

## What this measure assumes — and what it leaves out

XIRR compresses a potentially complicated path into one annual rate. That is useful, but compression hides structure. Two very different cash-flow sequences can produce similar XIRRs. The measure does not reveal volatility, drawdown, concentration, tail behaviour or factor exposure. Those require other lenses.

Transaction data also determines the meaning of the result. Missing historical trades, transferred positions without original cost dates, corporate actions recorded inconsistently, or a missing terminal price can all change the schedule. A robust implementation should expose exclusions rather than silently fill them.

The current-book history has its own assumptions. It holds current quantities constant and uses dates common to all held companies. A recently listed company can therefore shorten the common window for the entire portfolio. Historical closes are descriptive evidence; they do not establish future return distributions.

Neither XIRR nor reconstructed history tells an investor what to buy, sell or hold. They are measurement tools. MarketDeck uses the two side by side precisely because one number cannot represent both investor cash-flow experience and the historical behaviour of the portfolio that exists today. [S3]

## How to use the two measures together

A useful research sequence is:

1. Inspect XIRR and its visible dated cash-flow schedule to understand money-weighted investor experience.
2. Inspect reconstructed current-book history to understand how today's composition behaved through the common stored-price window.
3. Move to volatility, drawdown, distribution and VaR using the current-book return series.
4. Check diversification and factor exposures to ask why the portfolio moved as it did.
5. Keep every historical result descriptive rather than converting it into a return forecast.

This sequence prevents the most common category error: interpreting a composition study as a personal performance record, or interpreting a personal money-weighted return as a stable property of the current holdings.

## Frequently asked questions

### Is XIRR the same as CAGR?

No. CAGR is naturally an endpoint measure for one beginning value, one ending value and a time interval. XIRR is designed for irregular dated cash flows. If there is only one initial outflow and one terminal inflow, the two can become closely related, but multiple purchases, sales or distributions make the cash-flow timing material. Microsoft explicitly distinguishes XIRR's irregular schedule from IRR's regular-period framework. [S1]

### Can I compare XIRR with the reconstructed portfolio return?

You can place them beside each other, but not as interchangeable versions of the same statistic. XIRR answers a cash-flow question; reconstructed return answers a fixed-composition historical question. A difference between them is information about timing and composition, not automatically an error.

### Why can a reconstructed chart begin before I bought a holding?

Because the reconstruction uses today's quantities against stored historical prices. If the security has earlier price history, that history can appear even though you did not own the security then. The chart is therefore labelled as reconstructed current-book history rather than literal historical account equity. [S3]

### Why might MarketDeck exclude a company from XIRR?

If a company still has an open position but no reliable stored price is available for the terminal valuation, including its purchase and sale flows without valuing the remaining shares would create an incomplete schedule. MarketDeck excludes that company's flows as a unit and reports the exclusion rather than manufacturing a terminal value. [S3]