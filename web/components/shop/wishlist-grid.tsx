"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { ProductCard } from "@/lib/types";
import { ProductCard as ShopProductCard } from "@/components/shop/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonStyles } from "@/components/ui/button";

export function WishlistGrid({ products }: { products: ProductCard[] }) {
  const [removed, setRemoved] = useState<string[]>([]);
  const visible = products.filter((product) => !removed.includes(product.id));

  if (visible.length === 0) {
    return (
      <EmptyState
        className="mt-8"
        icon={<Heart className="h-5 w-5" />}
        title="Your wishlist is empty"
        description="Tap the heart on anything you love and it will wait for you here."
        action={
          <Link href="/products" className={buttonStyles("primary")}>
            Browse the collection
          </Link>
        }
      />
    );
  }

  return (
    <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {visible.map((product) => (
        <ShopProductCard
          key={product.id}
          product={product}
          onWishlistToggle={(active) => {
            if (!active) setRemoved((current) => [...current, product.id]);
          }}
        />
      ))}
    </div>
  );
}
