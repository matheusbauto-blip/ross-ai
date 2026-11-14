#!/usr/bin/env node
// Offline, resumable import of an immutable ctresb/leis snapshot. Nothing from
// the upstream repository is executed. SQL output works without API credentials.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { corpusDocument, DEFAULT_REF, isCorpusPath, sqlForDocuments } from './lib/law-corpus.mjs';

const args = process.argv.slice(2);
const opt = (key, fallback) => { const n = args.indexOf(key); return n < 0 ? fallback : args[n + 1]; };
if (args.includes('--help') || !opt('--source-dir')) {
  console.log('node scripts/import-corpus.mjs --source-dir /path/to/leis --out-dir /path/to/output [--ref COMMIT_SHA] [--scope federal|estaduais|municipais|reguladores|jurisprudencia|tratados|all] [--limit N] [--full-text] [--upload]');
  process.exit(args.includes('--help') ? 0 : 1);
}
const root = path.resolve(opt('--source-dir'));
const out = path.resolve(opt('--out-dir', path.join(path.dirname(fileURLToPath(import.meta.url)), '../.corpus-import')));
const ref = opt('--ref', DEFAULT_REF);
const scope = opt('--scope', 'all');
const limit = Number(opt('--limit', 'Infinity'));
if (!['all', 'federal', 'estaduais', 'municipais', 'reguladores', 'jurisprudencia', 'tratados'].includes(scope) || !(limit > 0)) throw new Error('Invalid scope or limit');
if (!/^[a-f0-9]{40}$/.test(ref)) throw new Error('Use an immutable commit SHA');
try {
  await fs.access(path.join(root, '.git'));
  const { stdout } = await promisify(execFile)('git', ['-C', root, 'rev-parse', 'HEAD']);
  if (stdout.trim() !== ref) throw new Error('Source checkout does not match --ref. Check out the requested commit before importing.');
} catch (error) { if (error.code !== 'ENOENT') throw error; }
const upload = args.includes('--upload');
const metadataOnly = !args.includes('--full-text');
const apiUrl = process.env.SUPABASE_URL;
const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (upload && (!apiUrl || !apiKey)) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment');
await fs.mkdir(out, { recursive: true });

async function* walk(directory, relative = '') {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
    const rel = relative ? relative + '/' + entry.name : entry.name;
    if (!relative && entry.isDirectory() && !['federal','estaduais','municipais','reguladores','jurisprudencia','tratados'].includes(entry.name)) continue;
    if (!relative && scope !== 'all' && entry.isDirectory() && entry.name !== scope) continue;
    // Never follow symlinks out of the source snapshot.
    if (entry.isDirectory()) yield* walk(path.join(directory, entry.name), rel);
    else if (entry.isFile() && isCorpusPath(rel) && (scope === 'all' || scope === 'federal' || rel !== 'constituicao.md')) yield rel;
  }
}

let count = 0, rejected = 0, batchNumber = 0, batch = [], bytes = 0;
const manifest = { repository: 'ctresb/leis', ref, scope, contentMode: metadataOnly ? 'metadata' : 'full', generatedAt: new Date().toISOString(), documents: 0, passages: 0, partial: 0, batches: [], failures: [] };
async function flush() {
  if (!batch.length) return;
  const name = 'batch-' + String(++batchNumber).padStart(6, '0');
  const jsonFile = path.join(out, name + '.json');
  await fs.writeFile(jsonFile, JSON.stringify(batch));
  await fs.writeFile(path.join(out, name + '.sql'), sqlForDocuments(batch));
  if (upload) {
    const response = await fetch(new URL('/rest/v1/rpc/ross_law_import', apiUrl), {
      method: 'POST', headers: { apikey: apiKey, Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_documents: batch }), signal: AbortSignal.timeout(120000),
    });
    if (!response.ok) throw new Error('Import batch failed: HTTP ' + response.status + '. Rerun safely after resolving the error.');
    await response.json();
  }
  manifest.batches.push({ file: name + '.json', documents: batch.length, bytes });
  batch = []; bytes = 0;
  await fs.writeFile(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
}
for await (const rel of walk(root)) {
  if (count >= limit) break;
  let doc;
  try {
    const markdown = await fs.readFile(path.join(root, rel), 'utf8');
    doc = corpusDocument(rel, markdown, ref, metadataOnly);
  } catch (error) { rejected++; manifest.failures.push({ path: rel, error: error.message }); continue; }
  const size = Buffer.byteLength(JSON.stringify(doc));
  if (batch.length && (batch.length >= 20 || bytes + size > 750000)) await flush();
  batch.push(doc); bytes += size; count++;
  manifest.documents++; manifest.passages += doc.passages.length; if (doc.is_partial) manifest.partial++;
}
await flush();
console.log(JSON.stringify({ documents: count, rejected, passages: manifest.passages, partial: manifest.partial, out, uploaded: upload }));
if (rejected) process.exitCode = 2;
