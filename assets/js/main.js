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
