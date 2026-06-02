import { NextResponse } from "next/server";
import { supabasePublic } from "@/lib/db/supabase";

// Endpoint de verificación: confirma que la conexión a Supabase
// funciona leyendo la tabla "projects". Con la publishable key,
// la consulta respeta RLS — sin sesión activa devuelve una lista
// vacía sin error, lo cual ya prueba que el cliente conectó bien.
//
// GET /api/health/supabase
//   200 { ok: true,  count, sample }   conexión OK
//   500 { ok: false, error }           algo falló

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = supabasePublic();
    const { data, count, error } = await client
      .from("projects")
      .select("id, name, city, created_at", { count: "exact" })
      .limit(5);

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      count: count ?? 0,
      sample: data ?? [],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
