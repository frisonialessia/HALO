# Halo

SaaS de **AEO · LLMO · Local Intelligence**: mide y mejora cómo los motores
de IA (ChatGPT, Perplexity, Gemini, Claude…) recomiendan tu negocio.

## Stack
- **Next.js 14** + **TypeScript** (frontend + API en un solo repo)
- **Supabase** (PostgreSQL + Auth + RLS)
- **Vercel AI SDK** para los agentes
- **Tailwind** para estilos
- Despliegue en **Vercel**

## Puesta en marcha (local)

1. Instala dependencias:
   ```bash
   npm install
   ```

2. Copia las variables de entorno y rellénalas:
   ```bash
   cp .env.example .env.local
   ```
   Necesitas como mínimo una `PERPLEXITY_API_KEY` para la Fase 1.

3. Crea la base de datos: en tu proyecto de Supabase, ejecuta el SQL de
   `supabase/migrations/0001_init.sql` en el editor SQL.

4. Arranca:
   ```bash
   npm run dev
   ```

## Probar el motor (Fase 1)

Con el servidor corriendo, dispara una auditoría real:

```bash
curl -X POST http://localhost:3000/api/audit \
  -H "Content-Type: application/json" \
  -d '{"name":"Trattoria Bella","business_type":"restaurante italiano","city":"Milán"}'
```

Devuelve el `shareOfAnswer` (el "3 de 10") medido de verdad contra Perplexity.

## Despliegue en Vercel

1. Sube este repo a GitHub.
2. En Vercel, importa el repo (detecta Next.js automáticamente).
3. Añade las variables de entorno (las mismas de `.env.local`).
4. Cada push a `main` se despliega solo.

## Estructura

```
src/
  app/api/audit/route.ts   ← endpoint que dispara una auditoría
  lib/
    queries.ts             ← genera las "probe queries" por sector
    audit.ts               ← orquesta la auditoría y calcula Share of Answer
    engines/perplexity.ts  ← consulta a Perplexity y analiza si apareces
    db/supabase.ts         ← cliente de base de datos
  types/index.ts           ← tipos compartidos
supabase/migrations/       ← esquema SQL (tablas + RLS)
```

## Roadmap del cerebro
- [x] Motor 1 — Medición: Perplexity (este código)
- [ ] Multi-motor: ChatGPT, Gemini, Claude vía router
- [ ] Cola en background (Inngest) para auditorías largas
- [ ] Motor 2 — Local Intelligence (queries por zona)
- [ ] Motor 3 — Mejora (genera Schema/FAQ/descripciones)
