/** Source-linked long-form articles. Restricted Markdown; no external runtime dependencies. */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {TOPICS,LEARNING_HUBS} from './intelligence.mjs';
import {loadEditorialSources,validateArticleCandidate} from './editorial-registry.mjs';
const ORIGIN='https://marketdeck.in';
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug=v=>{if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v))throw Error('Invalid article slug');return v;};
export function articleUrl(v){if(/^\/(?!\/)[a-zA-Z0-9/_@.#-]*$/.test(v)&&!v.split('/').includes('..'))return v;const u=new URL(v);if(u.protocol!=='https:'||u.username||u.password)throw Error('Unsafe article URL');return u.href;}
const url=articleUrl;
export function inline(v,sources){
 const rx=/\[([^\]\n]+)\]\(([^\s)]+)\)|\[(S\d+)\]/g;let out='',at=0;
 for(const m of v.matchAll(rx)){out+=E(v.slice(at,m.index));if(m[3]){if(!sources.some(s=>s.id===m[3]))throw Error('Unknown reference '+m[3]);out+=`<a class="a-cite" href="#source-${m[3]}" aria-label="Source ${m[3]}">[${m[3]}]</a>`;}else out+=`<a href="${E(url(m[2]))}">${E(m[1])}</a>`;at=m.index+m[0].length;}
 return out+E(v.slice(at));
}
export function parseArticle(md,a,figure){
 const toc=[],ids=new Set();let table=0;
 const body=md.trim().split(/\n\s*\n/).map(block=>{
  if(block==='[[figure]]')return figure;
  const h=block.match(/^(#{2,3}) (.+)$/);if(h){let id=slug(h[2].toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''));if(ids.has(id))throw Error('Duplicate article heading');ids.add(id);if(h[1].length===2)toc.push({id,title:h[2]});return `<h${h[1].length} id="${id}">${E(h[2])}</h${h[1].length}>`;}
  if(block.startsWith('|')){const rows=block.split('\n').map(x=>x.split('|').slice(1,-1).map(x=>x.trim()));if(rows.length<3||!rows[1].every(c=>/^:?-+:?$/.test(c)))throw Error('Malformed table');const [head,,...data]=rows;if(data.some(r=>r.length!==head.length))throw Error('Ragged table');table++;return `<div class="a-table-wrap" tabindex="0" role="region" aria-label="${E(a.title)}: example table ${table}"><table><caption>Worked example ${table} · hypothetical unless explicitly identified otherwise</caption><thead><tr>${head.map(x=>`<th scope="col">${inline(x,a.sources)}</th>`).join('')}</tr></thead><tbody>${data.map(r=>`<tr>${r.map((x,n)=>n?`<td>${inline(x,a.sources)}</td>`:`<th scope="row">${inline(x,a.sources)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;}
  if(/^\d+\. /.test(block)&&block.split('\n').every(l=>/^\d+\. /.test(l)))return `<ol>${block.split('\n').map(l=>`<li>${inline(l.replace(/^\d+\. /,''),a.sources)}</li>`).join('')}</ol>`;
  if(block.startsWith('> '))return `<blockquote><p>${inline(block.slice(2),a.sources)}</p></blockquote>`;
  if(block.startsWith('- '))return `<ul>${block.split('\n').map(l=>`<li>${inline(l.replace(/^- /,''),a.sources)}</li>`).join('')}</ul>`;
  return `<p>${inline(block.replace(/\n/g,' '),a.sources)}</p>`;
 }).join('\n');return {body,toc};
}
const tx=(x,y,s,size=22,fill='#c8d6e5')=>`<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" fill="${fill}">${E(s)}</text>`;
const rect=(x,y,w,h,fill='#163653')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}"/>`;
const line=(x,y,xx,yy,c='#456987')=>`<path d="M${x} ${y} L${xx} ${yy}" fill="none" stroke="${c}" stroke-width="3"/>`;
export function illustration(a){
 let art='',title='',desc='';const id=a.slug;
 if(id==='business-before-the-stock'){
  title='Profit and the cash-conversion bridge';desc='Hypothetical bridge: profit 100, depreciation plus 20, receivables minus 50, inventory minus 30, payables plus 10, operating-cash proxy 50. Figures in crore; other adjustments excluded.';
  const starts=[0,100,70,40,40,0],ends=[100,120,120,70,50,50],labs=['Profit','Depreciation','Receivables','Inventory','Payables','Cash proxy'],vs=['100','+20','−50','−30','+10','50'];
  for(let i=0;i<6;i++){const x=48+i*145,y=350-ends[i]*1.65;art+=rect(x,y,108,(ends[i]-starts[i])*1.65,i===5?'#6cb7f4':i===2||i===3?'#4a6076':'#254e70')+tx(x+9,y-14,vs[i],26,'#edf1f6')+tx(x,386,labs[i],18);}
  art+=line(44,350,902,350)+tx(48,426,'₹ crore · deliberately simplified · not a statutory cash-flow statement',18);
 }else if(id==='a-chart-is-a-question'){
  title='The return depends on the denominator';desc='Hypothetical prices: 100, 120, 90 and 135. The peak-to-trough drawdown is 25%; recovering from 90 to the previous peak of 120 requires 33.3%.';
  const pts=[100,120,90,135].map((v,i)=>[100+i*240,650-4*v]);art+=line(74,352,878,352);art+=`<path d="M${pts.map(p=>p.join(' ')).join(' L')}" stroke="#72b9f9" stroke-width="5" fill="none"/>`;
  pts.forEach(([x,y],i)=>{art+=`<circle cx="${x}" cy="${y}" r="8" fill="#b5dcff"/>`+tx(x-22,y-22,[100,120,90,135][i],27,'#edf1f6')+tx(x-9,386,['A','B','C','D'][i],20);});art+=tx(342,264,'−25%',30)+tx(628,230,'+50%',30)+tx(75,427,'Return from 90 to the previous 120 peak: +33.3% · no market data used',18);
 }else if(id==='iv-rank-vs-iv-percentile-nifty-options'){
  title='Same current IV. Different historical extremes.';desc='With the historical outlier, rank is 14.3 and percentile is 85. Replacing the outlier makes rank 71.4 while percentile stays 85. Current IV is 20%; the sample contains 20 hypothetical prior observations and counts values strictly below current IV.';
  const vals=[14.285714,85,71.428571,85],labs=['Outlier: rank','Outlier: percentile','No outlier: rank','No outlier: percentile'];
  for(let i=0;i<4;i++){let y=135+i*66;art+=tx(42,y+26,labs[i],20)+rect(284,y,Math.max(4,vals[i]*5.5),36,i%2?'#376480':'#7ac1fc')+tx(302+vals[i]*5.5,y+27,Number(vals[i].toFixed(1)).toString(),24,'#edf1f6');}art+=tx(42,433,'Relative statistics, not profit probabilities · 20 synthetic observations',18);
 }else if(id==='read-nse-company-announcements-results'){
  title='Three clocks. One information boundary.';desc='This hypothetical timeline separates the financial period ending 31 March, publication on 24 April, and retrieval on 5 June. A decision before publication cannot use the later document.';
  const labels=[['PERIOD ENDS','31 March','What the figures describe'],['PUBLISHED','24 April','When the evidence arrives'],['RETRIEVED','5 June','Which version you saved']];
  labels.forEach((v,i)=>{let x=40+i*309;art+=rect(x,170,264,165)+tx(x+20,204,v[0],17,'#9bc7ed')+tx(x+20,252,v[1],32,'#edf1f6')+tx(x+20,300,v[2],17);if(i<2)art+=line(x+267,250,x+303,250);});art+=tx(40,408,'Illustrative dates · never substitute the period-end date for publication time',18);
 }else if(id==='crypto-fundamentals-fees-revenue-token-value'){
  title='Follow the fee. Then follow the rights.';desc='Synthetic fee allocation: $100 in user fees splits into $70 for service providers and $30 retained by the protocol. The retained $30 splits into $20 for the treasury and $10 for a tokenholder mechanism. This is not observed protocol data.';
  const boxes=[[40,196,190,100,'User fees','$100'],[348,116,230,100,'Service providers','$70'],[348,280,230,100,'Protocol retained','$30'],[674,230,242,100,'Treasury','$20'],[674,345,242,100,'Holder mechanism','$10']];
  art+=line(230,235,348,166)+line(230,255,348,330)+line(578,323,674,280)+line(578,337,674,395);boxes.forEach(([x,y,w,h,l,v])=>art+=rect(x,y,w,h)+tx(x+16,y+33,l,18)+tx(x+16,y+76,v,29,'#edf1f6'));
 }else if(id==='pe-ratio-vs-earnings-yield'){
  title='One relationship, two directions';desc='Hypothetical examples show P/E and earnings yield as reciprocals when earnings are positive: 10x equals 10%, 20x equals 5%, and 25x equals 4%. This is not a return forecast.';
  const rows=[[10,10],[20,5],[25,4]];rows.forEach((v,i)=>{let y=145+i*88;art+=tx(54,y+26,`${v[0]}× P/E`,24,'#edf1f6')+line(238,y+18,470,y+18,'#456987')+tx(510,y+26,`${v[1]}% earnings yield`,24,'#9bc7ed');});art+=tx(54,430,'Reciprocal relationship only · earnings quality and period still need research',18);
 }else if(id==='support-vs-resistance-stock-charts'){
  title='Support and resistance are zones, not walls';desc='Hypothetical price path approaches a support zone near 500 and a resistance zone near 620 several times before breaking above resistance. The graphic is conceptual and not market data.';
  art+=`<rect x="55" y="300" width="850" height="48" rx="8" fill="#173653" opacity=".85"/>`+tx(70,331,'SUPPORT ZONE ~ ₹500',18,'#9bc7ed');art+=`<rect x="55" y="128" width="850" height="48" rx="8" fill="#432f3d" opacity=".85"/>`+tx(70,159,'RESISTANCE ZONE ~ ₹620',18,'#f3b7ca');
  const pts=[[70,270],[170,180],[270,320],[370,155],[470,305],[570,145],[670,270],[760,125],[875,88]];art+=`<path d="M${pts.map(p=>p.join(' ')).join(' L')}" stroke="#72b9f9" stroke-width="5" fill="none"/>`;pts.forEach(([x,y])=>art+=`<circle cx="${x}" cy="${y}" r="6" fill="#d9edff"/>`);art+=tx(55,425,'Hypothetical path · repeated reactions create context, not certainty',18);
 }else if(id==='call-option-vs-put-option-india'){
  title='Call and put buyer profit / loss at expiry';desc='Hypothetical cash-settled index options, per unit before costs. Strike 20,000, call premium 200, put premium 180. Call P/L = max(S − 20,000, 0) − 200; put P/L = max(20,000 − S, 0) − 180. Breakevens are 20,200 and 19,820. This is not a price forecast.';
  const X=s=>120+(s-19600)*.88,Y=p=>262-p*.46;
  art+=tx(50,118,'P/L per unit (₹)',17)+line(120,Y(0),824,Y(0))+line(120,140,120,355);
  for(const v of [-200,0,200])art+=tx(60,Y(v)+6,String(v),17);
  for(const v of [19600,20000,20400])art+=tx(X(v)-25,389,v.toLocaleString('en-IN'),17);
  const vals=[19600,19820,20000,20200,20400];
  const plot=(fn,color)=>`<path d="M${vals.map(v=>[X(v),Y(fn(v))].join(' ')).join(' L')}" fill="none" stroke="${color}" stroke-width="4"/>`;
  art+=plot(s=>Math.max(s-20000,0)-200,'#72b9f9')+plot(s=>Math.max(20000-s,0)-180,'#f1a7be');
  art+=tx(160,134,'PUT BUYER · ₹180 premium',17,'#f3b7ca')+tx(542,134,'CALL BUYER · ₹200 premium',17,'#9bc7ed')+tx(337,422,'Underlying index at expiry',18)+tx(50,458,'Synthetic example · no charges or lot multiplier · full premium loss is possible',17);
 }else if(id==='evaluate-ai-trading-agents'){
  title='A result has four layers to verify';desc='Proposed assessment framework: evidence checks sources and time; analysis checks units and calculations; decision checks rules and limits; operations checks authoritative state and retries. Each layer can fail independently.';
  const labels=[['01 / EVIDENCE','Source & time','Late document'],['02 / ANALYSIS','Units & maths','Wrong denominator'],['03 / DECISION','Rules & limits','Exposure breach'],['04 / OPERATIONS','State & retries','Duplicate action']];
  labels.forEach((v,i)=>{let x=30+i*237;art+=rect(x,155,215,210)+tx(x+14,192,v[0],17,'#9bc7ed')+tx(x+14,249,v[1],21,'#edf1f6')+tx(x+14,325,v[2],17);});art+=tx(32,428,'Conceptual evaluation framework · not benchmark results or a trading system',18);
 }else{
  title='Five lenses are not five independent votes';desc='This proposed framework connects business, valuation, price, conversation and risk to one source-linked memo, while preserving conflicting evidence.';
  const labels=['Business','Valuation','Price','Conversation','Risk'];labels.forEach((v,i)=>{let x=30+i*188;art+=rect(x,145,168,74)+tx(x+16,191,v,22)+line(x+84,219,480,300);});art+=rect(259,300,442,80,'#295575')+tx(310,350,'One source-linked memo',28,'#edf1f6')+tx(40,432,'Conceptual workflow · preserve disagreement, assumptions and uncertainty',18);
 }
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="960" height="480" viewBox="0 0 960 480" role="img" aria-labelledby="t d"><title id="t">${E(title)}</title><desc id="d">${E(desc)}</desc><rect width="960" height="480" rx="16" fill="#0d1722"/><path d="M32 88H928" stroke="#2b3d4e"/>${tx(32,39,'MARKETDECK / RESEARCH EXAMPLE',15,'#8fbce2')}${tx(32,72,title,27,'#edf1f6')}${art}</svg>`;
 return {svg,title,desc};
}
function shell(title,description,path,content,review,schema=''){
 return `<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${E(title)} | MarketDeck</title><meta name="description" content="${E(description)}"><meta name="theme-color" content="#080c12">${review?'<meta name="robots" content="noindex, nofollow">':`<link rel="canonical" href="${ORIGIN+path}">`}<meta property="og:type" content="article"><meta property="og:title" content="${E(title)}"><meta property="og:description" content="${E(description)}"><meta property="og:url" content="${ORIGIN+path}"><link rel="icon" href="/assets/favicon.svg"><link rel="alternate" type="application/atom+xml" title="MarketDeck Intelligence" href="/intelligence/feed.xml"><link rel="stylesheet" href="/home.css"><link rel="stylesheet" href="/intelligence-article-v1.css">${schema}</head><body class="md-article"><a class="skip-link" href="#reading">Skip to article</a><header class="a-header"><a class="a-brand" href="/">MarketDeck<span>.</span></a><nav aria-label="Editorial navigation"><a href="/intelligence/">Intelligence</a><a href="/intelligence/library/">Library</a><a href="/intelligence/issues/">Magazine archive</a><a href="/#products">The suite ↗</a></nav></header>${content}<footer class="a-footer"><span>MarketDeck · Research and education. Not investment advice.</span><a href="/intelligence/editorial-policy/">Editorial standards</a><a href="/intelligence/">All perspectives ↗</a></footer></body></html>`;
}
export function buildArticles({root,review,baseNotes=[]}){
 const sources=loadEditorialSources();
 const metadata=[...sources.articleMetadata.values()];
 const manifest=sources.manifest;
 const allowed=new Set(manifest.notes.filter(n=>n.publicationStatus==='published'&&n.approvedAt).map(n=>n.slug));
 const output=[];const metaMap=new Map(metadata.map(x=>[x.slug,x]));
 const write=(path,html)=>{const f=resolve(root,'.'+path+'index.html');mkdirSync(dirname(f),{recursive:true});writeFileSync(f,html);};
 for(const a of metadata){
  slug(a.slug);if(!allowed.has(a.slug)||a.publicationStatus!=='published'||!a.approvedAt)throw Error('Unapproved authored note');
  const validated=validateArticleCandidate(a,sources.manifestNotes.get(a.slug));
  if(new Set(a.sources.map(s=>s.id)).size!==a.sources.length)throw Error('Duplicate sources');a.sources.forEach(s=>url(s.url));url(a.coverArt);if(!existsSync(resolve('public','.'+a.coverArt)))throw Error('Missing cover artwork');
  const path=validated.path,md=validated.md,words=validated.words;
  const fig=illustration(a),figpath=`/assets/intelligence/articles/${a.slug}.svg`;mkdirSync(dirname(resolve(root,'.'+figpath)),{recursive:true});writeFileSync(resolve(root,'.'+figpath),fig.svg);
  const {body,toc}=parseArticle(md,a,`<figure class="a-figure"><img src="${figpath}" width="960" height="480" loading="lazy" alt="${E(fig.desc)}"><figcaption>${E(fig.desc)}</figcaption></figure>`);
  const crumbs=[{'@type':'ListItem',position:1,name:'MarketDeck',item:ORIGIN+'/'},{'@type':'ListItem',position:2,name:'Intelligence',item:ORIGIN+'/intelligence/'}];
  if(a.primaryHub){slug(a.primaryHub.slug);if(!LEARNING_HUBS[a.primaryHub.slug]||!a.topics.includes(LEARNING_HUBS[a.primaryHub.slug].topic))throw Error('Invalid primary learning hub');crumbs.push({'@type':'ListItem',position:3,name:a.primaryHub.label,item:ORIGIN+'/intelligence/'+a.primaryHub.slug+'/'});}
  crumbs.push({'@type':'ListItem',position:crumbs.length+1,name:a.title,item:ORIGIN+path});
  const schema={'@context':'https://schema.org','@graph':[{'@type':'Article','@id':ORIGIN+path+'#article',headline:a.title,description:a.description,mainEntityOfPage:{'@type':'WebPage','@id':ORIGIN+path},image:ORIGIN+a.coverArt,author:{'@type':'Organization',name:'MarketDeck',url:ORIGIN+'/'},publisher:{'@type':'Organization',name:'MarketDeck',url:ORIGIN+'/'},dateModified:a.modifiedAt,inLanguage:'en-IN',articleSection:TOPICS[a.topics[0]],wordCount:words,...(a.publishedAt?{datePublished:a.publishedAt}:{})},{'@type':'BreadcrumbList',itemListElement:crumbs}]};
  const schemas=`<meta property="og:image" content="${ORIGIN+a.coverArt}"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>`;
  const sourceList=a.sources.map(s=>`<li id="source-${s.id}"><a href="${E(url(s.url))}"><span>${s.id}</span> ${E(s.title)} ↗</a><p>${E(s.scope)} Reviewed ${E(s.reviewedAt)}.</p></li>`).join('');
  const related=a.related.map(k=>{const b=metaMap.get(k);if(!b)throw Error('Unknown related article');return `<a href="/intelligence/notes/${k}/"><small>${E(TOPICS[b.topics[0]])}</small><strong>${E(b.title)}</strong><span>Continue reading ↗</span></a>`;}).join('');
  const crumbHtml=crumbs.map((c,i)=>i===crumbs.length-1?`<span aria-current="page">${E(c.name)}</span>`:`<a href="${E(c.item.replace(ORIGIN,''))}">${E(c.name)}</a>`).join('<span aria-hidden="true">/</span>');
  const toolCta=a.tool?`<aside class="a-apply"><div><p class="a-kicker">LEARN → APPLY</p><h2>Put the idea next to the data.</h2><p>${E(a.tool.name)} is the practical workspace connected to this lesson. Use the tool to inspect the available data and controls; the article remains the explanation, not a trading signal.</p>${a.primaryHub?`<p>Continue learning in the <a href="/intelligence/${E(a.primaryHub.slug)}/">${E(a.primaryHub.label)} hub</a>.</p>`:''}</div><a href="${E(url(a.tool.url))}">${E(a.tool.label)} <span aria-hidden="true">↗</span></a></aside>`:'';
  const content=`<main id="reading"><section class="a-hero"><nav class="a-breadcrumb" aria-label="Breadcrumb">${crumbHtml}</nav><div class="a-hero-grid"><div><p class="a-kicker">THE MARKETDECK RESEARCH DESK</p><h1>${E(a.title)}</h1><p class="a-deck">${E(a.description)}</p><p class="a-meta">By MarketDeck · ${Math.ceil(words/220)} min read · Updated <time datetime="${a.modifiedAt}">23 September 2026</time></p><p class="a-format">ONLINE FIELD GUIDE <span>Sources linked · Original worked examples</span></p></div><figure class="a-cover"><img src="${a.coverArt}" width="1400" height="800" alt="" decoding="async"><figcaption>Editorial illustration · not market data</figcaption><span class="a-cover-rule" aria-hidden="true"></span><p>${E(a.h1)}</p></figure></div><div class="a-takeaways"><p class="a-kicker">BEFORE YOU BEGIN</p>${a.takeaways.map((v,i)=>`<p><span>0${i+1}</span>${E(v)}</p>`).join('')}</div></section><div class="a-layout"><aside class="a-toc"><details open><summary>IN THIS GUIDE</summary><nav aria-label="Article contents">${toc.map((t,i)=>`<a href="#${t.id}"><span>${String(i+1).padStart(2,'0')}</span>${E(t.title)}</a>`).join('')}<a href="#sources"><span>↗</span>Sources and scope</a></nav></details></aside><article class="a-body">${body}${toolCta}<section class="a-sources" id="sources"><p class="a-kicker">THE EVIDENCE DESK</p><h2>Sources and scope</h2><p>Primary documents, provider documentation and research papers are linked below. The examples are synthetic or explicitly identified; no live return, investment outcome or independent research replication is claimed.</p><ol>${sourceList}</ol><div class="a-disclosure"><strong>How this article was made</strong><p>This is AI-assisted educational writing published by MarketDeck. Sources were checked and worked-example arithmetic tested during preparation. No named human expert review or professional credential is claimed. Read our <a href="/intelligence/editorial-policy/">editorial standards and limitations</a>.</p></div></section></article></div><section class="a-related"><p class="a-kicker">THE NEXT QUESTION</p><h2>Continue your research.</h2><div>${related}</div></section></main>`;
  write(path,shell(a.title,a.description,path,content,review,schemas));output.push({slug:a.slug,path,title:a.title,summary:a.description,body,topics:a.topics,primaryHub:a.primaryHub,tool:a.tool,publishedAt:a.publishedAt??a.approvedAt,modifiedAt:a.modifiedAt});
 }
 for(const n of baseNotes)if(!metaMap.has(n.slug))output.push(n);
 const policy=`<main id="reading" class="a-policy"><p class="a-kicker">MARKETDECK INTELLIGENCE</p><h1>Editorial standards.<br>Evidence before certainty.</h1><p class="a-deck">How to read the sources, examples and limitations in our research guides.</p><article class="a-body"><h2>Purpose and boundaries</h2><p>MarketDeck publishes research and educational material. Our articles do not provide personalised investment, legal or tax advice and do not promise returns. A link to a tool is an invitation to explore its available research features, not an endorsement of a security or strategy.</p><h2>Sources and original work</h2><p>Guides link to original filings, official documentation, standards bodies, data-provider definitions and research papers where applicable. Worked examples are labelled as hypothetical. An author's reported research finding is distinguished from an independently reproduced result; these guides do not claim the latter.</p><h2>AI assistance and authorship</h2><p>The September 2026 field guides were prepared with AI assistance for research, writing, diagrams and implementation. MarketDeck is the publisher. No fictitious human analyst, review board, qualification or first-hand trading record is assigned to the articles. Source checks and automated arithmetic tests are not substitutes for independent professional review.</p><h2>Dates, definitions and uncertainty</h2><p>Updated dates reflect substantive changes, not a cosmetic attempt to look current. Provider definitions, legal rules and market conventions can change. Verify current primary documentation before relying on a time-sensitive point. Where a source was accessible only through an indexed extract, its source note states that limitation.</p><h2>Corrections and limitations</h2><p>A useful correction identifies the article, the disputed passage and the primary evidence supporting the change. Use the contact destination displayed on the MarketDeck homepage when available. We do not claim an always-staffed corrections desk or a response-time guarantee. Material corrections should be documented alongside the affected source and update date.</p><h2>Search and publication quality</h2><p>Keywords help us understand readers' questions; they do not replace research. We avoid copied competitor prose, artificial traffic claims, invented performance statistics and publishing empty category pages. Reader FAQs are for clarity, not promises of a particular search-result appearance.</p><p><a href="/intelligence/">Return to the research library ↗</a></p></article></main>`;
 write('/intelligence/editorial-policy/',shell('Editorial Standards and AI Assistance','MarketDeck editorial standards: sources, synthetic examples, AI assistance, dates, uncertainty and correction principles.','/intelligence/editorial-policy/',policy,review));
 return output;
}
