import Link from "next/link";
import { AlertTriangle, Boxes, PackageX, Search } from "lucide-react";
import { getInventory } from "@/lib/api";
import { PageHeader } from "@/components/admin/page-header";
import { InventoryTable } from "@/components/admin/inventory-table";
import { cn } from "@/lib/format";

export const metadata = { title: "Inventory" };

const filters = [
  { key: "all", label: "All variants" },
  { key: "low", label: "Low stock" },
  { key: "out", label: "Out of stock" },
];

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const params = await searchParams;
  const filter = filters.some((item) => item.key === params.filter) ? params.filter! : "all";
  const q = (params.q ?? "").trim();
  const result = await getInventory(filter, q);

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="Inventory"
        description="Stock is reserved when an order is placed and released if payment expires. Adjustments are audited."
      />

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total variants", value: result.counts.all, icon: Boxes, tone: "text-text" },
          { label: "Low stock", value: result.counts.low, icon: AlertTriangle, tone: "text-warning" },
          { label: "Out of stock", value: result.counts.out, icon: PackageX, tone: "text-danger" },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-border bg-bg p-4">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface text-muted">
              <stat.icon className="h-4 w-4" />
            </span>
            <div>
              <p className="price-num text-xl font-semibold">{stat.value}</p>
              <p className="text-[11px] text-muted">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto border-b border-border pb-px">
          {filters.map((item) => {
            const active = item.key === filter;
            const count = item.key === "all" ? result.counts.all : item.key === "low" ? result.counts.low : result.counts.out;
            return (
              <Link
                key={item.key}
                href={`/admin/inventory${item.key === "all" ? "" : `?filter=${item.key}`}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] font-medium transition-colors",
                  active ? "border-primary text-primary" : "border-transparent text-muted hover:text-text"
                )}
              >
                {item.label}
                <span className={cn("text-[11px]", active ? "text-primary/70" : "text-muted/70")}>{count}</span>
              </Link>
            );
          })}
        </div>

        <form action="/admin/inventory" className="flex items-center gap-2">
          {filter !== "all" ? <input type="hidden" name="filter" value={filter} /> : null}
          <label htmlFor="inventory-search" className="sr-only">Search inventory</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              id="inventory-search"
              name="q"
              defaultValue={q}
              placeholder="SKU or product…"
              className="h-9 w-full rounded-lg border border-border bg-bg pl-8 pr-3 text-[13px] placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 sm:w-56"
            />
          </div>
          <button type="submit" className="h-9 rounded-lg border border-border bg-bg px-3 text-[13px] font-medium transition-colors hover:bg-surface">
            Search
          </button>
        </form>
      </div>

      <InventoryTable initial={result.data} />
    </div>
  );
}
