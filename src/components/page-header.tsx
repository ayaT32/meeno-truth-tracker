import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, actions }: { eyebrow?: string | undefined; title: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold text-ink md:text-4xl">{title}</h1>
      </div>
      {actions}
    </div>
  );
}

export function StatCard({ label, value, hint, accent }: { label: string; value: ReactNode; hint?: string; accent?: boolean }) {
  return (
    <div className={accent ? "rounded-2xl bg-ember p-5 text-primary-foreground shadow-lg" : "sheet p-5"}>
      <p className={accent ? "text-sm opacity-90" : "text-sm text-muted-foreground"}>{label}</p>
      <p className="mt-2 font-display text-4xl font-semibold">{value}</p>
      {hint && <p className={accent ? "mt-1 text-xs opacity-80" : "mt-1 text-xs text-muted-foreground"}>{hint}</p>}
    </div>
  );
}
