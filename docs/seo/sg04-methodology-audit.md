# SG-04B / SG-04D calculation and methodology audit

Audit date: 2026-09-26. Scope: public material derived outputs in StockProof, F&O, Charting, Crypto World and MarketDeck Intelligence. This is implementation evidence, not a new methodology version and not an SG-04I change log.

## Shared field contract

Every row below identifies the calculation name, formula, numerator (N), denominator (D), period/window, units, assumptions and destination/gap. The following product profile supplies the remaining required fields for every row in that product unless a row overrides it:

| Product | Source / provenance | Data state | Rounding | Missing / unavailable treatment |
|---|---|---|---|---|
| StockProof | Stored company financial statements, filing-derived fields, stored price observations, or user-entered calculator inputs; the page-level source period controls. | Stored/historical; calculator inputs are user-entered. Derived values inherit the least-current input. | Full precision for calculation; presentation rounding only. | Missing inputs, insufficient periods, invalid or zero denominators remain unavailable; never zero-filled or estimated. |
| F&O | Named live market input, stored snapshot/archive, exchange contract fields, or user-entered strategy assumptions as labelled by the output. | Live only inside the stated freshness contract; otherwise stored snapshot or historical. | Full precision for calculation; currency, volatility, probability and Greek display precision is applied last. | Missing legs, prices, IV history, days, volume/OI or invalid denominators remain unavailable. Unlimited payoff is labelled, not replaced by a number. |
| Charting | Stored NSE daily OHLCV; named stored benchmark series for relative-strength measures. | Stored/historical. | Full precision for calculation; display rounding only. | Missing OHLCV, insufficient warm-up, unmatched dates and invalid denominators remain unavailable. No forward/back fill. |
| Crypto World | Named recorded providers and timestamps (CoinGecko, DefiLlama, Binance, cleared Indian venue, FX input, stored NIFTY 50 history) or user-entered calculator values. | Recorded/stored snapshot or historical; never described as live unless the product freshness contract is satisfied. | Decimal/full available precision, then stated display rounding. | Missing or implausible input combinations, incomplete depth, insufficient history and invalid denominators remain unavailable. Confirmed source zero is retained only where zero is factual. |
| Intelligence | Linked primary source or provider definition, source-derived value, or explicitly labelled hypothetical worked example. | Historical/source-dated or hypothetical; an example is not live market data. | Calculate before display rounding; material example rounding is stated. | Missing evidence, non-comparable periods, insufficient history and invalid denominators remain unavailable unless a separate hypothetical assumption is explicitly labelled. |

## StockProof — priority audit

Destination for every row: `https://marketdeck.in/screener/methodology/` plus the relevant output page. Gap status after this change: **closed** unless noted as a deliberately product-specific disclosure.

| Name | Formula | N | D | Period/window | Units | Assumptions / remaining gap |
|---|---|---|---|---|---|---|
| P/E | price per share ÷ EPS | price/share | EPS | matching reported/trailing period | multiple | Earnings scope and period must match the displayed record. |
| Earnings yield | EBIT ÷ enterprise value × 100 | EBIT | enterprise value | matching financial period/value date | % | Magic Formula definition, not inverse P/E. |
| ROE | profit after tax ÷ average equity × 100 | PAT | average shareholder equity | displayed FY/TTM | % | Average balance sheet basis where available. |
| ROCE | EBIT ÷ average capital employed × 100 | EBIT | average capital employed | displayed FY/TTM | % | Capital employed definition remains product-specific and is stated. |
| Debt/equity | total debt ÷ shareholder equity | debt | equity | same reporting date | multiple | Negative/zero equity is unavailable. |
| Current ratio | current assets ÷ current liabilities | current assets | current liabilities | same reporting date | multiple | Zero/missing liabilities unavailable. |
| Dividend yield | dividend per share ÷ price per share × 100 | DPS | price/share | displayed dividend period and price date | % | Not a forward forecast. |
| Market capitalisation | price/share × shares outstanding | price × shares | 1 | price/share-count dates shown | INR | Staleness follows both inputs. |
| P/B | price/share ÷ book value/share | price/share | BVPS | matching statement/price dates | multiple | Non-positive/missing BVPS unavailable. |
| EV/EBITDA | enterprise value ÷ EBITDA | enterprise value | EBITDA | matching period/value date | multiple | Non-positive/missing EBITDA unavailable. |
| Piotroski F-score | sum of nine binary signals | passed signals | 9 tests | current/prior annual periods | 0–9 score | Each component requires comparable periods; incomplete set unavailable. |
| Beneish M-score | weighted intercept plus DSRI, GMI, AQI, SGI, DEPI, SGAI, LVGI, TATA | model terms | per-index bases | current/prior annual periods | score | All eight indices required; no missing-index substitution. |
| Trace Score | equal-weight mean of available eligible pillars, requiring at least 3 of 4 | eligible pillar sum | eligible pillar count | latest eligible evidence | 0–100 score | Minimum 3/4 pillars; provenance remains attached to evidence. |
| Magic Formula rank | combined ordinal rank of earnings yield and ROCE | component ranks | eligible universe | snapshot universe | rank | Universe and snapshot date govern comparability. |
| CAGR | (ending ÷ beginning)^(1/years) − 1 | ending value | beginning value | named number of years | % annualised | Positive endpoints and positive duration required. |
| Sector percentile | eligible values at/below company ÷ eligible sector observations × 100 | qualifying observations | eligible sector count | current comparison snapshot | percentile | Missing peers excluded from denominator, not ranked as zero. |
| Annualised return | compounded period return annualised by elapsed years | ending/beginning growth | elapsed years | selected history | % annualised | Named price/return series controls distributions. |
| Annualised volatility | sample SD(periodic returns) × √periods/year | return dispersion | valid return observations | selected history | % annualised | Frequency and annualisation factor stated by output. |
| Sharpe ratio | (annualised return − risk-free rate) ÷ annualised volatility | excess return | volatility | selected history | ratio | Risk-free assumption stated; zero volatility unavailable. |
| Sortino ratio | (annualised return − target/risk-free rate) ÷ downside deviation | excess return | downside deviation | selected history | ratio | Downside target stated; zero downside deviation unavailable. |
| Beta | covariance(asset, benchmark) ÷ variance(benchmark) | covariance | benchmark variance | aligned return dates | coefficient | Only matched observations; zero benchmark variance unavailable. |
| Alpha | asset return − [risk-free + beta × (benchmark return − risk-free)] | realised minus model return | 1 | aligned selected history | % annualised | Benchmark and risk-free assumption stated. |
| R² | squared correlation of aligned asset/benchmark returns | explained variance | total variance | aligned selected history | 0–1 | Insufficient or constant series unavailable. |
| Maximum drawdown | minimum(value ÷ prior peak − 1) | current value | prior running peak | selected history | % | Uses the selected series; no invented prices. |
| Historical VaR | loss quantile of historical periodic returns × position value | selected loss quantile | empirical return sample | named confidence/window | INR or % | Confidence, horizon and historical method stated; not a maximum loss. |
| XIRR | rate solving Σ cash flow/(1+r)^(days/365)=0 | dated cash flows | elapsed day fractions | all entered dates | % annualised | Requires a sign change and convergent solution; otherwise unavailable. |
| Calculator profit/loss | proceeds − cost | sale proceeds | cost (for %: cost) | entered transaction | INR and % | Fees included only when the calculator explicitly accepts them. |

## F&O — priority audit

Destination for every row: `https://marketdeck.in/futures-and-options/methodology/` plus the relevant output page. Gap status: **closed**; product-specific risk/backtest disclosures remain in place.

| Name | Formula | N | D | Period/window | Units | Assumptions / remaining gap |
|---|---|---|---|---|---|---|
| Black–Scholes–Merton price | discounted risk-neutral call/put formula using S,K,T,r,q,σ | model terms | normal-distribution terms | time to expiry | currency/option unit | European-style model; continuous r/q and stated time basis. |
| Implied volatility | σ solving model price = observed option price | price residual | model vega/root iteration | observation to expiry | % annualised | Search bracket 0.1%–500%; no root is unavailable. |
| Delta | ∂option price/∂spot | price sensitivity | one underlying point | instant/model expiry | currency per spot unit | Model-based. |
| Gamma | ∂delta/∂spot | delta sensitivity | one spot unit | instant/model expiry | per spot unit² | Model-based. |
| Vega | price change per one percentage-point IV move | price sensitivity | 1 IV point | instant/model expiry | currency per IV point | UI convention is one percentage point, not 100%. |
| Theta | model price change per day | price sensitivity | 365-day year | instant/model expiry | currency/day | Calendar-day convention. |
| Rho | price change per one percentage-point rate move | price sensitivity | 1 rate point | instant/model expiry | currency per rate point | Model-based. |
| Intrinsic value | call max(S−K,0); put max(K−S,0) | in-the-money amount | 1 | current/expiry spot | currency/unit | Uses named spot and strike. |
| Time value | premium − intrinsic value | residual premium | 1 | observation | currency/unit | Negative artefacts rejected/limited by input validation. |
| IV rank | (current IV − lookback min) ÷ (max − min) × 100 | distance from min | lookback range | named IV-history window | 0–100 | Zero range unavailable. |
| IV percentile | observations below current IV ÷ valid observations × 100 | lower observations | valid history count | named IV-history window | 0–100 | Tie convention documented on destination. |
| Put-call ratio | total put OI (or volume) ÷ total call OI (or volume) | put OI/volume | call OI/volume | selected expiry/snapshot | ratio | OI and volume variants not mixed; zero denominator unavailable. |
| Max pain | strike minimizing aggregate option-holder intrinsic payout | aggregate payout by strike | eligible strikes/OI | selected expiry/snapshot | strike currency | Deterministic tie handling; descriptive only. |
| Net premium | Σ signed leg premium × quantity/lot multiplier | credits minus debits | 1 | strategy entry | currency | Buy/sell sign convention stated. |
| Expiry payoff | Σ leg intrinsic payoff + net premium | leg payoff sum | 1 | expiry underlying grid | currency | Expiry-only unless page states interim valuation. |
| Breakeven | root(s) where expiry payoff = 0 | zero-payoff crossing | underlying price | expiry | strike currency | Grid/root result; may be multiple or unavailable. |
| Maximum profit/loss | extrema of expiry payoff, or labelled unlimited | payoff extrema | 1 | expiry | currency/unlimited | Unlimited is never replaced by a finite cap. |
| Probability of profit | risk-neutral lognormal probability payoff > 0 | profitable terminal distribution mass | total distribution mass | to expiry | % | Model probability, not empirical win rate or forecast. |
| Risk/reward | maximum profit ÷ maximum loss (or reciprocal as labelled) | named reward | named risk | expiry | ratio | Requires finite positive denominator. |
| Backtest P&L | realised exit value − actual traded entry cost/credit | exit minus entry | 1 | stated entry/exit rules | currency | Uses tradable observations; gaps not filled. |
| Return on cost | P&L ÷ debit entry cost × 100 | P&L | positive debit cost | trade horizon | % | Not emitted for credits or zero cost. |
| Seasonality daily return | close/current ÷ prior close − 1 | close change | prior close | daily | % | Stored historical closes only. |
| Compounded monthly return | Π(1 + daily return) − 1 | compounded path | 1 | calendar month | % | Partial months labelled by data coverage. |
| Average daily volume/OI | Σ daily contracts/lots ÷ valid days | total volume/OI | valid observation days | named trailing window | lots/contracts | Denominator excludes missing days and is shown. |

## Charting audit

Destination: `https://marketdeck.in/charts/methodology/`. Gap status: **closed**.

| Name | Formula | N | D | Window | Units | Assumptions / gap |
|---|---|---|---|---|---|---|
| Price return | (current close ÷ comparison close − 1) × 100 | close change | comparison close | named lookback | % | Price series selected by page. |
| SMA | Σ closes ÷ n | close sum | n valid closes | named n | price | Full window required. |
| EMA | SMA seed, then αx +(1−α)prior; α=2/(n+1) | weighted close | weights | named n | price | SMA seed. |
| RSI | 100−100/(1+Wilder avg gain/Wilder avg loss) | avg gain | avg loss | 14 | 0–100 | Flat valid window = 50. |
| MACD | EMA12−EMA26; signal EMA9; histogram difference | EMA differences | 1 | 12/26/9 | price | SMA-seeded EMAs. |
| Bollinger Bands | SMA20 ± 2×population SD20 | distance from mean | 20 closes | 20 | price | Population SD (`ddof=0`). |
| True range / ATR | max(H−L,|H−prev C|,|L−prev C|); Wilder mean | range | 14 smoothing | 14 | price | Prior close required after first bar. |
| +DI/−DI/ADX | directional movement/ATR; Wilder mean of 100×|+DI−−DI|/(+DI+−DI) | directional differences | ATR / DI sum | 14 | %/index | Zero denominators unavailable. |
| Stochastic | 100×(C−lowest L)/(highest H−lowest L), smooth 3/3 | close location | 14-bar range | 14,3,3 | 0–100 | Flat valid range = 50. |
| Supertrend | midpoint ± 3×ATR10 with recursive band/trend rules | midpoint/range | 1 | 10, multiplier 3 | price | Standard carried bands. |
| Anchored VWAP | Σ(typical price×volume) ÷ Σvolume from anchor | price-volume | volume | selected anchor onward | price | No silent daily reset. |
| CCI | (typical−SMA20)/(0.015×mean absolute deviation) | typical-price distance | scaled MAD | 20 | index | Zero valid deviation = 0. |
| Williams %R | −100×(highest H−C)/(highest H−lowest L) | close-to-high gap | range | named/standard | −100–0 | Flat range unavailable. |
| Aroon | 100×(25−bars since extreme)/25 | recency | 25 | 25 + current bar | 0–100 | Most recent extreme convention. |
| OBV | cumulative +volume/−volume/0 by close direction | signed volume | 1 | history | source volume | Flat close adds zero. |
| Parabolic SAR | recursive SAR with acceleration factor | prior SAR/extreme point | 1 | 0.02 step, 0.20 cap | price | Trend/reversal state required. |
| Ichimoku | 9/26/52 high-low midpoints, 26 displacement | range midpoints | 2 | 9/26/52 | price | Chikou excluded from look-ahead-sensitive scans. |
| Pivot points | P=(prior H+L+C)/3; standard S/R levels | prior OHLC combinations | 3 | prior bar | price | Floor-trader convention. |
| Mansfield RS | [(stock/benchmark)/(SMA200 of ratio)−1]×100 | relative ratio | ratio SMA200 | 200 matched sessions | % | Only matched dates. |
| Breadth participation | qualifying instruments ÷ eligible measured universe ×100 | qualifying count | eligible count | observation/date and indicator window | % | Denominator excludes insufficient-history names. |
| Scan forward return | (future close ÷ signal close−1)×100 | future change | signal close | named forward horizon | % | Completed observations only; overlaps disclosed. |
| Scan win rate/coverage | positive completed outcomes ÷ completed; completed ÷ eligible signals | positive/completed | completed/eligible | named test span | % | Overlaps not independent. |

## Crypto World audit

Destination: `https://marketdeck.in/crypto/methodology/`. Gap status: **closed**; tax-year, market-data and vendor disclosures remain product-specific.

| Name | Formula | N | D | Window | Units | Assumptions / gap |
|---|---|---|---|---|---|---|
| Price return / ATH drawdown | (latest ÷ comparison or ATH −1)×100 | price change | comparison/ATH | named / since source ATH | % | Source dates visible. |
| Market cap / FDV | price×circulating supply / price×total or max supply | price×supply | 1 | snapshot | source currency | No inferred supply. |
| FDV/market cap | FDV ÷ market cap | FDV | market cap | snapshot | multiple | Positive denominator required. |
| Price-to-fees / sales | market cap ÷ annualised fees/revenue | market cap | source annualised value | trailing annualised source field | multiple | Confirmed zero distinct from missing, but finite ratio unavailable at zero. |
| India premium | [Indian INR price/(global USD price×USD/INR)−1]×100 | venue price | implied global INR price | input timestamps | % | Plausibility bounds reject mismatches. |
| Premium cost | spend×premium/(1+premium); spend×visible fee/spread/TDS rates | each cost component | spend for % | user scenario | INR and % | Components not compounded; TDS separately creditable. |
| Exit VWAP / impact / coverage | filled value/quantity; (best bid−VWAP)/best bid; filled/requested | filled value/gap | quantity/best bid/requested | recorded order-book snapshot | INR, %, % | No extrapolation beyond visible depth. |
| Funding annualisation / amount | rate×settlements/day×365; notional×|annual rate| | rate / annual amount | schedule / notional | current recorded settlement basis | % annualised, INR | Sign labels cost vs credit. |
| Implied move | ATM IV×√years; spot×fraction | IV/time / move | 1 | to expiry | %, USD/INR | Vendor IV retained, not re-estimated. |
| Put-call OI ratio / max pain | put OI/call OI; strike minimizing aggregate payout | put OI / payout | call OI / strike set | expiry snapshot | ratio, strike currency | Zero call OI unavailable; deterministic tie. |
| Daily log return / correlation | ln(Ct/Ct−1); Pearson paired returns | covariance | paired SDs | named rolling window | return, −1..1 | Shared dates only. |
| Realised volatility | sample SD(log returns)×√365 crypto or √252 NIFTY | return dispersion | valid returns | named trailing window | % annualised | Asset's own calendar. |
| Disposal income / taxable total | consideration−matched acquisition cost; sum positive rows | consideration residual / positive gains | matched cost / 1 | financial year | INR | Explicit FIFO/weighted/specific ID; losses separately visible. |
| VDA tax and cess | positive taxable total×30%; tax×4%; statutory rupee rounding | taxable income / tax | 1 | financial year | INR | Surcharge not computed; regime tied to year. |
| DCA average / gain | total cost/quantity; exit value−pooled cost | cost / exit residual | quantity / 1 | entered instalments | INR per unit, INR | Exit calculations absent without exit input. |
| Loss-offset gap | taxable positive income−net economic result | difference | 1 | financial year | INR | Not a tax rate. |
| Portfolio value / tax drag | quantity×price; positive unrealised gain×displayed tax/cess | value/gain | 1 | snapshot/user input | INR | Illustration assumptions visible. |
| DeFi TVL aggregate | sum eligible recorded TVL | TVL sum | 1 | observation snapshot | USD | Missing protocols not filled. |

## Intelligence audit

Destination: `https://marketdeck.in/intelligence/methodology/`, linked from articles, hubs and legacy editorial pages. Gap status: **closed** for common calculations; each article still owns its cited inputs and hypothetical labels.

| Name | Formula | N | D | Window | Units | Assumptions / gap |
|---|---|---|---|---|---|---|
| Simple return / CAGR / drawdown | standard ending/beginning, annualised growth and current/peak formulas | change/growth | beginning, years, peak | dates stated in article | %, % annualised | Price vs total return named. |
| Margin / ROE / ROCE | named profit/revenue; PAT/avg equity; adjusted EBIT/avg capital employed | named profit | named base | comparable reporting periods | % | Standalone/consolidated and adjustments stated. |
| Debt/equity / cash conversion | debt/equity; named cash flow/named profit | debt/cash flow | equity/profit | comparable periods | multiple/% | Units and scope matched. |
| P/E / earnings yield / EV-EBITDA | price/EPS; EPS/price×100; EV/EBITDA | named valuation numerator | earnings/price/EBITDA | source date/period | multiple/% | Cyclical or negative denominator caveats stay article-specific. |
| Option intrinsic/time/payoff | standard call/put intrinsic; premium residual; signed leg payoff | intrinsic/payoff | 1 | observation/expiry example | currency | Hypothetical vs observed inputs labelled. |
| IV rank / percentile | distance in range; lower observations/valid observations | distance/lower count | range/valid count | named lookback | 0–100 | Tie convention and zero-range rule stated. |
| India premium / DCA / portfolio weight | venue/implied global; total cost/quantity; position/eligible total | venue price/cost/position | implied price/quantity/portfolio | stated example | %, currency/unit, % | Hypothetical inputs labelled. |
| Correlation / volatility | Pearson named paired returns; return SD×stated annualiser | covariance/dispersion | paired SDs/observations | named window | −1..1 / % annualised | Return definition and annualisation stated. |

## Gap closure evidence

- Before SG-04B/SG-04D, product calculations were primarily documented in code, local docs or scattered page copy; no stable product-level destination covered denominator, units, state, rounding and unavailable treatment consistently.
- The five destinations above close that navigation and vocabulary gap while retaining product disclosures.
- No source, analyst identity, credential, review board or authority signal was introduced.
- No methodology version identifier was introduced; formal versioning/change-history remains SG-04I.
- Robots, sitemap ownership, Atom and IndexNow behavior are outside these product calculation changes. Intelligence adds one ordinary canonical URL through the existing sitemap builder; it does not alter sitemap architecture.
