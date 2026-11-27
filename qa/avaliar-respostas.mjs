#!/usr/bin/env node
/* ROSS AI — avaliação das respostas reais com a bateria qa/perguntas-avaliacao.json.

   Roda o app.js de verdade (busca, índice, escolha de trechos e servidor com o Gemini) e confere cada resposta com o
   gabarito: artigos citados, pontos que a resposta precisa trazer, afirmações que não pode fazer e o tipo de resposta.
   O modelo não aprende com estas perguntas: o que melhora o app são as correções feitas a partir das falhas (regras de
   busca, acervo, instruções), e cada falha corrigida vira um teste automático.

   Cada pergunta gasta de 2 a 3 das chamadas diárias de IA por conexão (ROSS_IP_DAILY_LIMIT, padrão 40). Ao atingir o
   limite, a avaliação para e diz onde retomar.

   Uso:
     node qa/prepare-dom.mjs                         (uma vez: prepara o DOM usado nos testes)
     node qa/avaliar-respostas.mjs                   as 12 primeiras perguntas
     node qa/avaliar-respostas.mjs --de 13 --limite 12
     node qa/avaliar-respostas.mjs --ids transito-celular,penal-prisao-por-divida
     node qa/avaliar-respostas.mjs --area Trabalho
   Resultado: tabela no terminal e arquivo em qa/resultados/avaliacao-AAAA-MM-DD-HHMM.json (respostas completas). */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL, fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { grade } from './avaliacao-gabarito.mjs';

const root = new URL('../', import.meta.url);
const read = (file) => readFileSync(new URL(file, root), 'utf8');
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const domModule = process.env.ROSS_DOM_MODULE || resolve(tmpdir(), 'ross-qa-dom/linkedom-worker.mjs');
if (!existsSync(domModule)) { console.error('Rode antes: node qa/prepare-dom.mjs'); process.exit(1); }
const { parseHTML } = await import(pathToFileURL(domModule));

const bank = JSON.parse(read('qa/perguntas-avaliacao.json')).perguntas;
let selected = bank;
if (opt('--ids')) { const ids = opt('--ids').split(','); selected = bank.filter((q) => ids.includes(q.id)); }
else if (opt('--area')) selected = bank.filter((q) => q.area.toLowerCase() === opt('--area').toLowerCase());
else { const from = Math.max(1, Number(opt('--de')) || 1); selected = bank.slice(from - 1, from - 1 + (Number(opt('--limite')) || 12)); }
if (!selected.length) { console.error('Nenhuma pergunta selecionada.'); process.exit(1); }

/* ---------- app real em um DOM simulado; leis locais, servidor e índice reais ---------- */
function loadApp() {
  const { window, document } = parseHTML(read('index.html'));
  const storage = new Map();
  window.scrollTo = () => {}; window.innerHeight = 800;
  window.HTMLElement.prototype.focus = function () {}; window.HTMLElement.prototype.scrollIntoView = function () {};
  const fetcher = async (url, options) => {
    const local = String(url).match(/(?:^|\/)(data\/(?:laws\/[a-z0-9_-]+|catalog)\.json)/i);
    if (local) return new Response(read(local[1]), { headers: { 'Content-Type': 'application/json' } });
    return fetch(url, options);
  };
  const context = vm.createContext({
    window, document, navigator: { language: 'pt-BR', clipboard: { writeText: async () => {} } },
    location: { hash: '' }, history: { replaceState() {} },
    localStorage: { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    console, setTimeout, clearTimeout, AbortController, URL, TextDecoder, TextEncoder, Response,
    requestAnimationFrame: (fn) => fn(), fetch: fetcher,
  });
  for (const file of ['config.js', 'i18n.js', 'demo-data.js', 'process-tracker.js']) vm.runInContext(read(file), context);
  const script = read('app.js').replace("if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();",
    'window.__eval = {state, go, submitMessage, t};');
  vm.runInContext(script, context);
  const api = window.__eval;
  api.state.catalog = JSON.parse(read('data/catalog.json'));
  api.state.aiAvailable = true;
  api.state.mode = 'oficial';
  api.go('home');
  return api;
}

/* ---------- execução ---------- */
const api = loadApp();
const rateLimited = api.t('errors.rate_limited');
const results = [];
console.log(`Avaliando ${selected.length} pergunta(s). Cada uma gasta de 2 a 3 chamadas diárias de IA.\n`);
for (const question of selected) {
  api.go('home');
  const started = Date.now();
  await api.submitMessage(question.pergunta);
  const conv = api.state.conversations.find((c) => c.id === api.state.currentId);
  const message = conv.messages[conv.messages.length - 1];
  const result = grade(question, message, Math.round((Date.now() - started) / 1000));
  results.push({ ...result, pergunta: question.pergunta, gabarito: question.gabarito, resposta: message.answer || null });
  const mark = { certo: '✅', incompleto: '⚠️ ', errado: '❌', erro: '⛔' }[result.nota];
  console.log(`${mark} ${question.id} (${result.segundos}s${result.pontos !== undefined ? ', ' + result.pontos + '% dos pontos' : ''})${result.modeloAlternativo ? ' [modelo alternativo]' : ''}`);
  if (result.faltouPonto && result.faltouPonto.length) console.log('    faltou: ' + result.faltouPonto.join('; '));
  if (result.afirmouIndevido && result.afirmouIndevido.length) console.log('    afirmou indevidamente: ' + result.afirmouIndevido.join('; '));
  if (result.artigosFaltando && result.artigosFaltando.length) console.log('    artigos não citados: ' + result.artigosFaltando.join(', '));
  if (result.tipo && !question.tipo.includes(result.tipo)) console.log(`    tipo de resposta: ${result.tipo} (esperado: ${question.tipo.join(' ou ')})`);
  if (result.nota === 'erro') {
    console.log('    ' + result.erro);
    if (result.erro === rateLimited) { console.log(`\nLimite diário de IA atingido. Retome com: --ids ${selected.slice(selected.indexOf(question)).map((q) => q.id).join(',')}`); break; }
  }
}

const count = (nota) => results.filter((r) => r.nota === nota).length;
console.log(`\nResultado: ${count('certo')} certas, ${count('incompleto')} incompletas, ${count('errado')} erradas, ${count('erro')} sem resposta (de ${results.length}).`);
const dir = fileURLToPath(new URL('qa/resultados/', root));
mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, (c) => (c === 'T' ? '-' : c === ':' ? '' : '-'));
const file = resolve(dir, 'avaliacao-' + stamp + '.json');
writeFileSync(file, JSON.stringify({ quando: new Date().toISOString(), resultados: results }, null, 1) + '\n');
console.log('Detalhes: ' + file);
