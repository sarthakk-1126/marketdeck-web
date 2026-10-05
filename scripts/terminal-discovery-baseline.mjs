import {chromium} from '@playwright/test';
import {writeFileSync,mkdirSync} from 'node:fs';
const out='../evidence'; mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
try {
 for(const width of [1440,1024,390]) {
  const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  await ctx.route(/google-analytics\.com|googletagmanager\.com|platform\.marketdeck\.in\/analytics\//,r=>r.abort());
  const page=await ctx.newPage(), errors=[]; page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__qa={lcp:0,cls:0}; new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__qa.lcp=e.startTime)).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)window.__qa.cls+=e.value})).observe({type:'layout-shift',buffered:true});});
  const r=await page.goto('https://marketdeck.in/',{waitUntil:'networkidle',timeout:45000});
  await page.waitForTimeout(800);
  const metrics=await page.evaluate(()=>({...window.__qa,dom:document.querySelectorAll('*').length,overflow:document.documentElement.scrollWidth>innerWidth,headings:[...document.querySelectorAll('h1,h2')].map(e=>e.textContent.trim())}));
  results.push({page:'homepage',width,status:r.status(),bytes:(await r.body()).length,...metrics,errors});
  await page.screenshot({path:out+`/baseline-home-${width}.png`,fullPage:false});
  if(width===1440){await page.locator('#portfolio-analysis').scrollIntoViewIfNeeded();await page.screenshot({path:out+'/baseline-portfolio-1440.png'});}
  await page.goto('https://marketdeck.in/screener/research-desk/?company=TCS.NS',{waitUntil:'networkidle',timeout:45000});
  await page.waitForTimeout(1000);
  const modes=[];
  for(const key of ['explore','charts','valuation','derivatives','peers','scenarios','changes','thesis','notes']){
    const el=page.locator(`[data-view="${key}"]`).first();if(await el.count()){await el.click();await page.waitForTimeout(250);modes.push({key,visible:true});}
  }
  results.push({page:'workspace',width,modes,noindex:await page.locator('meta[name=robots]').getAttribute('content'),canonical:await page.locator('link[rel=canonical]').count(),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});
  await page.locator('[data-view="explore"]').first().click();await page.screenshot({path:out+`/baseline-workspace-${width}.png`});
  await ctx.close();
 }
 writeFileSync(out+'/baseline-browser.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}
