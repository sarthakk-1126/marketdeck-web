/** Bounded responsive QA using the existing approved local capture harness runtime. */
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const require=createRequire(resolve(process.env.MARKETDECK_QA_DEPENDENCIES||'package.json'));
const {chromium}=require('@playwright/test');
const base=process.argv[2]||'http://127.0.0.1:4173';
const out=resolve(process.argv[3]||'.evidence/browser');mkdirSync(out,{recursive:true});
const path='/intelligence/notes/when-var-methods-disagree/';
const browser=await chromium.launch({headless:true});const runs=[];
try{
 for(const [name,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
  // QA must not send an analytics page view or depend on third-party delivery.
  await context.route(/googletagmanager\.com|google-analytics\.com/,r=>r.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(base+path,{waitUntil:'networkidle'});
  await page.screenshot({path:resolve(out,name+'-hero.png')});
  await page.locator('#figure-thresholds').scrollIntoViewIfNeeded();
  await page.locator('#figure-thresholds').screenshot({path:resolve(out,name+'-figure.png')});
  await page.locator('#figure-breaches').scrollIntoViewIfNeeded();
  await page.locator('#figure-breaches').screenshot({path:resolve(out,name+'-breaches.png')});
  const state=await page.evaluate(()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth,
   canonical:document.querySelector('link[rel="canonical"]')?.href,
   ga4:document.documentElement.innerHTML.match(/gtag\('config'/g)?.length??0,
   figures:[...document.querySelectorAll('figure img')].map(i=>({complete:i.complete,naturalWidth:i.naturalWidth})),
   rows:document.querySelectorAll('[data-result]').length,
   reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,
   links:[...document.querySelectorAll('a[href^="#"]')].every(a=>document.getElementById(a.hash.slice(1)))}));
  if(response.status()!==200||state.documentWidth>width||state.ga4!==1||!state.links||errors.length||state.figures.some(i=>!i.complete||!i.naturalWidth))throw Error('Browser acceptance failed: '+JSON.stringify({name,status:response.status(),state,errors}));
  runs.push({name,status:response.status(),...state,jsErrors:errors});await context.close();
 }
 const bytes=[];
 const request=await browser.newContext();
 for(const file of ['var-thresholds.svg','var-breaches.svg','var-thresholds-mobile.svg','var-breaches-mobile.svg']){
  const response=await request.request.get(base+'/assets/research/'+file);const body=await response.body();
  const local=readFileSync('public/assets/research/'+file);
  if(response.status()!==200||!body.equals(local))throw Error('Figure asset byte mismatch '+file);
  bytes.push({file,sha256:createHash('sha256').update(body).digest('hex'),bytes:body.length});
 }
 await request.close();
 writeFileSync(resolve(out,'acceptance.json'),JSON.stringify({base,runs,figureBytes:bytes},null,2)+'\n');
 console.log(JSON.stringify({base,runs,figureBytes:bytes}));
}finally{await browser.close();}
