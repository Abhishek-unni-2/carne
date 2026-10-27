import { CONFIG } from './config.js';

const { gsap, ScrollTrigger } = window;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ───────── placeholders → real values (or honest "coming soon") ───────── */
const toast = $('#toast');
let toastTimer;
function say(msg) {
  toast.textContent = msg;
  toast.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-on'), 3200);
}

$$('[data-zepto]').forEach((a) => {
  if (CONFIG.zeptoUrl) {
    a.href = CONFIG.zeptoUrl;
    a.target = '_blank';
    a.rel = 'noopener';
  } else {
    a.addEventListener('click', (e) => { e.preventDefault(); say('The Zepto listing link goes live soon.'); });
  }
});

const email = $('[data-contact="email"]');
const phone = $('[data-contact="phone"]');
if (CONFIG.email) email.innerHTML = `<a href="mailto:${CONFIG.email}">${CONFIG.email}</a>`; else email.classList.add('is-pending');
if (CONFIG.phone) phone.innerHTML = `<a href="tel:${CONFIG.phone.replace(/\s/g, '')}">${CONFIG.phone}</a>`; else phone.classList.add('is-pending');
$$('[data-social]').forEach((a) => {
  const url = CONFIG.social[a.dataset.social];
  if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; }
  else {
    a.classList.add('is-pending');
    a.removeAttribute('href');
    a.setAttribute('aria-disabled', 'true');
    a.title = 'Link coming soon';
  }
});

/* ───────── motion ───────── */
gsap.registerPlugin(ScrollTrigger);

// nav colour follows the section underneath it
const nav = $('#nav');
$$('[data-theme]').forEach((sec) => {
  if (sec === nav) return;
  ScrollTrigger.create({
    trigger: sec, start: 'top 40px', end: 'bottom 40px',
    onToggle: (s) => { if (s.isActive) nav.dataset.theme = sec.dataset.theme; },
  });
});

// hero intro
const intro = gsap.timeline({ paused: true, defaults: { ease: 'power4.out' } });
intro
  .from('.nav', { yPercent: -100, opacity: 0, duration: 0.9 }, 0.2)
  .from('.hero__arch', { clipPath: 'inset(12% 8% 0% 8% round 999px 999px 24px 24px)', opacity: 0, duration: 1.5, ease: 'power3.out' }, 0.2)
  .from('.hero__float, .hero__ring', { scale: 0.4, opacity: 0, duration: 1.2, ease: 'back.out(1.6)', stagger: 0.15 }, 0.9)
  .from('.hero__eyebrow', { y: 20, opacity: 0, duration: 0.8 }, 0.35)
  .from('.hero__title .ln > span', { yPercent: 115, duration: 1.3, stagger: 0.14 }, 0.4)
  .from('.hero__lede', { y: 24, opacity: 0, duration: 1 }, 0.95)
  .from('.hero__foot > *', { y: 18, opacity: 0, duration: 0.9, stagger: 0.1 }, 1.1);


// generic reveals
ScrollTrigger.batch('[data-reveal]', {
  start: 'top 88%', once: true,
  onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.12, overwrite: true }),
});

// belief — manifesto words light up as you read
const manifesto = $('#manifesto');
(function splitWords(root) {
  const walk = (node) => {
    if (node.nodeType === 3) {
      const frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach((tok) => {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { frag.append(' '); return; }
        const s = document.createElement('span');
        s.className = 'w'; s.textContent = tok; frag.append(s);
      });
      node.replaceWith(frag);
    } else if (node.nodeType === 1) [...node.childNodes].forEach(walk);
  };
  [...root.childNodes].forEach(walk);
})(manifesto);
if (!reduced) {
  gsap.fromTo($$('.w', manifesto), { opacity: 0.14 }, {
    opacity: 1, ease: 'none', stagger: 0.5,
    scrollTrigger: { trigger: manifesto, start: 'top 78%', end: 'bottom 55%', scrub: 0.4 },
  });
}

/* ── routines: a 24-hour dial that turns through four real moments ── */
const STOPS = [
  { m: 11 * 60,       day: 'Sunday' },
  { m: 13 * 60 + 15,  day: 'Weekdays' },
  { m: 19 * 60 + 10,  day: 'Weeknights' },
  { m: 20 * 60 + 40,  day: 'Tuesday' },
];
const NS = 'http://www.w3.org/2000/svg';
const polar = (m, r) => {
  const a = (m / 1440) * Math.PI * 2;
  return [200 + Math.sin(a) * r, 200 - Math.cos(a) * r];
};
const svgEl = (name, attrs, parent) => {
  const el = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  parent.append(el);
  return el;
};
const ticks = $('#dialTicks');
for (let h = 0; h < 24; h++) {
  const major = h % 6 === 0;
  const [x1, y1] = polar(h * 60, 170);
  const [x2, y2] = polar(h * 60, major ? 154 : 162);
  svgEl('line', { x1, y1, x2, y2, class: `dial__tick${major ? ' dial__tick--major' : ''}` }, ticks);
  if (major) {
    const [lx, ly] = polar(h * 60, 128);
    svgEl('text', { x: lx, y: ly, class: 'dial__label' }, ticks).textContent = String(h).padStart(2, '0');
  }
}
const stopDots = STOPS.map((s) => {
  const [cx, cy] = polar(s.m, 150);
  return svgEl('circle', { cx, cy, r: 7, class: 'dial__stop' }, $('#dialStops'));
});
const hand = $('#dialHand'), arc = $('#dialArc'), clockTime = $('#clockTime'), clockDay = $('#clockDay');
const ARC_LEN = 2 * Math.PI * 150;
const dial = { m: STOPS[0].m };
function renderDial() {
  const [x, y] = polar(dial.m, 138);
  hand.setAttribute('x2', x); hand.setAttribute('y2', y);
  arc.style.strokeDashoffset = ARC_LEN * (1 - dial.m / 1440);
  const hh = Math.floor(dial.m / 60), mm = Math.floor(dial.m % 60);
  clockTime.textContent = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  let idx = 0;
  STOPS.forEach((s, i) => { if (dial.m >= s.m - 20) idx = i; });
  clockDay.textContent = STOPS[idx].day;
  stopDots.forEach((d, i) => d.classList.toggle('is-on', dial.m >= STOPS[i].m - 1));
}
renderDial();

const mm = gsap.matchMedia();
mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
  const scenes = $$('.scene');
  gsap.set(scenes.slice(1), { autoAlpha: 0 });
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '.routines__stage', start: 'top top', end: () => `+=${window.innerHeight * 3.2}`,
      pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true,
    },
  });
  for (let i = 1; i < scenes.length; i++) {
    const at = i - 1;
    tl.to(dial, { m: STOPS[i].m, duration: 1, ease: 'power1.inOut', onUpdate: renderDial }, at)
      .to(scenes[i - 1], { autoAlpha: 0, y: -28, duration: 0.25 }, at + 0.5)
      .fromTo(scenes[i], { autoAlpha: 0, y: 36 }, { autoAlpha: 1, y: 0, duration: 0.3 }, at + 0.68)
      .fromTo($('.scene__photo img', scenes[i]), { scale: 1.18 }, { scale: 1, duration: 0.5 }, at + 0.68);
  }
  tl.to({}, { duration: 0.35 });
  return () => { gsap.set(scenes, { clearProps: 'all' }); dial.m = STOPS[0].m; renderDial(); };
});

/* ── range: four panels, one open at a time ── */
const cuts = $$('.cut');
const wide = matchMedia('(min-width: 900px)');
let openCut = 0;
function openPanel(i) {
  openCut = i;
  cuts.forEach((c, n) => c.classList.toggle('is-active', n === i));
}
cuts.forEach((c, i) => {
  c.addEventListener('pointerenter', () => wide.matches && openPanel(i));
  c.addEventListener('focusin', () => openPanel(i));
  c.addEventListener('click', () => openPanel(i));
});
$$('[data-cut]').forEach((a) => a.addEventListener('click', () => openPanel(+a.dataset.cut)));
gsap.from('.cut', {
  y: 70, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.1,
  scrollTrigger: { trigger: '#cuts', start: 'top 82%', once: true },
});

/* ── difference ── */
const strikes = $$('#nope s');
ScrollTrigger.create({
  trigger: '#nope', start: 'top 75%', once: true,
  onEnter: () => {
    gsap.to(strikes, { '--w': 1, duration: 0.7, ease: 'power3.inOut', stagger: 0.35, delay: 0.3 });
    gsap.from('.nope__yes', { y: 24, opacity: 0, duration: 1, delay: 1.9, ease: 'power3.out' });
  },
});
gsap.set('.nope__yes', { opacity: 1 });
if (!reduced && matchMedia('(min-width: 900px)').matches) {
  $$('[data-parallax]').forEach((el) => {
    gsap.fromTo(el, { y: -parseFloat(el.dataset.parallax) }, {
      y: parseFloat(el.dataset.parallax), ease: 'none',
      scrollTrigger: { trigger: '.diff__photos', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}
if (reduced) strikes.forEach((s) => s.style.setProperty('--w', 1));

/* ── availability: route draws itself, list and map talk to each other ── */
const route = $('#route');
const len = route.getTotalLength();
gsap.set(route, { strokeDasharray: '6 8' });
if (!reduced) {
  gsap.from('.sch__node', {
    scale: 0, transformOrigin: 'center', transformBox: 'fill-box', opacity: 0, duration: 0.7, ease: 'back.out(2)', stagger: 0.22,
    scrollTrigger: { trigger: '.schematic', start: 'top 75%', once: true },
  });
  gsap.from(route, {
    opacity: 0, duration: 1.4, ease: 'power2.out',
    scrollTrigger: { trigger: '.schematic', start: 'top 75%', once: true },
  });
  gsap.from('.hoods li', {
    y: 30, opacity: 0, duration: 0.9, stagger: 0.1, ease: 'power3.out',
    scrollTrigger: { trigger: '.hoods', start: 'top 85%', once: true },
  });
}
const hot = (id, on) => {
  $$(`[data-hood="${id}"]`).forEach((el) => el.classList.toggle('is-hot', on));
};
$$('[data-hood]').forEach((el) => {
  const id = el.dataset.hood;
  el.addEventListener('pointerenter', () => hot(id, true));
  el.addEventListener('pointerleave', () => hot(id, false));
  el.addEventListener('focus', () => hot(id, true));
  el.addEventListener('blur', () => hot(id, false));
});

/* ── footer wordmark ── */
if (!reduced) {
  gsap.from('.foot__word', {
    yPercent: 40, opacity: 0, duration: 1.3, ease: 'power4.out',
    scrollTrigger: { trigger: '.foot', start: 'top 85%', once: true },
  });
}

/* ───────── contact form ───────── */
const form = $('#form');
const status = $('#formStatus');
const rules = {
  name: (v) => (v.trim().length < 2 ? 'Please tell us your name.' : ''),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'That email doesn’t look right.'),
  phone: (v) => (!v.trim() || /^[+()\d\s-]{7,16}$/.test(v.trim()) ? '' : 'Digits, spaces and + only, please.'),
  message: (v) => (v.trim().length < 10 ? 'A line or two helps us reply properly.' : ''),
  type: (v) => (v ? '' : 'Pick the closest fit.'),
};
function check(name) {
  const f = form.elements[name];
  const value = name === 'type' ? (form.querySelector('input[name=type]:checked')?.value || '') : f.value;
  const msg = rules[name](value);
  $(`[data-err="${name}"]`).textContent = msg;
  if (name !== 'type') f.setAttribute('aria-invalid', msg ? 'true' : 'false');
  return !msg;
}
Object.keys(rules).forEach((n) => {
  if (n === 'type') return;
  form.elements[n].addEventListener('blur', () => check(n));
  form.elements[n].addEventListener('input', () => form.elements[n].getAttribute('aria-invalid') === 'true' && check(n));
});
form.addEventListener('change', (e) => e.target.name === 'type' && check('type'));

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  status.className = 'form__status';
  const ok = Object.keys(rules).map(check).every(Boolean);
  if (!ok) {
    status.textContent = 'Almost there. Fix the highlighted fields.';
    form.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }
  if (!CONFIG.formEndpoint) {
    status.classList.add('is-warn');
    status.textContent = 'Looks good, but this form isn’t connected yet, so nothing has been sent.';
    return;
  }
  status.textContent = 'Sending…';
  try {
    const res = await fetch(CONFIG.formEndpoint, {
      method: 'POST', headers: { Accept: 'application/json' }, body: new FormData(form),
    });
    if (!res.ok) throw new Error(res.status);
    form.reset();
    status.textContent = 'Thanks, we’ve got it. We’ll reply soon.';
  } catch {
    status.classList.add('is-warn');
    status.textContent = 'That didn’t go through. Please try again in a moment.';
  }
});

// in-page links: smooth scroll handled here (CSS smooth-scroll breaks ScrollTrigger's measurements)
$$('a[href^="#"]').forEach((a) => {
  const id = a.getAttribute('href');
  if (id.length < 2) return;
  a.addEventListener('click', (e) => {
    const target = $(id);
    if (!target) return;
    e.preventDefault();
    const y = target.getBoundingClientRect().top + window.scrollY - (id === '#top' ? 0 : 0);
    window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    history.replaceState(null, '', id);
  });
});

// images change layout height as they arrive; re-measure once everything's in
addEventListener('load', () => ScrollTrigger.refresh());

/* ───────── loader ───────── */
(function loader() {
  const el = $('#loader');
  const root = document.documentElement;
  const done = () => { root.classList.remove('is-loading'); el.remove(); intro.play(); ScrollTrigger.refresh(); };
  if (reduced) { done(); intro.progress(1); return; }

  const brand = $('#loaderBrand');
  const stage = $('#loaderStage');
  const sheen = $('.loader__sheen');
  const words = brand.textContent.trim().split(/\s+/);
  brand.textContent = '';
  const letters = [];
  words.forEach((w) => {
    const word = document.createElement('span');
    word.className = 'loader__word';
    [...w].forEach((ch) => {
      const s = document.createElement('span');
      s.textContent = ch;
      letters.push(s);
      word.append(s);
    });
    brand.append(word);
  });
  const n = letters.length, mid = (n - 1) / 2;

  gsap.set(letters, { opacity: 0, rotationX: -95, z: -700, y: 60, transformOrigin: '50% 100% -40px' });
  gsap.set(brand, { rotationY: -24, rotationX: 8 });

  // 1 · letters swing up out of the dark, settling one after another
  const tl = gsap.timeline();
  tl.to('.loader__glow', { opacity: 1, duration: 1.4, ease: 'power2.out' }, 0)
    .to(letters, { opacity: 1, rotationX: 0, z: 0, y: 0, duration: 1.15, ease: 'back.out(1.5)', stagger: { each: 0.06, from: 'start' } }, 0.15)
    // 2 · the whole word turns to face us, then a light passes across it
    .to(brand, { rotationY: 0, rotationX: 0, duration: 1.6, ease: 'power3.out' }, 0.2)
    .add(() => sheen.classList.add('is-run'), 1.2)
    .to(brand, { rotationY: 5, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 1.8);

  // gentle pointer parallax on top of the idle sway
  const tiltX = gsap.quickTo(stage, 'rotationX', { duration: 0.8, ease: 'power3.out' });
  const tiltY = gsap.quickTo(stage, 'rotationY', { duration: 0.8, ease: 'power3.out' });
  const onMove = (e) => { tiltY((e.clientX / innerWidth - 0.5) * 14); tiltX(-(e.clientY / innerHeight - 0.5) * 10); };
  addEventListener('pointermove', onMove);

  const entered = new Promise((r) => gsap.delayedCall(0.15 + 0.06 * (n - 1) + 1.15, r));
  const loaded = new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })));
  const ready = Promise.all([loaded, document.fonts ? document.fonts.ready : Promise.resolve(), entered]);
  const failsafe = new Promise((r) => setTimeout(r, 7000));

  Promise.race([ready, failsafe]).then(() => {
    // 3 · letters rush past the camera from the centre out, then the curtain lifts
    removeEventListener('pointermove', onMove);
    gsap.timeline({ delay: 0.5 })
      .to(letters, { z: 900, opacity: 0, rotationX: 25, duration: 0.8, ease: 'power3.in', stagger: { each: 0.035, from: 'center' } })
      .to('.loader__glow', { opacity: 0, duration: 0.5 }, '<')
      .to(el, { yPercent: -100, duration: 1, ease: 'power4.inOut', onComplete: done }, '-=0.35');
  });
})();


/* ───────── hero: 3D tilt, photo rotation, optional footage ───────── */
(function heroMedia() {
  const stage = $('#heroPhoto'), tilt = $('#heroTilt'), arch = $('.hero__arch');
  if (!stage || !tilt) return;

  // client footage, when present, plays over the photos
  const vid = $('#heroVideo');
  if (vid) {
    vid.addEventListener('canplay', () => { vid.classList.add('is-ready'); vid.play().catch(() => {}); }, { once: true });
    vid.querySelector('source').addEventListener('error', () => vid.remove());
  }

  // slow rotation through the cooking photos
  const imgs = $$('#heroSlides img');
  let i = 0;
  if (!reduced && imgs.length > 1) {
    setInterval(() => {
      imgs[i].classList.remove('is-on');
      i = (i + 1) % imgs.length;
      void imgs[i].offsetWidth;
      imgs[i].classList.add('is-on');
    }, 4500);
  }

  if (reduced || !matchMedia('(hover:hover) and (min-width:900px)').matches) return;
  const rx = gsap.quickTo(tilt, 'rotationX', { duration: 0.9, ease: 'power3.out' });
  const ry = gsap.quickTo(tilt, 'rotationY', { duration: 0.9, ease: 'power3.out' });
  addEventListener('pointermove', (e) => {
    const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
    ry(nx * 22); rx(-ny * 16);
    arch.style.setProperty('--gx', 50 + nx * 80 + '%');
    arch.style.setProperty('--gy', 30 + ny * 80 + '%');
  });
})();
