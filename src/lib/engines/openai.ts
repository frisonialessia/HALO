import type { Project, ProbeResult } from "@/types";
import { buildProbe } from "./detect";

// Motor ChatGPT (OpenAI). CLAVE: la API de OpenAI no navega la web por
// defecto, así que mediríamos su memoria de entrenamiento (desactualizada).
// Para reflejar lo que un usuario REAL ve en ChatGPT usamos la Responses API
// con la herramienta de búsqueda web — igual de "web-grounded" que Perplexity.
// Docs: https://platform.openai.com/docs/guides/tools-web-search

const OPENAI_URL = "https://api.openai.com/v1/responses";

// Modelo configurable: distintas cuentas tienen acceso a distintos modelos.
// Por defecto uno actual con búsqueda web; se cambia con OPENAI_MODEL sin tocar
// código. Debe ser un modelo que soporte la herramienta web_search.
const MODEL = process.env.OPENAI_MODEL || "gpt-5.5";

// Forma (parcial) de la Responses API que nos interesa leer.
interface RespPart {
  type?: string;
  text?: string;
  annotations?: { url?: string }[];
}
interface RespItem {
  type?: string;
  content?: RespPart[];
}
interface OpenAIResponse {
  output_text?: string;
  output?: RespItem[];
}

// Pregunta una query a ChatGPT (con búsqueda web) y analiza si el negocio aparece.
export async function probeChatGPT(
  project: Project,
  query: string,
  zone?: string
): Promise<ProbeResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("Falta OPENAI_API_KEY");

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      // Mismo "rol" que en Perplexity para que la comparación sea justa.
      instructions:
        "Eres un asistente que recomienda negocios locales reales. " +
        "Responde como lo harías con un usuario normal, nombrando negocios concretos.",
      input: query,
      max_output_tokens: 700,
      tools: [{ type: "web_search" }],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as OpenAIResponse;
  const answer = extractText(data);
  const citations = extractCitations(data);

  return buildProbe({
    engine: "chatgpt",
    project,
    query,
    zone,
    answer,
    citations,
  });
}

// La Responses API devuelve un array `output`; el texto del asistente va en
// los bloques `output_text` del item de tipo mensaje.
function extractText(data: OpenAIResponse): string {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }
  let text = "";
  for (const item of data.output ?? []) {
    for (const part of item.content ?? []) {
      if (typeof part.text === "string") text += part.text + "\n";
    }
  }
  return text;
}

// Las citas vienen como anotaciones url_citation dentro de cada bloque de texto.
function extractCitations(data: OpenAIResponse): string[] {
  const urls: string[] = [];
  for (const item of data.output ?? []) {
    for (const part of item.content ?? []) {
      for (const a of part.annotations ?? []) {
        if (a?.url) urls.push(a.url);
      }
    }
  }
  return urls;
}
