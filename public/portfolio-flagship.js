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

/* MarketDeck homepage portfolio visual. This schematic contains no portfolio calculations. */
(() => {
  const terminal = document.querySelector('[data-pa-flagship]');
  const canvas = terminal?.querySelector('[data-pa-aperture]');
  if (!canvas) return;
  const scene = canvas.parentElement;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;
  canvas.dataset.ready = 'true';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const TAU = Math.PI * 2;
  const modeNames = ['performance', 'risk', 'tail', 'distribution', 'factors', 'diversification', 'frontier', 'implied'];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const x = clamp((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };
  let width = 1, height = 1, scale = 1, frame = 0, visible = true, running = false;
  let mode = Math.max(1, modeNames.indexOf(terminal.dataset.paActive) + 1), previous = mode, changedAt = performance.now();
  let ringAngle = 1.05 - ((mode - .5) / 8 - .5) * TAU;
  let pointerX = 0, pointerY = 0, tiltX = 0, tiltY = 0, wakeUntil = 0;

  const resize = () => {
    const box = scene.getBoundingClientRect();
    width = Math.max(1, Math.round(box.width));
    height = Math.max(1, Math.round(box.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    scale = Math.min(width / 370, height / 260) * (width < 350 ? 1.14 : 1.35);
    draw(performance.now());
  };

  const project = (x, y, z, yaw, pitch, bob = 0) => {
    const xr = x * Math.cos(yaw) - z * Math.sin(yaw);
    const zr = x * Math.sin(yaw) + z * Math.cos(yaw);
    const yy = y + bob;
    const depth = zr * Math.cos(pitch) + yy * Math.sin(pitch);
    const perspective = 570 / (570 - depth * .31);
    return {
      x: width * .5 + xr * scale * perspective,
      y: height * .54 + (zr * Math.sin(pitch) - yy * Math.cos(pitch)) * scale * perspective,
      depth
    };
  };

  const polygon = (points, fill, stroke, line = 1) => {
    ctx.beginPath();
    points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = line; ctx.stroke(); }
  };

  const line3 = (points, yaw, pitch, color, size, blur = 0, bob = 0) => {
    if (points.length < 2) return;
    ctx.beginPath();
    points.forEach((p, i) => {
      const q = project(p[0], p[1], p[2], yaw, pitch, bob);
      i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = size * scale;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (blur) { ctx.shadowColor = '#2d83ff'; ctx.shadowBlur = blur * scale; }
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const signal = (m, u, v, phase) => {
    const bell = Math.exp(-Math.pow((u + .06) / .48, 2));
    switch (m) {
      case 1: return -8 + 52 * (u + 1) / 2 + 13 * Math.sin(u * 5.4 + v * 2.2) + 3 * Math.sin(phase + u * 5);
      case 2: return 8 + 38 * Math.sin((u + 1.1) * 2.6) * Math.exp(-v * v * .8) + 15 * v;
      case 3: return 5 + 65 * bell * (1 - .36 * Math.abs(v)) + 4 * Math.sin(phase + u * 4 + v);
      case 4: return 8 + 67 * Math.exp(-Math.pow((u + .18) / .48, 2)) * (1 - .28 * Math.abs(v)) + 13 * u;
      case 5: return 9 + 53 * Math.exp(-Math.pow((u - v * .45) / .58, 2)) + 13 * Math.sin(v * 8 + u * 2);
      case 6: return 12 + 20 * Math.sin(u * 7 + v * 5) + 18 * Math.cos(v * 6 - u * 3);
      case 7: return -15 + 82 * Math.pow((u + 1) / 2, 1.7) + 14 * (v + 1) / 2;
      default: return 4 + 51 * Math.exp(-Math.pow((u - .3 - v * .18) / .58, 2)) + 12 * v;
    }
  };

  const backdrop = () => {
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, '#0b111e'); bg.addColorStop(.6, '#101827'); bg.addColorStop(1, '#080e19');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
    const halo = ctx.createRadialGradient(width * .5, height * .57, 0, width * .5, height * .57, width * .52);
    halo.addColorStop(0, 'rgba(27,78,165,.24)'); halo.addColorStop(.5, 'rgba(14,42,95,.10)'); halo.addColorStop(1, 'rgba(6,13,25,0)');
    ctx.fillStyle = halo; ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(116,147,197,.045)'; ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 27) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
    for (let y = 0; y < height; y += 27) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
    const shadow = ctx.createRadialGradient(width * .5, height * .84, 4, width * .5, height * .84, 148 * scale);
    shadow.addColorStop(0, 'rgba(0,0,0,.47)'); shadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shadow;
    ctx.save(); ctx.translate(0, height * .84); ctx.scale(1, .24); ctx.translate(0, -height * .84);
    ctx.fillRect(0, 0, width, height); ctx.restore();
  };

  const ringSegment = (i, yaw, pitch, selected, bob, front, spin) => {
    // Extruded octagonal shell. A small angular gap makes all eight sectors legible.
    const a = (i / 8 - .5) * TAU + .025 + spin, b = ((i + 1) / 8 - .5) * TAU - .025 + spin;
    const vertex = (radius, angle, y) => project(Math.cos(angle) * radius, y, Math.sin(angle) * radius, yaw, pitch, bob);
    const o0 = vertex(130, a, 0), o1 = vertex(130, b, 0);
    const i0 = vertex(92, a, 0), i1 = vertex(92, b, 0);
    const ob0 = vertex(130, a, -17), ob1 = vertex(130, b, -17);
    const ib0 = vertex(92, a, -17), ib1 = vertex(92, b, -17);
    const light = selected ? 'rgba(42,113,246,.88)' : front ? '#263344' : '#1b2635';
    polygon([ob0, ob1, o1, o0], selected ? '#1749a4' : '#141d2b', selected ? 'rgba(99,171,255,.48)' : 'rgba(96,124,161,.26)', .8);
    polygon([ib1, ib0, i0, i1], selected ? '#103879' : '#111a27', null);
    polygon([o0, o1, i1, i0], light, selected ? 'rgba(133,190,255,.88)' : 'rgba(114,144,178,.34)', selected ? 1.2 : .8);
    line3([[Math.cos(a) * 126, 1, Math.sin(a) * 126], [Math.cos(b) * 126, 1, Math.sin(b) * 126]], yaw, pitch, selected ? 'rgba(99,188,255,.84)' : 'rgba(169,194,222,.22)', selected ? 1.1 : .65, selected ? 7 : 0, bob);
    if (selected) {
      const m = (a + b) / 2, start = vertex(101, m, 1), end = vertex(120, m, 1);
      ctx.strokeStyle = 'rgba(207,231,255,.86)'; ctx.lineWidth = .9;
      ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke();
    }
  };

  const volume = (m, yaw, pitch, alpha, phase, bob) => {
    if (alpha <= .002) return;
    ctx.save(); ctx.globalAlpha = alpha;
    const base = 'rgba(69,140,255,';
    // Precise horizon and an inset calibration grid anchor the volume to the ring.
    for (let j = -3; j <= 3; j++) {
      const s = j * 29;
      line3([[-83, 0, s], [83, 0, s]], yaw, pitch, 'rgba(73,133,212,.16)', .55, 0, bob);
      line3([[s, 0, -80], [s, 0, 80]], yaw, pitch, 'rgba(73,133,212,.13)', .55, 0, bob);
    }
    line3([[-87, 0, 0], [87, 0, 0]], yaw, pitch, 'rgba(122,186,255,.47)', 1, 6, bob);

    // The lattice comprises depth-sorted curves through actual 3D coordinates.
    for (let row = 0; row < 23; row++) {
      const v = (row / 22) * 2 - 1;
      const points = [];
      for (let col = 0; col <= 38; col++) {
        const u = (col / 38) * 2 - 1;
        points.push([u * 80, signal(m, u, v, phase), v * 71]);
      }
      line3(points, yaw, pitch, `${base}${(.16 + (1 - Math.abs(v)) * .23).toFixed(2)})`, .7, 0, bob);
    }
    for (let col = 0; col <= 22; col++) {
      const u = (col / 22) * 2 - 1;
      const points = [];
      for (let row = 0; row <= 28; row++) {
        const v = (row / 28) * 2 - 1;
        points.push([u * 80, signal(m, u, v, phase), v * 71]);
      }
      line3(points, yaw, pitch, `${base}${(col % 4 === 0 ? .44 : .20).toFixed(2)})`, col % 4 === 0 ? .9 : .65, 0, bob);
    }
    for (let v of [-.76, -.25, .25, .76]) {
      const ridge = [];
      for (let col = 0; col <= 60; col++) {
        const u = (col / 60) * 2 - 1;
        ridge.push([u * 80, signal(m, u, v, phase) + 1.5, v * 71]);
      }
      line3(ridge, yaw, pitch, 'rgba(123,190,255,.76)', 1.05, 9, bob);
    }
    if (m === 3 || m === 4) {
      // Downside filaments plunge below the threshold, as in the concept image.
      for (let row = 0; row < 20; row++) {
        const v = (row / 19) * 2 - 1;
        const points = [];
        for (let col = 0; col <= 28; col++) {
          const u = -1 + col / 28 * 1.32;
          const tail = Math.exp(-Math.pow((u + .68) / .32, 2));
          points.push([u * 80, -8 - 78 * tail * (1 - .28 * Math.abs(v)), v * (62 - tail * 42)]);
        }
        line3(points, yaw, pitch, 'rgba(46,115,238,.34)', .8, row % 5 === 0 ? 5 : 0, bob);
      }
    }
    if (m === 5 || m === 6) {
      for (let j = 0; j < 14; j++) {
        const a = j * 2.399, r = 20 + (j % 4) * 14;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        const y = signal(m, x / 80, z / 71, phase);
        line3([[x, 0, z], [x, y, z]], yaw, pitch, 'rgba(73,155,255,.32)', .7, 0, bob);
        const p = project(x, y, z, yaw, pitch, bob);
        ctx.beginPath(); ctx.arc(p.x, p.y, (j % 3 ? 1.5 : 2.5) * scale, 0, TAU);
        ctx.fillStyle = 'rgba(158,216,255,.85)'; ctx.shadowColor = '#3d9bff'; ctx.shadowBlur = 9 * scale; ctx.fill(); ctx.shadowBlur = 0;
      }
    }
    ctx.restore();
  };

  const draw = now => {
    const elapsed = now / 1000;
    tiltX += (pointerX - tiltX) * .085;
    tiltY += (pointerY - tiltY) * .085;
    const motion = reduced.matches ? 0 : 1;
    const yaw = -.18 + tiltX * .22 + Math.sin(elapsed * .25) * .035 * motion;
    const pitch = .52 + tiltY * .16;
    const bob = Math.sin(elapsed * .9) * 2.2 * motion;
    const phase = elapsed * .6 * motion;
    backdrop();
    const selection = mode - 1;
    const target = 1.05 - ((selection + .5) / 8 - .5) * TAU;
    const delta = Math.atan2(Math.sin(target - ringAngle), Math.cos(target - ringAngle));
    ringAngle += delta * (reduced.matches ? 1 : .095);
    const ring = Array.from({ length: 8 }, (_, i) => ({
      index: i,
      depth: Math.sin(((i + .5) / 8 - .5) * TAU + ringAngle + yaw)
    }));
    ring.sort((a, b) => a.depth - b.depth);
    ring.filter(s => s.depth <= 0).forEach(s => ringSegment(s.index, yaw, pitch, s.index === selection, bob, false, ringAngle));
    const change = reduced.matches ? 1 : smooth(0, 850, now - changedAt);
    if (previous !== mode && change < 1) volume(previous, yaw, pitch, 1 - change, phase, bob);
    volume(mode, yaw, pitch, change, phase, bob);
    ring.filter(s => s.depth > 0).forEach(s => ringSegment(s.index, yaw, pitch, s.index === selection, bob, true, ringAngle));
    frame++;
  };

  const tick = now => {
    if (!visible) { running = false; return; }
    const activeMotion = !reduced.matches && !document.hidden;
    if (activeMotion || now < wakeUntil) {
      draw(now);
      window.requestAnimationFrame(tick);
    } else { draw(now); running = false; }
  };
  const start = () => { if (!running && visible) { running = true; window.requestAnimationFrame(tick); } };
  const changeMode = () => {
    const next = Math.max(1, modeNames.indexOf(terminal.dataset.paActive) + 1);
    if (next === mode) return;
    previous = mode; mode = next; changedAt = performance.now();
    wakeUntil = changedAt + 1000; start();
  };
  new MutationObserver(changeMode).observe(terminal, { attributes: true, attributeFilter: ['data-pa-active'] });
  scene.addEventListener('pointermove', event => {
    if (reduced.matches || event.pointerType === 'touch') return;
    const rect = scene.getBoundingClientRect();
    pointerX = clamp((event.clientX - rect.left) / rect.width - .5, -.5, .5);
    pointerY = clamp((event.clientY - rect.top) / rect.height - .5, -.5, .5);
    start();
  });
  scene.addEventListener('pointerleave', () => { pointerX = pointerY = 0; start(); });
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(scene);
  else window.addEventListener('resize', resize);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) start();
  }, { rootMargin: '100px' }).observe(scene);
  reduced.addEventListener?.('change', start);
  document.addEventListener('visibilitychange', start);
  resize(); start();
})();
