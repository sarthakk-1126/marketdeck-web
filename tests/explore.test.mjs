import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { exploreGroups } from '../scripts/explore.mjs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const priority = new Set([...read('public/priority-sitemap.xml').matchAll(/<loc>https:\/\/marketdeck\.in([^<]+)<\/loc>/g)].map(m => m[1]));

test('every Explore link is a unique key page listed in the priority sitemap', () => {
  const links = exploreGroups().flatMap(([, items]) => items.map(([href]) => href));
  assert.equal(new Set(links).size, links.length, 'duplicate Explore link');
  for (const href of links) assert.ok(priority.has(href), `${href} is not in priority-sitemap.xml`);
});

test('every priority page except Explore itself is reachable from Explore', () => {
  const links = new Set(exploreGroups().flatMap(([, items]) => items.map(([href]) => href)));
  for (const path of priority) if (path !== '/explore/') assert.ok(links.has(path), `${path} missing from Explore`);
});

test('the published Explore page is indexable and linked from the homepage footer', () => {
  const html = read('public/explore/index.html');
  assert.match(html, /<link rel="canonical" href="https:\/\/marketdeck\.in\/explore\/">/);
  assert.doesNotMatch(html, /noindex/);
  assert.match(read('public/index.html'), /<a href="\/explore\/">All guides &amp; tools<\/a>/);
  assert.match(read('src/index.template.html'), /<a href="\/explore\/">All guides &amp; tools<\/a>/);
});
