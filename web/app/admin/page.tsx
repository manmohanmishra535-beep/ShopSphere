import Link from "next/link";
import {
  ArrowUpRight,
  Boxes,
  IndianRupee,
  Package,
  ShoppingCart,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { getAdminStats } from "@/lib/api";
import { formatINR, formatINRCompact, formatNumber, timeAgo } from "@/lib/format";
import { PageHeader } from "@/components/admin/page-header";
import { KpiCard } from "@/components/admin/kpi-card";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { StatusBadge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/format";

export const metadata = { title: { absolute: "Overview · ShopSphere Admin" } };

const ranges = [7, 30, 90];

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const days = ranges.includes(Number(params.days)) ? Number(params.days) : 30;
  const stats = await getAdminStats(days);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  if (!stats) {
    return (
      <div>
        <PageHeader title="Overview" description="Live store performance at a glance." />
        <div className="mt-6 rounded-xl border border-danger/25 bg-danger/5 p-6">
          <p className="text-sm font-semibold">Could not load dashboard data</p>
          <p className="mt-1 text-xs text-muted">Check that the API is running on port 4000, then refresh.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title={`${greeting}, Admin`}
        description={`Performance for the last ${days} days. Figures update as orders are paid and fulfilled.`}
        actions={
          <>
            <div className="flex rounded-lg border border-border bg-bg p-0.5">
              {ranges.map((range) => (
                <Link
                  key={range}
                  href={range === 30 ? "/admin" : `/admin?days=${range}`}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    days === range ? "bg-primary text-white" : "text-muted hover:text-text"
                  )}
                  aria-current={days === range ? "page" : undefined}
                >
                  {range}d
                </Link>
              ))}
            </div>
            <Link href="/" className={buttonStyles("outline", "sm")}>
              View storefront <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Revenue"
          value={formatINRCompact(stats.kpis.revenue.value)}
          change={stats.kpis.revenue.change}
          icon={<IndianRupee className="h-4 w-4" />}
          tone="primary"
        />
        <KpiCard
          label="Orders"
          value={formatNumber(stats.kpis.orders.value)}
          change={stats.kpis.orders.change}
          icon={<ShoppingCart className="h-4 w-4" />}
          tone="info"
        />
        <KpiCard
          label="Avg. order value"
          value={formatINR(stats.kpis.aov.value)}
          change={stats.kpis.aov.change}
          icon={<TrendingUp className="h-4 w-4" />}
          tone="success"
        />
        <KpiCard
          label="New customers"
          value={formatNumber(stats.kpis.newCustomers.value)}
          change={stats.kpis.newCustomers.change}
          icon={<Users className="h-4 w-4" />}
          tone="warning"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section className="rounded-xl border border-border bg-bg p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Revenue trend</h2>
              <p className="text-xs text-muted">Paid, packed, shipped and delivered orders</p>
            </div>
          </div>
          <RevenueChart data={stats.revenueByDay} />
        </section>

        <section className="rounded-xl border border-border bg-bg p-4 sm:p-5">
          <h2 className="text-sm font-semibold">Needs attention</h2>
          <p className="text-xs text-muted">Small tasks that keep the store moving</p>
          <div className="mt-4 space-y-2">
            {[
              { label: "Orders to pack", value: stats.counts.toPack, href: "/admin/orders?status=to-pack", tone: "text-warning" },
              { label: "Reviews awaiting moderation", value: stats.counts.pendingReviews, href: "/admin/reviews?status=pending", tone: "text-info" },
              { label: "Low stock variants", value: stats.counts.lowStock, href: "/admin/inventory?filter=low", tone: "text-warning" },
              { label: "Out of stock variants", value: stats.counts.outOfStock, href: "/admin/inventory?filter=out", tone: "text-danger" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-surface"
              >
                <span className="text-[13px] text-text">{item.label}</span>
                <span className={cn("price-num text-sm font-semibold", item.value === 0 ? "text-muted" : item.tone)}>{item.value}</span>
              </Link>
            ))}
          </div>

          {stats.lowStock.length > 0 ? (
            <div className="mt-5 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted">Lowest stock</h3>
                <Link href="/admin/inventory" className="text-[11px] font-medium text-primary hover:underline">Manage</Link>
              </div>
              <ul className="mt-2.5 space-y-2">
                {stats.lowStock.slice(0, 4).map((item) => (
                  <li key={item.sku} className="flex items-center gap-2.5">
                    <img src={item.image} alt="" className="h-8 w-7 rounded border border-border object-cover" loading="lazy" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{item.title}</p>
                      <p className="text-[10px] text-muted">{item.sku}</p>
                    </div>
                    <span className={cn("price-num text-xs font-semibold", item.out ? "text-danger" : "text-warning")}>
                      {item.out ? "Out" : `${item.available} left`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="overflow-hidden rounded-xl border border-border bg-bg">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Top products</h2>
              <p className="text-[11px] text-muted">By units sold in this period</p>
            </div>
            <Link href="/admin/products" className="text-[11px] font-medium text-primary hover:underline">All products</Link>
          </header>
          {stats.topProducts.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">No sales in this period yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.topProducts.map((product, index) => (
                <li key={product.productId} className="flex items-center gap-3 px-4 py-3">
                  <span className="price-num w-4 text-[11px] font-semibold text-muted">{index + 1}</span>
                  <img src={product.image} alt="" className="h-10 w-8 rounded border border-border object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${product.slug}`} className="line-clamp-1 text-[13px] font-medium hover:text-primary">
                      {product.title}
                    </Link>
                    <p className="text-[11px] text-muted">{product.units} units</p>
                  </div>
                  <span className="price-num text-[13px] font-semibold">{formatINR(product.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-bg">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold">Latest orders</h2>
              <p className="text-[11px] text-muted">Most recent activity across the store</p>
            </div>
            <Link href="/admin/orders" className="text-[11px] font-medium text-primary hover:underline">View all</Link>
          </header>
          {stats.latestOrders.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {stats.latestOrders.map((order) => (
                <li key={order.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/orders/${order.id}`} className="text-[13px] font-semibold hover:text-primary">
                      {order.orderNumber}
                    </Link>
                    <p className="truncate text-[11px] text-muted">
                      {order.customerName} · {timeAgo(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="price-num text-[13px] font-semibold">{formatINR(order.total)}</p>
                    <div className="mt-0.5 flex justify-end"><StatusBadge status={order.status} /></div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { href: "/admin/orders?status=to-pack", icon: Package, label: "Pack new orders", value: `${stats.counts.toPack} waiting` },
          { href: "/admin/inventory", icon: Boxes, label: "Review inventory", value: `${stats.counts.lowStock} low · ${stats.counts.outOfStock} out` },
          { href: "/admin/reviews?status=pending", icon: Star, label: "Moderate reviews", value: `${stats.counts.pendingReviews} pending` },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 rounded-xl border border-border bg-bg p-4 transition-colors hover:border-primary/40 hover:bg-primary-subtle/30"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-subtle text-primary">
              <action.icon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[13px] font-medium">{action.label}</p>
              <p className="text-[11px] text-muted">{action.value}</p>
            </div>
            <ArrowUpRight className="ml-auto h-4 w-4 text-muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}
