import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Download, ScanSearch, ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ClaimFilters, DataState, useCopy } from "@/components/desk-ui";
import { VerdictBadge } from "@/components/verdict-badge";
import { useClaims } from "@/lib/session";
import { useI18n } from "@/lib/i18n";
import { pageMeta, downloadText } from "@/lib/desk";

export const Route = createFileRoute("/_authenticated/history/")({
  head: () => pageMeta("Claims history", "Search Fattabyno's saved claims and verification research."),
  component: HistoryPage,
});

function HistoryPage() {
  const {t,lang} = useI18n(); const c = useCopy(); const q = useClaims(); const [search,setSearch] = useState(""); const [verdict,setVerdict] = useState("all");
  const rows = (q.data ?? []).filter(r => (verdict === "all" || r.verdict === verdict) && `${r.claim_text} ${r.category ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  return <div><PageHeader eyebrow={c("أرشيف التحقق", "VERIFICATION ARCHIVE")} title={t("history")} actions={<Button asChild><Link to="/check"><ScanSearch />{t("newCheck")}</Link></Button>} /><ClaimFilters {...{search,setSearch,verdict,setVerdict}} />
    <div className="mb-4 flex items-center justify-between"><p className="text-sm text-muted-foreground">{rows.length} {c("ادعاء", "claims")}</p><Button variant="ghost" size="sm" disabled={!rows.length} onClick={() => downloadText("fattabyno-claims.csv",[["Claim","Verdict","Confidence","Category","Date"],...rows.map(r => [r.claim_text,r.verdict,r.confidence,r.category,r.created_at])].map(row=>row.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n"),"text/csv;charset=utf-8")}><Download />{c("تصدير CSV", "Export CSV")}</Button></div>
    {q.isLoading || q.error || !rows.length ? <DataState loading={q.isLoading} error={q.error} retry={() => void q.refetch()} empty={c("لا توجد ادعاءات مطابقة", "No matching claims")} /> : <div className="overflow-x-auto border-y bg-card"><table className="w-full min-w-[620px] text-start text-sm"><thead className="border-b bg-muted/40 text-xs text-muted-foreground"><tr>{[t("claimText"),t("verdict"),t("category"),t("date"),""].map((h,i)=><th key={i} className="px-5 py-4 text-start font-medium">{h}</th>)}</tr></thead><tbody className="divide-y">{rows.map(r=><tr key={r.id} className="hover:bg-muted/30"><td className="max-w-sm px-5 py-5"><Link to="/history/$id" params={{id:r.id}} className="line-clamp-2 font-medium leading-7 hover:text-primary" dir="auto">{r.claim_text}</Link></td><td className="px-5 py-5"><VerdictBadge verdict={r.verdict}/></td><td className="px-5 py-5 text-muted-foreground">{r.category ?? "—"}</td><td className="whitespace-nowrap px-5 py-5 text-muted-foreground">{new Date(r.created_at).toLocaleDateString(lang==="ar"?"ar":"en-GB")}</td><td className="px-3"><Button asChild variant="ghost" size="icon" title={t("viewClaim")}><Link to="/history/$id" params={{id:r.id}} aria-label={t("viewClaim")}><ArrowUpRight /></Link></Button></td></tr>)}</tbody></table></div>}
  </div>;
}
