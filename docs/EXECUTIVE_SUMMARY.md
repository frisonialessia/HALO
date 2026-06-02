# Halo — Executive Summary

**Halo is an AI‑visibility (AEO) tool. It measures how often AI search engines —
ChatGPT, Perplexity, Gemini, Claude, Grok and more — recommend a business when a
customer asks "what's the best…?", and turns that into a clear action plan and
ready‑to‑publish copy.**

> Paste a website, a name or a Google Maps link → in seconds you see your score
> out of 10, which searches you win or miss, who the AI recommends instead, and
> the optimized text to fix it. No sign‑up. Bilingual (EN/ES).

---

## The problem

Search is moving from "ten blue links" to **a single AI answer**. When someone
asks ChatGPT or Gemini *"what's the best Italian restaurant near me?"*, ranking
#1 on Google no longer guarantees you're mentioned. A new discipline is
emerging to win that answer:

- **AEO — Answer Engine Optimization:** being *in the answer* the AI gives.
- **LLMO — Large Language Model Optimization:** making models understand and
  describe your business correctly.
- **Local Intelligence:** your visibility by area and neighborhood.

Most businesses have **zero visibility** into how they perform here. Halo gives
it to them.

## What Halo does

1. **Identifies the business** from whatever the user pastes (URL, brand, name,
   maps link) using an LLM — no forms.
2. **Measures real presence** by asking the AI engines the same questions a
   customer would, then detecting whether the business appears, where it ranks,
   and **who the AI recommends instead** (real competitors).
3. **Delivers the plan + the copy:** the searches to prioritize and an
   AI‑generated kit (optimized description, FAQ, schema.org, actions) ready to
   paste into a website and Google profile.

A built‑in **AI assistant** (a real LLM chat, not canned) answers questions
about AEO and about the user's own results, in their language.

## Why it lands

- **Frictionless & instant:** paste → real analysis in seconds, no email gate.
- **Concrete, not hype:** a number out of 10, the exact searches, the real
  competitors, and copy you can publish today.
- **Multi‑AI coverage:** one report across **8 AI engines** — the "I need to
  show up *everywhere*" moment.
- **Bilingual:** auto‑detects the visitor's language (English default, Spanish
  on the fly), and the *generated content* follows the language too.

## Status

A **working public demo**, deployed on Vercel and shipped *building‑in‑public*.
Real measurement runs on Google's Gemini (free tier); the broader multi‑engine
view is a transparent demo showcase. Not monetized — it's a portfolio / concept
build.

## Tech at a glance

Next.js 14 (App Router) · TypeScript · React 18 · custom CSS · Zod ·
Supabase (optional cache/leads) · multi‑provider LLM layer (Gemini, Perplexity,
OpenAI, Anthropic, xAI, DeepSeek) · deployed on Vercel with auto‑deploy from
`main`.

See **[`docs/MASTER.md`](./MASTER.md)** for the full technical write‑up.
