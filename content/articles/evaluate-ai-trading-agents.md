## Judge the experiment before the return chart

To evaluate an AI trading agent, inspect its information boundary, tools, decision rules, benchmark, costs and failure record before interpreting reported returns. A system that writes a persuasive explanation is not necessarily a system that makes dependable financial decisions. A profitable historical example is not automatically evidence of a durable edge.

This distinction is particularly important for Indian-market research. Results on US equities, Chinese A-shares or cryptocurrencies do not establish performance on NSE instruments. Trading calendars, available information, contract specifications, liquidity and implementation constraints need local testing. This article proposes an evaluation framework; it does not claim that MarketDeck has validated a profitable autonomous strategy.

The referenced papers are research evidence about particular systems and evaluation settings. They are not endorsements, guarantees or instructions to connect an agent to a brokerage account. Numerical examples in this guide are hypothetical.

## What makes a trading system agentic?

For this discussion, an agentic system does more than return a prediction from a fixed input. It can choose tools, retrieve information, maintain a working state and use intermediate results to decide its next step. The relevant object of evaluation is the whole workflow, including what it is allowed to do when information is missing.

TradingAgents is an example of a multi-agent architecture with specialised analytical roles, opposing research perspectives and a risk-management component. The authors report experimental advantages against selected baselines. That finding belongs to the paper's tested setup; the existence of a team-shaped architecture alone does not establish an investment advantage. [S1]

A useful first question is therefore: what function does the language model actually perform? It may retrieve filings, classify an event, generate a hypothesis, select a portfolio action or communicate an explanation. These tasks require different tests. Calling all of them AI trading obscures the boundary between research assistance and delegated action.

Write the boundary explicitly. In a research-only prototype, the model may propose an analysis but have no authority to submit orders. In a simulation, it may select actions against a defined price model. In a live execution system, operational and financial risks become materially different. Do not use those labels interchangeably.

## Separate research claims from demonstrated evidence

AI-Trader describes a benchmark involving US stocks, A-shares and cryptocurrencies in simulated live financial environments. Its authors report that general model capability did not consistently translate into effective trading and identify weak risk management in many evaluated agents. This is useful evidence against assuming that a more capable general model must produce better investment results. [S2]

Herculean broadens evaluation to trading, hedging, market insights and auditing workflows. Its authors highlight a gap between financial reasoning and dependable end-to-end execution, particularly where state consistency and structured verification matter. [S3] Neither paper removes the need to test your own system, data and constraints.

When reading a performance claim, record what was measured and what was not. Was the result generated on historical data, through forward paper evaluation, or with actual capital? Were trades executable under the stated prices? Was the system fixed before the evaluation period? Was the result independently reproduced?

Avoid stacking incomparable results in one leaderboard. Different horizons, benchmarks, instruments, costs and permitted tools can make a simple ranking misleading. A useful comparison table includes those differences rather than presenting returns as though every entrant faced the same experiment.

## Freeze the information boundary

The most important historical question is what the system could have known at each decision time. A filing's reporting period is not its publication date. A later transcript cannot support an earlier decision. A current data endpoint may contain revised values that were unavailable when the hypothetical action occurred.

Save the raw inputs or a reproducible snapshot, their source URLs and their availability timestamps. For an Indian company-results experiment, use the [NSE filing workflow](/intelligence/notes/read-nse-company-announcements-results/) to separate fiscal periods from release times. A clean prompt cannot compensate for a contaminated input dataset.

Language models create an additional difficulty: a model may already have encountered historical narratives during training. Removing company names and dates can be a useful diagnostic, but it does not prove that all leakage has been eliminated. Treat masking as one test among several and explain what it can and cannot establish.

Keep research discovery separate from final evaluation. If you change prompts, features or thresholds after examining an evaluation period, that period has influenced development. It should not continue to be described as untouched evidence. Record versions and reserve genuinely later observations for the next test.

## Compare against simple, relevant baselines

A complicated agent needs a meaningful baseline, not only a weak alternative selected to make it look good. Depending on the task, compare it with a no-action policy, an appropriate passive benchmark, a simple deterministic rule and a simpler version of the same agent. Give each the same information boundary and relevant constraints.

Suppose a hypothetical agent gains 12% while the selected benchmark gains 15% over the same period. The positive return alone does not demonstrate benchmark outperformance. Conversely, a lower return with substantially lower exposure raises a different question that cannot be answered by the endpoint alone.

For a research assistant, the right baseline may not be a portfolio at all. Compare extraction accuracy, citation correctness, task completion time and the number of unsupported claims. An assistant that reliably produces a verifiable filing summary may be useful without being an autonomous stock picker.

Use paired tasks where possible. Give the baseline and agent the same dated input set, record both outputs, and evaluate with criteria chosen in advance. Do not let one system browse unrestricted current information while another receives a limited historical snapshot and call the comparison fair.

## Evaluate four layers independently

The first layer is evidence handling: did the system retrieve the correct source, preserve dates and distinguish facts from assumptions? The second is analytical output: are calculations correct and conclusions supported? The third is decision or portfolio construction: does the proposed action obey the research specification? The fourth is operational execution: does the system maintain a correct state and handle failures?

A system can succeed at one layer and fail at another. A correct analysis may be mapped to the wrong instrument. A sensible proposed action may be duplicated after a retry. An apparently strong return may coexist with unsupported citations. One aggregate score can hide these distinctions.

[[figure]]

| Evaluation layer | Example check | Failure that should remain visible |
| --- | --- | --- |
| Evidence | Source and availability time match the task | Uses a later filing |
| Analysis | Recompute a stated ratio independently | Wrong denominator or unit |
| Decision | Action follows the frozen specification | Exceeds allowed exposure |
| Operations | Reconcile actions with the authoritative state | Duplicate or unrecorded action |

Design the test report so a failure cannot disappear merely because the final financial result happens to be favourable. A profitable rule violation is still a rule violation. Operational correctness is a requirement to assess separately, not a bonus awarded only when returns are poor.

## Include costs, uncertainty and unsuccessful runs

For financial simulations, state the assumed spread, transaction costs, slippage, financing and execution timing where relevant. Model usage and data costs also matter to a deployed research workflow. A method that adds a small benefit at a much larger operating cost may not improve the user's outcome.

Report paths as well as endpoints. Drawdowns, turnover, exposure and concentration help explain how a result was achieved. A high return obtained by taking much greater risk is not a like-for-like improvement over a constrained baseline. Do not use a single attractive ratio to hide changes in the risk budget.

Language-model outputs can vary across runs. Repeat an appropriately bounded set of trials with a documented setup, and preserve unsuccessful runs. Report the distribution rather than selecting one convincing narrative. If a provider changes the model behind an endpoint, record the version information available to you and treat reproducibility as limited where it cannot be pinned.

Keep sample size in view. Twenty decisions, twenty market days and twenty independent experiments are not the same thing. Many actions exposed to the same event may provide less independent evidence than their count suggests. State the observation unit and avoid presenting a small trial as broad validation.

## Test the failure conditions on purpose

A useful test suite includes missing data, stale quotes, contradictory sources, failed tool calls and malformed responses. Decide how the system should behave before running those cases. Abstaining with a clear reason can be the correct outcome; forcing an answer can create a hidden incentive to invent information.

Treat external pages and documents as evidence, not as instructions to the agent. A retrieved source should not be able to change the system's authority, request credentials or override a hard limit. Test whether suspicious content is isolated from the decision rules rather than assuming the model will recognise every attack.

Keep calculations and authoritative state outside free-form prose where possible. Code can compute a ratio from validated inputs; a reconciled ledger can track the simulated position. The model may explain or propose, but its memory should not become the sole source of truth for cash, holdings or completed actions.

Version prompts, tools and policies. A change that improves one example can weaken another. Save a rollback point and rerun representative regression cases before interpreting a new result as progress. These are proposed engineering controls, not evidence that any particular architecture is completely safe.

## Build an India-specific paper-evaluation plan

Start with a narrow research task on a small, explicitly defined universe. For example, ask an assistant to extract a fixed set of fields from dated NSE results and produce a source-linked memo. Establish a manually verified reference set before adding portfolio decisions.

Move to forward paper evaluation only after the evidence and calculation tests are reliable enough for the stated purpose. Freeze the rules, record observations as they arrive and retain the system's abstentions. Paper evaluation avoids delegating real-money orders, but it still has modelling limitations and should not be described as realised trading performance.

Use the relevant [MarketDeck research tools](/#products) to inspect business, price, derivatives and commentary context. They are research surfaces, not proof that an autonomous trading strategy has been validated. The [research checklist](/intelligence/notes/five-research-lenses/) can help structure the human review record.

For a broader overview of the field, read [The agentic trading frontier](/intelligence/issues/agentic-trading-frontier-2026/). Keep the two pieces distinct: the magazine surveys ideas, while this guide asks what evidence an individual system would need before you could trust its claims.

## A practical go-or-stop review

Before extending an experiment, ask whether its inputs are traceable, calculations reproducible, benchmark relevant and unsuccessful runs retained. Check whether hard constraints remain outside the model's discretion. Confirm that the evaluation period has not silently become a tuning dataset.

If a critical field cannot be verified, stop at the claim you can support. You may have demonstrated a useful summariser, a promising hypothesis generator or a workflow that merits a larger paper test. Those are meaningful outcomes. They do not need to be exaggerated into a market-beating autonomous trader.

## Frequently asked questions

### Does a profitable AI backtest prove that an agent can trade?

No. Inspect leakage, benchmark choice, costs, execution assumptions and how many configurations were tried. A historical result can motivate further research, but it is not equivalent to forward performance or dependable live operation.

### Are multiple agents always better than one?

No. Additional roles can provide useful decomposition, but they also add cost, handoffs and opportunities for correlated errors. Compare the complete system with simpler alternatives under the same information and constraints rather than assuming that more conversation creates more information.

### What is a sensible first AI-finance task?

A narrow, verifiable research task is easier to assess than unrestricted trading. Extracting fields from dated filings, checking calculations or assembling a source-linked memo provides clearer evaluation criteria. Keep human review and explicit uncertainty rather than delegating financial authority prematurely.
