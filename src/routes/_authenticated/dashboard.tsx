import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ScanSearch } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useClaims, useMe, useReports } from "@/lib/session";
import { PageHeader, StatCard } from "@/components/page-header";
import { VerdictBadge } from "@/components/verdict-badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Fattabyno" },
      { name: "description", content: "Overview of claims and reports at Fattabyno." },
      { property: "og:title", content: "Dashboard — Fattabyno" },
      { property: "og:description", content: "Overview of claims and reports at Fattabyno." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { t, lang } = useI18n();
  const { data: me } = useMe();
  const { data: claims = [] } = useClaims();
  const { data: reports = [] } = useReports();
  const weekAgo = Date.now() - 7 * 864e5;
  const week = claims.filter((c) => new Date(c.created_at).getTime() > weekAgo).length;
  const falseCount = claims.filter((c) => c.verdict === "false" || c.verdict === "misleading").length;

  return (
    <div>
      <PageHeader
        eyebrow={new Date().toLocaleDateString(lang === "ar" ? "ar" : "en-GB", { weekday: "long", day: "numeric", month: "long" })}
        title={`${t("welcome")}، ${me?.profile?.full_name ?? ""}`.replace("، ", lang === "ar" ? "، " : ", ")}
        actions={
          <Button asChild size="lg">
            <Link to="/check"><ScanSearch />{t("newCheck")}</Link>
          </Button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard accent label={t("totalClaims")} value={claims.length} />
        <StatCard label={t("thisWeek")} value={week} />
        <StatCard label={`${t("v.false")} / ${t("v.misleading")}`} value={falseCount} />
        <StatCard label={t("reportsCount")} value={reports.length} />
      </div>

      <section className="sheet mt-8 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-ink">{t("recentClaims")}</h2>
          <Link to="/history" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            {t("viewAll")} <ArrowLeft className="size-4 ltr:rotate-180" />
          </Link>
        </div>
        {claims.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {claims.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link to="/history/$id" params={{ id: c.id }} className="flex items-center gap-4 py-3.5 hover:text-primary">
                  <VerdictBadge verdict={c.verdict} />
                  <span className="line-clamp-1 flex-1 text-sm">{c.claim_text}</span>
                  <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString(lang === "ar" ? "ar" : "en-GB")}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
