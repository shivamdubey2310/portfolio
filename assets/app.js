/* Shared site scripts (no dependencies). Loaded on every page.
   Everything here is an enhancement: with JS off, all content stays visible and readable. */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

// Footer year
(function () {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();

// Dark mode toggle (the initial class is applied by the inline script at the top of <body> to avoid a flash)
(function () {
  const toggle = document.getElementById('darkModeToggle');
  if (!toggle) return;

  const sync = () => toggle.setAttribute('aria-pressed', String(document.body.classList.contains('dark-mode')));
  const store = (v) => { try { localStorage.setItem('darkMode', String(v)); } catch (e) { /* storage blocked */ } };
  const stored = () => { try { return localStorage.getItem('darkMode'); } catch (e) { return null; } };
  sync();

  toggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    store(document.body.classList.contains('dark-mode'));
    sync();
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (stored() === null) {
      document.body.classList.toggle('dark-mode', e.matches);
      sync();
    }
  });
})();

// Mobile menu
(function () {
  const btn = document.getElementById('navToggle');
  const nav = document.getElementById('siteNav');
  if (!btn || !nav) return;

  const setOpen = (open) => {
    btn.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
  };
  btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      btn.focus();
    }
  });
})();

// Active-section highlight in the nav (index page) + header shadow + back-to-top
(function () {
  const header = document.querySelector('.siteHeader');
  const toTop = document.getElementById('toTop');

  const onScroll = () => {
    const y = window.scrollY || 0;
    if (header) header.classList.toggle('scrolled', y > 8);
    if (toTop) toTop.classList.toggle('show', y > 700);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const links = Array.from(document.querySelectorAll('#siteNav a[data-section]'));
  if (!links.length || !('IntersectionObserver' in window)) return;

  const byId = new Map();
  for (const a of links) {
    const el = document.getElementById(a.dataset.section);
    if (el) byId.set(el, a);
  }
  // Sections that belong to another nav item (e.g. Leadership sits under Education)
  for (const el of document.querySelectorAll('[data-nav-parent]')) {
    const a = links.find((l) => l.dataset.section === el.dataset.navParent);
    if (a) byId.set(el, a);
  }

  const visible = new Set();
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (en.isIntersecting) visible.add(en.target); else visible.delete(en.target);
    }
    // Highlight the visible section nearest the top of the viewport
    let best = null;
    let bestTop = Infinity;
    for (const el of visible) {
      const top = Math.abs(el.getBoundingClientRect().top);
      if (top < bestTop) { bestTop = top; best = el; }
    }
    for (const a of links) a.removeAttribute('aria-current');
    if (best && byId.get(best)) byId.get(best).setAttribute('aria-current', 'location');
  }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });

  for (const el of byId.keys()) io.observe(el);
})();

// Mouse glow (decorative; fine pointers only, never with reduced motion)
(function () {
  if (prefersReducedMotion.matches || !finePointer.matches) return;
  let ticking = false;
  document.addEventListener('mousemove', (e) => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      document.body.style.setProperty('--mouse-x', `${(e.clientX / window.innerWidth) * 100}%`);
      document.body.style.setProperty('--mouse-y', `${(e.clientY / window.innerHeight) * 100}%`);
      document.body.classList.add('mouse-active');
      ticking = false;
    });
  });
  document.addEventListener('mouseleave', () => document.body.classList.remove('mouse-active'));
})();

// Reveal on scroll. The hidden starting state only applies once this script runs (html.reveal-ready),
// so content is always visible if JS fails or is disabled.
(function () {
  const els = Array.from(document.querySelectorAll('.reveal'));
  if (!els.length || prefersReducedMotion.matches || !('IntersectionObserver' in window)) return;

  document.documentElement.classList.add('reveal-ready');
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    }
  }, { root: null, threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  els.forEach((el) => io.observe(el));
})();

// Subtle card tilt (fine pointers only, never with reduced motion)
(function () {
  if (prefersReducedMotion.matches || !finePointer.matches) return;
  document.querySelectorAll('.projectCard, .miniCard').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const rotateX = (e.clientY - rect.top - rect.height / 2) / 45;
      const rotateY = (rect.width / 2 - (e.clientX - rect.left)) / 45;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
})();

// Copy-to-clipboard buttons: <button data-copy="text"> with an optional sibling [data-copy-status]
(function () {
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    const status = btn.parentElement && btn.parentElement.querySelector('[data-copy-status]');
    const label = btn.textContent;
    btn.addEventListener('click', async () => {
      const text = btn.getAttribute('data-copy');
      let ok = false;
      try {
        await navigator.clipboard.writeText(text);
        ok = true;
      } catch (e) {
        // Fallback for insecure contexts / older browsers
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
        ta.remove();
      }
      btn.textContent = ok ? 'Copied ✓' : 'Press Ctrl/⌘+C';
      if (status) status.textContent = ok ? 'Email address copied to clipboard' : 'Copy failed. Select the address and copy it manually.';
      setTimeout(() => { btn.textContent = label; if (status) status.textContent = ''; }, 2200);
    });
  });
})();

// Optional contact form: stays hidden until a form endpoint is configured (data-endpoint on the <form>).
// On any failure it falls back to opening the visitor's mail client with the message pre-filled.
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const endpoint = (form.getAttribute('data-endpoint') || '').trim();
  if (!endpoint) return;
  form.hidden = false;

  const status = form.querySelector('[data-form-status]');
  const mailto = () => {
    const d = new FormData(form);
    const subject = encodeURIComponent('Portfolio inquiry from ' + (d.get('name') || ''));
    const body = encodeURIComponent((d.get('message') || '') + '\n\n' + (d.get('name') || '') + ' <' + (d.get('email') || '') + '>');
    window.location.href = `mailto:${form.getAttribute('data-fallback-email')}?subject=${subject}&body=${body}`;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = new FormData(form);
    if (d.get('company')) return; // honeypot
    if (status) status.textContent = 'Sending…';
    try {
      const res = await fetch(endpoint, { method: 'POST', body: d, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      form.reset();
      if (status) status.textContent = 'Thanks! Your message was sent.';
    } catch (err) {
      if (status) status.textContent = 'Could not send. Opening your email app instead…';
      mailto();
    }
  });
})();
