import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';

const manifest=JSON.parse(readFileSync('content/briefs.json','utf8'));
const issue=manifest.issues.find(i=>i.id==='ai-indian-finance-03');
const source=JSON.parse(readFileSync(issue.source,'utf8'));
const root='public/intelligence/issues/ai-in-indian-finance-2026/';

test('AI in Indian Finance magazine is a published 12-page source-linked edition',()=>{
  assert.equal(issue.pageCount,12);
  assert.equal(issue.pdfEdition,'1.0');
  assert.equal(issue.publicationStatus,'published');
  assert.equal(issue.approvedAt,'2026-09-28');
  assert.equal(issue.publishedAt,'2026-09-28');
  assert.equal(issue.pdfPath,'/intelligence/issues/ai-in-indian-finance-2026/marketdeck-brief-v1.pdf');
  assert.equal(source.pages.length,12);
  assert.equal(source.sources.length,10);
  assert.equal(new Set(source.sources.map(s=>s.id)).size,10);
  const ids=new Set(source.sources.map(s=>s.id));
  for(const page of source.pages)for(const id of page.sourceIds)assert.ok(ids.has(id),id);
  const pdf=readFileSync(root+'marketdeck-brief-v1.pdf');
  assert.deepEqual(pdf,readFileSync(root+'marketdeck-brief.pdf'));
  assert.ok(pdf.length>50000);
  assert.ok(existsSync('public'+issue.cover));
  const qa=JSON.parse(readFileSync('content/issues/ai-in-indian-finance-2026/pdf-qa.json','utf8'));
  assert.deepEqual({pages:qa.pages,links:qa.links,formFields:qa.formFields},{pages:12,links:108,formFields:10});
});
test('AI magazine keeps regulatory status and company metrics scoped correctly',()=>{
  const all=JSON.stringify(source);
  assert.match(all,/draft model-risk guidance/i);
  assert.match(all,/consultation paper, not final regulation/i);
  assert.match(all,/Final SEBI regulation/);
  assert.match(all,/company-reported operating metrics/i);
  assert.match(all,/Rs 5,520 crore/);
  assert.match(all,/69 million application documents/);
  assert.match(all,/52 million voice-to-data conversions/);
  assert.match(all,/5,500 branches/);
  assert.match(all,/100,000 employees/);
  assert.match(all,/expected reduction/i);
  assert.doesNotMatch(all,/guaranteed returns|buy recommendation|sell recommendation/i);
});

test('AI magazine HTML, figures, archive, library and sitemap are public',()=>{
  const html=readFileSync(root+'index.html','utf8');
  assert.match(html,/rel="canonical" href="https:\/\/marketdeck\.in\/intelligence\/issues\/ai-in-indian-finance-2026\/"/);
  assert.doesNotMatch(html,/noindex|EDITORIAL DRAFT/);
  assert.ok(html.includes(issue.pdfPath));
  const figures=source.pages.filter(p=>p.figure);
  assert.equal(figures.length,8);
  for(const page of figures){
    assert.ok(existsSync('public'+page.figure),page.figure);
    assert.ok(html.includes(page.figure),page.figure);
    assert.ok(page.figureAlt&&page.figureCaption);
  }
  for(const id of ['S1','S4','S6','S9'])assert.match(html,new RegExp(`<a href="#${id}">\\[${id}\\]<\\/a>`));
  assert.ok(readFileSync('public/intelligence/library/index.html','utf8').includes(issue.pdfPath));
  assert.ok(readFileSync('public/intelligence/issues/index.html','utf8').includes(issue.pdfPath));
  assert.ok(readFileSync('public/index.html','utf8').includes(issue.cover));
  assert.ok(readFileSync('public/sitemap.xml','utf8').includes('/intelligence/issues/ai-in-indian-finance-2026/'));
});
