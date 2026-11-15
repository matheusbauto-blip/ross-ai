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
