import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";
import { createLovableAiGatewayRunIdFetch } from "./run-id.server";

const MODEL = "openai/gpt-6-astra";
const BASE_URL = "https://ai.gateway.lovable.dev/v1";

export type FactCheckResult = {
  verdict: string;
  confidence: number;
  category: string;
  summary_ar: string;
  summary_en: string;
  sub_claims: { statement: string; verdict: string; explanation: string }[];
  red_flags: string[];
  suggested_sources: string[];
};

const SYSTEM = `You are a senior Arabic-language fact-checker at Fattabyno, a professional Arabic fact-checking organisation.
Analyse the claim provided (text, optional source page content, optional image). Break it into its distinct checkable sub-claims and assess each one.
Use only these verdict values: "true", "false", "misleading", "partly_true", "unverifiable".
Be honest about uncertainty: if you cannot verify from your knowledge, use "unverifiable" and say what evidence is needed.
For images, look for signs of manipulation, mismatched context, recycled photos, or fabricated screenshots.
Respond with ONLY a JSON object, no markdown fences, with exactly these keys:
{"verdict": string, "confidence": integer 0-100, "category": short English topic like "Politics" | "Health" | "Economy" | "Science" | "Society" | "Conflict" | "Other",
 "summary_ar": "3-5 sentence explanation in Modern Standard Arabic", "summary_en": "same explanation in English",
 "sub_claims": [{"statement": string (in the claim's language), "verdict": string, "explanation": string (Arabic)}],
 "red_flags": [short strings in Arabic], "suggested_sources": [names or URLs of reliable sources to consult]}
Keep at most 6 sub_claims, 6 red_flags and 6 suggested_sources.`;

async function fetchPageText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 FattabynoFactCheck" }, redirect: "follow" });
    if (!res.ok) return null;
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, 8000);
  } catch {
    return null;
  }
}

const VALID = new Set(["true", "false", "misleading", "partly_true", "unverifiable"]);

function normalise(raw: string): FactCheckResult {
  const match = raw.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(match ? match[0] : raw) as Partial<FactCheckResult>;
  const v = (s: unknown) => (typeof s === "string" && VALID.has(s) ? s : "unverifiable");
  return {
    verdict: v(parsed.verdict),
    confidence: Math.max(0, Math.min(100, Math.round(Number(parsed.confidence) || 0))),
    category: String(parsed.category || "Other"),
    summary_ar: String(parsed.summary_ar || ""),
    summary_en: String(parsed.summary_en || ""),
    sub_claims: (parsed.sub_claims || []).slice(0, 6).map((c) => ({
      statement: String(c?.statement || ""),
      verdict: v(c?.verdict),
      explanation: String(c?.explanation || ""),
    })),
    red_flags: (parsed.red_flags || []).slice(0, 6).map(String),
    suggested_sources: (parsed.suggested_sources || []).slice(0, 6).map(String),
  };
}

export async function runFactCheck(input: {
  claimText: string;
  sourceUrl?: string | null | undefined;
  imageBase64?: string | null | undefined;
  imageMediaType?: string | null | undefined;
}): Promise<FactCheckResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured.");

  let text = `CLAIM:\n${input.claimText}`;
  if (input.sourceUrl) {
    const page = await fetchPageText(input.sourceUrl);
    text += `\n\nSOURCE URL: ${input.sourceUrl}`;
    text += page ? `\nSOURCE PAGE TEXT (truncated):\n${page}` : `\n(The source page could not be fetched.)`;
  }

  const content: Exclude<ModelMessage, { role: "system" }>["content"] = [{ type: "text", text }];
  if (input.imageBase64) {
    (content as unknown[]).push({ type: "image", image: input.imageBase64, mediaType: input.imageMediaType || "image/jpeg" });
  }

  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({
    baseURL: BASE_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  let streamError: unknown = null;
  const result = streamText({
    model: provider.responses(MODEL),
    system: SYSTEM,
    messages: [{ role: "user", content } as ModelMessage],
    maxRetries: 0,
    onError: ({ error }) => {
      streamError = error;
    },
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "medium",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  const out = await result.text;
  if (streamError) {
    const e = streamError as { statusCode?: number; message?: string };
    if (e.statusCode === 402) throw new Error("AI credits are used up. Add credits to continue.");
    if (e.statusCode === 429) throw new Error("Too many requests. Please wait a moment and try again.");
    throw new Error(e.message || "The AI check failed.");
  }
  if (!out.trim()) throw new Error("The AI returned no answer for this claim.");
  return normalise(out);
}
