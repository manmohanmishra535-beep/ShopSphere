import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Package, ShoppingBag } from "lucide-react";
import { getOrders } from "@/lib/api";
import { formatDate, formatINR, plural } from "@/lib/format";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Pagination } from "@/components/shop/pagination";
import { OrderCardActions } from "@/components/account/order-card-actions";

export const metadata: Metadata = {
  title: "Your orders",
  description: "Track, review and manage your ShopSphere orders.",
};

const tabs = [
  { key: "all", label: "All orders", countKey: "all" as const },
  { key: "to-pack", label: "To pack", countKey: "toPack" as const },
  { key: "shipped", label: "Shipped", countKey: "shipped" as const },
  { key: "delivered", label: "Delivered", countKey: "delivered" as const },
  { key: "cancelled", label: "Cancelled", countKey: "cancelled" as const },
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = tabs.some((tab) => tab.key === params.status) ? params.status! : "all";
  const page = Math.max(1, Number(params.page ?? 1) || 1);
  const result = await getOrders({ status, page, limit: 6 });

  const hrefFor = (nextPage: number) => {
    const search = new URLSearchParams();
    if (status !== "all") search.set("status", status);
    if (nextPage > 1) search.set("page", String(nextPage));
    const query = search.toString();
    return `/account/orders${query ? `?${query}` : ""}`;
  };

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Your account</p>
          <h1 className="mt-1.5 text-[26px] font-semibold tracking-[-0.03em]">Orders</h1>
          <p className="mt-1 text-sm text-muted">
            {result.total > 0 ? `${plural(result.total, "order")} placed with ShopSphere` : "Everything you order lives here."}
          </p>
        </div>
        <Link href="/products" className={buttonStyles("outline", "sm")}>
          <ShoppingBag className="h-4 w-4" /> Shop again
        </Link>
      </header>

      <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border pb-px">
        {tabs.map((tab) => {
          const active = tab.key === status;
          const count = result.counts[tab.countKey];
          return (
            <Link
              key={tab.key}
              href={tab.key === "all" ? "/account/orders" : `/account/orders?status=${tab.key}`}
              aria-current={active ? "page" : undefined}
              className={
                active
                  ? "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 border-primary px-3 py-2.5 text-[13px] font-semibold text-primary"
                  : "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-3 py-2.5 text-[13px] font-medium text-muted transition-colors hover:text-text"
              }
            >
              {tab.label}
              <span className={active ? "text-[11px] text-primary/70" : "text-[11px] text-muted/70"}>{count}</span>
            </Link>
          );
        })}
      </div>

      {result.data.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<Package className="h-5 w-5" />}
          title={status === "all" ? "No orders yet" : "No orders here"}
          description={
            status === "all"
              ? "When you place your first order, you'll be able to track it right here."
              : "Try another tab — your orders may be in a different stage."
          }
          action={
            <Link href="/products" className={buttonStyles("primary")}>
              Start shopping
            </Link>
          }
        />
      ) : (
        <div className="mt-6 space-y-4">
          {result.data.map((order) => (
            <article key={order.id} className="overflow-hidden rounded-xl border border-border bg-bg">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/60 px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <p className="text-[13px] font-semibold text-text">{order.orderNumber}</p>
                  <p className="text-xs text-muted">Placed {formatDate(order.createdAt)}</p>
                  <p className="text-xs text-muted">·</p>
                  <p className="text-xs text-muted">{formatINR(order.total)}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="px-4 py-4">
                <ul className="space-y-3">
                  {order.items.slice(0, 3).map((item) => (
                    <li key={`${item.productId}-${item.sku}`} className="flex items-center gap-3">
                      <Link
                        href={`/products/${item.slug}`}
                        className="h-14 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-surface"
                      >
                        <img src={item.image} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link href={`/products/${item.slug}`} className="line-clamp-1 text-[13px] font-medium text-text hover:text-primary">
                          {item.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-muted">
                          {Object.values(item.options).filter(Boolean).join(" · ") || "Standard"} · Qty {item.qty}
                        </p>
                      </div>
                      <p className="price-num hidden text-[13px] font-medium sm:block">{formatINR(item.price * item.qty)}</p>
                    </li>
                  ))}
                </ul>
                {order.items.length > 3 ? (
                  <p className="mt-3 text-xs text-muted">+ {order.items.length - 3} more item{order.items.length - 3 === 1 ? "" : "s"}</p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
                <OrderCardActions order={order} />
                <Link
                  href={`/account/orders/${order.id}`}
                  className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
                >
                  View details <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <Pagination page={result.page} pages={result.pages} hrefFor={hrefFor} />
    </div>
  );
}
