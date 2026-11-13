/* mark3d.js: the Sumit Wani mark as an inflated, glossy 3D object.
   Built from the logo's own centre lines (Logo.svg, 256 grid, stroke 32) as round tubes.
   Tilts toward the pointer, floats, and rides the scroll: centre stage in the hero, large behind the contact headline. */
import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const root = document.documentElement;
const canvas = document.querySelector('.gl');
const hero = document.querySelector('.hero');
const contact = document.querySelector('.contact');
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (x, a, b) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) { renderer = null; }

if (renderer) {
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.toneMapping = THREE.NeutralToneMapping;   // keeps the brand mint and teal close to their hex values
  renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .03).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, .1, 50);
  camera.position.set(0, 0, 7);

  // logo centre line in SVG space (y down), then mapped to world units around the centre (128,128)
  const P = (x, y, z = 0) => new THREE.Vector3((x - 128) / 128, -(y - 128) / 128, z);
  function strokePath(flip, z) {
    const m = (x, y) => (flip ? P(256 - x, 256 - y, z) : P(x, y, z));
    const path = new THREE.CurvePath();
    path.add(new THREE.LineCurve3(m(216, 43.5), m(103.5, 43.5)));
    path.add(new THREE.CubicBezierCurve3(m(103.5, 43.5), m(84, 43.5), m(68, 58), m(68, 74)));
    path.add(new THREE.CubicBezierCurve3(m(68, 74), m(68, 90.5), m(81, 104.5), m(96, 104.5)));
    path.add(new THREE.LineCurve3(m(96, 104.5), m(190.7, 104.5)));
    return path;
  }
  const R = 16.5 / 128; // a touch fuller than the flat stroke, so it reads inflated
  function strokeMesh(flip, z, mat) {
    const path = strokePath(flip, z);
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.TubeGeometry(path, 260, R, 48, false), mat));
    const cap = new THREE.SphereGeometry(R, 48, 32);
    const a = new THREE.Mesh(cap, mat); a.position.copy(path.getPoint(0));
    const b = new THREE.Mesh(cap, mat); b.position.copy(path.getPoint(1));
    g.add(a, b);
    return g;
  }
  const matUp = new THREE.MeshPhysicalMaterial({ color: 0x27E68D, roughness: .2, metalness: 0, clearcoat: 1, clearcoatRoughness: .08, sheen: .12, sheenColor: new THREE.Color(0xcffff0), iridescence: .35, iridescenceIOR: 1.3 });
  const matLo = new THREE.MeshPhysicalMaterial({ color: 0x0F4C5C, roughness: .18, metalness: 0, clearcoat: 1, clearcoatRoughness: .1, sheen: .3, sheenColor: new THREE.Color(0xbfe9ff), iridescence: .25, iridescenceIOR: 1.3 });
  // exact Logo.svg colours on every surface: mint #27E68D over Deep Teal #0F4C5C

  const mark = new THREE.Group();
  mark.add(strokeMesh(false, .07, matUp), strokeMesh(true, -.07, matLo));
  const pivot = new THREE.Group();
  pivot.add(mark);
  scene.add(pivot);

  const key = new THREE.DirectionalLight(0xffffff, 1.4); key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9dffd6, 1.1); rim.position.set(4, -2, -3); scene.add(rim);

  // pointer: tilt toward it, eased
  let tx = 0, ty = 0, mx = 0, my = 0;
  addEventListener('pointermove', e => { tx = (e.clientX / innerWidth) * 2 - 1; ty = (e.clientY / innerHeight) * 2 - 1; }, { passive: true });

  let W = 0, H = 0, needs = true;
  function size() {
    W = innerWidth; H = innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    needs = true;
  }
  addEventListener('resize', size);
  size();

  // where the mark should be: hero (a) or contact (c)
  function layout() {
    const vh = innerHeight;
    const hr = hero.getBoundingClientRect(), cr = contact.getBoundingClientRect();
    const a = clamp(hr.bottom / vh);                 // 1 at top of page, 0 once the hero has left
    // 0 until the contact screen arrives, 1 (fully in) once its top is ~45% up the screen,
    // so the logo is already there by the time its empty space above the headline is in view
    const c = clamp((vh - cr.top) / (vh * .55));
    const viewH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const viewW = viewH * camera.aspect;
    const phone = W < 620;
    let s, x, y, spin, o;
    if (c > 0 && c >= a) {                           // contact takes over as soon as it is more "in" than the hero
      const k = smooth(c, 0, 1);
      // desktop: right-hand column, clear of the headline. phone: centred above the headline
      s = (phone ? Math.min(viewH * .16, viewW * .26) : Math.min(viewH * .3, viewW * .14)) * (.7 + .3 * k);
      x = phone ? 0 : viewW * .3;
      // pinned to the contact section (not the screen), so it scrolls in with it and never floats over the work tiles.
      // once the section reaches the top it sits 17% (phone) / 40% (desktop) down the screen, above the headline
      const screenY = cr.top + vh * (phone ? .17 : .4);
      y = (.5 - screenY / vh) * viewH;
      spin = (1 - k) * -1.6;
      o = 0;   // the contact screen now shows the WhatsApp QR card instead of the 3D mark
    } else {
      const k = 1 - a;                               // 0 → 1 as the hero scrolls away
      // desktop and tablet: the mark sits in the right-hand column, clear of the intro copy above and the headline at left
      const tablet = !phone && W < 960;
      s = phone ? Math.min(viewH * .2, viewW * .32) : Math.min(viewH * .24, viewW * (tablet ? .16 : .13));
      x = phone ? 0 : viewW * (tablet ? .27 : .3);
      y = (phone ? viewH * .02 : (tablet ? -viewH * .06 : -viewH * .04)) + k * viewH * .55;
      spin = k * 1.8; o = 1 - smooth(k, .1, .35);   // gone before it can rise over any text
    }
    return { s, x, y, spin, o };
  }

  let t0 = performance.now(), visible = true, lastLayout = null;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) loop(); });
  addEventListener('scroll', () => { needs = true; }, { passive: true });

  function render(now) {
    const L = layout();
    lastLayout = L;
    canvas.style.setProperty('--gl-o', L.o.toFixed(3));
    if (L.o <= .002) return false;
    const t = (now - t0) / 1000;
    const still = RM.matches;
    mx += (tx - mx) * .06; my += (ty - my) * .06;
    pivot.position.set(L.x, L.y + (still ? 0 : Math.sin(t * .9) * .05), 0);
    pivot.scale.setScalar(L.s);
    pivot.rotation.set(
      (still ? 0 : my * .38) + (still ? 0 : Math.sin(t * .6) * .05) - .12,
      (still ? .35 : mx * .6 + Math.sin(t * .4) * .12) + L.spin,
      (still ? 0 : Math.sin(t * .5) * .04) - L.spin * .15
    );
    renderer.render(scene, camera);
    return true;
  }

  let running = false;
  function loop() {
    if (running) return;
    running = true;
    const step = now => {
      if (!visible) { running = false; return; }
      const drew = render(now);
      if (RM.matches) { running = false; return; }      // reduced motion: draw on demand only
      if (!drew) {                                       // off screen: idle until scroll brings it back
        running = false;
        const wake = () => { removeEventListener('scroll', wake); loop(); };
        addEventListener('scroll', wake, { passive: true });
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  if (RM.matches) {
    const draw = () => requestAnimationFrame(render);
    addEventListener('scroll', draw, { passive: true });
    addEventListener('resize', draw);
  }
  render(performance.now());
  root.classList.add('gl-ready');
  loop();
}
