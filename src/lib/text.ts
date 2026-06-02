// Limpia markdown ligero de los textos generados por la IA para mostrarlos como
// texto plano (la UI no renderiza markdown): quita **negritas**, *cursivas*,
// `código`, __subrayado__ y los ## de encabezados.
export function stripMarkdown(s: string): string {
  if (!s) return s;
  return s
    .replace(/\*\*([\s\S]+?)\*\*/g, "$1")
    .replace(/__([\s\S]+?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/\*(?!\s)([^*\n]+?)\*/g, "$1")
    .trim();
}
