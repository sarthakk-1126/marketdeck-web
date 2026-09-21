// Actual site recording and local diagnostics. Run against npm run dev:review.
import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='.preview/v2';await mkdir(`${dir}/recording`,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,recordVideo:{dir:`${dir}/recording`,size:{width:1440,height:900}}});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.addInitScript(()=>{
  window.qaMetrics={lcp:0,cls:0,events:[],longTasks:[]};
  new PerformanceObserver(l=>{for(const e of l.getEntries())window.qaMetrics.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
  new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.qaMetrics.cls+=e.value;}).observe({type:'layout-shift',buffered:true});
  new PerformanceObserver(l=>{for(const e of l.getEntries())window.qaMetrics.events.push({name:e.name,duration:e.duration,interactionId:e.interactionId});}).observe({type:'event',buffered:true,durationThreshold:16});
  new PerformanceObserver(l=>{for(const e of l.getEntries())window.qaMetrics.longTasks.push(e.duration);}).observe({type:'longtask',buffered:true});
});
await page.goto('http://127.0.0.1:4173/');
await page.locator('.hero[data-renderer=webgl]').waitFor({timeout:20000});
await page.waitForTimeout(2800);
await page.screenshot({path:`${dir}/settled-hero.png`});
const initial=await page.evaluate(()=>({documentBytes:performance.getEntriesByType('navigation')[0].transferSize,metrics:window.qaMetrics,resources:performance.getEntriesByType('resource').map(r=>({name:r.name,bytes:r.transferSize,decoded:r.decodedBodySize})),intro:document.querySelector('.hero').dataset.intro,canvas:{...document.querySelector('canvas').dataset}}));
for(let i=0;i<24;i++){await page.mouse.move(810+i*19,330+Math.sin(i/6)*90);await page.waitForTimeout(35);}
for(let i=0;i<32;i++){await page.mouse.wheel(0,24);await page.waitForTimeout(40);}
await page.screenshot({path:`${dir}/mid-scroll.png`});
for(let i=0;i<26;i++){await page.mouse.wheel(0,22);await page.waitForTimeout(40);}
await page.evaluate(()=>{const s=document.querySelector('.market-story');scrollTo({top:s.offsetTop+s.offsetHeight-innerHeight,behavior:'instant'});});
await page.waitForTimeout(250);await page.screenshot({path:`${dir}/docking-complete.png`});
await page.locator('#tab-charting').click();await page.waitForTimeout(1000);await page.screenshot({path:`${dir}/product-showcase.png`});
await page.getByRole('link',{name:'The product suite',exact:true}).click();await page.locator('#tab-fno').click();await page.waitForTimeout(1200);
const during=await page.evaluate(()=>({metrics:window.qaMetrics,canvas:{...document.querySelector('canvas')?.dataset},ua:navigator.userAgent,hardwareConcurrency:navigator.hardwareConcurrency,deviceMemory:navigator.deviceMemory}));
for(const id of ['community','intelligence']){await page.locator(`#${id}`).scrollIntoViewIfNeeded();await page.waitForTimeout(350);await page.evaluate(id=>scrollTo({top:document.getElementById(id).offsetTop-90,behavior:'instant'}),id);await page.screenshot({path:`${dir}/${id}.png`});}
await page.locator('.issue-feature').scrollIntoViewIfNeeded();await page.screenshot({path:`${dir}/brief-draft.png`});
const gpu=await page.locator('canvas').evaluate(c=>{const g=c.getContext('webgl2'),ext=g.getExtension('WEBGL_debug_renderer_info');return {renderer:ext?g.getParameter(ext.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER),vendor:ext?g.getParameter(ext.UNMASKED_VENDOR_WEBGL):g.getParameter(g.VENDOR)};});
const video=page.video();await context.close();await video.saveAs(`${dir}/marketdeck-v2-walkthrough.webm`);
const mobile=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const m=await mobile.newPage();await m.goto('http://127.0.0.1:4173/');await m.screenshot({path:`${dir}/mobile-fallback.png`});
const mobileMetrics=await m.evaluate(()=>({renderer:document.querySelector('.hero').dataset.renderer,overflow:document.documentElement.scrollWidth>innerWidth,resources:performance.getEntriesByType('resource').map(r=>({name:r.name,bytes:r.transferSize}))}));
await mobile.close();await browser.close();
await writeFile(`${dir}/performance.json`,JSON.stringify({conditions:'Local loopback, Chromium headless, unthrottled, 1440x900 DPR1; software GPU if indicated. Diagnostics, not field Web Vitals or a physical phone.',initial,during,gpu,mobile:mobileMetrics,errors},null,2));
console.log(JSON.stringify({video:`${dir}/marketdeck-v2-walkthrough.webm`,lcp:initial.metrics.lcp,cls:during.metrics.cls,canvas:during.canvas,gpu,errors},null,2));
