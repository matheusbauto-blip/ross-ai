/* ROSS AI — função de backend (Supabase Edge Function, Deno).
   Recebe a pergunta e os trechos de lei já selecionados pelo app, pede ao Claude uma explicação
   restrita a esses trechos e devolve JSON no formato que a interface renderiza.

   Operações (POST, corpo JSON):
     { op: "prepare", question, catalog: [{ id, name }] }         → { terms: string[], laws: string[] }   (modelo rápido)
     { op: "answer", lang, jurisdiction, question, history, excerpts, attachments, capturedAt } → resposta estruturada (modelo principal)

   Segredos (Supabase → Edge Functions → Secrets):
     ANTHROPIC_API_KEY        obrigatório
     ROSS_ALLOWED_ORIGINS     opcional, lista separada por vírgula (padrão: GitHub Pages do projeto e localhost)
     ROSS_ANSWER_MODEL        opcional (padrão claude-opus-5-5)
     ROSS_HELPER_MODEL        opcional (padrão claude-haiku-5-5)
     ROSS_IP_DAILY_LIMIT      opcional (padrão 40 pedidos por IP por dia)
     ROSS_GLOBAL_DAILY_LIMIT  opcional (padrão 1000 pedidos por dia no total)
     ROSS_SALT                opcional, usado para não guardar o IP em claro */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk";
import { zodOutputFormat } from "npm:@anthropic-ai/sdk/helpers/zod";
import { z } from "npm:zod";
import { createClient } from "npm:@supabase/supabase-js@2";

const ANSWER_MODEL = Deno.env.get("ROSS_ANSWER_MODEL") ?? "claude-opus-5-5";
const HELPER_MODEL = Deno.env.get("ROSS_HELPER_MODEL") ?? "claude-haiku-5-5";
const IP_LIMIT = Number(Deno.env.get("ROSS_IP_DAILY_LIMIT") ?? "40");
const GLOBAL_LIMIT = Number(Deno.env.get("ROSS_GLOBAL_DAILY_LIMIT") ?? "1000");
const ALLOWED_ORIGINS = (Deno.env.get("ROSS_ALLOWED_ORIGINS") ?? "https://matheusbauto-blip.github.io,http://localhost:8766,http://localhost:8765")
  .split(",").map((s) => s.trim()).filter(Boolean);
const MAX_BODY_BYTES = 28 * 1024 * 1024;
const MAX_ATTACHMENTS = 4;
const ALLOWED_MEDIA = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]);

/* ---------- esquemas de saída (structured outputs) ---------- */
const PrepareSchema = z.object({
  terms: z.array(z.string()),
  laws: z.array(z.string()),
});
const AnswerSchema = z.object({
  kind: z.enum(["answer", "clarify", "limit", "urgent", "document", "nosources"]),
  summary: z.string(),
  sourcesSay: z.array(z.object({ title: z.string(), text: z.string(), ref: z.number().int().nullable() })),
  depends: z.array(z.string()),
  sources: z.array(z.object({ ref: z.number().int(), why: z.string() })),
  mentions: z.array(z.object({ name: z.string(), article: z.string() })),
  nextSteps: z.array(z.string()),
  questions: z.array(z.string()),
  document: z.object({
    notes: z.array(z.string()),
    excerpts: z.array(z.object({ ref: z.string(), quote: z.string(), inDocument: z.string(), inLaw: z.string() })),
    warnings: z.array(z.string()),
  }).nullable(),
  limitNotice: z.object({ text: z.string(), referrals: z.array(z.string()) }).nullable(),
  warnings: z.array(z.string()),
});

/* ---------- utilitários ---------- */
function corsHeaders(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}
function json(status: number, body: unknown, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(origin) } });
}
async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
const str = (v: unknown, max = 4000) => (typeof v === "string" ? v.slice(0, max) : "");
const arr = (v: unknown) => (Array.isArray(v) ? v : []);

async function checkQuota(req: Request, search = false) {
  const url = Deno.env.get("SUPABASE_URL"); const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return { allowed: true };
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const ipHash = await sha256((Deno.env.get("ROSS_SALT") ?? "ross-ai") + "|" + (search ? "search|" : "ai|") + ip);
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await sb.rpc("ross_ai_bump", { p_ip_hash: ipHash, p_ip_limit: search ? IP_LIMIT * 5 : IP_LIMIT, p_global_limit: search ? GLOBAL_LIMIT * 5 : GLOBAL_LIMIT });
  if (error) { console.error("quota error", error.message); return { allowed: true }; }
  return { allowed: !!(data as { allowed?: boolean })?.allowed };
}

/* Corpus search does not call the model or require an Anthropic key. Imported
   texts are not labelled as verified current law. Partial/repealed publications
   can be found in search, but are excluded from passages sent to the model. */
let statsCache: { at: number; data: unknown } | null = null;
async function corpusOperation(op: string, body: Record<string, unknown>) {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("corpus_not_configured");
  const sb = createClient(url, key, { auth: { persistSession: false } });
  if (op === "repository_read") {
    const id = str(body.id, 64);
    if (!/^[a-f0-9]{64}$/.test(id)) throw new Error("invalid_id");
    const { data: doc, error } = await sb.from("ross_law_documents")
      .select("title,repository_path,repository_ref,content_sha256,text_version,is_partial,source_url,captured_at")
      .eq("id", id).single();
    if (error || !doc || !/^[a-f0-9]{40}$/.test(doc.repository_ref) || doc.repository_path.includes("..")) throw new Error("document_unavailable");
    // The caller supplies an indexed ID, never an arbitrary URL. No questions,
    // conversation content or private documents are sent to GitHub.
    const path = doc.repository_path.split("/").map(encodeURIComponent).join("/");
    const response = await fetch("https://raw.githubusercontent.com/ctresb/leis/" + doc.repository_ref + "/" + path, { signal: AbortSignal.timeout(15_000), redirect: "error" });
    if (!response.ok || Number(response.headers.get("content-length") || 0) > 3_000_000) throw new Error("document_unavailable");
    const raw = await response.text();
    if (new TextEncoder().encode(raw).length > 3_000_000 || await sha256(raw) !== doc.content_sha256) throw new Error("document_integrity");
    const markdown = raw.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "");
    return { document: doc, markdown, fetchedAt: new Date().toISOString() };
  }
  if (op === "corpus_stats") {
    if (statsCache && Date.now() - statsCache.at < 60_000) return statsCache.data;
    const { data, error } = await sb.rpc("ross_law_stats");
    if (error) throw new Error("corpus_unavailable");
    statsCache = { at: Date.now(), data };
    return data;
  }
  const query = str(body.query, 500).trim();
  if (query.length < 2) return { results: [], hasMore: false };
  const scope = ["federal", "estadual", "municipal"].includes(String(body.scope)) ? String(body.scope) : null;
  const uf = /^[A-Z]{2}$/.test(String(body.uf || "")) ? String(body.uf) : null;
  const municipality = str(body.municipality, 100).trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-") || null;
  const offset = Math.max(0, Math.min(300, Number(body.offset) || 0));
  const { data, error } = await sb.rpc("ross_law_search", {
    p_query: query, p_scope: scope, p_uf: uf, p_municipality: municipality,
    p_limit: body.forAnswer === true ? 8 : 15, p_offset: offset, p_for_answer: body.forAnswer === true,
  });
  if (error) { console.error("corpus search", error.code); throw new Error("corpus_unavailable"); }
  return { ...data, hasMore: offset < 300 && data.hasMore === true, repository: "ctresb/leis", complete: false };
}

/* ---------- instruções ---------- */
function systemPrompt(lang: string, grounded: boolean) {
  return [
    "You are ROSS AI, a legal information assistant. You explain Brazilian law in plain language. You are not a lawyer and this is not legal advice.",
    `Write in ${lang}. Be clear, respectful and not overly formal. Short sentences. Prefer concrete explanations over generic warnings.`,
    grounded
      ? "GROUNDING RULES: Answer ONLY from the official excerpts provided (current consolidated text from official sources, Planalto or the Câmara dos Deputados). Cite them by their numbers in \"ref\". Do not cite articles, laws, deadlines or court decisions that are not in the excerpts. If the excerpts do not answer the question, say so plainly (kind \"nosources\") and say what kind of rule or document would be needed. Excerpts marked […] are partial. Leave \"mentions\" empty."
      : "NO SOURCES ARE AVAILABLE for this request. Do not invent article numbers, deadlines, court decisions, quotations or links. Mention a law by name in \"mentions\" only when you are confident it exists, and describe rules in general terms. Leave \"sources\" empty. Say clearly that nothing was verified against official texts.",
    "Never state that someone will win or lose, that a clause is definitely valid or invalid, or that a lawsuit certainly applies. Say what depends on facts, documents or professional interpretation.",
    "If the question is ambiguous or lacks essential facts, use kind \"clarify\" with up to three objective questions. If the person asks for a high-impact personalised assessment, a litigation strategy or a definitive conclusion, use kind \"limit\", explain the limit briefly and refer them to a lawyer, the Defensoria Pública, a union, Procon or the relevant public service. If the situation seems urgent (imminent deadline, eviction, arrest, violence, risk), use kind \"urgent\" and tell them to seek help without delay.",
    "If a document (PDF or images) is attached: identify the clause or excerpt you explain (reference and short quote), separate what the document says from what the law says, and warn if the document is incomplete, unreadable or lacks context. One clause is not the conclusion for the whole case. Use kind \"document\" and fill \"document\".",
    "Keep every array to at most 5 items. Use empty arrays or null when a section does not apply.",
  ].join("\n\n");
}

/* ---------- operações ---------- */
async function opPrepare(client: Anthropic, body: Record<string, unknown>) {
  const question = str(body.question, 2000);
  const catalog = arr(body.catalog).slice(0, 200).map((l: Record<string, unknown>) => `${str(l.id, 40)}: ${str(l.name, 200)}`).join("\n");
  const response = await client.messages.parse({
    model: HELPER_MODEL,
    max_tokens: 600,
    output_config: { effort: "low", format: zodOutputFormat(PrepareSchema) },
    system: "You help a legal search engine for Brazilian federal law. Reply only with the JSON requested.",
    messages: [{ role: "user", content: `Question (Portuguese): ${question}\n\nLaws in the catalog (id: name):\n${catalog}\n\nReturn: "terms" = 4 to 8 Portuguese legal search terms (single words or short phrases as used in statutes) for this question; "laws" = up to 3 catalog ids most likely to contain the relevant rules, most relevant first (empty if none applies).` }],
  });
  return response.parsed_output ?? { terms: [], laws: [] };
}

async function opAnswer(client: Anthropic, body: Record<string, unknown>) {
  const lang = str(body.lang, 40) || "Português (Brasil)";
  const question = str(body.question, 6000);
  const jurisdiction = str(body.jurisdiction, 80);
  const capturedAt = str(body.capturedAt, 40);
  const excerpts = arr(body.excerpts).slice(0, 10).map((e: Record<string, unknown>, i) => ({
    n: Number(e.n) || i + 1, name: str(e.name, 300), article: str(e.article, 60), heading: str(e.heading, 300), nota: str(e.nota, 300), excerpt: str(e.excerpt, 4000),
  }));
  const history = arr(body.history).slice(-6).map((h: Record<string, unknown>) => `${h.role === "user" ? "PERSON" : "ROSS AI"}: ${str(h.text, 1200)}`).join("\n");
  const grounded = excerpts.length > 0;

  const content: Anthropic.ContentBlockParam[] = [];
  const attachments = arr(body.attachments).slice(0, MAX_ATTACHMENTS);
  const unread: string[] = [];
  for (const a of attachments as Record<string, unknown>[]) {
    const mediaType = str(a.mediaType, 80); const data = typeof a.data === "string" ? a.data.replace(/\s+/g, "") : "";
    if (!ALLOWED_MEDIA.has(mediaType) || !data) { unread.push(str(a.name, 120)); continue; }
    if (mediaType === "application/pdf") content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data } });
    else content.push({ type: "image", source: { type: "base64", media_type: mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif", data } });
  }
  const text = [
    `Context: ${jurisdiction || "Brasil"}. Today is ${new Date().toISOString().slice(0, 10)}.`,
    grounded ? `OFFICIAL EXCERPTS (captured ${capturedAt || "recently"}):\n` + excerpts.map((e) => `[${e.n}] ${e.name} — ${e.article}${e.heading ? ` (${e.heading})` : ""}${e.nota ? ` [${e.nota}]` : ""}\n"""\n${e.excerpt}\n"""`).join("\n\n") : "",
    unread.length ? `Attached files that could not be read: ${unread.join(", ")}. Say so and ask for the text or a readable file.` : "",
    history ? `CONVERSATION SO FAR:\n${history}` : "",
    `QUESTION: ${question || "(no text, only the attached document)"}`,
  ].filter(Boolean).join("\n\n");
  content.push({ type: "text", text });

  const response = await client.beta.messages.create({
    model: ANSWER_MODEL,
    max_tokens: 8000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "high", format: zodOutputFormat(AnswerSchema) },
    system: [{ type: "text", text: systemPrompt(lang, grounded), cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content }],
  });
  if (response.stop_reason === "refusal") {
    return { error: "refusal", category: response.stop_details?.category ?? null };
  }
  if (response.stop_reason === "max_tokens") return { error: "truncated" };
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") return { error: "empty" };
  const parsed = AnswerSchema.safeParse(JSON.parse(textBlock.text));
  if (!parsed.success) return { error: "invalid_json" };
  return { answer: parsed.data, model: response.model, usage: { input: response.usage.input_tokens, output: response.usage.output_tokens } };
}

/* ---------- servidor ---------- */
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" }, origin);
  if (origin && !ALLOWED_ORIGINS.includes(origin)) return json(403, { error: "origin_not_allowed" }, origin);
  const length = Number(req.headers.get("content-length") ?? "0");
  if (length > MAX_BODY_BYTES) return json(413, { error: "too_large" }, origin);

  let body: Record<string, unknown>;
  try { body = await req.json(); if (!body || Array.isArray(body) || typeof body !== "object") throw new Error(); } catch { return json(400, { error: "invalid_json" }, origin); }
  const op = str(body.op, 20);
  if (op === "search" || op === "corpus_stats" || op === "repository_read") {
    try {
      if (op !== "corpus_stats" && !(await checkQuota(req, true)).allowed) return json(429, { error: "rate_limited" }, origin);
      return json(200, await corpusOperation(op, body), origin);
    } catch { return json(503, { error: "corpus_unavailable" }, origin); }
  }
  if (op !== "prepare" && op !== "answer") return json(400, { error: "unknown_op" }, origin);

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json(503, { error: "api_not_configured" }, origin);

  const quota = await checkQuota(req);
  if (!quota.allowed) return json(429, { error: "rate_limited" }, origin);

  const client = new Anthropic({ apiKey, maxRetries: 1, timeout: 120_000 });
  try {
    const result = op === "prepare" ? await opPrepare(client, body) : await opAnswer(client, body);
    return json(200, result, origin);
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json(429, { error: "rate_limited" }, origin);
    if (e instanceof Anthropic.APIStatusError) { console.error("anthropic", e.status, e.message); return json(502, { error: "upstream", status: e.status }, origin); }
    if (e instanceof Anthropic.APIConnectionError) return json(504, { error: "upstream_timeout" }, origin);
    console.error("unexpected", e);
    return json(500, { error: "internal" }, origin);
  }
});
