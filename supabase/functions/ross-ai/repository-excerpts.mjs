const normalize = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const STOP = new Set('como qual quais sobre para pela pelo uma esse essa lei artigo brasil federal estadual municipal complementar ordinaria decreto resolucao portaria explique explicar mostrar texto integra resumo legislacao segundo direito direitos pessoa pessoas sao com das dos nos nas aos que por seu sua seus suas ser ter tem mais pode podem deve devem quando onde qual'.split(' '));

export function eligibleForAnswer(doc, municipality) {
  return !doc.is_partial && !doc.repealed && doc.status !== 'repealed' &&
    !/jurisprudencia/i.test(normalize(doc.category)) &&
    (doc.scope !== 'municipal' || Boolean(municipality));
}

// Work only with the verified repository text, never a summary pretending to
// be an article. Keep article boundaries and visibly mark truncated excerpts.
// Scoring: words of the question in the article (once each), the title of its chapter/section (worth more),
// two-word phrases of the question ("transporte coletivo"), with long articles normalised by length and
// articles that only rewrite another law ("passa a vigorar…") demoted.
export function repositoryExcerpts(markdown, query, limit = 2, maxChars = 2200, allowUnscored = false) {
  const words = normalize(query).match(/[a-z0-9]{3,}/g) || [];
  const tokens = [...new Set(words)].filter(t => !STOP.has(t) && !/^\d+$/.test(t));
  const phrases = [];
  for (let i = 0; i + 1 < words.length; i++) if (!STOP.has(words[i]) && !STOP.has(words[i + 1]) && !/^\d+$/.test(words[i] + words[i + 1])) phrases.push(words[i] + ' ' + words[i + 1]);
  const requested = new Set(Array.from(normalize(query).matchAll(/\bart(?:igo)?\.?\s*(\d+(?:\s*[-–]\s*[a-z])?)/g), m => 'art' + m[1].replace(/[^a-z0-9]/g,'')));
  const lines = String(markdown).replace(/~~[\s\S]*?~~/g, '').replace(/<(?:s|strike|del)\b[^>]*>[\s\S]*?<\/(?:s|strike|del)>/gi, '').split(/\r?\n/);
  const sections = [];
  let current = null, heading = '';
  for (const line of lines) {
    const clean = line.replace(/^\s*#{1,6}\s*/, '').replace(/\*\*/g, '').trim();
    const label = clean.match(/^Art\.?\s*(\d+[A-Za-z]?(?:[.\-]\d+)*[º°]?(?:\s*[-–]\s*[A-Z])?)/i);
    if (label) {
      if (current) sections.push(current);
      current = { article: label[0], lines: [line], heading };
    } else if (/^\s*#{2,6}\s/.test(line) || /^(?:T[IÍ]TULO|CAP[IÍ]TULO|SE[CÇ][AÃ]O|SUBSE[CÇ][AÃ]O|LIVRO)\b/.test(clean)) {
      // A chapter title introduces the articles after it, not the article before.
      heading = /^(?:T[IÍ]TULO|LIVRO)\b/i.test(clean) ? clean : (heading.split(' › ').filter(h => /^(?:T[IÍ]TULO|LIVRO)\b/i.test(h)).concat(clean).join(' › '));
    } else if (current) current.lines.push(line);
  }
  if (current) sections.push(current);
  // Weight each word by how rare it is inside this text: in the disability statute "deficiência" is everywhere
  // and says little; "transporte" points to the right chapter.
  const prepared = sections.map(section => { const text = section.lines.join('\n').trim(); return { section, text, plain: normalize(text), head: normalize(section.heading) }; });
  const weight = new Map();
  for (const term of tokens.concat(phrases)) {
    const df = prepared.reduce((n, s) => n + (s.plain.includes(term) || s.head.includes(term) ? 1 : 0), 0);
    weight.set(term, df ? Math.log(1 + prepared.length / df) : 0);
  }
  return prepared.map(({ section, text, plain, head }, index) => {
    let score = 0, matched = 0;
    for (const token of tokens) {
      const inText = plain.includes(token), inHead = head.includes(token), w = weight.get(token);
      if (inText || inHead) matched++;
      score += w * ((inText ? 1 : 0) + (inHead ? 2 : 0));
    }
    for (const phrase of phrases) score += weight.get(phrase) * ((plain.includes(phrase) ? 1.5 : 0) + (head.includes(phrase) ? 2 : 0));
    if (/\b(?:revogad[oa]|vetad[oa])\b/i.test(normalize(text.split('\n')[0]))) return null;
    if (/passa(?:m)? a vigorar (?:com|acrescid)/.test(plain)) score *= 0.4;
    const rank = score / (1 + Math.log10(1 + text.length / 1500));
    return { article: section.article, text, score, rank, matched, index };
  }).filter(section => section && (!requested.size || requested.has(normalize(section.article).replace(/[^a-z0-9]/g,''))) && (section.matched > 0 || allowUnscored || requested.size))
    .sort((a, b) => b.rank - a.rank || a.index - b.index)
    .slice(0, limit)
    .map(section => ({ article: section.article, excerpt: section.text.length > maxChars ? section.text.slice(0, maxChars) + '\n[…]' : section.text }));
}
