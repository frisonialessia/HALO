import type { Project, BusinessKind, Lang } from "@/types";

// Identifica un negocio a partir de lo que el usuario pega en la landing:
// una URL, un nombre, un enlace de Google Maps o un perfil de redes.
// Usa Perplexity (web-grounded) para devolver los datos estructurados que
// el motor de auditoría necesita. Así la landing mantiene UN solo campo.

const PPLX_URL = "https://api.perplexity.ai/chat/completions";

export interface IdentifiedBusiness {
  name: string;
  business_type: string;
  kind: BusinessKind;
  city?: string;
  website?: string;
}

export async function identifyBusiness(
  input: string,
  lang: Lang = "en"
): Promise<IdentifiedBusiness> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error("Falta PERPLEXITY_API_KEY");
  const langName = lang === "es" ? "Spanish" : "English";

  const res = await fetch(PPLX_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content:
            "You identify WHAT the user gives you (a website, a brand, a product, a local " +
            "business or an online service) and return structured data. " +
            "Return ONLY a valid JSON object, with no surrounding text or markdown, with these keys: " +
            "name (the real brand or business name); " +
            `business_type (category in ${langName}, specific and singular, e.g. "Italian restaurant", "vermouth", "invoicing software", "sportswear"); ` +
            'kind ("local" if it is a business with a physical location customers visit; "product" if it is a brand or product that is purchased; "online" if it is a service, website or SaaS with no physical location); ' +
            'city (only if kind is "local" and you know it; otherwise empty string); ' +
            'website (domain if you know it; otherwise empty string).',
        },
        { role: "user", content: input },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Perplexity identify error ${res.status}`);
  }

  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  const parsed = extractJson(content);

  const name = String(parsed.name ?? "").trim();
  const business_type = String(parsed.business_type ?? "").trim();
  if (!name || !business_type) {
    throw new Error("No se pudo identificar el negocio");
  }

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
    // La ciudad solo tiene sentido en negocios locales.
    city: kind === "local" ? String(parsed.city ?? "").trim() || undefined : undefined,
    website: String(parsed.website ?? "").trim() || undefined,
  };
}

// Extrae el primer objeto JSON del texto (Perplexity a veces lo envuelve
// en prosa o en un bloque de código).
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
