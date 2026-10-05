## A strategy test starts before the equity curve

A strategy backtest applies stated rules to historical observations. Its result depends on what data was available, when a decision could be made, how an order was simulated and which costs were included. A smooth chart answers none of those questions on its own. This checklist helps you prepare and review a small research experiment before treating its output as evidence. It is an educational workflow, not a strategy recommendation or a claim of profitable performance.

The [MarketDeck Research Terminal](/screener/research-terminal/) connects company research with a private workspace. Its Strategy Lab provides a bounded visual strategy workflow using supported inputs. As checked on 5 October 2026, Python source can be edited, saved and exported, but arbitrary Python execution inside the application is unavailable. Built-in automatic market history is also unavailable in this release. Owner-imported data requires the user's rights and data-treatment declarations. Check the current in-product readiness message before trying an example. [S1]

This distinction matters if you are looking for a stock-market coding station. An editor is not an execution engine, a saved specification is not a completed calculation, and a downloadable script is not a verified strategy. The research process below applies whether you use a visual builder or a separate environment you control. Nothing here asks you to place an order or connect a broker.


[[figure]]

## Write the rule in plain language first

Start with one instrument or a clearly defined universe and one hypothesis. A fictional example might be: “Observe a daily close above a stated moving average; evaluate a purchase at the next available session's open; leave when a separately stated exit condition is satisfied.” That is still incomplete. You must specify the lookback, signal equality rules, missing observations, position size, starting cash, costs and what happens when there is no next session.

Do not use the example as an investing signal. It is deliberately simple so that the timing can be inspected. A complicated rule with many exceptions may be harder to falsify because each disappointing period invites another patch. If a rule cannot be explained without referring to the final performance chart, you may be describing a pattern you found after looking rather than an experiment you defined beforehand.

Keep a written version of the hypothesis outside the result table. A useful version record includes the intended mechanism, exact condition, dataset identity and a reason for the chosen comparison. When any of those changes, call it a new attempt. A new version is not an error; concealing its relationship to earlier attempts is the problem.

## Check the dataset before calculating returns

For imported daily candles, identify the instrument, currency, timezone, date range, frequency and source. Explain whether open, high, low and close share the same adjustment basis. A label saying “adjusted” is insufficient if only one field has been transformed. Also identify how splits, dividends and other relevant actions are represented. Do not add an action adjustment twice or combine adjusted prices with raw events without understanding the contract.

MarketDeck's released importer validates bounded inputs and reports row or mapping problems, but validation is not proof that a dataset is complete or economically appropriate. The release has no supported automatic history source; imported snapshots remain user-declared inputs. [S1] A missing session could be a genuine holiday, suspension, data gap or an import mistake. Your research record should explain which calendar or session inventory supports the interpretation.

For a multi-company experiment, record how the historical universe was formed. Selecting only companies that exist today may omit failures and delistings. A strategy based on financial statements also needs the dates those statements became available, not merely the reporting periods printed on them. A result using a March year-end figure before its publication is using information the researcher would not yet have had.

## Separate a signal from a possible fill

Consider three fictional sessions. On Monday the closing condition becomes true at a price of INR 100. Tuesday opens at INR 102. Wednesday opens at INR 101. If your rule decides after Monday's close and fills at Tuesday's open, INR 102 is the starting reference price for that simulated purchase. Buying retrospectively at Monday's close would need a different, explicitly supported timing model.

Now suppose the Tuesday opening observation is missing. You cannot simply treat it as INR 100, and you should not silently use Wednesday unless the rule specifies how a delayed fill works. Similarly, if the final session produces a signal but no later session is available, the simulation cannot invent the next price. Inspect a few events manually before interpreting aggregate metrics.

A daily bar does not reveal the exact order in which its high and low occurred. If both a stop and another trigger lie inside the same bar, the result depends on the execution assumption. That ambiguity is a reason to document the engine's supported rules, not an invitation to choose whichever order gives the better return. Use a simpler supported experiment when the data cannot resolve your question.

## Work a cost example by hand

Assume a fictional purchase of 100 shares at a reference price of INR 102 and a later sale at INR 108. The gross cash difference is 100 times (108 minus 102), or INR 600. For this illustration only, apply adverse slippage of 0.1% to each reference price. The simulated buy becomes INR 102.102 and the sell becomes INR 107.892. Before fees, the difference is INR 579.

Add an illustrative fixed fee of INR 10 on each side. The net difference is INR 559, with an initial outlay of INR 10,220.20 and net sale proceeds of INR 10,779.20. The net return on that initial outlay is approximately 5.47%. These assumptions are synthetic. They are not a schedule of Indian brokerage, exchange charges, taxes or statutory levies, and they are not a statement that a particular MarketDeck configuration uses these fee rules.

| Step | Hypothetical amount |
| --- | --- |
| Buy value after adverse slippage | INR 10,210.20 |
| Initial outlay including fixed fee | INR 10,220.20 |
| Sell proceeds after slippage and fee | INR 10,779.20 |
| Net cash difference | INR 559.00 |

Use the example to reconcile units and signs. If your research environment reports a different answer under identical declared assumptions, investigate cash timing, rounding, share sizing and fee treatment. Do not average the two results or assume the more favourable one is correct. Record actual supported engine semantics beside any comparison.

## Keep the experiment history visible

If you try twenty lookbacks and show only the best one, the final curve hides the selection process. Bailey, Borwein, López de Prado and Zhu study the problem of backtest overfitting and propose a framework for assessing it. Their paper is a methodological reference; this guide neither implements their probability estimator nor reproduces their study. [S2]

A practical first step is an attempt ledger. Record the parameter set, reason for the change, dataset version and whether you have already inspected the evaluation period. A held-out period can lose its intended role if you repeatedly consult it while changing the rule. Naming a date range “out of sample” does not undo that feedback.

For the first experiment, choose a modest number of comparisons with distinct purposes. One can test a declared cost assumption; another can test sensitivity to a nearby lookback. Explain why each exists before viewing its result. A parameter neighbourhood that behaves inconsistently may motivate further investigation, but a stable neighbourhood is not proof of a durable market effect.

## Read more than the headline return

A strategy that rises from 100 to 120, falls to 90 and ends at 110 has a 10% start-to-end gain, but the decline from its 120 peak to 90 is 25%. Recovering from 90 to the old peak of 120 requires approximately 33.3%. All three statements can be true at once. A final return alone conceals the path a user would have experienced.

Also inspect trade count, time in the market, concentration, turnover and how much of the outcome comes from a few observations. Ten trades and a thousand trades do not provide the same kind of evidence, and overlapping observations may not be independent. A benchmark must use a comparable period and return definition. Comparing a dividend-inclusive strategy with a price-only benchmark can answer the wrong question.

Use the available run inspector to trace signals, fills and costs rather than merely screenshotting the curve. In the current MarketDeck release, comparisons retain dataset and configuration compatibility checks, and results remain tied to saved runs rather than silently recomputing after edits. [S1] Those records support inspection; they do not certify that a rule will work outside its historical sample.

## Distinguish a coding problem from a research problem

A Python syntax error, a mismatched CSV date and an unsupported field are implementation problems. A rule selected after hundreds of trials, a future-data leak or an unrealistic fill assumption are research problems. Fixing the first category may leave the second untouched. This is why running code successfully is only one checkpoint in a broader process.

If you export code, preserve the source version, input snapshot and configuration used for the comparison. Check independently calculated examples before relying on output. Edited code is a new artifact: the correctness evidence attached to a generated template does not automatically transfer to arbitrary changes. Review the environment's available libraries, limits and data permissions before attempting execution elsewhere.

A book idea may never become an appropriate coding rule. “Understand the business” is a research discipline, not a Boolean entry condition. If you cannot define an observable historical input without changing the idea, return to a [book-to-research note](/intelligence/notes/investing-book-to-research-workflow/) instead of forcing it into a backtest. The [Books & Investor Methods library](/screener/learning/books/) includes both qualitative and numerical exercises for that reason.

## Use a release checklist for your own experiment

Before sharing a result, state the hypothesis, dataset source, session coverage, action treatment, signal timing, fill rule, sizing and costs. Include the number of recorded attempts and explain how the evaluation period was used. Present a benchmark only when its construction is comparable. Label every synthetic example clearly and avoid implying that a historical simulation is an actual trading record.

Then ask another reader to trace one purchase, one exit and one missing-data case from the written rules. If the reader cannot reproduce the sequence, improve the explanation before expanding the experiment. A useful report can conclude that the available data cannot answer the question. That is a valid research outcome and often a better next step than adding another indicator.

Open the [Research Terminal](/screener/research-terminal/) to inspect its current workspace and capability messages. Keep the experiment private while it contains personal inputs. The public article can explain the method; it does not need your uploaded dataset, notebook, account details or strategy parameters to help another reader learn.

## Frequently asked questions

### Can I execute arbitrary Python in MarketDeck now?

No. At the review date, the editor supports editing, saving and export. In-app arbitrary Python execution remains unavailable. Use the current capability message as the product boundary.

### Can I use any CSV found online?

Check its provenance, definitions and your permitted use first. NSE publishes a data-sharing policy covering use and distribution; public accessibility alone does not establish every application's rights. [S3]

### Does a profitable backtest validate an investing book?

No. A test covers the particular translated rule, sample and assumptions. It cannot validate a whole book or establish that future results will resemble the simulated period.
