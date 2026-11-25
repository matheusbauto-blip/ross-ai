#!/usr/bin/env node
// Gera o índice estático do repositório ctresb/leis (edição fixa) para publicação no site:
// título, ementa, tipo, número, data, esfera/UF/município, caminho e hash de cada texto, em
// shards JSON por unidade (federal/<série>, estaduais/<UF>, municipais/<UF>, reguladores/<órgão>…).
// O índice não contém os textos: o app lê o texto integral sob demanda, no GitHub, com conferência de hash.
// Requer um clone parcial (--filter=blob:none) na edição indicada; cada unidade é obtida por sparse-checkout.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parseFrontmatter, isCorpusPath, DEFAULT_REF } from '../supabase/functions/ross-ai/corpus-document.mjs';

const run = promisify(execFile);
const args = process.argv.slice(2);
const opt = (key, fallback) => { const n = args.indexOf(key); return n < 0 ? fallback : args[n + 1]; };
if (args.includes('--help') || !opt('--source-dir')) {
  console.log('node scripts/build-index.mjs --source-dir /path/to/leis --out-dir /path/to/index [--ref COMMIT_SHA] [--units federal/leis-ordinarias,estaduais/SP] [--part-size 15000] [--no-checkout] [--force]');
  process.exit(args.includes('--help') ? 0 : 1);
}
const root = path.resolve(opt('--source-dir'));
const ref = opt('--ref', DEFAULT_REF);
if (!/^[a-f0-9]{40}$/.test(ref)) throw new Error('Use an immutable commit SHA');
const out = path.resolve(opt('--out-dir', path.join(root, '..', 'index')));
const partSize = Math.max(1000, Number(opt('--part-size', '15000')) || 15000);
const onlyUnits = opt('--units', '') ? opt('--units', '').split(',').map((s) => s.trim()).filter(Boolean) : null;
const noCheckout = args.includes('--no-checkout');
const force = args.includes('--force');
const INDEX_FORMAT = 2; // 2: ementa extraída do corpo quando o cabeçalho não a traz
const EMENTA_MAX = 240;
const TOP = ['federal', 'estaduais', 'municipais', 'reguladores', 'jurisprudencia', 'tratados'];

const head = (await run('git', ['-C', root, 'rev-parse', 'HEAD'])).stdout.trim();
if (head !== ref) throw new Error('Source checkout HEAD ' + head + ' does not match --ref ' + ref);
await fs.mkdir(out, { recursive: true });

/* Unidades: pastas de segundo nível (ou primeiro, para jurisprudência/tratados), listadas pelas árvores locais. */
const listing = (await run('git', ['-C', root, 'ls-tree', '-r', '--name-only', 'HEAD'], { maxBuffer: 1 << 30 })).stdout.split('\n');
const unitFiles = new Map();
for (const file of listing) {
  if (!file.endsWith('.md') || !isCorpusPath(file)) continue;
  const parts = file.split('/');
  if (parts.some((p) => p.startsWith('_') || p.startsWith('.'))) continue;
  const unit = file === 'constituicao.md' ? 'raiz' : ['jurisprudencia', 'tratados'].includes(parts[0]) ? parts[0] : parts.length > 2 ? parts[0] + '/' + parts[1] : parts[0];
  if (!unitFiles.has(unit)) unitFiles.set(unit, []);
  unitFiles.get(unit).push(file);
}
const units = Array.from(unitFiles.keys()).filter((u) => !onlyUnits || onlyUnits.includes(u)).sort();
const manifestPath = path.join(out, 'manifest.json');
let manifest = { repository: 'ctresb/leis', ref, generatedAt: new Date().toISOString(), ementaMax: EMENTA_MAX, units: {}, total: 0, partial: 0, failures: 0 };
try { const existing = JSON.parse(await fs.readFile(manifestPath, 'utf8')); if (existing.ref === ref) manifest = existing; } catch {}

function shortHash(text) { return createHash('sha256').update(text).digest('hex').slice(0, 16); }
function titleFromPath(file) { return path.basename(file, '.md').replace(/-/g, ' '); }
/* Muitos atos (órgãos reguladores, municípios, jurisprudência, tratados e parte dos estaduais) não trazem a ementa
   no cabeçalho, mas no primeiro parágrafo depois do título. Usa esse parágrafo, pulando título repetido, cabeçalhos,
   linhas só em maiúsculas, fórmulas de promulgação e artigos; prefere frases que começam como ementa. */
const EMENTA_VERB = /^(?:disp[oõ]e|altera|aprova|estabelece|institui|regulamenta|define|autoriza|revoga|determina|prorroga|fixa|torna|concede|cria|declara|denomina|acrescenta|d[aá] |homologa|reconhece|atualiza|disciplina|divulga|inclui|exclui|credencia|habilita|designa|nomeia|suspende|mant[eé]m|pro[ií]be|obriga|considera|consolida|publica|delega|organiza|modifica|retifica|ratifica|promulga|trata|regula|cancela|indefere|defere|deferir|indeferir|julga|nega|d[aá] provimento|ementa)/i;
const ENACTING = /^(?:o |a |os |as )?(?:presidente|presidenta|governador|governadora|prefeito|prefeita|diretor|diretora|diretoria|secret[aá]ri[oa]|ministr[oa]|congresso|assembleia|c[aâ]mara|mesa|superintendente|conselho|coordenador|chefe|delegad[oa]|faço saber|fa[çc]o saber)/i;
function plainLine(line) { return line.replace(/<[^>]*>/g, ' ').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\\([.\-*_#])/g, '$1').replace(/[*_`>#|~]+/g, ' ').replace(/\s+/g, ' ').trim(); }
const NOT_SUMMARY = /^(?:\d+\s*[.)-]\s|[-•]\s|revogam-se|revogad[ao]s? as disposi|ficam revogad|esta (?:lei|resolu[cç][aã]o|portaria|instru[cç][aã]o|delibera[cç][aã]o|emenda)[^.]{0,60}entra(?:r[aá])? em vigor|texto obtido|nota[:\s]|observa[cç][aã]o[:\s]|aviso[:\s]|publicad[ao] no|este texto n[aã]o substitui|considerando\b|resolve\b|decreta\b)/i;
function summaryFromBody(body, title) {
  const fold = (x) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const titleKey = fold(title || '');
  // Blocos de código (```), tabelas e restos de HTML/JSON não são ementa.
  const raw = body.replace(/```[\s\S]*?(?:```|$)/g, '\n\n');
  const paragraphs = raw.split(/\r?\n\s*\r?\n/).slice(0, 12)
    .filter((p) => !/^\s*(?:[{[|]|<(?:div|table|p)\b)/i.test(p) && !/"[a-z_]+"\s*:/i.test(p))
    .map((p) => p.split(/\r?\n/).filter((l) => !/^\s*#/.test(l)).map(plainLine).join(' ').trim()).filter(Boolean);
  const candidates = paragraphs.filter((p) => {
    const letters = p.replace(/[^A-Za-zÀ-ÿ]/g, '');
    if (p.length < 25 || /^art\.?\s*\d/i.test(p) || /:\s*$/.test(p) || ENACTING.test(p) || NOT_SUMMARY.test(p) || /class=|<\/?[a-z]+\b|&\s?#?\d+;/i.test(p)) return false;
    // Fórmula de competência ("no uso das atribuições…") e fecho com local e data não descrevem o assunto.
    if (/no uso d[ae]s? (?:suas )?atribui[cç]|usando d[ae]s? atribui[cç]|tendo em vista o disposto/i.test(p.slice(0, 220))) return false;
    if (/^[A-ZÀ-Ú][^,]{1,60}, (?:em )?\d{1,2}[ºo°]? de [a-zç]+ de [\d.]{4,5}\.?$/i.test(p) || /\bCEP:?\s*\d{2}\.?\d{3}-?\d{3}/.test(p)) return false;
    if (letters && letters === letters.toUpperCase()) return false;
    const key = fold(p);
    return !(titleKey && (key === titleKey || key.startsWith(titleKey) && key.length < titleKey.length + 15));
  });
  return (candidates.find((p) => EMENTA_VERB.test(p)) || candidates[0] || '').slice(0, 600);
}
function entryFor(file, unit, markdown) {
  const rel = file === 'constituicao.md' ? file : file.slice(unit.length + 1);
  const entry = { p: rel, h: shortHash(markdown) };
  let m = {}, body = markdown;
  try { ({ metadata: m, body } = parseFrontmatter(markdown)); } catch { entry.x = 1; }
  entry.t = String(m.titulo || titleFromPath(file)).slice(0, 160);
  let ementa = String(m.ementa || '').replace(/\s+/g, ' ').trim();
  if (!ementa) ementa = summaryFromBody(body, entry.t);
  if (ementa) entry.e = ementa.length > EMENTA_MAX ? ementa.slice(0, EMENTA_MAX - 1) + '…' : ementa;
  if (m.tipo) entry.k = String(m.tipo).slice(0, 40);
  const number = String(m.numero || '').replace(/\D/g, ''); if (number) entry.n = number;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(m.data || ''))) entry.d = String(m.data);
  if (m.revogada === true) entry.r = 1;
  const version = String(m.versao_texto || '');
  if (/republica|retifica|partes?\b|ementa|metadad/i.test(version) || body.length < 150 || /s[oó] (?:os )?metadados|documento vazio|sem texto integral/i.test(body)) entry.x = 1;
  return entry;
}

for (const unit of units) {
  const files = unitFiles.get(unit);
  const done = manifest.units[unit];
  if (!force && done && done.count === files.length && done.parts && done.parts.length && done.format === INDEX_FORMAT) { console.log('ok (já gerado)', unit, files.length); continue; }
  const started = Date.now();
  if (!noCheckout && unit !== 'raiz') {
    await run('git', ['-C', root, 'sparse-checkout', 'set', unit], { maxBuffer: 1 << 24 });
    await run('git', ['-C', root, 'checkout', '-q', 'HEAD'], { maxBuffer: 1 << 24 });
  }
  const entries = []; let failures = 0, partial = 0;
  for (const file of files) {
    let markdown;
    try { markdown = await fs.readFile(path.join(root, file), 'utf8'); }
    catch { failures++; continue; }
    const entry = entryFor(file, unit, markdown);
    if (entry.x) partial++;
    entries.push(entry);
  }
  const parts = [];
  const [top, sub] = unit.split('/');
  const scope = top === 'estaduais' ? 'estadual' : top === 'municipais' ? 'municipal' : top === 'reguladores' ? 'regulador' : top === 'jurisprudencia' ? 'jurisprudencia' : top === 'tratados' ? 'tratado' : 'federal';
  const uf = ['estaduais', 'municipais'].includes(top) ? sub : null;
  let bytes = 0;
  for (let i = 0; i < Math.max(1, Math.ceil(entries.length / partSize)); i++) {
    const name = unit.replace(/\//g, '__') + '.' + (i + 1) + '.json';
    const data = JSON.stringify({ unit, scope, uf, ref, part: i + 1, entries: entries.slice(i * partSize, (i + 1) * partSize) });
    await fs.writeFile(path.join(out, name), data);
    bytes += Buffer.byteLength(data); parts.push(name);
  }
  manifest.units[unit] = { format: INDEX_FORMAT, scope, uf, count: entries.length, partial, failures, parts, bytes, family: unit === 'raiz' ? 'constituicao' : top === 'federal' ? sub : top === 'reguladores' ? sub : null };
  manifest.total = Object.values(manifest.units).reduce((n, u) => n + u.count, 0);
  manifest.partial = Object.values(manifest.units).reduce((n, u) => n + u.partial, 0);
  manifest.failures = Object.values(manifest.units).reduce((n, u) => n + u.failures, 0);
  manifest.generatedAt = new Date().toISOString();
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 1));
  console.log('gerado', unit, entries.length, 'entradas,', (bytes / 1048576).toFixed(1), 'MB,', ((Date.now() - started) / 1000).toFixed(0) + 's', failures ? '(falhas: ' + failures + ')' : '');
}
console.log(JSON.stringify({ units: Object.keys(manifest.units).length, total: manifest.total, partial: manifest.partial, failures: manifest.failures, out }));
