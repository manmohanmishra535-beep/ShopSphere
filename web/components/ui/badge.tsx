import type { ReactNode } from "react";
import { cn } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "sale" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-surface text-muted border-border",
  primary: "bg-primary-subtle text-primary border-primary/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  sale: "bg-sale/10 text-sale border-sale/20",
  info: "bg-info/10 text-info border-info/20",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  dot = false,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        tones[tone],
        className
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}

const statusTone: Record<OrderStatus, Tone> = {
  pending: "warning",
  paid: "primary",
  packed: "warning",
  shipped: "info",
  delivered: "success",
  cancelled: "danger",
};

const statusLabel: Record<OrderStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  packed: "To pack",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return (
    <Badge tone={statusTone[status] ?? "neutral"} dot className={className}>
      {statusLabel[status] ?? status}
    </Badge>
  );
}

export function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, { tone: Tone; label: string }> = {
    paid: { tone: "success", label: "Paid" },
    created: { tone: "warning", label: "Awaiting" },
    pending: { tone: "warning", label: "Pending" },
    failed: { tone: "danger", label: "Failed" },
    refunded: { tone: "neutral", label: "Refunded" },
  };
  const item = map[status] ?? { tone: "neutral" as Tone, label: status };
  return <Badge tone={item.tone}>{item.label}</Badge>;
}
