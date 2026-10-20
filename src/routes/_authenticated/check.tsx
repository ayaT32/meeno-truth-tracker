import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ImagePlus, ScanSearch, Loader2, X, ArrowUpRight, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AnalysisView, useCopy } from "@/components/desk-ui";
import { useI18n } from "@/lib/i18n";
import { useMe, type ClaimRow } from "@/lib/session";
import { checkClaim } from "@/lib/factcheck.functions";
import { pageMeta } from "@/lib/desk";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/check")({
  validateSearch: (s: Record<string, unknown>): { claim?: string | undefined; url?: string | undefined } => ({
    claim: typeof s["claim"] === "string" ? s["claim"].slice(0, 10000) : undefined,
    url: typeof s["url"] === "string" && /^https?:\/\//.test(s["url"]) ? s["url"] : undefined,
  }),
  head: () => pageMeta("AI fact-check", "Analyse claims, screenshots, and source material at The Meeno verification desk."),
  component: CheckPage,
});

function CheckPage() {
  const { t } = useI18n(); const c = useCopy(); const { data: me } = useMe(); const qc = useQueryClient(); const run = useServerFn(checkClaim);
  const search = Route.useSearch();
  const [text,setText] = useState(search.claim ?? ""); const [source,setSource] = useState(search.url ?? ""); const [file,setFile] = useState<File | null>(null); const [preview,setPreview] = useState("");
  const [busy,setBusy] = useState(false); const [error,setError] = useState(""); const [result,setResult] = useState<ClaimRow | null>(null); const upload = useRef<HTMLInputElement>(null);
  async function choose(file?: File) {
    if (!file) return;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { setError(c("اختر صورة PNG أو JPG أو WebP لا تتجاوز 5 ميغابايت.", "Choose a PNG, JPG, or WebP image under 5 MB.")); return; }
    const data = await new Promise<string>((resolve,reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = reject; r.readAsDataURL(file); });
    setFile(file); setPreview(data); setError("");
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!me || busy) return; setBusy(true); setError(""); setResult(null); let path: string | null = null;
    try {
      if (file) { path = `${me.user.id}/${crypto.randomUUID()}.${file.type.split("/")[1]}`; const { error } = await supabase.storage.from("claim-images").upload(path,file); if (error) throw error; }
      const out = await run({ data: { claimText: text.trim(), sourceUrl: source.trim() || null, imageBase64: preview ? preview.split(",")[1] : null, imageMediaType: file?.type ?? null, imagePath: path } });
      setResult({ id: out.id, user_id: me.user.id, claim_text: text.trim(), source_url: source || null, image_path: path, verdict: out.result.verdict, confidence: out.result.confidence, category: out.result.category, summary: out.result.summary_ar, analysis: out.result, status: "checked", created_at: new Date().toISOString() });
      await qc.invalidateQueries({ queryKey: ["claims"] });
    } catch (e) { if (path) await supabase.storage.from("claim-images").remove([path]); setError(e instanceof Error ? e.message : c("تعذر إتمام الفحص", "The check could not be completed")); } finally { setBusy(false); }
  }
  return <div><PageHeader eyebrow={c("مكتب التحقق", "VERIFICATION DESK")} title={t("check")} />
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <form onSubmit={submit} className="space-y-6"><div className="flex items-center gap-3"><ScanSearch className="size-6 text-primary" /><h2 className="text-xl font-semibold">{c("ادعاء جديد", "New claim")}</h2></div>
        <div className="space-y-3"><Label htmlFor="claim">{t("claimText")}</Label><Textarea id="claim" dir="auto" minLength={3} maxLength={10000} required value={text} onChange={e => setText(e.target.value)} placeholder={t("claimPlaceholder")} disabled={busy} className="min-h-56 resize-y bg-card p-4 text-base leading-8" /><p className="text-end text-xs text-muted-foreground">{text.length.toLocaleString()} / 10,000</p></div>
        <div className="space-y-3"><Label htmlFor="source">{t("sourceLink")}</Label><Input id="source" type="url" dir="ltr" placeholder="https://" value={source} onChange={e => setSource(e.target.value)} disabled={busy} className="h-11 bg-card" /></div>
        <div className="space-y-3"><Label>{t("image")}</Label><input ref={upload} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={e => void choose(e.target.files?.[0])} />
          <div className="flex min-h-32 items-center justify-center gap-4 rounded-lg border border-dashed border-input bg-card p-4" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (!busy) void choose(e.dataTransfer.files[0]); }}>
            {file ? <><img src={preview} alt={file.name} className="h-24 w-24 rounded-md object-contain" /><span className="min-w-0 flex-1 break-all text-sm">{file.name}</span><Button type="button" variant="ghost" size="icon" disabled={busy} aria-label={c("إزالة الصورة", "Remove image")} title={c("إزالة الصورة", "Remove image")} onClick={() => {setFile(null);setPreview("");if(upload.current) upload.current.value="";}}><X /></Button></> : <div className="text-center"><Button type="button" variant="ghost" disabled={busy} onClick={() => upload.current?.click()}><ImagePlus />{t("chooseImage")}</Button><p className="mt-2 text-xs text-muted-foreground">PNG · JPG · WebP · 5 MB</p></div>}
          </div></div>
        {error && <p role="alert" className="break-words border-s-2 border-destructive bg-destructive/5 p-4 text-sm text-destructive">{error}</p>}
        <Button size="lg" className="w-full" disabled={busy || !me || text.trim().length < 3}>{busy ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <ScanSearch />}{busy ? t("checking") : t("runCheck")}</Button>
      </form>
      <aside className="min-w-0 border-t pt-6 lg:border-s lg:border-t-0 lg:ps-8 lg:pt-0">{result ? <><div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">{c("نتيجة الفحص", "Check result")}</h2><Button asChild variant="outline" size="sm"><Link to="/history/$id" params={{id:result.id}}>{t("viewClaim")}<ArrowUpRight /></Link></Button></div><AnalysisView claim={result} /></> : <div className="py-12 text-center"><ShieldCheck className="mx-auto mb-6 size-16 stroke-1 text-primary/60" /><h2 className="text-xl font-semibold">{busy ? t("checking") : c("بانتظار الادعاء", "Awaiting a claim")}</h2><p className="mx-auto mt-4 max-w-xs text-sm leading-7 text-muted-foreground">{t("aiNote")}</p>{busy && <div role="status" className="mt-8 flex items-center justify-center gap-2 text-primary"><Loader2 className="size-5 animate-spin motion-reduce:animate-none" />{c("قيد التحقق", "Verification in progress")}</div>}</div>}</aside>
    </div></div>;
}
