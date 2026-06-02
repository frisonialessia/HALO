// Tipos compartidos del cerebro de Halo

export type Engine =
  | "perplexity"
  | "chatgpt"
  | "gemini"
  | "claude"
  | "grok"
  | "deepseek";

// Qué es lo que el usuario manda: condiciona cómo medimos (un local se busca
// por ubicación; un producto/servicio online, por descubrimiento y compra).
export type BusinessKind = "local" | "product" | "online";

export interface Project {
  id: string;
  name: string;
  business_type: string;
  kind?: BusinessKind;
  city?: string;
  website?: string;
}

// Resultado de probar UNA query contra UN motor
export interface ProbeResult {
  engine: Engine;
  query: string;
  zone?: string;
  appeared: boolean;
  position?: number;
  sentiment?: "positivo" | "neutro" | "negativo";
  cited_url?: boolean;
  answer?: string; // fragmento de la respuesta real del motor (lo que dijo la IA)
}

// Resultado agregado de una auditoría completa
export interface AuditResult {
  shareOfAnswer: number; // 0.30 = "3 de 10"
  byEngine: Record<string, number>;
  probes: ProbeResult[];
}
