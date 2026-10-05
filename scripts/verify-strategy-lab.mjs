// Local real Django API, private fixture session, synthetic QA candles.
// Embedded sibling tools are host fixtures; no live-market claim is made.
import {chromium,expect} from '@playwright/test';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const origin=process.env.LAB_ORIGIN||'http://127.0.0.1:8766';
const output='.preview/lab';mkdirSync(output,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.LAB_CHROMIUM?{executablePath:process.env.LAB_CHROMIUM}:{})});
const context=await browser.newContext({viewport:{width:1440,height:1000}}),errors=[];
const session=JSON.parse(readFileSync(output+'/session.json','utf8'));
await context.addCookies([{name:'sessionid',value:session.sessionid,url:origin}]);
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
const measurements=[];
try {
 await page.goto(origin+'/screener/research-desk/?company=TCS.NS');
 await page.locator('[data-view="lab"]').click();
 await expect(page.locator('[data-lab-panel]')).toBeVisible();
 expect(await page.locator('[data-lab-panel] [data-mode]').count()).toBe(0);
 await page.locator('[data-sl="sources"]').first().click();
 await expect(page.locator('[data-sl-readiness]')).toContainText('no per-row source');
 await page.locator('[data-sl-import]').setInputFiles(output+'/dataset.json');
 await expect(page.locator('[data-sl-import-status]')).toContainText('220 sessions');
 await page.locator('[data-sl="close-sources"]').click();
 await page.locator('[data-sl="save"]').click();await expect(page.locator('[data-sl-save-status]')).toContainText('saved');
 const begin=Date.now();await page.locator('[data-sl="run"]').click();await expect(page.locator('[data-sl-metrics],.sl-metrics')).toBeVisible();
 measurements.push({operation:'first 220-bar server test + render',wall_ms:Date.now()-begin});
 await expect(page.locator('[data-sl-result-state]')).toContainText('Results match');
 await expect(page.locator('[data-sl-chart] [data-sl-event]').first()).toBeVisible();
 const url=page.url();await page.reload();await expect(page.locator('[data-lab-panel]')).toBeVisible();await expect(page.locator('.sl-metrics')).toBeVisible();
 await expect(page.locator('[data-sl-name]')).toHaveValue('Trend crossover');
 await page.locator('[data-sl-chart] [data-sl-event]').first().click();await expect(page.locator('[data-sl-inspector]')).toContainText('Awaiting next supported');
 await page.locator('[data-sl="step"]').click();await expect(page.locator('[data-sl-inspector]')).toContainText('filled');
 await page.locator('[data-sl="first"]').click();await expect(page.locator('.sl-metrics')).toContainText('0.00%');
 await page.locator('[data-sl-mode="build"]').click();await page.locator('[data-sl-rule="entry"][data-part="left"][data-key="period"]').first().fill('10');
 await expect(page.locator('[data-sl-result-state]')).toContainText('Outdated');
 await page.locator('[data-sl="save"]').click();await page.locator('[data-sl="run"]').click();await expect(page.locator('[data-sl-result-state]')).toContainText('Results match');
 await page.locator('[data-sl-compare]').evaluate(e=>e.closest('details').open=true);await page.locator('[data-sl-compare]').selectOption({index:1});await expect(page.locator('[data-sl-comparison]')).toContainText('Two immutable');
 await page.locator('[data-sl-mode="monitor"]').click();await page.locator('[data-sl="check"]').click();await expect(page.locator('[data-sl-monitor-result]')).toContainText('preview_only');
 await page.locator('[data-sl="disable"]').click();await expect(page.locator('[data-sl-monitor-result]')).toContainText('disabled');
 await page.reload();await expect(page.locator('.sl-metrics')).toBeVisible();await page.locator('[data-sl-mode="monitor"]').click();await expect(page.locator('[data-sl-monitor-result]')).toContainText('disabled');
 await page.locator('[data-sl-mode="build"]').click();await page.locator('[data-sl-editor="python"]').click();await expect(page.locator('[data-sl="run"]')).toBeDisabled();
 await page.locator('[data-sl-code]').fill('def decide(history):\n    return history[-1]["close"] > 100\n');await page.locator('[data-sl="save"]').click();await expect(page.locator('[data-sl-save-status]')).toContainText('saved');await page.reload();await page.locator('[data-sl-editor="python"]').click();await expect(page.locator('[data-sl-code]')).toHaveValue(/def decide/);await page.locator('[data-sl-editor="visual"]').click();
 await page.locator('[data-sl="run"]').click();await expect(page.locator('[data-sl-result-state]')).toContainText('Results match');
 for(const width of [1440,1280,820,390,320]){
  await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'reduce'});
  if(width<=820)await page.locator('[data-sl-area="chart"]').click();
  await expect(page.locator('[data-sl-chart] svg')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`outer overflow at ${width}`).toBe(true);
  await page.screenshot({path:output+`/lab-${width}.png`,fullPage:true});
  if(width<=820){await page.locator('[data-sl-area="rules"]').click();await expect(page.locator('[data-sl-name]')).toBeVisible();await page.locator('[data-sl-area="inspector"]').click();await expect(page.locator('[data-sl-inspector]')).toBeVisible();}
 }
 await page.setViewportSize({width:1440,height:1000});
 for(const view of ['explore','charts','valuation','derivatives','peers','scenarios','changes','thesis','notes']){
  await page.locator(`[data-view="${view}"]`).click();await expect(page.locator(`[data-${view}-panel]`)).toBeVisible();
 }
 await page.locator('[data-view="lab"]').click();
 await page.locator('[data-action="save"]').first().click();await expect(page.locator('[data-save-status]')).toHaveText('Saved');
 await page.locator('[data-sl-chart] [data-sl-event]').first().click();await page.locator('[data-sl="pin"]').click();await expect(page.locator('[data-sl-status]')).toContainText('pinned');
 await page.locator('[data-view="explore"]').click();await expect(page.locator('[data-pins]')).toContainText('Strategy Lab');await page.locator('[data-view="lab"]').click();
 await page.locator('[data-sl="focus-chart"]').focus();await page.keyboard.press('Enter');await expect(page.locator('[data-sl-layout]')).toHaveAttribute('data-focus','chart');await page.keyboard.press('Escape');await expect(page.locator('[data-sl-layout]')).toHaveAttribute('data-focus','');
 expect(errors).toEqual([]);
 const report={passed:true,widths:[1440,1280,820,390,320],workflows:['import','save/reopen','run','signal/fill/replay','stale results','version compare','monitor disable/reopen','pin to research','python edit/export-only','nine-view regression','keyboard focus','reduced motion'],measurements,errors,data:'synthetic QA candles; real local application API; sibling iframe host fixtures'};
 writeFileSync(output+'/browser-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(error){await page.screenshot({path:output+'/failure.png',fullPage:true});console.error(error);console.error('page errors',errors);process.exitCode=1;}finally{await browser.close();}
