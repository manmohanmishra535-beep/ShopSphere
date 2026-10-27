import { Star } from "lucide-react";
import { cn } from "@/lib/format";

export function RatingStars({
  value,
  count,
  size = "sm",
  className,
  showValue = false,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
  showValue?: boolean;
}) {
  const px = size === "sm" ? 13 : 16;
  const percent = Math.max(0, Math.min(100, (value / 5) * 100));

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} aria-label={`Rated ${value} out of 5`}>
      <span className="relative inline-flex" aria-hidden>
        <span className="flex text-border">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} style={{ width: px, height: px }} strokeWidth={1.5} />
          ))}
        </span>
        <span className="absolute inset-0 flex overflow-hidden text-amber-500 dark:text-amber-400" style={{ width: `${percent}%` }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} style={{ width: px, height: px, flexShrink: 0 }} fill="currentColor" strokeWidth={0} />
          ))}
        </span>
      </span>
      {showValue ? <span className="text-xs font-medium text-text">{value.toFixed(1)}</span> : null}
      {typeof count === "number" ? (
        <span className="text-xs text-muted tabular-nums">({count.toLocaleString("en-IN")})</span>
      ) : null}
    </span>
  );
}

export function StarInput({
  value,
  onChange,
  size = 28,
}: {
  value: number;
  onChange: (value: number) => void;
  size?: number;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
          onClick={() => onChange(star)}
          className="rounded p-0.5 transition-transform hover:scale-110"
        >
          <Star
            style={{ width: size, height: size }}
            strokeWidth={1.5}
            className={star <= value ? "fill-amber-500 text-amber-500" : "text-border"}
          />
        </button>
      ))}
    </div>
  );
}
