import { getDb, persist } from "../lib/db.js";
import type { Order, OrderItem, Product, TimelineEvent, Variant } from "../types.js";
import { addMinutes, now } from "../lib/ids.js";
import { outOfStock } from "../lib/errors.js";
import { invalidateCatalog } from "../lib/cache.js";

export const RESERVATION_MINUTES = 15;

export function deliveryFee(subtotal: number, method: "standard" | "express"): number {
  const s = getDb().settings;
  if (method === "express") return s.expressFee;
  return subtotal >= s.freeShippingThreshold ? 0 : s.shippingFee;
}

export function nextOrderNumber(): string {
  const db = getDb();
  const used = new Set(db.orders.map((order) => order.orderNumber));
  let next = db.settings.orderCounter;
  do {
    next += 1;
  } while (used.has(`EC-${next}`));
  db.settings.orderCounter = next;
  return `EC-${next}`;
}

export function appendTimeline(order: Order, status: string, note: string, by: string): void {
  order.timeline.push({ status, note, at: now(), by });
  order.updatedAt = now();
}

export function findVariant(productId: string, sku: string): { product: Product; variant: Variant } | null {
  const product = getDb().products.find((p) => p.id === productId);
  const variant = product?.variants.find((v) => v.sku === sku);
  if (!product || !variant) return null;
  return { product, variant };
}

export function reserveStock(order: Order): void {
  for (const item of order.items) {
    const found = findVariant(item.productId, item.sku);
    if (!found) throw outOfStock(`${item.title} is no longer available`);
    const available = found.variant.stock - found.variant.reserved;
    if (available < item.qty) {
      throw outOfStock(`Only ${Math.max(available, 0)} left of ${item.title} (${item.options.size ?? ""})`);
    }
    found.variant.reserved += item.qty;
  }
}

export function releaseReservation(order: Order): void {
  for (const item of order.items) {
    const found = findVariant(item.productId, item.sku);
    if (!found) continue;
    found.variant.reserved = Math.max(0, found.variant.reserved - item.qty);
  }
  order.reservationExpiresAt = null;
  invalidateCatalog();
}

export function commitSale(order: Order, actor = "system"): void {
  const db = getDb();
  for (const item of order.items) {
    const found = findVariant(item.productId, item.sku);
    if (!found) continue;
    found.variant.stock = Math.max(0, found.variant.stock - item.qty);
    found.variant.reserved = Math.max(0, found.variant.reserved - item.qty);
    found.product.sold += item.qty;
    db.stockMovements.push({
      id: `mov_${order.orderNumber}_${item.sku}`,
      sku: item.sku,
      delta: -item.qty,
      reason: "sale",
      note: `Order ${order.orderNumber}`,
      actor,
      at: now(),
    });
  }
  invalidateCatalog();
}

export function restockOrder(order: Order, reason: "cancellation" | "correction" = "cancellation"): void {
  const db = getDb();
  for (const item of order.items) {
    const found = findVariant(item.productId, item.sku);
    if (!found) continue;
    found.variant.stock += item.qty;
    found.product.sold = Math.max(0, found.product.sold - item.qty);
    db.stockMovements.push({
      id: `mov_${order.id}_${item.sku}_${Date.now()}`,
      sku: item.sku,
      delta: item.qty,
      reason,
      note: `Order ${order.orderNumber} ${reason}`,
      actor: "system",
      at: now(),
    });
  }
  invalidateCatalog();
}

export function reservationDeadline(): string {
  return addMinutes(new Date(), RESERVATION_MINUTES);
}

export function toOrderItem(product: Product, variant: Variant, qty: number): OrderItem {
  return {
    productId: product.id,
    slug: product.slug,
    title: product.title,
    sku: variant.sku,
    options: variant.options,
    price: variant.price,
    qty,
    image: product.images[0]?.url ?? "",
  };
}

export function expiryJob(): void {
  const db = getDb();
  const nowMs = Date.now();
  for (const order of db.orders) {
    if (
      order.status === "pending" &&
      order.reservationExpiresAt &&
      new Date(order.reservationExpiresAt).getTime() < nowMs
    ) {
      releaseReservation(order);
      order.status = "cancelled";
      order.payment.status = "failed";
      appendTimeline(order, "cancelled", "Stock reservation expired before payment", "system");
      console.log(`[jobs] Released expired reservation for ${order.orderNumber}`);
      persist();
    }
  }
}
