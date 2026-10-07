// "Explore MarketDeck": one crawlable page linking every key public page,
// so search engines reach each one within two clicks of the homepage.
// Every path here must be a live, indexable, self-canonical page (see
// tests/explore.test.mjs and public/priority-sitemap.xml).
import {readFileSync} from 'node:fs';

const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const BOOKS=[
  ['intelligent-investor','The Intelligent Investor'],['one-up','One Up on Wall Street'],['psychology-money','The Psychology of Money'],
  ['most-important','The Most Important Thing'],['buffett-essays','The Essays of Warren Buffett'],['uncommon-profits','Common Stocks and Uncommon Profits'],
  ['random-walk','A Random Walk Down Wall Street'],['common-sense','The Little Book of Common Sense Investing'],['mutual-funds','Common Sense on Mutual Funds'],
  ['little-valuation','The Little Book of Valuation'],['investment-valuation','Investment Valuation'],['narrative-numbers','Narrative and Numbers'],
  ['builds-wealth','The Little Book That Builds Wealth'],['still-beats-market','The Little Book That Still Beats the Market'],['beating-street','Beating the Street'],
  ['laws-wealth','The Laws of Wealth'],['behavioral-investor','The Behavioral Investor'],['behavioral-little','The Little Book of Behavioral Investing'],
  ['thinking','Thinking, Fast and Slow'],['fooled','Fooled by Randomness'],['black-swan','The Black Swan'],['antifragile','Antifragile'],
  ['superforecasting','Superforecasting'],['expected-returns','Expected Returns'],['safe-money','The Little Book of Safe Money'],
].map(([slug,title])=>[`/screener/learning/books/${slug}/`,title]);

const PRESETS=[
  ['piotroski','Piotroski F-Score'],['magic_formula','Magic Formula'],['coffee_can','Coffee Can'],['graham','Graham: Low on Average Earnings'],
  ['value_stocks','Value Stocks'],['growth_roe_low_pe','High Growth, High ROE, Low P/E'],['blue_chip','Bluest of the Blue Chips'],
  ['quarterly_growers','Quarterly Growers'],['growth_without_dilution','Growth Without Dilution'],['turnaround','Loss-to-Profit Turnaround'],
  ['debt_reduction','Debt Reduction Trend'],['capacity_expansion','Capacity Expansion'],['dividend_yield','Highest Dividend Yield'],
  ['fcf_book_value','FCF Yield & Book Value'],['beneish_index_thresholds','Beneish Index Thresholds'],['week52_high','52-Week High Proximity'],
  ['week52_low','52-Week Low Proximity'],['golden_cross','Golden Crossover'],['death_cross','Bearish Crossover'],['darvas_breakout','Darvas Box Breakout'],
  ['macd_bullish_crossover','MACD Bullish Crossover'],['macd_bearish_crossover','MACD Bearish Crossover'],['rsi_14','RSI (14-day)'],
  ['stochastic_oscillator','Stochastic Oscillator (14,3)'],['adx_trend_strength','ADX Trend Strength (14-day)'],['atr_volatility','ATR Volatility (14-day)'],
  ['bollinger_bands','Bollinger Bands (20,2)'],['mfi_14','Money Flow Index (14-day)'],['delivery_percentage','Delivery Percentage'],
].map(([key,label])=>[`/screener/screener/?screen=${key}`,`${label} screen`]);

function notes(){
  const meta=JSON.parse(readFileSync(new URL('../content/articles/metadata.json',import.meta.url),'utf8'));
  return meta.filter(a=>a.publicationStatus==='published'&&a.approvedAt).map(a=>[`/intelligence/notes/${a.slug}/`,a.title]);
}

export function exploreGroups(){
  return [
    ['Start here',[
      ['/','MarketDeck home'],['/intelligence/','MarketDeck Intelligence'],['/screener/','Screener'],['/screener/portfolio-analysis/','Portfolio Analysis'],
      ['/screener/research-terminal/','Research Terminal'],['/research-standards/','Research standards'],['/credits/','Asset credits'],
    ]],
    ['Investing guides',[
      ['/intelligence/library/','Research library'],['/intelligence/equities/','Equities learning hub'],['/intelligence/futures-options/','Futures & options learning hub'],
      ['/intelligence/technical-analysis/','Technical analysis learning hub'],['/intelligence/portfolio-analysis/','Portfolio analysis learning hub'],
      ...notes(),
    ]],
    ['Magazine',[
      ['/intelligence/issues/','Magazine archive'],['/intelligence/issues/ai-in-indian-finance-2026/','AI in Indian Finance 2026'],
      ['/intelligence/issues/agentic-trading-frontier-2026/','The Agentic Trading Frontier 2026'],['/intelligence/issues/investing-research-workbook/','Investing research workbook'],
      ['/intelligence/methodology/','Calculation methodology'],['/intelligence/editorial-policy/','Editorial policy'],
    ]],
    ['Investing bookshelf',[
      ['/screener/learning/','Learning hub'],['/screener/learning/books/','All investing books'],...BOOKS,
      ['/screener/learning/paths/beginner-investing-books/','Beginner investing books'],['/screener/learning/paths/value-investing-books/','Value investing books'],
      ['/screener/learning/paths/valuation-books/','Valuation books'],['/screener/learning/compare/graham-vs-housel/','Graham vs Housel'],
      ['/screener/learning/compare/lynch-vs-graham/','Lynch vs Graham'],['/screener/learning/compare/damodaran-valuation-books/','Damodaran valuation books compared'],
      ['/screener/learning/methods/magic-formula/','Magic formula method'],['/screener/learning/methods/margin-of-safety/','Margin of safety'],
      ['/screener/learning/methods/economic-moats/','Economic moats'],['/screener/learning/methods/peter-lynch-stock-categories/','Peter Lynch stock categories'],
      ['/screener/learning/methods/index-investing-costs/','Index investing costs'],['/screener/learning/methods/valuation-story-to-numbers/','Valuation: story to numbers'],
    ]],
    ['Stocks and sectors',[
      ['/screener/companies/','All Indian companies'],['/screener/compare/','Compare companies'],['/screener/sectors/','Sector research'],
      ['/screener/sectors/financial-services/','Financial services sector'],['/screener/sectors/information-technology/','Information technology sector'],
      ['/screener/sectors/healthcare/','Healthcare sector'],['/screener/sectors/capital-goods/','Capital goods sector'],
      ['/screener/sectors/automobile-and-auto-components/','Automobile sector'],['/screener/market-breadth/','Market breadth'],
      ['/screener/sector-rotation/','Sector rotation'],['/screener/ipo-calendar/','IPO calendar'],['/screener/sast-filings/','SAST filings'],
      ['/screener/calculators/','Financial calculators'],['/screener/methodology/','Screener methodology'],
    ]],
    ['Stock screens',[['/screener/screener/','Stock screener'],...PRESETS]],
    ['Mutual funds and ETFs',[
      ['/screener/funds/','All mutual funds'],['/screener/etfs/','All ETFs'],['/screener/funds/categories/','Fund categories'],
      ['/screener/funds/categories/large-cap/','Large cap funds'],['/screener/funds/categories/mid-cap/','Mid cap funds'],
      ['/screener/funds/categories/small-cap/','Small cap funds'],['/screener/funds/categories/flexi-cap/','Flexi cap funds'],
    ]],
    ['Charts, F&O and commentary',[
      ['/charts/','Charting'],['/futures-and-options/','F&O analytics'],['/futures-and-options/analytics/chain/','Option chain'],
      ['/futures-and-options/analytics/chain/NIFTY/','NIFTY option chain'],['/futures-and-options/analytics/chain/BANKNIFTY/','BANKNIFTY option chain'],
      ['/futures-and-options/analytics/historical-chain/','Historical option chain'],['/futures-and-options/analytics/strategy/build/','Options strategy builder'],
      ['/futures-and-options/analytics/calculator/','Options calculator'],['/futures-and-options/analytics/backtest/','Options backtest'],
      ['/futures-and-options/analytics/liquidity/','Options liquidity'],['/futures-and-options/analytics/seasonality/','F&O seasonality'],
      ['/futures-and-options/methodology/','F&O methodology'],['/commentary/','Market commentary'],
      ['/commentary/citations/market/','Market commentary citations'],['/commentary/citations/coverage/','Commentary coverage'],
    ]],
    ['Crypto',[
      ['/crypto/','Crypto World'],['/crypto/markets/','Crypto markets'],['/crypto/fundamentals/','Crypto fundamentals'],['/crypto/news/','Crypto news'],
      ['/crypto/defi/','DeFi'],['/crypto/compare/','Compare coins'],['/crypto/correlation/','Crypto correlation'],['/crypto/positioning/','Crypto positioning'],
      ['/crypto/options/','Crypto options'],['/crypto/premium/','INR premium'],['/crypto/premium/cost/','Premium cost'],['/crypto/portfolio/','Crypto portfolio'],
      ['/crypto/exit-cost/','Exit cost'],['/crypto/crypto-tax-calculator/','Crypto tax calculator'],['/crypto/crypto-profit-loss-calculator/','Crypto profit and loss calculator'],
      ['/crypto/crypto-derivatives-tax/','Crypto derivatives tax'],['/crypto/crypto-loss-offset/','Crypto loss offset'],['/crypto/crypto-sip-calculator/','Crypto SIP calculator'],
      ['/crypto/crypto-to-inr/','Crypto to INR'],['/crypto/schedule-vda/','Schedule VDA'],['/crypto/ais-reconciliation/','AIS reconciliation'],
      ['/crypto/methodology/','Crypto methodology'],
    ]],
  ];
}

export function exploreBody(){
  const groups=exploreGroups().map(([title,links])=>`<h2>${esc(title)}</h2><ul class="explore-links">${links.map(([href,label])=>`<li><a href="${esc(href)}">${esc(label)}</a></li>`).join('')}</ul>`).join('');
  return `<p class="eyebrow">MARKETDECK / EXPLORE</p><h1>Explore MarketDeck.</h1><p class="reading-lead">Every MarketDeck research guide, tool, screen, bookshelf title and data directory in one place.</p><article class="reading-body">${groups}</article>`;
}
