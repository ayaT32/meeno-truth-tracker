import { cn } from "@/lib/utils";
import { useI18n, type TKey } from "@/lib/i18n";

const styles: Record<string, string> = {
  true: "bg-verdict-true/15 text-verdict-true ring-verdict-true/30",
  false: "bg-verdict-false/15 text-verdict-false ring-verdict-false/30",
  misleading: "bg-verdict-misleading/15 text-verdict-misleading ring-verdict-misleading/30",
  partly_true: "bg-verdict-partly/20 text-accent-foreground ring-verdict-partly/40",
  unverifiable: "bg-verdict-unverifiable/15 text-muted-foreground ring-verdict-unverifiable/30",
};

export function VerdictBadge({ verdict, className }: { verdict?: string | null; className?: string }) {
  const { t } = useI18n();
  const v = verdict && styles[verdict] ? verdict : "unverifiable";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1", styles[v], className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {t(`v.${v}` as TKey)}
    </span>
  );
}

export const verdictColor: Record<string, string> = {
  true: "var(--verdict-true)",
  false: "var(--verdict-false)",
  misleading: "var(--verdict-misleading)",
  partly_true: "var(--verdict-partly)",
  unverifiable: "var(--verdict-unverifiable)",
};
