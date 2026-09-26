import { startExperience } from './experience.js?v=mobile-hero-20260926';
const experience = startExperience();
(() => {
  const loadPreview = panel => {
    const image = panel?.querySelector('[data-preview-src]');
    if (image && !image.hasAttribute('src')) image.src = image.dataset.previewSrc;
  };
  const previewObserver = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting && !entry.target.hidden) loadPreview(entry.target);
  });
  document.querySelectorAll('[data-panel]').forEach(panel => previewObserver.observe(panel));

  function enhanceTabs(listSelector, tabAttribute, panelAttribute, onSelect = () => {}) {
    const list = document.querySelector(listSelector);
    const tabs = [...list.querySelectorAll(`[${tabAttribute}]`)];
    const panels = [...document.querySelectorAll(`[${panelAttribute}]`)];
    let active = tabs[0].getAttribute(tabAttribute);
    const select = (id, focus = false) => {
      if (!tabs.some(tab => tab.getAttribute(tabAttribute) === id)) return false;
      active = id;
      tabs.forEach(tab => {
        const selected = tab.getAttribute(tabAttribute) === id;
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        tab.classList.toggle('is-active', selected);
        if (selected && focus) tab.focus({ preventScroll: true });
      });
      panels.forEach(panel => { panel.hidden = panel.getAttribute(panelAttribute) !== id; });
      if (list.dataset.enhanced) loadPreview(panels.find(panel => !panel.hidden));
      onSelect(id);
      return true;
    };
    list.setAttribute('role', 'tablist');
    tabs.forEach((tab, index) => {
      const panel = panels.find(p => p.getAttribute(panelAttribute) === tab.getAttribute(tabAttribute));
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      panel.tabIndex = 0;
      tab.addEventListener('click', event => { event.preventDefault(); select(tab.getAttribute(tabAttribute)); panel.scrollIntoView({block:'start',behavior:'instant'}); panel.focus({preventScroll:true}); });
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = tabs.length - 1;
        if (next !== undefined) {
          event.preventDefault();
          select(tabs[next].getAttribute(tabAttribute), true);
          tabs[next].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
        }
        if (event.key === ' ') { event.preventDefault(); select(tab.getAttribute(tabAttribute)); }
      });
    });
    select(active);
    list.dataset.enhanced = 'true';
    return { select, active: () => active };
  }
  const products = enhanceTabs('.product-tabs', 'data-product', 'data-panel');
  const revealHash = (hash) => {
    if (hash.startsWith('#product-')) return products.select(hash.slice(9));
    return false;
  };
  document.querySelectorAll('a[href^="#product-"], a[href^="#community-"]').forEach(link => {
    if (!link.hasAttribute('role')) link.addEventListener('click', () => { revealHash(link.hash); });
  });
  window.addEventListener('hashchange', () => {
    if (revealHash(location.hash)) document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' });
  });
  if (revealHash(location.hash)) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'instant' }));

  const mobileMenu = document.querySelector('.mobile-menu');
  mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { mobileMenu.open = false; }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobileMenu.open) { mobileMenu.open = false; mobileMenu.querySelector('summary').focus(); }
  });
  document.addEventListener('click', event => { if (mobileMenu.open && !mobileMenu.contains(event.target)) mobileMenu.open = false; });

})();
