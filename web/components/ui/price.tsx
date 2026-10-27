import { cn, formatINR } from "@/lib/format";

export function Price({
  price,
  compareAtPrice,
  size = "md",
  className,
  showDiscount = false,
}: {
  price: number;
  compareAtPrice?: number | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showDiscount?: boolean;
}) {
  const onSale = Boolean(compareAtPrice && compareAtPrice > price);
  const discount = onSale ? Math.round(((compareAtPrice! - price) / compareAtPrice!) * 100) : 0;

  const sizes = {
    sm: "text-sm",
    md: "text-[15px]",
    lg: "text-lg",
    xl: "text-[28px] leading-8",
  };

  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span className={cn("price-num font-semibold", sizes[size], onSale ? "text-sale" : "text-text")}>
        {formatINR(price)}
      </span>
      {onSale ? (
        <span className={cn("price-num text-muted line-through", size === "xl" ? "text-base" : "text-[13px]")}>
          {formatINR(compareAtPrice!)}
        </span>
      ) : null}
      {onSale && showDiscount ? (
        <span className="rounded bg-sale/10 px-1.5 py-0.5 text-[11px] font-semibold text-sale">
          −{discount}%
        </span>
      ) : null}
    </span>
  );
}
