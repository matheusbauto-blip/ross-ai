import test from 'node:test';
import assert from 'node:assert/strict';
import { lookupProcess, processNumber, ProcessError } from '../supabase/functions/ross-ai/process-provider.mjs';

const number = '00008323520184013202';
const process = { numero_cnj: number, titulo_polo_ativo: 'Parte de teste', titulo_polo_passivo: 'Outra parte', data_ultima_verificacao: '2026-11-14T10:00:00Z', data_ultima_movimentacao: '2026-11-13', fontes: [{ tipo: 'TRIBUNAL', sigla: 'TRF1', segredo_justica: false, capa: { classe: 'Classe de teste' } }] };
const list = { items: [{ id: 1, data: '2026-11-13', conteudo: 'Movimentação de teste', fonte: { nome: 'TRF1', link_web: 'javascript:alert(1)' } }], links: { next: null } };

test('CNJ validation accepts formatted input and rejects modified check digits, unsafe text and zero numbers', () => {
  assert.equal(processNumber('0000832-35.2018.4.01.3202'), number);
  for (const invalid of ['0000832-36.2018.4.01.3202', '0'.repeat(20), 'https://example.org/' + number, number + '<script>', '123']) assert.throws(() => processNumber(invalid), error => error.code === 'process_invalid_number');
});

test('unconfigured integration and invalid cursors never contact the provider', async () => {
  let called = false; const fetchImpl = async () => { called = true; };
  await assert.rejects(lookupProcess({ number, fetchImpl }), error => error.code === 'process_not_configured');
  await assert.rejects(lookupProcess({ number, apiKey: 'test-value', page: { cursor: 'x'.repeat(1501) }, fetchImpl }), error => error.code === 'process_invalid_page');
  assert.equal(called, false);
});

test('process lookup uses read-only provider endpoints, protects credentials and preserves actual verification dates', async () => {
  const calls = [];
  const result = await lookupProcess({ number, apiKey: 'private-test-value', fetchImpl: async (url, options) => {
    calls.push(url); assert.equal(options.headers.Authorization, 'Bearer private-test-value'); assert.equal(options.body, undefined); assert.equal(options.redirect, 'error');
    return Response.json(url.includes('/movimentacoes?') ? list : process);
  } });
  assert.equal(calls[0], 'https://api.escavador.com/api/v2/processos/numero_cnj/' + number);
  assert.equal(calls.length, 2); assert.equal(result.process.verifiedAt, process.data_ultima_verificacao);
  assert.equal(result.movements[0].url, ''); assert.equal(JSON.stringify(result).includes('private-test-value'), false);
  assert.equal(result.movementsUnavailable, false);
});

test('restricted processes are withheld before fetching their events', async () => {
  let calls = 0;
  await assert.rejects(lookupProcess({ number, apiKey: 'test-value', fetchImpl: async () => { calls++; return Response.json({ ...process, fontes: [{ segredo_justica: true }] }); } }), error => error.code === 'process_restricted');
  assert.equal(calls, 1);
});

test('provider errors are classified without reflecting private response bodies', async () => {
  for (const [status, code] of [[401, 'process_credentials'], [402, 'process_credits'], [404, 'process_not_found'], [429, 'rate_limited'], [503, 'process_unavailable']]) {
    await assert.rejects(lookupProcess({ number, apiKey: 'test-value', fetchImpl: async () => new Response('private provider response', { status }) }), error => error instanceof ProcessError && error.code === code && !error.message.includes('private'));
  }
});

test('a different process or malformed provider response never becomes the requested proceeding', async () => {
  for (const response of [{ ...process, numero_cnj: 'invalid' }, { ...process, fontes: null }]) await assert.rejects(lookupProcess({ number, apiKey: 'test-value', fetchImpl: async () => Response.json(response) }), error => error.code === 'process_unavailable');
});

test('an event outage preserves the process card with an explicit partial result', async () => {
  const result = await lookupProcess({ number, apiKey: 'test-value', fetchImpl: async url => url.includes('/movimentacoes?') ? new Response('', { status: 503 }) : Response.json(process) });
  assert.equal(result.process.number, number); assert.equal(result.movementsUnavailable, true); assert.deepEqual(result.movements, []);
});

test('pagination keeps opaque tokens but rejects foreign destinations and duplicate events', async () => {
  const prefix = 'https://api.escavador.com/api/v2/processos/numero_cnj/' + number + '/movimentacoes';
  for (const next of [prefix + '?cursor=abc%2B123&li=next-token', 'https://internal.invalid/steal?cursor=abc', 'https://api.escavador.com/api/v2/processos/numero_cnj/OTHER/movimentacoes?cursor=abc']) {
    const result = await lookupProcess({ number, apiKey: 'test-value', fetchImpl: async url => Response.json(url.includes('/movimentacoes?') ? { items: [...list.items, ...list.items], links: { next } } : process) });
    assert.equal(result.movements.length, 1);
    assert.deepEqual(result.nextPage, next === prefix + '?cursor=abc%2B123&li=next-token' ? { cursor: 'abc+123', li: 'next-token' } : null);
  }
});
