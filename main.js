/* Sumit Wani · v3 "Viewfinder". HUD, theme, scroll-linked motion, dialogs. The 3D mark lives in mark3d.js. */
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
  const vf = $('.viewfinder video');
  if (vf) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (!vf.src) { vf.src = vf.dataset.lazySrc; }
        if (!RM.matches) vf.play().catch(() => {});
      } else vf.pause();
    }, { rootMargin: '150px' }).observe(vf);  }

  /* ---------- 6. contact headline ---------- */
  const contact = $('#contact');
  new IntersectionObserver(([e]) => { if (e.isIntersecting) contact.classList.add('is-in'); }, { threshold: .25 }).observe(contact);

  /* ---------- 7. scroll-linked frame: nav state, words ---------- */
  const navLinks = $$('.nav a');
  const secs = navLinks.map(a => $(a.getAttribute('href')));
  let ticking = false;
  function frame() {
    ticking = false;
    const vh = innerHeight;
    // nav: section in view
    navLinks.forEach((a, i) => { const r = secs[i] && secs[i].getBoundingClientRect(); a.classList.toggle('is-here', !!r && r.top < vh * .5 && r.bottom > vh * .5); });
    if (words.length) {
      const r = big.getBoundingClientRect();
      const t = RM.matches ? 1 : clamp((vh * .82 - r.top) / (r.height + vh * .3));
      const n = Math.round(t * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    }
  }
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', req, { passive: true });
  addEventListener('resize', req);
  frame();

  /* ---------- 8. case sheets (demo content) ---------- */
  const CASES = [
    // yt: a YouTube video ID (the part after "watch?v="). When set, the tile shows a play button and the sheet plays the video.
    { brand: 'NOVA Audio', tc: '00:42', title: 'Pulse launch film', img: 'assets/work/nova.webp', yt: '2zbsyzQiqw4',
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
  // tiles with a YouTube video get a play button
  $$('[data-case]').forEach(btn => {
    const c = CASES[Number(btn.dataset.case)];
    if (c && c.yt) {
      btn.classList.add('has-video');
      $('.card-media', btn).insertAdjacentHTML('beforeend', '<span class="card-play" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg></span>');
      btn.setAttribute('aria-label', `Play ${c.brand} video: ${c.title}`);
    }
  });
  // video tiles play right where they are: the YouTube player replaces the image at the same size and place.
  // Only one tile plays at a time; the ✕ (or starting another video) puts the image back.
  const stopTile = () => {
    const p = $('.card-player'); if (!p) return;
    p.closest('.card').classList.remove('is-playing'); p.remove();
  };
  const playInTile = (btn, c) => {
    stopTile(); stopReel();
    const card = btn.closest('.card');
    const p = document.createElement('div');
    p.className = 'card-player';
    p.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(c.yt)}?autoplay=1&rel=0&modestbranding=1&playsinline=1"
      title="${c.brand}: ${c.title}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen
      referrerpolicy="strict-origin-when-cross-origin"></iframe>
      <button class="card-stop mono" type="button" aria-label="Stop video">✕</button>`;
    $('.card-stop', p).addEventListener('click', () => { stopTile(); btn.focus(); });
    card.appendChild(p); card.classList.add('is-playing');
  };
  $$('[data-case]').forEach(btn => btn.addEventListener('click', () => {
    const c = CASES[Number(btn.dataset.case)];
    if (c.yt) { playInTile(btn, c); return; }   // privacy-enhanced YouTube embed: no YouTube cookies until it plays
    const img = $('.case-media img', dlg); img.src = c.img; img.alt = $('img', btn).alt;
    $('.case-brand', dlg).textContent = c.brand.toUpperCase(); $('.case-tc', dlg).textContent = c.tc;
    $('#case-title').textContent = c.title; $('.case-brief', dlg).textContent = c.brief;
    $('.case-role', dlg).textContent = c.role; $('.case-del', dlg).textContent = c.del; $('.case-tools', dlg).textContent = c.tools;
    dlg.showModal();
  }));
  // the showreel also plays in place: a full player (sound + controls) takes the preview's exact spot and size
  const reelBtn = $('[data-reel]');
  function stopReel() {
    const p = $('.vf-player'); if (!p) return;
    $('video', p).pause(); p.remove(); reelBtn.hidden = false;
  }
  reelBtn.addEventListener('click', () => {
    stopTile(); stopReel();
    const p = document.createElement('div');
    p.className = 'viewfinder vf-player';
    p.innerHTML = `<video controls playsinline preload="auto" poster="assets/hero-poster.webp" src="assets/hero.mp4" aria-label="Showreel"></video>
      <button class="card-stop mono" type="button" aria-label="Stop showreel">✕</button>`;
    $('.card-stop', p).addEventListener('click', () => { stopReel(); reelBtn.focus(); });
    reelBtn.before(p); reelBtn.hidden = true;
    $('video', p).play().catch(() => {});
  });
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  $$('[aria-disabled="true"]').forEach(a => a.addEventListener('click', e => e.preventDefault()));
})();
