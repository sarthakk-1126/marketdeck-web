import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const section = read('src/companion-section.html');
const script = read('public/companion.js');
const styles = read('public/companion.css');

test('community showcase truthfully publishes three live platforms and one exploration', () => {
  assert.match(section, /TELEGRAM · LIVE/);
  assert.match(section, /WHATSAPP · LIVE/);
  assert.match(section, /DISCORD · LIVE/);
  assert.match(section, /REDDIT · EXPLORING/);
  assert.match(section, /The MarketDeck Reddit profile is live\. The integration is not launched\./);
  assert.match(section, /Proactive Telegram notifications are not live yet/);
  assert.match(section, /AI answers remain disabled/);
  assert.doesNotMatch(section, /Discord[^<]{0,40}(?:planned|coming soon)/i);
});

test('platform selector and all four panels exist in static semantic HTML', () => {
  assert.match(section, /data-platform-tabs[^>]+role="tablist"/);
  for (const platform of ['telegram', 'whatsapp', 'discord', 'reddit']) {
    assert.match(section, new RegExp(`data-platform-tab="${platform}"`));
    assert.match(section, new RegExp(`data-platform-panel="${platform}"`));
    assert.match(section, new RegExp(`id="platform-panel-${platform}"`));
  }
  const ids = [...section.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'Carousel IDs must be unique');
});

test('all Telegram launch links remain bounded public routes', () => {
  assert.match(section, /https:\/\/t\.me\/MarketDeckIndiaBot\?start=web_home/);
  assert.match(section, /https:\/\/t\.me\/MarketDeckIndia"/);
  const links = [...section.matchAll(/href="(https:\/\/t\.me\/MarketDeckIndiaBot\?start=[^"]+)"/g)].map(match => new URL(match[1]));
  assert.equal(links.length, 4);
  for (const url of links) {
    const payload = url.searchParams.get('start');
    assert.ok(payload.length <= 64);
    assert.match(payload, /^[A-Za-z0-9_-]+$/);
    assert.equal(url.hash, '');
  }
  assert.ok(links.some(url => url.searchParams.get('start') === 'web_demo_UkVMSUFOQ0U'));
});

test('WhatsApp launch links open the live assistant and analytics stay bounded', () => {
  assert.match(section, /href="https:\/\/wa\.me\/917054433446\?text=MENU"[^>]+data-whatsapp-entry="homepage"/);
  assert.match(section, /href="https:\/\/wa\.me\/917054433446\?text=MARKET"[^>]+data-whatsapp-entry="homepage_demo"/);
  assert.match(section, /https:\/\/whatsapp\.com\/channel\/0029VbDS6wnJZg40dVWH5t37/);
  assert.match(script, /whatsapp_open/);
  assert.match(script, /new Set\(\['menu', 'channel', 'market'\]\)/);
});

test('Discord launch links are exact and analytics stay bounded', () => {
  assert.match(section, /href="https:\/\/discord\.gg\/NTc5gPTr7N"[^>]+data-discord-entry="homepage"/);
  assert.match(section, /https:\/\/discord\.com\/channels\/1553393794324373614\/1553412312919052441/);
  assert.doesNotMatch(section, /__MARKETDECK_INVITE__/);
  assert.match(script, /discord_open/);
  assert.match(script, /new Set\(\['join', 'research_desk'\]\)/);
});

test('Reddit profile is the only Reddit destination and no live integration link is invented', () => {
  const redditPanel = section.match(/<article id="platform-panel-reddit"[\s\S]*?<\/article>/)?.[0];
  assert.ok(redditPanel);
  const links = [...redditPanel.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(links, ['https://www.reddit.com/user/MarketDeck/']);
  assert.doesNotMatch(redditPanel, /data-reddit|Open Reddit (?:bot|integration)|Launch Reddit/i);
});

test('Telegram preview keeps connected tabs and source-safety language', () => {
  for (const key of ['research', 'radar', 'compare']) {
    assert.ok(section.includes(`id="bot-tab-${key}"`));
    assert.ok(section.includes(`id="bot-preview-${key}"`));
  }
  assert.match(section, /Feature preview · not a live feed or a trading signal/);
  assert.match(section, /no live Kite quote redistribution/);
});

test('carousel remains local, lightweight, reduced-motion safe and private', () => {
  assert.ok(gzipSync(styles).length < 5_000, 'Carousel CSS should stay under 5 KB gzipped');
  assert.ok(gzipSync(script).length < 3_500, 'Carousel JS should stay under 3.5 KB gzipped');
  assert.match(styles, /prefers-reduced-motion:reduce/);
  assert.match(styles, /overflow:(?:hidden|clip)/);
  assert.match(script, /community_platform_view/);
  assert.match(script, /new Set\(\['telegram', 'whatsapp', 'discord', 'reddit'\]\)/);
  assert.doesNotMatch(script, /fetch\(|localStorage|sessionStorage|user_id|platform_user_id|invite_token|account_id/);
  assert.doesNotMatch(section + styles + script, /swiper|three\.js|framer-motion/i);
  for (const icon of ['telegram', 'whatsapp', 'discord', 'reddit']) assert.ok(existsSync(new URL(`../public/assets/platforms/${icon}.svg`, import.meta.url)));
});
