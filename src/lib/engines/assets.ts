import type { Lang } from "@/types";

// Generador de "AI Assets": convierte el diagnóstico en acción. A partir de
// los datos del negocio (y de las búsquedas donde NO aparece) escribe texto
// listo para publicar: descripción optimizada, FAQ y acciones concretas.
//
// Multi-proveedor: prefiere Google (Gemini) si hay GEMINI_API_KEY; si no,
// Perplexity. Así la demo entera corre con una sola clave gratuita de Google.

const PPLX_URL = "https://api.perplexity.ai/chat/completions";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface AiAssets {
  description: string;
  faqs: { q: string; a: string }[];
  tips: string[];
}

export interface AssetsInput {
  name: string;
  business_type: string;
  city?: string;
  website?: string;
  missedQueries?: string[];
}

export async function generateAssets(input: AssetsInput, lang: Lang = "en"): Promise<AiAssets> {
  const { system, user } = buildPrompt(input, lang);
  if (process.env.GEMINI_API_KEY) return generateWithGemini(system, user);
  if (process.env.PERPLEXITY_API_KEY) return generateWithPerplexity(system, user);
  throw new Error("No hay proveedor de IA configurado (define GEMINI_API_KEY o PERPLEXITY_API_KEY)");
}

// Prompt bilingüe compartido por ambos proveedores.
function buildPrompt(input: AssetsInput, lang: Lang): { system: string; user: string } {
  const es = lang === "es";
  const where = input.city ? (es ? ` en ${input.city}` : ` in ${input.city}`) : "";
  const missed = (input.missedQueries ?? []).filter(Boolean).slice(0, 6);
  const quoted = missed.map((q) => `"${q}"`).join(", ");
  const missedBlock = missed.length
    ? es
      ? ` Hoy NO aparece cuando los clientes preguntan a la IA: ${quoted}. Prioriza cubrir justo esas búsquedas.`
      : ` Today it does NOT appear when customers ask the AI: ${quoted}. Prioritize covering exactly those searches.`
    : "";

  const system = es
    ? "Eres un experto en AEO/GEO: optimizas negocios para que los asistentes " +
      "de IA (ChatGPT, Perplexity, Gemini) los recomienden a sus usuarios. " +
      "Escribes en español, concreto, sin relleno ni promesas vacías. " +
      "Devuelve SOLO un objeto JSON válido (sin markdown ni texto alrededor) " +
      "con estas claves exactas: " +
      "description (string: 50-70 palabras describiendo el negocio de forma que una IA lo cite con seguridad: qué es, dónde está y qué lo hace especial), " +
      "faqs (array de 5 objetos {q, a}: q es una pregunta tal y como un cliente se la haría a una IA; a es la respuesta de 1-2 frases que menciona el negocio con naturalidad), " +
      "tips (array de 3 strings: acciones concretas y realizables para mejorar su presencia en IA)."
    : "You are an AEO/GEO expert: you optimize businesses so AI assistants " +
      "(ChatGPT, Perplexity, Gemini) recommend them to their users. " +
      "You write in English, concrete, with no filler or empty promises. " +
      "Return ONLY a valid JSON object (no markdown or surrounding text) " +
      "with these exact keys: " +
      "description (string: 50-70 words describing the business so an AI cites it confidently: what it is, where it is and what makes it special), " +
      "faqs (array of 5 objects {q, a}: q is a question exactly as a customer would ask an AI; a is a 1-2 sentence answer that mentions the business naturally), " +
      "tips (array of 3 strings: concrete, doable actions to improve its AI presence).";

  const user =
    (es
      ? `Negocio: ${input.name}. Tipo: ${input.business_type}${where}.`
      : `Business: ${input.name}. Type: ${input.business_type}${where}.`) +
    (input.website ? (es ? ` Web: ${input.website}.` : ` Website: ${input.website}.`) : "") +
    missedBlock;

  return { system, user };
}

async function generateWithGemini(system: string, user: string): Promise<AiAssets> {
  const apiKey = process.env.GEMINI_API_KEY as string;
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ parts: [{ text: user }] }],
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 900 },
    }),
  });
  if (!res.ok) throw new Error(`Gemini assets error ${res.status}`);
  const data = await res.json();
  const content: string = (data?.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? "")
    .join("");
  return parseAssets(content);
}

async function generateWithPerplexity(system: string, user: string): Promise<AiAssets> {
  const apiKey = process.env.PERPLEXITY_API_KEY as string;
  const res = await fetch(PPLX_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonar",
      max_tokens: 900,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Perplexity assets error ${res.status}`);
  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  return parseAssets(content);
}

// El modelo a veces envuelve el JSON en prosa o en un bloque de código:
// extraemos el primer objeto y normalizamos a la forma que espera el front.
function parseAssets(text: string): AiAssets {
  let obj: Record<string, unknown> = {};
  try {
    obj = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        obj = JSON.parse(match[0]);
      } catch {
        /* sin JSON válido */
      }
    }
  }

  const description = typeof obj.description === "string" ? obj.description.trim() : "";

  const faqs = Array.isArray(obj.faqs)
    ? obj.faqs
        .map((f) => {
          const o = (f ?? {}) as Record<string, unknown>;
          return {
            q: String(o.q ?? o.question ?? "").trim(),
            a: String(o.a ?? o.answer ?? "").trim(),
          };
        })
        .filter((f) => f.q && f.a)
    : [];

  const tips = Array.isArray(obj.tips)
    ? obj.tips.map((t) => String(t ?? "").trim()).filter(Boolean)
    : [];

  if (!description && faqs.length === 0) {
    throw new Error("Respuesta de IA sin contenido utilizable");
  }

  return { description, faqs, tips };
}
