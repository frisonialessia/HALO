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

  // ---- App shell ----
  "app.backHome": { en: "Back to home", es: "Salir al inicio" },
  "app.yourBiz": { en: "Your business", es: "Tu negocio" },
  "app.settings": { en: "Settings & connections", es: "Ajustes y conexiones" },
  "app.switchBiz": { en: "Switch business", es: "Cambiar de negocio" },
  "app.logout": { en: "Log out", es: "Cerrar sesión" },
  "app.demoA": { en: "You're viewing an", es: "Estás viendo un" },
  "app.demoB": { en: "example", es: "ejemplo" },
  "app.demoC": {
    en: ". Analyze your business to see your real data.",
    es: ". Analiza tu negocio para ver tus datos reales.",
  },
  "app.demoCta": { en: "Analyze my business →", es: "Analizar mi negocio →" },

  // ---- Unlock bar ----
  "unlock.invalidEmail": { en: "Enter a valid email.", es: "Pon un email válido." },
  "unlock.a": { en: "This is an", es: "Esto es una" },
  "unlock.est": { en: "estimate", es: "estimación" },
  "unlock.for": { en: "for", es: "para" },
  "unlock.c": {
    en: ". Unlock your real analysis, free.",
    es: ". Desbloquea tu análisis real, gratis.",
  },
  "unlock.cta": { en: "See my real analysis →", es: "Ver mi análisis real →" },
  "unlock.emailPrompt": {
    en: "We'll email you your real report:",
    es: "Te enviamos tu informe real al correo:",
  },
  "unlock.emailPh": { en: "you@email.com", es: "tu@email.com" },
  "unlock.submit": { en: "Unlock →", es: "Desbloquear →" },

  // ---- Misc chrome ----
  "fab.ask": { en: "Ask Halo", es: "Pregúntale a Halo" },
  "copy.do": { en: "Copy", es: "Copiar" },
  "copy.done": { en: "Copied ✓", es: "Copiado ✓" },

  // ---- Chat (assistant) ----
  "chat.assistant": { en: "Visibility assistant", es: "Asistente de visibilidad" },
  "chat.thinking": { en: "Halo is thinking…", es: "Halo lo está pensando…" },
  "chat.placeholder": { en: "Ask Halo…", es: "Pregúntale a Halo…" },
  "chat.send": { en: "Send", es: "Enviar" },
  "chat.aiAnswer": { en: "See the AI's answer", es: "Ver respuesta de la IA" },
  "chat.bootThink": { en: "Analyzing your business…", es: "Analizando tu negocio…" },
  "chat.bootA": { en: "I analyzed the presence of", es: "Analicé la presencia de" },
  "chat.bootTail": {
    en: "I have concrete actions to get you chosen more. If you have questions about AEO or how this works, ask me first; otherwise, we start with the highest-impact one.",
    es: "Tengo acciones concretas para que te elijan más. Si tienes dudas sobre AEO o cómo funciona esto, pregúntame primero; si no, empezamos por la de mayor impacto.",
  },
  "chat.sug.appear": {
    en: "Which searches do I appear in today?",
    es: "¿En qué búsquedas aparezco hoy?",
  },
  "chat.sug.romantic": {
    en: "Make me appear in 'romantic dinner'",
    es: "Hazme aparecer en 'cena romántica'",
  },
  "chat.sug.osteria": {
    en: "What does Osteria Vista do that I don't?",
    es: "¿Qué hace Osteria Vista que yo no?",
  },
  "chat.sug.missing": {
    en: "Which searches am I missing from?",
    es: "¿En qué búsquedas no aparezco?",
  },
  "chat.sug.byEngine": { en: "How am I doing by engine?", es: "¿Cómo voy por motor?" },
  "chat.sug.genCopy": { en: "Generate my optimized copy", es: "Genérame el texto optimizado" },

  // ---- Report (HALO view) ----
  "report.whatAI": {
    en: "What AI understands about {name}",
    es: "Lo que la IA entiende de {name}",
  },
  "report.viewHistory": { en: "View history", es: "Ver historial" },
  "report.ofTen": { en: "{n} of 10", es: "{n} de 10" },
  "report.ofN": { en: "{a} of {b}", es: "{a} de {b}" },
  "report.trendWeek": { en: "+1 this week", es: "+1 esta semana" },
  "report.metricLbl": {
    en: "How often you're chosen when people search for a business like yours",
    es: "Cuánto te eligen cuando buscan un negocio como el tuyo",
  },
  "report.kwTitle": { en: "Keywords to work on", es: "Keywords a trabajar" },
  "report.kwIntroA": { en: "You're recommended in", es: "Te recomiendan en" },
  "report.kwIntroC": {
    en: "customer searches. Prioritize the ones you don't cover yet: they're your biggest opportunity.",
    es: "búsquedas de clientes. Prioriza las que aún no cubres: son tu mayor oportunidad.",
  },
  "report.noPresence": { en: "Not present", es: "Sin presencia" },
  "report.hasPresence": { en: "Present", es: "Con presencia" },
  "report.missHint": {
    en: "You're not recommended here yet. Optimize your content for this search.",
    es: "Aún no te recomiendan aquí. Optimiza tu contenido para esta búsqueda.",
  },
  "report.rank": { en: "You appear · rank #{n}", es: "Apareces · puesto #{n}" },
  "report.appearHere": { en: "You appear in this search", es: "Apareces en esta búsqueda" },
  "report.demoKnow": {
    en: "What ChatGPT, Perplexity and Gemini know about you",
    es: "Lo que ChatGPT, Perplexity y Gemini saben de ti",
  },
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
