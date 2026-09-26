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
  assert.match(page, /Live, stored, historical and unavailable/);
  assert.match(page, /Calculations, definitions and denominators/);
  assert.match(page, /AI assistance/);
  assert.match(page, /Research, not personalized investment advice/);
  assert.match(page, /Corrections and limitations/);
  assert.doesNotMatch(page, /SEBI-registered research analyst[^<]*MarketDeck/i);
  assert.match(home, /href="\/research-standards\/">Research standards<\/a>/);
  assert.match(sitemap, /https:\/\/marketdeck\.in\/research-standards\//);
});
