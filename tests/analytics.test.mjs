import test from 'node:test';
import assert from 'node:assert/strict';
import { GA4_MEASUREMENT_ID, injectAnalytics, stripAnalytics } from '../scripts/analytics.mjs';

test('injects GA4 once using the canonical URL as page_location', () => {
  const html = '<!doctype html><html><head><link rel="canonical" href="https://marketdeck.in/intelligence/"></head><body></body></html>';
  const once = injectAnalytics(html);
  const twice = injectAnalytics(once);

  assert.match(once, new RegExp(GA4_MEASUREMENT_ID));
  assert.match(once, /page_location: "https:\/\/marketdeck\.in\/intelligence\/"/);
  assert.match(once, /allow_google_signals: false/);
  assert.match(once, /allow_ad_personalization_signals: false/);
  assert.equal((once.match(/googletagmanager\.com\/gtag\/js/g) || []).length, 1);
  assert.equal(twice, once);
  assert.match(once, /#md-analytics-preferences\\s*\\{\\s*position:\\s*static\\s*!important/);
  assert.equal((once.match(/platform\.marketdeck\.in\/analytics\/client(?:\.[a-f0-9]+)?\.js/g) || []).length, 1);
});

test('does not instrument pages without an approved canonical', () => {
  const html = '<!doctype html><html><head><meta name="robots" content="noindex, nofollow"></head><body></body></html>';
  assert.equal(injectAnalytics(html), html);
});

test('rejects a non-MarketDeck canonical', () => {
  const html = '<!doctype html><html><head><link rel="canonical" href="https://example.com/"></head><body></body></html>';
  assert.throws(() => injectAnalytics(html), /Invalid MarketDeck canonical/);
});

test('review cleanup removes the analytics block', () => {
  const html = '<!doctype html><html><head><link rel="canonical" href="https://marketdeck.in/"></head><body></body></html>';
  const tagged = injectAnalytics(html);
  const clean = stripAnalytics(tagged);
  assert.equal(clean, html);
  assert.ok(!clean.includes("analytics/client.js"));
});


test('upgrades an existing canonical analytics block without changing page content', () => {
  const html = '<html><head><link rel="canonical" href="https://marketdeck.in/intelligence/"></head><body>Lens and research stay intact</body></html>';
  const old = injectAnalytics(html).replace('<script defer src="https://platform.marketdeck.in/analytics/client.js"></script>\n', '');
  const upgraded = injectAnalytics(old);
  assert.equal((upgraded.match(/analytics\/client(?:\.[a-f0-9]+)?\.js/g) || []).length, 1);
  assert.equal(stripAnalytics(upgraded), html);
  assert.equal(injectAnalytics(upgraded), upgraded);
});
