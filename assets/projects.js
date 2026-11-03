/* Projects page: .txt-driven detail modal, filters, lightbox.

   Each card on projects.html has data-project="<name>", which maps to Project_data/<name>.txt
   (or Other_project_data/<name>.txt for cards with data-other-project).

   .txt format (all sections optional except the first title line; unknown lines are ignored):
     <title line>              (skipped, the modal shows the card title)
     # comment                 (ignored, handy for TODO(confirm) notes)
     Results                   first plain line = one-line outcome; "- value | label" lines become metric chips
     My Role                   one or more lines: what I owned
     Project Info              "- Year: 2025" / "- Status: Completed"
     Overview | The Challenge | The Solution | Tech Stack | Key Highlights | Links
   Rendered order: Results, My Role, Overview, Challenge, Solution, Tech Stack, Highlights, Links.
*/

(function () {
  const modal = document.getElementById('projectModal');
  if (!modal) return;

  const modalTitle = document.getElementById('modalTitle');
  const modalContent = document.getElementById('modalContent');
  const modalBody = document.getElementById('modalBody');
  const modalPicture = document.getElementById('modalPicture');
  const zoomBtn = document.getElementById('zoomBtn');
  const prevBtn = document.getElementById('prevProject');
  const nextBtn = document.getElementById('nextProject');
  const modalCount = document.getElementById('modalCount');
  const closeBtn = modal.querySelector('.modalClose');
  const lightbox = document.getElementById('lightbox');
  const lbPicture = document.getElementById('lbPicture');
  const page = document.querySelector('.container');

  const cards = Array.from(document.querySelectorAll('[data-project-card]'));
  const textCache = new Map();
  let currentCard = null;
  let lastFocus = null;

  /* ---------- text helpers ---------- */
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  // Escapes, then applies **bold** and `code`
  function inline(s) {
    return esc(s)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  // "Label: text" -> bold label (label limited to simple words so URLs and sentences are left alone)
  function labelled(s) {
    const m = s.match(/^([A-Za-z0-9][A-Za-z0-9 \-&/()+.]{0,60}?):\s+(.*)$/);
    return m ? `<strong>${esc(m[1])}:</strong> ${inline(m[2])}` : inline(s);
  }

  /* ---------- .txt parser ---------- */
  const HEADERS = {
    'Overview': 'overview',
    'Tech Stack': 'techstack',
    'The Challenge': 'challenge',
    'The Solution': 'solution',
    'Key Highlights': 'highlights',
    'Results': 'results',
    'My Role': 'role',
    'Project Info': 'info'
  };

  function parseProject(text) {
    const out = { overview: [], techstack: [], challenge: [], solution: { intro: '', items: [] }, highlights: [], results: { outcome: '', chips: [] }, role: [], info: {} };
    let section = null;
    let first = true;

    for (const raw of text.split('\n')) {
      const line = raw.replace(/\r$/, '');
      const t = line.trim();
      if (!t) continue;
      if (first) { first = false; continue; }      // title line
      if (t.startsWith('#')) continue;               // comment

      if (HEADERS[t]) { section = HEADERS[t]; continue; }
      if (t === 'Links' || t.startsWith('Links')) { section = 'links'; continue; }

      const isBullet = t.startsWith('-');
      const body = isBullet ? t.replace(/^-\s*/, '') : t;
      const indented = /^\s{2,}/.test(line);

      switch (section) {
        case 'overview': out.overview.push(t); break;
        case 'role': out.role.push(t); break;
        case 'challenge': out.challenge.push({ bullet: isBullet, text: body }); break;
        case 'techstack':
          if (isBullet || body.includes(':')) out.techstack.push(body);
          break;
        case 'solution':
          if (isBullet) out.solution.items.push({ text: body, nested: indented && out.solution.items.length > 0 });
          else if (!out.solution.intro) out.solution.intro = t;
          break;
        case 'highlights': if (isBullet) out.highlights.push(body); break;
        case 'results':
          if (isBullet) {
            const [value, ...label] = body.split('|');
            out.results.chips.push({ value: value.trim(), label: label.join('|').trim() });
          } else if (!out.results.outcome) out.results.outcome = t;
          break;
        case 'info':
          if (isBullet && body.includes(':')) {
            const i = body.indexOf(':');
            out.info[body.slice(0, i).trim().toLowerCase()] = body.slice(i + 1).trim();
          }
          break;
        default: break; // links section and anything before the first header
      }
    }
    return out;
  }

  /* ---------- rendering ---------- */
  const githubIcon = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>';

  function section(label, inner) {
    return `<div class="projectSection"><h4 class="sectionLabel">${label}</h4>${inner}</div>`;
  }

  function render(p, card) {
    let html = '';

    const facts = [];
    if (p.info.year) facts.push(['Year', p.info.year]);
    if (p.info.status) facts.push(['Status', p.info.status]);
    if (facts.length) {
      html += `<ul class="projectFacts" aria-label="Project facts">${facts.map(([k, v]) => `<li><span>${esc(k)}</span> ${esc(v)}</li>`).join('')}</ul>`;
    }

    const r = p.results;
    if (r.outcome || r.chips.length) {
      let inner = '';
      if (r.chips.length) {
        inner += `<ul class="metricChips">${r.chips.map((c) => `<li><strong>${esc(c.value)}</strong>${c.label ? `<span>${esc(c.label)}</span>` : ''}</li>`).join('')}</ul>`;
      }
      if (r.outcome) inner += `<p class="oneLiner">${inline(r.outcome)}</p>`;
      html += section('Results', inner);
    }

    if (p.role.length) html += section('What I owned', p.role.map((l) => `<p>${inline(l)}</p>`).join(''));
    if (p.overview.length) html += section('Overview', p.overview.map((l) => `<p class="oneLiner">${inline(l)}</p>`).join(''));

    if (p.challenge.length) {
      let inner = '';
      let open = false;
      for (const c of p.challenge) {
        if (c.bullet) {
          if (!open) { inner += '<ul class="highlights">'; open = true; }
          inner += `<li>${inline(c.text)}</li>`;
        } else {
          if (open) { inner += '</ul>'; open = false; }
          inner += `<p>${labelled(c.text)}</p>`;
        }
      }
      if (open) inner += '</ul>';
      html += section('The Challenge', inner);
    }

    if (p.solution.intro || p.solution.items.length) {
      let inner = p.solution.intro ? `<p>${inline(p.solution.intro)}</p>` : '';
      if (p.solution.items.length) {
        const top = [];
        for (const it of p.solution.items) {
          if (it.nested && top.length) top[top.length - 1].kids.push(it.text);
          else top.push({ text: it.text, kids: [] });
        }
        inner += '<ul class="solutionList">' + top.map((t) =>
          `<li>${labelled(t.text)}${t.kids.length ? '<ul>' + t.kids.map((k) => `<li>${labelled(k)}</li>`).join('') + '</ul>' : ''}</li>`
        ).join('') + '</ul>';
      }
      html += section('The Solution', inner);
    }

    if (p.techstack.length) {
      html += section('Tech Stack', '<div class="techStack">' + p.techstack.map((t) => {
        const i = t.indexOf(':');
        return i > 0
          ? `<div class="techItem"><span class="techLabel">${esc(t.slice(0, i).trim())}:</span> <span class="techValue">${inline(t.slice(i + 1).trim())}</span></div>`
          : `<div class="techItem"><span class="techValue">${inline(t)}</span></div>`;
      }).join('') + '</div>');
    }

    if (p.highlights.length) {
      html += section('Key Highlights', '<ul class="highlights">' + p.highlights.map((h) => `<li>${labelled(h)}</li>`).join('') + '</ul>');
    }

    const github = card.getAttribute('data-github');
    const demo = card.getAttribute('data-demo');
    if (github || demo) {
      html += `<div class="projectSection projectLinks"><h4 class="sectionLabel">Links</h4>`;
      if (demo) html += `<a href="${esc(demo)}" target="_blank" rel="noopener noreferrer" class="projectLink demoBtn">Live demo ↗</a>`;
      if (github) html += `<a href="${esc(github)}" target="_blank" rel="noopener noreferrer" class="projectLink githubBtn">${githubIcon}View on GitHub</a>`;
      html += '</div>';
    }
    return html;
  }

  async function loadText(name, other) {
    const key = (other ? 'o:' : 'p:') + name;
    if (textCache.has(key)) return textCache.get(key);
    const folder = other ? 'Other_project_data' : 'Project_data';
    const res = await fetch(`./${folder}/${encodeURIComponent(name)}.txt`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    textCache.set(key, text);
    return text;
  }

  /* ---------- diagram <picture> ---------- */
  function pictureHtml(card, id, extra) {
    const img = card.querySelector('.projectThumbnail img');
    const other = card.hasAttribute('data-other-project');
    const slug = card.getAttribute('data-slug');
    const folder = other ? 'Other_project_images' : 'project_images';
    const w = card.getAttribute('data-full-w');
    const h = card.getAttribute('data-full-h');
    const dims = w && h ? ` width="${esc(w)}" height="${esc(h)}"` : '';
    return `<source type="image/webp" srcset="./${folder}/web/${esc(slug)}-full.webp"><img ${id ? `id="${id}"` : ''} src="${esc(img.getAttribute('src'))}" alt="${esc(img.alt)}"${dims} decoding="async" ${extra || ''}>`;
  }

  /* ---------- modal ---------- */
  // Previous/Next stay within the current card's group (projects vs. other resources) and respect filters
  const visibleCards = () => {
    const other = currentCard ? currentCard.hasAttribute('data-other-project') : false;
    return cards.filter((c) => !c.hidden && c.hasAttribute('data-other-project') === other);
  };

  function updateNav() {
    const list = visibleCards();
    const i = list.indexOf(currentCard);
    modalCount.textContent = i >= 0 ? `${i + 1} of ${list.length}` : '';
    const single = list.length < 2;
    prevBtn.disabled = single;
    nextBtn.disabled = single;
  }

  async function openProject(card, opts = {}) {
    const name = card.getAttribute('data-project');
    if (!name) return;
    const other = card.hasAttribute('data-other-project');
    const wasOpen = modal.classList.contains('active');
    if (!wasOpen) lastFocus = opts.returnFocus || document.activeElement;
    currentCard = card;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (page) page.inert = true;

    modalTitle.textContent = name;
    modalPicture.innerHTML = pictureHtml(card, 'modalImg');
    modalContent.innerHTML = '<div class="loading">Loading project details…</div>';
    modalBody.scrollTop = 0;
    updateNav();
    try { history.replaceState(null, '', '#' + card.getAttribute('data-slug')); } catch (e) { /* file:// etc. */ }
    if (!wasOpen || opts.focus !== false) closeBtn.focus({ preventScroll: true });

    try {
      const parsed = parseProject(await loadText(name, other));
      if (currentCard !== card) return; // user already moved on
      modalContent.innerHTML = render(parsed, card);
    } catch (err) {
      console.error('Error loading project:', err);
      modalContent.innerHTML = '<p class="error">Unable to load project details.</p>';
    }
  }

  function closeProject() {
    if (!modal.classList.contains('active')) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (page) page.inert = false;
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ }
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
    currentCard = null;
  }

  function step(dir) {
    const list = visibleCards();
    if (list.length < 2) return;
    const i = list.indexOf(currentCard);
    const next = list[(i + dir + list.length) % list.length];
    ensureInOpenGroup(next);
    openProject(next, { focus: false });
    modalBody.scrollTop = 0;
  }

  function ensureInOpenGroup(card) {
    const group = card.closest('details');
    if (group && !group.open) group.open = true;
  }

  document.addEventListener('click', (e) => {
    const opener = e.target.closest('.projectOpen');
    if (opener) {
      const card = opener.closest('[data-project-card]');
      if (card) openProject(card, { returnFocus: opener });
    }
  });
  modal.querySelectorAll('[data-modal-close]').forEach((el) => el.addEventListener('click', closeProject));
  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));

  // Keyboard: Esc closes (lightbox first, which handles its own Esc), Tab is trapped inside the dialog
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active') || (lightbox && lightbox.open)) return;
    if (e.key === 'Escape') { closeProject(); return; }
    if (e.key === 'ArrowRight' && !e.target.closest('input, textarea')) { step(1); return; }
    if (e.key === 'ArrowLeft' && !e.target.closest('input, textarea')) { step(-1); return; }
    if (e.key === 'Tab') {
      const f = Array.from(modal.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')).filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- lightbox (native <dialog>: focus trap + Esc come for free) ---------- */
  if (lightbox && zoomBtn) {
    zoomBtn.addEventListener('click', () => {
      if (!currentCard) return;
      lbPicture.innerHTML = pictureHtml(currentCard, 'lbImg');
      lightbox.showModal();
      lightbox.querySelector('.lbClose').focus();
    });
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.closest('.lbClose')) lightbox.close();
      else if (e.target.id === 'lbImg') lightbox.classList.toggle('actual'); // click diagram: fit <-> actual size
    });
    lightbox.addEventListener('close', () => {
      lightbox.classList.remove('actual');
      lbPicture.innerHTML = '';
      zoomBtn.focus({ preventScroll: true });
    });
  }

  /* ---------- search + filter chips ---------- */
  const input = document.querySelector('[data-project-filter]');
  const chips = Array.from(document.querySelectorAll('[data-filter]'));
  const statusEl = document.getElementById('filterStatus');
  const emptyEl = document.getElementById('filterEmpty');
  const moreGroup = document.getElementById('moreProjects');
  const moreCount = document.querySelector('[data-more-count]');
  const mainCards = cards.filter((c) => !c.hasAttribute('data-other-project'));
  const otherCards = cards.filter((c) => c.hasAttribute('data-other-project'));
  const otherSection = document.getElementById('otherProjects');
  let activeTag = '';

  function applyFilters() {
    const q = input ? input.value.trim().toLowerCase() : '';
    for (const card of cards) {
      const hay = (card.getAttribute('data-search') || '').toLowerCase();
      const tags = (card.getAttribute('data-tags') || '').split(/\s+/);
      const ok = (!q || hay.includes(q)) && (!activeTag || tags.includes(activeTag));
      card.hidden = !ok;
    }
    const shown = mainCards.filter((c) => !c.hidden).length;
    const shownOther = otherCards.filter((c) => !c.hidden).length;
    const filtering = Boolean(q || activeTag);

    if (statusEl) {
      statusEl.textContent = `Showing ${shown} of ${mainCards.length} projects` +
        (otherCards.length ? ` and ${shownOther} of ${otherCards.length} other resources` : '');
    }
    if (emptyEl) emptyEl.hidden = !(filtering && shown === 0 && shownOther === 0);
    if (moreGroup) {
      const inMore = mainCards.filter((c) => c.closest('#moreProjects') && !c.hidden).length;
      if (moreCount) moreCount.textContent = String(inMore);
      if (filtering && inMore > 0) moreGroup.open = true;
    }
    if (otherSection) otherSection.hidden = filtering && shownOther === 0;

    chips.forEach((chip) => chip.setAttribute('aria-pressed', String((chip.dataset.filter || '') === activeTag)));
    if (modal.classList.contains('active')) updateNav();
  }

  chips.forEach((chip) => chip.addEventListener('click', () => {
    const v = chip.dataset.filter || '';
    activeTag = activeTag === v ? '' : v;
    applyFilters();
  }));
  if (input) input.addEventListener('input', applyFilters);
  applyFilters();

  // Deep link: projects.html#<slug> opens that project
  const hash = decodeURIComponent((location.hash || '').slice(1));
  if (hash) {
    const card = cards.find((c) => c.getAttribute('data-slug') === hash);
    if (card) { ensureInOpenGroup(card); openProject(card, { returnFocus: card.querySelector('.projectOpen') }); }
  }
})();
