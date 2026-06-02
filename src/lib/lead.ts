// Captura de leads (email) en el cliente: valida, recuerda el email ya dado
// (para no volver a pedirlo) y lo envía al endpoint. Pensado para no bloquear
// nunca la experiencia: si el registro falla, el usuario sigue recibiendo su
// valor igual.

const EMAIL_KEY = "halo:lead:email";

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function savedLeadEmail(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(EMAIL_KEY);
  } catch {
    return null;
  }
}

export function rememberLeadEmail(email: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EMAIL_KEY, email.trim().toLowerCase());
  } catch {
    /* almacenamiento bloqueado */
  }
}

// Envía el lead. Fire-and-forget: nunca lanza, para no romper el flujo de valor.
export async function submitLead(
  email: string,
  context: Record<string, unknown> = {}
): Promise<void> {
  try {
    await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), app: "halo", context }),
    });
  } catch {
    /* sin conexión / endpoint caído: no bloqueamos al usuario */
  }
}
