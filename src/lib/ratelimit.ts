import { NextResponse } from "next/server";

// Rate limiting para los endpoints públicos que gastan API de pago: cada
// análisis dispara ~11 llamadas a Perplexity, así que sin freno un visitante
// curioso (o un script) podría disparar la factura.
//
// Dos capas:
//   1. Por IP    — frena a quien machaca el botón desde un sitio.
//   2. Global    — cortafuegos de factura: tope total por hora, aunque la
//                  demanda venga repartida entre muchas IPs.
//
// IMPORTANTE: el estado vive en memoria del proceso. En Vercel (serverless)
// esto es "best-effort": hay varias instancias y se reinician en frío, así
// que NO es un límite distribuido perfecto. Cubre el caso real (un cliente
// que repite, una ráfaga) y pone un techo a la factura. Para un límite
// distribuido a prueba de balas, mover a Upstash Redis / Vercel KV.

type Window = { count: number; resetAt: number };

// --- Límite por IP -------------------------------------------------------
const IP_LIMIT = 10; // análisis por IP y ventana
const IP_WINDOW_MS = 10 * 60 * 1000; // 10 minutos
const ipWindows = new Map<string, Window>();

// --- Cortafuegos global --------------------------------------------------
const GLOBAL_LIMIT = 100; // análisis totales por ventana (≈1100 llamadas/h)
const GLOBAL_WINDOW_MS = 60 * 60 * 1000; // 1 hora
const globalWindow: Window = { count: 0, resetAt: 0 };

interface RateResult {
  ok: boolean;
  retryAfter?: number; // segundos hasta que se libera
  reason?: "ip" | "global";
}

// Saca la IP del cliente de las cabeceras que pone el proxy de Vercel.
function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}

// Cuenta un intento en la ventana y dice si cabe dentro del límite.
// Reinicia la ventana cuando ha expirado.
function hit(w: Window, limit: number, windowMs: number, now: number): boolean {
  if (now > w.resetAt) {
    w.count = 0;
    w.resetAt = now + windowMs;
  }
  w.count += 1;
  return w.count <= limit;
}

// Comprueba el límite y cuenta el intento. Mira primero la IP: así un abusador
// desde un único sitio se frena por su propio límite sin gastar el cupo global
// (que se reserva para demanda repartida).
function checkRateLimit(headers: Headers): RateResult {
  const now = Date.now();

  const ip = clientIp(headers);
  let w = ipWindows.get(ip);
  if (!w) {
    w = { count: 0, resetAt: now + IP_WINDOW_MS };
    ipWindows.set(ip, w);
  }
  if (!hit(w, IP_LIMIT, IP_WINDOW_MS, now)) {
    return { ok: false, reason: "ip", retryAfter: Math.ceil((w.resetAt - now) / 1000) };
  }

  // Solo suma al global lo que ya pasó el filtro por IP.
  if (!hit(globalWindow, GLOBAL_LIMIT, GLOBAL_WINDOW_MS, now)) {
    return {
      ok: false,
      reason: "global",
      retryAfter: Math.ceil((globalWindow.resetAt - now) / 1000),
    };
  }

  // Limpieza oportunista para que el Map no crezca sin fin.
  if (ipWindows.size > 5000) {
    for (const [k, v] of ipWindows) {
      if (now > v.resetAt) ipWindows.delete(k);
    }
  }

  return { ok: true };
}

// Úsalo al principio de un handler público: si se pasó del límite devuelve la
// respuesta 429 lista para retornar; si no, null y el handler sigue.
export function enforceRateLimit(headers: Headers): NextResponse | null {
  const rate = checkRateLimit(headers);
  if (rate.ok) return null;

  const msg =
    rate.reason === "global"
      ? "Estamos recibiendo muchísimos análisis ahora mismo. Prueba de nuevo en unos minutos."
      : "Has hecho varios análisis seguidos. Espera un momento y vuelve a intentarlo.";

  const init: ResponseInit = { status: 429 };
  if (rate.retryAfter) init.headers = { "Retry-After": String(rate.retryAfter) };
  return NextResponse.json({ error: msg }, init);
}
