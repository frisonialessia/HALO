import type { Project, ProbeResult } from "@/types";
import { buildProbe } from "./detect";

// Motor Grok (xAI). API compatible con OpenAI. Se activa solo si existe
// XAI_API_KEY. Modelo configurable con XAI_MODEL. Docs: https://docs.x.ai

const XAI_URL = "https://api.x.ai/v1/chat/completions";
const MODEL = process.env.XAI_MODEL || "grok-3";

const SYSTEM =
  "You are an assistant that recommends real businesses and brands. " +
  "Answer as you would to a normal user, naming specific businesses.";

export async function probeGrok(
  project: Project,
  query: string,
  zone?: string
): Promise<ProbeResult> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("Falta XAI_API_KEY");

  const res = await fetch(XAI_URL, {
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

  if (!res.ok) throw new Error(`xAI error ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const answer: string = (data?.choices?.[0]?.message?.content ?? "").trim();

  return buildProbe({ engine: "grok", project, query, zone, answer });
}
