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

// Modelos que recusaram o nível de pensamento (HTTP 400): as chamadas seguintes deste servidor vão sem ele.
const NO_THINKING_LEVEL = new Set();

/* Chama o modelo. thinkingLevel ("low", "medium"…) limita o raciocínio interno, que atrasa o início da resposta.
   Com onText, usa a resposta em partes (SSE) e entrega cada pedaço de texto assim que chega; o resultado final é o
   mesmo da chamada normal. */
export async function generateGemini({ apiKey, model, system, parts, schema, maxTokens, thinkingLevel = '', timeoutMs = 90_000, signal = null, onText = null, fetchImpl = fetch }) {
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) throw new GeminiError(400);
  const level = /^[a-z]+$/.test(thinkingLevel) && !NO_THINKING_LEVEL.has(model) ? thinkingLevel : '';
  const stream = typeof onText === 'function';
  const started = Date.now();
  const timeout = AbortSignal.timeout(timeoutMs);
  const combined = signal ? AbortSignal.any([timeout, signal]) : timeout;
  let response;
  try {
    response = await fetchImpl(`https://generativelanguage.googleapis.com/v1beta/models/${model}:${stream ? 'streamGenerateContent?alt=sse' : 'generateContent'}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseJsonSchema: schema,
          maxOutputTokens: maxTokens,
          ...(level ? { thinkingConfig: { thinkingLevel: level } } : {}),
        },
      }),
      signal: combined,
    });
  } catch {
    throw new GeminiError(504);
  }
  // Provider response bodies may contain private prompt data. Never log them.
  if (!response.ok) {
    await response.body?.cancel();
    if (response.status === 400 && level) {
      NO_THINKING_LEVEL.add(model);
      return generateGemini({ apiKey, model, system, parts, schema, maxTokens, thinkingLevel: '', timeoutMs: Math.max(1, timeoutMs - (Date.now() - started)), signal, onText, fetchImpl });
    }
    throw new GeminiError(response.status);
  }
  if (stream) return readGeminiStream(response, model, onText);
  let data;
  try { data = await response.json(); } catch { return { error: 'invalid_json' }; }
  return decodeGemini(data, model);
}

/* Junta os eventos SSE em uma resposta única e a valida como a chamada normal. Pedaços de raciocínio (thought) não
   são repassados. Uma conexão interrompida no meio conta como tempo esgotado. */
async function readGeminiStream(response, model, onText) {
  if (!response.body) return { error: 'empty' };
  const reader = response.body.getReader(); const decoder = new TextDecoder();
  let buffer = '', text = '', blockReason = null, finishReason = null, usage = null, modelVersion = null, candidates = false;
  const handle = line => {
    if (!line.startsWith('data:')) return;
    let chunk; try { chunk = JSON.parse(line.slice(5)); } catch { return; }
    if (chunk.promptFeedback?.blockReason) blockReason = chunk.promptFeedback.blockReason;
    if (chunk.usageMetadata) usage = chunk.usageMetadata;
    if (chunk.modelVersion) modelVersion = chunk.modelVersion;
    const candidate = chunk.candidates?.[0];
    if (!candidate) return;
    candidates = true;
    if (candidate.finishReason) finishReason = candidate.finishReason;
    const delta = (candidate.content?.parts ?? []).filter(part => !part.thought && typeof part.text === 'string').map(part => part.text).join('');
    if (delta) { text += delta; onText(delta); }
  };
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let end;
      while ((end = buffer.indexOf('\n')) >= 0) { handle(buffer.slice(0, end).replace(/\r$/, '')); buffer = buffer.slice(end + 1); }
    }
    buffer += decoder.decode();
    if (buffer) handle(buffer.replace(/\r$/, ''));
  } catch {
    throw new GeminiError(504);
  }
  return decodeGemini({
    promptFeedback: blockReason ? { blockReason } : undefined,
    modelVersion, usageMetadata: usage ?? undefined,
    candidates: candidates ? [{ finishReason: finishReason ?? undefined, content: { parts: [{ text }] } }] : undefined,
  }, model);
}
