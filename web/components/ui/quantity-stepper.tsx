"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/format";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  disabled,
  label = "Quantity",
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  label?: string;
}) {
  const heights = { sm: "h-8", md: "h-10", lg: "h-12" };
  const widths = { sm: "w-7", md: "w-9", lg: "w-11" };
  return (
    <div
      className={cn(
        "inline-flex items-center overflow-hidden rounded-lg border border-border bg-bg",
        heights[size],
        disabled && "opacity-50"
      )}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        className={cn("grid h-full place-items-center text-muted transition-colors hover:bg-surface hover:text-text disabled:opacity-40", widths[size])}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className={cn("grid h-full place-items-center border-x border-border text-sm font-medium tabular-nums", widths[size])} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        className={cn("grid h-full place-items-center text-muted transition-colors hover:bg-surface hover:text-text disabled:opacity-40", widths[size])}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
