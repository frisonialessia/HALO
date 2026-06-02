-- ============================================================
-- Halo — Captura de leads (emails) del funnel de la SaaS Factory
-- Tabla pública de SOLO-INSERT: el frontend (publishable key) puede
-- registrar un email, pero NADIE puede leer los leads sin la service
-- role key (lecturas server-side / dashboard). Así el email-gate del
-- generador de textos alimenta el funnel sin exponer la lista.
-- ============================================================

CREATE TABLE IF NOT EXISTS leads (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT NOT NULL,
    app         TEXT NOT NULL DEFAULT 'halo',   -- 'halo' | 'vantix' | ...
    context     JSONB,                          -- { business, score, source, utm }
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Un lead por email y app (el email se guarda normalizado en minúsculas).
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_email_app ON leads (email, app);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at DESC);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Cualquiera (clave publishable/anon) puede ENVIAR su email; nadie puede LEER.
-- Las lecturas se hacen server-side con la service role key (ignora RLS).
CREATE POLICY "anyone can submit a lead" ON leads
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        char_length(email) BETWEEN 3 AND 320
        AND position('@' IN email) > 1
    );
