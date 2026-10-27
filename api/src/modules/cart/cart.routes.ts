import { Router } from "express";
import { z } from "zod";
import { getDb, persist } from "../../lib/db.js";
import { optionalAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { cartTotals, availableOf } from "../../lib/catalog.js";
import { badRequest, outOfStock } from "../../lib/errors.js";
import { env, isProd } from "../../config/env.js";
import { newId, now } from "../../lib/ids.js";
import { invalidateCatalog } from "../../lib/cache.js";

export const cartRouter = Router();

const guestCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProd,
  path: "/",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function resolveCart(req: Parameters<typeof optionalAuth>[0], res: Parameters<typeof optionalAuth>[1]) {
  const db = getDb();
  if (req.user) {
    let cart = db.carts.find((c) => c.userId === req.user!.id);
    if (!cart) {
      cart = { id: newId("cart"), userId: req.user.id, items: [], updatedAt: now() };
      db.carts.push(cart);
    }
    return cart;
  }
  let guestId = req.cookies?.[env.guestCookieName];
  if (!guestId) {
    guestId = newId("gst");
    res.cookie(env.guestCookieName, guestId, guestCookie);
  }
  req.guestId = guestId;
  let cart = db.carts.find((c) => c.guestId === guestId);
  if (!cart) {
    cart = { id: newId("cart"), guestId, items: [], updatedAt: now() };
    db.carts.push(cart);
  }
  return cart;
}

cartRouter.get("/", optionalAuth, (req, res) => {
  const cart = resolveCart(req, res);
  persist();
  res.json(cartTotals(cart));
});

const putSchema = z.object({
  productId: z.string().min(1),
  sku: z.string().min(1),
  qty: z.number().int().min(0).max(99),
});

cartRouter.put("/items", optionalAuth, validate(putSchema), (req, res, next) => {
  try {
    const cart = resolveCart(req, res);
    const { productId, sku, qty } = req.body;
    const db = getDb();
    const product = db.products.find((p) => p.id === productId && p.status === "active");
    const variant = product?.variants.find((v) => v.sku === sku);
    if (!product || !variant) throw badRequest("That product option is no longer available");

    if (qty === 0) {
      cart.items = cart.items.filter((item) => item.sku !== sku);
    } else {
      const available = availableOf(variant);
      if (qty > available) {
        throw outOfStock(
          available === 0
            ? "This option is out of stock"
            : `Only ${available} left in this option`
        );
      }
      const existing = cart.items.find((item) => item.sku === sku);
      if (existing) existing.qty = qty;
      else cart.items.push({ productId, sku, qty });
    }
    cart.updatedAt = now();
    invalidateCatalog();
    persist();
    res.json(cartTotals(cart));
  } catch (error) {
    next(error);
  }
});

cartRouter.delete("/items/:sku", optionalAuth, (req, res) => {
  const cart = resolveCart(req, res);
  cart.items = cart.items.filter((item) => item.sku !== req.params.sku);
  cart.updatedAt = now();
  persist();
  res.json(cartTotals(cart));
});

cartRouter.delete("/", optionalAuth, (req, res) => {
  const cart = resolveCart(req, res);
  cart.items = [];
  cart.updatedAt = now();
  persist();
  res.json(cartTotals(cart));
});

const mergeSchema = z.object({
  items: z
    .array(z.object({ productId: z.string(), sku: z.string(), qty: z.number().int().min(1).max(99) }))
    .optional()
    .default([]),
});

/** Merge a guest cart (or a browser-stored cart) into the signed-in user's cart. */
cartRouter.post("/merge", optionalAuth, validate(mergeSchema), (req, res, next) => {
  try {
    if (!req.user) throw badRequest("Sign in to merge your cart");
    const db = getDb();
    const userCart = resolveCart(req, res);
    const guestId = req.cookies?.[env.guestCookieName];
    const guestCart = guestId ? db.carts.find((c) => c.guestId === guestId) : undefined;
    const incoming = [...(guestCart?.items ?? []), ...req.body.items];

    for (const item of incoming) {
      const product = db.products.find((p) => p.id === item.productId && p.status === "active");
      const variant = product?.variants.find((v) => v.sku === item.sku);
      if (!product || !variant) continue;
      const available = availableOf(variant);
      const existing = userCart.items.find((i) => i.sku === item.sku);
      const nextQty = Math.min((existing?.qty ?? 0) + item.qty, available);
      if (nextQty <= 0) continue;
      if (existing) existing.qty = nextQty;
      else userCart.items.push({ productId: item.productId, sku: item.sku, qty: nextQty });
    }
    if (guestCart) guestCart.items = [];
    userCart.updatedAt = now();
    persist();
    res.json(cartTotals(userCart));
  } catch (error) {
    next(error);
  }
});
