import {test,expect} from '@playwright/test';
import {MARKET_QUOTES} from '../../src/market-quotes.js';

async function setup(page){
  await page.route('https://www.googletagmanager.com/**',r=>r.fulfill({status:200,contentType:'text/javascript',body:''}));
  await page.goto('/');
  await expect(page.locator('.hero')).toHaveAttribute('data-renderer','webgl');
  const canvas=page.locator('.earth-canvas');await canvas.scrollIntoViewIfNeeded();return canvas;
}
async function pressBlocks(page,canvas,touch=false,n=5){
  const box=await canvas.boundingBox();
  for(let i=0;i<n;i++){
    const point={x:box.x+box.width*.55,y:box.y+box.height*.72};
    if(touch)await page.touchscreen.tap(point.x,point.y);else await page.mouse.click(point.x,point.y);
    await expect(canvas).toHaveAttribute('data-presses',String(i+1));
    if(i<4)await expect(page.locator('.market-block-reveal')).toHaveCount(0);
  }
}

for(const width of [320,390,1440])test(`five real block presses reveal and reassemble at ${width}px`,async({browser})=>{
  const phone=width<600,context=await browser.newContext({viewport:{width,height:phone?844:900},hasTouch:phone,isMobile:phone});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const canvas=await setup(page);const initial=await canvas.boundingBox();
  const before=await page.evaluate(()=>({scroll:scrollY,h1:document.querySelector('h1').textContent,links:[...document.querySelectorAll('.hero-actions a')].map(a=>[a.textContent,a.href])}));
  await pressBlocks(page,canvas,phone);
  const dialog=page.getByRole('dialog',{name:'A moment of market perspective'});
  await expect(dialog).toBeVisible();
  await page.evaluate(()=>{
    const dialog=document.querySelector('.market-block-reveal');
    const samples=[];
    window.revealSamples=samples;
    new MutationObserver(()=>{
      samples.push({age:Number(dialog.dataset.age),quote:Number(dialog.style.getPropertyValue('--quote')),burst:Number(dialog.style.getPropertyValue('--burst')),launch:Number(dialog.style.getPropertyValue('--launch'))});
    }).observe(dialog,{attributes:true,attributeFilter:['data-age']});
  });
  await expect(dialog).toHaveAttribute('data-phase','quote');
  expect(await page.locator('.earth-canvas').count()).toBe(1);
  expect(await canvas.evaluate(c=>c.width*c.height)).toBeLessThanOrEqual(phone?650000:1300000);
  const quoteId=await dialog.getAttribute('data-quote-id');
  const selected=MARKET_QUOTES.find(q=>q.id===quoteId);
  expect(selected).toBeDefined();
  await expect(dialog.locator('blockquote')).toHaveText(`“${selected.text}”`);
  await expect(dialog.locator('.market-reveal-author')).toHaveText(selected.author);
  await expect(dialog.locator('figcaption a')).toHaveAttribute('href',selected.sourceUrl);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  const quoteRect=await dialog.locator('blockquote').boundingBox();expect(quoteRect.x).toBeGreaterThanOrEqual(15);expect(quoteRect.x+quoteRect.width).toBeLessThanOrEqual(width-15);
  const clipped=await page.evaluate(quotes=>{
    const dialog=document.querySelector('.market-block-reveal'),text=dialog.querySelector('blockquote');
    const original=text.textContent,originalLength=dialog.dataset.quoteLength,bad=[];
    for(const q of quotes){
      text.textContent=`“${q.text}”`;dialog.dataset.quoteLength=q.text.length>90?'long':'short';
      const r=text.getBoundingClientRect();
      if(r.left<15||r.right>innerWidth-15||r.height>innerHeight*.55||text.scrollWidth>text.clientWidth+1)bad.push(q.id);
    }
    text.textContent=original;dialog.dataset.quoteLength=originalLength;return bad;
  },MARKET_QUOTES);
  expect(clipped).toEqual([]);
  await page.screenshot({path:`.preview/reveal-verified-${width}.png`});
  await expect(dialog).toHaveCount(0,{timeout:20000});
  const timing=await page.evaluate(()=>window.revealSamples);
  expect(timing.at(-1).age).toBeGreaterThanOrEqual(8.2);
  expect(timing.at(-1).age).toBeLessThan(8.31);
  const readable=timing.filter(s=>s.quote>.99);
  expect(readable.at(-1).age-readable[0].age).toBeGreaterThan(3.8);
  expect(readable.at(-1).age-readable[0].age).toBeLessThan(4.15);
  expect(Math.max(...timing.map(s=>s.burst))).toBeGreaterThan(.65);
  expect(timing.some(s=>s.age<1.2&&s.launch>.95)).toBe(true);
  await expect(canvas).toHaveAttribute('data-reveal','idle');await expect(canvas).toHaveAttribute('data-presses','0');
  expect(await canvas.evaluate(c=>c.parentElement.classList.contains('earth-scene'))).toBe(true);
  const restored=await canvas.boundingBox();expect(restored.width).toBe(initial.width);expect(restored.height).toBe(initial.height);
  expect(await page.evaluate(()=>({scroll:scrollY,h1:document.querySelector('h1').textContent,links:[...document.querySelectorAll('.hero-actions a')].map(a=>[a.textContent,a.href])}))).toEqual(before);
  await page.getByRole('link',{name:'Explore the suite',exact:true}).click();await expect(page.locator('#tab-charting')).toBeVisible();
  expect(errors).toEqual([]);await context.close();
});

test('empty space and drags do not count; keyboard reveal escapes and restores focus',async({page})=>{
  const canvas=await setup(page),box=await canvas.boundingBox();
  await page.mouse.click(box.x+box.width*.96,box.y+box.height*.05);await page.waitForTimeout(100);
  await expect(canvas).toHaveAttribute('data-presses','0');
  await page.mouse.move(box.x+box.width*.55,box.y+box.height*.72);await page.mouse.down();await page.mouse.move(box.x+box.width*.75,box.y+box.height*.72);await page.mouse.up();
  await page.waitForTimeout(100);await expect(canvas).toHaveAttribute('data-presses','0');
  const trigger=page.getByRole('button',{name:/Interactive market sculpture/});await trigger.focus();
  for(let i=1;i<=5;i++){await page.keyboard.press('Enter');await expect(canvas).toHaveAttribute('data-presses',String(i));}
  await expect(page.locator('.market-block-reveal')).toBeVisible();await page.keyboard.press('Escape');
  await expect(page.locator('.market-block-reveal')).toHaveCount(0,{timeout:5000});await expect(trigger).toBeFocused();
  await expect(canvas).toHaveAttribute('data-presses','0');
});

test('reduced motion stays static and a changed preference immediately restores the hero',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});const canvas=await setup(page),box=await canvas.boundingBox();
  const frozen=await canvas.screenshot();
  for(let i=0;i<5;i++)await page.mouse.click(box.x+box.width*.55,box.y+box.height*.72);
  await page.waitForTimeout(150);await expect(page.locator('.market-block-reveal')).toHaveCount(0);
  expect((await canvas.screenshot()).equals(frozen)).toBe(true);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await pressBlocks(page,canvas);await expect(page.locator('.market-block-reveal')).toBeVisible();
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(page.locator('.market-block-reveal')).toHaveCount(0);await expect(canvas).toHaveAttribute('data-reveal','idle');
  await page.waitForTimeout(100);const stopped=await canvas.screenshot();await page.waitForTimeout(200);expect((await canvas.screenshot()).equals(stopped)).toBe(true);
});

test('viewport changes and context loss during the reveal cleanly restore the poster',async({page})=>{
  const canvas=await setup(page);await pressBlocks(page,canvas);await expect(page.locator('.market-block-reveal')).toHaveAttribute('data-phase','quote');
  await page.setViewportSize({width:1024,height:768});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
  await canvas.evaluate(c=>c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await expect(page.locator('.market-block-reveal')).toHaveCount(0);
  await expect(page.locator('.hero')).toHaveAttribute('data-renderer','context-lost');
  await expect(canvas).toHaveCount(0);
  expect(await page.locator('.earth-scene picture').evaluate(p=>getComputedStyle(p).opacity)).toBe('1');
  await page.getByRole('link',{name:'Explore the suite',exact:true}).click();await expect(page.locator('#tab-charting')).toBeVisible();
});
