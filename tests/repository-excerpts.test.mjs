import test from 'node:test';
import assert from 'node:assert/strict';
import { eligibleForAnswer, repositoryExcerpts } from '../supabase/functions/ross-ai/repository-excerpts.mjs';

test('reads relevant articles from actual text and preserves article boundaries', () => {
  const markdown = '# Lei\nResumo: seguro rural\n\nArt. 1º Objeto.\n\nArt. 2º O seguro rural protege a produção.\nParágrafo único. Regras da cobertura.\n\nArt. 3º A contratação depende de requisitos.';
  const result = repositoryExcerpts(markdown, 'seguro rural');
  assert.equal(result.length, 1);
  assert.equal(result[0].article, 'Art. 2º');
  assert.match(result[0].excerpt, /Parágrafo único/);
  assert.doesNotMatch(result[0].excerpt, /Art\. 3º/);
});

test('does not fabricate article references from summaries or revoked articles', () => {
  assert.deepEqual(repositoryExcerpts('# Lei\nResumo: seguro rural', 'seguro rural'), []);
  assert.deepEqual(repositoryExcerpts('Art. 1º Revogado. Seguro rural.', 'seguro rural'), []);
  assert.deepEqual(repositoryExcerpts('Art. 1º Regras tributárias.', 'seguro rural'), []);
});

test('marks excerpt truncation and excludes partial, revoked and ambiguous municipal texts', () => {
  assert.match(repositoryExcerpts('Art. 1º Seguro rural. ' + 'Texto. '.repeat(100), 'seguro', 1, 100)[0].excerpt, /\n\[…\]$/);
  assert.equal(eligibleForAnswer({ is_partial: true }), false);
  assert.equal(eligibleForAnswer({ status: 'repealed' }), false);
  assert.equal(eligibleForAnswer({ category: 'jurisprudência' }), false);
  assert.equal(eligibleForAnswer({ scope: 'municipal' }, null), false);
  assert.equal(eligibleForAnswer({ scope: 'municipal' }, 'uberlandia'), true);
});
test('a bare law reference starts with substantive articles and a requested article never matches another number', () => {
  const text='Art. 1º Esta lei trata da aposentadoria.\nArt. 2º Os requisitos seguem os critérios desta lei.\nArt. 11 Publicada em 2013, conforme a Lei Complementar 142.';
  assert.equal(repositoryExcerpts(text,'Lei Complementar 142/2013',2,2200,true)[0].article,'Art. 1º');
  assert.equal(repositoryExcerpts(text,'Artigo 11 da Lei Complementar 142/2013',2,2200,true)[0].article,'Art. 11');
  assert.equal(repositoryExcerpts(text,'Artigo 999 da Lei Complementar 142/2013',2,2200,true).length,0);
});
