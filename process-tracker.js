/* Process consultation is independent of chat history. No provider credentials reach this file. */
(function () {
  'use strict';
  const STORAGE_KEY = 'rossai.processes.v1';
  const MAX_SAVED = 20;
  let saved = [], loaded = false, active = false, deps, root, timer = null, controller = null, requestId = 0;
  const state = { query: '', busy: false, error: '', result: null, notice: '', storageError: false };
  function processNumber(value) {
    if (typeof value !== 'string' || value.length > 40 || /[^\d.\s-]/.test(value)) throw new Error('process_invalid_number');
    const n = value.replace(/\D/g, '');
    if (!/^\d{20}$/.test(n) || /^0+$/.test(n) || !/[1-9]/.test(n[13])) throw new Error('process_invalid_number');
    let rest = 0; for (const digit of n.slice(0, 7) + n.slice(9) + '00') rest = (rest * 10 + Number(digit)) % 97;
    if (String(98 - rest).padStart(2, '0') !== n.slice(7, 9)) throw new Error('process_invalid_number');
    return n;
  }
  function formatNumber(value) { const n = processNumber(value); return n.slice(0, 7) + '-' + n.slice(7, 9) + '.' + n.slice(9, 13) + '.' + n[13] + '.' + n.slice(14, 16) + '.' + n.slice(16); }
  function load() {
    if (loaded) return; loaded = true;
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); const seen = new Set();
      saved = (Array.isArray(data) ? data : []).slice(0, MAX_SAVED).flatMap(item => {
        try {
          const number = processNumber(item.number); if (seen.has(number)) return []; seen.add(number);
          return [{ number, provider: ['djen', 'escavador'].includes(item.provider) ? item.provider : '', tribunal: typeof item.tribunal === 'string' ? item.tribunal.slice(0, 100) : '', checkedAt: typeof item.checkedAt === 'string' ? item.checkedAt : '', keys: Array.isArray(item.keys) ? item.keys.filter(key => typeof key === 'string').slice(0, 100) : [] }];
        } catch { return []; }
      });
    } catch { saved = []; state.storageError = true; }
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); state.storageError = false; }
    catch { state.storageError = true; }
  }
  const tr = (key, vars) => deps.t('processes.' + key, vars);
  const esc = value => deps.esc(value);
  function date(value) { return value && Number.isFinite(Date.parse(value)) ? deps.fmtDate(value) : tr('unknownDate'); }
  function safeURL(value) { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } }
  function movementKey(item) {
    if (item.id) return 'id:' + item.id + (item.version ? ':' + item.version : '');
    const raw = String(item.date || '') + '|' + String(item.text || ''); let hash = 2166136261;
    for (let i = 0; i < raw.length; i++) hash = Math.imul(hash ^ raw.charCodeAt(i), 16777619);
    return 'text:' + (hash >>> 0).toString(16);
  }
  function schedule() {
    clearTimeout(timer); timer = null;
    if (!active || !state.result || !saved.some(item => item.number === state.result.process.number)) return;
    timer = setTimeout(() => {
      if (document.visibilityState === 'hidden') schedule();
      else lookup(state.result.process.number, null, true);
    }, 15 * 60 * 1000);
  }
  function paint() {
    if (!active) return;
    const result = state.result, p = result && result.process;
    const publications = result && result.coverage === 'publications';
    const followed = p && saved.some(item => item.number === p.number);
    let content = '<p class="prose">' + esc(tr('intro')) + '</p>' +
      '<form id="process-form" class="process-form"><label for="process-number">' + esc(tr('number')) + '</label><div class="process-query"><input id="process-number" type="text" inputmode="numeric" maxlength="40" autocomplete="off" required placeholder="NNNNNNN-DD.AAAA.J.TR.OOOO" value="' + esc(state.query) + '" aria-describedby="process-hint process-error"><button type="submit" class="btn"' + (state.busy ? ' disabled' : '') + '>' + esc(tr(state.busy ? 'loading' : 'search')) + '</button></div><p id="process-hint" class="muted">' + esc(tr('hint')) + '</p></form>' +
      '<div id="process-error" role="alert">' + (state.error ? '<p class="callout callout-warn">' + esc(state.error) + '</p>' : '') + '</div>' +
      (state.storageError ? '<p class="callout callout-warn">' + esc(tr('storageError')) + '</p>' : '') +
      '<div id="process-result" aria-live="polite" aria-busy="' + state.busy + '">' + (state.notice ? '<p class="callout callout-info">' + esc(state.notice) + '</p>' : '');
    if (p) {
      if (publications) content += '<p class="callout callout-info">' + esc(tr('publicationCoverage')) + '</p>';
      content += '<article class="process-card"><header><h2>' + esc(formatNumber(p.number)) + '</h2><span class="badge badge-oficial">' + esc(p.tribunal || tr('tribunalUnknown')) + '</span></header>' +
        '<p class="muted">' + esc(tr('source')) + ': ' + esc(p.provider || tr('unknownSource')) + ' · ' + esc(tr('consultedAt')) + ': ' + esc(date(result.fetchedAt)) + '</p>' +
        '<dl class="process-meta">' + [[tr('parties'), [p.activeParty, p.passiveParty].filter(Boolean).join(' × ')], [tr(publications ? 'publicationCourt' : 'court'), p.court], [tr('className'), p.className], [tr('subject'), p.subject], [tr(publications ? 'lastPublication' : 'lastMovement'), p.lastMovementAt ? date(p.lastMovementAt) : ''], [tr('verifiedAt'), p.verifiedAt ? date(p.verifiedAt) : '']].filter(pair => pair[1]).map(pair => '<div><dt>' + esc(pair[0]) + '</dt><dd>' + esc(pair[1]) + '</dd></div>').join('') + '</dl>' +
        '<p class="muted">' + esc(tr(publications ? 'publicationFreshness' : 'freshness')) + '</p><div class="row"><button type="button" id="process-follow" class="btn btn-secondary"' + (state.busy ? ' disabled' : '') + '>' + esc(tr(followed ? 'unfollow' : 'follow')) + '</button><button type="button" id="process-refresh" class="btn btn-secondary"' + (state.busy ? ' disabled' : '') + '>' + esc(tr('refresh')) + '</button>' +
        (safeURL(p.sourceURL) ? '<a class="btn btn-secondary" href="' + esc(safeURL(p.sourceURL)) + '" target="_blank" rel="noopener noreferrer">' + esc(tr('openSource')) + '</a>' : '') + '</div>' +
        '<section class="process-history"><h3>' + esc(tr(publications ? 'publications' : 'history')) + '</h3>' + (result.movementsUnavailable ? '<p class="callout callout-warn">' + esc(tr('movementsUnavailable')) + '</p>' : result.movements.length ? '<ol>' + result.movements.map(item => '<li><time>' + esc((publications ? tr('availableAt') + ': ' : '') + date(item.date)) + '</time>' + (item.cancelled ? '<p class="callout callout-warn">' + esc(tr('cancelledPublication')) + '</p>' : '') + '<p>' + esc(item.text) + '</p>' + (item.truncated ? '<p class="muted">' + esc(tr('excerptNotice')) + '</p>' : '') + '<span class="muted">' + esc(item.source || '') + '</span>' + (safeURL(item.url) ? ' <a href="' + esc(safeURL(item.url)) + '" target="_blank" rel="noopener noreferrer">' + esc(tr('openSource')) + '</a>' : '') + '</li>').join('') + '</ol>' : '<p class="muted">' + esc(tr(publications ? 'emptyPublications' : 'emptyMovements')) + '</p>') +
        (result.truncated ? '<p class="muted">' + esc(tr('limitedResults')) + '</p>' : '') +
        (result.nextPage ? '<button type="button" id="process-more" class="btn btn-secondary"' + (state.busy ? ' disabled' : '') + '>' + esc(tr(publications ? 'morePublications' : 'more')) + '</button>' : '') + '</section></article>';
    }
    content += '</div><section class="process-saved"><h2>' + esc(tr('savedTitle')) + '</h2><p class="muted">' + esc(tr('localNotice')) + '</p>' +
      (saved.length ? '<ul>' + saved.map(item => '<li><button type="button" class="btn btn-secondary" data-process-open="' + esc(item.number) + '">' + esc(formatNumber(item.number)) + (item.tribunal ? ' · ' + esc(item.tribunal) : '') + '</button><button type="button" class="icon-btn" data-process-remove="' + esc(item.number) + '" aria-label="' + esc(tr('remove') + ' ' + formatNumber(item.number)) + '">×</button></li>').join('') + '</ul>' : '<p class="muted">' + esc(tr('emptySaved')) + '</p>') + '</section>';
    root.innerHTML = deps.pageShell(tr('title'), '', content); deps.bindBack(root);
    root.querySelector('#process-number').addEventListener('input', e => { state.query = e.target.value; });
    root.querySelector('#process-form').addEventListener('submit', e => { e.preventDefault(); lookup(state.query); });
    root.querySelector('#process-refresh')?.addEventListener('click', () => lookup(p.number));
    root.querySelector('#process-more')?.addEventListener('click', () => lookup(p.number, result.nextPage));
    root.querySelector('#process-follow')?.addEventListener('click', () => {
      if (followed) saved = saved.filter(item => item.number !== p.number);
      else {
        if (saved.length >= MAX_SAVED) { state.error = tr('limit'); paint(); return; }
        saved.push({ number: p.number, provider: publications ? 'djen' : 'escavador', tribunal: p.tribunal, checkedAt: result.fetchedAt, keys: result.movements.map(movementKey) });
      }
      persist(); paint(); schedule();
    });
    root.querySelectorAll('[data-process-open]').forEach(button => button.addEventListener('click', () => lookup(button.dataset.processOpen)));
    root.querySelectorAll('[data-process-remove]').forEach(button => button.addEventListener('click', () => { saved = saved.filter(item => item.number !== button.dataset.processRemove); persist(); paint(); schedule(); }));
  }
  async function lookup(value, page = null, automatic = false) {
    let number;
    try { number = processNumber(value); } catch { state.error = tr('invalid'); paint(); return; }
    if (automatic && state.busy) { schedule(); return; }
    controller?.abort(); controller = new AbortController(); const signal = controller.signal, id = ++requestId;
    clearTimeout(timer); state.query = formatNumber(number); state.error = ''; state.notice = ''; state.busy = true;
    if (state.result && state.result.process.number !== number) state.result = null;
    paint();
    try {
      const data = await deps.apiCall('process_lookup', { number, page }, signal);
      if (!active || id !== requestId) return;
      if (!data?.process || processNumber(data.process.number) !== number || !Array.isArray(data.movements)) throw { code: 'process_unavailable' };
      const old = page && state.result ? state.result.movements : [];
      const merged = new Map(); old.concat(data.movements).forEach(item => merged.set(item.id || movementKey(item), item)); data.movements = Array.from(merged.values());
      const item = saved.find(item => item.number === number);
      if (item && !page && !data.movementsUnavailable) {
        const provider = data.coverage === 'publications' ? 'djen' : 'escavador';
        if (item.provider !== provider) item.keys = [];
        const keys = data.movements.map(movementKey);
        const added = item.keys.length ? keys.filter(key => !item.keys.includes(key)).length : 0;
        if (added) state.notice = tr(data.coverage === 'publications' ? 'newPublications' : 'newMovements', { n: added });
        item.provider = provider; item.keys = Array.from(new Set(keys.concat(item.keys))).slice(0, 100); item.checkedAt = data.fetchedAt; persist();
      }
      state.result = data;
    } catch (error) {
      if (!active || id !== requestId) return;
      const code = error && error.code;
      state.error = tr(({ process_not_configured: 'notConfigured', process_credentials: 'notConfigured', process_credits: 'unavailable', process_not_found: 'notFound', process_restricted: 'restricted', process_invalid_number: 'invalid', rate_limited: 'rateLimited' })[code] || 'unavailable');
    } finally {
      if (active && id === requestId) { state.busy = false; paint(); schedule(); }
    }
  }
  function render(main, helpers) { deps = helpers; root = main; active = true; load(); paint(); schedule(); }
  function leave() { active = false; clearTimeout(timer); timer = null; ++requestId; controller?.abort(); controller = null; state.busy = false; }
  window.ROSS_TRACKER = { render, leave, processNumber, formatNumber };
})();
