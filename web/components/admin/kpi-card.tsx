import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/format";

export function KpiCard({
  label,
  value,
  change,
  hint,
  icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  change?: number;
  hint?: string;
  icon: ReactNode;
  tone?: "primary" | "success" | "warning" | "info";
}) {
  const positive = (change ?? 0) > 0;
  const negative = (change ?? 0) < 0;
  const Trend = positive ? ArrowUpRight : negative ? ArrowDownRight : Minus;
  const tones = {
    primary: {
      icon: "bg-primary-subtle text-primary",
      glow: "bg-primary/10",
      rule: "from-primary/70",
    },
    success: {
      icon: "bg-success/10 text-success",
      glow: "bg-success/10",
      rule: "from-success/70",
    },
    warning: {
      icon: "bg-warning/10 text-warning",
      glow: "bg-warning/10",
      rule: "from-warning/70",
    },
    info: {
      icon: "bg-info/10 text-info",
      glow: "bg-info/10",
      rule: "from-info/70",
    },
  }[tone];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-bg p-5 shadow-[var(--shadow-card)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-pop)]">
      <div aria-hidden className={cn("absolute -right-9 -top-12 h-28 w-28 rounded-full blur-2xl", tones.glow)} />
      <span aria-hidden className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-r to-transparent", tones.rule)} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
          <p className="price-num mt-4 text-[28px] font-semibold leading-none tracking-[-0.04em]">{value}</p>
        </div>
        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", tones.icon)}>{icon}</span>
      </div>
      <div className="relative mt-4 flex items-center gap-1.5 text-[11px]">
        {typeof change === "number" ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold tabular-nums",
              positive && "bg-success/10 text-success",
              negative && "bg-danger/10 text-danger",
              !positive && !negative && "bg-surface text-muted"
            )}
          >
            <Trend className="h-3 w-3" />
            {Math.abs(change)}%
          </span>
        ) : null}
        <span className="text-muted">{hint ?? "vs previous period"}</span>
      </div>
    </div>
  );
}
