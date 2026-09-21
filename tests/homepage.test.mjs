import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { safeUrl, escapeHtml } from '../scripts/build.mjs';
import { confirmedDestinations } from '../scripts/community.mjs';
import { isPublished } from '../scripts/editorial.mjs';

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const data = JSON.parse(readFileSync(new URL('../src/site-data.json', import.meta.url)));
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
const hrefs = [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(match => match[1]);

test('only confirmed application routes are emitted; pending channels are not links', () => {
  assert.deepEqual([...new Set(hrefs.filter(href => /^\/(charts|screener|futures-and-options)\//.test(href)))].sort(), ['/charts/', '/futures-and-options/', '/screener/'].sort());
  assert.equal(data.products.filter(product => product.url == null).length, 2);
  for (const product of data.products.filter(product => product.url == null)) {
    const panel = html.match(new RegExp(`<article[^>]+id="product-${product.id}"[\\s\\S]*?</article>`))[0];
    assert.equal(/<a\b/.test(panel), false);
    assert.match(panel, /Destination link pending/);
  }
  assert.equal(hrefs.includes('#'), false);
  assert.equal(/mailto:|<form\b|type="email"/.test(html), false);
});

test('all specified community platforms render with accessible pending semantics', () => {
  const platforms = data.community.flatMap(group => group.platforms);
  assert.equal(platforms.length, 25);
  for (const platform of platforms) {
    assert.match(html, new RegExp(escapeHtml(platform.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    if(platform.type==='external')assert.equal(platform.url, null);
  }
  assert.equal((html.match(/class="platform-unavailable"/g) || []).length, 24);
  assert.equal((html.match(/planned, not linked/g) || []).length, 24);
  assert.equal(confirmedDestinations(data.community).length,0);
  assert.equal(html.includes('Google Search'),false);
});

test('semantic content and deep links survive without JavaScript', () => {
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.equal(new Set(ids).size, ids.length, 'IDs must be unique');
  for (const href of hrefs.filter(href => href.startsWith('#'))) assert.ok(ids.includes(href.slice(1)), `Missing anchor ${href}`);
  for (const product of data.products) {
    assert.ok(ids.includes(`product-${product.id}`));
    assert.ok(html.includes(escapeHtml(product.description)));
  }
  assert.equal((html.match(/<article class="editorial-card/g) || []).length, 3);
  assert.equal(hrefs.filter(h=>h.startsWith('/intelligence/notes/')).length,3);
  assert.equal(/class="(?:product-panel|community-panel)[^"]*"[^>]*hidden/.test(html), false);
});

test('draft magazine is real and excluded from public output and sitemap',()=>{
  const issue=JSON.parse(readFileSync('content/briefs.json')).issues[0];
  assert.equal(isPublished(issue),false);
  assert.equal(isPublished({...issue,publicationStatus:'published'}),false);
  assert.equal(isPublished({...issue,publicationStatus:'published',approvedAt:'2026-09-22'}),true);
  assert.equal(existsSync(`public/intelligence/issues/${issue.slug}`),false);
  assert.equal(html.includes(issue.pdfPath),false);
  assert.equal(readFileSync('public/sitemap.xml','utf8').includes(issue.slug),false);
  const pdf=readFileSync(`${issue.assets}/marketdeck-brief.pdf`,'latin1');
  assert.ok(pdf.startsWith('%PDF-'));
  assert.equal((pdf.match(/\/Type\s*\/Page\b/g)||[]).length,issue.pageCount);
  const review=readFileSync(`.preview/review/intelligence/issues/${issue.slug}/index.html`,'utf8');
  assert.match(review,/noindex, nofollow/);assert.match(review,/Read in HTML/);
  assert.ok(review.includes(issue.pdfPath));
});

test('community counts only enabled confirmed external joinable URLs, deduplicated',()=>{
  const p={url:'https://example.com/community/',confirmed:true,enabled:true,joinable:true,type:'external'};
  assert.equal(confirmedDestinations([{platforms:[p,{...p,url:'https://example.com/community'},{...p,confirmed:false},{...p,url:'https://example.com/other',enabled:false},{...p,type:'internal'},{...p,joinable:false}]}]).length,1);
});

test('deferred globe maps and real product preview assets are self-hosted',()=>{
  assert.ok(statSync('public/assets/globe.js').size>100000);
  for(const tier of ['2k','4k'])for(const map of ['day','night'])assert.ok(existsSync(`public/assets/earth/${map}-${tier}.webp`));
  for(const p of data.products){assert.ok(existsSync(`public${p.preview}`));assert.ok(existsSync(`public${p.thumbnail}`));}
  assert.equal((html.match(/data-product="/g)||[]).length,5);
  assert.equal(html.includes('/assets/globe.js'),false,'3D code must not block useful HTML');
  assert.equal(/<iframe|<embed|<object/.test(html),false);
});

test('all local visual and script dependencies exist; no third-party runtime requests', () => {
  for (const match of html.matchAll(/\b(?:src|href)="(\/[^"#]+)(?:#[^"]*)?"/g)) {
    const path = match[1];
    if (['/screener/', '/charts/', '/futures-and-options/'].includes(path)) continue;
    assert.ok(existsSync(resolve('public', `.${path}`)), `Missing asset ${path}`);
  }
  assert.equal(/<script[^>]+src="https?:/.test(html), false);
  assert.equal(/<link[^>]+href="https?:[^>]+rel="stylesheet"/.test(html), false);
  assert.ok(statSync('public/assets/india-earth.webp').size < 350_000);
  assert.ok(statSync('public/assets/india-earth-small.webp').size < 120_000);
  assert.ok(statSync('public/assets/mumbai-exchange.webp').size < 120_000);
});

test('metadata and structured data describe the public site without invented metrics', () => {
  assert.match(html, /<link rel="canonical" href="https:\/\/marketdeck\.in\/">/);
  assert.match(html, /name="description" content="[^"]{80,}/);
  const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema['@type'], 'WebSite');
  assert.equal(schema.url, data.brand.url);
  assert.equal('aggregateRating' in schema, false);
  assert.equal(/\{\{\w+\}\}/.test(html), false);
});

test('central destinations reject executable, ambiguous, and HTML-injected URLs', () => {
  for (const url of ['javascript:alert(1)', '//unconfirmed.example', 'http://example.com', '#', '/x"onclick="alert(1)', '/x\\evil', 'data:text/html,x']) assert.throws(() => safeUrl(url));
  assert.equal(safeUrl(null), null);
  assert.equal(safeUrl('/charts/'), '/charts/');
  assert.equal(safeUrl('https://example.com/channel'), 'https://example.com/channel');
  assert.equal(safeUrl('mailto:team@example.com'), 'mailto:team@example.com');
  assert.equal(escapeHtml('<script>"&'), '&lt;script&gt;&quot;&amp;');
});
