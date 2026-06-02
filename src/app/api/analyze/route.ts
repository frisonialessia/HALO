import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { identifyBusiness, toProject } from "@/lib/engines/identify";
import { runAudit } from "@/lib/audit";
import { enforceRateLimit } from "@/lib/ratelimit";
import { cacheKey, getCached, setCached } from "@/lib/cache";

// POST /api/analyze  — entrada pública de la landing.
// Recibe lo que el usuario pega (web, nombre, Google Maps…), identifica el
// negocio con IA y lanza la auditoría real. Devuelve el negocio detectado
// + el Share of Answer real.
//
// Nota: las consultas corren en paralelo, así que identificar + auditar
// cabe de sobra en maxDuration. Protegido con rate-limit (cada llamada
// gasta ~11 peticiones a Perplexity).

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const AnalyzeRequest = z.object({
  input: z.string().trim().min(2, "Paste your website, your name or your Google Maps"),
  lang: z.enum(["en", "es"]).optional(),
});

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req.headers);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = AnalyzeRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid data" },
      { status: 400 }
    );
  }

  const lang = parsed.data.lang ?? "en";
  // Caché global: si ese negocio ya se analizó hace poco, lo servimos sin pagar.
  // El idioma forma parte de la clave: EN y ES generan contenido distinto.
  const key = cacheKey("analyze", `${lang}|${parsed.data.input}`);
  const hit = await getCached<{ business: unknown }>(key);
  if (hit) return NextResponse.json(hit);

  let business;
  try {
    business = await identifyBusiness(parsed.data.input, lang);
  } catch {
    // La IA no reconoció el negocio (nuevo, pequeño o sin presencia online).
    // No es un error: la landing pedirá los datos a mano y medimos igual.
    return NextResponse.json({ needManual: true });
  }

  try {
    const result = await runAudit(toProject(business), lang);
    const payload = { business, ...result };
    await setCached(key, payload);
    return NextResponse.json(payload);
  } catch (err) {
    console.error("Error en /api/analyze:", err);
    return NextResponse.json(
      {
        error:
          lang === "es"
            ? "No pudimos analizar ese negocio. Prueba con tu web o tu nombre."
            : "We couldn't analyze that business. Try your website or your name.",
      },
      { status: 502 }
    );
  }
}
