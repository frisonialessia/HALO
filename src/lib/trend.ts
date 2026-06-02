// Evolución del score por negocio, guardada en el navegador (interino, $0):
// cada análisis REAL añade un punto y el dashboard pinta la línea. Es la
// recurrencia tipo SaaS ("mira cómo sube tu visibilidad"). Migrable a Supabase
// para cross-device con la misma interfaz.

export interface TrendPoint {
  score: number; // 0..10
  at: number; // epoch ms
}

const KEY = "halo:trend:v1";
const MAX = 30;

type Store = Record<string, TrendPoint[]>;

function norm(name: string): string {
  return name.trim().toLowerCase();
}

function read(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function write(store: Store): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* almacenamiento bloqueado */
  }
}

// Añade un punto a la evolución del negocio y devuelve la serie completa.
export function addTrendPoint(name: string, score: number): TrendPoint[] {
  const store = read();
  const key = norm(name);
  const list = [...(store[key] ?? []), { score, at: Date.now() }].slice(-MAX);
  store[key] = list;
  write(store);
  return list;
}

export function getTrend(name: string): TrendPoint[] {
  return read()[norm(name)] ?? [];
}
