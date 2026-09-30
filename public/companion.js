// Progressive enhancement only: every platform and public link remains in the HTML.
const section = document.getElementById('bots');

if (section) {
  const previewTabs = [...section.querySelectorAll('[data-bot-tab]')];
  const previewTablist = section.querySelector('[data-bot-tabs]');

  function activatePreview(tab, focus = false) {
    for (const item of previewTabs) {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
    }
    if (focus) tab.focus();
  }

  if (previewTablist) previewTablist.hidden = false;
  for (const tab of previewTabs) {
    tab.addEventListener('click', () => activatePreview(tab));
    tab.addEventListener('keydown', event => {
      const index = previewTabs.indexOf(tab);
      let next;
      if (event.key === 'ArrowRight') next = previewTabs[(index + 1) % previewTabs.length];
      if (event.key === 'ArrowLeft') next = previewTabs[(index + previewTabs.length - 1) % previewTabs.length];
      if (event.key === 'Home') next = previewTabs[0];
      if (event.key === 'End') next = previewTabs.at(-1);
      if (next) {
        event.preventDefault();
        activatePreview(next, true);
      }
    });
  }

  const platformTablist = section.querySelector('[data-platform-tabs]');
  const platformTabs = [...section.querySelectorAll('[data-platform-tab]')];
  const platformPanels = [...section.querySelectorAll('[data-platform-panel]')];
  const controls = section.querySelector('[data-platform-controls]');
  const previousButton = section.querySelector('[data-platform-prev]');
  const nextButton = section.querySelector('[data-platform-next]');
  const counter = section.querySelector('[data-platform-count]');
  const stage = section.querySelector('[data-platform-stage]');
  const focusable = 'a[href],button:not([disabled]),[tabindex]';
  const allowedPlatforms = new Set(['telegram', 'discord', 'reddit']);
  let activeIndex = 0;

  function setPanelFocusable(panel, active) {
    for (const item of panel.querySelectorAll(focusable)) {
      if (!active) {
        if (!Object.hasOwn(item.dataset, 'communityTabindex')) item.dataset.communityTabindex = item.getAttribute('tabindex') ?? '';
        item.tabIndex = -1;
        continue;
      }
      if (!Object.hasOwn(item.dataset, 'communityTabindex')) continue;
      const saved = item.dataset.communityTabindex;
      if (saved === '') item.removeAttribute('tabindex');
      else item.setAttribute('tabindex', saved);
      delete item.dataset.communityTabindex;
    }
  }

  function trackPlatform(platform) {
    if (!allowedPlatforms.has(platform) || typeof window.gtag !== 'function') return;
    window.gtag('event', 'community_platform_view', {
      platform,
      page_location: 'https://marketdeck.in/',
      transport_type: 'beacon'
    });
  }

  function selectPlatform(index, { focusTab = false, track = false } = {}) {
    activeIndex = (index + platformPanels.length) % platformPanels.length;
    const activePlatform = platformPanels[activeIndex].dataset.platformPanel;

    platformPanels.forEach((panel, panelIndex) => {
      const distance = (panelIndex - activeIndex + platformPanels.length) % platformPanels.length;
      const position = distance === 0 ? 'active' : distance === 1 ? 'next' : 'prev';
      const active = position === 'active';
      panel.dataset.position = position;
      panel.dataset.active = String(active);
      setPanelFocusable(panel, active);
    });

    platformTabs.forEach((tab, tabIndex) => {
      const active = tabIndex === activeIndex;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });

    if (counter) counter.textContent = `${activePlatform.toUpperCase()} 0${activeIndex + 1} / 03`;
    if (focusTab) platformTabs[activeIndex].focus();
    if (track) trackPlatform(activePlatform);
  }

  if (platformTablist && controls && stage && platformPanels.length === 3) {
    platformTablist.hidden = false;
    controls.hidden = false;
    section.classList.add('is-enhanced');
    selectPlatform(0);

    platformTabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectPlatform(index, { track: true }));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % platformTabs.length;
        if (event.key === 'ArrowLeft') next = (index + platformTabs.length - 1) % platformTabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = platformTabs.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        selectPlatform(next, { focusTab: true, track: true });
      });
    });

    previousButton?.addEventListener('click', () => selectPlatform(activeIndex - 1, { track: true }));
    nextButton?.addEventListener('click', () => selectPlatform(activeIndex + 1, { track: true }));

    let pointerId;
    let startX = 0;
    let startY = 0;
    let dragX = 0;
    let horizontalDrag = false;

    function finishDrag(event) {
      if (event.pointerId !== pointerId) return;
      const activePanel = platformPanels[activeIndex];
      stage.classList.remove('is-dragging');
      activePanel.style.removeProperty('--drag-x');
      if (horizontalDrag && Math.abs(dragX) >= 48) selectPlatform(activeIndex + (dragX < 0 ? 1 : -1), { track: true });
      pointerId = undefined;
      dragX = 0;
      horizontalDrag = false;
    }

    stage.addEventListener('pointerdown', event => {
      if (event.button !== 0 || event.target.closest('a,button')) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      dragX = 0;
      horizontalDrag = false;
      stage.setPointerCapture?.(pointerId);
    });

    stage.addEventListener('pointermove', event => {
      if (event.pointerId !== pointerId) return;
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      if (!horizontalDrag && Math.abs(deltaY) > Math.abs(deltaX)) return;
      if (Math.abs(deltaX) < 7) return;
      horizontalDrag = true;
      dragX = Math.max(-96, Math.min(96, deltaX));
      stage.classList.add('is-dragging');
      platformPanels[activeIndex].style.setProperty('--drag-x', `${dragX}px`);
      event.preventDefault();
    });

    stage.addEventListener('pointerup', finishDrag);
    stage.addEventListener('pointercancel', finishDrag);
  }

  const telegramPlacements = new Set(['homepage', 'homepage_channel', 'homepage_demo', 'homepage_radar', 'homepage_compare']);
  const telegramFeatures = new Set(['home', 'channel', 'research', 'radar', 'compare']);
  const discordPlacements = new Set(['homepage', 'homepage_research_desk']);
  const discordFeatures = new Set(['join', 'research_desk']);

  section.addEventListener('click', event => {
    const telegram = event.target.closest?.('a[data-telegram-entry]');
    if (telegram && telegramPlacements.has(telegram.dataset.telegramEntry) && telegramFeatures.has(telegram.dataset.telegramFeature)) {
      if (typeof window.gtag === 'function') window.gtag('event', 'telegram_open', {
        placement: telegram.dataset.telegramEntry,
        feature: telegram.dataset.telegramFeature,
        page_location: 'https://marketdeck.in/',
        transport_type: 'beacon'
      });
      return;
    }

    const discord = event.target.closest?.('a[data-discord-entry]');
    if (!discord || !discordPlacements.has(discord.dataset.discordEntry) || !discordFeatures.has(discord.dataset.discordFeature)) return;
    if (typeof window.gtag === 'function') window.gtag('event', 'discord_open', {
      placement: discord.dataset.discordEntry,
      feature: discord.dataset.discordFeature,
      page_location: 'https://marketdeck.in/',
      transport_type: 'beacon'
    });
  });
}
