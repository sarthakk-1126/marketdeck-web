/* Progressive enhancement. All content and confirmed destinations work without JS. */
(() => {
  'use strict';
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine) and (min-width: 901px)');
  const hero = document.querySelector('.hero');
  const scene = document.querySelector('.earth-scene');
  const motionButton = document.querySelector('.motion-toggle');
  const network = document.querySelector('.community-network');
  let userPaused = false;
  let heroVisible = true;
  let frame = 0;
  let pointer = { x: 0, y: 0 };
  try { userPaused = sessionStorage.getItem('marketdeck:motion-paused') === 'true'; } catch { /* Optional preference storage. */ }
  const paused = () => userPaused || motionPreference.matches;

  const paintScene = () => {
    frame = 0;
    if (paused() || !heroVisible || document.hidden || !finePointer.matches) return;
    const progress = Math.max(0, Math.min(1, -hero.getBoundingClientRect().top / hero.offsetHeight));
    scene.style.setProperty('--parallax-x', `${pointer.x * 5}px`);
    scene.style.setProperty('--parallax-y', `${pointer.y * 4 + progress * 12}px`);
    scene.style.setProperty('--earth-scale', String(1 + progress * 0.045));
  };
  const requestPaint = () => {
    if (!frame && !paused() && heroVisible && !document.hidden && finePointer.matches) frame = requestAnimationFrame(paintScene);
  };
  const applyMotion = () => {
    document.body.classList.toggle('motion-paused', paused());
    document.body.classList.toggle('motion-enabled', !paused());
    motionButton.hidden = motionPreference.matches;
    motionButton.setAttribute('aria-pressed', String(userPaused));
    motionButton.setAttribute('aria-label', userPaused ? 'Resume ambient motion' : 'Pause ambient motion');
    motionButton.querySelector('span').textContent = userPaused ? 'Resume motion' : 'Pause motion';
    motionButton.querySelector('use').setAttribute('href', `/assets/icons.svg#${userPaused ? 'play' : 'pause'}`);
    if (paused()) {
      cancelAnimationFrame(frame); frame = 0;
      scene.style.removeProperty('--parallax-x'); scene.style.removeProperty('--parallax-y'); scene.style.removeProperty('--earth-scale');
      document.querySelectorAll('.reveal.is-waiting').forEach(el => el.classList.remove('is-waiting'));
    } else requestPaint();
  };
  motionButton.addEventListener('click', () => {
    userPaused = !userPaused;
    try { sessionStorage.setItem('marketdeck:motion-paused', String(userPaused)); } catch { /* No storage is required. */ }
    applyMotion();
  });
  motionPreference.addEventListener('change', applyMotion);
  finePointer.addEventListener('change', () => {
    scene.style.removeProperty('--parallax-x'); scene.style.removeProperty('--parallax-y'); scene.style.removeProperty('--earth-scale');
    requestPaint();
  });
  hero.addEventListener('pointermove', event => {
    if (!finePointer.matches || paused()) return;
    const bounds = hero.getBoundingClientRect();
    pointer = { x: (event.clientX - bounds.left) / bounds.width - 0.5, y: (event.clientY - bounds.top) / bounds.height - 0.5 };
    requestPaint();
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer = { x: 0, y: 0 }; requestPaint(); }, { passive: true });
  window.addEventListener('scroll', requestPaint, { passive: true });
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('page-hidden', document.hidden);
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else requestPaint();
  });
  applyMotion();
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting;
      document.body.classList.toggle('hero-offscreen', !heroVisible);
      if (heroVisible) requestPaint();
    }).observe(hero);
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.remove('is-waiting'); revealObserver.unobserve(entry.target); }
    }), { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(el => {
      if (!paused() && el.getBoundingClientRect().top > window.innerHeight) el.classList.add('is-waiting');
      revealObserver.observe(el);
    });
    new IntersectionObserver(entries => {
      network.style.animationPlayState = entries[0].isIntersecting ? 'running' : 'paused';
      network.querySelector('.orbit-highlight').style.animationPlayState = entries[0].isIntersecting ? 'running' : 'paused';
    }).observe(network);
  }

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
      tab.addEventListener('click', event => { event.preventDefault(); select(tab.getAttribute(tabAttribute)); });
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
    return { select, active: () => active };
  }
  const products = enhanceTabs('.product-tabs', 'data-product', 'data-panel');
  const community = enhanceTabs('.community-tabs', 'data-community', 'data-community-panel', id => { network.dataset.active = id; });
  document.querySelectorAll('[data-community]').forEach(tab => {
    tab.addEventListener('pointerenter', () => { network.dataset.active = tab.dataset.community; });
    tab.addEventListener('pointerleave', () => { network.dataset.active = community.active(); });
  });
  const revealHash = (hash) => {
    if (hash.startsWith('#product-')) return products.select(hash.slice(9));
    if (hash.startsWith('#community-')) return community.select(hash.slice(11));
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

  const reader = document.querySelector('.article-dialog');
  let readerTrigger;
  if (typeof reader.showModal === 'function') {
    document.querySelectorAll('.editorial-card').forEach(card => {
      const summary = card.querySelector('summary');
      summary.addEventListener('click', event => {
        event.preventDefault();
        readerTrigger = summary;
        const content = reader.querySelector('.reader-content');
        const title = document.createElement('h2');
        title.id = 'reader-title';
        title.textContent = card.querySelector('h3').innerText.replace(/\n/g, ' ');
        content.replaceChildren(title, card.querySelector('.article-body').cloneNode(true));
        reader.showModal();
        reader.scrollTop = 0;
        reader.querySelector('.reader-close').focus();
      });
    });
    reader.querySelector('.reader-close').addEventListener('click', () => reader.close());
    reader.addEventListener('click', event => {
      if (event.target !== reader) return;
      const bounds = reader.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) reader.close();
    });
    reader.addEventListener('close', () => readerTrigger?.focus({ preventScroll: true }));
  }
})();
