import test from 'node:test';
import assert from 'node:assert/strict';
import {shortcuts,searchShortcuts,pageContext} from '../src/lens-shortcuts.js';
import {answerQuestion} from '../src/lens-knowledge.js';
import {readPortfolioDocument} from '../src/lens-portfolio.js';
import {readFileSync} from 'node:fs';
test('shortcut directory contains all five products, calculators and saved work, without ops or mutation routes',()=>{
 for(const category of ['Screener','Charting','F&O','Commentary','Crypto World']) assert.ok(shortcuts.some(s=>s.category===category));
 assert.equal(new Set(shortcuts.map(s=>s.label+'|'+s.category)).size,shortcuts.length);
 for(const s of shortcuts){assert.match(s.href,/^\/(?!\/)/);assert.doesNotMatch(s.href,/\/api\/|\/admin\/|\/ops\/|\/delete\/|\/toggle|\/generate\/|\/save\/|\/buy\/|\/sell\//);}
 assert.equal(searchShortcuts('financial calculators')[0].href,'/screener/calculators/');
 assert.equal(searchShortcuts('option calculator')[0].href,'/futures-and-options/analytics/calculator/');
 assert.ok(searchShortcuts('watchlist').length>=2);
 assert.ok(searchShortcuts('', 'Crypto World').every(s=>s.category==='Crypto World'));
 assert.deepEqual(searchShortcuts('zxq-no-match'),[]);
});
test('typed shortcuts dispatch to the right workflow, without treating portfolio updates as a company',()=>{
 for(const query of ['portfolio update','my portfolio','refresh portfolio','show my portfolio summary']) assert.equal(answerQuestion(query).view,'portfolio',query);
 assert.equal(answerQuestion('all shortcuts').view,'tools');
 assert.equal(answerQuestion('open calculator').links[0].href,'/screener/calculators/');
 assert.equal(pageContext('/charts/TCS.NS/').label,'Charting');
 assert.equal(pageContext('/crypto/markets/').label,'Crypto World');
});
const element=(value='',selectors={})=>({textContent:value,querySelector:s=>selectors[s]||null});
const metric=(label,value)=>element('',{'span':element(label),'strong':element(value)});
const workspace=(metrics,rows=[])=>({...element('',{'.sp-pf-head h1':element('My long-term portfolio'),'.sp-pf-lede':element('Manual ledger'),'.sp-pf-alert':element('1 open lot without a stored price'),'.sp-pf-price-note':element('Values use stored prices')}),querySelectorAll:s=>s==='.sp-pf-summary .sp-pf-metric'?metrics:rows});
const doc=w=>({querySelector:()=>w});
test('portfolio preserves authoritative formatted numbers, missing prices and source dates without recalculation',()=>{
 const cells=['12.5 remaining shares','₹1000','N/A No stored price available','N/A','N/A'].map(x=>element(x));
 const identity=element('',{'a':element('ACME.NS'),'span':element('<script>alert(1)</script>'), 'small':element('Purchased 2026-01-01')});
 const row={querySelector:()=>identity,querySelectorAll:()=>cells};
 const result=readPortfolioDocument(doc(workspace([metric('Invested','₹1000.00'),metric('Current value','—'),metric('Unrealized gain / loss','—'),metric('Realized gain / loss','No sales yet')],[row])));
 assert.equal(result.metrics[1].value,'—');assert.equal(result.holdings[0].price,'N/A No stored price available');assert.equal(result.holdings[0].value,'N/A');assert.match(result.warning,/without a stored price/);assert.equal(result.holdings[0].name,'<script>alert(1)</script>');
});
test('unexpected or partial portfolio responses fail closed instead of showing invented zero values',()=>{
 assert.throws(()=>readPortfolioDocument(doc(null)),/Unexpected/);
 assert.throws(()=>readPortfolioDocument(doc(workspace([metric('Invested','100')]))),/incomplete/);
 const good=[metric('Invested','100'),metric('Value','90'),metric('Unrealized','-10'),metric('Realized','No sales')];
 assert.equal(readPortfolioDocument(doc(workspace(good))).holdings.length,0);
 assert.throws(()=>readPortfolioDocument(doc(workspace(good,[{querySelector:()=>null,querySelectorAll:()=>[]}]))),/holding is incomplete/);
});
test('portfolio fetch remains same-origin, user-triggered, uncached and abortable; private data clears at lifecycle boundaries',()=>{
 const portfolio=readFileSync('src/lens-portfolio.js','utf8'),ui=readFileSync('src/lens.js','utf8');
 assert.match(portfolio,/credentials:'same-origin',cache:'no-store',signal/);
 assert.doesNotMatch(portfolio+ui,/localStorage|sessionStorage|innerHTML|eval\(/);
 assert.match(ui,/visibilitychange/);assert.match(ui,/pagehide/);assert.match(ui,/dialog\.addEventListener\('close'.*clearPortfolio/);
 assert.match(ui,/portfolioRequest !== controller/);assert.match(ui,/setTimeout\(\(\) => controller.abort\(\), 15000\)/);
});

test('portfolio redirects stop before the account service and present sign-in', async()=>{
 const {loadPortfolio}=await import('../src/lens-portfolio.js');
 let options;
 const result=await loadPortfolio(new AbortController().signal,async(url,opts)=>{options=opts;assert.equal(url,'/screener/portfolio/');return {type:'opaqueredirect',status:0};});
 assert.deepEqual(result,{signedOut:true});assert.equal(options.redirect,'manual');
});
