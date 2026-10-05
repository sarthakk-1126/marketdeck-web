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
    if ('MutationObserver' in window) {
      const observer = new MutationObserver(sync);
      observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    sync();
  });
})();
