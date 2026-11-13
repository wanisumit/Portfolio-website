/* Sumit Wani · v3 "Viewfinder". HUD, theme, scroll-linked motion, warp manifesto, dialogs. The 3D mark lives in mark3d.js. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (x, a, b) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const pad = (n, l = 2) => String(Math.max(0, Math.floor(n))).padStart(l, '0');

  /* ---------- 1. entrance ---------- */
  const loaded = () => requestAnimationFrame(() => root.classList.add('is-loaded'));
  if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 900))]).then(loaded); else loaded();

  /* ---------- 2. dark only: no theme switch in this edition ---------- */

  /* ---------- 3. phone menu ---------- */
  const menu = $('#menu'), menuBtn = $('.menu-btn');
  const setMenu = open => { menu.hidden = !open; menuBtn.setAttribute('aria-expanded', String(open)); document.body.style.overflow = open ? 'hidden' : ''; };
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  /* ---------- 5. intro: words light up as you read; the reel plays only when seen ---------- */
  const big = $('[data-words]');
  if (big) {
    big.innerHTML = big.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  }
  const words = big ? $$('.w', big) : [];
  const vf = $('.viewfinder video'), vfTc = $('[data-vf-tc]');
  if (vf) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (!vf.src) { vf.src = vf.dataset.lazySrc; }
        if (!RM.matches) vf.play().catch(() => {});
      } else vf.pause();
    }, { rootMargin: '150px' }).observe(vf);
    vf.addEventListener('timeupdate', () => { const t = vf.currentTime; vfTc.textContent = `${pad(t / 60)}:${pad(t % 60)}:${pad((t % 1) * 24)}`; });
  }

  /* ---------- 6. contact headline ---------- */
  const contact = $('#contact');
  new IntersectionObserver(([e]) => { if (e.isIntersecting) contact.classList.add('is-in'); }, { threshold: .25 }).observe(contact);

  /* ---------- 7. warp manifesto: light streaks from the vanishing point ---------- */
  const warp = $('[data-warp]');
  const stage = $('.warp-stage', warp);
  const dark = $('.warp-dark', warp);
  const cvs = $('.warp-canvas', warp);
  const ctx = cvs.getContext('2d');
  const phases = $$('[data-phase]', warp).sort((a, b) => a.dataset.phase - b.dataset.phase);
  const safe = $('.safe', warp);
  const RANGES = [[-.04, .2], [.2, .4], [.4, .66], [.66, .86]];
  const COLORS = ['#27E68D', '#27E68D', '#7CF5C0', '#3FC1C9', '#EDF2F0', '#1FA971'];
  let stars = [], W = 0, H = 0, DPR = 1, warpOn = false, boost = 0, warpP = 0, lastT = 0;
  function sizeWarp() {
    DPR = Math.min(2, devicePixelRatio || 1);
    W = stage.clientWidth; H = stage.clientHeight;
    cvs.width = Math.round(W * DPR); cvs.height = Math.round(H * DPR);
    const n = Math.round(clamp((W * H) / 2600, 160, 720));
    stars = Array.from({ length: n }, () => spawn(Math.random()));
    drawWarp(0);
  }
  function spawn(z = 1) {
    const a = Math.random() * Math.PI * 2, r = .04 + Math.pow(Math.random(), .7) * 1.4;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r, z: .05 + z * .95, c: COLORS[(Math.random() * COLORS.length) | 0], w: .6 + Math.random() * 1.2 };
  }
  function drawWarp(dt) {
    const cx = W / 2, cy = H / 2, f = Math.max(W, H) * .42;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = '#040808'; ctx.fillRect(0, 0, W, H);
    const rush = smooth(warpP, .66, .84);
    const speed = (.16 + boost * 1.6 + rush * .9) * dt;
    const trail = .035 + boost * .3 + rush * .22;
    ctx.lineCap = 'round';
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.z -= speed;
      if (s.z <= .02) { stars[i] = spawn(1); continue; }
      const z0 = s.z + trail;
      const x1 = cx + (s.x / s.z) * f, y1 = cy + (s.y / s.z) * f;
      const x0 = cx + (s.x / z0) * f, y0 = cy + (s.y / z0) * f;
      if (x1 < -80 || x1 > W + 80 || y1 < -80 || y1 > H + 80) { stars[i] = spawn(1); continue; }
      ctx.globalAlpha = clamp(1.15 - s.z) * .95;
      ctx.strokeStyle = s.c;
      ctx.lineWidth = s.w * (1.4 - s.z) * 1.6;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function warpLoop(t) {
    if (!warpOn) return;
    const dt = Math.min(.05, (t - (lastT || t)) / 1000); lastT = t;
    boost *= .92;
    drawWarp(dt);
    requestAnimationFrame(warpLoop);
  }
  new IntersectionObserver(([e]) => {
    const on = e.isIntersecting && !RM.matches;
    if (on && !warpOn) { warpOn = true; lastT = 0; requestAnimationFrame(warpLoop); }
    if (!on) warpOn = false;
    if (e.isIntersecting && RM.matches) drawWarp(0);
  }).observe(warp);

  /* ---------- 8. scroll-linked frame: parallax, words, warp phases ---------- */
  const cards = $$('.card');
  const navLinks = $$('.nav a');
  const secs = navLinks.map(a => $(a.getAttribute('href')));
  let lastY = scrollY, ticking = false;
  function frame() {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    // velocity feeds the warp
    boost = Math.min(1.4, boost + Math.abs(y - lastY) / vh * .9);
    lastY = y;
    // nav: section in view
    navLinks.forEach((a, i) => { const r = secs[i] && secs[i].getBoundingClientRect(); a.classList.toggle('is-here', !!r && r.top < vh * .5 && r.bottom > vh * .5); });
    if (!RM.matches) {
      cards.forEach(c => { const r = c.getBoundingClientRect(); const d = (r.top + r.height / 2 - vh / 2); c.style.transform = `translate3d(0, ${(d * Number(c.dataset.speed)).toFixed(1)}px, 0)`; });
    }
    if (words.length) {
      const r = big.getBoundingClientRect();
      const t = RM.matches ? 1 : clamp((vh * .82 - r.top) / (r.height + vh * .3));
      const n = Math.round(t * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    }
    // warp
    const wr = warp.getBoundingClientRect();
    warpP = clamp(-wr.top / Math.max(1, wr.height - vh));
    phases.forEach((el, i) => {
      const [a, b] = RANGES[i];
      const t = (warpP - a) / (b - a);
      const o = (i === 0 ? 1 : smooth(t, 0, .22)) * (1 - smooth(t, .78, 1));
      el.style.opacity = o.toFixed(3);
      if (!RM.matches && el.classList.contains('wl')) el.style.transform = `scale(${(.82 + clamp(t) * .36).toFixed(3)})`;
      el.style.visibility = o > .001 ? 'visible' : 'hidden';
    });
    const so = smooth(warpP, .38, .46) * (1 - smooth(warpP, .62, .7));
    safe.style.opacity = so.toFixed(3);
    if (!RM.matches) safe.style.transform = `scale(${(1.25 - smooth(warpP, .38, .62) * .25).toFixed(3)})`;
    const iris = 1 - smooth(warpP, .87, .995);
    dark.style.setProperty('--iris', `${(iris * 150).toFixed(2)}%`);
    document.body.classList.toggle('on-dark', wr.top < 60 && wr.bottom > vh * .5 && iris > .35);
    if (RM.matches && wr.top < vh && wr.bottom > 0) drawWarp(0);
  }
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', () => { sizeWarp(); req(); });
  sizeWarp();
  frame();

  /* ---------- 9. case sheets (demo content) ---------- */
  const CASES = [
    { brand: 'NOVA Audio', tc: '00:42', title: 'Pulse launch film', img: 'assets/work/nova.webp',
      brief: 'A launch film for a pair of over-ear headphones. The product never changes shape; the light around it carries the rhythm of the track.',
      role: 'Direction, 3D animation, edit', del: '42s hero film, 3 cutdowns', tools: 'After Effects, Premiere Pro' },
    { brand: 'Ledgerly', tc: '00:30', title: 'App in motion', img: 'assets/work/ledgerly.webp',
      brief: 'Product UI animated as layers in space, so the three core flows read in one glance on a store page.',
      role: 'UI animation, compositing', del: '30s reel, 12 UI loops', tools: 'After Effects' },
    { brand: 'Kiln & Crema', tc: '00:20', title: 'Pour identity', img: 'assets/work/kiln.webp',
      brief: 'An identity system built on one move: the pour. Every transition in the brand folds like espresso into milk.',
      role: 'Brand motion system', del: 'Logo animation, 8 transitions', tools: 'After Effects, Final Cut Pro' },
    { brand: 'Bounce Fest', tc: '01:10', title: 'Festival titles', img: 'assets/work/bounce.webp',
      brief: 'Opening titles for a three day music festival. Shapes stack and bounce on the beat, then fall into the line-up.',
      role: 'Design, animation', del: '70s title sequence, stage loops', tools: 'After Effects, Premiere Pro' },
    { brand: 'Verde Skin', tc: '00:15', title: 'Ripple serum loop', img: 'assets/work/verde.webp',
      brief: 'A seamless product loop for paid social. One ripple, timed so the first and last frame are the same.',
      role: 'Animation, finishing', del: '15s loop, 3 ratios', tools: 'After Effects, CapCut' },
    { brand: 'Orbit Studio', tc: '00:08', title: 'Glass ring reveal', img: 'assets/work/orbit.webp',
      brief: 'An eight second sting for the start of every studio film. The ring turns once, catches the light, and settles.',
      role: 'Logo animation', del: '8s sting, 2s short version', tools: 'After Effects' },
    { brand: 'Stride Run Co', tc: '6 × 00:15', title: 'Sprint social ads', img: 'assets/work/stride.webp',
      brief: 'Six vertical ads cut for speed: the shoe enters on the first frame and the offer lands before the thumb moves.',
      role: 'Edit, motion graphics', del: '6 vertical ads, 9:16 and 4:5', tools: 'CapCut, Premiere Pro' },
    { brand: 'Halo Climate Lab', tc: '01:30', title: 'How the lab works', img: 'assets/work/halo.webp',
      brief: 'A 2.5D explainer that walks through the lab one floating tile at a time, so a complicated process reads as a calm sequence.',
      role: 'Illustration, 2.5D animation', del: '90s explainer, 5 social clips', tools: 'After Effects, Final Cut Pro' }
  ];
  const dlg = $('#case');
  $$('[data-case]').forEach(btn => btn.addEventListener('click', () => {
    const c = CASES[Number(btn.dataset.case)];
    const img = $('.case-media img', dlg); img.src = c.img; img.alt = $('img', btn).alt;
    $('.case-brand', dlg).textContent = c.brand.toUpperCase(); $('.case-tc', dlg).textContent = c.tc;
    $('#case-title').textContent = c.title; $('.case-brief', dlg).textContent = c.brief;
    $('.case-role', dlg).textContent = c.role; $('.case-del', dlg).textContent = c.del; $('.case-tools', dlg).textContent = c.tools;
    dlg.showModal();
  }));
  const reelDlg = $('#reel-dlg'), reelVid = $('video', reelDlg);
  $('[data-reel]').addEventListener('click', () => { reelDlg.showModal(); reelVid.play().catch(() => {}); });
  reelDlg.addEventListener('close', () => reelVid.pause());
  [dlg, reelDlg].forEach(d => d.addEventListener('click', e => { if (e.target === d) d.close(); }));
  $$('[aria-disabled="true"]').forEach(a => a.addEventListener('click', e => e.preventDefault()));
})();
