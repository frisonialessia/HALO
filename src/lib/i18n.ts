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

  // ---- Errors ----
  "err.analyze": { en: "We couldn't run the analysis", es: "No se pudo analizar" },
  "err.nameType": {
    en: "Enter at least the name and the business type.",
    es: "Pon al menos el nombre y el tipo de negocio.",
  },

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

  // ---- Kit (AI assets) ----
  "kit.errGen": { en: "We couldn't generate the copy", es: "No pudimos generar el texto" },
  "kit.invalidEmail": {
    en: "Enter a valid email to receive your kit.",
    es: "Pon un email válido para enviarte tu kit.",
  },
  "kit.title": {
    en: "Your kit to get recommended by AI",
    es: "Tu kit para que la IA te recomiende",
  },
  "kit.sub": {
    en: "Copy ready to paste into your website and Google profile, designed for the searches where you don't appear today.",
    es: "Texto listo para copiar en tu web y tu ficha de Google, pensado para las búsquedas donde hoy no apareces.",
  },
  "kit.generating": { en: "Generating your copy…", es: "Generando tu texto…" },
  "kit.generateBtn": {
    en: "Generate AI-optimized copy",
    es: "Generar texto optimizado para IA",
  },
  "kit.gateText": {
    en: "We'll email your optimized kit and notify you of improvements. No spam.",
    es: "Te enviamos tu kit optimizado al correo y te avisamos de mejoras. Sin spam.",
  },
  "kit.generatingShort": { en: "Generating…", es: "Generando…" },
  "kit.generateMine": { en: "Generate my kit →", es: "Generar mi kit →" },
  "kit.optDesc": { en: "Optimized description", es: "Descripción optimizada" },
  "kit.faq": { en: "Frequently asked questions (FAQ)", es: "Preguntas frecuentes (FAQ)" },
  "kit.actions": { en: "Recommended actions", es: "Acciones recomendadas" },
  "kit.schema": { en: "Structured data (Schema)", es: "Datos estructurados (Schema)" },
  "kit.schemaHint": {
    en: "Paste it into your website's HTML (in the head). It makes AI and Google understand your business instantly.",
    es: "Pégalo en el HTML de tu web (en la cabecera). Hace que la IA y Google entiendan tu negocio al instante.",
  },
  "kit.regenerate": { en: "Regenerate", es: "Regenerar" },

  // ---- Dashboard (shared + demo + real) ----
  "dash.title": { en: "AI visibility", es: "Visibilidad ante la IA" },
  "dash.live": { en: "live", es: "en directo" },
  "dash.demoSub": { en: "Your business · Milan · live", es: "Tu negocio · Milán · en directo" },
  "dash.last7": { en: "Last 7 days ▾", es: "Últimos 7 días ▾" },
  "dash.chosen": { en: "How often you're chosen", es: "Cuánto te eligen" },
  "dash.vsLastWeek": { en: "+1 vs. last week", es: "+1 vs. semana pasada" },
  "dash.mention": { en: "answers mention you", es: "respuestas te mencionan" },
  "dash.inArea": { en: "in your area", es: "en tu zona" },
  "dash.queriesWk": { en: "queries/week", es: "consultas/semana" },
  "dash.activeEngines": { en: "active engines", es: "motores activos" },
  "dash.trend8": { en: "Trend · 8 weeks", es: "Tendencia · 8 semanas" },
  "dash.fromAvgA": { en: "From 1.8 to", es: "De 1.8 a" },
  "dash.fromAvgB": { en: "on average", es: "de media" },
  "dash.health": { en: "Profile health", es: "Salud del perfil" },
  "dash.missing": { en: "Missing", es: "Faltan" },
  "dash.hours": { en: "hours", es: "horarios" },
  "dash.reservations": { en: "reservations", es: "reservas" },
  "dash.and": { en: "and", es: "y" },
  "dash.presenceByEngine": { en: "Presence by engine", es: "Presencia por motor" },
  "dash.connectMore": { en: "Connect more →", es: "Conectar más →" },
  "dash.youVsComp": { en: "You vs. your competition", es: "Tú y tu competencia" },
  "dash.top5area": { en: "Top 5 · your area", es: "Top 5 · tu zona" },
  "dash.optOppA": { en: "Optimization opportunity:", es: "Oportunidad de optimización:" },
  "dash.points": { en: "2 points", es: "2 puntos" },
  "dash.optOppB": {
    en: "to catch the leader in your area.",
    es: "para alcanzar al líder de tu zona.",
  },
  "dash.byAreaMilan": { en: "By area of Milan", es: "Por zona de Milán" },
  "dash.seeAll": { en: "See all →", es: "Ver todo →" },
  "dash.bigOppA": { en: "Your biggest opportunity:", es: "Tu mayor oportunidad:" },
  "dash.peopleSearch": { en: "What people search for", es: "Lo que la gente busca" },
  "dash.realQuestions": { en: "Real questions to the AI", es: "Preguntas reales a la IA" },
  "dash.youAppear": { en: "You appear", es: "Apareces" },
  "dash.notYet": { en: "Not yet", es: "Aún no" },
  "dash.yourImpact": { en: "Your impact on AI", es: "Tu impacto en la IA" },
  "dash.whatImproved": { en: "what Halo improved", es: "qué mejoró Halo" },
  "dash.visUpA": { en: "Your average visibility rose", es: "Tu visibilidad media subió" },
  "dash.visUpB": { en: "since you activated Halo.", es: "desde que activaste Halo." },
  "dash.comp.leader": { en: "Zone leader", es: "Líder de zona" },
  "dash.comp.c2": { en: "Competitor 2", es: "Competidor 2" },
  "dash.comp.c4": { en: "Competitor 4", es: "Competidor 4" },
  "dash.comp.c5": { en: "Competitor 5", es: "Competidor 5" },
  "dash.kw.0": { en: '"best place in central Milan"', es: '"mejor sitio en el centro de Milán"' },
  "dash.kw.1": { en: '"recommended near the Duomo"', es: '"recomendado cerca del Duomo"' },
  "dash.kw.2": { en: '"open on Sunday in Milan"', es: '"abierto el domingo en Milán"' },
  "dash.kw.3": { en: '"group options in Navigli"', es: '"opciones para grupos en Navigli"' },
  "dash.imp.0": { en: "Dishes indexed", es: "Platos indexados" },
  "dash.imp.1": { en: "Cited with reviews", es: "Citado con reseñas" },
  "dash.imp.2": { en: "Missing location", es: "Falta ubicación" },
  "dash.imp.3": { en: "In progress", es: "En progreso" },
  "dash.searchesPresence": { en: "searches with presence", es: "búsquedas con presencia" },
  "dash.engineMeasured": { en: "engine measured", es: "motor medido" },
  "dash.enginesMeasured": { en: "engines measured", es: "motores medidos" },
  "dash.bestPos": { en: "best position", es: "mejor posición" },
  "dash.shareFoot": {
    en: "Share of answers you appear in, by engine.",
    es: "Cuota de respuestas en las que apareces, por motor.",
  },
  "dash.progress": { en: "Your progress", es: "Tu evolución" },
  "dash.firstMeasure": {
    en: "First measurement recorded. Repeat the analysis periodically to see your visibility evolve.",
    es: "Primera medición registrada. Repite el análisis periódicamente para ver la evolución de tu visibilidad.",
  },
  "dash.fromToA": { en: "From", es: "De" },
  "dash.to": { en: "to", es: "a" },
  "dash.of10dot": { en: "of 10 ·", es: "de 10 ·" },
  "dash.measurements": { en: "measurements", es: "mediciones" },
  "dash.whichRecommend": {
    en: "Which searches recommend you",
    es: "En qué búsquedas te recomiendan",
  },
  "dash.realFootA": { en: "You appear in", es: "Apareces en" },
  "dash.realFootMid": { en: "of", es: "de" },
  "dash.realFootB": {
    en: 'searches. The missing ones are your biggest opportunity — generate your copy in "Your kit".',
    es: 'búsquedas. Las que faltan son tu mayor oportunidad — genera tu texto en "Tu kit".',
  },

  // ---- History ----
  "hist.title": { en: "Your history", es: "Tu historial" },
  "hist.analyzeNew": { en: "+ Analyze a new business", es: "+ Analizar un negocio nuevo" },
  "hist.empty": {
    en: "You haven't analyzed any business yet. Enter your website to measure your visibility.",
    es: "Todavía no has analizado ningún negocio. Introduce tu web para medir tu visibilidad.",
  },
  "common.back": { en: "Back", es: "Volver" },
  "common.delete": { en: "Delete", es: "Eliminar" },

  // ---- Settings ----
  "set.bizIntro": {
    en: "If AI doesn't know you yet, tell us who you are and we'll measure your presence anyway.",
    es: "Si la IA aún no te conoce, dinos quién eres y medimos tu presencia igual.",
  },
  "set.bizName": { en: "Business name", es: "Nombre del negocio" },
  "set.bizType": { en: "Type (e.g. Italian restaurant)", es: "Tipo (ej. restaurante italiano)" },
  "set.city": { en: "City", es: "Ciudad" },
  "set.analyzeBiz": { en: "Analyze my business", es: "Analizar mi negocio" },
  "set.connectBiz": { en: "Connect your business", es: "Conecta tu negocio" },
  "set.connecting": { en: "Connecting…", es: "Conectando…" },
  "set.connected": { en: "Connected", es: "Conectado" },
  "set.connect": { en: "Connect", es: "Conectar" },
  "set.howSee": { en: "How you see the information", es: "Cómo ves la información" },
  "set.expert": { en: "Expert mode", es: "Modo experto" },
  "set.expertDesc": {
    en: "Shows technical terms (Citation Score, Share of Answer). When off, everything is in plain words.",
    es: "Muestra términos técnicos (Citation Score, Share of Answer). Apagado, todo en palabras simples.",
  },
  "set.tools": { en: "Tools", es: "Herramientas" },
  "set.watch": { en: "Watch competition", es: "Vigilar competencia" },
  "set.watchDesc": {
    en: "We notify you of your competitors' moves so you can stay ahead.",
    es: "Te notificamos los movimientos de tus competidores para que te adelantes.",
  },
  "set.auto": { en: "Automatic mode", es: "Modo automático" },
  "set.autoDesc": {
    en: "Halo applies improvements automatically and notifies you of each completed action.",
    es: "Halo aplica las mejoras de forma automática y te notifica cada acción completada.",
  },
  "set.conn.web.t": { en: "Your website", es: "Tu sitio web" },
  "set.conn.web.d": {
    en: "We scan your site to read your information and improve it.",
    es: "Escaneamos tu web para leer tu información y mejorarla.",
  },
  "set.conn.maps.t": { en: "Your business on Google", es: "Google de tu negocio" },
  "set.conn.maps.d": {
    en: "Your Maps listing: hours, reviews and location.",
    es: "Tu ficha en Maps: horarios, reseñas y ubicación.",
  },
  "set.conn.ig.t": { en: "Instagram", es: "Instagram" },
  "set.conn.ig.d": {
    en: "So they know what you post and offer.",
    es: "Para que sepan qué publicas y ofreces.",
  },
  "set.conn.tk.t": { en: "TikTok", es: "TikTok" },
  "set.conn.tk.d": { en: "Your most recent and popular content.", es: "Tu contenido más reciente y popular." },
  "set.conn.wa.t": { en: "WhatsApp", es: "WhatsApp" },
  "set.conn.wa.d": {
    en: "We'll ping you here when you gain ground.",
    es: "Te avisamos por aquí cuando ganas terreno.",
  },

  // ---- Know items (demo fallback) ----
  "know.0.t": { en: "What kind of business you are", es: "Qué tipo de negocio eres" },
  "know.0.d": {
    en: "Italian restaurant · artisanal pasta. They've got it clear.",
    es: "Restaurante italiano · pasta artesanal. Lo tienen claro.",
  },
  "know.1.t": { en: "Where you are", es: "Dónde estás" },
  "know.1.d": {
    en: "Central Milan, near the Duomo. Well recognized.",
    es: "Centro de Milán, cerca del Duomo. Bien reconocido.",
  },
  "know.2.t": { en: "Your signature dishes", es: "Tus platos estrella" },
  "know.2.d": { en: "Fresh pasta, risotto. They mention them.", es: "Pasta fresca, risotto. Los mencionan." },
  "know.3.t": { en: "Your hours", es: "Tus horarios" },
  "know.3.d": {
    en: "They don't know when you open yet. Room to appear in more searches.",
    es: "Todavía no saben cuándo abres. Espacio para aparecer en más búsquedas.",
  },
  "know.4.t": { en: "How to book", es: "Cómo reservar" },
  "know.4.d": {
    en: "No clear way to book yet. A chance to win reservations.",
    es: "Aún no hay forma clara de reservar. Oportunidad de ganar reservas.",
  },
  "know.5.t": { en: "Customer reviews", es: "Opiniones de clientes" },
  "know.5.d": {
    en: "Good recent reviews. They use them in your favor.",
    es: "Buenas reseñas recientes. Las usan a tu favor.",
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
