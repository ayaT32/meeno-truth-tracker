import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ExternalLink, Flame, RefreshCw, ScanSearch } from "lucide-react";
import { PageHeader, StatCard } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataState, useCopy } from "@/components/desk-ui";
import { useI18n } from "@/lib/i18n";
import { pageMeta } from "@/lib/desk";
import { getTrends } from "@/lib/trends.functions";

export const Route = createFileRoute("/_authenticated/trends")({
  head: () => pageMeta("Trending claims", "Spot trending claims from Arabic news and social media and start verifying them at The Meeno."),
  component: TrendsPage,
});

function TrendsPage() {
  const { t } = useI18n(); const c = useCopy(); const run = useServerFn(getTrends);
  const [win, setWin] = useState<"day" | "week">("day");
  const m = useMutation({ mutationFn: () => run({ data: { window: win } }) });
  const items = m.data?.items ?? [];
  const top = items[0];
  return <div>
    <PageHeader eyebrow={c("رصد الأخبار ومواقع التواصل", "NEWS & SOCIAL MONITOR")} title={c("الادعاءات الرائجة", "Trending claims")} actions={<div className="flex gap-2">
      <Select value={win} onValueChange={(v) => setWin(v as "day" | "week")}><SelectTrigger aria-label={c("الفترة", "Window")} className="w-40 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="day">{c("آخر 24 ساعة", "Last 24 hours")}</SelectItem><SelectItem value="week">{c("آخر 7 أيام", "Last 7 days")}</SelectItem></SelectContent></Select>
      <Button onClick={() => m.mutate()} disabled={m.isPending}><RefreshCw className={m.isPending ? "animate-spin motion-reduce:animate-none" : ""} />{m.data ? c("تحديث", "Refresh") : c("رصد الآن", "Scan now")}</Button>
    </div>} />
    {m.isPending ? <DataState loading /> : m.error ? <DataState error={m.error} retry={() => m.mutate()} /> : !m.data ? <DataState empty={c("اضغط «رصد الآن» لجمع الادعاءات الأكثر تداولاً في الأخبار ومواقع التواصل العربية.", "Press “Scan now” to gather the most-shared claims from Arabic news and social media.")} /> : <>
      <div className="grid gap-4 sm:grid-cols-3"><StatCard accent label={c("ادعاءات رائجة", "Trending claims")} value={items.length} /><StatCard label={c("أعلى أولوية", "Top priority")} value={top ? `${top.priority}` : "—"} /><StatCard label={c("آخر رصد", "Last scan")} value={new Date(m.data.fetchedAt).toLocaleTimeString()} /></div>
      {items.length === 0 ? <DataState empty={c("لم يُعثر على ادعاءات قابلة للتحقق", "No checkable claims found")} /> : <ol className="mt-8 divide-y border-y">{items.map((it, i) => <li key={i} className="grid gap-4 py-6 md:grid-cols-[3rem_1fr_auto]">
        <span className="font-display text-2xl text-primary">{String(i + 1).padStart(2, "0")}</span>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 font-medium text-accent-foreground"><Flame className="size-3" />{it.priority}</span><span>{it.topic}</span><span>·</span><span>{it.category}</span><span>·</span><span>{it.mentions} {c("مصادر", "sources")}</span></div>
          <h2 className="text-base font-semibold leading-8" dir="auto">{it.claim}</h2>
          <p className="text-sm leading-7 text-muted-foreground" dir="auto">{it.why_check}</p>
          <div className="mt-1 h-1.5 w-full max-w-xs rounded-full bg-secondary"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${it.priority}%` }} /></div>
          {it.sources.length > 0 && <ul className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs">{it.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-64 items-center gap-1 truncate text-primary underline" dir="auto"><ExternalLink className="size-3 shrink-0" /><span className="truncate">{s.title || new URL(s.url).hostname}</span></a></li>)}</ul>}
        </div>
        <Button asChild variant="outline" className="self-start"><Link to="/check" search={{ claim: it.claim, url: it.sources[0]?.url }}><ScanSearch />{t("check")}</Link></Button>
      </li>)}</ol>}
      <p className="mt-6 border-s-2 border-primary bg-primary-soft/40 p-4 text-sm leading-7 text-accent-foreground">{c("الأولوية تقدير آلي يجمع بين الانتشار والضرر المحتمل — راجع المصادر قبل البدء.", "Priority is an AI estimate of reach and potential harm — review the sources before starting.")}</p>
    </>}
  </div>;
}
