// Loopback candidate QA. Analytics requests are blocked; no account writes occur.
import {chromium, expect} from '@playwright/test';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {origin,wirePreview} from './terminal-discovery-fixture.mjs';
const out='../evidence';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const all=[];
try{
 for(const width of [1440,1024,390]){
  const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'no-preference'});
  await wirePreview(ctx);
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const [name,path] of [['home','/'],['landing','/screener/research-terminal/']]){
   const response=await page.goto(origin+path,{waitUntil:'networkidle',timeout:45000});
   expect(response.status()).toBe(200);
   const scope=page.locator('[data-rtd-preview]');await scope.scrollIntoViewIfNeeded();
   await expect(scope).toHaveAttribute('data-rtd-ready','true');
   for(const mode of ['fundamentals','valuation','peers','thesis']){
    await scope.locator(`[data-rtd-select="${mode}"]`).click();
    await expect(scope.locator(`[data-rtd-panel="${mode}"]`)).toBeVisible();
    expect(await scope.locator('[data-rtd-panel]:visible').count()).toBe(1);
   }
   await scope.locator('[data-rtd-period-select="0"]').click();
   await expect(scope.locator('[data-rtd-source-period]')).toHaveText('Earlier filing');
   await scope.locator('[data-rtd-select="fundamentals"]').focus();await page.keyboard.press('ArrowRight');
   await expect(scope).toHaveAttribute('data-rtd-mode','valuation');
   await page.keyboard.press('End');await expect(scope).toHaveAttribute('data-rtd-mode','thesis');
   await scope.locator('[data-rtd-select="fundamentals"]').click();
   await scope.locator('[data-rtd-period-select="2"]').click();
   await page.waitForTimeout(500);
   const metrics=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,canonical:[...document.querySelectorAll('link[rel=canonical]')].map(e=>e.href),h1:document.querySelectorAll('h1').length,ga4:(document.documentElement.outerHTML.match(/gtag\('config'/g)||[]).length,sectionHeight:document.querySelector('.rtd-home,.rtd-landing-hero').getBoundingClientRect().height,previewWidth:document.querySelector('.rtd-preview').getBoundingClientRect().width,accent:getComputedStyle(document.querySelector('.rtd-surface')).getPropertyValue('--rtd-accent').trim(),svg:[...document.querySelectorAll('.rtd-preview svg')].map(e=>e.namespaceURI)}));
   expect(metrics.overflow).toBe(false);expect(metrics.h1).toBe(1);expect(metrics.canonical.length).toBe(1);expect(metrics.ga4).toBe(1);
   expect(metrics.previewWidth).toBeLessThan(width);expect(metrics.svg.every(n=>n==='http://www.w3.org/2000/svg')).toBe(true);
   const target=page.locator(name==='home'?'#research-terminal':'.rtd-landing-hero');
   await target.screenshot({path:out+`/candidate-${name}-${width}.png`});
   if(name==='landing')await page.locator('.rtd-landing').screenshot({path:out+`/candidate-landing-full-${width}.png`});
   await page.emulateMedia({reducedMotion:'reduce'});await scope.hover();
   expect(await scope.locator('.rtd-layer-front').evaluate(e=>getComputedStyle(e).transform)).toBe('none');
   await page.emulateMedia({reducedMotion:'no-preference'});
   all.push({name,width,status:response.status(),bytes:(await response.body()).length,...metrics});
  }
  await page.goto(origin+'/screener/',{waitUntil:'networkidle'});
  await expect(page.locator('.rtd-bridge a')).toHaveAttribute('href','/screener/research-terminal/');
  await page.locator('.rtd-bridge').screenshot({path:out+`/candidate-screener-bridge-${width}.png`});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect(errors).toEqual([]);all.push({name:'console-errors',width,errors});
  await ctx.close();
 }
 const nojs=await browser.newContext({viewport:{width:390,height:844},javaScriptEnabled:false});
 await wirePreview(nojs);
 const page=await nojs.newPage();
 for(const path of ['/','/screener/research-terminal/']){
  await page.goto(origin+path,{waitUntil:'networkidle'});
  await expect(page.locator('[data-rtd-panel="fundamentals"]')).toBeVisible();
  await expect(page.locator('[data-rtd-select="valuation"]')).toBeDisabled();
  expect(await page.locator('.rtd-actions a').first().getAttribute('href')).toMatch(/\/screener\/research-(terminal|desk)\//);
  all.push({name:'no-javascript',path,pass:true});
 }
 await nojs.close();
 writeFileSync(out+'/candidate-browser.json',JSON.stringify(all,null,2));console.log(JSON.stringify(all));
}finally{await browser.close();}
