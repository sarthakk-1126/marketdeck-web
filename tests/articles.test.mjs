import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {inline,parseArticle,illustration,buildArticles} from '../scripts/articles.mjs';
const meta=JSON.parse(readFileSync('content/articles/metadata.json','utf8'));
const isolated=mkdtempSync(join(tmpdir(),'marketdeck-article-tests-'));
buildArticles({root:isolated,review:false,baseNotes:[]});
after(()=>rmSync(isolated,{recursive:true,force:true}));
const get=a=>readFileSync(`${isolated}/intelligence/notes/${a.slug}/index.html`,'utf8');
const root='https://marketdeck.in';
const apps=new Set(['/','/screener/','/charts/','/futures-and-options/','/commentary/','/crypto/']);
test('seven substantial source-backed guides cover seven categories without duplicate targets',()=>{
 assert.equal(meta.length,7);assert.equal(new Set(meta.map(a=>a.slug)).size,7);assert.equal(new Set(meta.map(a=>a.primaryKeyword.toLowerCase())).size,7);
 assert.deepEqual(new Set(meta.map(a=>a.topics[0])),new Set(['ai-quant','equities','fno','markets','india','crypto','research-craft']));
 for(const a of meta){const md=readFileSync(a.source,'utf8');assert.ok(md.split(/\s+/).length>=1500,a.slug);assert.ok(a.sources.length>=3);assert.equal(a.publicationStatus,'published');assert.ok(a.approvedAt);assert.equal((md.match(/\[\[figure\]\]/g)||[]).length,1);assert.equal(new Set(a.sources.map(s=>s.id)).size,a.sources.length);for(const m of md.matchAll(/\[(S\d+)\]/g))assert.ok(a.sources.some(s=>s.id===m[1]),a.slug+':'+m[1]);}
});
test('article SEO metadata is unique, readable and canonical; schema does not invent expertise',()=>{
 assert.equal(new Set(meta.map(a=>a.title)).size,7);assert.equal(new Set(meta.map(a=>a.description)).size,7);
 for(const a of meta){const h=get(a);assert.equal((h.match(/<h1\b/g)||[]).length,1);assert.equal((h.match(/rel="canonical"/g)||[]).length,1);assert.ok(h.includes(`href="${root}/intelligence/notes/${a.slug}/"`));assert.ok(a.description.length>=110&&a.description.length<=180);assert.ok(!h.includes('noindex'));assert.match(h,/<meta name="description"/);const ld=JSON.parse(h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(ld['@graph'][0]['@type'],'Article');assert.equal(ld['@graph'][1]['@type'],'BreadcrumbList');assert.equal(ld['@graph'][0].author['@type'],'Organization');assert.equal(ld['@graph'][0].author.name,'MarketDeck');assert.equal(ld['@graph'][0].dateModified,a.modifiedAt);assert.ok(!h.includes('FAQPage'));assert.ok(!h.includes('aggregateRating'));assert.ok(!h.includes('Download PDF'));}
});
test('all reference anchors, contents links, related guides and local image files resolve',()=>{
 for(const a of meta){const h=get(a),ids=[...h.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,a.slug);
 for(const m of h.matchAll(/\bhref="([^"]+)"/g)){const u=m[1];if(u.startsWith('#'))assert.ok(ids.includes(u.slice(1)),a.slug+':'+u);else if(u.startsWith('/')){const path=u.split('#')[0];if(apps.has(path))continue;assert.ok(existsSync('public'+path+(path.endsWith('/')?'index.html':'')),a.slug+':'+path);}}
 for(const m of h.matchAll(/\b(?:src|href)="(\/[^"#]+\.(?:svg|webp|css))"/g))assert.ok(existsSync('public'+m[1]),m[1]);
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
 for(const a of meta){const h=get(a);assert.ok(h.includes('Frequently asked questions'));assert.ok((h.match(/<h3\b/g)||[]).length>=3);assert.ok(h.includes('class="a-figure"'));assert.equal(a.related.length,3);assert.ok(h.includes('class="a-toc"'));assert.ok(h.includes('class="a-related"'));assert.ok(h.includes('aria-label="Article contents"'));}
});
