import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeGemini, generateGemini, GeminiError } from '../supabase/functions/ross-ai/gemini.mjs';

test('extracts JSON across parts and ignores private thinking', () => {
  const result = decodeGemini({
    modelVersion: 'gemini-test',
    candidates: [{ finishReason: 'STOP', content: { parts: [
      { thought: true, text: 'private reasoning' }, { text: '{"terms":' }, { text: '["consumidor"],"laws":[]}' },
    ] } }],
    usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 30 },
  }, 'fallback');
  assert.deepEqual(result, { data: { terms: ['consumidor'], laws: [] }, model: 'gemini-test', usage: { input: 100, output: 30 } });
});

test('does not accept truncated, blocked or invalid JSON as an answer', () => {
  assert.equal(decodeGemini({ promptFeedback: { blockReason: 'SAFETY' } }).error, 'refusal');
  assert.equal(decodeGemini({ candidates: [{ finishReason: 'MAX_TOKENS' }] }).error, 'truncated');
  assert.equal(decodeGemini({ candidates: [{ finishReason: 'SAFETY' }] }).error, 'refusal');
  assert.equal(decodeGemini({ candidates: [{ content: { parts: [{ text: 'invalid' }] } }] }).error, 'invalid_json');
  assert.equal(decodeGemini({}).error, 'empty');
});

test('keeps key in Google request header and passes PDF inline with the output schema', async () => {
  const result = await generateGemini({
    apiKey: 'private-test-value', model: 'gemini-test', system: 'Use only the provided excerpts.',
    parts: [{ inlineData: { mimeType: 'application/pdf', data: 'JVBERg==' } }, { text: 'Question' }],
    schema: { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'] }, maxTokens: 100,
    fetchImpl: async (url, init) => {
      assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-test:generateContent');
      assert.equal(init.headers['x-goog-api-key'], 'private-test-value');
      assert.equal(init.body.includes('private-test-value'), false);
      const body = JSON.parse(init.body);
      assert.equal(body.contents[0].parts[0].inlineData.mimeType, 'application/pdf');
      assert.equal(body.generationConfig.responseJsonSchema.required[0], 'ok');
      assert.equal(body.systemInstruction.parts[0].text, 'Use only the provided excerpts.');
      return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{"ok":true}' }] } }] });
    },
  });
  assert.deepEqual(result.data, { ok: true });
});

test('sanitizes upstream errors and prevents endpoint injection', async () => {
  const options = { apiKey: 'private-test-value', model: 'gemini-test', parts: [], schema: {}, system: '', maxTokens: 100 };
  await assert.rejects(generateGemini({ ...options, fetchImpl: async () => new Response('private prompt echoed by provider', { status: 429 }) }), error => {
    assert.ok(error instanceof GeminiError);
    assert.equal(error.status, 429);
    assert.equal(error.message, 'google_upstream');
    return true;
  });
  await assert.rejects(generateGemini({ ...options, model: '../another-host' }), GeminiError);
});

test('an external signal cancels the provider call (the slower of two parallel models)', async () => {
  const controller = new AbortController();
  const pending = generateGemini({
    apiKey: 'private-test-value', model: 'gemini-test', parts: [], schema: {}, system: '', maxTokens: 10, timeoutMs: 60_000, signal: controller.signal,
    fetchImpl: (url, init) => new Promise((resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })),
  });
  controller.abort();
  await assert.rejects(pending, error => error instanceof GeminiError && error.status === 504);
});

const sse = events => new Response(new ReadableStream({ start(c) { for (const e of events) c.enqueue(new TextEncoder().encode('data: ' + JSON.stringify(e) + '\r\n\r\n')); c.close(); } }), { headers: { 'Content-Type': 'text/event-stream' } });

test('asks for a short reasoning level and drops it for a model that refuses the parameter', async () => {
  const bodies = [];
  const options = { apiKey: 'private-test-value', model: 'gemini-thinking-test', parts: [], schema: {}, system: '', maxTokens: 100, thinkingLevel: 'low' };
  const fetchImpl = async (url, init) => {
    const body = JSON.parse(init.body); bodies.push(body);
    if (body.generationConfig.thinkingConfig) return new Response('unknown field', { status: 400 });
    return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{"ok":true}' }] } }] });
  };
  assert.deepEqual((await generateGemini({ ...options, fetchImpl })).data, { ok: true });
  assert.deepEqual(bodies.map(b => b.generationConfig.thinkingConfig), [{ thinkingLevel: 'low' }, undefined]);
  await generateGemini({ ...options, fetchImpl });
  assert.equal(bodies.length, 3, 'the refusal is remembered: the next call goes straight without the parameter');
  await assert.rejects(generateGemini({ ...options, model: 'gemini-other', thinkingLevel: '', fetchImpl: async () => new Response('', { status: 400 }) }), error => error.status === 400);
});

test('streams the written text piece by piece, without private reasoning, and validates the joined answer', async () => {
  const pieces = [];
  const result = await generateGemini({
    apiKey: 'private-test-value', model: 'gemini-test', parts: [], schema: {}, system: '', maxTokens: 100, onText: text => pieces.push(text),
    fetchImpl: async url => {
      assert.equal(url, 'https://generativelanguage.googleapis.com/v1beta/models/gemini-test:streamGenerateContent?alt=sse');
      return sse([
        { candidates: [{ content: { parts: [{ thought: true, text: 'private reasoning' }] } }] },
        { candidates: [{ content: { parts: [{ text: '{"summary":"Você ' }] } }] },
        { candidates: [{ content: { parts: [{ text: 'pode desistir."}' }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 }, modelVersion: 'gemini-test-001' },
      ]);
    },
  });
  assert.deepEqual(pieces, ['{"summary":"Você ', 'pode desistir."}']);
  assert.deepEqual(result, { data: { summary: 'Você pode desistir.' }, model: 'gemini-test-001', usage: { input: 10, output: 5 } });
});

test('a stream cut in the middle is a timeout, and a truncated stream is not accepted as an answer', async () => {
  const options = { apiKey: 'private-test-value', model: 'gemini-test', parts: [], schema: {}, system: '', maxTokens: 100, onText() {} };
  const broken = new Response(new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('data: {"candidates":[{"content":{"parts":[{"text":"{\\"su"}]}}]}\n\n')); c.error(new Error('connection reset')); } }));
  await assert.rejects(generateGemini({ ...options, fetchImpl: async () => broken }), error => error instanceof GeminiError && error.status === 504);
  const truncated = await generateGemini({ ...options, fetchImpl: async () => sse([{ candidates: [{ content: { parts: [{ text: '{"summary":"' }] }, finishReason: 'MAX_TOKENS' }] }]) });
  assert.equal(truncated.error, 'truncated');
});
