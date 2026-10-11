import { describe, expect, it } from "vitest";
import { readAnalysis, reportBody, summariseClaims } from "@/lib/desk";
import type { ClaimRow } from "@/lib/session";

const claim: ClaimRow = { id: "a", user_id: "u", claim_text: "A claim", verdict: "false", confidence: 80, category: "Science", status: "checked", created_at: "2026-10-11", analysis: {summary_en:"Evidence summary",sub_claims:[{statement:"First",verdict:"false",explanation:"Reason"}]}, summary: null, source_url: null, image_path: null };
describe("Verification desk", () => {
  it("handles missing analysis", () => expect(readAnalysis(null).sub_claims).toEqual([]));
  it("counts checked verdicts and averages confidence", () => expect(summariseClaims([claim])).toEqual({total:1,checked:1,flagged:1,average:80}));
  it("does not invent confidence for empty data", () => expect(summariseClaims([]).average).toBeNull());
  it("includes evidence and review notice in a report", () => { const body = reportBody(claim,"en"); expect(body).toContain("Evidence summary"); expect(body).toContain("First"); expect(body).toContain("editorial review"); });
});