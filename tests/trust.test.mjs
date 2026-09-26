import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

test('research standards page is canonical, substantive and discoverable', () => {
  assert.ok(existsSync('public/research-standards/index.html'));
  const page = readFileSync('public/research-standards/index.html', 'utf8');
  const home = readFileSync('public/index.html', 'utf8');
  const sitemap = readFileSync('public/sitemap.xml', 'utf8');

  assert.match(page, /<link rel="canonical" href="https:\/\/marketdeck\.in\/research-standards\/">/);
  assert.match(page, /Sources and provenance/);
  assert.match(page, /Live, stored, snapshot, historical, stale and unavailable/);
  assert.match(page, /Calculations, definitions and denominators/);
  assert.match(page, /id="methodology-versioning"/);
  assert.match(page, /PRODUCT-METHOD-major\.minor/);
  for (const id of ['SP-METHOD-1.0', 'FO-METHOD-1.0', 'CH-METHOD-1.0', 'CR-METHOD-1.0', 'INT-METHOD-1.0']) assert.match(page, new RegExp(id.replaceAll('.', '\\.')));
  assert.match(page, /Sitemap and Atom dates/);
  assert.match(page, /no date is advanced merely to imply fresh research/);
  assert.match(page, /AI assistance/);
  assert.match(page, /Research, not personalized investment advice/);
  assert.match(page, /Corrections and limitations/);
  assert.doesNotMatch(page, /SEBI-registered research analyst[^<]*MarketDeck/i);
  assert.match(home, /href="\/research-standards\/">Research standards<\/a>/);
  assert.match(sitemap, /https:\/\/marketdeck\.in\/research-standards\//);
});


test('research standards expose the shared public data-state vocabulary', () => {
  const page = readFileSync('public/research-standards/index.html', 'utf8');
  for (const anchor of [
    'data-state-live',
    'data-state-stored',
    'data-state-snapshot',
    'data-state-historical',
    'data-state-stale',
    'data-state-unavailable',
  ]) {
    assert.match(page, new RegExp(`id="${anchor}"`));
  }
  assert.match(page, /“Real time” is a factual latency claim/);
  assert.match(page, /should not silently substitute zero/);
  assert.match(page, /prefers “stored” over the technical word “cached”/);
});

test('Intelligence methodology is canonical, linked and explicit about unavailable calculations', () => {
  assert.ok(existsSync('public/intelligence/methodology/index.html'));
  const page = readFileSync('public/intelligence/methodology/index.html', 'utf8');
  const article = readFileSync('public/intelligence/notes/iv-rank-vs-iv-percentile-nifty-options/index.html', 'utf8');
  const sitemap = readFileSync('public/sitemap.xml', 'utf8');
  assert.match(page, /<link rel="canonical" href="https:\/\/marketdeck\.in\/intelligence\/methodology\/">/);
  assert.match(page, /Simple return \(%\)/);
  assert.match(page, /IV rank/);
  assert.match(page, /remains unavailable/);
  assert.match(page, /INT-METHOD-1\.0/);
  assert.match(page, /Source and provenance register/);
  assert.match(page, /Date and freshness semantics/);
  assert.match(page, /datetime="2026-09-26"/);
  assert.match(page, /methodology-versioning/);
  assert.match(article, /href="\/intelligence\/methodology\/">Calculation methodology<\/a>/);
  assert.match(sitemap, /https:\/\/marketdeck\.in\/intelligence\/methodology\//);
});

