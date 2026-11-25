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
  console.log('node scripts/build-index.mjs --source-dir /path/to/leis --out-dir /path/to/index [--ref COMMIT_SHA] [--units federal/leis-ordinarias,estaduais/SP] [--part-size 15000] [--no-checkout]');
  process.exit(args.includes('--help') ? 0 : 1);
}
const root = path.resolve(opt('--source-dir'));
const ref = opt('--ref', DEFAULT_REF);
if (!/^[a-f0-9]{40}$/.test(ref)) throw new Error('Use an immutable commit SHA');
const out = path.resolve(opt('--out-dir', path.join(root, '..', 'index')));
const partSize = Math.max(1000, Number(opt('--part-size', '15000')) || 15000);
const onlyUnits = opt('--units', '') ? opt('--units', '').split(',').map((s) => s.trim()).filter(Boolean) : null;
const noCheckout = args.includes('--no-checkout');
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
function entryFor(file, unit, markdown) {
  const rel = file === 'constituicao.md' ? file : file.slice(unit.length + 1);
  const entry = { p: rel, h: shortHash(markdown) };
  let m = {}, body = markdown;
  try { ({ metadata: m, body } = parseFrontmatter(markdown)); } catch { entry.x = 1; }
  entry.t = String(m.titulo || titleFromPath(file)).slice(0, 160);
  const ementa = String(m.ementa || '').replace(/\s+/g, ' ').trim();
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
  if (done && done.count === files.length && done.parts && done.parts.length) { console.log('ok (já gerado)', unit, files.length); continue; }
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
  manifest.units[unit] = { scope, uf, count: entries.length, partial, failures, parts, bytes, family: top === 'federal' ? sub || 'constituicao' : top === 'reguladores' ? sub : null };
  manifest.total = Object.values(manifest.units).reduce((n, u) => n + u.count, 0);
  manifest.partial = Object.values(manifest.units).reduce((n, u) => n + u.partial, 0);
  manifest.failures = Object.values(manifest.units).reduce((n, u) => n + u.failures, 0);
  manifest.generatedAt = new Date().toISOString();
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 1));
  console.log('gerado', unit, entries.length, 'entradas,', (bytes / 1048576).toFixed(1), 'MB,', ((Date.now() - started) / 1000).toFixed(0) + 's', failures ? '(falhas: ' + failures + ')' : '');
}
console.log(JSON.stringify({ units: Object.keys(manifest.units).length, total: manifest.total, partial: manifest.partial, failures: manifest.failures, out }));
