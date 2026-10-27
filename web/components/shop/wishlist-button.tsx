"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/format";
import { useWishlistStore } from "@/stores/wishlist";

export function WishlistButton({
  productId,
  className,
  size = "md",
  floating = false,
  onToggle,
}: {
  productId: string;
  className?: string;
  size?: "sm" | "md";
  floating?: boolean;
  onToggle?: (active: boolean) => void;
}) {
  const ids = useWishlistStore((state) => state.ids);
  const toggle = useWishlistStore((state) => state.toggle);
  const active = ids.includes(productId);
  const Icon = Heart;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle?.(!active);
        void toggle(productId);
      }}
      aria-label={active ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={active}
      className={cn(
        "grid place-items-center rounded-full transition-all duration-200",
        size === "md" ? "h-10 w-10" : "h-8 w-8",
        floating
          ? "border border-border/70 bg-bg/85 text-muted shadow-sm backdrop-blur hover:text-sale"
          : "text-muted hover:bg-surface hover:text-sale",
        active && "text-sale",
        className
      )}
    >
      <Icon
        className={cn(size === "md" ? "h-[18px] w-[18px]" : "h-4 w-4", active && "fill-current")}
        strokeWidth={1.6}
      />
    </button>
  );
}
