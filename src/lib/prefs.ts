// Preferencias del usuario persistidas en el navegador (conexiones, modos…).
// Interino sin backend: hace que los ajustes "se queden" (no se reseteen al
// salir), que es lo que los hace sentir reales. Migrable a Supabase luego.

export function loadPrefs<T extends object>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<T>) } : fallback;
  } catch {
    return fallback;
  }
}

export function savePrefs<T extends object>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento bloqueado */
  }
}
