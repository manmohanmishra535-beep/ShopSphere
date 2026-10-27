import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Copy, FileText, Mail, MapPin, Phone, Truck } from "lucide-react";
import { getOrder } from "@/lib/api";
import { formatDate, formatDateTime, formatINR } from "@/lib/format";
import { StatusBadge, PaymentBadge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { AdminOrderActions } from "@/components/admin/admin-order-actions";
import { cn } from "@/lib/format";

export const metadata = { title: "Order detail" };

const flow = ["paid", "packed", "shipped", "delivered"] as const;
const rank: Record<string, number> = { pending: 0, paid: 1, packed: 2, shipped: 3, delivered: 4, cancelled: 5 };

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const currentRank = rank[order.status] ?? 0;

  return (
    <div>
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-text">
        <ArrowLeft className="h-3.5 w-3.5" /> All orders
      </Link>

      <div className="mt-4">
        <PageHeader
          eyebrow="Order detail"
          title={order.orderNumber}
          description={`Placed ${formatDate(order.createdAt, "long")} · ${order.itemCount} item${order.itemCount === 1 ? "" : "s"}`}
          actions={
            <>
              <Link href={`/account/orders/${order.id}/invoice`} className={buttonStyles("outline", "sm")}>
                <FileText className="h-4 w-4" /> Invoice
              </Link>
            </>
          }
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge status={order.status} />
        <span className="rounded-md border border-border bg-bg px-2 py-0.5 text-[11px] text-muted capitalize">
          {order.payment.method?.replace(/_/g, " ") ?? order.payment.provider}
        </span>
        {order.tracking ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-info/25 bg-info/5 px-2 py-0.5 text-[11px] text-info">
            <Truck className="h-3 w-3" /> {order.tracking.carrier} · {order.tracking.awb}
          </span>
        ) : null}
      </div>

      {order.status !== "cancelled" ? (
        <div className="mt-5 rounded-xl border border-border bg-bg p-4">
          <div className="grid grid-cols-4 gap-2">
            {flow.map((step, index) => {
              const done = currentRank >= rank[step];
              return (
                <div key={step} className="relative">
                  {index > 0 ? (
                    <span
                      aria-hidden
                      className={cn("absolute right-[calc(50%+14px)] top-3 h-0.5 w-[calc(100%-44px)]", done ? "bg-primary" : "bg-border")}
                    />
                  ) : null}
                  <div className="relative z-10 flex flex-col items-center gap-1.5 text-center">
                    <span
                      className={cn(
                        "grid h-6 w-6 place-items-center rounded-full border-2 text-[10px] font-bold",
                        done ? "border-primary bg-primary text-white" : "border-border bg-bg text-muted"
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className={cn("text-[11px] font-medium capitalize", done ? "text-text" : "text-muted")}>{step}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className="overflow-hidden rounded-xl border border-border bg-bg">
            <header className="flex items-center justify-between border-b border-border bg-surface/60 px-4 py-3">
              <h2 className="text-sm font-semibold">Items</h2>
              <span className="text-xs text-muted">{order.itemCount} units</span>
            </header>
            <ul className="divide-y divide-border">
              {order.items.map((item) => (
                <li key={`${item.productId}-${item.sku}`} className="flex items-center gap-3 px-4 py-3">
                  <img src={item.image} alt="" className="h-14 w-11 rounded border border-border object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${item.slug}`} className="line-clamp-1 text-[13px] font-medium hover:text-primary">
                      {item.title}
                    </Link>
                    <p className="text-[11px] text-muted">
                      {item.sku} · {Object.values(item.options).filter(Boolean).join(" / ") || "Standard"}
                    </p>
                    <p className="text-[11px] text-muted">{formatINR(item.price)} × {item.qty}</p>
                  </div>
                  <p className="price-num text-[13px] font-semibold">{formatINR(item.price * item.qty)}</p>
                </li>
              ))}
            </ul>
            <div className="space-y-1.5 border-t border-border bg-surface/30 px-4 py-3 text-[12px]">
              <div className="flex justify-between text-muted"><span>Subtotal</span><span className="price-num">{formatINR(order.subtotal)}</span></div>
              <div className="flex justify-between text-muted"><span>Shipping</span><span className="price-num">{order.shipping === 0 ? "Free" : formatINR(order.shipping)}</span></div>
              <div className="flex justify-between text-muted"><span>Tax</span><span className="price-num">{formatINR(order.tax)}</span></div>
              {order.discount > 0 ? (
                <div className="flex justify-between text-success"><span>Discount</span><span className="price-num">−{formatINR(order.discount)}</span></div>
              ) : null}
              <div className="flex justify-between border-t border-border pt-1.5 text-[13px] font-semibold">
                <span>Total</span><span className="price-num">{formatINR(order.total)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-bg">
            <header className="border-b border-border bg-surface/60 px-4 py-3">
              <h2 className="text-sm font-semibold">Timeline</h2>
            </header>
            <ol className="px-4 py-4">
              {[...order.timeline].reverse().map((event, index) => (
                <li key={`${event.at}-${index}`} className="relative flex gap-3 pb-4 last:pb-0">
                  {index < order.timeline.length - 1 ? (
                    <span aria-hidden className="absolute left-[5px] top-3.5 h-full w-px bg-border" />
                  ) : null}
                  <span className="relative z-10 mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-primary bg-bg" />
                  <div>
                    <p className="text-[12px] font-medium capitalize">{event.status.replace(/-/g, " ")}</p>
                    <p className="text-[11px] text-muted">{event.note}</p>
                    <p className="text-[10px] text-muted/70">{formatDateTime(event.at)} · {event.by}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-border bg-bg p-4">
            <h2 className="text-sm font-semibold">Fulfilment</h2>
            <p className="mb-3 mt-0.5 text-[11px] text-muted">Actions update stock and the customer timeline.</p>
            <AdminOrderActions order={order} />
          </section>

          <section className="rounded-xl border border-border bg-bg p-4">
            <h2 className="text-sm font-semibold">Customer</h2>
            <div className="mt-2 space-y-1.5 text-[12px]">
              <p className="font-medium text-text">{order.customer?.name ?? order.shippingAddress.name}</p>
              <p className="flex items-center gap-1.5 text-muted"><Mail className="h-3.5 w-3.5" /> {order.customer?.email ?? "—"}</p>
              <p className="flex items-center gap-1.5 text-muted"><Phone className="h-3.5 w-3.5" /> {order.customer?.phone ?? order.shippingAddress.phone}</p>
              <p className="flex items-center gap-1.5 text-muted"><Copy className="h-3.5 w-3.5" /> {order.userId}</p>
            </div>
            <div className="mt-3 border-t border-border pt-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted">Ship to</h3>
              <div className="mt-1.5 flex gap-1.5 text-[12px] leading-5 text-muted">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <address className="not-italic">
                  <span className="font-medium text-text">{order.shippingAddress.name}</span><br />
                  {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}<br />
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}<br />
                  {order.shippingAddress.phone}
                </address>
              </div>
            </div>
            <p className="mt-3 rounded-md bg-surface px-2.5 py-1.5 text-[11px] text-muted">
              {order.deliveryMethod === "express" ? "Express delivery" : "Standard delivery"}
            </p>
          </section>

          <section className="rounded-xl border border-border bg-bg p-4">
            <h2 className="text-sm font-semibold">Payment</h2>
            <dl className="mt-2 space-y-1.5 text-[12px]">
              <div className="flex justify-between gap-2"><dt className="text-muted">Provider</dt><dd className="capitalize">{order.payment.provider}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted">Reference</dt><dd className="truncate font-mono text-[10px]">{order.payment.providerOrderId}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted">Amount</dt><dd className="price-num">{formatINR(order.payment.amount)}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted">Status</dt><dd><PaymentBadge status={order.payment.status} /></dd></div>
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
