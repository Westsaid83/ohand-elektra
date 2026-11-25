/* Het 3D-model: een thuisbatterij uit stapelbare modules, met optioneel een
   laadpaal ernaast. Eén functie, drie plekken: de hero van de homepage, de
   opengewerkte weergave die met scrollen uit elkaar schuift, en de uitkomst
   van de configurator (het aantal modules volgt de berekende capaciteit).

   Er wordt alleen getekend terwijl het canvas in beeld is, en bij
   'minder beweging' staat het model stil. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';

const GEEL = 0xffc533;
const MAX_MODULES = 8;
const MOD_H = 0.34, MOD_GAP = 0.035;

export function createScene(canvas, opts = {}) {
  const stil = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);

  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0x6fa8ff, 1.6); rim.position.set(-4, 2, -3); scene.add(rim);
  const warm = new THREE.PointLight(GEEL, 6, 6); warm.position.set(0, 0.2, 1.6); scene.add(warm);

  const wit = new THREE.MeshPhysicalMaterial({ color: 0xf2f4f6, roughness: 0.32, metalness: 0.05, clearcoat: 0.7, clearcoatRoughness: 0.25 });
  const donker = new THREE.MeshPhysicalMaterial({ color: 0x10171f, roughness: 0.38, metalness: 0.5, clearcoat: 0.5 });
  const led = new THREE.MeshBasicMaterial({ color: GEEL });
  const ledUit = new THREE.MeshBasicMaterial({ color: 0x2a3a48 });
  const groen = new THREE.MeshBasicMaterial({ color: 0x9ac31c });

  const root = new THREE.Group(); scene.add(root);
  const batt = new THREE.Group(); root.add(batt);

  const box = (w, h, d, r, mat) => new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 5, r), mat);

  // Voet
  const voet = box(1.72, 0.1, 0.62, 0.04, donker); voet.position.y = 0.05; batt.add(voet);

  // Modules
  const modules = [];
  for (let i = 0; i < MAX_MODULES; i++) {
    const g = new THREE.Group();
    g.add(box(1.6, MOD_H, 0.5, 0.06, wit));
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.022, 0.012), led);
    strip.position.set(-0.4, 0, 0.252); g.add(strip);
    const greep = box(0.22, 0.05, 0.02, 0.01, donker); greep.position.set(0.55, 0, 0.25); g.add(greep);
    g.userData = { strip };
    batt.add(g); modules.push(g);
  }

  // Omvormer bovenop
  const kop = new THREE.Group();
  kop.add(box(1.6, 0.42, 0.5, 0.06, donker));
  const scherm = box(0.42, 0.16, 0.012, 0.02, new THREE.MeshBasicMaterial({ color: 0x0b1118 })); scherm.position.set(-0.42, 0.02, 0.252); kop.add(scherm);
  const balk = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.006), groen); balk.position.set(-0.42, 0.0, 0.262); kop.add(balk);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 12, 40), led); ring.position.set(0.5, 0.02, 0.255); kop.add(ring);
  batt.add(kop);

  // Zachte schaduw op de vloer
  const sc = document.createElement('canvas'); sc.width = sc.height = 256;
  const ctx = sc.getContext('2d');
  const gr = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  gr.addColorStop(0, opts.light ? 'rgba(15,34,49,.38)' : 'rgba(255,197,51,.16)'); gr.addColorStop(0.85, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, 256, 256);
  const schaduw = new THREE.Mesh(new THREE.PlaneGeometry(opts.wallbox ? 5.2 : 3.2, opts.wallbox ? 2.4 : 1.8),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  schaduw.rotation.x = -Math.PI / 2; schaduw.position.y = 0.001; root.add(schaduw);

  // Laadpaal met kabel
  let paal = null;
  if (opts.wallbox) {
    paal = new THREE.Group();
    paal.add(box(0.62, 0.9, 0.2, 0.09, donker));
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.016, 14, 60), led); r.position.set(0, 0.08, 0.105); paal.add(r);
    const stip = new THREE.Mesh(new THREE.CircleGeometry(0.03, 24), groen); stip.position.set(0, -0.28, 0.102); paal.add(stip);
    const kromme = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.45, 0.04), new THREE.Vector3(0.05, -0.95, 0.2), new THREE.Vector3(0.5, -1.18, 0.45),
      new THREE.Vector3(1.0, -1.2, 0.35), new THREE.Vector3(1.25, -1.1, 0.1)]);
    paal.add(new THREE.Mesh(new THREE.TubeGeometry(kromme, 48, 0.025, 10), donker));
    const stekker = box(0.1, 0.16, 0.1, 0.03, donker); stekker.position.set(1.27, -1.05, 0.08); stekker.rotation.z = 0.5; paal.add(stekker);
    paal.position.set(1.85, 1.3, -0.25);
    root.add(paal);
  }

  const state = { n: opts.modules || 4, shown: opts.modules || 4, explode: 0, explodeNu: 0, yaw: opts.yaw ?? -0.5, px: 0, py: 0, level: opts.level ?? 1 };

  function layout() {
    const stap = MOD_H + MOD_GAP;
    const open = state.explodeNu;
    modules.forEach((m, i) => {
      const zichtbaar = i < Math.ceil(state.shown - 0.001);
      m.visible = zichtbaar;
      const s = Math.min(1, Math.max(0.001, state.shown - i));
      m.scale.set(1, s, 1);
      m.position.y = 0.1 + MOD_GAP + i * stap + (MOD_H * s) / 2 + open * (i + 1) * 0.2;
      m.position.z = open * (i % 2 ? -0.12 : 0.12);
      m.userData.strip.material = (i + 1) / Math.max(1, state.n) <= state.level + 0.001 ? led : ledUit;
    });
    const top = 0.1 + MOD_GAP + state.shown * stap;
    kop.position.y = top + 0.21 + open * (state.shown + 1.6) * 0.2;
    const hoogte = kop.position.y + 0.21;
    // Camera volgt de hoogte, zodat één module en acht modules allebei passen.
    const breed = paal ? 4.6 : 2.6;
    const aspect = camera.aspect;
    const fov = camera.fov * Math.PI / 180;
    const afstandH = (hoogte + 0.9) / (2 * Math.tan(fov / 2));
    const afstandB = breed / (2 * Math.tan(fov / 2) * aspect);
    const afstand = Math.max(afstandH, afstandB) * 1.08;
    const midden = hoogte / 2 + 0.05;
    camera.position.set((paal ? 0.5 : 0), midden + afstand * 0.16, afstand);
    camera.lookAt((paal ? 0.5 : 0), midden, 0);
    warm.position.y = midden;
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  let zichtbaar = false, raf = 0, t0 = performance.now();
  function frame(now) {
    raf = 0;
    const t = (now - t0) / 1000;
    state.shown += (state.n - state.shown) * 0.14;
    if (Math.abs(state.n - state.shown) < 0.002) state.shown = state.n;
    state.explodeNu += (state.explode - state.explodeNu) * 0.14;
    layout();
    const zweef = stil ? 0 : Math.sin(t * 0.5) * 0.12;
    root.rotation.y = state.yaw + zweef + state.px * 0.35;
    root.rotation.x = state.py * 0.12;
    renderer.render(scene, camera);
    if (zichtbaar && !stil) raf = requestAnimationFrame(frame);
  }
  const teken = () => { if (!raf) raf = requestAnimationFrame(frame); };

  new ResizeObserver(() => { resize(); teken(); }).observe(canvas);
  new IntersectionObserver((e) => { zichtbaar = e[0].isIntersecting; if (zichtbaar) teken(); }, { rootMargin: '100px' }).observe(canvas);
  if (opts.pointer !== false && !stil) {
    addEventListener('pointermove', (e) => {
      state.px = (e.clientX / innerWidth - 0.5) * 2; state.py = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });
  }
  resize(); layout(); renderer.render(scene, camera);
  canvas.dataset.klaar = '1';

  return {
    setModules(n) { state.n = Math.max(1, Math.min(MAX_MODULES, n)); if (stil) state.shown = state.n; teken(); },
    setExplode(v) { state.explode = Math.max(0, Math.min(1, v)); if (stil) state.explodeNu = state.explode; teken(); },
    setYaw(v) { state.yaw = v; teken(); },
    setLevel(v) { state.level = v; teken(); }
  };
}

/* Koppelt elk <canvas data-scene> op de pagina. */
const scenes = {};
document.querySelectorAll('canvas[data-scene]').forEach((c) => {
  try {
    scenes[c.dataset.scene] = createScene(c, {
      modules: +(c.dataset.modules || 4), wallbox: c.dataset.wallbox === '1',
      light: c.dataset.light === '1', pointer: c.dataset.pointer !== '0', yaw: c.dataset.yaw ? +c.dataset.yaw : undefined
    });
  } catch (e) {
    // Geen WebGL: het canvas blijft leeg en de pagina werkt verder zonder model.
    c.closest('[data-scene-wrap]')?.classList.add('geen-3d');
  }
});
window.OhandScenes = scenes;
window.dispatchEvent(new Event('ohand:scenes'));
