import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { screenedCompanies, expiryPayoff, sampleDate, priceSeries, volumeSeries, cryptoSeries } from '../public/product-preview-model.js';

test('sample screening changes both the metric and ordering, without mutating the fixture', () => {
  assert.deepEqual(screenedCompanies('growth').map(c => c.name), ['Apex Motors', 'Nova Healthcare', 'Zenith Consumer']);
  assert.deepEqual(screenedCompanies('quality').map(c => c.name), ['Zenith Consumer', 'Nova Healthcare', 'Apex Motors']);
  assert.deepEqual(screenedCompanies('debt').map(c => c.debt), [.1, .3, .6]);
  assert.equal(screenedCompanies('growth')[0].growth, 24);
});

test('expiry examples account for premium, strike, capped covered-call gains and underlying loss', () => {
  assert.equal(expiryPayoff('call', 150), -20);
  assert.equal(expiryPayoff('call', 250), -20);
  assert.equal(expiryPayoff('call', 270), 0);
  assert.equal(expiryPayoff('call', 350), 80);
  assert.equal(expiryPayoff('put', 150), 80);
  assert.equal(expiryPayoff('put', 230), 0);
  assert.equal(expiryPayoff('put', 350), -20);
  assert.equal(expiryPayoff('covered', 150), -80);
  assert.equal(expiryPayoff('covered', 230), 0);
  assert.equal(expiryPayoff('covered', 250), 20);
  assert.equal(expiryPayoff('covered', 350), 20);
});

test('bundled demo charts contain finite samples within the labelled dates', () => {
  for (const series of [priceSeries, volumeSeries, ...Object.values(cryptoSeries)]) {
    assert.equal(series.length, 64);
    assert.ok(series.every(v => Number.isFinite(v) && v > 0));
  }
  assert.equal(sampleDate(0), '01 Jul');
  assert.equal(sampleDate(63), '30 Sep');
  assert.notDeepEqual(cryptoSeries.btc, cryptoSeries.eth);
});

test('homepage previews are scoped, labelled examples and start hidden with disabled controls', () => {
  const html = readFileSync('public/index.html', 'utf8');
  assert.equal((html.match(/data-product-preview=/g) || []).length, 5);
  assert.equal((html.match(/data-product-preview="[^"]+" hidden/g) || []).length, 5);
  assert.match(html, /Sample data · fictional companies/);
  assert.match(html, /Illustrative transcript · fictional source/);
  assert.match(html, /Demo · strike ₹250 · premium ₹20/);
  const js = readFileSync('public/product-previews.js', 'utf8');
  assert.doesNotMatch(js, /\bfetch\(|setInterval\(|localStorage|sessionStorage/);
  assert.match(js, /ArrowLeft/);
  assert.match(js, /ResizeObserver/);
});
