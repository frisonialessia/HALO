import type { Lang } from "@/types";

// Chat REAL del asistente Halo: responde preguntas libres del usuario sobre
// AEO/GEO/LLMO y, si hay un análisis, sobre SU negocio con datos reales.
// Multi-proveedor: prefiere Google (Gemini) si hay clave; si no, Perplexity.

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const PPLX_URL = "https://api.perplexity.ai/chat/completions";

export interface ChatTurn {
  role: "user" | "model";
  content: string;
}

export interface ChatBusiness {
  name?: string;
  business_type?: string;
  city?: string;
  score?: number;
  appeared?: number;
  total?: number;
  byEngine?: Record<string, number>;
  missed?: string[];
  competitors?: string[];
}

function systemPrompt(lang: Lang, biz?: ChatBusiness): string {
  const langName = lang === "es" ? "Spanish" : "English";
  let p =
    "You are Halo, a friendly assistant specialized in AI visibility (AEO). You help businesses " +
    "get recommended by AI search engines (ChatGPT, Perplexity, Gemini). You explain AEO " +
    "(Answer Engine Optimization), GEO and LLMO clearly and concretely, and give actionable advice. " +
    `Reply ONLY in ${langName}. Be concise: 2-4 short sentences, warm and concrete, no markdown headings, ` +
    "no empty hype. If you lack data about the user's business, answer generally and invite them to " +
    "paste their business so Halo can measure it.";

  if (biz?.name) {
    p += ` The user's analyzed business — use it when relevant: name "${biz.name}", type "${biz.business_type ?? ""}"`;
    p += biz.city ? `, located in "${biz.city}".` : ".";
    if (typeof biz.score === "number")
      p += ` It is recommended ${biz.score}/10 (appears in ${biz.appeared}/${biz.total} AI searches).`;
    if (biz.byEngine && Object.keys(biz.byEngine).length)
      p += ` By engine: ${Object.entries(biz.byEngine)
        .map(([e, v]) => `${e} ${Math.round(v * 10)}/10`)
        .join(", ")}.`;
    if (biz.missed?.length)
      p += ` Searches where it does NOT appear: ${biz.missed.slice(0, 6).map((q) => `"${q}"`).join(", ")}.`;
    if (biz.competitors?.length)
      p += ` Competitors the AI recommends instead: ${biz.competitors.slice(0, 5).join(", ")}.`;
  }
  return p;
}

export async function chatReply(
  messages: ChatTurn[],
  lang: Lang = "en",
  biz?: ChatBusiness
): Promise<string> {
  const system = systemPrompt(lang, biz);
  if (process.env.GEMINI_API_KEY) return chatGemini(system, messages);
  if (process.env.PERPLEXITY_API_KEY) return chatPerplexity(system, messages);
  throw new Error("No hay proveedor de IA configurado (define GEMINI_API_KEY o PERPLEXITY_API_KEY)");
}

async function chatGemini(system: string, messages: ChatTurn[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY as string;
  const contents = messages.map((m) => ({
    role: m.role === "model" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  // Gemini exige que la conversación empiece por un turno "user".
  while (contents.length && contents[0].role === "model") contents.shift();

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { maxOutputTokens: 400, temperature: 0.6 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini chat error ${res.status}`);
  const data = await res.json();
  const text: string = (data?.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("Gemini chat: respuesta vacía");
  return text;
}

async function chatPerplexity(system: string, messages: ChatTurn[]): Promise<string> {
  const apiKey = process.env.PERPLEXITY_API_KEY as string;
  const msgs = [
    { role: "system", content: system },
    ...messages.map((m) => ({ role: m.role === "model" ? "assistant" : "user", content: m.content })),
  ];
  const res = await fetch(PPLX_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "sonar", max_tokens: 400, messages: msgs }),
  });
  if (!res.ok) throw new Error(`Perplexity chat error ${res.status}`);
  const data = await res.json();
  const text: string = (data?.choices?.[0]?.message?.content ?? "").trim();
  if (!text) throw new Error("Perplexity chat: respuesta vacía");
  return text;
}
