import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const manifest=JSON.parse(readFileSync('content/briefs.json','utf8'));
const issue=manifest.issues.find(i=>i.id==='agentic-trading-frontier-02');
const root='public/intelligence/issues/agentic-trading-frontier-2026/';

test('magazine v2 metadata and the versioned and legacy PDFs agree',()=>{
  assert.equal(issue.pageCount,12);
  assert.equal(issue.pdfEdition,'2.0');
  assert.equal(issue.publicationStatus,'published');
  assert.ok(issue.approvedAt);
  assert.equal(issue.pdfPath,'/intelligence/issues/agentic-trading-frontier-2026/marketdeck-brief-v2.pdf');
  const a=readFileSync(root+'marketdeck-brief-v2.pdf');
  const b=readFileSync(root+'marketdeck-brief.pdf');
  assert.deepEqual(a,b);
  assert.ok(a.length>50000);
  const pdf=a.toString('latin1');
  assert.ok(pdf.startsWith('%PDF-'));
  assert.match(pdf,/\/AcroForm\b/);
  assert.equal((pdf.match(/\/Type\s*\/Page\b/g)||[]).length,12);
  assert.equal((pdf.match(/\/FT\s*\/Tx\b/g)||[]).length,5);
  assert.equal((pdf.match(/\/FT\s*\/Btn\b/g)||[]).length,6);
  assert.doesNotMatch(pdf,/\/JavaScript\b|\/SubmitForm\b/);
});

test('published HTML contains the source-linked manuscript and all eight figures',()=>{
  const source=JSON.parse(readFileSync(issue.source,'utf8'));
  assert.equal(source.pages.length,12);
  assert.equal(new Set(source.sources.map(s=>s.id)).size,7);
  const ids=new Set(source.sources.map(s=>s.id));
  for(const p of source.pages) for(const id of p.sourceIds) assert.ok(ids.has(id));
  const html=readFileSync(root+'index.html','utf8');
  assert.ok(html.includes(issue.pdfPath));
  assert.doesNotMatch(html,/noindex|EDITORIAL DRAFT/);
  const figures=source.pages.filter(p=>p.figure);
  assert.equal(figures.length,8);
  for(const p of figures){assert.ok(existsSync('public'+p.figure));assert.ok(html.includes(p.figure));}
  assert.match(html,/<a href="#S5">\[S5\]<\/a>/);
  assert.ok(existsSync('public'+issue.cover));
  assert.ok(readFileSync('public/index.html','utf8').includes(issue.cover));
  assert.ok(readFileSync('public/intelligence/issues/index.html','utf8').includes(issue.pdfPath));
});

test('magazine chart data retain evidence scope and different denominators',()=>{
  const s=JSON.parse(readFileSync(issue.source,'utf8'));
  assert.equal(s.figures.ablation.units,'percentage points');
  assert.deepEqual(s.figures.ablation.rows.map(r=>r[1]),[-30.65,-14.35,-11.74,2.42,2.95]);
  assert.deepEqual(s.figures.leverage.values,[5,5,5,5,5,5]);
  assert.equal(s.figures.capture.favorableShare,43.2);
  assert.equal(s.figures.capture.lossAmongFavorable,49.3);
  assert.match(JSON.stringify(s),/paper execution at live prices/);
  assert.match(JSON.stringify(s),/live BTC/);
  const old=manifest.issues.find(i=>i.id==='research-foundations-01');
  assert.equal(old.publicationStatus,'draft');
  assert.equal(existsSync('public/intelligence/issues/'+old.slug),false);
});
