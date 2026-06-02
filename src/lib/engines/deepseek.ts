import type { Project, ProbeResult } from "@/types";
import { buildProbe } from "./detect";

// Motor DeepSeek. API compatible con OpenAI. Se activa solo si existe
// DEEPSEEK_API_KEY. Modelo configurable con DEEPSEEK_MODEL.
// Docs: https://api-docs.deepseek.com

const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

const SYSTEM =
  "You are an assistant that recommends real businesses and brands. " +
  "Answer as you would to a normal user, naming specific businesses.";

export async function probeDeepSeek(
  project: Project,
  query: string,
  zone?: string
): Promise<ProbeResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("Falta DEEPSEEK_API_KEY");

  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 700,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: query },
      ],
    }),
  });

  if (!res.ok) throw new Error(`DeepSeek error ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const answer: string = (data?.choices?.[0]?.message?.content ?? "").trim();

  return buildProbe({ engine: "deepseek", project, query, zone, answer });
}
