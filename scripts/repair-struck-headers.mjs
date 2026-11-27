#!/usr/bin/env node
/* Repara os textos já capturados em data/laws: artigos marcados como revogados só porque a redação antiga, riscada,
   vinha antes da atual (o mesmo artigo reaparece depois com redação em vigor), ou porque só alguns parágrafos ou
   incisos foram revogados. Mantém só a redação atual, marca como vigente e atualiza as contagens do catálogo.
   Não baixa nada. Pode ser rodado de novo sem efeito.
   Uso: node scripts/repair-struck-headers.mjs [--check] */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATA = path.join(ROOT, 'data');
const check = process.argv.includes('--check');
// Mesmas regras de scripts/ingest-laws.mjs.
const RX_ART = /^Art\.?\s*(\d{1,3}(?:\.\d{3})+|\d+)(?:[ºo°])?(?:-([A-Z]{1,2})(?![a-záéíóúâêôãõç]))?\s*[.:\-–—]?\s*(.*)$/s;
const REVOKED = /\(\s*(?:[Aa]rtigo\s+|[Aa]rt\.\s+)?(?:Revogad[oa]|REVOGAD[OA]|revogad[oa])\b/;
const sameArticle = (text, label) => { const m = /^[“"'‘]/.test(text) ? null : text.match(RX_ART); return !!m && 'Art. ' + m[1].replace(/\./g, '') + (m[2] ? '-' + m[2] : '') === label; };

// Marca de revogação, veto ou rejeição no texto; nota solta ("(Revogado pela Lei …)") numa linha própria.
export const MARK = /revogad|vetad|rejeitad|sem efeito|prejudicad|caduc/i;
export const NOTE = /^\(\s*(?:revogad|rejeitad|vetad|sem efeito|prejudicad|caducad|declarad)/i;
/* Artigo em vigor com parágrafos ou incisos revogados: o caput não traz marca de revogação e a linha seguinte é
   conteúdo (inciso, parágrafo), não uma nota solta que revogue o caput. Ex.: Código Civil, arts. 3º e 206; CLT,
   art. 392-A; Constituição, art. 111. Uma emenda rejeitada ("(Rejeitada)" logo após o caput) continua fora. */
export function partlyRepealed(lines) {
  return lines.length > 1 && !MARK.test(lines[0]) && !NOTE.test(lines[1].trim());
}

export function repairArticle(article) {
  if (article.status === 'vigente') return false;
  const lines = article.text.split('\n');
  let again = -1;
  lines.forEach((line, i) => { if (i > 0 && sameArticle(line, article.label)) again = i; });
  if (again <= 0) {
    if (article.status !== 'revogado' || !partlyRepealed(lines)) return false;
    article.status = 'vigente';
    return true;
  }
  const caput = lines[again];
  if (REVOKED.test(caput.slice(0, 260)) || /^Art\.[^(]{0,20}\(\s*(?:Revogad|revogad|REVOGAD)/.test(caput) || /\(VETADO\)/.test(caput.slice(0, 260))) return false;
  article.text = lines.slice(again).join('\n');
  article.status = 'vigente';
  const nota = article.text.match(/\(([^()]{0,60}?(?:[Rr]eda[çc][ãa]o dada|[Ii]nclu[íi]d[oa]|[Aa]crescid[oa]|[Rr]enumerad[oa]|[Aa]crescentad[oa])[^()]*)\)/);
  if (nota) article.nota = nota[1].replace(/\s+/g, ' ').trim(); else delete article.nota;
  article.hasHistory = true;
  return true;
}

if (import.meta.url === 'file://' + process.argv[1] || process.argv[1]?.endsWith('repair-struck-headers.mjs')) {
  const catalog = JSON.parse(await fs.readFile(path.join(DATA, 'catalog.json'), 'utf8'));
  let total = 0;
  for (const entry of catalog.laws) {
    const file = path.join(DATA, entry.file);
    const law = JSON.parse(await fs.readFile(file, 'utf8'));
    const fixed = law.articles.filter(repairArticle).map((a) => a.label);
    if (!fixed.length) continue;
    total += fixed.length;
    console.log(law.id + ': ' + fixed.length + ' artigo(s) em vigor recuperado(s): ' + fixed.join(', '));
    law.vigentes = law.articles.filter((a) => a.status === 'vigente').length;
    law.revogados = law.articles.length - law.vigentes;
    entry.vigentes = law.vigentes; entry.revogados = law.revogados;
    if (!check) await fs.writeFile(file, JSON.stringify(law, null, 1));
  }
  if (!check && total) await fs.writeFile(path.join(DATA, 'catalog.json'), JSON.stringify(catalog, null, 1) + '\n');
  console.log(total ? (check ? 'A reparar: ' : 'Reparados: ') + total + ' artigo(s).' : 'Nada a reparar.');
}
