import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { safeUrl, escapeHtml } from '../scripts/build.mjs';

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const data = JSON.parse(readFileSync(new URL('../src/site-data.json', import.meta.url)));
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
const hrefs = [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(match => match[1]);

test('only confirmed application routes are emitted; pending channels are not links', () => {
  assert.deepEqual([...new Set(hrefs.filter(href => !href.startsWith('#')))].sort(), ['/', '/charts/', '/futures-and-options/', '/screener/'].sort());
  assert.equal(data.products.filter(product => product.url == null).length, 2);
  for (const product of data.products.filter(product => product.url == null)) {
    const panel = html.match(new RegExp(`<article[^>]+id="product-${product.id}"[\\s\\S]*?</article>`))[0];
    assert.equal(/<a\b/.test(panel), false);
    assert.match(panel, /Product link coming soon/);
  }
  assert.equal(hrefs.includes('#'), false);
  assert.equal(/mailto:|<form\b|type="email"/.test(html), false);
});

test('all specified community platforms render with accessible pending semantics', () => {
  const platforms = data.community.flatMap(group => group.platforms);
  assert.equal(platforms.length, 25);
  for (const platform of platforms) {
    assert.match(html, new RegExp(escapeHtml(platform.name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.equal(platform.url, null);
  }
  assert.equal((html.match(/class="platform-unavailable"/g) || []).length, 25);
  assert.equal((html.match(/official link coming soon/g) || []).length, 25);
});

test('semantic content and deep links survive without JavaScript', () => {
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.equal(new Set(ids).size, ids.length, 'IDs must be unique');
  for (const href of hrefs.filter(href => href.startsWith('#'))) assert.ok(ids.includes(href.slice(1)), `Missing anchor ${href}`);
  for (const product of data.products) {
    assert.ok(ids.includes(`product-${product.id}`));
    assert.ok(html.includes(escapeHtml(product.description)));
  }
  assert.equal((html.match(/class="article-body"/g) || []).length, 3);
  assert.equal((html.match(/<details class="editorial-card/g) || []).length, 3);
  assert.equal(/class="(?:product-panel|community-panel)[^"]*"[^>]*hidden/.test(html), false);
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
