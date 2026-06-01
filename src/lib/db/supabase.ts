import { createClient } from "@supabase/supabase-js";

// Cliente de Supabase para uso en el servidor (API routes).
// Usa la service role key — NUNCA exponer esta clave en el frontend.

export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Faltan variables de Supabase");
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
