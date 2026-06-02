"use client";

import { createContext, useContext } from "react";

// i18n ligero para la app (un solo árbol de cliente). Inglés es el idioma
// principal (por defecto); el español es opcional vía selector. Las claves que
// aún no estén traducidas caen a inglés automáticamente.

export type Lang = "en" | "es";

type Entry = { en: string; es: string };

const D: Record<string, Entry> = {
  // ---- Nav ----
  "nav.ask": { en: "Ask your AI:", es: "Pregúntale a tu IA:" },
  "nav.how": { en: "How it works", es: "Cómo funciona" },
  "nav.enter": { en: "Enter", es: "Entrar" },

  // ---- Hero ----
  "hero.titleA": { en: "Data intelligence for", es: "Inteligencia de datos para la" },
  "hero.titleB": { en: "generative search", es: "búsqueda generativa" },
  "hero.sub": {
    en: "Halo audits how your brand performs across LLMs and gives you the action plan to dominate the results.",
    es: "Halo audita el rendimiento de tu marca en LLMs y te brinda el plan de acción necesario para dominar los resultados.",
  },
  "hero.placeholder": {
    en: "Paste your website, Google Maps or Instagram",
    es: "Pega tu web, Google Maps o tu Instagram",
  },
  "hero.analyze": { en: "Analyze", es: "Analizar" },
  "hero.sectors": {
    en: "Helping businesses dominate their visibility in",
    es: "Ayudando a negocios a dominar la visibilidad en",
  },
  "trust.noSignup": { en: "No sign-up", es: "Sin registro" },
  "trust.seconds": { en: "Results in seconds", es: "Resultados en segundos" },

  // ---- Sectors (rotating) ----
  "sector.0": { en: "Restaurants", es: "Restaurantes" },
  "sector.1": { en: "Clinics", es: "Clínicas" },
  "sector.2": { en: "SaaS", es: "SaaS" },
  "sector.3": { en: "Hotels", es: "Hoteles" },

  // ---- How it works ----
  "howto.sub": {
    en: "No sign-up, in seconds. This is what Halo does with your business:",
    es: "Sin registro y en segundos. Esto es lo que Halo hace con tu negocio:",
  },
  "howto.s1.t": { en: "You paste your business", es: "Pegas tu negocio" },
  "howto.s1.d": {
    en: "Your website, your Google Maps or your name. We identify who you are automatically, no forms.",
    es: "Tu web, tu Google Maps o tu nombre. Identificamos quién eres automáticamente, sin formularios.",
  },
  "howto.s2.t": { en: "We measure your real presence", es: "Medimos tu presencia real" },
  "howto.s2.d": {
    en: "We ask the AI search engines (ChatGPT, Perplexity…) like a customer would, and see how often they recommend you.",
    es: "Preguntamos a los buscadores con IA (ChatGPT, Perplexity…) como lo haría un cliente, y vemos cuántas veces te recomiendan.",
  },
  "howto.s3.t": { en: "We give you the plan and the copy", es: "Te damos el plan y el texto" },
  "howto.s3.d": {
    en: "You see which searches you appear in and generate optimized copy, ready to paste into your website and Google profile.",
    es: "Ves en qué búsquedas apareces y generas el texto optimizado, listo para copiar en tu web y tu ficha de Google.",
  },
  "howto.pillars": { en: "The three pillars of AI visibility", es: "Los tres pilares de la visibilidad en IA" },
  "howto.aeo.d": {
    en: 'Appearing in the answer when a customer asks the AI "what\'s the best…?". The evolution of SEO: ranking on Google is no longer enough — you also need to appear in ChatGPT, Perplexity and Gemini.',
    es: 'Aparecer en la respuesta cuando un cliente pregunta a la IA "¿cuál es el mejor…?". La evolución del SEO: ya no basta con aparecer en Google; también es necesario aparecer en ChatGPT, Perplexity y Gemini.',
  },
  "howto.llmo.d": {
    en: "How AI models understand and describe your business. We optimize your information so they interpret it well and cite you confidently.",
    es: "Cómo los modelos de IA entienden y describen tu negocio. Optimizamos tu información para que te interpreten bien y te citen con seguridad.",
  },
  "howto.local.d": {
    en: "Your visibility by area and neighborhood: where you're already recommended and where you have room to win nearby customers.",
    es: "Tu visibilidad por zona y barrio: dónde ya te recomiendan y dónde tienes hueco para captar clientes cercanos.",
  },

  // ---- Loading ----
  "load.s1": { en: "Locating your business", es: "Localizando tu negocio" },
  "load.s2": { en: "Asking the AI search engines", es: "Preguntando a los buscadores con IA" },
  "load.s3": { en: "Measuring how often you're chosen", es: "Midiendo cuánto te eligen" },
  "load.s4": { en: "Preparing your recommendations", es: "Preparando tus recomendaciones" },
  "load.analyzing": { en: "Analyzing", es: "Analizando" },
};

export function translate(
  key: string,
  lang: Lang,
  vars?: Record<string, string | number>
): string {
  const entry = D[key];
  let s = entry ? entry[lang] ?? entry.en : key;
  if (vars) for (const k in vars) s = s.split(`{${k}}`).join(String(vars[k]));
  return s;
}

export const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});

export type TFn = (key: string, vars?: Record<string, string | number>) => string;

export function useT(): TFn {
  const { lang } = useContext(LangContext);
  return (key, vars) => translate(key, lang, vars);
}

export function useLang() {
  return useContext(LangContext);
}
