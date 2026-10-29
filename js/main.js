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

$$('[data-contact="email"]').forEach((el) => {
  if (CONFIG.email) el.innerHTML = `<a href="mailto:${CONFIG.email}">${CONFIG.email}</a>`; else el.classList.add('is-pending');
});
$$('[data-contact="phone"]').forEach((el) => {
  if (CONFIG.phone) el.innerHTML = `<a href="tel:${CONFIG.phone.replace(/\s/g, '')}">${CONFIG.phone}</a>`; else el.classList.add('is-pending');
});
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
  .from('.hero__cta > *', { y: 20, opacity: 0, duration: 0.8, stagger: 0.1 }, 1.1)
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

/* ── range: three panels, one open at a time ── */
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
gsap.from('.cut', {
  y: 70, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.1,
  scrollTrigger: { trigger: '#cuts', start: 'top 82%', once: true },
});

/* ── difference ── */
if (!reduced && matchMedia('(min-width: 900px)').matches) {
  $$('[data-parallax]').forEach((el) => {
    gsap.fromTo(el, { y: -parseFloat(el.dataset.parallax) }, {
      y: parseFloat(el.dataset.parallax), ease: 'none',
      scrollTrigger: { trigger: '.diff__photos', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

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
};
function check(name) {
  const f = form.elements[name];
  const msg = rules[name](f.value);
  $(`[data-err="${name}"]`).textContent = msg;
  f.setAttribute('aria-invalid', msg ? 'true' : 'false');
  return !msg;
}
Object.keys(rules).forEach((n) => {
  form.elements[n].addEventListener('blur', () => check(n));
  form.elements[n].addEventListener('input', () => form.elements[n].getAttribute('aria-invalid') === 'true' && check(n));
});

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

  const ring = $('#loaderRing');
  const stage = $('#loaderStage');
  const NAME = 'CARNE & GUSTO';
  const n = NAME.length, mid = (n - 1) / 2;
  const SLOT = 0.52;                       // em of arc per letter, kept constant while the ring unrolls
  const letters = [...NAME].map((ch) => {
    const s = document.createElement('span');
    s.className = 'loader__l';
    s.textContent = ch === ' ' ? '\u00a0' : ch;
    ring.append(s);
    return s;
  });
  const small = matchMedia('(max-width:899px)').matches;

  // s.spin: ring rotation · s.step: degrees between letters (360/n = closed ring, small = flat name)
  // s.grow: ring scale-in · s.out: fly-past exit
  const s = { spin: small ? 360 : 540, step: 360 / n, grow: 0, out: 0 };
  const render = () => {
    const rad = (s.step * Math.PI) / 180;
    const R = SLOT / rad;
    ring.style.transform = `translateZ(${-R * s.grow}em) rotateX(${7 * s.grow}deg) rotateY(${s.spin}deg) scale(${0.3 + 0.7 * s.grow})`;
    letters.forEach((el, i) => {
      const a = (i - mid) * s.step;
      const world = ((a + s.spin) * Math.PI) / 180;
      const face = Math.cos(world);                       // 1 = facing us, -1 = facing away
      const dist = Math.abs(i - mid) / mid;               // 0 centre … 1 edges
      const o = Math.min(1, Math.max(0, s.out * 1.6 - (1 - dist) * 0.6));
      const op = (face > 0 ? 0.55 + 0.45 * face : 0.16 + 0.1 * (1 + face)) * s.grow * (1 - o);
      el.style.opacity = op.toFixed(3);
      el.style.transform = `translate(-50%,-50%) rotateY(${a}deg) translateZ(${R}em) translateZ(${o * 700}px)`;
    });
  };
  render();
  gsap.ticker.add(render);

  // 1 · the ring spins up out of the dark, then slows
  const tl = gsap.timeline();
  tl.to('.loader__glow', { opacity: 1, duration: 1.4, ease: 'power2.out' }, 0)
    .to(s, { grow: 1, duration: 1.2, ease: 'power3.out' }, 0.1)
    .to(s, { spin: 0, duration: 2.7, ease: 'power3.out' }, 0.1)
    // 2 · the ring unrolls into a flat, readable name
    .to(s, { step: small ? 7 : 5, duration: 1.5, ease: 'power3.inOut' }, 1.5);

  // gentle pointer parallax
  const tiltX = gsap.quickTo(stage, 'rotationX', { duration: 0.8, ease: 'power3.out' });
  const tiltY = gsap.quickTo(stage, 'rotationY', { duration: 0.8, ease: 'power3.out' });
  const onMove = (e) => { tiltY((e.clientX / innerWidth - 0.5) * 10); tiltX(-(e.clientY / innerHeight - 0.5) * 7); };
  addEventListener('pointermove', onMove);

  const entered = new Promise((r) => gsap.delayedCall(3.2, r));
  const loaded = new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })));
  const ready = Promise.all([loaded, document.fonts ? document.fonts.ready : Promise.resolve(), entered]);
  const failsafe = new Promise((r) => setTimeout(r, 8000));

  Promise.race([ready, failsafe]).then(() => {
    // 3 · letters rush past the camera from the centre out, then the curtain lifts
    removeEventListener('pointermove', onMove);
    gsap.timeline({ delay: 0.35 })
      .to(s, { step: s.step, spin: 0, grow: 1, out: 1, duration: 0.95, ease: 'power3.in' })
      .to('.loader__glow, .loader__floor', { opacity: 0, duration: 0.5 }, '<')
      .to(el, { yPercent: -100, duration: 1, ease: 'power4.inOut', onComplete: () => { gsap.ticker.remove(render); done(); } }, '-=0.3');
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


/* ───────── mobile menu ───────── */
(function menu() {
  const toggle = $('#navToggle'), panel = $('#menu'), root = document.documentElement;
  const set = (open) => {
    root.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    panel.setAttribute('aria-hidden', String(!open));
  };
  toggle.addEventListener('click', () => set(!root.classList.contains('menu-open')));
  $$('a', panel).forEach((a) => a.addEventListener('click', () => set(false)));
  addEventListener('keydown', (e) => e.key === 'Escape' && set(false));
  matchMedia('(min-width: 1061px)').addEventListener('change', (e) => e.matches && set(false));
})();
