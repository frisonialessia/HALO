import type { Project } from "@/types";

// Genera las "probe queries": las búsquedas realistas que un cliente
// le haría a la IA buscando un negocio como el del usuario.
// Estas son la base de la medición AEO. Para Local Intelligence,
// se les añade la zona (ver buildLocalQueries).

export function buildQueries(project: Project): string[] {
  const { business_type, city } = project;
  const where = city ? ` en ${city}` : "";

  // Plantillas genéricas que cubren las búsquedas más comunes.
  // En producción, estas se generarán dinámicamente con un LLM
  // según el sector, pero estas plantillas son un buen punto de partida.
  return [
    `mejor ${business_type}${where}`,
    `${business_type} recomendado${where}`,
    `dónde ir a un buen ${business_type}${where}`,
    `${business_type} bien valorado${where}`,
    `top ${business_type}${where}`,
    `${business_type} para una ocasión especial${where}`,
    `${business_type} económico${where}`,
    `${business_type} cerca de mí${where}`,
    `qué ${business_type} vale la pena${where}`,
    `${business_type} favorito de los locales${where}`,
  ];
}

// Para Local Intelligence: las mismas queries pero por zona/barrio.
export function buildLocalQueries(
  project: Project,
  zones: string[]
): { query: string; zone: string }[] {
  const { business_type } = project;
  return zones.map((zone) => ({
    zone,
    query: `mejor ${business_type} en ${zone}`,
  }));
}
