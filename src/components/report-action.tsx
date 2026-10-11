import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FilePlus2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useMe, type ClaimRow } from "@/lib/session";
import { reportBody } from "@/lib/desk";
import { Button } from "@/components/ui/button";

export function ReportAction({ claim }: { claim: ClaimRow }) {
  const { t, lang } = useI18n(); const { data: me } = useMe(); const qc = useQueryClient(); const [busy,setBusy] = useState(false);
  async function save() {
    if (!me) return; setBusy(true);
    try {
      const {error} = await supabase.from("reports").insert({ user_id: me.user.id, claim_id: claim.id, title: claim.claim_text.slice(0,160), body: reportBody(claim,lang), verdict: claim.verdict });
      if (error) throw error; await qc.invalidateQueries({queryKey:["reports"]}); toast.success(t("reportCreated"));
    } catch(e) { toast.error(e instanceof Error ? e.message : String(e)); } finally {setBusy(false);}
  }
  return <Button disabled={busy || !me || claim.status !== "checked"} onClick={() => void save()}>{busy ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <FilePlus2 />}{t("generateReport")}</Button>;
}