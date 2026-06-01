import type { Project, ProbeResult } from "@/types";

// Motor Perplexity — el más relevante para AEO porque busca en la web
// real y responde con citas de fuentes actuales. Su API es OpenAI-compatible.
// Docs: https://docs.perplexity.ai

const PPLX_URL = "https://api.perplexity.ai/chat/completions";

interface PerplexityResponse {
  choices: { message: { content: string } }[];
  citations?: string[];
}

// Pregunta una query a Perplexity y analiza si el negocio aparece.
export async function probePerplexity(
  project: Project,
  query: string,
  zone?: string
): Promise<ProbeResult> {
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
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente que recomienda negocios locales reales. " +
            "Responde como lo harías con un usuario normal, nombrando negocios concretos.",
        },
        { role: "user", content: query },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Perplexity error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as PerplexityResponse;
  const answer = data.choices?.[0]?.message?.content ?? "";

  return analyzeAnswer(project, query, zone, answer, data);
}

// Analiza la respuesta del motor: ¿apareció el negocio? ¿en qué posición?
// Versión inicial por coincidencia de nombre. Más adelante se puede
// reforzar con un LLM que juzgue aparición y sentimiento con más matiz.
function analyzeAnswer(
  project: Project,
  query: string,
  zone: string | undefined,
  answer: string,
  raw: PerplexityResponse
): ProbeResult {
  const haystack = answer.toLowerCase();
  const needle = project.name.toLowerCase();
  const appeared = haystack.includes(needle);

  let position: number | undefined;
  if (appeared) {
    // Posición aproximada: en qué lugar del texto se menciona primero.
    const idx = haystack.indexOf(needle);
    const before = answer.slice(0, idx);
    // Cuenta cuántos negocios (líneas numeradas o con guion) aparecen antes.
    const mentionsBefore = (before.match(/\n\s*\d+[\.\)]|\n\s*[-•]/g) || []).length;
    position = mentionsBefore + 1;
  }

  const citedUrl = project.website
    ? (raw.citations || []).some((c) =>
        c.toLowerCase().includes(stripUrl(project.website!))
      )
    : false;

  return {
    engine: "perplexity",
    query,
    zone,
    appeared,
    position,
    cited_url: citedUrl,
    raw_response: raw,
  };
}

function stripUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
}
