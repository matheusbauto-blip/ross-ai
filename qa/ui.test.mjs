import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';

const { parseHTML } = await import(pathToFileURL(process.env.ROSS_DOM_MODULE || resolve(tmpdir(), 'ross-qa-dom/linkedom-worker.mjs')));
const root = new URL('../', import.meta.url);
const read = file => readFileSync(new URL(file, root), 'utf8');
const catalog = JSON.parse(read('data/catalog.json'));
const tick = () => new Promise(resolve => setImmediate(resolve));
function setup(t, fetcher = async () => Response.json({ documents: 235, results: [] })) {
  const { window, document } = parseHTML(read('index.html'));
  // Prazos encurtados por um teste não podem vazar para os seguintes.
  delete window.__clientTimeout; delete window.__indexTimeout;
  const storage = new Map();
  const clipboard = [];
  const timers = new Set();
  window.scrollTo = () => {};
  window.innerHeight = 800;
  window.HTMLElement.prototype.focus = function () {};
  window.HTMLElement.prototype.scrollIntoView = function () {};
  const context = vm.createContext({
    window, document, navigator: { language: 'pt-BR', clipboard: { writeText: async text => { clipboard.push(text); } } },
    location: { hash: '' }, history: { replaceState() {} },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => { if (storage.fail) throw storage.fail; storage.set(key, value); } },
    console, setTimeout: (fn, delay) => { const timer = setTimeout(fn, delay); timers.add(timer); return timer; }, clearTimeout,
    AbortController, URL, requestAnimationFrame: fn => fn(), fetch: fetcher,
  });
  for (const file of ['config.js', 'i18n.js', 'demo-data.js', 'process-tracker.js']) vm.runInContext(read(file), context);
  const script = read('app.js').replace("if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();",
    'window.__test = {state, providers, render, go, load, onFilesChosen, newConversation, submitMessage, retryMessage, openConversation, deleteConversation, answerToText, isRephraseRequest, conversationContext, historyForModel, normalizeOfficial, activeProvider, turnText, stopAnswer, exportHistory};')
    .replace('}, CLIENT_TIMEOUT_MS);', '}, window.__clientTimeout || CLIENT_TIMEOUT_MS);')
    .replace('resolve(null), INDEX_ANSWER_TIMEOUT_MS)', 'resolve(null), window.__indexTimeout || INDEX_ANSWER_TIMEOUT_MS)');
  vm.runInContext(script, context);
  const api = window.__test;
  api.state.catalog = structuredClone(catalog);
  api.state.aiAvailable = true;
  api.go('home');
  t.after(() => { for (const timer of timers) clearTimeout(timer); });
  const change = (selector, value) => {
    const node = document.querySelector(selector);
    if (node.localName === 'select') { for (const option of node.querySelectorAll('option')) option.selected = false; const selected = Array.from(node.querySelectorAll('option')).find(option => option.value === value); if (selected) selected.selected = true; }
    else node.value = value;
    node.dispatchEvent(new window.Event(node.localName === 'select' ? 'change' : 'input', { bubbles: true }));
  };
  return { api, document, window, storage, change, clipboard };
}

test('every main view renders in both languages', async t => {
  const { api, document } = setup(t);
  for (const language of ['pt-BR', 'en']) {
    api.state.lang = language;
    for (const view of ['home', 'search', 'processes', 'settings', 'sources', 'privacy', 'terms', 'help']) {
      api.go(view);
      assert.ok(document.querySelector('#main').textContent.trim().length > 100, language + ':' + view);
      assert.doesNotMatch(document.querySelector('#main').textContent, /\bundefined\b/);
    }
  }
  await tick();
});

const processNumber = '00008323520184013202';
function processResponse(number = processNumber) {
  return { process: { number, tribunal: 'TRF1', activeParty: '<img src=x onerror=alert(1)>', passiveParty: 'Parte de teste', className: 'Classe de teste', provider: 'Escavador', verifiedAt: '2026-11-13', lastMovementAt: '2026-11-12' }, fetchedAt: '2026-11-15T10:00:00Z', movements: [{ id: '1', date: '2026-11-12', text: '<script>conteúdo do evento</script>', source: 'TRF1', url: 'javascript:alert(1)' }], nextPage: null, movementsUnavailable: false };
}

test('the drawer opens proceeding tracking and invalid numbers do not make requests', async t => {
  const calls = [];
  const { document, window, change } = setup(t, async (...args) => { calls.push(args); return Response.json({}); });
  document.querySelector('#btn-menu').click();
  document.querySelector('[data-go="processes"]').click();
  assert.equal(document.querySelector('#main h1').textContent, 'Acompanhar processo');
  assert.equal(document.querySelector('#drawer').getAttribute('aria-hidden'), 'true');
  change('#process-number', '0000832-36.2018.4.01.3202');
  document.querySelector('#process-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await tick();
  assert.match(document.querySelector('#process-error').textContent, /Confira o número/);
  assert.equal(calls.length, 0);
});

test('CPF discovery opens the official portal without collecting credentials and returns to the number field', t => {
  const { api, document, window, change } = setup(t);
  for (const language of ['pt-BR', 'en']) {
    api.state.lang = language; api.go('processes');
    const guide = document.querySelector('#process-cpf');
    assert.equal(guide.hasAttribute('open'), false);
    guide.open = true; guide.dispatchEvent(new window.Event('toggle'));
    const link = document.querySelector('#process-cpf-link');
    assert.equal(link.getAttribute('href'), 'https://www.jus.br/');
    assert.equal(link.getAttribute('target'), '_blank');
    assert.match(link.getAttribute('rel'), /noopener/); assert.match(link.getAttribute('rel'), /noreferrer/);
    assert.match(guide.textContent, /CPF da Parte/);
    assert.match(guide.textContent, /ouro|gold-level/);
    assert.equal(guide.querySelector('input, iframe'), null);
    change('#process-number', processNumber);
    let focused = false;
    window.HTMLElement.prototype.focus = function () { focused = this.id === 'process-number'; };
    document.querySelector('#process-cpf-return').click();
    assert.equal(document.querySelector('#process-cpf').hasAttribute('open'), false);
    assert.equal(document.querySelector('#process-number').value, processNumber);
    assert.equal(focused, true);
  }
});

test('a CPF entered as a proceeding number stays off the API and opens the official search guide', async t => {
  const calls = [];
  const { api, document, window, storage, change } = setup(t, async (...args) => { calls.push(args); return Response.json(processResponse()); });
  api.go('processes');
  // Deliberately fictitious input: discovery does not require validating a CPF.
  for (const input of ['000.000.000-00', '00000000000']) {
    change('#process-number', input);
    document.querySelector('#process-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await tick();
    assert.equal(document.querySelector('#process-cpf').hasAttribute('open'), true);
    assert.equal(document.querySelector('#process-number').value, '');
    assert.match(document.querySelector('#process-error').textContent, /CPF/);
    assert.equal(document.querySelector('.process-card'), null);
    assert.equal(calls.length, 0); assert.equal(storage.size, 0);
    document.querySelector('#process-cpf-return').click();
  }
  change('#process-number', processNumber);
  document.querySelector('#process-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await tick(); await tick();
  assert.equal(calls.length, 1); assert.ok(document.querySelector('.process-card'));
});

test('opening CPF discovery during an outstanding lookup ignores that lookup response', async t => {
  let resolveRequest;
  const { api, document, window, change } = setup(t, async () => new Promise(resolve => { resolveRequest = resolve; }));
  api.go('processes'); change('#process-number', processNumber);
  const submit = () => document.querySelector('#process-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  submit(); change('#process-number', '000.000.000-00'); submit();
  resolveRequest(Response.json(processResponse())); await tick(); await tick();
  assert.equal(document.querySelector('.process-card'), null);
  assert.equal(document.querySelector('#process-number').value, '');
  assert.match(document.querySelector('#process-error').textContent, /CPF/);
});

test('an unconfigured process service displays an honest error without a fabricated process card', async t => {
  const { api, document, window, change } = setup(t, async () => Response.json({ error: 'process_not_configured' }, { status: 503 }));
  api.go('processes'); change('#process-number', processNumber);
  document.querySelector('#process-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await tick(); await tick();
  assert.match(document.querySelector('#process-error').textContent, /ainda não foi ativada/);
  assert.equal(document.querySelector('.process-card'), null);
});

test('process data is escaped and local tracking stores no parties or event contents', async t => {
  const { api, document, window, storage, change } = setup(t, async () => Response.json(processResponse()));
  api.go('processes'); change('#process-number', processNumber);
  document.querySelector('#process-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await tick(); await tick();
  assert.ok(document.querySelector('.process-card'));
  assert.equal(document.querySelector('.process-card img,.process-card script,.process-card a[href^="javascript:"]'), null);
  assert.match(document.querySelector('.process-history').textContent, /<script>/);
  document.querySelector('#process-follow').click();
  const stored = storage.get('rossai.processes.v1');
  assert.equal(JSON.parse(stored).length, 1);
  assert.ok(stored.includes(processNumber)); assert.equal(stored.includes('Parte de teste'), false); assert.equal(stored.includes('conteúdo do evento'), false);
  assert.match(document.querySelector('.process-saved').textContent, /0000832-35/);
  document.querySelector('#process-follow').click();
  assert.deepEqual(JSON.parse(storage.get('rossai.processes.v1')), []);
});

test('process pagination merges duplicates and a new lookup does not show a previous proceeding on failure', async t => {
  let count = 0;
  const { api, document, window, change } = setup(t, async () => {
    count++;
    if (count === 3) return Response.json({ error: 'process_not_found' }, { status: 404 });
    return Response.json({ ...processResponse(), nextPage: count === 1 ? { cursor: 'next' } : null });
  });
  api.go('processes'); change('#process-number', processNumber);
  const submit = () => document.querySelector('#process-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  submit(); await tick(); await tick();
  document.querySelector('#process-more').click(); await tick(); await tick();
  assert.equal(document.querySelectorAll('.process-history li').length, 1);
  change('#process-number', '0018063-19.2013.8.26.0002'); submit(); await tick(); await tick();
  assert.equal(document.querySelector('.process-card'), null);
  assert.match(document.querySelector('#process-error').textContent, /não significa/);
});

test('leaving process tracking ignores late responses and does not overwrite the chat draft', async t => {
  let resolveRequest;
  const { api, document, window, change } = setup(t, async () => new Promise(resolve => { resolveRequest = resolve; }));
  change('#composer-input', 'Rascunho da conversa');
  api.go('processes'); change('#process-number', processNumber);
  document.querySelector('#process-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  api.go('home'); resolveRequest(Response.json(processResponse())); await tick(); await tick();
  assert.equal(document.querySelector('#process-result'), null);
  assert.equal(document.querySelector('#composer-input').value, 'Rascunho da conversa');
});

test('free DJEN lookup labels its limited coverage and displays cancellation updates without duplicating publications', async t => {
  let cancelled = false;
  const { api, document, window, change } = setup(t, async () => Response.json({ ...processResponse(), coverage: 'publications', process: { number: processNumber, tribunal: 'TRF1', provider: 'CNJ · DJEN', verifiedAt: '', lastMovementAt: '2026-11-13' }, movements: [{ id: 'djen-1', version: cancelled ? 'cancelled' : 'active', cancelled, date: '2026-11-13', text: 'Publicação de teste', source: 'DJEN', url: 'https://comunica.pje.jus.br/' }] }));
  api.go('processes'); change('#process-number', processNumber);
  document.querySelector('#process-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await tick(); await tick();
  assert.match(document.querySelector('#process-result').textContent, /Consulta gratuita/);
  assert.match(document.querySelector('#process-result').textContent, /não representa todo o histórico/);
  assert.equal(document.querySelector('.process-history h3').textContent, 'Publicações do DJEN');
  document.querySelector('#process-follow').click(); cancelled = true;
  document.querySelector('#process-refresh').click(); await tick(); await tick();
  assert.match(document.querySelector('#process-result').textContent, /novas ou alteradas/);
  assert.match(document.querySelector('.process-history').textContent, /cancelada/);
  assert.equal(document.querySelectorAll('.process-history li').length, 1);
});

test('an empty DJEN response remains trackable and does not claim that the proceeding was not found', async t => {
  const { api, document, window, change } = setup(t, async () => Response.json({ coverage: 'publications', found: false, process: { number: processNumber, provider: 'CNJ · DJEN' }, movements: [], nextPage: null }));
  api.go('processes'); change('#process-number', processNumber);
  document.querySelector('#process-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await tick(); await tick();
  assert.match(document.querySelector('.process-history').textContent, /não significa que o processo não exista/);
  assert.ok(document.querySelector('#process-follow'));
  assert.equal(document.querySelector('#process-error').textContent, '');
});

test('changing jurisdiction repeatedly does not multiply Enter submission handlers', t => {
  const { document, window, change } = setup(t);
  change('#home-region', 'MG'); change('#home-region', 'SP'); change('#home-region', 'GO');
  let submitted = 0;
  document.querySelector('#composer').requestSubmit = () => { submitted++; };
  change('#composer-input', 'Uma pergunta');
  const event = new window.Event('keydown', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'key', { value: 'Enter' });
  document.querySelector('#composer-input').dispatchEvent(event);
  assert.equal(submitted, 1);
});

test('new conversations and country controls are limited to Brazil while all states remain available', t => {
  const { api, document } = setup(t);
  for (const view of ['home', 'settings']) {
    api.go(view);
    const country = document.querySelector('select[data-role="country"]');
    assert.equal(country.disabled, true);
    assert.deepEqual(Array.from(country.options, option => option.value), ['BR']);
    assert.equal(document.querySelector('select[data-role="region"]').options.length, 28);
  }
  const conv = api.newConversation({ country: 'US', region: 'CA' });
  assert.equal(conv.country, 'BR'); assert.equal(conv.region, '');
  api.openConversation(conv.id);
  document.querySelector('#btn-jur').click();
  assert.deepEqual(Array.from(document.querySelector('#chat-country').options, option => option.value), ['BR']);
});

test('Brazil defaults replace unsupported stored preferences without relabelling legacy conversations', t => {
  const { api, storage } = setup(t);
  storage.set('rossai.state.v1', JSON.stringify({ country: 'US', region: 'MA', conversations: [{ id: 'legacy', country: 'US', region: 'MA', messages: [] }] }));
  api.load();
  assert.equal(api.state.country, 'BR'); assert.equal(api.state.region, '');
  assert.equal(api.state.conversations[0].country, 'US');
  assert.equal(api.state.conversations[0].region, 'MA');
});

test('unsent drafts stay with their conversation and the home draft stays separate', t => {
  const { api, document, change } = setup(t);
  change('#composer-input', 'Rascunho da tela inicial');
  const first = api.newConversation(); api.openConversation(first.id);
  change('#composer-input', 'Detalhes privados sobre a compra');
  const second = api.newConversation(); api.openConversation(second.id);
  assert.equal(document.querySelector('#composer-input').value, '');
  change('#composer-input', 'Dúvida sobre aluguel');
  api.openConversation(first.id);
  assert.equal(document.querySelector('#composer-input').value, 'Detalhes privados sobre a compra');
  api.openConversation(second.id);
  assert.equal(document.querySelector('#composer-input').value, 'Dúvida sobre aluguel');
  api.go('home');
  assert.equal(document.querySelector('#composer-input').value, 'Rascunho da tela inicial');
});

test('sending a home draft consumes it instead of restoring it as a later unsent question', async t => {
  const { api, document, change } = setup(t);
  api.providers.oficial.respond = async () => ({ mode: 'oficial', kind: 'answer', summary: 'Resposta', sources: [] });
  change('#composer-input', 'Minha pergunta enviada');
  await api.submitMessage('Minha pergunta enviada');
  api.go('home');
  assert.equal(document.querySelector('#composer-input').value, '');
});

test('retrying an earlier failure excludes messages that came after that question', async t => {
  const { api } = setup(t);
  const conv = api.newConversation();
  const failed = { id: 'earlier', role: 'assistant', provider: 'oficial', status: 'error', createdAt: Date.now(), lastInput: { text: 'Dúvida sobre uma compra', attachments: [] } };
  conv.messages = [
    { role: 'user', text: 'Dúvida sobre uma compra' }, failed,
    { role: 'user', text: 'Agora quero saber sobre aluguel' },
    { role: 'assistant', status: 'done', provider: 'oficial', createdAt: Date.now(), answer: { mode: 'oficial', kind: 'answer', summary: 'Resposta sobre aluguel', sources: [] } },
  ];
  api.openConversation(conv.id);
  let received;
  api.providers.oficial.respond = async input => {
    received = input.conv.messages;
    return { mode: 'oficial', kind: 'answer', summary: 'Resposta sobre a compra', sources: [] };
  };
  await api.retryMessage(failed, conv);
  assert.equal(received.length, 1);
  assert.equal(received[0].text, 'Dúvida sobre uma compra');
  assert.equal(conv.messages.length, 4);
});

test('in-flight responses and their retries keep the original state and history', async t => {
  const { api } = setup(t);
  api.state.region = 'MG';
  let begin, release, captured;
  const started = new Promise(resolve => { begin = resolve; });
  const gate = new Promise(resolve => { release = resolve; });
  api.providers.oficial.respond = async input => {
    begin(); await gate;
    captured = { country: input.conv.country, region: input.conv.region, history: Array.from(input.conv.messages, message => message.text) };
    throw { code: 'api_error' };
  };
  const pending = api.submitMessage('Minha dúvida inicial'); await started;
  const conv = api.state.conversations[0];
  conv.region = 'SP'; conv.messages.push({ role: 'system', text: 'Jurisdição alterada para São Paulo' });
  release(); await pending;
  assert.deepEqual(captured, { country: 'BR', region: 'MG', history: ['Minha dúvida inicial'] });
  const failed = conv.messages.find(message => message.role === 'assistant');
  api.providers.oficial.respond = async input => {
    assert.equal(input.conv.region, 'MG');
    assert.equal(input.conv.messages.length, 1);
    return { mode: 'oficial', kind: 'answer', summary: 'Resposta', sources: [] };
  };
  await api.retryMessage(failed, conv);
  assert.equal(failed.status, 'done'); assert.equal(conv.region, 'SP');
});

test('attachment-only messages can be sent after confirming the file', t => {
  const { api, document } = setup(t);
  assert.equal(document.querySelector('#btn-send').disabled, true);
  api.onFilesChosen([{ name: 'contrato.pdf', type: 'application/pdf', size: 100 }]);
  document.querySelector('#modal-ok').click();
  assert.equal(api.state.pending.length, 1);
  assert.equal(document.querySelector('#btn-send').disabled, false);
});

test('attachment selection enforces the server file count', t => {
  const { api, document } = setup(t);
  api.onFilesChosen(Array.from({ length: 5 }, (_, index) => ({ name: index + '.pdf', type: 'application/pdf', size: 100 })));
  document.querySelector('#modal-ok').click();
  assert.equal(api.state.pending.length, 4);
});

test('combined attachments fit within the API request budget', t => {
  const { api, document } = setup(t);
  api.onFilesChosen([0, 1].map(index => ({ name: index + '.pdf', type: 'application/pdf', size: 12 * 1024 * 1024 })));
  document.querySelector('#modal-ok').click();
  assert.equal(api.state.pending.length, 1);
});

test('retry retains original file contents in memory after a provider error', async t => {
  const { api } = setup(t);
  const file = { marker: 'original PDF contents' };
  let attempts = 0;
  api.providers.oficial.respond = async input => {
    if (++attempts === 1) throw { code: 'api_error' };
    assert.equal(input.attachments[0].file, file);
    return { mode: 'oficial', kind: 'answer', summary: 'Resposta de teste', sources: [] };
  };
  await api.submitMessage('Explique o documento', [{ name: 'contrato.pdf', type: 'application/pdf', size: 10, file }]);
  const conversation = api.state.conversations[0];
  const message = conversation.messages[1];
  assert.equal(message.status, 'error');
  await api.retryMessage(message, conversation);
  assert.equal(message.status, 'done');
  assert.equal(attempts, 2);
});

test('restoring history converts interrupted responses into a retryable error', t => {
  const { api, storage } = setup(t);
  storage.set('rossai.state.v1', JSON.stringify({ conversations: [{ id: 'old', messages: [{ role: 'assistant', status: 'loading' }] }] }));
  api.load();
  assert.equal(api.state.conversations[0]?.messages[0]?.status, 'error');
});

test('user questions are rendered as text rather than executable markup', async t => {
  const { api, document } = setup(t);
  api.providers.oficial.respond = async () => ({ mode: 'oficial', kind: 'answer', summary: 'Resposta', sources: [] });
  await api.submitMessage('<img src=x onerror=alert(1)>');
  assert.equal(document.querySelector('.bubble img'), null);
  assert.match(document.querySelector('.bubble').textContent, /<img/);
});

test('repository search and reading preserve text and escape returned markup', async t => {
  const result = { id: 'a'.repeat(64), title: 'Lei de teste', scope: 'federal', summary: '<img src=x>', excerpt: 'Identificação', text_version: 'original', repository_ref: 'b'.repeat(40), repository_path: 'federal/lei.md', source_url: 'https://example.gov.br/lei' };
  const calls = [];
  const { api, document, window, change } = setup(t, async (url, options) => {
    const body = JSON.parse(options.body); calls.push(body.op);
    return Response.json(body.op === 'search' ? { results: [result], hasMore: false } : body.op === 'repository_read' ? { markdown: '<script>alert(1)</script>\nArt. 1º Texto.' } : { documents: 235 });
  });
  api.go('search'); await tick();
  change('#corpus-query', 'seguro rural');
  document.querySelector('#corpus-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await tick(); await tick();
  assert.ok(document.querySelector('[data-read-corpus]'));
  assert.equal(document.querySelector('.corpus-result img'), null);
  document.querySelector('[data-read-corpus]').click(); await tick(); await tick();
  assert.equal(document.querySelector('.corpus-fulltext script'), null);
  assert.match(document.querySelector('.corpus-fulltext').textContent, /Art\. 1º/);
  assert.ok(calls.includes('repository_read'));
});

test('news and precedents use their own search operation and keep law filters out of the way', async t => {
  const calls=[];
  const {api,document,window,change}=setup(t,async (_url,options)=>{
    const body=JSON.parse(options.body);calls.push(body);
    return Response.json(body.op==='knowledge_search'?{results:[{id:'stj-1',contentType:'precedent',title:'STJ · Tema 1',summary:'<script>unsafe</script>',source_url:'javascript:alert(1)'}],hasMore:false,fetchedAt:'2026-11-16T12:00:00Z'}:{documents:15252,fullTexts:15252,catalogDocuments:1218984});
  });
  api.go('search');await tick();change('#corpus-kind','precedents');
  assert.equal(document.querySelector('#corpus-law-filters').hidden,true);
  change('#corpus-query','consumidor');document.querySelector('#corpus-form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
  await tick();await tick();
  assert.equal(calls.find(c=>c.op==='knowledge_search').kind,'precedents');
  assert.equal(document.querySelector('.corpus-result script'),null);assert.equal(document.querySelector('.corpus-result a'),null);
  assert.equal(document.querySelector('[data-read-corpus]'),null);
  change('#corpus-kind','news');assert.equal(document.querySelectorAll('.corpus-result').length,0);
  change('#corpus-kind','laws');assert.equal(document.querySelector('#corpus-law-filters').hidden,false);
});

test('source status distinguishes catalog files from stored texts without exposing administration', async t=>{
  const {api,document}=setup(t,async()=>Response.json({documents:30,fullTexts:20,catalogDocuments:1000}));
  api.go('sources');document.querySelector('#refresh-corpus-status').click();await tick();await tick();
  assert.match(document.querySelector('.corpus-coverage').textContent,/20 textos importados/);
  assert.match(document.querySelector('.corpus-coverage').textContent,/1\.000 arquivos/);
  assert.equal(document.querySelector('input[type=password]'),null);
});

test('a law outside the bundled catalog reaches the answer as actual excerpts after search preparation', async t=>{
  const calls=[];
  const {api}=setup(t,async(_url,options)=>{
    const body=JSON.parse(options.body);calls.push(body);
    if(body.op==='prepare')return Response.json({terms:['aposentadoria deficiência'],laws:body.catalog.some(l=>l.id==='passage-1')?['passage-1']:[],references:[{family:'leis-complementares',number:'142',year:2013}]});
    if(body.op==='search')return Response.json({results:[{id:'a'.repeat(64),title:'Lei Complementar 142/2013',article:'Art. 1º',excerpt:'Aposentadoria da pessoa com deficiência.',content_mode:'full',repository_ref:'b'.repeat(40),repository_path:'federal/leis-complementares/2013/lcp-142-2013-05-08.md',source_url:'https://www.planalto.gov.br/lei',text_version:'Edição original'}]});
    return Response.json({answer:{kind:'answer',summary:'A lei trata da aposentadoria da pessoa com deficiência.',sourcesSay:[{title:'LCP 142',text:'Explicação do trecho consultado.',ref:1}],sources:[{ref:1,why:'Base consultada'}]}});
  });
  api.state.catalog.laws=[];api.state.mode='oficial';
  await api.submitMessage('O que a Lei Complementar 142/2013 diz sobre aposentadoria?');
  const search=calls.find(c=>c.op==='search');assert.equal(search.references[0].number,'142');
  assert.equal(calls[0].op,'prepare');
  const answer=calls.find(c=>c.op==='answer');assert.ok(answer.excerpts.some(e=>e.article==='Art. 1º'&&/deficiência/.test(e.excerpt)));
  assert.equal(api.state.conversations[0].messages.at(-1).answer.sources[0].imported,true);
});

function tvConversation(api) {
  const law = JSON.parse(read('data/laws/l8078.json'));
  const article = law.articles.find(item => item.id === '18');
  const conv = api.newConversation();
  conv.messages.push({ role: 'user', text: 'Comprei uma TV e ela veio com defeito. Como funciona o conserto?' });
  conv.messages.push({ id: 'previous', role: 'assistant', status: 'done', provider: 'oficial', createdAt: Date.now(), answer: {
    mode: 'oficial', kind: 'answer', summary: 'O fornecedor deve responder pelo vício do produto, observadas as regras do CDC.',
    sources: [{ lawId: law.id, name: law.name, shortName: law.shortName, article: article.label, heading: article.heading,
      excerpt: article.text, status: 'vigente', url: law.url + '#art18', retrievedAt: law.retrievedAt, version: 'v1', n: 1 }],
    warnings: ['A explicação está limitada aos trechos selecionados.'],
  } });
  api.openConversation(conv.id);
  return conv;
}

test('asking for a simpler explanation reuses the TV topic and its verified excerpts', async t => {
  const calls = [];
  const { api } = setup(t, async (url, options) => {
    const body = JSON.parse(options.body); calls.push(body);
    assert.equal(body.op, 'answer', 'rephrasing must not launch an unrelated legal search');
    assert.match(body.question, /TV/);
    assert.match(body.question, /REFORMULAÇÃO/);
    assert.match(body.question, /ESTILO PARA PÚBLICO GERAL/);
    assert.match(body.question, /Não acrescente prazos, direitos ou conclusões/);
    assert.ok(body.history.some(turn => turn.role === 'user' && /TV/.test(turn.text)));
    assert.equal(body.excerpts[0].article, 'Art. 18');
    return Response.json({ answer: { kind: 'answer', summary: 'Em palavras simples: a loja e o fabricante respondem pelo defeito da TV.',
      sources: [{ ref: 1, why: 'Vício do produto' }], sourcesSay: [], warnings: [] } });
  });
  const conv = tvConversation(api);
  await api.submitMessage('explique de maneira mais facil');
  const answer = conv.messages.at(-1).answer;
  assert.equal(calls.length, 1);
  assert.equal(answer.kind, 'answer');
  assert.match(answer.summary, /TV/);
  assert.equal(answer.sources[0].lawId, 'l8078');
  assert.ok(answer.warnings.includes('A explicação está limitada aos trechos selecionados.'));
});

test('rephrase recognition accepts ordinary wording without swallowing a new topic', t => {
  const { api } = setup(t);
  for (const question of ['explique de maneira mais facil', 'não entendi', 'pode explicar melhor com um exemplo?', 'resuma em poucas palavras', 'explique sem juridiquês', 'could you explain that more simply?']) {
    assert.equal(api.isRephraseRequest(question), true, question);
  }
  for (const question of ['explique o aviso prévio', 'quero saber sobre férias', 'explique de forma simples a LGPD']) {
    assert.equal(api.isRephraseRequest(question), false, question);
  }
});

test('new subjects do not inherit the previous answer sources', t => {
  const { api } = setup(t);
  const conv = tvConversation(api);
  const context = api.conversationContext(conv, 'Agora quero saber sobre férias no trabalho');
  assert.equal(context.rephrase, false);
  assert.equal(context.query, 'Agora quero saber sobre férias no trabalho');
  assert.equal(context.sources.length, 0);
});

test('substantive follow-ups supply both user turns and the previous topic to search', t => {
  const { api } = setup(t);
  const conv = tvConversation(api);
  conv.messages.push({ role: 'user', text: 'e se a loja não resolver?' }, { role: 'assistant', status: 'loading' });
  const context = api.conversationContext(conv, 'e se a loja não resolver?');
  assert.match(context.searchQuestion, /e se a loja não resolver/);
  assert.match(context.searchQuestion, /TV/);
  const history = api.historyForModel(conv, 'e se a loja não resolver?');
  assert.equal(history.length, 2);
  assert.equal(history[0].role, 'user');
  assert.equal(history[1].role, 'assistant');
});

test('a rephrase with no prior conversation asks which answer to explain', async t => {
  let called = false;
  const { api } = setup(t, async () => { called = true; return Response.json({}); });
  await api.submitMessage('explique de outra maneira');
  const answer = api.state.conversations[0].messages.at(-1).answer;
  assert.equal(answer.kind, 'clarify');
  assert.match(answer.summary, /qual é a sua dúvida/);
  assert.equal(called, false);
});

test('a jurisdiction change disables reuse of earlier source snapshots', t => {
  const { api } = setup(t);
  const conv = tvConversation(api);
  conv.messages.push({ role: 'system', text: 'Jurisdição alterada' });
  assert.equal(api.conversationContext(conv, 'explique de maneira mais fácil').sources.length, 0);
});

test('rephrasing a previous source-search failure searches the original TV issue again', t => {
  const { api } = setup(t);
  const conv = tvConversation(api);
  conv.messages[1].answer.kind = 'nosources';
  conv.messages[1].answer.sources = [];
  const context = api.conversationContext(conv, 'explique de maneira mais fácil');
  assert.match(context.query, /TV/);
  assert.match(context.answerQuestion, /Dúvida original/);
  assert.equal(context.sources.length, 0);
});

const officialSources = [{ n: 1, lawId: 'l8078', name: 'Lei nº 8.078/1990', shortName: 'CDC', article: 'Art. 49', heading: '', status: 'vigente', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm#art49', retrievedAt: '2026-11-13', version: 'v1', excerpt: 'Art. 49. O consumidor pode desistir do contrato...' }];

test('claims citing excerpts that were never consulted are dropped and no source is added to dress them up', t => {
  const { api } = setup(t);
  const answer = api.normalizeOfficial({ kind: 'answer', summary: 'Resumo.', sourcesSay: [{ title: 'Afirmação', text: 'Diz algo', ref: 999999 }, { title: 'Sem referência', text: 'Outra coisa', ref: null }], sources: [{ ref: 999999, why: 'x' }], depends: [], nextSteps: [], questions: [], mentions: [], document: null, limitNotice: null, warnings: [] }, officialSources, []);
  assert.equal(answer.sourcesSay.length, 0);
  assert.equal(answer.sources.length, 0);
  assert.ok(answer.warnings.some(w => /2 afirmaç/.test(w)));
  assert.ok(answer.warnings.some(w => /não indicou em quais trechos/.test(w)));
  const valid = api.normalizeOfficial({ kind: 'answer', summary: 'Resumo.', sourcesSay: [{ title: 'Afirmação', text: 'Diz algo', ref: 1 }], sources: [{ ref: 1, why: 'x' }], warnings: [] }, officialSources, []);
  assert.equal(valid.sources.length, 1); assert.equal(valid.sourcesSay[0].ref, 1); assert.equal(valid.warnings.length, 0);
});

test('a nosources answer keeps the specific explanation and questions the model returned', t => {
  const { api } = setup(t);
  const answer = api.normalizeOfficial({ kind: 'nosources', summary: 'Os trechos tratam de compras, não de aluguel.', questions: ['O contrato é residencial ou comercial?'], sourcesSay: [], sources: [], warnings: [] }, officialSources, []);
  assert.equal(answer.kind, 'nosources');
  assert.equal(answer.summary, 'Os trechos tratam de compras, não de aluguel.');
  assert.deepEqual(answer.questions, ['O contrato é residencial ou comercial?']);
  assert.equal(answer.sources.length, 0);
});

test('official mode never falls back to the demonstration when the law base is unavailable', async t => {
  const { api, document } = setup(t, async url => String(url).includes('catalog.json') ? new Response('', { status: 404 }) : Response.json({ results: [] }));
  api.state.catalog = null; api.state.mode = 'oficial';
  assert.equal(api.activeProvider().id, 'oficial');
  api.submitMessage('Posso cancelar uma compra pela internet?');
  for (let i = 0; i < 40 && !document.querySelector('.error-card'); i++) await tick();
  const error = document.querySelector('.error-card');
  assert.ok(error, 'error card expected');
  assert.match(error.textContent, /base de leis/);
  assert.ok(error.querySelector('[data-retry]'));
  assert.ok(!document.querySelector('.badge-demo'));
});

test('document excerpts from a previous answer travel with the history sent to the model', t => {
  const { api } = setup(t);
  const conv = { messages: [
    { role: 'user', text: 'O que diz este contrato?', attachments: [{ name: 'contrato.pdf' }], status: 'done' },
    { role: 'assistant', status: 'done', answer: { summary: 'A cláusula 9 fixa multa.', document: { name: 'contrato.pdf', notes: ['Contrato de 6 páginas.'], excerpts: [{ ref: 'Cláusula 9ª', quote: 'multa de três mensalidades', inDocument: 'multa fixa', inLaw: '' }], warnings: [] } } },
  ] };
  const history = api.historyForModel(conv, 'E a renovação automática?');
  assert.match(history[0].text, /contrato\.pdf/);
  assert.match(history[1].text, /Cláusula 9ª: "multa de três mensalidades"/);
  assert.match(history[1].text, /Documento analisado/);
  assert.match(history[1].text, /anexe o arquivo novamente/);
});

test('one law that fails to load does not sink the retrieval; the answer flags the partial coverage', async t => {
  const ops = []; const files = [];
  const { api } = setup(t, async (url, options) => {
    const address = String(url);
    if (address.includes('data/laws/')) {
      files.push(address);
      if (files.length > 1) return new Response('', { status: 502 });
      return Response.json({ id: 'l8078', name: 'Lei nº 8.078, de 11 de setembro de 1990 (Código de Defesa do Consumidor)', shortName: 'Código de Defesa do Consumidor', number: 'Lei nº 8.078/1990', type: 'lei', jurisdiction: 'Brasil · Federal', url: 'https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm', retrievedAt: '2026-11-13T00:00:00.000Z', version: 'v1', source: 'Planalto — Portal da Legislação', articles: [{ id: '49', label: 'Art. 49', heading: 'CAPÍTULO VI · Da Proteção Contratual', status: 'vigente', hasHistory: false, text: 'Art. 49. O consumidor pode desistir do contrato, no prazo de 7 dias a contar de sua assinatura ou do ato de recebimento do produto, sempre que a contratação ocorrer fora do estabelecimento comercial, especialmente por telefone ou a domicílio.' }] });
    }
    const body = JSON.parse(options.body); ops.push(body.op);
    if (body.op === 'search') return Response.json({ results: [] });
    if (body.op === 'prepare') return Response.json(body.catalog.some(law => /^passage-/.test(law.id)) ? { terms: [], laws: ['passage-1'] } : { terms: ['desistir', 'arrependimento'], laws: ['l8078', 'l10406', 'cf88'] });
    return Response.json({ answer: { kind: 'answer', summary: 'Você pode desistir em 7 dias.', sourcesSay: [{ title: 'CDC', text: 'Prazo de 7 dias.', ref: 1 }], sources: [{ ref: 1, why: 'Direito de arrependimento' }], warnings: [] } });
  });
  api.state.mode = 'oficial';
  await api.submitMessage('Comprei pela internet e quero desistir. Posso?');
  const message = api.state.conversations[0].messages.at(-1);
  assert.equal(message.status, 'done', message.error);
  assert.ok(files.length >= 2, 'more than one law should have been requested');
  assert.ok(ops.includes('answer'), 'the answer step must still run with the laws that loaded');
  assert.equal(message.answer.sources[0].lawId, 'l8078');
  assert.ok(message.answer.warnings.some(w => /Não consegui carregar o texto de: /.test(w) && /Código Civil|Constituição/.test(w)), JSON.stringify(message.answer.warnings));
});

test('when every selected law fails to load the answer is a recoverable error, not a silent empty result', async t => {
  const { api, document } = setup(t, async (url, options) => {
    if (String(url).includes('data/laws/')) return new Response('', { status: 502 });
    const body = JSON.parse(options.body);
    if (body.op === 'search') return Response.json({ results: [] });
    return Response.json({ terms: ['desistir'], laws: ['l8078'] });
  });
  api.state.mode = 'oficial';
  await api.submitMessage('Comprei pela internet e quero desistir. Posso?');
  const message = api.state.conversations[0].messages.at(-1);
  assert.equal(message.status, 'error');
  assert.match(message.error, /texto da norma/);
  assert.ok(document.querySelector('.error-card [data-retry]'));
});

test('the copied text carries the imported-corpus provenance shown on screen', t => {
  const { api } = setup(t);
  const imported = { n: 1, lawId: 'corpus-abc', imported: true, name: 'Lei Estadual nº 1/2020', shortName: 'Lei 1/2020', article: 'Art. 3º', status: 'nao_confirmada', url: 'https://www.al.sp.gov.br/norma/1', retrievedAt: '2026-11-01', version: 'abcdef123456', corpusVersion: 'edição 2024-05-01', repositoryPath: 'estadual/SP/lei-1-2020.md', repositoryRef: 'a'.repeat(40), excerpt: 'Art. 3º Texto.' };
  const answer = { mode: 'oficial', kind: 'answer', corpus: true, summary: 'Resumo.', sourcesSay: [{ title: 'Lei 1/2020 · Art. 3º', text: 'Diz algo', ref: 1 }], sources: [imported], warnings: [], capturedAt: '2026-11-13' };
  const text = api.answerToText(answer, { id: 'm1' });
  assert.match(text, /trechos importados do ctresb\/leis/);
  assert.doesNotMatch(text, /Planalto ou Câmara/);
  assert.match(text, /Acervo importado · ctresb\/leis/);
  assert.match(text, /edição 2024-05-01/);
  assert.match(text, /Vigência não verificada/);
  assert.match(text, /https:\/\/github\.com\/ctresb\/leis\/blob\/a{40}\/estadual\/SP\/lei-1-2020\.md/);
  assert.doesNotMatch(text, /undefined/);
});

test('a storage failure is reported, keeps the conversation on screen and offers an export', async t => {
  const { api, document, storage } = setup(t);
  api.state.conversations.length = 0;
  storage.fail = Object.assign(new Error('The quota has been exceeded.'), { name: 'QuotaExceededError' });
  api.providers.oficial.respond = async () => ({ mode: 'oficial', kind: 'answer', summary: 'Resposta guardada só em memória.', sources: [] });
  await api.submitMessage('Minha pergunta');
  await new Promise(resolve => setTimeout(resolve, 200));
  assert.ok(api.state.storageError && api.state.storageError.quota, 'quota failure expected to be recorded');
  assert.equal(api.state.conversations.length, 1, 'the conversation stays in memory');
  assert.match(document.querySelector('#messages').textContent, /Resposta guardada só em memória/);
  const notice = document.querySelector('#storage-notice');
  assert.ok(notice, 'storage notice expected');
  assert.match(notice.textContent, /armazenamento local deste navegador está cheio/);
  assert.ok(notice.querySelector('[data-export-history]'));
  assert.ok(document.querySelector('#toast-root').textContent.includes('Armazenamento cheio'));
  storage.fail = null;
  document.querySelector('[data-retry-save]').click();
  await new Promise(resolve => setTimeout(resolve, 200));
  assert.equal(api.state.storageError, null);
  assert.ok(!document.querySelector('#storage-notice'), 'notice disappears once saving works again');
  assert.ok(storage.get('rossai.state.v1'), 'state persisted after retry');
});

test('exporting the history produces a readable text of every conversation', async t => {
  const { api, document, clipboard } = setup(t);
  api.state.conversations.length = 0;
  api.providers.oficial.respond = async () => ({ mode: 'oficial', kind: 'answer', summary: 'Resposta exportável.', sources: [] });
  await api.submitMessage('Pergunta para exportar');
  api.exportHistory();
  await tick();
  assert.equal(clipboard.length, 1, 'without file downloads the export falls back to the clipboard');
  assert.match(clipboard[0], /Histórico de conversas/);
  assert.match(clipboard[0], /Você: Pergunta para exportar/);
  assert.match(clipboard[0], /Resposta exportável/);
  assert.doesNotMatch(clipboard[0], /undefined/);
  assert.match(document.querySelector('#toast-root').textContent, /copiado/);
});

test('a running answer can be stopped from the interface and the stop is explained honestly', async t => {
  const { api, document } = setup(t);
  api.state.mode = 'demo';
  const pending = api.submitMessage('Posso cancelar uma compra pela internet?');
  await tick();
  assert.ok(api.state.busy, 'answer should be in flight');
  const stop = document.querySelector('#btn-stop'); const send = document.querySelector('#btn-send');
  assert.ok(stop && !stop.hasAttribute('hidden'), 'Stop button visible while busy');
  assert.ok(send.hasAttribute('hidden'), 'Send button hidden while busy');
  assert.ok(document.querySelector('.msg [data-stop]'), 'the loading card offers Stop too');
  stop.click();
  await pending;
  const message = api.state.conversations[0].messages.at(-1);
  assert.equal(message.status, 'error');
  assert.match(message.error, /interrompida a seu pedido/);
  assert.match(message.error, /pode ter sido processado/);
  assert.ok(document.querySelector('.error-card [data-retry]'));
  assert.ok(document.querySelector('#btn-stop').hasAttribute('hidden'));
  assert.ok(!document.querySelector('#btn-send').hasAttribute('hidden'));
  assert.equal(api.state.busy, null);
});

test('a client-side deadline ends an endless wait with a distinct, retryable message', async t => {
  const { api, document, window } = setup(t, (url, options) => new Promise((resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
  }));
  window.__clientTimeout = 60;
  api.state.mode = 'oficial';
  await api.submitMessage('Posso cancelar uma compra pela internet?');
  const message = api.state.conversations[0].messages.at(-1);
  assert.equal(message.status, 'error');
  assert.match(message.error, /demorou mais do que o esperado/);
  assert.ok(document.querySelector('.error-card [data-retry]'));
  assert.equal(api.state.busy, null);
});

test('generic clarification questions appear only when the model gave no explanation of its own', t => {
  const { api } = setup(t);
  const specific = api.normalizeOfficial({ kind: 'nosources', summary: 'Os trechos tratam de responsabilidade por danos, não dos prazos para reclamar de um defeito.', questions: [], sourcesSay: [], sources: [], warnings: [] }, officialSources, []);
  assert.deepEqual(specific.questions, []);
  assert.equal(specific.nextSteps.length, 1);
  const empty = api.normalizeOfficial({ kind: 'nosources', summary: '', questions: [], sourcesSay: [], sources: [], warnings: [] }, officialSources, []);
  assert.match(empty.summary, /Não consegui confirmar trechos suficientes/);
  assert.equal(empty.questions.length, 2);
});

function lawServingFetcher(onOp) {
  return async (url, options) => {
    const address = String(url);
    const match = address.match(/data\/(laws\/[a-z0-9_-]+\.json)/i);
    if (match) return Response.json(JSON.parse(read('data/' + match[1])));
    return onOp(JSON.parse(options.body));
  };
}

test('when the relevance check fails the answer still uses the governing excerpts and says how they were chosen', async t => {
  const ops = []; let answerExcerpts = [];
  const { api } = setup(t, lawServingFetcher(body => {
    ops.push(body.op);
    if (body.op === 'search') return Response.json({ results: [] });
    if (body.op === 'prepare') {
      if (body.catalog.some(law => /^passage-/.test(law.id))) return Response.json({ error: 'upstream', status: 503 }, { status: 502 });
      return Response.json({ terms: ['vício do produto', 'garantia legal'], laws: ['l8078'] });
    }
    answerExcerpts = body.excerpts.map(excerpt => excerpt.article);
    return Response.json({ answer: { kind: 'answer', summary: 'Você tem 30 dias para o conserto.', sourcesSay: [{ title: 'CDC', text: 'Prazo de 30 dias.', ref: 1 }], sources: [{ ref: 1, why: 'vício' }], warnings: [] } });
  }));
  api.state.mode = 'oficial';
  await api.submitMessage('comprei um celular faz 2 semanas e ele deu problema na bateria');
  const message = api.state.conversations[0].messages.at(-1);
  assert.equal(message.status, 'done', message.error);
  assert.equal(message.answer.kind, 'answer');
  assert.ok(ops.includes('answer'), 'the answer step must still run');
  assert.ok(answerExcerpts.includes('Art. 18') && answerExcerpts.includes('Art. 26'), answerExcerpts.join(', '));
  assert.ok(answerExcerpts.length <= 5);
  assert.ok(message.answer.warnings.some(w => /verificação automática de relevância não estava disponível/.test(w)));
});

test('when the model is down the excerpts are still shown with an honest notice instead of only an error', async t => {
  const { api, document } = setup(t, lawServingFetcher(body => {
    if (body.op === 'search') return Response.json({ results: [] });
    if (body.op === 'prepare' && !body.catalog.some(law => /^passage-/.test(law.id))) return Response.json({ terms: ['vício do produto'], laws: ['l8078'] });
    return Response.json({ error: 'upstream_timeout' }, { status: 504 });
  }));
  api.state.mode = 'oficial';
  await api.submitMessage('comprei um celular faz 2 semanas e ele deu problema na bateria');
  const message = api.state.conversations[0].messages.at(-1);
  assert.equal(message.status, 'done', message.error);
  assert.match(message.answer.summary, /não está disponível neste momento/);
  assert.ok(message.answer.sources.some(source => source.article === 'Art. 18'));
  assert.match(document.querySelector('#messages').textContent, /Art\. 18/);
});

test('an answer produced by the fallback model carries a visible warning', t => {
  const { api } = setup(t);
  const answer = api.normalizeOfficial({ kind: 'answer', summary: 'Resumo.', sourcesSay: [{ title: 'Afirmação', text: 'Diz algo', ref: 1 }], sources: [{ ref: 1, why: 'x' }], warnings: [], fallbackModel: true }, officialSources, []);
  assert.ok(answer.warnings.some(w => /modelo alternativo/.test(w)));
});

test('the settings screen shows the version so an update can be confirmed', t => {
  const { api, document } = setup(t);
  api.go('settings');
  assert.match(document.querySelector('#about-version').textContent, /Versão de desenvolvimento/);
  api.state.lang = 'en'; api.go('settings');
  assert.match(document.querySelector('#about-version').textContent, /Development version/);
});

const INDEX_REF = 'c9f21b4ab11aa0d7ca6fe861d75028e94219c2d6';
const indexRequests = [];
const indexManifest = { repository: 'ctresb/leis', ref: INDEX_REF, generatedAt: '2026-11-25T12:28:48.000Z', total: 1218984, units: {
  'raiz': { scope: 'federal', family: 'constituicao', count: 1, parts: ['raiz.1.json'] },
  'federal/leis-ordinarias': { scope: 'federal', family: 'leis-ordinarias', count: 2, parts: ['federal__leis-ordinarias.1.json'] },
  'estaduais/SP': { scope: 'estadual', uf: 'SP', count: 1, parts: ['estaduais__SP.1.json'] },
  'reguladores/anvisa': { scope: 'regulador', family: 'anvisa', count: 1, parts: ['reguladores__anvisa.1.json'] },
} };
const indexShards = {
  'raiz.1.json': { entries: [{ p: 'constituicao.md', h: 'f'.repeat(16), t: 'Constituição Federal de 1988' }] },
  'federal__leis-ordinarias.1.json': { entries: [
    { p: '2020/lei-99999-2020-02-02.md', h: 'a'.repeat(16), t: 'Lei nº 99.999 de 02/02/2020', e: 'Dispõe sobre a garantia de baterias de celulares e dá outras providências.', k: 'Lei Ordinária', n: '99999', d: '2020-02-02' },
    { p: '1990/lei-8078-1990-09-11.md', h: 'b'.repeat(16), t: 'Lei nº 8.078 de 11/09/1990', e: 'Dispõe sobre a proteção do consumidor e dá outras providências.', k: 'Lei Ordinária', n: '8078', d: '1990-09-11' },
  ] },
  'estaduais__SP.1.json': { entries: [{ p: 'leis-ordinarias/2015/lei-5-2015-01-01.md', h: 'c'.repeat(16), t: 'Lei nº 5 de 01/01/2015', e: 'Dispõe sobre a troca de baterias de celulares no Estado de São Paulo.', k: 'Lei Ordinária', n: '5', d: '2015-01-01' }] },
  'reguladores__anvisa.1.json': { entries: [{ p: 'resolucoes/2020/rdc-1-2020.md', h: 'd'.repeat(16), t: 'RDC nº 1 de 2020', e: 'Dispõe sobre baterias em equipamentos médicos.', k: 'Resolução', n: '1', d: '2020-01-01' }] },
};
function indexFetcher(onApi) {
  return async (url, options) => {
    const address = String(url);
    if (address.startsWith('https://matheusbauto-blip.github.io/ross-ai/index/')) {
      const file = address.slice('https://matheusbauto-blip.github.io/ross-ai/index/'.length).replace(/\?v=.*$/, '');
      indexRequests.push({ address, cache: options && options.cache });
      if (file === 'manifest.json') return Response.json(indexManifest);
      return indexShards[file] ? Response.json(indexShards[file]) : new Response('', { status: 404 });
    }
    const match = address.match(/data\/(laws\/[a-z0-9_-]+\.json)/i);
    if (match) return Response.json(JSON.parse(read('data/' + match[1])));
    return onApi(JSON.parse(options.body));
  };
}

test('the search page combines the imported corpus with the full repository index and reads an entry by path and hash', async t => {
  const reads = [];
  const { api, document, window, change } = setup(t, indexFetcher(body => {
    if (body.op === 'corpus_stats') return Response.json({ documents: 15487, fullTexts: 15252, catalogDocuments: 1218984 });
    if (body.op === 'search') return Response.json({ results: [], hasMore: false });
    if (body.op === 'repository_read') { reads.push(body); return Response.json({ document: { title: 'Lei nº 99.999 de 02/02/2020', source_url: 'https://www.planalto.gov.br/teste' }, markdown: '# Lei\n\n**Art. 1º** As baterias de celulares têm garantia mínima de um ano.', localCopy: false }); }
    return Response.json({});
  }));
  api.go('search');
  for (let i = 0; i < 20 && !/Índice completo/.test(document.querySelector('#index-status').textContent); i++) await tick();
  assert.match(document.querySelector('#index-status').textContent, /1\.218\.984 textos/);
  change('#corpus-query', 'garantia bateria celular');
  document.querySelector('#corpus-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  for (let i = 0; i < 40 && !document.querySelector('.badge-index'); i++) await tick();
  const results = Array.from(document.querySelectorAll('.corpus-result'));
  assert.ok(results.length >= 1, 'index results expected');
  assert.match(results[0].textContent, /Lei nº 99\.999/);
  assert.match(results[0].textContent, /Índice do repositório/);
  assert.ok(!results.some(r => /São Paulo/.test(r.textContent)), 'state shards are not loaded without a state');
  assert.match(results[0].querySelector('a[href*="github.com/ctresb/leis/blob/"]').getAttribute('href'), new RegExp(INDEX_REF + '/federal/leis-ordinarias/2020/lei-99999-2020-02-02\\.md$'));
  results[0].querySelector('[data-read-corpus]').click();
  for (let i = 0; i < 40 && !reads.length; i++) await tick();
  await tick();
  assert.deepEqual(reads[0], { op: 'repository_read', path: 'federal/leis-ordinarias/2020/lei-99999-2020-02-02.md', ref: INDEX_REF, hash: 'a'.repeat(16) });
  const manifestRequest = indexRequests.find(r => /manifest\.json$/.test(r.address));
  assert.equal(manifestRequest.cache, 'no-cache', 'the manifest is always revalidated');
  const shardRequest = indexRequests.find(r => /federal__leis-ordinarias\.1\.json/.test(r.address));
  assert.match(shardRequest.address, /\?v=2026-11-25T12%3A28%3A48\.000Z$/, 'shards carry the index version');
  assert.equal(shardRequest.cache, 'force-cache');
  assert.match(results[0].querySelector('.corpus-fulltext').textContent, /garantia mínima de um ano/);
  // Choosing a state adds its shard; the regulatory scope needs an agency.
  change('#corpus-uf', 'SP');
  document.querySelector('#corpus-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  for (let i = 0; i < 40 && !/São Paulo/.test(document.querySelector('#corpus-results').textContent); i++) await tick();
  assert.match(document.querySelector('#corpus-results').textContent, /Estado de São Paulo/);
  change('#corpus-scope', 'regulador');
  for (let i = 0; i < 10 && !document.querySelector('#corpus-organ option[value="anvisa"]'); i++) await tick();
  assert.ok(document.querySelector('#corpus-organ option[value="anvisa"]'), 'agency list comes from the manifest');
  document.querySelector('#corpus-form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  for (let i = 0; i < 40 && !/escolha o órgão/.test(document.querySelector('#corpus-results').textContent); i++) await tick();
  assert.match(document.querySelector('#corpus-results').textContent, /escolha o órgão/);
});

test('an answer can cite a law found only in the repository index, read on demand with its hash', async t => {
  const reads = []; let answerExcerpts = [];
  const { api } = setup(t, indexFetcher(body => {
    if (body.op === 'search') return Response.json({ results: [] });
    if (body.op === 'prepare') {
      const indexed = body.catalog.find(law => /^passage-/.test(law.id) && /99\.999/.test(law.name));
      return Response.json(body.catalog.some(law => /^passage-/.test(law.id)) ? { terms: [], laws: indexed ? [indexed.id] : [] } : { terms: ['garantia', 'bateria'], laws: [] });
    }
    if (body.op === 'repository_read') { reads.push(body); return Response.json({ document: { title: 'Lei nº 99.999 de 02/02/2020', source_url: 'https://www.planalto.gov.br/teste', text_version: 'compilada (texto vigente)', captured_at: '2026-10-13' }, passages: [{ article: 'Art. 1º', excerpt: 'Art. 1º As baterias de celulares têm garantia mínima de um ano, contada da entrega do aparelho.' }], localCopy: false }); }
    answerExcerpts = body.excerpts.map(excerpt => excerpt.name + ' · ' + excerpt.article);
    return Response.json({ answer: { kind: 'answer', summary: 'A garantia mínima é de um ano.', sourcesSay: [{ title: 'Lei 99.999', text: 'Garantia de um ano.', ref: body.excerpts.findIndex(excerpt => /99\.999/.test(excerpt.name)) + 1 }], sources: [{ ref: body.excerpts.findIndex(excerpt => /99\.999/.test(excerpt.name)) + 1, why: 'garantia' }], warnings: [] } });
  }));
  api.state.mode = 'oficial';
  await api.submitMessage('qual a garantia mínima da bateria de um celular novo?');
  const message = api.state.conversations[0].messages.at(-1);
  assert.equal(message.status, 'done', message.error);
  assert.equal(reads.length, 1, 'only the strongly matching index entry is read');
  assert.equal(reads[0].path, 'federal/leis-ordinarias/2020/lei-99999-2020-02-02.md'); assert.equal(reads[0].hash, 'a'.repeat(16)); assert.match(reads[0].query, /bateria/);
  assert.ok(answerExcerpts.some(name => /99\.999 .* Art\. 1º/.test(name)), answerExcerpts.join(' | '));
  const source = message.answer.sources.find(s => s.fromIndex);
  assert.ok(source, 'the index source is cited'); assert.equal(source.repositoryPath, 'federal/leis-ordinarias/2020/lei-99999-2020-02-02.md');
  assert.equal(source.url, 'https://www.planalto.gov.br/teste');
  assert.ok(message.answer.corpus, 'imported provenance is shown');
});

test('a slow repository index does not hold the answer back', async t => {
  let answered = false;
  const { api, window } = setup(t, async (url, options) => {
    const address = String(url);
    if (address.startsWith('https://matheusbauto-blip.github.io/ross-ai/index/')) return new Promise(() => {});
    const match = address.match(/data\/(laws\/[a-z0-9_-]+\.json)/i);
    if (match) return Response.json(JSON.parse(read('data/' + match[1])));
    const body = JSON.parse(options.body);
    if (body.op === 'search') return Response.json({ results: [] });
    if (body.op === 'prepare') return Response.json(body.catalog.some(law => /^passage-/.test(law.id)) ? { terms: [], laws: ['passage-1'] } : { terms: ['desistir'], laws: ['l8078'] });
    answered = true;
    return Response.json({ answer: { kind: 'answer', summary: 'Você pode desistir em 7 dias.', sourcesSay: [{ title: 'CDC', text: 'Prazo de 7 dias.', ref: 1 }], sources: [{ ref: 1, why: 'arrependimento' }], warnings: [] } });
  });
  window.__indexTimeout = 50;
  api.state.mode = 'oficial';
  await api.submitMessage('Comprei pela internet e quero desistir. Posso?');
  const message = api.state.conversations[0].messages.at(-1);
  assert.equal(message.status, 'done', message.error);
  assert.ok(answered, 'the answer step ran without the index');
});

test('a recycled server (or a connection dropped by it) is retried once on a fresh server', async t => {
  const calls = [];
  const { api, window } = setup(t, async (url, options) => {
    const address = String(url);
    const match = address.match(/data\/(laws\/[a-z0-9_-]+\.json)/i);
    if (match) return Response.json(JSON.parse(read('data/' + match[1])));
    if (address.startsWith('https://matheusbauto-blip.github.io/ross-ai/index/')) return new Response('', { status: 404 });
    const body = JSON.parse(options.body); calls.push(body.op);
    if (body.op === 'search') return Response.json({ results: [] });
    if (body.op === 'prepare') {
      if (calls.filter(op => op === 'prepare').length === 1) return Response.json({ error: 'worker_recycling', retryAfterMs: 10 }, { status: 503 });
      return Response.json(body.catalog.some(law => /^passage-/.test(law.id)) ? { terms: [], laws: ['passage-1'] } : { terms: ['desistir'], laws: ['l8078'] });
    }
    if (calls.filter(op => op === 'answer').length === 1) throw new TypeError('Failed to fetch');
    return Response.json({ answer: { kind: 'answer', summary: 'Você pode desistir em 7 dias.', sourcesSay: [{ title: 'CDC', text: 'Prazo de 7 dias.', ref: 1 }], sources: [{ ref: 1, why: 'arrependimento' }], warnings: [] } });
  });
  api.state.mode = 'oficial';
  await api.submitMessage('Comprei pela internet e quero desistir. Posso?');
  const message = api.state.conversations[0].messages.at(-1);
  assert.equal(message.status, 'done', message.error);
  assert.match(message.answer.summary, /7 dias/);
  assert.equal(calls.filter(op => op === 'answer').length, 2, 'the dropped answer was retried once');
  assert.ok(calls.filter(op => op === 'prepare').length >= 2, 'the recycled prepare was retried');
  void window;
});
