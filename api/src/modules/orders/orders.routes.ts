import { Router } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { getDb, persist } from "../../lib/db.js";
import { appendTimeline, releaseReservation, restockOrder } from "../../lib/orders.js";
import { conflict, forbidden, notFound } from "../../lib/errors.js";
import { now } from "../../lib/ids.js";
import { invalidateCatalog } from "../../lib/cache.js";
import type { Order, OrderStatus } from "../../types.js";

export const ordersRouter = Router();
ordersRouter.use(authenticate);

const STATUS_RANK: Record<OrderStatus, number> = {
  pending: 0,
  paid: 1,
  packed: 2,
  shipped: 3,
  delivered: 4,
  cancelled: 5,
};

function decorate(order: Order, includeCustomer = false) {
  const db = getDb();
  const customer = db.users.find((u) => u.id === order.userId);
  const reviews = db.reviews.filter((r) => r.orderId === order.id && r.status !== "hidden");
  return {
    ...order,
    itemCount: order.items.reduce((sum, item) => sum + item.qty, 0),
    customer: includeCustomer
      ? customer
        ? { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone }
        : null
      : undefined,
    reviewedProductIds: reviews.map((r) => r.productId),
    canCancel: ["pending", "paid", "packed"].includes(order.status),
  };
}

ordersRouter.get("/", (req, res) => {
  const db = getDb();
  const isAdmin = req.user!.role === "admin";
  const status = typeof req.query.status === "string" && req.query.status !== "all" ? req.query.status : null;
  const q = typeof req.query.q === "string" ? req.query.q.toLowerCase() : null;
  const payment = typeof req.query.payment === "string" && req.query.payment !== "all" ? req.query.payment : null;
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 10)));

  let orders = db.orders.filter((o) => (isAdmin ? true : o.userId === req.user!.id));
  const counts = {
    all: orders.length,
    toPack: orders.filter((o) => o.status === "paid").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  if (status === "to-pack") orders = orders.filter((o) => o.status === "paid");
  else if (status) orders = orders.filter((o) => o.status === status);
  if (payment) orders = orders.filter((o) => o.payment.status === payment);
  if (q) {
    orders = orders.filter((order) => {
      const customer = db.users.find((u) => u.id === order.userId);
      return (
        order.orderNumber.toLowerCase().includes(q) ||
        order.items.some((i) => i.title.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)) ||
        (customer?.name.toLowerCase().includes(q) ?? false) ||
        (customer?.email.toLowerCase().includes(q) ?? false)
      );
    });
  }

  orders.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const total = orders.length;
  const pageItems = orders.slice((page - 1) * limit, page * limit).map((o) => decorate(o, isAdmin));

  res.json({
    data: pageItems,
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    counts,
  });
});

ordersRouter.get("/:id", (req, res, next) => {
  try {
    const order = getDb().orders.find((o) => o.id === req.params.id);
    if (!order) throw notFound("Order not found");
    if (order.userId !== req.user!.id && req.user!.role !== "admin") {
      // Never reveal that another customer's order exists.
      throw notFound("Order not found");
    }
    res.json({ order: decorate(order, req.user!.role === "admin") });
  } catch (error) {
    next(error);
  }
});

ordersRouter.post("/:id/cancel", (req, res, next) => {
  try {
    const db = getDb();
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) throw notFound("Order not found");
    if (order.userId !== req.user!.id && req.user!.role !== "admin") throw notFound("Order not found");
    if (!["pending", "paid", "packed"].includes(order.status)) {
      throw conflict("CANNOT_CANCEL", "Orders can only be cancelled before they ship");
    }
    if (order.status === "pending") releaseReservation(order);
    else restockOrder(order);
    order.status = "cancelled";
    if (order.payment.status === "paid") order.payment.status = "refunded";
    else order.payment.status = "failed";
    order.reservationExpiresAt = null;
    appendTimeline(order, "cancelled", req.body?.reason ? `Cancelled: ${req.body.reason}` : "Order cancelled", req.user!.email);
    invalidateCatalog();
    persist();
    res.json({ order: decorate(order, true) });
  } catch (error) {
    next(error);
  }
});

const statusSchema = z.object({
  status: z.enum(["packed", "shipped", "delivered", "cancelled"]),
  note: z.string().max(300).optional(),
  tracking: z
    .object({ carrier: z.string().min(1), awb: z.string().min(1), url: z.string().url().optional() })
    .optional(),
});

ordersRouter.patch("/:id/status", requireRole("admin"), validate(statusSchema), (req, res, next) => {
  try {
    const order = getDb().orders.find((o) => o.id === req.params.id);
    if (!order) throw notFound("Order not found");
    const nextStatus = req.body.status as OrderStatus;

    if (nextStatus === "cancelled") {
      if (order.status === "shipped" || order.status === "delivered") {
        throw conflict("CANNOT_CANCEL", "Shipped orders must be refunded instead of cancelled");
      }
      if (order.status === "pending") releaseReservation(order);
      else restockOrder(order);
      if (order.payment.status === "paid") order.payment.status = "refunded";
      order.status = "cancelled";
      order.reservationExpiresAt = null;
      appendTimeline(order, "cancelled", req.body.note ?? "Cancelled by admin", req.user!.email);
      invalidateCatalog();
      persist();
      return res.json({ order: decorate(order, true) });
    }

    if (STATUS_RANK[nextStatus] <= STATUS_RANK[order.status]) {
      throw conflict("INVALID_TRANSITION", `Order is already ${order.status}`);
    }
    if (order.status === "cancelled") throw conflict("INVALID_TRANSITION", "Cancelled orders cannot move forward");
    if (order.payment.status !== "paid") throw conflict("UNPAID", "Payment has not been captured for this order");

    order.status = nextStatus;
    if (req.body.tracking) order.tracking = req.body.tracking;
    if (nextStatus === "shipped" && !order.tracking) {
      throw conflict("TRACKING_REQUIRED", "Add a carrier and AWB before marking an order shipped");
    }
    appendTimeline(
      order,
      nextStatus,
      req.body.note ??
        (nextStatus === "packed"
          ? "Packed and ready to ship"
          : nextStatus === "shipped"
            ? `Shipped via ${order.tracking?.carrier} (AWB ${order.tracking?.awb})`
            : "Delivered to customer"),
      req.user!.email
    );
    console.log(`[mail] ${nextStatus} notification sent for ${order.orderNumber}`);
    persist();
    res.json({ order: decorate(order, true) });
  } catch (error) {
    next(error);
  }
});

const refundSchema = z.object({
  amount: z.number().int().positive().optional(),
  reason: z.string().min(3).max(300).default("Refund issued by admin"),
});

ordersRouter.post("/:id/refund", requireRole("admin"), validate(refundSchema), (req, res, next) => {
  try {
    const order = getDb().orders.find((o) => o.id === req.params.id);
    if (!order) throw notFound("Order not found");
    if (order.payment.status !== "paid") throw conflict("NOT_REFUNDABLE", "This payment is not in a refundable state");
    const amount = req.body.amount ?? order.total;
    if (amount > order.total) throw conflict("INVALID_AMOUNT", "Refund cannot exceed the order total");
    order.payment.status = "refunded";
    appendTimeline(
      order,
      "refund",
      `Refund of ₹${(amount / 100).toFixed(2)} issued — ${req.body.reason}`,
      req.user!.email
    );
    persist();
    res.json({ order: decorate(order, true) });
  } catch (error) {
    next(error);
  }
});

ordersRouter.get("/:id/invoice", (req, res, next) => {
  try {
    const order = getDb().orders.find((o) => o.id === req.params.id);
    if (!order) throw notFound("Order not found");
    if (order.userId !== req.user!.id && req.user!.role !== "admin") throw forbidden("Not your order");
    res.json({
      invoice: {
        number: `INV-${order.orderNumber}`,
        date: order.createdAt,
        billedTo: order.shippingAddress,
        items: order.items,
        subtotal: order.subtotal,
        shipping: order.shipping,
        tax: order.tax,
        total: order.total,
        gstin: "27AABCS1429B1ZX",
      },
    });
  } catch (error) {
    next(error);
  }
});
