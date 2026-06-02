// Historial de análisis en el navegador (localStorage). Es la versión interina
// SIN backend: cuando conectemos Supabase, este módulo se reemplaza por
// llamadas a la BD manteniendo la misma interfaz (listHistory/addHistory/…),
// sin tocar la UI.

export interface HistoryEntry<T = unknown> {
  id: string;
  createdAt: number; // epoch ms
  label: string; // nombre del negocio (para mostrar)
  sub?: string; // ciudad o tipo (para mostrar)
  score: number; // 0..10 (vista rápida)
  data: T; // la auditoría completa
}

const KEY = "halo:history:v1";
const MAX = 20;

function canUse(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function listHistory<T = unknown>(): HistoryEntry<T>[] {
  if (!canUse()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry<T>[]) : [];
  } catch {
    return [];
  }
}

// Añade (o actualiza) un negocio en el historial y devuelve la lista nueva.
// Un negocio = una entrada: si ya existe por nombre, se reemplaza por la más
// reciente y sube arriba.
export function addHistory<T = unknown>(
  e: Omit<HistoryEntry<T>, "id" | "createdAt">
): HistoryEntry<T>[] {
  const entry: HistoryEntry<T> = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
    ...e,
  };
  const deduped = listHistory<T>().filter(
    (x) => x.label.trim().toLowerCase() !== entry.label.trim().toLowerCase()
  );
  const next = [entry, ...deduped].slice(0, MAX);
  persist(next);
  return next;
}

export function removeHistory<T = unknown>(id: string): HistoryEntry<T>[] {
  const next = listHistory<T>().filter((x) => x.id !== id);
  persist(next);
  return next;
}

function persist(list: HistoryEntry[]): void {
  if (!canUse()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* almacenamiento lleno o bloqueado: lo ignoramos */
  }
}
