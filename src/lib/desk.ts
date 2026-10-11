import type { ClaimRow } from "@/lib/session";

export type Analysis = {
  summary_ar: string; summary_en: string;
  sub_claims: { statement: string; verdict: string; explanation: string }[];
  red_flags: string[]; suggested_sources: string[];
};

export function readAnalysis(value: unknown): Analysis {
  const a = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    summary_ar: typeof a.summary_ar === "string" ? a.summary_ar : "",
    summary_en: typeof a.summary_en === "string" ? a.summary_en : "",
    sub_claims: Array.isArray(a.sub_claims) ? a.sub_claims.filter((c) => c && typeof c.statement === "string" && typeof c.explanation === "string") : [],
    red_flags: Array.isArray(a.red_flags) ? a.red_flags.filter((s): s is string => typeof s === "string") : [],
    suggested_sources: Array.isArray(a.suggested_sources) ? a.suggested_sources.filter((s): s is string => typeof s === "string") : [],
  };
}

export function pageMeta(title: string, description: string) {
  return { meta: [{ title: `${title} — The Meeno` }, { name: "description", content: description }, { property: "og:title", content: `${title} — The Meeno` }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] };
}

export function downloadText(name: string, text: string, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob(["\uFEFF", text], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}

export function reportBody(claim: ClaimRow, lang: "ar" | "en") {
  const a = readAnalysis(claim.analysis);
  return ["The Meeno", claim.claim_text, `${claim.verdict ?? "unverifiable"} · ${claim.confidence ?? 0}%`, lang === "ar" ? a.summary_ar || claim.summary : a.summary_en || claim.summary, ...a.sub_claims.map(c => `${c.statement}\n${c.verdict}\n${c.explanation}`), a.red_flags.join("\n"), a.suggested_sources.join("\n"), claim.source_url, lang === "ar" ? "نتيجة آلية أولية — تتطلب مراجعة تحريرية قبل النشر." : "Preliminary AI assessment — editorial review required before publication."].filter(Boolean).join("\n\n");
}

export function summariseClaims(claims: ClaimRow[]) {
  const checked = claims.filter(c => c.status === "checked");
  const confidence = checked.filter(c => c.confidence !== null);
  return { total: claims.length, checked: checked.length, flagged: checked.filter(c => c.verdict === "false" || c.verdict === "misleading").length, average: confidence.length ? Math.round(confidence.reduce((n,c) => n + (c.confidence ?? 0),0) / confidence.length) : null };
}