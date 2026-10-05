// Anonymous, read-only production validation; blocks QA telemetry and never saves a desk.
import {chromium,expect} from '@playwright/test';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const origin='https://marketdeck.in',out='../evidence';
const sha=b=>createHash('sha256').update(b).digest('hex');
const browser=await chromium.launch({headless:true});const results=[];
try{
 for(const width of [1440,1024,390]){
  const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'no-preference'});
  await ctx.route(/google-analytics\.com|googletagmanager\.com|platform\.marketdeck\.in\/analytics\//,r=>r.abort());
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  for(const [name,path] of [['home','/'],['landing','/screener/research-terminal/']]){
   const r=await p.goto(origin+path,{waitUntil:'networkidle',timeout:60000});expect(r.status()).toBe(200);
   const widget=p.locator('[data-rtd-preview]');await widget.scrollIntoViewIfNeeded();await expect(widget).toHaveAttribute('data-rtd-ready','true');
   for(const key of ['fundamentals','valuation','peers','thesis']){await widget.locator(`[data-rtd-select="${key}"]`).click();await expect(widget.locator(`[data-rtd-panel="${key}"]`)).toBeVisible();}
   await widget.locator('[data-rtd-period-select="0"]').click();await expect(widget.locator('[data-rtd-source-period]')).toHaveText('Earlier filing');
   await widget.locator('[data-rtd-select="fundamentals"]').focus();await p.keyboard.press('ArrowRight');await expect(widget).toHaveAttribute('data-rtd-mode','valuation');
   await widget.locator('[data-rtd-select="fundamentals"]').click();await widget.locator('[data-rtd-period-select="2"]').click();
   expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   expect(await p.locator('link[rel=canonical]').count()).toBe(1);expect(await p.locator('h1').count()).toBe(1);
   const canonical=await p.locator('link[rel=canonical]').getAttribute('href');expect(canonical).toBe(origin+path);
   const html=await r.text();expect((html.match(/gtag\('config'/g)||[]).length).toBe(1);
   expect(await p.locator('meta[name=robots][content*=noindex]').count()).toBe(0);
   await p.waitForTimeout(250);await p.locator(name==='home'?'#research-terminal':'.rtd-landing-hero').screenshot({path:out+`/live-${name}-${width}.png`});
   await p.emulateMedia({reducedMotion:'reduce'});await widget.hover();expect(await widget.locator('.rtd-layer-front').evaluate(e=>getComputedStyle(e).transform)).toBe('none');await p.emulateMedia({reducedMotion:'no-preference'});
   results.push({page:name,width,status:r.status(),canonical,bytes:(await r.body()).length,svgCount:await widget.locator('svg').count(),interaction:'PASS',reducedMotion:'PASS',overflow:false});
  }
  await p.locator('.rtd-landing-hero .rtd-primary').click();await p.waitForLoadState('networkidle');expect(p.url()).toBe(origin+'/screener/research-desk/');await expect(p.locator('[data-view="explore"]').first()).toBeVisible();expect(await p.locator('meta[name=robots]').getAttribute('content')).toContain('noindex');expect(await p.locator('link[rel=canonical]').count()).toBe(0);results.push({page:'workspace-handoff',width,noindex:true,canonicalCount:0});
  expect(errors).toEqual([]);await ctx.close();
 }
 const c=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),p=await c.newPage();await p.goto(origin+'/screener/research-terminal/',{waitUntil:'networkidle'});await expect(p.locator('[data-rtd-panel="fundamentals"]')).toBeVisible();await expect(p.locator('[data-rtd-select="valuation"]')).toBeDisabled();results.push({page:'landing-nojs',pass:true});await c.close();
 const request=await browser.newContext();for(const file of ['terminal-discovery.css','terminal-discovery.js']){const r=await request.request.get(origin+'/'+file+'?v=20261005-1');expect(r.status()).toBe(200);const bytes=await r.body(),expected=readFileSync('public/'+file);expect(sha(bytes)).toBe(sha(expected));results.push({asset:file,status:200,bytes:bytes.length,sha256:sha(bytes),exactBytes:true});}await request.close();
 writeFileSync(out+'/production-browser.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close()}
