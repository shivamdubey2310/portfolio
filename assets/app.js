/* Layout 1 multi-page scripts (no dependencies) */

(function () {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();

// Dark Mode Toggle
(function () {
  const toggle = document.getElementById('darkModeToggle');
  if (!toggle) return;

  // Check for saved preference or system preference
  const savedTheme = localStorage.getItem('darkMode');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'true' || (savedTheme === null && systemPrefersDark)) {
    document.body.classList.add('dark-mode');
  }

  toggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
  });

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem('darkMode') === null) {
      if (e.matches) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }
  });
})();

// Mouse tracking for background glow effect
(function () {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  let ticking = false;
  
  document.addEventListener('mousemove', (e) => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        document.body.style.setProperty('--mouse-x', `${x}%`);
        document.body.style.setProperty('--mouse-y', `${y}%`);
        document.body.classList.add('mouse-active');
        ticking = false;
      });
      ticking = true;
    }
  });

  document.addEventListener('mouseleave', () => {
    document.body.classList.remove('mouse-active');
  });
})();

// Reveal on scroll (respects reduced motion)
(function () {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const els = Array.from(document.querySelectorAll('.reveal'));
  if (!els.length) return;

  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      }
    },
    { root: null, threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
  );

  els.forEach((el) => io.observe(el));
})();

// Tilt effect on cards
(function () {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const cards = document.querySelectorAll('.projectCard, .miniCard');
  
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px) scale(1.01)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
})();

// Projects filtering (projects page)
(function () {
  const input = document.querySelector('[data-project-filter]');
  const count = document.querySelector('[data-project-count]');
  const cards = Array.from(document.querySelectorAll('[data-project-card]'));

  if (!input || !cards.length) return;

  function update() {
    const q = String(input.value || '').trim().toLowerCase();
    let visible = 0;

    for (const card of cards) {
      const hay = String(card.getAttribute('data-search') || '').toLowerCase();
      const show = !q || hay.includes(q);
      card.style.display = show ? '' : 'none';
      if (show) visible += 1;
    }

    if (count) count.textContent = String(visible);
  }

  input.addEventListener('input', update);
  update();
})();

// Clickable project cards (projects page)
(function () {
  const cards = Array.from(document.querySelectorAll('[data-project-card][data-href]'));
  if (!cards.length) return;

  function shouldIgnoreEvent(target) {
    const el = target && target.closest ? target.closest('a, button, input, textarea, select, label') : null;
    return Boolean(el);
  }

  for (const card of cards) {
    const href = String(card.getAttribute('data-href') || '').trim();
    if (!href) continue;

    card.addEventListener('click', (e) => {
      if (shouldIgnoreEvent(e.target)) return;
      window.location.href = href;
    });

    card.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (shouldIgnoreEvent(e.target)) return;
      e.preventDefault();
      window.location.href = href;
    });
  }
})();

// Load architecture images from /project_images based on data-arch-img attribute.
(function () {
  function loadArchImages(root = document) {
    const holders = Array.from(root.querySelectorAll('[data-arch-img]'));
    const empties = Array.from(root.querySelectorAll('.archImg:not([data-arch-img])'));

    for (const el of holders) {
      const file = String(el.getAttribute('data-arch-img') || '').trim();
      if (!file) continue;

      const img = new Image();
      img.loading = 'lazy';
      img.alt = 'Architecture diagram';
      img.src = `../project_images/${file}`;

      img.addEventListener('load', () => {
        el.classList.add('hasImage');
        el.appendChild(img);
      });

      img.addEventListener('error', () => {
        el.classList.add('hasPlaceholder');
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '120');
        svg.setAttribute('height', '80');
        svg.setAttribute('viewBox', '0 0 120 80');
        svg.setAttribute('aria-hidden', 'true');
        svg.innerHTML = `
          <rect width="120" height="80" fill="rgba(255,255,255,.02)" rx="8" />
          <g transform="translate(12,20)" fill="rgba(255,255,255,.65)" font-family="ui-sans-serif,system-ui" font-size="10">
            <text x="0" y="0">No image</text>
          </g>
        `;
        el.appendChild(svg);
      });
    }

    // Also add placeholders for archImg elements that don't have a data-arch-img (empty slots)
    for (const el of empties) {
      if (el.childElementCount) continue;
      el.classList.add('hasPlaceholder');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '120');
      svg.setAttribute('height', '80');
      svg.setAttribute('viewBox', '0 0 120 80');
      svg.setAttribute('aria-hidden', 'true');
      svg.innerHTML = `
        <rect width="120" height="80" fill="rgba(255,255,255,.02)" rx="8" />
        <g transform="translate(12,20)" fill="rgba(255,255,255,.65)" font-family="ui-sans-serif,system-ui" font-size="10">
          <text x="0" y="0">No image</text>
        </g>
      `;
      el.appendChild(svg);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => loadArchImages(document));
  } else {
    loadArchImages(document);
  }
  // Allow other pages to trigger a reload of arch images after DOM changes
  window.addEventListener('archImagesLoad', () => loadArchImages(document));
})();
