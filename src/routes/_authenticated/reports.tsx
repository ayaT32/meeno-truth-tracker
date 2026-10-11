import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Download, Search, Plus, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DataState, useCopy } from "@/components/desk-ui";
import { VerdictBadge } from "@/components/verdict-badge";
import { useI18n } from "@/lib/i18n";
import { useClaims, useReports, useMe } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { pageMeta, downloadText, reportBody } from "@/lib/desk";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => pageMeta("Reports", "Create, review, and export The Meeno's internal fact-checking reports."),
  component: ReportsPage,
});

function ReportsPage() {
  const {t,lang} = useI18n(); const c = useCopy(); const q = useReports(); const claims = useClaims(); const {data:me} = useMe(); const qc = useQueryClient();
  const [search,setSearch] = useState(""); const [selected,setSelected] = useState<string|null>(null); const [create,setCreate] = useState(false); const [claimId,setClaimId] = useState(""); const [title,setTitle] = useState(""); const [busy,setBusy] = useState(false); const [error,setError] = useState("");
  const rows = (q.data ?? []).filter(r => `${r.title} ${r.body}`.toLowerCase().includes(search.toLowerCase())); const report = q.data?.find(r => r.id === selected);
  async function save(e: React.FormEvent) {
    e.preventDefault(); const claim = claims.data?.find(c => c.id === claimId); if(!me || !claim) return;setBusy(true);setError("");
    try {const {data,error} = await supabase.from("reports").insert({user_id:me.user.id,claim_id:claim.id,title:title.trim() || claim.claim_text.slice(0,160),body:reportBody(claim,lang),verdict:claim.verdict}).select("id").single();if(error) throw error;await qc.invalidateQueries({queryKey:["reports"]});setCreate(false);setSelected(data.id);setClaimId("");setTitle("");toast.success(t("reportCreated"));} catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}
  }
  return <div><PageHeader eyebrow={c("المكتب التحريري", "EDITORIAL DESK")} title={t("reports")} actions={<Button onClick={() => setCreate(true)}><Plus />{t("generateReport")}</Button>} /><div className="relative mb-6 max-w-lg"><Search className="absolute start-3 top-3 size-4 text-muted-foreground" /><Input aria-label={t("search")} className="h-10 bg-card ps-9" placeholder={t("search")} value={search} onChange={e=>setSearch(e.target.value)} /></div><p className="mb-5 text-sm text-muted-foreground">{rows.length} {c("تقرير", "reports")}</p>
    {q.isLoading || q.error || !rows.length ? <DataState loading={q.isLoading} error={q.error} retry={()=>void q.refetch()} empty={c("لا توجد تقارير مطابقة", "No matching reports")} /> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{rows.map(r=><article key={r.id} className="flex min-w-0 flex-col rounded-lg border bg-card p-5"><div className="mb-5 flex items-center justify-between gap-3"><FileText className="size-6 text-primary"/><VerdictBadge verdict={r.verdict}/></div><h2 className="mb-3 line-clamp-2 text-base font-semibold leading-7" dir="auto">{r.title}</h2><p className="mb-5 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString(lang==="ar"?"ar":"en-GB")}</p><div className="mt-auto flex items-center justify-between border-t pt-4"><Button variant="ghost" size="sm" onClick={()=>setSelected(r.id)}>{c("عرض التقرير", "Open report")}</Button><Button variant="ghost" size="icon" aria-label={c("تحميل التقرير", "Download report")} title={c("تحميل التقرير", "Download report")} onClick={()=>downloadText(`meeno-report-${r.id.slice(0,8)}.txt`,`${r.title}\n\n${r.body}`)}><Download/></Button></div></article>)}</div>}
    <Dialog open={create} onOpenChange={open=>{if(!busy)setCreate(open);}}><DialogContent><DialogHeader><DialogTitle>{t("generateReport")}</DialogTitle></DialogHeader><form onSubmit={save} className="space-y-5"><div className="space-y-2"><Label>{t("claimText")}</Label><Select value={claimId} onValueChange={setClaimId}><SelectTrigger aria-label={t("claimText")} className="w-full [&>span]:truncate"><SelectValue placeholder={c("اختر ادعاءً محفوظاً", "Select a saved claim")} /></SelectTrigger><SelectContent>{(claims.data??[]).filter(r=>r.status==="checked").map(r=><SelectItem key={r.id} value={r.id}>{r.claim_text.slice(0,80)}</SelectItem>)}</SelectContent></Select>{claims.isLoading && <p className="text-sm text-muted-foreground">{c("جارٍ التحميل…", "Loading…")}</p>}{claims.error && <p role="alert" className="text-sm text-destructive">{c("تعذر تحميل الادعاءات", "Claims could not be loaded")}</p>}{!claims.isLoading && !claims.error && !claims.data?.length && <p className="text-sm text-muted-foreground">{c("لم تُحفظ أي ادعاءات بعد", "No claims have been saved yet")}</p>}</div><div className="space-y-2"><Label htmlFor="report-title">{c("عنوان التقرير (اختياري)", "Report title (optional)")}</Label><Input id="report-title" maxLength={160} value={title} onChange={e=>setTitle(e.target.value)} /></div>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" disabled={!claimId || busy} className="w-full">{busy?<Loader2 className="animate-spin"/>:<FileText/>}{t("generateReport")}</Button></form></DialogContent></Dialog>
    <Dialog open={!!report} onOpenChange={open=>{if(!open)setSelected(null);}}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle className="pe-6 leading-8" dir="auto">{report?.title}</DialogTitle></DialogHeader>{report&&<><div className="flex flex-wrap items-center justify-between gap-3"><VerdictBadge verdict={report.verdict}/><Button variant="outline" size="sm" onClick={()=>downloadText(`meeno-report-${report.id.slice(0,8)}.txt`,`${report.title}\n\n${report.body}`)}><Download/>{c("تحميل", "Download")}</Button></div><p className="whitespace-pre-wrap break-words text-sm leading-8" dir="auto">{report.body}</p></>}</DialogContent></Dialog>
  </div>;
}
