/* Homepage-only progressive 3D enhancement for the Advanced Workspaces shell.
   No API calls, storage, analytics, or continuous render loop. */
(() => {
  'use strict';
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-aws-holo]').forEach(holo => {
    const stage = holo.querySelector('[data-aws-holo-stage]');
    if (!stage) return;
    const reset = () => {
      stage.style.setProperty('--aws-rx', '0deg');
      stage.style.setProperty('--aws-ry', '0deg');
    };
    holo.addEventListener('pointermove', event => {
      if (reduced?.matches || document.documentElement.classList.contains('motion-paused')) {
        reset();
        return;
      }
      const rect = holo.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - .5) * 2));
      const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - .5) * 2));
      stage.style.setProperty('--aws-rx', (-y * 1.8).toFixed(2) + 'deg');
      stage.style.setProperty('--aws-ry', (x * 2.4).toFixed(2) + 'deg');
    }, { passive: true });
    holo.addEventListener('pointerleave', reset, { passive: true });
    reduced?.addEventListener?.('change', reset);
  });
})();
