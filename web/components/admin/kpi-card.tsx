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
  const toneClass = {
    primary: "bg-primary-subtle text-primary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    info: "bg-info/10 text-info",
  }[tone];

  return (
    <div className="rounded-xl border border-border bg-bg p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">{label}</p>
        <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", toneClass)}>{icon}</span>
      </div>
      <p className="price-num mt-3 text-[26px] font-semibold tracking-[-0.03em]">{value}</p>
      <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
        {typeof change === "number" ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded px-1 py-0.5 font-semibold",
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
