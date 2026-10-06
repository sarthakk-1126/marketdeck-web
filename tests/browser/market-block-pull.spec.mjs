import {test,expect} from '@playwright/test';

async function setup(page){
  await page.route('https://www.googletagmanager.com/**',r=>r.fulfill({status:200,contentType:'text/javascript',body:''}));
  await page.goto('/');await expect(page.locator('.hero')).toHaveAttribute('data-renderer','webgl');
  const canvas=page.locator('.earth-canvas');await canvas.scrollIntoViewIfNeeded();
  expect(await page.locator('.hero').evaluate(h=>h.scrollLeft)).toBe(0);return canvas;
}
async function frontPoint(canvas){
  const box=await canvas.boundingBox();return {x:box.x+box.width*.55,y:box.y+box.height*.72};
}
async function mousePull(page,canvas,distance=65){
  const point=await frontPoint(canvas);
  await page.mouse.move(point.x,point.y);await page.mouse.down();
  await page.mouse.move(point.x+distance,point.y,{steps:8});
  await expect(canvas).toHaveAttribute('data-pull',/\d+/);
  await page.mouse.up();
}
async function chargeAt(page,canvas,n){
  await expect(canvas).toHaveAttribute('data-presses',String(n));
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow',String(n));
  await expect(page.locator('.market-charge-segment.is-filled')).toHaveCount(n);
}

test('five deliberate mouse pulls charge once each, settle, reveal and restore',async({page})=>{
  test.setTimeout(120000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const canvas=await setup(page);await chargeAt(page,canvas,0);
  for(let n=1;n<=4;n++){
    await mousePull(page,canvas);await chargeAt(page,canvas,n);
    await page.mouse.move(10,10);
    await expect.poll(async()=>Number(await canvas.getAttribute('data-pull-displacement'))).toBeLessThan(.002);
    await expect(page.locator('.market-block-reveal')).toHaveCount(0);
    if(n===3)await page.screenshot({path:'.preview/elastic-progress-desktop.png'});
  }
  await mousePull(page,canvas);
  const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
  await expect(canvas).toHaveAttribute('data-presses','5');
  await expect(dialog).toHaveAttribute('data-phase','quote');
  expect(await page.locator('.earth-canvas').count()).toBe(1);
  await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
  await chargeAt(page,canvas,0);expect(errors).toEqual([]);
});

test('captured pulls stay bounded outside the cube and mixed input shares the original counter',async({page})=>{
  const canvas=await setup(page),point=await frontPoint(canvas);
  await page.mouse.move(point.x,point.y);await page.mouse.down();
  await page.mouse.move(point.x+60,point.y,{steps:8});
  await expect(canvas).toHaveAttribute('data-pull',/\d+/);
  expect(await page.locator('.hero').evaluate(h=>h.hasPointerCapture(1))).toBe(true);
  await page.mouse.move(20,60,{steps:10});
  await expect.poll(async()=>Number(await canvas.getAttribute('data-pull-displacement'))).toBeGreaterThan(.10);
  expect(Number(await canvas.getAttribute('data-pull-displacement'))).toBeLessThan(.31);
  await page.screenshot({path:'.preview/elastic-captured-pull.png'});
  await page.mouse.up();await chargeAt(page,canvas,1);
  const tap=await frontPoint(canvas);await page.mouse.click(tap.x,tap.y);await chargeAt(page,canvas,2);
  await page.getByRole('button',{name:/Interactive market sculpture/}).focus();
  expect(await page.locator('.hero').evaluate(h=>h.scrollLeft)).toBe(0);
  expect((await page.locator('h1').boundingBox()).x).toBeGreaterThanOrEqual(0);
  await page.keyboard.press('Space');await chargeAt(page,canvas,3);
  await page.mouse.move(10,10);
  await expect.poll(async()=>Number(await canvas.getAttribute('data-pull-displacement'))).toBeLessThan(.002);
});

test('cancelled pulls, lost capture and tiny movements never add charge',async({page})=>{
  const canvas=await setup(page);
  for(const cancellation of ['pointercancel','capture','blur']){
    const point=await frontPoint(canvas);await page.mouse.move(point.x,point.y);await page.mouse.down();
    await page.mouse.move(point.x+60,point.y,{steps:8});await expect(canvas).toHaveAttribute('data-pull',/\d+/);
    await page.evaluate(mode=>{
      const hero=document.querySelector('.hero');
      if(mode==='pointercancel')hero.dispatchEvent(new PointerEvent('pointercancel',{pointerId:1,bubbles:true}));
      else if(mode==='capture')hero.releasePointerCapture(1);
      else window.dispatchEvent(new Event('blur'));
    },cancellation);
    await page.mouse.up();await expect(canvas).toHaveAttribute('data-pull','');await chargeAt(page,canvas,0);
  }
  const point=await frontPoint(canvas);await page.mouse.move(point.x,point.y);await page.mouse.down();
  await page.mouse.move(point.x+14,point.y,{steps:3});await page.mouse.up();
  await expect.poll(async()=>Number(await canvas.getAttribute('data-pull-displacement'))).toBeLessThan(.002);
  await chargeAt(page,canvas,0);
});

test('phone horizontal pulls fill all five segments while vertical swipes scroll normally',async({browser})=>{
  test.setTimeout(120000);
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const page=await context.newPage(),canvas=await setup(page),session=await context.newCDPSession(page);
  const point=await frontPoint(canvas),before=await page.evaluate(()=>scrollY);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
  for(const delta of [25,70,130])await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x,y:point.y-delta}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(before+30);await chargeAt(page,canvas,0);
  await canvas.scrollIntoViewIfNeeded();
  for(let n=1;n<=5;n++){
    const p=await frontPoint(canvas),scroll=await page.evaluate(()=>scrollY);
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p]});
    for(const delta of [12,25,45,60])await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:p.x+delta,y:p.y}]});
    await expect(canvas).toHaveAttribute('data-pull',/\d+/);
    expect(await page.evaluate(()=>scrollY)).toBe(scroll);
    await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    if(n<5){await chargeAt(page,canvas,n);if(n===3){await page.locator('.market-block-charge').scrollIntoViewIfNeeded();await page.screenshot({path:'.preview/elastic-progress-phone.png'});}}
    else await expect(page.getByRole('dialog')).toBeVisible();
  }
  await page.getByRole('button',{name:'Return to MarketDeck'}).tap();await expect(page.getByRole('dialog')).toHaveCount(0);
  await chargeAt(page,canvas,0);
  await page.getByRole('link',{name:'Explore the suite',exact:true}).tap();await expect(page.locator('#tab-charting')).toBeVisible();
  await context.close();
});

test('motion preference changes cancel an active pull and keep reduced motion static',async({page})=>{
  const canvas=await setup(page),point=await frontPoint(canvas);
  await page.mouse.move(point.x,point.y);await page.mouse.down();await page.mouse.move(point.x+60,point.y,{steps:8});
  await expect(canvas).toHaveAttribute('data-pull',/\d+/);
  await page.emulateMedia({reducedMotion:'reduce'});await page.mouse.up();
  await expect(canvas).toHaveAttribute('data-pull','');await expect(canvas).toHaveAttribute('data-pull-displacement','0.0000');
  await expect(page.locator('.market-block-charge')).toBeHidden();
  const frozen=await canvas.screenshot();await page.waitForTimeout(200);expect((await canvas.screenshot()).equals(frozen)).toBe(true);
  await page.emulateMedia({reducedMotion:'no-preference'});await chargeAt(page,canvas,0);
  await mousePull(page,canvas);await chargeAt(page,canvas,1);
  await page.getByRole('button',{name:'Disable motion',exact:true}).click();await expect(page.locator('.market-block-charge')).toBeHidden();
});
