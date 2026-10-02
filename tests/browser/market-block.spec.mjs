import {test,expect} from '@playwright/test';
import {writeFileSync} from 'node:fs';

test('3D sculpture compiles, animates, pauses and preserves the product handoff',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('https://www.googletagmanager.com/**',r=>r.fulfill({status:200,contentType:'text/javascript',body:''}));
  await page.setViewportSize({width:1712,height:919});await page.goto('/');
  await expect(page.locator('.hero')).toHaveAttribute('data-renderer','webgl');
  const canvas=page.locator('.earth-canvas');
  await expect(canvas).toHaveAttribute('data-material','kinetic-graphite');
  expect(await canvas.evaluate(c=>c.width*c.height)).toBeLessThanOrEqual(1300000);
  await expect(canvas).toHaveAttribute('data-phase','open');
  await page.screenshot({path:'.preview/kinetic-desktop-v1.png'});
  await page.getByRole('button',{name:'Disable motion',exact:true}).click();
  const phase=await canvas.getAttribute('data-phase');
  await page.waitForTimeout(150);const frozen=await canvas.screenshot();
  await page.waitForTimeout(400);expect(await canvas.getAttribute('data-phase')).toBe(phase);
  expect((await canvas.screenshot()).equals(frozen)).toBe(true);
  await page.getByRole('link',{name:'Explore the suite',exact:true}).click();
  await expect(page.locator('#tab-charting')).toBeVisible();
  // Export the actual scene as the poster used when WebGL or save-data disallows motion.
  if(process.env.KINETIC_EXPORT_POSTER==='1'){
  const data=await page.evaluate(async()=>{
    const {createMarketBlock}=await import('/assets/market-block.js?v=candles-20261002');
    const c=document.createElement('canvas');const art=await createMarketBlock(c,()=>{});
    art.resize(900,900);art.render({time:1,moving:false});
    art.render({moving:false});const output=c.toDataURL('image/webp',.94);art.dispose();return output;
  });
  writeFileSync('public/assets/market-block-poster.webp',Buffer.from(data.split(',')[1],'base64'));
  }
  expect(errors).toEqual([]);
});

test('desktop picks individual 3D tiles, ripples settle, and pausing freezes interaction',async({page})=>{
  await page.setViewportSize({width:1440,height:900});await page.goto('/');
  const canvas=page.locator('.earth-canvas');
  await expect(page.locator('.hero')).toHaveAttribute('data-renderer','webgl');
  await expect(canvas).toHaveAttribute('data-cycle','6200');
  const box=await canvas.boundingBox();
  await page.mouse.move(box.x+box.width*.50,box.y+box.height*.55);
  await expect(canvas).toHaveAttribute('data-hover',/\d+/);
  const first=await canvas.getAttribute('data-hover');
  await expect.poll(async()=>Number(await canvas.getAttribute('data-displacement'))).toBeGreaterThan(.025);
  await page.screenshot({path:'.preview/kinetic-hover-ripple.png'});
  await page.mouse.move(box.x+box.width*.62,box.y+box.height*.56);
  await expect.poll(()=>canvas.getAttribute('data-hover')).not.toBe(first);
  await page.mouse.move(10,10);
  await expect.poll(async()=>Number(await canvas.getAttribute('data-displacement')),{timeout:10000}).toBeLessThan(.002);
  await page.getByRole('button',{name:'Disable motion',exact:true}).click();
  await page.waitForTimeout(100);const frozen=await canvas.screenshot();
  await page.mouse.move(box.x+box.width*.50,box.y+box.height*.55);
  await page.waitForTimeout(250);expect((await canvas.screenshot()).equals(frozen)).toBe(true);
});

test('the first second transforms the sculpture and the full cycle returns to solid',async({page})=>{
  await page.goto('/');await expect(page.locator('.hero')).toHaveAttribute('data-renderer','webgl');
  const frames=await page.evaluate(async()=>{
    const {createMarketBlock}=await import('/assets/market-block.js?v=candles-20261002');
    const c=document.createElement('canvas'),art=await createMarketBlock(c,()=>{});
    art.resize(400,400);art.render({time:1});
    const output=[{at:0,phase:c.dataset.phase,image:c.toDataURL('image/png')}];
    for(let i=1;i<=59;i++){
      art.render({time:1+i*100});
      if([9,24,59].includes(i))output.push({at:i*100,phase:c.dataset.phase,image:c.toDataURL('image/png')});
    }
    art.dispose();return output;
  });
  expect(frames.map(f=>f.phase)).toEqual(['solid','open','open','solid']);
  expect(new Set(frames.map(f=>f.image)).size).toBe(4);
  frames.forEach(f=>writeFileSync(`.preview/ripple-motion-${f.at}.png`,Buffer.from(f.image.split(',')[1],'base64')));
});

test('phone tap produces a tile ripple while scrolling and CTA taps remain native',async({browser})=>{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const page=await context.newPage();await page.goto('/');
  const canvas=page.locator('.earth-canvas');
  await expect(page.locator('.hero')).toHaveAttribute('data-renderer','webgl');
  await canvas.scrollIntoViewIfNeeded();const box=await canvas.boundingBox();
  // The lower front surface remains a solid tile across the opening cycle.
  await page.touchscreen.tap(box.x+box.width*.55,box.y+box.height*.72);
  await expect.poll(async()=>Number(await canvas.getAttribute('data-displacement'))).toBeGreaterThan(.005);
  await page.screenshot({path:'.preview/kinetic-phone-ripple.png'});
  await expect.poll(async()=>Number(await canvas.getAttribute('data-ripples')),{timeout:10000}).toBe(0);
  // A real touch drag must scroll; it must not start another artwork ripple.
  const session=await context.newCDPSession(page);const before=await page.evaluate(()=>scrollY);
  const sx=box.x+box.width*.5,sy=Math.min(700,box.y+box.height*.55);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:sx,y:sy}]});
  for(const delta of [25,70,130])await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:sx,y:sy-delta}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(before+30);
  expect(await canvas.getAttribute('data-ripples')).toBe('0');
  await page.getByRole('link',{name:'Explore the suite',exact:true}).tap();
  await expect(page.locator('#tab-charting')).toBeVisible();await context.close();
});

for(const width of [320,360,390,430,768,1024,1440,1920,2560]) test(`sculpture composes at ${width}px without overflow`,async({page})=>{
    await page.setViewportSize({width,height:width<800?844:1000});await page.goto('/');
    await expect(page.locator('.hero')).toHaveAttribute('data-renderer','webgl');
    await expect(page.locator('.earth-canvas')).toHaveAttribute('data-phase','open');
    const layout=await page.evaluate(()=>{
      const rect=s=>document.querySelector(s).getBoundingClientRect();
      return {overflow:document.documentElement.scrollWidth>innerWidth,canvas:rect('.earth-canvas').toJSON(),trust:rect('.hero-trust').toJSON(),actions:[...document.querySelectorAll('.hero-actions .button')].map(b=>b.getBoundingClientRect().height)};
    });
    expect(layout.overflow).toBe(false);expect(layout.canvas.width).toBeGreaterThan(0);
    if(width<651){expect(layout.canvas.top).toBeGreaterThan(layout.trust.bottom);expect(layout.actions.every(h=>h>=44)).toBe(true);}
    if([320,390,768,1024].includes(width))await page.screenshot({path:`.preview/kinetic-${width}-v1.png`,fullPage:width<800});
});

test('reduced motion, denied WebGL and blocked module keep useful HTML and the sculpture poster',async({browser})=>{
  for(const mode of ['reduced','webgl','module','save-data']){
    const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:mode==='reduced'?'reduce':'no-preference'});
    const page=await context.newPage();
    if(mode==='webgl')await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.includes('webgl')?null:original.call(this,type,...args);};});
    if(mode==='save-data')await page.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:{saveData:true}}));
    if(mode==='module')await page.route('**/assets/market-block.js*',r=>r.abort());
    await page.goto('/');
    await expect(page.getByRole('heading',{level:1})).toBeVisible();
    await expect(page.locator('.hero')).toHaveAttribute('data-renderer',mode==='reduced'?'webgl':mode==='save-data'||mode==='webgl'?'poster':'failed');
    if(mode!=='reduced')expect(await page.locator('.earth-image').evaluate(i=>i.complete&&i.naturalWidth>0)).toBe(true);
    if(mode==='reduced'){await expect(page.locator('body')).toHaveClass(/motion-paused/);await expect(page.locator('.market-story')).not.toHaveClass(/story-enabled/);}
    await page.getByRole('link',{name:'Explore the suite',exact:true}).click();await expect(page.locator('#tab-charting')).toBeVisible();
    await context.close();
  }
});

test('context loss restores the sculpture and leaves desktop navigation working',async({page})=>{
  await page.goto('/');await expect(page.locator('.hero')).toHaveAttribute('data-renderer','webgl');
  await page.locator('.earth-canvas').evaluate(c=>c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
  await expect(page.locator('.hero')).toHaveAttribute('data-renderer','context-lost');
  await expect(page.locator('.earth-canvas')).toHaveCount(0);
  expect(await page.locator('.earth-scene picture').evaluate(e=>getComputedStyle(e).opacity)).toBe('1');
  await page.getByRole('link',{name:'Explore the suite',exact:true}).click();
  await expect(page.locator('#tab-charting')).toBeVisible();
});
