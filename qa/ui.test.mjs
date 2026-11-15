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
  for (const file of ['config.js', 'i18n.js', 'demo-data.js']) vm.runInContext(read(file), context);
  const script = read('app.js').replace("if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();",
    'window.__test = {state, providers, render, go, load, onFilesChosen, newConversation, submitMessage, retryMessage, openConversation, deleteConversation, answerToText};');
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
    for (const view of ['home', 'search', 'settings', 'sources', 'privacy', 'terms', 'help']) {
      api.go(view);
      assert.ok(document.querySelector('#main').textContent.trim().length > 100, language + ':' + view);
      assert.doesNotMatch(document.querySelector('#main').textContent, /\bundefined\b/);
    }
  }
  await tick();
});

test('changing jurisdiction repeatedly does not multiply Enter submission handlers', t => {
  const { document, window, change } = setup(t);
  change('#home-country', 'US'); change('#home-country', 'BR'); change('#home-country', 'US');
  let submitted = 0;
  document.querySelector('#composer').requestSubmit = () => { submitted++; };
  change('#composer-input', 'Uma pergunta');
  const event = new window.Event('keydown', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'key', { value: 'Enter' });
  document.querySelector('#composer-input').dispatchEvent(event);
  assert.equal(submitted, 1);
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
