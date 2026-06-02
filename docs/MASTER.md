# Halo — Master Technical Document

The complete picture: what Halo is, how it's built, the decisions and
trade‑offs behind it, and what's real vs. simulated. Written to be read by an
engineer who has never seen the repo.

---

## 1. Concept

Halo measures and improves a business's visibility in **AI search** (AEO / GEO /
LLMO). The user pastes anything that identifies their business; Halo identifies
it, asks the AI engines what a customer would ask, and reports how often the
business is recommended — plus the action plan and copy to improve it.

Three pillars, surfaced throughout the product:

- **AEO — Answer Engine Optimization:** appearing in the AI's answer.
- **LLMO — Large Language Model Optimization:** how models understand/describe
  the business.
- **Local Intelligence:** visibility by area (queries can carry a location).

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 14.2** (App Router, RSC + client components) |
| Language | **TypeScript 5.5** (~5.9k LOC across 33 files) |
| UI | **React 18**, single client component tree, **hand‑written CSS** (`globals.css`) — no UI kit |
| Validation | **Zod** (all API route bodies) |
| LLM access | Direct `fetch` to provider REST APIs (provider‑agnostic layer) |
| Persistence | **Supabase** (Postgres) for an optional global cache + lead capture — *fail‑soft* |
| Analytics | `@vercel/analytics` |
| Hosting | **Vercel** (serverless functions, auto‑deploy from GitHub `main`) |

Everything — landing, app, and API — lives in **one repo, one deploy**.

## 3. Architecture

```
                          ┌────────────────────────────┐
  Browser (one client     │  src/components/HaloApp.tsx │
  component tree)         │  landing · report · chat   │
                          │  dashboard · settings · i18n│
                          └───────────┬────────────────┘
                                      │ fetch (JSON, with `lang`)
            ┌─────────────────────────┼───────────────────────────┐
            ▼                         ▼                            ▼
   /api/analyze              /api/audit                    /api/chat   /api/assets
   identify + measure        measure (manual data)         LLM chat     kit copy
            │                         │                        │            │
            ▼                         ▼                        ▼            ▼
        ┌───────────────────────── src/lib ─────────────────────────────────┐
        │ identify.ts  queries.ts  audit.ts  detect.ts  chat.ts  assets.ts   │
        │ engines/{gemini,perplexity,openai,anthropic,xai,deepseek}.ts       │
        │ cache.ts (Supabase, fail‑soft)   mock.ts (client preview/fallback) │
        └────────────────────────────────────────────────────────────────────┘
```

### Request flow (the real analysis)

1. User pastes input on the landing → client `POST /api/analyze { input, lang }`.
2. **Identify** (`engines/identify.ts`): an LLM returns structured JSON —
   `name`, `business_type` (in the chosen language), `kind`
   (`local` | `product` | `online`), `city`, `website`.
3. **Build queries** (`queries.ts`): generate ~10 realistic "probe queries" in
   the chosen language, tailored to `kind` (e.g. `"best Italian restaurant in
   Madrid"`, `"where to buy <product>"`).
4. **Audit** (`audit.ts`): run every query against the active engine(s) in
   parallel (`Promise.allSettled`). Each probe (`engines/*.ts`) asks the engine
   and returns the answer text.
5. **Detect** (`detect.ts`): for each answer, decide whether the business
   *appears*, estimate its *position*, and capture the answer snippet + any
   cited URLs.
6. **Score:** Share of Answer = appearances ÷ total probes → the "**X / 10**".
   Per‑engine breakdown is computed and then **showcased** (see §6).
7. **Competitors** (`extractCompetitors`, client): mine the answer texts for the
   businesses the AI names instead — ranked by mentions. Zero extra API cost.
8. **Kit** (`/api/assets`): on demand, an LLM writes an optimized description,
   FAQ and actions (plus a local schema.org block), focused on the *missed*
   searches.

If anything fails (no key, provider error, unrecognized input) the client
**falls back to a personalized simulation** (`mock.ts`) so the demo never
dead‑ends.

## 4. The multi‑provider LLM layer

A small, provider‑agnostic engine layer. Each provider is one file exposing a
`probe(project, query)` (for measurement) and, for identify/assets/chat, a
dedicated call. Providers are selected by which API key is present:

- `gemini.ts` (Google, grounded with Google Search) — **the real engine**
- `perplexity.ts` (web‑grounded) · `openai.ts` (ChatGPT, web search tool)
- `anthropic.ts` (Claude) · `xai.ts` (Grok) · `deepseek.ts`

**Resilience:** `identify`, `assets` and `chat` prefer Gemini and
**transparently fall back to Perplexity** if Gemini errors (quota, model,
grounding). With two keys present, a hiccup in one never forces the simulation.
Every external call is wrapped so a failure degrades gracefully instead of
crashing a request.

## 5. The AI assistant (real chat)

`/api/chat` is a genuine LLM chat (Gemini, Perplexity fallback), not scripted
replies. A system prompt makes "Halo" an AEO assistant that:

- explains AEO / GEO / LLMO and what Halo does,
- answers about the user's **own** business using the real analysis (score,
  per‑engine, missed searches, competitors) passed as context,
- replies **strictly in the user's language**.

It keeps multi‑turn memory client‑side and **falls back to local heuristic
answers** if the provider is unavailable, so it always responds.

## 6. Demo philosophy — real vs. simulated (honest by design)

This is a **demo**, so the data surface is intentionally hybrid and clearly
reasoned:

- **Real:** business identification, the probe queries, the Gemini measurement
  (Share of Answer + which searches you win/miss), the extracted competitors,
  the generated kit, and the chat.
- **Simulated for showcase:** the report always presents **8 AI engines**
  (ChatGPT, Perplexity, Gemini, Claude, Grok, Copilot, DeepSeek, Meta AI).
  Gemini carries its **real** value; the rest are **deterministic estimates**
  around the real overall score (seeded per business, so they're stable and
  reproducible). This conveys the multi‑AI coverage without requiring seven
  paid keys. Flipping any to "real" is just adding its API key.
- **Instant preview / fallback** (`mock.ts`): a seeded, deterministic
  simulation used only when the real call can't run — the demo never shows a
  blank state.

## 7. Internationalization (EN/ES)

- A lightweight dictionary + React context (`lib/i18n.ts`) — **English default**,
  Spanish via a switch (hidden on mobile) and **auto‑detected** from the
  browser on first visit. Persisted in `localStorage`, synced to `<html lang>`.
- The whole UI reads from the dictionary; the **generated content is
  language‑aware too** — `lang` is threaded client → API → prompts/queries, so
  an English analysis produces English searches and copy (cache key includes the
  language so EN/ES never collide).

## 8. Notable implementation details

- **Frictionless:** "Analyze" runs the *real* analysis directly — no email gate,
  no fake‑preview‑first.
- **Shareable reports:** a Share button copies a `/?b=<business>` link; opening
  it auto‑runs the analysis for the recipient — a viral loop with no database.
- **Clean AI text:** light markdown (`**`, `*`, `` ` ``, `#`) is stripped from
  all model output before display.
- **Cost/rate control:** `HALO_PROBE_COUNT` caps probes per analysis; Supabase
  cache serves repeat lookups for free; per‑IP rate limiting on paid endpoints.
- **Responsive:** dedicated phone layout (≤600px) on top of tablet breakpoints;
  the engine grid reflows 4 → 3 → 2 columns.

## 9. Repository map

```
src/
  app/
    layout.tsx, page.tsx, globals.css        UI shell + all styling
    api/
      analyze/  identify + real audit (landing entry)
      audit/    audit from manual fields
      assets/   the "kit" generator
      chat/     real LLM assistant
      lead/     email capture · health/  provider/db health checks
  components/HaloApp.tsx                      the entire app (one client tree)
  lib/
    i18n.ts                                  EN/ES dictionary + context
    queries.ts                               probe‑query templates (per kind/lang)
    audit.ts                                 orchestration + Share of Answer + showcase
    cache.ts, db/supabase.ts                 fail‑soft global cache
    mock.ts                                  preview / fallback simulation
    text.ts, trend.ts, history.ts, prefs.ts, lead.ts, ratelimit.ts
    engines/
      detect.ts                              appearance + position detection
      identify.ts, assets.ts, chat.ts        LLM tasks (multi‑provider)
      gemini.ts perplexity.ts openai.ts anthropic.ts xai.ts deepseek.ts
  types/index.ts                             shared types (Project, ProbeResult, Lang…)
docs/                                        this document + the executive summary
```

## 10. Deployment & configuration

- Push to `main` → Vercel builds and deploys automatically. The app **builds
  with zero env vars** (all provider clients are lazy / fail‑soft).
- Runtime env (all optional except a provider key for real data):
  - **`GEMINI_API_KEY`** — the real engine (free tier). Recommended.
  - `PERPLEXITY_API_KEY` (fallback), `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`,
    `XAI_API_KEY`, `DEEPSEEK_API_KEY` — add to make those engines real.
  - `*_MODEL` overrides, `HALO_PROBE_COUNT`, `HALO_CACHE_TTL_DAYS`.
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
    `SUPABASE_SERVICE_ROLE_KEY` — enable cache + lead capture.

## 11. How it was built (building in public)

Shipped iteratively and AI‑assisted (built with Claude Code). Tight loop on
every change: **edit → `next build` (typecheck + lint) → commit → auto‑deploy**.
Roughly **46 commits** in the main build session. Design bias toward **graceful
degradation** everywhere — missing key, dead provider, blocked clipboard, no
network — so the experience never breaks.

## 12. From demo to a fundable SaaS (what's intentionally not here)

Out of scope on purpose (it's a free demo), but the honest gap list:

- Accounts/auth, multi‑tenant, billing (Stripe).
- Background jobs/queue for long audits (today the audit is synchronous).
- Recurring monitoring + alerts (the "subscription" hook), real competitor
  tracking over time, citation/source analysis, statistical sampling (multiple
  runs per query for confidence).
- Integrations that *apply* the fixes (Google Business Profile, CMS) and
  re‑measure the lift.
