// Run against an isolated Django preview with public filing fixtures and a
// local test account. Engine routes below exercise host wiring, not live data.
import {chromium,expect} from '@playwright/test';
import {readFileSync,mkdirSync} from 'node:fs';
const origin=process.env.RD_TEST_ORIGIN;
if(!origin)throw new Error('Set RD_TEST_ORIGIN to the isolated preview.');
const output=process.env.RD_SCREENSHOT_DIR||'/tmp/value-lab-check';mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1536,height:1100}}),errors=[];
await context.route(origin+'/charts/**',route=>route.fulfill({contentType:'text/html',body:'<title>Chart engine fixture</title><p>Chart host fixture</p>'}));
await context.route(origin+'/futures-and-options/**',route=>route.fulfill({contentType:'text/html',body:'<title>Options engine fixture</title><p>Options host fixture</p>'}));
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
const input=async(key,value)=>{const field=page.locator(`[data-value-input="${key}"]`);if(!await field.isVisible())await page.locator('[data-value-advanced]').evaluate(e=>e.open=true);await field.fill(String(value));};
const noOverflow=async p=>expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
try{
 await page.goto(origin+'/screener/research-desk/?company=TCS.NS');
 await page.locator('[data-view="valuation"]').click();
 const data=await (await context.request.get(origin+'/screener/research-desk/data/TCS.NS/')).json();
 const eps=data.valuation_reference.points.at(-1).facts.eps.value;
 await expect(page.locator('[data-value-input="base"]')).toHaveValue(String(eps));
 await expect(page.locator('[data-value-reference]')).toContainText('Diluted EPS');
 await expect(page.locator('[data-value-forecast] svg')).toBeVisible();
 expect(await page.locator('.rd-evidence-column').isVisible()).toBe(false);
 const initial=await page.locator('[data-value-result]').innerText();
 await page.locator('[data-value-slider="growth"]').focus();await page.keyboard.press('ArrowRight');
 await expect(page.locator('[data-value-input="growth"]')).toHaveValue('10.5');
 expect(await page.locator('[data-value-result]').innerText()).not.toBe(initial);
 await page.locator('[data-value-average]').click();
 const mean=data.valuation_reference.points.slice(-3).reduce((sum,p)=>sum+p.facts.eps.value,0)/3;
 expect(Number(await page.locator('[data-value-input="base"]').inputValue())).toBeCloseTo(mean,8);
 await page.locator('[data-value-source]').first().click();await expect(page.locator('[data-value-source-content]')).toContainText('Three-year starting reference');await page.keyboard.press('Escape');
 await page.locator('[data-value-seed]').click();
 await page.locator('[data-chart-point]').last().hover();
 await expect(page.locator('[data-value-chart-readout]')).toContainText('Year 5');
 await page.locator('[data-value-help="growth"]').click();
 await expect(page.locator('[data-value-help="growth"]')).toHaveAttribute('aria-expanded','true');
 await page.keyboard.press('Escape');await expect(page.locator('[data-value-help="growth"]')).toHaveAttribute('aria-expanded','false');
 await page.locator('[data-value-source]').first().click();await expect(page.locator('[data-value-source-content]')).toContainText('FCFF and its full reinvestment inputs');
 await expect(page.locator('[data-value-source-content]')).toContainText('weighted average');await page.keyboard.press('Escape');
 await page.locator('[data-inspector-toggle]').click();await expect(page.locator('.rd-evidence-column')).toBeVisible();await page.keyboard.press('Escape');expect(await page.locator('.rd-evidence-column').isVisible()).toBe(false);
 await noOverflow(page);await page.screenshot({path:output+'/desktop-earnings.png',fullPage:true});

 await page.locator('[data-value-model="firm"]').click();await expect(page.locator('[data-value-input="base"]')).toHaveValue('');await expect(page.locator('[data-value-input="cash"]')).toHaveValue('');await expect(page.locator('[data-value-input="debt"]')).toHaveValue('');
 await expect(page.locator('[data-value-chart-title]')).toContainText('reference only');
 await page.locator('[data-value-seed]').click();
 for(const [key,value] of Object.entries({ebit:200,tax:25,da:30,capex:60,workingCapital:20}))await page.locator(`[data-value-builder-input="${key}"]`).fill(String(value));
 await expect(page.locator('[data-value-builder-result]')).toContainText('₹100 Cr');await page.locator('[data-value-builder-use]').click();
 await expect(page.locator('[data-value-input="base"]')).toHaveValue('100');
 for(const [key,value] of Object.entries({growth:0,discount:10,terminal:0,shares:10,cash:50,debt:300}))await input(key,value);
 await expect(page.locator('[data-value-result]')).toContainText('₹75');await expect(page.locator('[data-value-result]')).toContainText('₹60');
 await expect(page.locator('[data-value-bridge]')).toContainText('₹-30');
 await input('terminal',10);await expect(page.locator('[data-value-input-status]')).toContainText('Terminal growth must be below');await expect(page.locator('[data-value-save]')).toBeDisabled();await input('terminal',0);
 await page.locator('[data-value-save]').click();await page.locator('[data-scenario-name]').fill('Firm base case');await page.locator('[data-value-scenario-form] button[type=submit]').click();
 await input('growth',5);await page.locator('[data-value-save]').click();await page.locator('[data-scenario-name]').fill('Growth case');await page.locator('[data-value-scenario-form] button[type=submit]').click();
 expect(await page.locator('.vl-comparison-line').count()).toBe(2);await expect(page.locator('.vl-scenario-range')).toContainText('Firm base case');
 await page.locator('[data-scenario-restore="0"]').click();await expect(page.locator('[data-value-input="growth"]')).toHaveValue('0');await expect(page.locator('[data-value-result]')).toContainText('₹75');
 await page.locator('[data-value-open-calculation]').click();await expect(page.locator('[data-value-cashflows]')).toContainText('Present value (₹ Cr)');
 await noOverflow(page);await page.screenshot({path:output+'/desktop-firm.png',fullPage:true});
 await page.locator('[data-scenario-remove="1"]').click();expect(await page.locator('.vl-comparison-line').count()).toBe(1);

 // All per-share models retain their established calculation conventions.
 await page.locator('[data-value-model="equity"]').click();for(const [key,value] of Object.entries({base:100,growth:0,discount:10,terminal:0}))await input(key,value);await expect(page.locator('[data-value-result]')).toContainText('₹1,000');
 await page.locator('[data-value-model="dividend"]').click();await input('base',5);await expect(page.locator('[data-value-result]')).toContainText('₹50');
 await page.locator('[data-value-model="earnings"]').click();for(const [key,value] of Object.entries({base:100,growth:10,discount:10,multiple:20,dividend:10}))await input(key,value);await expect(page.locator('[data-value-result]')).toContainText('₹2,050');
 await page.locator('.vl-reverse').evaluate(e=>e.open=true);await page.locator('[data-value-price]').fill('2050');await expect(page.locator('[data-value-reverse]')).toContainText('10%');
 await page.locator('[data-value-return="12"]').evaluate(e=>e.closest('details').open=true);await page.locator('[data-value-return="12"]').click();await expect(page.locator('[data-value-input="discount"]')).toHaveValue('12');
 await page.locator('[data-value-sensitivity]').evaluate(e=>e.closest('details').open=true);await page.locator('[data-sensitivity-rate="12"][data-sensitivity-growth="10"]').click();
 await page.locator('[data-value-rates]').fill('10,10');await expect(page.locator('[data-value-rates-error]')).toContainText('distinct');await page.locator('[data-value-rates]').fill('10,12,15,18');

 // Save/reopen through the existing owner-scoped, CSRF-protected endpoint.
 const session=JSON.parse(readFileSync(process.env.RD_TEST_SESSION_FILE,'utf8'));await context.addCookies([{name:'sessionid',value:session.sessionid,url:origin}]);
 await page.goto(origin+'/screener/research-desk/?company=TCS.NS');await page.locator('[data-view="valuation"]').click();
 await input('base',100);await input('growth',10);await input('discount',12);
 await page.locator('[data-value-save]').click();await page.locator('[data-scenario-name]').fill('Saved case');await page.locator('[data-value-scenario-form] button[type=submit]').click();
 await page.locator('[data-action="save"]').first().click();await expect(page.locator('[data-save-status]')).toHaveText('Saved');const savedUrl=page.url();
 await page.reload();await expect(page.locator('[data-save-status]')).toHaveText('Saved');await expect(page.locator('[data-value-input="base"]')).toHaveValue('100');await expect(page.locator('[data-value-scenarios]')).toContainText('Saved case');
 for(const view of ['explore','charts','derivatives','peers','scenarios','changes','thesis','notes','valuation']){await page.locator(`[data-view="${view}"]`).click();await expect(page.locator(`[data-${view}-panel]`)).toBeVisible();}
 await page.locator('[data-terminal-fullscreen]').click();await expect(page.locator('body')).toHaveClass(/rt-focus/);await page.keyboard.press('Escape');await expect(page.locator('body')).not.toHaveClass(/rt-focus/);

 const small=await context.newPage();small.on('pageerror',e=>errors.push(e.message));await small.emulateMedia({reducedMotion:'reduce'});
 for(const width of [320,390,820,1280]){
  await small.setViewportSize({width,height:900});await small.goto(savedUrl);await expect(small.locator('[data-valuation-panel]')).toBeVisible();await noOverflow(small);
  await small.locator('[data-value-input="growth"]').fill('12');const path=await small.locator('[data-vl-line]').getAttribute('d');await small.waitForTimeout(70);expect(await small.locator('[data-vl-line]').getAttribute('d')).toBe(path);
  if(width===390){await small.locator('[data-valuation-panel]').scrollIntoViewIfNeeded();await small.locator('.vl-canvas').scrollIntoViewIfNeeded();await small.screenshot({path:output+'/mobile-chart.png'});await small.screenshot({path:output+'/mobile-value.png',fullPage:true});await small.locator('[data-value-mobile-result] button').click();await expect(small.locator('[data-value-input="base"]')).toBeFocused();await small.screenshot({path:output+'/mobile-assumptions.png'});}
  await small.locator('[data-value-source]').first().click();await noOverflow(small);await small.keyboard.press('Escape');
 }
 expect(errors).toEqual([]);
 console.log(JSON.stringify({filingReferences:'passed',sliders:'passed',fcffBuilder:'passed',models:'passed',scenarios:'passed',privateRoundtrip:'passed',nineViews:'passed',desktop:'passed',mobile:'passed',reducedMotion:'passed',errors}));
}finally{await browser.close();}
