import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {workspaceShowcase,LIVE_WORKSPACES} from '../scripts/workspace-showcase.mjs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('compact showcase exposes the live Research Terminal and Learning destinations',()=>{
  const html=workspaceShowcase();
  assert.equal(LIVE_WORKSPACES.length,2);
  assert.ok(html.includes('data-workspace-count="2"'));
  assert.ok(html.includes('data-workspace-slide="research-terminal"'));
  assert.ok(html.includes('data-workspace-slide="books"'));
  assert.ok(html.includes('href="/screener/research-terminal/"'));
  assert.ok(html.includes('href="/screener/research-desk/"'));
  assert.ok(html.includes('href="/screener/learning/books/"'));
  for(const fake of ['Book Strategy','Bots & Coding','Quant Code','Coming soon'])assert.ok(!html.includes(fake),fake);
});

test('both slides have crawlable HTML and original illustrations',()=>{
  const html=workspaceShowcase();
  assert.ok(html.includes('/assets/research-folio.webp'));
  assert.ok(statSync(new URL('../public/assets/research-folio.webp',import.meta.url)).size<220000);
  assert.ok(html.includes('/assets/books-method-atlas.webp'));
  assert.ok(statSync(new URL('../public/assets/books-method-atlas.webp',import.meta.url)).size<160000);
  assert.ok(html.includes('No live data.'));
  assert.ok(!html.includes('aws-footer'));
  assert.equal((html.match(/<h2\b/g)||[]).length,2);
  assert.ok(!html.includes('/screener/static/screener/images/learning/psychology-money.webp'));
  assert.ok(html.includes('Idea → test → apply'));
  assert.ok(html.includes('data-aws-dot="0"'));
  assert.ok(html.includes('data-aws-dot="1"'));
  assert.ok(html.includes('data-aws-current'));
  assert.ok(html.includes('Previous feature'));
  assert.ok(html.includes('Next feature'));
  assert.ok(!html.includes('?company='));
  assert.ok(!html.includes('sessionid'));
  assert.ok(!html.includes('target price'));
  assert.ok(!html.includes('institutional-grade'));
});

test('showcase css is host-token based, compact and motion-safe',()=>{
  const css=read('public/workspace-showcase.css');
  for(const expected of ['var(--bg)','var(--surface)','var(--blue)','min-height:320px','height:140px','prefers-reduced-motion:reduce','motion-paused','awsAtlasFloat','awsAtlasTrace'])assert.ok(css.includes(expected),expected);
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
  assert.ok(template.includes('/workspace-showcase.css?v=20261005-books2'));
  assert.ok(template.includes('/workspace-showcase.js?v=20261005-books2'));
  assert.ok(!template.includes('/terminal-discovery.css?v=20261005-1'));
  assert.ok(!template.includes('/terminal-discovery.js?v=20261005-1'));
  const output=read('public/index.html');
  assert.equal((output.match(/data-advanced-workspaces/g)||[]).length,1);
  assert.equal((output.match(/data-aws-holo(?:[ =])/g)||[]).length,2);
  assert.equal((output.match(/<link rel="canonical"/g)||[]).length,1);
  assert.equal((output.match(/gtag\('config'/g)||[]).length,1);
});

test('folio motion respects visibility, global pause, reduced motion and touch',()=>{
  const classes=()=>{const values=new Set();return {contains:x=>values.has(x),add:x=>values.add(x),toggle:(x,on)=>on?values.add(x):values.delete(x)}};
  const props=new Map(),events=new Map(),mediaEvents=new Map();
  const stage={style:{setProperty:(k,v)=>props.set(k,v)}};
  const folio={classList:classes(),querySelector:()=>stage,addEventListener:(n,cb)=>events.set(n,cb),getBoundingClientRect:()=>({left:0,top:0,width:200,height:100})};
  const reduce={matches:false,addEventListener:(n,cb)=>mediaEvents.set('reduce',cb)};
  const fine={matches:true,addEventListener:(n,cb)=>mediaEvents.set('fine',cb)};
  const doc={hidden:false,body:{classList:classes()},documentElement:{classList:classes()},querySelectorAll:()=>[folio],addEventListener:(n,cb)=>events.set(n,cb)};
  let intersect,mutate;
  class IO{constructor(cb){intersect=cb}observe(){}}
  class MO{constructor(cb){mutate=cb}observe(){}}
  const win={matchMedia:q=>q.includes('prefers-reduced-motion')?reduce:fine,IntersectionObserver:IO,MutationObserver:MO};
  runInNewContext(read('public/workspace-showcase.js'),{window:win,document:doc,IntersectionObserver:IO,MutationObserver:MO});
  assert.ok(!folio.classList.contains('aws-visible'),'offscreen is static');
  intersect([{isIntersecting:true}]);
  assert.ok(folio.classList.contains('aws-visible'));
  events.get('pointermove')({pointerType:'mouse',clientX:200,clientY:0});
  assert.equal(props.get('--aws-ry'),'2.40deg');
  events.get('pointerleave')();
  assert.equal(props.get('--aws-ry'),'0deg');
  events.get('pointermove')({pointerType:'touch',clientX:200,clientY:0});
  assert.equal(props.get('--aws-ry'),'0deg','touch never tilts');
  events.get('animationend')({animationName:'awsPageLift'});
  assert.ok(folio.classList.contains('aws-settled'),'entry becomes static after its first play');
  doc.body.classList.add('motion-paused');mutate();
  assert.ok(!folio.classList.contains('aws-visible'));
  assert.ok(folio.classList.contains('aws-motion-off'));
  doc.body.classList.toggle('motion-paused',false);mutate();
  assert.ok(folio.classList.contains('aws-visible'));
  reduce.matches=true;mediaEvents.get('reduce')();
  assert.ok(!folio.classList.contains('aws-visible'));
  reduce.matches=false;mediaEvents.get('reduce')();
  intersect([{isIntersecting:false}]);
  assert.ok(!folio.classList.contains('aws-visible'));
  assert.ok(folio.classList.contains('aws-entered'),'entrance remains marked for no replay');
  intersect([{isIntersecting:true}]);
  doc.hidden=true;events.get('visibilitychange')();
  assert.ok(!folio.classList.contains('aws-visible'),'hidden tab is static');
});
