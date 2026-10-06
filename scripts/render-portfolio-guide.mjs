// Run against the local labelled Django QA fixture only. No production account/data.
// PORTFOLIO_GUIDE_DEMO_URL=http://127.0.0.1:8004/screener/research-desk/?company=QAA.NS&view=lab&lab_mode=portfolio node scripts/render-portfolio-guide.mjs
import {chromium} from 'playwright';
import {spawn,spawnSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {portfolioGuide} from '../src/portfolio-lab-guide-content.js';
const url=process.env.PORTFOLIO_GUIDE_DEMO_URL;
if(!url||new URL(url).hostname!=='127.0.0.1')throw Error('Use the owner-private, fictional local QA fixture on 127.0.0.1.');
await mkdir('.preview/guide-render',{recursive:true});await mkdir('public/assets/guides',{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:'.preview/guide-render',size:{width:1280,height:720}}});
const page=await context.newPage();
const wait=ms=>new Promise(r=>setTimeout(r,ms));
try{
 await page.goto(url);await page.getByRole('button',{name:'＋ Build a basket',exact:true}).waitFor();
 await page.addStyleTag({content:`body{padding-top:156px!important;padding-bottom:78px!important}.rd-toolbar,.rd-sidebar,.pl-guide-start{display:none!important}.rd-layout{display:block!important}.rd-main{padding:18px 36px!important;max-width:none!important}.guide-record-heading{position:fixed;inset:0 0 auto;background:#0b111b;z-index:99999;padding:22px 36px 18px;border-bottom:1px solid #233448;color:#f0f5fa;font-family:system-ui;pointer-events:none}.guide-record-heading small{font-size:12px;letter-spacing:1px;color:#4ce1eb}.guide-record-heading h1{font-size:30px;line-height:1.2;margin:9px 0 7px;letter-spacing:-.6px}.guide-record-heading p{font-size:15px;color:#afbfce;line-height:1.5;margin:0;max-width:1040px}.guide-record-footer{position:fixed;inset:auto 0 0;background:#0b111b;z-index:99999;padding:15px 36px;color:#a9bacb;border-top:1px solid #233448;font:13px/1.5 system-ui;pointer-events:none}.guide-record-footer strong{color:#4ce1eb;font-weight:500}.guide-record-highlight{outline:3px solid #4ce1eb!important;outline-offset:5px!important;border-radius:9px}.guide-record-progress{position:fixed;left:0;bottom:0;height:3px;background:#39cdeb;z-index:100000;pointer-events:none}`});
 await page.evaluate(()=>{const h=document.createElement('aside');h.className='guide-record-heading';h.innerHTML='<small>MarketDeck · Lab / Portfolio playground · GUIDE EXAMPLE</small><h1></h1><p></p>';document.body.append(h);const f=document.createElement('aside');f.className='guide-record-footer';f.innerHTML='<strong>Fictional instruments · illustrative inputs.</strong> Research only. No purchases, forecast or historical return claim.';document.body.append(f);const progress=document.createElement('div');progress.className='guide-record-progress';document.body.append(progress);});
 const subtitles=[
  'Build a basket, try practice, or load a read-only copy of your holdings.',
  'Search by name, ticker or scheme code. Check the exact fund plan and option; set a starting budget.',
  'Type a percentage or move a slider. Lock rows; try equal or shuffled weights. Undo the preceding mix edit.',
  'Choose the assets, enter an assumed price move, then select Apply assumption. Compare its impact.',
  'Set your return assumptions, monthly contribution, years and inflation. Inspect a year on the chart.',
  'Select an asset for its stored value and date. Mutual-fund NAV and ETF exchange price are different.',
  'Sign in to save. Name the experiment, write a note, and compare immutable saved versions.'
 ];
 const epoch=Date.now();
 const ready=()=>page.locator('[data-pl-update]').filter({hasText:'Ready'}).waitFor();
 const frame=async(i,focus)=>{
  await page.evaluate(({i,title,body})=>{document.querySelector('.guide-record-heading h1').textContent=String(i+1).padStart(2,'0')+' / '+title;document.querySelector('.guide-record-heading p').textContent=body;document.querySelector('.guide-record-progress').style.width=(i+1)/7*100+'%';document.querySelectorAll('.guide-record-highlight').forEach(e=>e.classList.remove('guide-record-highlight'));},{i,title:portfolioGuide.steps[i].title,body:subtitles[i]});
  if(focus){await page.locator(focus).evaluate(el=>{el.scrollIntoView({block:'start'});window.scrollBy(0,-180);el.classList.add('guide-record-highlight');});}
 };
 const until=async end=>wait(Math.max(0,end*1000-(Date.now()-epoch)));
 await frame(0,'.pl-source');await page.screenshot({path:'.preview/guide-render/poster.png'});await until(8);
 await frame(1,'.pl-source');await page.getByRole('button',{name:'＋ Build a basket',exact:true}).click();
 const select=async(kind,q,id)=>{await page.locator('[data-pl-kind]').selectOption(kind);await page.locator('[data-pl-search]').fill(q);await page.locator('[data-pl-add="'+id+'"]').click();};
 await select('stock','QAA','stock:1');await select('fund','Aurora','fund:990001');await select('etf','QAETF','etf:1');
 await page.locator('[data-pl-budget]').fill('100000');await frame(1,'.pl-builder');await wait(1800);await page.getByRole('button',{name:'Create basket',exact:true}).click();await ready();await until(18);
 await frame(2,'.pl-editor');await page.locator('[data-pl-number="stock:1"]').fill('20');await ready();await page.locator('[data-pl-lock="fund:990001"]').check();await ready();await wait(1300);await page.getByRole('button',{name:'Shuffle weights',exact:true}).click();await ready();await wait(1400);await page.getByRole('button',{name:'Undo mix',exact:true}).click();await ready();await until(28);
 await page.getByRole('button',{name:'02 · What if?',exact:true}).click();await frame(3,'.pl-canvas');await page.locator('[data-pl-shock-number]').fill('-20');await page.getByRole('button',{name:'Apply assumption',exact:true}).click();await ready();await until(36);
 await page.getByRole('button',{name:'03 · Grow an idea',exact:true}).click();await ready();await frame(4,'.pl-canvas');await page.locator('[data-pl-monthly]').fill('5000');await ready();await page.locator('[data-pl-inflation]').fill('5');await ready();await page.locator('[data-pl-all-rate]').fill('8');await page.getByRole('button',{name:'Apply to all assets',exact:true}).click();await ready();await page.locator('[data-pl-year]').press('ArrowLeft');await frame(4,'[data-pl-growth-controls]');await until(48);
 await page.locator('button[data-pl-select="fund:990001"]').click();await frame(5,'.pl-inspector');await wait(2900);await page.locator('button[data-pl-select="etf:1"]').click();await frame(5,'.pl-inspector');await until(56);
 await frame(6,'.pl-notebook');await page.locator('[data-pl-name]').fill('GUIDE EXAMPLE · My first experiment');await page.locator('[data-pl-note]').fill('Fictional guide example. Comparing weights with the same budget and explicit assumptions.');await page.getByRole('button',{name:'Save private version',exact:true}).click();await page.locator('[data-pl-status]').filter({hasText:'Saved private version'}).waitFor();await page.getByRole('button',{name:'04 · Compare',exact:true}).click();await frame(6,'.pl-compare');await until(64);
 const videoPath=await page.video().path();await context.close();await browser.close();
 const captions='WEBVTT\n\n'+portfolioGuide.steps.map((s,i)=>`${i+1}\n00:${String(Math.floor(s.start/60)).padStart(2,'0')}:${String(s.start%60).padStart(2,'0')}.000 --> 00:${String(Math.floor(s.end/60)).padStart(2,'0')}:${String(s.end%60).padStart(2,'0')}.000\n${s.title}. ${subtitles[i]}\n`).join('\n');
 await writeFile('public/assets/guides/portfolio-playground-v1.vtt',captions);
 // Capture starts before the page is ready. Trim its preparation frames from the start.
 const probe=spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',videoPath],{encoding:'utf8'});if(probe.status)throw Error(probe.stderr);
 const duration=Number(probe.stdout),trim=Math.max(0,duration-64);
 const encode=spawnSync('ffmpeg',['-y','-ss',String(trim),'-i',videoPath,'-t','64','-an','-vf','fps=20','-c:v','libx264','-preset','medium','-crf','28','-pix_fmt','yuv420p','-movflags','+faststart','public/assets/guides/portfolio-playground-v1.mp4'],{encoding:'utf8'});if(encode.status)throw Error(encode.stderr);
 const webm=spawnSync('ffmpeg',['-y','-i','public/assets/guides/portfolio-playground-v1.mp4','-an','-c:v','libvpx-vp9','-b:v','0','-crf','36','-row-mt','1','-deadline','good','-cpu-used','4','public/assets/guides/portfolio-playground-v1.webm'],{encoding:'utf8'});if(webm.status)throw Error(webm.stderr);
 const poster=spawnSync('ffmpeg',['-y','-i','.preview/guide-render/poster.png','-frames:v','1','-c:v','libwebp','-quality','82','public/assets/guides/portfolio-playground-v1.webp'],{encoding:'utf8'});if(poster.status)throw Error(poster.stderr);
 console.log(JSON.stringify({duration:64,source:videoPath,trim,video:'public/assets/guides/portfolio-playground-v1.mp4',audio:'ElevenLabs generation blocked; captioned silent guide'}));
}finally{await context.close().catch(()=>{});await browser.close().catch(()=>{});}
