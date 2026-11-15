import test from 'node:test';
import assert from 'node:assert/strict';
import { createDjenClient } from '../supabase/functions/ross-ai/djen-provider.mjs';

const number = '00008323520184013202';
const item = { id: 1, numero_processo: number, data_disponibilizacao: '2026-11-13', siglaTribunal: 'TRF1', nomeOrgao: 'Órgão de teste', nomeClasse: 'Classe de teste', texto: '<p>Texto &amp; informação.</p><script>never execute</script>', ativo: true, hash: 'abcDEF1234567890' };
const body = items => ({ status: 'success', count: items.length, items });

test('DJEN uses the official public read endpoint without a key and reports publication coverage', async () => {
  const lookup = createDjenClient({ fetchImpl: async (url, options) => {
    const u = new URL(url); assert.equal(u.origin, 'https://comunicaapi.pje.jus.br'); assert.equal(u.pathname, '/api/v1/comunicacao');
    assert.equal(u.searchParams.get('numeroProcesso'), number); assert.equal(u.searchParams.get('itensPorPagina'), '100');
    assert.equal(options.headers.Authorization, undefined); assert.equal(options.body, undefined); assert.equal(options.redirect, 'error');
    return Response.json(body([item]));
  } });
  const result = await lookup({ number });
  assert.equal(result.coverage, 'publications'); assert.equal(result.process.provider, 'CNJ · DJEN');
  assert.equal(result.process.activeParty, ''); assert.equal(result.process.verifiedAt, '');
  assert.equal(result.movements[0].text, 'Texto & informação.');
  assert.match(result.movements[0].url, /\/comunicacao\/abcDEF1234567890\/certidao$/);
});

test('an empty public lookup does not assert that a proceeding does not exist', async () => {
  const lookup = createDjenClient({ fetchImpl: async () => Response.json(body([])) });
  const result = await lookup({ number });
  assert.equal(result.found, false); assert.equal(result.count, 0); assert.equal(result.process.number, number); assert.deepEqual(result.movements, []);
});

test('DJEN rejects publications for another proceeding rather than mixing context', async () => {
  const lookup = createDjenClient({ fetchImpl: async () => Response.json(body([{ ...item, numero_processo: '00180631920138260002' }])) });
  await assert.rejects(lookup({ number }), error => error.code === 'process_unavailable');
});

test('cancelled publications keep their status and long text is explicitly abbreviated', async () => {
  const lookup = createDjenClient({ fetchImpl: async () => Response.json(body([{ ...item, ativo: false, texto: 'A'.repeat(13000) }])) });
  const result = await lookup({ number });
  assert.equal(result.movements[0].cancelled, true); assert.equal(result.movements[0].version, 'cancelled');
  assert.equal(result.movements[0].truncated, true); assert.equal(result.movements[0].text.length, 12001);
});

test('DJEN pagination is bounded and malformed cursors make no requests', async () => {
  const calls = [];
  const lookup = createDjenClient({ fetchImpl: async url => { calls.push(url); return Response.json({ ...body([item]), count: 250 }); } });
  assert.deepEqual((await lookup({ number })).nextPage, { djenPage: 2 });
  assert.deepEqual((await lookup({ number, page: { djenPage: 3 } })).nextPage, null);
  assert.match(calls[1], /pagina=3/);
  for (const page of [{ djenPage: 0 }, { djenPage: 101 }, { djenPage: 2, url: 'https://internal.invalid' }, { cursor: 'foreign' }]) await assert.rejects(lookup({ number, page }), error => error.code === 'process_invalid_page');
  assert.equal(calls.length, 2);
});

test('repeated requests share work and cached responses retain the original retrieval time', async () => {
  let count = 0, time = 1000000;
  const lookup = createDjenClient({ now: () => time, fetchImpl: async () => { count++; return Response.json(body([item])); } });
  const [a, b] = await Promise.all([lookup({ number }), lookup({ number })]); assert.equal(count, 1); assert.equal(a.fetchedAt, b.fetchedAt);
  time += 10000; const cached = await lookup({ number }); assert.equal(cached.cached, true); assert.equal(cached.fetchedAt, a.fetchedAt); assert.equal(count, 1);
  time += 300000; await lookup({ number }); assert.equal(count, 2);
});

test('rate limiting waits rather than retrying or changing origins', async () => {
  let count = 0;
  const lookup = createDjenClient({ fetchImpl: async () => { count++; return new Response('', { status: 429 }); } });
  await assert.rejects(lookup({ number }), error => error.code === 'rate_limited');
  await assert.rejects(lookup({ number }), error => error.code === 'rate_limited'); assert.equal(count, 1);
});

test('malformed upstream payloads and HTTP failures are not presented as empty results', async () => {
  for (const payload of [{ status: 'error', items: [], count: 0 }, { status: 'success', items: null, count: 0 }, { status: 'success', items: [], count: -1 }]) {
    const lookup = createDjenClient({ fetchImpl: async () => Response.json(payload) }); await assert.rejects(lookup({ number }), error => error.code === 'process_unavailable');
  }
  const lookup = createDjenClient({ fetchImpl: async () => new Response('', { status: 403 }) });
  await assert.rejects(lookup({ number }), error => error.code === 'process_unavailable');
});
