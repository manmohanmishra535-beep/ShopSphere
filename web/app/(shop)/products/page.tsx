import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, SlidersHorizontal, X } from "lucide-react";
import { getCategories, getProducts } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import { ProductCard } from "@/components/shop/product-card";
import { FilterPanel } from "@/components/shop/filter-panel";
import { MobileFilter } from "@/components/shop/mobile-filter";
import { SortSelect } from "@/components/shop/sort-select";
import { Pagination } from "@/components/shop/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonStyles } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const category = typeof sp.category === "string" ? sp.category : undefined;
  const title = q ? `Search: ${q}` : category ? `${category[0].toUpperCase()}${category.slice(1)}` : "All products";
  return {
    title,
    description: "Browse considered clothing, homeware and everyday essentials from ShopSphere.",
  };
}

const LIMIT = 12;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = first(sp.q)?.trim();
  const category = first(sp.category);
  const minPrice = first(sp.minPrice);
  const maxPrice = first(sp.maxPrice);
  const rating = first(sp.rating);
  const brand = first(sp.brand);
  const inStock = first(sp.inStock) === "true";
  const sort = first(sp.sort) ?? "popular";
  const page = Math.max(1, Number(first(sp.page) ?? 1));

  const [listing, categories] = await Promise.all([
    getProducts({
      q,
      category,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      rating: rating ? Number(rating) : undefined,
      brand,
      inStock,
      sort,
      page,
      limit: LIMIT,
    }),
    getCategories(),
  ]);

  const heading = listing.category?.name
    ? listing.category.name
    : q
      ? `Results for “${q}”`
      : "All products";

  const breadcrumbParent = listing.category?.parentId
    ? categories.find((c) => c.id === listing.category?.parentId)
    : null;

  const baseParams = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    const v = first(value);
    if (v !== undefined) baseParams.set(key, v);
  }

  const hrefWith = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(baseParams.toString());
    mutate(params);
    params.delete("page");
    const query = params.toString();
    return `/products${query ? `?${query}` : ""}`;
  };

  const chips: { label: string; href: string }[] = [];
  if (q) chips.push({ label: `“${q}”`, href: hrefWith((p) => p.delete("q")) });
  if (listing.category) {
    chips.push({ label: listing.category.name, href: hrefWith((p) => p.delete("category")) });
  }
  if (minPrice) chips.push({ label: `From ₹${formatNumber(Number(minPrice))}`, href: hrefWith((p) => p.delete("minPrice")) });
  if (maxPrice) chips.push({ label: `Up to ₹${formatNumber(Number(maxPrice))}`, href: hrefWith((p) => p.delete("maxPrice")) });
  if (rating) chips.push({ label: `${rating}★ & up`, href: hrefWith((p) => p.delete("rating")) });
  for (const value of listing.appliedFilters.brands) {
    chips.push({
      label: value,
      href: hrefWith((p) => {
        const remaining = listing.appliedFilters.brands.filter((b) => b !== value);
        if (remaining.length) p.set("brand", remaining.join(","));
        else p.delete("brand");
      }),
    });
  }
  if (inStock) chips.push({ label: "In stock", href: hrefWith((p) => p.delete("inStock")) });

  const pageHref = (target: number) => {
    const params = new URLSearchParams(baseParams.toString());
    if (target > 1) params.set("page", String(target));
    else params.delete("page");
    const query = params.toString();
    return `/products${query ? `?${query}` : ""}`;
  };

  const filters = {
    categories,
    brands: listing.facets.brands,
    applied: listing.appliedFilters,
    priceRange: {
      min: listing.facets.price.min || 0,
      max: listing.facets.price.max || 500000,
    },
  };

  return (
    <div className="container-shop py-6 md:py-9">
      <nav className="flex flex-wrap items-center gap-1 text-[11px] text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-text">Home</Link>
        <ChevronRight className="h-3 w-3" />
        {breadcrumbParent ? (
          <>
            <Link href={`/products?category=${breadcrumbParent.slug}`} className="hover:text-text">{breadcrumbParent.name}</Link>
            <ChevronRight className="h-3 w-3" />
          </>
        ) : null}
        <span className="text-text">{listing.category?.name ?? (q ? "Search" : "All products")}</span>
      </nav>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.03em] md:text-[32px]">{heading}</h1>
          <p className="mt-1.5 text-[13px] text-muted">
            {formatNumber(listing.total)} {listing.total === 1 ? "piece" : "pieces"}
            {q ? ` matching your search` : " to browse"}
          </p>
        </div>
        {listing.siblings.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {listing.siblings.map((sibling) => (
              <Link
                key={sibling.slug}
                href={`/products?category=${sibling.slug}`}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  sibling.slug === listing.category?.slug
                    ? "border-primary bg-primary-subtle text-primary"
                    : "border-border text-muted hover:border-primary hover:text-primary"
                }`}
              >
                {sibling.name}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-7 grid gap-8 lg:grid-cols-[224px_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden md:block">
          <div className="sticky top-[104px] max-h-[calc(100vh-124px)] overflow-y-auto pb-6 pr-1">
            <FilterPanel {...filters} />
          </div>
        </aside>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div className="flex items-center gap-2 md:hidden">
              <MobileFilter {...filters} />
              <SortSelect value={sort} />
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted md:hidden" />
              <p className="text-[12px] text-muted">
                Showing <span className="font-medium text-text">{listing.data.length}</span> of {formatNumber(listing.total)}
              </p>
            </div>
            <div className="hidden md:block">
              <SortSelect value={sort} />
            </div>
          </div>

          {chips.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 pt-4">
              <span className="text-[11px] text-muted">Active:</span>
              {chips.map((chip) => (
                <Link
                  key={chip.label}
                  href={chip.href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface py-1 pl-2.5 pr-1.5 text-[11px] font-medium text-text transition-colors hover:border-danger/40 hover:text-danger"
                >
                  {chip.label}
                  <X className="h-3 w-3" />
                </Link>
              ))}
              <Link href="/products" className="ml-1 text-[11px] font-medium text-muted underline-offset-2 hover:text-text hover:underline">
                Clear all
              </Link>
            </div>
          ) : null}

          {listing.data.length === 0 ? (
            <div className="pt-8">
              <EmptyState
                title="Nothing matched those filters"
                description="Try widening your price range, removing a filter, or searching for something else."
                action={
                  <div className="flex gap-2">
                    <Link href="/products" className={buttonStyles("outline")}>Clear filters</Link>
                    {q ? <Link href={`/products?q=${encodeURIComponent(q)}`} className={buttonStyles("primary")}>Keep search</Link> : null}
                  </div>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-9 pt-6 md:grid-cols-3 xl:grid-cols-4 xl:gap-x-5">
              {listing.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <Pagination page={listing.page} pages={listing.pages} hrefFor={pageHref} />
        </div>
      </div>

      <div className="mt-14 rounded-xl border border-border bg-surface/50 px-5 py-4 text-[12px] text-muted">
        <p>
          Filters and sorting stay in the URL, so you can share exactly what you see. Every price is in INR and
          inclusive of taxes.
        </p>
      </div>
    </div>
  );
}
