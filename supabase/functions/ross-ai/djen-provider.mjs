/* Official, public DJEN read API. This adapter never logs in or writes communications. */
import { processNumber, ProcessError, jsonBody } from './process-provider.mjs';

const BASE = 'https://comunicaapi.pje.jus.br/api/v1/comunicacao';
const PAGE_SIZE = 100;
const clean = (value, length = 300) => typeof value === 'string' ? value.slice(0, length) : '';
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) ? value : '';
function plainText(value) {
  return clean(value, 200000).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(?:br\b[^>]*|\/(?:p|div|li|tr|h[1-6]))\s*>/gi, '\n').replace(/<[^>]*>/g, '')
    .replace(/&#(?:x([0-9a-f]+)|(\d+));/gi, (_, hex, dec) => { const n = parseInt(hex || dec, hex ? 16 : 10); return n > 0 && n <= 0x10ffff && !(n >= 0xd800 && n <= 0xdfff) ? String.fromCodePoint(n) : ''; })
    .replace(/&(amp|lt|gt|quot|apos|nbsp);/gi, (_, entity) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }[entity.toLowerCase()]))
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*\n/g, '\n\n').trim();
}
function sourceURL(item) {
  if (/^[a-zA-Z0-9]{10,100}$/.test(item.hash || '')) return BASE + '/' + item.hash + '/certidao';
  try { const u = new URL(item.link); if (u.protocol === 'https:') return u.href; } catch { /* optional */ }
  return 'https://comunica.pje.jus.br/';
}
export function createDjenClient({ fetchImpl = fetch, now = () => Date.now() } = {}) {
  const cache = new Map(), pending = new Map(); let starts = [], blockedUntil = 0;
  return async function lookupDjen({ number, page }) {
    const n = processNumber(number);
    if (page != null && (typeof page !== 'object' || Object.keys(page).some(key => key !== 'djenPage') || !Number.isInteger(page.djenPage) || page.djenPage < 1 || page.djenPage > 100)) throw new ProcessError('process_invalid_page', 400);
    const index = page?.djenPage || 1, key = n + ':' + index, time = now();
    const cached = cache.get(key);
    if (cached && time - cached.at < 5 * 60 * 1000) return { ...cached.data, cached: true };
    if (pending.has(key)) return pending.get(key);
    starts = starts.filter(at => time - at < 60_000);
    if (time < blockedUntil || starts.length >= 10) throw new ProcessError('rate_limited', 429);
    starts.push(time);
    const work = (async () => {
      const url = BASE + '?' + new URLSearchParams({ numeroProcesso: n, pagina: String(index), itensPorPagina: String(PAGE_SIZE) });
      let response;
      try { response = await fetchImpl(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(25_000), redirect: 'error' }); }
      catch { throw new ProcessError('process_unavailable', 504); }
      if (!response.ok) {
        await response.body?.cancel();
        if (response.status === 429) { blockedUntil = now() + 60_000; throw new ProcessError('rate_limited', 429); }
        throw new ProcessError('process_unavailable');
      }
      const data = await jsonBody(response);
      if (data.status !== 'success' || !Array.isArray(data.items) || !Number.isInteger(data.count) || data.count < 0 || data.items.length > PAGE_SIZE) throw new ProcessError('process_unavailable');
      const seen = new Set();
      const items = data.items.filter(item => {
        let returned; try { returned = processNumber(item.numero_processo); } catch { throw new ProcessError('process_unavailable'); }
        if (returned !== n) throw new ProcessError('process_unavailable');
        const id = clean(String(item.id || item.hash || ''), 100);
        if (!id || seen.has(id)) return false; seen.add(id); return true;
      }).sort((a, b) => validDate(b.data_disponibilizacao).localeCompare(validDate(a.data_disponibilizacao)));
      const movements = items.map(item => {
        const text = plainText(item.texto); const cancelled = item.ativo === false || !!item.data_cancelamento || item.status === 'CANCELADO';
        return { id: 'djen-' + String(item.id || item.hash), date: validDate(item.data_disponibilizacao), text: text.slice(0, 12000) + (text.length > 12000 ? '…' : ''), truncated: text.length > 12000, source: [clean(item.siglaTribunal), 'DJEN', clean(item.nomeOrgao)].filter(Boolean).join(' · '), url: sourceURL(item), cancelled, version: cancelled ? 'cancelled' : 'active' };
      });
      const first = items[0] || {};
      const result = {
        coverage: 'publications', found: movements.length > 0, count: Math.min(data.count, 10000), truncated: data.count >= 10000, cached: false,
        process: { number: n, tribunal: [...new Set(items.map(item => clean(item.siglaTribunal)).filter(Boolean))].join(', '), court: clean(first.nomeOrgao), className: clean(first.nomeClasse), activeParty: '', passiveParty: '', subject: '', lastMovementAt: validDate(first.data_disponibilizacao), verifiedAt: '', sourceURL: 'https://comunica.pje.jus.br/', provider: 'CNJ · DJEN' },
        movements, nextPage: index * PAGE_SIZE < Math.min(data.count, 10000) ? { djenPage: index + 1 } : null,
        movementsUnavailable: false, fetchedAt: new Date(now()).toISOString(),
      };
      if (cache.size >= 30) cache.delete(cache.keys().next().value);
      cache.set(key, { at: now(), data: result }); return result;
    })();
    pending.set(key, work);
    try { return await work; } finally { pending.delete(key); }
  };
}
export const lookupDjen = createDjenClient();
