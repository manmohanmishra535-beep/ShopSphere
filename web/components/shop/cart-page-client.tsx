"use client";

import Link from "next/link";
import { ChevronRight, Heart, Lock, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { formatINR } from "@/lib/format";
import { Button, buttonStyles } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";

const FREE_SHIPPING = 99900;

export function CartPageClient() {
  const { items, count, subtotal, initialized, setQty, remove } = useCartStore();
  const signedIn = useWishlistStore((state) => state.signedIn);
  const toggleWishlist = useWishlistStore((state) => state.toggle);

  if (!initialized) {
    return (
      <div className="container-shop py-10">
        <Skeleton className="h-8 w-56" />
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
          </div>
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-shop py-14 md:py-20">
        <div className="mx-auto max-w-lg">
          <EmptyState
            icon={<ShoppingBag className="h-5 w-5" />}
            title="Your cart is empty"
            description="There is a whole shop out there. Start with the new arrivals or the pieces everyone is loving."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/products?sort=newest"><span className={buttonStyles("primary")}>Shop new arrivals</span></Link>
                <Link href="/products?sort=popular"><span className={buttonStyles("outline")}>Best sellers</span></Link>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  const remaining = Math.max(0, FREE_SHIPPING - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING) * 100);
  const shipping = remaining > 0 ? 4900 : 0;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping;

  const saveForLater = async (productId: string, sku: string, title: string) => {
    if (!signedIn) {
      toast.info("Sign in to save favourites", "Create an account to keep a wishlist.");
      return;
    }
    await toggleWishlist(productId);
    await remove(sku);
    toast.success("Saved for later", `${title} is in your wishlist.`);
  };

  return (
    <div className="container-shop py-8 md:py-10">
      <nav className="flex items-center gap-1 text-[11px] text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-text">Cart</span>
      </nav>

      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-semibold tracking-[-0.03em] md:text-[32px]">Shopping cart</h1>
          <p className="mt-1 text-[13px] text-muted">{count} {count === 1 ? "item" : "items"} · Prices include all taxes</p>
        </div>
        <Link href="/products" className="text-[13px] font-medium text-muted hover:text-text">Continue shopping</Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
        <div>
          <div className="rounded-xl border border-border">
            {remaining > 0 ? (
              <div className="border-b border-border px-4 py-3">
                <p className="flex items-center gap-2 text-xs text-muted">
                  <Truck className="h-4 w-4 text-primary" />
                  Add <span className="font-semibold text-text">{formatINR(remaining)}</span> more for free shipping
                </p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            ) : (
              <p className="flex items-center gap-2 border-b border-border px-4 py-3 text-xs font-medium text-success">
                <Truck className="h-4 w-4" /> Free shipping unlocked
              </p>
            )}

            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.sku} className="flex gap-4 p-4">
                  <Link href={`/products/${item.slug}`} className="shrink-0">
                    <img src={item.image} alt={item.title} className="h-[112px] w-[90px] rounded-lg bg-surface object-cover md:h-[136px] md:w-[108px]" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{item.brand}</p>
                        <Link href={`/products/${item.slug}`} className="mt-0.5 block text-[13px] font-medium leading-5 hover:text-primary md:text-sm">
                          {item.title}
                        </Link>
                        <p className="mt-1 text-[11px] text-muted">{[item.options.colour, item.options.size].filter(Boolean).join(" · ")}</p>
                        <p className={`mt-1 text-[11px] font-medium ${item.lowStock ? "text-warning" : "text-success"}`}>
                          {item.available === 0 ? "Out of stock" : item.lowStock ? `Only ${item.available} left` : "In stock"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="price-num text-sm font-semibold">{formatINR(item.lineTotal)}</p>
                        {item.compareAtPrice ? (
                          <p className="price-num text-[11px] text-muted line-through">{formatINR(item.compareAtPrice * item.qty)}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-3">
                      <QuantityStepper
                        size="sm"
                        value={item.qty}
                        max={item.available}
                        onChange={(qty) => void setQty(item.sku, qty)}
                      />
                      <button
                        onClick={() => void remove(item.sku)}
                        className="inline-flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-danger"
                      >
                        <Trash2 className="h-3 w-3" /> Remove
                      </button>
                      <button
                        onClick={() => void saveForLater(item.productId, item.sku, item.title)}
                        className="inline-flex items-center gap-1 text-[11px] text-muted transition-colors hover:text-sale"
                      >
                        <Heart className="h-3 w-3" /> Save for later
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded-xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium">Have a coupon?</p>
                <p className="text-[11px] text-muted">Coupons and offers are launching soon.</p>
              </div>
              <div className="flex gap-2">
                <input
                  disabled
                  placeholder="Enter code"
                  aria-label="Coupon code (not yet available)"
                  className="h-9 w-32 rounded-md border border-border bg-surface px-2.5 text-xs text-muted placeholder:text-muted"
                />
                <Button variant="outline" size="sm" disabled>Apply</Button>
              </div>
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-[104px] lg:self-start">
          <div className="rounded-xl border border-border bg-surface/50 p-5">
            <h2 className="text-sm font-semibold">Order summary</h2>
            <dl className="mt-4 space-y-2.5 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="price-num font-medium">{formatINR(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Shipping</dt>
                <dd className={`price-num font-medium ${shipping === 0 ? "text-success" : ""}`}>
                  {shipping === 0 ? "Free" : formatINR(shipping)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Tax (included)</dt>
                <dd className="price-num text-muted">{formatINR(tax)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-border pt-3">
                <dt className="text-sm font-semibold">Total</dt>
                <dd className="price-num text-xl font-bold">{formatINR(total)}</dd>
              </div>
            </dl>
            <Link href="/checkout" className={buttonStyles("primary", "lg", "mt-5 w-full")}>
              Proceed to checkout <ChevronRight className="h-4 w-4" />
            </Link>
            <Link href="/products" className={buttonStyles("ghost", "md", "mt-2 w-full")}>
              Continue shopping
            </Link>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-muted">
              <Lock className="h-3 w-3" /> Secure checkout · UPI, cards, netbanking & COD
            </p>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-[11px] text-muted">
            <Truck className="h-4 w-4 shrink-0 text-success" />
            Free 7-day returns. No questions, no shipping fee.
          </div>
        </aside>
      </div>
    </div>
  );
}
