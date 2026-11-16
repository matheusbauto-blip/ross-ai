import test from 'node:test';
import assert from 'node:assert/strict';
import { corpusDocument, parseFrontmatter, splitPassages, isCorpusPath, sqlForDocuments } from '../scripts/lib/law-corpus.mjs';

const fixture = (version, body, extra = '') => `---\ntitulo: "Lei nº 14.133"\ntipo: "Lei Ordinária"\nnumero: "14133"\ndata: 2021-04-01\nversao_texto: "${version}"\nfonte: "https://normas.leg.br/?urn=urn:lex:br:federal:lei:2021-04-01;14133"\nbaixado_em: 2026-10-13\n${extra}---\n${body}`;
const body = '# Lei\n\n**Art. 1º** ' + 'Objeto da norma e direitos das pessoas. '.repeat(8) + '\n\n**Art. 2º** Direito de acesso.\n\n**Art. 3º** (Revogado pela Lei nº 1.)';

test('preserves provenance and never infers current legal validity from revogada=false', () => {
  const doc = corpusDocument('federal/leis-ordinarias/2021/lei-14133-2021-04-01.md', fixture('compilada (texto vigente)', body, 'revogada: false\n'));
  assert.equal(doc.status, 'unknown'); assert.equal(doc.is_partial, false);
  assert.equal(doc.number, '14133'); assert.equal(doc.scope, 'federal');
  assert.match(doc.content_sha256, /^[a-f0-9]{64}$/);
  assert(doc.passages.some(p => p.article === 'Art. 2º' && p.content.includes('Direito de acesso')));
  assert.equal(doc.passages.at(-1).repealed, true);
});
test('partial republications and external attachments remain searchable but are flagged', () => {
  const doc = corpusDocument('estaduais/GO/leis-ordinarias/2021/lei-1.md', fixture('republicação/retificação', body));
  assert.equal(doc.is_partial, true); assert.equal(doc.uf, 'GO'); assert(doc.warnings.includes('partial_version'));
  const pdf = corpusDocument('municipais/MG/uberlandia/leis-ordinarias/lei.md', fixture('compilada', body + '\n![Página](pag.png)'));
  assert.equal(pdf.municipality, 'uberlandia'); assert(pdf.warnings.includes('external_attachment'));
});
test('does not lose the end of large articles and keeps ADCT article identities separate', () => {
  const text = '**Art. 1º** ' + 'palavra '.repeat(3000) + 'FIMDOARTIGO';
  const passages = splitPassages(text, 800);
  assert(passages.length > 20); assert(passages.every(p => p.content.length <= 800));
  assert(passages.at(-1).content.endsWith('FIMDOARTIGO'));
  const parts = splitPassages('**Art. 1º** Geral\nATO DAS DISPOSIÇÕES CONSTITUCIONAIS TRANSITÓRIAS\n**Art. 1º** Transitório');
  assert.equal(parts.at(-1).article, 'ADCT · Art. 1º');
});
test('rejects executable YAML, path traversal, unsafe source URLs and mutable refs', () => {
  assert.throws(() => parseFrontmatter('---\ntitulo: !!js/function x\n---\ntext'));
  assert.equal(isCorpusPath('federal/../../credentials.md'), false);
  assert.equal(isCorpusPath('scripts/README.md'), false);
  assert.throws(() => corpusDocument('constituicao.md', body, 'main'));
  const doc = corpusDocument('constituicao.md', fixture('compilada', body).replace('https://normas.leg.br/?urn=urn:lex:br:federal:lei:2021-04-01;14133', 'javascript:alert(1)'));
  assert.equal(doc.source_url, ''); assert.equal(doc.is_partial, true);
});
test('escapes SQL strings when preparing imports without credentials', () => {
  assert(sqlForDocuments([{ title: "D'Ávila" }]).includes("D''Ávila"));
});
test('headings are metadata and are never mislabelled as the previous article', () => {
  const p = splitPassages('**Art. 10.** Primeiro\n## CAPÍTULO II\n**Art. 11.** Segundo');
  assert.equal(p.length, 2); assert.equal(p[1].article, 'Art. 11'); assert.equal(p[1].heading, 'CAPÍTULO II');
});
test('lightweight indexing retains the locator and summary without the full text', () => {
  const doc = corpusDocument('federal/leis-ordinarias/2021/lei.md',fixture('compilada',body),undefined,true);
  assert.equal(doc.content_mode,'metadata'); assert.equal(doc.passages.length,1);
  assert.equal(doc.passages[0].article,'Identificação da norma'); assert(!doc.passages[0].content.includes('Direito de acesso'));
});
test('hash metadata keys are parsed as data and article headings retain their article identity', () => {
  const md = fixture('compilada', '## Art. 1º Texto novo.\n~~Texto antigo.~~\nParágrafo único. Condição.', 'sha256_texto: "abc"\n');
  const d = corpusDocument('federal/leis-ordinarias/2021/lei.md', md);
  assert(d.passages.some(p => p.article === 'Art. 1º' && p.content.includes('Texto novo')));
  assert(!d.passages.some(p => p.content.includes('Texto antigo')));
});
