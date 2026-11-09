(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const page = document.body.dataset.page;
  const params = new URLSearchParams(location.search);
  const current = params.get('folder');

  /* ---------- hamburger menu ---------- */
  const burger = $('#burger'), drawer = $('#drawer'), scrim = $('#scrim');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    drawer.classList.toggle('open', open);
    drawer.toggleAttribute('inert', !open);
    scrim.hidden = !open;
    document.body.classList.toggle('no-scroll', open);
  }
  setMenu(false);
  burger.addEventListener('click', () => setMenu(!drawer.classList.contains('open')));
  scrim.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  document.querySelectorAll('[data-nav]').forEach(a => {
    if (a.dataset.nav === page) a.setAttribute('aria-current', 'page');
  });

  /* ---------- load folders from media/manifest.json ---------- */
  async function main() {
    let data;
    try {
      const res = await fetch('media/manifest.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      data = await res.json();
    } catch (err) {
      if (page === 'gallery') {
        $('#gallery').innerHTML = '<p class="notice">The gallery list could not be loaded. If you opened this file straight from your computer, run <code>python -m http.server</code> in the site folder and open <code>http://localhost:8000</code> instead.</p>';
      }
      return;
    }
    const wrap = $('#folderLinks');
    data.folders.forEach(f => {
      const a = document.createElement('a');
      a.href = 'gallery.html?folder=' + encodeURIComponent(f.slug);
      a.textContent = f.title;
      if (page === 'gallery' && f.slug === current) a.setAttribute('aria-current', 'page');
      wrap.appendChild(a);
    });
    if (page === 'gallery') initGallery(data);
  }

  /* ---------- gallery: slideshow + grid ---------- */
  function initGallery(data) {
    const root = $('#gallery');
    if (!current && data.folders.length) {
      location.replace('gallery.html?folder=' + encodeURIComponent(data.folders[0].slug));
      return;
    }
    const folder = data.folders.find(f => f.slug === current);
    if (!folder) {
      root.innerHTML = '<p class="notice">That folder was not found. Choose one from the menu.</p>';
      return;
    }
    document.title = folder.title + ' | Liam Benge';
    $('#galTitle').textContent = folder.title;
    const items = folder.items;
    $('#galCount').textContent = items.length === 1 ? '1 item' : items.length + ' items';

    if (!items.length) {
      $('#galViews').hidden = true;
      $('#galEmpty').hidden = false;
      $('#galEmptyPath').textContent = 'media/' + folder.slug + '/';
      return;
    }

    const stageMedia = $('#stageMedia'), counter = $('#counter');
    const thumbs = $('#thumbs'), grid = $('#grid');
    const btnSlides = $('#viewSlides'), btnGrid = $('#viewGrid');
    const slidesEl = $('#slides'), gridEl = $('#gridWrap');
    let index = 0;

    const thumbHTML = it => it.type === 'video'
      ? '<video src="' + it.src + '#t=0.5" preload="metadata" muted playsinline></video><span class="play" aria-hidden="true">&#9654;</span>'
      : '<img src="' + it.src + '" loading="lazy" alt="">';

    items.forEach((it, i) => {
      const label = folder.title + ', item ' + (i + 1) + (it.type === 'video' ? ' (video)' : '');
      const tile = document.createElement('button');
      tile.className = 'tile'; tile.setAttribute('aria-label', 'Open ' + label);
      tile.innerHTML = thumbHTML(it);
      tile.addEventListener('click', () => { setView('slides'); show(i); });
      grid.appendChild(tile);

      const th = document.createElement('button');
      th.className = 'thumb'; th.setAttribute('aria-label', 'Show ' + label);
      th.innerHTML = thumbHTML(it);
      th.addEventListener('click', () => show(i));
      thumbs.appendChild(th);
    });

    function show(i) {
      index = (i + items.length) % items.length;
      const it = items[index];
      stageMedia.innerHTML = '';
      let el;
      if (it.type === 'video') {
        el = document.createElement('video');
        el.controls = true; el.playsInline = true; el.preload = 'metadata';
        el.src = it.src;
      } else {
        el = document.createElement('img');
        el.alt = folder.title + ', photo ' + (index + 1) + ' of ' + items.length;
        el.src = it.src;
      }
      stageMedia.appendChild(el);
      counter.textContent = (index + 1) + ' / ' + items.length;
      [...thumbs.children].forEach((t, n) => {
        if (n === index) { t.setAttribute('aria-current', 'true'); t.scrollIntoView({ inline: 'center', block: 'nearest' }); }
        else t.removeAttribute('aria-current');
      });
      const next = items[(index + 1) % items.length];
      if (next.type === 'image') new Image().src = next.src;
    }

    function setView(v) {
      const slides = v === 'slides';
      slidesEl.hidden = !slides; gridEl.hidden = slides;
      btnSlides.setAttribute('aria-pressed', String(slides));
      btnGrid.setAttribute('aria-pressed', String(!slides));
      if (!slides) { const vid = stageMedia.querySelector('video'); if (vid) vid.pause(); }
      const url = new URL(location.href); url.searchParams.set('view', v);
      history.replaceState(null, '', url);
    }

    btnSlides.addEventListener('click', () => setView('slides'));
    btnGrid.addEventListener('click', () => setView('grid'));
    $('#prev').addEventListener('click', () => show(index - 1));
    $('#next').addEventListener('click', () => show(index + 1));
    $('#fs').addEventListener('click', () => {
      const s = $('#stage');
      if (document.fullscreenElement) document.exitFullscreen();
      else if (s.requestFullscreen) s.requestFullscreen();
    });
    document.addEventListener('keydown', e => {
      if (slidesEl.hidden || /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
    let x0 = null;
    const stage = $('#stage');
    stage.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    });

    show(0);
    setView(params.get('view') === 'grid' ? 'grid' : 'slides');
  }

  main();

  /* ---------- contact form (Formspree) ---------- */
  const form = $('#contactForm');
  if (form) {
    const status = $('#formStatus');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (form.action.includes('YOUR_FORM_ID')) {
        status.className = 'status err';
        status.textContent = 'The form is not connected yet. Please email me directly at the address above.';
        return;
      }
      status.className = 'status'; status.textContent = 'Sending...';
      try {
        const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
        if (res.ok) { form.reset(); status.className = 'status ok'; status.textContent = 'Message sent. Thanks, I will reply soon.'; }
        else throw new Error();
      } catch {
        status.className = 'status err';
        status.textContent = 'Message failed to send. Please email me directly instead.';
      }
    });
  }
})();
