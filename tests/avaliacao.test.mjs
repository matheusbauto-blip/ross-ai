import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { grade, artKey } from '../qa/avaliacao-gabarito.mjs';

const bank = JSON.parse(readFileSync(new URL('../qa/perguntas-avaliacao.json', import.meta.url), 'utf8')).perguntas;
const catalog = JSON.parse(readFileSync(new URL('../data/catalog.json', import.meta.url), 'utf8'));
const KINDS = ['answer', 'clarify', 'limit', 'urgent', 'document', 'nosources'];

test('the evaluation bank is consistent: unique ids, valid expressions and every expected article in force in the bundled text', () => {
  assert.equal(new Set(bank.map(q => q.id)).size, bank.length);
  for (const q of bank) {
    assert.ok(q.pergunta && q.gabarito && q.area, q.id);
    assert.ok(q.tipo.length && q.tipo.every(kind => KINDS.includes(kind)), q.id);
    for (const [desc, rx] of q.pontos.concat(q.evitar)) { assert.ok(desc, q.id); new RegExp(rx); }
    for (const expected of q.artigos) {
      if (expected.nome) { new RegExp(expected.nome); continue; }
      const law = catalog.laws.find(l => l.id === expected.lei);
      assert.ok(law, q.id + ': ' + expected.lei + ' is not in the catalog');
      const articles = JSON.parse(readFileSync(new URL('../data/' + law.file, import.meta.url), 'utf8')).articles;
      assert.ok(articles.some(a => artKey(a.label) === artKey(expected.art) && a.status === 'vigente'), q.id + ': ' + expected.lei + ' art. ' + expected.art);
    }
  }
});

test('article labels compare the same with or without dots, ordinals and letters', () => {
  assert.equal(artKey('Art. 1.584'), artKey('1584'));
  assert.equal(artKey('Art. 5º'), '5');
  assert.equal(artKey('Art. 391-A'), artKey('391-A'));
  assert.notEqual(artKey('Art. 15'), artKey('Art. 155'));
});

const question = bank.find(q => q.id === 'transito-celular');
const answer = (summary, extra = {}) => ({ status: 'done', answer: Object.assign({ kind: 'answer', summary, sourcesSay: [], sources: [
  { lawId: 'l9503', name: 'Lei nº 9.503 (Código de Trânsito Brasileiro)', article: 'Art. 252' },
  { lawId: 'l9503', name: 'Lei nº 9.503 (Código de Trânsito Brasileiro)', article: 'Art. 258' }] }, extra) });

test('a complete answer is right; a correct but partial one is incomplete, not wrong', () => {
  const right = grade(question, answer('É infração gravíssima: multa de R$ 293,47 e 7 pontos na carteira.'), 3);
  assert.equal(right.nota, 'certo'); assert.equal(right.pontos, 100);
  assert.deepEqual(right.artigosFaltando, ['l9503 art. 259']);
  const partial = grade(question, answer('É infração gravíssima. O valor exato não aparece nos trechos.'), 3);
  assert.equal(partial.nota, 'incompleto');
  assert.deepEqual(partial.faltouPonto, ['R$ 293,47', '7 pontos']);
});

test('a forbidden statement or a wrong kind of answer is wrong, and the quoted law text does not count against the answer', () => {
  const theft = bank.find(q => q.id === 'penal-furto-pena');
  const slip = grade(theft, { status: 'done', answer: { kind: 'answer', summary: 'Pena de um a seis anos e multa; maior no roubo durante o repouso noturno.', sources: [] } }, 1);
  assert.equal(slip.nota, 'errado'); assert.deepEqual(slip.afirmouIndevido, ['confundir com roubo']);
  const debt = bank.find(q => q.id === 'penal-prisao-por-divida');
  const ok = grade(debt, { status: 'done', answer: { kind: 'answer', summary: 'Não. Ninguém pode ser preso por dívida no banco; a exceção é a pensão alimentícia.', sources: [{ lawId: 'cf88', name: 'Constituição', article: 'Art. 5', excerpt: 'salvo ... e a do depositário infiel' }] } }, 1);
  assert.equal(ok.nota, 'certo', JSON.stringify(ok));
  const urgent = bank.find(q => q.id === 'limite-despejo-amanha');
  assert.equal(grade(urgent, { status: 'done', answer: { kind: 'answer', summary: 'Procure um advogado o quanto antes.', sources: [] } }, 1).nota, 'errado', 'an eviction tomorrow needs an urgent answer');
  assert.equal(grade(question, { status: 'error', error: 'limite' }, 1).nota, 'erro');
});
