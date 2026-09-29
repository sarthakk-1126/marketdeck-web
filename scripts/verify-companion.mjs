import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const base = process.argv.find(v=>v.startsWith('--base='))?.slice(7) || 'http://127.0.0.1:8894';
const out = '.preview/bots';mkdirSync(out,{recursive:true});
const browser = await chromium.launch({headless:true});
const results=[];
try {
  for (const width of [320,390,768,1024,1440]) {
    const page=await browser.newPage({viewport:{width,height:960},reducedMotion:'reduce'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/googletagmanager.com/**',r=>r.abort());
    await page.route('**/google-analytics.com/**',r=>r.abort());
    await page.goto(base+'/',{waitUntil:'domcontentloaded'});
    const section=page.locator('#bots');await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    assert.equal(await section.count(),1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'page overflow at '+width);
    await page.getByRole('tab',{name:'Your Radar',exact:true}).click();
    assert.equal(await page.locator('#bot-preview-radar').isVisible(),true);
    assert.equal(await page.locator('#bot-preview-research').isVisible(),false);
    await page.getByRole('tab',{name:'Your Radar',exact:true}).press('ArrowRight');
    assert.equal(await page.locator('#bot-preview-compare').isVisible(),true);
    assert.match(await page.locator('#bot-preview-compare a').getAttribute('href'),/web_compare_VENTLElORlk$/);
    await page.getByRole('tab',{name:'Compare',exact:true}).press('Home');
    assert.equal(await page.locator('#bot-preview-research').isVisible(),true);
    await page.evaluate(()=>{
      window.__entryEvents=[];window.gtag=(...args)=>window.__entryEvents.push(args);
      document.querySelector('#bots .md-bots-primary').addEventListener('click',e=>e.preventDefault());
    });
    await page.locator('#bots .md-bots-primary').click();
    const events=await page.evaluate(()=>window.__entryEvents);
    assert.equal(events.length,1);assert.equal(events[0][1],'telegram_open');
    assert.equal(events[0][2].placement,'homepage');
    assert.deepEqual(Object.keys(events[0][2]).sort(),['feature','page_location','placement','transport_type']);
    assert.equal(await section.locator('img').evaluateAll(imgs=>imgs.every(img=>img.complete&&img.naturalWidth>0)),true,'icons loaded');
    assert.deepEqual(errors,[]);
    if(width===1440||width===390)await section.screenshot({path:out+'/companion-'+width+'.png',animations:'disabled',style:'.site-header,.product-rail,.skip-link,.motion-toggle{visibility:hidden!important}'});
    results.push({width,overflow:false,tabs:true,keyboard:true,analytics:true,icons:true,errors});
    await page.close();
  }
  const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
  await nojs.route('**/googletagmanager.com/**',r=>r.abort());
  await nojs.goto(base+'/',{waitUntil:'domcontentloaded'});
  assert.equal(await nojs.locator('#bots .md-bots-primary').isVisible(),true);
  assert.match(await nojs.locator('#bots .md-bots-primary').getAttribute('href'),/web_home$/);
  assert.equal(await nojs.locator('#bots [data-bot-tabs]').isVisible(),false);
  results.push({javascript:false,primary_link:true,preview:true});await nojs.close();
  writeFileSync(out+'/browser-results.json',JSON.stringify({status:'PASS',base,results},null,2));
  console.log(JSON.stringify({status:'PASS',base,results}));
} catch(error) {
  writeFileSync(out+'/browser-results.json',JSON.stringify({status:'FAIL',base,error:error.message,results},null,2));throw error;
} finally {await browser.close();}
