import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Google's robots.txt semantics for the `User-agent: *` group: the longest
// matching rule wins and Allow wins a tie. `*` matches any run of characters.
const robots = readFileSync(new URL('../public/robots.txt', import.meta.url), 'utf8');
const rules = [];
let inStar = false;
for (const raw of robots.split('\n')) {
  const line = raw.replace(/#.*/, '').trim();
  const [key, ...rest] = line.split(':');
  const value = rest.join(':').trim();
  if (/^user-agent$/i.test(key)) inStar = value === '*';
  else if (inStar && /^(allow|disallow)$/i.test(key) && value) rules.push({ allow: /^allow$/i.test(key), path: value });
}
const toRegex = path => new RegExp('^' + path.split('*').map(p => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*'));
function allowed(path) {
  let best = null;
  for (const rule of rules) {
    if (!toRegex(rule.path).test(path)) continue;
    if (!best || rule.path.length > best.path.length || (rule.path.length === best.path.length && rule.allow)) best = rule;
  }
  return !best || best.allow;
}

test('public acquisition pages stay crawlable', () => {
  for (const path of [
    '/', '/intelligence/', '/screener/', '/screener/portfolio-analysis/', '/screener/companies/?page=2',
    '/screener/company/ONGC.NS/', '/screener/company/ONGC.NS/statement/cash-flow/', '/screener/company/ONGC.NS/peers/',
    '/screener/funds/133796/', '/screener/funds/?page=168', '/screener/screener/?screen=piotroski&page=6',
    '/screener/learning/books/black-swan/', '/screener/research-terminal/', '/charts/ONGC.NS/', '/crypto/coins/bitcoin/',
  ]) assert.ok(allowed(path), `${path} must remain crawlable`);
});

test('account, preference and state-changing routes are not crawled', () => {
  for (const path of [
    '/screener/portfolio/metrics/', '/screener/watchlist/',
    '/screener/company/ONGC.NS/export/csv/', '/screener/company/ONGC.NS/notes/add/', '/screener/research-desk/state/',
  ]) assert.ok(!allowed(path), `${path} should be disallowed`);
});

test('priority sitemap lists unique, crawlable, clean marketdeck.in pages', () => {
  const xml = readFileSync(new URL('../public/priority-sitemap.xml', import.meta.url), 'utf8');
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  assert.ok(locs.length >= 100, 'priority set should cover the key landings');
  assert.equal(new Set(locs).size, locs.length, 'no duplicate URLs');
  for (const loc of locs) {
    const url = new URL(loc);
    assert.equal(url.origin, 'https://marketdeck.in');
    assert.ok(url.pathname.endsWith('/'), `${loc} must use the trailing-slash canonical`);
    assert.ok(!url.search || /^\?screen=[a-z0-9_]+$/.test(url.search), `${loc} carries a non-canonical query`);
    assert.ok(allowed(url.pathname + url.search), `${loc} is blocked by robots.txt`);
  }
  for (const key of ['https://marketdeck.in/', 'https://marketdeck.in/intelligence/', 'https://marketdeck.in/screener/portfolio-analysis/', 'https://marketdeck.in/screener/learning/books/'])
    assert.ok(locs.includes(key), `${key} missing`);
});

test('already-indexed redirect URLs stay crawlable so Google can drop them', () => {
  for (const path of [
    '/screener/prefs/currency-unit/billion/?next=/screener/company/IGL.NS/', '/screener/register/?next=/screener/',
    '/screener/accounts/login/?next=/screener/funds/1/',
  ]) assert.ok(allowed(path), `${path} must stay crawlable until Google drops it`);
});

test('sitemaps stay declared and model-training opt-outs remain', () => {
  assert.match(robots, /^Sitemap: https:\/\/marketdeck\.in\/sitemap\.xml$/m);
  assert.match(robots, /^Sitemap: https:\/\/marketdeck\.in\/priority-sitemap\.xml$/m);
  assert.match(robots, /User-agent: GPTBot\nDisallow: \//);
  assert.match(robots, /User-agent: Google-Extended\nAllow: \//);
});
