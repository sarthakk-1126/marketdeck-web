import {chromium} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {origin,wirePreview} from './terminal-discovery-fixture.mjs';
const browser=await chromium.launch({headless:true});
const raw=[];
try {
 for(const width of [1440,390])for(let round=0;round<6;round++)for(const name of (round%2?['after','before']:['before','after'])) {
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});await wirePreview(context);
  const page=await context.newPage();
  await page.addInitScript(()=>{window.__rtdMetric={lcp:0,cls:0};new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__rtdMetric.lcp=e.startTime)).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)window.__rtdMetric.cls+=e.value})).observe({type:'layout-shift',buffered:true});});
  await page.goto(origin+(name==='before'?'/__baseline__/':'/'),{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(700);
  raw.push({width,round,name,...await page.evaluate(()=>({...window.__rtdMetric,dom:document.querySelectorAll('*').length,overflow:document.documentElement.scrollWidth>innerWidth}))});
  await context.close();
 }
 const median=a=>{const b=a.slice().sort((a,b)=>a-b);return b[Math.floor(b.length/2)]};
 const summary=[1440,390].map(width=>({width,...Object.fromEntries(['before','after'].map(name=>{const a=raw.filter(r=>r.width===width&&r.name===name&&r.round>0);return [name,{medianLcpMs:median(a.map(r=>r.lcp)),maxCls:Math.max(...a.map(r=>r.cls)),dom:a[0].dom,overflow:a.some(r=>r.overflow)}]}))}));
 const bytes={beforeHtml:readFileSync('../evidence/baseline-index.html').length,afterHtml:readFileSync('public/index.html').length,css:readFileSync('public/terminal-discovery.css').length,js:readFileSync('public/terminal-discovery.js').length,cssGzip:gzipSync(readFileSync('public/terminal-discovery.css')).length,jsGzip:gzipSync(readFileSync('public/terminal-discovery.js')).length};
 const result={method:'Local exact-file route fixtures, same assets and viewport; one warmup plus five interleaved observations per condition. No WAN simulation, not field Core Web Vitals.',summary,bytes,raw};
 writeFileSync('../evidence/performance-comparison.json',JSON.stringify(result,null,2));console.log(JSON.stringify({summary,bytes}));
}finally{await browser.close()}
