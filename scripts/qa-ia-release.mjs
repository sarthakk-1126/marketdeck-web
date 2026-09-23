/** Browser release checks. QA-only: npm install --no-save --package-lock=false @axe-core/playwright */
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const origin=process.env.IA_BASE_URL||'http://127.0.0.1:4173';
const output=process.env.IA_QA_DIR||'.preview/ia-final';fs.mkdirSync(output+'/screens',{recursive:true});
const hubs=['equities','technical-analysis','futures-options'];
const newArticles=['pe-ratio-vs-earnings-yield','support-vs-resistance-stock-charts','call-option-vs-put-option-india'];
const metadata=JSON.parse(fs.readFileSync('content/articles/metadata.json','utf8'));
const paths=[...hubs.map(s=>'/intelligence/'+s+'/'),...newArticles.map(s=>'/intelligence/notes/'+s+'/')];
const browser=await chromium.launch({headless:true});
async function openPage(options={}){const context=await browser.newContext(options);return context.newPage();}const report={origin,pages:[],accessibility:[],noJS:[],links:[]};
try {
 for(const path of paths){
  for(const width of [320,390,768,1440,1920]){
   const page=await openPage({viewport:{width,height:1000},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const response=await page.goto(origin+path,{waitUntil:'networkidle'});assert.equal(response.status(),200,path);
   const checks=await page.evaluate(()=>({h1:document.querySelectorAll('h1').length,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,canonical:document.querySelector('link[rel=canonical]')?.href,description:document.querySelector('meta[name=description]')?.content,ids:[...document.querySelectorAll('[id]')].map(n=>n.id),schema:[...document.querySelectorAll('script[type="application/ld+json"]')].map(n=>JSON.parse(n.textContent)),breadcrumb:[...document.querySelectorAll('nav[aria-label="Breadcrumb"] a')].map(n=>n.getAttribute('href')),images:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src)}));
   assert.equal(checks.h1,1,path);assert.ok(checks.overflow<=1,path+' overflow '+width);assert.equal(checks.canonical,'https://marketdeck.in'+path);assert.ok(checks.description?.length>50);assert.equal(new Set(checks.ids).size,checks.ids.length);assert.equal(errors.length,0,errors.join(';'));assert.ok(checks.schema.length>0);assert.deepEqual(checks.breadcrumb.slice(0,2),['/','/intelligence/']);
   if(path.includes('/notes/')){assert.ok(checks.schema[0]['@graph'].some(n=>n['@type']==='Article'));assert.equal(checks.schema[0]['@graph'].find(n=>n['@type']==='BreadcrumbList').itemListElement.length,4);}
   else {assert.ok(checks.schema[0]['@graph'].some(n=>n['@type']==='CollectionPage'));assert.equal(await page.locator('.learning-steps a').count(),3);assert.equal(await page.locator('.learning-start').count(),1);}
   if(width===390||width===1440){
    await page.evaluate(async()=>{for(const img of document.images){img.loading='eager';await img.decode().catch(()=>{});}});
    await page.screenshot({path:output+'/screens/'+path.split('/').filter(Boolean).at(-1)+'-'+width+'.png',fullPage:true});
    const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();report.accessibility.push({path,width,violations:a.violations});
    if(width===1440 && path.includes('/notes/'))await page.locator('.a-figure').screenshot({path:output+'/screens/figure-'+path.split('/').filter(Boolean).at(-1)+'.png'});
   }
   report.pages.push({path,width,status:response.status(),overflow:checks.overflow,canonical:checks.canonical});await page.context().close();
  }
 }
 for(const path of [...metadata.filter(a=>!newArticles.includes(a.slug)).map(a=>'/intelligence/notes/'+a.slug+'/'),'/intelligence/','/intelligence/issues/']){
  for(const width of [390,1440]){const page=await openPage({viewport:{width,height:1000},reducedMotion:'reduce'});const r=await page.goto(origin+path,{waitUntil:'networkidle'});assert.equal(r.status(),200);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));report.pages.push({path,width,status:r.status()});if(path==='/intelligence/')await page.screenshot({path:output+'/screens/library-'+width+'.png',fullPage:true});await page.context().close();}
 }
 const page=await openPage({javaScriptEnabled:false,viewport:{width:390,height:900}});
 for(const path of [...paths,'/intelligence/']){await page.goto(origin+path);assert.ok(await page.locator('main').innerText());assert.ok(await page.locator('main a[href]').count()>3);report.noJS.push(path);}
 await page.context().close();
 const context=await browser.newContext();const linkSet=new Set();
 for(const path of [...paths,...metadata.map(a=>'/intelligence/notes/'+a.slug+'/'),'/intelligence/']){
  const p=await context.newPage();await p.goto(origin+path);
  const refs=await p.locator('a[href]').evaluateAll(ns=>ns.map(n=>n.getAttribute('href')));
  for(const href of refs){const u=new URL(href,origin+path);if(u.origin===new URL(origin).origin&&(u.pathname.startsWith('/intelligence/')||['/screener/','/charts/','/futures-and-options/','/commentary/','/crypto/'].includes(u.pathname)))linkSet.add(u.pathname+u.hash);}
  await p.close();
 }
 for(const href of linkSet){const u=new URL(href,origin);if(!u.pathname.startsWith('/intelligence/')&&origin.includes('127.0.0.1'))continue;const r=await context.request.get(origin+u.pathname);assert.equal(r.status(),200,href);if(u.hash){const text=await r.text();const id=decodeURIComponent(u.hash.slice(1));assert.ok(text.includes('id="'+id+'"'),href+' missing anchor');}report.links.push({href,status:r.status()});}
 await context.close();assert.equal(report.accessibility.flatMap(x=>x.violations).length,0,'Accessibility violations: inspect browser-results.json');report.status='PASS';
} catch(e){report.status='FAIL';report.error=e.stack;throw e;}
finally {fs.writeFileSync(output+'/browser-results.json',JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify({status:report.status,responsiveCases:report.pages.length,axeScans:report.accessibility.length,noJSPages:report.noJS.length,checkedLinks:report.links.length}));
