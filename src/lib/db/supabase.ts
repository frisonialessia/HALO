import { createClient } from "@supabase/supabase-js";

// Cliente público (publishable key). Seguro de exponer en el navegador
// — respeta las Row Level Security policies del proyecto.
// Para auditorías server-side sin RLS, usar supabaseAdmin().
export function supabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// Cliente admin (service role) — solo para API routes server-side
// que necesiten saltarse RLS. NUNCA exponer en el frontend.
// Requiere SUPABASE_SERVICE_ROLE_KEY configurada en el entorno.
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
