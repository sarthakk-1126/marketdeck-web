import { answerQuestion, categories, searchFaqs } from './lens-knowledge.js';

const launcher = document.querySelector('[data-lens-launcher]');
const dialog = document.querySelector('#marketdeck-lens');
if (launcher && dialog && typeof dialog.showModal === 'function') {
  const $ = selector => dialog.querySelector(selector);
  const input = $('#lens-question');
  const form = $('[data-lens-form]');
  const scroll = $('[data-lens-scroll]');
  const transcript = $('[data-lens-transcript]');
  const status = $('[data-lens-status]');
  const search = $('#lens-faq-search');
  const faqList = $('[data-lens-faq-list]');
  const faqCount = $('[data-lens-faq-count]');
  const close = $('[data-lens-close]');
  const tabs = [...dialog.querySelectorAll('[role="tab"]')];
  let context = {}, category = categories[0];
  const node = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  };
  const icon = name => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'icon'); svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS(svg.namespaceURI, 'use');
    use.setAttribute('href', `/assets/icons.svg#${name}`); svg.append(use); return svg;
  };
  function appendLinks(parent, links = []) {
    const list = node('div', 'lens-links');
    for (const { label, href, detail } of links) {
      // Only curated same-site routes are supported, even if knowledge is edited later.
      if (!/^\/(?!\/)/.test(href)) continue;
      const a = node('a', 'lens-link'); a.href = href;
      const copy = node('span', 'lens-link-copy');
      copy.append(node('strong', '', label)); if (detail) copy.append(node('small', '', detail));
      a.append(icon(href.startsWith('/charts/') ? 'chart' : href.startsWith('/screener/search/') ? 'building' : 'document'), copy, icon('arrow-up')); list.append(a);
    }
    if (list.childElementCount) parent.append(list);
  }
  function appendSuggestions(parent, suggestions = []) {
    if (!suggestions.length) return;
    const group = node('div', 'lens-suggestions');
    for (const text of suggestions) {
      const button = node('button', 'lens-chip', text); button.type = 'button';
      button.dataset.lensAsk = text; group.append(button);
    }
    parent.append(group);
  }
  function setView(view, focus = false) {
    for (const tab of tabs) {
      const active = tab.dataset.lensView === view;
      tab.setAttribute('aria-selected', String(active)); tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    }
    form.hidden = view !== 'guide';
    $('[data-lens-faq-footer]').hidden = view !== 'faqs';
    if (focus) (view === 'faqs' ? search : input).focus({ preventScroll: true });
  }
  function renderFaqs() {
    const results = searchFaqs(search.value, category);
    const fragment = document.createDocumentFragment();
    for (const faq of results) {
      const item = node('details', 'lens-faq');
      const summary = node('summary'); summary.append(node('span', '', faq.question), icon('chevron'));
      const body = node('div', 'lens-faq-answer'); body.append(node('p', '', faq.answer));
      appendLinks(body, faq.links); appendSuggestions(body, faq.suggestions);
      item.append(summary, body); fragment.append(item);
    }
    if (!results.length) {
      const empty = node('div', 'lens-faq-empty'); empty.append(node('strong', '', 'No matching question yet.'), node('p', '', 'Try “data”, “account” or “portfolio”, or ask the guide.'));
      const button = node('button', 'lens-chip', 'Ask the guide'); button.type = 'button';
      button.addEventListener('click', () => { setView('guide', true); input.value = search.value.slice(0, 280); syncSend(); });
      empty.append(button); fragment.append(empty);
    }
    faqList.replaceChildren(fragment);
    faqCount.textContent = `${results.length} ${results.length === 1 ? 'question' : 'questions'}`;
  }
  for (const label of categories) {
    const button = node('button', 'lens-chip lens-category', label); button.type = 'button';
    button.setAttribute('aria-pressed', String(label === category));
    button.addEventListener('click', () => {
      category = label;
      for (const chip of $('[data-lens-categories]').children) chip.setAttribute('aria-pressed', String(chip === button));
      renderFaqs();
    });
    $('[data-lens-categories]').append(button);
  }
  function syncSend() { $('[data-lens-send]').disabled = !input.value.trim(); }
  function ask(question) {
    const query = question.trim().slice(0, 280);
    const reply = answerQuestion(query, context);
    if (!reply) return;
    if (reply.view) { setView(reply.view, true); return; }
    setView('guide');
    context = reply.context ?? {};
    const exchange = node('div', 'lens-exchange');
    const user = node('p', 'lens-user', query); user.setAttribute('aria-label', `You: ${query}`);
    const answer = node('div', 'lens-answer');
    const avatar = node('img', 'lens-answer-mark'); avatar.src = '/assets/marketdeck-mark.png'; avatar.width = 26; avatar.height = 26; avatar.alt = '';
    answer.append(avatar);
    answer.append(node('span', 'lens-answer-label', 'MARKETDECK LENS'), node('p', '', reply.answer));
    appendLinks(answer, reply.links); appendSuggestions(answer, reply.suggestions);
    exchange.append(user, answer); transcript.append(exchange);
    while (transcript.childElementCount > 20) transcript.firstElementChild.remove();
    input.value = ''; syncSend();
    status.textContent = reply.answer;
    // Immediate replies keep the composer usable; no artificial typing delay.
    requestAnimationFrame(() => { scroll.scrollTop = scroll.scrollHeight; });
  }
  launcher.addEventListener('click', () => {
    dialog.showModal(); launcher.setAttribute('aria-expanded', 'true');
    close.focus({ preventScroll: true });
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { launcher.setAttribute('aria-expanded', 'false'); launcher.focus({ preventScroll: true }); });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    }
    const question = event.target.closest('[data-lens-ask]');
    if (question) ask(question.dataset.lensAsk);
    const link = event.target.closest('a');
    if (link && new URL(link.href).pathname === '/' && new URL(link.href).hash) dialog.close();
  });
  form.addEventListener('submit', event => { event.preventDefault(); ask(input.value); if (!form.hidden) input.focus({ preventScroll: true }); });
  input.addEventListener('input', syncSend);
  search.addEventListener('input', renderFaqs);
  for (const tab of tabs) {
    tab.addEventListener('click', () => setView(tab.dataset.lensView));
    tab.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (tabs.indexOf(tab) + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      setView(tabs[next].dataset.lensView); tabs[next].focus();
    });
  }
  $('[data-lens-reset]').addEventListener('click', () => {
    context = {}; transcript.replaceChildren(); input.value = ''; search.value = ''; category = categories[0];
    for (const chip of $('[data-lens-categories]').children) chip.setAttribute('aria-pressed', String(chip.textContent === category));
    renderFaqs(); syncSend(); setView('guide'); scroll.scrollTop = 0;
    status.textContent = 'New conversation started.';
  });
  // Account for the visible phone keyboard without introducing an iframe or overlay app.
  const viewport = window.visualViewport;
  const fitViewport = () => {
    if (viewport) { dialog.style.setProperty('--lens-viewport-height', `${Math.round(viewport.height)}px`); dialog.style.setProperty('--lens-viewport-top', `${Math.round(viewport.offsetTop)}px`); }
  };
  viewport?.addEventListener('resize', fitViewport);
  viewport?.addEventListener('scroll', fitViewport);
  fitViewport(); renderFaqs(); syncSend();
  document.body.classList.add('lens-ready'); launcher.hidden = false;
}
