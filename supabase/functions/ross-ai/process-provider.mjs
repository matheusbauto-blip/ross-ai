/* Read-only process consultation. Credentials and provider payloads stay on the server. */
const BASE = 'https://api.escavador.com/api/v2';
export class ProcessError extends Error {
  constructor(code, status = 502) { super(code); this.code = code; this.status = status; }
}
export function processNumber(value) {
  if (typeof value !== 'string' || value.length > 40 || /[^\d.\s-]/.test(value)) throw new ProcessError('process_invalid_number', 400);
  const n = value.replace(/\D/g, '');
  if (!/^\d{20}$/.test(n) || /^0+$/.test(n) || !/[1-9]/.test(n[13])) throw new ProcessError('process_invalid_number', 400);
  const base = n.slice(0, 7) + n.slice(9) + '00';
  let rest = 0; for (const digit of base) rest = (rest * 10 + Number(digit)) % 97;
  if (String(98 - rest).padStart(2, '0') !== n.slice(7, 9)) throw new ProcessError('process_invalid_number', 400);
  return n;
}
const text = (v, max = 300) => typeof v === 'string' ? v.slice(0, max) : '';
const date = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}(?:T|$)/.test(v) && Number.isFinite(Date.parse(v)) ? v : '';
function safeURL(value) { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : ''; } catch { return ''; } }
export async function jsonBody(response) {
  if (!response.body) throw new ProcessError('process_unavailable');
  const reader = response.body.getReader(); const parts = []; let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      bytes += value.byteLength; if (bytes > 2 * 1024 * 1024) { await reader.cancel(); throw new ProcessError('process_unavailable'); }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  const raw = new Uint8Array(bytes); let offset = 0; for (const part of parts) { raw.set(part, offset); offset += part.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(raw)); } catch { throw new ProcessError('process_unavailable'); }
}
export async function lookupProcess({ number, page, apiKey, fetchImpl = fetch }) {
  const n = processNumber(number);
  if (page !== undefined && page !== null && (typeof page !== 'object' || typeof page.cursor !== 'string' || !page.cursor || page.cursor.length > 1500 || (page.li !== undefined && (typeof page.li !== 'string' || page.li.length > 200)))) throw new ProcessError('process_invalid_page', 400);
  if (!apiKey) throw new ProcessError('process_not_configured', 503);
  async function get(path) {
    let response;
    try { response = await fetchImpl(BASE + path, { headers: { Authorization: 'Bearer ' + apiKey, Accept: 'application/json' }, signal: AbortSignal.timeout(25_000), redirect: 'error' }); }
    catch { throw new ProcessError('process_unavailable', 504); }
    if (!response.ok) {
      await response.body?.cancel();
      if (response.status === 404) throw new ProcessError('process_not_found', 404);
      if (response.status === 429) throw new ProcessError('rate_limited', 429);
      if ([401, 403].includes(response.status)) throw new ProcessError('process_credentials', 503);
      if (response.status === 402) throw new ProcessError('process_credits', 503);
      throw new ProcessError('process_unavailable');
    }
    return jsonBody(response);
  }
  const path = '/processos/numero_cnj/' + n;
  const data = await get(path);
  let returnedNumber; try { returnedNumber = processNumber(data && data.numero_cnj); } catch { throw new ProcessError('process_unavailable'); }
  if (returnedNumber !== n || !Array.isArray(data.fontes)) throw new ProcessError('process_unavailable');
  const restricted = value => [true, 1, 'true', '1'].includes(value);
  if (restricted(data.segredo_justica) || data.fontes.some(f => restricted(f.segredo_justica))) throw new ProcessError('process_restricted', 403);
  const source = data.fontes.find(f => f.tipo === 'TRIBUNAL') || data.fontes[0] || {};
  const process = {
    number: n, activeParty: text(data.titulo_polo_ativo), passiveParty: text(data.titulo_polo_passivo),
    tribunal: text(source.sigla || data.unidade_origem?.tribunal_sigla), court: text(data.unidade_origem?.nome),
    className: text(source.capa?.classe), subject: text(source.capa?.assunto),
    lastMovementAt: date(data.data_ultima_movimentacao), verifiedAt: date(data.data_ultima_verificacao),
    sourceURL: safeURL(source.url || source.link_web), provider: 'Escavador',
  };
  const params = new URLSearchParams({ limit: '20', ordem: 'desc' });
  if (page !== undefined && page !== null) {
    params.set('cursor', page.cursor); if (page.li) params.set('li', page.li);
  }
  let list;
  try { list = await get(path + '/movimentacoes?' + params); }
  catch (error) {
    if (error.code === 'rate_limited' || page) throw error;
    return { process, movements: [], nextPage: null, movementsUnavailable: true, fetchedAt: new Date().toISOString() };
  }
  if (!Array.isArray(list.items)) throw new ProcessError('process_unavailable');
  const seen = new Set();
  const movements = list.items.slice(0, 100).map(item => ({
    id: String(item.id || '').slice(0, 80), date: date(item.data), text: text(item.conteudo, 12000),
    source: text(item.fonte?.nome || item.fonte?.sigla), url: safeURL(item.fonte?.link_web),
  })).filter(item => {
    const key = item.id || item.date + '|' + item.text;
    if (!item.text || seen.has(key)) return false; seen.add(key); return true;
  });
  let nextPage = null;
  if (list.links?.next) {
    try {
      const url = new URL(list.links.next);
      if (url.origin !== new URL(BASE).origin || url.pathname !== '/api/v2' + path + '/movimentacoes') throw new Error();
      const cursor = url.searchParams.get('cursor'); const li = url.searchParams.get('li') || '';
      if (cursor && cursor.length <= 1500 && li.length <= 200) nextPage = { cursor, li };
    } catch { /* Untrusted pagination URLs never become server fetch destinations. */ }
  }
  return { process, movements, nextPage, movementsUnavailable: false, fetchedAt: new Date().toISOString() };
}
