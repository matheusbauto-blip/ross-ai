import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';

const run = promisify(execFile);
const script = new URL('../scripts/build-index.mjs', import.meta.url).pathname;
const lei = '---\ntitulo: "Lei nº 99.999 de 02/02/2020"\ntipo: "Lei Ordinária"\nnumero: "99999"\ndata: 2020-02-02\nementa: "Dispõe sobre a garantia de baterias de celulares e dá outras providências."\nrevogada: false\nversao_texto: "compilada (texto vigente)"\nfonte: "https://www.planalto.gov.br/teste"\nbaixado_em: 2026-10-13\n---\n# Lei nº 99.999\n\n**Art. 1º** As baterias de celulares têm garantia mínima de um ano, contada da entrega do aparelho ao consumidor final.\n\n**Art. 2º** Esta lei entra em vigor na data de sua publicação.\n';
const parcial = '---\ntitulo: "Lei nº 7 de 01/01/1990"\ntipo: "Lei Ordinária"\nnumero: "7"\ndata: 1990-01-01\nversao_texto: "só metadados"\nrevogada: true\n---\nDocumento vazio.\n';
const municipal = '---\ntitulo: "Lei Orgânica do Município"\ntipo: "Lei Orgânica"\nementa: "' + 'Ementa longa. '.repeat(40) + '"\n---\n# Lei Orgânica\n\n' + 'Texto da lei orgânica municipal. '.repeat(20) + '\n';

async function fixtureRepository() {
  const dir = await mkdtemp(join(tmpdir(), 'ross-index-'));
  const files = {
    'federal/leis-ordinarias/2020/lei-99999-2020-02-02.md': lei,
    'federal/leis-ordinarias/1990/lei-7-1990-01-01.md': parcial,
    'federal/_fonte/ignorado.md': lei,
    'estaduais/SP/leis-ordinarias/2001/lei-1-2001-01-01.md': lei.replace('99999', '1'),
    'municipais/MG/uberlandia/lei-organica/1990/lei-organica-1-1990.md': municipal,
    'constituicao.md': '---\ntitulo: "Constituição Federal de 1988"\n---\n# Constituição\n\n' + 'Texto. '.repeat(40),
    'README.md': '# não é norma',
  };
  for (const [path, content] of Object.entries(files)) { await mkdir(join(dir, path, '..'), { recursive: true }); await writeFile(join(dir, path), content); }
  await run('git', ['-C', dir, 'init', '-q']);
  await run('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@test.invalid', 'add', '-A']);
  await run('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@test.invalid', 'commit', '-q', '-m', 'fixture']);
  const ref = (await run('git', ['-C', dir, 'rev-parse', 'HEAD'])).stdout.trim();
  return { dir, ref };
}

test('the static index records identification, summary and hash of every norm and skips working folders and non-norm files', async () => {
  const { dir, ref } = await fixtureRepository();
  const out = join(dir, '..', 'index-' + ref.slice(0, 8));
  const { stdout } = await run('node', [script, '--source-dir', dir, '--out-dir', out, '--ref', ref, '--no-checkout', '--part-size', '1000']);
  const summary = JSON.parse(stdout.trim().split('\n').pop());
  assert.equal(summary.total, 5); assert.equal(summary.failures, 0);
  const manifest = JSON.parse(await readFile(join(out, 'manifest.json'), 'utf8'));
  assert.equal(manifest.ref, ref);
  assert.deepEqual(Object.keys(manifest.units).sort(), ['estaduais/SP', 'federal/leis-ordinarias', 'municipais/MG', 'raiz']);
  assert.equal(manifest.units['federal/leis-ordinarias'].count, 2); assert.equal(manifest.units['federal/leis-ordinarias'].family, 'leis-ordinarias');
  assert.equal(manifest.units['estaduais/SP'].uf, 'SP'); assert.equal(manifest.units['municipais/MG'].scope, 'municipal');
  const federal = JSON.parse(await readFile(join(out, manifest.units['federal/leis-ordinarias'].parts[0]), 'utf8'));
  const entry = federal.entries.find(e => e.n === '99999');
  assert.deepEqual(entry, { p: '2020/lei-99999-2020-02-02.md', h: createHash('sha256').update(lei).digest('hex').slice(0, 16), t: 'Lei nº 99.999 de 02/02/2020', e: 'Dispõe sobre a garantia de baterias de celulares e dá outras providências.', k: 'Lei Ordinária', n: '99999', d: '2020-02-02' });
  const partial = federal.entries.find(e => e.n === '7');
  assert.equal(partial.x, 1); assert.equal(partial.r, 1); assert.equal(partial.e, undefined);
  const city = JSON.parse(await readFile(join(out, manifest.units['municipais/MG'].parts[0]), 'utf8')).entries[0];
  assert.equal(city.p, 'uberlandia/lei-organica/1990/lei-organica-1-1990.md');
  assert.ok(city.e.length <= manifest.ementaMax && city.e.endsWith('…'), 'long summaries are truncated');
  assert.ok(!JSON.stringify(federal).includes('ignorado'), 'working folders are not indexed');
  // Rerunning is idempotent and does not regenerate finished units.
  const again = await run('node', [script, '--source-dir', dir, '--out-dir', out, '--ref', ref, '--no-checkout']);
  assert.match(again.stdout, /já gerado/);
});

test('the index builder refuses a checkout that is not on the pinned edition', async () => {
  const { dir } = await fixtureRepository();
  await assert.rejects(run('node', [script, '--source-dir', dir, '--out-dir', join(dir, '..', 'x'), '--ref', 'a'.repeat(40), '--no-checkout']), /does not match/);
});
