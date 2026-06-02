-- ============================================================
-- Halo — Caché global de auditorías
-- Si un negocio ya se analizó hace poco, se sirve de aquí en vez de re-pagar
-- la API: el primer usuario paga, el resto (y las re-visitas) ven datos reales
-- a coste 0 durante el TTL. Datos NO sensibles (visibilidad pública de
-- negocios), así que lectura/escritura con la publishable key (sin service
-- role). Endurecible luego: mover escrituras a service role.
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_cache (
    cache_key   TEXT PRIMARY KEY,
    data        JSONB NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_cache_created ON audit_cache (created_at DESC);

ALTER TABLE audit_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read cache" ON audit_cache
    FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public write cache" ON audit_cache
    FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "public update cache" ON audit_cache
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
