// Lens is a curated site guide. Keep answers tied to public product pages;
// never synthesize prices, company facts, calculations or recommendations.
const link = (label, href, detail) => ({ label, href, detail });
const standards = link('Research standards', '/research-standards/', 'Sources, dates and limitations');
const screener = link('Open Screener', '/screener/', 'Company fundamentals and financial research');
const charting = link('Open Charting', '/charts/', 'Price history and technical context');
const portfolio = link('Portfolio Analysis', '/screener/portfolio-analysis/', 'Explore eight research lenses');
const products = [screener, charting,
  link('Futures & Options', '/futures-and-options/', 'Derivatives research and options analytics'),
  link('Market Commentary', '/commentary/', 'Source-attributed market conversation'),
  link('Crypto World', '/crypto/', 'Digital asset research with an India-aware view')];

export const faqs = [
  { id: 'start', category: 'Getting started', question: 'Where should I start?', aliases: ['getting started', 'beginner', 'new here', 'help me', 'how to use marketdeck'], answer: 'Begin with a question. Use Screener to understand a business, Charting for price history, or Portfolio Analysis to study holdings. Each lens adds a different kind of context.', links: [screener, charting, portfolio], suggestions: ['Research a company', 'Find the right tool'] },
  { id: 'suite', category: 'Tools', question: 'Which tool should I use?', aliases: ['find the right tool', 'products', 'product suite', 'tools', 'what is marketdeck', 'features'], answer: 'Five focused products, one research process. Choose the lens that fits your question: business fundamentals, price history, derivatives, market commentary or digital assets.', links: products, suggestions: ['Portfolio analysis', 'Where should I start?'] },
  { id: 'company', category: 'Getting started', question: 'How do I research a company?', aliases: ['research a company', 'find a company', 'company search', 'stock research'], answer: 'Type a company name or NSE ticker, such as TCS or Infosys. I can take you to company research and its chart. Company search shows matches when a name is ambiguous.', links: [link('Browse companies', '/screener/companies/', 'Search the company directory')], suggestions: ['Where can I research TCS?', 'Find Infosys'], awaitingCompany: true },
  { id: 'sources', category: 'Data & methods', question: 'Where does the data come from?', aliases: ['data sources', 'sources', 'filings', 'nse data', 'financial data', 'where is data from'], answer: 'Check the source and reporting period beside the figure you use. Company research uses filing evidence; charts use stored market history. Other products identify their own providers and data states. The methodology pages explain how results are calculated.', links: [standards, link('Screener methodology', '/screener/methodology/', 'Definitions and calculation rules'), link('Charting methodology', '/charts/methodology/', 'Indicators, breadth and evaluation')] },
  { id: 'freshness', category: 'Data & methods', question: 'Is the data live or stored?', aliases: ['real time', 'realtime', 'live data', 'stored data', 'freshness', 'updated', 'stale', 'delay', 'latest prices'], answer: 'Freshness varies by product and source. Read the observation time and labels such as live, stored, snapshot or historical. Stored data is not automatically current, and a page publication date is not a market-data timestamp.', links: [standards], suggestions: ['Where does the data come from?'] },
  { id: 'calculations', category: 'Data & methods', question: 'How are the metrics calculated?', aliases: ['formula', 'calculation', 'methodology', 'ratio definitions', 'how are numbers calculated'], answer: 'Open the methodology for the product you are using. Check the inputs, reporting period, denominator, units and assumptions before comparing results. Lens can explain a concept; it does not calculate or fetch a company’s figures.', links: [link('Screener methodology', '/screener/methodology/', 'Company metrics'), link('Charting methodology', '/charts/methodology/', 'Technical metrics'), link('F&O methodology', '/futures-and-options/methodology/', 'Options calculations'), link('Intelligence methodology', '/intelligence/methodology/', 'Educational worked examples')] },
  { id: 'portfolio', category: 'Tools', question: 'What can Portfolio Analysis do?', aliases: ['portfolio analysis', 'analyse portfolio', 'analyze portfolio', 'holdings', 'diversification', 'portfolio risk', 'performance'], answer: 'Study performance, volatility, downside risk, return distributions, factor exposures, diversification, historical risk–return trade-offs and implied returns. Data windows, model assumptions and uncertainty remain part of the result.', links: [portfolio, link('Portfolio learning', '/intelligence/notes/efficient-frontier-long-only-unconstrained/', 'Understand historical risk–return trade-offs')] },
  { id: 'charts', category: 'Tools', question: 'Where can I explore charts and indicators?', aliases: ['charting', 'chart', 'technical analysis', 'indicators', 'rsi', 'macd', 'moving averages', 'candles', 'candlestick'], answer: 'Use Charting to explore price history and technical context. Start with the instrument, interval and date range, then add the indicators relevant to your question. Historical patterns are observations, not promises of what happens next.', links: [charting, link('Charting methodology', '/charts/methodology/', 'Indicator definitions and limitations'), link('A chart is a question', '/intelligence/notes/a-chart-is-a-question/', 'A practical research starting point')] },
  { id: 'options', category: 'Tools', question: 'Where are the options research tools?', aliases: ['options', 'derivatives', 'futures', 'f&o', 'option chain', 'open interest', 'greeks', 'oi'], answer: 'Futures & Options is the derivatives lens. Open the product for its available analytics, and keep expiry, observation time and model assumptions in view. The methodology explains the definitions behind the results.', links: [products[2], link('F&O methodology', '/futures-and-options/methodology/', 'Models and assumptions'), link('Calls and puts', '/intelligence/notes/call-option-vs-put-option-india/', 'Learn the basic payoff distinction')] },
  { id: 'commentary', category: 'Tools', question: 'What is Market Commentary?', aliases: ['commentary', 'market news', 'videos', 'narratives', 'market conversation'], answer: 'Commentary adds market conversation and research context. Keep the original source and timestamp close to any interpretation. AI-generated interpretation is labelled separately from source-attributed commentary.', links: [products[3], standards] },
  { id: 'crypto', category: 'Tools', question: 'Where can I research crypto?', aliases: ['crypto', 'bitcoin', 'digital assets', 'crypto world'], answer: 'Crypto World is the digital-assets lens, with an India-aware perspective. Check the provider, observation time and product-specific methodology for the figures you use.', links: [products[4], link('Crypto learning', '/intelligence/notes/crypto-fundamentals-fees-revenue-token-value/', 'Fees, revenue and token value')] },
  { id: 'learn', category: 'Getting started', question: 'Where are the learning guides?', aliases: ['learning', 'learn', 'education', 'guides', 'articles', 'intelligence', 'tutorial'], answer: 'MarketDeck Intelligence has learning notes across the research suite. Start with understanding a business, framing a chart question, or connecting the five research lenses.', links: [link('MarketDeck Intelligence', '/intelligence/', 'Explore the learning library'), link('Business before the stock', '/intelligence/notes/business-before-the-stock/', 'A fundamental research starting point'), link('Five research lenses', '/intelligence/notes/five-research-lenses/', 'Connect the product suite')] },
  { id: 'account', category: 'Account & help', question: 'Where do I sign in?', aliases: ['login', 'log in', 'sign in', 'signup', 'sign up', 'register', 'account', 'saved watchlist'], answer: 'Open the product you want to use and follow its sign-in flow for account features. Lens works without a sign-in and cannot access your account, holdings or saved research.', links: [link('Screener sign in', '/screener/accounts/login/', 'Company research account'), link('Charting sign in', '/charts/accounts/login/', 'Charting account')], suggestions: ['Which tool should I use?'] },
  { id: 'access', category: 'Account & help', question: 'Do I need an account to get started?', aliases: ['free', 'pricing', 'subscription price', 'cost', 'paid', 'subscription', 'need account', 'without login'], answer: 'You can start with the homepage and public research and learning pages. Some product features require sign-in. Check the destination product for its current access requirements; Lens cannot confirm a paid plan or manage subscriptions.', links: [screener, link('Learning library', '/intelligence/', 'Public learning notes')], suggestions: ['Where do I sign in?'] },
  { id: 'password', category: 'Account & help', question: 'How do I get help with my account?', aliases: ['forgot password', 'reset password', 'password', 'locked out', 'cannot login', 'cant login', 'support', 'contact', 'broken', 'not working', 'error', 'bug'], answer: 'Return to the affected product and use its available account or recovery options. Lens cannot reset passwords or create support tickets. For a page error, note the page URL and what happened. Official contact-channel information is shown on the homepage.', links: [link('Screener sign in', '/screener/accounts/login/', 'Account and recovery options'), link('Contact information', '/#contact', 'Current contact-channel information')] },
  { id: 'bots', category: 'Tools', question: 'Where can I use the MarketDeck bots?', aliases: ['bots', 'bot', 'telegram', 'whatsapp', 'discord', 'reddit', 'integrations'], answer: 'The Bots section shows the available channels, what each companion does and its current status. Open a channel from that section to use its own commands and guidance.', links: [link('Explore the companions', '/#bots', 'Telegram, WhatsApp, Discord and channel status')] },
  { id: 'lens', category: 'Account & help', question: 'What can Lens answer?', aliases: ['what can you do', 'what are you', 'ai', 'chatgpt', 'lens', 'can you answer', 'privacy', 'save chats', 'history'], answer: 'I am a curated MarketDeck site guide. I can help with FAQs, research concepts, product links and company search. I do not fetch live market quotes. When you choose Portfolio update, Lens reads your own signed-in Screener portfolio using its existing calculations. Portfolio values clear when you close Lens or leave the tab. This conversation stays in page memory and clears when you reload or start again; opening a product link sends the search to that product.', links: [standards], suggestions: ['Browse FAQs', 'Find the right tool'] },
  { id: 'advice', category: 'Data & methods', question: 'Does MarketDeck give investment advice?', aliases: ['investment advice', 'buy', 'sell', 'hold', 'recommend', 'target price', 'price target', 'prediction', 'predict', 'best stocks', 'multibagger', 'should i invest'], answer: 'MarketDeck provides research and education. Lens does not recommend trades, predict prices or give personalized portfolio advice. You can use company research, chart context and learning notes to investigate your own question.', links: [standards, screener, portfolio] },
  { id: 'metrics', category: 'Data & methods', question: 'Can you explain a research metric?', aliases: ['understand a metric', 'explain a metric', 'metrics', 'financial ratios', 'financial concepts'], answer: 'Choose a concept to get a short explanation and the relevant methodology or learning note. Start with P/E, market cap, return on equity, XIRR or implied volatility.', links: [link('Calculation methodology', '/intelligence/methodology/', 'Worked examples and definitions')], suggestions: ['What is P/E?', 'What is market cap?', 'What is ROE?', 'What is XIRR?', 'What is implied volatility?'] },
  { id: 'pe', category: 'Data & methods', question: 'What is P/E?', aliases: ['p/e', 'pe', 'pe ratio', 'price to earnings', 'earnings yield'], answer: 'P/E compares a share price with earnings per share. The earnings period and basis matter, and negative or near-zero earnings can make the ratio unhelpful. Use the definition shown by the product before comparing companies.', links: [link('P/E and earnings yield', '/intelligence/notes/pe-ratio-vs-earnings-yield/', 'Read the worked example'), link('Screener methodology', '/screener/methodology/', 'Check the metric basis')] },
  { id: 'marketcap', category: 'Data & methods', question: 'What is market cap?', aliases: ['market cap', 'market capitalisation', 'market capitalization', 'mcap'], answer: 'Market capitalisation describes the equity value implied by share price and the relevant number of shares. It is a measure of size, not a verdict on business quality. Check the date, units and share-count basis used by the product.', links: [link('Screener methodology', '/screener/methodology/', 'Metric inputs, units and definitions')] },
  { id: 'roe', category: 'Data & methods', question: 'What is ROE?', aliases: ['roe', 'return on equity'], answer: 'Return on equity relates profit to shareholders’ equity. The profit period and equity basis affect the result. Debt, unusual gains and a small equity base can complicate comparisons; check the product’s definition and the underlying financials.', links: [link('Screener methodology', '/screener/methodology/', 'Ratio definitions and inputs')] },
  { id: 'roce', category: 'Data & methods', question: 'What is ROCE?', aliases: ['roce', 'return on capital employed'], answer: 'Return on capital employed relates operating earnings to capital employed. Definitions of both inputs vary, so compare the same basis and reporting period. Open the methodology for the exact definition used by Screener.', links: [link('Screener methodology', '/screener/methodology/', 'ROCE definition and limitations')] },
  { id: 'xirr', category: 'Data & methods', question: 'What is XIRR?', aliases: ['xirr', 'money weighted', 'cash flows', 'portfolio return'], answer: 'XIRR is an annualised, money-weighted return based on dated cash flows. It can differ from a portfolio return that measures a price path. The cash-flow dates, signs and measurement window matter.', links: [link('XIRR and portfolio return', '/intelligence/notes/xirr-vs-portfolio-return/', 'Compare the two measures'), portfolio] },
  { id: 'iv', category: 'Data & methods', question: 'What is implied volatility?', aliases: ['implied volatility', 'iv rank', 'iv percentile', 'iv'], answer: 'Implied volatility is inferred from option prices under a pricing model. IV rank and IV percentile compare it with a historical window in different ways. Neither is a promise of future price moves; check the model inputs and window.', links: [link('IV rank and IV percentile', '/intelligence/notes/iv-rank-vs-iv-percentile-nifty-options/', 'Definitions and worked examples'), link('F&O methodology', '/futures-and-options/methodology/', 'Model inputs and limitations')] }
];

export const categories = ['All questions', 'Getting started', 'Tools', 'Data & methods', 'Account & help'];
export function normalize(text) {
  return String(text ?? '').normalize('NFKC').toLowerCase().replace(/[’']/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9/.\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}
const stopwords = new Set('a an the is are what where how can i me my you your do does of to in on for about it please with explain tell get show'.split(' '));
const tokens = text => normalize(text).split(/[^a-z0-9/]+/).filter(w => w && !stopwords.has(w));
export function searchFaqs(query, category = categories[0]) {
  const words = tokens(query);
  return faqs.filter(f => category === categories[0] || f.category === category).map(f => {
    const heading = normalize([f.question, ...f.aliases].join(' '));
    const body = normalize(f.answer);
    const score = words.reduce((n, w) => n + (heading.includes(w) ? 3 : body.includes(w) ? 1 : 0), 0);
    return { faq: f, score };
  }).filter(r => !words.length || r.score >= words.length).sort((a, b) => b.score - a.score).map(r => r.faq);
}

const companyAliases = [
  ['TCS', ['tcs', 'tata consultancy services'], 'TCS.NS'], ['Infosys', ['infosys', 'infy'], 'INFY.NS'],
  ['Reliance Industries', ['reliance', 'reliance industries', 'ril'], 'RELIANCE.NS'], ['HDFC Bank', ['hdfc bank', 'hdfcbank'], 'HDFCBANK.NS'],
  ['ICICI Bank', ['icici bank', 'icicibank'], 'ICICIBANK.NS'], ['ITC', ['itc'], 'ITC.NS'], ['State Bank of India', ['sbi', 'state bank of india', 'sbin'], 'SBIN.NS'],
  ['Larsen & Toubro', ['larsen and toubro', 'l and t', 'lt'], 'LT.NS'],
  ['Wipro', ['wipro'], 'WIPRO.NS'], ['Bharti Airtel', ['bharti airtel', 'airtel'], 'BHARTIARTL.NS'], ['Bajaj Finance', ['bajaj finance', 'bajfinance'], 'BAJFINANCE.NS'],
];
const phrasePresent = (q, phrase) => ` ${q} `.includes(` ${normalize(phrase)} `);
const cleanCompany = s => s.replace(/[?.!,]+$/g, '').replace(/^(?:the company|company|stock)\s+/i, '').replace(/\s+(?:stock|shares|company|chart|financials)$/i, '').trim();
function companyQuery(raw, q, context) {
  const known = companyAliases.filter(([, aliases]) => aliases.some(a => phrasePresent(q, a) || phrasePresent(q, `${a}.ns`)));
  if (known.length > 1) return { ambiguous: true };
  if (known.length === 1) return { name: known[0][0], symbol: known[0][2], known: true };
  let candidate = raw.match(/^(?:show|open)(?: me)?\s+(?:a |the )?chart(?: for| of)?\s+(.+)$/i)?.[1]
    || raw.match(/^(?:where can i (?:research|find)|research|find|search(?: for)?|look up|open|show me)\s+(.+)$/i)?.[1]
    || raw.match(/^(?:chart|financials|fundamentals)\s+(?:for|of)\s+(.+)$/i)?.[1];
  if (!candidate && context.awaitingCompany && !/^(?:what|how|where|why|which)\b/.test(q)) candidate = raw;
  if (!candidate && /^[A-Z][A-Z0-9&.-]{1,19}(?:\.NS)?$/.test(raw)) candidate = raw;
  if (!candidate) return null;
  candidate = cleanCompany(candidate);
  if (candidate.length < 2 || candidate.length > 80 || /^(a|an|the)$/i.test(candidate) || /[<>:/\\@]/.test(candidate) || /\b(and|versus|vs|or|compare)\b/i.test(candidate)) return null;
  if (/\b(company|metric|tool|faq|question|marketdeck|screener|charting|portfolio|options|crypto|help|research)\b/i.test(candidate)) return null;
  return { name: candidate, known: false };
}
function bestFaq(q) {
  let best = null, bestScore = 0;
  const words = tokens(q);
  for (const faq of faqs) {
    for (const phrase of [faq.question, ...faq.aliases]) {
      const norm = normalize(phrase);
      const keys = tokens(norm);
      let score = q === norm ? 100 + keys.length : phrasePresent(q, norm) ? 60 + keys.length : 0;
      if (!score && keys.length > 1 && keys.every(k => words.includes(k))) score = 30 + keys.length;
      if (score > bestScore) { best = faq; bestScore = score; }
    }
  }
  return best;
}
export function answerQuestion(input, context = {}) {
  const raw = String(input ?? '').trim().slice(0, 280);
  const q = normalize(raw);
  if (!q) return null;
  if (/^(?:my |show |show my |refresh |get )?(?:portfolio|portfolio update|portfolio updates|portfolio summary|my portfolio|update portfolio|refresh portfolio|holdings update)$/.test(q)) return {view:'portfolio'};
  if (/^(?:shortcuts|all shortcuts|all tools|find a page|tool directory|open shortcuts)$/.test(q)) return {view:'tools'};
  if (/^(?:open |show |go to )?(?:calculator|calculators|financial calculator|sip calculator)$/.test(q)) return {answer:'Open the financial calculators for SIP, returns and valuation tools. The options and crypto calculators are in their own workspaces.',links:[link('Financial calculators','/screener/calculators/','Returns and valuation tools'),link('Option calculator','/futures-and-options/analytics/calculator/','Option price and Greeks'),link('Crypto calculators','/crypto/crypto-tax-calculator/','Start with the crypto tax calculator')],context:{}};
  const faq = bestFaq(q);
  // Advice and methodology intents take precedence over a company name.
  const reserved = ['advice', 'freshness', 'sources', 'calculations', 'pe', 'roe', 'roce', 'marketcap', 'xirr', 'iv', 'password', 'account', 'access', 'lens'];
  if (faq && reserved.includes(faq.id)) return { ...faq, context: {} };
  if (/^(?:faq|faqs|browse faqs|frequently asked questions)$/.test(q)) return { view: 'faqs' };
  if (/^(?:hi|hello|hey|thanks|thank you|ok|okay)$/.test(q)) return { answer: /thank/.test(q) ? 'You’re welcome. What would you like to explore next?' : 'Hello. I can help you find a company, choose a research tool or explore the FAQs.', suggestions: ['Research a company', 'Find the right tool', 'Browse FAQs'], context: {} };
  if (/\b(compare|versus|vs)\b/.test(q)) return { answer: 'Use the comparison workspace to choose the companies you want to compare. Check that the metrics use comparable definitions and reporting periods.', links: [link('Compare companies', '/screener/compare/', 'Choose companies in Screener')], context: {} };
  const company = companyQuery(raw, q, context) || (!faq && /^[a-z0-9& .'-]{2,80}$/i.test(raw) && q.split(' ').length <= 5 && !/^(?:what|how|where|why|which|can|is|are|do|does|tell|help|please|i|you)\b/.test(q) ? { name: raw, known: false } : null);
  if (company?.ambiguous) return { answer: 'Which company would you like to open first? Enter one company name or NSE ticker so I can route you to the right search.', suggestions: ['Research a company'], context: { awaitingCompany: true } };
  if (company?.name) {
    const encoded = encodeURIComponent(company.name);
    const symbol = company.symbol || (/^[A-Z0-9&.-]+\.NS$/i.test(company.name) ? company.name.toUpperCase() : null);
    return {
      answer: company.known ? 'Start with the company page. Explore financials and source traces, then open the chart for price context.' : `Search for “${company.name}” in Screener. A unique match opens its company page; otherwise, you can choose from the matches. In Charting, select the matching instrument from its search suggestions.`,
      links: [link(company.known ? `Open ${company.name} company` : 'Find company matches', `/screener/search/?q=${encoded}`, 'Financials, filings and fundamental research'), link(company.known ? `View ${company.name} chart` : 'Open Charting search', symbol ? `/charts/jump/?symbol_input=${encodeURIComponent(symbol)}` : '/charts/', symbol ? 'Price history and technical context' : 'Choose an instrument from the search suggestions')],
      context: { company: company.name }
    };
  }
  if (context.company && /^(?:its |the |and )?(?:chart|financials|company page)(?: please)?$/.test(q)) return answerQuestion(`Open ${context.company}`, {});
  if (faq) return { ...faq, context: { awaitingCompany: Boolean(faq.awaitingCompany) } };
  return { answer: 'I don’t have a verified answer for that question yet. Try a company name or ticker, a research metric, or one of the FAQs. I can guide you to the relevant product; Use Portfolio update for your saved equity ledger. I cannot fetch live market quotes or resolve account issues.', suggestions: ['Research a company', 'Find the right tool', 'Browse FAQs'], links: [standards], context: {} };
}
