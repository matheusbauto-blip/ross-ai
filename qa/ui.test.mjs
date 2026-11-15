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
  const storage = new Map();
  const timers = new Set();
  window.scrollTo = () => {};
  window.innerHeight = 800;
  window.HTMLElement.prototype.focus = function () {};
  window.HTMLElement.prototype.scrollIntoView = function () {};
  const context = vm.createContext({
    window, document, navigator: { language: 'pt-BR', clipboard: { writeText: async () => {} } },
    location: { hash: '' }, history: { replaceState() {} },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    console, setTimeout: (fn, delay) => { const timer = setTimeout(fn, delay); timers.add(timer); return timer; }, clearTimeout,
    AbortController, URL, requestAnimationFrame: fn => fn(), fetch: fetcher,
  });
  for (const file of ['config.js', 'i18n.js', 'demo-data.js', 'process-tracker.js']) vm.runInContext(read(file), context);
  const script = read('app.js').replace("if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();",
    'window.__test = {state, providers, render, go, load, onFilesChosen, newConversation, submitMessage, retryMessage, openConversation, deleteConversation, answerToText, isRephraseRequest, conversationContext, historyForModel};');
  vm.runInContext(script, context);
  const api = window.__test;
  api.state.catalog = structuredClone(catalog);
  api.state.aiAvailable = true;
  api.go('home');
  t.after(() => { for (const timer of timers) clearTimeout(timer); });
  const change = (selector, value) => {
    const node = document.querySelector(selector);
    if (node.localName === 'select') for (const option of node.querySelectorAll('option')) option.selected = option.value === value;
    else node.value = value;
    node.dispatchEvent(new window.Event(node.localName === 'select' ? 'change' : 'input', { bubbles: true }));
  };
  return { api, document, window, storage, change };
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
