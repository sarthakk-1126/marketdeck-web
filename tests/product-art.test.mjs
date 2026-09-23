import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';

const data=JSON.parse(readFileSync('src/site-data.json','utf8'));
const html=readFileSync('public/index.html','utf8');
const root='public/assets/products/editorial-v2/';
const manifest=JSON.parse(readFileSync(root+'asset-manifest.json','utf8'));

test('all five products have truthful original illustrations and 1x/2x thumbnails',()=>{
  assert.deepEqual(data.products.map(p=>p.id),['stockproof','charting','fno','commentary','crypto']);
  for(const p of data.products){
    assert.equal(p.previewKind,'Original editorial illustration');
    for(const key of ['preview','thumbnail','thumbnail2x']){
      assert.ok(p[key].startsWith('/assets/products/editorial-v2/'));
      assert.ok(existsSync('public'+p[key]));
    }
    assert.ok(html.includes(`srcset="${p.thumbnail} 1x, ${p.thumbnail2x} 2x"`));
    assert.ok(html.includes(`data-preview-src="${p.preview}"`));
  }
  assert.equal((html.match(/Original editorial illustration\. Preview only\./g)||[]).length,5);
});

test('all exported artwork matches its integrity manifest and transfer budgets',()=>{
  assert.equal(Object.keys(manifest.files).length,15);
  let total=0;
  for(const [name,entry] of Object.entries(manifest.files)){
    const bytes=readFileSync(root+name);total+=bytes.length;
    assert.equal(bytes.toString('ascii',0,4),'RIFF');
    assert.equal(bytes.toString('ascii',8,12),'WEBP');
    assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256);
    assert.equal(bytes.length,entry.bytes);
    const size=name.includes('@2x')?[1040,580]:name.includes('-small')?[520,290]:[1400,800];
    assert.deepEqual(entry.size,size);
    assert.ok(bytes.length <= (name.includes('@2x')?100000:name.includes('-small')?35000:160000));
  }
  assert.equal(total,manifest.totalBytes);assert.ok(total<1000000);
});

test('artwork remains self-hosted and does not misrepresent application screenshots',()=>{
  assert.ok(!html.includes('Historical interface capture'));
  assert.ok(!html.includes('dnznrvs05pmza.cloudfront.net'));
  assert.ok(!html.includes('_jwt='));
  assert.match(readFileSync('public/credits/index.html','utf8'),/original AI-assisted editorial illustrations/);
  assert.match(readFileSync('public/home.css','utf8'),/\.product-tab img\s*\{\s*object-position:\s*center;/);
});
