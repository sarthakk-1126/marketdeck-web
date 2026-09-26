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

