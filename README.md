# Halo

**AI‑visibility (AEO) tool.** Halo measures how often AI search engines —
ChatGPT, Perplexity, Gemini, Claude, Grok and more — recommend a business when a
customer asks *"what's the best…?"*, and turns it into an action plan and
ready‑to‑publish copy.

> Paste a website, a name or a Google Maps link → in seconds you get your score
> out of 10, the searches you win or miss, who the AI recommends instead, and the
> optimized text to fix it. **No sign‑up. Bilingual (EN/ES).**

🔗 **Live demo:** https://halo-nu-three.vercel.app · 📄 **Docs:**
[Executive summary](./docs/EXECUTIVE_SUMMARY.md) ·
[Master technical doc](./docs/MASTER.md)

---

## What it does

1. **Identifies** the business from whatever you paste (URL, brand, name, maps),
   using an LLM — no forms.
2. **Measures** real presence by asking the AI engines what a customer would,
   then detecting whether you appear, where you rank, and **who the AI
   recommends instead** (real competitors).
3. **Delivers** the plan + an AI‑generated kit (optimized description, FAQ,
   schema.org, actions) ready to paste into your site and Google profile.

Plus a **real LLM assistant** that answers questions about AEO and your own
results — in your language.

## Stack

- **Next.js 14** (App Router) · **TypeScript** · **React 18** · hand‑written CSS
- **Zod** for validation · **Supabase** (optional cache + leads, fail‑soft)
- Provider‑agnostic **LLM layer** (Gemini, Perplexity, OpenAI, Anthropic, xAI,
  DeepSeek) called directly over REST
- Deployed on **Vercel** (auto‑deploy from `main`)

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
```

The app **builds and runs with zero env vars** (everything degrades gracefully).
For real analysis, add at least a Google Gemini key:

```bash
# .env.local
GEMINI_API_KEY=...            # the real engine (free tier) — recommended
# optional extras:
# PERPLEXITY_API_KEY=...  OPENAI_API_KEY=...  ANTHROPIC_API_KEY=...
# XAI_API_KEY=...  DEEPSEEK_API_KEY=...
# HALO_PROBE_COUNT=6           # fewer probes per analysis (rate/cost control)
# NEXT_PUBLIC_SUPABASE_URL=...  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...  SUPABASE_SERVICE_ROLE_KEY=...
```

Without any key, the demo runs in a personalized **simulation** so it never
shows a blank state.

## How the real analysis works

`POST /api/analyze { input, lang }` → identify → build probe queries → ask the
engine(s) in parallel → detect appearance/position → Share of Answer (**X/10**)
→ extract competitors from the answers → (on demand) generate the kit.

See [`docs/MASTER.md`](./docs/MASTER.md) for the full architecture, the
multi‑provider/resilience design, the demo's real‑vs‑simulated split, i18n, and
deployment notes.

## Demo note

This is a free, public, **building‑in‑public** demo — not a monetized product.
Real measurement runs on **Gemini**; the report showcases **8 AI engines**
(Gemini real, the rest deterministic estimates) to convey multi‑AI coverage
without seven paid keys. Adding a provider's API key makes that engine real.

## Deploy

Push to `main` → Vercel builds and deploys automatically (Next.js auto‑detected).
Add your env vars in the project settings; they apply on the next deploy.
