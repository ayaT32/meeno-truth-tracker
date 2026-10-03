import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useI18n } from "@/lib/i18n";
import { Logo, LangSwitch } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — The Meeno" },
      { name: "description", content: "Staff and management sign-in for The Meeno fact-checking desk." },
      { property: "og:title", content: "Sign in — The Meeno" },
      { property: "og:description", content: "Staff and management sign-in for The Meeno fact-checking desk." },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/dashboard" });
  },
  component: AuthPage,
});

function AuthPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/dashboard" });
        else toast.success(t("checkEmail"));
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) toast.error(String(r.error.message ?? r.error));
    else if (!r.redirected) navigate({ to: "/dashboard" });
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="paper-grain relative hidden flex-col justify-between bg-ink p-12 text-ink-foreground md:flex">
        <Logo light />
        <div>
          <p className="font-display text-5xl font-semibold leading-tight">
            {lang === "ar" ? (
              <>الحقيقة <span className="text-sidebar-primary">تُفحص</span><br />قبل أن تُنشر.</>
            ) : (
              <>Every claim <span className="text-sidebar-primary">checked</span><br />before it spreads.</>
            )}
          </p>
          <p className="mt-6 max-w-sm text-ink-foreground/70">{t("staffOnly")}</p>
        </div>
        <div className="h-1.5 w-24 rounded-full bg-ember" />
      </div>
      <div className="flex flex-col items-center justify-center p-6">
        <div className="mb-6 flex w-full max-w-sm items-center justify-between md:justify-end">
          <div className="md:hidden"><Logo /></div>
          <LangSwitch />
        </div>
        <form onSubmit={submit} className="sheet w-full max-w-sm space-y-4 p-8">
          <h1 className="text-2xl font-semibold text-ink">{mode === "in" ? t("signIn") : t("signUp")}</h1>
          {mode === "up" && (
            <div className="space-y-1.5">
              <Label>{t("fullName")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>{t("email")}</Label>
            <Input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>{t("password")}</Label>
            <Input type="password" dir="ltr" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>{mode === "in" ? t("signIn") : t("signUp")}</Button>
          <Button type="button" variant="outline" className="w-full" onClick={google}>{t("google")}</Button>
          <p className="text-center text-sm text-muted-foreground">
            {mode === "in" ? t("noAccount") : t("haveAccount")}{" "}
            <button type="button" className="font-medium text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>
              {mode === "in" ? t("signUp") : t("signIn")}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
