import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, FileText, Flame, History, LayoutDashboard, LogOut, ScanSearch, Users, Languages } from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useMe } from "@/lib/session";

export function Logo({ light }: { light?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-10 place-items-center rounded-lg bg-gold font-display text-xl font-bold text-gold-foreground">ف</div>
      <div className="leading-tight">
        <p className={light ? "font-display text-base font-semibold text-sidebar-foreground" : "font-display text-base font-semibold text-ink"}>{t("appName")}</p>
        <p className={light ? "text-[11px] text-sidebar-foreground/60" : "text-[11px] text-muted-foreground"}>{t("tagline")}</p>
      </div>
    </div>
  );
}

export function LangSwitch({ light }: { light?: boolean }) {
  const { lang, setLang } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      className={
        light
          ? "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent"
          : "inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-accent"
      }
    >
      <Languages className="size-4" />
      {lang === "ar" ? "English" : "العربية"}
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { data: me } = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const items = [
    { to: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { to: "/trends", label: t("trends"), icon: Flame },
    { to: "/check", label: t("check"), icon: ScanSearch },
    { to: "/history", label: t("history"), icon: History },
    { to: "/reports", label: t("reports"), icon: FileText },
    ...(me?.isAdmin
      ? [
          { to: "/analytics", label: t("analytics"), icon: BarChart3 },
          { to: "/team", label: t("team"), icon: Users },
        ]
      : []),
  ] as const;

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar p-5 md:flex">
        <Logo light />
        <nav className="mt-10 flex flex-1 flex-col gap-1">
          {items.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "!bg-sidebar-primary !text-sidebar-primary-foreground font-medium" }}
            >
              <it.icon className="size-4" />
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 border-t border-sidebar-border pt-4">
          {me && (
            <div className="px-3 pb-2">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{me.profile?.full_name || me.user.email}</p>
              <p className="text-xs text-sidebar-primary">{me.isAdmin ? t("management") : t("staff")}</p>
            </div>
          )}
          <LangSwitch light />
          <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent">
            <LogOut className="size-4" />
            {t("signOut")}
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="no-print h-1.5 bg-gold" />
        <header className="no-print flex items-center justify-between gap-2 border-b border-border bg-card px-4 py-3 md:hidden">
          <Logo />
          <div className="flex gap-2">
            <LangSwitch />
            <button onClick={signOut} aria-label={t("signOut")} className="rounded-lg border border-border p-2"><LogOut className="size-4" /></button>
          </div>
        </header>
        <nav className="no-print flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2 md:hidden">
          {items.map((it) => (
            <Link key={it.to} to={it.to} className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-muted-foreground" activeProps={{ className: "!bg-primary !text-primary-foreground" }}>
              {it.label}
            </Link>
          ))}
        </nav>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-10 md:py-10">{children}</main>
      </div>
    </div>
  );
}
