import type { Project, ProbeResult, AuditResult } from "@/types";
import { buildQueries } from "@/lib/queries";
import { probePerplexity } from "@/lib/engines/perplexity";

// Orquesta una auditoría completa de un negocio.
// Fase 1: solo Perplexity. Cuando se añadan más motores,
// se agregan aquí y el Share of Answer se promedia entre todos.

export async function runAudit(project: Project): Promise<AuditResult> {
  const queries = buildQueries(project);

  // Corre todas las queries en paralelo contra Perplexity.
  // (Con más motores, se hace un producto queries × motores.)
  const settled = await Promise.allSettled(
    queries.map((q) => probePerplexity(project, q))
  );

  const probes: ProbeResult[] = settled
    .filter((s): s is PromiseFulfilledResult<ProbeResult> => s.status === "fulfilled")
    .map((s) => s.value);

  const appearedCount = probes.filter((p) => p.appeared).length;
  const total = probes.length || 1;
  const shareOfAnswer = appearedCount / total; // 0.30 = "3 de 10"

  // Share of Answer por motor (ahora solo perplexity).
  const byEngine: Record<string, number> = {};
  for (const engine of new Set(probes.map((p) => p.engine))) {
    const subset = probes.filter((p) => p.engine === engine);
    const appeared = subset.filter((p) => p.appeared).length;
    byEngine[engine] = appeared / (subset.length || 1);
  }

  return { shareOfAnswer, byEngine, probes };
}
