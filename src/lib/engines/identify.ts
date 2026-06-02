import type { Project, BusinessKind } from "@/types";

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

export async function identifyBusiness(input: string): Promise<IdentifiedBusiness> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error("Falta PERPLEXITY_API_KEY");

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
            "Identificas QUÉ te da el usuario (una web, una marca, un producto, un negocio " +
            "local o un servicio online) y devuelves datos estructurados. " +
            "Devuelve SOLO un objeto JSON válido, sin texto ni markdown alrededor, con estas claves: " +
            'name (nombre real de la marca o negocio); ' +
            'business_type (categoría en español, concreta y en singular: "restaurante italiano", "vermut", "software de facturación", "ropa deportiva"); ' +
            'kind ("local" si es un negocio con ubicación física donde acuden clientes; "product" si es una marca o producto que se compra; "online" si es un servicio, web o SaaS sin ubicación física); ' +
            'city (solo si kind es "local" y la conoces; si no, cadena vacía); ' +
            'website (dominio si lo conoces; si no, cadena vacía).',
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
