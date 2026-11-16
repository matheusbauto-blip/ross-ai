import { createHash } from 'node:crypto';

export const REPOSITORY = 'ctresb/leis';
export const DEFAULT_REF = 'c9f21b4ab11aa0d7ca6fe861d75028e94219c2d6';
const hash = (text) => createHash('sha256').update(text).digest('hex');
const plain = (text) => text.replace(/\*\*|__|~~/g, '').replace(/<[^>]*>/g, '').trim();

// The upstream frontmatter uses scalar fields. Reject complex YAML rather than
// guessing its meaning or evaluating tags. The original Markdown is retained.
export function parseFrontmatter(markdown) {
  const match = markdown.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return { metadata: {}, body: markdown.trim() };
  const metadata = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || /^\s*#/.test(line)) continue;
    const field = line.match(/^([a-z_][a-z_0-9]*):\s*(.*?)\s*$/i);
    if (!field) throw new Error('Unsupported frontmatter: ' + line.slice(0, 80));
    const [, key, value] = field;
    if (value.startsWith('"')) metadata[key] = JSON.parse(value);
    else if (value.startsWith("'")) {
      if (!value.endsWith("'")) throw new Error('Unterminated YAML string');
      metadata[key] = value.slice(1, -1).replace(/''/g, "'");
    } else if (/^[!&*\[{>|]/.test(value)) throw new Error('Unsupported YAML value');
    else if (value === 'true' || value === 'false') metadata[key] = value === 'true';
    else if (value === 'null' || value === '~') metadata[key] = null;
    else metadata[key] = value.replace(/\s+#.*$/, '');
  }
  return { metadata, body: markdown.slice(match[0].length).trim() };
}

export function isCorpusPath(path) {
  return !path.includes('..') && !path.includes('\\') &&
    /^(?:constituicao\.md|(?:federal|estaduais|municipais|reguladores|jurisprudencia|tratados)\/[^\n]+\.md)$/.test(path) &&
    !/(?:^|\/)(?:README|COBERTURA|PROGRESSO|_falhas)\b/i.test(path);
}

export function splitPassages(body, maxChars = 4200) {
  // Preserve historical wording in the original snapshot, but do not mix
  // struck-through editions into passages used to explain a current rule.
  body = body.replace(/~~[\s\S]*?~~/g, '').replace(/<(?:s|strike|del)\b[^>]*>[\s\S]*?<\/(?:s|strike|del)>/gi, '');
  const lines = body.split(/\r?\n/);
  const passages = [];
  let text = '', article = 'Texto', part = '', headings = [];
  function flush() {
    if (!text.trim()) return;
    const cleaned = plain(text);
    passages.push({ ordinal: passages.length, article, heading: headings.join(' › '),
      content: cleaned, repealed: /^Art\.?\s*[\d.º°oA-Z-]+\s*[.:–-]?\s*\(?\s*(?:Revogad[oa]|VETADO)\b/i.test(cleaned) });
    text = '';
  }
  for (const line of lines) {
    const clean = plain(line).replace(/^#+\s*/, '');
    if (/^ATO DAS DISPOSIÇÕES CONSTITUCIONAIS TRANSITÓRIAS/i.test(clean)) { flush(); part = 'ADCT · '; }
    const art = clean.match(/^Art\.?\s*(\d[\d.]*(?:[º°o])?(?:\s*[-–]\s*[A-Z]{1,2})?)(?=\s|[.:–-]|$)/i);
    const heading = !art && line.match(/^(#{2,6})\s+(.+)$/);
    if (art || heading) flush();
    if (art) article = part + 'Art. ' + art[1].replace(/\s+/g, '').replace(/\.$/, '');
    if (heading) { headings.length = Math.min(headings.length, heading[1].length - 2); headings.push(plain(heading[2])); article = 'Texto'; continue; }
    // Split long individual paragraphs without dropping the remaining text.
    let remaining = line;
    while (remaining.length) {
      const room = maxChars - text.length - 1;
      if (room < 1) { flush(); continue; }
      if (remaining.length <= room) { text += (text ? '\n' : '') + remaining; remaining = ''; }
      else {
        let end = remaining.lastIndexOf(' ', room);
        if (end < room / 2) end = room;
        text += (text ? '\n' : '') + remaining.slice(0, end);
        remaining = remaining.slice(end).trimStart(); flush();
      }
    }
  }
  flush();
  return passages;
}

function safeSource(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}

export function corpusDocument(path, markdown, ref = DEFAULT_REF, metadataOnly = false) {
  if (!isCorpusPath(path)) throw new Error('Not a corpus document: ' + path);
  if (!/^[a-f0-9]{40}$/.test(ref)) throw new Error('Use an immutable commit SHA');
  const { metadata: m, body } = parseFrontmatter(markdown);
  const segments = path.split('/');
  const scope = segments[0] === 'estaduais' ? 'estadual' : segments[0] === 'municipais' ? 'municipal' : 'federal';
  const uf = scope !== 'federal' ? segments[1].toUpperCase() : null;
  const municipality = scope === 'municipal' ? segments[2] : null;
  const version = String(m.versao_texto || 'Edição não informada');
  const warnings = [];
  if (/republica|retifica|partes?\b|ementa|metadad/i.test(version)) warnings.push('partial_version');
  if (body.length < 150 || /s[oó] (?:os )?metadados|documento vazio|sem texto integral/i.test(body)) warnings.push('missing_text');
  if (/!\[[^\]]*\]\(|\]\([^)]*\.pdf(?:[?#][^)]*)?\)/i.test(body)) warnings.push('external_attachment');
  const source = safeSource(m.fonte);
  if (!source) warnings.push('missing_source');
  const passages = metadataOnly ? [{ ordinal: 0, article: 'Identificação da norma', heading: '', content: String(m.titulo || path) + '\n' + String(m.ementa || ''), repealed: m.revogada === true }] : splitPassages(body);
  return {
    id: hash(REPOSITORY + ':' + path), repository: REPOSITORY, repository_path: path,
    repository_ref: ref, content_sha256: hash(markdown),
    title: String(m.titulo || (path === 'constituicao.md' ? 'Constituição Federal de 1988' : path)),
    norm_type: String(m.tipo || 'Constituição'), number: String(m.numero || '').replace(/\D/g, ''),
    norm_date: /^\d{4}-\d{2}-\d{2}$/.test(String(m.data || '')) ? String(m.data) : null,
    scope, uf, municipality, category: segments.length > 1 ? segments[0] : 'federal',
    summary: String(m.ementa || ''), urn: String(m.urn || ''), source_url: source,
    text_version: version, status: m.revogada === true ? 'repealed' : 'unknown',
    captured_at: /^\d{4}-\d{2}-\d{2}$/.test(String(m.baixado_em || '')) ? String(m.baixado_em) : null,
    is_partial: warnings.length > 0, content_mode: metadataOnly ? 'metadata' : 'full', warnings, passages,
  };
}

export function sqlForDocuments(documents) {
  const json = JSON.stringify(documents).replace(/'/g, "''");
  return "select public.ross_law_import('" + json + "'::jsonb);\n";
}
