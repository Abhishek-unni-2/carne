// The Carne & Gusto symbol: a sphere cut into four equal quarters, one per cut.
// Procedural, no asset files. Motion is scroll-driven only: no idle drift, no pointer wobble.
import * as THREE from '../assets/vendor/three.module.min.js';

const QUARTERS = [
  { name: 'Curry Cut',       color: 0xf6d2ab },
  { name: 'Breast Boneless', color: 0x2c7d47 },
  { name: 'Boneless Thighs', color: 0xfbf0e0 },
  { name: 'Wings',           color: 0x0f5a27 },
];
const CUT_FACE = 0xf3e2cb;
const W_SEG = 64; // multiple of 4: quarter borders land on mesh edges
const H_SEG = 32;
const QUARTER = Math.PI / 2;
const GAP = 0.022; // permanent hairline between quarters, even when assembled

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const meridian = (phi, theta) => new THREE.Vector3(-Math.sin(theta) * Math.cos(phi), Math.cos(theta), Math.sin(theta) * Math.sin(phi));

function buildQuarters() {
  const src = new THREE.SphereGeometry(1, W_SEG, H_SEG).toNonIndexed();
  const pos = src.attributes.position;
  const buckets = [[], [], [], []];
  for (let i = 0; i < pos.count; i += 3) {
    const cx = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3;
    const cz = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
    let phi = Math.atan2(cz, -cx);
    if (phi < 0) phi += Math.PI * 2;
    const q = Math.min(3, Math.floor(phi / QUARTER));
    for (let k = 0; k < 3; k++) buckets[q].push(pos.getX(i + k), pos.getY(i + k), pos.getZ(i + k));
  }
  return buckets.map((verts, q) => {
    const skin = new THREE.BufferGeometry();
    skin.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    skin.setAttribute('normal', new THREE.Float32BufferAttribute(verts.slice(), 3)); // unit sphere: normal = position, so shading is smooth

    const pts = [];
    for (const phi of [q * QUARTER, (q + 1) * QUARTER]) {
      for (let j = 0; j < H_SEG; j++) {
        const a = meridian(phi, (j / H_SEG) * Math.PI);
        const b = meridian(phi, ((j + 1) / H_SEG) * Math.PI);
        const a0 = new THREE.Vector3(0, a.y, 0);
        const b0 = new THREE.Vector3(0, b.y, 0);
        pts.push(a0, a, b, a0, b, b0);
      }
    }
    const cut = new THREE.BufferGeometry().setFromPoints(pts);
    cut.computeVertexNormals();
    return { skin, cut, mid: (q + 0.5) * QUARTER };
  });
}

// A tiny studio: soft boxes captured once into an environment map for clean reflections.
function studioEnvironment(renderer) {
  const room = new THREE.Scene();
  room.background = new THREE.Color(0x20301f);
  const panel = (w, h, x, y, z, intensity) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(intensity, intensity * 0.96, intensity * 0.9), side: THREE.DoubleSide }));
    m.position.set(x, y, z);
    m.lookAt(0, 0, 0);
    room.add(m);
  };
  panel(8, 5, 0, 7, 2, 3.2);
  panel(4, 8, -7, 1, 3, 2.2);
  panel(3, 8, 7, 0, -3, 1.6);
  panel(10, 2, 0, -5, 4, 0.6);
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(room, 0.04).texture;
  pm.dispose();
  return env;
}

export function createSymbol(canvas, { reduced = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.environment = studioEnvironment(renderer);
  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 50);
  camera.position.z = 12;
  const halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;

  const key = new THREE.DirectionalLight(0xfff2e0, 1.9);
  key.position.set(3, 5, 6);
  scene.add(key, new THREE.AmbientLight(0xffffff, 0.25));

  const rig = new THREE.Group();
  const spin = new THREE.Group();
  rig.add(spin);
  scene.add(rig);

  const quarters = buildQuarters().map((g, q) => {
    const holder = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: QUARTERS[q].color, roughness: 0.36, metalness: 0.0, envMapIntensity: 0.85 });
    const cutMat = new THREE.MeshStandardMaterial({ color: CUT_FACE, roughness: 0.85, side: THREE.DoubleSide, envMapIntensity: 0.5 });
    holder.add(new THREE.Mesh(g.skin, skinMat), new THREE.Mesh(g.cut, cutMat));
    holder.userData = { dir: new THREE.Vector3(-Math.cos(g.mid), 0, Math.sin(g.mid)), focus: 0, q };
    spin.add(holder);
    return holder;
  });

  // soft contact shadow: a radial-gradient disc that stays on the ground while the symbol floats above it
  const sc = document.createElement('canvas');
  sc.width = sc.height = 128;
  const sctx = sc.getContext('2d');
  const grad = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(0.55, 'rgba(0,0,0,0.18)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false, opacity: 0.9 })
  );
  scene.add(shadow);

  const cur = { x: 0, y: 0, s: 0, explode: 0 };
  let focusIndex = -1;
  let activeEl = null;
  let w = 0, h = 0, running = true, swapping = false;
  const sources = [...document.querySelectorAll('[data-sym]')];

  function resize() {
    w = window.innerWidth; h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  // the placeholder whose centre is nearest the viewport centre
  function pickTarget() {
    let best = null, bestD = Infinity;
    for (const el of sources) {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.bottom < 0 || r.top > h) continue;
      const d = Math.abs(r.top + r.height / 2 - h / 2);
      if (d < bestD) { bestD = d; best = { el, r }; }
    }
    return best;
  }
  const targetOf = ({ el, r }) => ({
    x: ((r.left + r.width / 2) / w * 2 - 1) * halfH * (w / h),
    y: -((r.top + r.height / 2) / h * 2 - 1) * halfH,
    s: (halfH * Math.min(r.width, r.height) * 0.8) / h / (1 + parseFloat(el.dataset.explode || '0') * 0.6), // exploded quarters stay inside the placeholder
    explode: parseFloat(el.dataset.explode || '0'),
  });

  // Moving between sections is a clean cross-fade, never a flight across the page.
  function swapTo(hit) {
    if (swapping) return;
    swapping = true;
    canvas.style.opacity = '0';
    setTimeout(() => {
      const t = hit ? targetOf(hit) : null;
      activeEl = hit ? hit.el : null;
      if (t) { cur.x = t.x; cur.y = t.y; cur.s = t.s; cur.explode = t.explode; }
      canvas.style.opacity = hit ? '1' : '0';
      swapping = false;
    }, reduced ? 0 : 280);
  }
  canvas.style.transition = reduced ? 'none' : 'opacity .28s ease';
  canvas.style.opacity = '0';

  function frame(now = 0) {
    if (!running) return;
    requestAnimationFrame(frame);

    const hit = pickTarget();
    const wanted = hit ? hit.el : null;
    if (wanted !== activeEl) swapTo(hit);

    if (!hit || hit.el !== activeEl) return; // mid cross-fade, or nothing on screen to attach to

    const goal = targetOf(hit);
    const k = reduced ? 1 : 0.14; // tight follow: the symbol stays attached to its place on the page
    cur.x = lerp(cur.x, goal.x, 0.35);
    cur.y = lerp(cur.y, goal.y, 0.35);
    cur.s = lerp(cur.s, goal.s, 0.35);
    cur.explode = lerp(cur.explode, goal.explode, k * 0.6);

    // Slow, eased float: a small bob, a gentle sway and a hint of breathing. Scroll still drives the main turn.
    const t = reduced ? 0 : now / 1000;
    const bob = Math.sin(t * 0.85);                 // ~7s period
    const sway = Math.sin(t * 0.5 + 1.2);
    spin.rotation.y = 0.55 + (reduced ? 0 : window.scrollY * 0.0021) + sway * 0.16;
    rig.rotation.x = 0.95 + Math.sin(t * 0.62) * 0.045;
    rig.rotation.z = Math.sin(t * 0.42 + 0.6) * 0.035;
    rig.position.set(cur.x, cur.y + bob * 0.055 * cur.s, 0);
    rig.scale.setScalar(Math.max(cur.s, 0.0001));

    for (const qh of quarters) {
      const u = qh.userData;
      u.focus = lerp(u.focus, focusIndex === u.q ? 1 : 0, 0.14);
      const breathe = Math.sin(t * 0.7 + u.q * QUARTER) * 0.012 * (0.4 + cur.explode);
      qh.position.copy(u.dir).multiplyScalar(GAP + breathe + cur.explode * 0.7 + u.focus * 0.3);
    }

    // shadow sits below the symbol; it tightens and darkens as the symbol dips, softens as it rises
    shadow.position.set(cur.x, cur.y - cur.s * 1.42, -0.5);
    shadow.scale.set(cur.s * (1.05 - bob * 0.06), cur.s * (0.2 - bob * 0.015), 1);
    shadow.material.opacity = 0.75 - bob * 0.12;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  return {
    setFocus(i) { focusIndex = i == null ? -1 : i; },
    names: QUARTERS.map((q) => q.name),
    dispose() { running = false; renderer.dispose(); },
  };
}
