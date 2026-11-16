const normalize = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const STOP = new Set('como qual quais sobre para pela pelo uma esse essa lei artigo brasil federal estadual municipal complementar ordinaria decreto resolucao portaria explique explicar mostrar texto integra resumo legislacao'.split(' '));

export function eligibleForAnswer(doc, municipality) {
  return !doc.is_partial && !doc.repealed && doc.status !== 'repealed' &&
    !/jurisprudencia/i.test(normalize(doc.category)) &&
    (doc.scope !== 'municipal' || Boolean(municipality));
}

// Work only with the verified repository text, never a summary pretending to
// be an article. Keep article boundaries and visibly mark truncated excerpts.
export function repositoryExcerpts(markdown, query, limit = 2, maxChars = 2200, allowUnscored = false) {
  const tokens = [...new Set(normalize(query).match(/[a-z0-9]{3,}/g) || [])].filter(t => !STOP.has(t) && !/^\d+$/.test(t));
  const requested = new Set(Array.from(normalize(query).matchAll(/\bart(?:igo)?\.?\s*(\d+(?:\s*[-–]\s*[a-z])?)/g), m => 'art' + m[1].replace(/[^a-z0-9]/g,'')));
  const lines = String(markdown).replace(/~~[\s\S]*?~~/g, '').replace(/<(?:s|strike|del)\b[^>]*>[\s\S]*?<\/(?:s|strike|del)>/gi, '').split(/\r?\n/);
  const sections = [];
  let current = null;
  for (const line of lines) {
    const label = line.replace(/^\s*#{1,6}\s*/, '').replace(/\*\*/g, '').trim().match(/^Art\.?\s*(\d+[A-Za-z]?(?:[.\-]\d+)*[º°]?(?:\s*[-–]\s*[A-Z])?)/i);
    if (label) {
      if (current) sections.push(current);
      current = { article: label[0], lines: [line] };
    } else if (current) current.lines.push(line);
  }
  if (current) sections.push(current);
  return sections.map((section, index) => {
    const text = section.lines.join('\n').trim();
    const plain = normalize(text);
    const score = tokens.reduce((sum, token) => sum + (plain.includes(token) ? 1 : 0), 0);
    if (/\b(?:revogad[oa]|vetad[oa])\b/i.test(normalize(text.split('\n')[0]))) return null;
    return { article: section.article, text, score, index };
  }).filter(section => section && (!requested.size || requested.has(normalize(section.article).replace(/[^a-z0-9]/g,''))) && (section.score > 0 || allowUnscored || requested.size))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(section => ({ article: section.article, excerpt: section.text.length > maxChars ? section.text.slice(0, maxChars) + '\n[…]' : section.text }));
}
