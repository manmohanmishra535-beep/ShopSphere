"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { api, errorMessage } from "@/lib/client";
import type { Product } from "@/lib/types";
import { useCartStore } from "@/stores/cart";
import { toast } from "@/components/ui/toast";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { RatingStars } from "@/components/ui/rating";
import { WishlistButton } from "./wishlist-button";
import { cn } from "@/lib/format";

export interface ProductCardData {
  id: string;
  title: string;
  slug: string;
  brand: string;
  price: number;
  compareAtPrice: number | null;
  discountPercent: number;
  image: string;
  hoverImage: string;
  ratingAvg: number;
  ratingCount: number;
  availableStock: number;
  inStock: boolean;
  badge: "new" | "sale" | "bestseller" | null;
  colors?: { name: string; hex: string }[];
}

export function ProductCard({
  product,
  className,
  onWishlistToggle,
}: {
  product: ProductCardData;
  className?: string;
  onWishlistToggle?: (active: boolean) => void;
}) {
  const add = useCartStore((state) => state.add);
  const [adding, setAdding] = useState(false);
  const colours = product.colors ?? [];
  const visibleColours = colours.slice(0, 3);

  const quickAdd = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setAdding(true);
    try {
      const data = await api<{ product: Product }>(`/products/${product.slug}`);
      const variant = data.product.variants.find((v) => v.available > 0);
      if (!variant) {
        toast.error("Out of stock", "This product is currently unavailable.");
        return;
      }
      await add(product.id, variant.sku, 1);
    } catch (error) {
      toast.error("Could not add to cart", errorMessage(error));
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-[0_1px_2px_rgb(16_24_40/0.04)] transition-[box-shadow,border-color] duration-300 group-hover:border-border group-hover:shadow-[0_18px_38px_-24px_rgb(16_24_40/0.35)]">
          <Link href={`/products/${product.slug}`} className="absolute inset-0 block" aria-label={product.title}>
            <img
              src={product.image}
              alt={product.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.035] group-hover:opacity-0"
            />
            <img
              src={product.hoverImage}
              alt=""
              aria-hidden
              loading="lazy"
              className="absolute inset-0 h-full w-full scale-[1.035] object-cover opacity-0 transition duration-700 ease-out group-hover:scale-100 group-hover:opacity-100"
            />
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          </Link>

          <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
            {product.badge === "sale" ? (
              <Badge tone="sale" className="border-transparent bg-sale text-white shadow-sm">−{product.discountPercent}%</Badge>
            ) : null}
            {product.badge === "new" ? <Badge tone="primary" className="shadow-sm">New in</Badge> : null}
            {product.badge === "bestseller" ? <Badge tone="neutral" className="bg-bg/90 shadow-sm backdrop-blur">Bestseller</Badge> : null}
          </div>

          <div className="absolute right-2.5 top-2.5 z-10">
            <WishlistButton productId={product.id} floating onToggle={onWishlistToggle} />
          </div>

          {!product.inStock ? (
            <div className="absolute inset-x-0 bottom-0 bg-bg/90 px-3 py-2.5 text-center text-xs font-medium text-muted backdrop-blur">
              Out of stock
            </div>
          ) : (
            <div className="absolute inset-x-2.5 bottom-2.5 translate-y-0 opacity-100 transition-all duration-200 md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100">
              <button
                type="button"
                onClick={quickAdd}
                disabled={adding}
                className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-bg/95 text-xs font-semibold text-text shadow-[0_8px_24px_-12px_rgb(16_24_40/0.35)] backdrop-blur transition-colors hover:border-primary hover:bg-primary hover:text-white disabled:opacity-70"
              >
                {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {adding ? "Adding…" : "Quick add"}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-0.5 pt-3.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{product.brand}</p>
        <h3 className="mt-1.5 line-clamp-2 text-[14px] font-medium leading-5 tracking-[-0.01em] text-text">
          <Link href={`/products/${product.slug}`} className="transition-colors hover:text-primary">
            {product.title}
          </Link>
        </h3>
        <div className="mt-1.5 flex items-center gap-1.5">
          <RatingStars value={product.ratingAvg} count={product.ratingCount} />
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-2.5">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} />
          {visibleColours.length > 0 ? (
            <span className="flex shrink-0 items-center gap-1" aria-label={`${colours.length} colours`}>
              {visibleColours.map((colour) => (
                <span
                  key={colour.name}
                  className="h-3.5 w-3.5 rounded-full border border-black/10 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.35)] dark:border-white/20"
                  style={{ backgroundColor: colour.hex }}
                  title={colour.name}
                />
              ))}
              {colours.length > visibleColours.length ? (
                <span className="text-[10px] font-medium text-muted">+{colours.length - visibleColours.length}</span>
              ) : null}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ProductCardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="skeleton aspect-[4/5] w-full rounded-2xl" />
          <div className="skeleton h-3 w-14" />
          <div className="skeleton h-4 w-4/5" />
          <div className="skeleton h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
