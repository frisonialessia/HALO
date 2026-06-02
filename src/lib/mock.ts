// Generador de datos sintéticos + estado de demo predefinido.
// Pieza central de la "SaaS Factory": alimenta el Modo Demo (estado fijo y
// convincente, COSTE 0) y puede simular cualquier negocio (mockAudit) sin
// gastar una sola llamada de API. Determinista por input → demos reproducibles.

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

// Las mismas plantillas que usa el motor real, para que los probes simulados
// se vean idénticos a los reales.
function queryTemplates(type: string, city?: string): string[] {
  const where = city ? ` en ${city}` : "";
  return [
    `mejor ${type}${where}`,
    `${type} recomendado${where}`,
    `dónde ir a un buen ${type}${where}`,
    `${type} bien valorado${where}`,
    `top ${type}${where}`,
    `${type} para una ocasión especial${where}`,
    `${type} económico${where}`,
    `${type} cerca de mí${where}`,
    `qué ${type} vale la pena${where}`,
    `${type} favorito de los locales${where}`,
  ];
}

// Estima el tipo de negocio desde lo que pega el usuario (web/nombre) para que
// la preview se sienta "suya" (vermutería, restaurante, clínica…) en vez de un
// genérico "negocio local". Sin API: diccionario de señales. El análisis real
// lo afina con precisión.
const TYPE_HINTS: [RegExp, string][] = [
  [/vermouth|vermut/, "vermutería"],
  [/pizz/, "pizzería"],
  [/sushi|ramen|japones|nikkei/, "restaurante japonés"],
  [/taquer|tacos|mexican/, "restaurante mexicano"],
  [/trattor|osteria|italian|pasta/, "restaurante italiano"],
  [/burger|hamburgues/, "hamburguesería"],
  [/restaur|asador|marisquer|tapas|bistro|brasserie|grill|cocina/, "restaurante"],
  [/cafe|coffee|cafeter|brunch/, "cafetería"],
  [/cocktail|cocteler|\bpub\b|cervec|\bbar\b/, "bar"],
  [/panad|bakery|paste|reposter|croissant/, "panadería"],
  [/helad|gelato|icecream/, "heladería"],
  [/dental|odonto|dentist/, "clínica dental"],
  [/clinic|medic|fisio|physio|psico|terap|salud|estetic|belleza|\bspa\b/, "clínica"],
  [/veterinar|mascot/, "clínica veterinaria"],
  [/peluqu|barber|salon|estilist|nails/, "peluquería"],
  [/gym|gimnas|fitness|crossfit|yoga|pilates/, "gimnasio"],
  [/hotel|hostal|hostel|aparthotel|alojamiento/, "hotel"],
  [/inmobil|realestate|propiedad|vivienda/, "inmobiliaria"],
  [/abogad|legal|\blaw\b|jurid|asesor|gestor/, "despacho de abogados"],
  [/taller|mecanic|automo|neumatic/, "taller mecánico"],
  [/floris|flores/, "floristería"],
  [/joyer|relojer/, "joyería"],
  [/librer/, "librería"],
  [/academ|escuela|formacion|cursos|idiomas/, "academia"],
  [/tienda|\bshop\b|store|boutique|moda|\bropa\b/, "tienda"],
  [/agencia|marketing|publicidad|consultor|software|studio|estudio/, "agencia"],
];

function guessType(input: string): string | undefined {
  const t = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  for (const [re, type] of TYPE_HINTS) if (re.test(t)) return type;
  return undefined;
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
  const biz = {
    name: business?.name || cleanName,
    business_type: business?.business_type || guessType(input) || "negocio local",
    city: business?.city,
    website: business?.website,
  };

  const probes: MockProbe[] = queryTemplates(biz.business_type, biz.city).map((q) => {
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
