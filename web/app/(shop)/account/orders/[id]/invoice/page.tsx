import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { serverApi } from "@/lib/api";
import { formatDate, formatINR } from "@/lib/format";
import type { Address, OrderItem } from "@/lib/types";
import { PrintButton } from "@/components/account/print-button";

export const metadata: Metadata = {
  title: "Invoice",
};

interface Invoice {
  number: string;
  date: string;
  billedTo: Address;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  gstin: string;
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await serverApi<{ invoice: Invoice }>(`/orders/${id}/invoice`).catch(() => null);
  if (!data) notFound();
  const invoice = data.invoice;

  return (
    <div className="container-shop py-8 md:py-12">
      <div className="no-print mx-auto mb-6 flex max-w-3xl items-center justify-between gap-3">
        <Link href={`/account/orders/${id}`} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-text">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to order
        </Link>
        <PrintButton />
      </div>

      <article className="print-full mx-auto max-w-3xl rounded-xl border border-border bg-bg p-6 sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-white">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="8.5" />
                  <ellipse cx="12" cy="12" rx="8.5" ry="3.4" transform="rotate(-28 12 12)" opacity="0.8" />
                  <circle cx="16.5" cy="7.4" r="1.5" fill="currentColor" stroke="none" />
                </svg>
              </span>
              <span className="text-xl font-semibold tracking-[-0.03em]">
                Shop<span className="text-primary">Sphere</span>
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">
              ShopSphere Retail Pvt Ltd
              <br />
              4th Floor, Indiranagar, Bengaluru 560038
              <br />
              GSTIN {invoice.gstin}
            </p>
          </div>
          <div className="text-right">
            <p className="eyebrow">Tax invoice</p>
            <p className="mt-1 text-lg font-semibold">{invoice.number}</p>
            <p className="mt-1 text-xs text-muted">Issued {formatDate(invoice.date, "long")}</p>
            <p className="mt-2 inline-flex rounded-md border border-success/30 bg-success/10 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-success">
              Paid
            </p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-border py-6 sm:grid-cols-2">
          <div>
            <p className="eyebrow">Billed to</p>
            <address className="mt-2 text-sm not-italic leading-6">
              <span className="font-medium">{invoice.billedTo.name}</span>
              <br />
              {invoice.billedTo.line1}
              {invoice.billedTo.line2 ? (
                <>
                  <br />
                  {invoice.billedTo.line2}
                </>
              ) : null}
              <br />
              {invoice.billedTo.city}, {invoice.billedTo.state} {invoice.billedTo.pincode}
              <br />
              {invoice.billedTo.phone}
            </address>
          </div>
          <div className="sm:text-right">
            <p className="eyebrow">Payment</p>
            <p className="mt-2 text-sm text-muted">Paid online · INR</p>
            <p className="mt-1 text-sm text-muted">{invoice.items.reduce((sum, item) => sum + item.qty, 0)} items</p>
          </div>
        </section>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="py-3 pr-2 font-medium">Item</th>
              <th className="py-3 pr-2 text-center font-medium">Qty</th>
              <th className="py-3 pr-2 text-right font-medium">Rate</th>
              <th className="py-3 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={`${item.productId}-${item.sku}`} className="border-b border-border/70 align-top">
                <td className="py-3 pr-2">
                  <p className="font-medium text-text">{item.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {item.sku}
                    {Object.values(item.options).filter(Boolean).length
                      ? ` · ${Object.values(item.options).filter(Boolean).join(" / ")}`
                      : ""}
                  </p>
                </td>
                <td className="py-3 pr-2 text-center text-muted">{item.qty}</td>
                <td className="price-num py-3 pr-2 text-right text-muted">{formatINR(item.price)}</td>
                <td className="price-num py-3 text-right font-medium">{formatINR(item.price * item.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto mt-5 max-w-xs space-y-2 text-sm">
          <div className="flex justify-between text-muted">
            <span>Subtotal</span>
            <span className="price-num">{formatINR(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Shipping</span>
            <span className="price-num">{invoice.shipping === 0 ? "Free" : formatINR(invoice.shipping)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>Tax (GST)</span>
            <span className="price-num">{formatINR(invoice.tax)}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <span>Total paid</span>
            <span className="price-num">{formatINR(invoice.total)}</span>
          </div>
        </div>

        <footer className="mt-10 border-t border-border pt-5 text-[11px] leading-5 text-muted">
          <p>
            This is a computer-generated invoice and does not require a signature. For assistance, write to{" "}
            <a href="mailto:help@shopsphere.in" className="text-primary hover:underline">help@shopsphere.in</a>.
          </p>
          <p className="mt-1">Prices are inclusive of GST where applicable. ShopSphere · shopsphere.in</p>
        </footer>
      </article>
    </div>
  );
}
