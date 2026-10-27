"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, Lock, ShoppingBag, Trash2, X } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { formatINR } from "@/lib/format";
import { buttonStyles } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";

const FREE_SHIPPING = 99900;

export function CartDrawer() {
  const { items, count, subtotal, drawerOpen, closeDrawer, setQty, remove } = useCartStore();

  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  const remaining = Math.max(0, FREE_SHIPPING - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING) * 100);

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <div className="absolute inset-0 animate-fade-in bg-slate-950/45 backdrop-blur-[2px]" onClick={closeDrawer} aria-hidden />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md animate-drawer flex-col border-l border-border bg-bg shadow-[var(--shadow-modal)]">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.7} />
            <h2 className="text-base font-semibold">Your bag <span className="text-muted">({count})</span></h2>
          </div>
          <button
            onClick={closeDrawer}
            className="rounded-md p-1.5 text-muted transition-colors hover:bg-surface hover:text-text"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-surface">
              <ShoppingBag className="h-7 w-7 text-muted" strokeWidth={1.4} />
            </div>
            <h3 className="text-lg font-semibold">Your bag is empty</h3>
            <p className="mt-1.5 text-sm text-muted">A few good things are waiting to be found.</p>
            <Link href="/products" onClick={closeDrawer} className={buttonStyles("primary", "md", "mt-6 w-full max-w-[220px]")}>
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="border-b border-border px-5 py-3">
              {remaining > 0 ? (
                <p className="text-xs text-muted">
                  You&apos;re <span className="font-semibold text-text">{formatINR(remaining)}</span> away from free shipping
                </p>
              ) : (
                <p className="text-xs font-medium text-success">Free shipping unlocked</p>
              )}
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5">
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li key={item.sku} className="flex gap-3.5 py-4">
                    <Link href={`/products/${item.slug}`} onClick={closeDrawer} className="shrink-0">
                      <img src={item.image} alt={item.title} className="h-[104px] w-[84px] rounded-lg bg-surface object-cover" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/products/${item.slug}`} onClick={closeDrawer} className="line-clamp-2 text-[13px] font-medium leading-5 hover:text-primary">
                            {item.title}
                          </Link>
                          <p className="mt-0.5 text-[11px] text-muted">
                            {[item.options.colour, item.options.size].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <button
                          onClick={() => void remove(item.sku)}
                          className="-m-1 rounded p-1 text-muted transition-colors hover:text-danger"
                          aria-label={`Remove ${item.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {item.lowStock ? <p className="mt-1 text-[11px] font-medium text-warning">Only {item.available} left</p> : null}
                      <div className="mt-auto flex items-end justify-between pt-2">
                        <QuantityStepper
                          size="sm"
                          value={item.qty}
                          max={item.available}
                          onChange={(qty) => void setQty(item.sku, qty)}
                        />
                        <span className="price-num text-sm font-semibold">{formatINR(item.lineTotal)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <footer className="border-t border-border bg-surface/60 px-5 py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted">Subtotal</span>
                <span className="price-num text-lg font-semibold">{formatINR(subtotal)}</span>
              </div>
              <p className="mt-1 text-[11px] text-muted">Shipping and taxes calculated at checkout.</p>
              <div className="mt-4 grid gap-2">
                <Link href="/checkout" onClick={closeDrawer} className={buttonStyles("primary", "lg", "w-full")}>
                  Checkout <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/cart" onClick={closeDrawer} className={buttonStyles("outline", "md", "w-full")}>
                  View cart
                </Link>
              </div>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted">
                <Lock className="h-3 w-3" /> Secure checkout · UPI, cards & netbanking
              </p>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
