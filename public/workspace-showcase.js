/* Homepage-only progressive folio motion. Static artwork and links work without
   JavaScript. No network calls, storage or continuous JavaScript render loop. */
(() => {
  'use strict';
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia?.('(hover: hover) and (pointer: fine) and (min-width: 761px)');
  document.querySelectorAll('[data-aws-holo]').forEach(folio => {
    const stage = folio.querySelector('[data-aws-holo-stage]');
    if (!stage) return;
    let visible = false;
    const reset = () => {
      stage.style.setProperty('--aws-rx', '0deg');
      stage.style.setProperty('--aws-ry', '0deg');
    };
    const motionOff = () => !!(reduced?.matches || document.hidden ||
      (folio.closest?.('[data-workspace-slide]') && !folio.closest('[data-workspace-slide]').classList.contains('is-active')) ||
      document.body.classList.contains('motion-paused') ||
      document.documentElement.classList.contains('motion-paused'));
    const sync = () => {
      const off = motionOff();
      folio.classList.toggle('aws-motion-off', off);
      folio.classList.toggle('aws-visible', visible && !off);
      if (off || !visible || !fine?.matches) reset();
      if ((off || !visible) && folio.classList.contains('aws-entered')) folio.classList.add('aws-settled');
      // Only the first entrance unfolds the page; scrolling back never replays it.
      if (visible) {
        if (off || !fine?.matches) folio.classList.add('aws-settled');
        folio.classList.add('aws-entered');
      }
    };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        sync();
      }, { threshold: .15 }).observe(folio);
    }
    folio.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' || !fine?.matches || motionOff() || !visible) return;
      const rect = folio.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, (event.clientX - rect.left) / rect.width * 2 - 1));
      const y = Math.max(-1, Math.min(1, (event.clientY - rect.top) / rect.height * 2 - 1));
      stage.style.setProperty('--aws-rx', (-y * 1.8).toFixed(2) + 'deg');
      stage.style.setProperty('--aws-ry', (x * 2.4).toFixed(2) + 'deg');
    }, { passive: true });
    folio.addEventListener('pointerleave', reset, { passive: true });
    folio.addEventListener('animationend', event => {
      if (event.animationName === 'awsPageLift') folio.classList.add('aws-settled');
    });
    reduced?.addEventListener?.('change', sync);
    fine?.addEventListener?.('change', sync);
    document.addEventListener('visibilitychange', sync);
    folio.addEventListener('aws:slidechange', sync);
    if ('MutationObserver' in window) {
      const observer = new MutationObserver(sync);
      observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    sync();
  });

  document.querySelectorAll('[data-advanced-workspaces]').forEach(root => {
    if (!root.querySelectorAll) return;
    const slides = [...root.querySelectorAll('[data-workspace-slide]')];
    const dots = [...root.querySelectorAll('[data-aws-dot]')];
    const prev = root.querySelector('[data-aws-prev]');
    const next = root.querySelector('[data-aws-next]');
    const status = root.querySelector('[data-aws-status]');
    const folio = root.querySelector('[data-aws-holo]');
    if (slides.length !== 2 || dots.length !== 2 || !prev || !next) return;
    let index = 0, visible = false, hovered = false, focused = false;
    let cooldown = false, timer = null, cooldownTimer = null, startX = null;
    const paused = () => !visible || hovered || focused || cooldown || document.hidden ||
      reduced?.matches || document.body.classList.contains('motion-paused') ||
      document.documentElement.classList.contains('motion-paused');
    const stop = () => { if (timer !== null) { window.clearTimeout(timer); timer = null; } };
    const schedule = () => {
      stop();
      if (!paused()) timer = window.setTimeout(() => show((index + 1) % slides.length, false), 8500);
    };
    const show = (target, manual = true) => {
      index = (target + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        const active = i === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', String(!active));
        slide.inert = !active;
      });
      dots.forEach((dot, i) => {
        if (i === index) dot.setAttribute('aria-current', 'true');
        else dot.removeAttribute('aria-current');
      });
      if (manual && status) status.textContent = index === 0 ? 'Research Terminal, slide 1 of 2' : 'Books and Investor Methods, slide 2 of 2';
      folio?.dispatchEvent?.(new window.Event('aws:slidechange'));
      schedule();
    };
    const interact = () => {
      cooldown = true;
      stop();
      if (cooldownTimer !== null) window.clearTimeout(cooldownTimer);
      cooldownTimer = window.setTimeout(() => { cooldown = false; schedule(); }, 12000);
    };
    [prev, next, ...dots].forEach(button => { button.disabled = false; });
    prev.addEventListener('click', () => { interact(); show(index - 1); });
    next.addEventListener('click', () => { interact(); show(index + 1); });
    dots.forEach((dot, i) => dot.addEventListener('click', () => { interact(); show(i); }));
    root.addEventListener('keydown', event => {
      if (event.altKey || event.ctrlKey || event.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName || '')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        interact();
        show(index + (event.key === 'ArrowRight' ? 1 : -1));
      }
    });
    root.addEventListener('pointerenter', () => { hovered = true; stop(); });
    root.addEventListener('pointerleave', () => { hovered = false; schedule(); });
    root.addEventListener('focusin', () => { focused = true; stop(); });
    root.addEventListener('focusout', event => {
      if (!root.contains(event.relatedTarget)) { focused = false; schedule(); }
    });
    root.addEventListener('pointerdown', event => {
      if (event.pointerType === 'touch') { startX = event.clientX; interact(); }
    }, { passive: true });
    root.addEventListener('pointerup', event => {
      if (event.pointerType !== 'touch' || startX === null) return;
      const distance = event.clientX - startX;
      startX = null;
      if (Math.abs(distance) >= 45) show(index + (distance < 0 ? 1 : -1));
    }, { passive: true });
    root.addEventListener('pointercancel', () => { startX = null; }, { passive: true });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => { visible = entries[0].isIntersecting; schedule(); }, { threshold: .25 }).observe(root);
    } else visible = true;
    document.addEventListener('visibilitychange', schedule);
    reduced?.addEventListener?.('change', schedule);
    if ('MutationObserver' in window) {
      new MutationObserver(schedule).observe(document.body, { attributes: true, attributeFilter: ['class'] });
      new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    show(0, false);
  });
})();
