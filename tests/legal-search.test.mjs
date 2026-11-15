import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const catalog = JSON.parse(readFileSync(new URL('../data/catalog.json', import.meta.url), 'utf8'));
const context = { state: { catalog }, sampleFn: null };
vm.runInNewContext(source.slice(source.indexOf('  function repairEncoding('), source.indexOf('  function lawSource(')) +
  '\nglobalThis.search = { repairEncoding, containsTerm, searchIntent, selectLaws, searchArticles, expandQuery };', context);
const search = context.search;
vm.runInNewContext(source.slice(source.indexOf('  function candidateHits('), source.indexOf('  providers.oficial =')) +
  '\nObject.assign(globalThis.search, { candidateHits, relevanceCatalog, validatedSelection, selectRelevantSources });', context);
function retrieve(question, terms = '', ids = []) {
  const query = search.expandQuery(question) + ' ' + terms;
  const laws = Array.from(search.selectLaws(query, ids, question));
  const loaded = laws.map(law => JSON.parse(readFileSync(new URL('../data/' + law.file, import.meta.url), 'utf8')));
  return { laws: laws.map(law => law.id), hits: Array.from(search.searchArticles(loaded, query, 8, question)) };
}

test('rear collision retrieves road safety and civil liability even without AI expansion', () => {
  const result = retrieve('bateram na traseira do meu carro');
  assert.deepEqual(result.laws.slice(0, 2), ['l9503', 'l10406']);
  const refs = result.hits.map(hit => hit.law.id + ':' + hit.article.id);
  for (const ref of ['l9503:29', 'l10406:186', 'l10406:927']) assert.ok(refs.includes(ref), ref);
  assert.ok(!result.laws.includes('l12651'));
  const ctb29 = result.hits.find(hit => hit.law.id === 'l9503' && hit.article.id === '29');
  assert.match(ctb29.excerpt, /distância de segurança lateral e frontal/);
});

test('AI suggestions are retained alongside keyword matches and unknown IDs are rejected', () => {
  const laws = Array.from(search.selectLaws('carro defeito fornecedor', ['l9503', 'l10406', 'invented']));
  assert.deepEqual(laws.slice(0, 2).map(law => law.id), ['l9503', 'l10406']);
  assert.ok(!laws.some(law => law.id === 'invented'));
});

test('acronyms and law numbers do not match unrelated word or number fragments', () => {
  assert.equal(search.containsTerm('carro', 'CAR'), false);
  assert.equal(search.containsTerm('cadastro CAR rural', 'CAR'), true);
  assert.equal(search.containsTerm('Lei 10.406 de 2002', '10.406'), true);
  assert.equal(search.containsTerm('Lei 210.406 de 2002', '10.406'), false);
});

test('traffic intent does not turn physical assault or vehicle defects into a collision', () => {
  assert.equal(search.searchIntent('bateram em mim na rua'), null);
  assert.equal(search.searchIntent('meu carro apresentou defeito na traseira'), null);
  assert.ok(search.searchIntent('bati na traseira de um carro'));
  assert.ok(search.searchIntent('houve um engavetamento'));
});

test('rear collision keeps the governing excerpts when expansion adds distracting criminal or product terms', () => {
  const result = retrieve('bateram na traseira do meu carro', 'crime defeito fabricação prescrição responsabilidade civil indenização', ['del2848', 'l8078']);
  const refs = result.hits.map(hit => hit.law.id + ':' + hit.article.id);
  for (const ref of ['l9503:29', 'l10406:186', 'l10406:927']) assert.ok(refs.includes(ref), ref);
});

test('consumer withdrawal still retrieves the CDC rule', () => {
  const result = retrieve('comprei pela internet e quero devolver', 'arrependimento desistir contrato fora estabelecimento sete dias', ['l8078']);
  assert.ok(result.hits.some(hit => hit.law.id === 'l8078' && hit.article.id === '49'));
});

test('repairs UTF-8 text decoded as Latin-1 or Windows-1252 without changing valid Portuguese', () => {
  assert.equal(search.repairEncoding('Art. 1Âº Ã‰ convivÃªncia pÃºblica e contÃ­nua.'), 'Art. 1º É convivência pública e contínua.');
  assert.equal(search.repairEncoding('AÇÃO, São Paulo, Ângelo, reparação e € 10.'), 'AÇÃO, São Paulo, Ângelo, reparação e € 10.');
});

test('relevance selection rejects invented, duplicated and out-of-range reference IDs', () => {
  const sources = [{ article: 'Art. 1' }, { article: 'Art. 2' }];
  const selected = Array.from(search.validatedSelection(sources, ['passage-2', 'passage-2', 'passage-999', 'passage-0', 'other', 'passage-1']));
  assert.deepEqual(selected.map(item => [item.article, item.n]), [['Art. 2', 1], ['Art. 1', 2]]);
  assert.equal(search.validatedSelection(sources, []).length, 0);
});

test('relevance check uses actual candidate text and supports rejecting all candidates', async () => {
  const sources = [{ shortName: 'Código Civil', article: 'Art. 927', excerpt: 'Aquele que, por ato ilícito, causar dano a outrem, fica obrigado a repará-lo.' }];
  let called = false;
  context.apiCall = async (operation, payload) => {
    called = true;
    assert.equal(operation, 'prepare');
    assert.equal(payload.catalog[0].id, 'passage-1');
    assert.match(payload.catalog[0].name, /Art\. 927/);
    assert.match(payload.catalog[0].name, /causar dano/);
    assert.ok(payload.catalog[0].name.length <= 200);
    assert.match(payload.question, /Se nenhum trecho servir/);
    return { terms: [], laws: [] };
  };
  const selected = await search.selectRelevantSources('dúvida sem regra aplicável no trecho', 'causar dano', sources);
  assert.equal(called, true);
  assert.equal(selected.length, 0);
});

const categoryCases = JSON.parse(readFileSync(new URL('./fixtures/legal-categories.json', import.meta.url), 'utf8'));
test('the category matrix covers every law in the current catalog', () => {
  assert.deepEqual([...new Set(categoryCases.map(row => row[1]))].sort(), catalog.laws.map(law => law.id).sort());
});
for (const [category, id, question, expectedArticle] of categoryCases) {
  test('category retrieval: ' + category, () => {
    const query = search.expandQuery(question);
    const selected = Array.from(search.selectLaws(query, [id], question));
    assert.ok(selected.some(law => law.id === id), 'does not discard the semantic law selection');
    const laws = selected.map(law => JSON.parse(readFileSync(new URL('../data/' + law.file, import.meta.url), 'utf8')));
    const candidates = Array.from(search.candidateHits(laws, query, question));
    assert.ok(candidates.some(hit => hit.law.id === id && hit.article.id === expectedArticle), id + ':' + expectedArticle + ' must reach the relevance selection stage');
    assert.ok(candidates.every(hit => hit.article.status === 'vigente'));
  });
}
