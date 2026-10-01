(() => {
  const consolePanel = document.querySelector('[data-pa-flagship]');
  if (!consolePanel) return;
  const buttons = [...consolePanel.querySelectorAll('[data-pa-mode]')];
  const index = consolePanel.querySelector('[data-pa-index]');
  const copy = consolePanel.querySelector('[data-pa-copy]');
  const select = button => {
    consolePanel.dataset.paActive = button.dataset.paMode;
    index.textContent = button.dataset.paLabel;
    copy.textContent = button.dataset.paCopy;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  };
  buttons.forEach(button => {
    button.addEventListener('pointerenter', () => select(button));
    button.addEventListener('focus', () => select(button));
    button.addEventListener('click', () => select(button));
  });
  if (buttons[0]) select(buttons[0]);
})();
