// Synthetic UI fixtures are emitted ONLY by explicit QA; never by the site build.
import {mkdirSync,writeFileSync} from 'node:fs';
import {shelf,library,editorialPage} from '../scripts/intelligence.mjs';
const sample={id:'test-0',path:'/intelligence/issues/agentic-trading-frontier-2026/',title:'A research fixture',summary:'Synthetic QA only. Never published.',kind:'magazine',edition:'QA',topics:['ai-quant'],cover:'/intelligence/issues/agentic-trading-frontier-2026/cover-v2.webp',pdf:'/intelligence/issues/agentic-trading-frontier-2026/marketdeck-brief-v2.pdf',pages:12,minutes:5,date:'2026-09-22',featured:true};
mkdirSync('public/__shelf-qa',{recursive:true});
for(const count of [0,1,25]){
 const items=Array.from({length:count},(_,n)=>({...sample,id:'test-'+n,title:'Research fixture '+n,topics:n%2?['india']:['ai-quant']}));
 writeFileSync(`public/__shelf-qa/${count}.html`,editorialPage({body:shelf(items,{id:'fixture-shelf'})+library(items),title:'UI test only',description:'Not a publication',path:'/__shelf-qa/',review:true,items}));
}
