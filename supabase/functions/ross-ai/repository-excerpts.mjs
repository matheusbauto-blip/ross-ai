const normalize = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const STOP = new Set('como qual quais sobre para pela pelo uma esse essa lei artigo brasil federal estadual municipal'.split(' '));

export function eligibleForAnswer(doc, municipality) {
  return !doc.is_partial && !doc.repealed && doc.status !== 'repealed' &&
    !/jurisprudencia/i.test(normalize(doc.category)) &&
    (doc.scope !== 'municipal' || Boolean(municipality));
}

// Work only with the verified repository text, never a summary pretending to
// be an article. Keep article boundaries and visibly mark truncated excerpts.
export function repositoryExcerpts(markdown, query, limit = 2, maxChars = 2200) {
  const tokens = [...new Set(normalize(query).match(/[a-z0-9]{3,}/g) || [])].filter(t => !STOP.has(t));
  const lines = String(markdown).split(/\r?\n/);
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
  }).filter(section => section && section.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(section => ({ article: section.article, excerpt: section.text.length > maxChars ? section.text.slice(0, maxChars) + '\n[…]' : section.text }));
}
