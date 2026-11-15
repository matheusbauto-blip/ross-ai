import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { processNumber, ProcessError } from '../supabase/functions/ross-ai/process-provider.mjs';

const source = readFileSync(new URL('../supabase/functions/ross-ai/index.ts', import.meta.url), 'utf8').replace(/^import .*;\s*$/gm, '');
function server({ token = 'test-provider-value', quotaError = false, processSource = 'escavador' } = {}) {
  let handler, lookups = 0, djenLookups = 0, modelCalls = 0, quotaCalls = 0;
  const schema = new Proxy(function () {}, { get: () => schema, apply: () => schema });
  const env = { SUPABASE_URL: 'https://test.invalid', SUPABASE_SERVICE_ROLE_KEY: 'mock-service-role', ESCAVADOR_API_TOKEN: token, ROSS_PROCESS_SOURCE: processSource };
  const context = {
    Deno: { env: { get: key => env[key] }, serve: fn => { handler = fn; } }, z: schema,
    createClient: () => ({ rpc: async () => { quotaCalls++; return quotaError ? { error: { message: 'simulated quota outage' } } : { data: { allowed: true } }; } }),
    generateGemini: async () => { modelCalls++; throw new Error('process requests must not call the model'); },
    lookupProcess: async input => { lookups++; assert.equal(input.number, '00008323520184013202'); assert.equal(input.apiKey, token); return { process: { number: input.number }, movements: [] }; },
    lookupDjen: async input => { djenLookups++; assert.equal(input.number, '00008323520184013202'); return { coverage: 'publications', process: { number: input.number }, movements: [] }; },
    processNumber, ProcessError, GeminiError: class extends Error {}, eligibleForAnswer() {}, repositoryExcerpts() {},
    crypto, TextEncoder, Response, Request, URL, AbortSignal, console: { error() {} },
  };
  vm.runInNewContext(stripTypeScriptTypes(source), context);
  return { raw: body => handler(new Request('https://test.invalid', { method: 'POST', headers: { Origin: 'https://matheusbauto-blip.github.io', 'Content-Type': 'application/json' }, body: JSON.stringify(body) })), request: number => handler(new Request('https://test.invalid', { method: 'POST', headers: { Origin: 'https://matheusbauto-blip.github.io', 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'process_lookup', number }) })), counts: () => ({ lookups, djenLookups, modelCalls, quotaCalls }) };
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
