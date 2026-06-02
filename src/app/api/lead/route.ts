import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabasePublic } from "@/lib/db/supabase";

// POST /api/lead — registra el email de quien prueba la herramienta (funnel).
// Inserta en la tabla `leads` con la publishable key (RLS de solo-insert), sin
// necesidad de service role key. Si Supabase aún no está configurado o el
// insert falla, devolvemos ok igualmente para NO bloquear la entrega de valor
// (el email queda guardado en el navegador y se reintenta en visitas futuras).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LeadRequest = z.object({
  email: z.string().trim().email("Email no válido"),
  app: z.string().trim().min(1).default("halo"),
  context: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = LeadRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();

  try {
    const sb = supabasePublic();
    const { error } = await sb.from("leads").upsert(
      { email, app: parsed.data.app, context: parsed.data.context ?? {} },
      { onConflict: "email,app", ignoreDuplicates: true }
    );
    if (error) {
      console.error("Lead insert error:", error.message);
      return NextResponse.json({ ok: true, stored: false });
    }
    return NextResponse.json({ ok: true, stored: true });
  } catch (e) {
    // Supabase no configurado todavía: no rompemos la experiencia.
    console.warn(
      "Lead no almacenado (¿faltan envs de Supabase?):",
      e instanceof Error ? e.message : e
    );
    return NextResponse.json({ ok: true, stored: false });
  }
}
