import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/ratelimit";
import { generateAssets } from "@/lib/engines/assets";

// POST /api/assets — convierte el diagnóstico en acción.
// A partir del negocio (y de las búsquedas donde no aparece) genera texto
// optimizado para IA listo para publicar. Endpoint público y de pago, así
// que va detrás del mismo rate-limit que el resto.

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const AssetsRequest = z.object({
  name: z.string().trim().min(1, "El nombre del negocio es obligatorio"),
  business_type: z.string().trim().min(1, "El tipo de negocio es obligatorio"),
  city: z.string().trim().optional(),
  website: z.string().trim().optional(),
  missedQueries: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req.headers);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = AssetsRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  try {
    const assets = await generateAssets(parsed.data);
    return NextResponse.json(assets);
  } catch (err) {
    console.error("Error en /api/assets:", err);
    return NextResponse.json(
      { error: "No pudimos generar el texto. Inténtalo de nuevo." },
      { status: 502 }
    );
  }
}
