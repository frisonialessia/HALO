import { supabasePublic } from "@/lib/db/supabase";

// Caché global de auditorías en Supabase: si alguien ya analizó un negocio en
// los últimos días, se sirve de aquí → la API de pago se ejecuta UNA sola vez.
// Fail-soft: si Supabase no está configurado o falla, devolvemos null / no-op
// y el flujo sigue normal (se analiza en vivo).

const TTL_MS = (Number(process.env.HALO_CACHE_TTL_DAYS) || 7) * 24 * 60 * 60 * 1000;

// Clave normalizada: minúsculas, sin protocolo/www, espacios colapsados, para
// que "https://x.com", "www.x.com" y "X.com " caigan en la misma entrada.
export function cacheKey(prefix: string, raw: string): string {
  const norm = raw
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\s+/g, " ");
  return `${prefix}:${norm}`;
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const sb = supabasePublic();
    const { data, error } = await sb
      .from("audit_cache")
      .select("data, created_at")
      .eq("cache_key", key)
      .maybeSingle();
    if (error || !data) return null;
    const age = Date.now() - new Date(data.created_at as string).getTime();
    if (age > TTL_MS) return null;
    return (data.data ?? null) as T | null;
  } catch {
    return null;
  }
}

export async function setCached(key: string, value: unknown): Promise<void> {
  try {
    const sb = supabasePublic();
    await sb.from("audit_cache").upsert(
      { cache_key: key, data: value, created_at: new Date().toISOString() },
      { onConflict: "cache_key" }
    );
  } catch {
    /* fail-soft: no romper el análisis si la caché falla */
  }
}
