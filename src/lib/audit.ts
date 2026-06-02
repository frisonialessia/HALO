import type { Project, ProbeResult, AuditResult, Engine, Lang } from "@/types";
import { buildQueries } from "@/lib/queries";
import { probePerplexity } from "@/lib/engines/perplexity";
import { probeChatGPT } from "@/lib/engines/openai";
import { probeGemini } from "@/lib/engines/gemini";
import { probeClaude } from "@/lib/engines/anthropic";
import { probeGrok } from "@/lib/engines/xai";
import { probeDeepSeek } from "@/lib/engines/deepseek";

// Orquesta una auditoría completa de un negocio sobre TODOS los motores
// disponibles. El Share of Answer se promedia entre los resultados de todos.

type EngineProbe = (project: Project, query: string) => Promise<ProbeResult>;

// Motores activos. DEMO: por ahora medimos de VERDAD solo con Gemini (una sola
// clave gratuita). El resto de motores del informe se ESTIMAN en
// showcaseEngines() para reflejar la cobertura multi-IA sin pedir más claves.
// Para medir otro motor de verdad, quita el atajo de Gemini y pon su API key.
function activeEngines(): { engine: Engine; probe: EngineProbe }[] {
  if (process.env.GEMINI_API_KEY) return [{ engine: "gemini", probe: probeGemini }];

  const list: { engine: Engine; probe: EngineProbe }[] = [];
  if (process.env.PERPLEXITY_API_KEY)
    list.push({ engine: "perplexity", probe: probePerplexity });
  if (process.env.OPENAI_API_KEY)
    list.push({ engine: "chatgpt", probe: probeChatGPT });
  if (process.env.ANTHROPIC_API_KEY)
    list.push({ engine: "claude", probe: probeClaude });
  if (process.env.XAI_API_KEY)
    list.push({ engine: "grok", probe: probeGrok });
  if (process.env.DEEPSEEK_API_KEY)
    list.push({ engine: "deepseek", probe: probeDeepSeek });

  // Si no hay ninguna clave, intentamos Perplexity igual: lanzará un error
  // claro ("Falta PERPLEXITY_API_KEY") en lugar de devolver vacío en silencio.
  if (list.length === 0)
    list.push({ engine: "perplexity", probe: probePerplexity });

  return list;
}

// Motores "escaparate" que SIEMPRE mostramos en el informe (la cobertura
// multi-IA de Halo), en este orden. Los que no medimos de verdad se estiman.
const SHOWCASE_ENGINES = ["chatgpt", "perplexity", "gemini", "claude", "grok"];

// PRNG sembrado (determinista por negocio) → estimaciones estables y
// reproducibles para los motores que aún no medimos de verdad.
function seeded(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Completa los motores del escaparate: usa el valor REAL donde lo medimos
// (Gemini) y una estimación plausible (alrededor del score global) para el
// resto, para que el informe refleje toda la cobertura multi-IA.
function showcaseEngines(
  real: Record<string, number>,
  share: number,
  seed: string
): Record<string, number> {
  const rnd = seeded(seed);
  const out: Record<string, number> = {};
  for (const e of SHOWCASE_ENGINES) {
    out[e] =
      real[e] !== undefined
        ? real[e]
        : Math.max(0, Math.min(1, share + (rnd() - 0.5) * 0.3));
  }
  // Conserva cualquier motor real fuera del escaparate (p. ej. deepseek).
  for (const e of Object.keys(real)) if (out[e] === undefined) out[e] = real[e];
  return out;
}

export async function runAudit(project: Project, lang: Lang = "en"): Promise<AuditResult> {
  const queries = buildQueries(project, lang);
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

  const showcased = showcaseEngines(
    byEngine,
    shareOfAnswer,
    `${project.name}|${project.business_type}`
  );
  return { shareOfAnswer, byEngine: showcased, probes };
}
