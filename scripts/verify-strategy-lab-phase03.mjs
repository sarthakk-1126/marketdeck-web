// Phase 03: real local Django API with an owner-private synthetic QA fixture.
// No built-in or live market history is represented by this workflow.
import {chromium,expect} from '@playwright/test';
import {existsSync,mkdirSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {extname,join,resolve,sep} from 'node:path';

const origin=process.env.LAB_ORIGIN||'http://127.0.0.1:18566';
const output='.preview/phase03';
const publicRoot=resolve('public');
mkdirSync(output,{recursive:true});
const session=JSON.parse(readFileSync(output+'/session.json','utf8'));
const browser=await chromium.launch({headless:true,...(process.env.LAB_CHROMIUM?{executablePath:process.env.LAB_CHROMIUM}:{})});
const context=await browser.newContext({viewport:{width:1440,height:1100}});
const errors=[],consoleErrors=[],httpErrors=[];
const mime={'.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};

await context.route('**/*',async route=>{
 const url=new URL(route.request().url());
 if(url.origin===origin){
  if(url.pathname.startsWith('/screener/static/')){await route.continue({url:origin+url.pathname.slice('/screener'.length)+url.search});return;}
  const candidate=resolve(join(publicRoot,decodeURIComponent(url.pathname).replace(/^\/+/,'')));
  if(candidate.startsWith(publicRoot+sep)&&existsSync(candidate)&&statSync(candidate).isFile()){
   await route.fulfill({status:200,body:readFileSync(candidate),contentType:mime[extname(candidate)]||'application/octet-stream'});return;
  }
 }
 await route.continue();
});
await context.addCookies([{name:'sessionid',value:session.sessionid,url:origin}]);
const page=await context.newPage();
page.on('pageerror',error=>errors.push(error.message));
page.on('console',message=>{const value=message.text();if(message.type()==='error'&&!value.includes('Failed to load resource')&&!value.includes('marketdeck.in/assets/lens.js'))consoleErrors.push(value);});
page.on('response',response=>{const url=new URL(response.url());if(url.origin===origin&&response.status()>=400&&!url.pathname.endsWith('/favicon.ico'))httpErrors.push(`${response.status()} ${url.pathname}`);});

function qaCSV(){
 const rows=['Date,Open,High,Low,Close,Volume'];
 let day=new Date('2025-06-02T00:00:00Z'),previousLow=100;
 for(let index=0;index<65;index++){
  while(day.getUTCDay()===0||day.getUTCDay()===6)day.setUTCDate(day.getUTCDate()+1);
  const session=index%5,week=Math.floor(index/5);
  const close=week===0?[105,104,103,102,101][session]:[previousLow+2,previousLow-1,previousLow+1,previousLow+2,previousLow+3][session];
  rows.push(`${day.toISOString().slice(0,10)},${close+.5},${close+1},${close-1},${close},${1000+index}`);
  if(session===4)previousLow=Math.min(...rows.slice(-5).map(row=>Number(row.split(',')[3])));
  day.setUTCDate(day.getUTCDate()+1);
 }
 return rows.join('\n');
}

try{
 await page.goto(origin+'/research-desk/?company=TCS.NS');
 await page.locator('[data-view="lab"]').click();
 await expect(page.locator('.sl-onboarding')).toContainText('Start with a research idea');
 await expect(page.locator('[data-sl="run"]')).toBeDisabled();

 // Establish a real saved Analysis version and event before conversion.
 await page.locator('[data-sl-project-type]').selectOption('analysis');
 await page.locator('[data-sl="sources"]').first().click();
 await expect(page.locator('[data-sl-readiness]')).toContainText('Built-in history unavailable');
 await page.locator('[data-sl-csv-import]').setInputFiles({name:'phase03-weekly-low-synthetic-qa.csv',mimeType:'text/csv',buffer:Buffer.from(qaCSV())});
 await page.locator('[data-sl-source]').fill('Synthetic Phase 03 browser QA fixture; not market data');
 await page.locator('[data-sl-basis]').selectOption('raw');
 await page.locator('[data-sl-actions]').selectOption('none');
 await page.locator('[data-sl-confirm]').check();
 await page.locator('[data-sl="import-csv"]').click();
 await expect(page.locator('[data-sl-status]')).toContainText('Imported 65 sessions');
 const analysisSave=page.waitForResponse(response=>response.request().method()==='POST'&&response.url().includes('/save_version/'));
 await page.locator('[data-sl="save"]').click();
 await analysisSave;
 await expect(page.locator('[data-sl-project]')).not.toHaveValue('');
 await page.locator('[data-sl="run"]').click();
 await expect(page.locator('.sl-analysis-metrics')).toBeVisible();
 const analysisProject=await page.locator('[data-sl-project]').inputValue();
 const analysis=await page.evaluate(async id=>(await fetch(`/research-desk/lab/project/${id}/`)).json(),analysisProject);
 const analysisVersion=analysis.versions[0].id;

 // Conversion begins with no entry, exit, execution assumptions or review.
 await page.locator('[data-sl="convert"]').click();
 await expect(page.locator('[data-sl="save"]')).toBeDisabled();
 expect(await page.locator('[data-sl-condition="entry"]').count()).toBe(0);
 expect(await page.locator('[data-sl-condition="exit"]').count()).toBe(0);
 await page.locator('[data-sl-add="entry"]').click();
 await page.locator('[data-sl-add="exit"]').click();
 await page.locator('[data-sl-assumption="capital"]').evaluate(input=>{input.closest('details').open=true;});
 await expect(page.locator('[data-sl-review-wrap]')).toBeVisible();
 for(const input of await page.locator('[data-sl-assumption]').all())expect(await input.inputValue()).toBe('');
 const values={capital:'100000',allocation_pct:'60',holding_sessions:'5',fee_bps:'10',fixed_fee:'5',slippage_bps:'8',start:'2025-06-02',reserved_start:'2025-07-15',end:'2025-08-29'};
 for(const [key,value] of Object.entries(values))await page.locator(`[data-sl-assumption="${key}"]`).fill(value);
 await expect(page.locator('[data-sl="save"]')).toBeDisabled();
 await page.locator('[data-sl-review]').check();
 await expect(page.locator('[data-sl="save"]')).toBeEnabled();
 const strategySave=page.waitForResponse(response=>response.request().method()==='POST'&&response.url().includes('/save_version/'));
 await page.locator('[data-sl="save"]').click();
 await strategySave;
 await expect(page.locator('[data-sl-save-status]')).toContainText('saved');
 await expect(page.locator('[data-sl-project]')).not.toHaveValue('');
 const convertedID=await page.locator('[data-sl-project]').inputValue();
 const converted=await page.evaluate(async id=>(await fetch(`/research-desk/lab/project/${id}/`)).json(),convertedID);
 expect(converted.project.source_analysis_version).toBe(analysisVersion);
 expect(converted.versions[0].assumptions.holding_sessions).toBe(5);
 expect(converted.versions[0].assumptions.allocation_pct).toBe(60);
 await page.locator('[data-sl="run"]').click();
 await expect(page.locator('.sl-metrics')).toBeVisible();
 await expect(page.locator('[data-sl-details]')).toContainText('holding session 1');
 await expect(page.locator('[data-sl-result-state]')).toContainText('Results match');

 // Generated Python is decision-only; editing it becomes custom and stale.
 await page.locator('[data-sl-mode="build"]').click();
 await page.locator('[data-sl-editor="python"]').click();
 const download=page.waitForEvent('download');
 await page.locator('[data-sl="template"]').click();
 const generatedPath=output+'/marketdeck_visual_strategy.py';
 await (await download).saveAs(generatedPath);
 const generated=readFileSync(generatedPath,'utf8');
 expect(generated).toContain('marketdeck-decision-1.0');
 expect(generated).not.toContain('ROUND_FLOOR');
 await expect(page.locator('[data-sl-python-status]')).toContainText('Generated visual template');
 await page.locator('[data-sl-code]').press('Control+End');
 await page.locator('[data-sl-code]').pressSequentially('\n# custom offline note');
 await expect(page.locator('[data-sl-python-status]')).toContainText('Custom code');
 await expect(page.locator('[data-sl-result-state]')).toContainText('Outdated');
 await page.locator('[data-sl-review]').check();
 await page.locator('[data-sl="save"]').click();
 await page.reload();
 if(!await page.locator('[data-lab-panel]').isVisible())await page.locator('[data-view="lab"]').click();
 await page.locator('[data-sl-editor="python"]').click();
 await expect(page.locator('[data-sl-python-status]')).toContainText('Custom code');
 await expect(page.locator('[data-sl-code]')).toHaveValue(/custom offline note/);
 await page.locator('[data-sl-editor="visual"]').click();
 for(const [key,value] of Object.entries(values))await expect(page.locator(`[data-sl-assumption="${key}"]`)).toHaveValue(value);

 // Responsive, reduced-motion, empty/error, mobile-area and overflow checks.
 await page.locator('[data-sl-assumption="holding_sessions"]').evaluate(input=>{input.closest('details').open=true;});
 await page.locator('[data-sl-assumption="holding_sessions"]').fill('1.5');
 await expect(page.locator('[data-sl="save"]')).toBeDisabled();
 await page.locator('[data-sl-assumption="holding_sessions"]').fill('5');
 for(const width of [1440,1280,820,390,320]){
  await page.setViewportSize({width,height:1100});
  await page.emulateMedia({reducedMotion:'reduce'});
  if(width<=820){for(const area of ['chart','rules','inspector']){await page.locator(`[data-sl-area="${area}"]`).click();await expect(page.locator(`[data-sl-${area==='rules'?'strategy-editor':area}]`).first()).toBeVisible();}}
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`outer overflow at ${width}`).toBe(true);
  await page.screenshot({path:output+`/phase03-${width}.png`,fullPage:true});
 }

 await page.setViewportSize({width:1440,height:1100});
 for(const view of ['explore','charts','valuation','derivatives','peers','scenarios','changes','thesis','notes']){
  await page.locator(`[data-view="${view}"]`).click();
  await expect(page.locator(`[data-${view}-panel]`)).toBeVisible();
 }
 await page.locator('[data-view="lab"]').click();
 await page.locator('[data-sl-chart]').focus();
 await page.keyboard.press('Home');
 const first=await page.locator('[data-sl-cursor-date]').textContent();
 await page.keyboard.press('ArrowRight');
 expect(await page.locator('[data-sl-cursor-date]').textContent()).not.toBe(first);
 await page.keyboard.press('Escape');
 expect(errors).toEqual([]);expect(consoleErrors).toEqual([]);expect(httpErrors).toEqual([]);
 const report={passed:true,widths:[1440,1280,820,390,320],data:'owner-private synthetic Phase 03 QA fixture; not market data',backend:'real local Django application API',analysis_version:analysisVersion,converted_project:convertedID,workflows:['Analysis lineage conversion','blank entry/exit/assumptions','explicit review gate','versioned assumptions','Strategy run and holding semantics','decision-only Python export','custom-code classification and stale results','save/reopen','empty/error state','nine Research Desk views','keyboard','reduced motion','no outer overflow'],errors,console_errors:consoleErrors,http_errors:httpErrors};
 writeFileSync(output+'/browser-report.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
}catch(error){await page.screenshot({path:output+'/failure.png',fullPage:true});console.error(error);console.error({errors,consoleErrors,httpErrors});process.exitCode=1;}finally{await browser.close();}
