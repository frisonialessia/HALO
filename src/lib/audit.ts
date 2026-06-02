import type { Project, ProbeResult, AuditResult, Engine } from "@/types";
import { buildQueries } from "@/lib/queries";
import { probePerplexity } from "@/lib/engines/perplexity";
import { probeChatGPT } from "@/lib/engines/openai";
import { probeGemini } from "@/lib/engines/gemini";

// Orquesta una auditoría completa de un negocio sobre TODOS los motores
// disponibles. El Share of Answer se promedia entre los resultados de todos.

type EngineProbe = (project: Project, query: string) => Promise<ProbeResult>;

// Motores activos según las claves configuradas. Añadir un motor nuevo es:
// implementar su `probe` y sumarlo aquí — se activa solo cuando existe su key,
// así que basta con poner la variable de entorno (p. ej. OPENAI_API_KEY) para
// que ChatGPT entre en la medición, sin tocar más código.
function activeEngines(): { engine: Engine; probe: EngineProbe }[] {
  const list: { engine: Engine; probe: EngineProbe }[] = [];
  if (process.env.PERPLEXITY_API_KEY)
    list.push({ engine: "perplexity", probe: probePerplexity });
  if (process.env.OPENAI_API_KEY)
    list.push({ engine: "chatgpt", probe: probeChatGPT });
  if (process.env.GEMINI_API_KEY)
    list.push({ engine: "gemini", probe: probeGemini });

  // Si no hay ninguna clave, intentamos Perplexity igual: lanzará un error
  // claro ("Falta PERPLEXITY_API_KEY") en lugar de devolver vacío en silencio.
  if (list.length === 0)
    list.push({ engine: "perplexity", probe: probePerplexity });

  return list;
}

export async function runAudit(project: Project): Promise<AuditResult> {
  const queries = buildQueries(project);
  const engines = activeEngines();

  // Producto queries × motores, todo en paralelo.
  const tasks = queries.flatMap((q) => engines.map((e) => e.probe(project, q)));
  const settled = await Promise.allSettled(tasks);

  const probes: ProbeResult[] = settled
    .filter((s): s is PromiseFulfilledResult<ProbeResult> => s.status === "fulfilled")
    .map((s) => s.value);

  const appearedCount = probes.filter((p) => p.appeared).length;
  const total = probes.length || 1;
  const shareOfAnswer = appearedCount / total; // 0.30 = "3 de 10"

  // Share of Answer por motor.
  const byEngine: Record<string, number> = {};
  for (const engine of new Set(probes.map((p) => p.engine))) {
    const subset = probes.filter((p) => p.engine === engine);
    const appeared = subset.filter((p) => p.appeared).length;
    byEngine[engine] = appeared / (subset.length || 1);
  }

  return { shareOfAnswer, byEngine, probes };
}
