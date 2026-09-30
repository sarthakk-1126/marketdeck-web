import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const read = file => readFileSync(new URL('../' + file, import.meta.url),'utf8');
const section = read('src/companion-section.html');
test('bot section publishes Telegram and Discord while future tools stay explicit',()=>{
  assert.match(section,/TELEGRAM · LIVE/);assert.match(section,/DISCORD · LIVE/);assert.match(section,/EXPLORING/);
  assert.match(section,/Research Rooms/);assert.match(section,/Research Terminal/);assert.match(section,/Shared F&amp;O Lab/);
  assert.match(section,/Proactive Telegram notifications are not live yet/);
  const roadmap = section.split('class="md-bots-roadmap md-bots-roadmap-single"')[1];
  assert.doesNotMatch(roadmap,/<a\b/);
});
test('all launch links are Telegram-safe bounded public routes',()=>{
  const links=[...section.matchAll(/href="(https:\/\/t.me\/MarketDeckIndiaBot\?start=[^"]+)"/g)].map(m=>new URL(m[1]));
  assert.equal(links.length,4);
  for(const url of links){const p=url.searchParams.get('start');assert.ok(p.length<=64);assert.match(p,/^[A-Za-z0-9_-]+$/);assert.equal(url.hash,'');}
  assert.ok(links.some(u=>u.searchParams.get('start')==='web_demo_UkVMSUFOQ0U'));
});
test('Discord launch links are bounded and require a real public invite before release',()=>{
  const join=section.match(/href="(https:\/\/discord\.gg\/[^"]+)"[^>]+data-discord-entry="homepage"/)?.[1];
  assert.ok(join);
  assert.doesNotMatch(join,/__MARKETDECK_INVITE__/,'Replace the Discord invite placeholder before release');
  assert.match(section,/https:\/\/discord\.com\/channels\/1553393794324373614\/1553412312919052441/);
  assert.match(read('public/companion.js'),/discord_open/);
});

test('preview has connected tab semantics and a no-JS primary link',()=>{
  for(const key of ['research','radar','compare']){assert.ok(section.includes('id="bot-tab-'+key+'"'));assert.ok(section.includes('id="bot-preview-'+key+'"'));}
  assert.match(section,/Feature preview · not a live feed/);assert.match(section,/\?start=web_home/);
});
test('visuals and script stay local, lightweight and reduced-motion safe',()=>{
  for(const file of ['public/companion.css','public/companion.js'])assert.ok(read(file).length<15000);
  assert.match(read('public/companion.css'),/prefers-reduced-motion/);
  assert.doesNotMatch(read('public/companion.js'),/fetch\(|localStorage|sessionStorage|user_id|platform_user_id/);
  for(const icon of ['telegram','discord','reddit'])assert.ok(existsSync(new URL('../public/assets/platforms/'+icon+'.svg',import.meta.url)));
});
