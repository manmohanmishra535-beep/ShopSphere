"use client";

import { useMemo, useState } from "react";
import { Bell, Check, Minus, Plus, ShoppingBag, Truck } from "lucide-react";
import type { Product } from "@/lib/types";
import { useCartStore } from "@/stores/cart";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { WishlistButton } from "./wishlist-button";
import { formatINR } from "@/lib/format";

const COLOURS: Record<string, string> = {
  navy: "#1E2A4A",
  rose: "#D6A0A8",
  olive: "#6B7048",
  white: "#F6F5F0",
  sand: "#D8C3A5",
  sky: "#A9C4DE",
  indigo: "#2F4266",
  "washed black": "#3A3A3A",
  natural: "#E4DAC8",
  charcoal: "#3B4046",
  oat: "#D9CBB6",
  rust: "#A65A3A",
  forest: "#2F4A3C",
  bone: "#E8DFD0",
  tan: "#B47A4C",
  black: "#171717",
  graphite: "#3B3F46",
  ivory: "#F1EAD9",
  speckle: "#C9BFAE",
  chalk: "#EFECE4",
  amber: "#B9743B",
  pearl: "#EFE9E1",
  sage: "#A8B3A1",
  stone: "#CFC5B6",
  ecru: "#EFE7D8",
  ink: "#1B2430",
  butter: "#EACF8C",
  fern: "#5F7350",
  denim: "#3F5675",
  plum: "#5B3A52",
  slate: "#4C5A66",
  clay: "#B56E4E",
  fig: "#6B3A45",
  rosewood: "#8C4B4B",
  bare: "#D4A59A",
};

export function AddToCart({ product }: { product: Product }) {
  const add = useCartStore((state) => state.add);
  const openDrawer = useCartStore((state) => state.openDrawer);

  const optionKeys = useMemo(() => {
    const keys = new Set<string>();
    product.variants.forEach((variant) => Object.keys(variant.options).forEach((key) => keys.add(key)));
    return [...keys];
  }, [product.variants]);

  const initial =
    product.variants.find((variant) => variant.available > 0) ?? product.variants[0];

  const [selected, setSelected] = useState<Record<string, string>>(initial?.options ?? {});
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  const variant = product.variants.find((candidate) =>
    optionKeys.every((key) => candidate.options[key] === selected[key])
  );

  const available = variant?.available ?? 0;
  const maxQty = Math.max(1, available);

  const isOptionAvailable = (key: string, value: string) =>
    product.variants.some(
      (candidate) =>
        candidate.options[key] === value &&
        candidate.available > 0 &&
        optionKeys.every((other) => other === key || candidate.options[other] === selected[other])
    );

  const choose = (key: string, value: string) => {
    const next = { ...selected, [key]: value };
    const exists = product.variants.find(
      (candidate) => optionKeys.every((k) => candidate.options[k] === next[k])
    );
    if (!exists) {
      // Pick a size that is available in the new colour, if the current one is not.
      const fallback = product.variants.find(
        (candidate) => candidate.options[key] === value && candidate.available > 0
      );
      if (fallback) setSelected(fallback.options);
      else setSelected(next);
    } else {
      setSelected(next);
    }
    setQty(1);
  };

  const addToCart = async (open = true) => {
    if (!variant || available === 0) {
      toast.info("We'll let you know", "This option is out of stock. Back-in-stock alerts are coming soon.");
      return;
    }
    setAdding(true);
    const ok = await add(product.id, variant.sku, qty, { openDrawer: open });
    setAdding(false);
    if (ok) setQty(1);
  };

  const price = variant?.price ?? product.price;

  return (
    <>
      <div id="buy-panel" className="space-y-6">
        {optionKeys.map((key) => {
          const values = [...new Set(product.variants.map((v) => v.options[key]).filter(Boolean))];
          const isColour = key.toLowerCase().includes("colour") || key.toLowerCase().includes("color");
          return (
            <div key={key}>
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-[13px] font-medium capitalize">
                  {key}: <span className="font-normal text-muted">{selected[key]}</span>
                </span>
                {key.toLowerCase().includes("size") ? (
                  <a href="/info/size-guide" className="text-[11px] text-muted underline-offset-2 hover:text-text hover:underline">
                    Size guide
                  </a>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {values.map((value) => {
                  const active = selected[key] === value;
                  const enabled = isOptionAvailable(key, value);
                  if (isColour) {
                    return (
                      <button
                        key={value}
                        onClick={() => choose(key, value)}
                        aria-label={`${value}${enabled ? "" : " (out of stock)"}`}
                        aria-pressed={active}
                        className={`group flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 text-[12px] transition-all ${
                          active ? "border-primary bg-primary-subtle text-text" : "border-border text-muted hover:border-muted"
                        } ${!enabled ? "opacity-45" : ""}`}
                      >
                        <span
                          className="h-5 w-5 rounded-full border border-black/10 shadow-inner"
                          style={{ background: COLOURS[value.toLowerCase()] ?? "#cbd5e1" }}
                        />
                        {value}
                      </button>
                    );
                  }
                  return (
                    <button
                      key={value}
                      onClick={() => choose(key, value)}
                      disabled={!enabled && !active}
                      aria-pressed={active}
                      title={enabled ? undefined : "Out of stock in this option"}
                      className={`min-w-11 rounded-md border px-2.5 py-2 text-[12px] font-medium transition-all ${
                        active
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-bg text-text hover:border-primary disabled:cursor-not-allowed disabled:text-muted/40 disabled:line-through disabled:hover:border-border"
                      }`}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[13px] font-medium">Quantity</span>
            <span className={`text-[11px] font-medium ${available === 0 ? "text-danger" : available <= 5 ? "text-warning" : "text-success"}`}>
              {available === 0 ? "Out of stock" : available <= 5 ? `Only ${available} left` : "In stock"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <QuantityStepper value={qty} onChange={setQty} min={1} max={maxQty} disabled={available === 0} size="lg" />
            <span className="text-[11px] text-muted">{variant?.sku}</span>
          </div>
        </div>

        <div className="flex gap-2">
          {available === 0 ? (
            <Button
              size="lg"
              variant="secondary"
              className="flex-1"
              onClick={() => toast.info("We'll let you know", "Back-in-stock notifications are coming soon.")}
            >
              <Bell className="h-4 w-4" /> Notify me
            </Button>
          ) : (
            <Button size="lg" className="flex-1" onClick={() => void addToCart(true)} loading={adding}>
              <ShoppingBag className="h-4 w-4" /> Add to cart · {formatINR(price * qty)}
            </Button>
          )}
          <WishlistButton
            productId={product.id}
            className="h-12 w-12 rounded-lg border border-border"
          />
        </div>

        <div className="grid gap-2 rounded-lg border border-border bg-surface/50 p-3.5 text-[11px] text-muted">
          <p className="flex items-center gap-2"><Truck className="h-3.5 w-3.5 text-primary" /> Free delivery over ₹999 · Dispatched in 24 hours</p>
          <p className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-success" /> 7-day easy returns · Cash on delivery available</p>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] text-muted">
              {optionKeys.map((key) => selected[key]).filter(Boolean).join(" · ")}
            </p>
            <p className="price-num text-[15px] font-semibold">
              {formatINR(price)}
              {product.compareAtPrice ? (
                <span className="ml-1.5 text-xs font-normal text-muted line-through">{formatINR(product.compareAtPrice)}</span>
              ) : null}
            </p>
          </div>
          <Button size="md" className="shrink-0" onClick={() => void addToCart(false)} loading={adding} disabled={available === 0}>
            {available === 0 ? "Out of stock" : "Add to cart"}
          </Button>
        </div>
      </div>
    </>
  );
}

export function MiniQuantity({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="inline-flex items-center rounded-md border border-border">
      <button onClick={() => onChange(Math.max(1, value - 1))} className="p-1.5 text-muted disabled:opacity-40" disabled={value <= 1} aria-label="Decrease">
        <Minus className="h-3 w-3" />
      </button>
      <span className="w-6 text-center text-xs tabular-nums">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} className="p-1.5 text-muted disabled:opacity-40" disabled={value >= max} aria-label="Increase">
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

