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

// ---------------------------------------------------------------------------
// Detección de aparición — más precisa que un simple `includes`.
// Resuelve tres fuentes de error de la versión anterior:
//   1. Tildes y mayúsculas:  "Trattoría" ≡ "trattoria".
//   2. Falsos positivos:     un negocio "Sol" YA NO coincide dentro de
//      "girasol" (exigimos límites de palabra).
//   3. Variantes con artículo: "La Bella" coincide aunque la IA escriba "Bella".
// ---------------------------------------------------------------------------

// minúsculas + sin tildes + sin puntuación + espacios colapsados.
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Quita un artículo inicial común (es/it/en) para obtener una variante "núcleo".
function stripLeadingArticle(name: string): string {
  return name.replace(/^(el|la|los|las|the|il|lo|le|l)\s+/i, "").trim();
}

// ¿El nombre aparece como palabra(s) completa(s) dentro de la respuesta?
function nameAppears(answer: string, name: string): boolean {
  const hay = normalize(answer);

  const candidates = new Set<string>();
  const base = normalize(name);
  if (base) candidates.add(base);
  const core = normalize(stripLeadingArticle(name));
  if (core && core.length >= 3) candidates.add(core);

  for (const needle of candidates) {
    if (!needle) continue;
    // límites de palabra sobre texto ya normalizado (solo [a-z0-9 ]).
    const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(needle)}([^a-z0-9]|$)`);
    if (re.test(hay)) return true;
  }
  return false;
}

// Posición aproximada: en qué puesto de la lista se menciona primero el negocio.
function estimatePosition(answer: string, name: string): number {
  const soft = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const idx = soft(answer).indexOf(soft(stripLeadingArticle(name)));
  if (idx < 0) return 1;
  const before = answer.slice(0, idx);
  // cuenta cuántos elementos de lista (numerados o con viñeta) hay antes.
  const mentionsBefore = (before.match(/\n\s*\d+[.)]|\n\s*[-•*]/g) || []).length;
  return mentionsBefore + 1;
}

// Analiza la respuesta del motor: ¿apareció el negocio? ¿en qué posición?
// ¿citó su web? Más adelante se puede reforzar con un LLM juez para el
// sentimiento y una aparición con más matiz.
function analyzeAnswer(
  project: Project,
  query: string,
  zone: string | undefined,
  answer: string,
  raw: PerplexityResponse
): ProbeResult {
  const appeared = nameAppears(answer, project.name);
  const position = appeared ? estimatePosition(answer, project.name) : undefined;

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
