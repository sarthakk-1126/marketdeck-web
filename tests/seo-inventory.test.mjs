import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {assertNoOrphanedEditorialOutput,loadEditorialSources} from '../scripts/editorial-registry.mjs';
import {writeEditorialSitemap} from '../scripts/editorial.mjs';
import {canonicalJsonBytes,finalizeInventory,parseInventoryJson,parseJsonValueStrict,ProtocolError,recordsDigest,validateIntegrity} from '../scripts/seo/inventory-protocol.mjs';
import {failedWebInventory,produceWebInventory} from '../scripts/seo/web-inventory.mjs';
import {sourceRevision} from '../scripts/seo/export-web-inventory.mjs';

const REV='6e8f6be6f7bb03f21f00322cf0d38fc33e1f54a5';
const NOW='2026-09-24T00:00:00Z';
const inventory=()=>produceWebInventory({runId:'node-test-vector',generatedAt:NOW,environment:'test',sourceRevision:REV});
const urls=xml=>[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);

test('JavaScript wire encoding matches the pinned Python UTF-8 vectors',()=>{
  const value={z:'₹ & < >',a:['हिंदी','😀','line\nnext']};
  const expected=Buffer.from('{"a":["हिंदी","😀","line\\nnext"],"z":"₹ & < >"}','utf8');
  assert.deepEqual(canonicalJsonBytes(value),expected);
  assert.equal(createHash('sha256').update(expected).digest('hex'),'efa74050e5819d4ab9c784cb59d03ade2044618c55742e6a272a573c8534e72a');
  assert.throws(()=>canonicalJsonBytes('\ud800'),/^ProtocolError: invalid_unicode$/);
  assert.throws(()=>canonicalJsonBytes({'é':'value'}),/^ProtocolError: non_ascii_object_key$/);
  assert.throws(()=>canonicalJsonBytes(1.5),/^ProtocolError: unsupported_json_type$/);
});

test('strict JSON rejects duplicates and non-finite values',()=>{
  assert.throws(()=>parseInventoryJson('{"records":[],"records":[]}'),/^ProtocolError: duplicate_json_key$/);
  assert.throws(()=>parseInventoryJson('{"number":NaN}'),/^ProtocolError: nonfinite_json_number$/);
  assert.deepEqual(parseJsonValueStrict('[1,1.5]',{protocol:false}),[1,1.5]);
});

test('complete empty and failed generation are distinct',()=>{
  const base=inventory(),empty=finalizeInventory({...base,records:[],enumeration_status:'complete',enumeration_errors:[]});
  const failed=failedWebInventory({runId:'failed',generatedAt:NOW,environment:'test',sourceRevision:REV,code:'source_unavailable'});
  assert.equal(empty.enumeration_status,'complete');assert.equal(failed.enumeration_status,'failed');
  assert.equal(empty.records_sha256,createHash('sha256').update('[]').digest('hex'));
  assert.throws(()=>validateIntegrity({...empty,enumeration_status:'failed'}),/^ProtocolError: invalid_failed_generation$/);
});

test('current producer preserves all candidates and exactly the existing 21 eligible URLs',()=>{
  const out=inventory(),eligible=out.records.filter(r=>r.sitemap_eligible);
  assert.equal(out.record_count,24);assert.equal(eligible.length,21);
  assert.equal(out.records_sha256,'a2457fb7f34b947a5f0832ef4616d1c96da68df4928c80517019064b638d201a');
  assert.equal(out.records.filter(r=>r.page_family.startsWith('INT-03 ')).length,10);
  assert.equal(out.records.filter(r=>r.page_family.startsWith('INT-08 ')).length,3);
  assert.equal(out.records.filter(r=>r.page_family.startsWith('INT-09 ')).length,1);
  assert.equal(out.records.filter(r=>r.page_family.startsWith('INT-04 ')&&r.sitemap_eligible).length,1);
  const draft=out.records.find(r=>r.public_record_identifier==='research-foundations-01');
  assert.equal(draft.classification,'F');assert.equal(draft.sitemap_eligible,false);
  assert.ok(out.records.filter(r=>['INT-06','INT-07'].includes(r.page_family.split(' ')[0])).every(r=>!r.sitemap_eligible));
  const current=new Set(urls(readFileSync('public/sitemap.xml','utf8'))),produced=new Set(eligible.map(r=>r.canonical_url));
  assert.deepEqual(produced,current);
});

test('only article modifiedAt and published issue lastUpdated populate content timestamps',()=>{
  const out=inventory();
  for(const row of out.records){
    const family=row.page_family.split(' ')[0];
    if(family==='INT-03'&&row.sitemap_eligible)assert.equal(row.content_updated_at,'2026-09-23');
    else if(family==='INT-04'&&row.sitemap_eligible)assert.equal(row.content_updated_at,'2026-09-22');
    else assert.equal(row.content_updated_at,null);
  }
});

test('run provenance and generated_at fail closed',()=>{
  assert.throws(()=>produceWebInventory({runId:'',generatedAt:NOW,environment:'test',sourceRevision:REV}),/invalid_run_id/);
  assert.throws(()=>produceWebInventory({runId:'x',generatedAt:'2026-09-24',environment:'test',sourceRevision:REV}),/invalid_generated_at/);
  assert.throws(()=>produceWebInventory({runId:'x',generatedAt:NOW,environment:'test',sourceRevision:'bad'}),/invalid_source_revision/);
  assert.throws(()=>sourceRevision('0'.repeat(40)),/source_revision_conflict/);
});

test('structural manifest/metadata drift and duplicate JSON keys fail closed',()=>{
  const root=mkdtempSync(join(tmpdir(),'seo-008f-source-')),manifest=join(root,'briefs.json'),metadata=join(root,'metadata.json');
  writeFileSync(manifest,JSON.stringify({issues:[],notes:[{slug:'missing-note',publicationStatus:'published',approvedAt:'2026-09-24'}]}));writeFileSync(metadata,'[]');
  assert.throws(()=>produceWebInventory({runId:'drift',generatedAt:NOW,environment:'test',sourceRevision:REV,manifestPath:manifest,metadataPath:metadata}),/article_registry_drift/);
  writeFileSync(manifest,'{"issues":[],"issues":[],"notes":[]}');
  assert.throws(()=>loadEditorialSources({manifestPath:manifest,metadataPath:metadata}),/^ProtocolError: duplicate_json_key$/);
  rmSync(root,{recursive:true,force:true});
});

function fixtureSources({issue='published',note='published'}={}){
  const approvedAt=value=>value==='published'?'2026-09-24':null;
  return {issues:new Map([['new-issue',{slug:'new-issue',publicationStatus:issue,approvedAt:approvedAt(issue)}]]),manifestNotes:new Map([['new-note',{slug:'new-note',publicationStatus:note,approvedAt:approvedAt(note)}]]),articleMetadata:new Map([['new-note',{slug:'new-note',publicationStatus:note,approvedAt:approvedAt(note)}]])};
}
function stale(root,family,slug){mkdirSync(join(root,'intelligence',family,slug),{recursive:true});writeFileSync(join(root,'intelligence',family,slug,'index.html'),'stale');}

test('production lifecycle rejects withdrawn, removed and renamed generated issue directories',()=>{
  for(const mode of ['draft','removed','renamed']){
    const root=mkdtempSync(join(tmpdir(),'seo-008f-issue-'));stale(root,'issues',mode==='renamed'?'old-issue':'new-issue');
    const sources=mode==='draft'?fixtureSources({issue:'draft'}):mode==='removed'?{...fixtureSources(),issues:new Map()}:fixtureSources();
    assert.throws(()=>assertNoOrphanedEditorialOutput({root,sources}),/orphaned_generated_INT-04_/);
    rmSync(join(root,'intelligence','issues'),{recursive:true,force:true});assert.doesNotThrow(()=>assertNoOrphanedEditorialOutput({root,sources}));rmSync(root,{recursive:true,force:true});
  }
});

test('production lifecycle rejects removed or renamed generated note directories and succeeds after cleanup',()=>{
  for(const slug of ['new-note','old-note']){
    const root=mkdtempSync(join(tmpdir(),'seo-008f-note-'));stale(root,'notes',slug);
    const sources={...fixtureSources(),manifestNotes:new Map(),articleMetadata:new Map()};
    assert.throws(()=>assertNoOrphanedEditorialOutput({root,sources}),/orphaned_generated_INT-03_/);
    rmSync(join(root,'intelligence','notes'),{recursive:true,force:true});assert.doesNotThrow(()=>assertNoOrphanedEditorialOutput({root,sources}));rmSync(root,{recursive:true,force:true});
  }
});

test('current generated editorial output has no withdrawn orphan',()=>{
  assert.doesNotThrow(()=>assertNoOrphanedEditorialOutput({root:'public',sources:loadEditorialSources()}));
});

test('legacy writer reproduces committed sitemap while publisher ownership cannot overwrite root',()=>{
  const root=mkdtempSync(join(tmpdir(),'seo-008f-sitemap-')),current=readFileSync('public/sitemap.xml','utf8');
  const paths=urls(current).map(url=>new URL(url).pathname);
  assert.equal(writeEditorialSitemap({root,urls:paths,origin:'https://marketdeck.in'}),true);
  assert.equal(readFileSync(join(root,'sitemap.xml'),'utf8'),current);
  writeFileSync(join(root,'sitemap.xml'),'publisher-owned-root');
  assert.equal(writeEditorialSitemap({root,urls:['/changed/'],origin:'https://marketdeck.in',owner:'publisher'}),false);
  assert.equal(readFileSync(join(root,'sitemap.xml'),'utf8'),'publisher-owned-root');
  assert.throws(()=>writeEditorialSitemap({root,urls:[],origin:'https://marketdeck.in',owner:'dual'}),/invalid_sitemap_owner/);
  rmSync(root,{recursive:true,force:true});
});

test('review output is noindex evidence only and never changes inventory admission',()=>{
  const out=inventory(),draft=out.records.find(r=>r.public_record_identifier==='research-foundations-01');
  assert.equal(draft.sitemap_eligible,false);assert.equal(draft.google_inspection_state,'not_checked');
  if(existsSync('.preview/review/intelligence/issues/research-foundations/index.html'))assert.match(readFileSync('.preview/review/intelligence/issues/research-foundations/index.html','utf8'),/noindex, nofollow/);
});
