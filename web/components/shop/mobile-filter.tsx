"use client";

import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { Category, ProductListResponse } from "@/lib/types";
import { FilterPanel, FilterSheet } from "./filter-panel";

export function MobileFilter(props: {
  categories: Category[];
  brands: { value: string; count: number }[];
  applied: ProductListResponse["appliedFilters"];
  priceRange: { min: number; max: number };
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-[13px] font-medium text-text hover:bg-surface md:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" /> Filters
      </button>
      <FilterSheet open={open} onClose={() => setOpen(false)}>
        <FilterPanel {...props} />
      </FilterSheet>
    </>
  );
}
