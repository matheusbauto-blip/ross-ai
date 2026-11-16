#!/usr/bin/env node
// Build credential-free, resumable SQL from an immutable sparse checkout.
// Nothing from the upstream project is executed or fetched by this command.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline';
import { corpusDocument, DEFAULT_REF, isCorpusPath } from './lib/law-corpus.mjs';
const args = process.argv.slice(2);
const option = (key, fallback) => args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
if (!option('--source-dir') || args.includes('--help')) {
  console.log('node scripts/build-library.mjs --source-dir CHECKOUT --out-dir OUTPUT [--ref SHA] [--limit N] [--catalog-only]');
  process.exit(args.includes('--help') ? 0 : 1);
}
const root = path.resolve(option('--source-dir')), out = path.resolve(option('--out-dir', '.corpus-library'));
const ref = option('--ref', DEFAULT_REF);
if (!/^[a-f0-9]{40}$/.test(ref) || execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() !== ref) throw new Error('Checkout must match the immutable ref');
await fs.mkdir(out, { recursive: true });
const sha = value => createHash('sha256').update(value).digest('hex');
const sqlJSON = value => "'" + JSON.stringify(value).replace(/'/g, "''") + "'::jsonb";
const manifest = { repository: 'ctresb/leis', ref, startedAt: new Date().toISOString(), candidateDocuments: 0, directories: 0, documents: 0, passages: 0, rawBytes: 0, acceptedForAnswer: 0, byScope: {}, rejected: [], batches: [], directoryBatches: [] };
let documents = [], bytes = 0, batchNumber = 0;
async function flushDocuments() {
  if (!documents.length) return;
  const file = 'texts-' + String(++batchNumber).padStart(5, '0') + '.sql', calls = [];
  for (let i = 0; i < documents.length; i += 20) calls.push('select public.ross_library_import(' + sqlJSON(documents.slice(i, i + 20)) + ');');
  await fs.writeFile(path.join(out, file), 'begin;\n' + calls.join('\n') + '\ncommit;\n');
  await fs.writeFile(path.join(out, file.replace('.sql', '.json')), JSON.stringify(documents));
  manifest.batches.push({ file, documents: documents.length, bytes });
  documents = []; bytes = 0;
  await fs.writeFile(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
}
async function ingest(relative) {
  if (args.includes('--catalog-only') || manifest.documents >= Number(option('--limit', 'Infinity'))) return;
  try {
    const full = path.join(root, relative), stat = await fs.lstat(full);
    if (!stat.isFile() || stat.size > 3_000_000) return;
    const markdown = await fs.readFile(full, 'utf8');
    const doc = { ...corpusDocument(relative, markdown, ref, false), markdown };
    const size = Buffer.byteLength(JSON.stringify(doc));
    if (size > 1_700_000) { manifest.rejected.push({ path: relative, reason: 'Requires segmented import' }); return; }
    if (documents.length && bytes + size > 1_400_000) await flushDocuments();
    documents.push(doc); bytes += size;
    manifest.documents++; manifest.passages += doc.passages.length; manifest.rawBytes += stat.size;
    if (!doc.is_partial && doc.status !== 'repealed' && doc.category !== 'jurisprudencia') manifest.acceptedForAnswer++;
  } catch (e) {
    if (e.code !== 'ENOENT') manifest.rejected.push({ path: relative, reason: String(e.message).slice(0, 180) });
  }
}
// The full tree exists even when file contents are sparsely checked out.
const git = spawn('git', ['-C', root, '-c', 'core.quotePath=false', 'ls-tree', '-r', ref], { stdio: ['ignore', 'pipe', 'inherit'] });
const completed = new Promise((resolve, reject) => { git.once('error', reject); git.once('close', code => code === 0 ? resolve() : reject(new Error('git ls-tree failed'))); });
let directory = null, rows = [], dirBytes = 0, dirBatch = 0;
async function flushDirectory() {
  if (!directory || !directory.records.length) return;
  const row = { ...directory, id: sha(directory.prefix + ':' + ref), repository_ref: ref }, size = Buffer.byteLength(JSON.stringify(directory));
  if (rows.length && dirBytes + size > 1_300_000) await flushDirectories();
  rows.push(row); dirBytes += size; manifest.directories++;
}
async function flushDirectories() {
  if (!rows.length) return;
  const file = 'catalog-' + String(++dirBatch).padStart(5, '0') + '.sql';
  await fs.writeFile(path.join(out, file), 'select public.ross_library_catalog_import(' + sqlJSON(rows) + ');\n');
  await fs.writeFile(path.join(out, file.replace('.sql', '.json')), JSON.stringify(rows));
  manifest.directoryBatches.push({ file, directories: rows.length, bytes: dirBytes }); rows = []; dirBytes = 0;
}
for await (const line of createInterface({ input: git.stdout, crlfDelay: Infinity })) {
  const match = line.match(/^100(?:644|755) blob ([a-f0-9]{40})\t(.+)$/);
  if (!match) continue;
  const [, blob, relative] = match;
  if (!isCorpusPath(relative) || relative.split('/').some(p => p.startsWith('_') || p.startsWith('.'))) continue;
  const segments = relative.split('/'), prefix = path.posix.dirname(relative);
  if (directory?.prefix !== prefix) {
    await flushDirectory();
    const scope = segments[0] === 'estaduais' ? 'estadual' : segments[0] === 'municipais' ? 'municipal' : 'federal';
    const family = segments.find(s => /^(?:leis?|lcp|decretos?|emendas?|resolucoes|portarias|constituicao)/.test(s)) || segments.at(-2) || 'constituicao';
    directory = { prefix, scope, uf: scope === 'federal' ? null : segments[1].toUpperCase(), municipality: scope === 'municipal' ? segments[2] : null, family, year: /^\d{4}$/.test(segments.at(-2)) ? Number(segments.at(-2)) : null, category: segments[0], records: [] };
  }
  const filename = segments.at(-1), number = filename.match(/^(?:lei|lcp|ldl|del|decreto|decreto-lei|emc|emenda|resolucao|portaria|l)-?(\d+)(?=-|\.)/i)?.[1] || '';
  directory.records.push([filename, blob, number]);
  manifest.candidateDocuments++; manifest.byScope[directory.scope] = (manifest.byScope[directory.scope] || 0) + 1;
  await ingest(relative);
}
await completed; await flushDirectory(); await flushDirectories(); await flushDocuments();
manifest.finishedAt = new Date().toISOString();
await fs.writeFile(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify({ output: out, documents: manifest.documents, candidateDocuments: manifest.candidateDocuments, directories: manifest.directories, passages: manifest.passages, rejected: manifest.rejected.length, textBatches: manifest.batches.length, catalogBatches: manifest.directoryBatches.length }));
