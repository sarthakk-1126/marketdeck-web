import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';

const html=readFileSync('public/intelligence/issues/pe-ratio-valuation-india-2026/index.html','utf8');
const sitemap=readFileSync('public/sitemap.xml','utf8');

test('P/E valuation magazine is canonical, source-linked and SEO-ready',()=>{
  assert.match(html,/<title>P\/E Ratio Valuation Guide: Forward P\/E, ROE &amp; Growth \| MarketDeck Intelligence<\/title>/);
  assert.match(html,/rel="canonical" href="https:\/\/marketdeck\.in\/intelligence\/issues\/pe-ratio-valuation-india-2026\/"/);
  assert.match(html,/"@type":"Article"/);
  assert.match(html,/trailing vs forward P\/E, normalized earnings, justified P\/E, ROE, sustainable growth/);
  assert.match(sitemap,/https:\/\/marketdeck\.in\/intelligence\/issues\/pe-ratio-valuation-india-2026\//);
});

test('P/E valuation magazine preserves worked example, figures and internal research links',()=>{
  for(const name of ['figure-04.webp','figure-05.webp','figure-06.webp','figure-08.webp','marketdeck-brief.pdf','cover.webp'])
    assert.ok(existsSync('public/intelligence/issues/pe-ratio-valuation-india-2026/'+name),name);
  assert.match(html,/Forward P\/E = 12×/);
  assert.match(html,/implied sustainable growth rate is approximately 6\.83%/);
  assert.match(html,/Continue your valuation research/);
  assert.match(html,/\/intelligence\/notes\/pe-ratio-vs-earnings-yield\//);
  assert.match(html,/\/screener\//);
});

test('P/E valuation magazine is linked from the Equities learning hub',()=>{
  const equities=readFileSync('public/intelligence/equities/index.html','utf8');
  assert.match(equities,/\/intelligence\/issues\/pe-ratio-valuation-india-2026\//);
  assert.match(equities,/P\/E Ratio Valuation: What a Stock Multiple Is Really Pricing In/);
});
