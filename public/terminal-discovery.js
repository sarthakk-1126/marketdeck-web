/* Progressive enhancement for illustrative product discovery. No data collection or API calls. */
(() => {
  'use strict';
  const copy = {
    fundamentals: ['Read the financial history.', 'Mix metrics and keep the reporting basis and source in view.'],
    valuation: ['Change the assumption.', 'Compare required returns, valuation models and sensitivities—not price targets.'],
    peers: ['Compare like with like.', 'Keep the reporting period, basis and missing-data limits beside the comparison.'],
    thesis: ['Keep the evidence with the idea.', 'Bring observations, counter-evidence and source pins into your private notes.']
  };
  const periods = [
    {label: 'Earlier filing', x: 181, y: 67},
    {label: 'Previous filing', x: 295, y: 44},
    {label: 'Latest filing', x: 352, y: 53}
  ];
  document.querySelectorAll('[data-rtd-preview]').forEach(root => {
    if (root.dataset.rtdReady) return;
    const selectors = [...root.querySelectorAll('[data-rtd-select]')];
    const periodButtons = [...root.querySelectorAll('[data-rtd-period-select]')];
    const title = root.querySelector('[data-rtd-title]');
    const detail = root.querySelector('[data-rtd-detail]');
    const sourcePeriod = root.querySelector('[data-rtd-source-period]');
    if (!title || !detail || !sourcePeriod) return;
    function selectView(key) {
      if (!Object.hasOwn(copy, key)) return;
      root.dataset.rtdMode = key;
      root.querySelectorAll('[data-rtd-panel]').forEach(panel => { panel.hidden = panel.dataset.rtdPanel !== key; });
      selectors.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.rtdSelect === key)));
      [title.textContent, detail.textContent] = copy[key];
    }
    function selectPeriod(value) {
      const index = Number(value);
      if (!Number.isInteger(index) || !periods[index]) return;
      const point = periods[index];
      root.dataset.rtdPeriod = String(index);
      periodButtons.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.rtdPeriodSelect) === index)));
      sourcePeriod.textContent = point.label;
      root.querySelector('.rtd-cursor path')?.setAttribute('d', `M${point.x} 10V131`);
      const cursor = root.querySelector('.rtd-cursor circle');
      cursor?.setAttribute('cx', String(point.x)); cursor?.setAttribute('cy', String(point.y));
    }
    function enhanceGroup(buttons, choose, key) {
      buttons.forEach((button, index) => {
        button.disabled = false;
        button.addEventListener('click', () => choose(button.dataset[key]));
        button.addEventListener('keydown', event => {
          let target;
          if (event.key === 'ArrowRight') target = (index + 1) % buttons.length;
          if (event.key === 'ArrowLeft') target = (index + buttons.length - 1) % buttons.length;
          if (event.key === 'Home') target = 0;
          if (event.key === 'End') target = buttons.length - 1;
          if (target === undefined) return;
          event.preventDefault(); buttons[target].focus(); choose(buttons[target].dataset[key]);
        });
      });
    }
    enhanceGroup(selectors, selectView, 'rtdSelect');
    enhanceGroup(periodButtons, selectPeriod, 'rtdPeriodSelect');
    root.dataset.rtdReady = 'true';
  });
})();
