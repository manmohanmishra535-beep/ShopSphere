"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div className="relative inline-flex items-center">
      <label htmlFor="sort" className="mr-2 hidden text-[13px] text-muted sm:inline">Sort by</label>
      <select
        id="sort"
        value={value}
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("sort", event.target.value);
          params.delete("page");
          router.push(`/products?${params.toString()}`, { scroll: false });
        }}
        className="h-9 appearance-none rounded-lg border border-border bg-bg pl-3 pr-8 text-[13px] font-medium text-text focus:border-primary focus:outline-none"
      >
        <option value="popular">Popular</option>
        <option value="newest">Newest</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
        <option value="rating">Top rated</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-muted" />
    </div>
  );
}
