#!/usr/bin/env node
/* ROSS AI — ingestão de legislação a partir da fonte oficial (Planalto).
   Converte o HTML compilado em JSON por artigo, com situação (vigente, revogado, vetado), notas de alteração,
   hash do texto bruto e data da captura. Também detecta mudanças para conferência antes de atualizar a base.

   Uso:
     node scripts/ingest-laws.mjs                  baixa, converte e grava data/laws/*.json e data/catalog.json
     node scripts/ingest-laws.mjs --check          baixa e compara com a base atual; grava data/pending.json, sem alterar a base
     node scripts/ingest-laws.mjs --approve        aplica as mudanças pendentes e registra nova versão no catálogo
     node scripts/ingest-laws.mjs --from-dir DIR   usa arquivos já baixados em DIR/<id>.html em vez de baixar
     node scripts/ingest-laws.mjs --only l8078,d7962
     node scripts/ingest-laws.mjs --source camara  captura o texto atualizado na Legislação Informatizada da Câmara
                                                   (resolvido pelo LexML) quando o Planalto não responde a clientes automatizados
*/
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const LAWS_DIR = path.join(DATA, 'laws');
const CONFIG = JSON.parse(await fs.readFile(path.join(ROOT, 'scripts', 'laws.config.json'), 'utf8'));
const UA = 'ROSS-AI-ingest/0.1 (+https://github.com/matheusbauto-blip/ross-ai)';

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const only = opt('--only') ? opt('--only').split(',') : null;
const fromDir = opt('--from-dir');
const sourcePref = opt('--source') || 'planalto';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CAMARA_NAME = 'Câmara dos Deputados — Legislação Informatizada (texto atualizado)';
const PLANALTO_NAME = 'Planalto — Portal da Legislação (texto compilado)';

/* ---------- HTML → parágrafos ---------- */
const ENT = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", ordm: 'º', ordf: 'ª', sect: '§', deg: '°', ndash: '–', mdash: '—', laquo: '«', raquo: '»', hellip: '…', middot: '·' };
function unescape(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') { const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m; }
    const k = e.toLowerCase(); return ENT[k] !== undefined ? ENT[k] : m;
  });
}
const stripTags = (s) => unescape(s.replace(/<br\s*\/?>/gi, ' / ').replace(/<[^>]+>/g, ' '));
const clean = (s) => s.replace(/[ \s]+/g, ' ').replace(/\s+([,.;:)])/g, '$1').trim();

function htmlToParagraphs(html) {
  html = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '');
  const out = [];
  const re = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(html))) {
    let inner = m[1];
    if (!clean(stripTags(inner))) continue;
    const struck = [];
    inner = inner.replace(/<(strike|s|del)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, tag, t) => { const c = clean(stripTags(t)); if (c) struck.push(c); return ' '; });
    const text = clean(stripTags(inner));
    if (!text) { out.push({ text: struck.join(' '), struck: true }); continue; }
    out.push({ text, struck: false, hist: struck });
  }
  return out;
}

/* ---------- parágrafos → artigos ---------- */
const RX_ART = /^Art\.?\s*(\d{1,3}(?:\.\d{3})+|\d+)(?:[ºo°])?(?:-([A-Z]{1,2})(?![a-záéíóúâêôãõç]))?\s*[.:\-–—]?\s*(.*)$/s;
const RX_HEAD = /^(LIVRO|PARTE|T[ÍI]TULO|CAP[ÍI]TULO|SE[ÇC][ÃA]O|Se[çc][ãa]o|SUBSE[ÇC][ÃA]O|Subse[çc][ãa]o)\b/;
const RX_STOP = /^(Bras[íi]lia,\s|Rio de Janeiro,\s|Este texto n[ãa]o substitui|\*\s*$)/;
const RX_ADCT = /ATO DAS DISPOSI[ÇC][ÕO]ES CONSTITUCIONAIS TRANSIT[ÓO]RIAS/;

function parseArticles(paras) {
  const articles = [];
  let cur = null, heads = [], part = '', seen = new Set();
  const flush = () => { if (cur) { finish(cur); articles.push(cur); cur = null; } };
  for (const p of paras) {
    const t = p.text;
    if (p.struck) {
      const sa = /^[“"'‘]/.test(t) ? null : t.match(RX_ART);
      if (sa) {
        const num = sa[1].replace(/\./g, ''); const id = (part ? part + '-' : '') + num + (sa[2] ? '-' + sa[2] : '');
        if (!seen.has(id)) { flush(); seen.add(id); cur = { id, label: 'Art. ' + num + (sa[2] ? '-' + sa[2] : ''), heading: heads.map((h) => h.text).join(' › '), paras: [t], hist: [], struckHeader: true }; continue; }
      }
      if (cur) cur.hist.push(t); continue;
    }
    if (RX_ADCT.test(t)) { flush(); part = 'ADCT'; heads = []; continue; }
    if (RX_HEAD.test(t) && t.length < 160) {
      const lvl = t.match(RX_HEAD)[1].toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const order = ['LIVRO', 'PARTE', 'TITULO', 'CAPITULO', 'SECAO', 'SUBSECAO'];
      const idx = order.indexOf(lvl);
      heads = heads.filter((h) => h.idx < idx); heads.push({ idx, text: t.replace(/\s*\/\s*/g, ' · ') });
      continue;
    }
    let a = /^[“"'‘]/.test(t) ? null : t.match(RX_ART);
    let struckHeader = false, headerText = t;
    if (!a && p.hist && p.hist.length && RX_ART.test(p.hist[0]) && !/^[“"'‘]/.test(p.hist[0])) {
      /* cabeçalho riscado (artigo revogado) seguido da nota de revogação */
      a = p.hist[0].match(RX_ART); struckHeader = true; headerText = p.hist[0] + ' ' + t;
    }
    if (a) {
      const num = a[1].replace(/\./g, '');
      const id = (part ? part + '-' : '') + num + (a[2] ? '-' + a[2] : '');
      const range = a[3] && a[3].match(/^a\s+(\d{1,3}(?:\.\d{3})+|\d+)\.?\s*\((Revogad|REVOGAD)/);
      if (range) {
        /* "Art. 1.620. a 1.629. (Revogados pela Lei ...)" → uma entrada revogada por número */
        flush();
        const from = parseInt(num, 10), to = parseInt(range[1].replace(/\./g, ''), 10);
        for (let k = from; k <= to && k - from < 200; k++) {
          const rid = (part ? part + '-' : '') + k; if (seen.has(rid)) continue; seen.add(rid);
          const art = { id: rid, label: 'Art. ' + k, heading: heads.map((h) => h.text).join(' › '), paras: ['Art. ' + k + '. ' + t.replace(RX_ART, '').trim()], hist: [], struckHeader: true };
          finish(art); articles.push(art);
        }
        continue;
      }
      if (!seen.has(id)) {
        flush(); seen.add(id);
        cur = { id, label: 'Art. ' + num + (a[2] ? '-' + a[2] : ''), heading: heads.map((h) => h.text).join(' › '), paras: [headerText], hist: struckHeader ? [] : (p.hist ? p.hist.slice() : []), struckHeader };
        continue;
      }
    }
    if (cur) {
      if (RX_STOP.test(t)) { flush(); continue; }
      cur.paras.push(t); if (p.hist && p.hist.length) cur.hist.push(...p.hist);
    }
  }
  flush();
  return articles;
}
/* O Planalto costuma mostrar a redação antiga riscada antes da atual. Se, depois do cabeçalho riscado, o mesmo artigo
   reaparece com redação em vigor, ele não foi revogado: vale a redação atual (antes, o artigo inteiro saía como
   revogado e sumia da busca — caso dos arts. 6º e 201 da Constituição). */
function sameArticle(text, label) {
  const m = /^[“"'‘]/.test(text) ? null : text.match(RX_ART);
  return !!m && 'Art. ' + m[1].replace(/\./g, '') + (m[2] ? '-' + m[2] : '') === label;
}
function finish(a) {
  if (a.struckHeader) {
    const again = a.paras.findIndex((p, i) => i > 0 && sameArticle(p, a.label));
    if (again > 0) { a.paras = a.paras.slice(again); a.struckHeader = false; a.hist.push('(redação anterior substituída)'); }
  }
  a.text = a.paras.join('\n');
  const caput = a.paras[0] || '';
  if (a.struckHeader || /\(\s*(?:[Aa]rtigo\s+|[Aa]rt\.\s+)?(?:Revogad[oa]|REVOGAD[OA]|revogad[oa])\b/.test(caput.slice(0, 260)) || /^Art\.[^(]{0,20}\(\s*(?:Revogad|revogad|REVOGAD)/.test(caput)) a.status = 'revogado';
  else if (/\(VETADO\)/.test(caput.slice(0, 260))) a.status = 'vetado';
  else a.status = 'vigente';
  const nota = a.text.match(/\(([^()]{0,60}?(?:[Rr]eda[çc][ãa]o dada|[Ii]nclu[íi]d[oa]|[Aa]crescid[oa]|[Rr]enumerad[oa]|[Aa]crescentad[oa])[^()]*)\)/);
  if (nota) a.nota = nota[1].replace(/\s+/g, ' ').trim();
  a.hasHistory = a.hist.length > 0;
  delete a.paras; delete a.hist; delete a.struckHeader;
}

/* ---------- download ---------- */
async function getBytes(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' } });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' em ' + url);
  return Buffer.from(await res.arrayBuffer());
}
/* Resolve, pelo LexML, o endereço do texto atualizado na Legislação Informatizada da Câmara. */
async function resolveCamara(law) {
  if (!law.lexml) throw new Error(law.id + ': sem URN LexML');
  const page = decodeBytes(await getBytes('https://www.lexml.gov.br/urn/' + law.lexml));
  const m = page.match(/https?:\/\/www2\.camara\.(?:gov|leg)\.br\/legin\/[^"'\s<>]+-norma-(p[a-z])\.html/);
  if (!m) throw new Error(law.id + ': LexML não aponta para a Câmara');
  return m[0].replace(/^http:\/\/www2\.camara\.gov\.br/, 'https://www2.camara.leg.br').replace('-norma-', '-normaatualizada-');
}
function decodeBytes(bytes) {
  let enc;
  if (bytes[0] === 0xff && bytes[1] === 0xfe) enc = 'utf-16le';
  else if (bytes[0] === 0xfe && bytes[1] === 0xff) enc = 'utf-16be';
  else {
    const head = bytes.subarray(0, 4096).toString('latin1');
    const m = head.match(/charset=["']?([\w-]+)/i);
    enc = (m ? m[1] : 'windows-1252').toLowerCase();
    if (/^(iso-8859-1|latin1|cp1252|windows-1252|ansi)$/.test(enc)) enc = 'windows-1252';
  }
  return new TextDecoder(enc).decode(bytes).replace(/^\ufeff/, '');
}
async function fetchLaw(law) {
  let bytes, textSource = { name: PLANALTO_NAME, url: law.url };
  if (fromDir) bytes = await fs.readFile(path.join(fromDir, law.id + '.html'));
  else if (sourcePref === 'camara' || law.textSource === 'camara') {
    const curl = await resolveCamara(law); await sleep(300);
    bytes = await getBytes(curl); textSource = { name: CAMARA_NAME, url: curl };
  } else {
    bytes = await getBytes(law.url);
  }
  const html = decodeBytes(bytes);
  return { html, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, textSource };
}

function buildLaw(law, parsed, retrievedAt) {
  const articles = parseArticles(htmlToParagraphs(parsed.html));
  if (!articles.length) throw new Error(law.id + ': nenhum artigo encontrado (página vazia ou de erro)');
  return {
    id: law.id, name: law.name, shortName: law.shortName, number: law.number, type: law.type, date: law.date,
    url: law.url, lexml: law.lexml, jurisdiction: CONFIG.jurisdiction, source: parsed.textSource ? parsed.textSource.name : CONFIG.source, textUrl: parsed.textSource ? parsed.textSource.url : law.url, index: CONFIG.index,
    retrievedAt, sha256: parsed.sha256, bytes: parsed.bytes, articleCount: articles.length,
    vigentes: articles.filter((a) => a.status === 'vigente').length, revogados: articles.filter((a) => a.status !== 'vigente').length,
    articles
  };
}
const today = () => new Date().toISOString().slice(0, 10);
async function readJSON(p, fallback) { try { return JSON.parse(await fs.readFile(p, 'utf8')); } catch (e) { return fallback; } }

/* ---------- comandos ---------- */
const laws = CONFIG.laws.filter((l) => !only || only.includes(l.id));
const catalog = await readJSON(path.join(DATA, 'catalog.json'), { laws: [] });
const byId = Object.fromEntries(catalog.laws.map((l) => [l.id, l]));

if (flag('--approve')) {
  const pending = await readJSON(path.join(DATA, 'pending.json'), null);
  if (!pending || !pending.changes.length) { console.log('Nada pendente.'); process.exit(0); }
  for (const ch of pending.changes) {
    const law = CONFIG.laws.find((l) => l.id === ch.lawId); if (!law) continue;
    const parsed = await fetchLaw(law); const built = buildLaw(law, parsed, new Date().toISOString());
    await fs.writeFile(path.join(LAWS_DIR, law.id + '.json'), JSON.stringify(built, null, 1));
    const entry = byId[law.id]; const versions = entry ? entry.versions : [];
    versions.push({ id: 'v' + (versions.length + 1), date: today(), sha256: built.sha256, note: 'Atualização aprovada: ' + ch.articles.length + ' artigo(s) alterado(s)' });
    byId[law.id] = Object.assign({}, entry || {}, summary(law, built), { versions });
    console.log('aprovado:', law.id, ch.articles.length, 'artigo(s)');
  }
  await writeCatalog(); await fs.writeFile(path.join(DATA, 'pending.json'), JSON.stringify({ checkedAt: new Date().toISOString(), changes: [] }, null, 1));
  process.exit(0);
}

const results = [];
for (const law of laws) {
  process.stdout.write(law.id + ' … ');
  try {
    if (!fromDir) await sleep(400);
    const parsed = await fetchLaw(law);
    const built = buildLaw(law, parsed, new Date().toISOString());
    results.push({ law, built });
    console.log(built.articleCount + ' artigos (' + built.vigentes + ' vigentes, ' + built.revogados + ' revogados/vetados), ' + (parsed.bytes / 1024).toFixed(0) + ' KB');
  } catch (e) { console.log('ERRO: ' + e.message); }
}

if (flag('--check')) {
  const changes = [];
  for (const { law, built } of results) {
    const old = await readJSON(path.join(LAWS_DIR, law.id + '.json'), null);
    if (!old) { changes.push({ lawId: law.id, name: law.name, kind: 'nova', sha256New: built.sha256, articles: [] }); continue; }
    if (old.sha256 === built.sha256) continue;
    const oldMap = new Map(old.articles.map((a) => [a.id, a])), newMap = new Map(built.articles.map((a) => [a.id, a]));
    const arts = [];
    for (const [id, a] of newMap) { const o = oldMap.get(id); if (!o) arts.push({ id, label: a.label, type: 'added', before: '', after: a.text }); else if (o.text !== a.text) arts.push({ id, label: a.label, type: 'modified', before: o.text, after: a.text }); }
    for (const [id, o] of oldMap) if (!newMap.has(id)) arts.push({ id, label: o.label, type: 'removed', before: o.text, after: '' });
    if (arts.length) changes.push({ lawId: law.id, name: law.name, kind: 'alterada', sha256Old: old.sha256, sha256New: built.sha256, detectedAt: new Date().toISOString(), articles: arts });
  }
  await fs.mkdir(DATA, { recursive: true });
  await fs.writeFile(path.join(DATA, 'pending.json'), JSON.stringify({ checkedAt: new Date().toISOString(), changes }, null, 1));
  console.log(changes.length ? changes.length + ' norma(s) com alterações detectadas → data/pending.json (confira e rode --approve)' : 'Nenhuma alteração detectada.');
  process.exit(0);
}

await fs.mkdir(LAWS_DIR, { recursive: true });
for (const { law, built } of results) {
  await fs.writeFile(path.join(LAWS_DIR, law.id + '.json'), JSON.stringify(built, null, 1));
  const entry = byId[law.id];
  const versions = entry && entry.versions ? entry.versions : [];
  if (!versions.length || versions[versions.length - 1].sha256 !== built.sha256) versions.push({ id: 'v' + (versions.length + 1), date: today(), sha256: built.sha256, note: versions.length ? 'Texto atualizado na recaptura' : 'Primeira captura do texto compilado' });
  byId[law.id] = Object.assign({}, entry || {}, summary(law, built), { versions });
}
await writeCatalog();
if (!(await readJSON(path.join(DATA, 'pending.json'), null))) await fs.writeFile(path.join(DATA, 'pending.json'), JSON.stringify({ checkedAt: new Date().toISOString(), changes: [] }, null, 1));
console.log('catálogo gravado em data/catalog.json');

function summary(law, built) {
  return { id: law.id, name: law.name, shortName: law.shortName, number: law.number, type: law.type, date: law.date, url: law.url, lexml: law.lexml, tags: law.tags,
    retrievedAt: built.retrievedAt, sha256: built.sha256, articleCount: built.articleCount, vigentes: built.vigentes, revogados: built.revogados, file: 'laws/' + law.id + '.json', status: 'vigente', source: built.source, textUrl: built.textUrl };
}
async function writeCatalog() {
  const out = { generatedAt: new Date().toISOString(), source: CONFIG.source, index: CONFIG.index, jurisdiction: CONFIG.jurisdiction, laws: CONFIG.laws.map((l) => byId[l.id]).filter((l) => l && l.articleCount > 0) };
  await fs.writeFile(path.join(DATA, 'catalog.json'), JSON.stringify(out, null, 1));
}
