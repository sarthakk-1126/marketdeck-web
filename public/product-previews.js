import { metrics, screenedCompanies, expiryPayoff, priceSeries, volumeSeries, cryptoSeries, sampleDate, excerpts } from './product-preview-model.js';

// No polling, networking, persistence, audio simulation, or idle animation.
const blue = '#59a7f5'; // Existing homepage --blue.
const slate = '#8fa1bd';
const loss = '#ad7d92';
const money = value => `${value < 0 ? '−' : ''}₹${Math.abs(value).toFixed(0)}`;

function chartFrame(canvas, range) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return null;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(ratio, ratio);
  const area = { left: 2, right: width - 3, top: 18, bottom: height - 4 };
  const x = value => area.left + value * (area.right - area.left);
  const y = value => area.bottom - (value - range[0]) / (range[1] - range[0]) * (area.bottom - area.top);
  ctx.strokeStyle = '#202a36';
  ctx.lineWidth = .7;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const yy = area.top + i / 3 * (area.bottom - area.top);
    ctx.moveTo(area.left, yy); ctx.lineTo(area.right, yy);
  }
  for (let i = 0; i < 5; i++) { ctx.moveTo(x(i / 4), area.top); ctx.lineTo(x(i / 4), area.bottom); }
  ctx.stroke();
  return { ctx, x, y, area };
}

function seriesPlot(canvas, series, mode = 'price', index = null) {
  const min = mode === 'volume' ? 0 : Math.min(...series) - 7;
  const max = Math.max(...series) * 1.015;
  const frame = chartFrame(canvas, [min, max]);
  if (!frame) return;
  const { ctx, x, y, area } = frame;
  if (mode === 'volume') {
    ctx.fillStyle = blue;
    ctx.globalAlpha = .65;
    series.forEach((value, i) => ctx.fillRect(x(i / (series.length - 1)), y(value), Math.max(1, (area.right - area.left) / series.length - 2), area.bottom - y(value)));
    ctx.globalAlpha = 1;
  } else {
    ctx.strokeStyle = blue; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
    ctx.beginPath();
    series.forEach((value, i) => i ? ctx.lineTo(x(i / (series.length - 1)), y(value)) : ctx.moveTo(x(0), y(value)));
    ctx.stroke();
  }
  if (index !== null) {
    const xx = x(index / (series.length - 1)), yy = y(series[index]);
    ctx.strokeStyle = slate; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(xx, area.top); ctx.lineTo(xx, area.bottom); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = blue; ctx.beginPath(); ctx.arc(xx, yy, 3.5, 0, Math.PI * 2); ctx.fill();
  }
}

function payoffPlot(canvas, strategy, price) {
  const frame = chartFrame(canvas, [-120, 120]);
  if (!frame) return;
  const { ctx, x, y, area } = frame;
  ctx.strokeStyle = slate; ctx.lineWidth = .8;
  ctx.beginPath(); ctx.moveTo(area.left, y(0)); ctx.lineTo(area.right, y(0)); ctx.stroke();
  for (let s = 150; s < 350; s++) {
    const a = expiryPayoff(strategy, s), b = expiryPayoff(strategy, s + 1);
    ctx.strokeStyle = (a + b) / 2 >= 0 ? blue : loss; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x((s - 150) / 200), y(a)); ctx.lineTo(x((s + 1 - 150) / 200), y(b)); ctx.stroke();
  }
  const xx = x((price - 150) / 200), yy = y(expiryPayoff(strategy, price));
  ctx.strokeStyle = slate; ctx.setLineDash([3, 3]); ctx.lineWidth = .8;
  ctx.beginPath(); ctx.moveTo(xx, area.top); ctx.lineTo(xx, area.bottom); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = blue; ctx.beginPath(); ctx.arc(xx, yy, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = slate; ctx.font = '10px Inter, Segoe UI, sans-serif';
  ctx.fillText('+120', 3, 11); ctx.textAlign = 'right'; ctx.fillText('P&L / unit at expiry', area.right, 11);
}

function screen(card, metric) {
  const config = metrics[metric], rows = screenedCompanies(metric);
  card.querySelector('[data-screen-metric]').textContent = config.label;
  const list = card.querySelector('[data-screen-rows]');
  list.replaceChildren(...rows.map(company => {
    const row = document.createElement('li'), name = document.createElement('span'), meter = document.createElement('meter'), value = document.createElement('strong');
    name.textContent = company.name;
    meter.min = 0; meter.max = config.max; meter.value = company[metric];
    value.textContent = `${company[metric]}${config.suffix}`;
    meter.setAttribute('aria-label', `${company.name} ${config.label}: ${value.textContent}`);
    row.append(name, meter, value);
    return row;
  }));
  card.querySelector('[data-screen-status]').textContent = `Sample data · fictional companies · ${metric === 'debt' ? 'lowest first' : 'highest first'}`;
}

for (const card of document.querySelectorAll('.suite-overview-card')) {
  const preview = card.querySelector('[data-product-preview]');
  if (!preview) continue;
  const id = preview.dataset.productPreview;
  const canvas = preview.querySelector('canvas');
  const state = { mode: { stockproof: 'growth', charting: 'price', fno: 'call', commentary: 'earnings', crypto: 'btc' }[id], index: 42, price: 250, excerpt: 0 };
  function draw() {
    if (id === 'charting') {
      const series = state.mode === 'price' ? priceSeries : volumeSeries;
      seriesPlot(canvas, series, state.mode, state.index);
      const text = `${sampleDate(state.index)} · ${series[state.index].toFixed(state.mode === 'price' ? 2 : 1)}${state.mode === 'volume' ? 'M' : ''}`;
      preview.querySelector('[data-chart-tooltip]').textContent = text;
      canvas.setAttribute('aria-valuenow', state.index);
      canvas.setAttribute('aria-valuetext', `${state.mode}, ${text}, fictional sample`);
    } else if (id === 'crypto') {
      seriesPlot(canvas, cryptoSeries[state.mode]);
      canvas.setAttribute('aria-label', `Illustrative ${state.mode.toUpperCase()} series, July to September 2026; not historical market data`);
      preview.querySelector('[data-crypto-status]').textContent = `Sample data · ${state.mode.toUpperCase()} · Jul–Sep 2026`;
    } else if (id === 'fno') {
      payoffPlot(canvas, state.mode, state.price);
      const payoff = expiryPayoff(state.mode, state.price);
      const label = { call: 'Long call', put: 'Long put', covered: 'Covered call' }[state.mode];
      canvas.setAttribute('aria-label', `${label} expiry payoff; strike ₹250, premium ₹20${state.mode === 'covered' ? ', underlying purchased at ₹250' : ''}`);
      preview.querySelector('[data-payoff-price]').textContent = money(state.price);
      preview.querySelector('[data-payoff-status]').textContent = `Expiry P&L: ${money(payoff)} / unit${state.mode === 'covered' ? ' · bought at ₹250' : ''}`;
    } else if (id === 'stockproof') screen(preview, state.mode);
    else if (id === 'commentary') {
      preview.querySelector('[data-excerpt-source]').textContent = state.mode === 'earnings' ? 'Earnings excerpt' : 'Filing excerpt';
      preview.querySelector('[data-excerpt-text]').textContent = `“${excerpts[state.mode][state.excerpt].text}”`;
      preview.querySelectorAll('[data-preview-excerpt]').forEach((button, i) => {
        button.textContent = excerpts[state.mode][i].label;
        button.setAttribute('aria-pressed', String(i === state.excerpt));
      });
      preview.querySelector('.preview-note').textContent = state.mode === 'earnings' ? 'Illustrative transcript · fictional source' : 'Illustrative filing · fictional source';
    }
  }
  preview.querySelectorAll('[data-preview-choice]').forEach(button => button.addEventListener('click', () => {
    state.mode = button.dataset.previewChoice;
    if (id === 'commentary') state.excerpt = 0;
    preview.querySelectorAll('[data-preview-choice]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    draw();
  }));
  if (id === 'charting') {
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'slider');
    canvas.setAttribute('aria-label', 'Inspect sample chart; use left and right arrow keys');
    canvas.setAttribute('aria-valuemin', '0'); canvas.setAttribute('aria-valuemax', '63');
    canvas.setAttribute('aria-orientation', 'horizontal');
    let queued = false;
    const inspect = event => {
      const rect = canvas.getBoundingClientRect();
      state.index = Math.max(0, Math.min(63, Math.round((event.clientX - rect.left) / rect.width * 63)));
      if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; draw(); }); }
    };
    canvas.addEventListener('pointermove', event => { if (event.pointerType !== 'touch' || canvas.hasPointerCapture(event.pointerId)) inspect(event); });
    canvas.addEventListener('pointerdown', event => { canvas.setPointerCapture(event.pointerId); canvas.focus({ preventScroll: true }); inspect(event); });
    canvas.addEventListener('keydown', event => {
      const offsets = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 };
      if (!(event.key in offsets) && event.key !== 'Home' && event.key !== 'End') return;
      event.preventDefault();
      state.index = event.key === 'Home' ? 0 : event.key === 'End' ? 63 : Math.max(0, Math.min(63, state.index + offsets[event.key]));
      draw();
    });
  }
  if (id === 'fno') preview.querySelector('.preview-range').addEventListener('input', event => { state.price = Number(event.target.value); draw(); });
  preview.querySelectorAll('[data-preview-excerpt]').forEach(button => button.addEventListener('click', () => { state.excerpt = Number(button.dataset.previewExcerpt); draw(); }));
  preview.hidden = false;
  card.dataset.previewReady = 'true';
  preview.querySelectorAll('button,input').forEach(control => { control.disabled = false; });
  draw();
  if (canvas && typeof ResizeObserver !== 'undefined') new ResizeObserver(draw).observe(canvas);
}
