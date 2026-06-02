import { NextResponse } from "next/server";

// Endpoint de verificación: confirma que la conexión a Perplexity
// funciona haciendo UNA consulta mínima y barata. Sigue la regla del
// proyecto: verificar /api/health/* antes de construir encima.
//
// GET /api/health/perplexity
//   200 { ok: true,  model, sample, citations }   conexión OK
//   500 { ok: false, error }                       falta clave o falló la API

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PPLX_URL = "https://api.perplexity.ai/chat/completions";

export async function GET() {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "Falta PERPLEXITY_API_KEY" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(PPLX_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        // Consulta trivial y max_tokens bajo: solo queremos probar la conexión
        // gastando lo mínimo posible.
        messages: [{ role: "user", content: "Responde solo: ok" }],
        max_tokens: 5,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return NextResponse.json(
        { ok: false, error: `Perplexity ${res.status}: ${detail.slice(0, 200)}` },
        { status: 500 }
      );
    }

    const data = await res.json();
    const sample: string = data?.choices?.[0]?.message?.content ?? "";
    const citations: number = Array.isArray(data?.citations)
      ? data.citations.length
      : 0;

    return NextResponse.json({
      ok: true,
      model: "sonar",
      sample: sample.slice(0, 120),
      citations,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
