"use client";

import { useState, useEffect, useRef } from "react";

// Orbe animado de Halo (el logo)
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

// Ícono genérico de IA (placeholder hasta meter logos oficiales)
function AiIcon() {
  return (
    <span className="ai-ic" aria-label="IA">
      <svg viewBox="0 0 24 24" fill="#17181B" stroke="none">
        <path d="M12 2.5l1.9 5.8a3 3 0 0 0 1.9 1.9L21.5 12l-5.8 1.9a3 3 0 0 0-1.9 1.9L12 21.5l-1.9-5.8a3 3 0 0 0-1.9-1.9L2.5 12l5.8-1.9a3 3 0 0 0 1.9-1.9L12 2.5z" />
      </svg>
    </span>
  );
}

type Screen = "landing" | "loading" | "app";
type View = "halo" | "dash" | "set";

const SECTORS = ["Restaurantes", "Clínicas", "SaaS", "Hoteles"];
const LOAD_STEPS = [
  "Localizando tu negocio",
  "Preguntando a los buscadores con IA",
  "Midiendo cuánto te eligen",
  "Preparando tus recomendaciones",
];

export default function HaloApp() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [view, setView] = useState<View>("halo");
  const [sectorIdx, setSectorIdx] = useState(0);
  const [loadDone, setLoadDone] = useState<number>(-1);
  const [menuOpen, setMenuOpen] = useState(false);

  // Rotación de sectores en la landing
  useEffect(() => {
    if (screen !== "landing") return;
    const t = setInterval(() => setSectorIdx((i) => (i + 1) % SECTORS.length), 2200);
    return () => clearInterval(t);
  }, [screen]);

  // Secuencia de carga
  function startAudit() {
    setScreen("loading");
    setLoadDone(-1);
    LOAD_STEPS.forEach((_, i) => {
      setTimeout(() => setLoadDone(i), 500 + i * 620);
    });
    setTimeout(() => {
      setScreen("app");
      setView("halo");
    }, 500 + 4 * 620 + 450);
  }

  function enterApp() {
    setScreen("app");
    setView("halo");
  }

  return (
    <>
      <div className="grain" />

      {screen === "landing" && (
        <div className="screen active">
          <nav>
            <div className="lbrand">
              <Orb className="dot" /> Halo
            </div>
            <div className="lnav-links">
              <span className="ainav">
                Pregúntale a tu IA:
                <AiIcon />
                <AiIcon />
                <AiIcon />
                <AiIcon />
              </span>
              <a>Cómo funciona</a>
              <a>Precios</a>
              <a className="enter" onClick={enterApp}>
                Entrar
              </a>
            </div>
          </nav>
          <div className="lstage">
            <div className="eyebrow">AEO • LLMO • Local Intelligence</div>
            <h1>
              Domina las recomendaciones
              <br />
              de la <span className="g">IA.</span>
            </h1>
            <p className="sub-title">Que la IA te elija a ti antes que a tu competencia.</p>
            <div className="glass lsearch">
              <input placeholder="Pega tu web, Google Maps o tu Instagram" autoComplete="off" />
              <button onClick={startAudit}>Analizar</button>
            </div>
            <div className="sectors">
              Ayudando a negocios a dominar la visibilidad en{" "}
              <b style={{ color: "var(--deep)" }}>{SECTORS[sectorIdx]}</b>
            </div>
            <div className="ltrust">
              <span>Resultados en segundos</span>
              <span className="sep" />
              <span
                style={{ cursor: "pointer", color: "var(--text)", fontWeight: 600 }}
                onClick={startAudit}
              >
                Probar con un ejemplo →
              </span>
            </div>
          </div>
          <div className="landing-teaser" onClick={startAudit}>
            <span className="lt-text">Esto está diciendo ChatGPT sobre tu negocio</span>
            <Orb className="lt-orb" />
          </div>
        </div>
      )}

      {screen === "loading" && (
        <div className="screen active" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
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
              Analizando <span className="lurl">tu negocio</span>
            </h2>
            <div className="lsteps">
              {LOAD_STEPS.map((s, i) => (
                <div key={i} className={`lstep ${i <= loadDone ? "done" : ""}`}>
                  <span className="tk">
                    <svg viewBox="0 0 24 24">
                      <path d="m5 12 5 5 9-10" />
                    </svg>
                  </span>
                  {s}
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
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
        />
      )}
    </>
  );
}

// El shell de la app (header + vistas). Separado para mantener orden.
function AppShell({
  view,
  setView,
  menuOpen,
  setMenuOpen,
}: {
  view: View;
  setView: (v: View) => void;
  menuOpen: boolean;
  setMenuOpen: (b: boolean) => void;
}) {
  return (
    <div className="screen active">
      <header>
        <div className="hbar">
          <div className="logo haloOrb" onClick={() => setView("halo")}>
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
              Tu negocio <span style={{ color: "var(--muted)" }}>▾</span>
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
                  Ajustes y conexiones
                </div>
                <div className="di">Cambiar de negocio</div>
                <div className="sep" />
                <div className="di out">Cerrar sesión</div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="stage">
        {view === "halo" && <HaloView />}
        {view === "dash" && <DashView />}
        {view === "set" && <SettingsView setView={setView} />}
      </div>
    </div>
  );
}

type Msg = { role: "bot" | "me"; text: string; think?: string };

const KNOW_ITEMS: { ok: boolean; t: string; d: string; op?: boolean }[] = [
  {
    ok: true,
    t: "Tu nombre y dónde estás",
    d: "Los tres motores te ubican en el centro de Milán y saben cómo te llamas.",
  },
  {
    ok: true,
    t: "A qué te dedicas",
    d: "Saben tu sector y tu especialidad principal.",
  },
  {
    ok: false,
    op: true,
    t: "Tu horario y los días que abres",
    d: "Esto te está costando recomendaciones los fines de semana. Es lo primero que arreglaría.",
  },
  {
    ok: false,
    op: true,
    t: "Tus servicios extra y opciones",
    d: "La gente le pregunta esto a la IA y, ahora mismo, tú no apareces en la respuesta.",
  },
  {
    ok: true,
    t: "Tu rango de precios",
    d: "Te ubican en gama media, justo donde quieres estar.",
  },
];

const SUGGESTIONS = [
  "¿Por qué solo 3 de 10?",
  "Arregla mi horario",
  "Háblame de mi competencia",
];

const BOT_REPLIES: Record<string, string> = {
  "¿Por qué solo 3 de 10?":
    "Porque ChatGPT, Perplexity y Gemini no tienen tu horario completo ni todos los servicios que ofreces. En cuanto añadamos eso, vas a subir en las próximas recomendaciones.",
  "Arregla mi horario":
    "Hecho. Acabo de actualizar tu horario en lo que ven los motores. Ahora ChatGPT, Perplexity y Gemini saben cuándo abres — eso te va a aparecer en las búsquedas del fin de semana.",
  "Háblame de mi competencia":
    "De los 5 negocios parecidos al tuyo en Milán, tú sales en 3 de 10 respuestas y el líder en 6. La diferencia está en que ellos sí tienen reseñas recientes y datos actualizados en lo que ve la IA.",
};

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

function HaloView() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      think: "Halo ha consultado a ChatGPT, Perplexity y Gemini",
      text:
        "Hola, soy Halo. He preguntado a ChatGPT, Perplexity y Gemini por negocios como el tuyo en Milán. Te eligen 3 de cada 10 veces. Puedo decirte qué te falta para que te elijan más — ¿por dónde empezamos?",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, thinking]);

  function send(text: string) {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, { role: "me", text: t }]);
    setInput("");
    setThinking(true);
    window.setTimeout(() => {
      const reply =
        BOT_REPLIES[t] ??
        "Lo estoy comprobando con ChatGPT, Perplexity y Gemini en directo. En cuanto tenga la respuesta, te aviso aquí mismo.";
      setMessages((m) => [
        ...m,
        { role: "bot", think: "Halo ha contrastado las tres IAs", text: reply },
      ]);
      setThinking(false);
    }, 1400);
  }

  return (
    <div className="assistant">
      <div className="pane glass">
        <div className="lhead">
          <div className="auto">
            <span className="pulse" />
            Tu negocio, en directo
          </div>
          <button className="histbtn" type="button">
            <span className="gl">
              <ClockIcon />
            </span>
            Historial
          </button>
        </div>
        <div className="lbody">
          <div className="metric">
            <div className="metric-row">
              <div className="metric-n">3 de 10</div>
              <div className="metric-trend">+1 esta semana</div>
            </div>
            <div className="metric-lbl">
              Cuando alguien le pregunta a la IA por un italiano en tu zona, te eligen 3 de cada 10 veces.
            </div>
          </div>
          <h2>Lo que ChatGPT, Perplexity y Gemini saben de ti</h2>
          {KNOW_ITEMS.map((k, i) => (
            <div className="know" key={i}>
              <div className="kt">
                <span className={`chk ${k.ok ? "ok" : "miss"}`}>
                  {k.ok ? (
                    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m5 12 5 5 9-10" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 7v6" />
                      <circle cx="12" cy="17" r="0.6" />
                    </svg>
                  )}
                </span>
                {k.t}
              </div>
              <div className={`kd ${k.op ? "op" : ""}`}>{k.d}</div>
            </div>
          ))}
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
            <small>Tu asistente, sabe todo de tu negocio</small>
          </div>
        </div>
        <div className="rbody" ref={bodyRef}>
          {messages.map((m, i) =>
            m.role === "bot" ? (
              <div className="msg bot" key={i}>
                {m.think && (
                  <div className="think">
                    <span className="gl">
                      <ClockIcon />
                    </span>
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
          {thinking && (
            <div className="msg bot">
              <div className="think">
                <span className="gl">
                  <ClockIcon />
                </span>
                Halo lo está pensando…
              </div>
            </div>
          )}
        </div>
        <div className="rfoot">
          <div className="cbox">
            <input
              placeholder="Pregúntale a Halo lo que quieras de tu negocio"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send(input);
              }}
            />
            <button
              className="snd"
              type="button"
              aria-label="Enviar"
              onClick={() => send(input)}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
          <div className="sug">
            {SUGGESTIONS.map((s, i) => (
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

const ENGINES = [
  { name: "ChatGPT", score: 3, off: false },
  { name: "Perplexity", score: 4, off: false },
  { name: "Gemini", score: 2, off: false },
  { name: "Claude", score: 0, off: true },
];

const COMPETITORS: { name: string; score: number; you?: boolean }[] = [
  { name: "El líder de tu zona", score: 6 },
  { name: "Top 2", score: 5 },
  { name: "Tu negocio", score: 3, you: true },
  { name: "Top 4", score: 3 },
  { name: "Top 5", score: 2 },
];

const KEYWORDS: { yes: boolean; t: string }[] = [
  { yes: true, t: "Mejor sitio en el centro de Milán" },
  { yes: true, t: "Sitio recomendado cerca del Duomo" },
  { yes: true, t: "Buena reputación en Brera" },
  { yes: false, t: "Abierto el domingo en Milán" },
  { yes: false, t: "Opciones para niños en Navigli" },
];

const IMPACT = [
  { name: "ChatGPT", pct: 30, d: "+2 menciones esta semana" },
  { name: "Perplexity", pct: 40, d: "+3 menciones esta semana" },
  { name: "Gemini", pct: 20, d: "Estable" },
  { name: "Claude", pct: 0, d: "Aún no te conoce" },
];

const MILANO_ZONES: { name: string; pct: number }[] = [
  { name: "Brera", pct: 70 },
  { name: "Duomo", pct: 65 },
  { name: "Quadrilatero", pct: 60 },
  { name: "Navigli", pct: 50 },
  { name: "Porta Romana", pct: 45 },
  { name: "Garibaldi", pct: 40 },
  { name: "Cinque Vie", pct: 38 },
  { name: "Sempione", pct: 30 },
  { name: "Porta Venezia", pct: 25 },
  { name: "Isola", pct: 20 },
  { name: "Lambrate", pct: 12 },
  { name: "San Siro", pct: 8 },
];

const DAY_PCTS = [
  12, 25, 40, 18, 55, 30, 65, 22, 48, 8, 35, 20, 60, 42,
  28, 70, 15, 50, 33, 45, 38, 62, 25, 18, 55, 40, 30, 75,
];

function tintBorder(pct: number) {
  const alpha = (pct / 100) * 0.55 + 0.08;
  return `rgba(241,90,43,${alpha.toFixed(3)})`;
}

function DashView() {
  return (
    <>
      <div className="dtitle">
        <div className="greet">Hola, esto es tu negocio en directo</div>
        <h1>Tu dashboard</h1>
      </div>
      <div className="bento">
        <div className="bento-hero">
          <div className="bh-label">Te eligen</div>
          <div className="bh-num">
            3 <span>de 10</span>
          </div>
          <div className="bh-sub">
            Cada vez que alguien le pregunta a la IA por un negocio como el tuyo en Milán.
          </div>
          <div className="bh-trend">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 15l7-7 7 7" />
            </svg>
            +1 esta semana
          </div>
        </div>

        {ENGINES.map((e) => (
          <div className="bento-mid" key={e.name}>
            <div className="bw-head">
              <h3>{e.name}</h3>
            </div>
            <div className="bm-label">{e.off ? "Sin datos" : "Te elige"}</div>
            <div className="bm-num">
              {e.off ? "—" : e.score}
              <small> /10</small>
            </div>
            <div className="bm-sub">
              {e.off ? "Aún no te conoce" : "de cada 10 respuestas"}
            </div>
            <div className="bm-dots">
              {Array.from({ length: 10 }).map((_, j) => (
                <i key={j} className={!e.off && j < e.score ? "on" : ""} />
              ))}
            </div>
          </div>
        ))}

        <div className="bento-wide">
          <div className="bw-head">
            <h3>Tú y tu competencia</h3>
            <div className="bw-sub">Top 5 en tu zona</div>
          </div>
          <div className="complist">
            {COMPETITORS.map((c, i) => (
              <div className={`comp ${c.you ? "you" : ""}`} key={i}>
                <div
                  className="cav"
                  style={{
                    background: c.you
                      ? "linear-gradient(135deg,var(--coral),var(--deep))"
                      : "rgba(120,80,50,.25)",
                  }}
                >
                  {c.name.charAt(0)}
                </div>
                <div className="cname">{c.name}</div>
                <div className="cbar">
                  <i
                    className={c.you ? "youbar" : ""}
                    style={{ width: `${(c.score / 10) * 100}%` }}
                  />
                </div>
                <div className="cval">{c.score}/10</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bento-tall">
          <div className="bw-head">
            <h3>Lo que la gente busca</h3>
            <div className="bw-sub">Preguntas reales a la IA</div>
          </div>
          <div className="kwchips">
            {KEYWORDS.map((k, i) => (
              <div className={`kwchip ${k.yes ? "yes" : "soon"}`} key={i}>
                <span>{k.t}</span>
                <b>{k.yes ? "Sales" : "Aún no"}</b>
              </div>
            ))}
          </div>
        </div>

        <div className="bento-wide">
          <div className="bw-head">
            <h3>Tu impacto en la IA</h3>
            <div className="bw-sub">Por motor</div>
          </div>
          <div className="impact-list">
            {IMPACT.map((m) => (
              <div className="impact" key={m.name}>
                <div className="imp-eng">{m.name}</div>
                <div className="imp-bar">
                  <i style={{ width: `${m.pct}%` }} />
                </div>
                <div className="imp-d">{m.d}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bento-quote">
          <div className="bw-head">
            <h3>Cómo te describen</h3>
            <div className="bw-sub">Lo que dice la IA</div>
          </div>
          <div className="bq-text">
            “Un sitio acogedor en el centro de Milán, con buenas reseñas y trato cercano.”
          </div>
          <div className="bq-meta">— ChatGPT · Perplexity · Gemini</div>
        </div>

        <div className="bento-cal">
          <div className="bw-head">
            <h3>Tu progreso</h3>
            <div className="bw-sub">Últimas 4 semanas</div>
          </div>
          <div className="minical">
            {DAY_PCTS.map((pct, i) => (
              <i
                key={i}
                style={{
                  background: "#FBF9F8",
                  border: `1.5px solid ${tintBorder(pct)}`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="bento-ask">
          <div className="ba-orb haloOrb">
            <span className="blob b1" />
            <span className="blob b2" />
            <span className="blob b3" />
            <span className="blob b4" />
          </div>
          <h3>¿Algo que quieras mejorar?</h3>
          <p>
            Halo lo arregla en directo y te cuenta qué cambió en ChatGPT, Perplexity y Gemini.
          </p>
          <button className="ba-btn" type="button">
            Pregúntale a Halo
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>

        <div className="bento-zones">
          <div className="bw-head">
            <h3>Por barrios de Milán</h3>
            <div className="bw-sub">Cuánto te recomiendan en cada zona</div>
          </div>
          <div className="zonemap">
            {MILANO_ZONES.map((z) => (
              <div
                className="zone"
                key={z.name}
                style={{ borderColor: tintBorder(z.pct) }}
              >
                <div className="zn">{z.name}</div>
                <div className="zf">{z.pct}%</div>
              </div>
            ))}
          </div>
          <div className="znote">
            Tu fuerte está en <b>Brera, Duomo y Quadrilatero</b>. En <b>San Siro y Lambrate</b> casi no apareces todavía.
          </div>
        </div>
      </div>

      <div className="report-row">
        <button className="report-btn" type="button">
          <span className="gl">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v12m0 0l-4-4m4 4l4-4M5 20h14" />
            </svg>
          </span>
          Descargar mi reporte
        </button>
      </div>
    </>
  );
}

function WebIco() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}
function MapIco() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-7.5-7-12a7 7 0 1 1 14 0c0 4.5-7 12-7 12z" />
      <circle cx="12" cy="9" r="2.4" />
    </svg>
  );
}
function IgIco() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="0.7" fill="currentColor" />
    </svg>
  );
}
function TkIco() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 4c.5 2.5 2.5 4.5 5 5" />
    </svg>
  );
}
function WaIco() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20l1.6-4.2A8 8 0 1 1 8.5 18.4L4 20z" />
      <path d="M9 10.5c.4 1.5 1.5 2.6 3 3 .5.1 1.2 0 1.6-.3l.6-.6c.3-.3.8-.3 1.1 0l1 1c.3.3.3.8 0 1.1-1 1-2.6 1.2-3.8.5a8 8 0 0 1-3.5-3.5c-.7-1.2-.5-2.8.5-3.8.3-.3.8-.3 1.1 0l1 1c.3.3.3.8 0 1.1l-.6.6c-.3.4-.4 1.1-.3 1.6z" />
    </svg>
  );
}
function GearIco() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
    </svg>
  );
}
function EyeIco() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}
function SparkIco() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
      <path d="M19 16l.7 2L22 18.6 19.7 19 19 21l-.7-2L16 18.6l2.3-.6z" />
    </svg>
  );
}

type ConnKey = "web" | "maps" | "ig" | "tk" | "wa";
type ModeKey = "expert" | "watch" | "auto";

function SettingsView({ setView }: { setView: (v: View) => void }) {
  const [conns, setConns] = useState<Record<ConnKey, boolean>>({
    web: true,
    maps: true,
    ig: false,
    tk: false,
    wa: false,
  });
  const [modes, setModes] = useState<Record<ModeKey, boolean>>({
    expert: false,
    watch: true,
    auto: true,
  });

  const CONNS: { key: ConnKey; title: string; desc: string; Icon: () => JSX.Element }[] = [
    {
      key: "web",
      title: "Tu web",
      desc: "Para que la IA conozca tus servicios, horario y precios.",
      Icon: WebIco,
    },
    {
      key: "maps",
      title: "Google Maps",
      desc: "Tu ficha de Google con reseñas y dirección.",
      Icon: MapIco,
    },
    {
      key: "ig",
      title: "Instagram",
      desc: "Tus fotos y novedades, para que sepan cómo eres.",
      Icon: IgIco,
    },
    {
      key: "tk",
      title: "TikTok",
      desc: "Tus vídeos suman a lo que ve la IA.",
      Icon: TkIco,
    },
    {
      key: "wa",
      title: "WhatsApp",
      desc: "Para que tus clientes te escriban directo desde la IA.",
      Icon: WaIco,
    },
  ];

  const MODES: { key: ModeKey; title: string; desc: string; Icon: () => JSX.Element }[] = [
    {
      key: "expert",
      title: "Modo experto",
      desc: "Te enseño los números y métricas detalladas, solo si te interesan.",
      Icon: GearIco,
    },
    {
      key: "watch",
      title: "Vigilar competencia",
      desc: "Te aviso cuando alguien de tu zona te adelante en las IAs.",
      Icon: EyeIco,
    },
    {
      key: "auto",
      title: "Modo automático",
      desc: "Halo arregla lo que pueda por su cuenta y solo te pregunta lo importante.",
      Icon: SparkIco,
    },
  ];

  return (
    <div className="setwrap">
      <div className="backlink" onClick={() => setView("dash")}>
        <span className="gl">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 19l-7-7 7-7" />
          </svg>
        </span>
        Volver
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 }}>
        Conecta tu negocio
      </h1>
      <p style={{ color: "var(--text-2)", fontSize: 14, fontWeight: 500, marginBottom: 22, lineHeight: 1.5 }}>
        Cuanto más sepa Halo de ti, mejor te van a recomendar las IAs.
      </p>

      <div className="glass" style={{ padding: "6px 22px", marginBottom: 22 }}>
        <div className="secttitle" style={{ paddingTop: 14 }}>
          Tus conexiones
        </div>
        {CONNS.map(({ key, title, desc, Icon }) => {
          const on = conns[key];
          return (
            <div className="setrow" key={key}>
              <span className="si">
                <Icon />
              </span>
              <div className="stxt">
                <b>{title}</b>
                <small>{desc}</small>
              </div>
              <button
                type="button"
                className={`connectbtn ${on ? "done" : ""}`}
                onClick={() => setConns((c) => ({ ...c, [key]: !c[key] }))}
              >
                {on ? "Conectado" : "Conectar"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="glass" style={{ padding: "6px 22px" }}>
        <div className="secttitle" style={{ paddingTop: 14 }}>
          Cómo trabaja Halo
        </div>
        {MODES.map(({ key, title, desc, Icon }) => {
          const on = modes[key];
          return (
            <div className="setrow" key={key}>
              <span className="si">
                <Icon />
              </span>
              <div className="stxt">
                <b>{title}</b>
                <small>{desc}</small>
              </div>
              <div
                className={`toggle ${on ? "on" : ""}`}
                onClick={() => setModes((m) => ({ ...m, [key]: !m[key] }))}
                role="switch"
                aria-checked={on}
              >
                <div className="knob" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
