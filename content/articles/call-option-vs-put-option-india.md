## Calls and puts are two different rights

A call option gives its buyer the right, but not the obligation, to buy the underlying at a specified strike price under the contract terms. A put option gives its buyer the right, but not the obligation, to sell the underlying at the strike price. That is the cleanest starting point for understanding options.

For listed Indian derivatives, the exact contract specifications, settlement process, lot size and expiry conventions can change, so current NSE contract documentation should be checked rather than memorizing an old rule. [S1] This article focuses on the economic idea using simple hypothetical numbers.

> Call = right to buy. Put = right to sell. The option buyer pays a premium for that right.

## A call option example with ₹ numbers

Suppose a hypothetical index is at 20,000 and a 20,000-strike call costs ₹200 per unit. Ignore lot size and charges for the moment so we can understand the contract at one-unit scale.

At expiry, if the index is 20,500, the call has ₹500 of intrinsic value because buying at 20,000 is worth ₹500 relative to the 20,500 settlement value. The buyer paid ₹200, so the simplified expiry profit before costs is ₹300 per unit.

If the index finishes at 19,800, exercising a right to buy at 20,000 has no economic value in this simplified example. The option expires with zero intrinsic value, so the buyer loses the ₹200 premium.

| Call buyer at expiry | Index value | Intrinsic value | Premium paid | Simplified P/L |
| --- | --- | --- | --- | --- |
| Below strike | 19,800 | ₹0 | ₹200 | -₹200 |
| At strike | 20,000 | ₹0 | ₹200 | -₹200 |
| Above strike | 20,500 | ₹500 | ₹200 | +₹300 |

This is an expiry payoff illustration, not a forecast or trade recommendation.

## A put option example uses the opposite direction

Now use the same 20,000 strike, but a put costs ₹180 per unit. If the index finishes at 19,500, the right to sell at 20,000 has ₹500 of intrinsic value. After the ₹180 premium, the simplified expiry profit is ₹320 per unit.

If the index finishes at 20,300, the put has no intrinsic value at expiry and the buyer loses the ₹180 premium.

The buyer of either option knows the premium paid upfront. But that does not make options low-risk in general. Sellers can face very different payoff profiles, margin requirements and potentially large losses. Derivatives are leveraged instruments, and SEBI investor guidance warns that leverage can magnify losses as well as gains. [S2]

[[figure]]

## Strike price is not the price you pay for the option

Beginners often mix up strike and premium. The strike price is the contract price used to determine the right and payoff. The premium is the market price paid for the option contract.

In the call example, 20,000 was the strike and ₹200 was the premium. The buyer did not pay ₹20,000 to acquire the option. In a real Indian contract, the cash premium is affected by the quoted premium multiplied by the applicable lot size, plus charges. Check the current contract specification before calculating actual capital required. [S1]

## Spot price, strike price and premium answer different questions

Spot price tells you where the underlying is now. Strike price tells you the contract level. Premium tells you what the option itself costs now.

A single option quote therefore contains several relationships. A 20,000 call when the underlying is 20,500 is different from the same 20,000 call when the underlying is 19,500. Time remaining and implied volatility also affect the premium before expiry.

NSE’s option-chain surface provides current contract information and quotes for supported instruments. [S3] It should be used as a live reference surface, not as a substitute for understanding what each field means.

## In-the-money, at-the-money and out-of-the-money

For a call, a strike below the current underlying price is generally described as in the money because it has positive intrinsic value. A strike near the underlying is at the money in ordinary market language. A strike above the underlying is out of the money.

For a put, the direction flips: a strike above the underlying can have intrinsic value because the right to sell at the higher strike is valuable.

These labels describe the relationship between strike and underlying. They do not tell you whether buying the option will be profitable because the premium and future path still matter.

## Premium contains more than intrinsic value before expiry

Before expiry, an option premium can exceed its current intrinsic value. The difference is commonly called time value or extrinsic value. It reflects the possibility that the underlying can move before expiry, among other factors.

That is why a call can lose value even when the underlying rises modestly: the move may be smaller than expected, time may pass, or implied volatility may change. The full pricing problem becomes more advanced, but a beginner only needs one principle at first: option premium is not determined by direction alone.

The [IV rank versus IV percentile guide](/intelligence/notes/iv-rank-vs-iv-percentile-nifty-options/) introduces one way traders describe the historical context of implied volatility. It should come after the basic contract structure, not before it.

## Buyers and sellers do not have the same risk shape

A call buyer’s maximum loss in the simplified expiry example is the premium paid. The call seller receives that premium but can face losses if the underlying rises far beyond the strike, subject to contract and settlement mechanics. A put seller can also face substantial losses if the underlying falls sharply.

This asymmetry is why an “options are safer because the buyer can only lose premium” statement is incomplete. It ignores sellers, repeated premium losses, position sizing and the leverage created by contract size. It also ignores that a 100% loss of premium is still a 100% loss of the amount paid for the option.

## Settlement can create obligations beyond a payoff sketch

The index examples above describe cash-settled payoffs before costs. Do not apply them blindly to a stock option held through expiry. Indian stock derivatives can require physical delivery: an in-the-money long call may require the funds to take delivery of shares, while an in-the-money long put can require shares to deliver. A broker may require delivery margins or close positions under its own risk policy. Groww documents these distinctions and its delivery-margin requirements; check the current exchange specification and your own broker rather than assuming the premium is all the cash you could need. Delivery funding is different from the option’s simplified payoff loss. [S1] [S4]

## Expiry matters because the contract is finite

A stock does not expire merely because a calendar date arrives. An option contract does. If the expected move happens after the option expires, it may not help the holder of that contract.

For this reason, directional opinion is only one part of an option position. The trader must also think about strike, expiry, premium, implied volatility and position size. Keep the first lessons simple, but do not hide the time dimension.

Current expiry and settlement conventions should be verified from the exchange because exchanges can change product specifications. [S1]

## Calls and puts can hedge as well as speculate

A put can sometimes be used to limit downside exposure on an asset portfolio, and calls can be part of hedging or structured positions. But “hedge” does not mean free protection. The premium is a real cost, and the hedge may not match the exposure perfectly.

Likewise, selling options to collect premium is not automatically an income strategy. Premium is compensation for taking risk. The correct question is what loss profile and obligation accompany that premium.

## A beginner decision tree

If you are learning—not placing a trade—start by answering four questions for any option:

1. What is the underlying?
2. Is this a call or a put?
3. What are the strike and expiry?
4. What premium is being paid or received?

Then sketch the expiry payoff before looking at Greeks or strategy names. This prevents jargon from hiding the basic contract.

Use [MarketDeck F&O](/futures-and-options/) to explore the available option-chain, payoff and strategy-analysis tools. The [Futures & Options learning hub](/intelligence/futures-options/) organizes the beginner sequence so contract basics come before volatility and multi-leg strategy analysis.

## Common beginner mistakes

The first is confusing strike with premium. The second is assuming an out-of-the-money option is “cheap” because its premium is small. The third is forgetting lot size when translating per-unit premium into actual cash. The fourth is ignoring expiry. The fifth is looking only at the buyer and forgetting the seller has a different obligation.

Another mistake is assuming every call is bullish and every put bearish in the same simple sense. Multi-leg portfolios and hedges can combine contracts in many ways. Learn the individual contract first, then study combinations.

## Frequently asked questions

### What is the simplest difference between a call and a put?

A call gives the buyer a right to buy at the strike under the contract terms; a put gives the buyer a right to sell. The buyer pays a premium for that right.

### Can an option buyer lose more than the premium?

In the cash-settled index examples here, the option buyer’s expiry loss before charges is limited to the premium paid. That does not mean every real position needs only that amount of cash: physically settled stock options can create delivery-funding or share-delivery obligations, and costs and broker close-out rules also matter. Sellers and multi-leg positions have different risk profiles. [S4]

### Why can an option lose value even if I guessed the direction correctly?

Because option value before expiry depends on more than direction. The size and timing of the move, time remaining, implied volatility and other pricing inputs can matter. A correct directional idea does not guarantee a profitable option position.
