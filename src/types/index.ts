// Tipos compartidos del cerebro de Halo

export type Engine =
  | "perplexity"
  | "chatgpt"
  | "gemini"
  | "claude"
  | "grok"
  | "deepseek";

export interface Project {
  id: string;
  name: string;
  business_type: string;
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
  raw_response?: unknown;
}

// Resultado agregado de una auditoría completa
export interface AuditResult {
  shareOfAnswer: number; // 0.30 = "3 de 10"
  byEngine: Record<string, number>;
  probes: ProbeResult[];
}
