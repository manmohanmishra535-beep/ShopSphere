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
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-surface">
        <Link href={`/products/${product.slug}`} className="absolute inset-0 block" aria-label={product.title}>
          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.03] group-hover:opacity-0"
          />
          <img
            src={product.hoverImage}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 h-full w-full scale-[1.03] object-cover opacity-0 transition duration-700 ease-out group-hover:scale-100 group-hover:opacity-100"
          />
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.badge === "sale" ? (
            <Badge tone="sale" className="border-transparent bg-sale text-white">−{product.discountPercent}%</Badge>
          ) : null}
          {product.badge === "new" ? <Badge tone="primary">New in</Badge> : null}
          {product.badge === "bestseller" ? <Badge tone="neutral" className="bg-bg/90 backdrop-blur">Bestseller</Badge> : null}
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
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border/70 bg-bg/95 text-xs font-medium text-text shadow-sm backdrop-blur transition-colors hover:bg-primary hover:text-white disabled:opacity-70"
            >
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {adding ? "Adding…" : "Quick add"}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col pt-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted">{product.brand}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-5 text-text">
          <Link href={`/products/${product.slug}`} className="transition-colors hover:text-primary">
            {product.title}
          </Link>
        </h3>
        <div className="mt-1.5">
          <RatingStars value={product.ratingAvg} count={product.ratingCount} />
        </div>
        <div className="mt-auto pt-2">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} showDiscount />
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
          <div className="skeleton aspect-[4/5] w-full rounded-xl" />
          <div className="skeleton h-3 w-14" />
          <div className="skeleton h-4 w-4/5" />
          <div className="skeleton h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
