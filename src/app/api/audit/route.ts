import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runAudit } from "@/lib/audit";
import type { Project } from "@/types";

// POST /api/audit
// Recibe los datos del negocio y devuelve la medición real:
// el Share of Answer (el "3 de 10") y el detalle por query.
//
// Nota: esta versión corre la auditoría en la misma petición.
// Como puede tardar 30-90s, el siguiente paso del roadmap es
// moverla a una cola en background (Inngest) y devolver un ID
// que el frontend consulta. Por ahora, síncrono para validar.

// Corre en Node (no Edge) porque hacemos varias llamadas largas a la API
// de los motores. maxDuration evita el corte por defecto de Vercel: una
// auditoría de 10 queries en paralelo cabe de sobra en 60s.
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Validación del body con zod. name y business_type son obligatorios;
// el resto, opcional. website se normaliza a una URL razonable.
const AuditRequest = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "El nombre del negocio es obligatorio"),
  business_type: z.string().trim().min(1, "El tipo de negocio es obligatorio"),
  city: z.string().trim().optional(),
  website: z.string().trim().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = AuditRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 }
    );
  }

  const project: Project = {
    id: parsed.data.id ?? "temp",
    name: parsed.data.name,
    business_type: parsed.data.business_type,
    city: parsed.data.city,
    website: parsed.data.website,
  };

  try {
    const result = await runAudit(project);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error en auditoría:", err);
    return NextResponse.json(
      { error: "No se pudo completar la auditoría" },
      { status: 500 }
    );
  }
}
