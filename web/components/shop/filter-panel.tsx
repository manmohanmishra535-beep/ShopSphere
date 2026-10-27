"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, X } from "lucide-react";
import type { Category, ProductListResponse } from "@/lib/types";
import { cn, formatINR } from "@/lib/format";

interface Props {
  categories: Category[];
  brands: { value: string; count: number }[];
  applied: ProductListResponse["appliedFilters"];
  priceRange: { min: number; max: number };
  onNavigate?: () => void;
}

export function FilterPanel({ categories, brands, applied, priceRange, onNavigate }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [minPrice, setMinPrice] = useState(applied.minPrice ? String(applied.minPrice) : "");
  const [maxPrice, setMaxPrice] = useState(applied.maxPrice ? String(applied.maxPrice) : "");
  const [brandSearch, setBrandSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setMinPrice(applied.minPrice ? String(applied.minPrice) : "");
    setMaxPrice(applied.maxPrice ? String(applied.maxPrice) : "");
  }, [applied.minPrice, applied.maxPrice]);

  const push = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page");
    router.push(`/products?${params.toString()}`, { scroll: false });
    onNavigate?.();
  };

  const setParam = (key: string, value: string | null) => {
    push((params) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
  };

  const toggleBrand = (brand: string) => {
    const next = applied.brands.includes(brand)
      ? applied.brands.filter((b) => b !== brand)
      : [...applied.brands, brand];
    push((params) => {
      if (next.length) params.set("brand", next.join(","));
      else params.delete("brand");
    });
  };

  const applyPrice = () => {
    push((params) => {
      if (minPrice) params.set("minPrice", minPrice);
      else params.delete("minPrice");
      if (maxPrice) params.set("maxPrice", maxPrice);
      else params.delete("maxPrice");
    });
  };

  const activeParent = categories.find(
    (category) =>
      category.slug === applied.category ||
      category.children?.some((child) => child.slug === applied.category)
  );

  const visibleBrands = brands.filter((brand) =>
    brand.value.toLowerCase().includes(brandSearch.toLowerCase())
  );

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Filters</h2>
        <button
          type="button"
          onClick={() => router.push("/products")}
          className="text-[11px] font-medium text-muted underline-offset-2 hover:text-text hover:underline"
        >
          Clear all
        </button>
      </div>

      <section>
        <h3 className="mb-2.5 text-[13px] font-semibold">Category</h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => setParam("category", null)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-surface",
                !applied.category ? "font-medium text-primary" : "text-muted"
              )}
            >
              All products
              {!applied.category ? <Check className="h-3.5 w-3.5" /> : null}
            </button>
          </li>
          {categories.map((category) => {
            const isActive = applied.category === category.slug;
            const hasChildren = Boolean(category.children?.length);
            const open = expanded === category.id || activeParent?.id === category.id;
            return (
              <li key={category.id}>
                <div className="flex items-center">
                  <button
                    onClick={() => setParam("category", category.slug)}
                    className={cn(
                      "flex flex-1 items-center justify-between rounded-md px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-surface",
                      isActive ? "font-medium text-primary" : "text-muted"
                    )}
                  >
                    {category.name}
                    {isActive ? <Check className="h-3.5 w-3.5" /> : null}
                  </button>
                  {hasChildren ? (
                    <button
                      onClick={() => setExpanded(open ? null : category.id)}
                      className="grid h-7 w-7 place-items-center rounded text-muted hover:bg-surface"
                      aria-label={`${open ? "Collapse" : "Expand"} ${category.name}`}
                    >
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
                    </button>
                  ) : null}
                </div>
                {hasChildren && open ? (
                  <ul className="mb-1 ml-2 space-y-0.5 border-l border-border pl-2">
                    {category.children!.map((child) => (
                      <li key={child.id}>
                        <button
                          onClick={() => setParam("category", child.slug)}
                          className={cn(
                            "flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs transition-colors hover:bg-surface",
                            applied.category === child.slug ? "font-medium text-primary" : "text-muted"
                          )}
                        >
                          {child.name}
                          {applied.category === child.slug ? <Check className="h-3 w-3" /> : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="border-t border-border pt-6">
        <h3 className="mb-3 text-[13px] font-semibold">Price</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && applyPrice()}
            placeholder={`${Math.round(priceRange.min / 100)}`}
            aria-label="Minimum price in rupees"
            className="h-9 w-full min-w-0 rounded-md border border-border bg-bg px-2.5 text-xs tabular-nums focus:border-primary focus:outline-none"
          />
          <span className="text-xs text-muted">to</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && applyPrice()}
            placeholder={`${Math.round(priceRange.max / 100)}`}
            aria-label="Maximum price in rupees"
            className="h-9 w-full min-w-0 rounded-md border border-border bg-bg px-2.5 text-xs tabular-nums focus:border-primary focus:outline-none"
          />
        </div>
        <button
          onClick={applyPrice}
          className="mt-2.5 w-full rounded-md border border-border py-1.5 text-xs font-medium text-text transition-colors hover:border-primary hover:text-primary"
        >
          Apply price
        </button>
        <p className="mt-1.5 text-[11px] text-muted">
          Range {formatINR(priceRange.min)} – {formatINR(priceRange.max)}
        </p>
      </section>

      <section className="border-t border-border pt-6">
        <h3 className="mb-2.5 text-[13px] font-semibold">Rating</h3>
        <div className="space-y-1">
          {[4, 3].map((rating) => (
            <button
              key={rating}
              onClick={() => setParam("rating", applied.rating === rating ? null : String(rating))}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors hover:bg-surface",
                applied.rating === rating ? "font-medium text-primary" : "text-muted"
              )}
            >
              <span className={cn("grid h-3.5 w-3.5 place-items-center rounded-full border", applied.rating === rating ? "border-primary" : "border-border")}>
                {applied.rating === rating ? <span className="h-1.5 w-1.5 rounded-full bg-primary" /> : null}
              </span>
              {rating} stars &amp; up
            </button>
          ))}
        </div>
      </section>

      <section className="border-t border-border pt-6">
        <h3 className="mb-2.5 text-[13px] font-semibold">Brand</h3>
        {brands.length > 6 ? (
          <input
            value={brandSearch}
            onChange={(event) => setBrandSearch(event.target.value)}
            placeholder="Find a brand"
            className="mb-2 h-8 w-full rounded-md border border-border bg-bg px-2.5 text-xs focus:border-primary focus:outline-none"
            aria-label="Search brands"
          />
        ) : null}
        <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
          {visibleBrands.map((brand) => (
            <label key={brand.value} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-[13px] text-muted hover:bg-surface">
              <input
                type="checkbox"
                checked={applied.brands.includes(brand.value)}
                onChange={() => toggleBrand(brand.value)}
                className="h-3.5 w-3.5 rounded-sm border-border accent-[var(--primary)]"
              />
              <span className="flex-1">{brand.value}</span>
              <span className="text-[10px] text-muted/70">{brand.count}</span>
            </label>
          ))}
          {visibleBrands.length === 0 ? <p className="px-2 text-xs text-muted">No brands match.</p> : null}
        </div>
      </section>

      <section className="border-t border-border pt-6">
        <h3 className="mb-2.5 text-[13px] font-semibold">Availability</h3>
        <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-[13px] text-muted">
          <input
            type="checkbox"
            checked={applied.inStock}
            onChange={(event) => setParam("inStock", event.target.checked ? "true" : null)}
            className="h-3.5 w-3.5 rounded-sm border-border accent-[var(--primary)]"
          />
          In stock only
        </label>
      </section>
    </div>
  );
}

export function FilterSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[65] md:hidden" role="dialog" aria-modal="true" aria-label="Filters">
      <div className="absolute inset-0 animate-fade-in bg-slate-950/45 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] animate-sheet overflow-y-auto rounded-t-2xl border border-border bg-bg shadow-[var(--shadow-modal)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg/95 px-4 py-3 backdrop-blur">
          <h2 className="text-sm font-semibold">Filters</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface" aria-label="Close filters">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 py-5">{children}</div>
        <div className="sticky bottom-0 border-t border-border bg-bg/95 p-4 backdrop-blur">
          <button onClick={onClose} className="h-11 w-full rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary-hover">
            Show results
          </button>
        </div>
      </div>
    </div>
  );
}
