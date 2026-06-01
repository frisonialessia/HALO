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
              Trattoria Bella <span style={{ color: "var(--muted)" }}>▾</span>
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

// Placeholder de las vistas — se portan en el siguiente paso.
// El build debe pasar con esto; luego se rellenan con el detalle del diseño.
function HaloView() {
  return (
    <div style={{ padding: "40px 0", textAlign: "center" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Halo — asistente</h1>
      <p style={{ color: "var(--text-2)", marginTop: 8 }}>
        Vista del asistente (en construcción)
      </p>
    </div>
  );
}

function DashView() {
  return (
    <div style={{ padding: "40px 0", textAlign: "center" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Dashboard</h1>
      <p style={{ color: "var(--text-2)", marginTop: 8 }}>Vista del dashboard (en construcción)</p>
    </div>
  );
}

function SettingsView({ setView }: { setView: (v: View) => void }) {
  return (
    <div style={{ padding: "40px 0", textAlign: "center" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>Ajustes y conexiones</h1>
      <p style={{ color: "var(--text-2)", marginTop: 8 }}>Vista de ajustes (en construcción)</p>
      <button className="histbtn" style={{ marginTop: 16 }} onClick={() => setView("dash")}>
        Volver
      </button>
    </div>
  );
}
