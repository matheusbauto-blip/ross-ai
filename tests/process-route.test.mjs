import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { processNumber, ProcessError } from '../supabase/functions/ross-ai/process-provider.mjs';
import { libraryReferences } from '../supabase/functions/ross-ai/repository-library.mjs';

const source = readFileSync(new URL('../supabase/functions/ross-ai/index.ts', import.meta.url), 'utf8').replace(/^import .*;\s*$/gm, '');
class MockGeminiError extends Error { constructor(status) { super('google_upstream'); this.status = status; } }
function server({ token = 'test-provider-value', quotaError = false, processSource = 'escavador', maxBody = '', models = null, writes = false, hedge = false, workerLimit = '', realTimers = false } = {}) {
  let handler, lookups = 0, djenLookups = 0, modelCalls = 0, quotaCalls = 0;
  const modelsCalled = [], aborted = [];
  const schema = new Proxy(function () {}, { get: () => schema, apply: () => schema });
  const env = { SUPABASE_URL: 'https://test.invalid', SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role', ESCAVADOR_API_TOKEN: token, ROSS_PROCESS_SOURCE: processSource, ROSS_MAX_BODY_BYTES: maxBody, GEMINI_API_KEY: models ? 'test-google-key' : '', ROSS_LIBRARY_WRITES_ENABLED: writes ? 'true' : '', ROSS_HEDGE: hedge ? '' : 'off', ROSS_WORKER_LIMIT_MS: workerLimit };
  const context = {
    Deno: { env: { get: key => env[key] }, serve: fn => { handler = fn; } }, z: schema, setTimeout: realTimers ? setTimeout : (fn) => setTimeout(fn, 0), clearTimeout, AbortController,
    createClient: () => ({ rpc: async () => { quotaCalls++; return quotaError ? { error: { message: 'simulated quota outage' } } : { data: { allowed: true } }; } }),
    generateGemini: async ({ model, timeoutMs, signal }) => {
      modelCalls++;
      if (!models) throw new Error('process requests must not call the model');
      modelsCalled.push(model);
      assert.ok(timeoutMs > 0 && timeoutMs <= 90_000, 'per-call timeout must be bounded');
      const behaviour = models[model];
      // { delay, data }: answers after `delay` ms unless the call is cancelled first.
      if (behaviour && typeof behaviour === 'object' && !Array.isArray(behaviour) && 'delay' in behaviour) {
        return new Promise((resolve, reject) => {
          let settled = false;
          const timer = setTimeout(() => { settled = true; resolve({ data: behaviour.data, model }); }, behaviour.delay);
          signal && signal.addEventListener('abort', () => { if (settled) return; clearTimeout(timer); aborted.push(model); reject(new MockGeminiError(504)); }, { once: true });
        });
      }
      if (typeof behaviour === 'number') throw new MockGeminiError(behaviour);
      if (Array.isArray(behaviour)) { const next = behaviour.shift(); if (typeof next === 'number') throw new MockGeminiError(next); return { data: next, model }; }
      return { data: behaviour, model };
    },
    lookupProcess: async input => { lookups++; assert.equal(input.number, '00008323520184013202'); assert.equal(input.apiKey, token); return { process: { number: input.number }, movements: [] }; },
    lookupDjen: async input => { djenLookups++; assert.equal(input.number, '00008323520184013202'); return { coverage: 'publications', process: { number: input.number }, movements: [] }; },
    processNumber, ProcessError, GeminiError: MockGeminiError, libraryReferences, eligibleForAnswer() {}, repositoryExcerpts: (markdown, query) => query ? [{ article: 'Art. 1º', excerpt: 'Trecho sobre ' + query }] : [],
    readIndexedDocument: async (sb, { path, ref, hash }) => {
      if (!/^federal\//.test(path) || ref !== 'c'.repeat(40)) throw new Error('invalid_locator');
      if (hash === 'bad') throw new Error('document_integrity');
      return { doc: { title: 'Lei de teste', repository_path: path, passages: [{ ordinal: 0 }] }, markdown: '## Art. 1º\nTexto.', localCopy: false };
    },
    crypto, TextEncoder, TextDecoder, Response, Request, URL, AbortSignal, console: { error() {}, warn() {} },
  };
  vm.runInNewContext(stripTypeScriptTypes(source), context);
  return { rawRequest: request => handler(request), raw: body => handler(new Request('https://test.invalid', { method: 'POST', headers: { Origin: 'https://matheusbauto-blip.github.io', 'Content-Type': 'application/json' }, body: JSON.stringify(body) })), request: number => handler(new Request('https://test.invalid', { method: 'POST', headers: { Origin: 'https://matheusbauto-blip.github.io', 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'process_lookup', number }) })), counts: () => ({ lookups, djenLookups, modelCalls, quotaCalls }), modelsCalled: () => modelsCalled, aborted: () => aborted };
}

test('the actual process route works independently of Google credentials and never calls the model', async () => {
  const s = server(); const response = await s.request('0000832-35.2018.4.01.3202');
  assert.equal(response.status, 200); assert.equal((await response.json()).process.number, '00008323520184013202');
  assert.deepEqual(s.counts(), { lookups: 1, djenLookups: 0, modelCalls: 0, quotaCalls: 1 });
});

test('missing process credentials return a specific recoverable error without spending quota', async () => {
  const s = server({ token: '' }); const response = await s.request('00008323520184013202');
  assert.equal(response.status, 503); assert.deepEqual(await response.json(), { error: 'process_not_configured' });
  assert.deepEqual(s.counts(), { lookups: 0, djenLookups: 0, modelCalls: 0, quotaCalls: 0 });
});
test('operator import rejects unauthenticated callers before any database or model call', async () => {
  const s = server();
  const r = await s.raw({ op: 'library_import', kind: 'texts', batch: [{}] });
  assert.equal(r.status, 401); assert.deepEqual(await r.json(), { error: 'operator_required' });
  assert.equal(s.counts().quotaCalls, 0); assert.equal(s.counts().modelCalls, 0);
});
test('operator ingress validates its batch and fails closed without an active grant', async () => {
  const s = server({ writes: true });
  const send = (server, body) => server.rawRequest(new Request('https://test.invalid', {method:'POST',headers:{Origin:'https://matheusbauto-blip.github.io','Content-Type':'application/json',Authorization:'Bearer '+'a'.repeat(43)},body:JSON.stringify(body)}));
  const invalid = await send(s, {op:'library_import',kind:'sql',batch:[{}]});
  assert.equal(invalid.status,400); assert.equal(s.counts().quotaCalls,0);
  const expired = await send(s, {op:'library_import',kind:'texts',batch:[{}]});
  assert.equal(expired.status,403); assert.deepEqual(await expired.json(),{error:'operator_grant_expired'});
  assert.equal(s.counts().modelCalls,0);
  // With corpus writes paused (the default), nothing is written even with a valid-looking grant.
  const paused = server();
  const refused = await send(paused, {op:'library_import',kind:'texts',batch:[{}]});
  assert.equal(refused.status,503); assert.deepEqual(await refused.json(),{error:'library_capacity'});
  assert.equal(paused.counts().quotaCalls,0);
});

test('a quota outage blocks process provider calls and invalid numbers never spend quota', async () => {
  const s = server({ quotaError: true });
  const invalid = await s.request('00008323620184013202'); assert.equal(invalid.status, 400);
  assert.equal(s.counts().quotaCalls, 0);
  const unavailable = await s.request('00008323520184013202'); assert.equal(unavailable.status, 503);
  assert.deepEqual(await unavailable.json(), { error: 'process_unavailable' });
  assert.deepEqual(s.counts(), { lookups: 0, djenLookups: 0, modelCalls: 0, quotaCalls: 1 });
});

test('without a configured source, the route uses the public DJEN API and needs no provider token', async () => {
  const s = server({ token: '', processSource: '' }); const response = await s.request('00008323520184013202');
  assert.equal(response.status, 200); assert.equal((await response.json()).coverage, 'publications');
  assert.deepEqual(s.counts(), { lookups: 0, djenLookups: 1, modelCalls: 0, quotaCalls: 1 });
});

test('a quota outage blocks paid model calls instead of letting them through', async () => {
  const s = server({ quotaError: true });
  for (const op of ['prepare', 'answer']) {
    const response = await s.raw({ op, question: 'teste', catalog: [], excerpts: [] });
    assert.equal(response.status, 503); assert.deepEqual(await response.json(), { error: 'quota_unavailable' });
  }
  assert.equal(s.counts().modelCalls, 0);
});

test('an oversized body without Content-Length is refused by the bytes actually read, before parsing or quota', async () => {
  const s = server({ maxBody: '2048' });
  const stream = new ReadableStream({ start(controller) { for (let i = 0; i < 8; i++) controller.enqueue(new TextEncoder().encode('{"op":"answer","question":"' + 'x'.repeat(500) + '"')); controller.close(); } });
  const request = new Request('https://test.invalid', { method: 'POST', headers: { Origin: 'https://matheusbauto-blip.github.io', 'Content-Type': 'application/json' }, body: stream, duplex: 'half' });
  assert.equal(request.headers.get('content-length'), null, 'the test must exercise the path without Content-Length');
  const big = await s.rawRequest(request);
  assert.equal(big.status, 413); assert.deepEqual(await big.json(), { error: 'too_large' });
  assert.deepEqual(s.counts(), { lookups: 0, djenLookups: 0, modelCalls: 0, quotaCalls: 0 });
  const small = await s.raw({ op: 'process_lookup', number: '00008323520184013202' });
  assert.equal(small.status, 200, 'bodies within the limit still work');
});

test('a transient model failure is retried and then handed to the fallback model, flagged in the response', async () => {
  const s = server({ models: { 'gemini-3.1-flash-lite': 503, 'gemini-3.5-flash': { terms: ['vício'], laws: [] } } });
  const response = await s.raw({ op: 'prepare', question: 'celular com defeito', catalog: [] });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).fallback, true);
  assert.deepEqual(s.modelsCalled(), ['gemini-3.1-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.5-flash']);
});

test('a model that times out is not retried on the same model, and a non-transient error is not retried at all', async () => {
  const timedOut = server({ models: { 'gemini-3.5-flash': 504, 'gemini-3.1-flash-lite': { kind: 'answer' } } });
  const response = await timedOut.raw({ op: 'answer', question: 'pergunta', excerpts: [], history: [], attachments: [] });
  assert.equal(response.status, 200);
  assert.deepEqual(timedOut.modelsCalled(), ['gemini-3.5-flash', 'gemini-3.1-flash-lite']);
  const rejected = server({ models: { 'gemini-3.1-flash-lite': 400 } });
  const bad = await rejected.raw({ op: 'prepare', question: 'pergunta', catalog: [] });
  assert.equal(bad.status, 502);
  assert.deepEqual(rejected.modelsCalled(), ['gemini-3.1-flash-lite']);
  const down = server({ models: { 'gemini-3.1-flash-lite': 503, 'gemini-3.5-flash': 503 } });
  const unavailable = await down.raw({ op: 'prepare', question: 'pergunta', catalog: [] });
  assert.equal(unavailable.status, 502); assert.deepEqual(await unavailable.json(), { error: 'upstream', status: 503 });
  assert.equal(down.modelsCalled().length, 4);
});

test('a healthy primary model is used once and the response is not flagged as a fallback', async () => {
  const s = server({ models: { 'gemini-3.1-flash-lite': { terms: [], laws: [] } } });
  const response = await s.raw({ op: 'prepare', question: 'pergunta', catalog: [] });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).fallback, false);
  assert.deepEqual(s.modelsCalled(), ['gemini-3.1-flash-lite']);
});

test('reading an index entry by path returns the matching articles and never the passages blob; bad locators are 400/409', async () => {
  const s = server();
  const ok = await s.raw({ op: 'repository_read', path: 'federal/leis-ordinarias/1990/lei-8078-1990-09-11.md', ref: 'c'.repeat(40), hash: 'a'.repeat(16), query: 'consumidor' });
  assert.equal(ok.status, 200);
  const body = await ok.json();
  assert.equal(body.document.title, 'Lei de teste'); assert.equal(body.document.passages, undefined);
  assert.deepEqual(body.passages, [{ article: 'Art. 1º', excerpt: 'Trecho sobre consumidor' }]); assert.equal(body.markdown, undefined);
  const full = await s.raw({ op: 'repository_read', path: 'federal/leis-ordinarias/1990/lei-8078-1990-09-11.md', ref: 'c'.repeat(40), hash: 'a'.repeat(16) });
  assert.equal((await full.json()).markdown, '## Art. 1º\nTexto.');
  const invalid = await s.raw({ op: 'repository_read', path: '../x.md', ref: 'c'.repeat(40), hash: 'a'.repeat(16) });
  assert.equal(invalid.status, 400); assert.deepEqual(await invalid.json(), { error: 'invalid_locator' });
  const tampered = await s.raw({ op: 'repository_read', path: 'federal/x.md', ref: 'c'.repeat(40), hash: 'bad' });
  assert.equal(tampered.status, 409); assert.deepEqual(await tampered.json(), { error: 'document_integrity' });
  assert.equal(s.counts().modelCalls, 0);
});

test('a slow primary model is overtaken by the fallback started in parallel, and the slow call is cancelled', async () => {
  const s = server({ hedge: true, realTimers: true, models: { 'gemini-3.1-flash-lite': { delay: 20_000, data: { terms: ['lento'], laws: [] } }, 'gemini-3.5-flash': { delay: 10, data: { terms: ['rápido'], laws: [] } } } });
  const started = Date.now();
  const response = await s.raw({ op: 'prepare', question: 'pergunta', catalog: [] });
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.fallback, true, 'the answer came from the fallback model');
  assert.ok(Date.now() - started < 12_000, 'the answer arrives soon after the parallel start (8 s), not after the slow model');
  assert.deepEqual(s.modelsCalled(), ['gemini-3.1-flash-lite', 'gemini-3.5-flash']);
  assert.deepEqual(s.aborted(), ['gemini-3.1-flash-lite']);
});

test('a worker near the end of its life refuses model calls at once, without spending quota, so the app retries elsewhere', async () => {
  const s = server({ workerLimit: '1', models: { 'gemini-3.1-flash-lite': { terms: [], laws: [] } } });
  const response = await s.raw({ op: 'answer', question: 'pergunta', excerpts: [], history: [], attachments: [] });
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.error, 'worker_recycling'); assert.ok(body.retryAfterMs >= 1_500);
  assert.deepEqual(s.counts(), { lookups: 0, djenLookups: 0, modelCalls: 0, quotaCalls: 0 });
});
