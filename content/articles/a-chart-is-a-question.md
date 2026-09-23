## Start with the question the chart can answer

To read a stock chart properly, identify the instrument, the bar interval, the date range, the price-adjustment method and the scale before interpreting its shape. Then distinguish an observation about price history from an explanation of what caused it. This guide develops that sequence using hypothetical examples, not trading signals.

A chart may help you describe a drawdown, compare two return paths or investigate the market's response to an announcement. It cannot, by itself, tell you whether a company is well governed or whether tomorrow's price will rise. The danger is not looking at charts. It is allowing a visually persuasive pattern to answer a question the data do not actually resolve.

Imagine a share that moves from ₹100 to ₹120, falls to ₹90 and later reaches ₹135. A chart showing only the final recovery looks different from one showing the whole path. Both can be accurate. The research error occurs when the chosen window conceals an important part of the question.

> A chart is a measurement surface. Its settings are part of the evidence, not decoration around it.

## Read the five settings before reading the pattern

First check the identity of the instrument. A stock, a continuous futures series, an index and a fund tracking that index are not interchangeable price histories. Confirm the exchange, symbol and instrument description. Similar names or changed symbols deserve particular care.

Second, identify the interval. A daily candlestick summarises one day's observations; a weekly candlestick aggregates a longer period. Changing interval changes what you can see. Third, record the start and end dates. A one-year window can help frame a recent question without representing the company's entire market history.

Fourth, inspect whether the series is raw or adjusted for corporate actions and whether dividends are included. TradingView's own support documentation, for example, distinguishes a dividend-adjusted presentation intended to show total return from an ordinary price view. Providers and instruments can offer different settings, so read the methodology rather than assuming that adjusted always means the same thing. [S1]

Fifth, check the vertical scale. A linear price axis, a logarithmic axis and an indexed percentage comparison encode different questions. TradingView's charting documentation explicitly treats normal, logarithmic, percentage and indexed-to-100 modes as distinct choices. That is a useful reminder to record the selected mode when comparing images. [S2]

## What a candlestick tells you—and what it leaves out

A conventional candlestick summarises opening, highest, lowest and closing prices for its interval. Its body connects the open and close; its wicks extend to the high and low. Colour conventions differ between platforms, so read the legend before treating a colour as an upward or downward session.

Suppose a hypothetical day opens at ₹100, reaches ₹110, trades as low as ₹95 and closes at ₹105. Those four values do not reveal the order in which the high and low occurred. The market could have risen first and sold off, or fallen first and recovered. Many intraday paths can produce the same daily candle.

That limitation matters when an argument depends on sequence. A daily bar cannot establish that a stop or target would have been reached first inside the bar. It also cannot tell you whether a quote was executable at a chosen size. More detailed data may answer a narrower question, but more detail does not automatically remove missing information.

Write what you can defend: the session closed above its open after trading across a ₹15 range. Avoid upgrading that description into a psychological story about informed buyers unless you have independent evidence for the explanation. Descriptive language is not weaker analysis; it is better calibration.

## Why timeframe changes the apparent story

A one-minute view is useful for a different purpose from a five-year monthly chart. The interval should follow the question rather than the interval that makes the strongest visual pattern. For a corporate-results study, you might first inspect a daily window around the release and then examine the longer context.

Keep the event timestamp separate from the reporting period. A quarter ending in March may be reported later. A price move before publication cannot be explained by saying that the public had already seen the subsequently released document. Our guide to [NSE announcements and results](/intelligence/notes/read-nse-company-announcements-results/) shows how to preserve that distinction.

Use a consistent process for changing windows. Start with a context window, select a clearly stated event window and preserve both. Do not slide the start date repeatedly until the story looks convincing. That is an easy way to make an exploratory chart look like a pre-specified result.

When comparing stocks, align observation dates and trading calendars as far as the question requires. A missing observation should remain visible as missing; silently carrying a price forward can make a less frequently traded instrument appear calmer than the evidence warrants.

## Linear versus logarithmic scales

On a linear price scale, equal vertical distances represent equal price differences. A move from ₹100 to ₹200 occupies the same price distance as a move from ₹400 to ₹500, even though the first is a 100% gain and the second is a 25% gain.

On a logarithmic scale, equal vertical distances represent equal proportional changes. Doubling from ₹100 to ₹200 and doubling from ₹200 to ₹400 therefore occupy equal distances. This is a mathematical property of the transformation, not a prediction about how prices behave.

| Hypothetical move | Rupee change | Percentage change |
| --- | --- | --- |
| ₹100 to ₹200 | ₹100 | 100% |
| ₹200 to ₹400 | ₹200 | 100% |
| ₹400 to ₹500 | ₹100 | 25% |

For a long history with large proportional changes, inspecting a log view can prevent early movements from becoming visually insignificant merely because later prices are larger. For a question about a fixed rupee range, a linear view may be easier to interpret. Neither scale is universally correct; the problem is failing to disclose which one you used.

Do not compare the steepness of a line across screenshots with different chart dimensions or scales. A taller plotting area can make the same data look more dramatic. Compare calculated changes and stated settings rather than treating the angle on the screen as a stable market statistic.

## Price return, dividends and corporate actions

A price-only chart answers a price-only question. Suppose a hypothetical share starts at ₹100, pays a ₹5 cash dividend during your holding period and finishes at ₹98. The price return is −2%. Ignoring reinvestment, tax and costs, the holding-period total return is 3%: the ₹98 ending price plus ₹5 cash, less the original ₹100.

This example does not specify how any platform constructs its adjusted series. Reinvestment conventions, timing and data corrections matter. The practical lesson is to compare like with like: do not compare a dividend-inclusive strategy result against a price-only benchmark and attribute the whole difference to skill.

A split can also change the quoted price without an equivalent change in the value of a holding. In a simplified two-for-one split, one share at ₹200 becomes two shares at ₹100, with the same ₹200 total value immediately around the mechanical adjustment. Real market prices can also move for other reasons; keep those effects separate.

NSE's official corporate-action page is a primary starting point for checking relevant events. [S3] When a chart has an unexplained discontinuity, verify the action and the provider's adjustment rather than assuming either a catastrophic loss or a data error. Save the raw observation and the explanation you verified.

## Compare return paths, not nominal share prices

A ₹2,000 share is not automatically more expensive in valuation terms than a ₹200 share. Nor does placing both price series on one axis provide a sensible performance comparison. To compare paths, you can rebase each to 100 at the same starting observation.

The rebased value is 100 multiplied by the current series value divided by its starting value. If one instrument starts at ₹50 and ends at ₹60, its index rises from 100 to 120. If another starts at ₹500 and ends at ₹550, it ends at 110. The comparison now shows 20% versus 10%, before any differences in dividends, costs or methodology.

Make the baseline choice explicit. Moving the starting date can change which instrument appears to lead. This is not a reason to avoid comparisons; it is a reason to test whether the conclusion survives several economically meaningful windows rather than one conveniently chosen date.

Also consider the path between the endpoints. In our opening example, the fall from ₹120 to ₹90 is a 25% drawdown. The recovery from ₹90 back to ₹120 requires a gain of about 33.3%. These percentages have different starting denominators, which is why they are not equal.

[[figure]]

## Use volume and apparent levels as questions

Volume can add context to a price movement, but a high-volume bar does not uniquely identify the participants or their intentions. Compare the observation with a relevant history and check whether an event, rebalance or data convention might explain an unusual print. Avoid treating an isolated spike as a complete explanation.

A zone repeatedly visited by price can be worth examining. Calling it support or resistance describes a proposed interpretation of the history, not an enforceable boundary. Charles Schwab's educational treatment introduces these ideas as chart-reading concepts; it should not be mistaken for evidence that a particular level must hold. [S4]

Before drawing many lines, write a simple hypothesis. For example: price has repeatedly traded within this range during the selected period. Then ask what evidence would contradict the interpretation. If every new outcome can be explained after the event, the idea is difficult to test.

Do not allow a chart observation to override missing business research. A clear-looking pattern cannot resolve an unexplained cash-flow shortfall or establish that a valuation is reasonable. Read the [fundamental screening guide](/intelligence/notes/business-before-the-stock/) alongside the price record.

## Build a reproducible chart note

A useful chart note records the instrument, exchange, data provider, retrieval time, interval, window, adjustments and scale. Add a short observation, a separate interpretation and one unresolved question. Include the underlying values when a numerical claim matters.

For example: the hypothetical series fell 25% from its selected peak before recovering. That is a calculation. The suggestion that a results announcement caused the recovery is a hypothesis requiring event timing and other evidence. Keeping those sentences separate makes later review much more informative.

Use [MarketDeck Charting](/charts/) to explore available price history and technical context. This guide describes research checks, not a claim that every data mode discussed is offered by that tool. Confirm the available controls and data coverage in the actual view you use.

Then connect the chart to a [five-lens research memo](/intelligence/notes/five-research-lenses/). The final output should be a question you can investigate more precisely, not a screenshot used as a substitute for an argument.

## Frequently asked questions

### Which timeframe should a beginner use?

Choose the interval that matches the question. A daily chart is often a manageable starting point for studying a medium-term price history, but it does not answer intraday execution questions. Preserve a longer context view and explain why you selected the detailed window.

### Does a rising chart mean the stock is fundamentally strong?

No. It describes price behaviour in the selected period. Financial performance, financing, governance and valuation require additional evidence. A rising price can coexist with unresolved business risks, just as a falling price does not by itself establish that a business is failing.

### Should I always use an adjusted chart?

Use the treatment appropriate to your question and document it. Raw prices, split-adjusted prices and dividend-inclusive series can serve different purposes. The crucial requirement is consistency when comparing instruments, calculating returns or testing a historical rule.
