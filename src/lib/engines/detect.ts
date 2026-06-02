import type { Engine, Project, ProbeResult } from "@/types";

// Lógica de detección de aparición compartida por TODOS los motores
// (Perplexity, ChatGPT, …). Vive aquí para que la medición sea idéntica
// entre motores y el Share of Answer sea comparable.
//
// Resuelve tres fuentes de error de un simple `includes`:
//   1. Tildes y mayúsculas:  "Trattoría" ≡ "trattoria".
//   2. Falsos positivos:     "Sol" NO coincide dentro de "girasol"
//      (exigimos límites de palabra).
//   3. Variantes con artículo: "La Bella" coincide aunque la IA escriba "Bella".

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
  const mentionsBefore = (before.match(/\n\s*\d+[.)]|\n\s*[-•*]/g) || []).length;
  return mentionsBefore + 1;
}

function stripUrl(url: string): string {
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
}

// Construye el ProbeResult a partir de la respuesta de cualquier motor:
// ¿apareció el negocio?, ¿en qué posición?, ¿citó su web?
export function buildProbe(opts: {
  engine: Engine;
  project: Project;
  query: string;
  zone?: string;
  answer: string;
  citations?: string[];
  raw?: unknown;
}): ProbeResult {
  const { engine, project, query, zone, answer, citations = [], raw } = opts;

  const appeared = nameAppears(answer, project.name);
  const position = appeared ? estimatePosition(answer, project.name) : undefined;

  const citedUrl = project.website
    ? citations.some((c) => c.toLowerCase().includes(stripUrl(project.website!)))
    : false;

  return {
    engine,
    query,
    zone,
    appeared,
    position,
    cited_url: citedUrl,
    raw_response: raw,
  };
}
