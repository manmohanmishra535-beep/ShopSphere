import { Router } from "express";
import { getDb, persist } from "../../lib/db.js";
import { authenticate } from "../../middleware/auth.js";
import { toProductCard } from "../../lib/catalog.js";
import { newId } from "../../lib/ids.js";
import { notFound } from "../../lib/errors.js";

export const wishlistRouter = Router();

function getWishlist(userId: string) {
  const db = getDb();
  let wishlist = db.wishlists.find((w) => w.userId === userId);
  if (!wishlist) {
    wishlist = { id: newId("wl"), userId, productIds: [] };
    db.wishlists.push(wishlist);
  }
  return wishlist;
}

wishlistRouter.get("/", authenticate, (req, res) => {
  const wishlist = getWishlist(req.user!.id);
  const products = getDb()
    .products.filter((p) => wishlist.productIds.includes(p.id) && p.status !== "archived")
    .map(toProductCard);
  res.json({ ids: wishlist.productIds, data: products });
});

wishlistRouter.post("/:productId", authenticate, (req, res, next) => {
  try {
    const product = getDb().products.find((p) => p.id === req.params.productId);
    if (!product) throw notFound("Product not found");
    const wishlist = getWishlist(req.user!.id);
    if (!wishlist.productIds.includes(product.id)) wishlist.productIds.push(product.id);
    persist();
    res.status(201).json({ ids: wishlist.productIds });
  } catch (error) {
    next(error);
  }
});

wishlistRouter.delete("/:productId", authenticate, (req, res) => {
  const wishlist = getWishlist(req.user!.id);
  wishlist.productIds = wishlist.productIds.filter((id) => id !== req.params.productId);
  persist();
  res.json({ ids: wishlist.productIds });
});

wishlistRouter.delete("/", authenticate, (req, res) => {
  const wishlist = getWishlist(req.user!.id);
  wishlist.productIds = [];
  persist();
  res.json({ ids: [] });
});
