import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {inline,parseArticle,illustration,buildArticles,displayDate} from '../scripts/articles.mjs';
// Existing field-guide contracts remain exact. Original research has a separate,
// stricter result/figure/reproducibility acceptance suite (research.test.mjs).
const meta=JSON.parse(readFileSync('content/articles/metadata.json','utf8')).filter(a=>!a.originalResearch);
const isolated=mkdtempSync(join(tmpdir(),'marketdeck-article-tests-'));
buildArticles({root:isolated,review:false,baseNotes:[]});
after(()=>rmSync(isolated,{recursive:true,force:true}));
const get=a=>readFileSync(`${isolated}/intelligence/notes/${a.slug}/index.html`,'utf8');
const root='https://marketdeck.in';
const apps=new Set(['/screener/research-terminal/','/screener/learning/books/','/screener/learning/methods/margin-of-safety/','/screener/learning/methods/valuation-story-to-numbers/','/screener/learning/books/psychology-money/','/screener/learning/books/intelligent-investor/','/screener/learning/books/little-valuation/','/screener/learning/paths/beginner-investing-books/','/','/screener/','/screener/portfolio-analysis/','/screener/methodology/','/charts/','/futures-and-options/','/commentary/','/crypto/']);
test('seventeen substantial source-backed guides cover the intended editorial categories without duplicate targets',()=>{
 assert.equal(meta.length,17);assert.equal(new Set(meta.map(a=>a.slug)).size,16);assert.equal(new Set(meta.map(a=>a.primaryKeyword.toLowerCase())).size,16);
 for(const required of ['ai-quant','equities','fno','technical-analysis','india','crypto','research-craft','portfolio-analysis'])assert.ok(meta.some(a=>a.topics.includes(required)),required);
 for(const a of meta){const md=readFileSync(a.source,'utf8');assert.ok(md.split(/\s+/).length>=1500,a.slug);assert.ok(a.sources.length>=3);assert.equal(a.publicationStatus,'published');assert.ok(a.approvedAt);assert.equal((md.match(/\[\[figure\]\]/g)||[]).length,1);assert.equal(new Set(a.sources.map(s=>s.id)).size,a.sources.length);for(const m of md.matchAll(/\[(S\d+)\]/g))assert.ok(a.sources.some(s=>s.id===m[1]),a.slug+':'+m[1]);}
});
test('article SEO metadata is unique, readable and canonical; schema does not invent expertise',()=>{
 assert.equal(new Set(meta.map(a=>a.title)).size,16);assert.equal(new Set(meta.map(a=>a.description)).size,16);
 for(const a of meta){const h=get(a),canonical=`${root}/intelligence/notes/${a.slug}/`;assert.equal((h.match(/<h1\b/g)||[]).length,1);assert.equal((h.match(/rel="canonical"/g)||[]).length,1);assert.ok(h.includes(`href="${canonical}"`));assert.ok(a.description.length>=110&&a.description.length<=180);assert.ok(!h.includes('noindex'));assert.match(h,/<meta name="description"/);const ld=JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]),article=ld['@graph'].find(n=>n['@type']==='Article'),page=ld['@graph'].find(n=>n['@type']==='WebPage'),crumbs=ld['@graph'].find(n=>n['@type']==='BreadcrumbList');assert.ok(article);assert.ok(page);assert.ok(crumbs);assert.equal(article['@id'],canonical+'#article');assert.equal(article.headline,a.title);assert.deepEqual(article.mainEntityOfPage,{'@id':canonical+'#webpage'});assert.deepEqual(article.isPartOf,{'@id':'https://marketdeck.in/#website'});assert.equal(article.publisher['@type'],'Organization');assert.equal(article.publisher['@id'],'https://marketdeck.in/#organization');assert.equal(article.publisher.name,'MarketDeck');assert.equal(article.publisher.url,root+'/');assert.equal(article.publisher.logo['@id'],'https://marketdeck.in/#logo');assert.deepEqual(article.author,{'@id':'https://marketdeck.in/#organization'});assert.equal(page['@id'],canonical+'#webpage');assert.equal(page.url,canonical);assert.deepEqual(page.isPartOf,{'@id':'https://marketdeck.in/#website'});assert.equal(article.dateModified,a.modifiedAt);assert.ok(h.includes('By MarketDeck'));assert.equal(ld['@graph'].filter(n=>n['@type']==='Organization'&&!n['@id']).length,0);assert.ok(!h.includes('FAQPage'));assert.ok(!h.includes('aggregateRating'));assert.ok(!h.includes('Download PDF'));}
});
test('visible publication and modified dates use the same metadata as Article schema',()=>{
 for(const a of meta){const h=get(a);assert.ok(h.includes(`Updated <time datetime="${a.modifiedAt}">${displayDate(a.modifiedAt)}</time>`));if(a.publishedAt)assert.ok(h.includes(`Published <time datetime="${a.publishedAt}">${displayDate(a.publishedAt)}</time>`));const ld=JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'][0];assert.equal(ld.dateModified,a.modifiedAt);assert.equal(ld.datePublished,a.publishedAt);}
 assert.throws(()=>displayDate('26 September 2026'),/Invalid editorial date/);
});
test('all reference anchors, contents links, related guides and local image files resolve',()=>{
 for(const a of meta){const h=get(a),ids=[...h.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,a.slug);
 for(const m of h.matchAll(/\bhref="([^"]+)"/g)){const u=m[1];if(u.startsWith('#'))assert.ok(ids.includes(u.slice(1)),a.slug+':'+u);else if(u.startsWith('/')){const path=u.split(/[?#]/)[0];if(apps.has(path)||/^\/intelligence\/(equities|technical-analysis|futures-options|portfolio-analysis)\/$/.test(path))continue;assert.ok(existsSync('public'+path+(path.endsWith('/')?'index.html':'')),a.slug+':'+path);}}
 for(const m of h.matchAll(/\b(?:src|href)="(\/[^"#]+\.(?:svg|webp|css))(?:\?[^\"]*)?"/g))assert.ok(existsSync('public'+m[1]),m[1]);
 for(const s of a.sources)assert.ok(h.includes(`id="source-${s.id}"`));assert.ok(h.includes('AI-assisted educational writing'));
 }
});
test('worked example arithmetic and SVG illustrations remain consistent',()=>{
 assert.equal(100+20-50-30+10,50);assert.equal(120/((500+700)/2)*100,20);
 const observations=[10,11,12,12,13,13,14,14,15,15,16,16,17,17,18,18,19,20,22,80];
 const percentile=values=>values.filter(x=>x<20).length/values.length*100;
 const rank=values=>100*(20-Math.min(...values))/(Math.max(...values)-Math.min(...values));
 assert.equal(percentile(observations),85);assert.ok(Math.abs(rank(observations)-100/7)<1e-9);observations[19]=24;assert.equal(percentile(observations),85);assert.ok(Math.abs(rank(observations)-500/7)<1e-9);
 assert.equal((120-90)/120*100,25);assert.ok(Math.abs((120/90-1)*100-100/3)<1e-9);assert.equal(70+20+10,100);assert.equal(12500/100,125);
 // Portfolio Analysis cornerstone worked examples.
 const xirrFlows=[[new Date('2024-01-01T00:00:00Z'),-100000],[new Date('2024-07-01T00:00:00Z'),-50000],[new Date('2025-03-01T00:00:00Z'),20000],[new Date('2026-01-01T00:00:00Z'),155000]];
 const xnpv=r=>{const d0=xirrFlows[0][0];return xirrFlows.reduce((sum,[d,c])=>sum+c/(1+r)**((d-d0)/86400000/365),0)};
 assert.ok(Math.abs(xnpv(0.09263845082803523))<1e-6);
 const vr=[-0.060,-0.035,-0.025,-0.018,-0.012,-0.008,-0.005,-0.003,-0.001,0,0.002,0.004,0.006,0.008,0.009,0.011,0.013,0.015,0.020,0.035],vm=vr.reduce((a,b)=>a+b,0)/vr.length;
 const vs=Math.sqrt(vr.reduce((a,b)=>a+(b-vm)**2,0)/(vr.length-1));assert.ok(Math.abs(vm+0.0022)<1e-12);assert.ok(Math.abs(vs-0.020851858430365387)<1e-12);
 const frontierVol=(a,b)=>Math.sqrt(a*a*.01+b*b*.04+2*a*b*.005);assert.ok(Math.abs(frontierVol(1/3,2/3)-0.1452966314513558)<1e-12);assert.ok(Math.abs(frontierVol(-.5,1.5)-0.29154759474226505)<1e-12);
 assert.equal(0.07+0.5*(0.11-0.07),0.09);
 for(const a of meta){const f=illustration(a);assert.ok(f.svg.startsWith('<svg'));assert.ok(f.svg.includes('<desc'));assert.ok(f.desc.length>50);assert.ok(!f.svg.includes('<script'));}
});
test('existing reading URLs survive, draft issue stays excluded, all guides enter the sitemap',()=>{
 const sitemap=readFileSync('public/sitemap.xml','utf8');for(const a of meta)assert.ok(sitemap.includes(root+'/intelligence/notes/'+a.slug+'/'));
 for(const s of ['business-before-the-stock','a-chart-is-a-question','five-research-lenses'])assert.ok(meta.some(a=>a.slug===s));
 assert.ok(!sitemap.includes('/issues/research-foundations/'));assert.ok(!existsSync('public/intelligence/issues/research-foundations/index.html'));assert.ok(existsSync('public/intelligence/issues/agentic-trading-frontier-2026/marketdeck-brief-v2.pdf'));
 const policy=readFileSync('public/intelligence/editorial-policy/index.html','utf8');assert.ok(policy.includes('No fictitious human analyst'));
});
test('restricted Markdown escapes HTML and rejects unsafe URL schemes and unresolved references',()=>{
 assert.equal(inline('<script>x</script>',[]),'&lt;script&gt;x&lt;/script&gt;');assert.throws(()=>inline('[bad](javascript:alert)',[]));assert.throws(()=>inline('[bad](https://user:pw@example.com)',[]));assert.throws(()=>inline('[S9]',[]));assert.throws(()=>inline('[bad](//example.com/x)',[]));
 assert.throws(()=>parseArticle('## Same\n\n## Same',{sources:[]},''));assert.throws(()=>parseArticle('| A | B |\n|---|---|\n| only one |',{sources:[],title:'test'},''));
});
test('reader FAQ headings, original figures and contextual links exist on every guide',()=>{
 for(const a of meta){const h=get(a);assert.ok(h.includes('Frequently asked questions'));assert.ok((h.match(/<h3\b/g)||[]).length>=3);assert.ok(h.includes('class="a-figure"'));assert.equal(a.related.length,3);assert.ok(h.includes('class="a-toc"'));assert.ok(h.includes('class="a-related"'));assert.ok(h.includes('aria-label="Article contents"'));if(a.primaryHub)assert.ok(h.includes(`/intelligence/${a.primaryHub.slug}/`));if(a.tool){assert.ok(h.includes('class="a-apply"'));assert.ok(h.includes(a.tool.url));}else assert.ok(!h.includes('class="a-apply"'));}
});
test('apply links stay limited to guides with a direct product workflow',()=>{
 const expected=new Map([
  ['investing-book-to-research-workflow','/screener/learning/books/'],['strategy-backtest-research-checklist','/screener/research-terminal/'],
  ['business-before-the-stock','/screener/'],['read-nse-company-announcements-results','/screener/'],['pe-ratio-vs-earnings-yield','/screener/'],
  ['a-chart-is-a-question','/charts/'],['support-vs-resistance-stock-charts','/charts/'],
  ['iv-rank-vs-iv-percentile-nifty-options','/futures-and-options/'],['call-option-vs-put-option-india','/futures-and-options/'],
  ['crypto-fundamentals-fees-revenue-token-value','/crypto/'],
  ['xirr-vs-portfolio-return','/screener/portfolio-analysis/'],['portfolio-var-historical-parametric-cornish-fisher','/screener/portfolio-analysis/'],
  ['efficient-frontier-long-only-unconstrained','/screener/portfolio-analysis/'],['black-litterman-implied-returns','/screener/portfolio-analysis/'],
 ]);
 assert.equal(meta.filter(a=>a.tool).length,expected.size);
 for(const a of meta){const h=get(a),target=expected.get(a.slug);if(target){assert.equal(a.tool.url,target);assert.ok(h.includes(`href="${target}"`));}else assert.ok(!h.includes('class="a-apply"'),a.slug);}
});
