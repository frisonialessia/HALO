"use client";

import { useState, useEffect, useRef, ReactNode, CSSProperties } from "react";
import { addHistory, listHistory, removeHistory, type HistoryEntry } from "@/lib/history";
import { isValidEmail, rememberLeadEmail, savedLeadEmail, submitLead } from "@/lib/lead";
import { mockAudit } from "@/lib/mock";
import { loadPrefs, savePrefs } from "@/lib/prefs";
import { addTrendPoint, getTrend, type TrendPoint } from "@/lib/trend";
import { translate, useT, useLang, LangContext, type Lang, type TFn } from "@/lib/i18n";

// ============== Orbe (logo) ==============
function Orb({ className = "", thinking = false }: { className?: string; thinking?: boolean }) {
  return (
    <span className={`haloOrb ${className} ${thinking ? "thinking" : ""}`}>
      <span className="blob b1" />
      <span className="blob b2" />
      <span className="blob b3" />
      <span className="blob b4" />
    </span>
  );
}

// ============== Iconos (todos vector, sin texto/color) ==============
const IconPaths = {
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  back: <path d="M15 19l-7-7 7-7" />,
  up: <path d="M12 19V5M5 12l7-7 7 7" />,
  spark: <path d="M12 3l2.2 5.6L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.8-.4Z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  cam: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </>
  ),
  bell: <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />,
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  trophy: (
    <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4ZM7 4H4v2a3 3 0 0 0 3 3M17 4h3v2a3 3 0 0 1-3 3" />
  ),
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
} as const;

type IcName = keyof typeof IconPaths;

function Ic({ ic, size = 14, className }: { ic: IcName; size?: number; className?: string }) {
  return (
    <span className={`gl ${className ?? ""}`}>
      <svg width={size} height={size} viewBox="0 0 24 24">
        {IconPaths[ic]}
      </svg>
    </span>
  );
}

// ============== Tipos ==============
type Screen = "landing" | "loading" | "app";
type View = "halo" | "dash" | "set" | "hist";
type Msg = { role: "bot" | "me"; text: ReactNode; think?: string };
type AuditData = {
  business: { name: string; business_type: string; city?: string; website?: string };
  shareOfAnswer: number; // 0..1 → "X de 10"
  byEngine: Record<string, number>;
  probes?: { query: string; appeared: boolean; position?: number; answer?: string }[];
  demo?: boolean; // estado de ejemplo fijo (Osteria, escaparate)
  preview?: boolean; // simulación personalizada de la marca del visitante
};
type AiAssets = {
  description: string;
  faqs: { q: string; a: string }[];
  tips: string[];
};

// ============== Datos demo ==============
const SECTORS = ["sector.0", "sector.1", "sector.2", "sector.3"];
const LOAD_STEPS = ["load.s1", "load.s2", "load.s3", "load.s4"];

const KNOW_ITEMS: { ok: boolean; tk: string; dk: string; op?: boolean }[] = [
  { ok: true, tk: "know.0.t", dk: "know.0.d" },
  { ok: true, tk: "know.1.t", dk: "know.1.d" },
  { ok: true, tk: "know.2.t", dk: "know.2.d" },
  { ok: false, op: true, tk: "know.3.t", dk: "know.3.d" },
  { ok: false, op: true, tk: "know.4.t", dk: "know.4.d" },
  { ok: true, tk: "know.5.t", dk: "know.5.d" },
];

function pickAnswer(q: string, lang: Lang): ReactNode {
  const s = q.toLowerCase();
  const es = lang === "es";
  // ¿Qué es AEO? — educativo
  if (/\baeo\b|answer engine/.test(s))
    return es ? (
      <>
        <b>AEO (Answer Engine Optimization)</b> es aparecer en la respuesta cuando alguien le
        pregunta a una IA «¿cuál es el mejor…?». Es la evolución del SEO: ya no basta con rankear en
        Google; ahora hay que estar en la respuesta de ChatGPT, Perplexity y Gemini. Halo mide cuántas
        veces te recomiendan y te da el plan para subir.
      </>
    ) : (
      <>
        <b>AEO (Answer Engine Optimization)</b> is showing up in the answer when someone asks an AI
        &quot;what&apos;s the best…?&quot;. It&apos;s the evolution of SEO: ranking on Google is no
        longer enough — you also need to be in ChatGPT, Perplexity and Gemini&apos;s answer. Halo
        measures how often you&apos;re recommended and gives you the plan to climb.
      </>
    );
  // ¿Qué es LLMO? — educativo
  if (/\bllmo\b|large language|c[oó]mo.*describe|how.*describe/.test(s))
    return es ? (
      <>
        <b>LLMO (Large Language Model Optimization)</b> es optimizar cómo los modelos de IA entienden y
        describen tu negocio: darles tus datos bien estructurados (qué eres, dónde estás y qué te hace
        especial) para que te interpreten bien y te citen con seguridad. Halo te genera ese texto listo
        para publicar.
      </>
    ) : (
      <>
        <b>LLMO (Large Language Model Optimization)</b> is optimizing how AI models understand and
        describe your business: giving them well-structured data (what you are, where you are, what
        makes you special) so they interpret you correctly and cite you confidently. Halo generates
        that ready-to-publish copy for you.
      </>
    );
  // ¿Qué es Halo / GEO / cómo funciona?
  if (/qu[eé] es|qu[eé] hace|c[oó]mo funciona|para qu[eé]|\bgeo\b|what is|what do you|what.*halo|how.*work/.test(s))
    return es ? (
      <>
        Halo mide tu visibilidad en la búsqueda con IA: pregunta a ChatGPT, Perplexity y Gemini como lo
        haría un cliente y ve cuántas veces te recomiendan. Luego te da el plan y el texto optimizado
        para que te elijan más. Pregúntame «¿qué es AEO?» o «¿qué es LLMO?», o pega tu negocio arriba
        para empezar.
      </>
    ) : (
      <>
        Halo measures your visibility in AI search: it asks ChatGPT, Perplexity and Gemini like a
        customer would and sees how often they recommend you. Then it gives you the plan and optimized
        copy to get chosen more. Ask me &quot;what is AEO?&quot; or &quot;what is LLMO?&quot;, or paste
        your business above to start.
      </>
    );
  if (/aparezco|b[uú]squeda|appear|search/.test(s))
    return es
      ? "Cobertura actual: ChatGPT te menciona en 2 de las 5 búsquedas más frecuentes; Perplexity en 3. El resto son oportunidades sin cubrir."
      : "Current coverage: ChatGPT mentions you in 2 of the 5 most frequent searches; Perplexity in 3. The rest are uncovered opportunities.";
  if (/rom[aá]ntica|romantic|dinner|cena/.test(s))
    return es
      ? 'Para aparecer en "cena romántica", los motores necesitan conocer tu ambiente y tu horario de noche. Puedo redactarlo en el formato que ChatGPT y Gemini interpretan.'
      : 'To appear for "romantic dinner", the engines need to know your atmosphere and your evening hours. I can write it in the format ChatGPT and Gemini interpret.';
  if (/osteria|hace.*que yo|does.*that i|what.*do/.test(s))
    return es
      ? "Osteria Vista aporta a los motores 3 datos que tú aún no: horarios, reservas y descripción de ambiente. Por eso la recomiendan 6 de 10. Replicar esa información te permite alcanzarla."
      : "Osteria Vista gives the engines 3 details you don't have yet: hours, reservations and an atmosphere description. That's why it's recommended 6 of 10. Replicating that info lets you catch up.";
  if (/compet|super|rival/.test(s))
    return es
      ? "Prioridad #1: publicar tus horarios y método de reserva en el formato estructurado que leen ChatGPT, Perplexity y Gemini. Osteria Vista ya lo tiene, y por eso aparece antes que tú. Puedo prepararlo."
      : "Priority #1: publish your hours and booking method in the structured format ChatGPT, Perplexity and Gemini read. Osteria Vista already has it, which is why it ranks ahead of you. I can prepare it.";
  if (/urgent|importante|arregla|fix/.test(s))
    return es
      ? "Lo de mayor impacto ahora: que los motores conozcan tus horarios y cómo reservar. Lo preparo en el formato que ChatGPT y Gemini interpretan correctamente."
      : "The highest impact right now: getting the engines to know your hours and how to book. I'll prepare it in the format ChatGPT and Gemini interpret correctly.";
  if (/falta|saber de m|missing|know about/.test(s))
    return es
      ? "A los motores les faltan dos datos sobre tu negocio (los ves a la izquierda): horarios y método de reserva. Completarlos te hace elegible cuando alguien busca reservar."
      : "The engines are missing two details about your business (shown on the left): hours and booking method. Completing them makes you eligible when someone wants to book.";
  if (/hazlo|dale|s[ií]\b|\bok\b|do it|\byes\b/.test(s))
    return es ? (
      <>
        Hecho. Tus horarios y reservas quedan publicados en el formato que leen los motores de IA. <b>ChatGPT, Perplexity y Gemini ya disponen de esos datos</b> y pueden recomendarte. El impacto se reflejará en tu panel.
      </>
    ) : (
      <>
        Done. Your hours and reservations are now published in the format AI engines read. <b>ChatGPT, Perplexity and Gemini now have that data</b> and can recommend you. The impact will show in your dashboard.
      </>
    );
  return es
    ? "Mi función es que los motores de IA (ChatGPT, Perplexity, Gemini…) interpreten bien tu negocio y te recomienden. De la parte técnica me encargo yo."
    : "My job is to get the AI engines (ChatGPT, Perplexity, Gemini…) to understand your business well and recommend you. I handle the technical part.";
}

// Agrupa los probes por búsqueda única (con varios motores, una misma query
// aparece una vez por motor): "apareces" si lo haces en AL MENOS un motor.
type ProbeLite = { query: string; appeared: boolean; position?: number; answer?: string };
function uniqueProbes(probes: ProbeLite[]): ProbeLite[] {
  const map = new Map<string, ProbeLite>();
  for (const p of probes) {
    const ex = map.get(p.query);
    if (!ex) {
      map.set(p.query, { ...p });
    } else {
      ex.appeared = ex.appeared || p.appeared;
      if (p.position && (!ex.position || p.position < ex.position)) ex.position = p.position;
      if (!ex.answer && p.answer) ex.answer = p.answer;
    }
  }
  return Array.from(map.values());
}

// Desplegable "Ver lo que dijo la IA": el fragmento real de la respuesta del motor.
function AiAnswer({ text }: { text: string }) {
  const t = useT();
  return (
    <details style={{ marginTop: 8, paddingLeft: 30 }}>
      <summary style={{ cursor: "pointer", fontSize: 12, fontWeight: 600, color: "var(--text-2)" }}>
        {t("chat.aiAnswer")}
      </summary>
      <div
        style={{
          marginTop: 6,
          fontSize: 12.5,
          fontWeight: 500,
          color: "var(--text-2)",
          lineHeight: 1.55,
          fontStyle: "italic",
          borderLeft: "2px solid var(--gline)",
          paddingLeft: 10,
        }}
      >
        “{text}”
      </div>
    </details>
  );
}

// Respuestas del chat con DATOS REALES (sin API), a partir del análisis:
// cobertura, por motor, posición, qué es AEO, plan… Honesto sobre lo que aún
// no hace (competencia/zonas/chat conversacional → en camino).
function answerReal(q: string, audit: AuditData, lang: Lang): ReactNode {
  const s = q.toLowerCase();
  const es = lang === "es";
  const probes = uniqueProbes(audit.probes ?? []);
  const got = probes.filter((p) => p.appeared);
  const missed = probes.filter((p) => !p.appeared);
  const score = Math.round(audit.shareOfAnswer * 10);
  const name = audit.business.name;
  const engines = Object.entries(audit.byEngine);
  const ex = (arr: typeof probes) =>
    arr.slice(0, 3).map((m) => `"${m.query}"`).join(", ");

  // Saludo / greeting
  if (/^\s*(hola|buenas|hey|hi|holi|hello)\b/.test(s)) {
    return es ? (
      <>
        ¡Hola! Soy Halo. Hoy <b>{name}</b> aparece en <b>{got.length} de {probes.length}</b> búsquedas con
        IA. Pregúntame en cuáles no apareces, cómo vas por motor, o pídeme que te genere el texto optimizado.
      </>
    ) : (
      <>
        Hi! I&apos;m Halo. Today <b>{name}</b> appears in <b>{got.length} of {probes.length}</b> AI searches.
        Ask me which ones you&apos;re missing from, how you&apos;re doing by engine, or to generate your
        optimized copy.
      </>
    );
  }

  // Qué es / what is / AEO
  if (
    /qu[eé] es|qu[eé] haces|c[oó]mo funciona|\baeo\b|\bgeo\b|para qu[eé]|qu[eé] mides|what is|what do you|how does|what.*measure/.test(
      s
    )
  ) {
    return es ? (
      <>
        Mido cuántas veces te recomiendan los buscadores con IA (ChatGPT, Perplexity, Gemini) cuando alguien
        busca un negocio como el tuyo. Hoy te eligen <b>{score} de cada 10</b>. Mi trabajo es subir ese
        número: te digo dónde no apareces y te genero el texto que la IA necesita para recomendarte.
      </>
    ) : (
      <>
        I measure how often AI search engines (ChatGPT, Perplexity, Gemini) recommend you when someone looks
        for a business like yours. Today you&apos;re chosen <b>{score} out of 10</b>. My job is to raise that
        number: I tell you where you don&apos;t appear and generate the copy the AI needs to recommend you.
      </>
    );
  }

  // Por motor / by engine
  if (/motor|chatgpt|perplexity|gemini|en cu[aá]l|d[oó]nde.*mejor|engine|which.*best/.test(s)) {
    if (engines.length === 0)
      return es
        ? "Aún no tengo el desglose por motor de este análisis."
        : "I don't have the per-engine breakdown for this analysis yet.";
    const sorted = [...engines].sort((a, b) => b[1] - a[1]);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    return (
      <>
        {es ? "Por motor: " : "By engine: "}
        {sorted.map(([e, v], i) => (
          <span key={e}>
            {i ? ", " : ""}
            <b>{ENGINE_LABELS[e] ?? e}</b> {Math.round(v * 10)}/10
          </span>
        ))}
        {es ? (
          <>
            . Donde mejor estás es <b>{ENGINE_LABELS[best[0]] ?? best[0]}</b>
          </>
        ) : (
          <>
            . You&apos;re strongest on <b>{ENGINE_LABELS[best[0]] ?? best[0]}</b>
          </>
        )}
        {best[0] !== worst[0] ? (
          es ? (
            <>
              {" "}
              y donde más margen tienes es <b>{ENGINE_LABELS[worst[0]] ?? worst[0]}</b>
            </>
          ) : (
            <>
              {" "}
              and have the most room on <b>{ENGINE_LABELS[worst[0]] ?? worst[0]}</b>
            </>
          )
        ) : null}
        .
      </>
    );
  }

  // Puntuación / score
  if (
    /puntuaci|c[oó]mo voy|c[oó]mo estoy|qu[eé] tal|mi nota|mi score|how.*doing|my score|how am i/.test(s)
  ) {
    return es ? (
      <>
        Hoy te recomiendan <b>{score} de cada 10</b> veces ({got.length} de {probes.length} búsquedas).{" "}
        {score <= 3
          ? "Existe un amplio margen de mejora con un plan claro."
          : score <= 6
          ? "Posición intermedia, con recorrido por delante."
          : "Posición sólida; el objetivo es consolidarla."}
      </>
    ) : (
      <>
        Today you&apos;re recommended <b>{score} out of 10</b> times ({got.length} of {probes.length}{" "}
        searches).{" "}
        {score <= 3
          ? "There's plenty of room to improve with a clear plan."
          : score <= 6
          ? "A mid position, with room ahead."
          : "A solid position; the goal is to consolidate it."}
      </>
    );
  }

  // Posición / ranking
  if (/posici[oó]n|puesto|ranking|\btop\b|n[uú]mero|\brank|position/.test(s)) {
    const positions = got.map((p) => p.position).filter((x): x is number => !!x);
    if (positions.length === 0)
      return es ? (
        <>
          Todavía no apareces en un puesto destacado en las búsquedas analizadas. Al cubrir las que
          faltan, empezarás a posicionarte.
        </>
      ) : (
        <>
          You don&apos;t appear in a top spot yet in the searches analyzed. As you cover the missing ones,
          you&apos;ll start to rank.
        </>
      );
    const best = Math.min(...positions);
    const top3 = got.filter((p) => (p.position ?? 99) <= 3).length;
    return es ? (
      <>
        Tu mejor posición es <b>#{best}</b>, y estás en el top 3 en <b>{top3}</b> de las búsquedas donde
        apareces. Cuanto más arriba, más te eligen.
      </>
    ) : (
      <>
        Your best position is <b>#{best}</b>, and you&apos;re in the top 3 in <b>{top3}</b> of the searches
        where you appear. The higher you are, the more you&apos;re chosen.
      </>
    );
  }

  // Dónde NO aparezco / plan
  if (
    /no aparezco|no aparece|no salgo|mejorar|qu[eé] hago|primero|prioridad|plan|acci[oó]n|falta|missing|improve|priorit|what should i|what do i/.test(
      s
    )
  ) {
    if (missed.length === 0)
      return es ? (
        <>
          Apareces en todas las búsquedas analizadas. El siguiente paso es reforzar tu posición; puedo
          generarte el texto optimizado para consolidarla.
        </>
      ) : (
        <>
          You appear in every search analyzed. The next step is to reinforce your position; I can generate
          optimized copy to consolidate it.
        </>
      );
    return es ? (
      <>
        No apareces en <b>{missed.length} de {probes.length}</b> búsquedas, por ejemplo: {ex(missed)}.
        Para cubrirlas, genera tu texto en <b>&quot;Tu kit&quot;</b>: se basa precisamente en esas
        búsquedas.
      </>
    ) : (
      <>
        You don&apos;t appear in <b>{missed.length} of {probes.length}</b> searches, for example: {ex(missed)}.
        To cover them, generate your copy in <b>&quot;Your kit&quot;</b>: it&apos;s built precisely from those
        searches.
      </>
    );
  }

  // Dónde SÍ aparezco / coverage
  if (/aparezco|salgo|cobertura|b[uú]squeda|cu[aá]nt|presencia|d[oó]nde|appear|coverage|where|how many/.test(s)) {
    return es ? (
      <>
        Hoy te recomiendan en <b>{got.length} de {probes.length}</b> búsquedas
        {got.length ? <>, por ejemplo: {ex(got)}.</> : "."}
        {missed.length ? <> Faltan {missed.length} por cubrir.</> : null}
      </>
    ) : (
      <>
        Today you&apos;re recommended in <b>{got.length} of {probes.length}</b> searches
        {got.length ? <>, for example: {ex(got)}.</> : "."}
        {missed.length ? <> {missed.length} left to cover.</> : null}
      </>
    );
  }

  // Generar texto / kit
  if (/texto|genera|optimiz|kit|descripci|faq|contenido|copy|generate|content/.test(s)) {
    return es ? (
      <>
        Te lo preparo: pulsa <b>&quot;Generar texto optimizado para IA&quot;</b> en &quot;Tu kit&quot; (panel izquierdo).
        Te doy descripción, FAQ y acciones, enfocadas en las búsquedas donde aún no apareces.
      </>
    ) : (
      <>
        I&apos;ll prepare it: click <b>&quot;Generate AI-optimized copy&quot;</b> in &quot;Your kit&quot; (left panel).
        I&apos;ll give you a description, FAQ and actions, focused on the searches where you don&apos;t appear yet.
      </>
    );
  }

  // Competencia / competition
  if (/competencia|competidor|rival|l[ií]der|comparar|competit|compare/.test(s)) {
    return es ? (
      <>
        El análisis de competidores está en camino. Por ahora me centro en TU cobertura real: apareces en{" "}
        <b>{got.length} de {probes.length}</b> búsquedas. Subir eso es lo que te adelanta al resto.
      </>
    ) : (
      <>
        Competitor analysis is on the way. For now I focus on YOUR real coverage: you appear in{" "}
        <b>{got.length} of {probes.length}</b> searches. Raising that is what puts you ahead.
      </>
    );
  }

  // Zonas / local
  if (/zona|barrio|cerca|\blocal\b|ciudad|area|neighbo|\bcity\b|near/.test(s)) {
    return es ? (
      <>
        {audit.business.city ? (
          <>
            Te estoy midiendo en <b>{audit.business.city}</b>.{" "}
          </>
        ) : null}
        El desglose por barrios (Local Intelligence) llegará pronto; de momento mido tu visibilidad general
        en las búsquedas con IA.
      </>
    ) : (
      <>
        {audit.business.city ? (
          <>
            I&apos;m measuring you in <b>{audit.business.city}</b>.{" "}
          </>
        ) : null}
        The neighborhood breakdown (Local Intelligence) is coming soon; for now I measure your overall
        visibility across AI searches.
      </>
    );
  }

  // Fallback honesto / honest fallback
  return es ? (
    <>
      Puedo enseñarte <b>en qué búsquedas apareces y en cuáles no</b>, tu <b>puntuación por motor</b> y{" "}
      <b>generarte el texto optimizado</b> (sección &quot;Tu kit&quot;). El chat conversacional completo lo activamos
      al conectar los motores. ¿Por dónde empezamos?
    </>
  ) : (
    <>
      I can show you <b>which searches you appear in and which you don&apos;t</b>, your <b>score by engine</b>,
      and <b>generate your optimized copy</b> (&quot;Your kit&quot; section). Full conversational chat unlocks when
      we connect the engines. Where shall we start?
    </>
  );
}

// Dashboard data
const COMPETITORS: { n: string; v: number; score: string; you?: boolean }[] = [
  { n: "dash.comp.leader", v: 60, score: "6/10" },
  { n: "dash.comp.c2", v: 50, score: "5/10" },
  { n: "app.yourBiz", v: 30, score: "3/10", you: true },
  { n: "dash.comp.c4", v: 30, score: "3/10" },
  { n: "dash.comp.c5", v: 20, score: "2/10" },
];

const ENGINES: { name: string; n?: number; dim?: boolean }[] = [
  { name: "ChatGPT", n: 3 },
  { name: "Perplexity", n: 4 },
  { name: "Gemini", n: 2 },
  { name: "Claude", dim: true },
  { name: "Copilot", dim: true },
];

const ZONES: { n: string; v: number }[] = [
  { n: "Brera", v: 70 },
  { n: "Duomo", v: 65 },
  { n: "Navigli", v: 50 },
  { n: "Lambrate", v: 12 },
  { n: "San Siro", v: 8 },
];

const KEYWORDS: { yes: boolean; k: string }[] = [
  { yes: true, k: "dash.kw.0" },
  { yes: true, k: "dash.kw.1" },
  { yes: false, k: "dash.kw.2" },
  { yes: false, k: "dash.kw.3" },
];

const IMPACT: { eng: string; v: number; d: string }[] = [
  { eng: "ChatGPT", v: 62, d: "dash.imp.0" },
  { eng: "Perplexity", v: 74, d: "dash.imp.1" },
  { eng: "Gemini", v: 48, d: "dash.imp.2" },
  { eng: "Claude", v: 55, d: "dash.imp.3" },
];

// ============== Sparkline (canvas, 8 puntos, línea negra) ==============
function SparkLine() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const draw = () => {
      const cssW = c.offsetWidth;
      const cssH = c.offsetHeight;
      c.width = cssW * 2;
      c.height = cssH * 2;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(2, 2);
      ctx.clearRect(0, 0, cssW, cssH);
      const d = [1.8, 2.0, 1.9, 2.2, 2.4, 2.5, 2.8, 3.0];
      const mx = 3.2;
      ctx.strokeStyle = "#17181B";
      ctx.lineWidth = 2;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      d.forEach((v, i) => {
        const px = (i / (d.length - 1)) * cssW;
        const py = cssH - (v / mx) * cssH * 0.85 - 3;
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      });
      ctx.stroke();
    };
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, []);
  return <canvas ref={ref} />;
}

// ============== App principal ==============
export default function HaloApp() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [view, setView] = useState<View>("halo");
  const [sectorIdx, setSectorIdx] = useState(0);
  const [loadDone, setLoadDone] = useState<number>(-1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bizInput, setBizInput] = useState("");
  const [audit, setAudit] = useState<AuditData | null>(null);
  const [auditErr, setAuditErr] = useState("");
  const [prefillName, setPrefillName] = useState("");
  const [analyzingLabel, setAnalyzingLabel] = useState("your business");
  const [history, setHistory] = useState<HistoryEntry<AuditData>[]>([]);
  const bizInputRef = useRef<HTMLInputElement>(null);
  const [previewInput, setPreviewInput] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const tr: TFn = (key, vars) => translate(key, lang, vars);

  useEffect(() => {
    if (screen !== "landing") return;
    const t = setInterval(() => setSectorIdx((i) => (i + 1) % SECTORS.length), 2200);
    return () => clearInterval(t);
  }, [screen]);

  // Carga el historial guardado en el navegador (interino hasta Supabase).
  useEffect(() => {
    setHistory(listHistory<AuditData>());
  }, []);

  // Idioma: si el usuario ya eligió, se respeta; si no, se detecta el del
  // navegador (es → español; el resto, inglés). Sincroniza <html lang>.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("halo:lang");
    if (saved === "es" || saved === "en") {
      setLang(saved);
    } else if ((navigator.language || "").toLowerCase().startsWith("es")) {
      setLang("es");
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("halo:lang", lang);
    } catch {}
    document.documentElement.lang = lang;
  }, [lang]);

  // Guarda una auditoría en el historial local y devuelve la lista nueva.
  function rememberAudit(a: AuditData) {
    // Cada análisis real añade un punto a la evolución del negocio.
    addTrendPoint(a.business.name, Math.round(a.shareOfAnswer * 10));
    return addHistory<AuditData>({
      label: a.business.name,
      sub: a.business.city || a.business.business_type,
      score: Math.round(a.shareOfAnswer * 10),
      data: a,
    });
  }

  // Anima los pasos de carga mientras esperamos la respuesta real (no termina solo).
  function runLoadingSteps(): () => void {
    setLoadDone(0);
    let step = 0;
    const t = setInterval(() => {
      step = Math.min(step + 1, LOAD_STEPS.length - 1);
      setLoadDone(step);
    }, 1600);
    return () => clearInterval(t);
  }

  // Análisis REAL: identifica lo que pega el usuario y mide su presencia.
  // "Analizar" (landing): muestra AL INSTANTE una vista previa SIMULADA y
  // personalizada con su marca — sin API, coste 0. El análisis real se
  // desbloquea con el email (runRealAnalysis).
  function startAudit() {
    const input = bizInput.trim();
    if (!input) return;
    setPreviewInput(input);
    setAnalyzingLabel(input);
    setAuditErr("");
    setAudit(null);
    setScreen("loading");
    setLoadDone(-1);
    LOAD_STEPS.forEach((_, i) => {
      setTimeout(() => setLoadDone(i), 350 + i * 480);
    });
    setTimeout(() => {
      setAudit(mockAudit(input, lang));
      setScreen("app");
      setView("halo");
    }, 350 + 4 * 480 + 250);
  }

  // Análisis REAL (Perplexity), desbloqueado con el email; reemplaza la preview.
  async function runRealAnalysis(input: string) {
    const q = input.trim();
    if (!q) return;
    setAnalyzingLabel(q);
    setAuditErr("");
    setScreen("loading");
    const stop = runLoadingSteps();
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: q, lang }),
      });
      const data = await res.json();
      stop();
      if (data?.needManual) {
        setPrefillName(/^https?:\/\//i.test(q) ? "" : q);
        setScreen("app");
        setView("set");
        return;
      }
      if (!res.ok) throw new Error(data?.error || tr("err.analyze"));
      setLoadDone(LOAD_STEPS.length - 1);
      const auditData = data as AuditData;
      setAudit(auditData);
      setHistory(rememberAudit(auditData));
      setScreen("app");
      setView("halo");
    } catch (e) {
      stop();
      setAuditErr(e instanceof Error ? e.message : tr("err.analyze"));
      setScreen("landing");
    }
  }

  // Desbloquear: captura el email y corre el análisis real del negocio del preview.
  function unlockReal(email: string) {
    rememberLeadEmail(email);
    void submitLead(email, { business: previewInput, source: "unlock" });
    runRealAnalysis(previewInput);
  }

  // Análisis con los datos a mano (desde Ajustes, para negocios que la IA
  // aún no conoce). Recibe los campos del formulario de Ajustes.
  async function runManualAudit(name: string, business_type: string, city: string) {
    name = name.trim();
    business_type = business_type.trim();
    if (!name || !business_type) {
      setAuditErr(tr("err.nameType"));
      return;
    }
    setAnalyzingLabel(name);
    setAuditErr("");
    setAudit(null);
    setScreen("loading");
    const stop = runLoadingSteps();
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, business_type, city: city.trim(), lang }),
      });
      const data = await res.json();
      stop();
      if (!res.ok) throw new Error(data?.error || tr("err.analyze"));
      setLoadDone(LOAD_STEPS.length - 1);
      const auditData = {
        business: { name, business_type, city: city.trim() || undefined },
        ...data,
      } as AuditData;
      setAudit(auditData);
      setHistory(rememberAudit(auditData));
      setScreen("app");
      setView("halo");
    } catch (e) {
      stop();
      setAuditErr(e instanceof Error ? e.message : tr("err.analyze"));
      setScreen("app");
      setView("set");
    }
  }

  // Demo sin coste: la animación de siempre con los datos de ejemplo.
  // "Entrar" empuja a añadir SU negocio (no a la demo): foco en el campo.
  function enterApp() {
    bizInputRef.current?.focus();
    bizInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Abre una auditoría guardada del historial.
  function selectFromHistory(entry: HistoryEntry<AuditData>) {
    setAudit(entry.data);
    setScreen("app");
    setView("halo");
  }

  // "Analizar un negocio nuevo": vuelve a la landing con el campo limpio.
  function newAnalysis() {
    setBizInput("");
    setMenuOpen(false);
    setScreen("landing");
    setTimeout(() => bizInputRef.current?.focus(), 120);
  }

  function removeFromHistory(id: string) {
    setHistory(removeHistory<AuditData>(id));
  }

  return (
    <LangContext.Provider value={{ lang, setLang }}>
      <div className="grain" />

      {screen === "landing" && (
        <div className="screen active" id="s-landing">
          <nav>
            <div className="lbrand">
              <Orb className="dot" /> Halo
            </div>
            <div className="lnav-links">
              <span className="ainav">
                {tr("nav.ask")}
                <span className="ai-ic">
                  <img src="/icons/openai.svg" alt="ChatGPT" width={13} height={13} />
                </span>
                <span className="ai-ic">
                  <img src="/icons/claude.svg" alt="Claude" width={13} height={13} />
                </span>
                <span className="ai-ic">
                  <img src="/icons/perplexity.svg" alt="Perplexity" width={13} height={13} />
                </span>
                <span className="ai-ic">
                  <img src="/icons/grok.svg" alt="Grok" width={13} height={13} />
                </span>
              </span>
              <a
                onClick={() =>
                  document.getElementById("como")?.scrollIntoView({ behavior: "smooth" })
                }
              >
                {tr("nav.how")}
              </a>
              <a className="enter" onClick={enterApp}>
                {tr("nav.enter")}
              </a>
              <span className="langsel" style={{ display: "inline-flex", alignItems: "center", gap: 3, marginLeft: 2 }}>
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  style={{ border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: lang === "en" ? "var(--text)" : "var(--muted)" }}
                >
                  EN
                </button>
                <span style={{ color: "var(--muted)", fontSize: 11 }}>·</span>
                <button
                  type="button"
                  onClick={() => setLang("es")}
                  style={{ border: "none", background: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700, color: lang === "es" ? "var(--text)" : "var(--muted)" }}
                >
                  ES
                </button>
              </span>
            </div>
          </nav>
          <div className="lhero">
          <div className="lstage">
            <div className="ainav ainav-hero">
              {tr("nav.ask")}
              <span className="ai-ic">
                <img src="/icons/openai.svg" alt="ChatGPT" width={13} height={13} />
              </span>
              <span className="ai-ic">
                <img src="/icons/claude.svg" alt="Claude" width={13} height={13} />
              </span>
              <span className="ai-ic">
                <img src="/icons/perplexity.svg" alt="Perplexity" width={13} height={13} />
              </span>
              <span className="ai-ic">
                <img src="/icons/grok.svg" alt="Grok" width={13} height={13} />
              </span>
            </div>
            <div className="eyebrow">AEO • LLMO • Local Intelligence</div>
            <h1>
              {tr("hero.titleA")} <span className="g">{tr("hero.titleB")}</span>.
            </h1>
            <p className="sub-title">{tr("hero.sub")}</p>
            <div className="glass lsearch">
              <input
                ref={bizInputRef}
                placeholder={tr("hero.placeholder")}
                autoComplete="off"
                value={bizInput}
                onChange={(e) => setBizInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") startAudit();
                }}
              />
              <button onClick={startAudit}>{tr("hero.analyze")}</button>
            </div>
            {auditErr && (
              <div style={{ marginTop: 12, fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>
                {auditErr}
              </div>
            )}
            <div className="sectors">
              {tr("hero.sectors")} <b>{tr(SECTORS[sectorIdx])}</b>
            </div>
            <div className="ltrust">
              <span>{tr("trust.noSignup")}</span>
              <span className="sep" />
              <span>{tr("trust.seconds")}</span>
            </div>
          </div>
          </div>

          <section className="howto" id="como">
            <h2>{tr("nav.how")}</h2>
            <p className="howto-sub">{tr("howto.sub")}</p>
            <div className="howto-grid">
              <div className="howto-step">
                <div className="hs-num">1</div>
                <h3>{tr("howto.s1.t")}</h3>
                <p>{tr("howto.s1.d")}</p>
              </div>
              <div className="howto-step">
                <div className="hs-num">2</div>
                <h3>{tr("howto.s2.t")}</h3>
                <p>{tr("howto.s2.d")}</p>
              </div>
              <div className="howto-step">
                <div className="hs-num">3</div>
                <h3>{tr("howto.s3.t")}</h3>
                <p>{tr("howto.s3.d")}</p>
              </div>
            </div>

            <h3 className="howto-h3">{tr("howto.pillars")}</h3>
            <div className="howto-grid">
              <div className="howto-step">
                <span className="pill-tag">AEO</span>
                <h3>Answer Engine Optimization</h3>
                <p>{tr("howto.aeo.d")}</p>
              </div>
              <div className="howto-step">
                <span className="pill-tag">LLMO</span>
                <h3>Large Language Model Optimization</h3>
                <p>{tr("howto.llmo.d")}</p>
              </div>
              <div className="howto-step">
                <span className="pill-tag">LOCAL</span>
                <h3>Local Intelligence</h3>
                <p>{tr("howto.local.d")}</p>
              </div>
            </div>
          </section>

          <FloatingFab hidden={false} onClick={enterApp} />
        </div>
      )}

      {screen === "loading" && (
        <div className="screen active" id="s-load">
          <div className="loadbox">
            <svg width="120" height="120" className="ring">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(120,80,50,.12)" strokeWidth="8" />
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="url(#lg)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="314"
                strokeDashoffset={loadDone >= 0 ? 0 : 314}
                style={{ transition: "stroke-dashoffset 2.6s linear" }}
              />
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#ffb020" />
                  <stop offset="1" stopColor="#f15a2b" />
                </linearGradient>
              </defs>
            </svg>
            <h2>
              {tr("load.analyzing")} <span className="lurl">{analyzingLabel}</span>
            </h2>
            <div className="lsteps">
              {LOAD_STEPS.map((s, i) => (
                <div key={i} className={`lstep ${i <= loadDone ? "done" : ""}`}>
                  <span className="tk">
                    <svg viewBox="0 0 24 24">
                      <path d="m5 12 5 5 9-10" />
                    </svg>
                  </span>
                  {tr(s)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {screen === "app" && (
        <AppShell
          view={view}
          setView={setView}
          setScreen={setScreen}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          audit={audit}
          onAnalyze={runManualAudit}
          prefillName={prefillName}
          auditErr={auditErr}
          history={history}
          onSelectAudit={selectFromHistory}
          onNewAnalysis={newAnalysis}
          onUnlock={unlockReal}
          onRemoveHistory={removeFromHistory}
        />
      )}
    </LangContext.Provider>
  );
}

// Barra de "desbloquear análisis real" sobre la vista previa simulada:
// captura el email y dispara el análisis real del negocio.
function UnlockBar({
  name,
  onUnlock,
}: {
  name: string;
  onUnlock: (email: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const t = useT();

  function go() {
    const saved = savedLeadEmail();
    if (saved) {
      onUnlock(saved);
      return;
    }
    setErr("");
    setOpen(true);
  }
  function submit() {
    if (!isValidEmail(email)) {
      setErr(t("unlock.invalidEmail"));
      return;
    }
    onUnlock(email.trim());
  }

  const bar: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    flexWrap: "wrap",
    padding: "10px 20px",
    background: "#FFF4EF",
    borderBottom: "1px solid var(--gline)",
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text)",
  };
  const btn: CSSProperties = {
    border: "none",
    background: "var(--text)",
    color: "#fff",
    borderRadius: 999,
    padding: "7px 16px",
    fontSize: 12.5,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  };

  return (
    <div style={bar}>
      {!open ? (
        <>
          <span>
            {t("unlock.a")} <b>{t("unlock.est")}</b> {t("unlock.for")} <b>{name}</b>
            {t("unlock.c")}
          </span>
          <button type="button" onClick={go} style={btn}>
            {t("unlock.cta")}
          </button>
        </>
      ) : (
        <>
          <span>{t("unlock.emailPrompt")}</span>
          <input
            type="email"
            placeholder={t("unlock.emailPh")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            style={{
              border: "1px solid var(--gline)",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 13,
              fontWeight: 500,
              outline: "none",
              background: "#fff",
              fontFamily: "inherit",
              minWidth: 180,
            }}
          />
          <button type="button" onClick={submit} style={btn}>
            {t("unlock.submit")}
          </button>
          {err && <span style={{ color: "var(--deep)", fontWeight: 500 }}>{err}</span>}
        </>
      )}
    </div>
  );
}

// ============== Shell de la app ==============
function AppShell({
  view,
  setView,
  setScreen,
  menuOpen,
  setMenuOpen,
  audit,
  onAnalyze,
  prefillName,
  auditErr,
  history,
  onSelectAudit,
  onNewAnalysis,
  onUnlock,
  onRemoveHistory,
}: {
  view: View;
  setView: (v: View) => void;
  setScreen: (s: Screen) => void;
  menuOpen: boolean;
  setMenuOpen: (b: boolean) => void;
  audit: AuditData | null;
  onAnalyze: (name: string, business_type: string, city: string) => void;
  prefillName: string;
  auditErr: string;
  history: HistoryEntry<AuditData>[];
  onSelectAudit: (e: HistoryEntry<AuditData>) => void;
  onNewAnalysis: () => void;
  onUnlock: (email: string) => void;
  onRemoveHistory: (id: string) => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const t = useT();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  return (
    <div className="screen active" id="s-app">
      <header className={scrolled ? "scrolled" : ""}>
        <div className="hbar">
          <div className="logo haloOrb" onClick={() => setScreen("landing")} title={t("app.backHome")}>
            <span className="blob b1" />
            <span className="blob b2" />
            <span className="blob b3" />
            <span className="blob b4" />
          </div>
          <nav className="glass hnav">
            <button className={view === "halo" ? "on" : ""} onClick={() => setView("halo")}>
              Halo
            </button>
            <button className={view === "dash" ? "on" : ""} onClick={() => setView("dash")}>
              Dashboard
            </button>
          </nav>
          <div className="bizmenu">
            <button className="bizbtn" onClick={() => setMenuOpen(!menuOpen)}>
              <span
                style={{
                  maxWidth: 170,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {audit?.business.name ?? t("app.yourBiz")}
              </span>
              <span style={{ color: "var(--muted)" }}>▾</span>
            </button>
            {menuOpen && (
              <div className="glass dropdown open">
                <div
                  className="di"
                  onClick={() => {
                    setView("set");
                    setMenuOpen(false);
                  }}
                >
                  {t("app.settings")}
                </div>
                <div
                  className="di"
                  onClick={() => {
                    setView("hist");
                    setMenuOpen(false);
                  }}
                >
                  {t("app.switchBiz")}
                </div>
                <div className="sep" />
                <div
                  className="di out"
                  onClick={() => {
                    setMenuOpen(false);
                    setScreen("landing");
                  }}
                >
                  {t("app.logout")}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {audit?.preview && <UnlockBar name={audit.business.name} onUnlock={onUnlock} />}

      {audit?.demo && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            flexWrap: "wrap",
            padding: "10px 20px",
            background: "#FFF4EF",
            borderBottom: "1px solid var(--gline)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text)",
          }}
        >
          <span>
            {t("app.demoA")} <b>{t("app.demoB")}</b>
            {t("app.demoC")}
          </span>
          <button
            type="button"
            onClick={onNewAnalysis}
            style={{
              border: "none",
              background: "var(--text)",
              color: "#fff",
              borderRadius: 999,
              padding: "7px 16px",
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {t("app.demoCta")}
          </button>
        </div>
      )}

      <div className="stage">
        {view === "halo" && <HaloView audit={audit} onHistory={() => setView("hist")} />}
        {view === "dash" && <DashView audit={audit} />}
        {view === "hist" && (
          <HistoryView
            entries={history}
            onSelect={onSelectAudit}
            onNew={onNewAnalysis}
            onRemove={onRemoveHistory}
            setView={setView}
          />
        )}
        {view === "set" && (
          <SettingsView
            setView={setView}
            onAnalyze={onAnalyze}
            prefillName={prefillName}
            auditErr={auditErr}
          />
        )}
      </div>

      <FloatingFab hidden={view === "halo"} onClick={() => setView("halo")} />
    </div>
  );
}

// ============== FAB (orbe flotante, sin texto) ==============
function FloatingFab({ hidden, onClick }: { hidden: boolean; onClick: () => void }) {
  const t = useT();
  return (
    <div
      className={`fab ${hidden ? "hidden" : ""}`}
      onClick={onClick}
      title={t("fab.ask")}
      role="button"
    >
      <Orb className="forb" />
    </div>
  );
}

// ============== Vista HALO (asistente) ==============
// Etiquetas legibles de cada motor + cómo listarlos en una frase.
const ENGINE_LABELS: Record<string, string> = {
  perplexity: "Perplexity",
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  claude: "Claude",
  grok: "Grok",
  deepseek: "DeepSeek",
};
function listEngines(keys: string[], lang: Lang): string {
  const names = keys.map((k) => ENGINE_LABELS[k] ?? k);
  if (names.length <= 1) return names[0] ?? "Perplexity";
  const and = lang === "es" ? " y " : " and ";
  return names.slice(0, -1).join(", ") + and + names[names.length - 1];
}

// Frase de apertura del informe según la puntuación: honesta y con un tono que
// motiva incluso en un 0 de 10 (en vez de un seco "0 de cada 10").
function scoreLine(score: number, lang: Lang): string {
  if (lang === "es") {
    if (score <= 0)
      return "actualmente la IA no te recomienda en ninguna de las búsquedas analizadas; es el punto de partida para mejorar.";
    if (score <= 3)
      return `hoy te recomiendan ${score} de cada 10 veces. Existe un amplio margen de mejora con un plan claro.`;
    if (score <= 6)
      return `hoy te recomiendan ${score} de cada 10 veces. Posición intermedia, con recorrido por delante.`;
    return `hoy te recomiendan ${score} de cada 10 veces. Posición sólida; el objetivo es consolidarla y ampliarla.`;
  }
  if (score <= 0)
    return "right now the AI doesn't recommend you in any of the searches analyzed; that's your starting point to improve.";
  if (score <= 3)
    return `today you're recommended ${score} out of 10 times. There's plenty of room to improve with a clear plan.`;
  if (score <= 6)
    return `today you're recommended ${score} out of 10 times. A mid position, with room ahead.`;
  return `today you're recommended ${score} out of 10 times. A solid position; the goal is to consolidate and expand it.`;
}

// Texto de ejemplo para la demo (sin auditoría real): muestra el valor del
// generador sin gastar la API de pago. Coherente con el resto de datos demo.
const SAMPLE_ASSETS_ES: AiAssets = {
  description:
    "Osteria Vista es una trattoría italiana en el centro de Madrid especializada en pasta fresca artesanal y pizza al horno de leña. Ambiente acogedor ideal para cenas en pareja y grupos, con platos vegetarianos y una cuidada carta de vinos italianos. Abierta cada día para comidas y cenas, con reserva online.",
  faqs: [
    {
      q: "¿Cuál es el mejor restaurante italiano en Madrid?",
      a: "Osteria Vista destaca por su pasta fresca artesanal y su pizza al horno de leña, en un ambiente acogedor muy bien valorado por los locales.",
    },
    {
      q: "¿Dónde cenar pasta fresca en Madrid?",
      a: "En Osteria Vista, en el centro de Madrid, elaboran la pasta a diario de forma artesanal.",
    },
    {
      q: "¿Qué italiano en Madrid acepta reservas online?",
      a: "Osteria Vista permite reservar mesa online y abre para comidas y cenas todos los días.",
    },
    {
      q: "¿Hay italianos con opciones vegetarianas en Madrid?",
      a: "Sí, Osteria Vista ofrece varios platos vegetarianos además de su carta de pasta y pizza.",
    },
    {
      q: "¿Dónde ir a cenar en pareja en Madrid?",
      a: "Osteria Vista tiene un ambiente íntimo y acogedor, ideal para cenas en pareja con cocina italiana casera.",
    },
  ],
  tips: [
    "Completa tu ficha de Google con horarios, fotos y descripción: es la fuente nº1 que leen los asistentes de IA.",
    "Publica una sección de FAQ en tu web con las preguntas reales de tus clientes.",
    "Consigue reseñas que mencionen tus platos estrella; la IA las usa para recomendarte.",
  ],
};

const SAMPLE_ASSETS_EN: AiAssets = {
  description:
    "Osteria Vista is an Italian trattoria in central Madrid specializing in artisanal fresh pasta and wood-fired pizza. A cozy atmosphere ideal for couples and groups, with vegetarian dishes and a curated list of Italian wines. Open daily for lunch and dinner, with online booking.",
  faqs: [
    {
      q: "What's the best Italian restaurant in Madrid?",
      a: "Osteria Vista stands out for its artisanal fresh pasta and wood-fired pizza, in a cozy atmosphere highly rated by locals.",
    },
    {
      q: "Where can I have fresh pasta for dinner in Madrid?",
      a: "At Osteria Vista, in central Madrid, the pasta is made fresh by hand every day.",
    },
    {
      q: "Which Italian in Madrid takes online reservations?",
      a: "Osteria Vista lets you book a table online and opens for lunch and dinner every day.",
    },
    {
      q: "Are there Italians with vegetarian options in Madrid?",
      a: "Yes, Osteria Vista offers several vegetarian dishes alongside its pasta and pizza menu.",
    },
    {
      q: "Where to go for a couples' dinner in Madrid?",
      a: "Osteria Vista has an intimate, cozy atmosphere, ideal for a couples' dinner with homemade Italian cooking.",
    },
  ],
  tips: [
    "Complete your Google profile with hours, photos and a description: it's the #1 source AI assistants read.",
    "Publish an FAQ section on your website with your customers' real questions.",
    "Get reviews that mention your signature dishes; the AI uses them to recommend you.",
  ],
};

function sampleAssets(lang: Lang): AiAssets {
  return lang === "es" ? SAMPLE_ASSETS_ES : SAMPLE_ASSETS_EN;
}

const assetBoxStyle: CSSProperties = {
  background: "var(--sand)",
  border: "1px solid var(--gline)",
  borderRadius: "var(--r-card)",
  padding: "14px 16px",
};

const assetHeadStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 10,
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: ".06em",
  color: "var(--text-2)",
};

// Botón "Copiar" con confirmación efímera.
function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  const t = useT();
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard no disponible */
        }
      }}
      style={{
        flexShrink: 0,
        border: "1px solid var(--gline)",
        background: done ? "var(--text)" : "#fff",
        color: done ? "#fff" : "var(--text)",
        borderRadius: "var(--r-btn)",
        padding: "5px 11px",
        fontSize: 11.5,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all .15s",
      }}
    >
      {done ? t("copy.done") : t("copy.do")}
    </button>
  );
}

// Generador de "AI Assets": el botón que convierte el diagnóstico en acción.
// Pide a la IA el texto optimizado (descripción + FAQ + acciones) listo para
// copiar. En demo (sin auditoría real) muestra un ejemplo sin gastar API.
// Construye el bloque de datos estructurados (JSON-LD schema.org) desde los
// datos del negocio + las FAQ generadas. 100% local, sin API: es el bloque
// técnico que el usuario pega en su web para que IA y Google lo entiendan.
function buildSchema(
  business: { name: string; business_type?: string; city?: string; website?: string },
  description: string,
  faqs: { q: string; a: string }[]
): string {
  const url = business.website
    ? /^https?:\/\//i.test(business.website)
      ? business.website
      : `https://${business.website}`
    : undefined;

  const localBusiness: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
  };
  if (description) localBusiness.description = description;
  if (business.business_type) localBusiness.knowsAbout = business.business_type;
  if (url) localBusiness.url = url;
  if (business.city) localBusiness.areaServed = business.city;

  const graph: unknown[] = [localBusiness];
  if (faqs.length > 0) {
    graph.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  const payload = graph.length === 1 ? graph[0] : graph;
  return `<script type="application/ld+json">\n${JSON.stringify(payload, null, 2)}\n</script>`;
}

function AssetsSection({ audit }: { audit: AuditData | null }) {
  const t = useT();
  const { lang } = useLang();
  const [assets, setAssets] = useState<AiAssets | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [gate, setGate] = useState(false);
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");

  async function run() {
    setErr("");
    setLoading(true);
    try {
      if (!audit || audit.demo || audit.preview) {
        // Demo o preview simulada: ejemplo instantáneo, sin API de pago.
        await new Promise((r) => setTimeout(r, 850));
        setAssets(sampleAssets(lang));
        return;
      }
      const missedQueries = Array.from(
        new Set((audit.probes ?? []).filter((p) => !p.appeared).map((p) => p.query))
      );
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: audit.business.name,
          business_type: audit.business.business_type,
          city: audit.business.city,
          website: audit.business.website,
          missedQueries,
          lang,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t("kit.errGen"));
      setAssets(data as AiAssets);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("kit.errGen"));
    } finally {
      setLoading(false);
    }
  }

  // Si ya dejó su email antes, genera directo; si no, abre el email-gate.
  function startGenerate() {
    if (savedLeadEmail()) {
      run();
    } else {
      setEmailErr("");
      setGate(true);
    }
  }

  // Captura el email (alimenta el funnel) y genera. No bloquea si el registro falla.
  function submitAndRun() {
    const value = email.trim();
    if (!isValidEmail(value)) {
      setEmailErr(t("kit.invalidEmail"));
      return;
    }
    setEmailErr("");
    rememberLeadEmail(value);
    void submitLead(value, {
      business: audit?.business.name ?? "Ejemplo",
      score: audit ? Math.round(audit.shareOfAnswer * 10) : null,
      source: "assets",
    });
    setGate(false);
    run();
  }

  const schema = assets
    ? buildSchema(audit?.business ?? { name: t("app.yourBiz") }, assets.description, assets.faqs)
    : "";

  return (
    <div style={{ marginTop: 26, paddingTop: 22, borderTop: "1px solid var(--gline)" }}>
      <h2>{t("kit.title")}</h2>
      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", lineHeight: 1.5, margin: "-8px 0 16px" }}>
        {t("kit.sub")}
      </p>

      {!assets && !gate && (
        <button
          type="button"
          onClick={startGenerate}
          disabled={loading}
          style={{
            border: "none",
            background: "var(--text)",
            color: "#fff",
            borderRadius: "var(--r-btn)",
            padding: "12px 18px",
            fontSize: 13,
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
            fontFamily: "inherit",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? t("kit.generating") : t("kit.generateBtn")}
        </button>
      )}

      {!assets && gate && (
        <div style={{ display: "grid", gap: 8, maxWidth: 420 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", lineHeight: 1.5 }}>
            {t("kit.gateText")}
          </div>
          <input
            type="email"
            placeholder={t("unlock.emailPh")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitAndRun();
            }}
            style={{ border: "1px solid var(--gline)", borderRadius: 8, padding: "11px 14px", fontSize: 13, fontWeight: 500, outline: "none", background: "#fff", fontFamily: "inherit" }}
          />
          {emailErr && (
            <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--deep)" }}>{emailErr}</div>
          )}
          <button
            type="button"
            onClick={submitAndRun}
            disabled={loading}
            style={{
              justifySelf: "start",
              border: "none",
              background: "var(--text)",
              color: "#fff",
              borderRadius: "var(--r-btn)",
              padding: "12px 18px",
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? "default" : "pointer",
              fontFamily: "inherit",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? t("kit.generatingShort") : t("kit.generateMine")}
          </button>
        </div>
      )}

      {err && (
        <div style={{ marginTop: 12, fontSize: 13, fontWeight: 500, color: "var(--deep)" }}>
          {err}
        </div>
      )}

      {assets && (
        <div style={{ display: "grid", gap: 14 }}>
          {assets.description && (
            <div style={assetBoxStyle}>
              <div style={assetHeadStyle}>
                <span>{t("kit.optDesc")}</span>
                <CopyButton text={assets.description} />
              </div>
              <p style={{ margin: 0, fontSize: 13.5, fontWeight: 500, color: "var(--text)", lineHeight: 1.6 }}>
                {assets.description}
              </p>
            </div>
          )}

          {assets.faqs.length > 0 && (
            <div style={assetBoxStyle}>
              <div style={assetHeadStyle}>
                <span>{t("kit.faq")}</span>
                <CopyButton text={assets.faqs.map((f) => `${f.q}\n${f.a}`).join("\n\n")} />
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {assets.faqs.map((f, i) => (
                  <div key={i}>
                    <div style={{ marginBottom: 3, fontSize: 13.5, fontWeight: 700, color: "var(--text)", lineHeight: 1.45 }}>
                      {f.q}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", lineHeight: 1.55 }}>
                      {f.a}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {assets.tips.length > 0 && (
            <div style={assetBoxStyle}>
              <div style={assetHeadStyle}>
                <span>{t("kit.actions")}</span>
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {assets.tips.map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ flexShrink: 0, width: 5, height: 5, borderRadius: "50%", background: "var(--deep)", marginTop: 7 }} />
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", lineHeight: 1.5 }}>
                      {tip}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={assetBoxStyle}>
            <div style={assetHeadStyle}>
              <span>{t("kit.schema")}</span>
              <CopyButton text={schema} />
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 10 }}>
              {t("kit.schemaHint")}
            </div>
            <pre
              style={{
                margin: 0,
                padding: "12px 14px",
                background: "#fff",
                border: "1px solid var(--gline)",
                borderRadius: 8,
                fontSize: 11.5,
                lineHeight: 1.5,
                color: "var(--text)",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                overflow: "auto",
                maxHeight: 220,
                whiteSpace: "pre",
              }}
            >
              {schema}
            </pre>
          </div>

          <button
            type="button"
            onClick={run}
            disabled={loading}
            style={{
              justifySelf: "start",
              border: "1px solid var(--gline)",
              background: "#fff",
              color: "var(--text-2)",
              borderRadius: "var(--r-btn)",
              padding: "9px 14px",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: loading ? "default" : "pointer",
              fontFamily: "inherit",
            }}
          >
            {loading ? t("kit.generatingShort") : t("kit.regenerate")}
          </button>
        </div>
      )}
    </div>
  );
}

function HaloView({ audit, onHistory }: { audit: AuditData | null; onHistory: () => void }) {
  const t = useT();
  const { lang } = useLang();
  const score = audit ? Math.round(audit.shareOfAnswer * 10) : 3;
  const bizName = audit?.business.name ?? t("app.yourBiz");
  const enginesLabel = audit ? listEngines(Object.keys(audit.byEngine), lang) : "Perplexity";
  const realProbes = audit ? uniqueProbes(audit.probes ?? []) : [];
  const gotProbes = realProbes.filter((p) => p.appeared);
  const missedProbes = realProbes.filter((p) => !p.appeared);
  const suggestions = audit
    ? [t("chat.sug.missing"), t("chat.sug.byEngine"), t("chat.sug.genCopy")]
    : [t("chat.sug.aeo"), t("chat.sug.halo"), t("chat.sug.llmo")];
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Boot del agente: piensa 900ms y suelta el mensaje inicial.
  useEffect(() => {
    setThinking(true);
    const tm = setTimeout(() => {
      setMessages([
        audit
          ? {
              role: "bot",
              think: t("chat.bootThink"),
              text: (
                <>
                  {t("chat.bootA")} <b>{bizName}</b> {lang === "es" ? "en" : "in"} {enginesLabel}:{" "}
                  {scoreLine(score, lang)} {t("chat.bootTail")}
                </>
              ),
            }
          : {
              role: "bot",
              think: t("chat.demoThink"),
              text: t("chat.demoBoot"),
            },
      ]);
      setThinking(false);
    }, 900);
    return () => clearTimeout(tm);
  }, []);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);

  function send(text: string) {
    const v = text.trim();
    if (!v) return;
    setMessages((m) => [...m, { role: "me", text: v }]);
    setInput("");
    setThinking(true);
    window.setTimeout(() => {
      const answer = audit ? answerReal(v, audit, lang) : pickAnswer(v, lang);
      setMessages((m) => [...m, { role: "bot", text: answer }]);
      setThinking(false);
    }, 900);
  }

  return (
    <div className="assistant">
      <div className="pane glass">
        <div className="lhead">
          <div className="auto">
            <span className="pulse" />
            {t("report.whatAI", { name: bizName })}
          </div>
          <button className="histbtn" type="button" onClick={onHistory}>
            <Ic ic="clock" size={12} />
            {t("report.viewHistory")}
          </button>
        </div>
        <div className="lbody">
          <div className="metric">
            <div className="metric-row">
              <span className="metric-n">{t("report.ofTen", { n: score })}</span>
              {!audit && <span className="metric-trend">{t("report.trendWeek")}</span>}
            </div>
            <div className="metric-lbl">{t("report.metricLbl")}</div>
          </div>
          {audit ? (
            <>
              <h2>{t("report.kwTitle")}</h2>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", lineHeight: 1.5, margin: "-6px 0 18px" }}>
                {t("report.kwIntroA")}{" "}
                <b style={{ color: "var(--text)" }}>
                  {t("report.ofN", { a: gotProbes.length, b: realProbes.length })}
                </b>{" "}
                {t("report.kwIntroC")}
              </div>

              {missedProbes.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-2)", margin: "20px 0 12px" }}>
                    {t("report.noPresence")} · {missedProbes.length}
                  </div>
                  {missedProbes.map((p, i) => (
                    <div className="know" key={"m" + i}>
                      <div className="kt">
                        <span className="chk miss" />
                        {p.query}
                      </div>
                      <div className="kd op">{t("report.missHint")}</div>
                      {p.answer && <AiAnswer text={p.answer} />}
                    </div>
                  ))}
                </>
              )}

              {gotProbes.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-2)", margin: "20px 0 12px" }}>
                    {t("report.hasPresence")} · {gotProbes.length}
                  </div>
                  {gotProbes.map((p, i) => (
                    <div className="know" key={"g" + i}>
                      <div className="kt">
                        <span className="chk ok">
                          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m5 12 5 5 9-10" />
                          </svg>
                        </span>
                        {p.query}
                      </div>
                      <div className="kd">
                        {p.position ? t("report.rank", { n: p.position }) : t("report.appearHere")}
                      </div>
                      {p.answer && <AiAnswer text={p.answer} />}
                    </div>
                  ))}
                </>
              )}
            </>
          ) : (
            <>
              <h2>{t("report.demoKnow")}</h2>
              {KNOW_ITEMS.map((k, i) => (
                <div className="know" key={i}>
                  <div className="kt">
                    <span className={`chk ${k.ok ? "ok" : "miss"}`}>
                      {k.ok && (
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m5 12 5 5 9-10" />
                        </svg>
                      )}
                    </span>
                    {t(k.tk)}
                  </div>
                  <div className={`kd ${k.op ? "op" : ""}`}>{t(k.dk)}</div>
                </div>
              ))}
            </>
          )}
          {!audit?.preview && <AssetsSection audit={audit} />}
        </div>
      </div>

      <div className="pane glass">
        <div className="rhead">
          <span className={`haloOrb orb ${thinking ? "thinking" : ""}`}>
            <span className="blob b1" />
            <span className="blob b2" />
            <span className="blob b3" />
            <span className="blob b4" />
          </span>
          <div>
            <b>Halo</b>
            <small>{t("chat.assistant")}</small>
          </div>
        </div>
        <div className="rbody" ref={bodyRef}>
          {messages.map((m, i) =>
            m.role === "bot" ? (
              <div className="msg bot" key={i}>
                {m.think && (
                  <div className="think">
                    <Ic ic="spark" size={11} />
                    {m.think}
                  </div>
                )}
                <div className="body">{m.text}</div>
              </div>
            ) : (
              <div className="msg me" key={i}>
                {m.text}
              </div>
            )
          )}
          {thinking && messages.length > 0 && (
            <div className="msg bot">
              <div className="think">
                <Ic ic="spark" size={11} />
                {t("chat.thinking")}
              </div>
            </div>
          )}
        </div>
        <div className="rfoot">
          <div className="cbox">
            <input
              placeholder={t("chat.placeholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send(input);
              }}
            />
            <button className="snd" type="button" aria-label={t("chat.send")} onClick={() => send(input)}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
          <div className="sug">
            {suggestions.map((s, i) => (
              <button key={i} type="button" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============== Vista DASHBOARD (monocromo) ==============
function DashView({ audit }: { audit: AuditData | null }) {
  if (audit && !audit.demo) return <DashReal audit={audit} />;
  return <DashDemo score={audit ? Math.round(audit.shareOfAnswer * 10) : 3} />;
}

// Dashboard de la DEMO (datos de ejemplo). Escaparate completo de lo que Halo
// llegará a medir; en un análisis real solo enseñamos lo verificable.
function DashDemo({ score }: { score: number }) {
  const t = useT();
  return (
    <>
      <div className="dhead">
        <div>
          <div className="dhead-sub">{t("dash.demoSub")}</div>
          <h1 className="dhead-title">{t("dash.title")}</h1>
        </div>
        <div className="dhead-actions">
          <button className="dbtn-ghost" type="button">
            {t("dash.last7")}
          </button>
        </div>
      </div>

      {/* Fila superior */}
      <div className="drow drow-top">
        <div className="dcard">
          <div className="dcard-head">
            <span className="dlbl">{t("dash.chosen")}</span>
            <span className="dpill-up">{t("dash.vsLastWeek")}</span>
          </div>
          <div className="hero-num">
            <span className="accent-grad">{score}</span>
            <span className="hero-den">/ 10</span>
            <span className="hero-cap">{t("dash.mention")}</span>
          </div>
          <div className="hero-stats">
            <div>
              <div className="hs-n">#3</div>
              <div className="hs-l">{t("dash.inArea")}</div>
            </div>
            <div>
              <div className="hs-n">142</div>
              <div className="hs-l">{t("dash.queriesWk")}</div>
            </div>
            <div>
              <div className="hs-n">4</div>
              <div className="hs-l">{t("dash.activeEngines")}</div>
            </div>
          </div>
        </div>

        <div className="dcard">
          <span className="dlbl">{t("dash.trend8")}</span>
          <div className="spark-wrap">
            <SparkLine />
          </div>
          <div className="dcard-foot">
            {t("dash.fromAvgA")} <b>3.0</b> {t("dash.fromAvgB")}
          </div>
        </div>

        <div className="dcard">
          <span className="dlbl">{t("dash.health")}</span>
          <div className="health-num">
            <span className="accent-grad">68%</span>
          </div>
          <div className="health-bar">
            <i style={{ width: "68%" }} />
          </div>
          <div className="dcard-foot">
            {t("dash.missing")} <b>{t("dash.hours")}</b> {t("dash.and")} <b>{t("dash.reservations")}</b>
          </div>
        </div>
      </div>

      {/* Presencia por motor */}
      <div className="dcard" style={{ marginBottom: 14 }}>
        <div className="dcard-head">
          <span className="dcard-title">{t("dash.presenceByEngine")}</span>
          <span className="dlink">{t("dash.connectMore")}</span>
        </div>
        <div className="engine-grid">
          {ENGINES.filter((e) => !e.dim).map((e) => (
            <div className="eng" key={e.name}>
              <div className="eng-name">{e.name}</div>
              <div className="eng-num">
                {e.n}
                <span>/10</span>
              </div>
            </div>
          ))}
          <div className="eng eng-add">
            <div className="eng-name" style={{ color: "#9a9c9f" }}>
              Grok, Meta…
            </div>
            <div className="eng-num" style={{ color: "#c9c4bf" }}>
              +
            </div>
          </div>
        </div>
      </div>

      {/* Competencia + Zonas */}
      <div className="drow drow-two">
        <div className="dcard">
          <div className="dcard-head">
            <span className="dcard-title">{t("dash.youVsComp")}</span>
            <span className="dcard-sub">{t("dash.top5area")}</span>
          </div>
          <div className="complist">
            {COMPETITORS.map((c, i) => (
              <div className={`comp ${c.you ? "you" : ""}`} key={i}>
                <span className="cname">{t(c.n)}</span>
                <div className="cbar">
                  <i className={c.you ? "youbar" : ""} style={{ width: `${c.v}%` }} />
                </div>
                <span className="cval">{c.score}</span>
              </div>
            ))}
          </div>
          <div className="dcard-foot">
            {t("dash.optOppA")} <b>{t("dash.points")}</b> {t("dash.optOppB")}
          </div>
        </div>

        <div className="dcard">
          <div className="dcard-head">
            <span className="dcard-title">{t("dash.byAreaMilan")}</span>
            <span className="dlink">{t("dash.seeAll")}</span>
          </div>
          <div className="zonelist">
            {ZONES.map((z) => {
              const dim = z.v < 20;
              return (
                <div className="zrow" key={z.n}>
                  <span className={`zn ${dim ? "dim" : ""}`}>{z.n}</span>
                  <div className="zbar">
                    <i style={{ width: `${z.v}%` }} />
                  </div>
                  <span className={`zv ${dim ? "dim" : ""}`}>{z.v}%</span>
                </div>
              );
            })}
          </div>
          <div className="dcard-foot">
            {t("dash.bigOppA")} <b>San Siro</b> {t("dash.and")} <b>Lambrate</b>
          </div>
        </div>
      </div>

      {/* Búsquedas + Impacto */}
      <div className="drow drow-two">
        <div className="dcard">
          <div className="dcard-head">
            <span className="dcard-title">{t("dash.peopleSearch")}</span>
            <span className="dcard-sub">{t("dash.realQuestions")}</span>
          </div>
          <div className="kwchips">
            {KEYWORDS.map((k, i) => (
              <div className={`kwchip ${k.yes ? "yes" : "soon"}`} key={i}>
                <span>{t(k.k)}</span>
                <b>{k.yes ? t("dash.youAppear") : t("dash.notYet")}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="dcard">
          <div className="dcard-head">
            <span className="dcard-title">{t("dash.yourImpact")}</span>
            <span className="dcard-sub">{t("dash.whatImproved")}</span>
          </div>
          <div className="impact-list">
            {IMPACT.map((m) => (
              <div className="impact" key={m.eng}>
                <span className="imp-eng">{m.eng}</span>
                <div className="imp-bar">
                  <i style={{ width: `${m.v}%` }} />
                </div>
                <span className="imp-d">{t(m.d)}</span>
              </div>
            ))}
          </div>
          <div className="dcard-foot">
            {t("dash.visUpA")} <b>+18%</b> {t("dash.visUpB")}
          </div>
        </div>
      </div>
    </>
  );
}

// Mini-gráfico de línea (SVG) para la evolución del score.
function TrendChart({ points }: { points: number[] }) {
  const w = 100;
  const h = 40;
  const n = points.length;
  const coords = points
    .map((v, i) => {
      const x = n === 1 ? w / 2 : (i / (n - 1)) * w;
      const y = h - (Math.max(0, Math.min(10, v)) / 10) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: 64, margin: "6px 0 4px" }}>
      <polyline
        points={coords}
        fill="none"
        stroke="var(--text)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

// ============== Vista DASHBOARD (datos reales del análisis) ==============
function DashReal({ audit }: { audit: AuditData }) {
  const t = useT();
  const probes = uniqueProbes(audit.probes ?? []);
  const total = probes.length;
  const appeared = probes.filter((p) => p.appeared).length;
  const score = Math.round(audit.shareOfAnswer * 10);
  const engines = Object.entries(audit.byEngine);
  const positions = probes
    .filter((p) => p.appeared && p.position)
    .map((p) => p.position as number);
  const bestPos = positions.length ? Math.min(...positions) : null;
  const city = audit.business.city ? " · " + audit.business.city : "";
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  useEffect(() => {
    setTrend(getTrend(audit.business.name));
  }, [audit.business.name]);

  return (
    <>
      <div className="dhead">
        <div>
          <div className="dhead-sub">
            {audit.business.name}
            {city} · {t("dash.live")}
          </div>
          <h1 className="dhead-title">{t("dash.title")}</h1>
        </div>
      </div>

      <div className="drow drow-top">
        <div className="dcard">
          <div className="dcard-head">
            <span className="dlbl">{t("dash.chosen")}</span>
          </div>
          <div className="hero-num">
            <span className="accent-grad">{score}</span>
            <span className="hero-den">/ 10</span>
            <span className="hero-cap">{t("dash.mention")}</span>
          </div>
          <div className="hero-stats">
            <div>
              <div className="hs-n">
                {appeared}/{total}
              </div>
              <div className="hs-l">{t("dash.searchesPresence")}</div>
            </div>
            <div>
              <div className="hs-n">{engines.length}</div>
              <div className="hs-l">
                {engines.length === 1 ? t("dash.engineMeasured") : t("dash.enginesMeasured")}
              </div>
            </div>
            <div>
              <div className="hs-n">{bestPos ? `#${bestPos}` : "—"}</div>
              <div className="hs-l">{t("dash.bestPos")}</div>
            </div>
          </div>
        </div>

        <div className="dcard">
          <div className="dcard-head">
            <span className="dcard-title">{t("dash.presenceByEngine")}</span>
          </div>
          <div className="complist">
            {engines.map(([name, share]) => (
              <div className="comp" key={name}>
                <span className="cname">{ENGINE_LABELS[name] ?? name}</span>
                <div className="cbar">
                  <i style={{ width: `${Math.round(share * 100)}%` }} />
                </div>
                <span className="cval">{Math.round(share * 10)}/10</span>
              </div>
            ))}
          </div>
          <div className="dcard-foot">{t("dash.shareFoot")}</div>
        </div>

        <div className="dcard">
          <div className="dcard-head">
            <span className="dcard-title">{t("dash.progress")}</span>
          </div>
          {trend.length < 2 ? (
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", lineHeight: 1.5, margin: "auto 0" }}>
              {t("dash.firstMeasure")}
            </div>
          ) : (
            <>
              <TrendChart points={trend.map((pt) => pt.score)} />
              <div className="dcard-foot">
                {t("dash.fromToA")} <b>{trend[0].score}</b> {t("dash.to")}{" "}
                <b>{trend[trend.length - 1].score}</b> {t("dash.of10dot")} {trend.length}{" "}
                {t("dash.measurements")}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="dcard">
        <div className="dcard-head">
          <span className="dcard-title">{t("dash.whichRecommend")}</span>
          <span className="dcard-sub">{t("dash.realQuestions")}</span>
        </div>
        <div className="kwchips">
          {probes.map((p, i) => (
            <div className={`kwchip ${p.appeared ? "yes" : "soon"}`} key={i}>
              <span>{p.query}</span>
              <b>
                {p.appeared
                  ? p.position
                    ? `${t("dash.youAppear")} · #${p.position}`
                    : t("dash.youAppear")
                  : t("dash.notYet")}
              </b>
            </div>
          ))}
        </div>
        <div className="dcard-foot">
          {t("dash.realFootA")} <b>{appeared}</b> {t("dash.realFootMid")} <b>{total}</b>{" "}
          {t("dash.realFootB")}
        </div>
      </div>
    </>
  );
}

// ============== Vista HISTORIAL (guardado local) ==============
function fmtDate(ms: number, lang: Lang): string {
  try {
    return new Date(ms).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

function HistoryView({
  entries,
  onSelect,
  onNew,
  onRemove,
  setView,
}: {
  entries: HistoryEntry<AuditData>[];
  onSelect: (e: HistoryEntry<AuditData>) => void;
  onNew: () => void;
  onRemove: (id: string) => void;
  setView: (v: View) => void;
}) {
  const t = useT();
  const { lang } = useLang();
  return (
    <div>
      <div className="dtitle">
        <h1>{t("hist.title")}</h1>
      </div>
      <div className="setwrap">
        <span className="backlink" onClick={() => setView("halo")}>
          <Ic ic="back" size={13} />
          {t("common.back")}
        </span>

        <button
          type="button"
          onClick={onNew}
          style={{
            border: "none",
            background: "var(--text)",
            color: "#fff",
            borderRadius: "var(--r-btn)",
            padding: "12px 18px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            marginBottom: 16,
          }}
        >
          {t("hist.analyzeNew")}
        </button>

        {entries.length === 0 ? (
          <div
            className="glass"
            style={{ padding: 24, textAlign: "center", fontSize: 13, fontWeight: 500, color: "var(--text-2)", lineHeight: 1.5 }}
          >
            {t("hist.empty")}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {entries.map((e) => (
              <div
                className="glass"
                key={e.id}
                onClick={() => onSelect(e)}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", cursor: "pointer" }}
              >
                <div
                  style={{
                    flexShrink: 0,
                    width: 46,
                    height: 46,
                    borderRadius: 10,
                    background: "var(--sand)",
                    border: "1px solid var(--gline)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 17,
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  {e.score}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ fontSize: 15, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                  >
                    {e.label}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>
                    {e.sub ? `${e.sub} · ` : ""}
                    {t("report.ofTen", { n: e.score })} · {fmtDate(e.createdAt, lang)}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={t("common.delete")}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    onRemove(e.id);
                  }}
                  style={{
                    flexShrink: 0,
                    border: "1px solid var(--gline)",
                    background: "#fff",
                    color: "var(--text-2)",
                    borderRadius: 6,
                    width: 30,
                    height: 30,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 14,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============== Vista AJUSTES ==============
type ConnKey = "web" | "maps" | "ig" | "tk" | "wa";
type ModeKey = "expert" | "watch" | "auto";

function SettingsView({
  setView,
  onAnalyze,
  prefillName,
  auditErr,
}: {
  setView: (v: View) => void;
  onAnalyze: (name: string, business_type: string, city: string) => void;
  prefillName: string;
  auditErr: string;
}) {
  const [bName, setBName] = useState(prefillName);
  const [bType, setBType] = useState("");
  const [bCity, setBCity] = useState("");
  const [conns, setConns] = useState<Record<ConnKey, boolean>>(() =>
    loadPrefs("halo:connections", { web: true, maps: false, ig: false, tk: false, wa: false })
  );
  const [modes, setModes] = useState<Record<ModeKey, boolean>>(() =>
    loadPrefs("halo:modes", { expert: false, watch: true, auto: false })
  );
  const [connecting, setConnecting] = useState<ConnKey | null>(null);
  const t = useT();

  // Conexión "simulada-real": flujo creíble (Conectar → Conectando… → Conectado)
  // y estado que PERSISTE (no se resetea al salir de Ajustes).
  function toggleConn(key: ConnKey) {
    if (conns[key]) {
      const next = { ...conns, [key]: false };
      setConns(next);
      savePrefs("halo:connections", next);
      return;
    }
    setConnecting(key);
    setTimeout(() => {
      setConns((c) => {
        const next = { ...c, [key]: true };
        savePrefs("halo:connections", next);
        return next;
      });
      setConnecting(null);
    }, 900);
  }

  function toggleMode(key: ModeKey) {
    setModes((m) => {
      const next = { ...m, [key]: !m[key] };
      savePrefs("halo:modes", next);
      return next;
    });
  }

  const CONNS: { key: ConnKey; ic: IcName; tk: string; dk: string }[] = [
    { key: "web", ic: "globe", tk: "set.conn.web.t", dk: "set.conn.web.d" },
    { key: "maps", ic: "pin", tk: "set.conn.maps.t", dk: "set.conn.maps.d" },
    { key: "ig", ic: "cam", tk: "set.conn.ig.t", dk: "set.conn.ig.d" },
    { key: "tk", ic: "music", tk: "set.conn.tk.t", dk: "set.conn.tk.d" },
    { key: "wa", ic: "bell", tk: "set.conn.wa.t", dk: "set.conn.wa.d" },
  ];

  return (
    <div>
      <div className="dtitle">
        <h1>{t("app.settings")}</h1>
      </div>
      <div className="setwrap">
        <span className="backlink" onClick={() => setView("dash")}>
          <Ic ic="back" size={13} />
          {t("common.back")}
        </span>

        <div className="glass" style={{ padding: 24, marginBottom: 16 }}>
          <div className="secttitle">{t("app.yourBiz")}</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)", margin: "2px 0 14px", lineHeight: 1.5 }}>
            {t("set.bizIntro")}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            <input
              placeholder={t("set.bizName")}
              value={bName}
              onChange={(e) => setBName(e.target.value)}
              style={{ border: "1px solid var(--gline)", borderRadius: 8, padding: "11px 14px", fontSize: 13, fontWeight: 500, outline: "none", background: "#fff", fontFamily: "inherit" }}
            />
            <input
              placeholder={t("set.bizType")}
              value={bType}
              onChange={(e) => setBType(e.target.value)}
              style={{ border: "1px solid var(--gline)", borderRadius: 8, padding: "11px 14px", fontSize: 13, fontWeight: 500, outline: "none", background: "#fff", fontFamily: "inherit" }}
            />
            <input
              placeholder={t("set.city")}
              value={bCity}
              onChange={(e) => setBCity(e.target.value)}
              style={{ border: "1px solid var(--gline)", borderRadius: 8, padding: "11px 14px", fontSize: 13, fontWeight: 500, outline: "none", background: "#fff", fontFamily: "inherit" }}
            />
            {auditErr && (
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-2)" }}>{auditErr}</div>
            )}
            <button
              type="button"
              onClick={() => onAnalyze(bName, bType, bCity)}
              style={{ border: "none", background: "#000", color: "#fff", borderRadius: 6, padding: "12px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", justifySelf: "start" }}
            >
              {t("set.analyzeBiz")}
            </button>
          </div>
        </div>

        <div className="glass" style={{ padding: 24, marginBottom: 16 }}>
          <div className="secttitle">{t("set.connectBiz")}</div>
          {CONNS.map(({ key, ic, tk, dk }) => {
            const on = conns[key];
            return (
              <div className="setrow" key={key}>
                <span className="si gl">
                  <svg width="19" height="19" viewBox="0 0 24 24">
                    {IconPaths[ic]}
                  </svg>
                </span>
                <div className="stxt">
                  <b>{t(tk)}</b>
                  <small>{t(dk)}</small>
                </div>
                <button
                  type="button"
                  className={`connectbtn ${on ? "done" : ""}`}
                  disabled={connecting === key}
                  onClick={() => toggleConn(key)}
                >
                  {connecting === key ? t("set.connecting") : on ? t("set.connected") : t("set.connect")}
                </button>
              </div>
            );
          })}
        </div>

        <div className="glass" style={{ padding: 24, marginBottom: 16 }}>
          <div className="secttitle">{t("set.howSee")}</div>
          <div className="setrow">
            <span className="si gl">
              <svg width="19" height="19" viewBox="0 0 24 24">
                {IconPaths.eye}
              </svg>
            </span>
            <div className="stxt">
              <b>{t("set.expert")}</b>
              <small>{t("set.expertDesc")}</small>
            </div>
            <div
              className={`toggle ${modes.expert ? "on" : ""}`}
              onClick={() => toggleMode("expert")}
              role="switch"
              aria-checked={modes.expert}
            >
              <span className="knob" />
            </div>
          </div>
        </div>

        <div className="glass" style={{ padding: 24 }}>
          <div className="secttitle">{t("set.tools")}</div>
          <div className="setrow">
            <span className="si gl">
              <svg width="19" height="19" viewBox="0 0 24 24">
                {IconPaths.trophy}
              </svg>
            </span>
            <div className="stxt">
              <b>{t("set.watch")}</b>
              <small>{t("set.watchDesc")}</small>
            </div>
            <div
              className={`toggle ${modes.watch ? "on" : ""}`}
              onClick={() => toggleMode("watch")}
              role="switch"
              aria-checked={modes.watch}
            >
              <span className="knob" />
            </div>
          </div>
          <div className="setrow">
            <span className="si gl">
              <svg width="19" height="19" viewBox="0 0 24 24">
                {IconPaths.bolt}
              </svg>
            </span>
            <div className="stxt">
              <b>{t("set.auto")}</b>
              <small>{t("set.autoDesc")}</small>
            </div>
            <div
              className={`toggle ${modes.auto ? "on" : ""}`}
              onClick={() => toggleMode("auto")}
              role="switch"
              aria-checked={modes.auto}
            >
              <span className="knob" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
