import {test,expect} from '@playwright/test';
test('refined Earth shaders compile and respect a limited texture device',async({page})=>{
  const errors=[],maps=[];
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('request',r=>{if(r.url().includes('/assets/earth/'))maps.push(r.url());});
  await page.addInitScript(()=>{
    const original=WebGL2RenderingContext.prototype.getParameter;
    WebGL2RenderingContext.prototype.getParameter=function(key){return key===this.MAX_TEXTURE_SIZE?2048:original.call(this,key)};
  });
  await page.goto('/');
  await expect(page.locator('.hero')).toHaveAttribute('data-renderer','webgl');
  await expect(page.locator('canvas')).toHaveAttribute('data-material','earth-photographic');
  await expect(page.locator('canvas')).toHaveAttribute('data-texture-tier','2k');
  expect(maps.some(u=>u.endsWith('/cloud-ocean-2k.webp'))).toBe(true);
  expect(maps.some(u=>u.includes('4k'))).toBe(false);
  expect(errors).toEqual([]);
});
test('full product previews load on demand and the selected image is real',async({page})=>{
  const requests=[];page.on('request',r=>{if(/\/assets\/products\/[^/]+\.webp$/.test(r.url())&&!r.url().includes('-small'))requests.push(r.url());});
  await page.goto('/');await expect(page.locator('.hero')).toHaveAttribute('data-renderer','webgl');
  expect(requests).toEqual([]);
  await page.getByRole('link',{name:'Explore the suite',exact:true}).click();
  await page.locator('#tab-charting').click();
  await expect.poll(()=>page.locator('#product-charting img[data-preview-src]').evaluate(i=>i.naturalWidth)).toBeGreaterThan(0);
  expect(requests.some(u=>u.endsWith('/charting.webp'))).toBe(true);
  expect(requests.some(u=>u.endsWith('/commentary.webp')||u.endsWith('/crypto.webp'))).toBe(false);
});
const hero=page=>page.locator('.hero');
const progress=page=>page.locator('.market-story').getAttribute('data-progress');
async function scrollStory(page,p){await page.evaluate(p=>{const el=document.querySelector('.market-story');window.scrollTo({top:el.offsetTop+(el.offsetHeight-innerHeight)*p,behavior:'instant'});},p);await expect.poll(async()=>Number(await progress(page))).toBeCloseTo(p,2);}

test('first useful paint and CTA work while WebGL module is blocked',async({page})=>{
  await page.route('**/assets/globe.js',route=>route.abort());await page.goto('/');
  await expect(page.getByRole('heading',{level:1})).toBeVisible();await expect(page.locator('.earth-image')).toBeVisible();
  await page.getByRole('link',{name:'Explore the suite',exact:true}).click();
  await expect.poll(()=>progress(page)).toBe('1.000');await expect(page.locator('#tab-stockproof')).toBeVisible();
  await expect(hero(page)).toHaveAttribute('data-renderer','failed');
});
test('real 3D sphere path, bounded buffer, session return and early input',async({page})=>{
  await page.goto('/');await expect(hero(page)).toHaveAttribute('data-renderer','webgl');
  await expect(page.locator('canvas')).toHaveAttribute('data-engine',/three.js/);
  expect(await page.locator('canvas').evaluate(c=>c.width*c.height)).toBeLessThanOrEqual(1600000);
  await page.reload();await expect(hero(page)).toHaveAttribute('data-intro','return');
  await page.mouse.wheel(0,200);await expect(hero(page)).toHaveAttribute('data-interrupted','true');
});
test('early click skips late entrance without losing the destination',async({page})=>{
  await page.route('**/assets/globe.js',async route=>{await new Promise(r=>setTimeout(r,2300));await route.continue();});
  await page.goto('/');await page.getByRole('link',{name:'Explore the suite',exact:true}).click();
  await expect.poll(()=>progress(page)).toBe('1.000');await expect(hero(page)).toHaveAttribute('data-intro','skipped');
});
test('shared forward, reverse and fast scroll dock the same five elements',async({page})=>{
  await page.goto('/');await expect(hero(page)).toHaveAttribute('data-renderer','webgl');
  const ids=await page.locator('[data-product]').evaluateAll(nodes=>nodes.map(n=>n.id));
  await scrollStory(page,.52);await expect(page.locator('.story-gallery')).toHaveAttribute('inert','');
  expect(await page.locator('#tab-stockproof').evaluate(el=>getComputedStyle(el).transform)).not.toBe('none');
  await scrollStory(page,1);await expect(page.locator('.story-gallery')).not.toHaveAttribute('inert','');
  expect(await page.locator('#tab-stockproof').evaluate(el=>getComputedStyle(el).transform)).toBe('none');
  expect(await page.locator('[data-product]').evaluateAll(nodes=>nodes.map(n=>n.id))).toEqual(ids);
  await scrollStory(page,.32);await scrollStory(page,1);expect(await page.locator('[data-product]').count()).toBe(5);
});
test('motion off mid-story collapses the spacer and leaves usable gallery',async({page})=>{
  await page.goto('/');await scrollStory(page,.6);await page.getByRole('button',{name:'Disable motion',exact:true}).click();
  await expect(page.locator('.market-story')).not.toHaveClass(/story-enabled/);
  await expect(page.locator('.story-gallery')).not.toHaveAttribute('inert','');
  await expect(page.locator('#tab-charting')).toBeVisible();
  await page.locator('#tab-charting').click();await expect(page.locator('#product-charting')).toBeVisible();
  await page.reload();await expect(page.locator('.market-story')).not.toHaveClass(/story-enabled/);
});
test('OS reduced motion has no travel and responds to preference changes',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
  await expect(page.locator('.market-story')).not.toHaveClass(/story-enabled/);
  await expect(page.locator('body')).toHaveClass(/motion-paused/);
  await page.emulateMedia({reducedMotion:'no-preference'});await expect(page.locator('.market-story')).toHaveClass(/story-enabled/);
});
test('context loss exposes the poster without breaking product controls',async({page})=>{
  await page.goto('/');await expect(hero(page)).toHaveAttribute('data-renderer','webgl');
  await page.locator('canvas').evaluate(c=>c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await expect(hero(page)).toHaveAttribute('data-renderer','context-lost');await expect(page.locator('canvas')).toHaveCount(0);
  expect(await page.locator('.earth-scene picture').evaluate(e=>getComputedStyle(e).opacity)).toBe('1');
  await page.getByRole('link',{name:'Explore the suite',exact:true}).click();await expect.poll(()=>progress(page)).toBe('1.000');
});
test('texture failure, storage denial and WebGL denial preserve HTML',async({browser})=>{
  for(const mode of ['texture','storage','webgl']){
    const context=await browser.newContext({viewport:{width:1440,height:900}});const page=await context.newPage();
    if(mode==='texture')await page.route('**/assets/earth/*',r=>r.abort());
    if(mode==='storage')await page.addInitScript(()=>{Storage.prototype.getItem=()=>{throw new Error('denied')};Storage.prototype.setItem=()=>{throw new Error('denied')};});
    if(mode==='webgl')await page.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.includes('webgl')?null:get.call(this,type,...args)};});
    await page.goto('/');await expect(page.getByRole('heading',{level:1})).toBeVisible();
    await expect(hero(page)).toHaveAttribute('data-renderer',mode==='storage'?'webgl':'failed');await context.close();
  }
});
test('slow initialization times out to a functional poster story',async({page})=>{
  await page.route('**/assets/globe.js',async route=>{await new Promise(r=>setTimeout(r,14000));await route.abort();});
  await page.goto('/');await expect(hero(page)).toHaveAttribute('data-renderer','timeout',{timeout:15000});
  await page.getByRole('link',{name:'Explore the suite',exact:true}).click();await expect.poll(()=>progress(page)).toBe('1.000');
  await page.locator('#tab-fno').click();await expect(page.locator('#product-fno')).toBeVisible();
});
test('five selections, keyboard roving focus and configured destinations',async({page})=>{
  await page.goto('/#products');await expect.poll(()=>progress(page)).toBe('1.000');
  for(const id of ['stockproof','charting','fno','commentary','crypto']){
    await page.getByRole('link',{name:'The product suite',exact:true}).click();
    await page.locator(`#tab-${id}`).click();await expect(page.locator(`#product-${id}`)).toBeVisible();
    await expect(page.locator(`#tab-${id}`)).toHaveAttribute('aria-selected','true');
    await expect(page.locator(`#product-${id}`)).toBeFocused();
  }
  await page.locator('.product-rail a[href="#product-charting"]').click();
  await expect(page.locator('#product-charting')).toBeVisible();
  await page.getByRole('link',{name:'The product suite',exact:true}).click();
  await page.locator('#tab-crypto').focus();await page.keyboard.press('Home');await expect(page.locator('#tab-stockproof')).toBeFocused();
  await page.keyboard.press('ArrowRight');await expect(page.locator('#tab-charting')).toBeFocused();
  await expect(page.locator('#product-charting a')).toHaveAttribute('href','/charts/');
  await expect(page.locator('#product-commentary a')).toHaveAttribute('href','/commentary/');
  await expect(page.locator('#product-crypto a')).toHaveAttribute('href','/crypto/');
});
test('deep anchors, resize and history keep the selected product readable',async({page})=>{
  await page.goto('/#product-fno');await expect(page.locator('#product-fno')).toBeVisible();
  await page.setViewportSize({width:390,height:844});await expect(page.locator('#product-fno')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  await page.goto('/intelligence/');await page.goBack();await expect(page.locator('#product-fno')).toBeVisible();
});
test('community includes all planned entries with no fake links',async({page})=>{
  await page.goto('/#community');await expect(page.locator('.channel-grid li')).toHaveCount(25);
  await expect(page.locator('.channel-grid [data-status=planned] a')).toHaveCount(0);
  await expect(page.locator('.platform-unavailable')).toHaveCount(24);
  await expect(page.locator('.community-legend')).toContainText('not yet linked');
});
test('HTML articles and local draft work without JavaScript; production excludes draft',async({browser,request})=>{
  const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
  await page.goto('/');await expect(page.locator('[data-panel]:visible')).toHaveCount(5);
  await page.getByRole('link',{name:/Read the issue/}).click();await expect(page.locator('.issue-chapter')).toHaveCount(7);
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content','noindex, nofollow');
  const pdf=await request.get('/intelligence/issues/research-foundations/marketdeck-brief.pdf');expect(pdf.ok()).toBe(true);expect(pdf.headers()['content-type']).toBe('application/pdf');
  expect((await request.get('http://127.0.0.1:4174/intelligence/issues/research-foundations/')).status()).toBe(404);
  await page.goto('/intelligence/notes/business-before-the-stock/');await expect(page.getByRole('heading',{name:'Follow the source'})).toBeVisible();await context.close();
});
for(const width of [320,375,390,430,768,1024,1440,1920,2560])test(`layout at ${width}px: hero, transition, dock, no overflow`,async({page})=>{
  await page.setViewportSize({width,height:width<800?844:1000});await page.goto('/');
  await expect(page.getByRole('heading',{level:1})).toBeVisible();
  if(width>=1000){await scrollStory(page,.5);expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);await scrollStory(page,1);}
  else {await expect(page.locator('.market-story')).not.toHaveClass(/story-enabled/);}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  await page.locator('#tab-crypto').click();await expect(page.locator('#product-crypto')).toBeVisible();
  await page.screenshot({path:`.preview/v2/width-${width}.png`,fullPage:true});
});
