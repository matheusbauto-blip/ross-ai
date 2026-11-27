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
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
    stop: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>'
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
    corpus: { kind: 'laws', query: '', scope: '', uf: '', municipality: '', organ: '', federalActs: false, results: [], offset: 0, hasMore: false, searched: false, busy: false, error: '', indexNotice: '', stats: null, statsRequested: false },
    conversations: [],
    feedback: {},
    sourcesReview: {},
    /* transitório */
    view: 'home',
    currentId: null,
    pending: [],
    draft: '',
    drafts: new Map(),
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
      state.region = brazilRegion(state.country, state.region);
      state.country = 'BR';
      if (!Array.isArray(state.conversations)) state.conversations = [];
      state.conversations.forEach((conversation) => {
        if (!Array.isArray(conversation.messages)) conversation.messages = [];
        conversation.messages.forEach((message) => {
          if (message.role === 'assistant' && message.status === 'loading') {
            message.status = 'error'; message.error = t('errors.interrupted');
          }
        });
      });
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
        if (state.storageError) { state.storageError = null; renderStorageNotice(); }
      } catch (e) {
        /* O histórico continua em memória; a pessoa é avisada e pode exportá-lo. */
        const quota = /quota|exceeded|storage/i.test(String(e && (e.name + ' ' + e.message)));
        const first = !state.storageError;
        state.storageError = { quota: quota, at: Date.now() };
        if (first) toast(t(quota ? 'storage.quotaToast' : 'storage.failedToast'));
        renderStorageNotice();
      }
    }, 120);
  }
  function storageNoticeHTML() {
    if (!state.storageError) return '';
    return '<div class="storage-notice callout callout-warn" role="alert" id="storage-notice">' + ICONS.warn + '<div><b>' + esc(t('storage.title')) + '</b><br>' + esc(t(state.storageError.quota ? 'storage.quota' : 'storage.failed')) +
      '<div class="row"><button type="button" class="btn btn-secondary btn-sm" data-export-history>' + esc(t('storage.export')) + '</button><button type="button" class="btn btn-secondary btn-sm" data-retry-save>' + esc(t('storage.retry')) + '</button></div></div></div>';
  }
  function bindStorageNotice(root) {
    const exportBtn = $('[data-export-history]', root); if (exportBtn) exportBtn.addEventListener('click', exportHistory);
    const retryBtn = $('[data-retry-save]', root); if (retryBtn) retryBtn.addEventListener('click', () => save());
  }
  function renderStorageNotice() {
    const slot = $('#storage-slot'); if (!slot) return;
    slot.innerHTML = storageNoticeHTML();
    bindStorageNotice(slot);
  }
  function historyExportText() {
    const lines = ['ROSS AI · ' + t('storage.exportTitle') + ' · ' + fmtDate(Date.now(), { dateStyle: 'medium', timeStyle: 'short' }), ''];
    state.conversations.forEach((conv) => {
      lines.push('=== ' + (conv.title || t('chat.untitled')) + ' · ' + jurisdictionLabel(conv.country, conv.region) + ' · ' + fmtDate(conv.updatedAt, { dateStyle: 'medium', timeStyle: 'short' }) + ' ===');
      conv.messages.forEach((m) => {
        if (m.role === 'user') { lines.push('', t('chat.you') + ': ' + (m.text || '') + ((m.attachments || []).length ? ' [' + t('chat.attachments') + ': ' + m.attachments.map((f) => f.name).join(', ') + ']' : '')); return; }
        lines.push('', t('chat.assistant') + ':');
        if (m.status === 'done' && m.answer) lines.push(answerToText(m.answer, m)); else lines.push(m.error || t('errors.interrupted'));
      });
      lines.push('');
    });
    return lines.join('\n');
  }
  function downloadText(filename, text) {
    if (typeof Blob !== 'function' || !URL.createObjectURL) throw new Error('download unavailable');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportHistory() {
    const text = historyExportText();
    try {
      downloadText('ross-ai-historico-' + new Date().toISOString().slice(0, 10) + '.txt', text);
      toast(t('storage.exported'));
    } catch (e) {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast(t('storage.copied')), () => toast(t('chat.copyFailed')));
      else toast(t('chat.copyFailed'));
    }
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
  function brazilRegion(country, region) { return country === 'BR' && (regionsFor('BR') || []).some((r) => r[0] === region) ? region : ''; }

  /* ---------- Conversas ---------- */
  function currentConv() { return state.conversations.find((c) => c.id === state.currentId) || null; }
  function rememberDraft() { state.drafts.set(state.currentId || 'home', state.draft); }
  function restoreDraft() { state.draft = state.drafts.get(state.currentId || 'home') || ''; }
  function newConversation(opts) {
    rememberDraft();
    const country = (opts && opts.country) || state.country;
    const region = opts && opts.region !== undefined ? opts.region : state.region;
    const conv = { id: uid(), title: '', createdAt: Date.now(), updatedAt: Date.now(), country: 'BR', region: brazilRegion(country, region), messages: [] };
    state.conversations.unshift(conv);
    state.currentId = conv.id;
    restoreDraft();
    save();
    return conv;
  }
  function deleteConversation(id) {
    state.drafts.delete(id);
    state.conversations = state.conversations.filter((c) => c.id !== id);
    if (state.currentId === id) { state.currentId = null; restoreDraft(); if (state.view === 'chat') state.view = 'home'; }
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
  const PAGE_TOKENS = { privacy: 'privacidade', terms: 'termos', help: 'ajuda', sources: 'fontes', settings: 'configuracoes', search: 'pesquisar', processes: 'processos' };

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
      item('processes', 'doc', t('processes.title')) + item('search', 'book', t('corpus.title')) + item('sources', 'book', t('nav.sources')) + item('settings', 'gear', t('nav.settings')) + item('privacy', 'shield', t('nav.privacy')) + item('terms', 'doc', t('nav.terms')) + item('help', 'help', t('nav.help')) +
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
    rememberDraft();
    if (view === 'home') { state.currentId = null; state.pending = []; }
    state.view = view;
    restoreDraft();
    const token = PAGE_TOKENS[view];
    try { if (token) { if (location.hash !== '#' + token) history.replaceState(null, '', '#' + token); } else if (location.hash) history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignora */ }
    save();
    render();
    if (!(opts && opts.keepScroll)) window.scrollTo(0, 0);
  }
  function openConversation(id) {
    const conv = state.conversations.find((c) => c.id === id);
    if (!conv) return;
    rememberDraft();
    state.currentId = id; state.view = 'chat'; state.pending = [];
    restoreDraft();
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
      '<button type="submit" class="send-btn" id="btn-send" aria-label="' + esc(t('composer.send')) + '" title="' + esc(t('composer.send')) + '" disabled' + (state.busy ? ' hidden' : '') + '>' + ICONS.send + '</button>' +
      '<button type="button" class="send-btn stop-btn" id="btn-stop" aria-label="' + esc(t('composer.stop')) + '" title="' + esc(t('composer.stop')) + '"' + (state.busy ? '' : ' hidden') + '>' + ICONS.stop + '</button>' +
      '</div></div></form>';
  }
  function jurisdictionSelectsHTML(country, region, prefix) {
    const regions = regionsFor('BR');
    region = brazilRegion(country, region);
    return '<span class="select-wrap country-fixed"><label class="sr-only" for="' + prefix + '-country">' + esc(t('composer.country')) + '</label><select id="' + prefix + '-country" data-role="country" disabled>' +
      '<option value="BR" selected>' + esc(countryName('BR')) + '</option></select></span>' +
      (regions ? '<span class="select-wrap"><label class="sr-only" for="' + prefix + '-region">' + esc(t('composer.region')) + '</label><select id="' + prefix + '-region" data-role="region"><option value="">' + esc(t('composer.regionAll')) + '</option>' +
        regions.map((r) => '<option value="' + r[0] + '"' + (r[0] === region ? ' selected' : '') + '>' + esc(r[1]) + '</option>').join('') + '</select></span>' : '');
  }

  function bindComposer(mode) {
    const form = $('#composer'); if (!form) return;
    const ta = $('#composer-input');
    const send = $('#btn-send');
    const grow = () => { ta.style.height = 'auto'; ta.style.height = clamp(ta.scrollHeight, 48, window.innerHeight * 0.4) + 'px'; };
    const stop = $('#btn-stop');
    const refresh = () => {
      const busy = !!state.busy;
      send.disabled = busy || (!ta.value.trim() && !state.pending.length);
      if (busy) send.setAttribute('hidden', ''); else send.removeAttribute('hidden');
      if (stop) { if (busy) stop.removeAttribute('hidden'); else stop.setAttribute('hidden', ''); }
    };
    if (stop) stop.addEventListener('click', stopAnswer);
    ta.addEventListener('input', () => { state.draft = ta.value; grow(); refresh(); });
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); state.draft = ta.value; refresh(); if (!send.disabled) form.requestSubmit(); } });
    form.addEventListener('submit', (e) => { e.preventDefault(); const text = ta.value.trim(); if (!text && !state.pending.length) return; submitMessage(text); });
    $('#btn-attach').addEventListener('click', () => pickFiles());
    form.addEventListener('change', (event) => {
      const s = event.target.closest('select[data-role]');
      if (!s || !form.contains(s)) return;
      if (s.dataset.role === 'country') { state.country = s.value; state.region = ''; }
      else state.region = s.value;
      save();
      const left = $('.composer-left', form);
      $$('.select-wrap', left).forEach((w) => w.remove());
      left.insertAdjacentHTML('beforeend', jurisdictionSelectsHTML(state.country, state.region, 'home'));
    });
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
  const MAX_FILES = 4;
  const OK_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
  function pickFiles() { const inp = $('#file-input'); inp.value = ''; inp.click(); }
  function onFilesChosen(files) {
    const ok = [], skipped = [];
    let totalBytes = state.pending.reduce((sum, file) => sum + file.size, 0);
    Array.from(files).forEach((f) => {
      const type = f.type || (f.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : '');
      if (f.size > MAX_FILE) skipped.push(f.name + ': ' + t('attachModal.tooLarge'));
      else if (!OK_TYPES.includes(type)) skipped.push(f.name + ': ' + t('attachModal.badType'));
      else if (state.pending.length + ok.length >= MAX_FILES) skipped.push(f.name + ': ' + t('attachModal.tooMany'));
      else if (totalBytes + f.size > MAX_FILE) skipped.push(f.name + ': ' + t('attachModal.totalTooLarge'));
      else { ok.push({ id: uid(), name: f.name, size: f.size, type: type, file: f }); totalBytes += f.size; }
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
      '<p>' + esc(effectiveMode() !== 'demo' && state.aiAvailable ? (aiBackend() === 'api' ? t('attachModal.apiLine') : t('attachModal.aiLine')) : t('attachModal.demoLine')) + '</p>' +
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
      '<div id="storage-slot">' + storageNoticeHTML() + '</div>' +
      composerHTML('home') +
      '<div><div class="examples-label">' + esc(t('home.examplesLabel')) + '</div><div class="examples">' +
      ex.map((e) => '<button type="button" class="example" data-example="' + esc(e.label) + '">' + ICONS.arrow + '<span>' + esc(e.label) + '</span></button>').join('') +
      '</div></div>' +
      '<a class="corpus-entry" href="#pesquisar" data-go="search">' + ICONS.book + '<span><strong>' + esc(t('corpus.title')) + '</strong><span>' + esc(t('corpus.homeHint')) + '</span></span>' + ICONS.arrow + '</a>' +
      '<div class="home-foot">' +
      '<span class="demo-notice' + (effectiveMode() === 'oficial' ? ' is-oficial' : '') + '">' + ICONS.info + '<span>' + esc(homeNotice()) + '</span></span>' +
      '<p>' + esc(t('home.footnote')) + '</p>' +
      '<div class="links"><a href="#privacidade" data-go="privacy">' + esc(t('nav.privacy')) + '</a><a href="#termos" data-go="terms">' + esc(t('nav.terms')) + '</a><a href="#ajuda" data-go="help">' + esc(t('nav.help')) + '</a></div>' +
      '</div></div></section>';
    bindStorageNotice($('#storage-slot'));
    bindComposer('home');
    $$('[data-example]', main).forEach((b) => b.addEventListener('click', () => submitMessage(b.dataset.example)));
    $$('a[data-go]', main).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); go(a.dataset.go); }));
  }

  /* ---------- Conversa ---------- */
  function renderChat(main) {
    const conv = currentConv();
    if (!conv) { state.view = 'home'; renderHome(main); return; }
    main.innerHTML = '<section class="chat"><div class="chat-scroll"><div class="container"><div id="jur-slot"></div><div id="storage-slot">' + storageNoticeHTML() + '</div><div class="messages" id="messages"></div></div></div>' +
      '<div class="chat-composer"><div class="container">' + composerHTML('chat') + '<p class="composer-hint">' + esc(t('composer.disclaimer')) + '</p></div></div></section>';
    const list = $('#messages');
    conv.messages.forEach((m) => list.appendChild(renderMessage(m, conv)));
    bindStorageNotice($('#storage-slot'));
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
    if (m.status === 'loading') body.innerHTML = loadingHTML(m.provider, m.step || 0, m.partial);
    else if (m.status === 'error') body.innerHTML = errorHTML(m);
    else body.innerHTML = answerHTML(m.answer, m);
    bindMessageActions(node, m, conv);
    return node;
  }
  /* Enquanto o modelo escreve, o resumo aparece aos poucos no lugar das linhas de espera; a resposta completa
     (com fontes e avisos) substitui tudo ao final. */
  function loadingHTML(provider, step, partial) {
    const steps = t('loading.' + (provider === 'ai' ? 'ai' : provider === 'oficial' ? 'oficial' : 'demo'));
    return '<ul class="steps" aria-live="polite">' + steps.map((s, i) => '<li class="' + (i < step ? 'is-done' : i === step ? 'is-active' : '') + '"><span class="dot"></span><span>' + esc(s) + (provider === 'demo' ? ' <span class="badge badge-fict">' + esc(t('chat.modeDemo').toLowerCase()) + '</span>' : '') + '</span></li>').join('') + '</ul>' +
      (partial ? '<section class="ans-sec summary partial-summary"><h3>' + esc(t('sections.summary')) + '</h3><p data-partial>' + esc(partial) + '</p></section>' : '<div class="skeleton" aria-hidden="true"><span></span><span></span><span></span></div>') +
      '<div class="row loading-actions"><button type="button" class="btn btn-secondary btn-sm" data-stop>' + esc(t('composer.stop')) + '</button></div>';
  }
  /* Interrompe a espera no cliente. Um pedido já enviado ao servidor pode ter sido processado e contado mesmo assim. */
  function stopAnswer() { if (state.busy && state.busy.ctl) state.busy.ctl.abort(); }
  function errorHTML(m) {
    return '<div class="error-card" role="alert"><h4>' + esc(t('errors.title')) + '</h4><p>' + esc(m.error || t('errors.generic')) + '</p><div class="row"><button type="button" class="btn btn-secondary btn-sm" data-retry>' + esc(t('chat.retry')) + '</button></div></div>';
  }

  /* ---------- Renderização da resposta ---------- */
  const SOURCES = window.ROSS_DEMO.sources;
  function sourceById(id) { return SOURCES.find((s) => s.id === id); }
  function statusBadge(status) { return '<span class="badge badge-' + esc(status) + '">' + esc(t('status.' + status)) + '</span>'; }
  function list(items, cls) { return '<ul class="' + (cls || '') + '">' + items.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>'; }
  /* Observações técnicas (modelo alternativo, trechos escolhidos por palavras, cobertura parcial, afirmações removidas)
     ficam juntas em "Sobre esta resposta"; em amarelo aparece só o que muda o caso da pessoa. Respostas salvas antes
     desta separação guardavam essas observações junto dos avisos e são reorganizadas na exibição. */
  const NOTICE_KEYS = ['oficial.fallbackModel', 'oficial.relevanceFallback', 'oficial.partialCoverage', 'oficial.droppedClaims'];
  function textIn(lang, path) { return path.split('.').reduce((node, key) => (node ? node[key] : undefined), window.ROSS_I18N[lang]); }
  function isTechnicalNotice(text) {
    return NOTICE_KEYS.some((key) => Object.keys(window.ROSS_I18N).some((lang) => {
      const prefix = String(textIn(lang, key) || '').split('{')[0];
      return prefix.length > 10 && String(text).startsWith(prefix);
    }));
  }
  function answerNotes(a) {
    const warnings = [], notices = (a.notices || []).slice();
    (a.warnings || []).forEach((w) => (isTechnicalNotice(w) ? notices : warnings).push(w));
    return { warnings: warnings, notices: Array.from(new Set(notices)) };
  }
  function aboutLines(a, notices) {
    const lines = [];
    if (a.mode === 'oficial' && a.capturedAt) lines.push(t('chat.aboutOficial', { date: fmtDate(a.capturedAt) }));
    if (a.corpus) lines.push(t('corpus.answerNotice'));
    return lines.concat(notices);
  }
  function aboutHTML(a, notices) {
    const lines = aboutLines(a, notices);
    if (!lines.length) return '';
    return '<details class="about-answer"><summary>' + ICONS.info + '<span>' + esc(t('chat.about')) + (notices.length ? ' · ' + esc(t(notices.length === 1 ? 'chat.aboutNote' : 'chat.aboutNotes', { n: notices.length })) : '') + '</span></summary>' + list(lines) + '</details>';
  }
  function section(title, inner, cls) { return inner ? '<section class="ans-sec ' + (cls || '') + '"><h3>' + esc(title) + '</h3>' + inner + '</section>' : ''; }
  function callout(kind, html) { return '<div class="callout callout-' + kind + '">' + (kind === 'danger' ? ICONS.alert : kind === 'warn' ? ICONS.warn : ICONS.info) + '<div>' + html + '</div></div>'; }

  function answerHTML(a, m) {
    if (!a) return '';
    const isAI = a.mode === 'ai', isOficial = a.mode === 'oficial';
    let h = '';
    h += '<div class="mode-banner">' + ICONS.info + '<span>' + esc(isAI ? t('chat.aiBanner') : a.corpus ? t('corpus.answerBanner') : isOficial ? t('chat.oficialBanner') : t('chat.demoBanner')) + '</span></div>';
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
    if (a.sources && a.sources.length) h += '<section class="ans-sec"><details class="sources-disclosure"><summary><span>' + esc(isAI ? t('sections.sourcesAI') : t('sections.sources')) + '</span><svg class="sources-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"/></svg></summary><ol class="src-list">' + a.sources.map((s, i) => sourceCardHTML(s, i + 1, m, isAI)).join('') + '</ol></details></section>';
    else if (a.kind === 'answer' || a.kind === 'document') h += section(t('sections.sources'), '<p class="muted">' + esc(t('sections.noSources')) + '</p>');
    if (a.nextSteps && a.nextSteps.length) h += section(t('sections.next'), '<ol>' + a.nextSteps.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol>');
    h += letterHTML(a, m);
    if (a.limitNotice) h += callout('neutral', '<b>' + esc(t('sections.limit')) + '</b><br>' + esc(a.limitNotice.text) + (a.limitNotice.referrals && a.limitNotice.referrals.length ? list(a.limitNotice.referrals) : ''));
    const notes = answerNotes(a);
    if (notes.warnings.length) h += notes.warnings.map((w) => callout('warn', esc(w))).join('');
    h += aboutHTML(a, notes.notices);
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
    $$('[data-letter]', node).forEach((b) => b.addEventListener('click', () => writeLetter(m, conv)));
    const letterBody = $('[data-letter-body]', node);
    if (letterBody) letterBody.addEventListener('input', () => { m.letter.body = letterBody.value; const fill = $('[data-letter-fill]', node); if (fill) fill.innerHTML = letterFillHTML(letterBody.value); save(); });
    const letterShort = $('[data-letter-short]', node);
    if (letterShort) letterShort.addEventListener('input', () => { m.letter.shortText = letterShort.value; save(); });
    const letterCopy = $('[data-letter-copy]', node); if (letterCopy) letterCopy.addEventListener('click', () => copyText(letterFileText(m.letter), t('letter.copied')));
    const shortCopy = $('[data-letter-short-copy]', node); if (shortCopy) shortCopy.addEventListener('click', () => copyText(m.letter.shortText, t('letter.shortCopied')));
    const letterDownload = $('[data-letter-download]', node);
    if (letterDownload) letterDownload.addEventListener('click', () => {
      try { downloadText(t('letter.fileName') + '-' + new Date().toISOString().slice(0, 10) + '.txt', letterFileText(m.letter)); }
      catch (e) { copyText(letterFileText(m.letter), t('letter.copied')); }
    });
    const retry = $('[data-retry]', node); if (retry) retry.addEventListener('click', () => retryMessage(m, conv));
    const stop = $('[data-stop]', node); if (stop) stop.addEventListener('click', stopAnswer);
    $$('[data-quick]', node).forEach((b) => b.addEventListener('click', () => {
      const q = m.answer.quickReplies[Number(b.dataset.quick)];
      if (q.action === 'attach') pickFiles(); else if (q.send) submitMessage(q.send);
    }));
    $$('a.ref', node).forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); const target = document.getElementById(a.getAttribute('href').slice(1)); if (target) { const disclosure = target.closest('.sources-disclosure'); if (disclosure) disclosure.open = true; target.scrollIntoView({ behavior: 'smooth', block: 'center' }); target.style.outline = '2px solid var(--accent)'; setTimeout(() => { target.style.outline = ''; }, 1400); } }));
  }

  function answerToText(a, m) {
    const lines = [];
    const push = (title, items) => { if (!items || !items.length) return; lines.push('', title.toUpperCase()); items.forEach((x) => lines.push('- ' + x)); };
    lines.push('ROSS AI · ' + (a.mode === 'ai' ? t('chat.modeAI') : a.mode === 'oficial' ? t('chat.modeOficial') : t('chat.modeDemo')));
    lines.push(a.mode === 'ai' ? t('chat.aiBanner') : a.corpus ? t('corpus.answerBanner') : a.mode === 'oficial' ? t('chat.oficialBanner') : t('chat.demoBanner'));
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
        if (s.imported) { lines.push('[' + (i + 1) + '] ' + s.name + ' · ' + s.article + ' · ' + t('corpus.importedBadge') + ' · ' + s.corpusVersion + ' · ' + t('corpus.currency') + (httpURL(s.url) ? ' · ' + t('corpus.openSource') + ': ' + httpURL(s.url) : '') + ' · ' + t('corpus.openSnapshot') + ': ' + corpusRepoURL(s.repositoryPath, s.repositoryRef)); return; }
        if (s.lawId) { lines.push('[' + (i + 1) + '] ' + s.name + ' · ' + s.article + ' · ' + t('status.' + s.status) + ' · ' + s.url + ' · ' + t('source.captured') + ' ' + fmtDate(s.retrievedAt)); return; }
        const src = s.id ? sourceById(s.id) : null; lines.push('[' + (i + 1) + '] ' + (src ? L(src.name) : s.name) + (s.article ? ' · ' + s.article : '') + ' · ' + t('status.' + (a.mode === 'ai' ? 'unverified' : s.status)) + (src ? ' · ' + src.url + ' (' + t('source.fictional') + ')' : ''));
      });
    }
    if (a.nextSteps && a.nextSteps.length) { lines.push('', t('sections.next').toUpperCase()); a.nextSteps.forEach((x, i) => lines.push((i + 1) + '. ' + x)); }
    if (a.limitNotice) { lines.push('', t('sections.limit').toUpperCase(), a.limitNotice.text); (a.limitNotice.referrals || []).forEach((r) => lines.push('- ' + r)); }
    const notes = answerNotes(a);
    notes.warnings.forEach((w) => lines.push('', t('sections.attention') + ': ' + w));
    const about = aboutLines(a, notes.notices);
    if (about.length) { lines.push('', t('chat.about').toUpperCase()); about.forEach((x) => lines.push('- ' + x)); }
    lines.push('', t('composer.disclaimer'));
    return lines.join('\n');
  }
  function copyAnswer(m) { copyText(answerToText(m.answer, m), t('chat.copied')); }
  function copyText(text, done) {
    const fallback = () => {
      try {
        const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select();
        const ok = document.execCommand && document.execCommand('copy'); document.body.removeChild(ta);
        toast(ok ? done : t('chat.copyFailed'));
      } catch (e) { toast(t('chat.copyFailed')); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(() => toast(done), fallback);
    else fallback();
  }

  /* ---------- Carta de reclamação ----------
     Escrita pelo modelo só com os artigos já citados na resposta. Dados que a pessoa não informou viram campos entre
     colchetes, preenchidos por ela aqui mesmo: o que ela digita na carta fica neste navegador e não vai ao modelo. */
  const LETTER_HINT = /reclam|notifi|por escrito|carta|formal|procon|consumidor\.gov|protocol|e-?mail|complain|in writing|letter/i;
  function letterEligible(a) {
    if (!a || a.mode !== 'oficial' || a.kind !== 'answer' || (!API_URL && !sampleFn)) return false;
    if (!(a.sources || []).some((s) => s && s.excerpt && s.excerpt.trim())) return false;
    return LETTER_HINT.test([a.summary].concat(a.nextSteps || []).join(' '));
  }
  const PLACEHOLDER = /\[[^\[\]\n]{2,60}\]/g;
  function letterFillHTML(body) {
    const missing = Array.from(new Set(String(body || '').match(PLACEHOLDER) || []));
    if (!missing.length) return '<p class="muted">' + esc(t('letter.filled')) + '</p>';
    return '<p class="letter-fill-title">' + esc(t('letter.fill')) + '</p><ul class="letter-chips">' + missing.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>';
  }
  function letterHTML(a, m) {
    if (!m || !letterEligible(a)) return '';
    const l = m.letter;
    if (!l) return '<div class="letter-cta"><button type="button" class="btn btn-secondary btn-sm" data-letter>' + ICONS.doc + '<span>' + esc(t('letter.cta')) + '</span></button><p class="muted">' + esc(t('letter.ctaHint')) + '</p></div>';
    let inner;
    if (l.status === 'loading') inner = '<p class="muted" aria-live="polite">' + esc(t('letter.loading')) + '</p><div class="skeleton" aria-hidden="true"><span></span><span></span><span></span></div>';
    else if (l.status === 'unsuitable') inner = callout('neutral', esc(t('letter.unsuitable')) + (l.reason ? '<br>' + esc(l.reason) : ''));
    else if (l.status === 'error') inner = '<div class="error-card" role="alert"><p>' + esc(l.error || t('letter.error')) + '</p><div class="row"><button type="button" class="btn btn-secondary btn-sm" data-letter>' + esc(t('letter.retry')) + '</button></div></div>';
    else inner = callout('neutral', esc(t('letter.notice'))) +
      '<dl class="letter-meta">' + (l.recipient ? '<dt>' + esc(t('letter.to')) + '</dt><dd>' + esc(l.recipient) + '</dd>' : '') + (l.subject ? '<dt>' + esc(t('letter.subject')) + '</dt><dd>' + esc(l.subject) + '</dd>' : '') + '</dl>' +
      '<div class="letter-fill" data-letter-fill>' + letterFillHTML(l.body) + '</div>' +
      '<label class="letter-label" for="letter-' + esc(m.id) + '">' + esc(t('letter.bodyLabel')) + '</label>' +
      '<textarea id="letter-' + esc(m.id) + '" class="letter-text" rows="16" spellcheck="true" data-letter-body>' + esc(l.body) + '</textarea>' +
      '<div class="letter-actions"><button type="button" class="btn btn-sm" data-letter-copy>' + ICONS.copy + '<span>' + esc(t('letter.copy')) + '</span></button>' +
      '<button type="button" class="btn btn-secondary btn-sm" data-letter-download>' + esc(t('letter.download')) + '</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" data-letter>' + esc(t('letter.regenerate')) + '</button></div>' +
      (l.citations && l.citations.length ? '<p class="muted letter-basis">' + esc(t('letter.basedOn')) + ' ' + esc(l.citations.map((c) => c.article).join('; ')) + '</p>' : '') +
      (l.shortText ? '<label class="letter-label" for="letter-short-' + esc(m.id) + '">' + esc(t('letter.short')) + '</label>' +
        '<textarea id="letter-short-' + esc(m.id) + '" class="letter-text" rows="6" spellcheck="true" data-letter-short>' + esc(l.shortText) + '</textarea>' +
        '<div class="letter-actions"><button type="button" class="btn btn-secondary btn-sm" data-letter-short-copy>' + esc(t('letter.shortCopy')) + '</button></div>' : '') +
      (l.notes && l.notes.length ? '<p class="letter-fill-title">' + esc(t('letter.notes')) + '</p>' + list(l.notes) : '');
    return '<section class="ans-sec letter" data-letter-panel><h3>' + esc(t('letter.title')) + '</h3>' + inner + '</section>';
  }
  function letterPayload(m, conv) {
    const index = conv.messages.indexOf(m);
    const said = conv.messages.slice(0, index < 0 ? conv.messages.length : index).filter((x) => x.role === 'user' && x.text).slice(-4).map((x) => x.text).join('\n');
    const where = m.jurisdiction || { country: conv.country, region: conv.region };
    const sources = (m.answer.sources || []).filter((s) => s && s.excerpt && s.excerpt.trim()).slice(0, 8);
    return {
      lang: t('langName'), jurisdiction: jurisdictionLabel(where.country, where.region), question: said.slice(0, 3000),
      summary: String(m.answer.summary || '').slice(0, 1500), nextSteps: (m.answer.nextSteps || []).slice(0, 5),
      excerpts: sources.map((s) => ({ n: s.n, name: s.name, article: s.article, excerpt: s.excerpt.slice(0, 3000) })),
    };
  }
  function letterSample(payload) {
    return sampleFn.json([
      'Write a complaint letter for a person in Brazil, in ' + payload.lang + ', plain, respectful and firm. Use ONLY the law excerpts below as legal grounds and cite them by name; never cite anything else. Never invent facts: every missing detail (names, dates, amounts, numbers, addresses) is a placeholder in square brackets and capitals, such as [SEU NOME COMPLETO]. No threats, no promised outcome. If a written complaint is not appropriate (urgent risk, violence, crime, nobody to address), set suitable to false and explain in reason.',
      'Situation: ' + payload.question, 'Explanation already given: ' + payload.summary,
      'Excerpts:\n' + payload.excerpts.map((e) => '[' + e.n + '] ' + e.name + ' — ' + e.article + '\n' + e.excerpt).join('\n\n'),
      'Reply with ONLY one JSON object: {"suitable":boolean,"reason":string,"recipient":string,"subject":string,"body":string,"shortText":string (at most 900 characters, for a Procon form),"citations":[{"ref":number,"article":string}],"notes":[string] (up to 4 tips on sending and keeping proof)}.'
    ].join('\n\n'), { modelTier: 'default' });
  }
  /* Uma carta que chegue num bloco só ganha as quebras mínimas: assunto, saudação e despedida em linhas próprias. */
  function letterLayout(body) {
    if (/\n/.test(body)) return body;
    return body
      .replace(/\s*\b(Assunto|Ref(?:er[eê]ncia)?)\s*:/, '\n\n$1:')
      .replace(/\s*\b((?:Prezad[oa]s?|Car[oa]s?|Ilustr[ií]ssim[oa]s?)(?:\s+[^\s,.:]+){0,3}\s*[,:])\s*/, '\n\n$1\n\n')
      .replace(/\s*\b(Atenciosamente|Cordialmente|Respeitosamente)\b[,.]?\s*/, '\n\n$1,\n\n')
      .replace(/^\s+/, '');
  }
  function normalizeLetter(data, excerpts) {
    const text = (v, max) => (typeof v === 'string' ? v : '').slice(0, max);
    const body = letterLayout(text(data && data.body, 8000).trim());
    if (!body) throw { code: 'invalid_json' };
    const refs = new Set(excerpts.map((e) => e.n));
    return {
      status: 'done', recipient: text(data.recipient, 300), subject: text(data.subject, 300), body: body, shortText: text(data.shortText, 1500).trim(),
      citations: (Array.isArray(data.citations) ? data.citations : []).filter((c) => c && refs.has(Number(c.ref)) && typeof c.article === 'string').slice(0, 6).map((c) => ({ ref: Number(c.ref), article: c.article.slice(0, 120) })),
      notes: (Array.isArray(data.notes) ? data.notes : []).filter((x) => typeof x === 'string' && x.trim()).slice(0, 4).map((x) => x.slice(0, 300)),
      createdAt: Date.now(),
    };
  }
  function repaintMessage(m, conv) {
    const node = $('.msg[data-id="' + m.id + '"]');
    if (!node) return null;
    const fresh = renderMessage(m, conv); node.replaceWith(fresh); return fresh;
  }
  async function writeLetter(m, conv) {
    if (m.letter && m.letter.status === 'loading') return;
    m.letter = { status: 'loading' };
    repaintMessage(m, conv);
    try {
      const payload = letterPayload(m, conv);
      const data = sampleFn ? await letterSample(payload) : await apiCall('letter', payload, null);
      const letter = data && data.letter ? data.letter : data;
      m.letter = letter && letter.suitable === false ? { status: 'unsuitable', reason: String(letter.reason || '').slice(0, 600) } : normalizeLetter(letter, payload.excerpts);
    } catch (e) {
      m.letter = { status: 'error', error: e && e.code === 'rate_limited' ? t('errors.rate_limited') : t('letter.error') };
    }
    save();
    const node = repaintMessage(m, conv);
    const panel = node && $('[data-letter-panel]', node);
    if (panel && panel.scrollIntoView) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function letterFileText(l) {
    return [l.recipient ? t('letter.to') + ': ' + l.recipient : '', l.subject ? t('letter.subject') + ': ' + l.subject : '', '', l.body].filter((x, i) => x || i === 2).join('\n').replace(/^\n/, '');
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

  /* Explicação por IA: dentro do claude.ai usa a capacidade `sample` (conta de quem abre o artifact);
     fora dele, usa a API própria (função de backend configurada em config.js). */
  let sampleFn = null;
  const API_URL = (window.ROSS_CONFIG && window.ROSS_CONFIG.apiUrl) || '';
  const API_MEDIA = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
  function aiBackend() { return sampleFn ? 'sample' : (API_URL ? 'api' : null); }
  async function probeAI() {
    try {
      if (window.claude && typeof window.claude.use === 'function') {
        const s = await window.claude.use('sample');
        if (s) { sampleFn = s; try { state.aiLimits = await s.limits(); } catch (e) { state.aiLimits = null; } }
      }
    } catch (e) { /* indisponível */ }
    state.aiAvailable = !!aiBackend();
    if (['settings', 'home'].includes(state.view)) render({ keep: true });
  }
  function fileToBase64(file) {
    return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result).split(',')[1] || ''); r.onerror = () => reject(r.error); r.readAsDataURL(file); });
  }
  /* O Supabase encerra cada servidor depois de 150 s de vida, mesmo no meio de uma resposta (546, que chega ao navegador
     como falha de rede por não trazer CORS), e o servidor recusa na hora quando está perto disso (worker_recycling).
     Nos dois casos as chamadas ao modelo tentam mais uma vez, já em um servidor novo. */
  const MODEL_OPS = ['prepare', 'answer', 'letter'];
  function waitFor(ms, signal) {
    return new Promise((resolve, reject) => {
      if (signal && signal.aborted) return reject({ code: 'cancelled' });
      const timer = setTimeout(resolve, ms);
      if (signal) signal.addEventListener('abort', () => { clearTimeout(timer); reject({ code: 'cancelled' }); }, { once: true });
    });
  }
  /* Com onText, a resposta chega em partes: cada pedaço do texto que o modelo escreve é repassado assim que chega, e
     onText(null) avisa que o texto parcial deve ser descartado (nova tentativa). */
  async function apiCall(op, payload, signal, attempt, onText) {
    if (op === 'process_lookup' && !API_URL) throw { code: 'process_not_configured' };
    const retryable = !attempt && MODEL_OPS.includes(op);
    const streaming = op === 'answer' && typeof onText === 'function';
    let res;
    try {
      res = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ op: op }, payload, streaming ? { stream: true } : {})), signal: signal });
    } catch (e) {
      if (signal && signal.aborted) throw { code: 'cancelled' };
      if (retryable) return apiCall(op, payload, signal, 1, onText);
      throw { code: 'api_error', message: String(e && e.message || e) };
    }
    if (streaming && res.ok && /ndjson/.test(res.headers.get('content-type') || '')) {
      try { return await readAnswerStream(res, onText, signal); }
      catch (e) {
        if (!e || e.code !== 'stream_broken') throw e;
        onText(null);
        if (retryable) return apiCall(op, payload, signal, 1, onText);
        throw { code: 'api_error', message: 'stream_broken' };
      }
    }
    let data = null; try { data = await res.json(); } catch (e) { data = null; }
    if (res.status === 503 && data && data.error === 'worker_recycling') {
      if (!retryable) throw { code: 'worker_recycling' };
      await waitFor(Math.min(30000, Math.max(1000, Number(data.retryAfterMs) || 5000)), signal);
      return apiCall(op, payload, signal, 1, onText);
    }
    if (res.status === 546 && retryable) return apiCall(op, payload, signal, 1, onText);
    if (res.status === 429) throw { code: 'rate_limited' };
    if (res.status === 503 && data && data.error === 'api_not_configured') throw { code: 'api_not_configured' };
    if (res.status === 503 && data && data.error === 'quota_unavailable') throw { code: 'quota_unavailable' };
    if (!res.ok && op === 'process_lookup' && data && data.error === 'unknown_op') throw { code: 'process_not_configured' };
    if (!res.ok && data && typeof data.error === 'string' && /^process_(?:not_configured|credentials|credits|not_found|restricted|invalid_number|invalid_page|unavailable)$/.test(data.error)) throw { code: data.error };
    if (!res.ok) throw { code: 'api_error', message: data && data.error ? data.error : 'HTTP ' + res.status };
    if (data && data.error) throw { code: data.error === 'refusal' ? 'refusal' : data.error === 'invalid_json' ? 'invalid_json' : 'api_error', message: data.error };
    return data;
  }
  /* Lê a resposta em partes (uma linha JSON por evento). Sem o evento final, a conexão caiu no meio (por exemplo,
     servidor encerrado pelo limite de tempo): conta como falha que pode ser repetida. */
  async function readAnswerStream(res, onText, signal) {
    const reader = res.body.getReader(); const decoder = new TextDecoder();
    let buffer = '', final = null;
    const handle = (line) => {
      if (!line.trim()) return;
      let event; try { event = JSON.parse(line); } catch (e) { return; }
      if (event && event.t === 'd' && typeof event.x === 'string') onText(event.x);
      else if (event && (event.t === 'done' || event.t === 'error')) final = event;
    };
    try {
      for (;;) {
        const part = await reader.read();
        if (part.done) break;
        buffer += decoder.decode(part.value, { stream: true });
        let end;
        while ((end = buffer.indexOf('\n')) >= 0) { handle(buffer.slice(0, end)); buffer = buffer.slice(end + 1); }
      }
      buffer += decoder.decode(); handle(buffer);
    } catch (e) {
      if (signal && signal.aborted) throw { code: 'cancelled' };
      throw { code: 'stream_broken' };
    }
    if (!final) throw { code: 'stream_broken' };
    if (final.t === 'error') throw final.error === 'rate_limited' ? { code: 'rate_limited' } : { code: 'api_error', message: final.error };
    if (final.error) throw { code: final.error === 'refusal' ? 'refusal' : final.error === 'invalid_json' ? 'invalid_json' : 'api_error', message: final.error };
    return final;
  }
  /* Do JSON ainda incompleto que o modelo escreve, o texto já disponível do campo "summary" (Em resumo). */
  function partialSummary(raw) {
    const match = /"summary"\s*:\s*"((?:[^"\\]|\\.)*)/.exec(raw || '');
    if (!match) return '';
    const text = match[1].replace(/\\u[0-9a-fA-F]{0,3}$/, '');
    try { return JSON.parse('"' + text + '"'); } catch (e) { return text; }
  }
  function summaryStream(onPartial) {
    if (typeof onPartial !== 'function') return undefined;
    let raw = '';
    return (delta) => { raw = delta === null ? '' : raw + delta; onPartial(partialSummary(raw)); };
  }
  /* Prazo próprio para uma etapa opcional: vencido, a etapa é abandonada sem cancelar a pergunta inteira. */
  const MODEL_WAIT_MS = { prepare: 8000, relevance: 10000 };
  function deadlineSignal(parent, ms) {
    const ctl = new AbortController();
    const abort = () => ctl.abort();
    const timer = setTimeout(abort, ms);
    if (parent) { if (parent.aborted) ctl.abort(); else parent.addEventListener('abort', abort, { once: true }); }
    return { signal: ctl.signal, done() { clearTimeout(timer); if (parent) parent.removeEventListener('abort', abort); } };
  }
  async function apiAttachments(attachments) {
    const out = [];
    for (const f of (attachments || [])) {
      if (!f.file || !API_MEDIA.includes(f.type) || f.size > 20 * 1024 * 1024) { out.push({ name: f.name, mediaType: f.type, data: '' }); continue; }
      out.push({ name: f.name, mediaType: f.type, data: await fileToBase64(f.file) });
    }
    return out;
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
    async respond({ text, attachments, conv, onStep, onPartial, signal }) {
      if (!sampleFn && API_URL) {
        onStep(0);
        const history = historyForModel(conv, text || '');
        const files = await apiAttachments(attachments);
        onStep(1);
        const res = await apiCall('answer', { lang: t('langName'), jurisdiction: jurisdictionLabel(conv.country, conv.region), question: plainAnswerQuestion(text || ''), history: history, excerpts: [], attachments: files }, signal, 0, summaryStream(onPartial));
        onStep(2);
        const d = res.answer || {};
        if (Array.isArray(d.mentions) && d.mentions.length && !(Array.isArray(d.sources) && d.sources.length)) d.sources = d.mentions.map((m) => ({ name: m.name, article: m.article, status: 'unverified' }));
        return normalizeAI(d, attachments);
      }
      if (!sampleFn) throw { code: 'unavailable' };
      onStep(0);
      const history = priorTurns(conv, text || '');
      const transcript = history.map((m) => (m.role === 'user' ? 'PERSON: ' : 'ROSS AI: ') + turnText(m)).join('\n');
      const limits = state.aiLimits;
      const imgTypes = limits && limits.images && limits.images.mediaTypes ? limits.images.mediaTypes : [];
      const images = [], unread = [];
      (attachments || []).forEach((f) => { if (f.file && imgTypes.includes(f.type)) images.push(f.file); else unread.push(f.name); });
      if (limits && limits.images && limits.images.maxCount && images.length > limits.images.maxCount) images.length = limits.images.maxCount;
      let prompt = aiInstructions(conv) + '\n\n';
      if (transcript) prompt += 'CONVERSATION SO FAR:\n' + transcript + '\n\n';
      if (images.length) prompt += 'The attached image(s) are pages of a document the person wants to understand.\n';
      if (unread.length) prompt += 'The person attached file(s) that cannot be read in this version: ' + unread.join(', ') + '. Say so and ask them to paste the relevant text or attach an image.\n';
      prompt += 'NEW MESSAGE FROM THE PERSON:\n' + plainAnswerQuestion(text || '(no text, only attachment)');
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
  /* Versão dos arquivos publicados (carimbada pelo fluxo de publicação); evita cache antigo após cada atualização. */
  const ASSET_VERSION = (() => { const m = document.querySelector('meta[name="ross-version"]'); const v = m ? m.getAttribute('content') || '' : ''; return /^__/.test(v) ? '' : v; })();
  function versioned(path) { return ASSET_VERSION ? path + (path.includes('?') ? '&' : '?') + 'v=' + encodeURIComponent(ASSET_VERSION) : path; }
  async function sourceJSON(path) {
    const embedded = window.ROSS_EMBEDDED_DATA;
    if (embedded && Object.prototype.hasOwnProperty.call(embedded, path)) return embedded[path];
    const res = await fetch(versioned(path));
    if (!res.ok) throw { code: 'law_fetch', message: 'HTTP ' + res.status };
    return res.json();
  }
  let catalogLoading = null;
  function loadCatalog() {
    if (catalogLoading) return catalogLoading;
    catalogLoading = (async () => {
      try {
        state.catalog = await sourceJSON('data/catalog.json');
        try { state.lawPending = await sourceJSON('data/pending.json'); } catch (e) { state.lawPending = null; }
      } catch (e) { state.catalog = null; }
      finally { catalogLoading = null; }
      if (['home', 'settings', 'sources'].includes(state.view)) render({ keep: true });
    })();
    return catalogLoading;
  }
  /* O modo escolhido é mantido: se a base ainda não carregou, espera; se falhou, tenta de novo
     e, persistindo a falha, devolve um erro com nova tentativa em vez de usar a demonstração. */
  async function ensureCatalog() {
    if (state.catalog) return state.catalog;
    await loadCatalog();
    if (!state.catalog) await loadCatalog();
    if (!state.catalog) throw { code: 'catalog_unavailable' };
    return state.catalog;
  }
  async function loadLaw(entry) {
    if (lawCache[entry.id]) return lawCache[entry.id];
    const raw = await sourceJSON('data/' + entry.file);
    const law = Object.assign({}, raw, { articles: raw.articles.map((article) => Object.assign({}, article, {
      text: repairEncoding(article.text), heading: repairEncoding(article.heading), label: repairEncoding(article.label)
    })) });
    lawCache[entry.id] = law; return law;
  }
  function repairEncoding(value) {
    let text = String(value || '');
    const cp1252 = '€\u0081‚ƒ„…†‡ˆ‰Š‹Œ\u008dŽ\u008f\u0090‘’“”•–—˜™š›œ\u009džŸ';
    const pattern = /[\u00c2-\u00f4](?:[\u0080-\u00bf]|[€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]){1,3}/g;
    for (let pass = 0; pass < 3; pass++) {
      const repaired = text.replace(pattern, (run) => {
        const encoded = Array.from(run).map((char) => {
          const index = cp1252.indexOf(char);
          const byte = index < 0 ? char.charCodeAt(0) : 128 + index;
          return '%' + byte.toString(16).padStart(2, '0');
        }).join('');
        try { return decodeURIComponent(encoded); } catch (e) { return run; }
      });
      if (repaired === text) break;
      text = repaired;
    }
    return text;
  }
  const norm = (s) => repairEncoding(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const STOP = new Set('a o os as um uma uns umas de do da dos das em no na nos nas por para com sem sob sobre e ou que se nao ao aos sao ser foi esta estao estou meu minha meus minhas seu sua seus suas este isto esse essa isso aquele aquela aquilo ele ela eles elas eu voce nos lhe me te como quando onde qual quais quem mais menos muito pouco ja tambem so pode posso poderia devo deve dever tenho tem ter ha fazer faco faz fiz era sendo sido pelo pela pelos pelas num numa dele dela deles delas ate entre apos antes depois ainda mesmo mesma outro outra outros outras todo toda todos todas qualquer caso casos sobre sim nao the of and to in is it my can what how does this that for with about are was were have has been'.split(' '));
  /* Apply the same normalization to queries and article words. Substring
     matches such as "bat" in "batedores" are not evidence of relevance. */
  function stem(w) {
    if (w.length > 5 && /oes$/.test(w)) w = w.slice(0, -3) + 'ao';
    if (w.length > 4 && /ns$/.test(w)) w = w.slice(0, -2) + 'm';
    if (w.length > 3 && /s$/.test(w)) w = w.slice(0, -1);
    if (w.length > 6 && /(ando|endo|indo|ados|idos|ada|ado|ida|ido|aram|eram|iram|arei|erei|irei)$/.test(w)) w = w.replace(/(ando|endo|indo|ados|idos|ada|ado|ida|ido|aram|eram|iram|arei|erei|irei)$/, '');
    else if (w.length > 5 && /(ar|er|ir|ou|ei|eu|iu)$/.test(w)) w = w.slice(0, -2);
    if (w.length > 6 && /(cao|sao|mente|dade|ncia)$/.test(w)) w = w.replace(/(cao|sao|mente|dade|ncia)$/, '');
    return w;
  }
  /* Expressões do dia a dia → termos usados nas normas. Aplicadas antes da busca. */
  const SYN = [
    ['bafometro', 'alcool alcoolemia etilometro influencia'], ['carteira de motorista', 'habilitacao cnh'], ['carteira', 'habilitacao'], ['motorista', 'condutor'], ['multa de transito', 'infracao penalidade'],
    ['demitid', 'rescisao dispensa aviso previo'], ['demissao', 'rescisao dispensa aviso previo'], ['mandado embora', 'rescisao dispensa'], ['patrao', 'empregador'], ['chefe', 'empregador'], ['empresa', 'empregador fornecedor'],
    ['hora extra', 'jornada suplementar horas extras'], ['salario', 'remuneracao'], ['carteira assinada', 'registro contrato de trabalho ctps'], ['nome sujo', 'cadastro inadimplentes'], ['negativad', 'cadastro inadimplentes'], ['serasa', 'cadastro inadimplentes'], ['spc', 'cadastro inadimplentes'],
    ['aluguel', 'locacao'], ['alugar', 'locacao'], ['inquilino', 'locatario'], ['dono do imovel', 'locador'], ['proprietario', 'locador'], ['despejo', 'desocupacao'],
    ['loja', 'fornecedor'], ['golpe', 'estelionato fraude'], ['roubo', 'furto roubo'], ['roubaram', 'furto roubo'], ['pensao', 'alimentos'], ['heranca', 'sucessao'], ['aposentar', 'aposentadoria'], ['inss', 'previdencia beneficio segurado'],
    ['plano de saude', 'operadora cobertura'], ['cancelar', 'rescisao cancelamento'], ['devolver', 'devolucao restituicao arrependimento'], ['comprei', 'compra consumidor fornecedor'], ['internet', 'distancia eletronico'],
    ['escola', 'ensino educacao'], ['preso', 'prisao flagrante'], ['barulho', 'sossego perturbacao'], ['vizinho', 'vizinhanca'], ['cachorro', 'animal'], ['gato', 'animal'], ['defeito', 'vicio'], ['troca', 'substituicao'], ['juros', 'mora'],
    ['filho', 'filhos menor crianca'], ['marido', 'conjuge'], ['esposa', 'conjuge'], ['divorcio', 'divorcio dissolucao'], ['uniao estavel', 'entidade familiar convivencia duradoura publica continua familia'], ['visita', 'convivencia'], ['guarda', 'guarda'], ['celular', 'produto aparelho'], ['notebook', 'produto aparelho'], ['computador', 'produto aparelho'], ['geladeira', 'produto'], ['televisao', 'produto'], ['foto', 'imagem'], ['video', 'imagem']
  ];
  function expandQuery(q) {
    const n = norm(q); const extra = [];
    SYN.forEach(([k, v]) => { if (n.includes(k)) extra.push(v); });
    return q + ' ' + extra.join(' ');
  }
  function tokensOf(s) { return Array.from(new Set(norm(s).replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)).map(stem).filter((w) => w.length > 2))); }
  // Match whole terms: the environmental registry acronym CAR must not match
  // "carro", and generic keyword counts must not discard the model's law IDs.
  function containsTerm(text, term) {
    const value = norm(term).trim().replace(/\s+/g, ' ');
    if (!value) return false;
    const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp('(^|[^a-z0-9])' + escaped + '($|[^a-z0-9])').test(norm(text).replace(/\s+/g, ' '));
  }
  /* Rotas por assunto: para perguntas comuns, garantem que os artigos que decidem o caso cheguem à explicação, mesmo
     quando o preparo por IA falha. Cada rota diz quais leis carregar (laws), termos extras de busca (terms), trechos
     que acompanham a seleção (focus, expressões sobre o texto sem acentos), referências do acervo completo
     (references) e artigos superados que não devem ser usados naquele assunto (exclude). A ordem importa: a primeira
     rota que reconhece a pergunta vale. Os trechos foram conferidos nos textos oficiais de data/laws. */
  const RENT = /\b(?:alug\w*|locac\w*|inquilin\w*|locador\w*|locatari\w*)\b/;
  // Pergunta sobre a lei de outro país: nenhuma rota de lei brasileira se aplica.
  const FOREIGN = /\b(?:portugal|estados unidos|eua|exterior|estrangeir\w*|outro pais|italia|espanha|franca|alemanha|argentina|japao|inglaterra|canada)\b/;
  const TOPICS = [
    /* Ofensa por raça ou cor: injúria racial da Lei 7.716 (2 a 5 anos); o art. 140 do Código Penal ficou para as outras
       injúrias. Vem primeiro: "fui xingado no trabalho" com ofensa racista é crime, não só motivo de rescisão. */
    { id: 'injuria-racial', test: (q) => /\b(?:racis\w*|racial|raca|cor da pele|macaco|etnia)\b/.test(q),
      laws: ['l7716'],
      terms: 'injuriar alguém ofendendo-lhe a dignidade ou o decoro em razão de raça cor etnia ou procedência nacional reclusão de dois a cinco anos',
      focus: { l7716: [/injuriar alguem, ofendendo-lhe a dignidade ou o decoro, em razao de raca/] },
      exclude: { del2848: ['140'] } },
    /* Acidente de trabalho e humilhação no emprego vêm antes da demissão: "posso ser demitido?" não é sobre verbas. */
    { id: 'acidente-trabalho', test: (q) => /\bacidente (?:de|do|no) trabalho\b|\bacidente de trajeto\b/.test(q),
      laws: ['l8213', 'del5452'],
      terms: 'acidente do trabalho estabilidade doze meses manutenção do contrato de trabalho cessação do auxílio-doença acidentário',
      focus: { l8213: [/tem garantida, pelo prazo minimo de doze meses, a manutencao do seu contrato de trabalho/] } },
    { id: 'rescisao-indireta', test: (q) => /\b(?:humilh\w*|assedi\w*|rescisao indireta|rigor excessivo|xing\w*|grita\w*|ofend\w*)\b/.test(q) && /\b(?:chefe|patrao|patroa|empresa|gerente|supervisor\w*|encarregad\w*|emprego|trabalho|superior)\b/.test(q),
      laws: ['del5452'],
      terms: 'rescisão indireta considerar rescindido o contrato pleitear a devida indenização rigor excessivo ato lesivo da honra e boa fama',
      focus: { del5452: [/o empregado podera considerar rescindido o contrato e pleitear a devida indenizacao/] } },
    // Estágio (Lei 11.788): jornada máxima e recesso. O estágio probatório do servidor é outro assunto.
    { id: 'estagio', test: (q) => /\bestagi\w*/.test(q) && !/\bprobatori\w*/.test(q),
      laws: ['l11788'],
      terms: 'jornada de atividade em estágio seis horas diárias trinta horas semanais recesso de trinta dias duração igual ou superior a um ano bolsa auxílio-transporte',
      focus: { l11788: [/6 \(seis\) horas diarias e 30 \(trinta\) horas semanais/, /periodo de recesso de 30 \(trinta\) dias/] } },
    { id: 'intervalo', test: (q) => /\b(?:intervalo|almoco|refeicao)\b/.test(q) && /\b(?:trabalh\w*|empresa|jornada|horas?|expediente)\b/.test(q),
      laws: ['del5452'],
      terms: 'intervalo para repouso ou alimentação no mínimo uma hora não poderá exceder duas horas trabalho contínuo seis horas',
      focus: { del5452: [/e obrigatoria a concessao de um intervalo para repouso ou alimentacao/] } },
    { id: 'divorcio', test: (q) => /\bdivorci\w*/.test(q),
      laws: ['cf88', 'l13105', 'l10406'],
      terms: 'divórcio casamento civil dissolvido escritura pública divórcio consensual filhos incapazes',
      focus: { cf88: [/o casamento civil pode ser dissolvido pelo divorcio/], l13105: [/o divorcio consensual, a separacao consensual e a extincao consensual de uniao estavel/] } },
    { id: 'uniao-estavel', test: (q) => /\buniao estavel\b|\b(?:moro|moramos|vivo|vivemos|morando)\b.{0,20}\b(?:junto|juntos|com (?:o |a )?(?:meu|minha) (?:namorad|companheir)\w*)/.test(q),
      laws: ['l10406', 'l9278'],
      terms: 'união estável convivência pública contínua duradoura constituição de família comunhão parcial de bens contrato escrito companheiros',
      focus: { l10406: [/configurada na convivencia publica, continua e duradoura/, /salvo contrato escrito entre os companheiros/] } },
    { id: 'inventario', test: (q) => /\binventario\b|\bpartilha\b/.test(q),
      laws: ['l13105', 'l10406'],
      terms: 'inventário partilha instaurado dentro de dois meses abertura da sucessão doze meses escritura pública todos capazes e concordes',
      focus: { l13105: [/deve ser instaurado dentro de 2 \(dois\) meses/, /se todos forem capazes e concordes, o inventario e a partilha poderao ser feitos por escritura publica/] } },
    { id: 'heranca', test: (q) => /\b(?:heranca|herdeir\w*|herdar|herda|testamento|deixar (?:os |meus )?bens)\b/.test(q) && !FOREIGN.test(q),
      laws: ['l10406'],
      terms: 'sucessão legítima descendentes em concorrência com o cônjuge ascendentes herdeiros necessários metade da herança legítima testador',
      focus: { l10406: [/a sucessao legitima defere-se na ordem seguinte/, /o testador so podera dispor da metade da heranca/, /sao herdeiros necessarios os descendentes, os ascendentes e o conjuge/, /pertence aos herdeiros necessarios, de pleno direito, a metade dos bens/] },
      focusLimit: 3 },
    /* A casa onde a família mora não pode ser tomada por dívida (Lei 8.009), salvo as exceções do art. 3º. Vem antes do
       superendividamento ("muitas dívidas") e deixa de fora o imóvel financiado, que segue a alienação fiduciária. */
    { id: 'bem-de-familia', test: (q) => /\bbem de familia\b|\bimpenhora\w*/.test(q) || (/\b(?:penhor\w*|tomar|tomam|tomem|perder|perco|leiloar|leilao|levar)\b.{0,40}\b(?:casa|imovel|apartamento)\b/.test(q) && /\b(?:dividas?|devendo|devo|credor\w*|banco|execuc\w*|cobranc\w*)\b/.test(q) && !/\bfinanci\w*/.test(q)),
      laws: ['l8009'],
      terms: 'imóvel residencial próprio do casal ou da entidade familiar impenhorável não responderá por qualquer tipo de dívida impenhorabilidade oponível salvo se movido',
      focus: { l8009: [/o imovel residencial proprio do casal, ou da entidade familiar, e impenhoravel/, /a impenhorabilidade e oponivel em qualquer processo de execucao/] } },
    { id: 'prescricao-divida', test: (q) => /\b(?:divida|debito|cobranc\w*|nome sujo|negativad\w*)\b/.test(q) && /\b(?:prescri\w*|caduc\w*|(?:\d+|cinco|seis|sete|oito|nove|dez) anos(?: atras)?|antiga|velha)\b/.test(q),
      laws: ['l8078', 'l10406'],
      terms: 'prescrição cinco anos dívidas líquidas cobrança cadastros informações negativas período superior a cinco anos proteção ao crédito',
      focus: { l8078: [/nao podendo conter informacoes negativas referentes a periodo superior a cinco anos/, /consumada a prescricao relativa a cobranca de debitos do consumidor/], l10406: [/a pretensao de cobranca de dividas liquidas constantes de instrumento publico ou particular/] } },
    { id: 'venda-casada', test: (q) => /\bvenda casada\b|\bso (?:libera|aprova|vende|faz|empresta|instala)\b.{0,60}\bse (?:eu )?(?:contratar|comprar|fizer|assinar|levar)\b|\bobrigad[oa] a (?:contratar|comprar|levar)\b/.test(q),
      laws: ['l8078'],
      terms: 'prática abusiva condicionar o fornecimento de produto ou de serviço ao fornecimento de outro produto ou serviço venda casada',
      focus: { l8078: [/condicionar o fornecimento de produto ou de servico ao fornecimento de outro produto ou servico/] } },
    { id: 'superendividamento', test: (q) => /\bsuperendivid\w*|\b(?:muitas|tantas|varias) dividas\b|\bnao consigo pagar\b.{0,50}\bdividas?\b|\bdividas?\b.{0,60}\bnao (?:consigo|da para|da pra) pagar\b/.test(q),
      laws: ['l8078'],
      terms: 'superendividamento mínimo existencial repactuação de dívidas plano de pagamento prazo máximo de cinco anos audiência conciliatória credores',
      focus: { l8078: [/entende-se por superendividamento a impossibilidade manifesta/, /o juiz podera instaurar processo de repactuacao de dividas/] } },
    { id: 'cobranca-vexatoria', test: (q) => /\bcobran\w*|\bcobra(?:r|m|ndo)?\b/.test(q) && /\b(?:trabalho|colegas|vizinhos|parentes|familia|expo\w*|constrang\w*|ameac\w*|humilh\w*|vergonha|ridiculo|madrugada)\b/.test(q),
      laws: ['l8078'],
      terms: 'cobrança de débitos consumidor inadimplente exposto a ridículo constrangimento ameaça interfira com seu trabalho descanso ou lazer',
      focus: { l8078: [/o consumidor inadimplente nao sera exposto a ridiculo/, /que exponha o consumidor, injustificadamente, a ridiculo ou interfira com seu trabalho/] } },
    { id: 'condominio-taxa', test: (q) => /\bcondominio\b/.test(q) && /\b(?:atras\w*|multa|juros|devendo|nao paguei|inadimpl\w*|taxa)\b/.test(q),
      laws: ['l10406', 'l4591'],
      terms: 'condômino que não pagar a sua contribuição multa de até dois por cento juros moratórios correção monetária',
      focus: { l10406: [/o condomino que nao pagar a sua contribuicao ficara sujeito/] } },
    { id: 'idoso-transporte', test: (q) => /\b(?:idos[oa]s?|terceira idade|(?:6\d|7\d|8\d|9\d) anos)\b/.test(q) && /\b(?:onibus|transporte|passagem|metro|trem|lotacao)\b/.test(q),
      laws: ['l10741'],
      terms: 'gratuidade dos transportes coletivos públicos urbanos e semiurbanos maiores de sessenta e cinco anos documento pessoal prova de sua idade',
      focus: { l10741: [/aos maiores de 65 \(sessenta e cinco\) anos fica assegurada a gratuidade dos transportes coletivos/] } },
    { id: 'idoso-abandono', test: (q) => /\b(?:idos[oa]s?|terceira idade)\b/.test(q) && /\b(?:abandon\w*|maus[ -]tratos|neglig\w*|largad[oa]s?)\b/.test(q),
      laws: ['l10741'],
      terms: 'abandonar a pessoa idosa em hospitais casas de saúde entidades de longa permanência não prover suas necessidades básicas detenção',
      focus: { l10741: [/abandonar a pessoa idosa em hospitais, casas de saude/] } },
    /* O art. 60 do ECA (14 anos) é anterior à Emenda 20/1998: a idade mínima hoje é a da Constituição, 16 anos. */
    { id: 'trabalho-infantil', test: (q) => /\b(?:filh[oa]s?|adolescentes?|menor(?:es)?|criancas?|jove(?:m|ns)|garot[oa]s?)\b/.test(q) && /\b(?:trabalh\w*|emprego|aprendiz\w*)\b/.test(q) && /\b(?:1[0-7]|quatorze|catorze|quinze|dezesseis|dezessete) anos\b|\bmenor de idade\b|\bidade (?:minima|para trabalhar)\b/.test(q),
      laws: ['cf88', 'l8069', 'del5452'],
      terms: 'proibição de trabalho noturno perigoso ou insalubre a menores de dezoito qualquer trabalho a menores de dezesseis anos aprendiz a partir de quatorze anos',
      focus: { cf88: [/qualquer trabalho a menores de dezesseis anos, salvo na condicao de aprendiz, a partir de quatorze anos/] },
      exclude: { l8069: ['60'] } },
    { id: 'castigo-fisico', test: (q) => /\b(?:bater|bate|palmadas?|chinelad\w*|surra|castigo fisico|castigar|apanhar)\b/.test(q) && /\b(?:filh\w*|criancas?|entead\w*|net[oa]s?|adolescentes?)\b/.test(q) && !/\b(?:marido|esposo|companheiro|namorado|ex)\b/.test(q),
      laws: ['l8069', 'l14344'],
      terms: 'castigo físico tratamento cruel ou degradante educados e cuidados conselho tutelar advertência encaminhamento programa de proteção à família',
      focus: { l8069: [/tem o direito de ser educados e cuidados sem o uso de castigo fisico/, /estarao sujeitos, sem prejuizo de outras sancoes cabiveis, as seguintes medidas/] } },
    { id: 'usucapiao', test: (q) => /\busucapi\w*/.test(q) || /\b(?:moro|morando|vivo|ocupo|ocupando)\b.{0,80}\b(?:nao e (?:minha|meu)|sem escritura|sem documento|de outra pessoa|abandonad\w*|ninguem reclam\w*)\b/.test(q),
      laws: ['cf88', 'l10406', 'l6015'],
      terms: 'usucapião área urbana de até duzentos e cinquenta metros quadrados cinco anos ininterruptamente sem oposição moradia não seja proprietário de outro imóvel',
      focus: { cf88: [/aquele que possuir como sua area urbana de ate duzentos e cinquenta metros quadrados/], l10406: [/aquele que possuir, como sua, area urbana de ate duzentos e cinquenta metros quadrados/] } },
    // Salário-maternidade do INSS e licença da CLT: 120 dias. Vem antes da rota da gestante demitida.
    { id: 'maternidade', test: (q) => /\b(?:salario|licenca)[ -]maternidade\b/.test(q) || (/\b(?:bebe|parto|nascimento)\b/.test(q) && /\b(?:inss|licenca|afastamento|beneficio|quanto tempo)\b/.test(q)),
      laws: ['l8213', 'del5452'],
      terms: 'salário-maternidade devido à segurada durante cento e vinte dias início entre vinte e oito dias antes do parto e a data de ocorrência deste licença-maternidade',
      focus: { l8213: [/o salario-maternidade e devido a segurada da previdencia social, durante 120/], del5452: [/a empregada gestante tem direito a licenca-maternidade de 120/] } },
    { id: 'creche', test: (q) => /\b(?:creches?|pre-escola|pre escola|educacao infantil)\b/.test(q) || (/\bvagas?\b/.test(q) && /\b(?:escolas?|colegio)\b/.test(q)),
      laws: ['cf88', 'l8069', 'l9394'],
      terms: 'dever do Estado educação infantil em creche e pré-escola às crianças até cinco anos de idade atendimento em creche direito público subjetivo',
      focus: { cf88: [/educacao infantil, em creche e pre-escola, as criancas ate 5/], l8069: [/atendimento em creche e pre-escola as criancas de zero a cinco anos/] } },
    { id: 'voto', test: (q) => /\b(?:votar|voto|eleitor\w*|alistamento eleitoral)\b/.test(q) && /\b(?:obrigad\w*|obrigatori\w*|facultativ\w*|preciso|tenho que|idade|anos)\b/.test(q),
      laws: ['cf88', 'l4737'],
      terms: 'alistamento eleitoral e o voto obrigatórios para os maiores de dezoito anos facultativos para os analfabetos maiores de setenta anos maiores de dezesseis e menores de dezoito anos',
      focus: { cf88: [/o alistamento eleitoral e o voto sao:/] } },
    { id: 'acesso-informacao', test: (q) => /\bacesso a informac\w*|\blai\b/.test(q) || (/\b(?:pedi|pedido|solicitei|requeri)\b.{0,30}\binformac\w*/.test(q) && /\b(?:prefeitura|orgao publico|governo|secretaria|ministerio|camara municipal|autarquia|universidade publica)\b/.test(q)),
      laws: ['l12527'],
      terms: 'pedido de acesso à informação acesso imediato prazo não superior a vinte dias prorrogado por mais dez dias mediante justificativa expressa',
      focus: { l12527: [/em prazo nao superior a 20 \(vinte\) dias/, /podera ser prorrogado por mais 10 \(dez\) dias/] } },
    { id: 'maus-tratos-animais', test: (q) => /\b(?:maus[ -]tratos?|maltrat\w*|crueldade|abandon\w*|envenen\w*)\b/.test(q) && /\b(?:animal|animais|cachorr\w*|cao|caes|gat[oa]s?|cavalos?|bichos?|pets?)\b/.test(q),
      laws: ['l9605'],
      terms: 'praticar ato de abuso maus-tratos ferir ou mutilar animais silvestres domésticos ou domesticados cão ou gato reclusão de dois a cinco anos multa e proibição da guarda',
      focus: { l9605: [/praticar ato de abuso, maus-tratos, ferir ou mutilar animais/, /quando se tratar de cao ou gato/] } },
    /* Ameaça (CP, art. 147). A do parceiro ou ex fica com a rota da violência doméstica; a do cobrador, com a da cobrança.
       O art. 147-C (ameaça no contexto do crime organizado, Lei 15.358/2026) não é o caso comum e fica de fora. */
    { id: 'ameaca', test: (q) => /\bameac\w*/.test(q) && !/\b(?:marido|esposo|companheir[oa]|namorad[oa]|ex)\b/.test(q),
      laws: ['del2848'],
      terms: 'ameaçar alguém por palavra escrito ou gesto ou qualquer outro meio simbólico de causar-lhe mal injusto e grave detenção de um a seis meses ou multa somente se procede mediante representação',
      focus: { del2848: [/ameacar alguem, por palavra, escrito ou gesto/] },
      exclude: { del2848: ['147-C'] } },
    { id: 'gestante', test: (q) => /\b(?:gravid[ao]s?|gestante|gravidez)\b/.test(q) && /\b(?:trabalh\w*|emprego|empresa|demit\w*|demissao|dispens\w*|mandad[oa]|mandaram|despedid\w*|estabilidade|patrao|chefe|contrat\w*)\b/.test(q),
      laws: ['del5452', 'cf88'],
      terms: 'gestante gravidez confirmação estado de gravidez estabilidade provisória cinco meses após o parto aviso prévio',
      focus: { del5452: [/confirmacao do estado de gravidez advindo no curso do contrato/], cf88: [/da empregada gestante, desde a confirmacao da gravidez/] } },
    { id: 'domestica', test: (q) => /\b(?:domestic[oa]s?|diarista|baba|caseir[oa])\b/.test(q) && !/violencia domestica/.test(q),
      laws: ['lcp150'],
      terms: 'empregado doméstico duração do trabalho horas diárias semanais hora extraordinária FGTS fundo de garantia',
      focus: { lcp150: [/duracao normal do trabalho domestico/, /inclusao do empregado domestico no fundo de garantia/] } },
    { id: 'demissao', test: (q) => /\b(?:demitid[oa]s?|demissao|demitiram|demitir|dispensad[oa]s?|despedid[oa]s?|mandad[oa]s? embora|mandaram embora|mandou embora|desligad[oa]s? da empresa|verbas rescisorias|rescisao do (?:meu )?contrato de trabalho|acerto (?:trabalhista|da rescisao))\b/.test(q),
      /* As verbas estão espalhadas em quatro leis (CLT, FGTS, seguro-desemprego e 13º). */
      laws: ['del5452', 'l8036', 'l7998', 'l4090'],
      terms: 'rescisão contrato de trabalho verbas rescisórias aviso prévio férias proporcionais gratificação décimo terceiro FGTS quarenta por cento despedida sem justa causa seguro-desemprego',
      focus: {
        del5452: [/realizar o pagamento das verbas rescisorias/, /quiser rescindir o contrato devera avisar/, /na cessacao do contrato de trabalho, qualquer que seja a sua causa/],
        l8036: [/importancia igual a quarenta por cento/, /despedida sem justa causa, inclusive a indireta/],
        l7998: [/tera direito a percepcao do seguro-desemprego/],
        l4090: [/ocorrendo rescisao, sem justa causa/],
      },
      focusLimit: 7 },
    { id: 'despejo', test: (q) => /\bdespej\w*/.test(q) || (RENT.test(q) && /\b(?:atras\w*|nao pag\w*|nao paga|devendo|inadimpl\w*)\b/.test(q)),
      laws: ['l8245'],
      terms: 'ação de despejo falta de pagamento aluguel encargos liminar desocupação evitar a rescisão pagamento do débito',
      focus: { l8245: [/em decorrencia da falta de pagamento do aluguel e demais encargos/, /falta de pagamento de aluguel e acessorios da locacao no vencimento, estando o contrato desprovido/, /poderao evitar a rescisao da locacao efetuando/] },
      focusLimit: 3 },
    { id: 'caucao', test: (q) => /\bcaucao\b|\bdeposito (?:de|como|em) garantia\b|\bgarantia (?:do|de) aluguel\b/.test(q),
      laws: ['l8245'],
      terms: 'caução garantia locação depósito três meses de aluguel caderneta de poupança',
      focus: { l8245: [/modalidades de garantia/, /caucao em dinheiro, que nao podera exceder/] } },
    { id: 'saida-antecipada', test: (q) => (RENT.test(q) || /\b(?:apartamento|imovel|casa)\b/.test(q)) && /\b(?:sair|devolver|entregar|desocupar|rescindir|encerrar)\b.{0,60}\b(?:antes|fim do contrato|termino|prazo)\b|\bmulta (?:rescisoria|por sair|para sair)\b/.test(q),
      laws: ['l8245'],
      terms: 'devolver o imóvel antes do prazo multa pactuada proporcional transferência empregador notificação trinta dias',
      focus: { l8245: [/pagando a multa pactuada, proporcional/, /ficara dispensado da multa se a devolucao do imovel decorrer de transferencia/] } },
    { id: 'aumento-aluguel', test: (q) => RENT.test(q) && /\b(?:aument\w*|reajust\w*|revis\w*|subir|subiu)\b/.test(q),
      laws: ['l8245'],
      terms: 'novo valor do aluguel comum acordo cláusula de reajuste revisão judicial três anos preço de mercado',
      focus: { l8245: [/e licito as partes fixar, de comum acordo, novo valor/, /apos tres anos de vigencia do contrato/] } },
    { id: 'pensao-atrasada', test: (q) => /\b(?:pensao|alimentos|alimenticia)\b/.test(q) && /\b(?:nao (?:pag\w*|deposit\w*)|atras\w*|devendo|deve|cobrar|execu\w*|prender|pres[oa]|prisao)\b/.test(q),
      /* A prisão por pensão segue o CPC (1 a 3 meses, art. 528); o prazo de 60 dias da Lei 5.478 (art. 19) foi superado. */
      laws: ['l13105', 'del2848'],
      terms: 'cumprimento de sentença prestação alimentícia intimar pagar débito três dias protestar prisão regime fechado abandono material',
      focus: { l13105: [/mandara intimar o executado pessoalmente para, em 3 \(tres\) dias, pagar o debito/], del2848: [/deixar, sem justa causa, de prover a subsistencia/] },
      exclude: { l5478: ['19'] } },
    { id: 'cnh-pontos', test: (q) => /\b(?:cnh|carteira de motorista|carteira de habilitacao|habilitacao)\b/.test(q) && /\b(?:pontos?|suspen\w*|cassa\w*|perder|perco)\b/.test(q),
      laws: ['l9503'],
      terms: 'suspensão do direito de dirigir contagem de pontos doze meses infrações gravíssimas pontuação',
      focus: { l9503: [/atingir, no periodo de 12 \(doze\) meses, a seguinte contagem de pontos/, /sao computados os seguintes numeros de pontos/] } },
    { id: 'alcool-direcao', test: (q) => /\b(?:beb\w*|bebida\w*|bebad\w*|alcool\w*|embriag\w*|lei seca|bafometro|cerveja\w*)\b/.test(q) && /\b(?:dirig\w*|volante|motorista|conduz\w*|carro|moto|transito|blitz)\b/.test(q),
      laws: ['l9503'],
      terms: 'álcool influência dirigir embriaguez infração gravíssima suspensão do direito de dirigir capacidade psicomotora alterada',
      focus: { l9503: [/dirigir sob a influencia de alcool/, /capacidade psicomotora alterada em razao da influencia de alcool/] } },
    { id: 'prisao-divida', test: (q) => /\b(?:pres[oa]s?|prisao|prender|cadeia)\b/.test(q) && /\b(?:divida\w*|devendo|banco|cartao|emprestimo|financiamento|cheque|boleto|nome sujo)\b/.test(q) && !/\b(?:pensao|alimentos|alimenticia)\b/.test(q),
      laws: ['cf88'],
      terms: 'prisão civil por dívida obrigação alimentícia inadimplemento',
      focus: { cf88: [/nao havera prisao civil por divida/] } },
    { id: 'preso-flagrante', test: (q) => /\b(?:fui pres[oa]|foi pres[oa]|estou pres[oa]|fui detid[oa]|foi detid[oa]|algemad[oa])\b/.test(q) || (/\bflagrante\b/.test(q) && /\b(?:meus direitos|direitos do preso|advogad\w*|famil\w*|calad[oa]|o que (?:fazer|faco))\b/.test(q)),
      laws: ['cf88', 'del3689'],
      terms: 'preso informado permanecer calado assistência família advogado prisão comunicada juiz vinte e quatro horas flagrante',
      focus: { cf88: [/o preso sera informado de seus direitos, entre os quais o de permanecer calado/, /a prisao de qualquer pessoa e o local onde se encontre serao comunicados imediatamente/], del3689: [/em ate 24 \(vinte e quatro\) horas apos a realizacao da prisao/] } },
    { id: 'furto-roubo', test: (q) => /\bfurto\b/.test(q) && /\broubo\b/.test(q),
      laws: ['del2848'],
      terms: 'subtrair coisa alheia móvel grave ameaça violência pessoa reclusão',
      focus: { del2848: [/subtrair, para si ou para outrem, coisa alheia movel/, /mediante grave ameaca ou violencia a pessoa/] } },
    { id: 'violencia-domestica', test: (q) => /\b(?:agred\w*|agressao|apanh\w*|me bate|bate em mim|violencia domestica|medidas? protetivas?)\b/.test(q),
      laws: ['l11340'],
      terms: 'medidas protetivas de urgência juiz quarenta e oito horas afastamento do lar risco à vida da mulher',
      focus: { l11340: [/cabera ao juiz, no prazo de 48 \(quarenta e oito\) horas/, /verificada a existencia de risco atual ou iminente a vida/] } },
    { id: 'plano-saude', test: (q) => /\bplanos? de saude\b|\bconvenio medico\b|\boperadora de saude\b/.test(q) && /\b(?:urgen\w*|emergen\w*|negou|negad\w*|recus\w*|cobertura|carencia|cirurgia|internac\w*)\b/.test(q),
      laws: ['l9656'],
      terms: 'cobertura obrigatória urgência emergência carência vinte e quatro horas',
      focus: { l9656: [/e obrigatoria a cobertura do atendimento nos casos/, /prazo maximo de vinte e quatro horas para a cobertura dos casos de urgencia e emergencia/] } },
    { id: 'atraso-construtora', test: (q) => /\b(?:na planta|construtora|incorporadora|entrega das chaves|lancamento imobiliario)\b/.test(q) && /\b(?:atras\w*|nao entreg\w*|demor\w*|prazo)\b/.test(q),
      laws: ['l4591'],
      terms: 'entrega do imóvel prazo cento e oitenta dias resolução do contrato restituição indenização um por cento incorporadora',
      focus: { l4591: [/entrega do imovel em ate 180 \(cento e oitenta\) dias corridos/, /indenizacao de 1% \(um por cento\) do valor efetivamente pago/] } },
    { id: 'aposentadoria', test: (q) => /\baposent\w*/.test(q) && !/\bservidor\w*\b/.test(q),
      /* Depois da reforma (EC 103/2019): idade mínima na Constituição (art. 201, § 7º) e tempo de contribuição na própria
         emenda (art. 19). As regras de aposentadoria por tempo de serviço e de idade da Lei 8.213 (arts. 48 e 52 a 56)
         ficaram superadas e levariam a uma resposta desatualizada; a pontuação do art. 29-C (95/85) também mudou com a emenda. */
      laws: ['cf88', 'l8213'],
      /* Os termos também escolhem os artigos da emenda no acervo: com estas palavras vêm o art. 19 (regra atual: 15 anos de
         contribuição para mulheres e 20 para homens) e os arts. 17 e 18 (transição para quem já contribuía). */
      terms: 'aposentadoria segurado filiado ao regime geral após a data de entrada em vigor aposentado aos 62 anos de idade se mulher 65 anos se homem 15 quinze anos 20 vinte anos de tempo de contribuição transição',
      references: [{ type: 'emenda constitucional', number: '103', year: 2019 }],
      focus: { cf88: [/65 \(sessenta e cinco\) anos de idade, se homem, e 62 \(sessenta e dois\) anos de idade, se mulher/],
        acervo: [/15 \(quinze\) anos de tempo de contribuicao, se mulher, e 20 \(vinte\) anos de tempo de contribuicao, se homem/] },
      exclude: { l8213: ['29-C', '48', '52', '53', '54', '55', '56'] } },
    { id: 'colisao', test: (q) => (/\b(?:batida|batidas|bateram|bateu|bati|bater|colisao|colisoes|abalroamento)\b/.test(q) && /\b(?:carro|carros|veiculo|veiculos|moto|motocicleta|caminhao|traseira|para-choque)\b/.test(q)) || /\bengavetamento\b|\bacidente de transito\b/.test(q),
      laws: ['l9503', 'l10406'],
      terms: 'acidente de trânsito colisão veículo condutor distância de segurança lateral frontal negligência imprudência causar dano reparação indenização ato ilícito',
      focus: {
        l9503: [/distancia de seguranca lateral e frontal/, /dominio de .*veiculo.*atencao e cuidados/],
        l10406: [/negligencia ou imprudencia/, /por ato ilicito.*causar dano/, /fica obrigado a repara/],
      } },
    { id: 'defeito-produto', test: (q) => /\b(?:comprei|compramos|adquiri|compra|loja|produto|fabricante|garantia|celular|smartphone|telefone|notebook|computador|tablet|aparelho|eletrodomestico|geladeira|fogao|televisao|tv|maquina de lavar)\b/.test(q) &&
        /\b(?:defeito|defeitos|defeituos[oa]|vicio|vicios|quebrou|quebrado|estragou|estragado|pifou|falha|falhou|falhando|manchas?)\b|\b(?:deu|dando|com|apresent(?:ou|a|ando)|tem|teve) (?:um |uns |algum |varios )?probl\w{0,3}mas?\b|\bprobl\w{0,3}mas? (?:n[ao]s?|com)\b|\bparou de (?:funcionar|carregar|ligar)\b|\bnao (?:liga|funciona|carrega|pega)\b|\bpontos? (?:pretos|mortos)\b/.test(q),
      laws: ['l8078'],
      terms: 'vício qualidade produto durável fornecedor conserto reparação garantia sanar vício reclamar decadência',
      focus: { l8078: [/vicios de qualidade ou quantidade/, /nao sendo o vicio sanado/, /reclamar pelos vicios aparentes/] } },
  ];
  function searchIntent(question) {
    const q = norm(question);
    const topic = TOPICS.find((item) => item.test(q));
    return topic ? Object.assign({ focus: {} }, topic) : null;
  }
  // Pergunta que cita uma norma pelo número: o preparo roda mesmo com rota de assunto, para trazer a referência citada.
  const NAMES_LAW = /\b(?:lei|decreto|lc|lcp|emenda|ec|medida provisoria|mp|resolucao|portaria)\b(?:\s+(?:complementar|constitucional|lei))?\s*(?:n[.ºo°]*\s*)?\d/;
  function excludedByIntent(intent, source) {
    const list = intent && intent.exclude && intent.exclude[source.lawId];
    return !!list && list.includes(String(source.article || '').replace(/^Art\.?\s*/, ''));
  }
  /* Com IA disponível, pede termos jurídicos para reforçar a busca (modelo rápido, resposta em cache). */
  async function expandQueryAI(question) {
    if (!sampleFn) return '';
    try {
      const terms = await sampleFn.json('Give 4 to 8 Portuguese legal search terms (single words or short phrases, as used in Brazilian statutes) for the question below. Reply with only a JSON array of strings.\n\nQUESTION: ' + question, { modelTier: 'quick' });
      return Array.isArray(terms) ? terms.filter((x) => typeof x === 'string').join(' ') : '';
    } catch (e) { return ''; }
  }
  function selectLaws(question, suggestedIds, originalQuestion) {
    const q = norm(question);
    const intent = searchIntent(originalQuestion || question);
    const scored = state.catalog.laws.map((l) => {
      let sc = 0;
      (l.tags || []).forEach((tag) => { const tg = norm(tag); if (containsTerm(q, tg)) sc += tg.includes(' ') ? 3 : 2; });
      if (containsTerm(q, l.shortName)) sc += 6;
      const num = (norm(l.number).match(/\d[\d.]*/) || [''])[0]; if (num && containsTerm(q, num)) sc += 6;
      return { l, sc };
    }).filter((x) => x.sc > 0).sort((a, b) => b.sc - a.sc);
    const ids = (intent ? intent.laws : []).concat(Array.isArray(suggestedIds) ? suggestedIds : [], scored.map((x) => x.l.id));
    return Array.from(new Set(ids)).map((id) => state.catalog.laws.find((l) => l.id === id)).filter(Boolean).slice(0, 6);
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
  /* Trecho de um artigo longo: a primeira linha, as linhas que a rota do assunto aponta (sempre) e as linhas com termos
     da pergunta, até o limite de tamanho. Sem isso, num artigo como o 5º da Constituição as linhas certas (ex.: "permanecer
     calado") podiam ficar de fora do trecho enviado. */
  /* Nível de cada linha de um artigo: caput ou texto solto (0), parágrafo (1), inciso (2), alínea (3). */
  const lineLevel = (ln) => /^\s*(?:§|par[aá]grafo [uú]nico)/i.test(ln) ? 1 : /^\s*[IVXLC]+\s*[-–—]/.test(ln) ? 2 : /^\s*[a-z]\)/.test(ln) ? 3 : 0;
  /* Trecho de um artigo longo: o caput; as linhas de foco da rota, com o parágrafo a que pertencem e as alíneas que
     elas anunciam; e, até o limite, as linhas com as palavras mais raras da pergunta, da mais pertinente para a menos.
     Com foco, o limite é menor: o modelo recebe o que decide a pergunta, não os incisos vizinhos (no art. 59 da Lei do
     Inquilinato, os outros oito casos de liminar escondiam o da falta de pagamento). */
  const FOCUSED_EXCERPT_CHARS = 1600;
  function excerptFor(article, qTokens, maxChars, focus) {
    if (article.text.length <= maxChars) return article.text;
    const lines = article.text.split('\n');
    const normed = lines.map((ln) => norm(ln).replace(/\s+/g, ' '));
    // Palavras de cada linha: um radical da pergunta conta só no começo da palavra ("hora" não está em "penhora").
    const words = normed.map((ln) => ' ' + ln.replace(/[^a-z0-9]+/g, ' '));
    const has = (i, tk) => words[i].includes(' ' + tk);
    const levels = lines.map(lineLevel);
    const parentOf = (i) => { if (!levels[i]) return 0; for (let j = i - 1; j > 0; j--) if (levels[j] && levels[j] < levels[i]) return j; return 0; };
    const keep = new Set([0]);
    let size = lines[0].length + 1;
    const add = (i) => { for (let j = i; j > 0 && !keep.has(j); j = parentOf(j)) { keep.add(j); size += lines[j].length + 1; } };
    const focused = (focus || []).length ? normed.map((ln, i) => i > 0 && focus.some((pattern) => pattern.test(ln))) : [];
    focused.forEach((hit, i) => {
      if (!hit) return;
      add(i);
      // A linha que anuncia uma lista ("incluídos:"), mesmo seguida de nota de redação, leva junto as alíneas.
      if (/:\s*(?:\([^)]*\)\s*)*$/.test(lines[i])) for (let j = i + 1; j < lines.length && levels[j] > levels[i]; j++) add(j);
    });
    const hasFocus = focused.some(Boolean);
    const limit = hasFocus ? Math.min(maxChars, FOCUSED_EXCERPT_CHARS) : maxChars;
    const weight = new Map(qTokens.map((tk) => { const df = lines.filter((ln, i) => has(i, tk)).length; return [tk, df ? Math.log(1 + lines.length / df) : 0]; }));
    // Perto de uma linha de foco (até 3 linhas), o peso dobra: os incisos vizinhos costumam tratar do mesmo assunto.
    const near = (i) => focused.some((hit, j) => hit && Math.abs(i - j) <= 3);
    const scores = lines.map((ln, i) => (i ? qTokens.reduce((n, tk) => n + (has(i, tk) ? weight.get(tk) : 0), 0) * (!focused[i] && near(i) ? 2 : 1) : 0));
    /* Com foco, só entram as linhas quase tão pertinentes quanto a melhor das outras e com ao menos um terço da força da
       linha de foco; as que só repetem "trabalho", "locação" ou "ação" ficam de fora. */
    const best = (pick) => Math.max.apply(null, scores.filter((score, i) => pick(i)).concat(0));
    const floor = hasFocus ? Math.max(best((i) => !focused[i]) / 2, best((i) => focused[i]) / 3) : 0;
    const ranked = scores.map((score, i) => ({ i, score })).filter((x) => x.i > 0 && x.score > 0 && x.score >= floor && !keep.has(x.i)).sort((a, b) => b.score - a.score || a.i - b.i);
    for (const { i } of ranked) {
      let extra = 0; for (let j = i; j > 0 && !keep.has(j); j = parentOf(j)) extra += lines[j].length + 1;
      if (size + extra <= limit) add(i);
    }
    const order = Array.from(keep).sort((x, y) => x - y);
    let out = '', last = -1;
    for (const i of order) { if (out && i - last > 1) out += '\n[…]'; out += (out ? '\n' : '') + lines[i]; last = i; }
    if (last < lines.length - 1) out += '\n[…]';
    return out.length > maxChars + 800 ? out.slice(0, maxChars + 800) + '…' : out;
  }
  function searchArticles(laws, question, limit, originalQuestion, characterBudget) {
    const intent = searchIntent(originalQuestion || question);
    const qTokens = tokensOf(question + (intent ? ' ' + intent.terms : ''));
    if (!qTokens.length) return [];
    const hits = [];
    laws.forEach((law) => {
      const arts = law.articles.filter((a) => a.status === 'vigente');
      const N = arts.length;
      const normed = arts.map((a) => norm(a.text));
      const frequencies = arts.map((a) => {
        const counts = new Map();
        norm(a.text).replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((word) => word.length > 2 && !STOP.has(word)).forEach((word) => {
          const token = stem(word); counts.set(token, (counts.get(token) || 0) + 1);
        });
        return counts;
      });
      const df = qTokens.map((tk) => frequencies.reduce((count, words) => count + (words.has(tk) ? 1 : 0), 0));
      arts.forEach((a, i) => {
        let score = 0, matched = 0;
        qTokens.forEach((tk, j) => { if (!df[j]) return; const occ = frequencies[i].get(tk) || 0; if (occ) { matched++; score += (1 + Math.min(occ, 4) * 0.25) * Math.log(1 + N / df[j]); } });
        if (!matched) return;
        score *= Math.pow(matched / qTokens.length, 1.5);
        score /= Math.log(20 + a.text.length / 80);
        if (intent && intent.focus[law.id]) {
          const text = normed[i].replace(/\s+/g, ' ');
          score += intent.focus[law.id].filter((pattern) => pattern.test(text)).length * 8;
        }
        hits.push({ law, a, score });
      });
    });
    hits.sort((x, y) => y.score - x.score);
    const out = []; let chars = 0;
    for (const h of hits) { if (out.length >= limit) break; const ex = excerptFor(h.a, qTokens, 2200, intent && intent.focus[h.law.id]); if (chars + ex.length > (characterBudget || 15000)) continue; chars += ex.length; out.push({ law: h.law, article: h.a, excerpt: repairEncoding(ex), score: h.score }); }
    return out;
  }
  /* Artigos que completam outros: no Código de Trânsito, o artigo da infração diz só a categoria (gravíssima, grave,
     média, leve); o valor da multa está no art. 258 e os pontos na carteira, no art. 259. */
  const COMPANIONS = [{ lawId: 'l9503', when: /infracao\s*[-–:]?\s*(?:gravissima|grave|media|leve)\b/, articles: ['Art. 258', 'Art. 259'], tokens: ['infracao', 'multa', 'ponto'] }];
  function withCompanions(sources, loaded) {
    const extra = [];
    COMPANIONS.forEach((rule) => {
      if (!sources.some((source) => source.lawId === rule.lawId && rule.when.test(norm(source.excerpt || '')))) return;
      const law = loaded.find((item) => item.id === rule.lawId);
      if (!law) return;
      rule.articles.forEach((label) => {
        if (sources.concat(extra).some((source) => source.lawId === rule.lawId && source.article === label)) return;
        const article = law.articles.find((item) => item.label === label && item.status === 'vigente');
        if (article) extra.push(lawSource({ law: law, article: article, excerpt: repairEncoding(excerptFor(article, rule.tokens, 2200)), score: 0 }, 0));
      });
    });
    return extra.length ? sources.concat(extra).map((source, index) => Object.assign({}, source, { n: index + 1 })) : sources;
  }
  function lawSource(hit, n) {
    const law = hit.law;
    const entry = state.catalog.laws.find((l) => l.id === law.id) || {};
    const ver = entry.versions && entry.versions.length ? entry.versions[entry.versions.length - 1].id : 'v1';
    const anchor = /^\d+$/.test(hit.article.id) ? '#art' + hit.article.id : '';
    return { lawId: law.id, name: law.name, shortName: law.shortName, article: hit.article.label, heading: hit.article.heading, status: hit.article.status, nota: hit.article.nota, url: law.url + anchor, textUrl: law.textUrl || law.url, source: law.source || '', retrievedAt: law.retrievedAt, version: ver, excerpt: hit.excerpt, score: hit.score, n: n };
  }
  function candidateHits(laws, query, question) {
    // A long article or a large code must not consume the whole recall budget
    // before other selected laws reach the independent relevance check.
    return laws.flatMap((law) => searchArticles([law], query, 36, question, 80000));
  }
  function relevanceCatalog(sources, query) {
    const terms = new Set(tokensOf(query));
    return sources.slice(0, 200).map((source, index) => {
      const text = repairEncoding(source.excerpt).replace(/\s+/g, ' ');
      const head = text.slice(0, 150);
      let best = '', bestOffset = 0, score = 0;
      for (let offset = 90; offset < text.length; offset += 90) {
        const snippet = text.slice(offset, offset + 150);
        const matched = tokensOf(snippet).filter((token) => terms.has(token)).length;
        if (matched > score) { score = matched; best = snippet; bestOffset = offset; }
      }
      const headMatched = tokensOf(head).filter((token) => terms.has(token)).length;
      const tail = best && score > headMatched && bestOffset >= 150 ? ' … ' + best : best && score > headMatched ? text.slice(150, bestOffset + 150) : '';
      return { id: 'passage-' + (index + 1), name: (source.shortName.slice(0, 30) + ' ' + source.article + ': ' + head + tail).slice(0, 380) };
    });
  }
  function validatedSelection(sources, ids) {
    return Array.from(new Set(Array.isArray(ids) ? ids : [])).filter((id) => /^passage-[1-9]\d*$/.test(id))
      .map((id) => sources[Number(id.slice(8)) - 1]).filter(Boolean).slice(0, 3)
      .map((source, index) => Object.assign({}, source, { n: index + 1 }));
  }
  /* Trechos que a rota do assunto manda incluir. Recebe a rota já decidida pela pergunta atual (ou a pergunta): o
     histórico da conversa não pode trocar de assunto (ex.: uma pergunta anterior sobre gravidez). */
  function focusSources(questionOrIntent, sources) {
    const intent = typeof questionOrIntent === 'string' ? searchIntent(questionOrIntent) : questionOrIntent;
    if (!intent || !intent.focus) return [];
    return sources.filter((source) => {
      // "acervo": linhas procuradas nos trechos importados do acervo (normas fora do catálogo, como a EC 103).
      const patterns = intent.focus[source.lawId] || (source.imported && intent.focus.acervo);
      if (!patterns || !source.excerpt) return false;
      const text = norm(source.excerpt).replace(/\s+/g, ' ');
      return patterns.some((pattern) => pattern.test(text));
    });
  }
  /* Sem a verificação automática: os trechos que a intenção aponta e os mais bem pontuados pela busca de palavras. */
  // Quantos trechos de uma intenção reconhecida acompanham a seleção (a demissão precisa de mais que o padrão).
  function focusLimit(intent) { return (intent && intent.focusLimit) || 2; }
  function fallbackSelection(question, sources, intent) {
    if (intent === undefined) intent = searchIntent(question);
    const limit = focusLimit(intent);
    const focus = focusSources(intent, sources).slice(0, limit);
    const rest = sources.filter((source) => !focus.includes(source)).sort((a, b) => (b.score || 0) - (a.score || 0));
    return focus.concat(rest).slice(0, Math.max(5, limit + 2)).map((source, index) => Object.assign({}, source, { n: index + 1 }));
  }
  async function selectRelevantSources(question, query, sources, signal, intent) {
    if (intent === undefined) intent = searchIntent(question);
    const candidates = sources.slice(0, 200);
    const catalog = relevanceCatalog(candidates, query);
    const result = await apiCall('prepare', {
      question: 'RELEVÂNCIA DE TRECHOS JURÍDICOS. A pergunta é: ' + question + '\nCada item do catálogo representa um artigo ou trecho real (início do artigo e, após “…”, o trecho mais próximo da pergunta). Em laws, selecione até 3 IDs passage-N cujos textos ajudam diretamente a responder à pergunta. Compare o conteúdo, não só o nome da lei ou palavras coincidentes. Ignore assuntos apenas parecidos. Se nenhum trecho servir, retorne laws vazio. Não acrescente IDs.',
      catalog,
    }, signal);
    const selected = validatedSelection(candidates, result.laws);
    // Quando a pergunta tem uma intenção reconhecida (ex.: produto com defeito), os artigos que a regulam
    // acompanham a seleção automática em vez de depender dela. A resposta só cita o que usar de fato.
    const focus = focusSources(intent, candidates).filter((source) => !selected.some((s) => s.lawId === source.lawId && s.article === source.article)).slice(0, focusLimit(intent));
    return selected.concat(focus).map((source, index) => Object.assign({}, source, { n: index + 1 }));
  }
  function priorTurns(conv, currentQuestion) {
    const turns = (Array.isArray(conv.messages) ? conv.messages : []).filter((message) =>
      message.role === 'user' || (message.role === 'assistant' && message.status === 'done'));
    const last = turns[turns.length - 1];
    if (last && last.role === 'user' && String(last.text || '').trim() === String(currentQuestion || '').trim()) turns.pop();
    return turns.slice(-8);
  }
  /* Cada turno anterior leva ao modelo o essencial: o texto da pessoa com os nomes dos arquivos e,
     nas respostas, o resumo mais o que foi lido de documentos (trechos citados e observações). */
  function turnText(message) {
    if (message.role === 'user') {
      const files = (message.attachments || []).map((f) => f.name).filter(Boolean);
      return (message.text || '') + (files.length ? ' [' + t('oficial.historyFiles') + ': ' + files.join(', ') + ']' : '');
    }
    const a = message.answer || {};
    let out = a.summary || '';
    const doc = a.document;
    if (doc && ((doc.excerpts && doc.excerpts.length) || (doc.notes && doc.notes.length))) {
      const parts = (doc.excerpts || []).slice(0, 4).map((x) => (x.ref ? x.ref + ': ' : '') + '"' + String(x.quote || '').slice(0, 220) + '"' + (x.inDocument ? ' — ' + String(x.inDocument).slice(0, 160) : ''));
      const notes = (doc.notes || []).slice(0, 2).map((n) => String(n).slice(0, 160));
      out += '\n[' + t('oficial.historyDocument') + (doc.name ? ' ' + doc.name : '') + '] ' + parts.concat(notes).join(' | ') + '\n' + t('oficial.historyReattach');
    }
    return out.slice(0, 1200);
  }
  function historyForModel(conv, currentQuestion) {
    return priorTurns(conv, currentQuestion).slice(-6).map((message) => ({ role: message.role, text: turnText(message) }));
  }
  function plainAnswerQuestion(question) {
    return question + '\n\nESCOPO DESTA VERSÃO: O ROSS AI atende apenas ao Direito brasileiro. Não apresente leis brasileiras como se fossem de outro país. Se o pedido depender de legislação estrangeira, explique brevemente a limitação; se houver dúvida sobre a aplicação no Brasil, peça o esclarecimento necessário.' +
      '\n\nESTILO PARA PÚBLICO GERAL: No campo summary (Em resumo), use duas ou três frases curtas e linguagem cotidiana. Comece aplicando a regra ao problema relatado e diga o próximo passo sustentado pelos trechos. Explique termos técnicos em palavras comuns, como "vício" por "defeito". Evite definições abstratas, "garantia legal de adequação" sem explicar e aberturas como "de acordo com os trechos da lei". Use os fatos informados, sem transformar uma hipótese em certeza, diagnosticar a causa de um defeito ou prometer resultado. Não acrescente prazos, direitos ou conclusões que os trechos não sustentem. Respeite um pedido específico de formato ou detalhamento da pessoa.' +
      '\n\nLINGUAGEM EM TODOS OS CAMPOS: troque termos jurídicos por palavras do dia a dia também em sourcesSay, depends e nextSteps (ex.: "culpa exclusiva de terceiros" → "quando a culpa é só de outra pessoa"; "prestação do serviço" → "o serviço contratado"; "fornecedor" → "a loja ou a empresa", quando couber). Se um termo técnico for indispensável, explique-o na mesma frase. Mas use exatamente os nomes de crimes, institutos, valores e prazos que aparecem nos trechos: furto e roubo, por exemplo, são crimes diferentes.' +
      '\n\nAVISOS: em warnings, no máximo dois cuidados que mudam o caso desta pessoa (ex.: um prazo que pode estar acabando). Dicas práticas, como guardar comprovantes, vão em nextSteps. Não repita que a resposta é informativa, que foi gerada por IA ou que convém procurar um advogado: o app já mostra isso. Use limitNotice só quando houver um limite real deste caso (ex.: depende de perícia, prazo judicial curto).';
  }
  function isRephraseRequest(question) {
    const text = norm(question);
    if (!/\b(?:explique|explica|explicar|explicacao|simplifique|simplifica|simplificar|resuma|resumir|resumo|repita|repetir|reformule|reformular|detalhe|detalhar|explain|simplify|rephrase|summarize|repeat)\b|\bnao (?:entendi|entendo|compreendi)\b|\b(?:didn t|don t) understand\b/.test(text)) return false;
    const styleWords = new Set('explique explica explicar explicacao simplifique simplifica simplificar resuma resumir resumo repita repetir reformule reformular detalhe detalhar entendi entendo compreendi compreendo novamente novo favor favorzinho maneira forma palavras facil faceis simples simplificada simplificado claro clara clareza melhor resumido resumida curto curta direto direta detalhes detalhada detalhado pouco poucas poucos topicos exemplo exemplos portugues linguagem juridiques juridico juridica crianca criancas anos ano cinco isso aquilo resposta anterior voce poderia consegue conseguir diga dizer diferente diferentes favor explain simpler simply simple simplify rephrase summarize summary repeat again understand please more less plain language words other shorter easier previous answer you could would'.split(' '));
    return (text.match(/[a-z0-9]+/g) || []).every((word) => STOP.has(word) || styleWords.has(word) || (/^\d+$/.test(word) && Number(word) <= 18));
  }
  function conversationContext(conv, question) {
    const turns = priorTurns(conv, question);
    const previous = turns.slice().reverse().find((message) => message.role === 'assistant' && message.answer);
    const topic = turns.slice().reverse().find((message) => message.role === 'user' && message.text && !isRephraseRequest(message.text));
    const rephrase = isRephraseRequest(question);
    const query = rephrase && topic ? topic.text : question;
    const recent = turns.slice(-4).map((message) => (message.role === 'user' ? 'Pessoa: ' + message.text : 'Resposta anterior: ' + (message.answer && message.answer.summary || '')).slice(0, 380)).join('\n');
    const searchQuestion = turns.length ? 'Pergunta atual: ' + String(query).slice(0, 700) + '\nPedido atual da pessoa: ' + question.slice(0, 400) + '\nUse o histórico apenas para resolver referências e continuidades; respeite uma mudança de assunto explícita.\nHistórico recente:\n' + recent.slice(-800) : question;
    let sources = [];
    if (rephrase && previous && previous.answer.mode === 'oficial') {
      const previousIndex = conv.messages.indexOf(previous);
      const intervening = conv.messages.slice(previousIndex + 1).some((message) => message.role === 'system' || (message.role === 'user' && message.text !== question && !isRephraseRequest(message.text)));
      if (!intervening) sources = (previous.answer.sources || []).filter((source) => source.lawId && typeof source.excerpt === 'string' && source.excerpt.trim() && !['revogado', 'repealed', 'vetado'].includes(source.status)).slice(0, 8).map((source, index) => Object.assign({}, source, { n: index + 1 }));
    }
    let answerQuestion = rephrase && previous ? 'PEDIDO DE REFORMULAÇÃO, SEM MUDAR O ASSUNTO.\nAssunto da conversa: ' + String(query).slice(0, 1000) + '\nPedido da pessoa: ' + question + '\nReexplique a resposta anterior conforme esse pedido, com linguagem cotidiana. Não trate isso como uma nova dúvida sem assunto. Não acrescente direitos, prazos ou conclusões ausentes dos trechos fornecidos. Preserve as limitações e incertezas da resposta anterior.\nResposta a reformular:\n' + answerToText(previous.answer, previous).slice(0, 3000) : question;
    if (rephrase && previous && previous.answer.kind === 'nosources' && topic) answerQuestion = 'Dúvida original: ' + query + '\nPedido da pessoa: ' + question + '\nA busca anterior não encontrou trechos suficientes. Use os trechos agora fornecidos para explicar a dúvida original de forma simples, se eles a responderem. Preserve eventuais limitações; não reinicie uma conversa sem assunto.';
    return { rephrase, topic, previous, query, searchQuestion, answerQuestion, sources };
  }
  providers.oficial = {
    id: 'oficial',
    async respond({ text, attachments, conv, onStep, onPartial, signal }) {
      await ensureCatalog();
      const cap = state.catalog.generatedAt;
      if (conv.country !== 'BR') return { mode: 'oficial', kind: 'nosources', summary: t('oficial.jurisdiction', { country: countryName(conv.country) }), nextSteps: [t('oficial.jurisdictionStep')], capturedAt: cap };
      onStep(0);
      const question = (text || '').trim() || (attachments && attachments.length ? t('oficial.docDefaultQuery') : '');
      const context = conversationContext(conv, question);
      if (context.rephrase && !context.topic && !context.previous) return Object.assign(emptyOfficial(), { kind: 'clarify', summary: t('oficial.rephraseMissing'), questions: [t('oficial.rephraseQuestion')] });
      if (context.sources.length) {
        onStep(1);
        if (!sampleFn && !API_URL) return retrievalOnly(context.sources);
        onStep(2);
        try {
          const data = sampleFn ? await askOfficial(context.answerQuestion, context.sources, conv, attachments, signal, question) : await askOfficialAPI(context.answerQuestion, context.sources, conv, attachments, signal, question, onPartial);
          const answer = normalizeOfficial(data, context.sources, attachments);
          answer.warnings = Array.from(new Set((context.previous.answer.warnings || []).concat(answer.warnings || [])));
          return answer;
        } catch (e) { if (e && e.code === 'api_not_configured') return retrievalOnly(context.sources); throw e; }
      }
      let aiTerms = '', apiLaws = null, modelUnavailable = false, importedSources = [], references = [];
      const intent = searchIntent(context.query);
      if (sampleFn) aiTerms = await expandQueryAI(context.searchQuestion);
      /* O preparo só reforça a busca. Com o assunto já reconhecido (ex.: produto com defeito), os termos do assunto bastam;
         nos demais casos, ele tem prazo próprio e, vencido, a busca segue sem ele. */
      else if (API_URL && (!intent || NAMES_LAW.test(norm(context.query)))) {
        const limit = deadlineSignal(signal, MODEL_WAIT_MS.prepare);
        try { const p = await apiCall('prepare', { question: context.searchQuestion, jurisdiction: jurisdictionLabel(conv.country, conv.region), catalog: state.catalog.laws.map((l) => ({ id: l.id, name: l.name })) }, limit.signal); aiTerms = (Array.isArray(p.terms) ? p.terms : []).join(' '); references = Array.isArray(p.references) ? p.references : []; apiLaws = (Array.isArray(p.laws) ? p.laws : []).map((id) => state.catalog.laws.find((l) => l.id === id)).filter(Boolean); }
        catch (e) {
          if (signal.aborted) throw { code: 'cancelled' };
          if (e && e.code === 'rate_limited') throw e;
          if (e && e.code === 'api_not_configured') modelUnavailable = true;
        } finally { limit.done(); }
      }
      const searchText = expandQuery(context.query) + ' ' + aiTerms + (intent ? ' ' + intent.terms : '');
      if (intent && intent.references) references = references.concat(intent.references);
      if (API_URL) {
        try {
          const result = await apiCall('search', { query: searchText.slice(0, 500), originalQuery: context.query.slice(0,500), references, scope: conv.region ? '' : 'federal', uf: conv.region || '', forAnswer: true }, signal);
          importedSources = (Array.isArray(result.results) ? result.results : []).filter(r => r.content_mode !== 'metadata' && typeof r.excerpt === 'string' && r.excerpt.trim()).map((r) => ({
            lawId: 'corpus-' + r.id, imported: true, name: r.title, shortName: r.title, article: r.article, heading: r.heading,
            status: 'nao_confirmada', url: r.source_url, textUrl: r.source_url, retrievedAt: r.captured_at,
            version: String(r.repository_ref || '').slice(0, 12), corpusVersion: r.text_version, repositoryPath: r.repository_path,
            repositoryRef: r.repository_ref, localCopy: r.localCopy === true || r.content_mode === 'full', excerpt: r.excerpt.length > 2800 ? r.excerpt.slice(0, 2800) + '\n[…]' : r.excerpt,
            nota: r.text_version + ' · ' + t('corpus.currency')
          }));
        } catch (e) { if (signal.aborted) throw { code: 'cancelled' }; /* bundled official texts remain available */ }
        try {
          const known = new Set(importedSources.map((s) => s.repositoryPath).filter(Boolean));
          importedSources = importedSources.concat(await indexCandidatesForAnswer(searchText.slice(0, 500), context.query, conv, known, signal));
        } catch (e) { if (signal.aborted) throw { code: 'cancelled' }; /* o índice é um complemento; sua falha não interrompe a resposta */ }
      }
      let laws = selectLaws(searchText, apiLaws && apiLaws.map((l) => l.id), context.query);
      if (!laws.length) { const picked = await selectLawsAI(context.searchQuestion); if (picked && picked.length) laws = picked; }
      if (signal.aborted) throw { code: 'cancelled' };
      /* Uma norma que não carrega não derruba a consulta: os trechos disponíveis são usados e a cobertura parcial fica registrada na resposta. */
      const settled = await Promise.allSettled(laws.map(loadLaw));
      const loaded = settled.filter((r) => r.status === 'fulfilled').map((r) => r.value);
      const missingLaws = laws.filter((law, i) => settled[i].status === 'rejected').map((law) => law.name);
      if (laws.length && !loaded.length) throw { code: 'law_fetch' };
      const withCoverage = (answer) => {
        if (missingLaws.length && answer && answer.mode === 'oficial') answer.notices = (answer.notices || []).concat(t('oficial.partialCoverage', { laws: missingLaws.join(', ') }));
        return answer;
      };
      onStep(1);
      const hits = candidateHits(loaded, searchText, context.query);
      if (signal.aborted) throw { code: 'cancelled' };
      const localSources = hits.map((h, i) => lawSource(h, i + 1));
      const seen = new Set(localSources.map((s) => s.url.replace(/#.*$/, '') + '|' + s.article));
      let sources = localSources.concat(importedSources.filter((s) => {
        const key = s.url.replace(/#.*$/, '') + '|' + s.article;
        if (seen.has(key)) return false; seen.add(key); return true;
      })).filter((s) => !excludedByIntent(intent, s)).slice(0, 200).map((s, i) => Object.assign({}, s, { n: i + 1 }));
      if (!sources.length) return withCoverage(attachments && attachments.length ? await documentWithoutLaw(text, attachments, conv, signal) : emptyOfficial());
      if (modelUnavailable || (!sampleFn && !API_URL)) return withCoverage(retrievalOnly(sources));
      let relevanceFallback = false;
      if (!sampleFn && API_URL) {
        const limit = deadlineSignal(signal, MODEL_WAIT_MS.relevance);
        try { sources = await selectRelevantSources(context.searchQuestion, searchText, sources, limit.signal, intent); }
        catch (e) {
          if (signal.aborted) throw { code: 'cancelled' };
          if (e && e.code === 'rate_limited') throw e;
          if (e && e.code === 'api_not_configured') return withCoverage(retrievalOnly(sources));
          /* O serviço do modelo oscilou ou demorou além do prazo: a resposta segue com os trechos de reserva e avisa como foram escolhidos. */
          sources = fallbackSelection(context.searchQuestion, sources, intent); relevanceFallback = true;
        } finally { limit.done(); }
        if (!sources.length) return withCoverage(attachments && attachments.length ? await documentWithoutLaw(text, attachments, conv, signal) : emptyOfficial());
      } else sources = sources.slice(0, 8);
      sources = withCompanions(sources, loaded);
      onStep(2);
      try {
        const data = sampleFn ? await askOfficial(context.answerQuestion, sources, conv, attachments, signal, question) : await askOfficialAPI(context.answerQuestion, sources, conv, attachments, signal, question, onPartial);
        const answer = normalizeOfficial(data, sources, attachments);
        if (relevanceFallback && answer.kind !== 'nosources') answer.notices = (answer.notices || []).concat(t('oficial.relevanceFallback'));
        return withCoverage(answer);
      } catch (e) {
        if (e && e.code === 'api_not_configured') return withCoverage(retrievalOnly(sources));
        /* Modelo indisponível no momento: mostra os trechos encontrados com um aviso honesto, em vez de só um erro. */
        if (e && ['upstream', 'upstream_timeout', 'api_error', 'internal', 'worker_recycling'].includes(e.code)) return withCoverage(retrievalOnly(relevanceFallback ? sources : fallbackSelection(context.searchQuestion, sources, intent), 'oficial.modelUnavailable'));
        throw e;
      }
    }
  };
  function emptyOfficial() { return { mode: 'oficial', kind: 'nosources', summary: t('oficial.empty'), questions: t('oficial.emptyQuestions'), nextSteps: [t('oficial.emptyStep')], capturedAt: state.catalog ? state.catalog.generatedAt : '' }; }
  /* Sem trecho de lei, um arquivo anexado ainda é lido: a resposta explica o que está escrito no
     documento e diz que não houve fundamentação legal verificada. */
  async function documentWithoutLaw(text, attachments, conv, signal) {
    if (!sampleFn && !API_URL) return Object.assign(emptyOfficial(), { warnings: [t('oficial.documentUnread')] });
    const answer = await providers.ai.respond({ text: text || t('oficial.documentDefaultQuestion'), attachments: attachments, conv: conv, onStep: () => {}, signal: signal });
    answer.warnings = [t('oficial.documentNoLaw')].concat(answer.warnings || []);
    return answer;
  }
  function retrievalOnly(sources, reason) {
    const top = sources.slice(0, 5);
    return { mode: 'oficial', kind: 'answer', corpus: top.some((s) => s.imported), summary: t(reason || 'oficial.noAI'), sourcesSay: top.map((s) => ({ title: s.shortName + ' · ' + s.article, text: s.excerpt.length > 700 ? s.excerpt.slice(0, 700) + '…' : s.excerpt, ref: s.n })), sources: top, warnings: [t('oficial.noAIWarn')], capturedAt: state.catalog.generatedAt };
  }
  async function askOfficial(question, sources, conv, attachments, signal, currentQuestion) {
    const exc = sources.map((s) => '[' + s.n + '] ' + s.name + ' — ' + s.article + (s.heading ? ' (' + s.heading + ')' : '') + (s.nota ? ' [' + s.nota + ']' : '') + '\n"""\n' + s.excerpt + '\n"""').join('\n\n');
    const history = historyForModel(conv, currentQuestion || question).map((message) => (message.role === 'user' ? 'PERSON: ' : 'ROSS AI: ') + message.text).join('\n');
    const limits = state.aiLimits; const imgTypes = limits && limits.images && limits.images.mediaTypes ? limits.images.mediaTypes : [];
    const images = [], unread = [];
    (attachments || []).forEach((f) => { if (f.file && imgTypes.includes(f.type)) images.push(f.file); else unread.push(f.name); });
    const prompt = [
      'You are ROSS AI, a legal information assistant. You explain Brazilian law in plain language. You are not a lawyer and this is not legal advice.',
      'Write in ' + t('langName') + '. Be clear, respectful and not overly formal. Short sentences.',
      'GROUNDING RULES: Answer ONLY from the consulted excerpts below. Bundled excerpts were captured from official sources on ' + fmtDate(state.catalog.generatedAt) + '; imported repository excerpts carry their own edition and validity warnings in nota. Preserve those warnings and do not label repository text current or consolidated. Cite excerpts by their numbers. Do not cite articles, laws, deadlines or court decisions that are not in the excerpts. If the excerpts do not answer the question, say so plainly (kind "nosources") and say what kind of rule or document would be needed. Excerpts marked […] are partial.',
      'Never state that someone will win or lose, that a clause is definitely valid or invalid, or that a lawsuit certainly applies. Say what depends on facts, documents or professional interpretation.',
      'If the question is ambiguous, use kind "clarify" with up to three objective questions. If the person asks for a high-impact personalised assessment, a litigation strategy or a definitive conclusion, use kind "limit", explain the limit briefly and refer them to a lawyer, the Defensoria Pública, a union, Procon or the relevant public service. If the situation seems urgent, use kind "urgent" and tell them to seek help without delay.',
      images.length ? 'The attached image(s) are pages of a document. Identify the clause you explain (reference and short quote), separate what the document says from what the law says, and warn if it is incomplete, unreadable or lacks context. One clause is not the conclusion for the whole case.' : '',
      unread.length ? 'Files that cannot be read in this version: ' + unread.join(', ') + '. Say so and ask for the text or an image.' : '',
      'Context: ' + jurisdictionLabel(conv.country, conv.region) + '. Today is ' + fmtDate(Date.now()) + '.',
      history ? 'CONVERSATION SO FAR:\n' + history : '',
      'CONSULTED EXCERPTS:\n' + exc,
      'QUESTION: ' + plainAnswerQuestion(question),
      'Reply with ONLY one JSON object: {"kind":"answer"|"clarify"|"limit"|"urgent"|"document"|"nosources","summary":string,"sourcesSay":[{"title":string,"text":string,"ref":number}],"depends":[string],"sources":[{"ref":number,"why":string}],"nextSteps":[string],"questions":[string],"document":{"notes":[string],"excerpts":[{"ref":string,"quote":string,"inDocument":string,"inLaw":string}],"warnings":[string]}|null,"limitNotice":{"text":string,"referrals":[string]}|null,"warnings":[string]}. Every "ref" is an excerpt number. At most 5 items per array; use empty arrays or null when not applicable.'
    ].filter(Boolean).join('\n\n');
    const opts = { cache: false, signal: signal, modelTier: 'default' };
    if (images.length) opts.images = images;
    return sampleFn.json(prompt, opts);
  }
  async function askOfficialAPI(question, sources, conv, attachments, signal, currentQuestion, onPartial) {
    const history = historyForModel(conv, currentQuestion || question);
    const files = await apiAttachments(attachments);
    const res = await apiCall('answer', {
      lang: t('langName'), jurisdiction: jurisdictionLabel(conv.country, conv.region), question: plainAnswerQuestion(question), history: history,
      excerpts: sources.map((s) => ({ n: s.n, name: s.name, article: s.article, heading: s.heading, nota: s.nota, excerpt: s.excerpt })),
      attachments: files, capturedAt: fmtDate(state.catalog.generatedAt)
    }, signal, 0, summaryStream(onPartial));
    return Object.assign({}, res.answer || {}, res.fallback === true ? { fallbackModel: true } : {});
  }
  /* Só aparecem afirmações e fontes ligadas a trechos que realmente foram enviados ao modelo.
     Uma afirmação com referência inexistente ou ausente é descartada; nenhuma fonte é acrescentada
     automaticamente para dar aparência de fundamentação. */
  function normalizeOfficial(d, sources, attachments) {
    const a = normalizeAI(d, attachments);
    if (d && d.fallbackModel === true) a.notices = (a.notices || []).concat(t('oficial.fallbackModel'));
    a.mode = 'oficial'; a.capturedAt = state.catalog ? state.catalog.generatedAt : ''; a.corpus = sources.some((s) => s.imported);
    const byN = Object.fromEntries(sources.map((s) => [s.n, s]));
    const validRef = (value) => { const n = Number(value); return Number.isInteger(n) && byN[n] ? n : null; };
    const say = (Array.isArray(d && d.sourcesSay) ? d.sourcesSay : []).filter((s) => s && String(s.text || '').trim());
    const keptSay = say.filter((s) => validRef(s.ref) !== null);
    const droppedClaims = say.length - keptSay.length;
    const refs = [];
    (Array.isArray(d && d.sources) ? d.sources : []).concat(keptSay).forEach((s) => { const n = validRef(s && s.ref); if (n !== null && !refs.includes(n)) refs.push(n); });
    const renum = {}; refs.forEach((n, i) => { renum[n] = i + 1; });
    a.sources = refs.map((n, i) => Object.assign({}, byN[n], { n: i + 1 }));
    a.sourcesSay = keptSay.map((s) => ({ title: String(s.title || ''), text: String(s.text), ref: renum[validRef(s.ref)] }));
    if (a.kind === 'nosources') {
      /* Preserva a explicação e as perguntas específicas do modelo; completa só o que faltar. */
      a.sources = []; a.sourcesSay = [];
      const generic = !a.summary;
      if (generic) a.summary = t('oficial.empty');
      if (generic && !a.questions.length) a.questions = t('oficial.emptyQuestions');
      if (!a.nextSteps.length) a.nextSteps = [t('oficial.emptyStep')];
      return a;
    }
    if (droppedClaims) a.notices = (a.notices || []).concat(t('oficial.droppedClaims', { n: droppedClaims }));
    if (!a.sources.length && sources.length && (a.kind === 'answer' || a.kind === 'document')) a.warnings = a.warnings.concat(t('oficial.unlinked'));
    return a;
  }
  function lawCardHTML(s, n, m) {
    if (s.imported) return corpusSourceHTML(s, n, m);
    const status = s.status === 'vigente' ? 'vigente' : s.status === 'vetado' ? 'vetado' : 'revogado';
    let meta = '<span><b>' + esc(t('source.article')) + ':</b> ' + esc(s.article) + '</span>';
    if (s.heading) meta += '<span>' + esc(s.heading) + '</span>';
    if (s.nota) meta += '<span><b>' + esc(t('source.note')) + ':</b> ' + esc(s.nota) + '</span>';
    meta += '<span><b>' + esc(t('source.captured')) + ':</b> ' + esc(fmtDate(s.retrievedAt)) + '</span><span><b>' + esc(t('source.version')) + ':</b> ' + esc(s.version) + '</span>';
    const excerpt = s.excerpt ? '<details class="src-excerpt"><summary>' + esc(t('source.excerpt')) + '</summary><p>' + esc(s.excerpt).replace(/\n/g, '<br>') + '</p></details>' : '';
    const textLine = s.textUrl && s.textUrl !== s.url.replace(/#.*$/, '') ? '<div class="src-link"><span>' + esc(t('source.textFrom')) + ':</span><a href="' + esc(s.textUrl) + '" target="_blank" rel="noopener">' + esc(sourceLabel(s.source)) + '</a></div>' : '';
    return '<li class="src-card" id="src-' + m.id + '-' + n + '"><div class="src-name"><span>' + esc(s.name) + '</span>' + statusBadge(status) + '<span class="badge badge-oficial">' + esc(sourceLabel(s.source)) + '</span></div><div class="src-meta">' + meta + '</div><div class="src-link"><a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(t('source.open')) + '</a><span class="mono">' + esc(s.url) + '</span></div>' + textLine + excerpt + '</li>';
  }
  function sourceLabel(src) {
    if (/c[âa]mara/i.test(src || '')) return t('source.camara');
    if (/planalto/i.test(src || '')) return t('source.planalto');
    return t('source.official');
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
    if (state.mode === 'oficial') return fmt(s.oficialNote, { n: state.catalog.laws.length, date: fmtDate(state.catalog.generatedAt) }) + (state.aiAvailable ? ' ' + (aiBackend() === 'api' ? s.viaApi : s.viaClaude) : ' ' + s.oficialNoAI);
    if (state.mode === 'ai') return s.aiHelp;
    return s.demoNote;
  }
  function homeNotice() {
    const em = effectiveMode();
    if (em === 'oficial' && !state.catalog) return t('home.catalogLoading');
    if (em === 'oficial') return t(INDEX_URL ? 'home.oficialNoticeIndex' : 'home.oficialNotice', { n: state.catalog.laws.length, date: fmtDate(state.catalog.generatedAt) }) + (state.aiAvailable ? '' : ' ' + t('home.oficialNoAI'));
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
      return '<div class="reg-card" id="reg-' + l.id + '" data-law="' + esc(norm(l.name + ' ' + l.shortName + ' ' + l.number + ' ' + (l.tags || []).join(' '))) + '"><h3><span>' + esc(l.name) + '</span>' + statusBadge('vigente') + '<span class="badge badge-oficial">' + esc(sourceLabel(l.source)) + '</span></h3>' +
        '<dl class="reg-grid">' +
        '<div><dt>' + esc(sp.fields.type) + '</dt><dd>' + esc(sp.types[l.type] || l.type) + '</dd></div>' +
        '<div><dt>' + esc(sp.fields.jurisdiction) + '</dt><dd>' + esc(c.jurisdiction) + '</dd></div>' +
        '<div><dt>' + esc(sp.fields.published) + '</dt><dd>' + esc(fmtDate(l.date)) + '</dd></div>' +
        '<div><dt>' + esc(sp.lexml) + '</dt><dd class="mono">' + esc(l.lexml) + '</dd></div>' +
        '<div><dt>' + esc(sp.fields.link) + '</dt><dd><a href="' + esc(l.url) + '" target="_blank" rel="noopener" class="mono">' + esc(l.url) + '</a></dd></div>' +
        (l.textUrl && l.textUrl !== l.url ? '<div><dt>' + esc(t('source.textFrom')) + '</dt><dd><a href="' + esc(l.textUrl) + '" target="_blank" rel="noopener">' + esc(sourceLabel(l.source)) + '</a></dd></div>' : '') +
        '<div><dt>' + esc(sp.fields.verified) + '</dt><dd>' + esc(fmtDate(l.retrievedAt)) + '</dd></div>' +
        '<div><dt>' + esc(sp.fields.version) + '</dt><dd>' + esc(cur ? cur.id : 'v1') + '</dd></div>' +
        '<div><dt>' + esc(sp.articles) + '</dt><dd>' + esc(l.articleCount + ' (' + l.vigentes + ' ' + sp.inForce + ', ' + l.revogados + ' ' + sp.repealed + ')') + '</dd></div>' +
        '<div><dt>' + esc(sp.hash) + '</dt><dd class="mono">' + esc((l.sha256 || '').slice(0, 16)) + '…</dd></div>' +
        '</dl>' +
        '<details><summary>' + esc(sp.versions) + ' (' + (l.versions || []).length + ')</summary><ul class="ver-list">' + (l.versions || []).map((v) => '<li><span class="vid' + (cur && v.id === cur.id ? ' is-current' : '') + '">' + esc(v.id) + (cur && v.id === cur.id ? ' · ' + esc(sp.current) : '') + '</span><span class="vdate">' + esc(fmtDate(v.date)) + '</span><span>' + esc(v.note) + '</span></li>').join('') + '</ul></details></div>';
    }).join('');
    return '<div class="registry"><div class="reg-card"><h3>' + esc(sp.official) + '</h3><p class="muted">' + esc(fmt(sp.officialIntro, { index: c.index, n: c.laws.length, date: fmtDate(c.generatedAt) })) + '</p><label class="reg-filter"><span class="sr-only">' + esc(sp.filter) + '</span><input type="search" id="reg-filter" placeholder="' + esc(sp.filterPlaceholder) + '" autocomplete="off"></label><p class="muted" id="reg-count"></p></div>' + queue + cards + '</div>';
  }

  /* ---------- Envio ---------- */
  /* A demonstração só é usada quando escolhida; indisponibilidades aparecem como erro recuperável. */
  function activeProvider() {
    if (state.mode === 'oficial') return providers.oficial;
    if (state.mode === 'ai') return providers.ai;
    return providers.demo;
  }
  function effectiveMode() { return activeProvider().id; }

  async function submitMessage(text, extraAttachments, forcedProvider) {
    if (state.busy) return;
    const draftKey = state.currentId || 'home';
    let conv = currentConv();
    if (!conv || state.view !== 'chat') conv = newConversation();
    const attachments = (extraAttachments || state.pending).map((f) => ({ id: f.id, name: f.name, size: f.size, type: f.type, file: f.file }));
    state.pending = []; state.draft = '';
    state.drafts.delete(draftKey); state.drafts.delete(conv.id);
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
  const retryInputs = new WeakMap();
  const CLIENT_TIMEOUT_MS = 300000;
  async function runProvider(provider, conv, botMsg, input) {
    const ctl = new AbortController();
    state.busy = { ctl: ctl, id: botMsg.id };
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; ctl.abort(); }, CLIENT_TIMEOUT_MS);
    const composer = $('#composer'); if (composer && composer._refresh) composer._refresh();
    const paint = () => { const node = $('.msg[data-id="' + botMsg.id + '"] .answer'); if (node) { node.innerHTML = loadingHTML(provider.id, botMsg.step || 0, botMsg.partial); const stop = $('[data-stop]', node); if (stop) stop.addEventListener('click', stopAnswer); } };
    const onStep = (i) => { botMsg.step = i; paint(); };
    const onPartial = (text) => {
      const changed = !botMsg.partial !== !text; botMsg.partial = text || '';
      const slot = !changed && $('.msg[data-id="' + botMsg.id + '"] [data-partial]');
      if (slot) slot.textContent = botMsg.partial; else paint();
    };
    const position = conv.messages.indexOf(botMsg);
    if (!botMsg.jurisdiction) botMsg.jurisdiction = { country: conv.country, region: conv.region };
    const requestConv = Object.assign({}, conv, botMsg.jurisdiction, { messages: conv.messages.slice(0, position < 0 ? conv.messages.length : position) });
    try {
      const answer = await provider.respond({ text: input.text, attachments: input.attachments, conv: requestConv, lang: state.lang, onStep: onStep, onPartial: onPartial, signal: ctl.signal });
      retryInputs.delete(botMsg);
      botMsg.status = 'done'; botMsg.answer = answer; botMsg.provider = answer && answer.mode === 'ai' ? 'ai' : provider.id; delete botMsg.error;
    } catch (e) {
      retryInputs.set(botMsg, input);
      const code = e && e.code === 'cancelled' && timedOut ? 'timeout' : e && e.code;
      botMsg.status = 'error';
      botMsg.error = (code && t('errors.' + code) !== 'errors.' + code) ? t('errors.' + code) : (e && e.message && code !== 'demo_error' ? t('errors.generic') : t('errors.generic'));
      if (code === 'unavailable') botMsg.error = t('errors.unavailable');
      botMsg.lastInput = { text: input.text, attachments: input.attachments.map((f) => ({ name: f.name, size: f.size, type: f.type })) };
    } finally {
      clearTimeout(timer);
      delete botMsg.partial;
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
    const input = retryInputs.get(botMsg) || botMsg.lastInput || { text: prevUser ? prevUser.text : '', attachments: prevUser ? prevUser.attachments : [] };
    if (RX.error.test(input.text || '')) input.text = input.text.replace(RX.error, '').trim();
    const provider = botMsg.forced ? providers.demo : activeProvider();
    if (provider.id !== 'demo' && (input.attachments || []).some((file) => !file.file)) {
      botMsg.error = t('errors.attachment_missing');
      const node = $('.msg[data-id="' + botMsg.id + '"]'); if (node) node.replaceWith(renderMessage(botMsg, conv));
      toast(botMsg.error); return;
    }
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

  /* ---------- Pesquisa no acervo importado ---------- */
  /* ---------- Índice estático do repositório (todas as normas do ctresb/leis, edição fixa) ----------
     O índice fica publicado como arquivos JSON por unidade (federal/<série>, estaduais/<UF>, municipais/<UF>,
     reguladores/<órgão>…). Ele não contém os textos: cada entrada tem título, ementa, identificação, caminho e
     prefixo de hash; o texto integral é lido sob demanda pela função, sempre na edição fixa e conferindo o hash. */
  const INDEX_URL = (window.ROSS_CONFIG && window.ROSS_CONFIG.indexUrl) || '';
  const INDEX_ANSWER_TIMEOUT_MS = 12000;
  const INDEX_LAW_FAMILIES = ['constituicao', 'leis-ordinarias', 'leis-complementares', 'leis-delegadas', 'decretos-lei', 'emendas-constitucionais', 'constituicoes-historicas', 'leis-constitucionais', 'regimentos', 'medidas-provisorias'];
  const lawIndex = { manifest: null, manifestPromise: null, units: new Map(), unitPromises: new Map(), failed: false };
  const indexRecords = new Map();
  /* O manifesto é sempre revalidado; as partes levam a data de geração do índice no endereço, então ficam em cache
     até o índice ser publicado de novo e nunca misturam uma edição antiga com o manifesto novo. */
  async function indexJSON(path, signal, version) {
    const url = INDEX_URL + path + (version ? '?v=' + encodeURIComponent(version) : '');
    const res = await fetch(url, { signal: signal, cache: version ? 'force-cache' : 'no-cache' });
    if (!res.ok) throw { code: 'index_unavailable', message: 'HTTP ' + res.status };
    return res.json();
  }
  function indexManifest(signal) {
    if (!INDEX_URL) return Promise.resolve(null);
    if (lawIndex.manifest) return Promise.resolve(lawIndex.manifest);
    if (!lawIndex.manifestPromise) lawIndex.manifestPromise = indexJSON('manifest.json', signal).then((m) => { lawIndex.manifest = m && m.units ? m : null; lawIndex.failed = !lawIndex.manifest; return lawIndex.manifest; }).catch((e) => { lawIndex.manifestPromise = null; lawIndex.failed = true; throw e; });
    return lawIndex.manifestPromise;
  }
  function indexUnit(name, signal) {
    if (lawIndex.units.has(name)) return Promise.resolve(lawIndex.units.get(name));
    if (!lawIndex.unitPromises.has(name)) {
      const meta = lawIndex.manifest && lawIndex.manifest.units[name];
      if (!meta) return Promise.resolve([]);
      lawIndex.unitPromises.set(name, Promise.all(meta.parts.map((part) => indexJSON(part, signal, lawIndex.manifest.generatedAt || lawIndex.manifest.ref))).then((parts) => {
        const entries = [];
        parts.forEach((part) => (part.entries || []).forEach((e) => { e.unit = name; e._s = norm((e.t || '') + ' ' + (e.e || '')); entries.push(e); }));
        lawIndex.units.set(name, entries); lawIndex.unitPromises.delete(name); return entries;
      }).catch((e) => { lawIndex.unitPromises.delete(name); throw e; }));
    }
    return lawIndex.unitPromises.get(name);
  }
  /* Unidades a carregar para uma pesquisa: leis federais sempre; decretos e atos federais só quando pedidos;
     estados e municípios exigem a UF (um índice nacional inteiro não cabe numa página). */
  function indexUnitsFor(opts) {
    const m = lawIndex.manifest; if (!m) return [];
    const names = Object.keys(m.units);
    const federalLaws = names.filter((u) => m.units[u].scope === 'federal' && INDEX_LAW_FAMILIES.includes(m.units[u].family));
    const out = [];
    if (!opts.scope || opts.scope === 'federal') out.push.apply(out, federalLaws);
    if (opts.scope === 'federal' && opts.federalActs) out.push.apply(out, names.filter((u) => m.units[u].scope === 'federal' && !INDEX_LAW_FAMILIES.includes(m.units[u].family)));
    if ((!opts.scope || opts.scope === 'estadual') && opts.uf && m.units['estaduais/' + opts.uf]) out.push('estaduais/' + opts.uf);
    if ((opts.scope === 'municipal' || (!opts.scope && opts.municipality)) && opts.uf && m.units['municipais/' + opts.uf]) out.push('municipais/' + opts.uf);
    if (opts.scope === 'regulador' && opts.organ && m.units['reguladores/' + opts.organ]) out.push('reguladores/' + opts.organ);
    if (opts.scope === 'jurisprudencia' && m.units.jurisprudencia) out.push('jurisprudencia');
    if (opts.scope === 'tratado' && m.units.tratados) out.push('tratados');
    return out;
  }
  function indexQueryTerms(query) {
    const number = (String(query).match(/\b(\d{1,3}(?:\.\d{3})+|\d{2,6})\b/) || [])[1];
    return { tokens: tokensOf(query).slice(0, 12), number: number ? number.replace(/\./g, '') : '' };
  }
  function municipalityOf(entry) { return entry.unit && entry.unit.indexOf('municipais/') === 0 ? (entry.p.split('/')[0] || '') : ''; }
  /* Pontuação simples e previsível: número exato pesa mais; cada termo encontrado no título ou na ementa soma;
     todos os termos presentes dobram; o mais recente desempata. */
  const INDEX_AMENDMENT = /^(?:altera|acrescenta|revoga|d[aá] nova reda|modifica|inclui|insere|prorroga|disp[oõ]e sobre a altera)/;
  function searchIndexEntries(entries, query, limit, filter) {
    const terms = indexQueryTerms(query);
    const queryText = ' ' + norm(query).replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
    if (!terms.tokens.length && !terms.number) return [];
    const patterns = terms.tokens.map((tk) => new RegExp('(^|[^a-z0-9])' + tk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    const scored = [];
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (filter && !filter(e)) continue;
      let score = 0, matched = 0;
      const title = norm(e.t || '');
      for (let j = 0; j < patterns.length; j++) { if (patterns[j].test(e._s)) { matched++; score += patterns[j].test(title) ? 2.5 : 1; } }
      if (terms.number && e.n === terms.number) { score += 6; matched++; }
      if (!matched) continue;
      if (patterns.length && matched >= patterns.length) score *= 2;
      const ementa = norm(e.e || '');
      if (INDEX_AMENDMENT.test(ementa)) score *= 0.6;
      else {
        // Nome popular entre parênteses na própria ementa ("Estatuto da Pessoa com Deficiência") citado na pergunta.
        const names = ementa.match(/\(([^()]{8,90})\)/g) || [];
        if (names.some((n) => { const name = n.slice(1, -1).replace(/[^a-z0-9]+/g, ' ').trim(); return name.split(' ').length >= 2 && queryText.indexOf(name) >= 0; })) score += 6;
      }
      if (e.x) score *= 0.9;
      scored.push({ e: e, score: score });
    }
    /* Alterações encontradas apontam para a norma principal: uma lei citada por várias delas ("Altera a Lei nº 13.146…")
       entra na lista mesmo que a própria ementa use outras palavras. */
    const cited = new Map();
    scored.forEach((x) => { if (!INDEX_AMENDMENT.test(norm(x.e.e || ''))) return; (norm(x.e.e).replace(/decreto[- ]lei n[oº°.]*\s*[\d.]+/g, ' ').match(/lei(?: complementar)? n[oº°.]*\s*(\d{1,3}(?:\.\d{3})*)/g) || []).slice(0, 2).forEach((ref) => { const n = ref.replace(/^.*?(\d[\d.]*)$/, '$1').replace(/\./g, ''); const c = cited.get(n) || { count: 0, best: 0 }; c.count++; c.best = Math.max(c.best, x.score); cited.set(n, c); }); });
    if (cited.size) {
      const present = new Map(scored.map((x) => [x.e, x]));
      entries.forEach((e) => {
        const c = e.n && cited.get(e.n);
        if (!c || c.count < 2 || !/^leis-(?:ordinarias|complementares)$/.test(String(e.unit || '').split('/')[1] || '') || (filter && !filter(e))) return;
        const boost = c.best + 1 + Math.min(c.count, 5) * 0.5;
        const existing = present.get(e);
        if (existing) existing.score = Math.max(existing.score, boost); else scored.push({ e: e, score: e.x ? boost * 0.9 : boost });
      });
    }
    scored.sort((a, b) => b.score - a.score || String(b.e.d || '').localeCompare(String(a.e.d || '')));
    return scored.slice(0, limit).map((x) => Object.assign({ score: x.score }, x.e));
  }
  function indexRecord(e) {
    const m = lawIndex.manifest, unit = m.units[e.unit] || {};
    const path = e.unit === 'raiz' ? e.p : e.unit + '/' + e.p;
    const id = 'idx:' + path;
    const record = { id: id, fromIndex: true, title: e.t, summary: e.e || '', norm_type: e.k || '', number: e.n || '', norm_date: e.d || '',
      scope: unit.scope || 'federal', uf: unit.uf || '', municipality: municipalityOf(e), repository_path: path, repository_ref: m.ref, hash: e.h,
      is_partial: !!e.x, status: e.r ? 'repealed' : 'unknown', source_url: '', article: '', excerpt: '', score: e.score || 0 };
    indexRecords.set(id, record);
    return record;
  }
  async function searchIndex(query, opts, signal) {
    const manifest = await indexManifest(signal);
    if (!manifest) return { results: [], units: [] };
    const units = indexUnitsFor(opts);
    const loaded = await Promise.all(units.map((u) => indexUnit(u, signal)));
    const all = [].concat.apply([], loaded);
    const city = opts.municipality ? norm(opts.municipality).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : '';
    const filter = city ? (e) => !e.unit || e.unit.indexOf('municipais/') !== 0 || municipalityOf(e) === city : null;
    return { results: searchIndexEntries(all, query, opts.limit || 10, filter).map(indexRecord), units: units };
  }
  /* Na resposta: candidatos do índice (leis federais e, se houver UF, estaduais) que a busca local não cobre; os
     textos são lidos pela função, que devolve só os artigos pertinentes. */
  async function indexCandidatesForAnswer(query, originalQuestion, conv, excludePaths, signal) {
    if (!INDEX_URL || !API_URL) return [];
    let found;
    // Numa conexão lenta o índice não segura a resposta: passado o prazo, a resposta segue sem ele e o download
    // continua em segundo plano, ficando pronto (e em cache) para a próxima pergunta.
    const deadline = new Promise((resolve) => setTimeout(() => resolve(null), INDEX_ANSWER_TIMEOUT_MS));
    try { found = await Promise.race([searchIndex(query, { uf: conv.region || '', limit: 6 }, signal), deadline]); }
    catch (e) { if (signal && signal.aborted) throw { code: 'cancelled' }; return []; }
    if (!found) return [];
    // Normas já distribuídas com o app (as 66) não são lidas de novo pelo índice: compara o número, não o ano.
    const catalogNumbers = new Set(state.catalog.laws.map((l) => (String(l.number || '').match(/\d[\d.]*/) || [''])[0].replace(/\./g, '')).filter(Boolean));
    const picked = found.results.filter((r) => r.score >= 3 && !r.is_partial && r.status !== 'repealed' && !excludePaths.has(r.repository_path) && !(r.scope === 'federal' && catalogNumbers.has(r.number))).slice(0, 3);
    const reads = await Promise.allSettled(picked.map((r) => apiCall('repository_read', { path: r.repository_path, ref: r.repository_ref, hash: r.hash, query: String(query).slice(0, 500) }, signal)));
    const sources = [];
    reads.forEach((read, i) => {
      if (read.status !== 'fulfilled' || !read.value || !Array.isArray(read.value.passages)) return;
      const r = picked[i], doc = read.value.document || {};
      read.value.passages.forEach((pass) => {
        if (!pass || !pass.excerpt) return;
        sources.push({ lawId: 'index-' + r.repository_path, imported: true, fromIndex: true, name: doc.title || r.title, shortName: doc.title || r.title, article: pass.article || t('corpus.textOfNorm'), heading: '',
          status: 'nao_confirmada', url: doc.source_url || corpusRepoURL(r.repository_path, r.repository_ref), textUrl: doc.source_url || '', retrievedAt: doc.captured_at || '',
          version: String(r.repository_ref).slice(0, 12), corpusVersion: doc.text_version || t('corpus.editionUnknown'), repositoryPath: r.repository_path, repositoryRef: r.repository_ref, localCopy: read.value.localCopy === true,
          excerpt: pass.excerpt.length > 2800 ? pass.excerpt.slice(0, 2800) + '\n[…]' : pass.excerpt, nota: (doc.text_version || t('corpus.editionUnknown')) + ' · ' + t('corpus.currency') });
      });
    });
    return sources;
  }
  function indexResultHTML(r) {
    return '<article class="corpus-result"><div class="corpus-result-head"><h2>' + esc(r.title) + '</h2><span class="badge badge-index">' + esc(t('corpus.indexBadge')) + '</span>' + (r.is_partial ? '<span class="badge badge-historico">' + esc(t('corpus.partial')) + '</span>' : '') + '</div>' +
      '<p class="corpus-meta">' + esc([t('corpus.' + r.scope), r.uf, r.municipality, r.norm_type, r.norm_date ? fmtDate(r.norm_date) : ''].filter(Boolean).join(' · ')) + '</p>' +
      (r.summary ? '<p>' + esc(r.summary) + '</p>' : '<p class="muted">' + esc(t('corpus.noSummary')) + '</p>') +
      '<p class="corpus-meta">' + esc(r.status === 'repealed' ? t('corpus.repealed') : t('corpus.currency')) + '</p>' +
      corpusLinks('', r.repository_path, r.repository_ref) + '<button type="button" class="btn btn-secondary btn-sm" data-read-corpus="' + esc(r.id) + '">' + esc(t('corpus.readRepository')) + '</button><div class="corpus-fulltext" hidden></div></article>';
  }
  let corpusController = null;
  const repositoryReads = new Map();
  function corpusRepoURL(path, ref) {
    if (!/^[a-f0-9]{40}$/.test(ref || '')) return 'https://github.com/ctresb/leis';
    return 'https://github.com/ctresb/leis/blob/' + ref + '/' + String(path || '').split('/').map(encodeURIComponent).join('/');
  }
  function httpURL(value) { try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : ''; } catch (e) { return ''; } }
  function corpusLinks(sourceURL, path, ref) {
    const official = httpURL(sourceURL);
    return '<div class="corpus-links">' + (official ? '<a href="' + esc(official) + '" target="_blank" rel="noopener noreferrer">' + esc(t('corpus.openSource')) + '</a>' : '') +
      (path && ref ? '<a href="' + esc(corpusRepoURL(path, ref)) + '" target="_blank" rel="noopener noreferrer">' + esc(t('corpus.openSnapshot')) + '</a>' : '') + '</div>';
  }
  function corpusSourceHTML(s, n, m) {
    return '<li class="src-card" id="src-' + m.id + '-' + n + '"><div class="src-name"><span>' + esc(s.name) + '</span><span class="badge badge-imported">' + esc(t('corpus.importedBadge')) + '</span></div>' +
      '<div class="src-meta"><span>' + esc(s.article) + '</span><span>' + esc(s.corpusVersion) + '</span><span>' + esc(t('corpus.currency')) + '</span>' +
      (s.retrievedAt ? '<span>' + esc(t('source.captured') + ': ' + fmtDate(s.retrievedAt)) + '</span>' : '') + '</div>' +
      corpusLinks(s.url, s.repositoryPath, s.repositoryRef) + '<details class="src-excerpt"><summary>' + esc(t('source.excerpt')) + '</summary><p>' + esc(s.excerpt).replace(/\n/g, '<br>') + '</p></details></li>';
  }
  function corpusStatsText() {
    const stats = state.corpus.stats;
    return stats && stats.error ? t('corpus.unavailable') : stats ? t('corpus.count', { n: Number(stats.fullTexts ?? stats.documents ?? 0).toLocaleString(state.lang), catalog: stats.catalogDocuments == null ? '—' : Number(stats.catalogDocuments).toLocaleString(state.lang) }) : t('corpus.loadingCount');
  }
  function publicResultHTML(r) {
    return '<article class="corpus-result"><div class="corpus-result-head"><h2>' + esc(r.title) + '</h2><span class="badge badge-imported">' + esc(t(r.contentType === 'news' ? 'corpus.news' : 'corpus.precedents')) + '</span></div><p class="corpus-meta">' + esc([r.source,r.court,r.status,r.published_at ? fmtDate(r.published_at) : ''].filter(Boolean).join(' · ')) + '</p>' +
      (r.subject ? '<p>' + esc(r.subject) + '</p>' : '') + '<p>' + esc(r.summary || t('corpus.noThesis')) + '</p>' + (r.truncated ? '<p class="muted">' + esc(t('corpus.truncated')) + '</p>' : '') + corpusLinks(r.source_url) + '</article>';
  }
  function renderCorpus(main) {
    const c = state.corpus;
    const ufOptions = GEO.regions.BR || regionsFor('BR') || [];
    const stats = corpusStatsText();
    const resultHTML = c.results.map((r) => r.contentType ? publicResultHTML(r) : r.fromIndex ? indexResultHTML(r) : '<article class="corpus-result"><div class="corpus-result-head"><h2>' + esc(r.title) + '</h2><span class="badge ' + (r.is_partial ? 'badge-historico' : 'badge-imported') + '">' + esc(r.is_partial ? t('corpus.partial') : t('corpus.imported')) + '</span></div>' +
      '<p class="corpus-meta">' + esc([t('corpus.' + r.scope), r.uf, r.municipality, r.article].filter(Boolean).join(' · ')) + '</p>' +
      (r.summary ? '<p>' + esc(r.summary) + '</p>' : '') +
      '<details class="corpus-excerpt"><summary>' + esc(t('corpus.readExcerpt')) + '</summary><p>' + esc(r.excerpt) + '</p></details>' +
      '<p class="corpus-meta">' + esc(r.text_version) + ' · ' + esc(r.status === 'repealed' || r.repealed ? t('corpus.repealed') : t('corpus.currency')) +
      (r.captured_at ? ' · ' + esc(t('source.captured') + ': ' + fmtDate(r.captured_at)) : '') + '</p>' +
      corpusLinks(r.source_url, r.repository_path, r.repository_ref) + (r.repository_path ? '<button type="button" class="btn btn-secondary btn-sm" data-read-corpus="' + esc(r.id) + '">' + esc(t('corpus.readRepository')) + '</button><div class="corpus-fulltext" hidden></div>' : '') + '</article>').join('');
    main.innerHTML = pageShell(t('corpus.title'), '', '<p class="prose">' + esc(t('corpus.intro')) + '</p>' +
      '<div class="corpus-coverage"><strong>' + esc(stats) + '</strong><p>' + esc(t('corpus.coverage')) + '</p><p id="index-status" class="corpus-meta">' + esc(indexStatusText()) + '</p></div>' +
      '<form id="corpus-form" class="corpus-form"><label for="corpus-kind">' + esc(t('corpus.kind')) + '</label><select id="corpus-kind">' + ['laws','precedents','news'].map(k => '<option value="' + k + '"' + (c.kind === k ? ' selected' : '') + '>' + esc(t('corpus.' + k)) + '</option>').join('') + '</select><label for="corpus-query">' + esc(t('corpus.query')) + '</label><div class="corpus-query-row"><input id="corpus-query" type="search" minlength="2" maxlength="500" required placeholder="' + esc(t('corpus.placeholder')) + '" value="' + esc(c.query) + '"><button class="btn" type="submit"' + (c.busy ? ' disabled' : '') + '>' + esc(c.busy ? t('corpus.searching') : t('corpus.search')) + '</button></div>' +
      '<div class="corpus-filters" id="corpus-law-filters"' + (c.kind !== 'laws' ? ' hidden' : '') + '><label>' + esc(t('corpus.scope')) + '<select id="corpus-scope">' + ['', 'federal', 'estadual', 'municipal', 'regulador'].map((s) => '<option value="' + s + '"' + (c.scope === s ? ' selected' : '') + '>' + esc(t('corpus.' + (s || 'all'))) + '</option>').join('') + '</select></label>' +
      '<label' + (c.scope === 'regulador' ? '' : ' hidden') + '>' + esc(t('corpus.organ')) + '<select id="corpus-organ"><option value="">' + esc(t('corpus.chooseOrgan')) + '</option>' + indexOrgans().map((o) => '<option value="' + esc(o) + '"' + (o === c.organ ? ' selected' : '') + '>' + esc(o.toUpperCase()) + '</option>').join('') + '</select></label>' +
      '<label class="check"' + (c.scope === 'federal' ? '' : ' hidden') + '><input type="checkbox" id="corpus-acts"' + (c.federalActs ? ' checked' : '') + '> ' + esc(t('corpus.federalActs')) + '</label>' +
      '<label>' + esc(t('corpus.state')) + '<select id="corpus-uf"><option value="">' + esc(t('corpus.allStates')) + '</option>' + ufOptions.map((r) => '<option value="' + esc(r[0]) + '"' + (r[0] === c.uf ? ' selected' : '') + '>' + esc(r[1]) + '</option>').join('') + '</select></label>' +
      '<label>' + esc(t('corpus.city')) + '<input id="corpus-city" maxlength="100" placeholder="' + esc(t('corpus.cityPlaceholder')) + '" value="' + esc(c.municipality) + '"></label></div><p class="muted corpus-help">' + esc(t('corpus.filterHint')) + '</p></form>' +
      '<div id="corpus-results" class="corpus-results" aria-live="polite" aria-busy="' + c.busy + '">' +
      (c.error ? callout('warn', esc(c.error)) : '') + (c.indexNotice ? '<p class="muted">' + esc(c.indexNotice) + '</p>' : '') + (c.kind !== 'laws' ? '<p class="muted">' + esc(t('corpus.separateNotice')) + '</p>' : '') + (c.fetchedAt ? '<p class="corpus-meta">' + esc(t('source.captured') + ': ' + fmtDate(c.fetchedAt)) + (c.stale ? ' · ' + esc(t('corpus.stale')) : '') + '</p>' : '') + resultHTML +
      (c.searched && !c.busy && !c.error && !c.results.length ? '<p class="corpus-empty">' + esc(t('corpus.empty')) + '</p>' : '') + '</div>' +
      '<div class="corpus-pagination">' + (c.offset ? '<button type="button" class="btn btn-secondary" id="corpus-prev"' + (c.busy ? ' disabled' : '') + '>' + esc(t('corpus.previous')) + '</button>' : '') +
      (c.hasMore ? '<button type="button" class="btn btn-secondary" id="corpus-next"' + (c.busy ? ' disabled' : '') + '>' + esc(t('corpus.next')) + '</button>' : '') + '</div>');
    bindBack(main);
    $$('[data-read-corpus]', main).forEach((button) => button.addEventListener('click', async () => {
      const box = button.nextElementSibling;
      if (!box.hidden) { box.hidden = true; button.textContent = t('corpus.readRepository'); return; }
      button.disabled = true; button.textContent = t('corpus.searching');
      try {
        let data = repositoryReads.get(button.dataset.readCorpus);
        if (!data) {
          const record = indexRecords.get(button.dataset.readCorpus);
          data = record ? await apiCall('repository_read', { path: record.repository_path, ref: record.repository_ref, hash: record.hash }) : await apiCall('repository_read', { id: button.dataset.readCorpus });
          if (repositoryReads.size >= 3) repositoryReads.delete(repositoryReads.keys().next().value);
          repositoryReads.set(button.dataset.readCorpus, data);
        }
        box.textContent = data.markdown; box.hidden = false; button.textContent = t('corpus.hideText');
      } catch (e) { box.textContent = t('corpus.unavailable'); box.hidden = false; button.textContent = t('corpus.readRepository'); }
      finally { button.disabled = false; }
    }));
    const sync = () => { c.query = $('#corpus-query').value; c.scope = $('#corpus-scope').value; c.uf = $('#corpus-uf').value; c.municipality = $('#corpus-city').value; const organ = $('#corpus-organ'); c.organ = organ ? organ.value : ''; const acts = $('#corpus-acts'); c.federalActs = !!(acts && acts.checked); };
    $('#corpus-scope').addEventListener('change', () => { sync(); render({ keep: true }); });
    $('#corpus-kind').addEventListener('change', () => { sync(); if (corpusController) { corpusController.abort(); corpusController = null; } c.kind = $('#corpus-kind').value; c.results = []; c.searched = false; c.busy = false; c.error = ''; c.offset = 0; c.hasMore = false; c.fetchedAt = null; c.stale = false; render({keep:true}); });
    $('#corpus-form').addEventListener('submit', (e) => { e.preventDefault(); sync(); searchCorpus(0); });
    $$('input,select', $('#corpus-form')).forEach((input) => input.addEventListener('input', sync));
    const previous = $('#corpus-prev'), next = $('#corpus-next');
    if (previous) previous.addEventListener('click', () => searchCorpus(Math.max(0, c.offset - 15)));
    if (next) next.addEventListener('click', () => searchCorpus(c.offset + 15));
    if (!c.statsRequested && API_URL) {
      c.statsRequested = true;
      apiCall('corpus_stats', {}).then((data) => { c.stats = data; if (state.view === 'search') render({ keep: true }); })
        .catch(() => { c.stats = { error: true }; if (state.view === 'search') render({ keep: true }); });
    }
    if (INDEX_URL && !lawIndex.manifest && !lawIndex.failed) indexManifest().then(() => { if (state.view === 'search') render({ keep: true }); }).catch(() => { if (state.view === 'search') render({ keep: true }); });
  }
  function indexOrgans() { const m = lawIndex.manifest; return m ? Object.keys(m.units).filter((u) => u.indexOf('reguladores/') === 0).map((u) => u.slice(12)).sort() : []; }
  function indexStatusText() {
    if (!INDEX_URL) return '';
    const m = lawIndex.manifest;
    if (m) return t('corpus.indexReady', { n: Number(m.total || 0).toLocaleString(state.lang), ref: String(m.ref || '').slice(0, 8) });
    return lawIndex.failed ? t('corpus.indexUnavailable') : t('corpus.indexLoading');
  }
  async function searchCorpus(offset) {
    const c = state.corpus;
    if (c.query.trim().length < 2) return;
    const signature = JSON.stringify([c.kind, c.query, c.scope, c.uf, c.municipality]);
    if (signature !== c.lastSearch) offset = 0;
    c.lastSearch = signature;
    if (corpusController) corpusController.abort();
    const ctl = new AbortController(); corpusController = ctl;
    c.busy = true; c.error = ''; c.searched = true; c.offset = offset;
    render({ keep: true });
    try {
      if (c.kind !== 'laws') {
        const data = await apiCall('knowledge_search', { kind: c.kind, query: c.query, offset }, ctl.signal);
        if (corpusController !== ctl) return;
        c.results = Array.isArray(data.results) ? data.results : []; c.hasMore = data.hasMore === true;
        c.fetchedAt = data.fetchedAt || null; c.stale = data.stale === true;
      } else {
        const serverScope = ['federal', 'estadual', 'municipal'].includes(c.scope) ? c.scope : '';
        const wantsIndex = INDEX_URL && (offset === 0);
        const [server, index] = await Promise.allSettled([
          c.scope === 'regulador' ? Promise.resolve({ results: [] }) : apiCall('search', { query: c.query, scope: serverScope, uf: c.uf, municipality: c.municipality, offset }, ctl.signal),
          wantsIndex ? searchIndex(c.query, { scope: c.scope, uf: c.uf, municipality: c.municipality, organ: c.organ, federalActs: c.federalActs, limit: 12 }, ctl.signal) : Promise.resolve({ results: [], units: [] })
        ]);
        if (corpusController !== ctl) return;
        if (server.status === 'rejected' && index.status === 'rejected') throw server.reason;
        const data = server.status === 'fulfilled' ? server.value : { results: [] };
        const fromServer = Array.isArray(data.results) ? data.results : [];
        const known = new Set(fromServer.map((r) => r.repository_path).filter(Boolean));
        const fromIndex = index.status === 'fulfilled' ? index.value.results.filter((r) => !known.has(r.repository_path)) : [];
        c.results = fromServer.concat(fromIndex); c.hasMore = data.hasMore === true;
        c.fetchedAt = data.fetchedAt || null; c.stale = data.stale === true;
        c.indexNotice = index.status === 'rejected' ? t('corpus.indexUnavailable') : (wantsIndex && !index.value.units.length && (c.scope === 'estadual' || c.scope === 'municipal' || c.scope === 'regulador') ? t('corpus.indexNeedsFilter') : '');
        if (server.status === 'rejected' && server.reason && server.reason.code === 'rate_limited') c.error = t('corpus.rateLimit');
      }
    } catch (e) {
      if (corpusController !== ctl) return;
      c.results = []; c.hasMore = false; c.error = t(e && e.code === 'rate_limited' ? 'corpus.rateLimit' : 'corpus.unavailable');
    } finally {
      if (corpusController === ctl) { c.busy = false; if (state.view === 'search') { render({ keep: true }); $('#corpus-results').scrollIntoView({ behavior: 'smooth', block: 'start' }); } }
    }
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
      '<div class="setting stack"><div class="title">' + esc(s.about) + '</div><div class="desc">' + esc(s.aboutText) + '</div><div class="desc muted" id="about-version">' + esc(ASSET_VERSION ? t('settings.aboutVersion', { version: ASSET_VERSION }) : t('settings.aboutDev')) + '</div></div>' +
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
      $('[data-yes]', box).addEventListener('click', () => { state.conversations = []; state.feedback = {}; state.currentId = null; state.drafts.clear(); state.draft = ''; save(); toast(s.deleted); render({ keep: true }); });
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
    main.innerHTML = pageShell(sp.title, '', '<p class="prose">' + esc(sp.intro) + '</p><div class="corpus-coverage"><h2>' + esc(t('corpus.statusTitle')) + '</h2><strong>' + esc(corpusStatsText()) + '</strong><p>' + esc(t('corpus.coverage')) + '</p><button type="button" class="btn btn-secondary" id="refresh-corpus-status">' + esc(t('corpus.refreshStatus')) + '</button></div>' + officialRegistryHTML(sp) + '<details class="demo-registry"><summary>' + esc(sp.demoSection) + '</summary><div class="callout callout-warn">' + ICONS.warn + '<div>' + esc(sp.banner) + '</div></div><div class="registry">' + queue + cards + '</div></details><div class="registry">' + how + '</div>');
    bindBack(main);
    $('#refresh-corpus-status').addEventListener('click', async (event) => { event.target.disabled = true; try { state.corpus.stats = await apiCall('corpus_stats', {}); } catch { state.corpus.stats = {error:true}; } if (state.view === 'sources') renderSources(main); });
    const rf = $('#reg-filter', main);
    if (rf) {
      const applyFilter = () => { const q = norm(rf.value.trim()); let shown = 0; $$('.reg-card[data-law]', main).forEach((card) => { const ok = !q || card.dataset.law.includes(q); card.hidden = !ok; if (ok) shown++; }); $('#reg-count', main).textContent = q ? fmt(sp.filterCount, { n: shown }) : ''; };
      rf.addEventListener('input', applyFilter);
    }
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
    if (state.view !== 'processes' && window.ROSS_TRACKER) window.ROSS_TRACKER.leave();
    document.documentElement.lang = state.lang;
    renderTopbar();
    const main = $('#main');
    const y = opts && opts.keep ? window.scrollY : 0;
    switch (state.view) {
      case 'chat': renderChat(main); break;
      case 'settings': renderSettings(main); break;
      case 'sources': renderSources(main); break;
      case 'search': renderCorpus(main); break;
      case 'processes': window.ROSS_TRACKER.render(main, { t, esc, fmtDate, apiCall, pageShell, bindBack }); break;
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
