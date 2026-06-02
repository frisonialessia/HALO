import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit } from "@/lib/ratelimit";
import { chatReply, type ChatTurn, type ChatBusiness } from "@/lib/engines/chat";

// POST /api/chat — chat REAL del asistente Halo (LLM). Responde preguntas
// libres sobre AEO/GEO/LLMO y, si llega contexto del negocio, sobre sus datos.
// Si no hay proveedor configurado o falla, el cliente cae a respuestas locales.

export const runtime = "nodejs";
export const maxDuration = 30;
export const dynamic = "force-dynamic";

const ChatRequest = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "model"]),
        content: z.string().trim().min(1).max(2000),
      })
    )
    .min(1)
    .max(20),
  lang: z.enum(["en", "es"]).optional(),
  business: z.record(z.string(), z.unknown()).optional(),
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

  const parsed = ChatRequest.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const lang = parsed.data.lang ?? "en";
  try {
    const reply = await chatReply(
      parsed.data.messages as ChatTurn[],
      lang,
      parsed.data.business as ChatBusiness | undefined
    );
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("[chat] failed:", err);
    return NextResponse.json({ error: "chat failed" }, { status: 502 });
  }
}
