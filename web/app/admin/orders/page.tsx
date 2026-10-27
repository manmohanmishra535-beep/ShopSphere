import Link from "next/link";
import { Search, ShoppingCart } from "lucide-react";
import { getAdminOrders } from "@/lib/api";
import { formatDate, formatINR } from "@/lib/format";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge, PaymentBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/shop/pagination";
import { cn } from "@/lib/format";

export const metadata = { title: "Orders" };

const tabs = [
  { key: "all", label: "All", count: "all" as const },
  { key: "to-pack", label: "To pack", count: "toPack" as const },
  { key: "shipped", label: "Shipped", count: "shipped" as const },
  { key: "delivered", label: "Delivered", count: "delivered" as const },
  { key: "cancelled", label: "Cancelled", count: "cancelled" as const },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = tabs.some((tab) => tab.key === params.status) ? params.status! : "all";
  const q = (params.q ?? "").trim();
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const orders = await getAdminOrders({ status, q, page, limit: 12 });

  const hrefFor = (nextPage: number) => {
    const search = new URLSearchParams();
    if (status !== "all") search.set("status", status);
    if (q) search.set("q", q);
    if (nextPage > 1) search.set("page", String(nextPage));
    const query = search.toString();
    return `/admin/orders${query ? `?${query}` : ""}`;
  };

  return (
    <div>
      <PageHeader
        eyebrow="Store"
        title="Orders"
        description="Every order, from payment to delivery. Open an order to pack it, add tracking or refund."
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 overflow-x-auto border-b border-border pb-px">
          {tabs.map((tab) => {
            const active = tab.key === status;
            return (
              <Link
                key={tab.key}
                href={`/admin/orders${tab.key === "all" ? "" : `?status=${tab.key}`}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] font-medium transition-colors",
                  active ? "border-primary text-primary" : "border-transparent text-muted hover:text-text"
                )}
              >
                {tab.label}
                <span className={cn("text-[11px]", active ? "text-primary/70" : "text-muted/70")}>{orders.counts[tab.count]}</span>
              </Link>
            );
          })}
        </div>

        <form action="/admin/orders" className="flex items-center gap-2">
          {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
          <label htmlFor="order-search" className="sr-only">Search orders</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              id="order-search"
              name="q"
              defaultValue={q}
              placeholder="Order, customer, SKU…"
              className="h-9 w-full rounded-lg border border-border bg-bg pl-8 pr-3 text-[13px] placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 sm:w-64"
            />
          </div>
          <button type="submit" className="h-9 rounded-lg border border-border bg-bg px-3 text-[13px] font-medium transition-colors hover:bg-surface">
            Search
          </button>
        </form>
      </div>

      {orders.data.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={<ShoppingCart className="h-5 w-5" />}
          title={q ? "No matching orders" : "No orders in this view"}
          description={q ? `Nothing matched “${q}”. Try an order number, customer name or SKU.` : "Orders will appear here as customers check out."}
        />
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-bg">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] border-collapse text-left">
              <thead>
                <tr className="border-b border-border bg-surface/60 text-[10px] uppercase tracking-[0.1em] text-muted">
                  <th className="px-4 py-2.5 font-semibold">Order</th>
                  <th className="px-4 py-2.5 font-semibold">Customer</th>
                  <th className="px-4 py-2.5 font-semibold">Items</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Total</th>
                  <th className="px-4 py-2.5 font-semibold">Payment</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.data.map((order) => (
                  <tr key={order.id} className="group transition-colors hover:bg-primary-subtle/25">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order.id}`} className="text-[13px] font-semibold group-hover:text-primary">
                        {order.orderNumber}
                      </Link>
                      <p className="text-[11px] text-muted">{order.deliveryMethod === "express" ? "Express" : "Standard"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium">{order.customer?.name ?? "—"}</p>
                      <p className="text-[11px] text-muted">{order.customer?.email ?? ""}</p>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-muted">{order.itemCount}</td>
                    <td className="price-num px-4 py-3 text-right text-[13px] font-semibold">{formatINR(order.total)}</td>
                    <td className="px-4 py-3"><PaymentBadge status={order.payment.status} /></td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3 text-right text-[12px] text-muted">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="mt-4 text-xs text-muted">Showing {orders.data.length} of {orders.total} orders</p>
        <Pagination page={orders.page} pages={orders.pages} hrefFor={hrefFor} />
      </div>
    </div>
  );
}
