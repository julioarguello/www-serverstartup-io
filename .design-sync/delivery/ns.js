/* Fotograma «nosotros» + reloj de la home (7 fotogramas × 6 s, fundidos de 800 ms).
   Variante «Filamento» (2026-10-09). ?t=ms instante inicial · ?still=1 congela · ?loop=a,b repite el tramo [a,b) */
(() => {
  const Q = new URLSearchParams(location.hash.slice(1) || location.search);
  const V = 'a'; // «Filamento»: las aristas del cubo se encienden en blanco papel desde el centro de la «Y»
  const STILL = Q.get('still') === '1';
  const LOOP = (Q.get('loop') || '').split(',').map(Number).filter(n => !isNaN(n));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.querySelector('.s-hero');
  const header = document.getElementById('site-header');
  const stage = hero.querySelector('.s-hero__stage');
  const photos = [...hero.querySelectorAll('.s-hero__photo')];
  const items = [...hero.querySelectorAll('.s-hero__item')];
  const rules = [...hero.querySelectorAll('.s-hero__rule')];
  const stops = [...hero.querySelectorAll('.s-hero__stop')];
  const card = hero.querySelector('.s-hero__card');
  const h1 = hero.querySelector('h1');
  const svg = hero.querySelector('.ns-art');
  const N = 7, STEP = 6000, D = reduce ? 1 : 800;
  const SEAL = ['#F38020', '#EA4335', '#6B4FBB', '#3E7D50', '#008FD3', '#1D4E89'];
  // tail per frame. Phone: the tail sits on the flat band -> the on-band tints (section 4).
  // Desktop: each on-band tint lightened toward paper only as far as that frame's measured backing needs for 4.5:1.
  const TAIL_M = ['#A8A49C', '#F38020', '#EC5D51', '#9582CE', '#669874', '#0F95D5', '#708FB4'];
  // per frame (2026-10-09): backing measured on guidelines/current/screens/home-frame-*.jpg under the tail (99th pct, +3 % margin);
  // the tint is raised in OKLCH lightness at its own hue, keeping all the chroma sRGB allows (capped at the on-band tint), only to the luminance that frame needs
  let TAIL_D = ['#A8A49C', '#FFB98C', '#FFA89D', '#D5CAFF', '#82B58F', '#98D6FF', '#97B8DE'];
  const idx = hero.querySelector('.ns-index');
  let CH = null;
  const EDGE = ['#A8A49C', ...SEAL];
  const PAPER = '#F7F5F0', BAND = '#232724', HAZE = '#A1ABAA';
  const NS = 'http://www.w3.org/2000/svg';
  const cl = x => Math.max(0, Math.min(1, x));
  const ease = x => { x = cl(x); return x * x * (3 - 2 * x); };
  const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const lerpC = (a, b, k) => { const A = hex(a), B = hex(b); return 'rgb(' + A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',') + ')'; };
  const mix = (k) => lerpC(BAND, PAPER, k);

  let G = null, el = {};
  function sizeCard(desk) {
    const cs = getComputedStyle(card);
    const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const hs = [idx.offsetHeight, ...items.map(it => it.offsetHeight)];
    CH = { pad, hs };
    hero.style.paddingBottom = desk ? (parseFloat(cs.bottom) + pad + Math.max(...hs) + 32) + 'px' : '';
  }
  function layout() {
    const desk = innerWidth >= 1025;
    sizeCard(desk);
    const W = hero.clientWidth, H = hero.offsetHeight;
    const hb = header.getBoundingClientRect().bottom - hero.getBoundingClientRect().top;
    const bandBot = desk ? H : stage.offsetHeight;
    let hexH = 0.86 * (bandBot - hb);
    let botY = bandBot - (desk ? 24 : 12);
    if (!desk) {
      // phone: the index card sits on the strip's foot; the cube stands above it, never under a letter
      const cardTop = card.parentElement.getBoundingClientRect().top - hero.getBoundingClientRect().top - (CH.pad + Math.max(...CH.hs));
      botY = Math.min(botY, cardTop - 16);
      hexH = Math.min(hexH, botY - hb - 12);
    }
    if (desk) {
      // fit the cube in the free space left of / below the text, never under it
      const hr = hero.getBoundingClientRect(), gap = 32;
      let L = Infinity, B = -Infinity;
      [h1, hero.querySelector('.s-hero__kicker'), ...stops, ...items, card].filter(Boolean).forEach(n => textRects(n).forEach(r => { if (!r.width) return; L = Math.min(L, r.left - hr.left); B = Math.max(B, r.bottom - hr.top); }));
      const byLeft = ((L - gap) / 0.7) / 0.86, byBelow = botY - (B + gap);
      hexH = Math.max(120, Math.min(hexH, Math.max(byLeft, byBelow)));
    }
    const s = hexH / 200, hexW = 172 * s;
    const tx = -0.3 * hexW - 14 * s, ty = botY - hexH - 14 * s;
    const P = (x, y) => [tx + s * x, ty + s * y];
    const pt = { T: P(100, 14), UR: P(186, 64), LR: P(186, 164), B: P(100, 214), LL: P(14, 164), UL: P(14, 64), C: P(100, 114) };
    const seg = (a, b) => `M${a[0].toFixed(1)},${a[1].toFixed(1)} L${b[0].toFixed(1)},${b[1].toFixed(1)}`;
    const poly = ps => 'M' + ps.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L') + ' Z';
    const S = (x1, y1, x2, y2) => seg(P(x1, y1), P(x2, y2));
    const outline = poly([pt.T, pt.UR, pt.LR, pt.B, pt.LL, pt.UL]) + ' ' + seg(pt.UL, pt.C) + ' ' + seg(pt.C, pt.UR) + ' ' + seg(pt.C, pt.B);
    const subs = [S(57, 39, 143, 89), S(143, 39, 57, 89), S(57, 89, 57, 189), S(14, 114, 100, 164), S(143, 89, 143, 189), S(100, 164, 186, 114)];
    const faceTop = poly([pt.T, pt.UR, pt.C, pt.UL]), faceL = poly([pt.UL, pt.C, pt.B, pt.LL]), faceR = poly([pt.C, pt.UR, pt.LR, pt.B]);
    const stg = desk ? { x: 0, y: 0, w: W, h: H } : { x: 0, y: 0, w: W, h: bandBot };
    const sw = desk ? 8 : 4;
    G = { W, H, desk, s, hexW, hexH, pt, sw };
    const C = pt.C;
    let art = '';
    if (V === 'a') {
      const spokes = [[pt.C, pt.UL], [pt.C, pt.UR], [pt.C, pt.B]];
      const ring = [[pt.UL, pt.T], [pt.UR, pt.T], [pt.UR, pt.LR], [pt.B, pt.LR], [pt.B, pt.LL], [pt.UL, pt.LL]];
      const lw = desk ? 3 : 2;
      const segs = (arr, cls) => arr.map(([a, b]) => `<path class="${cls}" d="${seg(a, b)}"/>`).join('');
      art = `<circle class="ns-spill" cx="${C[0]}" cy="${C[1]}" r="${0.78 * hexW}" fill="url(#nsSpill)"/>
      <g class="ns-lines" fill="none" stroke="${PAPER}" stroke-linecap="round">
        <g class="ns-bloom" filter="url(#nsBloom)" stroke-width="${lw * 3}">${segs(spokes, 'sp')}${segs(ring, 'rg')}</g>
        <g stroke-width="${lw}">${segs(spokes, 'sp')}${segs(ring, 'rg')}</g>
        <g class="ns-subs" stroke-width="${desk ? 1.5 : 1}">${subs.map(d => `<path d="${d}"/>`).join('')}</g>
      </g>`;
    }
    svg.setAttribute('width', W); svg.setAttribute('height', H); svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = `<defs>
      <filter id="nsSoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${desk ? 5 : 3}"/></filter>
      <filter id="nsBloom" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${desk ? 7 : 4}"/></filter>
      <mask id="nsK" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#fff"/><g class="ns-krects" fill="#000" filter="url(#nsSoft)"></g></mask>
      <radialGradient id="nsSpill"><stop offset="0" stop-color="${PAPER}" stop-opacity=".09"/><stop offset=".5" stop-color="${PAPER}" stop-opacity=".035"/><stop offset="1" stop-color="${PAPER}" stop-opacity="0"/></radialGradient>
      <radialGradient id="nsHalo"><stop offset="0" stop-color="${PAPER}" stop-opacity=".6"/><stop offset=".33" stop-color="${PAPER}" stop-opacity=".24"/><stop offset=".6" stop-color="${PAPER}" stop-opacity=".07"/><stop offset="1" stop-color="${PAPER}" stop-opacity="0"/></radialGradient>
      <linearGradient id="nsLamp"><stop offset="0" stop-color="${PAPER}" stop-opacity=".14"/><stop offset="1" stop-color="${PAPER}" stop-opacity="0"/></linearGradient>
      <linearGradient id="nsFootG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".62" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><mask id="nsFoot" maskUnits="userSpaceOnUse" x="-50" y="0" width="${W + 100}" height="${H}"><rect x="-50" y="0" width="${W + 100}" height="${bandBot + 60}" fill="url(#nsFootG)"/></mask>
      <radialGradient id="nsGlow"><stop offset="0" stop-color="${PAPER}" stop-opacity=".1"/><stop offset=".55" stop-color="${PAPER}" stop-opacity=".04"/><stop offset="1" stop-color="${PAPER}" stop-opacity="0"/></radialGradient>
      <linearGradient id="nsHaze"><stop offset="0" stop-color="${HAZE}" stop-opacity="0"/><stop offset="1" stop-color="${HAZE}" stop-opacity=".16"/></linearGradient>
    </defs>
    <g class="ns-us"${desk ? '' : ' mask="url(#nsFoot)"'}>
      <rect class="ns-haze" x="${stg.w * 0.72}" y="${stg.y}" width="${stg.w * 0.28}" height="${stg.h}" fill="url(#nsHaze)"/>
      <g class="ns-cube">${art}</g>
    </g>
    <g>
      <path class="ns-dim" d="${outline}" fill="none" stroke="${PAPER}" stroke-width="${sw}" stroke-linejoin="round" opacity=".16"/>
      ${SEAL.map(c => `<path class="ns-seal" d="${outline}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linejoin="round" opacity="0"/>`).join('')}
    </g>`;
    // the lines of the cube (not faces, not light) go under the knockout mask
    const cube = svg.querySelector('.ns-cube');
    const masked = [...cube.querySelectorAll('.ns-lines,.ns-edge,.ns-rim,.ns-inner,.ns-cells,.ns-cellsL')];

    el = {
      us: svg.querySelector('.ns-us'), dim: svg.querySelector('.ns-dim'), seals: [...svg.querySelectorAll('.ns-seal')],
      krects: svg.querySelector('.ns-krects'), q: s => [...svg.querySelectorAll(s)]
    };
    if (V === 'a') {
      el.sp = el.q('.ns-lines path.sp'); el.rg = el.q('.ns-lines path.rg');
      [...el.sp, ...el.rg].forEach(p => { p.dataset.l = p.getTotalLength().toFixed(1); });
    }
    maskKey = null;
  }

  function textRects(root) {
    const out = [];
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) { if (!n.textContent.trim()) continue; const r = document.createRange(); r.selectNodeContents(n); out.push(...r.getClientRects()); }
    return out;
  }
  let maskKey = null;
  function updateMask(frames) {
    const key = frames.join(',') + '|' + G.W;
    if (key === maskKey) return; maskKey = key;
    const hr = hero.getBoundingClientRect(), pad = G.desk ? 14 : 10;
    let rects = [...textRects(h1), ...textRects(hero.querySelector('.s-hero__kicker'))];
    stops.forEach(s => rects.push(...textRects(s)));
    hero.querySelectorAll('.s-hero__nav:not([hidden]),.scene__pause-btn').forEach(b => rects.push(b.getBoundingClientRect()));
    frames.forEach(f => { if (f > 0 && items[f - 1]) rects.push(...textRects(items[f - 1])); });
    el.krects.innerHTML = rects.filter(r => r.width && r.height).map(r =>
      `<rect x="${(r.left - hr.left - pad).toFixed(1)}" y="${(r.top - hr.top - pad * .7).toFixed(1)}" width="${(r.width + 2 * pad).toFixed(1)}" height="${(r.height + 1.4 * pad).toFixed(1)}" rx="4"/>`).join('');
  }

  function light(lt) { return reduce ? 1 : ease((lt - 1500) / 2500); }
  function paintCube(L) {
    if (V === 'a') {
      const sp = ease(L / 0.4), rg = ease((L - 0.3) / 0.5), sub = ease((L - 0.65) / 0.35);
      const dash = (p, k) => { if (k >= 1) { p.removeAttribute('stroke-dasharray'); p.removeAttribute('stroke-dashoffset'); } else { p.setAttribute('stroke-dasharray', p.dataset.l + ' ' + p.dataset.l); p.setAttribute('stroke-dashoffset', p.dataset.l * (1 - k)); } };
      el.sp.forEach(p => dash(p, sp)); el.rg.forEach(p => dash(p, rg));
      el.q('.ns-bloom').forEach(n => n.setAttribute('opacity', 0.5 * ease((L - 0.3) / 0.7)));
      el.q('.ns-subs').forEach(n => n.setAttribute('opacity', 0.36 * sub));
      el.q('.ns-spill').forEach(n => n.setAttribute('opacity', ease((L - 0.2) / 0.8)));
    }
  }

  let navPrev = null;
  function render(t) {
    if (!G) return;
    const f = Math.floor(t / STEP) % N, lt = t % STEP;
    const first = t < STEP && navPrev == null;
    const pf = navPrev != null ? navPrev : (f + N - 1) % N;
    const e = first ? 1 : ease(lt / D);
    const eC = first ? 1 : ease((lt - 150) / 550);   // card follows the photograph
    const eT = first ? 1 : ease((lt - 150) / 600);   // the tail: ~600 ms, just after the photograph
    if (navPrev != null && lt > D + 600) navPrev = null;
    photos.forEach((p, i) => {
      const fr = i + 1; let o = 0, z = 0;
      if (fr === f) { o = e; z = 2; } else if (fr === pf && e < 1) { o = f === 0 ? 1 - e : 1; z = 1; }
      p.style.opacity = o; p.style.zIndex = z;
    });
    const w = new Array(N).fill(0); w[f] = e; if (e < 1) w[pf] += 1 - e;
    const wIn = k => ease((k - 0.3) / 0.7), wOut = k => 1 - ease(k / 0.7);
    const ws = w.map((v, i) => (i === f && e < 1) ? wIn(e) : (i === pf && e < 1) ? wOut(e) : v);
    el.seals.forEach((s, i) => s.setAttribute('opacity', (0.16 * ws[i + 1]).toFixed(3)));
    const L = f === 0 ? light(lt) : 1;
    el.us.setAttribute('opacity', ws[0]);
    el.dim.setAttribute('opacity', (0.16 * ws[0]).toFixed(3));
    paintCube(L);
    const wc = new Array(N).fill(0); wc[f] = eC; if (eC < 1) wc[pf] += 1 - eC;
    idx.style.opacity = wc[0]; idx.style.visibility = wc[0] > 0.001 ? 'visible' : 'hidden';
    if (CH) card.style.height = (CH.pad + wc.reduce((a, w, i) => a + w * CH.hs[i], 0)).toFixed(1) + 'px';
    items.forEach((it, i) => { const o = wc[i + 1]; it.style.opacity = o; it.style.visibility = o > 0.001 ? 'visible' : 'hidden'; });
    rules.forEach((r, i) => r.style.opacity = wc[i + 1]);
    stops.forEach((s, i) => {
      s.querySelector('.s-hero__dot').style.backgroundSize = (i === f ? (reduce || STILL && false ? 100 : lt / STEP * 100) : 0) + '% 100%';
      const on = i === (e < 0.5 ? pf : f); s.querySelector('.s-hero__stop-name').style.fontWeight = on ? 700 : 500; s.setAttribute('aria-selected', on); s.tabIndex = on ? 0 : -1;
    });
    const TAIL = G.desk ? TAIL_D : TAIL_M;
    const tail = eT >= 1 ? TAIL[f] : lerpC(TAIL[pf], TAIL[f], eT);
    h1.style.setProperty('--ss-tail', tail);
    header.style.borderBottomColor = eT >= 1 ? EDGE[f] : lerpC(EDGE[pf], EDGE[f], eT);
    updateMask(e < 1 || eC < 1 ? [f, pf] : [f]);
  }

  let t0 = Number(Q.get('t')) || (LOOP.length === 2 ? LOOP[0] : 0), start = performance.now(), paused = STILL || reduce, pausedAt = t0;
  const now = () => {
    if (paused) return pausedAt;
    let t = t0 + performance.now() - start;
    if (LOOP.length === 2) t = LOOP[0] + ((t - LOOP[0]) % (LOOP[1] - LOOP[0]));
    return t;
  };
  const setT = t => { t0 = t; pausedAt = t; start = performance.now(); };
  function tick() { render(now()); if (!paused) requestAnimationFrame(tick); }
  const pause = document.getElementById('hero-pause');
  pause && pause.addEventListener('change', () => { if (pause.checked) { pausedAt = now(); paused = true; } else { setT(pausedAt); paused = false; tick(); } });
  const go = d => {
    const t = now(), f = Math.floor(t / STEP) % N, nf = (f + d + N) % N;
    navPrev = f; const nt = (Math.floor(t / STEP / N) + 1) * N * STEP + nf * STEP;
    setT(nt); if (paused) render(nt);
  };
  hero.querySelectorAll('[data-hero-nav]').forEach(b => b.addEventListener('click', () => go(Number(b.dataset.heroNav))));
  window.nsSetTime = t => { setT(t); render(t); };
  window.nsSetTail = a => { TAIL_D = a; render(now()); };

  stops.forEach((s, i) => {
    const nm = s.querySelector('.s-hero__stop-name');
    s.setAttribute('role', 'tab'); s.setAttribute('aria-label', nm.textContent);
    const jump = () => { const f = Math.floor(now() / STEP) % N; if (i !== f) go(i - f); };
    s.addEventListener('click', jump);
    s.addEventListener('keydown', ev => {
      const k = ev.key; let t = null;
      if (k === 'ArrowRight') t = (i + 1) % N; else if (k === 'ArrowLeft') t = (i + N - 1) % N; else if (k === 'Home') t = 0; else if (k === 'End') t = N - 1;
      else if (k === 'Enter' || k === ' ') { ev.preventDefault(); jump(); return; }
      if (t != null) { ev.preventDefault(); stops[t].focus(); stops[t].click(); }
    });
  });
  const boot = () => { layout(); render(now()); if (!paused) requestAnimationFrame(tick); };
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 2500))]).then(boot);
  window.nsLayout = () => { layout(); render(now()); };
  let rz; new ResizeObserver(() => { clearTimeout(rz); rz = setTimeout(() => { layout(); render(now()); }, 60); }).observe(hero);
})();
