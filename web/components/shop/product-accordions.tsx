import { ChevronDown } from "lucide-react";
import type { Product } from "@/lib/types";

export function ProductAccordions({ product }: { product: Product }) {
  return (
    <div className="border-t border-border">
      <details open className="group border-b border-border py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[13px] font-medium [&::-webkit-details-marker]:hidden">
          Description
          <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="pt-3 text-[13px] leading-7 text-muted">
          <p>{product.description}</p>
          <p className="mt-3">
            Designed in our Mumbai studio and made in small batches. Every piece is checked by hand before it
            leaves us, and arrives in plastic-free packaging.
          </p>
        </div>
      </details>

      <details className="group border-b border-border py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[13px] font-medium [&::-webkit-details-marker]:hidden">
          Details &amp; care
          <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <dl className="grid gap-2 pt-3">
          {Object.entries(product.attributes).map(([key, value]) => (
            <div key={key} className="grid grid-cols-[110px_1fr] gap-3 text-[13px]">
              <dt className="text-muted">{key}</dt>
              <dd className="text-text">{value}</dd>
            </div>
          ))}
          <div className="grid grid-cols-[110px_1fr] gap-3 text-[13px]">
            <dt className="text-muted">SKU</dt>
            <dd className="text-text">{product.variants[0]?.sku}</dd>
          </div>
        </dl>
      </details>

      <details className="group border-b border-border py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[13px] font-medium [&::-webkit-details-marker]:hidden">
          Shipping &amp; returns
          <ChevronDown className="h-4 w-4 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-3 pt-3 text-[13px] leading-6 text-muted">
          <p>Free standard delivery on orders over ₹999. Orders under ₹999 ship at ₹49. Express delivery is ₹99 and arrives in 1–2 working days.</p>
          <p>Returns are free within 7 days of delivery, provided items are unworn with tags attached. Refunds are issued to the original payment method within 5 working days of pickup.</p>
          <p>Cash on delivery is available on orders up to ₹10,000 in most PIN codes.</p>
        </div>
      </details>
    </div>
  );
}
