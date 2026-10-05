import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {terminalPreview, terminalHomepage, TERMINAL_LANDING, TERMINAL_WORKSPACE} from '../scripts/terminal-discovery.mjs';
const read = p => readFileSync(new URL('../'+p, import.meta.url),'utf8');

test('the homepage discovery section has one public landing and a direct desk handoff', () => {
 const html=terminalHomepage();
 assert.equal((html.match(/<section\b/g)||[]).length,1);
 assert.equal((html.match(/<h2\b/g)||[]).length,1);
 assert.ok(html.includes(`href="${TERMINAL_LANDING}"`));
 assert.ok(html.includes(`href="${TERMINAL_WORKSPACE}"`));
 assert.ok(html.includes('Sign in to save a private desk.'));
 assert.ok(!html.includes('?company='));
});
test('all four preview views retain a static first state and no-JS disabled controls',()=>{
 const html=terminalPreview('rt-test');
 assert.equal((html.match(/data-rtd-select=/g)||[]).length,4);
 assert.equal((html.match(/data-rtd-period-select=/g)||[]).length,3);
 assert.equal((html.match(/ disabled/g)||[]).length,7);
 assert.ok(html.includes('data-rtd-panel="fundamentals">'));
 assert.ok(html.includes('data-rtd-panel="valuation" hidden'));
 assert.ok(html.includes('id="rt-test-canvas"'));
 assert.ok(html.includes('Illustrative interface. No live market values or private notes.'));
 assert.throws(()=>terminalPreview('bad"<id'));
});
test('preview uses no financial data, invented company results or private state',()=>{
 const html=terminalPreview();
 for(const token of ['₹','TCS.NS','sessionid','api/research','target price','institutional-grade','AI-powered'])assert.ok(!html.includes(token),token);
 assert.ok(html.includes('Example prompts—not a saved user desk.'));
});
test('preview runtime is local-only progressive enhancement with keyboard support',()=>{
 const js=read('public/terminal-discovery.js');
 for(const forbidden of ['fetch(','XMLHttpRequest','localStorage','sessionStorage','sendBeacon','gtag(','setInterval','requestAnimationFrame'])assert.ok(!js.includes(forbidden),forbidden);
 for(const expected of ['ArrowRight','ArrowLeft','Home','End','button.disabled = false','aria-pressed','panel.hidden','textContent'])assert.ok(js.includes(expected),expected);
});
test('styling aliases both host palettes and never overrides their global roots',()=>{
 const css=read('public/terminal-discovery.css');
 for(const token of ['var(--bg)','var(--blue)','var(--sp-canvas)','var(--sp-brand)','var(--sp-line-mid)','prefers-reduced-motion:reduce','max-width:600px'])assert.ok(css.includes(token),token);
 assert.ok(!css.includes(':root{'));
 assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(css),'no hardcoded palette');
 assert.ok(css.includes('perspective:1100px'));
});
test('homepage inserts a compact flagship between the product suite and Portfolio Analysis',()=>{
 const template=read('src/index.template.html');
 const slot=template.indexOf('{{TERMINAL_SECTION}}');
 assert.ok(slot>template.indexOf('class="suite-overview-section"'));
 assert.ok(slot<template.indexOf('id="portfolio-analysis"'));
 assert.ok(template.includes('href="/screener/research-terminal/">Research Terminal'));
 assert.ok(template.includes('/workspace-showcase.js?v=20261005-books1'));
 const output=read('public/index.html');
 assert.equal((output.match(/id="research-terminal"/g)||[]).length,1);
 assert.equal((output.match(/data-aws-holo(?:[ =])/g)||[]).length,1);
 assert.ok(!output.includes('{{TERMINAL_SECTION}}'));
 assert.equal((output.match(/<link rel="canonical"/g)||[]).length,1);
 assert.equal((output.match(/gtag\('config'/g)||[]).length,1);
});
