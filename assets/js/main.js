(() => {
  'use strict';

  const root = document.documentElement;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SVG_NS = 'http://www.w3.org/2000/svg';

  /* ---------- Theme ---------- */
  const themeToggle = document.getElementById('theme-toggle');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const currentTheme = () => root.getAttribute('data-theme') || (systemDark.matches ? 'dark' : 'light');

  themeToggle?.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* storage unavailable */ }
  });

  /* ---------- Nav: scrolled state + mobile menu ---------- */
  const nav = document.querySelector('.nav');
  const burger = document.getElementById('nav-burger');
  const links = document.getElementById('nav-links');

  const onScroll = () => {
    nav?.classList.toggle('is-scrolled', window.scrollY > 8);
    // Nothing is "active" while the hero is in view
    if (window.scrollY < 240) document.querySelectorAll('.nav__links a.is-active').forEach((a) => { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setMenu = (open) => {
    links?.classList.toggle('is-open', open);
    burger?.setAttribute('aria-expanded', String(open));
    burger?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  burger?.addEventListener('click', () => setMenu(!links.classList.contains('is-open')));

  // "Back to top" links (brand + footer): scroll explicitly so it works no matter where the anchor sits
  document.querySelectorAll('a[href="#top"]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    setMenu(false);
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    history.replaceState(null, '', location.pathname + location.search);
  }));
  links?.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });

  /* ---------- Dropdown menus (<details>) ---------- */
  const menus = [...document.querySelectorAll('details.menu')];
  menus.forEach((m) => m.addEventListener('toggle', () => {
    if (m.open) menus.forEach((o) => { if (o !== m) o.open = false; });
  }));
  document.addEventListener('click', (e) => {
    menus.forEach((m) => {
      if (m.open && !m.contains(e.target)) m.open = false;
      if (m.open && e.target.closest('.menu__panel a')) m.open = false;
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { menus.forEach((m) => { m.open = false; }); setMenu(false); }
  });

  /* ---------- Counters ---------- */
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    if (prefersReducedMotion || Number.isNaN(target)) return;
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals) + suffix;
    };
    requestAnimationFrame(step);
  };

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        entry.target.querySelectorAll('[data-count]').forEach(animateCount);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el, i) => {
      // Stagger siblings that enter together
      const siblings = el.parentElement ? [...el.parentElement.children].filter((c) => c.classList.contains('reveal')) : [];
      const idx = siblings.indexOf(el);
      if (idx > 0) el.style.transitionDelay = `${Math.min(idx, 6) * 70}ms`;
      io.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Active nav link ---------- */
  const navAnchors = [...document.querySelectorAll('.nav__links a')];
  const sections = navAnchors.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navAnchors.forEach((a) => {
          const active = a.getAttribute('href') === `#${entry.target.id}`;
          a.classList.toggle('is-active', active);
          if (active) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Case study dialogs ---------- */
  let lastTrigger = null;
  document.querySelectorAll('[data-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dlg = document.getElementById(btn.dataset.open);
      if (!dlg || typeof dlg.showModal !== 'function') return;
      lastTrigger = btn;
      dlg.showModal();
      document.body.style.overflow = 'hidden';
      dlg.querySelector('.cs__inner')?.scrollTo(0, 0);
    });
  });
  document.querySelectorAll('dialog.cs').forEach((dlg) => {
    dlg.addEventListener('click', (e) => {
      if (e.target === dlg || e.target.closest('[data-close]')) dlg.close();
    });
    dlg.addEventListener('close', () => {
      document.body.style.overflow = '';
      lastTrigger?.focus();
    });
  });

  /* ---------- Copy to clipboard ---------- */
  const toast = document.getElementById('toast');
  let toastTimer;
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 1800);
  };
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        showToast('Email copied to clipboard');
      } catch (e) {
        showToast(btn.dataset.copy);
      }
    });
  });

  /* ---------- Generated illustrations ---------- */
  const el = (tag, attrs) => {
    const node = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    return node;
  };

  // Control Tower heatmap: intensity from a few gaussian "hotspots"
  const heat = document.getElementById('ct-heat');
  if (heat) {
    const spots = [[2, 3, 2.2], [1, 8, 1.8], [4, 9, 1.6], [4, 1, 1.3]];
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 12; c++) {
        let v = 0;
        spots.forEach(([sr, sc, s]) => { v += Math.exp(-((r - sr) ** 2 + (c - sc) ** 2) / (2 * s * s)); });
        const opacity = Math.min(0.9, 0.06 + v * 0.75).toFixed(2);
        heat.appendChild(el('rect', { class: 'i-heat', x: c * 34, y: r * 32, width: 30, height: 28, rx: 6, opacity }));
      }
    }
  }

  // Chatbot platform: ten bot avatars on two rings
  const ring = document.getElementById('bot-ring');
  if (ring) {
    const fills = ['var(--accent)', 'var(--gold)', 'var(--ink-2)', 'var(--accent)', 'var(--gold)'];
    const place = (count, radius, offset, size) => {
      for (let i = 0; i < count; i++) {
        const a = offset + (i / count) * Math.PI * 2;
        const x = 240 + radius * Math.cos(a);
        const y = 150 + radius * Math.sin(a) * 0.92;
        const g = el('g', { class: 'i-bot', transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` });
        g.appendChild(el('circle', { r: size, fill: fills[(i + count) % fills.length] }));
        g.appendChild(el('circle', { cx: -size * 0.32, cy: -size * 0.1, r: size * 0.13, fill: 'var(--surface)', stroke: 'none' }));
        g.appendChild(el('circle', { cx: size * 0.32, cy: -size * 0.1, r: size * 0.13, fill: 'var(--surface)', stroke: 'none' }));
        g.appendChild(el('path', { d: `M${-size * 0.3} ${size * 0.28} Q 0 ${size * 0.5} ${size * 0.3} ${size * 0.28}`, fill: 'none', stroke: 'var(--surface)', 'stroke-width': 1.6, 'stroke-linecap': 'round' }));
        ring.appendChild(g);
      }
    };
    place(6, 118, -Math.PI / 2, 15);
    place(4, 82, -Math.PI / 4, 12);
  }

  /* ---------- Reduced motion: freeze SMIL animations ---------- */
  if (prefersReducedMotion) {
    document.querySelectorAll('svg').forEach((s) => { if (typeof s.pauseAnimations === 'function') s.pauseAnimations(); });
  }

  /* ---------- Hero rotator ---------- */
  const rotator = document.querySelector('[data-rotator]');
  if (rotator) {
    const items = [...rotator.querySelectorAll('.rotator__item')];
    const progress = document.createElement('span');
    progress.className = 'rotator__progress';
    items.forEach(() => progress.appendChild(document.createElement('span')));
    rotator.after(progress);
    let index = 0;
    const show = (next) => {
      items[index].classList.remove('is-active');
      items[index].classList.add('is-leaving');
      const leaving = items[index];
      setTimeout(() => leaving.classList.remove('is-leaving'), 600);
      index = next;
      items[index].classList.add('is-active');
      [...progress.children].forEach((s, i) => s.classList.toggle('is-active', i === index));
    };
    progress.children[0].classList.add('is-active');
    if (!prefersReducedMotion && items.length > 1) {
      let timer = setInterval(() => show((index + 1) % items.length), 3200);
      // Pause while the tab is hidden so it doesn't race ahead
      document.addEventListener('visibilitychange', () => {
        clearInterval(timer);
        if (!document.hidden) timer = setInterval(() => show((index + 1) % items.length), 3200);
      });
    }
  }

  /* ---------- Hero tags: scatter into free space, drag anywhere in the hero ---------- */
  const hero = document.querySelector('.hero');
  const tagList = hero?.querySelector('.proof');
  if (hero && tagList) {
    const tags = [...tagList.children];
    const GAP = 14; // breathing room around text, the photo and other tags
    const STEP = 8; // candidate grid resolution in px

    const toHero = (r, base) => ({ x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height });
    const overlap = (a, b) =>
      Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) *
      Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
    const centre = (r) => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

    // Usable area: the hero above the marquee
    const bounds = () => {
      const base = hero.getBoundingClientRect();
      const marquee = hero.querySelector('.marquee');
      const bottom = marquee ? marquee.getBoundingClientRect().top - base.top : base.height;
      return { base, w: base.width, h: bottom };
    };

    // Tight boxes around what's visible: each line of text, the pill and buttons, and the photo
    const obstacles = (base) => {
      const out = [];
      const copy = hero.querySelector('.hero__copy');
      const range = document.createRange();
      const walker = document.createTreeWalker(copy, NodeFilter.SHOW_TEXT, {
        acceptNode: (n) => (n.textContent.trim() && !n.parentElement.closest('.sr-only') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
      });
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        range.selectNodeContents(n);
        for (const r of range.getClientRects()) if (r.width && r.height) out.push({ ...toHero(r, base), weight: 10 });
      }
      copy.querySelectorAll('.pill, .btn, .rotator__progress').forEach((el) => out.push({ ...toHero(el.getBoundingClientRect(), base), weight: 10 }));
      const photo = hero.querySelector('.portrait__frame');
      if (photo) out.push({ ...toHero(photo.getBoundingClientRect(), base), weight: 6 });
      return out;
    };

    const place = (el, x, y) => { el.style.left = `${Math.round(x)}px`; el.style.top = `${Math.round(y)}px`; };

    // Phones and tablets (single-column hero) show the tags as a fixed grid under the photo
    const stacked = window.matchMedia('(max-width: 920px)');

    // Default spots around the photo, as centre offsets from its edges, in list order:
    // above-left, above-right, right-middle, below-left, below-right
    const targets = (p) => [
      { x: p.x - 80, y: p.y - 66 },
      { x: p.x + p.w + 49, y: p.y - 63 },
      { x: p.x + p.w + 179, y: p.y + p.h * 0.57 },
      { x: p.x - 5, y: p.y + p.h + 109 },
      { x: p.x + p.w + 75, y: p.y + p.h + 94 },
    ];

    // Each tag goes to its default spot, or the nearest spot that keeps clear of text, the photo and other tags
    const layout = () => {
      if (stacked.matches) {
        tags.forEach((t) => delete t.dataset.moved); // start fresh if the window grows back to desktop
        tagList.classList.add('is-placed');
        return;
      }
      const { base, w: W, h: H } = bounds();
      // Measure the copy where it ends up, not mid-way through its fade-in
      hero.classList.add('is-measuring');
      const blocked = obstacles(base);
      hero.classList.remove('is-measuring');
      const placed = [];
      tags.filter((t) => t.dataset.moved).forEach((t) => {
        // Keep tags the visitor has dragged, but pull them back inside if the hero shrank
        const x = Math.min(Math.max(0, t.offsetLeft), W - t.offsetWidth);
        const y = Math.min(Math.max(0, t.offsetTop), H - t.offsetHeight);
        place(t, x, y);
        placed.push({ x, y, w: t.offsetWidth, h: t.offsetHeight });
      });
      const photo = hero.querySelector('.portrait__frame');
      const spots = targets(photo ? toHero(photo.getBoundingClientRect(), base) : { x: W / 2, y: H / 2, w: 0, h: 0 });

      tags.forEach((t, i) => {
        if (t.dataset.moved) return;
        const w = t.offsetWidth;
        const h = t.offsetHeight;
        const goal = spots[i % spots.length];
        let best = null;
        for (let y = GAP; y <= H - h - GAP; y += STEP) {
          for (let x = GAP; x <= W - w - GAP; x += STEP) {
            const box = { x: x - GAP, y: y - GAP, w: w + GAP * 2, h: h + GAP * 2 };
            let clash = 0;
            for (const o of blocked) clash += overlap(box, o) * o.weight;
            for (const p of placed) clash += overlap(box, p) * 12;
            const c = centre({ x, y, w, h });
            const cost = clash * 1000 + Math.hypot(c.x - goal.x, c.y - goal.y);
            if (!best || cost < best.cost) best = { x, y, cost };
          }
        }
        if (!best) return;
        place(t, best.x, best.y);
        placed.push({ x: best.x, y: best.y, w, h });
      });
      tagList.classList.add('is-placed');
    };

    // Drag with mouse, pen or touch; tags stay inside the hero
    let front = 1;
    tags.forEach((t) => {
      t.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || stacked.matches) return;
        e.preventDefault();
        t.setPointerCapture(e.pointerId);
        t.classList.add('is-dragging');
        t.style.zIndex = String(++front); // last-dragged tag stays on top
        const startX = e.clientX - t.offsetLeft;
        const startY = e.clientY - t.offsetTop;
        const { w: W, h: H } = bounds();
        const move = (ev) => {
          const x = Math.min(Math.max(0, ev.clientX - startX), W - t.offsetWidth);
          const y = Math.min(Math.max(0, ev.clientY - startY), H - t.offsetHeight);
          place(t, x, y);
        };
        const end = () => {
          t.classList.remove('is-dragging');
          t.dataset.moved = '1';
          t.removeEventListener('pointermove', move);
          t.removeEventListener('pointerup', end);
          t.removeEventListener('pointercancel', end);
        };
        t.addEventListener('pointermove', move);
        t.addEventListener('pointerup', end);
        t.addEventListener('pointercancel', end);
      });
    });

    // Lay out once fonts and the hero's entrance animation have settled, and again when the width changes
    const settle = () => setTimeout(layout, prefersReducedMotion ? 0 : 900);
    (document.fonts?.ready ?? Promise.resolve()).then(settle);
    let lastWidth = window.innerWidth;
    let resizeTimer;
    window.addEventListener('resize', () => {
      if (window.innerWidth === lastWidth) return; // ignore mobile toolbar show/hide
      lastWidth = window.innerWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(layout, 150);
    });
  }

  /* ---------- Durations (kept current for "Present" roles) ---------- */
  const fmtDuration = (from, to) => {
    const [fy, fm] = from.split('-').map(Number);
    const now = new Date();
    const [ty, tm] = to === 'present' ? [now.getFullYear(), now.getMonth() + 1] : to.split('-').map(Number);
    const months = (ty - fy) * 12 + (tm - fm) + 1; // inclusive, like LinkedIn
    const y = Math.floor(months / 12);
    const m = months % 12;
    const parts = [];
    if (y) parts.push(`${y} yr${y > 1 ? 's' : ''}`);
    if (m) parts.push(`${m} mo${m > 1 ? 's' : ''}`);
    return parts.join(' ') || '1 mo';
  };
  document.querySelectorAll('.dur[data-from]').forEach((el) => {
    el.textContent = fmtDuration(el.dataset.from, el.dataset.to);
  });

  /* ---------- Footer year ---------- */
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
