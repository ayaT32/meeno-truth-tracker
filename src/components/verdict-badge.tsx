import { cn } from "@/lib/utils";
import { useI18n, type TKey } from "@/lib/i18n";

const styles: Record<string, string> = {
  true: "bg-verdict-true text-primary-foreground ring-verdict-true",
  false: "bg-verdict-false text-primary-foreground ring-verdict-false",
  misleading: "bg-verdict-misleading text-primary-foreground ring-verdict-misleading",
  partly_true: "bg-verdict-partly text-gold-foreground ring-verdict-partly",
  unverifiable: "bg-verdict-unverifiable text-primary-foreground ring-verdict-unverifiable",
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
