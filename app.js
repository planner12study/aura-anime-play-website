/* AnimeKurd – main app logic. No backend: data lives in localStorage,
   with data/anime.json as the first-run fallback seed. */
(() => {
  'use strict';

  const KEY = 'animekurd.anime.v1';
  const $ = (s, r = document) => r.querySelector(s);
  let list = [];          // all anime entries
  let query = '';         // current search text
  let latestOnly = false; // "Latest" nav filter

  /* ---------- Storage ---------- */
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { toast('Storage full or blocked'); } };

  async function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { list = JSON.parse(raw); return; }
    } catch (e) { /* corrupted storage: fall through to seed */ }
    try { // JSON fallback: static seed file shipped with the site
      const res = await fetch('data/anime.json', { cache: 'no-cache' });
      list = res.ok ? await res.json() : [];
    } catch (e) { list = []; }
    save();
  }

  /* ---------- Helpers ---------- */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = u => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch (e) { return ''; } };
  const uid = () => 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  /* ---------- Render grid ---------- */
  function render() {
    const q = query.trim().toLowerCase();
    let items = list.filter(a => a.title.toLowerCase().includes(q));
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (latestOnly) items = items.slice(0, 12);
    $('#grid').innerHTML = items.map(a => {
      const poster = safeUrl(a.poster);
      return `<article class="card">
        <div class="poster">${poster ? `<img src="${esc(poster)}" alt="${esc(a.title)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}
          <span class="badge">S${esc(a.season)} · EP ${esc(a.episode)}</span></div>
        <div class="card-body">
          <h3>${esc(a.title)}</h3>
          <div class="meta">Season ${esc(a.season)}, Episode ${esc(a.episode)}</div>
          <button class="btn" data-play="${esc(a.id)}">Play / Watch</button>
        </div></article>`;
    }).join('');
    $('#empty').hidden = items.length > 0;
    $('#count').textContent = `${items.length} anime`;
  }

  /* ---------- Video player ---------- */
  // Turn a pasted URL into either a <video> source or an iframe embed URL.
  function resolveVideo(url) {
    const u = safeUrl(url);
    if (!u) return null;
    const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    if (yt) return { type: 'iframe', src: `https://www.youtube.com/embed/${yt[1]}?rel=0` };
    const dr = u.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
    if (dr) return { type: 'iframe', src: `https://drive.google.com/file/d/${dr[1]}/preview` };
    if (/\.(mp4|webm|ogg|m4v|mov)(\?|#|$)/i.test(u)) return { type: 'video', src: u };
    return { type: 'iframe', src: u }; // Vidmoly & other embed pages
  }

  function play(id) {
    const a = list.find(x => x.id === id); if (!a) return;
    const v = resolveVideo(a.video);
    const stage = $('#playerStage');
    $('#playerTitle').textContent = `${a.title} – S${a.season} EP${a.episode}`;
    if (!v) stage.innerHTML = '<div class="err">This video link is not valid. Edit it in Admin.</div>';
    else if (v.type === 'video') {
      stage.innerHTML = `<video controls autoplay playsinline preload="metadata" src="${esc(v.src)}"></video>`;
      $('video', stage).addEventListener('error', () => { stage.innerHTML = '<div class="err">Could not load this video. Check the link or try an embed URL.</div>'; });
    } else {
      stage.innerHTML = `<iframe src="${esc(v.src)}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen referrerpolicy="origin" loading="lazy" title="${esc(a.title)}"></iframe>`;
    }
    openModal('#playerModal');
  }

  function toggleFullscreen() {
    const stage = $('#playerStage');
    if (document.fullscreenElement) document.exitFullscreen();
    else if (stage.requestFullscreen) stage.requestFullscreen().catch(() => toast('Full screen not available'));
    else { const v = $('video', stage); if (v && v.webkitEnterFullscreen) v.webkitEnterFullscreen(); } // iOS Safari
  }

  /* ---------- Modals ---------- */
  function openModal(sel) { $(sel).hidden = false; document.body.style.overflow = 'hidden'; }
  function closeModals() {
    document.querySelectorAll('.modal').forEach(m => m.hidden = true);
    $('#playerStage').innerHTML = ''; // stops playback
    document.body.style.overflow = '';
  }

  /* ---------- Admin ---------- */
  function renderAdmin() {
    $('#adminList').innerHTML = list.map(a => `<li>
      <span class="t">${esc(a.title)} · S${esc(a.season)}E${esc(a.episode)}</span>
      <span class="row"><button class="btn ghost" data-edit="${esc(a.id)}">Edit</button>
      <button class="btn ghost danger" data-del="${esc(a.id)}">Delete</button></span></li>`).join('')
      || '<li>No entries yet.</li>';
  }
  function resetForm() {
    $('#animeForm').reset(); $('#f-id').value = ''; $('#saveBtn').textContent = 'Add anime';
  }
  function submitForm(e) {
    e.preventDefault();
    const video = safeUrl($('#f-video').value);
    if (!video) return toast('Enter a valid http(s) video URL');
    const poster = $('#f-poster').value.trim();
    if (poster && !safeUrl(poster)) return toast('Poster must be a valid http(s) URL');
    const data = {
      title: $('#f-title').value.trim(), season: +$('#f-season').value || 1,
      episode: +$('#f-episode').value || 1, poster, video
    };
    const id = $('#f-id').value;
    if (id) { Object.assign(list.find(a => a.id === id) || {}, data); toast('Saved changes'); }
    else { list.push({ id: uid(), createdAt: Date.now(), ...data }); toast('Anime added'); }
    save(); resetForm(); render(); renderAdmin();
  }
  function edit(id) {
    const a = list.find(x => x.id === id); if (!a) return;
    $('#f-id').value = a.id; $('#f-title').value = a.title; $('#f-season').value = a.season;
    $('#f-episode').value = a.episode; $('#f-poster').value = a.poster || ''; $('#f-video').value = a.video;
    $('#saveBtn').textContent = 'Save changes';
  }
  function exportJson() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'anime.json' });
    a.click(); URL.revokeObjectURL(url);
  }
  function importJson(file) {
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!Array.isArray(data)) throw 0;
        const clean = data.filter(a => a && a.title && safeUrl(a.video)).map(a => ({
          id: String(a.id || uid()), title: String(a.title), season: +a.season || 1, episode: +a.episode || 1,
          poster: safeUrl(a.poster), video: safeUrl(a.video), createdAt: +a.createdAt || Date.now()
        }));
        list = clean; save(); render(); renderAdmin(); toast(`Imported ${clean.length} entries`);
      } catch (e) { toast('Invalid JSON file'); }
    };
    r.readAsText(file);
  }

  /* ---------- Events ---------- */
  function bind() {
    $('#search').addEventListener('input', e => { query = e.target.value; render(); });
    $('#grid').addEventListener('click', e => { const b = e.target.closest('[data-play]'); if (b) play(b.dataset.play); });
    $('#openAdmin').addEventListener('click', () => { renderAdmin(); openModal('#adminModal'); });
    $('#animeForm').addEventListener('submit', submitForm);
    $('#resetBtn').addEventListener('click', resetForm);
    $('#adminList').addEventListener('click', e => {
      const ed = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]');
      if (ed) edit(ed.dataset.edit);
      if (del && confirm('Delete this anime?')) { list = list.filter(a => a.id !== del.dataset.del); save(); render(); renderAdmin(); }
    });
    $('#exportBtn').addEventListener('click', exportJson);
    $('#importFile').addEventListener('change', e => { if (e.target.files[0]) importJson(e.target.files[0]); e.target.value = ''; });
    $('#fsBtn').addEventListener('click', toggleFullscreen);
    document.addEventListener('click', e => { if (e.target.matches('[data-close]') || e.target.classList.contains('modal')) closeModals(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !document.fullscreenElement) closeModals(); });
    document.querySelectorAll('[data-nav]').forEach(a => a.addEventListener('click', () => {
      latestOnly = a.dataset.nav === 'latest';
      document.querySelectorAll('[data-nav]').forEach(n => n.classList.toggle('active', n === a));
      render();
    }));
  }

  /* ---------- PWA: install prompt + service worker ---------- */
  let deferred;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('#installBtn').hidden = false; });
  $('#installBtn').addEventListener('click', async () => {
    if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $('#installBtn').hidden = true;
  });
  window.addEventListener('appinstalled', () => toast('App installed'));
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));

  /* ---------- Start ---------- */
  (async () => {
    await load(); bind(); render();
    // Handle manifest shortcuts (?action=search|admin|latest)
    const act = new URLSearchParams(location.search).get('action');
    if (act === 'search') $('#search').focus();
    if (act === 'admin') $('#openAdmin').click();
    if (act === 'latest') document.querySelector('[data-nav="latest"]').click();
  })();
})();
