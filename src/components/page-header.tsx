import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, actions }: { eyebrow?: string | undefined; title: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b-2 border-gold pb-6">
      <div>
        {eyebrow && (
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold-ink">
            <span className="h-3 w-1 rounded-full bg-gold" />
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl text-ink md:text-4xl">{title}</h1>
      </div>
      {actions}
    </div>
  );
}

export function StatCard({ label, value, hint, accent }: { label: string; value: ReactNode; hint?: string; accent?: boolean }) {
  return (
    <div className={accent ? "rounded-xl bg-gold-gradient p-5 text-gold-foreground shadow-lg" : "sheet border-t-4 border-primary p-5"}>
      <p className={accent ? "text-sm font-medium opacity-85" : "text-sm text-muted-foreground"}>{label}</p>
      <p className="mt-2 font-display text-4xl font-bold">{value}</p>
      {hint && <p className={accent ? "mt-1 text-xs opacity-75" : "mt-1 text-xs text-muted-foreground"}>{hint}</p>}
    </div>
  );
}
