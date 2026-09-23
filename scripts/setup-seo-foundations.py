"""One-time, idempotent integration of reviewed article sources. No network or deployment."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
DAY='2026-09-23'
B='/intelligence/notes/'
P='/assets/products/editorial-v2/'
S={
 'sec':('SEC: Beginners’ Guide to Financial Statements','https://www.sec.gov/about/reports-publications/investorpubsbegfinstmtguide','Educational statement framework; not Indian law.'),
 'ias':('IFRS Foundation: IAS 7 Statement of Cash Flows','https://www.ifrs.org/issued-standards/list-of-standards/ias-7-statement-of-cash-flows/','Operating, investing and financing framework; local reporting rules must be checked.'),
 'ann':('NSE: Corporate Announcements','https://www.nseindia.com/companies-listing/corporate-filings-announcements','Official issuer-disclosure discovery resource.'),
 'results':('NSE: Financial Results','https://www.nseindia.com/companies-listing/corporate-filings-financial-results','Official financial-results discovery resource.'),
 'actions':('NSE: Corporate Actions','https://www.nseindia.com/companies-listing/corporate-filings-actions','Corporate-action discovery; no live figures reproduced.'),
 'div':('TradingView: How to adjust data for dividends','https://in.tradingview.com/support/solutions/43000590597-how-to-adjust-data-for-dividends/','Provider documentation for dividend-adjustment interpretation.'),
 'scale':('TradingView: PriceScaleMode','https://www.tradingview.com/charting-library-docs/latest/api/enums/Charting_Library.PriceScaleMode/','Provider documentation distinguishing price-scale modes.'),
 'schwab':('Charles Schwab: Use Support and Resistance to Read Stock Charts','https://www.schwab.com/learn/story/use-support-and-resistance-to-read-stock-charts','Educational chart concepts, not proof that a level will hold.'),
 'spec':('NSE: Equity Derivatives Contract Specifications','https://www.nseindia.com/static/products-services/equity-derivatives-contract-specifications','Check current contract details; no expiry weekday or lot size assumed.'),
 'iv':('tastylive: Implied Volatility Rank and Percentile','https://www.tastylive.com/concepts-strategies/implied-volatility-rank-percentile','Metric definitions; no automatic trade recommendations adopted.'),
 'chain':('NSE: Option Chain','https://www.nseindia.com/option-chain','Official reference surface; no historical reconstruction or live quote claim.'),
 'sebi':('SEBI: Corporate Filings Resource Directory','https://www.sebi.gov.in/curation/corporate_filings.html','Directory of exchange filing resources, not current legal advice.'),
 'dissemination':('NSE: Corporate Filings','https://www.nseindia.com/companies-listing/corporate-filings-application','Exchange dissemination disclaimer and filing categories.'),
 'infyC':('NSE-hosted Infosys consolidated integrated filing, 23 April 2026','https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_152465_23042026210154_iXBRL_WEB.html','Header fields only used as a real example; not a stock recommendation.'),
 'infyS':('NSE-hosted Infosys standalone integrated filing, 23 April 2026','https://nsearchives.nseindia.com/corporate/ixbrl/INTEGRATED_FILING_INDAS_152466_23042026210204_iXBRL_WEB.html','Separate reporting scope; no investment opinion or actual amount comparison.'),
 'defi':('DefiLlama: Data Definitions','https://enterprise.defillama.com/data-definitions','Provider definitions of fees, revenue, holders revenue and TVL. Search-rendered public definition text reviewed; direct page extraction was unavailable.'),
 'eth':('Ethereum: Gas and Fees Technical Overview','https://ethereum.org/developers/docs/gas/','Base-fee burn and priority-fee distinction, not a token return forecast.'),
 'cap':('CoinGecko: What Is Market Cap in Crypto?','https://www.coingecko.com/learn/what-is-market-cap-in-crypto','Supply and valuation conventions; no current prices or cap figures reused.'),
 'tt':('Token Terminal: Metrics Documentation','https://tokenterminal.com/docs/explorer/metrics','General and project-specific definitions; not audited corporate accounting.'),
 'agents':('TradingAgents: Multi-Agents LLM Financial Trading Framework','https://arxiv.org/abs/2412.20138','Authors’ architecture and abstract-level claims, version 7, 3 June 2025. No independent replication claimed.'),
 'trader':('AI-Trader: Benchmarking Autonomous Agents in Real-Time Financial Markets','https://arxiv.org/abs/2512.10971','Authors’ benchmark description and abstract-level findings, 1 December 2025. No NSE alpha or real-capital performance inferred.'),
 'herc':('Herculean: An Agentic Benchmark for Financial Intelligence','https://arxiv.org/abs/2605.14355','Authors’ workflow and reliability findings, version 3, 29 May 2026. Abstract reviewed, not an independent reproduction.')
}
rows=[
 ('business-before-the-stock','How to Screen Indian Stocks: ROCE, Cash Flow & Valuation','How to screen Indian stocks without mistaking a ratio for research.','Build an Indian stock shortlist using comparable financials, ROCE, cash conversion and valuation. Includes worked examples and a source-checking process.', ['equities','india'], 'stockproof', ['sec','ias','ann','results'], ['read-nse-company-announcements-results','five-research-lenses','a-chart-is-a-question'], 'How to screen Indian stocks', ['stock screener filters India','ROCE calculation average capital employed','cash flow vs profit Indian stocks'],['Define a comparable universe before choosing filters.','Inspect the denominator and cash-flow bridge.','A shortlist is a starting point, not a recommendation.']),
 ('a-chart-is-a-question','How to Read Stock Charts: Timeframes, Scales & Returns','A chart is the start of a better question.','Learn to read stock charts with the right timeframe, scale and adjustments. Worked examples explain dividends, drawdowns and misleading comparisons.', ['markets','research-craft'], 'charting',['div','scale','actions','schwab'],['read-nse-company-announcements-results','business-before-the-stock','five-research-lenses'],'how to read stock charts',['linear vs logarithmic stock chart','adjusted stock price dividends','drawdown recovery percentage'],['Record the settings before interpreting the shape.','A price-only return is not a total return.','Separate observation, sequence and proposed cause.']),
 ('five-research-lenses','Stock Research Checklist India: A Five-Lens Evidence Guide','Five lenses. One evidence-led research memo.','Use a five-lens stock research checklist for Indian markets. Connect business, valuation, charts and commentary while keeping sources and uncertainty clear.', ['research-craft','india'], 'stockproof',['ann','results','sec'],['business-before-the-stock','read-nse-company-announcements-results','evaluate-ai-trading-agents'],'stock research checklist India',['equity research memo template','verify stock market commentary','stock research evidence checklist'],['Start with one question and a dated source register.','Repeated commentary is not independent confirmation.','Write what could change your interpretation.']),
 ('iv-rank-vs-iv-percentile-nifty-options','IV Rank vs IV Percentile: A NIFTY Options Research Guide','IV rank and percentile are not the same question.','Compare IV rank and IV percentile for NIFTY options research. See an outlier example, tie conventions, formulas and checks for a comparable volatility series.', ['fno','markets'], 'fno',['spec','iv','chain'],['a-chart-is-a-question','five-research-lenses','evaluate-ai-trading-agents'],'IV rank vs IV percentile',['IV percentile NIFTY options','IV rank outlier example','implied volatility historical percentile formula'],['Rank describes the range; percentile describes observations.','One extreme can separate the two readings sharply.','Neither number is a probability of profit.']),
 ('read-nse-company-announcements-results','How to Read NSE Announcements and Financial Results','Read the filing. Not just the headline.','A practical guide to NSE company announcements and results. Check timestamps, lakhs versus crores, reporting periods, consolidated scope and source documents.', ['india','equities'], 'commentary',['ann','results','sebi','dissemination','infyC','infyS'],['business-before-the-stock','five-research-lenses','a-chart-is-a-question'],'how to read NSE financial results',['NSE company announcements','standalone vs consolidated results','lakhs to crores financial statements'],['Separate reporting period, publication and retrieval time.','Read units and reporting scope before comparing numbers.','Preserve the document behind every important claim.']),
 ('crypto-fundamentals-fees-revenue-token-value','Crypto Fees vs Revenue: A Token Fundamentals Guide','A busy protocol is not automatically a valuable token.','Understand crypto fees, protocol revenue and token value capture. Worked examples cover FDV, supply, TVL and an India-aware research checklist.', ['crypto','research-craft'], 'crypto',['defi','eth','cap','tt'],['five-research-lenses','business-before-the-stock','evaluate-ai-trading-agents'],'crypto fees vs revenue',['protocol revenue vs tokenholder revenue','crypto FDV vs market cap','TVL price effect example'],['Track the flow from user payment to tokenholder mechanism.','Define the supply and revenue denominator.','Protocol activity does not guarantee token returns.']),
 ('evaluate-ai-trading-agents','How to Evaluate AI Trading Agents: Evidence, Bias & Risk','Judge the experiment before the return chart.','Evaluate AI trading agents with checks for leakage, baselines, costs and operational failures. A source-linked framework for India-focused research.', ['ai-quant','research-craft'], 'commentary',['agents','trader','herc'],['five-research-lenses','read-nse-company-announcements-results','iv-rank-vs-iv-percentile-nifty-options'],'evaluate AI trading agents',['AI trading agent benchmark','LLM trading backtest leakage','AI trading agents India research'],['Evaluate the whole workflow, not the explanation alone.','Keep historical inputs inside the information boundary.','Paper results, real capital and dependable operation differ.'])
]
meta=[]
for slug,title,h1,desc,topics,art,keys,related,kw,tails,takeaways in rows:
 entry=dict(slug=slug,title=title,h1=h1,description=desc,topics=topics,coverArt=P+art+'.webp',source=f'content/articles/{slug}.md',modifiedAt=DAY,sourceReviewedAt=DAY,primaryKeyword=kw,relatedKeywords=tails,related=related,takeaways=takeaways,publicationStatus='published',approvedAt=DAY)
 if slug not in ('business-before-the-stock','a-chart-is-a-question','five-research-lenses'):entry['publishedAt']=DAY
 entry['sources']=[dict(id=f'S{i+1}',title=S[k][0],url=S[k][1],scope=S[k][2],reviewedAt=DAY) for i,k in enumerate(keys)]
 meta.append(entry)
(ROOT/'content/articles/metadata.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
p=ROOT/'content/briefs.json';m=json.loads(p.read_text());m['notes']=[{k:a[k] for k in ('slug','topics','coverArt','source','publicationStatus','approvedAt')} for a in meta];p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
p=ROOT/'scripts/editorial.mjs';s=p.read_text()
if "from './articles.mjs'" not in s:
 s="import {buildArticles} from './articles.mjs';\n"+s
 old='  const collection=catalog(manifest,notes);'
 if old not in s:raise RuntimeError('Editorial integration anchor changed')
 new="  const expanded=buildArticles({root,review,baseNotes:notes});\n  notes.splice(0,notes.length,...expanded);\n  for(const n of notes)if(!urls.includes(n.path))urls.push(n.path);\n  urls.push('/intelligence/editorial-policy/');\n"+old
 s=s.replace(old,new)
 p.write_text(s)
# Replace hardcoded production counts with manifest-derived published counts.
p=ROOT/'tests/intelligence.test.mjs';s=p.read_text()
if 'const publicCount=' not in s:
 s=s.replace("const manifest=JSON.parse(readFileSync('content/briefs.json'));","const manifest=JSON.parse(readFileSync('content/briefs.json'));\nconst publicCount=manifest.issues.filter(i=>i.publicationStatus==='published'&&i.approvedAt).length+manifest.notes.filter(n=>n.publicationStatus==='published'&&n.approvedAt).length;")
 s=s.replace(".length,4);", ".length,Math.min(8,publicCount));",1)
 s=s.replace(".length,4);", ".length,publicCount);",1)
 s=s.replace("path==='intelligence/'?4:1", "path==='intelligence/'?publicCount:1")
p.write_text(s)
p=ROOT/'tests/homepage.test.mjs';s=p.read_text()
s=s.replace("assert.equal(new Set(hrefs.filter(h=>h.startsWith('/intelligence/notes/'))).size,3);","assert.equal(new Set(hrefs.filter(h=>h.startsWith('/intelligence/notes/'))).size,JSON.parse(readFileSync('content/briefs.json')).notes.filter(n=>n.publicationStatus==='published'&&n.approvedAt).length);")
p.write_text(s)
print(f'Prepared {len(meta)} sourced articles; existing magazine unchanged.')
