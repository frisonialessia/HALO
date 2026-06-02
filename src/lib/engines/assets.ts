// Generador de "AI Assets": convierte el diagnóstico en acción. A partir de
// los datos del negocio (y de las búsquedas donde NO aparece) escribe texto
// listo para publicar que ayuda a que los asistentes de IA lo recomienden:
// una descripción optimizada, un bloque de FAQ y acciones concretas.
// Usa Perplexity (sonar) para mantener un solo proveedor y aprovechar que
// está conectado a la web real.

const PPLX_URL = "https://api.perplexity.ai/chat/completions";

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

export async function generateAssets(input: AssetsInput): Promise<AiAssets> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) throw new Error("Falta PERPLEXITY_API_KEY");

  const where = input.city ? ` en ${input.city}` : "";
  const missed = (input.missedQueries ?? []).filter(Boolean).slice(0, 6);
  const missedBlock = missed.length
    ? ` Hoy NO aparece cuando los clientes preguntan a la IA: ${missed
        .map((q) => `"${q}"`)
        .join(", ")}. Prioriza cubrir justo esas búsquedas.`
    : "";

  const res = await fetch(PPLX_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "sonar",
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content:
            "Eres un experto en AEO/GEO: optimizas negocios para que los asistentes " +
            "de IA (ChatGPT, Perplexity, Gemini) los recomienden a sus usuarios. " +
            "Escribes en español, concreto, sin relleno ni promesas vacías. " +
            "Devuelve SOLO un objeto JSON válido (sin markdown ni texto alrededor) " +
            "con estas claves exactas: " +
            "description (string: 50-70 palabras describiendo el negocio de forma que una IA lo cite con seguridad: qué es, dónde está y qué lo hace especial), " +
            "faqs (array de 5 objetos {q, a}: q es una pregunta tal y como un cliente se la haría a una IA; a es la respuesta de 1-2 frases que menciona el negocio con naturalidad), " +
            "tips (array de 3 strings: acciones concretas y realizables para mejorar su presencia en IA).",
        },
        {
          role: "user",
          content:
            `Negocio: ${input.name}. Tipo: ${input.business_type}${where}.` +
            (input.website ? ` Web: ${input.website}.` : "") +
            missedBlock,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Perplexity assets error ${res.status}`);

  const data = await res.json();
  const content: string = data?.choices?.[0]?.message?.content ?? "";
  return parseAssets(content);
}

// Perplexity a veces envuelve el JSON en prosa o en un bloque de código:
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

  const description =
    typeof obj.description === "string" ? obj.description.trim() : "";

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
