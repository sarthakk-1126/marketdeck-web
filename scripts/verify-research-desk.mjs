// Run against an isolated Django preview; never supplies production credentials.
import {chromium,expect} from '@playwright/test';
import {readFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const origin=process.env.RD_TEST_ORIGIN;
if(!origin)throw new Error('Set RD_TEST_ORIGIN to an isolated Research Desk preview.');
const output=process.env.RD_SCREENSHOT_DIR||'/tmp/research-desk-verification';mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1050}});
const errors=[];
// Shared shell assets are mirrored locally for the offline preview.
await context.route('https://marketdeck.in/**',async route=>{
 const path=new URL(route.request().url()).pathname;
 const file=resolve('public','.'+path);
 if(existsSync(file))await route.fulfill({path:file});
 else if(path.startsWith('/screener/static/'))await route.fulfill({response:await context.request.get(origin+path)});
 else await route.abort();
});
const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
try {
 await page.goto(origin+'/screener/research-desk/?company=TCS.NS');
 await expect(page.locator('[data-chart] svg')).toBeVisible();
 await expect(page.locator('h1')).toHaveText('TCS research');
 await page.locator('[data-lens="cash"]').hover();
 await expect(page.locator('[data-preview]')).toContainText('Cash flow preview');
 await page.locator('[data-lens="cash"]').click();
 await expect(page.locator('[data-chart-footnote]')).toContainText('2021-22');
 await page.locator('[data-action="pin"]').click();
 await expect(page.locator('[data-pin-count]')).toHaveText('1');
 await page.locator('[data-action="source"]').first().click();
 await expect(page.locator('[data-source-content]')).toContainText('Source trace:');
 await expect(page.locator('[data-source-content]')).toContainText('Published:');
 await page.locator('[data-source-dialog] [data-close-dialog]').click();
 await page.locator('[data-timeline] button').first().click();
 await expect(page.locator('[data-chart]')).toContainText('No common positive');
 await page.locator('[data-timeline] button').last().click();
 await page.locator('[data-view="scenarios"]').click();
 await expect(page.locator('[data-scenario-result]')).toContainText('Scenario revenue');
 await page.locator('[data-calculator="earnings"]').click();
 await expect(page.locator('[data-scenario-result]')).toContainText('Scenario EPS');
 await page.locator('[data-timeline] button').filter({hasText:'2022-23'}).click();
 await expect(page.locator('[data-scenario-result]')).toContainText('A positive filed EPS is needed');
 await page.locator('[data-calculator="compound"]').click();
 await expect(page.locator('[data-scenario-result]')).toContainText('Scenario amount');
 await page.locator('[data-view="notes"]').click();
 await expect(page.locator('[data-note-input]')).toBeDisabled();
 await expect(page.locator('[data-note-auth]')).toContainText('Sign in');
 await page.locator('[data-view="explore"]').click();
 await page.locator('[data-timeline] button').last().click();
 await page.locator('[data-lens="growth"]').click();
 await page.screenshot({path:output+'/desktop.png',fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);

 const mobile=await context.newPage();await mobile.setViewportSize({width:390,height:844});await mobile.emulateMedia({reducedMotion:'reduce'});
 mobile.on('pageerror',error=>errors.push(error.message));
 await mobile.goto(origin+'/screener/research-desk/?company=TCS.NS');
 await expect(mobile.locator('[data-chart] svg')).toBeVisible();
 expect(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await mobile.locator('[data-action="sidebar"]').click();
 await expect(mobile.locator('.rd-sidebar')).toBeVisible();
 await mobile.getByRole('button',{name:/Operating cash flow/}).click();
 await mobile.locator('[data-action="sidebar"]').click();
 await mobile.screenshot({path:output+'/mobile.png',fullPage:true});
 expect(await mobile.locator('.rd-company-object').evaluate(el=>getComputedStyle(el).animationName)).toBe('none');
 await mobile.close();

 // Signed-in preview uses only a generated local fixture account.
 if(process.env.RD_TEST_SESSION_FILE){
  const session=JSON.parse(readFileSync(process.env.RD_TEST_SESSION_FILE,'utf8'));
  await context.addCookies([{name:'sessionid',value:session.sessionid,url:origin}]);
  await page.goto(origin+'/screener/research-desk/?company=TCS.NS');
  await page.locator('[data-view="notes"]').click();
  await expect(page.locator('[data-note-input]')).toBeEnabled();
  await page.locator('[data-note-input]').fill('Evidence from stored filings. <script>literal text</script>');
  await page.locator('[data-title-input]').fill('Private fixture desk');
  await page.locator('[data-action="save"]').first().click();
  await expect(page.locator('[data-save-status]')).toHaveText('Saved');
  const savedUrl=page.url();expect(savedUrl).toContain('desk=');
  await page.reload();await expect(page.locator('[data-save-status]')).toHaveText('Saved');
  await page.locator('[data-view="notes"]').click();
  await expect(page.locator('[data-note-input]')).toHaveValue('Evidence from stored filings. <script>literal text</script>');
  await page.route('**/research-desk/state/',async route=>{
   if(route.request().method()==='POST'){const response=await route.fetch();await new Promise(r=>setTimeout(r,400));await route.fulfill({response});}else await route.continue();
  });
  await page.locator('[data-note-input]').fill('Snapshot before save');
  const sent=page.waitForRequest(request=>request.method()==='POST'&&request.url().endsWith('/research-desk/state/'));
  await page.locator('[data-action="save"]').first().click();await sent;
  await page.locator('[data-note-input]').fill('Newer edit during save');
  await expect(page.locator('[data-save-status]')).toHaveText('Unsaved changes');
  await page.locator('[data-action="save"]').first().click();
  await expect(page.locator('[data-save-status]')).toHaveText('Saved');
  await page.reload();await page.locator('[data-view="notes"]').click();
  await expect(page.locator('[data-note-input]')).toHaveValue('Newer edit during save');
 }
 expect(errors).toEqual([]);
 console.log(JSON.stringify({desktop:'passed',mobile:'passed',sources:'passed',missingData:'passed',scenarios:'passed',savedRoundtrip:!!process.env.RD_TEST_SESSION_FILE,consoleErrors:errors}));
} finally {await browser.close();}
