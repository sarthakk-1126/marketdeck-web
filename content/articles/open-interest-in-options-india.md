## What is open interest in options?

Open interest (OI) is the number of derivative contracts that remain outstanding rather than having been closed, exercised, expired or settled. NSE’s F&O regulations define OI as the number of unsettled derivative contracts and count only one side of each contract. [S1] If a buyer and seller create one new contract, OI increases by one contract—not two. Because every outstanding contract has both a long and a short side, a large OI figure alone does not reveal which side is winning or what the underlying will do next.

For Indian stock-index derivatives, this distinction matters. A NIFTY option chain can display substantial open interest around several strike prices. Those concentrations tell a researcher where many positions remain open at the named expiry, not that one strike is a guaranteed support or resistance level. There is no logical rule under which high call OI guarantees falling prices, or high put OI guarantees rising prices. Contract count is not the same thing as participant intent, net directional exposure or future price.

This guide explains OI, OI change, volume and four commonly used price–OI labels; then it walks through a fictional chain and a practical research checklist. No figures below represent current NSE option-chain readings, trading recommendations or a tested strategy.

## Open interest vs volume: why the two columns differ

Volume counts contracts traded over the selected observation period. Open interest counts contracts still outstanding at a defined observation point. A contract can trade several times without necessarily changing total OI. Exchange reports display both measures, but the unit, time and source of each observation must be checked. [S2]

Consider four hypothetical transactions in one option contract. When a new buyer trades with a new seller and both open positions, volume rises by one and OI rises by one. When an existing long transfers their position to a new long while the short side remains open, trading volume rises but aggregate OI can remain unchanged. When an existing long and existing short close against each other, volume rises and aggregate OI falls. The identity and opening/closing status of counterparties therefore matter.

| Hypothetical situation | Traded volume | Open interest change | What you can conclude |
| --- | --- | --- | --- |
| New long meets new short | +1 contract | +1 contract | One new contract remains outstanding |
| One existing position transfers | +1 contract | 0 contracts | A trade occurred; total outstanding contracts did not change |
| Existing long and short both close | +1 contract | -1 contract | One outstanding contract was extinguished |
| Same contract turns over repeatedly | Many trades | Could be near 0 | High activity need not mean many net new contracts |

These are simplified clearing illustrations, not a claim about the exact participant sequence behind any displayed market snapshot. A positive OI change is often described loosely as “fresh positions,” but it does not show whether the initiating party was a buyer or seller, whether the position is hedged, or whether another instrument offsets it. A negative OI change is a reduction in outstanding contracts, not automatically bearishness or bullishness.

## How to read OI change without inventing precision

Start with the contract identity. Check underlying, option type, strike and expiry. A 22,500 call expiring this week is not the same instrument as a 22,500 call expiring next month; adding their OI can be useful only if the aggregation rule is stated. Stock and index contracts also differ in settlement conventions and liquidity. Current terms are governed by exchange specifications rather than an old blog post. [S3]

Next, record the timestamp and unit. Some terminals display OI as contracts; others display a quantity derived from lot size. Never compare two values merely because both are labelled “OI.” If displayed in lakh units, convert deliberately. When comparing across expiries or contract revisions, account for contract specifications and adjusted quantities.

Finally, compare the current reading with the same contract's specified earlier observation. A “change in OI” column requires a baseline. It may mean change since the previous trading-day close, or another convention defined by the data provider. If that baseline is unavailable, avoid treating the number as intraday accumulation.

> OI is a position inventory. Volume is trading activity. Price is the observed outcome. None of the three substitutes for the others.

## The four price–open-interest patterns explained

Traders frequently combine the direction of an underlying or futures price move with the direction of the same instrument's OI change to produce four descriptive labels. These labels can help organise observations, but they are heuristics—not direct identification of the beneficial owners or their motivations.

[[figure]]

| Price change | OI change | Common shorthand | A cautious interpretation |
| --- | --- | --- | --- |
| Price rises | OI increases | Long buildup | Upward price and more outstanding contracts coexist |
| Price falls | OI increases | Short buildup | Downward price and more outstanding contracts coexist |
| Price rises | OI decreases | Short covering | Upward price coincides with fewer outstanding contracts |
| Price falls | OI decreases | Long unwinding | Downward price coincides with fewer outstanding contracts |

### 1. Long buildup: price up, OI up

Suppose a fictional futures contract moves from 22,400 to 22,520 while OI increases from 180,000 to 195,000 contracts over a defined comparable window. The observation is an upward price move accompanying a net increase of 15,000 outstanding contracts. It is often labelled long buildup.

The label does not prove that every new trader is bullish: every new futures contract still creates both a long and a short. Nor does it reveal whether a large participant holds a hedge in another instrument. Stronger claims require position-category reports, order-flow evidence and clearly defined timing; even those are not infallible.

### 2. Short buildup: price down, OI up

If a fictional contract falls from 22,520 to 22,400 while OI rises, commentators may call it short buildup. The observed fact remains the same narrow pair: lower price, more outstanding contracts. A falling price could also be affected by broader market news, liquidity or related positions.

### 3. Short covering: price up, OI down

If price rises while OI declines, the shorthand is short covering. Closing shorts can be associated with upward price pressure, but aggregate OI cannot tell whether exiting shorts drove the move. Some long positions may be closed at the same time. This is a hypothesis about market behavior, not a transaction-level proof.

### 4. Long unwinding: price down, OI down

When price falls while outstanding contracts decline, the conventional label is long unwinding. Again, it describes two simultaneous changes. It cannot isolate the effect of closing long positions from wider forces.

There is another nuance. Analysts commonly apply this matrix to an underlying or futures price and corresponding futures OI. Applying it naively to an individual option's premium can be misleading: option premium changes also reflect moneyness, time decay, implied volatility and underlying movement. If you use options data, first specify which price you are comparing with which OI series.

## A worked NIFTY option-chain example

Imagine a fictional NIFTY option chain for one chosen expiry. Three nearby strike prices show the following call and put OI values. The values are invented exclusively for teaching.

| Strike | Call OI (contracts) | Put OI (contracts) | Question to investigate |
| --- | --- | --- | --- |
| 22,400 | 16,000 | 28,000 | Why is put inventory greater here? |
| 22,500 | 31,000 | 24,000 | How did inventory change since the baseline? |
| 22,600 | 42,000 | 14,000 | Is concentration stable or moving? |

The largest call OI in this tiny sample appears at 22,600 and the largest put OI at 22,400. It is tempting to draw two hard lines and label them resistance and support. That is not enough evidence. Outstanding contracts can represent outright positions, spreads, hedges or adjustments. Inventory can migrate as price approaches a strike, and option exposures change with time and volatility.

What would a researcher check before interpreting the table? The full chain rather than three cherry-picked rows; the expiry; observed spot and futures references; the OI-change baseline; trade volume and spreads; prior snapshots; and any relevant corporate or macro calendar. A daily summary and a genuinely timestamped intraday snapshot are not interchangeable.

## Where does put–call ratio fit?

Put–call ratio (PCR) is often calculated as total put OI divided by total call OI for a specified universe of options. That universe might be one instrument and expiry, all selected strikes, or an explicitly aggregated set of expiries. Changing the universe can change the result substantially.

For the three illustrative rows above, put OI totals 66,000 and call OI totals 89,000. The restricted-sample OI PCR is 66,000 / 89,000, approximately 0.74. This is not a market-wide PCR and is not a statement that bearish or bullish outcomes are more likely. It is a ratio of two inventory counts.

A PCR derived from trading volume is a different measure from an OI-based PCR. Never compare them without labelling the numerator, denominator, universe and observation time. A high PCR can reflect protective hedging, directional speculation or complex structures. There is no universal numerical threshold that becomes a reliable trade signal across regimes.

## Does the maximum OI strike predict support or resistance?

No. The strike carrying the greatest OI is a useful descriptive concentration, not a price floor or ceiling. Positions may be hedged, rolled or closed as the market moves. A change in high-OI strikes is another observation worth recording, but not proof that buyers or sellers must defend a level.

“Max pain” is a separate expiry-payoff construct based on the aggregate intrinsic payout of a set of open contracts under specified assumptions. It is not the same as maximum call OI, maximum put OI or a forecast of settlement. Market participants are not required to settle at the computed pain point. If the chain omits positions, applies inconsistent lot units or spans different expiries, even the calculated quantity may be unreliable.

## A practical NIFTY OI research checklist in MarketDeck

MarketDeck's F&O research surfaces provide option-chain and related analytics for examining available derivatives observations. The useful process is not to search for a magical indicator. It is to ask a sequence of source-aware questions.

1. Open [MarketDeck F&O Analytics](/futures-and-options/analytics/chain/) and identify the named instrument, underlying and expiry supported by the interface.
2. Check whether data are live, cached, a stored snapshot or unavailable. Do not infer freshness from a visually active screen.
3. Inspect both call and put OI alongside trading volume, premium and any displayed change series. Record units and available timestamps.
4. Examine the chain at several nearby strikes rather than selecting only the single largest column.
5. Where supported, inspect IV, Greeks, PCR or payoff tools as different analytical views. Do not turn a ratio into a directional certainty.
6. Keep a short research note: observation, alternative explanation, missing evidence and what future observation would change your interpretation.

Some derivatives data may have licensing or distribution limitations. MarketDeck does not claim unrestricted real-time redistribution, broker execution or an ability to infer a participant's trading book from aggregate OI. If a module requires authentication or data are unavailable, the correct result is an honest limitation rather than fabricated figures.

## Five mistakes that can invalidate an OI interpretation

- Mistaking traded volume for changes in outstanding positions; an active strike need not accumulate inventory.
- Comparing strikes or expiries with inconsistent units, lot sizes, baselines or update times.
- Treating a call-OI concentration as guaranteed resistance or a put-OI concentration as guaranteed support.
- Inferring the identity or intent of new buyers and sellers from aggregate contract count alone.
- Calling a directional move a successful strategy without examining costs, spreads, time decay, liquidity, margin risk and the possibility of large derivative losses.

SEBI's investor material specifically warns that derivatives can magnify losses and require informed risk assessment. [S4] A correctly interpreted OI observation is not a substitute for position sizing, scenario analysis or understanding contractual obligations.

## Frequently asked questions

### Is rising open interest bullish?

Not inherently. Rising OI indicates more outstanding contracts in the measured series. Whether the market subsequently rises depends on more than contract count. Each new derivative contract has a long and short side.

### What is the difference between OI and change in OI?

OI is the outstanding balance at a particular observation point. Change in OI is the difference from a defined earlier baseline for the same comparable contract or series.

### Can option-chain OI tell me which institutional investor is buying?

No. An aggregate strike-level OI table does not identify end investors or their hedges. Published participant-class summaries may answer narrower aggregate questions but do not reveal every institution's strategy.

### Why do option price and OI sometimes move in opposite directions?

Option premium is affected by the underlying, strike relationship, expiry, implied volatility and other pricing inputs. OI is a position count. They measure different phenomena.

### Does the highest put OI guarantee support?

No. It identifies an open-position concentration, not a commitment to defend the underlying price. The concentration itself can change.

### Is open interest useful for intraday trading?

It may help describe positioning when observations are timely, comparable and accompanied by liquidity and price context. It does not create a tested edge on its own; stale updates can make an apparently precise intraday inference especially misleading.

## What to remember before your next option-chain review

Open interest is the inventory of outstanding contracts. Volume is how many contracts changed hands during an observation period. A price–OI quadrant is a convenient label for a pair of changes—not a proof of trader identities or a prediction. PCR and high-OI strikes add context only when their input universe, unit, expiry and timestamp are defined.

The better research habit is to move from “This strike has huge OI” to “What does the source actually measure, what else could produce this observation, and what would change my view?” That is the distinction between a column on a terminal and a defensible analytical note.

Continue with the [IV Rank vs IV Percentile guide](/intelligence/notes/iv-rank-vs-iv-percentile-nifty-options/), the [Call vs Put Options guide](/intelligence/notes/call-option-vs-put-option-india/) and [MarketDeck's F&O tools](/futures-and-options/). Figures here are entirely hypothetical; verify current exchange specifications before using them for live market research.
