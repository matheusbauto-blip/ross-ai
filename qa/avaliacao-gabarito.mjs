/* Conferência de uma resposta do ROSS AI com o gabarito de qa/perguntas-avaliacao.json (usada por
   qa/avaliar-respostas.mjs e pelos testes). */
export const norm = (text) => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const artKey = (label) => norm(label).replace(/^.*?art\.?\s*/, '').replace(/[º°]/g, '').replace(/(\d)o\b/g, '$1').replace(/[.\s]/g, '');
export function answerText(a) {
  // Só o que o modelo escreveu: os trechos de lei citados ficam de fora (podem conter palavras do "evitar").
  return [a.summary, ...(a.sourcesSay || []).map((s) => s.title + ' ' + s.text), ...(a.depends || []), ...(a.nextSteps || []),
    ...(a.questions || []), ...(a.warnings || []), a.limitNotice ? a.limitNotice.text + ' ' + (a.limitNotice.referrals || []).join(' ') : ''].join('\n');
}
export function grade(question, message, seconds) {
  if (message.status !== 'done') return { id: question.id, nota: 'erro', erro: message.error || 'sem resposta', segundos: seconds };
  const a = message.answer, text = norm(answerText(a));
  const cited = (a.sources || []).map((s) => ({ lawId: s.lawId, name: norm(s.name), art: artKey(s.article) }));
  const expected = question.artigos.map((e) => ({ e, ok: cited.some((c) => e.lei ? c.lawId === e.lei && c.art === artKey(e.art) : new RegExp(e.nome).test(c.name)) }));
  const points = question.pontos.map(([desc, rx]) => ({ desc, ok: new RegExp(rx).test(text) }));
  const avoided = question.evitar.filter(([, rx]) => new RegExp(rx).test(text)).map(([desc]) => desc);
  const kindOk = question.tipo.includes(a.kind);
  const pointRate = points.length ? points.filter((p) => p.ok).length / points.length : 1;
  const articleOk = !expected.length || expected.some((x) => x.ok);
  // "errado" só quando afirma o que não pode ou responde com o tipo errado; faltar pontos é "incompleto".
  const nota = avoided.length || !kindOk ? 'errado' : pointRate >= 0.8 && articleOk ? 'certo' : 'incompleto';
  const notices = (a.notices || []).concat((a.warnings || []).filter((w) => /modelo alternativo|fallback model/i.test(w)));
  return {
    id: question.id, area: question.area, nota, pontos: Math.round(pointRate * 100), segundos: seconds, tipo: a.kind, tipoEsperado: question.tipo,
    faltouPonto: points.filter((p) => !p.ok).map((p) => p.desc), afirmouIndevido: avoided,
    artigosCitados: (a.sources || []).map((s) => (s.shortName || s.name || '').slice(0, 40) + ' ' + s.article),
    artigosFaltando: expected.filter((x) => !x.ok).map((x) => x.e.lei ? x.e.lei + ' art. ' + x.e.art : 'norma ~ ' + x.e.nome),
    modeloAlternativo: notices.some((n) => /modelo alternativo|fallback model/i.test(n)),
    resumo: a.summary,
  };
}

