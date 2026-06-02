// Generador de datos sintéticos + estado de demo predefinido.
// Pieza central de la "SaaS Factory": alimenta el Modo Demo (estado fijo y
// convincente, COSTE 0) y puede simular cualquier negocio (mockAudit) sin
// gastar una sola llamada de API. Determinista por input → demos reproducibles.

import { buildQueries } from "@/lib/queries";
import type { BusinessKind } from "@/types";

export interface MockProbe {
  query: string;
  appeared: boolean;
  position?: number;
}

export interface MockAudit {
  business: { name: string; business_type: string; city?: string; website?: string };
  shareOfAnswer: number; // 0..1
  byEngine: Record<string, number>;
  probes: MockProbe[];
  demo?: boolean; // escaparate de ejemplo fijo (Osteria)
  preview?: boolean; // simulación personalizada de la marca del visitante
}

// PRNG sembrado (xfnv1a + mulberry32): el mismo input da SIEMPRE los mismos
// datos → demos reproducibles y screenshots consistentes para LinkedIn.
function seeded(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Estima QUÉ es el negocio desde lo que pega el usuario (web/nombre): tipo +
// naturaleza (local / producto / online), para que la preview use las mismas
// búsquedas que el motor real. Sin API: diccionario de señales. El análisis
// real lo afina con precisión.
const TYPE_HINTS: [RegExp, string, BusinessKind][] = [
  [/vermouth|vermut/, "vermut", "product"],
  [/ginebra|\bgin\b/, "ginebra", "product"],
  [/whisk/, "whisky", "product"],
  [/\bvino\b|bodega/, "vino", "product"],
  [/cerveza artesanal|craft beer/, "cerveza artesanal", "product"],
  [/pizz/, "pizzería", "local"],
  [/sushi|ramen|japones|nikkei/, "restaurante japonés", "local"],
  [/taquer|tacos|mexican/, "restaurante mexicano", "local"],
  [/trattor|osteria|italian|pasta/, "restaurante italiano", "local"],
  [/burger|hamburgues/, "hamburguesería", "local"],
  [/restaur|asador|marisquer|tapas|bistro|brasserie|grill|cocina/, "restaurante", "local"],
  [/cafe|coffee|cafeter|brunch/, "cafetería", "local"],
  [/cocktail|cocteler|\bpub\b|cervec|\bbar\b/, "bar", "local"],
  [/panad|bakery|paste|reposter|croissant/, "panadería", "local"],
  [/helad|gelato|icecream/, "heladería", "local"],
  [/dental|odonto|dentist/, "clínica dental", "local"],
  [/clinic|medic|fisio|physio|psico|terap|salud|estetic|belleza|\bspa\b/, "clínica", "local"],
  [/veterinar|mascot/, "clínica veterinaria", "local"],
  [/peluqu|barber|salon|estilist|nails/, "peluquería", "local"],
  [/gym|gimnas|fitness|crossfit|yoga|pilates/, "gimnasio", "local"],
  [/hotel|hostal|hostel|aparthotel|alojamiento/, "hotel", "local"],
  [/inmobil|realestate|propiedad|vivienda/, "inmobiliaria", "local"],
  [/abogad|legal|\blaw\b|jurid|asesor|gestor/, "despacho de abogados", "local"],
  [/taller|mecanic|automo|neumatic/, "taller mecánico", "local"],
  [/floris|flores/, "floristería", "local"],
  [/joyer|relojer/, "joyería", "local"],
  [/librer/, "librería", "local"],
  [/academ|escuela|formacion|cursos|idiomas/, "academia", "local"],
  [/tienda|\bshop\b|store|boutique|moda|\bropa\b/, "tienda online", "online"],
  [/saas|software|\bapp\b|plataforma|\bcrm\b|\berp\b/, "software", "online"],
  [/agencia|marketing|publicidad|consultor|studio|estudio/, "agencia", "online"],
];

function guessBusiness(input: string): { type?: string; kind: BusinessKind } {
  const t = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  for (const [re, type, kind] of TYPE_HINTS) if (re.test(t)) return { type, kind };
  return { kind: "local" };
}

// Simula una auditoría para CUALQUIER negocio, sin API. Determinista por input.
// Útil para "modo simulado" de cualquier búsqueda sin coste.
export function mockAudit(
  input: string,
  business?: Partial<MockAudit["business"]>
): MockAudit {
  const rnd = seeded(input.trim().toLowerCase() || "halo");
  // Nombre legible: si pegan una URL, usamos el dominio.
  const cleanName =
    input
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "") || "Tu negocio";
  const guess = guessBusiness(input);
  const biz = {
    name: business?.name || cleanName,
    business_type: business?.business_type || guess.type || "negocio local",
    city: business?.city,
    website: business?.website,
  };

  const queries = buildQueries({
    id: "temp",
    name: biz.name,
    business_type: biz.business_type,
    kind: guess.kind,
    city: biz.city,
  });
  const probes: MockProbe[] = queries.map((q) => {
    const appeared = rnd() < 0.4;
    return { query: q, appeared, position: appeared ? 1 + Math.floor(rnd() * 4) : undefined };
  });

  const appeared = probes.filter((p) => p.appeared).length;
  const shareOfAnswer = appeared / probes.length;
  const jitter = (base: number) => Math.max(0, Math.min(1, base + (rnd() - 0.5) * 0.25));

  return {
    business: biz,
    shareOfAnswer,
    byEngine: {
      perplexity: jitter(shareOfAnswer),
      chatgpt: jitter(shareOfAnswer),
      gemini: jitter(shareOfAnswer * 0.8),
    },
    probes,
    preview: true,
  };
}

// Estado de demo PREDEFINIDO: negocio de ejemplo curado y convincente (3/10),
// que carga el "Probar con un ejemplo" sin gastar nada. Coherente con el
// escaparate del dashboard (Osteria Vista · Milán).
export const DEMO_AUDIT: MockAudit = {
  business: {
    name: "Osteria Vista",
    business_type: "restaurante italiano",
    city: "Milán",
    website: "osteriavista.it",
  },
  shareOfAnswer: 0.3,
  byEngine: { perplexity: 0.4, chatgpt: 0.3, gemini: 0.2 },
  probes: [
    { query: "mejor restaurante italiano en Milán", appeared: true, position: 2 },
    { query: "restaurante italiano recomendado en Milán", appeared: true, position: 3 },
    { query: "dónde ir a un buen restaurante italiano en Milán", appeared: false },
    { query: "restaurante italiano bien valorado en Milán", appeared: true, position: 4 },
    { query: "top restaurante italiano en Milán", appeared: false },
    { query: "restaurante italiano para una ocasión especial en Milán", appeared: false },
    { query: "restaurante italiano económico en Milán", appeared: false },
    { query: "restaurante italiano cerca de mí en Milán", appeared: false },
    { query: "qué restaurante italiano vale la pena en Milán", appeared: false },
    { query: "restaurante italiano favorito de los locales en Milán", appeared: false },
  ],
  demo: true,
};
