import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {produceWebInventory} from '../scripts/seo/web-inventory.mjs';
import {validateIntegrity} from '../scripts/seo/inventory-protocol.mjs';

const options={runId:'current-editorial-test',generatedAt:'2026-10-05T12:00:00Z',sourceRevision:'a'.repeat(40),environment:'test'};
const paths=['/intelligence/notes/investing-book-to-research-workflow/','/intelligence/notes/strategy-backtest-research-checklist/','/intelligence/issues/investing-research-workbook/'];

test('current content exports complete, canonical HTML identities and excludes PDF representations',()=>{
  const inventory=produceWebInventory(options);
  validateIntegrity(inventory);
  assert.equal(inventory.enumeration_status,'complete');
  for(const path of paths){
    const rows=inventory.records.filter(r=>r.canonical_url==='https://marketdeck.in'+path&&r.sitemap_eligible);
    assert.equal(rows.length,1);
    assert.equal(rows[0].declared_canonical,rows[0].canonical_url);
  }
  assert.ok(inventory.records.filter(r=>r.route_name==='intelligence:issue_pdf').every(r=>!r.sitemap_eligible));
});

test('unknown current topic and publication registry drift still fail closed',()=>{
  const dir=mkdtempSync(join(tmpdir(),'marketdeck-inventory-'));
  try{
    const data=JSON.parse(readFileSync('content/articles/metadata.json','utf8'));
    data.find(r=>r.slug==='investing-book-to-research-workflow').topics=['unknown-topic'];
    const metadataPath=join(dir,'metadata.json');
    writeFileSync(metadataPath,JSON.stringify(data));
    assert.throws(()=>produceWebInventory({...options,metadataPath}),/invalid_article_topic/);
    data.pop();
    writeFileSync(metadataPath,JSON.stringify(data));
    assert.throws(()=>produceWebInventory({...options,metadataPath}),/article_registry_drift/);
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test('withdrawing either owner approval removes the article from eligible identities',()=>{
  const dir=mkdtempSync(join(tmpdir(),'marketdeck-withdrawal-'));
  try{
    const data=JSON.parse(readFileSync('content/articles/metadata.json','utf8'));
    data.find(r=>r.slug==='investing-book-to-research-workflow').publicationStatus='draft';
    const metadataPath=join(dir,'metadata.json');
    writeFileSync(metadataPath,JSON.stringify(data));
    const inventory=produceWebInventory({...options,metadataPath});
    assert.equal(inventory.records.filter(r=>r.canonical_url==='https://marketdeck.in'+paths[0]&&r.sitemap_eligible).length,0);
  }finally{rmSync(dir,{recursive:true,force:true});}
});
