import type { Project, Lang } from "@/types";

// Genera las "probe queries": las búsquedas realistas que un cliente
// le haría a la IA buscando un negocio como el del usuario.
// Estas son la base de la medición AEO. Para Local Intelligence,
// se les añade la zona (ver buildLocalQueries).
//
// Bilingüe: las búsquedas se generan en el idioma del análisis (inglés por
// defecto) para que la medición refleje cómo busca un cliente en ese idioma.

export function buildQueries(project: Project, lang: Lang = "en"): string[] {
  const { business_type, city, kind } = project;
  // Nº de búsquedas por análisis. Cada una = 1 llamada de pago por motor, así
  // que es la palanca directa de coste: baja HALO_PROBE_COUNT para gastar menos
  // (p. ej. 6). Por defecto 10.
  const count = Number(process.env.HALO_PROBE_COUNT) || 10;

  // Producto/marca u online: búsquedas de descubrimiento y compra, SIN ubicación.
  if (kind === "product" || kind === "online") {
    if (lang === "es") {
      const get = kind === "product" ? "dónde comprar" : "dónde contratar";
      return [
        `mejor ${business_type}`,
        `${business_type} recomendado`,
        `mejores marcas de ${business_type}`,
        `${get} ${business_type}`,
        `${business_type} opiniones`,
        `${business_type} de calidad`,
        `alternativas a ${project.name}`,
        `qué ${business_type} comprar`,
        `${business_type} mejor valorado`,
        `${business_type} más vendido`,
      ].slice(0, count);
    }
    const get = kind === "product" ? "where to buy" : "where to hire";
    return [
      `best ${business_type}`,
      `recommended ${business_type}`,
      `best ${business_type} brands`,
      `${get} ${business_type}`,
      `${business_type} reviews`,
      `quality ${business_type}`,
      `alternatives to ${project.name}`,
      `which ${business_type} to buy`,
      `best-rated ${business_type}`,
      `best-selling ${business_type}`,
    ].slice(0, count);
  }

  // Negocio local: búsquedas por ubicación.
  if (lang === "es") {
    const where = city ? ` en ${city}` : "";
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
    ].slice(0, count);
  }
  const where = city ? ` in ${city}` : "";
  return [
    `best ${business_type}${where}`,
    `recommended ${business_type}${where}`,
    `where to go for a good ${business_type}${where}`,
    `well-rated ${business_type}${where}`,
    `top ${business_type}${where}`,
    `${business_type} for a special occasion${where}`,
    `affordable ${business_type}${where}`,
    `${business_type} near me${where}`,
    `which ${business_type} is worth it${where}`,
    `locals' favorite ${business_type}${where}`,
  ].slice(0, count);
}

// Para Local Intelligence: las mismas queries pero por zona/barrio.
export function buildLocalQueries(
  project: Project,
  zones: string[],
  lang: Lang = "en"
): { query: string; zone: string }[] {
  const { business_type } = project;
  return zones.map((zone) => ({
    zone,
    query:
      lang === "es"
        ? `mejor ${business_type} en ${zone}`
        : `best ${business_type} in ${zone}`,
  }));
}
