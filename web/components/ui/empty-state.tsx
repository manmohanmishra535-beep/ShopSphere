import type { ReactNode } from "react";
import { PackageOpen } from "lucide-react";
import { cn } from "@/lib/format";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center", className)}>
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-bg text-muted shadow-sm">
        {icon ?? <PackageOpen className="h-5 w-5" />}
      </div>
      <h3 className="text-base font-semibold text-text">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
