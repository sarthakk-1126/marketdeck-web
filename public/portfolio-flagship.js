(() => {
  const consolePanel = document.querySelector('[data-pa-flagship]');
  if (!consolePanel) return;
  const buttons = [...consolePanel.querySelectorAll('[data-pa-mode]')];
  const index = consolePanel.querySelector('[data-pa-index]');
  const copy = consolePanel.querySelector('[data-pa-copy]');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let manual = false;
  let paused = false;
  let active = 0;
  const select = (button, fromUser = false) => {
    if (fromUser) manual = true;
    active = buttons.indexOf(button);
    consolePanel.dataset.paActive = button.dataset.paMode;
    index.textContent = button.dataset.paLabel;
    copy.textContent = button.dataset.paCopy;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  };
  buttons.forEach(button => {
    button.addEventListener('pointerenter', () => select(button, true));
    button.addEventListener('focus', () => select(button, true));
    button.addEventListener('click', () => select(button, true));
  });
  if (buttons[0]) select(buttons[0]);
  consolePanel.addEventListener('pointerenter', () => { paused = true; });
  consolePanel.addEventListener('pointerleave', () => {
    paused = false;
    consolePanel.style.removeProperty('--pa-rx');
    consolePanel.style.removeProperty('--pa-ry');
  });
  consolePanel.addEventListener('focusin', () => { paused = true; });
  consolePanel.addEventListener('focusout', () => { paused = false; });
  consolePanel.addEventListener('pointermove', event => {
    if (reduced.matches || event.pointerType === 'touch') return;
    const bounds = consolePanel.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - .5;
    const y = (event.clientY - bounds.top) / bounds.height - .5;
    consolePanel.style.setProperty('--pa-rx', `${(-y * 4).toFixed(2)}deg`);
    consolePanel.style.setProperty('--pa-ry', `${(x * 6).toFixed(2)}deg`);
  });
  window.setInterval(() => {
    if (!reduced.matches && !manual && !paused && buttons.length) select(buttons[(active + 1) % buttons.length]);
  }, 5200);
})();
