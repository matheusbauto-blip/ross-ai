/* ROSS AI — simula, sem IA e sem gastar cota, a escolha de trechos do app para cada pergunta da bateria: rota,
   leis, posição dos artigos do gabarito entre os candidatos (cand#) e na seleção sem o modelo (sel#), e o tamanho do
   que iria ao modelo. Sem rota, o app real ainda usa a IA para sugerir termos e leis, então um ✗ aqui não é falha certa.
   Uso: node qa/simular-trechos.mjs [ids separados por vírgula] [--detalhe] */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { artKey } from './avaliacao-gabarito.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const source = readFileSync(root + 'app.js', 'utf8');
const catalog = JSON.parse(readFileSync(root + 'data/catalog.json', 'utf8'));
const context = { state: { catalog } };
vm.runInNewContext(source.slice(source.indexOf('  function repairEncoding('), source.indexOf('  providers.oficial =')) +
  '\nglobalThis.x = { searchIntent, expandQuery, selectLaws, candidateHits, lawSource, excludedByIntent, fallbackSelection, withCompanions };', context);
const X = context.x;
const bank = JSON.parse(readFileSync(root + 'qa/perguntas-avaliacao.json', 'utf8')).perguntas;
const ids = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2].split(',') : null;
const detail = process.argv.includes('--detalhe');
const cache = new Map();
const load = (l) => { if (!cache.has(l.id)) cache.set(l.id, JSON.parse(readFileSync(root + 'data/' + l.file, 'utf8'))); return cache.get(l.id); };
for (const q of bank.filter((q) => !ids || ids.includes(q.id))) {
  const intent = X.searchIntent(q.pergunta);
  const searchText = X.expandQuery(q.pergunta) + (intent ? ' ' + intent.terms : '');
  const laws = Array.from(X.selectLaws(searchText, [], q.pergunta));
  const loaded = laws.map(load);
  const sources = Array.from(X.candidateHits(loaded, searchText, q.pergunta)).map((h, i) => X.lawSource(h, i + 1)).filter((s) => !X.excludedByIntent(intent, s));
  const picked = Array.from(X.withCompanions(Array.from(X.fallbackSelection(q.pergunta, sources, intent)), loaded));
  const key = (s) => s.lawId + ':' + artKey(s.article);
  const want = q.artigos.filter((a) => a.lei).map((a) => a.lei + ':' + artKey(a.art));
  const rankIn = (list, w) => { const i = list.findIndex((s) => key(s) === w); return i < 0 ? '—' : String(i + 1); };
  const chars = picked.reduce((n, s) => n + s.excerpt.length, 0);
  const found = want.map((w) => w + ' cand#' + rankIn(sources, w) + ' sel#' + rankIn(picked, w));
  const ok = !want.length || want.some((w) => picked.some((s) => key(s) === w));
  console.log((ok ? 'ok ' : '✗  ') + q.id.padEnd(38) + (intent ? intent.id : '—').padEnd(18) + laws.map((l) => l.id).join(',').padEnd(34) + String(chars).padStart(6) + ' chars  ' + found.join(' | '));
  if (detail) for (const s of picked) console.log('      ' + key(s).padEnd(18) + String(s.excerpt.length).padStart(5) + '  ' + s.excerpt.slice(0, 110).replace(/\n/g, ' ⏎ '));
}
