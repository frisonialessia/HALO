import type { Project, ProbeResult } from "@/types";
import { buildProbe } from "./detect";

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
      max_tokens: 600,
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

  return buildProbe({
    engine: "perplexity",
    project,
    query,
    zone,
    answer,
    citations: data.citations ?? [],
    raw: data,
  });
}
