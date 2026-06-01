-- ============================================================
-- Halo — Esquema inicial de la base de datos (PostgreSQL/Supabase)
-- Las tres patas: AEO (medir), LLMO (mejorar), Local Intelligence (zonas)
-- ============================================================

-- Negocios que el usuario quiere posicionar
CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,              -- "Trattoria Bella"
    business_type   TEXT NOT NULL,              -- "restaurante italiano"
    city            TEXT,                       -- "Milán"
    website         TEXT,
    google_maps_url TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cada vez que medimos el negocio contra los motores
CREATE TABLE audits (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status          TEXT NOT NULL DEFAULT 'pending', -- pending|running|done|failed
    share_of_answer NUMERIC,                    -- el "3 de 10" = 0.30
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at     TIMESTAMPTZ
);

-- El corazón del cerebro: cada pregunta probada contra cada motor
CREATE TABLE probe_results (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id        UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    engine          TEXT NOT NULL,              -- 'perplexity','chatgpt'...
    query           TEXT NOT NULL,              -- "mejor pasta en Brera"
    zone            TEXT,                       -- barrio (Local Intelligence)
    appeared        BOOLEAN NOT NULL,
    position        SMALLINT,
    sentiment       TEXT,
    cited_url       BOOLEAN DEFAULT false,
    raw_response    JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audits_project   ON audits(project_id, created_at DESC);
CREATE INDEX idx_probe_audit      ON probe_results(audit_id);
CREATE INDEX idx_probe_engine     ON probe_results(project_id, engine, created_at DESC);

-- ============================================================
-- Row Level Security: cada usuario solo ve SUS negocios
-- ============================================================
ALTER TABLE projects      ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits        ENABLE ROW LEVEL SECURITY;
ALTER TABLE probe_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own projects" ON projects
    FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "own audits" ON audits
    FOR ALL USING (
        project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
    );

CREATE POLICY "own probes" ON probe_results
    FOR ALL USING (
        project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
    );
