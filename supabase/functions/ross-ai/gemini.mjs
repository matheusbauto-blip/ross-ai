/* Google API adapter: the key is sent only in the server request header. */
export class GeminiError extends Error {
  constructor(status) {
    super('google_upstream');
    this.name = 'GeminiError';
    this.status = status;
  }
}

export function decodeGemini(response, requestedModel) {
  if (response.promptFeedback?.blockReason) return { error: 'refusal' };
  const candidate = response.candidates?.[0];
  if (!candidate) return { error: 'empty' };
  if (candidate.finishReason === 'MAX_TOKENS') return { error: 'truncated' };
  if (candidate.finishReason && candidate.finishReason !== 'STOP') return { error: 'refusal' };
  const text = (candidate.content?.parts ?? [])
    .filter(part => !part.thought && typeof part.text === 'string')
    .map(part => part.text).join('');
  if (!text) return { error: 'empty' };
  let data;
  try { data = JSON.parse(text); } catch { return { error: 'invalid_json' }; }
  return {
    data,
    model: response.modelVersion || requestedModel,
    usage: {
      input: response.usageMetadata?.promptTokenCount ?? 0,
      output: response.usageMetadata?.candidatesTokenCount ?? 0,
    },
  };
}

export async function generateGemini({ apiKey, model, system, parts, schema, maxTokens, timeoutMs = 90_000, signal = null, fetchImpl = fetch }) {
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) throw new GeminiError(400);
  let response;
  try {
    response = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseJsonSchema: schema,
          maxOutputTokens: maxTokens,
        },
      }),
      signal: signal ? AbortSignal.any([AbortSignal.timeout(timeoutMs), signal]) : AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new GeminiError(504);
  }
  // Provider response bodies may contain private prompt data. Never log them.
  if (!response.ok) {
    await response.body?.cancel();
    throw new GeminiError(response.status);
  }
  let data;
  try { data = await response.json(); } catch { return { error: 'invalid_json' }; }
  return decodeGemini(data, model);
}
