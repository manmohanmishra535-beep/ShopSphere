import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { getDb, persist } from "../../lib/db.js";
import { cartTotals, getCartDocument } from "../../lib/catalog.js";
import { AppError, badRequest, notFound, outOfStock } from "../../lib/errors.js";
import { newId, now } from "../../lib/ids.js";
import { cache, invalidateCatalog } from "../../lib/cache.js";
import {
  commitSale,
  deliveryFee,
  nextOrderNumber,
  releaseReservation,
  reservationDeadline,
  reserveStock,
  toOrderItem,
} from "../../lib/orders.js";
import { getPaymentProvider, type PaymentIntent } from "../../lib/payments/index.js";
import type { Order } from "../../types.js";

export const checkoutRouter = Router();
checkoutRouter.use(authenticate);

const quoteSchema = z.object({
  addressId: z.string().optional(),
  deliveryMethod: z.enum(["standard", "express"]).default("standard"),
});

checkoutRouter.post("/quote", validate(quoteSchema), (req, res, next) => {
  try {
    const cart = getCartDocument(req.user!.id);
    const totals = cartTotals(cart);
    if (totals.count === 0) throw badRequest("Your cart is empty");
    const method = req.body.deliveryMethod as "standard" | "express";
    const shipping = deliveryFee(totals.subtotal, method);
    if (req.body.addressId && !req.user!.addresses.some((a) => a.id === req.body.addressId)) {
      throw notFound("Address not found");
    }
    res.json({
      items: totals.items,
      count: totals.count,
      subtotal: totals.subtotal,
      shipping,
      tax: totals.tax,
      discount: 0,
      total: totals.subtotal + shipping,
      deliveryMethod: method,
      reservationMinutes: 15,
    });
  } catch (error) {
    next(error);
  }
});

const sessionSchema = z.object({
  addressId: z.string().min(1, "Choose a delivery address"),
  deliveryMethod: z.enum(["standard", "express"]).default("standard"),
  paymentMethod: z.enum(["upi", "card", "netbanking", "wallet"]).default("upi"),
});

checkoutRouter.post("/session", validate(sessionSchema), async (req, res, next) => {
  try {
    const db = getDb();
    const user = req.user!;
    const idempotencyKey = req.headers["idempotency-key"];
    const cacheKey = typeof idempotencyKey === "string" ? `idem:${user.id}:${idempotencyKey}` : null;
    if (cacheKey) {
      const hit = await cache.get<{ order: Order }>(cacheKey);
      if (hit) return res.json({ ...hit, idempotentReplay: true });
    }

    const address = user.addresses.find((a) => a.id === req.body.addressId);
    if (!address) throw notFound("That delivery address was not found");

    const cart = getCartDocument(user.id);
    const totals = cartTotals(cart);
    if (!cart || cart.items.length === 0) throw badRequest("Your cart is empty");

    // Validate against live stock before reserving anything.
    for (const item of cart.items) {
      const product = db.products.find((p) => p.id === item.productId && p.status === "active");
      const variant = product?.variants.find((v) => v.sku === item.sku);
      if (!product || !variant) throw outOfStock("An item in your cart is no longer available");
      const available = variant.stock - variant.reserved;
      if (item.qty > available) {
        throw outOfStock(
          available <= 0
            ? `${product.title} is out of stock`
            : `Only ${available} left of ${product.title}`
        );
      }
    }

    const method = req.body.deliveryMethod as "standard" | "express";
    const shipping = deliveryFee(totals.subtotal, method);
    const order: Order = {
      id: newId("ord"),
      orderNumber: nextOrderNumber(),
      userId: user.id,
      items: cart.items.map((item) => {
        const product = db.products.find((p) => p.id === item.productId)!;
        const variant = product.variants.find((v) => v.sku === item.sku)!;
        return toOrderItem(product, variant, item.qty);
      }),
      shippingAddress: address,
      subtotal: totals.subtotal,
      shipping,
      tax: totals.tax,
      discount: 0,
      total: totals.subtotal + shipping,
      currency: "INR",
      status: "pending",
      deliveryMethod: method,
      payment: {
        provider: "pending",
        providerOrderId: "",
        status: "created",
        method: req.body.paymentMethod,
        amount: totals.subtotal + shipping,
      },
      timeline: [{ status: "pending", note: "Order placed, awaiting payment", at: now(), by: "customer" }],
      reservationExpiresAt: reservationDeadline(),
      createdAt: now(),
      updatedAt: now(),
    };

    // Hold stock locally, then create the provider intent. If the provider is
    // unreachable, release the hold so the customer can retry cleanly.
    reserveStock(order);
    const provider = getPaymentProvider();
    let intent: PaymentIntent;
    try {
      intent = await provider.createIntent(order);
    } catch (error) {
      releaseReservation(order);
      throw error;
    }

    if (intent.amount !== order.total || intent.currency !== "INR") {
      releaseReservation(order);
      throw new AppError(
        502,
        "PAYMENT_PROVIDER_ERROR",
        "The payment provider returned an unexpected amount"
      );
    }

    order.payment.provider = intent.provider;
    order.payment.providerOrderId = intent.providerOrderId;
    db.orders.unshift(order);
    invalidateCatalog();
    persist();

    const payload = {
      order,
      payment: intent,
      reservationExpiresAt: order.reservationExpiresAt,
    };
    if (cacheKey) await cache.set(cacheKey, payload, 24 * 60 * 60);
    res.status(201).json(payload);
  } catch (error) {
    next(error);
  }
});

const verifySchema = z.object({
  orderId: z.string().min(1),
  providerOrderId: z.string().min(1),
  method: z.enum(["upi", "card", "netbanking", "wallet"]).optional(),
  paymentId: z.string().min(1).optional(),
  signature: z.string().min(1).optional(),
});

/** Verify mock or Razorpay payment results, then commit the sale. */
export const paymentsRouter = Router();

paymentsRouter.post("/verify", authenticate, validate(verifySchema), async (req, res, next) => {
  try {
    const db = getDb();
    const order = db.orders.find((o) => o.id === req.body.orderId && o.userId === req.user!.id);
    if (!order) throw notFound("Order not found");
    if (order.payment.providerOrderId !== req.body.providerOrderId) {
      throw badRequest("Payment reference does not match this order");
    }
    if (order.payment.status === "paid") return res.json({ order, alreadyPaid: true });
    if (order.status === "cancelled") throw badRequest("This order was cancelled. Start a new checkout.");

    const provider = getPaymentProvider();
    const verified = await provider.verifyPayment({
      order,
      providerOrderId: req.body.providerOrderId,
      paymentId: req.body.paymentId,
      signature: req.body.signature,
      method: req.body.method,
    });

    commitSale(order, req.user!.email);
    order.payment.status = "paid";
    order.payment.paymentId = verified.paymentId;
    order.payment.method = verified.method;
    order.status = "paid";
    order.reservationExpiresAt = null;
    order.timeline.push({
      status: "paid",
      note: `Payment captured via ${verified.method.toUpperCase()}`,
      at: now(),
      by: "system",
    });
    order.updatedAt = now();

    const cart = db.carts.find((c) => c.userId === req.user!.id);
    if (cart) {
      cart.items = [];
      cart.updatedAt = now();
    }
    invalidateCatalog();
    persist();
    res.json({ order, redirectUrl: `/account/orders/${order.id}?placed=1` });
  } catch (error) {
    next(error);
  }
});

paymentsRouter.get("/:orderId", authenticate, (req, res, next) => {
  try {
    const order = getDb().orders.find((o) => o.id === req.params.orderId);
    if (!order || (order.userId !== req.user!.id && req.user!.role !== "admin")) {
      throw notFound("Order not found");
    }
    res.json({ payment: order.payment, orderNumber: order.orderNumber, reservationExpiresAt: order.reservationExpiresAt });
  } catch (error) {
    next(error);
  }
});

/** Provider webhook. Mock accepts `x-razorpay-signature: mock-signature`; Razorpay uses its HMAC. */
export const webhooksRouter = Router();

webhooksRouter.post("/razorpay", async (req, res, next) => {
  try {
    const provider = getPaymentProvider();
    const header = req.headers["x-razorpay-signature"];
    const signature = typeof header === "string" ? header : undefined;
    if (!provider.verifyWebhook(req.rawBody, signature)) {
      return res.status(400).json({ error: { code: "BAD_SIGNATURE", message: "Invalid webhook signature", details: [] } });
    }

    const event = provider.parseWebhook(req.body);
    if (!event) return res.json({ received: true });

    const dedupeKey = event.eventId ? `webhook:${event.eventId}` : null;
    if (dedupeKey && (await cache.get(dedupeKey))) return res.json({ received: true, duplicate: true });

    // Mock payloads omit the status. Razorpay only commits captured payments;
    // authorised payments are captured by the client verification path first.
    const payable = !event.status || event.status === "captured";
    if (event.providerOrderId && payable) {
      const order = getDb().orders.find((o) => o.payment.providerOrderId === event.providerOrderId);
      if (order && event.amount !== undefined && event.amount !== order.total) {
        return res.status(400).json({ error: { code: "AMOUNT_MISMATCH", message: "Webhook amount does not match order", details: [] } });
      }
      if (order && order.payment.status !== "paid" && order.status !== "cancelled") {
        commitSale(order, "webhook");
        order.payment.status = "paid";
        order.payment.paymentId = event.paymentId;
        if (event.method) order.payment.method = event.method;
        order.status = "paid";
        order.reservationExpiresAt = null;
        order.timeline.push({ status: "paid", note: "Payment captured (webhook)", at: now(), by: "webhook" });
        order.updatedAt = now();
        const cart = getDb().carts.find((c) => c.userId === order.userId);
        if (cart) cart.items = [];
        invalidateCatalog();
        persist();
      }
    }
    if (dedupeKey) await cache.set(dedupeKey, true, 7 * 24 * 60 * 60);
    res.json({ received: true });
  } catch (error) {
    next(error);
  }
});
