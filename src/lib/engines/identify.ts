import type { Project } from "@/types";

// Identifica un negocio a partir de lo que el usuario pega en la landing:
// una URL, un nombre, un enlace de Google Maps o un perfil de redes.
// Usa Perplexity (web-grounded) para devolver los datos estructurados que
// el motor de auditoría necesita. Así la landing mantiene UN solo campo.

const PPLX_URL = "https://api.perplexity.ai/chat/completions";

export interface IdentifiedBusiness {
  name: string;
  business_type: string;
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
            "Identificas un negocio local a partir de lo que te da el usuario " +
            "(una web, un nombre, un enlace de Google Maps o de redes sociales). " +
            "Devuelve SOLO un objeto JSON válido, sin texto alrededor ni markdown, con estas claves: " +
            'name (nombre del negocio), business_type (tipo en español, ej. "restaurante italiano"), ' +
            "city (ciudad si la conoces, si no cadena vacía), website (dominio si lo conoces, si no cadena vacía).",
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

  return {
    name,
    business_type,
    city: String(parsed.city ?? "").trim() || undefined,
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
    city: b.city,
    website: b.website,
  };
}
