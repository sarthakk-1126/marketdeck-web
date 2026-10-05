// Phase 02 release check: real local Django API with an owner-private synthetic QA fixture.
// No built-in or live market history is represented by this script.
import {chromium,expect} from '@playwright/test';
import {existsSync,mkdirSync,readFileSync,statSync,writeFileSync} from 'node:fs';
import {extname,join,resolve,sep} from 'node:path';

const origin=process.env.LAB_ORIGIN||'http://127.0.0.1:18566';
const output='.preview/phase02';
const publicRoot=resolve('public');
mkdirSync(output,{recursive:true});
const session=JSON.parse(readFileSync(output+'/session.json','utf8'));
const executablePath=process.env.LAB_CHROMIUM;
const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});
const context=await browser.newContext({viewport:{width:1440,height:1100}});
const errors=[];
const consoleErrors=[];
const httpErrors=[];
const mime={'.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};

// Django owns the document and APIs. The checked-out marketdeck-web public tree
// supplies the same-root sibling assets that production serves through nginx.
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
page.on('console',message=>{const text=message.text();if(message.type()==='error'&&!text.includes('Failed to load resource')&&!text.includes('marketdeck.in/assets/lens.js'))consoleErrors.push(text);});
page.on('response',response=>{const url=new URL(response.url());if(url.origin===origin&&response.status()>=400&&!url.pathname.endsWith('/favicon.ico'))httpErrors.push(`${response.status()} ${url.pathname}`);});

function qaCSV(){
 const rows=['Date,Open,High,Low,Close,Volume'];
 let day=new Date('2025-06-02T00:00:00Z'),previousLow=100;
 for(let index=0;index<65;index++){
  while(day.getUTCDay()===0||day.getUTCDay()===6)day.setUTCDate(day.getUTCDate()+1);
  const week=Math.floor(index/5),session=index%5;
  let close;
  if(week===0)close=[105,104,103,102,101][session];
  else close=[previousLow+2,previousLow-1,previousLow+1,previousLow+2,previousLow+3][session];
  const low=close-1,open=close+.5,high=close+1;
  rows.push(`${day.toISOString().slice(0,10)},${open},${high},${low},${close},${1000+index}`);
  if(session===4){const weekRows=rows.slice(-5).map(row=>Number(row.split(',')[3]));previousLow=Math.min(...weekRows);}
  day.setUTCDate(day.getUTCDate()+1);
 }
 return rows.join('\n');
}

try{
 await page.goto(origin+'/research-desk/?company=TCS.NS');
 await expect(page.locator('[data-view="lab"]')).toBeVisible();
 await page.locator('[data-view="lab"]').click();
 await expect(page.locator('[data-lab-panel]')).toBeVisible();
 await page.locator('[data-sl-project-type]').selectOption('analysis');
 await expect(page.locator('[data-sl-analysis-editor]')).toBeVisible();
 await expect(page.locator('[data-sl-analysis-editor]')).toContainText('5, 10 and 20 later supplied sessions');
 await expect(page.locator('[data-sl-analysis-editor]')).toContainText('No entry, exit, fill, position, costs, equity curve or strategy P&L');
 await expect(page.locator('[data-sl-strategy-editor]')).toBeHidden();
 await expect(page.locator('[data-sl="run"]')).toBeDisabled();

 await page.locator('[data-sl="sources"]').first().click();
 await expect(page.locator('[data-sl-readiness]')).toContainText('Built-in history unavailable');
 await expect(page.locator('[data-sl-status]')).not.toHaveText('Working…');
 await page.locator('[data-sl-csv-import]').setInputFiles({name:'phase02-weekly-low-qa.csv',mimeType:'text/csv',buffer:Buffer.from(qaCSV())});
 await expect(page.locator('[data-sl-import-preview]')).toContainText('65 supplied sessions');
 await page.locator('[data-sl-source]').fill('Synthetic Phase 02 browser QA fixture; not market data');
 await page.locator('[data-sl-basis]').selectOption('raw');
 await page.locator('[data-sl-actions]').selectOption('none');
 await page.locator('[data-sl-confirm]').check();
 await page.locator('[data-sl="import-csv"]').click();
 await expect(page.locator('[data-sl-status]')).toContainText('Imported 65 sessions');
 await expect(page.locator('[data-sl="run"]')).toBeEnabled();

 await page.locator('[data-sl="save"]').click();
 await expect(page.locator('[data-sl-save-status]')).toHaveText(/Version \d+ · saved/);
 const analysisProject=new URL(page.url()).searchParams.get('lab_project');
 const analysisSaved=await page.evaluate(async id=>(await fetch(`/research-desk/lab/project/${id}/`,{credentials:'same-origin'})).json(),analysisProject);
 const analysisVersion=analysisSaved.versions[0].id;
 expect(analysisVersion).toBeTruthy();
 await page.locator('[data-sl="run"]').click();
 await expect(page.locator('.sl-analysis-metrics')).toBeVisible();
 await expect(page.locator('[data-sl-results-title]')).toHaveText('Analysis results');
 await expect(page.locator('[data-sl-results]')).toContainText('Retrospective descriptive evidence');
 await expect(page.locator('[data-sl-records-summary]')).toHaveText('Dated observations');
 await page.locator('[data-sl-records-summary]').click();
 await expect(page.locator('[data-sl-trades] table')).toBeVisible();
 await expect(page.locator('[data-sl-results]')).toContainText('no naive confidence interval, predictive claim, trade or strategy P&L');

 const marker=page.locator('[data-sl-chart] [data-sl-event]').first();
 await expect(marker).toBeVisible();
 await marker.click();
 await expect(page.locator('[data-sl-inspector]')).toContainText('Reference week');
 await expect(page.locator('[data-sl-inspector]')).toContainText('Observation only');
 await expect(page.locator('.sl-outcome-list article').first()).toContainText('Excluded / pending');
 for(let step=0;step<5;step++)await page.locator('[data-sl="step"]').click();
 await expect(page.locator('.sl-outcome-list article').first()).not.toContainText('Excluded / pending');
 await expect(page.locator('.sl-outcome-list article').nth(1)).toContainText('Excluded / pending');

 const csvDownload=page.waitForEvent('download');
 await page.locator('[data-sl="csv"]').click();
 const csvPath=output+'/weekly-low-analysis-observations.csv';
 await (await csvDownload).saveAs(csvPath);
 expect(readFileSync(csvPath,'utf8')).toMatch(/^observation_date,reference_week_start,reference_week_end,reference,/);

 await page.locator('[data-sl="pin"]').click();
 await expect(page.locator('[data-sl-status]')).toContainText('Analysis observation pinned');
 await page.locator('[data-view="explore"]').click();
 await expect(page.locator('[data-pins]')).toContainText('Strategy Lab Analysis');
 await page.locator('[data-view="lab"]').click();

 const savedURL=page.url();
 expect(savedURL).toContain('lab_project=');
 await page.reload();
 if(!await page.locator('[data-lab-panel]').isVisible())await page.locator('[data-view="lab"]').click();
 await expect(page.locator('[data-sl-project-type]')).toHaveValue('analysis');
 await expect(page.locator('.sl-analysis-metrics')).toBeVisible();
 await expect(page.locator('[data-sl-project-type]')).toBeDisabled();

 for(const width of [1440,1280,820,390,320]){
  await page.setViewportSize({width,height:1100});
  await page.emulateMedia({reducedMotion:'reduce'});
  if(width<=820){
   await page.locator('[data-sl-area="chart"]').click();
   await expect(page.locator('[data-sl-chart] svg')).toBeVisible();
   await page.locator('[data-sl-area="rules"]').click();
   await expect(page.locator('[data-sl-analysis-editor]')).toBeVisible();
   await page.locator('[data-sl-area="inspector"]').click();
   await expect(page.locator('[data-sl-inspector]')).toBeVisible();
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`outer overflow at ${width}`).toBe(true);
  await page.screenshot({path:output+`/analysis-${width}.png`,fullPage:true});
 }

 await page.setViewportSize({width:1440,height:1100});
 for(const view of ['explore','charts','valuation','derivatives','peers','scenarios','changes','thesis','notes']){
  await page.locator(`[data-view="${view}"]`).click();
  await expect(page.locator(`[data-${view}-panel]`)).toBeVisible();
 }
 await page.locator('[data-view="lab"]').click();
 await expect(page.locator('[data-sl="convert"]')).toBeVisible();
 await page.locator('[data-sl="convert"]').click();
 await expect(page.locator('[data-sl-project-type]')).toHaveValue('strategy');
 await expect(page.locator('[data-sl-strategy-editor]')).toBeVisible();
 await expect(page.locator('[data-sl="save"]')).toBeDisabled();
 expect(await page.locator('[data-sl-condition="entry"]').count()).toBe(0);
 expect(await page.locator('[data-sl-condition="exit"]').count()).toBe(0);
 await page.locator('[data-sl-add="entry"]').click();
 await page.locator('[data-sl-add="exit"]').click();
 await page.locator('[data-sl-assumption="capital"]').evaluate(input=>{input.closest('details').open=true;});
 for(const input of await page.locator('[data-sl-assumption]').all())expect(await input.inputValue()).toBe('');
 await expect(page.locator('[data-sl="save"]')).toBeEnabled();
 await page.locator('[data-sl="save"]').click();
 await expect(page.locator('[data-sl-save-status]')).toHaveText(/Version \d+ · saved/);
 const convertedID=new URL(page.url()).searchParams.get('lab_project');
 expect(convertedID).not.toBeNull();
 const converted=await page.evaluate(async id=>{
  const response=await fetch(`/research-desk/lab/project/${id}/`,{credentials:'same-origin'});
  return response.json();
 },convertedID);
 expect(converted.project.project_type).toBe('strategy');
 expect(converted.project.origin).toBe('analysis_conversion');
 expect(converted.project.source_analysis_version).toBe(analysisVersion);
 expect(converted.project.draft.entry.conditions).toHaveLength(1);
 expect(converted.project.draft.exit.conditions).toHaveLength(1);
 await page.reload();
 if(!await page.locator('[data-lab-panel]').isVisible())await page.locator('[data-view="lab"]').click();
 await expect(page.locator('[data-sl-project]')).toHaveValue(convertedID);
 await expect(page.locator('[data-sl-project-type]')).toHaveValue('strategy');
 await expect(page.locator('[data-sl-project-type]')).toBeDisabled();
 for(const input of await page.locator('[data-sl-assumption]').all())expect(await input.inputValue()).toBe('');
 await expect(page.locator('[data-sl="run"]')).toBeDisabled();

 expect(errors).toEqual([]);
 expect(consoleErrors).toEqual([]);
 expect(httpErrors).toEqual([]);
 const report={
  passed:true,
  widths:[1440,1280,820,390,320],
  data:'owner-private synthetic Phase 02 QA fixture; not market data',
  backend:'real local Django application API',
  workflows:['fixed readable weekly-low definition','owner-private CSV import','dated 5/10/20 outcomes','exclusions and causal replay','chart marker and event detail','CSV export','save and reopen','Analysis research pin','nine Research Desk views','explicit new Strategy conversion without inherited rules or costs'],
  analysis_version:analysisVersion,
  converted_project:convertedID,
  errors,
  console_errors:consoleErrors,
  http_errors:httpErrors,
 };
 writeFileSync(output+'/browser-report.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
}catch(error){
 await page.screenshot({path:output+'/failure.png',fullPage:true});
 console.error(error);console.error({errors,consoleErrors});process.exitCode=1;
}finally{await browser.close();}
