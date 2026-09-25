import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {catalog,shelf,library,hub,libraryPage,archivePage,learningHub,LEARNING_HUBS,localPath,readingTime,atomFeed} from '../scripts/intelligence.mjs';
const manifest=JSON.parse(readFileSync('content/briefs.json'));
const publicCount=manifest.issues.filter(i=>i.publicationStatus==='published'&&i.approvedAt).length+manifest.notes.filter(n=>n.publicationStatus==='published'&&n.approvedAt).length;
const fixture=(n=0)=>({id:'issue-'+n,title:'Research '+n,summary:'Evidence, not recommendations.',slug:'issue-'+n,edition:'Fieldnotes',cover:'/cover.webp',pdfPath:'/brief.pdf',pageCount:12,source:'source.json',approvedAt:'2026-09-22',publicationStatus:'published',topics:['ai-quant']});
const opts={read:()=>({pages:[{intro:'A research idea'}]}),exists:()=>true};
const issueHTML=readFileSync('public/intelligence/issues/agentic-trading-frontier-2026/index.html','utf8');
test('catalog excludes drafts and unapproved entries, keeps immutable published URLs',()=>{
 const items=catalog({issues:[fixture(),{...fixture(1),publicationStatus:'draft'},{...fixture(2),approvedAt:null}]},[],opts);
 assert.equal(items.length,1);assert.equal(items[0].path,'/intelligence/issues/issue-0/');assert.equal(items[0].pdf,'/brief.pdf');
 assert.equal(catalog({issues:[]},[],opts).length,0);
});
test('multiple approved magazines work without special-casing an issue ID',()=>{
 const items=catalog({issues:Array.from({length:25},(_,n)=>fixture(n))},[],opts);
 assert.equal(items.length,25);assert.equal((shelf(items).match(/data-intel-slide /g)||[]).length,8);
 assert.equal((archivePage(items).match(/data-intel-entry /g)||[]).length,25);
});
test('published metadata and URLs fail closed on unsafe values',()=>{
 for(const bad of ['javascript:x','//evil.test/x','/../secret','/x/../y','/x"onclick="x','/x\\evil','/x?redirect=https://bad'])assert.throws(()=>localPath(bad));
 for(const patch of [{slug:'x"onclick="bad'},{topics:['not-a-topic']},{topics:[]},{pageCount:0},{cover:'https://bad/x'}])assert.throws(()=>catalog({issues:[{...fixture(),...patch}]},[],opts));
 assert.throws(()=>catalog({issues:[fixture(),fixture()]},[],opts));
 assert.throws(()=>catalog({issues:[fixture()]},[],{...opts,exists:()=>false}));
});
test('empty, single, missing-PDF, and escaping states render honestly',()=>{
 const items=catalog({issues:[{...fixture(),title:'<img src=x onerror=bad>Safe & sound',summary:'<script>bad</script> A study',pdfPath:null}]},[],opts);
 const html=shelf(items);assert.doesNotMatch(html,/onerror=|<script>/);assert.match(html,/Safe &amp; sound/);assert.match(html,/Online edition/);assert.doesNotMatch(html,/Download PDF/);
 assert.match(shelf([]),/taking shape/);assert.match(library([]),/No matching perspectives/);
 assert.equal(readingTime('word '.repeat(221)),2);
});
test('homepage, landing, unified library and magazine archive preserve approved content only',()=>{
 const homepage=readFileSync('public/index.html','utf8'),page=readFileSync('public/intelligence/index.html','utf8'),all=readFileSync('public/intelligence/library/index.html','utf8'),archive=readFileSync('public/intelligence/issues/index.html','utf8');
 assert.equal((homepage.match(/data-intel-slide /g)||[]).length,Math.min(8,publicCount));
 assert.equal((page.match(/data-intel-entry /g)||[]).length,0,'The Intelligence landing should not duplicate the complete library');
 assert.equal((all.match(/data-intel-entry /g)||[]).length,publicCount);
 assert.equal((all.match(/data-kind="magazine"/g)||[]).length,1);
 assert.equal((all.match(/data-kind="note"/g)||[]).length,publicCount-1);
 assert.equal((archive.match(/data-intel-entry /g)||[]).length,1);
 assert.match(page,/href="\/intelligence\/library\/"/);
 assert.match(archive,/Browse all MarketDeck Intelligence/);
 for(const html of [homepage,page,all,archive]){
  assert.doesNotMatch(html,/research-foundations|EDITORIAL DRAFT/);
  for(const link of html.matchAll(/href="([^\"]+\.pdf)"/g))assert.ok(existsSync('public'+link[1]));
  assert.match(html,/data-intel-status|intel-browse-doors/);
 }
 assert.ok(issueHTML.includes('marketdeck-brief-v2.pdf'));
 assert.equal(manifest.issues.find(i=>i.id==='research-foundations-01').publicationStatus,'draft');
});
test('Intelligence landing, library and magazine archive are canonical crawlable collections',()=>{
 for(const path of ['intelligence/','intelligence/library/','intelligence/issues/']){
  const html=readFileSync('public/'+path+'index.html','utf8');
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.match(html,new RegExp('rel="canonical" href="https://marketdeck.in/'+path+'"'));
  const ids=[...html.matchAll(/\bid="([^\"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(schema['@type'],'CollectionPage');
  assert.equal(schema.mainEntity.itemListElement.length,path==='intelligence/issues/'?1:publicCount);
  assert.doesNotMatch(html,/aria-roledescription="carousel"|data-intel-entry[^>]+hidden|data-intel-slide[^>]+hidden/);
 }
 const all=readFileSync('public/intelligence/library/index.html','utf8');
 assert.match(all,/data-intel-kind="all"/);assert.match(all,/data-intel-kind="magazine"/);assert.match(all,/data-intel-kind="note"/);
 assert.ok(readFileSync('public/sitemap.xml','utf8').includes('<loc>https://marketdeck.in/intelligence/library/</loc>'));
 assert.match(hub([],{review:true}),/noindex, nofollow/);
 assert.match(libraryPage([],{review:true}),/noindex, nofollow/);
});
test('Atom feed contains only published dated Intelligence entries and is autodiscoverable',()=>{
 const notes=JSON.parse(readFileSync('content/articles/metadata.json')).map(a=>({slug:a.slug,path:'/intelligence/notes/'+a.slug+'/',title:a.title,summary:a.description,body:readFileSync(a.source,'utf8'),publishedAt:a.publishedAt??a.approvedAt,modifiedAt:a.modifiedAt}));
 const items=catalog(manifest,notes,{read:p=>JSON.parse(readFileSync(p,'utf8')),exists:p=>existsSync('public'+p)});
 const feed=atomFeed(items);
 assert.match(feed,/xmlns="http:\/\/www\.w3\.org\/2005\/Atom"/);
 assert.match(feed,/rel="self" type="application\/atom\+xml" href="https:\/\/marketdeck\.in\/intelligence\/feed\.xml"/);
 assert.match(feed,/<author><name>MarketDeck<\/name><uri>https:\/\/marketdeck\.in\/<\/uri><\/author>/);
 assert.equal((feed.match(/<entry>/g)||[]).length,publicCount);
 assert.doesNotMatch(feed,/research-foundations/);
 for(const item of items)assert.ok(feed.includes('https://marketdeck.in'+item.path),item.path);
 const firstUpdated=feed.match(/<feed[^>]*>[\s\S]*?<updated>([^<]+)<\/updated>/)?.[1];assert.equal(firstUpdated,'2026-09-23T00:00:00Z');
 for(const path of ['public/index.html','public/intelligence/index.html','public/intelligence/library/index.html']){const html=readFileSync(path,'utf8');assert.match(html,/rel="alternate" type="application\/atom\+xml" title="MarketDeck Intelligence" href="\/intelligence\/feed\.xml"/);}
});

test('client enhancement is small, local and non-autoplay',()=>{
 const js=readFileSync('public/intelligence-shelf-v2.js','utf8');
 assert.doesNotMatch(js,/setInterval|innerHTML\s*=|fetch\(|localStorage|sessionStorage|document\.cookie/);
 assert.ok(Buffer.byteLength(js)<12000);assert.match(js,/pointercancel/);assert.match(js,/ArrowLeft/);
});

test('three primary learning hubs are substantial, canonical and connected to products',()=>{
 const notes=JSON.parse(readFileSync('content/articles/metadata.json')).map(a=>({slug:a.slug,path:'/intelligence/notes/'+a.slug+'/',title:a.title,summary:a.description,body:readFileSync(a.source,'utf8')}));
 const items=catalog(manifest,notes,{read:p=>JSON.parse(readFileSync(p,'utf8')),exists:p=>existsSync('public'+p)});
 for(const [slug,h] of Object.entries(LEARNING_HUBS)){const html=learningHub(items,slug);assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.ok(html.includes(`rel="canonical" href="https://marketdeck.in/intelligence/${slug}/"`));assert.ok(html.includes(h.tool.url));assert.ok((html.match(/class="learning-card"/g)||[]).length>=2);const ld=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(ld['@graph'][0]['@type'],'CollectionPage');assert.equal(ld['@graph'][1]['@type'],'BreadcrumbList');}
});
