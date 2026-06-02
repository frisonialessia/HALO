import type { Project, BusinessKind, Lang } from "@/types";

// Identifica un negocio a partir de lo que el usuario pega en la landing:
// una URL, un nombre, un enlace de Google Maps o un perfil de redes.
// Devuelve los datos estructurados que necesita el motor de auditoría.
//
// Multi-proveedor: prefiere Google (Gemini) si hay GEMINI_API_KEY — así toda la
// demo corre con una sola clave gratuita de Google; si no, usa Perplexity.

const PPLX_URL = "https://api.perplexity.ai/chat/completions";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface IdentifiedBusiness {
  name: string;
  business_type: string;
  kind: BusinessKind;
  city?: string;
  website?: string;
}

// Instrucción común. En inglés (los modelos la siguen igual de bien); solo el
// idioma del business_type se parametriza, para que las búsquedas salgan en él.
function systemPrompt(langName: string): string {
  return (
    "You identify WHAT the user gives you (a website, a brand, a product, a local " +
    "business or an online service) and return structured data. " +
    "Return ONLY a valid JSON object, with no surrounding text or markdown, with these keys: " +
    "name (the real brand or business name); " +
    `business_type (category in ${langName}, specific and singular, e.g. "Italian restaurant", "vermouth", "invoicing software", "sportswear"); ` +
    'kind ("local" if it is a business with a physical location customers visit; "product" if it is a brand or product that is purchased; "online" if it is a service, website or SaaS with no physical location); ' +
    'city (only if kind is "local" and you know it; otherwise empty string); ' +
    'website (domain if you know it; otherwise empty string).'
  );
}

export async function identifyBusiness(
  input: string,
  lang: Lang = "en"
): Promise<IdentifiedBusiness> {
  const hasG = !!process.env.GEMINI_API_KEY;
  const hasP = !!process.env.PERPLEXITY_API_KEY;
  if (hasG) {
    try {
      return await identifyWithGemini(input, lang);
    } catch (err) {
      if (!hasP) throw err;
      console.error("[identify] Gemini failed, falling back to Perplexity:", err);
    }
  }
  if (hasP) return identifyWithPerplexity(input, lang);
  throw new Error("No hay proveedor de IA configurado (define GEMINI_API_KEY o PERPLEXITY_API_KEY)");
}

async function identifyWithGemini(input: string, lang: Lang): Promise<IdentifiedBusiness> {
  const apiKey = process.env.GEMINI_API_KEY as string;
  const langName = lang === "es" ? "Spanish" : "English";

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt(langName) }] },
      contents: [{ parts: [{ text: input }] }],
      // JSON mode → respuesta limpia y parseable sin prosa alrededor.
      generationConfig: { responseMimeType: "application/json", maxOutputTokens: 300 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini identify error ${res.status}`);
  const data = await res.json();
  const content: string = (data?.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string }) => p.text ?? "")
    .join("");
  return normalize(extractJson(content));
}

async function identifyWithPerplexity(input: string, lang: Lang): Promise<IdentifiedBusiness> {
  const apiKey = process.env.PERPLEXITY_API_KEY as string;
  const langName = lang === "es" ? "Spanish" : "English";

  const res = await fetch(PPLX_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sonar",
      max_tokens: 300,
      messages: [
        { role: "system", content: systemPrompt(langName) },
        { role: "user", content: input },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Perplexity identify error ${res.status}`);
  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  return normalize(extractJson(content));
}

function normalize(parsed: Record<string, unknown>): IdentifiedBusiness {
  const name = String(parsed.name ?? "").trim();
  const business_type = String(parsed.business_type ?? "").trim();
  if (!name || !business_type) throw new Error("No se pudo identificar el negocio");

  const rawKind = String(parsed.kind ?? "").trim().toLowerCase();
  const kind: BusinessKind = rawKind.startsWith("prod")
    ? "product"
    : rawKind === "online"
    ? "online"
    : "local";

  return {
    name,
    business_type,
    kind,
    city: kind === "local" ? String(parsed.city ?? "").trim() || undefined : undefined,
    website: String(parsed.website ?? "").trim() || undefined,
  };
}

// Extrae el primer objeto JSON del texto (por si el modelo lo envuelve en prosa).
function extractJson(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        /* sin JSON válido */
      }
    }
    return {};
  }
}

// Útil para construir el Project a partir de lo identificado.
export function toProject(b: IdentifiedBusiness): Project {
  return {
    id: "temp",
    name: b.name,
    business_type: b.business_type,
    kind: b.kind,
    city: b.city,
    website: b.website,
  };
}
