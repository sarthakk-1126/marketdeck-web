import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {workspaceShowcase,LIVE_WORKSPACES} from '../scripts/workspace-showcase.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('compact showcase exposes only the real live workspace',()=>{
  const html=workspaceShowcase();
  assert.equal(LIVE_WORKSPACES.length,1);
  assert.ok(html.includes('data-workspace-count="1"'));
  assert.ok(html.includes('data-workspace-slide="research-terminal"'));
  assert.ok(html.includes('href="/screener/research-terminal/"'));
  assert.ok(html.includes('href="/screener/research-desk/"'));
  for(const fake of ['Book Strategy','Bots & Coding','Quant Code','Coming soon'])assert.ok(!html.includes(fake),fake);
});

test('contained hologram has a central research core and bounded satellites',()=>{
  const html=workspaceShowcase();
  for(const cls of ['aws-core','aws-fundamentals','aws-value','aws-peers','aws-thesis','aws-source','aws-platform'])assert.ok(html.includes(cls),cls);
  assert.equal((html.match(/<h2\b/g)||[]).length,1);
  assert.ok(!html.includes('?company='));
  assert.ok(!html.includes('sessionid'));
  assert.ok(!html.includes('target price'));
  assert.ok(!html.includes('institutional-grade'));
});

test('showcase css is host-token based, compact and motion-safe',()=>{
  const css=read('public/workspace-showcase.css');
  for(const expected of ['var(--bg)','var(--surface)','var(--blue)','height:312px','min-height:366px','height:218px','prefers-reduced-motion:reduce','motion-paused'])assert.ok(css.includes(expected),expected);
  assert.ok(css.includes('overflow:hidden'));
  assert.ok(css.includes('perspective:1200px'));
  assert.ok(!css.includes(':root{'));
  assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(css),'no hardcoded colors');
});

test('3d runtime is local-only and has no continuous render loop',()=>{
  const js=read('public/workspace-showcase.js');
  for(const forbidden of ['fetch(','XMLHttpRequest','localStorage','sessionStorage','sendBeacon','gtag(','setInterval','requestAnimationFrame'])assert.ok(!js.includes(forbidden),forbidden);
  for(const expected of ['pointermove','pointerleave','prefers-reduced-motion','motion-paused','--aws-rx','--aws-ry'])assert.ok(js.includes(expected),expected);
});

test('homepage loads only the compact showcase assets',()=>{
  const template=read('src/index.template.html');
  assert.ok(template.includes('/workspace-showcase.css?v=20261005-1'));
  assert.ok(template.includes('/workspace-showcase.js?v=20261005-1'));
  assert.ok(!template.includes('/terminal-discovery.css?v=20261005-1'));
  assert.ok(!template.includes('/terminal-discovery.js?v=20261005-1'));
  const output=read('public/index.html');
  assert.equal((output.match(/data-advanced-workspaces/g)||[]).length,1);
  assert.equal((output.match(/data-aws-holo(?:[ =])/g)||[]).length,1);
  assert.equal((output.match(/<link rel="canonical"/g)||[]).length,1);
  assert.equal((output.match(/gtag\('config'/g)||[]).length,1);
});
