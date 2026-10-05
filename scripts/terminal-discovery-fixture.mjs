// Serve exact candidate files through Playwright routing; no local server dependency.
import {existsSync,readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
export const origin='http://marketdeck-preview.test';
export async function wirePreview(context){
 const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2','.woff':'font/woff','.json':'application/json'};
 async function respond(route){
  const url=new URL(route.request().url()),p=url.pathname;
  let f;
  if(p==='/screener/research-terminal/')f=resolve('../evidence/rendered-landing.html');
  else if(p==='/screener/')f=resolve('../evidence/rendered-screener.html');
  else if(p==='/__baseline__/')f=resolve('../evidence/baseline-index.html');
  else if(p.startsWith('/screener/static/'))f=resolve('../screener/screener/static',p.slice('/screener/static/'.length));
  else f=resolve('public','.'+(p==='/'?'/index.html':p));
  if(existsSync(f)){await route.fulfill({status:200,contentType:types[extname(f)]||'application/octet-stream',body:readFileSync(f)});return;}
  await route.fulfill({status:404,contentType:'text/plain',body:'Local fixture not found'});
 }
 await context.route(origin+'/**',respond);
 await context.route('https://marketdeck.in/**',respond);
 await context.route(/google-analytics\.com|googletagmanager\.com|platform\.marketdeck\.in\/analytics\//,r=>r.abort());
}
