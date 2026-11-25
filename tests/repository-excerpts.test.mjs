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

test('the chapter title and rare words pick the right articles; words present everywhere and amending articles weigh less', () => {
  const law = ['# Estatuto', '#### CAPÍTULO I — DISPOSIÇÕES GERAIS',
    '**Art. 1º** Esta lei assegura os direitos da pessoa com deficiência, com acessibilidade, inclusão, igualdade, transporte, educação, trabalho e saúde da pessoa com deficiência.',
    '#### CAPÍTULO II — DO DIREITO À EDUCAÇÃO', '**Art. 2º** A educação da pessoa com deficiência é inclusiva em todos os níveis.',
    '#### CAPÍTULO III — DO DIREITO AO TRANSPORTE E À MOBILIDADE', '**Art. 3º** O direito ao transporte da pessoa com deficiência é assegurado em igualdade de oportunidades.',
    '**Art. 4º** As empresas de transporte coletivo devem reservar assentos à pessoa com deficiência.',
    '#### CAPÍTULO IV — DISPOSIÇÕES FINAIS', '**Art. 5º** A Lei nº 1.000 passa a vigorar com as seguintes alterações: transporte coletivo acessível à pessoa com deficiência, com reserva de assentos.'].join('\n\n');
  const transport = repositoryExcerpts(law, 'direitos da pessoa com deficiência no transporte coletivo', 2, 2200, true).map(p => p.article);
  assert.deepEqual(transport.sort(), ['Art. 3º', 'Art. 4º']);
  assert.equal(repositoryExcerpts(law, 'educação inclusiva da pessoa com deficiência', 1, 2200, true)[0].article, 'Art. 2º');
});
