import Link from "next/link";
import { ExternalLink, Plus, Search } from "lucide-react";
import { getAdminProducts } from "@/lib/api";
import { formatDate, formatINR } from "@/lib/format";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonStyles } from "@/components/ui/button";
import { ArchiveProductButton } from "@/components/admin/archive-product-button";
import { cn } from "@/lib/format";

export const metadata = { title: "Products" };

const tabs = [
  { key: "all", label: "All", count: "all" as const },
  { key: "active", label: "Active", count: "active" as const },
  { key: "draft", label: "Drafts", count: "draft" as const },
  { key: "archived", label: "Archived", count: "archived" as const },
];

const tone = { active: "success", draft: "warning", archived: "neutral" } as const;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const status = tabs.some((tab) => tab.key === params.status) ? params.status! : "all";
  const q = (params.q ?? "").trim();
  const result = await getAdminProducts(q, status);

  return (
    <div>
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        description="Create, edit and retire products. Stock is managed per variant under Inventory."
        actions={
          <Link href="/admin/products/new" className={buttonStyles("primary", "sm")}>
            <Plus className="h-4 w-4" /> New product
          </Link>
        }
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto border-b border-border pb-px">
          {tabs.map((tab) => {
            const active = tab.key === status;
            return (
              <Link
                key={tab.key}
                href={`/admin/products${tab.key === "all" ? "" : `?status=${tab.key}`}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] font-medium transition-colors",
                  active ? "border-primary text-primary" : "border-transparent text-muted hover:text-text"
                )}
              >
                {tab.label}
                <span className={cn("text-[11px]", active ? "text-primary/70" : "text-muted/70")}>{result.counts[tab.count]}</span>
              </Link>
            );
          })}
        </div>

        <form action="/admin/products" className="flex items-center gap-2">
          {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
          <label htmlFor="product-search" className="sr-only">Search products</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              id="product-search"
              name="q"
              defaultValue={q}
              placeholder="Title, brand, SKU…"
              className="h-9 w-full rounded-lg border border-border bg-bg pl-8 pr-3 text-[13px] placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 sm:w-64"
            />
          </div>
          <button type="submit" className="h-9 rounded-lg border border-border bg-bg px-3 text-[13px] font-medium transition-colors hover:bg-surface">
            Search
          </button>
        </form>
      </div>

      {result.data.length === 0 ? (
        <EmptyState
          className="mt-6"
          title={q ? "No matching products" : "No products here"}
          description={q ? `Nothing matched “${q}”.` : "Create your first product to start selling."}
          action={<Link href="/admin/products/new" className={buttonStyles("primary")}>New product</Link>}
        />
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-bg">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-surface/60 text-[10px] uppercase tracking-[0.1em] text-muted">
                  <th className="px-4 py-2.5 font-semibold">Product</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 font-semibold">Category</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Price</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Stock</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Updated</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.data.map((product) => (
                  <tr key={product.id} className="transition-colors hover:bg-primary-subtle/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={product.images[0]?.url} alt="" className="h-11 w-9 rounded border border-border object-cover" loading="lazy" />
                        <div className="min-w-0">
                          <Link href={`/admin/products/${product.id}`} className="line-clamp-1 text-[13px] font-medium hover:text-primary">
                            {product.title}
                          </Link>
                          <p className="text-[11px] text-muted">{product.brand} · {product.variants.length} variant{product.variants.length === 1 ? "" : "s"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge tone={tone[product.status]}>{product.status}</Badge></td>
                    <td className="px-4 py-3 text-[12px] text-muted">{product.category?.name ?? "—"}</td>
                    <td className="price-num px-4 py-3 text-right text-[13px] font-medium">{formatINR(product.price)}</td>
                    <td className="px-4 py-3 text-right">
                      <p className={cn("price-num text-[13px] font-semibold", product.availableStock === 0 ? "text-danger" : product.availableStock <= 5 ? "text-warning" : "text-text")}>
                        {product.availableStock}
                      </p>
                      <p className="text-[10px] text-muted">{product.onHand} on hand · {product.reserved} reserved</p>
                    </td>
                    <td className="px-4 py-3 text-right text-[12px] text-muted">{formatDate(product.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/products/${product.slug}`} target="_blank" className={buttonStyles("ghost", "sm")} title="View in store">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        <Link href={`/admin/products/${product.id}`} className={buttonStyles("outline", "sm")}>Edit</Link>
                        {product.status !== "archived" ? <ArchiveProductButton id={product.id} title={product.title} /> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-muted">Showing {result.data.length} of {result.counts.all} products</p>
    </div>
  );
}
