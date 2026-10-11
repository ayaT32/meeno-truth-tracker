import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/page-header";
import { AnalysisView, DataState, useCopy } from "@/components/desk-ui";
import { ReportAction } from "@/components/report-action";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { pageMeta } from "@/lib/desk";

export const Route = createFileRoute("/_authenticated/history/$id")({
  head: () => pageMeta("Claim analysis", "Review a saved claim, its sub-claims, evidence, and AI assessment at The Meeno."),
  component: ClaimPage,
});

function ClaimPage() {
  const {id} = Route.useParams(); const {t,lang} = useI18n(); const c = useCopy();
  const q = useQuery({queryKey:["claim",id],queryFn:async () => {const {data,error} = await supabase.from("claims").select("*").eq("id",id).maybeSingle(); if(error) throw error;return data;}});
  const image = useQuery({queryKey:["claim-image",q.data?.image_path],enabled:!!q.data?.image_path,queryFn:async () => {if(!q.data?.image_path) return null;const {data,error} = await supabase.storage.from("claim-images").createSignedUrl(q.data.image_path,3600);if(error) throw error;return data.signedUrl;}});
  return <div><Button asChild variant="ghost" className="no-print mb-6"><Link to="/history"><ArrowLeft className="rtl:rotate-180" />{t("history")}</Link></Button><PageHeader title={c("ملف الادعاء", "Claim file")} eyebrow={q.data ? new Date(q.data.created_at).toLocaleDateString(lang === "ar" ? "ar" : "en-GB") : undefined} actions={q.data ? <div className="no-print"><ReportAction claim={q.data} /></div> : undefined} />
    {q.isLoading || q.error || !q.data ? <DataState loading={q.isLoading} error={q.error} retry={() => void q.refetch()} empty={c("الادعاء غير موجود أو ليس لديك إذن بعرضه", "Claim not found or unavailable to your account")} /> : <div className="mx-auto max-w-3xl"><h2 dir="auto" className="mb-6 text-2xl font-medium leading-10">{q.data.claim_text}</h2>{q.data.source_url && <a href={q.data.source_url} target="_blank" rel="noopener noreferrer" className="mb-6 inline-flex max-w-full items-center gap-2 break-all text-sm text-primary"><ExternalLink className="size-4 shrink-0" />{q.data.source_url}</a>}{image.data && <img src={image.data} alt={c("الصورة المرفقة بالادعاء", "Claim attachment")} className="mb-8 max-h-96 max-w-full rounded-lg object-contain" />}{image.error && <p className="mb-6 text-sm text-destructive">{c("تعذر تحميل الصورة المرفقة", "The attachment could not be loaded")}</p>}<AnalysisView claim={q.data} /></div>}
  </div>;
}
