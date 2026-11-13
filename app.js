/* ROSS AI — lógica da interface.
   Estrutura: utilitários → estado e armazenamento → shell (barra, drawer) → telas (início, conversa, páginas)
   → provedores de resposta (demonstração e Modo IA) → inicialização.
   Para conectar um backend real, implemente um provedor com a mesma assinatura de `providers.demo.respond`. */
(function () {
  'use strict';

  /* ---------- Utilitários ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (s, vars) => String(s).replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] != null ? vars[k] : ''));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  const ICONS = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    clip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.5l-8.6 8.6a5 5 0 0 1-7.1-7.1l9.2-9.2a3.3 3.3 0 0 1 4.7 4.7l-9.2 9.2a1.7 1.7 0 0 1-2.4-2.4L16 8"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
    stop: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11v9H4v-9h3zm0 0l4.2-7.4A2 2 0 0 1 13 3a2 2 0 0 1 2 2v5h4.1a2 2 0 0 1 2 2.4l-1.3 6.5a2 2 0 0 1-2 1.6H7"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 13V4h3v9h-3zm0 0l-4.2 7.4A2 2 0 0 1 11 21a2 2 0 0 1-2-2v-5H4.9a2 2 0 0 1-2-2.4l1.3-6.5a2 2 0 0 1 2-1.6H17"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.4A8 8 0 1 1 21 12z"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5zM4 19a2 2 0 0 1 2-2h13"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9.5C7.5 20.5 4 17 4 12V6l8-3z"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>',
    help: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v4M12 17h.01"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5h.01"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>'
  };

  /* ---------- Estado e armazenamento ---------- */
  const STORAGE_KEY = 'rossai.state.v1';
  const DEFAULT_LANG = 'pt-BR';
  const state = {
    lang: DEFAULT_LANG,
    theme: 'system',
    country: 'BR',
    region: '',
    aiMode: false,
    mode: 'oficial',
    catalog: null,
    lawPending: null,
    conversations: [],
    feedback: {},
    sourcesReview: {},
    /* transitório */
    view: 'home',
    currentId: null,
    pending: [],
    draft: '',
    aiAvailable: false,
    aiLimits: null,
    hostTheme: null,
    busy: null
  };
  const PERSIST = ['lang', 'theme', 'country', 'region', 'aiMode', 'mode', 'conversations', 'feedback', 'sourcesReview', 'currentId'];

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      PERSIST.forEach((k) => { if (data[k] !== undefined) state[k] = data[k]; });
      if (data.mode === undefined && data.aiMode) state.mode = 'ai';
      if (!['oficial', 'demo', 'ai'].includes(state.mode)) state.mode = 'oficial';
      if (!window.ROSS_I18N[state.lang]) state.lang = DEFAULT_LANG;
    } catch (e) { /* armazenamento indisponível: segue sem histórico */ }
  }
  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        const data = {};
        PERSIST.forEach((k) => { data[k] = state[k]; });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) { /* sem persistência */ }
    }, 120);
  }

  /* ---------- Idioma ---------- */
  function T() { return window.ROSS_I18N[state.lang] || window.ROSS_I18N[DEFAULT_LANG]; }
  function t(path, vars) {
    const parts = path.split('.');
    let cur = T();
    for (const p of parts) { cur = cur && cur[p]; }
    if (cur === undefined) {
      cur = window.ROSS_I18N[DEFAULT_LANG];
      for (const p of parts) { cur = cur && cur[p]; }
    }
    if (typeof cur === 'string' && vars) return fmt(cur, vars);
    return cur === undefined ? path : cur;
  }
  function L(obj) { if (obj == null) return ''; if (typeof obj === 'string') return obj; return obj[state.lang] || obj[DEFAULT_LANG] || Object.values(obj)[0] || ''; }
  function fmtDate(iso, opts) {
    try {
      let d;
      if (typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso)) { const p = iso.split('-').map(Number); d = new Date(p[0], p[1] - 1, p[2]); }
      else d = new Date(iso);
      return new Intl.DateTimeFormat(state.lang, opts || { dateStyle: 'medium' }).format(d);
    } catch (e) { return String(iso); }
  }
  function fmtSize(bytes) {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  /* ---------- Jurisdição ---------- */
  const GEO = window.ROSS_GEO;
  function countryName(code) { const c = GEO.countries.find((x) => x.code === code); return c ? L(c.name) : code; }
  function regionsFor(code) { const c = GEO.countries.find((x) => x.code === code); return c && c.regions ? GEO.regions[c.regions] : null; }
  function regionName(country, region) { const list = regionsFor(country); if (!list || !region) return ''; const r = list.find((x) => x[0] === region); return r ? r[1] : region; }
  function jurisdictionLabel(country, region) { const rn = regionName(country, region); return countryName(country) + (rn ? ' · ' + rn : ''); }

  /* ---------- Conversas ---------- */
  function currentConv() { return state.conversations.find((c) => c.id === state.currentId) || null; }
  function newConversation(opts) {
    const conv = { id: uid(), title: '', createdAt: Date.now(), updatedAt: Date.now(), country: (opts && opts.country) || state.country, region: (opts && opts.region) || state.region, messages: [] };
    state.conversations.unshift(conv);
    state.currentId = conv.id;
    save();
    return conv;
  }
  function deleteConversation(id) {
    state.conversations = state.conversations.filter((c) => c.id !== id);
    if (state.currentId === id) { state.currentId = null; if (state.view === 'chat') state.view = 'home'; }
    save();
  }
  function touch(conv) { conv.updatedAt = Date.now(); state.conversations.sort((a, b) => b.updatedAt - a.updatedAt); save(); }

  /* ---------- Tema ---------- */
  function applyTheme() {
    const root = document.documentElement;
    if (state.theme === 'light' || state.theme === 'dark') root.setAttribute('data-theme', state.theme);
    else if (state.hostTheme) root.setAttribute('data-theme', state.hostTheme);
    else root.removeAttribute('data-theme');
  }

  /* ---------- Shell: barra superior e drawer ---------- */
  const PAGE_TOKENS = { privacy: 'privacidade', terms: 'termos', help: 'ajuda', sources: 'fontes', settings: 'configuracoes' };

  function brandHTML(cls) { return '<span class="brand ' + (cls || '') + '" aria-label="ROSS AI"><span>ROSS</span><span class="ai">AI</span></span>'; }

  function renderTopbar() {
    const bar = $('#topbar');
    const inChat = state.view === 'chat';
    const conv = currentConv();
    bar.innerHTML = '<div class="topbar-inner">' +
      '<button type="button" class="icon-btn" id="btn-menu" aria-label="' + esc(t('nav.menu')) + '" aria-controls="drawer" aria-expanded="false">' + ICONS.menu + '</button>' +
      '<a href="#" class="brand" id="brand-link"><span>ROSS</span><span class="ai">AI</span></a>' +
      '<span class="topbar-spacer"></span>' +
      (inChat && conv ? '<button type="button" class="chip" id="btn-jur" aria-expanded="false" title="' + esc(t('chat.jurisdiction')) + '">' + ICONS.pin + '<span>' + esc(jurisdictionLabel(conv.country, conv.region)) + '</span></button>' : '') +
      (state.view !== 'home' ? '<button type="button" class="icon-btn" id="btn-new" aria-label="' + esc(t('nav.newChat')) + '" title="' + esc(t('nav.newChat')) + '">' + ICONS.plus + '</button>' : '') +
      '</div>';
    $('#btn-menu').addEventListener('click', () => openDrawer(true));
    $('#brand-link').addEventListener('click', (e) => { e.preventDefault(); go('home'); });
    const bn = $('#btn-new'); if (bn) bn.addEventListener('click', () => go('home'));
    const bj = $('#btn-jur'); if (bj) bj.addEventListener('click', () => toggleJurPanel());
  }

  function renderDrawer() {
    const d = $('#drawer');
    const item = (view, icon, label) => '<button type="button" class="nav-item' + (state.view === view ? ' is-current' : '') + '" data-go="' + view + '">' + ICONS[icon] + '<span class="grow">' + esc(label) + '</span></button>';
    let convs = '';
    if (!state.conversations.length) convs = '<div class="empty-note">' + esc(t('nav.empty')) + '</div>';
    else convs = state.conversations.map((c) => '<div class="conv-row">' +
      '<button type="button" class="nav-item' + (state.view === 'chat' && c.id === state.currentId ? ' is-current' : '') + '" data-conv="' + c.id + '">' + ICONS.chat + '<span class="grow">' + esc(c.title || t('chat.untitled')) + '</span><span class="nav-date">' + esc(fmtDate(c.updatedAt, { day: '2-digit', month: '2-digit' })) + '</span></button>' +
      '<button type="button" class="icon-btn" data-del="' + c.id + '" aria-label="' + esc(t('nav.delete')) + '" title="' + esc(t('nav.delete')) + '">' + ICONS.trash + '</button>' +
      '</div>').join('');
    d.innerHTML = '<div class="drawer-head">' + brandHTML() + '<button type="button" class="icon-btn" id="btn-drawer-close" aria-label="' + esc(t('nav.close')) + '">' + ICONS.close + '</button></div>' +
      '<div class="drawer-body">' +
      '<button type="button" class="nav-item" data-go="home">' + ICONS.plus + '<span class="grow">' + esc(t('nav.newChat')) + '</span></button>' +
      '<div class="drawer-sec">' + esc(t('nav.history')) + '</div>' + convs +
      '<div class="drawer-sec">ROSS AI</div>' +
      item('sources', 'book', t('nav.sources')) + item('settings', 'gear', t('nav.settings')) + item('privacy', 'shield', t('nav.privacy')) + item('terms', 'doc', t('nav.terms')) + item('help', 'help', t('nav.help')) +
      '</div>' +
      '<div class="drawer-foot">' + esc(t('nav.demoTag')) + ' · ' + esc(t('tagline')) + '</div>';
    $('#btn-drawer-close').addEventListener('click', () => openDrawer(false));
    $$('[data-go]', d).forEach((b) => b.addEventListener('click', () => { openDrawer(false); go(b.dataset.go); }));
    $$('[data-conv]', d).forEach((b) => b.addEventListener('click', () => { openDrawer(false); openConversation(b.dataset.conv); }));
    $$('[data-del]', d).forEach((b) => b.addEventListener('click', () => confirmDeleteInline(b)));
  }

  function confirmDeleteInline(btn) {
    const row = btn.closest('.conv-row');
    if (row.nextElementSibling && row.nextElementSibling.classList.contains('inline-confirm')) { row.nextElementSibling.remove(); return; }
    const id = btn.dataset.del;
    const box = el('<div class="inline-confirm" role="alertdialog"><span>' + esc(t('chat.confirmDelete')) + '</span><div class="row"><button type="button" class="btn btn-danger btn-sm" data-yes>' + esc(t('chat.yesDelete')) + '</button><button type="button" class="btn btn-secondary btn-sm" data-no>' + esc(t('chat.cancel')) + '</button></div></div>');
    row.after(box);
    $('[data-no]', box).addEventListener('click', () => box.remove());
    $('[data-yes]', box).addEventListener('click', () => { deleteConversation(id); toast(t('chat.deleted')); render(); });
    $('[data-yes]', box).focus();
  }

  function openDrawer(open) {
    const d = $('#drawer'), s = $('#scrim'), b = $('#btn-menu');
    d.classList.toggle('is-open', open);
    d.setAttribute('aria-hidden', String(!open));
    s.hidden = !open;
    if (b) b.setAttribute('aria-expanded', String(open));
    if (open) { renderDrawer(); const first = $('.nav-item', d); if (first) first.focus(); }
    else if (b) b.focus();
  }

  /* ---------- Navegação ---------- */
  function go(view, opts) {
    if (view === 'home') { state.currentId = null; state.pending = []; }
    state.view = view;
    const token = PAGE_TOKENS[view];
    try { if (token) { if (location.hash !== '#' + token) history.replaceState(null, '', '#' + token); } else if (location.hash) history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignora */ }
    save();
    render();
    if (!(opts && opts.keepScroll)) window.scrollTo(0, 0);
  }
  function openConversation(id) {
    const conv = state.conversations.find((c) => c.id === id);
    if (!conv) return;
    state.currentId = id; state.view = 'chat'; state.pending = [];
    save(); render();
    scrollToEnd(true);
  }

  /* ---------- Composer ---------- */
  function composerHTML(mode) {
    const conv = currentConv();
    const country = mode === 'home' ? state.country : (conv ? conv.country : state.country);
    const region = mode === 'home' ? state.region : (conv ? conv.region : state.region);
    return '<form class="composer" id="composer" autocomplete="off">' +
      '<div class="attach-list" id="attach-list"></div>' +
      '<label class="sr-only" for="composer-input">' + esc(t('home.placeholder')) + '</label>' +
      '<textarea id="composer-input" rows="1" placeholder="' + esc(t('home.placeholder')) + '" enterkeyhint="send">' + esc(state.draft) + '</textarea>' +
      '<div class="composer-bar">' +
      '<div class="composer-left">' +
      '<button type="button" class="icon-btn" id="btn-attach" aria-label="' + esc(t('composer.attach')) + '" title="' + esc(t('composer.attach')) + '">' + ICONS.clip + '</button>' +
      (mode === 'home' ? jurisdictionSelectsHTML(country, region, 'home') : '') +
      '</div>' +
      '<div class="composer-right">' +
      '<button type="submit" class="send-btn" id="btn-send" aria-label="' + esc(t('composer.send')) + '" title="' + esc(t('composer.send')) + '" disabled>' + ICONS.send + '</button>' +
      '</div></div></form>';
  }
  function jurisdictionSelectsHTML(country, region, prefix) {
    const regions = regionsFor(country);
    return '<span class="select-wrap"><label class="sr-only" for="' + prefix + '-country">' + esc(t('composer.country')) + '</label><select id="' + prefix + '-country" data-role="country">' +
      GEO.countries.map((c) => '<option value="' + c.code + '"' + (c.code === country ? ' selected' : '') + '>' + esc(L(c.name)) + '</option>').join('') + '</select></span>' +
      (regions ? '<span class="select-wrap"><label class="sr-only" for="' + prefix + '-region">' + esc(t('composer.region')) + '</label><select id="' + prefix + '-region" data-role="region"><option value="">' + esc(t('composer.regionAll')) + '</option>' +
        regions.map((r) => '<option value="' + r[0] + '"' + (r[0] === region ? ' selected' : '') + '>' + esc(r[1]) + '</option>').join('') + '</select></span>' : '');
  }

  function bindComposer(mode) {
    const form = $('#composer'); if (!form) return;
    const ta = $('#composer-input');
    const send = $('#btn-send');
    const grow = () => { ta.style.height = 'auto'; ta.style.height = clamp(ta.scrollHeight, 48, window.innerHeight * 0.4) + 'px'; };
    const refresh = () => { send.disabled = !!state.busy || (!ta.value.trim() && !state.pending.length); };
    ta.addEventListener('input', () => { state.draft = ta.value; grow(); refresh(); });
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); state.draft = ta.value; refresh(); if (!send.disabled) form.requestSubmit(); } });
    form.addEventListener('submit', (e) => { e.preventDefault(); const text = ta.value.trim(); if (!text && !state.pending.length) return; submitMessage(text); });
    $('#btn-attach').addEventListener('click', () => pickFiles());
    $$('select[data-role]', form).forEach((s) => s.addEventListener('change', () => {
      if (s.dataset.role === 'country') { state.country = s.value; state.region = ''; }
      else state.region = s.value;
      save();
      const left = $('.composer-left', form);
      $$('.select-wrap', left).forEach((w) => w.remove());
      left.insertAdjacentHTML('beforeend', jurisdictionSelectsHTML(state.country, state.region, 'home'));
      $$('select[data-role]', form).forEach((n) => n.addEventListener('change', () => { if (n.dataset.role === 'country') { state.country = n.value; state.region = ''; } else state.region = n.value; save(); bindComposer(mode); }));
    }));
    renderAttachList();
    grow(); refresh();
    form._refresh = refresh;
  }
  function renderAttachList() {
    const list = $('#attach-list'); if (!list) return;
    list.innerHTML = state.pending.map((f) => '<span class="file-chip" title="' + esc(f.name) + '">' + '<span class="name">' + esc(f.name) + '</span><span class="size">' + esc(fmtSize(f.size)) + '</span>' +
      '<button type="button" data-rm="' + f.id + '" aria-label="' + esc(t('composer.remove')) + ': ' + esc(f.name) + '">' + ICONS.close + '</button></span>').join('');
    $$('[data-rm]', list).forEach((b) => b.addEventListener('click', () => { state.pending = state.pending.filter((x) => x.id !== b.dataset.rm); renderAttachList(); const f = $('#composer'); if (f && f._refresh) f._refresh(); }));
    const f = $('#composer'); if (f && f._refresh) f._refresh();
  }

  /* ---------- Anexos ---------- */
  const MAX_FILE = 20 * 1024 * 1024;
  const OK_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  function pickFiles() { const inp = $('#file-input'); inp.value = ''; inp.click(); }
  function onFilesChosen(files) {
    const ok = [], skipped = [];
    Array.from(files).forEach((f) => {
      const type = f.type || (f.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : '');
      if (f.size > MAX_FILE) skipped.push(f.name + ': ' + t('attachModal.tooLarge'));
      else if (!OK_TYPES.includes(type)) skipped.push(f.name + ': ' + t('attachModal.badType'));
      else ok.push({ id: uid(), name: f.name, size: f.size, type: type, file: f });
    });
    if (!ok.length && !skipped.length) return;
    showAttachModal(ok, skipped);
  }
  function showAttachModal(ok, skipped) {
    const root = $('#modal-root');
    const chips = ok.map((f) => '<span class="file-chip"><span class="name">' + esc(f.name) + '</span><span class="size">' + esc(fmtSize(f.size)) + '</span></span>').join('');
    root.innerHTML = '<div class="modal-scrim" id="modal-scrim"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
      '<h2 id="modal-title">' + esc(t('attachModal.title')) + '</h2>' +
      '<p>' + esc(t('attachModal.body')) + '</p>' +
      (ok.length ? '<div class="files">' + chips + '</div>' : '') +
      '<p>' + esc(effectiveMode() !== 'demo' && state.aiAvailable ? t('attachModal.aiLine') : t('attachModal.demoLine')) + '</p>' +
      (skipped.length ? '<div class="callout callout-warn">' + ICONS.warn + '<div><b>' + esc(t('attachModal.skipped')) + '</b><ul>' + skipped.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ul></div></div>' : '') +
      '<div class="row"><button type="button" class="btn btn-secondary" id="modal-cancel">' + esc(t('attachModal.cancel')) + '</button>' + (ok.length ? '<button type="button" class="btn" id="modal-ok">' + esc(t('attachModal.confirm')) + '</button>' : '') + '</div>' +
      '</div></div>';
    const close = () => { root.innerHTML = ''; const ta = $('#composer-input'); if (ta) ta.focus(); };
    $('#modal-cancel').addEventListener('click', close);
    $('#modal-scrim').addEventListener('click', (e) => { if (e.target.id === 'modal-scrim') close(); });
    const okBtn = $('#modal-ok');
    if (okBtn) { okBtn.addEventListener('click', () => { state.pending = state.pending.concat(ok); close(); renderAttachList(); }); okBtn.focus(); }
    else $('#modal-cancel').focus();
    document.addEventListener('keydown', function onKey(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } });
  }

  /* ---------- Toast ---------- */
  function toast(msg) {
    const root = $('#toast-root');
    const n = el('<div class="toast" role="status">' + esc(msg) + '</div>');
    root.appendChild(n);
    setTimeout(() => { n.style.opacity = '0'; n.style.transition = 'opacity .25s'; setTimeout(() => n.remove(), 260); }, 2400);
  }

  /* ---------- Tela inicial ---------- */
  function renderHome(main) {
    const ex = t('home.examples');
    main.innerHTML = '<section class="home"><div class="container">' +
      '<div class="hero">' + brandHTML('brand-lg') + '<h1>' + esc(t('home.headline')) + '</h1><p class="tagline">' + esc(t('tagline')) + '</p></div>' +
      composerHTML('home') +
      '<div><div class="examples-label">' + esc(t('home.examplesLabel')) + '</div><div class="examples">' +
      ex.map((e) => '<button type="button" class="example" data-example="' + esc(e.label) + '">' + ICONS.arrow + '<span>' + esc(e.label) + '</span></button>').join('') +
      '</div></div>' +
      '<div class="home-foot">' +
      '<span class="demo-notice' + (effectiveMode() === 'oficial' ? ' is-oficial' : '') + '">' + ICONS.info + '<span>' + esc(homeNotice()) + '</span></span>' +
      '<p>' + esc(t('home.footnote')) + '</p>' +
      '<div class="links"><a href="#privacidade" data-go="privacy">' + esc(t('nav.privacy')) + '</a><a href="#termos" data-go="terms">' + esc(t('nav.terms')) + '</a><a href="#ajuda" data-go="help">' + esc(t('nav.help')) + '</a></div>' +
      '</div></div></section>';
    bindComposer('home');
    $$('[data-example]', main).forEach((b) => b.addEventListener('click', () => submitMessage(b.dataset.example)));
    $$('a[data-go]', main).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); go(a.dataset.go); }));
  }

  /* ---------- Conversa ---------- */
  function renderChat(main) {
    const conv = currentConv();
    if (!conv) { state.view = 'home'; renderHome(main); return; }
    main.innerHTML = '<section class="chat"><div class="chat-scroll"><div class="container"><div id="jur-slot"></div><div class="messages" id="messages"></div></div></div>' +
      '<div class="chat-composer"><div class="container">' + composerHTML('chat') + '<p class="composer-hint">' + esc(t('composer.disclaimer')) + '</p></div></div></section>';
    const list = $('#messages');
    conv.messages.forEach((m) => list.appendChild(renderMessage(m, conv)));
    bindComposer('chat');
  }
  function scrollToEnd(instant) {
    requestAnimationFrame(() => { window.scrollTo({ top: document.documentElement.scrollHeight, behavior: instant ? 'auto' : 'smooth' }); });
  }
  function toggleJurPanel() {
    const slot = $('#jur-slot'); const conv = currentConv(); if (!slot || !conv) return;
    const btn = $('#btn-jur');
    if (slot.innerHTML) { slot.innerHTML = ''; if (btn) btn.setAttribute('aria-expanded', 'false'); return; }
    slot.innerHTML = '<div class="jur-panel"><span class="label">' + esc(t('chat.jurisdiction')) + '</span>' + jurisdictionSelectsHTML(conv.country, conv.region, 'chat') + '<button type="button" class="btn btn-sm" id="jur-apply">' + esc(t('chat.apply')) + '</button></div>';
    if (btn) btn.setAttribute('aria-expanded', 'true');
    const rebind = () => {
      $$('select[data-role]', slot).forEach((s) => s.addEventListener('change', () => {
        const c = $('#chat-country').value; const r = $('#chat-region') ? $('#chat-region').value : '';
        const nc = s.dataset.role === 'country' ? s.value : c; const nr = s.dataset.role === 'country' ? '' : r;
        const panel = $('.jur-panel', slot); $$('.select-wrap', panel).forEach((w) => w.remove());
        $('#jur-apply', panel).insertAdjacentHTML('beforebegin', jurisdictionSelectsHTML(nc, nr, 'chat')); rebind();
      }));
      $('#jur-apply', slot).onclick = () => {
        const c = $('#chat-country').value; const r = $('#chat-region') ? $('#chat-region').value : '';
        if (c !== conv.country || r !== conv.region) {
          conv.country = c; conv.region = r; state.country = c; state.region = r;
          conv.messages.push({ id: uid(), role: 'system', text: t('chat.jurisdictionChanged', { j: jurisdictionLabel(c, r) }), createdAt: Date.now() });
          touch(conv);
        }
        slot.innerHTML = ''; renderTopbar(); render({ keep: true }); scrollToEnd();
      };
    };
    rebind();
  }

  function renderMessage(m, conv) {
    if (m.role === 'system') return el('<div class="divider-note">' + esc(m.text) + '</div>');
    if (m.role === 'user') {
      return el('<article class="msg msg-user" data-id="' + m.id + '">' +
        (m.attachments && m.attachments.length ? '<div class="files">' + m.attachments.map((f) => '<span class="file-chip">' + ICONS.doc.replace('<svg', '<svg width="13" height="13"') + '<span class="name">' + esc(f.name) + '</span></span>').join('') + '</div>' : '') +
        (m.text ? '<div class="bubble">' + esc(m.text) + '</div>' : '') +
        '</article>');
    }
    const node = el('<article class="msg msg-assistant" data-id="' + m.id + '"><header class="msg-head"><span class="msg-author">ROSS <span class="ai">AI</span></span>' +
      (m.status === 'done' ? modeBadge(m.provider) : '') +
      '<span class="msg-time">' + esc(fmtDate(m.createdAt, { hour: '2-digit', minute: '2-digit' })) + '</span></header><div class="answer"></div></article>');
    const body = $('.answer', node);
    if (m.status === 'loading') body.innerHTML = loadingHTML(m.provider, m.step || 0);
    else if (m.status === 'error') body.innerHTML = errorHTML(m);
    else body.innerHTML = answerHTML(m.answer, m);
    bindMessageActions(node, m, conv);
    return node;
  }
  function loadingHTML(provider, step) {
    const steps = t('loading.' + (provider === 'ai' ? 'ai' : provider === 'oficial' ? 'oficial' : 'demo'));
    return '<ul class="steps" aria-live="polite">' + steps.map((s, i) => '<li class="' + (i < step ? 'is-done' : i === step ? 'is-active' : '') + '"><span class="dot"></span><span>' + esc(s) + (provider === 'demo' ? ' <span class="badge badge-fict">' + esc(t('chat.modeDemo').toLowerCase()) + '</span>' : '') + '</span></li>').join('') + '</ul>' +
      '<div class="skeleton" aria-hidden="true"><span></span><span></span><span></span></div>';
  }
  function errorHTML(m) {
    return '<div class="error-card" role="alert"><h4>' + esc(t('errors.title')) + '</h4><p>' + esc(m.error || t('errors.generic')) + '</p><div class="row"><button type="button" class="btn btn-secondary btn-sm" data-retry>' + esc(t('chat.retry')) + '</button></div></div>';
  }

  /* ---------- Renderização da resposta ---------- */
  const SOURCES = window.ROSS_DEMO.sources;
  function sourceById(id) { return SOURCES.find((s) => s.id === id); }
  function statusBadge(status) { return '<span class="badge badge-' + esc(status) + '">' + esc(t('status.' + status)) + '</span>'; }
  function list(items, cls) { return '<ul class="' + (cls || '') + '">' + items.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>'; }
  function section(title, inner, cls) { return inner ? '<section class="ans-sec ' + (cls || '') + '"><h3>' + esc(title) + '</h3>' + inner + '</section>' : ''; }
  function callout(kind, html) { return '<div class="callout callout-' + kind + '">' + (kind === 'danger' ? ICONS.alert : kind === 'warn' ? ICONS.warn : ICONS.info) + '<div>' + html + '</div></div>'; }

  function answerHTML(a, m) {
    if (!a) return '';
    const isAI = a.mode === 'ai', isOficial = a.mode === 'oficial';
    let h = '';
    h += '<div class="mode-banner">' + ICONS.info + '<span>' + esc(isAI ? t('chat.aiBanner') : isOficial ? t('chat.oficialBanner', { date: a.capturedAt ? fmtDate(a.capturedAt) : '' }) : t('chat.demoBanner')) + '</span></div>';
    if (a.kind === 'urgent') h += callout('danger', '<b>' + esc(t('sections.urgent')) + '</b><br>' + esc(a.summary));
    if (a.document) h += documentHTML(a.document, m);
    if (a.kind !== 'urgent' && a.summary) h += section(t('sections.summary'), '<p>' + esc(a.summary) + '</p>', 'summary');
    if (a.questions && a.questions.length) h += section(t('sections.questions'), list(a.questions));
    if (a.quickReplies && a.quickReplies.length) h += '<div class="quick">' + a.quickReplies.map((q, i) => '<button type="button" class="btn btn-secondary btn-sm" data-quick="' + i + '">' + esc(q.label) + '</button>').join('') + '</div>';
    if (a.sourcesSay && a.sourcesSay.length) h += section(t('sections.sourcesSay'), '<ul class="say-list">' + a.sourcesSay.map((s) => '<li><strong>' + esc(s.title) + '</strong>' + esc(s.text) + (s.ref ? '<a class="ref" href="#src-' + m.id + '-' + s.ref + '" aria-label="' + esc(t('sections.sources')) + ' ' + s.ref + '">' + s.ref + '</a>' : '') + '</li>').join('') + '</ul>');
    if (a.checklist && a.checklist.length) h += section(t('sections.checklist'), list(a.checklist, 'check-list'));
    if (a.options && a.options.length) h += section(t('sections.options'), '<ul class="opt-grid">' + a.options.map((o) => '<li><strong>' + esc(o.title) + '</strong><p>' + esc(o.text) + '</p></li>').join('') + '</ul>');
    if (a.canDo && a.canDo.length) h += section(t('sections.canDo'), list(a.canDo));
    if (a.depends && a.depends.length) h += section(t('sections.depends'), list(a.depends));
    if (a.sources && a.sources.length) h += section(isAI ? t('sections.sourcesAI') : t('sections.sources'), '<ol class="src-list">' + a.sources.map((s, i) => sourceCardHTML(s, i + 1, m, isAI)).join('') + '</ol>');
    else if (a.kind === 'answer' || a.kind === 'document') h += section(t('sections.sources'), '<p class="muted">' + esc(t('sections.noSources')) + '</p>');
    if (a.nextSteps && a.nextSteps.length) h += section(t('sections.next'), '<ol>' + a.nextSteps.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol>');
    if (a.limitNotice) h += callout('neutral', '<b>' + esc(t('sections.limit')) + '</b><br>' + esc(a.limitNotice.text) + (a.limitNotice.referrals && a.limitNotice.referrals.length ? list(a.limitNotice.referrals) : ''));
    if (a.warnings && a.warnings.length) h += a.warnings.map((w) => callout('warn', esc(w))).join('');
    h += '<div class="msg-actions">' +
      '<button type="button" class="icon-btn" data-copy aria-label="' + esc(t('chat.copy')) + '" title="' + esc(t('chat.copy')) + '">' + ICONS.copy + '</button>' +
      '<button type="button" class="icon-btn' + (state.feedback[m.id] === 'up' ? ' is-active' : '') + '" data-fb="up" aria-pressed="' + (state.feedback[m.id] === 'up') + '" aria-label="' + esc(t('chat.helpful')) + '" title="' + esc(t('chat.helpful')) + '">' + ICONS.up + '</button>' +
      '<button type="button" class="icon-btn' + (state.feedback[m.id] === 'down' ? ' is-active' : '') + '" data-fb="down" aria-pressed="' + (state.feedback[m.id] === 'down') + '" aria-label="' + esc(t('chat.notHelpful')) + '" title="' + esc(t('chat.notHelpful')) + '">' + ICONS.down + '</button>' +
      '<button type="button" class="icon-btn" data-attach aria-label="' + esc(t('composer.attachAnother')) + '" title="' + esc(t('composer.attachAnother')) + '">' + ICONS.clip + '</button>' +
      (state.feedback[m.id] ? '<span class="thanks">' + esc(t('chat.thanks')) + '</span>' : '') +
      '</div>';
    return h;
  }
  function sourceCardHTML(s, n, m, isAI) {
    if (s.lawId) return lawCardHTML(s, n, m);
    const src = s.id ? sourceById(s.id) : null;
    const name = src ? L(src.name) : (s.name || '');
    const status = isAI ? 'unverified' : (s.status || (src ? src.status : 'nao_confirmada'));
    const ver = src && s.version ? src.versions.find((v) => v.id === s.version) : null;
    let meta = '';
    if (s.article) meta += '<span><b>' + esc(t('source.article')) + ':</b> ' + esc(s.article) + '</span>';
    if (src) meta += '<span><b>' + esc(t('source.jurisdiction')) + ':</b> ' + esc(L(src.jurisdiction)) + '</span>';
    if (ver) meta += '<span><b>' + esc(t('source.version')) + ':</b> ' + esc(ver.id + ' · ' + fmtDate(ver.date)) + '</span>';
    if (src) meta += '<span><b>' + esc(t('source.verified')) + ':</b> ' + esc(fmtDate(src.verifiedAt)) + '</span>';
    let link = '';
    if (src) link = '<div class="src-link"><span>' + esc(t('source.link')) + ':</span><span class="mono">' + esc(src.url) + '</span><span class="badge badge-fict">' + esc(t('source.fictional')) + '</span></div>';
    else if (isAI) link = '<div class="src-link"><span>' + esc(t('source.noLink')) + '</span></div>';
    return '<li class="src-card" id="src-' + m.id + '-' + n + '"><div class="src-name"><span>' + esc(name) + '</span>' + statusBadge(status) + (src ? '<span class="badge badge-fict">' + esc(t('source.fictional')) + '</span>' : '') + '</div>' +
      (meta ? '<div class="src-meta">' + meta + '</div>' : '') + link + '</li>';
  }
  function documentHTML(d, m) {
    const name = d.name || (m.docName || '');
    return '<div class="doc-block"><div class="doc-head">' + ICONS.doc + '<span class="name">' + esc(name) + '</span></div><div class="doc-body">' +
      (d.notes && d.notes.length ? '<ul class="doc-notes">' + d.notes.map((n) => '<li>' + esc(n) + '</li>').join('') + '</ul>' : '') +
      (d.excerpts || []).map((x) => '<div class="excerpt"><div class="excerpt-ref">' + esc(x.ref) + '</div>' + (x.quote ? '<blockquote>' + esc(x.quote) + '</blockquote>' : '') +
        '<div class="two-col"><div class="doc"><h4>' + esc(t('sections.inDocument')) + '</h4><p>' + esc(x.inDocument) + '</p></div><div class="law"><h4>' + esc(t('sections.inLaw')) + '</h4><p>' + esc(x.inLaw) + '</p></div></div></div>').join('') +
      (d.warnings && d.warnings.length ? d.warnings.map((w) => callout('warn', esc(w))).join('') : '') +
      '</div></div>';
  }

  function bindMessageActions(node, m, conv) {
    const copyBtn = $('[data-copy]', node);
    if (copyBtn) copyBtn.addEventListener('click', () => copyAnswer(m));
    $$('[data-fb]', node).forEach((b) => b.addEventListener('click', () => {
      state.feedback[m.id] = state.feedback[m.id] === b.dataset.fb ? undefined : b.dataset.fb;
      if (!state.feedback[m.id]) delete state.feedback[m.id];
      save();
      node.replaceWith(renderMessage(m, conv));
      if (state.feedback[m.id]) toast(t('chat.thanks'));
    }));
    const att = $('[data-attach]', node); if (att) att.addEventListener('click', () => pickFiles());
    const retry = $('[data-retry]', node); if (retry) retry.addEventListener('click', () => retryMessage(m, conv));
    $$('[data-quick]', node).forEach((b) => b.addEventListener('click', () => {
      const q = m.answer.quickReplies[Number(b.dataset.quick)];
      if (q.action === 'attach') pickFiles(); else if (q.send) submitMessage(q.send);
    }));
    $$('a.ref', node).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); const target = document.getElementById(a.getAttribute('href').slice(1)); if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); target.style.outline = '2px solid var(--accent)'; setTimeout(() => { target.style.outline = ''; }, 1400); } }));
  }

  function answerToText(a, m) {
    const lines = [];
    const push = (title, items) => { if (!items || !items.length) return; lines.push('', title.toUpperCase()); items.forEach((x) => lines.push('- ' + x)); };
    lines.push('ROSS AI · ' + (a.mode === 'ai' ? t('chat.modeAI') : a.mode === 'oficial' ? t('chat.modeOficial') : t('chat.modeDemo')));
    lines.push(a.mode === 'ai' ? t('chat.aiBanner') : a.mode === 'oficial' ? t('chat.oficialBanner', { date: a.capturedAt ? fmtDate(a.capturedAt) : '' }) : t('chat.demoBanner'));
    if (a.document) {
      lines.push('', t('sections.document').toUpperCase() + ': ' + (a.document.name || m.docName || ''));
      (a.document.notes || []).forEach((n) => lines.push('- ' + n));
      (a.document.excerpts || []).forEach((x) => { lines.push('', x.ref, x.quote ? '"' + x.quote + '"' : '', t('sections.inDocument') + ': ' + x.inDocument, t('sections.inLaw') + ': ' + x.inLaw); });
      (a.document.warnings || []).forEach((w) => lines.push(t('sections.attention') + ': ' + w));
    }
    if (a.summary) lines.push('', t('sections.summary').toUpperCase(), a.summary);
    push(t('sections.questions'), a.questions);
    if (a.sourcesSay && a.sourcesSay.length) { lines.push('', t('sections.sourcesSay').toUpperCase()); a.sourcesSay.forEach((s) => lines.push('- ' + s.title + ': ' + s.text + (s.ref ? ' [' + s.ref + ']' : ''))); }
    push(t('sections.checklist'), a.checklist);
    if (a.options && a.options.length) { lines.push('', t('sections.options').toUpperCase()); a.options.forEach((o) => lines.push('- ' + o.title + ': ' + o.text)); }
    push(t('sections.canDo'), a.canDo);
    push(t('sections.depends'), a.depends);
    if (a.sources && a.sources.length) {
      lines.push('', (a.mode === 'ai' ? t('sections.sourcesAI') : t('sections.sources')).toUpperCase());
      a.sources.forEach((s, i) => {
        if (s.lawId) { lines.push('[' + (i + 1) + '] ' + s.name + ' · ' + s.article + ' · ' + t('status.' + s.status) + ' · ' + s.url + ' · ' + t('source.captured') + ' ' + fmtDate(s.retrievedAt)); return; }
        const src = s.id ? sourceById(s.id) : null; lines.push('[' + (i + 1) + '] ' + (src ? L(src.name) : s.name) + (s.article ? ' · ' + s.article : '') + ' · ' + t('status.' + (a.mode === 'ai' ? 'unverified' : s.status)) + (src ? ' · ' + src.url + ' (' + t('source.fictional') + ')' : ''));
      });
    }
    if (a.nextSteps && a.nextSteps.length) { lines.push('', t('sections.next').toUpperCase()); a.nextSteps.forEach((x, i) => lines.push((i + 1) + '. ' + x)); }
    if (a.limitNotice) { lines.push('', t('sections.limit').toUpperCase(), a.limitNotice.text); (a.limitNotice.referrals || []).forEach((r) => lines.push('- ' + r)); }
    (a.warnings || []).forEach((w) => lines.push('', t('sections.attention') + ': ' + w));
    lines.push('', t('composer.disclaimer'));
    return lines.join('\n');
  }
  function copyAnswer(m) {
    const text = answerToText(m.answer, m);
    const fallback = () => {
      try {
        const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
        const ok = document.execCommand && document.execCommand('copy'); document.body.removeChild(ta);
        toast(ok ? t('chat.copied') : t('chat.copyFailed'));
      } catch (e) { toast(t('chat.copyFailed')); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast(t('chat.copied')), fallback);
    else fallback();
  }

  /* ---------- Provedores de resposta ----------
     Assinatura comum: respond({ text, attachments, conv, lang, onStep, signal }) → Promise<answer>
     `answer` segue o formato normalizado usado por answerHTML. */
  const providers = {};

  /* Demonstração: classifica a pergunta por palavras-chave e devolve respostas roteirizadas com fontes fictícias. */
  const RX = {
    error: /simular erro|simulate error/i,
    urgentHard: /urgente|urg[êe]ncia|emerg[êe]nc|pris[ãa]o|\bpres[oa]\b|despej|viol[êe]nc|agred|agress|amea[çc]|urgent|emergency|evict|arrest|violence|threat|assault/i,
    urgentSoft: /\bhoje\b|amanh[ãa]|today|tomorrow|tonight/i,
    deadline: /prazo|notifica|intima|deadline|notice|summons|hearing|audi[êe]ncia/i,
    limit: /vou ganhar|vou perder|chances? de|ganhar a (a[çc][ãa]o|causa)|vale a pena processar|devo processar|estrat[ée]gia|definitivamente|com certeza (ganho|vou)|garant(e|ia|ido) que|[ée] nula\??$|will i win|chances of|should i sue|strategy|guarantee|definitely (valid|invalid|win)/i,
    clause: /cl[áa]usula|clausula|contrato|multa|rescis|cancelamento|fidelidade|clause|contract|penalty|termination|cancellation|cancel/i,
    clauseSpecific: /cl[áa]usula\s*9|multa|mensalidade|penalty|monthly fee|3 \(tr[eê]s\)|3 \(three\)/i,
    law: /\blei\b|\bleis\b|artigo|norma|decreto|portaria|arrependimento|compras? a dist|\blaw\b|statute|article|cooling|distance (purchase|sale)|withdraw/i,
    lawSpecific: /0\.002|arrependimento|dist[âa]ncia|distance|withdraw|cooling/i,
    gather: /informa[çc][õo]es|reunir|juntar|documentos (preciso|necess)|preciso (levar|ter|juntar)|lista|what (information|documents)|gather|collect|checklist/i,
    gatherSpecific: /defeito|troca|produto|loja|garantia|defective|exchange|store|product|warranty|refund/i,
    help: /onde (posso|procuro|procurar|buscar|encontro)|quem pode me ajudar|ajuda|defensoria|sindicato|procon|where can i|who can help|\bhelp\b|assistance/i,
    helpSpecific: /verbas|rescis[óo]ria|trabalh|demiss|demitid|sal[áa]rio|severance|wages|dismiss|fired|employer|labou?r/i,
    docIllegible: /ilegivel|ileg[íi]vel|illegible|blurry|borrad|desfocad/i,
    docIncomplete: /incomplet|parcial|partial|pagina|p[áa]gina|page/i
  };
  function classify(text, attachments, conv) {
    const q = (text || '').trim();
    if (RX.error.test(q)) return { key: 'error' };
    if (attachments && attachments.length) {
      const names = attachments.map((f) => f.name).join(' ');
      if (RX.docIllegible.test(names)) return { key: 'document_illegible' };
      if (RX.docIncomplete.test(names)) return { key: 'document_incomplete' };
      return { key: 'document_ok' };
    }
    if (RX.urgentHard.test(q) || (RX.urgentSoft.test(q) && RX.deadline.test(q))) return { key: 'urgent' };
    if (RX.limit.test(q)) return { key: 'limit' };
    if (conv.country !== 'BR') return { key: 'nosources_jurisdiction' };
    if (RX.clause.test(q)) return { key: RX.clauseSpecific.test(q) ? 'answer_clause' : 'clarify_clause' };
    if (RX.law.test(q)) return { key: RX.lawSpecific.test(q) ? 'answer_law' : 'clarify_law' };
    if (RX.gather.test(q)) return { key: RX.gatherSpecific.test(q) ? 'answer_gather' : 'clarify_gather' };
    if (RX.help.test(q)) return { key: RX.helpSpecific.test(q) ? 'answer_help' : 'clarify_help' };
    if (q.split(/\s+/).length < 4) return { key: 'tooShort' };
    return { key: 'nosources' };
  }
  providers.demo = {
    id: 'demo',
    async respond({ text, attachments, conv, onStep, signal }) {
      const bank = window.ROSS_DEMO.answers[state.lang] || window.ROSS_DEMO.answers[DEFAULT_LANG];
      const { key } = classify(text, attachments, conv);
      const delays = [500, 650, 450];
      for (let i = 0; i < delays.length; i++) { onStep(i); await sleep(delays[i]); if (signal && signal.aborted) throw { code: 'cancelled' }; }
      if (key === 'error') throw { code: 'demo_error', message: t('errors.generic') };
      let a;
      if (key === 'tooShort') a = { kind: 'clarify', summary: bank.systemHint.tooShort, questions: bank.nosources.questions.slice(0, 2) };
      else a = JSON.parse(JSON.stringify(bank[key]));
      a.mode = 'demo';
      if (a.summary) a.summary = fmt(a.summary, { country: countryName(conv.country) });
      if (a.document) a.document.name = attachments && attachments.length ? attachments.map((f) => f.name).join(', ') : a.document.name;
      return a;
    }
  };

  /* Modo IA: usa a capacidade `sample` do visualizador. Sem acesso a fontes oficiais; tudo marcado como não verificado. */
  let sampleFn = null;
  async function probeAI() {
    try {
      if (!window.claude || typeof window.claude.use !== 'function') return;
      const s = await window.claude.use('sample');
      if (!s) return;
      sampleFn = s; state.aiAvailable = true;
      try { state.aiLimits = await s.limits(); } catch (e) { state.aiLimits = null; }
      if (state.view === 'settings') render({ keep: true });
    } catch (e) { /* indisponível */ }
  }
  function aiInstructions(conv) {
    const langName = t('langName');
    const today = fmtDate(Date.now());
    return [
      'You are ROSS AI, a legal information assistant. You help people understand laws, contracts and legal documents in plain language. You are not a lawyer and this is not legal advice.',
      'Write in ' + langName + '. Be clear, respectful and not overly formal. Use short sentences.',
      'IMPORTANT: In this version you have NO access to legal databases, official texts or the web. Therefore: never invent article numbers, deadlines, court decisions, quotations or links. Mention a law by name only when you are confident it exists; otherwise describe the rule in general terms. Every source you mention is unverified: set its status to "unverified" and give no URL. Say clearly when something depends on facts, documents or professional interpretation. Distinguish legislation in force, historical text, bills and unconfirmed information when relevant.',
      'Never state that someone will win or lose, that a clause is definitely valid or invalid, or that a lawsuit certainly applies. Never promise outcomes.',
      'If the question is ambiguous or lacks essential facts, use kind "clarify" and ask at most three objective questions. If the person asks for a high-impact personalised assessment, a litigation strategy or a definitive conclusion, use kind "limit", explain the limit briefly and refer them to a lawyer, public defender, union, consumer protection body or the relevant public service. If the situation seems urgent (imminent deadline, eviction, arrest, violence, risk), use kind "urgent" and tell them to seek professional help or the competent authority without delay.',
      'If images of a document are attached: identify the clause or excerpt you explain (reference and short quote), separate what the document says from what the law says, warn when the document is incomplete, unreadable or lacks context, and never treat one isolated clause as the conclusion for the whole case. If no readable content is present, say so.',
      'Context: country ' + countryName(conv.country) + (conv.region ? ', region ' + regionName(conv.country, conv.region) : '') + '. Today is ' + today + '.',
      'Reply with ONLY one JSON object, no prose around it, with this shape: {"kind":"answer"|"clarify"|"limit"|"urgent"|"document"|"nosources","summary":string,"sourcesSay":[{"title":string,"text":string}],"depends":[string],"sources":[{"name":string,"article":string,"status":"unverified"}],"nextSteps":[string],"questions":[string],"document":{"notes":[string],"excerpts":[{"ref":string,"quote":string,"inDocument":string,"inLaw":string}],"warnings":[string]}|null,"limitNotice":{"text":string,"referrals":[string]}|null,"warnings":[string]}. Keep arrays short (max 5 items) and omit sections that do not apply by using empty arrays or null.'
    ].join('\n');
  }
  providers.ai = {
    id: 'ai',
    async respond({ text, attachments, conv, onStep, signal }) {
      if (!sampleFn) throw { code: 'unavailable' };
      onStep(0);
      const history = conv.messages.filter((m) => m.role !== 'system' && m.status !== 'error' && m.status !== 'loading').slice(-8);
      const transcript = history.map((m) => (m.role === 'user' ? 'PERSON: ' + (m.text || '') + (m.attachments && m.attachments.length ? ' [attached: ' + m.attachments.map((f) => f.name).join(', ') + ']' : '') : 'ROSS AI: ' + (m.answer && m.answer.summary ? m.answer.summary : ''))).join('\n');
      const limits = state.aiLimits;
      const imgTypes = limits && limits.images && limits.images.mediaTypes ? limits.images.mediaTypes : [];
      const images = [], unread = [];
      (attachments || []).forEach((f) => { if (f.file && imgTypes.includes(f.type)) images.push(f.file); else unread.push(f.name); });
      if (limits && limits.images && limits.images.maxCount && images.length > limits.images.maxCount) images.length = limits.images.maxCount;
      let prompt = aiInstructions(conv) + '\n\n';
      if (transcript) prompt += 'CONVERSATION SO FAR:\n' + transcript + '\n\n';
      if (images.length) prompt += 'The attached image(s) are pages of a document the person wants to understand.\n';
      if (unread.length) prompt += 'The person attached file(s) that cannot be read in this version: ' + unread.join(', ') + '. Say so and ask them to paste the relevant text or attach an image.\n';
      prompt += 'NEW MESSAGE FROM THE PERSON:\n' + (text || '(no text, only attachment)');
      onStep(1);
      const opts = { cache: false, signal: signal, modelTier: 'default' };
      if (images.length) opts.images = images;
      const data = await sampleFn.json(prompt, opts);
      onStep(2);
      return normalizeAI(data, attachments);
    }
  };
  function normalizeAI(d, attachments) {
    const arr = (x) => (Array.isArray(x) ? x.filter((v) => v != null) : []);
    const str = (x) => (typeof x === 'string' ? x : x == null ? '' : String(x));
    const a = { mode: 'ai', kind: ['answer', 'clarify', 'limit', 'urgent', 'document', 'nosources'].includes(d && d.kind) ? d.kind : 'answer' };
    a.summary = str(d && d.summary);
    a.sourcesSay = arr(d && d.sourcesSay).map((s) => ({ title: str(s.title), text: str(s.text) })).filter((s) => s.text);
    a.depends = arr(d && d.depends).map(str).filter(Boolean);
    a.sources = arr(d && d.sources).map((s) => ({ name: str(s && s.name), article: str(s && s.article), status: 'unverified' })).filter((s) => s.name);
    a.nextSteps = arr(d && d.nextSteps).map(str).filter(Boolean);
    a.questions = arr(d && d.questions).map(str).filter(Boolean);
    a.warnings = arr(d && d.warnings).map(str).filter(Boolean);
    if (d && d.document && typeof d.document === 'object') {
      a.document = { name: attachments && attachments.length ? attachments.map((f) => f.name).join(', ') : '', notes: arr(d.document.notes).map(str), excerpts: arr(d.document.excerpts).map((x) => ({ ref: str(x.ref), quote: str(x.quote), inDocument: str(x.inDocument), inLaw: str(x.inLaw) })), warnings: arr(d.document.warnings).map(str) };
    }
    if (d && d.limitNotice && typeof d.limitNotice === 'object' && d.limitNotice.text) a.limitNotice = { text: str(d.limitNotice.text), referrals: arr(d.limitNotice.referrals).map(str) };
    return a;
  }


  /* ---------- Fontes oficiais: textos do Planalto + explicação por IA ----------
     Fluxo: escolher normas no catálogo → carregar o JSON da norma → pontuar artigos vigentes → montar trechos →
     (com IA) pedir explicação restrita aos trechos; (sem IA) mostrar os próprios trechos com link oficial. */
  const lawCache = {};
  async function loadCatalog() {
    try {
      const res = await fetch('data/catalog.json'); if (!res.ok) throw new Error('HTTP ' + res.status);
      state.catalog = await res.json();
      try { const p = await fetch('data/pending.json'); state.lawPending = p.ok ? await p.json() : null; } catch (e) { state.lawPending = null; }
      if (['home', 'settings', 'sources'].includes(state.view)) render({ keep: true });
    } catch (e) { state.catalog = null; }
  }
  async function loadLaw(entry) {
    if (lawCache[entry.id]) return lawCache[entry.id];
    const res = await fetch('data/' + entry.file);
    if (!res.ok) throw { code: 'law_fetch', message: 'HTTP ' + res.status };
    const law = await res.json(); lawCache[entry.id] = law; return law;
  }
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const STOP = new Set('a o os as um uma uns umas de do da dos das em no na nos nas por para com sem sob sobre e ou que se nao ao aos sao ser foi esta estao estou meu minha meus minhas seu sua seus suas este isto esse essa isso aquele aquela aquilo ele ela eles elas eu voce nos lhe me te como quando onde qual quais quem mais menos muito pouco ja tambem so pode posso poderia devo deve dever tenho tem ter ha fazer faco faz fiz era sendo sido pelo pela pelos pelas num numa dele dela deles delas ate entre apos antes depois ainda mesmo mesma outro outra outros outras todo toda todos todas qualquer caso casos sobre sim nao the of and to in is it my can what how does this that for with about are was were have has been'.split(' '));
  function stem(w) { if (w.length > 5 && /oes$/.test(w)) return w.slice(0, -3) + 'ao'; if (w.length > 4 && /ns$/.test(w)) return w.slice(0, -2) + 'm'; if (w.length > 3 && /s$/.test(w)) return w.slice(0, -1); return w; }
  function tokensOf(s) { return Array.from(new Set(norm(s).replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)).map(stem))); }
  function selectLaws(question) {
    const q = norm(question);
    const scored = state.catalog.laws.map((l) => {
      let sc = 0;
      (l.tags || []).forEach((tag) => { const tg = norm(tag); if (q.includes(tg)) sc += tg.includes(' ') ? 3 : 2; });
      if (q.includes(norm(l.shortName))) sc += 6;
      const num = (norm(l.number).match(/\d[\d.]*/) || [''])[0]; if (num && q.includes(num)) sc += 6;
      return { l, sc };
    }).filter((x) => x.sc > 0).sort((a, b) => b.sc - a.sc);
    return scored.slice(0, 3).map((x) => x.l);
  }
  async function selectLawsAI(question) {
    if (!sampleFn) return null;
    try {
      const cat = state.catalog.laws.map((l) => l.id + ': ' + l.name).join('\n');
      const ids = await sampleFn.json('Which of these Brazilian federal laws are most likely to contain the rules relevant to the question below? Reply with only a JSON array of up to 3 ids from the list, most relevant first, or [] if none applies.\n\nLAWS:\n' + cat + '\n\nQUESTION: ' + question, { modelTier: 'quick' });
      if (!Array.isArray(ids)) return null;
      return ids.map((id) => state.catalog.laws.find((l) => l.id === id)).filter(Boolean).slice(0, 3);
    } catch (e) { return null; }
  }
  function excerptFor(article, qTokens, maxChars) {
    if (article.text.length <= maxChars) return article.text;
    const lines = article.text.split('\n');
    const keep = [0]; lines.forEach((ln, i) => { if (i && qTokens.some((tk) => norm(ln).includes(tk))) keep.push(i); });
    let out = '', last = -1;
    for (const i of keep) { if (out.length > maxChars) break; if (out && i - last > 1) out += '\n[…]'; out += (out ? '\n' : '') + lines[i]; last = i; }
    if (last < lines.length - 1) out += '\n[…]';
    return out.length > maxChars ? out.slice(0, maxChars) + '…' : out;
  }
  function searchArticles(laws, question, limit) {
    const qTokens = tokensOf(question);
    if (!qTokens.length) return [];
    const hits = [];
    laws.forEach((law) => {
      const arts = law.articles.filter((a) => a.status === 'vigente');
      const N = arts.length;
      const normed = arts.map((a) => norm(a.text));
      const df = qTokens.map((tk) => normed.reduce((c, tx) => c + (tx.includes(tk) ? 1 : 0), 0));
      arts.forEach((a, i) => {
        let score = 0, matched = 0;
        qTokens.forEach((tk, j) => { if (!df[j]) return; const occ = normed[i].split(tk).length - 1; if (occ) { matched++; score += (1 + Math.min(occ, 4) * 0.25) * Math.log(1 + N / df[j]); } });
        if (!matched) return;
        score *= Math.pow(matched / qTokens.length, 1.5);
        score /= Math.log(20 + a.text.length / 80);
        hits.push({ law, a, score });
      });
    });
    hits.sort((x, y) => y.score - x.score);
    const out = []; let chars = 0;
    for (const h of hits) { if (out.length >= limit) break; const ex = excerptFor(h.a, qTokens, 2200); if (chars + ex.length > 15000) continue; chars += ex.length; out.push({ law: h.law, article: h.a, excerpt: ex, score: h.score }); }
    return out;
  }
  function lawSource(hit, n) {
    const law = hit.law;
    const entry = state.catalog.laws.find((l) => l.id === law.id) || {};
    const ver = entry.versions && entry.versions.length ? entry.versions[entry.versions.length - 1].id : 'v1';
    const anchor = /^\d+$/.test(hit.article.id) ? '#art' + hit.article.id : '';
    return { lawId: law.id, name: law.name, shortName: law.shortName, article: hit.article.label, heading: hit.article.heading, status: hit.article.status, nota: hit.article.nota, url: law.url + anchor, retrievedAt: law.retrievedAt, version: ver, excerpt: hit.excerpt, n: n };
  }
  providers.oficial = {
    id: 'oficial',
    async respond({ text, attachments, conv, onStep, signal }) {
      if (!state.catalog) throw { code: 'catalog_unavailable' };
      const cap = state.catalog.generatedAt;
      if (conv.country !== 'BR') return { mode: 'oficial', kind: 'nosources', summary: t('oficial.jurisdiction', { country: countryName(conv.country) }), nextSteps: [t('oficial.jurisdictionStep')], capturedAt: cap };
      onStep(0);
      const question = (text || '').trim() || (attachments && attachments.length ? t('oficial.docDefaultQuery') : '');
      let laws = selectLaws(question);
      if (!laws.length) { const picked = await selectLawsAI(question); if (picked && picked.length) laws = picked; }
      if (signal.aborted) throw { code: 'cancelled' };
      if (!laws.length) return emptyOfficial();
      const loaded = await Promise.all(laws.map(loadLaw));
      onStep(1);
      const hits = searchArticles(loaded, question, 8);
      if (signal.aborted) throw { code: 'cancelled' };
      if (!hits.length) return emptyOfficial();
      const sources = hits.map((h, i) => lawSource(h, i + 1));
      if (!sampleFn) return retrievalOnly(sources);
      onStep(2);
      const data = await askOfficial(question, sources, conv, attachments, signal);
      return normalizeOfficial(data, sources, attachments);
    }
  };
  function emptyOfficial() { return { mode: 'oficial', kind: 'nosources', summary: t('oficial.empty'), questions: t('oficial.emptyQuestions'), nextSteps: [t('oficial.emptyStep')], capturedAt: state.catalog.generatedAt }; }
  function retrievalOnly(sources) {
    const top = sources.slice(0, 5);
    return { mode: 'oficial', kind: 'answer', summary: t('oficial.noAI'), sourcesSay: top.map((s) => ({ title: s.shortName + ' · ' + s.article, text: s.excerpt.length > 700 ? s.excerpt.slice(0, 700) + '…' : s.excerpt, ref: s.n })), sources: top, warnings: [t('oficial.noAIWarn')], capturedAt: state.catalog.generatedAt };
  }
  async function askOfficial(question, sources, conv, attachments, signal) {
    const exc = sources.map((s) => '[' + s.n + '] ' + s.name + ' — ' + s.article + (s.heading ? ' (' + s.heading + ')' : '') + (s.nota ? ' [' + s.nota + ']' : '') + '\n"""\n' + s.excerpt + '\n"""').join('\n\n');
    const history = conv.messages.filter((m) => m.role !== 'system' && m.status === 'done').slice(-6).map((m) => (m.role === 'user' ? 'PERSON: ' + (m.text || '') : 'ROSS AI: ' + (m.answer && m.answer.summary ? m.answer.summary : ''))).join('\n');
    const limits = state.aiLimits; const imgTypes = limits && limits.images && limits.images.mediaTypes ? limits.images.mediaTypes : [];
    const images = [], unread = [];
    (attachments || []).forEach((f) => { if (f.file && imgTypes.includes(f.type)) images.push(f.file); else unread.push(f.name); });
    const prompt = [
      'You are ROSS AI, a legal information assistant. You explain Brazilian law in plain language. You are not a lawyer and this is not legal advice.',
      'Write in ' + t('langName') + '. Be clear, respectful and not overly formal. Short sentences.',
      'GROUNDING RULES: Answer ONLY from the official excerpts below (current compiled text published by Planalto, captured on ' + fmtDate(state.catalog.generatedAt) + '). Cite them by their numbers. Do not cite articles, laws, deadlines or court decisions that are not in the excerpts. If the excerpts do not answer the question, say so plainly (kind "nosources") and say what kind of rule or document would be needed. Excerpts marked […] are partial.',
      'Never state that someone will win or lose, that a clause is definitely valid or invalid, or that a lawsuit certainly applies. Say what depends on facts, documents or professional interpretation.',
      'If the question is ambiguous, use kind "clarify" with up to three objective questions. If the person asks for a high-impact personalised assessment, a litigation strategy or a definitive conclusion, use kind "limit", explain the limit briefly and refer them to a lawyer, the Defensoria Pública, a union, Procon or the relevant public service. If the situation seems urgent, use kind "urgent" and tell them to seek help without delay.',
      images.length ? 'The attached image(s) are pages of a document. Identify the clause you explain (reference and short quote), separate what the document says from what the law says, and warn if it is incomplete, unreadable or lacks context. One clause is not the conclusion for the whole case.' : '',
      unread.length ? 'Files that cannot be read in this version: ' + unread.join(', ') + '. Say so and ask for the text or an image.' : '',
      'Context: ' + jurisdictionLabel(conv.country, conv.region) + '. Today is ' + fmtDate(Date.now()) + '.',
      history ? 'CONVERSATION SO FAR:\n' + history : '',
      'OFFICIAL EXCERPTS:\n' + exc,
      'QUESTION: ' + question,
      'Reply with ONLY one JSON object: {"kind":"answer"|"clarify"|"limit"|"urgent"|"document"|"nosources","summary":string,"sourcesSay":[{"title":string,"text":string,"ref":number}],"depends":[string],"sources":[{"ref":number,"why":string}],"nextSteps":[string],"questions":[string],"document":{"notes":[string],"excerpts":[{"ref":string,"quote":string,"inDocument":string,"inLaw":string}],"warnings":[string]}|null,"limitNotice":{"text":string,"referrals":[string]}|null,"warnings":[string]}. Every "ref" is an excerpt number. At most 5 items per array; use empty arrays or null when not applicable.'
    ].filter(Boolean).join('\n\n');
    const opts = { cache: false, signal: signal, modelTier: 'default' };
    if (images.length) opts.images = images;
    return sampleFn.json(prompt, opts);
  }
  function normalizeOfficial(d, sources, attachments) {
    const a = normalizeAI(d, attachments);
    a.mode = 'oficial'; a.capturedAt = state.catalog.generatedAt;
    const byN = Object.fromEntries(sources.map((s) => [s.n, s]));
    const refs = [];
    const say = Array.isArray(d && d.sourcesSay) ? d.sourcesSay : [];
    (Array.isArray(d && d.sources) ? d.sources : []).concat(say).forEach((s) => { const n = Number(s && s.ref); if (byN[n] && !refs.includes(n)) refs.push(n); });
    if (!refs.length && (a.kind === 'answer' || a.kind === 'document')) sources.slice(0, 3).forEach((s) => refs.push(s.n));
    const renum = {}; refs.forEach((n, i) => { renum[n] = i + 1; });
    a.sources = refs.map((n, i) => Object.assign({}, byN[n], { n: i + 1 }));
    a.sourcesSay = say.map((s) => ({ title: String((s && s.title) || ''), text: String((s && s.text) || ''), ref: renum[Number(s && s.ref)] || null })).filter((s) => s.text);
    return a;
  }
  function lawCardHTML(s, n, m) {
    const status = s.status === 'vigente' ? 'vigente' : s.status === 'vetado' ? 'vetado' : 'revogado';
    let meta = '<span><b>' + esc(t('source.article')) + ':</b> ' + esc(s.article) + '</span>';
    if (s.heading) meta += '<span>' + esc(s.heading) + '</span>';
    if (s.nota) meta += '<span><b>' + esc(t('source.note')) + ':</b> ' + esc(s.nota) + '</span>';
    meta += '<span><b>' + esc(t('source.captured')) + ':</b> ' + esc(fmtDate(s.retrievedAt)) + '</span><span><b>' + esc(t('source.version')) + ':</b> ' + esc(s.version) + '</span>';
    const excerpt = s.excerpt ? '<details class="src-excerpt"><summary>' + esc(t('source.excerpt')) + '</summary><p>' + esc(s.excerpt).replace(/\n/g, '<br>') + '</p></details>' : '';
    return '<li class="src-card" id="src-' + m.id + '-' + n + '"><div class="src-name"><span>' + esc(s.name) + '</span>' + statusBadge(status) + '<span class="badge badge-oficial">' + esc(t('source.official')) + '</span></div><div class="src-meta">' + meta + '</div><div class="src-link"><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(t('source.open')) + '</a><span class="mono">' + esc(s.url) + '</span></div>' + excerpt + '</li>';
  }
  function modeBadge(provider) {
    if (provider === 'ai') return '<span class="badge badge-ai">' + esc(t('chat.modeAI')) + '</span>';
    if (provider === 'oficial') return '<span class="badge badge-oficial">' + esc(t('chat.modeOficial')) + '</span>';
    return '<span class="badge badge-demo">' + esc(t('chat.modeDemo')) + '</span>';
  }
  function modeNote() {
    const s = t('settings');
    if (state.mode === 'oficial' && !state.catalog) return s.oficialUnavailable;
    if (state.mode === 'ai' && !state.aiAvailable) return s.aiUnavailable;
    if (state.mode === 'oficial') return fmt(s.oficialNote, { n: state.catalog.laws.length, date: fmtDate(state.catalog.generatedAt) }) + (state.aiAvailable ? '' : ' ' + s.oficialNoAI);
    if (state.mode === 'ai') return s.aiHelp;
    return s.demoNote;
  }
  function homeNotice() {
    const em = effectiveMode();
    if (em === 'oficial') return t('home.oficialNotice', { n: state.catalog.laws.length, date: fmtDate(state.catalog.generatedAt) }) + (state.aiAvailable ? '' : ' ' + t('home.oficialNoAI'));
    if (em === 'ai') return t('home.aiNotice');
    return t('home.demoNotice');
  }
  function officialRegistryHTML(sp) {
    if (!state.catalog) return '<div class="callout callout-neutral">' + ICONS.info + '<div>' + esc(sp.officialUnavailable) + '</div></div>';
    const c = state.catalog;
    const pend = state.lawPending && state.lawPending.changes ? state.lawPending.changes : [];
    const queue = '<div class="reg-card"><div class="queue-head">' + esc(sp.queue) + '<span class="count-pill">' + pend.length + '</span></div>' +
      (pend.length ? pend.map((ch) => '<div class="change-box"><div><b>' + esc(ch.name) + '</b><br><span class="muted">' + esc(sp.detected) + ' ' + esc(fmtDate(ch.detectedAt || state.lawPending.checkedAt)) + ' · ' + ch.articles.length + ' ' + esc(sp.articles.toLowerCase()) + '</span></div>' +
        ch.articles.slice(0, 5).map((ar) => '<div class="diff"><div><h4>' + esc(sp.before) + ' · ' + esc(ar.label) + '</h4><p>' + esc((ar.before || '—').slice(0, 600)) + '</p></div><div><h4>' + esc(sp.after) + '</h4><p>' + esc((ar.after || '—').slice(0, 600)) + '</p></div></div>').join('') +
        '<p class="mono">' + esc(sp.approveCmd) + '</p></div>').join('') : '<p class="muted">' + esc(sp.queueEmpty) + '</p><p class="mono muted">' + esc(sp.checkCmd) + '</p>') + '</div>';
    const cards = c.laws.map((l) => {
      const cur = l.versions && l.versions.length ? l.versions[l.versions.length - 1] : null;
      return '<div class="reg-card" id="reg-' + l.id + '"><h3><span>' + esc(l.name) + '</span>' + statusBadge('vigente') + '<span class="badge badge-oficial">' + esc(t('source.official')) + '</span></h3>' +
        '<dl class="reg-grid">' +
        '<div><dt>' + esc(sp.fields.type) + '</dt><dd>' + esc(sp.types[l.type] || l.type) + '</dd></div>' +
        '<div><dt>' + esc(sp.fields.jurisdiction) + '</dt><dd>' + esc(c.jurisdiction) + '</dd></div>' +
        '<div><dt>' + esc(sp.fields.published) + '</dt><dd>' + esc(fmtDate(l.date)) + '</dd></div>' +
        '<div><dt>' + esc(sp.lexml) + '</dt><dd class="mono">' + esc(l.lexml) + '</dd></div>' +
        '<div><dt>' + esc(sp.fields.link) + '</dt><dd><a href="' + esc(l.url) + '" target="_blank" rel="noopener" class="mono">' + esc(l.url) + '</a></dd></div>' +
        '<div><dt>' + esc(sp.fields.verified) + '</dt><dd>' + esc(fmtDate(l.retrievedAt)) + '</dd></div>' +
        '<div><dt>' + esc(sp.fields.version) + '</dt><dd>' + esc(cur ? cur.id : 'v1') + '</dd></div>' +
        '<div><dt>' + esc(sp.articles) + '</dt><dd>' + esc(l.articleCount + ' (' + l.vigentes + ' ' + sp.inForce + ', ' + l.revogados + ' ' + sp.repealed + ')') + '</dd></div>' +
        '<div><dt>' + esc(sp.hash) + '</dt><dd class="mono">' + esc((l.sha256 || '').slice(0, 16)) + '…</dd></div>' +
        '</dl>' +
        '<details><summary>' + esc(sp.versions) + ' (' + (l.versions || []).length + ')</summary><ul class="ver-list">' + (l.versions || []).map((v) => '<li><span class="vid' + (cur && v.id === cur.id ? ' is-current' : '') + '">' + esc(v.id) + (cur && v.id === cur.id ? ' · ' + esc(sp.current) : '') + '</span><span class="vdate">' + esc(fmtDate(v.date)) + '</span><span>' + esc(v.note) + '</span></li>').join('') + '</ul></details></div>';
    }).join('');
    return '<div class="registry"><div class="reg-card"><h3>' + esc(sp.official) + '</h3><p class="muted">' + esc(fmt(sp.officialIntro, { source: c.source, index: c.index, n: c.laws.length, date: fmtDate(c.generatedAt) })) + '</p></div>' + queue + cards + '</div>';
  }

  /* ---------- Envio ---------- */
  function activeProvider() {
    if (state.mode === 'oficial' && state.catalog) return providers.oficial;
    if (state.mode === 'ai' && state.aiAvailable) return providers.ai;
    return providers.demo;
  }
  function effectiveMode() { return activeProvider().id; }

  async function submitMessage(text, extraAttachments, forcedProvider) {
    if (state.busy) return;
    let conv = currentConv();
    if (!conv || state.view !== 'chat') conv = newConversation();
    const attachments = (extraAttachments || state.pending).map((f) => ({ id: f.id, name: f.name, size: f.size, type: f.type, file: f.file }));
    state.pending = []; state.draft = '';
    const userMsg = { id: uid(), role: 'user', text: text, attachments: attachments.map((f) => ({ name: f.name, size: f.size, type: f.type })), createdAt: Date.now() };
    conv.messages.push(userMsg);
    if (!conv.title) conv.title = (text || (attachments[0] && attachments[0].name) || t('chat.untitled')).slice(0, 60);
    const provider = forcedProvider || activeProvider();
    const botMsg = { id: uid(), role: 'assistant', status: 'loading', provider: provider.id, step: 0, createdAt: Date.now(), docName: attachments.map((f) => f.name).join(', '), forced: !!forcedProvider };
    conv.messages.push(botMsg);
    touch(conv);
    state.view = 'chat';
    render();
    scrollToEnd();
    await runProvider(provider, conv, botMsg, { text: text, attachments: attachments });
  }
  async function runProvider(provider, conv, botMsg, input) {
    const ctl = new AbortController();
    state.busy = { ctl: ctl, id: botMsg.id };
    const sendBtn = $('#btn-send'); if (sendBtn) sendBtn.disabled = true;
    const onStep = (i) => { botMsg.step = i; const node = $('.msg[data-id="' + botMsg.id + '"] .answer'); if (node) node.innerHTML = loadingHTML(provider.id, i); };
    try {
      const answer = await provider.respond({ text: input.text, attachments: input.attachments, conv: conv, lang: state.lang, onStep: onStep, signal: ctl.signal });
      botMsg.status = 'done'; botMsg.answer = answer; botMsg.provider = provider.id; delete botMsg.error;
    } catch (e) {
      const code = e && e.code;
      botMsg.status = 'error';
      botMsg.error = (code && t('errors.' + code) !== 'errors.' + code) ? t('errors.' + code) : (e && e.message && code !== 'demo_error' ? t('errors.generic') : t('errors.generic'));
      if (code === 'unavailable') botMsg.error = t('errors.unavailable');
      botMsg.lastInput = { text: input.text, attachments: input.attachments.map((f) => ({ name: f.name, size: f.size, type: f.type })) };
    } finally {
      state.busy = null;
      touch(conv);
      const node = $('.msg[data-id="' + botMsg.id + '"]');
      if (node) node.replaceWith(renderMessage(botMsg, conv));
      const f = $('#composer'); if (f && f._refresh) f._refresh();
      renderDrawer();
      scrollToEnd();
    }
  }
  async function retryMessage(botMsg, conv) {
    if (state.busy) return;
    const idx = conv.messages.indexOf(botMsg);
    const prevUser = conv.messages.slice(0, idx).reverse().find((m) => m.role === 'user');
    const input = botMsg.lastInput || { text: prevUser ? prevUser.text : '', attachments: prevUser ? prevUser.attachments : [] };
    if (RX.error.test(input.text || '')) input.text = input.text.replace(RX.error, '').trim();
    const provider = botMsg.forced ? providers.demo : activeProvider();
    botMsg.status = 'loading'; botMsg.step = 0; botMsg.provider = provider.id; delete botMsg.error;
    const node = $('.msg[data-id="' + botMsg.id + '"]'); if (node) node.replaceWith(renderMessage(botMsg, conv));
    await runProvider(provider, conv, botMsg, input);
  }

  /* Cenários de demonstração acionados pela página de Ajuda. */
  function runScenario(key) {
    const lang = state.lang;
    const pt = lang === 'pt-BR';
    const fake = (name, type) => ({ id: uid(), name: name, size: 184320, type: type || 'application/pdf' });
    const map = {
      doc_ok: { text: pt ? 'Pode analisar este contrato?' : 'Can you review this contract?', files: [fake('contrato-prestacao-servicos.pdf')] },
      doc_illegible: { text: pt ? 'O que diz este documento?' : 'What does this document say?', files: [fake('foto-ilegivel.jpg', 'image/jpeg')] },
      doc_incomplete: { text: pt ? 'Pode explicar esta cláusula?' : 'Can you explain this clause?', files: [fake('contrato-pagina-3.pdf')] },
      urgent: { text: pt ? 'Recebi uma ordem de despejo com prazo para amanhã. O que faço?' : 'I received an eviction notice with a deadline for tomorrow. What do I do?' },
      limit: { text: pt ? 'Vou ganhar a ação contra a empresa?' : 'Will I win the case against the company?' },
      nosources: { text: pt ? 'Como funciona a herança de um imóvel no exterior?' : 'How does inheritance of a property abroad work?' },
      error: { text: pt ? 'simular erro' : 'simulate error' }
    };
    const s = map[key]; if (!s) return;
    state.currentId = null; state.pending = [];
    newConversation({ country: 'BR', region: state.country === 'BR' ? state.region : '' });
    state.view = 'chat';
    submitMessage(s.text, s.files || [], providers.demo);
  }

  /* ---------- Páginas estáticas ---------- */
  function pageShell(title, updated, innerHTML) {
    return '<section class="page"><div class="container">' +
      '<button type="button" class="back-link" data-back>' + ICONS.back + '<span>' + esc(t('nav.back')) + '</span></button>' +
      '<div class="page-head"><h1>' + esc(title) + '</h1>' + (updated ? '<p class="updated">' + esc(updated) + '</p>' : '') + '</div>' +
      innerHTML + '</div></section>';
  }
  function bindBack(main) { const b = $('[data-back]', main); if (b) b.addEventListener('click', () => go(state.currentId ? 'chat' : 'home')); }
  function renderStatic(main, key) {
    const p = t('pages.' + key);
    main.innerHTML = pageShell(p.title, p.updated, '<div class="prose">' + p.html + '</div>');
    bindBack(main);
    $$('[data-scenario]', main).forEach((b) => b.addEventListener('click', () => runScenario(b.dataset.scenario)));
  }

  /* ---------- Configurações ---------- */
  function renderSettings(main) {
    const s = t('settings');
    const langs = Object.keys(window.ROSS_I18N);
    const seg = (id, options, current) => '<div class="seg" role="group" id="' + id + '">' + options.map((o) => '<button type="button" data-val="' + o[0] + '" aria-pressed="' + (o[0] === current) + '"' + (o[2] ? ' disabled' : '') + '>' + esc(o[1]) + '</button>').join('') + '</div>';
    main.innerHTML = pageShell(s.title, '', '<div class="settings-list">' +
      '<div class="setting"><div class="title" id="lbl-lang">' + esc(s.language) + '</div><div class="desc">' + esc(t('taglineAlt')) + '</div><div class="control"><span class="select-wrap"><select id="set-lang" aria-labelledby="lbl-lang">' + langs.map((l) => '<option value="' + l + '"' + (l === state.lang ? ' selected' : '') + '>' + esc(window.ROSS_I18N[l].langName) + '</option>').join('') + '</select></span></div></div>' +
      '<div class="setting"><div class="title">' + esc(s.theme) + '</div><div class="desc"></div><div class="control">' + seg('set-theme', [['system', s.themeSystem], ['light', s.themeLight], ['dark', s.themeDark]], state.theme) + '</div></div>' +
      '<div class="setting stack"><div class="title">' + esc(s.jurisdiction) + '</div><div class="desc">' + esc(s.jurisdictionHelp) + '</div><div class="control" id="set-jur">' + jurisdictionSelectsHTML(state.country, state.region, 'set') + '</div></div>' +
      '<div class="setting stack"><div class="title">' + esc(s.mode) + '</div><div class="desc">' + esc(s.modeHelp) + '</div><div class="control">' + seg('set-mode', [['oficial', s.modeOficial, !state.catalog], ['demo', s.modeDemo, false], ['ai', s.modeAI, !state.aiAvailable]], state.mode) + '</div><div class="desc" id="mode-note">' + esc(modeNote()) + '</div></div>' +
      '<div class="setting stack"><div class="title">' + esc(s.data) + '</div><div class="desc">' + esc(s.dataHelp) + ' ' + esc(fmt(s.count, { n: state.conversations.length })) + '</div><div class="control" id="set-data"><button type="button" class="btn btn-secondary" id="btn-delete-all"' + (state.conversations.length ? '' : ' disabled') + '>' + ICONS.trash + esc(s.deleteAll) + '</button></div></div>' +
      '<div class="setting stack"><div class="title">' + esc(s.about) + '</div><div class="desc">' + esc(s.aboutText) + '</div></div>' +
      '</div>');
    bindBack(main);
    $('#set-lang').addEventListener('change', (e) => { state.lang = e.target.value; document.documentElement.lang = state.lang; save(); render({ keep: true }); });
    $$('#set-theme button', main).forEach((b) => b.addEventListener('click', () => { state.theme = b.dataset.val; applyTheme(); save(); $$('#set-theme button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }));
    const bindJur = () => $$('#set-jur select', main).forEach((sel) => sel.addEventListener('change', () => {
      if (sel.dataset.role === 'country') { state.country = sel.value; state.region = ''; } else state.region = sel.value;
      save(); $('#set-jur').innerHTML = jurisdictionSelectsHTML(state.country, state.region, 'set'); bindJur();
    }));
    bindJur();
    $$('#set-mode button', main).forEach((b) => b.addEventListener('click', () => { state.mode = b.dataset.val; state.aiMode = state.mode === 'ai'; save(); $$('#set-mode button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); $('#mode-note').textContent = modeNote(); }));
    $('#btn-delete-all').addEventListener('click', () => {
      const box = el('<div class="inline-confirm" role="alertdialog"><span>' + esc(s.deleteAllConfirm) + '</span><div class="row"><button type="button" class="btn btn-danger btn-sm" data-yes>' + esc(t('chat.yesDelete')) + '</button><button type="button" class="btn btn-secondary btn-sm" data-no>' + esc(t('chat.cancel')) + '</button></div></div>');
      const host = $('#set-data'); $$('.inline-confirm', host).forEach((n) => n.remove()); host.appendChild(box);
      $('[data-no]', box).addEventListener('click', () => box.remove());
      $('[data-yes]', box).addEventListener('click', () => { state.conversations = []; state.feedback = {}; state.currentId = null; save(); toast(s.deleted); render({ keep: true }); });
    });
  }

  /* ---------- Base de fontes ---------- */
  function renderSources(main) {
    const sp = t('sourcesPage');
    const reviewOf = (id) => state.sourcesReview[id] || null;
    const pending = SOURCES.filter((s) => s.change && !reviewOf(s.id));
    const queue = '<div class="reg-card"><div class="queue-head">' + esc(sp.queue) + '<span class="count-pill">' + pending.length + '</span></div>' +
      (pending.length ? pending.map((s) => changeBoxHTML(s, sp)).join('') : '<p class="muted">' + esc(sp.queueEmpty) + '</p>') + '</div>';
    const cards = SOURCES.map((s) => {
      const rv = reviewOf(s.id);
      const versions = s.versions.slice();
      let current = s.currentVersion;
      if (rv && rv.status === 'aprovada') { versions.push({ id: rv.newVersion, date: rv.date, note: { 'pt-BR': 'Atualização aprovada na conferência: ' + L(s.change.summary), en: 'Update approved in review: ' + L(s.change.summary) } }); current = rv.newVersion; }
      return '<div class="reg-card" id="reg-' + s.id + '"><h3><span>' + esc(L(s.name)) + '</span>' + statusBadge(s.status) + '<span class="badge badge-fict">' + esc(t('source.fictional')) + '</span></h3>' +
        '<dl class="reg-grid">' +
        '<div><dt>' + esc(sp.fields.type) + '</dt><dd>' + esc(sp.types[s.type] || s.type) + '</dd></div>' +
        '<div><dt>' + esc(sp.fields.jurisdiction) + '</dt><dd>' + esc(L(s.jurisdiction)) + '</dd></div>' +
        '<div><dt>' + esc(sp.fields.published) + '</dt><dd>' + esc(fmtDate(s.published)) + '</dd></div>' +
        '<div><dt>' + esc(sp.fields.index) + '</dt><dd>' + esc(L(s.index)) + '</dd></div>' +
        '<div><dt>' + esc(sp.fields.link) + '</dt><dd class="mono">' + esc(s.url) + '</dd></div>' +
        '<div><dt>' + esc(sp.fields.verified) + '</dt><dd>' + esc(fmtDate(rv && rv.status === 'aprovada' ? rv.date : s.verifiedAt)) + '</dd></div>' +
        '<div><dt>' + esc(sp.fields.version) + '</dt><dd>' + esc(current) + '</dd></div>' +
        '</dl>' +
        (s.change && rv && rv.status === 'rejeitada' ? '<div class="callout callout-neutral">' + ICONS.info + '<div>' + esc(sp.kept) + '</div></div>' : '') +
        '<details><summary>' + esc(sp.versions) + ' (' + versions.length + ')</summary><ul class="ver-list">' + versions.map((v) => '<li><span class="vid' + (v.id === current ? ' is-current' : '') + '">' + esc(v.id) + (v.id === current ? ' · ' + esc(sp.current) : '') + '</span><span class="vdate">' + esc(fmtDate(v.date)) + '</span><span>' + esc(L(v.note)) + '</span></li>').join('') + '</ul></details>' +
        '</div>';
    }).join('');
    const how = '<div class="reg-card"><h3>' + esc(sp.howTitle) + '</h3><ol class="how-list">' + sp.how.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol></div>';
    main.innerHTML = pageShell(sp.title, '', '<p class="prose">' + esc(sp.intro) + '</p>' + officialRegistryHTML(sp) + '<details class="demo-registry"><summary>' + esc(sp.demoSection) + '</summary><div class="callout callout-warn">' + ICONS.warn + '<div>' + esc(sp.banner) + '</div></div><div class="registry">' + queue + cards + '</div></details><div class="registry">' + how + '</div>');
    bindBack(main);
    $$('[data-approve]', main).forEach((b) => b.addEventListener('click', () => { const s = sourceById(b.dataset.approve); const n = 'v' + (s.versions.length + 1); state.sourcesReview[s.id] = { status: 'aprovada', date: new Date().toISOString().slice(0, 10), newVersion: n }; save(); toast(sp.approved); renderSources(main); }));
    $$('[data-keep]', main).forEach((b) => b.addEventListener('click', () => { state.sourcesReview[b.dataset.keep] = { status: 'rejeitada', date: new Date().toISOString().slice(0, 10) }; save(); toast(sp.kept); renderSources(main); }));
  }
  function changeBoxHTML(s, sp) {
    return '<div class="change-box"><div><b>' + esc(L(s.name)) + '</b><br><span class="muted">' + esc(sp.detected) + ' ' + esc(fmtDate(s.change.detectedAt)) + ' · ' + esc(L(s.change.summary)) + '</span></div>' +
      '<div class="diff"><div><h4>' + esc(sp.before) + ' (' + esc(s.currentVersion) + ')</h4><p>' + esc(L(s.change.before)) + '</p></div><div><h4>' + esc(sp.after) + '</h4><p>' + esc(L(s.change.after)) + '</p></div></div>' +
      '<div class="row"><button type="button" class="btn btn-sm" data-approve="' + s.id + '">' + ICONS.check + esc(sp.approve) + '</button><button type="button" class="btn btn-secondary btn-sm" data-keep="' + s.id + '">' + esc(sp.keep) + '</button></div></div>';
  }

  /* ---------- Render principal ---------- */
  function render(opts) {
    document.documentElement.lang = state.lang;
    renderTopbar();
    const main = $('#main');
    const y = opts && opts.keep ? window.scrollY : 0;
    switch (state.view) {
      case 'chat': renderChat(main); break;
      case 'settings': renderSettings(main); break;
      case 'sources': renderSources(main); break;
      case 'privacy': case 'terms': case 'help': renderStatic(main, state.view); break;
      default: renderHome(main);
    }
    if ($('#drawer').classList.contains('is-open')) renderDrawer();
    if (opts && opts.keep) window.scrollTo(0, y);
  }

  /* ---------- Inicialização ---------- */
  function start() {
    load();
    state.hostTheme = document.documentElement.getAttribute('data-theme');
    applyTheme();
    const token = (location.hash || '').replace('#', '');
    const viewFromToken = Object.keys(PAGE_TOKENS).find((k) => PAGE_TOKENS[k] === token);
    if (viewFromToken) state.view = viewFromToken;
    else if (state.currentId && state.conversations.some((c) => c.id === state.currentId)) state.view = 'chat';
    else { state.view = 'home'; state.currentId = null; }
    render();
    if (state.view === 'chat') scrollToEnd(true);
    $('#scrim').addEventListener('click', () => openDrawer(false));
    $('#file-input').addEventListener('change', (e) => onFilesChosen(e.target.files));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && $('#drawer').classList.contains('is-open')) openDrawer(false); });
    window.addEventListener('hashchange', () => { const tk = (location.hash || '').replace('#', ''); const v = Object.keys(PAGE_TOKENS).find((k) => PAGE_TOKENS[k] === tk); if (v && v !== state.view) go(v); });
    probeAI();
    loadCatalog();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
