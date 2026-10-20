import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createLovableAiGatewayRunIdFetch } from "./run-id.server";

const GATEWAY = "https://connector-gateway.lovable.dev/firecrawl/v2";

export type TrendItem = {
  claim: string;
  topic: string;
  category: string;
  why_check: string;
  priority: number;
  mentions: number;
  sources: { title: string; url: string }[];
};

const QUERIES = [
  "أخبار عاجلة اليوم",
  "شائعة متداولة على مواقع التواصل",
  "انتشر على تويتر فيديو",
  "حقيقة الخبر المتداول",
  "site:x.com OR site:facebook.com عاجل",
];

type Hit = { title: string; url: string; description: string };

async function search(query: string, tbs: string, keys: { lovable: string; fc: string }): Promise<Hit[]> {
  const res = await fetch(`${GATEWAY}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${keys.lovable}`, "X-Connection-Api-Key": keys.fc },
    body: JSON.stringify({ query, limit: 10, lang: "ar", tbs }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Firecrawl search failed [${res.status}]: ${body}`);
    if (res.status === 402 || body.includes("Credit limit")) throw new Error("Search credits are used up. Ask a workspace owner to add credits.");
    throw new Error(`News search failed (${res.status}).`);
  }
  const json = (await res.json()) as { data?: { web?: Hit[]; news?: Hit[] } | Hit[] };
  const d = json.data;
  const list = Array.isArray(d) ? d : [...(d?.web ?? []), ...(d?.news ?? [])];
  return list.filter((h) => h?.url).map((h) => ({ title: String(h.title ?? ""), url: String(h.url), description: String(h.description ?? "").slice(0, 400) }));
}

export async function findTrends(window: "day" | "week"): Promise<TrendItem[]> {
  const lovable = process.env["LOVABLE_API_KEY"];
  const fc = process.env["FIRECRAWL_API_KEY"];
  if (!lovable || !fc) throw new Error("Trend search is not configured.");
  const tbs = window === "day" ? "qdr:d" : "qdr:w";
  const results = await Promise.allSettled(QUERIES.map((q) => search(q, tbs, { lovable, fc })));
  const firstErr = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
  const seen = new Set<string>();
  const hits = results.flatMap((r) => (r.status === "fulfilled" ? r.value : [])).filter((h) => !seen.has(h.url) && seen.add(h.url));
  if (!hits.length) throw firstErr?.reason instanceof Error ? firstErr.reason : new Error("No recent posts were found.");

  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const provider = createOpenAI({ baseURL: "https://ai.gateway.lovable.dev/v1", apiKey: lovable, headers: { "Lovable-API-Key": lovable, "X-Lovable-AIG-SDK": "vercel-ai-sdk" }, fetch: runIdFetch.fetch });
  const list = hits.slice(0, 50).map((h, i) => `[${i}] ${h.title}\n${h.url}\n${h.description}`).join("\n\n");
  const { text } = await generateText({
    model: provider.responses("openai/gpt-6-astra"),
    maxRetries: 0,
    providerOptions: { openai: { store: false } },
    system: `You are the trends editor at The Meeno, an Arabic fact-checking desk covering the whole Arab world.
From the news and social media results given, identify the most trending CHECKABLE claims (factual assertions that could be true or false, rumours, viral images/videos, statistics). Merge results about the same claim. Ignore pure opinion, ads and sports scores.
Return ONLY JSON: {"items":[{"claim": "the claim as one clear Arabic sentence", "topic": "short Arabic topic", "category": "Politics|Health|Economy|Science|Society|Conflict|Other", "why_check": "one Arabic sentence on why it needs verification", "priority": 1-100 (virality x potential harm), "source_ids": [result numbers]}]}. Max 10 items, sorted by priority desc.`,
    prompt: list,
  });
  const match = text.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(match ? match[0] : text) as { items?: Array<Record<string, unknown>> };
  return (parsed.items ?? []).slice(0, 10).map((it) => {
    const ids = Array.isArray(it["source_ids"]) ? (it["source_ids"] as unknown[]).map(Number).filter((n) => hits[n]) : [];
    return {
      claim: String(it["claim"] ?? ""),
      topic: String(it["topic"] ?? ""),
      category: String(it["category"] ?? "Other"),
      why_check: String(it["why_check"] ?? ""),
      priority: Math.max(1, Math.min(100, Math.round(Number(it["priority"]) || 50))),
      mentions: Math.max(1, ids.length),
      sources: ids.slice(0, 5).map((n) => ({ title: hits[n]!.title, url: hits[n]!.url })),
    };
  }).filter((t) => t.claim);
}
