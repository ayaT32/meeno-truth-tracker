import { AlertCircle, FileSearch, Loader2, Search } from "lucide-react";
import { useI18n, VERDICTS, type TKey } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VerdictBadge } from "@/components/verdict-badge";
import { readAnalysis } from "@/lib/desk";
import type { ClaimRow } from "@/lib/session";

export function useCopy() { const { lang } = useI18n(); return (ar: string, en: string) => lang === "ar" ? ar : en; }

export function DataState({ loading, error, empty, retry }: { loading?: boolean; error?: unknown; empty?: string; retry?: () => void }) {
  const c = useCopy();
  if (loading) return <div role="status" className="flex min-h-48 items-center justify-center gap-2 text-muted-foreground"><Loader2 className="size-5 animate-spin motion-reduce:animate-none" />{c("جارٍ التحميل…", "Loading…")}</div>;
  if (error) return <div role="alert" className="flex min-h-48 flex-col items-center justify-center gap-3 text-destructive"><AlertCircle /><p>{error instanceof Error ? error.message : c("تعذر تحميل البيانات", "Could not load data")}</p><Button variant="outline" onClick={retry}>{c("إعادة المحاولة", "Try again")}</Button></div>;
  return <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center text-muted-foreground"><FileSearch className="size-9 text-primary/60" /><p>{empty}</p></div>;
}

export function ClaimFilters({ search, setSearch, verdict, setVerdict }: { search: string; setSearch: (s: string) => void; verdict: string; setVerdict: (s: string) => void }) {
  const { t } = useI18n();
  return <div className="no-print mb-6 flex flex-wrap gap-3"><div className="relative min-w-48 flex-1"><Search className="absolute start-3 top-3 size-4 text-muted-foreground" /><Input aria-label={t("search")} placeholder={t("search")} value={search} onChange={e => setSearch(e.target.value)} className="h-10 bg-card ps-9" /></div><Select value={verdict} onValueChange={setVerdict}><SelectTrigger aria-label={t("verdict")} className="h-10 w-48 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t("all")} — {t("verdict")}</SelectItem>{VERDICTS.map(v => <SelectItem key={v} value={v}>{t(`v.${v}` as TKey)}</SelectItem>)}</SelectContent></Select></div>;
}

export function AnalysisView({ claim }: { claim: ClaimRow }) {
  const { t, lang } = useI18n(); const c = useCopy(); const a = readAnalysis(claim.analysis);
  return <div className="space-y-8">
    <div className="flex flex-wrap items-center gap-4 border-b pb-6"><VerdictBadge verdict={claim.verdict} className="px-3 py-1.5 text-sm" /><span className="text-sm text-muted-foreground">{t("confidence")} <strong className="text-foreground">{claim.confidence ?? "—"}%</strong></span><span className="text-sm text-muted-foreground">{claim.category}</span></div>
    <section><h2 className="mb-3 text-lg font-semibold">{t("analysis")}</h2><p className="whitespace-pre-wrap text-sm leading-8">{(lang === "ar" ? a.summary_ar : a.summary_en) || claim.summary || c("لا يوجد تحليل محفوظ", "No saved analysis")}</p></section>
    {a.sub_claims.length > 0 && <section><h2 className="mb-4 text-lg font-semibold">{t("subClaims")} <span className="text-primary">{a.sub_claims.length}</span></h2><ol className="divide-y border-y">{a.sub_claims.map((s,i) => <li key={i} className="py-5"><div className="mb-2 flex flex-wrap items-start gap-3"><span className="font-sans font-bold tabular-nums text-gold-ink">{String(i+1).padStart(2,"0")}</span><h3 className="min-w-0 flex-1 text-sm font-semibold leading-7" dir="auto">{s.statement}</h3><VerdictBadge verdict={s.verdict} /></div><p className="text-sm leading-7 text-muted-foreground" dir="auto">{s.explanation}</p></li>)}</ol></section>}
    <div className="grid gap-8 sm:grid-cols-2">{[[t("redFlags"),a.red_flags],[t("sources"),a.suggested_sources]].map(([title,items]) => <section key={title as string}><h2 className="mb-3 text-base font-semibold">{title as string}</h2><ul className="space-y-3 text-sm leading-7 text-muted-foreground">{(items as string[]).length ? (items as string[]).map((s,i) => <li key={i} className="border-s-2 border-primary/40 ps-3" dir="auto">{s.startsWith("https://") || s.startsWith("http://") ? <a href={s} target="_blank" rel="noopener noreferrer" className="break-all text-primary underline">{s}</a> : s}</li>) : <li>{c("لم تُسجّل عناصر", "No items recorded")}</li>}</ul></section>)}</div>
    <p className="border-s-2 border-primary bg-primary-soft/40 p-4 text-sm leading-7 text-accent-foreground">{t("aiNote")}</p>
  </div>;
}