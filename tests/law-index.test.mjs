import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

// Extrai do app as funções puras do índice estático (ordenação, termos, escolha de unidades).
const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const context = { window: { ROSS_CONFIG: { indexUrl: 'https://index.test/' } }, state: { lang: 'pt-BR', catalog: { laws: [] } }, t: (key) => key, API_URL: '' };
const slice = (from, to) => source.slice(source.indexOf(from), source.indexOf(to));
vm.runInNewContext(
  slice('  function repairEncoding(', '  function searchArticles(') +
  slice('  /* ---------- Índice estático do repositório', '  let corpusController = null;') +
  '\nglobalThis.idx = { searchIndexEntries, indexQueryTerms, indexUnitsFor, lawIndex, municipalityOf };', context);
const { searchIndexEntries, indexQueryTerms, indexUnitsFor, lawIndex, municipalityOf } = context.idx;
const host = (value) => JSON.parse(JSON.stringify(value)); // objetos do contexto isolado comparados como dados
const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const entry = (overrides) => { const e = Object.assign({ p: 'x.md', h: 'a'.repeat(16), t: '', e: '' }, overrides); e._s = normalize(e.t + ' ' + e.e); return e; };

test('index ranking prefers exact law numbers, then entries matching every term, with partial texts demoted', () => {
  const entries = [
    entry({ p: '1990/lei-8078-1990-09-11.md', t: 'Lei nº 8.078 de 11/09/1990', e: 'Dispõe sobre a proteção do consumidor e dá outras providências.', n: '8078', d: '1990-09-11' }),
    entry({ p: '2021/lei-14133-2021-04-01.md', t: 'Lei nº 14.133 de 01/04/2021', e: 'Lei de Licitações e Contratos Administrativos.', n: '14133', d: '2021-04-01' }),
    entry({ p: '2020/lei-99999-2020-02-02.md', t: 'Lei nº 99.999 de 02/02/2020', e: 'Dispõe sobre a garantia de baterias de celulares.', n: '99999', d: '2020-02-02' }),
    entry({ p: '2019/lei-88888-2019-02-02.md', t: 'Lei nº 88.888 de 02/02/2019', e: 'Dispõe sobre baterias de automóveis e a sua reciclagem.', n: '88888', d: '2019-02-02', x: 1 }),
    entry({ p: '1980/lei-1-1980-01-01.md', t: 'Lei nº 1 de 01/01/1980', e: 'Altera dispositivos sobre celulares.', n: '1', d: '1980-01-01' }),
  ];
  const byNumber = host(searchIndexEntries(entries, '14.133', 5));
  assert.equal(byNumber[0].n, '14133');
  const bateria = host(searchIndexEntries(entries, 'garantia de bateria de celular', 5));
  assert.equal(bateria[0].n, '99999', 'every term matched ranks first');
  assert.ok(bateria.some(r => r.n === '88888') && bateria.findIndex(r => r.n === '88888') > bateria.findIndex(r => r.n === '1'), 'partial text is demoted');
  assert.equal(host(searchIndexEntries(entries, 'aposentadoria rural', 5)).length, 0);
  const terms = host(indexQueryTerms('Lei 8.078 consumidor'));
  assert.equal(terms.number, '8078'); assert.ok(terms.tokens.some(tk => /^consum/.test(tk)));
  assert.equal(host(indexQueryTerms('celular com defeito')).number, '');
  assert.equal(municipalityOf({ unit: 'municipais/MG', p: 'uberlandia/lei-organica/1990/lei.md' }), 'uberlandia');
  assert.equal(municipalityOf({ unit: 'federal/leis-ordinarias', p: '1990/lei.md' }), '');
});

test('unit selection loads federal laws by default and needs the state for state or municipal shards', () => {
  lawIndex.manifest = { ref: 'c'.repeat(40), units: {
    'raiz': { scope: 'federal', family: 'constituicao' }, 'federal/leis-ordinarias': { scope: 'federal', family: 'leis-ordinarias' }, 'federal/decretos': { scope: 'federal', family: 'decretos' },
    'estaduais/SP': { scope: 'estadual', uf: 'SP' }, 'municipais/SP': { scope: 'municipal', uf: 'SP' }, 'reguladores/anvisa': { scope: 'regulador', family: 'anvisa' }, 'jurisprudencia': { scope: 'jurisprudencia' },
  } };
  const units = (opts) => host(indexUnitsFor(opts)).sort();
  assert.deepEqual(units({ scope: '', uf: '' }), ['federal/leis-ordinarias', 'raiz']);
  assert.deepEqual(units({ scope: 'federal', federalActs: true }), ['federal/decretos', 'federal/leis-ordinarias', 'raiz']);
  assert.deepEqual(units({ scope: '', uf: 'SP' }), ['estaduais/SP', 'federal/leis-ordinarias', 'raiz']);
  assert.deepEqual(units({ scope: 'estadual', uf: '' }), [], 'state search without a state loads nothing');
  assert.deepEqual(units({ scope: 'municipal', uf: 'SP', municipality: 'São Paulo' }), ['municipais/SP']);
  assert.deepEqual(units({ scope: 'regulador', organ: 'anvisa' }), ['reguladores/anvisa']);
  assert.deepEqual(units({ scope: 'regulador' }), []);
  assert.deepEqual(units({ scope: 'jurisprudencia' }), ['jurisprudencia']);
});
