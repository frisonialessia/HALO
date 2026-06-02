import type { Project, ProbeResult } from "@/types";
import { buildProbe } from "./detect";

// Motor Gemini (Google). Igual que con ChatGPT, la API "a pelo" responde de su
// memoria de entrenamiento; para reflejar lo que ve un usuario real usamos
// grounding con Google Search (la misma señal que alimenta las AI Overviews).
// Tier gratuito en Google AI Studio. Docs: https://ai.google.dev

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

// Pregunta una query a Gemini (con búsqueda web) y analiza si el negocio aparece.
export async function probeGemini(
  project: Project,
  query: string,
  zone?: string
): Promise<ProbeResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Falta GEMINI_API_KEY");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      // Mismo "rol" que el resto de motores, para que la comparación sea justa.
      systemInstruction: {
        parts: [
          {
            text:
              "Eres un asistente que recomienda negocios locales reales. " +
              "Responde como lo harías con un usuario normal, nombrando negocios concretos.",
          },
        ],
      },
      contents: [{ parts: [{ text: query }] }],
      tools: [{ google_search: {} }],
      generationConfig: { maxOutputTokens: 700 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  }

  const data = (await res.json()) as GeminiResponse;
  const answer = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join(" ")
    .trim();

  return buildProbe({ engine: "gemini", project, query, zone, answer });
}
