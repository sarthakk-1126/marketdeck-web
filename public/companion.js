// Progressive enhancement only: every launch link also works without JavaScript.
const section = document.getElementById('bots');
if (section) {
  const tabs = [...section.querySelectorAll('[data-bot-tab]')];
  const tablist = section.querySelector('[data-bot-tabs]');
  if (tablist) tablist.hidden = false;
  function activate(tab, focus = false) {
    for (const item of tabs) {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
    }
    if (focus) tab.focus();
  }
  for (const tab of tabs) {
    tab.addEventListener('click', () => activate(tab));
    tab.addEventListener('keydown', event => {
      const index = tabs.indexOf(tab);
      let next;
      if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
      if (event.key === 'ArrowLeft') next = tabs[(index + tabs.length - 1) % tabs.length];
      if (event.key === 'Home') next = tabs[0];
      if (event.key === 'End') next = tabs[tabs.length - 1];
      if (next) { event.preventDefault(); activate(next, true); }
    });
  }
  const placements = new Set(['homepage', 'homepage_channel', 'homepage_demo', 'homepage_radar', 'homepage_compare']);
  const features = new Set(['home', 'channel', 'research', 'radar', 'compare']);
  const discordPlacements = new Set(['homepage', 'homepage_research_desk']);
  const discordFeatures = new Set(['join', 'research_desk']);
  section.addEventListener('click', event => {
    const telegram = event.target.closest?.('a[data-telegram-entry]');
    if (telegram && placements.has(telegram.dataset.telegramEntry) && features.has(telegram.dataset.telegramFeature)) {
      // Use the site's existing analytics only. Never send account IDs or URL payloads.
      if (typeof window.gtag === 'function') window.gtag('event', 'telegram_open', {
        placement: telegram.dataset.telegramEntry, feature: telegram.dataset.telegramFeature,
        page_location: 'https://marketdeck.in/', transport_type: 'beacon'
      });
      return;
    }
    const discord = event.target.closest?.('a[data-discord-entry]');
    if (!discord || !discordPlacements.has(discord.dataset.discordEntry) || !discordFeatures.has(discord.dataset.discordFeature)) return;
    if (typeof window.gtag === 'function') window.gtag('event', 'discord_open', {
      placement: discord.dataset.discordEntry, feature: discord.dataset.discordFeature,
      page_location: 'https://marketdeck.in/', transport_type: 'beacon'
    });
  });
}
