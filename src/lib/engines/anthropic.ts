import type { Project, ProbeResult } from "@/types";
import { buildProbe } from "./detect";

// Motor Claude (Anthropic). Mide qué recomienda Claude para una búsqueda.
// Se activa solo si existe ANTHROPIC_API_KEY. Modelo configurable con
// ANTHROPIC_MODEL. Docs: https://docs.anthropic.com/en/api/messages

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

const SYSTEM =
  "You are an assistant that recommends real businesses and brands. " +
  "Answer as you would to a normal user, naming specific businesses.";

export async function probeClaude(
  project: Project,
  query: string,
  zone?: string
): Promise<ProbeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Falta ANTHROPIC_API_KEY");

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 700,
      system: SYSTEM,
      messages: [{ role: "user", content: query }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const answer: string = (data?.content ?? [])
    .map((b: { text?: string }) => b.text ?? "")
    .join("")
    .trim();

  return buildProbe({ engine: "claude", project, query, zone, answer });
}
