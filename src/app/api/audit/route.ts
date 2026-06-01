import { NextRequest, NextResponse } from "next/server";
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const project: Project = {
      id: body.id ?? "temp",
      name: body.name,
      business_type: body.business_type,
      city: body.city,
      website: body.website,
    };

    if (!project.name || !project.business_type) {
      return NextResponse.json(
        { error: "Faltan datos: name y business_type son obligatorios" },
        { status: 400 }
      );
    }

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
