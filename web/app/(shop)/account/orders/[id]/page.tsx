import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CircleDot,
  Clock3,
  CreditCard,
  FileText,
  MapPin,
  Package,
  Star,
  Truck,
  XCircle,
} from "lucide-react";
import { getOrder } from "@/lib/api";
import { formatDate, formatDateTime, formatINR } from "@/lib/format";
import { StatusBadge, PaymentBadge, Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { OrderCardActions } from "@/components/account/order-card-actions";
import { cn } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Order details",
};

const steps: { key: OrderStatus; label: string; copy: string }[] = [
  { key: "paid", label: "Confirmed", copy: "Payment received" },
  { key: "packed", label: "Packed", copy: "Prepared for dispatch" },
  { key: "shipped", label: "Shipped", copy: "On its way to you" },
  { key: "delivered", label: "Delivered", copy: "Enjoy your order" },
];

const rank: Record<OrderStatus, number> = {
  pending: 0,
  paid: 1,
  packed: 2,
  shipped: 3,
  delivered: 4,
  cancelled: 5,
};

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const { id } = await params;
  const { placed } = await searchParams;
  const order = await getOrder(id);
  if (!order) notFound();

  const cancelled = order.status === "cancelled";
  const currentRank = rank[order.status] ?? 0;
  const deliveredDate = order.timeline.find((event) => event.status === "delivered")?.at;
  const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div>
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All orders
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[24px] font-semibold tracking-[-0.03em]">{order.orderNumber}</h1>
            <StatusBadge status={order.status} />
            {order.payment.status !== order.status ? <PaymentBadge status={order.payment.status} /> : null}
          </div>
          <p className="mt-1.5 text-sm text-muted">
            Placed {formatDate(order.createdAt, "long")} · {itemCount} item{itemCount === 1 ? "" : "s"} · {formatINR(order.total)}
          </p>
        </div>
        <Link href={`/account/orders/${order.id}/invoice`} className={buttonStyles("outline", "sm")}>
          <FileText className="h-4 w-4" /> Invoice
        </Link>
      </header>

      {placed === "1" && !cancelled ? (
        <div className="mt-6 flex gap-3 rounded-xl border border-success/25 bg-success/5 p-4" role="status">
          <Check className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <div>
            <p className="text-sm font-semibold text-text">Thank you — your order is confirmed</p>
            <p className="mt-0.5 text-xs leading-5 text-muted">
              We&apos;ve emailed a receipt to you. You can follow every update on this page, and we&apos;ll notify you when it ships.
            </p>
          </div>
        </div>
      ) : null}

      {cancelled ? (
        <div className="mt-6 flex gap-3 rounded-xl border border-danger/25 bg-danger/5 p-4">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
          <div>
            <p className="text-sm font-semibold text-text">This order was cancelled</p>
            <p className="mt-0.5 text-xs leading-5 text-muted">
              {order.payment.status === "refunded"
                ? "Your refund has been initiated and should reach your original payment method within 3–5 working days."
                : "No payment was captured for this order. Any reserved stock has been released."}
            </p>
          </div>
        </div>
      ) : order.status === "pending" ? (
        <div className="mt-6 flex gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-semibold text-text">Payment not completed</p>
            <p className="mt-0.5 text-xs leading-5 text-muted">
              We&apos;re holding your items
              {order.reservationExpiresAt ? ` until ${formatDateTime(order.reservationExpiresAt)}` : ""}. Complete payment from
              checkout to confirm this order.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-border bg-bg p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-4">
            {steps.map((step, index) => {
              const done = currentRank >= rank[step.key];
              const active = order.status === step.key;
              return (
                <div key={step.key} className="relative flex flex-col items-start gap-2">
                  {index > 0 ? (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute right-[calc(50%+18px)] top-3.5 hidden h-0.5 w-[calc(100%-52px)] sm:block",
                        done ? "bg-primary" : "bg-border"
                      )}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "relative z-10 grid h-7 w-7 place-items-center rounded-full border-2",
                      done
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-bg text-muted"
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <CircleDot className="h-3 w-3" />}
                  </span>
                  <div>
                    <p className={cn("text-xs font-semibold", done ? "text-text" : "text-muted")}>
                      {step.label}
                      {active ? <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wide text-primary">Now</span> : null}
                    </p>
                    <p className="mt-0.5 text-[11px] leading-4 text-muted">
                      {step.key === "delivered" && deliveredDate ? formatDate(deliveredDate) : step.copy}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {order.tracking ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-info/25 bg-info/5 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-info/10 text-info">
              <Truck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-text">
                {order.tracking.carrier} · AWB {order.tracking.awb}
              </p>
              <p className="text-xs text-muted">Live tracking is available with the carrier.</p>
            </div>
          </div>
          {order.tracking.url ? (
            <a href={order.tracking.url} target="_blank" rel="noreferrer" className={buttonStyles("outline", "sm")}>
              Track shipment
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-xl border border-border">
            <header className="flex items-center justify-between border-b border-border bg-surface/60 px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Package className="h-4 w-4 text-muted" /> Items
              </h2>
              <span className="text-xs text-muted">{itemCount} total</span>
            </header>
            <ul className="divide-y divide-border">
              {order.items.map((item) => {
                const reviewed = order.reviewedProductIds.includes(item.productId);
                return (
                  <li key={`${item.productId}-${item.sku}`} className="flex gap-3 px-4 py-4">
                    <Link
                      href={`/products/${item.slug}`}
                      className="h-20 w-16 shrink-0 overflow-hidden rounded-md border border-border bg-surface"
                    >
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/products/${item.slug}`} className="line-clamp-2 text-sm font-medium text-text hover:text-primary">
                        {item.title}
                      </Link>
                      <p className="mt-1 text-xs text-muted">
                        {Object.entries(item.options)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(" · ") || "Standard"}
                      </p>
                      <p className="mt-1 text-xs text-muted">Qty {item.qty} · SKU {item.sku}</p>
                      {order.status === "delivered" ? (
                        reviewed ? (
                          <Badge tone="success" className="mt-2">Reviewed</Badge>
                        ) : (
                          <Link
                            href={`/products/${item.slug}#reviews`}
                            className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline"
                          >
                            <Star className="h-3.5 w-3.5" /> Write a review
                          </Link>
                        )
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="price-num text-sm font-semibold">{formatINR(item.price * item.qty)}</p>
                      <p className="mt-0.5 text-[11px] text-muted">{formatINR(item.price)} each</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-xl border border-border">
            <header className="border-b border-border bg-surface/60 px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Clock3 className="h-4 w-4 text-muted" /> Order activity
              </h2>
            </header>
            <ol className="px-4 py-4">
              {[...order.timeline].reverse().map((event, index) => (
                <li key={`${event.at}-${index}`} className="relative flex gap-3 pb-5 last:pb-0">
                  {index < order.timeline.length - 1 ? (
                    <span aria-hidden className="absolute left-[7px] top-4 h-full w-px bg-border" />
                  ) : null}
                  <span className="relative z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary bg-bg" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium capitalize text-text">{event.status.replace(/-/g, " ")}</p>
                    <p className="text-xs text-muted">{event.note}</p>
                    <p className="mt-0.5 text-[11px] text-muted/80">
                      {formatDateTime(event.at)} · {event.by}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border border-border p-4">
            <h2 className="text-sm font-semibold">Payment summary</h2>
            <dl className="mt-3 space-y-2 text-[13px]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Subtotal</dt>
                <dd className="price-num">{formatINR(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Shipping</dt>
                <dd className="price-num">{order.shipping === 0 ? "Free" : formatINR(order.shipping)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Tax</dt>
                <dd className="price-num">{formatINR(order.tax)}</dd>
              </div>
              {order.discount > 0 ? (
                <div className="flex justify-between gap-3 text-success">
                  <dt>Discount</dt>
                  <dd className="price-num">−{formatINR(order.discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between gap-3 border-t border-border pt-2 text-sm font-semibold">
                <dt>Total</dt>
                <dd className="price-num">{formatINR(order.total)}</dd>
              </div>
            </dl>
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs text-muted">
              <CreditCard className="h-3.5 w-3.5" />
              <span className="capitalize">{order.payment.method === "upi" ? "UPI" : order.payment.method?.replace("_", " ") ?? order.payment.provider}</span>
              <span className="ml-auto">·</span>
              <PaymentBadge status={order.payment.status} />
            </div>
          </section>

          <section className="rounded-xl border border-border p-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-muted" /> Delivery address
            </h2>
            <address className="mt-2 text-[13px] not-italic leading-6 text-muted">
              <span className="font-medium text-text">{order.shippingAddress.name}</span>
              <br />
              {order.shippingAddress.line1}
              {order.shippingAddress.line2 ? (
                <>
                  <br />
                  {order.shippingAddress.line2}
                </>
              ) : null}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
              <br />
              {order.shippingAddress.phone}
            </address>
            <p className="mt-2 text-xs text-muted">
              {order.deliveryMethod === "express" ? "Express delivery" : "Standard delivery"}
            </p>
          </section>

          <div className="rounded-xl border border-border p-4">
            <h2 className="text-sm font-semibold">Need to make a change?</h2>
            <p className="mt-1 text-xs leading-5 text-muted">
              Orders can be cancelled before they ship. After dispatch, start a return instead.
            </p>
            <div className="mt-3">
              <OrderCardActions order={order} />
            </div>
            <Link href="/info/returns" className="mt-3 inline-block text-xs font-medium text-primary hover:underline">
              Returns & exchanges
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
